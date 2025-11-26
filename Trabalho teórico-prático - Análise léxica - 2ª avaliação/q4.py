import re


# Simbolos suportados

simbolos = "€£¥₹₽₩₺₪₫₱₣₴₦₨₡₲₵₸"

pattern = re.compile(
    r'^'
    # Letras + opcional $
    r'(?:[A-Za-z]+\$?'
    # OU um dos símbolos + opcional $
    r'|[' + simbolos + r']\$?'
    # OU apenas $
    r'|\$)'
    
    # --- Valor ---
    r'(?:'
        # Valores negativos
        r'-?(?:'
            r'0,[0-9]{2}'
            r'|[1-9][0-9]{0,2},[0-9]{2}'
            r'|[1-9][0-9]{0,2}\.[0-9]{3},[0-9]{2}'
        r')'
        r'|'
        # Valores entre parênteses
        r'\('
            r'(?:'
                r'0,[0-9]{2}'
                r'|[1-9][0-9]{0,2},[0-9]{2}'
                r'|[1-9][0-9]{0,2}\.[0-9]{3},[0-9]{2}'
            r')'
        r'\)'
    r')'
    r'$'
)

arquivo = "exemplos.txt"

with open(arquivo, "r", encoding="utf-8") as f:
    linhas = [linha.strip() for linha in f.readlines()]

print("VALIDAÇÃO DOS VALORES:\n")

for linha in linhas:
    if pattern.match(linha):
        print(f"{linha} -> VÁLIDO")
    else:
        print(f"{linha} -> INVÁLIDO")
