#include "leaderboard.h"
#include "db.h"
#include "game.h"

#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define MAX_JOGADORES 256
#define TOP_N         5

typedef struct {
    char  nome[64];
    float soma_tentativas;
    int   partidas_vencidas;
    float media;
} entrada_lb_t;

static int encontrar_rec(entrada_lb_t *lb, int n, int total, const char *nome)
{
    if (n >= total) return -1;
    if (strcmp(lb[n].nome, nome) == 0) return n;
    return encontrar_rec(lb, n + 1, total, nome);
}

static void ordenar_por_media(entrada_lb_t *lb, int n)
{
    for (int i = 0; i < n - 1; i++) {
        int min_idx = i;
        for (int j = i + 1; j < n; j++)
            if (lb[j].media < lb[min_idx].media) min_idx = j;
        if (min_idx != i) {
            entrada_lb_t tmp = lb[i];
            lb[i] = lb[min_idx];
            lb[min_idx] = tmp;
        }
    }
}

static const char *rating_da_media(float media)
{
    if (media <= 4.0f) return "Ghost";
    if (media <= 6.0f) return "Operativo";
    if (media <= 7.0f) return "Analista";
    return "Script Kiddie";
}

void leaderboard_exibir(void)
{
    int total = 0;
    sessao_t *lista = db_carregar_todas(&total);

    printf("\n");

    if (!lista || total == 0) {
        printf("  [INFO] Nenhuma sessao registrada ainda.\n\n");
        if (lista) free(lista);
        return;
    }

    entrada_lb_t lb[MAX_JOGADORES];
    memset(lb, 0, sizeof(lb));
    int n_jogadores = 0;

    for (int i = 0; i < total; i++) {
        if (!lista[i].venceu) continue;

        int idx = encontrar_rec(lb, 0, n_jogadores, lista[i].jogador);
        if (idx < 0) {
            if (n_jogadores >= MAX_JOGADORES) continue;
            idx = n_jogadores++;
            strncpy(lb[idx].nome, lista[i].jogador, sizeof(lb[idx].nome) - 1);
        }
        lb[idx].soma_tentativas += (float)lista[i].tentativas;
        lb[idx].partidas_vencidas++;
    }

    for (int i = 0; i < n_jogadores; i++) {
        lb[i].media = (lb[i].partidas_vencidas > 0)
                      ? lb[i].soma_tentativas / (float)lb[i].partidas_vencidas
                      : 999.0f;
    }

    ordenar_por_media(lb, n_jogadores);

    int exibir = n_jogadores < TOP_N ? n_jogadores : TOP_N;

    /* --- Tabela ASCII (sem Unicode) --- */
    printf("  +========+==================+========+=============+\n");
    printf("  |     TOP HACKERS -- PLACAR DE LIDERES             |\n");
    printf("  +======+==================+========+=============+\n");
    printf("  |  #   | Hacker           | Media  | Rating      |\n");
    printf("  +------+------------------+--------+-------------+\n");

    for (int i = 0; i < exibir; i++) {
        printf("  |  %-3d | %-16s | %-6.1f | %-11s |\n",
               i + 1,
               lb[i].nome,
               lb[i].media,
               rating_da_media(lb[i].media));
    }

    printf("  +------+------------------+--------+-------------+\n\n");

    free(lista);
}
