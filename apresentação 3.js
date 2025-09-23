// --- 6-subprogramas.js ---

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


// --- 7-concorrencia.js ---

// 1. Programação Assíncrona com async/await
const buscarDados = () => new Promise(resolve => setTimeout(() => resolve("Dados recebidos!"), 1000));

async function main() {
  console.log("Iniciando busca de dados...");
  const dados = await buscarDados(); // Pausa a função main, mas não a aplicação
  console.log(dados);
}

main();
console.log("Essa mensagem aparece antes dos dados, pois main não bloqueia a execução.");

// 2. Sincronização com Atomics (Exemplo conceitual)
// Este código seria executado em um Worker com um buffer compartilhado
// const sharedBuffer = new SharedArrayBuffer(4);
// const sharedArray = new Int32Array(sharedBuffer);

// Atomics.add(sharedArray, 0, 1); // Adiciona 1 na posição 0 de forma atômica
// console.log(Atomics.load(sharedArray, 0)); // Lê o valor de forma atômica


// --- 8-excecoes.js ---

function dividir(a, b) {
  if (b === 0) {
    // Lançando uma nova exceção
    throw new Error("Divisão por zero não é permitida!");
  }
  return a / b;
}

try {
  console.log("Tentando dividir 10 por 2...");
  const resultado = dividir(10, 2);
  console.log(`Resultado: ${resultado}`);

  console.log("\nTentando dividir 10 por 0...");
  dividir(10, 0); // Esta linha vai gerar uma exceção

} catch (erro) {
  // Capturando e tratando a exceção
  console.error(`Erro capturado: ${erro.message}`);
} finally {
  // Este bloco sempre executa
  console.log("\nBloco de tratamento finalizado.");
}

// --- 9-eventos.js ---

// Exemplo genérico com Timer (funciona em qualquer ambiente JS)
console.log("Um evento será disparado em 2 segundos...");

setTimeout(() => {
  // Esta função é o 'event handler' para o evento de 'timeout'
  console.log("Evento de timer disparado!");
}, 2000); // 2000 milissegundos


// Exemplo de como seria em um navegador (adicionar a um arquivo HTML)
/*
const botao = document.getElementById('meuBotao');

// Adicionando um 'ouvinte' para o evento de clique
botao.addEventListener('click', () => {
  console.log('Botão foi clicado!');
});
*/