#ifndef GHOST_MODE_H
#define GHOST_MODE_H

#include "game.h"

/* ------------------------------------------------------------------ */
/*  Modo Ghost — resolução automática por busca binária recursiva       */
/* ------------------------------------------------------------------ */

/* Resolve o jogo recursivamente com busca binária.
   Retorna o número de passos utilizados. */
int ghost_resolver(int segredo, int baixo, int alto, int passo);

/* Ponto de entrada do modo ghost: gera número, executa, salva sessão. */
void ghost_executar(void);

#endif /* GHOST_MODE_H */
