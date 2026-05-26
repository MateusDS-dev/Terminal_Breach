#ifndef STATS_H
#define STATS_H

#include "game.h"

float media_rec(sessao_t *s, int n);

float variancia_rec(sessao_t *s, int n, float media);

void stats_exibir_relatorio(void);

#endif /* STATS_H */
