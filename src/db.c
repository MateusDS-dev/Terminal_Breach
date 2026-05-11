#include "db.h"
#include "game.h"

#include <stdio.h>
#include <stdlib.h>
#include <string.h>

/* ------------------------------------------------------------------ */
/*  Funções auxiliares de parsing JSON manual                           */
/* ------------------------------------------------------------------ */

/* Extrai o valor de uma chave string: "chave": "valor" */
static int extrair_string(const char *linha, const char *chave,
                           char *saida, int tam)
{
    char padrao[128];
    snprintf(padrao, sizeof(padrao), "\"%s\"", chave);
    const char *p = strstr(linha, padrao);
    if (!p) return 0;

    p += strlen(padrao);
    while (*p && *p != ':') p++;
    if (!*p) return 0;
    p++;
    while (*p == ' ' || *p == '\t') p++;
    if (*p == '"') {
        p++;
        int i = 0;
        while (*p && *p != '"' && i < tam - 1)
            saida[i++] = *p++;
        saida[i] = '\0';
        return 1;
    }
    return 0;
}

/* Extrai o valor de uma chave inteira: "chave": 42 */
static int extrair_int(const char *linha, const char *chave, int *saida)
{
    char padrao[128];
    snprintf(padrao, sizeof(padrao), "\"%s\"", chave);
    const char *p = strstr(linha, padrao);
    if (!p) return 0;

    p += strlen(padrao);
    while (*p && *p != ':') p++;
    if (!*p) return 0;
    p++;
    while (*p == ' ' || *p == '\t') p++;
    if (*p == '-' || (*p >= '0' && *p <= '9')) {
        *saida = atoi(p);
        return 1;
    }
    return 0;
}

/* Extrai o valor booleano: "chave": true/false */
static int extrair_bool(const char *linha, const char *chave, int *saida)
{
    char padrao[128];
    snprintf(padrao, sizeof(padrao), "\"%s\"", chave);
    const char *p = strstr(linha, padrao);
    if (!p) return 0;

    p += strlen(padrao);
    while (*p && *p != ':') p++;
    if (!*p) return 0;
    p++;
    while (*p == ' ' || *p == '\t') p++;
    if (strncmp(p, "true",  4) == 0) { *saida = 1; return 1; }
    if (strncmp(p, "false", 5) == 0) { *saida = 0; return 1; }
    return 0;
}

/* ------------------------------------------------------------------ */
/*  Escreve um objeto sessão em formato JSON num FILE* já aberto         */
/* ------------------------------------------------------------------ */
static void escrever_objeto(FILE *f, const sessao_t *s)
{
    fprintf(f, "  {\n");
    fprintf(f, "    \"timestamp\": \"%s\",\n",  s->timestamp);
    fprintf(f, "    \"jogador\": \"%s\",\n",     s->jogador);
    fprintf(f, "    \"dificuldade\": \"%s\",\n", s->dificuldade);
    fprintf(f, "    \"segredo\": %d,\n",         s->segredo);
    fprintf(f, "    \"tentativas\": %d,\n",      s->tentativas);
    fprintf(f, "    \"rating\": \"%s\",\n",      s->rating);
    fprintf(f, "    \"venceu\": %s\n",           s->venceu ? "true" : "false");
    fprintf(f, "  }");
}

/* ------------------------------------------------------------------ */
/*  db_salvar_sessao                                                    */
/*  Estratégia: carrega todas as sessões existentes e reescreve o       */
/*  arquivo inteiro acrescido da nova sessão. Evita ftruncate/_chsize.  */
/* ------------------------------------------------------------------ */
void db_salvar_sessao(const sessao_t *nova)
{
    /* Garante que o diretório data/ existe */
#ifdef _WIN32
    system("if not exist data mkdir data");
#else
    system("mkdir -p data");
#endif

    /* Carrega sessões existentes */
    int total_existentes = 0;
    sessao_t *lista = db_carregar_todas(&total_existentes);

    /* Abre o arquivo para reescrita completa */
    FILE *f = fopen(ARQUIVO_JSON, "w");
    if (!f) {
        fprintf(stderr, "[ERRO] Nao foi possivel abrir %s para escrita.\n",
                ARQUIVO_JSON);
        if (lista) free(lista);
        return;
    }

    fprintf(f, "[\n");

    /* Reescreve sessões anteriores */
    for (int i = 0; i < total_existentes; i++) {
        escrever_objeto(f, &lista[i]);
        fprintf(f, ",\n");
    }

    /* Acrescenta nova sessão */
    escrever_objeto(f, nova);
    fprintf(f, "\n]\n");

    fclose(f);
    if (lista) free(lista);
}

/* ------------------------------------------------------------------ */
/*  db_carregar_todas                                                   */
/* ------------------------------------------------------------------ */
sessao_t *db_carregar_todas(int *quantidade)
{
    *quantidade = 0;

    FILE *f = fopen(ARQUIVO_JSON, "r");
    if (!f) return NULL;

    /* Lê o arquivo inteiro em memória */
    fseek(f, 0, SEEK_END);
    long tam = ftell(f);
    rewind(f);

    if (tam <= 0) { fclose(f); return NULL; }

    char *conteudo = (char *)malloc((size_t)tam + 1);
    if (!conteudo) { fclose(f); return NULL; }

    size_t lidos = fread(conteudo, 1, (size_t)tam, f);
    conteudo[lidos] = '\0';
    fclose(f);

    /* Conta e aloca objetos */
    int capacidade = 64;
    sessao_t *lista = (sessao_t *)malloc((size_t)capacidade * sizeof(sessao_t));
    if (!lista) { free(conteudo); return NULL; }

    int total = 0;
    char *p   = conteudo;

    while ((p = strchr(p, '{')) != NULL) {
        p++; /* pula '{' */

        /* Localiza o final do objeto atual */
        char *fim = strchr(p, '}');
        if (!fim) break;

        /* Copia o bloco do objeto para buffer temporário */
        size_t bloco_tam = (size_t)(fim - p);
        char *bloco = (char *)malloc(bloco_tam + 1);
        if (!bloco) break;
        memcpy(bloco, p, bloco_tam);
        bloco[bloco_tam] = '\0';

        /* Expande lista se necessário */
        if (total >= capacidade) {
            capacidade *= 2;
            sessao_t *tmp = (sessao_t *)realloc(lista,
                            (size_t)capacidade * sizeof(sessao_t));
            if (!tmp) { free(bloco); break; }
            lista = tmp;
        }

        sessao_t *s = &lista[total];
        memset(s, 0, sizeof(*s));

        /* Extrai campos linha por linha */
        char *linha = strtok(bloco, "\n");
        while (linha) {
            extrair_string(linha, "timestamp",   s->timestamp,   sizeof(s->timestamp));
            extrair_string(linha, "jogador",      s->jogador,     sizeof(s->jogador));
            extrair_string(linha, "dificuldade",  s->dificuldade, sizeof(s->dificuldade));
            extrair_int   (linha, "segredo",     &s->segredo);
            extrair_int   (linha, "tentativas",  &s->tentativas);
            extrair_string(linha, "rating",       s->rating,      sizeof(s->rating));
            extrair_bool  (linha, "venceu",      &s->venceu);
            linha = strtok(NULL, "\n");
        }

        free(bloco);
        total++;
        p = fim + 1;
    }

    free(conteudo);

    if (total == 0) {
        free(lista);
        return NULL;
    }

    *quantidade = total;
    return lista;
}
