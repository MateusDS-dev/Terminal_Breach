#ifndef GAME_H
#define GAME_H

/* ------------------------------------------------------------------ */
/*  Níveis de dificuldade (Firewall Level)                              */
/* ------------------------------------------------------------------ */
typedef enum {
    DIFF_SCRIPT_KIDDIE = 1, /* tentativas ilimitadas */
    DIFF_ANALYST       = 2, /* 10 tentativas         */
    DIFF_OPERATIVE     = 3, /* 7 tentativas          */
    DIFF_GHOST         = 4  /* 5 tentativas          */
} dificuldade_t;

/* ------------------------------------------------------------------ */
/*  Dados de uma sessão — salva no JSON                                 */
/* ------------------------------------------------------------------ */
typedef struct {
    char timestamp[32];   /* "AAAA-MM-DD HH:MM:SS"       */
    char jogador[64];     /* nome do jogador              */
    char dificuldade[32]; /* "Script Kiddie" / "Ghost"... */
    int  segredo;         /* número sorteado              */
    int  tentativas;      /* tentativas utilizadas        */
    char rating[32];      /* "Ghost" / "Operativo"...     */
    int  venceu;          /* 1 = ganhou, 0 = perdeu       */
} sessao_t;

/* ------------------------------------------------------------------ */
/*  Funções públicas                                                    */
/* ------------------------------------------------------------------ */

/* Executa uma sessão interativa do jogo; preenche *s com o resultado. */
void jogo_executar(sessao_t *s, const char *nome_jogador);

/* Retorna o rótulo textual da dificuldade. */
const char *dificuldade_rotulo(dificuldade_t d);

/* Retorna o número máximo de tentativas (0 = ilimitado). */
int dificuldade_max_tentativas(dificuldade_t d);

/* Calcula o rating com base nas tentativas e se venceu. */
const char *calcular_rating(int tentativas_usadas, int venceu);

/* Preenche s->timestamp com a hora local atual. */
void sessao_definir_timestamp(sessao_t *s);

#endif /* GAME_H */
