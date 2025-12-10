# JavaScript para Compiladores e Paradigmas de Programação

Este repositório serve como um depósito de **exemplos da linguagem JavaScript**, focando em conceitos e estruturas relevantes para a disciplina de **Compiladores e Paradigmas de Programação**.

Aqui você encontrará códigos que exploram diferentes aspectos da linguagem, desde sintaxes básicas até a aplicação de paradigmas de programação, como o funcional e o orientado a objetos. Os exemplos foram criados para ajudar na compreensão de como o JavaScript se comporta, o que é fundamental para entender o processo de compilação e as diferentes abordagens de desenvolvimento.

## Conteúdo

Cada pasta neste repositório representa um conjunto de exemplos relacionado a um tópico específico da disciplina. Sinta-se à vontade para explorar os arquivos e entender como cada conceito é aplicado na prática.

---

### Como usar

Você pode clonar este repositório para estudar os exemplos localmente. Basta abrir os arquivos em seu editor de código preferido e rodar os scripts em um ambiente Node.js ou no navegador, dependendo do exemplo.

## Transpilador

### 📋 Pré-requisitos

* [Node.js](https://nodejs.org/) (para rodar o transpilador)
* [Rust & Cargo](https://www.rust-lang.org/tools/install) (para compilar o código gerado)

### 🚀 Instalação

1.  **Clone o repositório:**
    ```bash
    git clone https://github.com/JMarcelooo/Compiladores
    cd Compiladores/Transpilador
    ```

2.  **Instale as dependências:**
    O projeto utiliza o parser do Babel.
    ```bash
    npm install
    ```

### 🛠️ Como usar

A ferramenta funciona via linha de comando (CLI). O repositório disponibiliza alguns arquivos de exemplo, localizados em `Compiladores/Transpilador/exemplos/`

1. **Transpile o código**
    ```bash
    node transpilador.js <endereco_arquivo_entrada> <endereco_arquivo_saida>
    ```
- Isso irá gerar dois arquivos na pasta:
    - `nome_do_seu_arquivo.rs`: O código transpilado.
    - `runtime.rs`: A biblioteca interna necessária pra rodar o código.

2. **Compile e Execute (Rust)**
    ```bash
    #Compilar
    rustc nome_do_seu_arquivo.rs

    #Executar (Linux/Mac)
    ./nome_do_seu_arquivo

    #Executar (Windows)
    .\nome_do_seu_arquivo.exe
    ```

### ✨ Funcionalidades Suportadas
* ✅ Variáveis (let, const) e Tipos Primitivos

* ✅ Operações Matemáticas e Lógicas

* ✅ Estruturas de Controle (if, while, for)

* ✅ Funções e Arrow Functions

* ✅ Arrays e Objetos

* ✅ console.log, prompt (basic), setTimeout


