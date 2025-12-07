// 1. Definição do Array de Produtos (Objetos)
const carrinho = [
    { nome: "Notebook Dell", preco: 4500.00, quantidade: 1 },
    { nome: "Mouse sem fio", preco: 79.90, quantidade: 2 },
    { nome: "Teclado Mecânico", preco: 250.50, quantidade: 1 },
    { nome: "Monitor 27''", preco: 1200.00, quantidade: 1 }
];

// 2. Definição da Função de Cálculo
/**
 * Calcula o valor total dos itens no carrinho e aplica um desconto.
 * @param {Array<Object>} itens - O array de produtos no carrinho.
 * @param {number} percentualDesconto - A taxa de desconto a ser aplicada (ex: 0.10 para 10%).
 * @returns {Object} Um objeto com o subtotal, valor do desconto e total final.
 */
function calcularTotal(itens, percentualDesconto) {
    let subtotal = 0;

    // Itera sobre cada item no array e calcula o subtotal
    itens.forEach(item => {
        // Cálculo: preco * quantidade
        const valorItem = item.preco * item.quantidade;
        subtotal += valorItem;
    });

    // Calcula o desconto e o total final
    const valorDesconto = subtotal * percentualDesconto;
    const totalFinal = subtotal - valorDesconto;

    return {
        subtotal: subtotal,
        descontoAplicado: valorDesconto,
        totalFinal: totalFinal
    };
}

// --- Exemplo de Uso ---

// Definindo uma taxa de desconto de 10%
const taxaDesconto = 0.10; 

// Chamada da função
const resumo = calcularTotal(carrinho, taxaDesconto);

// Exibição dos resultados formatados
console.log("=== Resumo do Carrinho ===");
console.log(`Subtotal dos Itens: R$ ${resumo.subtotal.toFixed(2)}`);
console.log(`Desconto (${(taxaDesconto * 100).toFixed(0)}%): R$ ${resumo.descontoAplicado.toFixed(2)}`);
console.log("---------------------------");
console.log(`Total a Pagar: R$ ${resumo.totalFinal.toFixed(2)}`);