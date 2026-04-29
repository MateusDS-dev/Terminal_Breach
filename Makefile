# -----------------------------------------------------------------------
#  Terminal Breach — Makefile
#  Compatível com Linux, macOS e Windows (MinGW/MSYS2)
# -----------------------------------------------------------------------

CC      = gcc
CFLAGS  = -Wall -Wextra -std=c11
LDFLAGS = -lm

# Nome do executável (no Windows recebe .exe automaticamente pelo gcc)
TARGET  = terminal_breach

# Fontes e objetos
SRCS    = main.c game.c db.c stats.c ghost_mode.c leaderboard.c
OBJS    = $(SRCS:.c=.o)

# Diretório de dados (criado em tempo de execução pelo db.c se necessário,
# mas garantimos sua existência aqui também)
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

# Limpa também o banco de dados (use com cuidado!)
clean-data:
	rm -f $(DATADIR)/sessions.json
	@echo "  [OK] Banco de dados removido."

.PHONY: all clean clean-data
