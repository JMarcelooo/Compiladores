import re

# ============================
#   LEXER
# ============================

token_specs = [
    ("NUM",    r"-?\d+"),
    ("STR",    r'"[^"]*"|\'[^\']*\''),   # <--- corrigido!
    ("ID",     r"[A-Za-z_][A-Za-z0-9_]*"),
    ("OP",     r"==|!=|>=|<=|>|<"),
    ("LBRACK", r"\["),
    ("RBRACK", r"\]"),
    ("COLON",  r":"),
    ("SKIP",   r"[ \t\n]+"),
    ("MISMATCH", r"."),
]


def tokenize(text):
    regex_parts = [f"(?P<{name}>{pattern})" for name, pattern in token_specs]
    regex = re.compile("|".join(regex_parts))
    tokens = []
    for m in regex.finditer(text):
        kind = m.lastgroup
        value = m.group()
        if kind == "SKIP":
            continue
        if kind == "MISMATCH":
            raise ValueError(f"Token inválido: {value}")
        tokens.append((kind, value))
    tokens.append(("EOF", "EOF"))
    return tokens


# ============================
#   PARSER (USANDO TABELA LL1)
# ============================

class Parser:
    def __init__(self, tokens):
        self.tokens = tokens
        self.pos = 0

    def peek(self):
        return self.tokens[self.pos]

    def eat(self, expected):
        tok = self.peek()
        if tok[0] == expected:
            self.pos += 1
            return tok
        raise ValueError(f"Esperado {expected}, encontrado {tok}")

    # --------------------------
    # S → VAR [ INDICE ]
    # --------------------------
    def S(self):
        self.VAR()
        self.eat("LBRACK")
        self.INDICE()
        self.eat("RBRACK")

    # --------------------------
    # VAR → LETRA VAR_OPT
    # LETRA ≡ ID
    # --------------------------
    def VAR(self):
        self.eat("ID")
        self.VAR_OPT()

    # VAR_OPT → LETRA VAR_OPT | ε
    def VAR_OPT(self):
        tok = self.peek()[0]
        if tok == "ID":
            self.eat("ID")
            self.VAR_OPT()
        else:
            return

    # --------------------------
    # INDICE (5 entradas)
    # --------------------------
    def INDICE(self):
        tok = self.peek()[0]

        if tok == "NUM":
            self.eat("NUM")
            self.IND_AFT_NUM()

        elif tok == "STR":
            # pode ser STR IND_AFT_STR ou STR ":" STR_OPT
            # Tabela diz que começa como STR IND_AFT_STR
            self.eat("STR")
            self.IND_AFT_STR()

        elif tok == "COLON":
            # slice numérico do tipo :NUM
            self.eat("COLON")
            self.NUM_OPT()

        elif tok == "ID":
            # pode ser S (acesso aninhado)
            self.S()
            self.IND_COMP_OPT()

        else:
            raise ValueError(f"Índice inválido: {tok}")

    # --------------------------
    # IND_AFT_NUM → ":" NUM_OPT | ε
    # --------------------------
    def IND_AFT_NUM(self):
        tok = self.peek()[0]
        if tok == "COLON":
            self.eat("COLON")
            self.NUM_OPT()
        else:
            return

    # --------------------------
    # IND_AFT_STR → ":" STR_OPT | ε
    # --------------------------
    def IND_AFT_STR(self):
        tok = self.peek()[0]
        if tok == "COLON":
            self.eat("COLON")
            self.STR_OPT()
        else:
            return

    # --------------------------
    # IND_COMP_OPT → OP VALOR | ε
    # --------------------------
    def IND_COMP_OPT(self):
        tok = self.peek()[0]
        if tok == "OP":
            self.eat("OP")
            self.VALOR()
        else:
            return

    # VALOR → NUM | STR
    def VALOR(self):
        tok = self.peek()[0]
        if tok == "NUM":
            self.eat("NUM")
        elif tok == "STR":
            self.eat("STR")
        else:
            raise ValueError(f"Valor inválido: {tok}")

    # NUM_OPT → NUM | ε
    def NUM_OPT(self):
        if self.peek()[0] == "NUM":
            self.eat("NUM")
        else:
            return

    # STR_OPT → STR | ε
    def STR_OPT(self):
        if self.peek()[0] == "STR":
            self.eat("STR")
        else:
            return


# ============================
#   TESTE (cadeias.txt)
# ============================

def testar_cadeias(arq="cadeias.txt"):
    with open(arq, encoding="utf-8") as f:
        linhas = [l.strip() for l in f if l.strip()]

    for linha in linhas:
        print(f"\nTestando: {linha}")
        try:
            tokens = tokenize(linha)
            parser = Parser(tokens)
            parser.S()
            if parser.peek()[0] == "EOF":
                print("✔ Aceita")
            else:
                print("✘ Rejeitada: tokens restantes")
        except Exception as e:
            print("✘ Rejeitada:", e)


if __name__ == "__main__":
    testar_cadeias()
