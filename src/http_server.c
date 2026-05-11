#include "http_server.h"
#include "game.h"
#include "db.h"

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>

#ifdef _WIN32
#include <winsock2.h>
#include <ws2tcpip.h>
#pragma comment(lib, "ws2_32.lib")
typedef SOCKET socket_t;
#define CLOSESOCKET closesocket
#else
#include <arpa/inet.h>
#include <netinet/in.h>
#include <sys/socket.h>
#include <unistd.h>
typedef int socket_t;
#define CLOSESOCKET close
#endif

#define REQ_BUF_SIZE 8192
#define RESP_BUF_SIZE 4096
#define MAX_API_SESSIONS 128

typedef struct {
    int in_use;
    char session_id[40];
    char player[64];
    char difficulty[16];
    int secret;
    int attempts;
    int max_attempts;
} api_session_t;

static api_session_t g_sessions[MAX_API_SESSIONS];
static unsigned long g_counter = 0;

static int init_network(void)
{
#ifdef _WIN32
    WSADATA wsa_data;
    if (WSAStartup(MAKEWORD(2, 2), &wsa_data) != 0) return -1;
#endif
    return 0;
}

static void shutdown_network(void)
{
#ifdef _WIN32
    WSACleanup();
#endif
}

static int max_attempts_from_id(const char *difficulty)
{
    if (strcmp(difficulty, "analyst") == 0) return 10;
    if (strcmp(difficulty, "operative") == 0) return 7;
    if (strcmp(difficulty, "ghost") == 0) return 5;
    return 0;
}

static void build_session_id(char out[40])
{
    unsigned long now = (unsigned long)time(NULL);
    g_counter++;
    snprintf(out, 40, "%08lx-%08lx", now, g_counter);
}

static int json_get_string(const char *body, const char *key, char *out, size_t out_size)
{
    char pattern[64];
    snprintf(pattern, sizeof(pattern), "\"%s\":\"", key);
    char *start = strstr((char *)body, pattern);
    if (!start) return 0;
    start += strlen(pattern);
    char *end = strchr(start, '"');
    if (!end) return 0;
    size_t len = (size_t)(end - start);
    if (len >= out_size) len = out_size - 1;
    memcpy(out, start, len);
    out[len] = '\0';
    return 1;
}

static int json_get_int(const char *body, const char *key, int *value)
{
    char pattern[64];
    snprintf(pattern, sizeof(pattern), "\"%s\":", key);
    char *start = strstr((char *)body, pattern);
    if (!start) return 0;
    start += strlen(pattern);
    *value = atoi(start);
    return 1;
}

static api_session_t *create_session(const char *player, const char *difficulty)
{
    for (int i = 0; i < MAX_API_SESSIONS; i++) {
        if (!g_sessions[i].in_use) {
            g_sessions[i].in_use = 1;
            build_session_id(g_sessions[i].session_id);
            strncpy(g_sessions[i].player, player, sizeof(g_sessions[i].player) - 1);
            g_sessions[i].player[sizeof(g_sessions[i].player) - 1] = '\0';
            strncpy(g_sessions[i].difficulty, difficulty, sizeof(g_sessions[i].difficulty) - 1);
            g_sessions[i].difficulty[sizeof(g_sessions[i].difficulty) - 1] = '\0';
            g_sessions[i].secret = (rand() % 100) + 1;
            g_sessions[i].attempts = 0;
            g_sessions[i].max_attempts = max_attempts_from_id(difficulty);
            return &g_sessions[i];
        }
    }
    return NULL;
}

static api_session_t *find_session(const char *session_id)
{
    for (int i = 0; i < MAX_API_SESSIONS; i++) {
        if (g_sessions[i].in_use && strcmp(g_sessions[i].session_id, session_id) == 0) {
            return &g_sessions[i];
        }
    }
    return NULL;
}

/* ------------------------------------------------------------------ */
/*  Multiplayer (salas) + persistencia web em data/sessions.json       */
/* ------------------------------------------------------------------ */

#define MAX_MP_ROOMS 24
#define ROOM_CODE_LEN 8

typedef struct {
    int in_use;
    char room_id[ROOM_CODE_LEN];
    char host[64];
    char guest[64];
    int has_guest;
    char difficulty[16];
    int secret;
    int max_attempts;
    int max_total_guesses;
    int total_guesses;
    int turn; /* 0 = host, 1 = guest */
    int finished;
    char winner[64];
    int attempts_host;
    int attempts_guest;
    int last_guess;
    char last_hint[12];
} mp_room_t;

