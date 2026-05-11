#include "http_server.h"
#include "game.h"

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

static void handle_request(socket_t client, const char *request)
{
    char method[16] = {0};
    char path[128] = {0};
    sscanf(request, "%15s %127s", method, path);

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
    printf("[API] Endpoints: GET /health, POST /api/game/start, POST /api/game/guess\n");

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
