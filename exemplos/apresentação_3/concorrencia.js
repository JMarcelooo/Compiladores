// ----concorrencia.js ---

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
