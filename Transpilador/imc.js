/**
 * Função para calcular o Índice de Massa Corporal (IMC).
 * O IMC é calculado pela fórmula: peso / (altura * altura)
 * @param {number} peso - O peso da pessoa em quilogramas (kg).
 * @param {number} altura - A altura da pessoa em metros (m).
 * @returns {number} O valor do IMC.
 */
function calcularIMC(peso, altura) {
    // Verifica se os inputs são números válidos e positivos
    if (typeof peso !== 'number' || typeof altura !== 'number' || peso <= 0 || altura <= 0) {
        return "Erro: Peso e altura devem ser números positivos.";
    }

    // Calcula a altura ao quadrado (altura * altura)
    const alturaAoQuadrado = altura * altura;
    
    // Calcula e retorna o IMC
    const imc = peso / alturaAoQuadrado;
    return imc;
}

// --- Exemplo de Uso ---

// Dados de entrada
const peso = 75; // 75 kg
const altura = 1.75; // 1.75 metros

// Chamada da função
const resultadoIMC = calcularIMC(peso, altura);

// Exibição do resultado
console.log(`Peso: ${peso} kg`);
console.log(`Altura: ${altura} m`);

if (typeof resultadoIMC === 'number') {
    // .toFixed(2) limita o número a duas casas decimais
    console.log(`Seu IMC é: ${resultadoIMC.toFixed(2)}`);

    // Um exemplo simples de classificação
    if (resultadoIMC < 18.5) {
        console.log("Classificação: Abaixo do peso.");
    } else if (resultadoIMC >= 18.5 && resultadoIMC <= 24.9) {
        console.log("Classificação: Peso normal.");
    } else {
        console.log("Classificação: Sobrepeso ou obesidade.");
    }
} else {
    console.log(resultadoIMC); // Exibe a mensagem de erro se houver
}