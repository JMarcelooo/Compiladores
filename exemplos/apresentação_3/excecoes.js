// ----excecoes.js ---

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