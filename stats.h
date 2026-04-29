#ifndef STATS_H
#define STATS_H

#include "game.h"

/* ------------------------------------------------------------------ */
/*  Funções de estatísticas (usam recursão, sem laços)                  */
/* ------------------------------------------------------------------ */

/* Média recursiva de tentativas */
float media_rec(sessao_t *s, int n);

/* Variância recursiva em relação à média dada */
float variancia_rec(sessao_t *s, int n, float media);

/* Exibe o relatório completo de auditoria no terminal */
void stats_exibir_relatorio(void);

#endif /* STATS_H */
