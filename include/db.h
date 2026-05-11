#ifndef DB_H
#define DB_H

#include "game.h"

/* ------------------------------------------------------------------ */
/*  Caminho do arquivo de dados                                         */
/* ------------------------------------------------------------------ */
#define ARQUIVO_JSON "data/sessions.json"

/* ------------------------------------------------------------------ */
/*  Funções de persistência JSON (sem bibliotecas externas)             */
/* ------------------------------------------------------------------ */

/* Salva (acrescenta) uma sessão no arquivo JSON.
   Cria o arquivo com array vazio na primeira execução. */
void db_salvar_sessao(const sessao_t *s);

/* Carrega todas as sessões do arquivo JSON num array alocado em heap.
   *quantidade recebe o total de entradas lidas.
   Retorna NULL se o arquivo não existir ou estiver vazio. */
sessao_t *db_carregar_todas(int *quantidade);

#endif /* DB_H */