static mp_room_t g_rooms[MAX_MP_ROOMS];

static const char *slug_to_dificuldade_label(const char *slug)
{
    if (strcmp(slug, "analyst") == 0) return "Analista";
    if (strcmp(slug, "operative") == 0) return "Operativo";
    if (strcmp(slug, "ghost") == 0) return "Ghost";
    return "Script Kiddie";
}

static void mp_build_room_code(char out[ROOM_CODE_LEN])
{
    for (int tries = 0; tries < 50; tries++) {
        unsigned r = (unsigned)(rand() & 0xffffff);
        snprintf(out, ROOM_CODE_LEN, "%06X", r % 0x1000000);
        int dup = 0;
        for (int i = 0; i < MAX_MP_ROOMS; i++) {
            if (g_rooms[i].in_use && strcmp(g_rooms[i].room_id, out) == 0) {
                dup = 1;
                break;
            }
        }
        if (!dup) return;
    }
    snprintf(out, ROOM_CODE_LEN, "%06lX", (unsigned long)time(NULL) & 0xffffff);
}

static mp_room_t *mp_find_room(const char *room_id)
{
    for (int i = 0; i < MAX_MP_ROOMS; i++) {
        if (g_rooms[i].in_use && strcmp(g_rooms[i].room_id, room_id) == 0) return &g_rooms[i];
    }
    return NULL;
}

static mp_room_t *mp_create_room(const char *host, const char *difficulty)
{
    for (int i = 0; i < MAX_MP_ROOMS; i++) {
        if (!g_rooms[i].in_use) {
            mp_room_t *r = &g_rooms[i];
            memset(r, 0, sizeof(*r));
            r->in_use = 1;
            mp_build_room_code(r->room_id);
            strncpy(r->host, host, sizeof(r->host) - 1);
            strncpy(r->difficulty, difficulty, sizeof(r->difficulty) - 1);
            r->secret = (rand() % 100) + 1;
            r->max_attempts = max_attempts_from_id(difficulty);
            if (r->max_attempts > 0) r->max_total_guesses = r->max_attempts * 2;
            else r->max_total_guesses = 40;
            r->turn = 0;
            strncpy(r->last_hint, "none", sizeof(r->last_hint) - 1);
            return r;
        }
    }
    return NULL;
}

static int json_get_bool(const char *body, const char *key, int *out)
{
    char pattern[64];
    snprintf(pattern, sizeof(pattern), "\"%s\":", key);
    char *start = strstr((char *)body, pattern);
    if (!start) return 0;
    start += strlen(pattern);
    while (*start == ' ' || *start == '\t') start++;
    if (strncmp(start, "true", 4) == 0) {
        *out = 1;
        return 1;
    }
    if (strncmp(start, "false", 5) == 0) {
        *out = 0;
        return 1;
    }
    return 0;
}

static void mp_save_result_sessions(mp_room_t *room)
{
    sessao_t s;
    memset(&s, 0, sizeof(s));
    const char *label = slug_to_dificuldade_label(room->difficulty);

    if (room->winner[0] != '\0') {
        memset(&s, 0, sizeof(s));
        strncpy(s.jogador, room->winner, sizeof(s.jogador) - 1);
        strncpy(s.dificuldade, label, sizeof(s.dificuldade) - 1);
        s.segredo = room->secret;
        s.venceu = 1;
        if (strcmp(room->winner, room->host) == 0) s.tentativas = room->attempts_host;
        else s.tentativas = room->attempts_guest;
        strncpy(s.rating, calcular_rating(s.tentativas, 1), sizeof(s.rating) - 1);
        sessao_definir_timestamp(&s);
        db_salvar_sessao(&s);
        return;
    }

    /* Empate / esgotou tentativas da sala */
    memset(&s, 0, sizeof(s));
    strncpy(s.jogador, room->host, sizeof(s.jogador) - 1);
    strncpy(s.dificuldade, label, sizeof(s.dificuldade) - 1);
    s.segredo = room->secret;
    s.tentativas = room->attempts_host;
    s.venceu = 0;
    strncpy(s.rating, calcular_rating(s.tentativas, 0), sizeof(s.rating) - 1);
    sessao_definir_timestamp(&s);
    db_salvar_sessao(&s);

    memset(&s, 0, sizeof(s));
    strncpy(s.jogador, room->guest, sizeof(s.jogador) - 1);
    strncpy(s.dificuldade, label, sizeof(s.dificuldade) - 1);
    s.segredo = room->secret;
    s.tentativas = room->attempts_guest;
    s.venceu = 0;
    strncpy(s.rating, calcular_rating(s.tentativas, 0), sizeof(s.rating) - 1);
    sessao_definir_timestamp(&s);
    db_salvar_sessao(&s);
}

