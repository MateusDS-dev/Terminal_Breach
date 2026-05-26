#ifndef DB_H
#define DB_H

#include "game.h"

#define ARQUIVO_JSON "data/sessions.json"

void db_salvar_sessao(const sessao_t *s);

sessao_t *db_carregar_todas(int *quantidade);

#endif /* DB_H */
