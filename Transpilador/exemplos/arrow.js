/**
 * Exemplo de Código JavaScript Focado em Arrow Functions (Funções de Seta)
 *
 * As Arrow Functions (=>) são uma forma mais curta de escrever funções em JavaScript,
 * além de terem um comportamento diferente com a palavra-chave 'this'.
 */

// --- 1. FUNÇÃO CLÁSSICA (Comparação) ---
function somaClassica(a, b) {
  return a + b;
}
console.log(`Função Clássica (10 + 5): ${somaClassica(10, 5)}`);


// --- 2. FORMATO BÁSICO DA ARROW FUNCTION ---
// Sintaxe: const nomeDaFuncao = (parametros) => { corpo da função }
const soma = (a, b) => {
  return a + b;
};
console.log(`Arrow Function Básica (20 + 7): ${soma(20, 7)}`);


// --- 3. RETORNO IMPLÍCITO (Implicit Return) ---
// Se a função tem APENAS uma expressão 'return', as chaves {} e a palavra 'return' podem ser omitidas.
// (Muito usado para funções curtas e que só calculam algo)
const subtrai = (a, b) => a - b;
console.log(`Arrow Function com Retorno Implícito (30 - 3): ${subtrai(30, 3)}`);


// --- 4. SEM PARÂMETROS ---
// Requer parênteses vazios ()
const saudacao = () => "Olá! Este é um exemplo de função sem parâmetros.";
console.log(`Arrow Function sem Parâmetros: ${saudacao()}`);


// --- 5. COM APENAS UM PARÂMETRO ---
// Os parênteses () ao redor do único parâmetro podem ser omitidos.
const quadrado = numero => numero * numero;
console.log(`Arrow Function com 1 Parâmetro (5²): ${quadrado(5)}`);


// --- 6. RETORNANDO UM OBJETO LITERAL (Cuidado com a Sintaxe!) ---
// Para retornar um objeto diretamente (retorno implícito), o objeto DEVE ser envolto em parênteses ().
const criarUsuario = (nome, idade) => ({
  nomeCompleto: nome,
  idadeAnos: idade,
  status: "Ativo"
});
const novoUsuario = criarUsuario("Alice", 28);
console.log("Arrow Function retornando Objeto:", novoUsuario);


// --- 7. USANDO EM MÉTODOS DE ARRAY (Onde Brilham) ---
const numeros = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