static void send_json(socket_t client, int status, const char *body)
{
    const char *status_text = "OK";
    if (status == 400) status_text = "Bad Request";
    if (status == 404) status_text = "Not Found";
    if (status == 500) status_text = "Internal Server Error";
    if (status == 405) status_text = "Method Not Allowed";
    if (status == 204) status_text = "No Content";

    char header[RESP_BUF_SIZE];
    int body_len = (int)strlen(body);
    int header_len = snprintf(
        header,
        sizeof(header),
        "HTTP/1.1 %d %s\r\n"
        "Content-Type: application/json\r\n"
        "Access-Control-Allow-Origin: *\r\n"
        "Access-Control-Allow-Methods: GET, POST, OPTIONS\r\n"
        "Access-Control-Allow-Headers: Content-Type\r\n"
        "Content-Length: %d\r\n"
        "Connection: close\r\n\r\n",
        status,
        status_text,
        body_len
    );

    send(client, header, header_len, 0);
    if (body_len > 0) send(client, body, body_len, 0);
}

static void handle_start_game(socket_t client, const char *body)
{
    char player[64] = {0};
    char difficulty[16] = {0};

    if (!json_get_string(body, "player", player, sizeof(player))) {
        strncpy(player, "Anonimo", sizeof(player) - 1);
    }
    if (!json_get_string(body, "difficulty", difficulty, sizeof(difficulty))) {
        strncpy(difficulty, "operative", sizeof(difficulty) - 1);
    }

    api_session_t *session = create_session(player, difficulty);
    if (!session) {
        send_json(client, 500, "{\"error\":\"session_limit\"}");
        return;
    }

    char resp[512];
    snprintf(
        resp,
        sizeof(resp),
        "{\"sessionId\":\"%s\",\"maxAttempts\":%d}",
        session->session_id,
        session->max_attempts
    );
    send_json(client, 200, resp);
}

static void handle_guess(socket_t client, const char *body)
{
    char session_id[40] = {0};
    int guess = 0;

    if (!json_get_string(body, "sessionId", session_id, sizeof(session_id)) || !json_get_int(body, "guess", &guess)) {
        send_json(client, 400, "{\"error\":\"invalid_payload\"}");
        return;
    }

    api_session_t *session = find_session(session_id);
    if (!session) {
        send_json(client, 404, "{\"error\":\"session_not_found\"}");
        return;
    }

    if (guess < 1 || guess > 100) {
        send_json(client, 400, "{\"error\":\"invalid_guess\"}");
        return;
    }

    session->attempts++;

    if (guess == session->secret) {
        char resp[512];
        const char *rating = calcular_rating(session->attempts, 1);
        snprintf(
            resp,
            sizeof(resp),
            "{\"attempts\":%d,\"won\":true,\"finished\":true,\"hint\":\"correct\",\"secret\":%d,\"rating\":\"%s\"}",
            session->attempts,
            session->secret,
            rating
        );
        send_json(client, 200, resp);
        return;
    }

    int finished = 0;
    if (session->max_attempts > 0 && session->attempts >= session->max_attempts) {
        finished = 1;
    }

    char resp[512];
    if (finished) {
        const char *rating = calcular_rating(session->attempts, 0);
        snprintf(
            resp,
            sizeof(resp),
            "{\"attempts\":%d,\"won\":false,\"finished\":true,\"hint\":\"%s\",\"secret\":%d,\"rating\":\"%s\"}",
            session->attempts,
            guess > session->secret ? "lower" : "higher",
            session->secret,
            rating
        );
    } else {
        snprintf(
            resp,
            sizeof(resp),
            "{\"attempts\":%d,\"won\":false,\"finished\":false,\"hint\":\"%s\"}",
            session->attempts,
            guess > session->secret ? "lower" : "higher"
        );
    }
    send_json(client, 200, resp);
}

