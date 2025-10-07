// ----eventos.js ---

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