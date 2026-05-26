# -----------------------------------------------------------------------
#  Terminal Breach — Makefile
# -----------------------------------------------------------------------

CC      = gcc
CFLAGS  = -Wall -Wextra -std=c11 -Iinclude
LDFLAGS = -lm

# Winsock (API HTTP) — necessário no Windows com MinGW; ignorado em Linux/macOS
ifeq ($(OS),Windows_NT)
LDFLAGS += -lws2_32
endif

TARGET  = terminal_breach

SRCS    = src/main.c src/game.c src/db.c src/stats.c src/ghost_mode.c src/leaderboard.c src/http_server.c
OBJS    = $(SRCS:.c=.o)

DATADIR = data

# -----------------------------------------------------------------------
#  Regra padrão
# -----------------------------------------------------------------------
all: $(DATADIR) $(TARGET)

$(TARGET): $(OBJS)
	$(CC) $(CFLAGS) -o $@ $^ $(LDFLAGS)
	@echo ""
	@echo "  [OK] Compilacao concluida: ./$(TARGET)"
	@echo "  [OK] Uso normal : ./$(TARGET)"
	@echo "  [OK] Modo Ghost : ./$(TARGET) --ghost"
	@echo ""

%.o: %.c
	$(CC) $(CFLAGS) -c -o $@ $<

# Garante que o diretório data/ existe antes de compilar
$(DATADIR):
	mkdir -p $(DATADIR)

# -----------------------------------------------------------------------
#  Limpeza
# -----------------------------------------------------------------------
clean:
	rm -f $(OBJS) $(TARGET) $(TARGET).exe
	@echo "  [OK] Arquivos temporarios removidos."

clean-data:
	rm -f $(DATADIR)/sessions.json
	@echo "  [OK] Banco de dados removido."

.PHONY: all clean clean-data