static void extract_query_room_id(const char *path, char *out, size_t out_size)
{
    out[0] = '\0';
    const char *q = strstr(path, "roomId=");
    if (!q) return;
    q += 7;
    size_t i = 0;
    while (*q && *q != ' ' && *q != '&' && i + 1 < out_size) out[i++] = *q++;
    out[i] = '\0';
}

static void handle_session_save(socket_t client, const char *body)
{
    sessao_t s;
    memset(&s, 0, sizeof(s));

    if (!json_get_string(body, "jogador", s.jogador, sizeof(s.jogador)) ||
        !json_get_string(body, "dificuldade", s.dificuldade, sizeof(s.dificuldade))) {
        send_json(client, 400, "{\"error\":\"invalid_payload\"}");
        return;
    }
    if (!json_get_int(body, "segredo", &s.segredo) || !json_get_int(body, "tentativas", &s.tentativas)) {
        send_json(client, 400, "{\"error\":\"invalid_payload\"}");
        return;
    }
    int v = 0;
    if (!json_get_bool(body, "venceu", &v)) {
        send_json(client, 400, "{\"error\":\"invalid_payload\"}");
        return;
    }
    s.venceu = v;
    if (!json_get_string(body, "rating", s.rating, sizeof(s.rating))) {
        strncpy(s.rating, calcular_rating(s.tentativas, s.venceu), sizeof(s.rating) - 1);
    }
    if (!json_get_string(body, "timestamp", s.timestamp, sizeof(s.timestamp))) {
        sessao_definir_timestamp(&s);
    }

    db_salvar_sessao(&s);
    send_json(client, 200, "{\"ok\":true}");
}

static void handle_room_create(socket_t client, const char *body)
{
    char host[64] = {0};
    char difficulty[16] = {0};
    if (!json_get_string(body, "host", host, sizeof(host))) {
        strncpy(host, "Anonimo", sizeof(host) - 1);
    }
    if (!json_get_string(body, "difficulty", difficulty, sizeof(difficulty))) {
        strncpy(difficulty, "operative", sizeof(difficulty) - 1);
    }

    mp_room_t *r = mp_create_room(host, difficulty);
    if (!r) {
        send_json(client, 500, "{\"error\":\"room_limit\"}");
        return;
    }

    char resp[256];
    snprintf(
        resp,
        sizeof(resp),
        "{\"roomId\":\"%s\",\"maxTotalGuesses\":%d,\"maxAttempts\":%d}",
        r->room_id,
        r->max_total_guesses,
        r->max_attempts
    );
    send_json(client, 200, resp);
}

static void handle_room_join(socket_t client, const char *body)
{
    char room_id[ROOM_CODE_LEN] = {0};
    char guest[64] = {0};
    if (!json_get_string(body, "roomId", room_id, sizeof(room_id)) || !json_get_string(body, "guest", guest, sizeof(guest))) {
        send_json(client, 400, "{\"error\":\"invalid_payload\"}");
        return;
    }

    mp_room_t *r = mp_find_room(room_id);
    if (!r) {
        send_json(client, 404, "{\"error\":\"room_not_found\"}");
        return;
    }
    if (r->has_guest) {
        send_json(client, 409, "{\"error\":\"room_full\"}");
        return;
    }
    if (strcmp(guest, r->host) == 0) {
        send_json(client, 400, "{\"error\":\"same_as_host\"}");
        return;
    }

    strncpy(r->guest, guest, sizeof(r->guest) - 1);
    r->has_guest = 1;
    r->turn = 0;
    char resp[320];
    snprintf(resp, sizeof(resp), "{\"ok\":true,\"host\":\"%s\"}", r->host);
    send_json(client, 200, resp);
}

