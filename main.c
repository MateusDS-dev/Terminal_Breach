#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#include "game.h"
#include "db.h"
#include "stats.h"
#include "leaderboard.h"
#include "ghost_mode.h"

static void limpar_tela(void)
{
#ifdef _WIN32
    system("cls");
#else
    system("clear");
#endif
}

static void aguardar_enter(void)
{
    printf("\n  Pressione ENTER para continuar...");
    fflush(stdout);
    int c;
    while ((c = getchar()) != '\n' && c != EOF);
}

/* ================================================================== */
/*  TELA INICIAL — sem Unicode                                          */
/* ================================================================== */
static void tela_inicial(char *nome_jogador, int tam)
{
    limpar_tela();
    printf("\n");
    printf("  +=======================================================+\n");
    printf("  |         [ TERMINAL BREACH v1.0 ]                      |\n");
    printf("  |   Infiltre o sistema. Descubra o codigo de acesso.   |\n");
    printf("  +=======================================================+\n");
    printf("\n");
    printf("   _____ _____ ____  __  __ ___ _   _    _    _     \n");
    printf("  |_   _| ____|  _ \\|  \\/  |_ _| \\ | |  / \\  | |    \n");
    printf("    | | |  _| | |_) | |\\/| || ||  \\| | / _ \\ | |    \n");
    printf("    | | | |___|  _ <| |  | || || |\\  |/ ___ \\| |___ \n");
    printf("    |_| |_____|_| \\_\\_|  |_|___|_| \\_/_/   \\_\\_____|\n");
    printf("\n");
    printf("   ____  ____  _____    _    ____ _   _ \n");
    printf("  | __ )|  _ \\| ____|  / \\  / ___| | | |\n");
    printf("  |  _ \\| |_) |  _|   / _ \\| |   | |_| |\n");
    printf("  | |_) |  _ <| |___ / ___ \\ |___|  _  |\n");
    printf("  |____/|_| \\_\\_____/_/   \\_\\____|_| |_|\n");
    printf("\n");
    printf("  +---------------------------------------------------------+\n");
    printf("  |  SISTEMA: ONLINE  |  FIREWALL: ATIVO  |  MODO: PVP     |\n");
    printf("  +---------------------------------------------------------+\n");
    printf("\n");
    printf("  >> Digite seu nome de hacker (ex: neo, morpheus): ");
    fflush(stdout);

    if (fgets(nome_jogador, tam, stdin))
        nome_jogador[strcspn(nome_jogador, "\n")] = '\0';
    if (nome_jogador[0] == '\0')
        strncpy(nome_jogador, "Anonimo", (size_t)tam - 1);

    printf("\n  [SYS] Operador identificado : %s\n", nome_jogador);
    printf("  [SYS] Sessao iniciada. Bem-vindo ao sistema.\n");
    aguardar_enter();
}

/* ================================================================== */
/*  MENU PRINCIPAL                                                      */
/* ================================================================== */
static void exibir_menu(const char *nome)
{
    limpar_tela();
    printf("\n");
    printf("  +=======================================================+\n");
    printf("  |  [ TERMINAL BREACH v1.0 ]          op: %-13s|\n", nome);
    printf("  +=======================================================+\n");
    printf("  |                                                       |\n");
    printf("  |   1. Iniciar sessao de invasao                       |\n");
    printf("  |   2. Relatorio de auditoria  (stats + histograma)    |\n");
    printf("  |   3. Placar de lideres       (top 5 hackers)         |\n");
    printf("  |   4. Sair                                             |\n");
    printf("  |                                                       |\n");
    printf("  |   Dica: rode  terminal_breach --ghost                |\n");
    printf("  |         para o Modo Fantasma (busca binaria auto)    |\n");
    printf("  +=======================================================+\n");
    printf("  Opcao: ");
    fflush(stdout);
}

/* ================================================================== */
/*  main                                                                */
/* ================================================================== */
int main(int argc, char *argv[])
{
    /* Modo Ghost */
    if (argc >= 2 && strcmp(argv[1], "--ghost") == 0) {
        limpar_tela();
        ghost_executar();
        aguardar_enter();
        return 0;
    }

    char nome_jogador[64] = {0};
    tela_inicial(nome_jogador, (int)sizeof(nome_jogador));

    int opcao   = 0;
    int rodando = 1;

    while (rodando) {
        exibir_menu(nome_jogador);

        if (scanf("%d", &opcao) != 1) opcao = 0;
        int c;
        while ((c = getchar()) != '\n' && c != EOF);

        switch (opcao) {
            case 1: {
                limpar_tela();
                sessao_t sessao;
                jogo_executar(&sessao, nome_jogador);
                db_salvar_sessao(&sessao);
                printf("  [SYS] Sessao registrada no audit log.\n");

                printf("\n  Deseja ver o relatorio completo? (1=sim / 0=nao): ");
                int ver = 0;
                if (scanf("%d", &ver) != 1) ver = 0;
                while ((c = getchar()) != '\n' && c != EOF);
                if (ver == 1) { limpar_tela(); stats_exibir_relatorio(); }
                aguardar_enter();
                break;
            }
            case 2:
                limpar_tela();
                stats_exibir_relatorio();
                aguardar_enter();
                break;
            case 3:
                limpar_tela();
                leaderboard_exibir();
                aguardar_enter();
                break;
            case 4:
                limpar_tela();
                printf("\n  [SYS] Encerrando conexao segura...\n");
                printf("  [SYS] Ate a proxima missao, %s.\n\n", nome_jogador);
                rodando = 0;
                break;
            default:
                printf("\n  [ERRO] Opcao invalida. Tente novamente.\n");
                aguardar_enter();
                break;
        }
    }

    return 0;
}
