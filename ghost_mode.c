#include "ghost_mode.h"
#include "game.h"
#include "db.h"

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>

#ifdef _WIN32
#  include <windows.h>
#  define ESPERAR_MS(ms) Sleep(ms)
#else
#  include <unistd.h>
#  define ESPERAR_MS(ms) usleep((ms) * 1000)
#endif

/* ------------------------------------------------------------------ */
/*  Busca binaria recursiva com narracao                                */
/* ------------------------------------------------------------------ */
int ghost_resolver(int segredo, int baixo, int alto, int passo)
{
    if (baixo > alto) return passo;

    int meio = (baixo + alto) / 2;

    printf("  [GHOST] Passo %d | Range [%d-%d] | Testando: %d\n",
           passo, baixo, alto, meio);
    fflush(stdout);
    ESPERAR_MS(600);

    if (meio == segredo)       return passo;
    else if (meio < segredo)   return ghost_resolver(segredo, meio + 1, alto,  passo + 1);
    else                       return ghost_resolver(segredo, baixo,    meio - 1, passo + 1);
}

/* ------------------------------------------------------------------ */
/*  ghost_executar                                                      */
/* ------------------------------------------------------------------ */
void ghost_executar(void)
{
    srand((unsigned int)time(NULL));
    int segredo = (rand() % 100) + 1;

    printf("\n");
    printf("  +==================================================+\n");
    printf("  |             MODO GHOST ATIVADO                   |\n");
    printf("  |      Resolucao automatica por busca binaria      |\n");
    printf("  +==================================================+\n\n");

    printf("  [GHOST] Numero secreto gerado. Iniciando invasao...\n\n");
    ESPERAR_MS(800);

    int passos = ghost_resolver(segredo, 1, 100, 1);

    const char *eficiencia;
    if (passos <= 4)       eficiencia = "OTIMA  (classe Ghost)";
    else if (passos <= 6)  eficiencia = "BOA    (classe Operativo)";
    else if (passos == 7)  eficiencia = "OK     (classe Analista)";
    else                   eficiencia = "FRACA  (Script Kiddie)";

    printf("\n");
    printf("  +==================================================+\n");
    printf("  |  [GHOST] BREACH COMPLETO em %d passo(s).         \n", passos);
    printf("  |  Codigo descoberto : %d\n", segredo);
    printf("  |  Eficiencia        : %s\n", eficiencia);
    printf("  +==================================================+\n\n");

    /* Salva a sessao no JSON */
    sessao_t s;
    memset(&s, 0, sizeof(s));
    strncpy(s.jogador,     "GHOST_BOT", sizeof(s.jogador) - 1);
    strncpy(s.dificuldade, "Ghost",      sizeof(s.dificuldade) - 1);
    s.segredo    = segredo;
    s.tentativas = passos;
    s.venceu     = 1;
    strncpy(s.rating, calcular_rating(passos, 1), sizeof(s.rating) - 1);
    sessao_definir_timestamp(&s);

    db_salvar_sessao(&s);
    printf("  [SISTEMA] Sessao Ghost registrada no banco de dados.\n\n");
}