static void handle_room_state_get(socket_t client, const char *path)
{
    char room_id[ROOM_CODE_LEN] = {0};
    extract_query_room_id(path, room_id, sizeof(room_id));
    if (room_id[0] == '\0') {
        send_json(client, 400, "{\"error\":\"missing_roomId\"}");
        return;
    }

    mp_room_t *r = mp_find_room(room_id);
    if (!r) {
        send_json(client, 404, "{\"error\":\"room_not_found\"}");
        return;
    }

    const char *turn_name = "host";
    if (r->turn == 1) turn_name = "guest";
    if (!r->has_guest) turn_name = "waiting";

    char resp[768];
    if (r->finished) {
        snprintf(
            resp,
            sizeof(resp),
            "{\"roomId\":\"%s\",\"difficulty\":\"%s\",\"host\":\"%s\",\"guest\":\"%s\",\"guestJoined\":%s,"
            "\"finished\":true,\"turn\":\"%s\",\"lastGuess\":%d,\"lastHint\":\"%s\","
            "\"totalGuesses\":%d,\"maxTotalGuesses\":%d,\"winner\":\"%s\",\"secret\":%d,"
            "\"attemptsHost\":%d,\"attemptsGuest\":%d}",
            r->room_id,
            r->difficulty,
            r->host,
            r->guest,
            r->has_guest ? "true" : "false",
            turn_name,
            r->last_guess,
            r->last_hint,
            r->total_guesses,
            r->max_total_guesses,
            r->winner,
            r->secret,
            r->attempts_host,
            r->attempts_guest
        );
    } else {
        snprintf(
            resp,
            sizeof(resp),
            "{\"roomId\":\"%s\",\"difficulty\":\"%s\",\"host\":\"%s\",\"guest\":\"%s\",\"guestJoined\":%s,"
            "\"finished\":false,\"turn\":\"%s\",\"lastGuess\":%d,\"lastHint\":\"%s\","
            "\"totalGuesses\":%d,\"maxTotalGuesses\":%d,\"winner\":\"%s\",\"secret\":null,"
            "\"attemptsHost\":%d,\"attemptsGuest\":%d}",
            r->room_id,
            r->difficulty,
            r->host,
            r->guest,
            r->has_guest ? "true" : "false",
            turn_name,
            r->last_guess,
            r->last_hint,
            r->total_guesses,
            r->max_total_guesses,
            r->winner,
            r->attempts_host,
            r->attempts_guest
        );
    }
    send_json(client, 200, resp);
}

static void handle_room_guess(socket_t client, const char *body)
{
    char room_id[ROOM_CODE_LEN] = {0};
    char player[64] = {0};
    int guess = 0;

    if (!json_get_string(body, "roomId", room_id, sizeof(room_id)) ||
        !json_get_string(body, "player", player, sizeof(player)) ||
        !json_get_int(body, "guess", &guess)) {
        send_json(client, 400, "{\"error\":\"invalid_payload\"}");
        return;
    }

    mp_room_t *r = mp_find_room(room_id);
    if (!r) {
        send_json(client, 404, "{\"error\":\"room_not_found\"}");
        return;
    }
    if (!r->has_guest) {
        send_json(client, 400, "{\"error\":\"waiting_guest\"}");
        return;
    }
    if (r->finished) {
        send_json(client, 400, "{\"error\":\"room_finished\"}");
        return;
    }

    int is_host = (strcmp(player, r->host) == 0);
    int is_guest = (strcmp(player, r->guest) == 0);
    if (!is_host && !is_guest) {
        send_json(client, 403, "{\"error\":\"unknown_player\"}");
        return;
    }
    int want_turn = is_host ? 0 : 1;
    if (r->turn != want_turn) {
        send_json(client, 403, "{\"error\":\"wrong_turn\"}");
        return;
    }

    if (guess < 1 || guess > 100) {
        send_json(client, 400, "{\"error\":\"invalid_guess\"}");
        return;
    }

    r->total_guesses++;
    if (is_host) r->attempts_host++;
    else r->attempts_guest++;

    r->last_guess = guess;

    if (guess == r->secret) {
        strncpy(r->last_hint, "correct", sizeof(r->last_hint) - 1);
        r->finished = 1;
        strncpy(r->winner, player, sizeof(r->winner) - 1);
        mp_save_result_sessions(r);
        char resp[384];
        snprintf(
            resp,
            sizeof(resp),
            "{\"ok\":true,\"finished\":true,\"won\":true,\"hint\":\"correct\",\"secret\":%d,\"winner\":\"%s\","
            "\"attemptsHost\":%d,\"attemptsGuest\":%d}",
            r->secret,
            r->winner,
            r->attempts_host,
            r->attempts_guest
        );
        send_json(client, 200, resp);
        return;
    }

    if (guess > r->secret) strncpy(r->last_hint, "lower", sizeof(r->last_hint) - 1);
    else strncpy(r->last_hint, "higher", sizeof(r->last_hint) - 1);

    if (r->total_guesses >= r->max_total_guesses) {
        r->finished = 1;
        r->winner[0] = '\0';
        mp_save_result_sessions(r);
        char resp[384];
        snprintf(
            resp,
            sizeof(resp),
            "{\"ok\":true,\"finished\":true,\"won\":false,\"hint\":\"%s\",\"secret\":%d,"
            "\"winner\":\"\",\"attemptsHost\":%d,\"attemptsGuest\":%d}",
            r->last_hint,
            r->secret,
            r->attempts_host,
            r->attempts_guest
        );
        send_json(client, 200, resp);
        return;
    }

    r->turn = (r->turn == 0) ? 1 : 0;
    char resp[320];
    snprintf(
        resp,
        sizeof(resp),
        "{\"ok\":true,\"finished\":false,\"hint\":\"%s\",\"turn\":\"%s\",\"totalGuesses\":%d,"
        "\"attemptsHost\":%d,\"attemptsGuest\":%d}",
        r->last_hint,
        r->turn == 0 ? "host" : "guest",
        r->total_guesses,
        r->attempts_host,
        r->attempts_guest
    );
    send_json(client, 200, resp);
}

