#ifndef GAME_H
#define GAME_H

typedef enum {
    DIFF_SCRIPT_KIDDIE = 1,
    DIFF_ANALYST       = 2,
    DIFF_OPERATIVE     = 3,
    DIFF_GHOST         = 4
} dificuldade_t;

typedef struct {
    char timestamp[32];
    char jogador[64];
    char dificuldade[32];
    int  segredo;
    int  tentativas;
    char rating[32];
    int  venceu;
} sessao_t;

void jogo_executar(sessao_t *s, const char *nome_jogador);

const char *dificuldade_rotulo(dificuldade_t d);

int dificuldade_max_tentativas(dificuldade_t d);

const char *calcular_rating(int tentativas_usadas, int venceu);

void sessao_definir_timestamp(sessao_t *s);

#endif /* GAME_H */
