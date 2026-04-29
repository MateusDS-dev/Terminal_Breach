#include "game.h"

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>

void sessao_definir_timestamp(sessao_t *s)
{
    time_t agora = time(NULL);
    struct tm *t = localtime(&agora);
    strftime(s->timestamp, sizeof(s->timestamp), "%Y-%m-%d %H:%M:%S", t);
}

const char *dificuldade_rotulo(dificuldade_t d)
{
    switch (d) {
        case DIFF_SCRIPT_KIDDIE: return "Script Kiddie";
        case DIFF_ANALYST:       return "Analista";
        case DIFF_OPERATIVE:     return "Operativo";
        case DIFF_GHOST:         return "Ghost";
        default:                 return "Desconhecido";
    }
}

int dificuldade_max_tentativas(dificuldade_t d)
{
    switch (d) {
        case DIFF_SCRIPT_KIDDIE: return 0;   /* ilimitado */
        case DIFF_ANALYST:       return 10;
        case DIFF_OPERATIVE:     return 7;
        case DIFF_GHOST:         return 5;
        default:                 return 0;
    }
}

const char *calcular_rating(int tentativas_usadas, int venceu)
{
    if (!venceu)                   return "Script Kiddie";
    if (tentativas_usadas <= 4)    return "Ghost";
    if (tentativas_usadas <= 6)    return "Operativo";
    if (tentativas_usadas == 7)    return "Analista";
    return "Script Kiddie";
}

/* ------------------------------------------------------------------ */
/*  Loop principal do jogo                                              */
/* ------------------------------------------------------------------ */
void jogo_executar(sessao_t *s, const char *nome_jogador)
{
    /* -- Seleção de dificuldade ------------------------------------ */
    printf("\n");
    printf("  +------------------------------------------+\n");
    printf("  |      SELECIONE O NIVEL DE FIREWALL       |\n");
    printf("  +------------------------------------------+\n");
    printf("  |  1. Script Kiddie  (tentativas ilimitadas)|\n");
    printf("  |  2. Analista       (10 tentativas)        |\n");
    printf("  |  3. Operativo      (7 tentativas)         |\n");
    printf("  |  4. Ghost          (5 tentativas)         |\n");
    printf("  +------------------------------------------+\n");
    printf("  Escolha: ");

    int escolha = 0;
    if (scanf("%d", &escolha) != 1 || escolha < 1 || escolha > 4) {
        printf("[AVISO] Entrada invalida. Usando Script Kiddie.\n");
        escolha = 1;
    }
    int c;
    while ((c = getchar()) != '\n' && c != EOF);

    dificuldade_t diff    = (dificuldade_t)escolha;
    int           max_tent = dificuldade_max_tentativas(diff);

    /* -- Gera o numero secreto ------------------------------------ */
    srand((unsigned int)time(NULL));
    int segredo = (rand() % 100) + 1;

    /* -- Inicializa sessao ---------------------------------------- */
    memset(s, 0, sizeof(*s));
    strncpy(s->jogador,     nome_jogador,           sizeof(s->jogador) - 1);
    strncpy(s->dificuldade, dificuldade_rotulo(diff),sizeof(s->dificuldade) - 1);
    s->segredo    = segredo;
    s->tentativas = 0;
    s->venceu     = 0;
    sessao_definir_timestamp(s);

    /* -- Cabecalho da sessao -------------------------------------- */
    printf("\n");
    printf("  [SISTEMA] Firewall ativo. Nivel: %s\n", s->dificuldade);
    if (max_tent > 0)
        printf("  [SISTEMA] Tentativas disponiveis: %d\n", max_tent);
    else
        printf("  [SISTEMA] Tentativas disponiveis: ilimitadas\n");
    printf("  [SISTEMA] Adivinhe o codigo de acesso (1 a 100).\n\n");

    /* -- Loop de tentativas -------------------------------------- */
    int tentativa_atual = 0;
    int ganhou = 0;

    while (1) {
        if (max_tent > 0 && tentativa_atual >= max_tent) break;

        if (max_tent > 0)
            printf("  [TENTATIVA %d/%d] Digite o codigo: ", tentativa_atual + 1, max_tent);
        else
            printf("  [TENTATIVA %d] Digite o codigo: ", tentativa_atual + 1);

        int palpite = 0;
        if (scanf("%d", &palpite) != 1) {
            printf("[ERRO] Entrada invalida. Tente novamente.\n");
            while ((c = getchar()) != '\n' && c != EOF);
            continue;
        }
        while ((c = getchar()) != '\n' && c != EOF);

        tentativa_atual++;

        if (palpite == segredo) {
            ganhou = 1;
            break;
        } else if (palpite > segredo) {
            printf("  [WARN] Porta acima do alvo. Recuando no range...\n\n");
        } else {
            printf("  [SCAN] Codigo abaixo. Scanning porta superior...\n\n");
        }
    }

    /* -- Resultado ----------------------------------------------- */
    s->tentativas = tentativa_atual;
    s->venceu     = ganhou;
    strncpy(s->rating, calcular_rating(tentativa_atual, ganhou), sizeof(s->rating) - 1);

    printf("\n");
    if (ganhou) {
        printf("  +==========================================+\n");
        printf("  |  [ACC] ACESSO CONCEDIDO.                 |\n");
        printf("  |  Codigo correto   : %-21d|\n", segredo);
        printf("  |  Tentativas usadas: %-21d|\n", tentativa_atual);
        printf("  |  Rating           : %-21s|\n", s->rating);
        printf("  +==========================================+\n");
    } else {
        printf("  +==========================================+\n");
        printf("  |  [FAIL] FIREWALL ATIVO. ACESSO NEGADO.  |\n");
        printf("  |  Codigo era       : %-21d|\n", segredo);
        printf("  |  Rating           : %-21s|\n", s->rating);
        printf("  +==========================================+\n");
    }
    printf("\n");
}