static void handle_request(socket_t client, const char *request)
{
    char method[16] = {0};
    char path[256] = {0};
    sscanf(request, "%15s %255s", method, path);

    const char *body = strstr(request, "\r\n\r\n");
    body = body ? body + 4 : "";

    if (strcmp(method, "OPTIONS") == 0) {
        send_json(client, 204, "");
        return;
    }

    if (strcmp(method, "GET") == 0 && strcmp(path, "/health") == 0) {
        send_json(client, 200, "{\"ok\":true}");
        return;
    }

    if (strcmp(method, "GET") == 0 && strncmp(path, "/api/room/state", 15) == 0) {
        handle_room_state_get(client, path);
        return;
    }

    if (strcmp(method, "POST") != 0) {
        send_json(client, 405, "{\"error\":\"method_not_allowed\"}");
        return;
    }

    if (strcmp(path, "/api/game/start") == 0) {
        handle_start_game(client, body);
        return;
    }
    if (strcmp(path, "/api/game/guess") == 0) {
        handle_guess(client, body);
        return;
    }
    if (strcmp(path, "/api/session/save") == 0) {
        handle_session_save(client, body);
        return;
    }
    if (strcmp(path, "/api/room/create") == 0) {
        handle_room_create(client, body);
        return;
    }
    if (strcmp(path, "/api/room/join") == 0) {
        handle_room_join(client, body);
        return;
    }
    if (strcmp(path, "/api/room/guess") == 0) {
        handle_room_guess(client, body);
        return;
    }

    send_json(client, 404, "{\"error\":\"not_found\"}");
}

int http_server_run(int port)
{
    if (init_network() != 0) {
        fprintf(stderr, "[API] Falha ao inicializar rede.\n");
        return 1;
    }

    srand((unsigned int)time(NULL));
    memset(g_sessions, 0, sizeof(g_sessions));

    socket_t server_fd = socket(AF_INET, SOCK_STREAM, 0);
    if (server_fd < 0) {
        fprintf(stderr, "[API] Falha ao criar socket.\n");
        shutdown_network();
        return 1;
    }

    struct sockaddr_in addr;
    memset(&addr, 0, sizeof(addr));
    addr.sin_family = AF_INET;
    addr.sin_addr.s_addr = INADDR_ANY;
    addr.sin_port = htons((unsigned short)port);

    if (bind(server_fd, (struct sockaddr *)&addr, sizeof(addr)) < 0) {
        fprintf(stderr, "[API] Falha no bind da porta %d.\n", port);
        CLOSESOCKET(server_fd);
        shutdown_network();
        return 1;
    }

    if (listen(server_fd, 16) < 0) {
        fprintf(stderr, "[API] Falha no listen.\n");
        CLOSESOCKET(server_fd);
        shutdown_network();
        return 1;
    }

    printf("[API] Terminal Breach API ouvindo em http://localhost:%d\n", port);
    printf("[API] Endpoints: GET /health, POST /api/game/{start,guess}, POST /api/session/save,\n");
    printf("[API]           POST /api/room/{create,join,guess}, GET /api/room/state?roomId=...\n");

    while (1) {
        socket_t client = accept(server_fd, NULL, NULL);
        if (client < 0) continue;

        char req_buf[REQ_BUF_SIZE];
        int received = (int)recv(client, req_buf, sizeof(req_buf) - 1, 0);
        if (received > 0) {
            req_buf[received] = '\0';
            handle_request(client, req_buf);
        }

        CLOSESOCKET(client);
    }

    CLOSESOCKET(server_fd);
    shutdown_network();
    return 0;
}
