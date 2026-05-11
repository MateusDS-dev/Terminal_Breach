#include "stats.h"
#include "db.h"
#include "game.h"

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <math.h>

/* ------------------------------------------------------------------ */
/*  Funções recursivas de estatística (sem laços — exigência do PIF)   */
/* ------------------------------------------------------------------ */

static float soma_rec(sessao_t *s, int n)
{
    if (n <= 0) return 0.0f;
    return (float)s[n - 1].tentativas + soma_rec(s, n - 1);
}

float media_rec(sessao_t *s, int n)
{
    if (n <= 0) return 0.0f;
    return soma_rec(s, n) / (float)n;
}

static float soma_desvios_rec(sessao_t *s, int n, float media)
{
    if (n <= 0) return 0.0f;
    float d = (float)s[n - 1].tentativas - media;
    return d * d + soma_desvios_rec(s, n - 1, media);
}

float variancia_rec(sessao_t *s, int n, float media)
{
    if (n <= 1) return 0.0f;
    return soma_desvios_rec(s, n, media) / (float)n;
}

/* ------------------------------------------------------------------ */
/*  Buscas recursivas de melhor / pior sessão                           */
/* ------------------------------------------------------------------ */

static int idx_melhor_rec(sessao_t *s, int n, int melhor)
{
    if (n <= 0) return melhor;
    int i = n - 1;
    if (s[i].venceu && (melhor < 0 || s[i].tentativas < s[melhor].tentativas))
        melhor = i;
    return idx_melhor_rec(s, n - 1, melhor);
}

static int idx_pior_rec(sessao_t *s, int n, int pior)
{
    if (n <= 0) return pior;
    int i = n - 1;
    if (!s[i].venceu && (pior < 0 || s[i].tentativas > s[pior].tentativas))
        pior = i;
    return idx_pior_rec(s, n - 1, pior);
}

static int contar_vitorias_rec(sessao_t *s, int n)
{
    if (n <= 0) return 0;
    return s[n - 1].venceu + contar_vitorias_rec(s, n - 1);
}

/* ------------------------------------------------------------------ */
/*  Histograma ASCII de frequência de tentativas                        */
/*  (Screen 4 do protótipo — "Frequência de Tentativas")               */
/* ------------------------------------------------------------------ */
#define MAX_TENT_HIST 15   /* exibe de 1 a MAX_TENT_HIST tentativas    */
#define BARRA_MAX     30   /* largura máxima da barra em caracteres    */

static void exibir_histograma(sessao_t *lista, int total)
{
    /* Conta frequência de cada quantidade de tentativas */
    int freq[MAX_TENT_HIST + 1];
    memset(freq, 0, sizeof(freq));
    int maior_freq = 1;

    for (int i = 0; i < total; i++) {
        int t = lista[i].tentativas;
        if (t >= 1 && t <= MAX_TENT_HIST) {
            freq[t]++;
            if (freq[t] > maior_freq) maior_freq = freq[t];
        }
    }

    printf("\n  [ FREQUENCIA DE TENTATIVAS ]\n");
    printf("  %s\n", "-----------------------------------------------");

    for (int t = 1; t <= MAX_TENT_HIST; t++) {
        /* Tamanho da barra proporcional ao máximo */
        int barra = (freq[t] * BARRA_MAX) / maior_freq;
        printf("  %2d tent. |", t);
        for (int b = 0; b < barra; b++) printf("#");
        /* Preenche resto com espaços para alinhar o contador */
        for (int b = barra; b < BARRA_MAX; b++) printf(" ");
        printf("| %d\n", freq[t]);
    }
    printf("  %s\n", "-----------------------------------------------");
}

/* ------------------------------------------------------------------ */
/*  stats_exibir_relatorio  (Screen 5 — "Relatório de Auditoria")      */
/* ------------------------------------------------------------------ */
void stats_exibir_relatorio(void)
{
    int total = 0;
    sessao_t *lista = db_carregar_todas(&total);

    printf("\n");
    printf("  +--------------------------------------------------+\n");
    printf("  |        RELATORIO DE AUDITORIA DO SISTEMA         |\n");
    printf("  +--------------------------------------------------+\n\n");

    if (!lista || total == 0) {
        printf("  [INFO] Nenhuma sessao registrada ainda.\n");
        printf("         Jogue ao menos uma partida primeiro!\n\n");
        if (lista) free(lista);
        return;
    }

    /* --- Cálculos com funções recursivas --- */
    float med      = media_rec(lista, total);
    float var      = variancia_rec(lista, total, med);
    float desvio   = sqrtf(var);
    int   vitorias = contar_vitorias_rec(lista, total);
    float taxa     = (float)vitorias / (float)total * 100.0f;

    int idx_melhor = idx_melhor_rec(lista, total, -1);
    int idx_pior   = idx_pior_rec(lista, total, -1);

    /* --- Painel de resumo --- */
    printf("  Audit_log.txt        : %s\n", ARQUIVO_JSON);
    printf("  Sessoes registradas  : %d\n", total);
    printf("  Vitorias             : %d  (%.1f%%)\n", vitorias, taxa);
    printf("  Derrotas             : %d\n", total - vitorias);
    printf("  Media de tentativas  : %.2f +/- %.2f (desvio padrao)\n",
           med, desvio);
    printf("\n");

    /* --- Barra visual da taxa de vitória --- */
    printf("  Taxa de sucesso  [");
    int barras_v = (int)(taxa / 100.0f * 30.0f);
    for (int i = 0; i < 30; i++)
        printf(i < barras_v ? "#" : "-");
    printf("] %.1f%%\n\n", taxa);

    /* --- Melhor sessão --- */
    if (idx_melhor >= 0) {
        sessao_t *m = &lista[idx_melhor];
        printf("  [MELHOR SESSAO]\n");
        printf("    Jogador     : %-20s Rating: %s\n", m->jogador, m->rating);
        printf("    Tentativas  : %d   Dificuldade: %s   Data: %s\n\n",
               m->tentativas, m->dificuldade, m->timestamp);
    } else {
        printf("  [MELHOR SESSAO] Nenhuma vitoria ainda.\n\n");
    }

    /* --- Pior sessão --- */
    if (idx_pior >= 0) {
        sessao_t *p = &lista[idx_pior];
        printf("  [PIOR SESSAO]\n");
        printf("    Jogador     : %-20s Rating: %s\n", p->jogador, p->rating);
        printf("    Tentativas  : %d   Dificuldade: %s   Data: %s\n\n",
               p->tentativas, p->dificuldade, p->timestamp);
    } else {
        printf("  [PIOR SESSAO] Nenhuma derrota registrada.\n\n");
    }

    /* --- Histograma de frequência de tentativas --- */
    exibir_histograma(lista, total);

    /* --- Sugestão de estratégia --- */
    printf("\n  [ESTRATEGIA]\n");
    if (med > 7.0f) {
        printf("  Bias detectado: voce usa muitas tentativas.\n");
        printf("  Tente iniciar sempre pelo meio (50) — busca binaria!\n\n");
    } else if (med <= 4.0f) {
        printf("  Desempenho excepcional! Voce opera como um Ghost.\n\n");
    } else {
        printf("  Desempenho dentro da faixa esperada. Continue treinando!\n\n");
    }

    free(lista);
}
