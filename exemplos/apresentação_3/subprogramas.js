// ----subprogramas.js ---

// Declaração Padrão
function somar(a, b) {
  return a + b;
}

// Expressão de Função (Lambda / Arrow Function)
const multiplicar = (a, b) => a * b;

// Delegate (usando uma função como callback)
function calcular(a, b, operacao) {
  return operacao(a, b);
}
console.log(`Resultado do delegate: ${calcular(10, 5, multiplicar)}`);

// Co-rotina (Generator Function)
function* contador() {
  yield 1; // Pausa a execução e retorna 1
  yield 2; // Pausa a execução e retorna 2
  return 3;
}

const gen = contador();
console.log(`Co-rotina (yield 1): ${gen.next().value}`);
console.log(`Co-rotina (yield 2): ${gen.next().value}`);