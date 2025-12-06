// 1. Função que simula uma chamada a uma API (operação assíncrona)
/**
 * Simula a busca de dados de um usuário após um pequeno atraso.
 * @param {number} userId - O ID do usuário a ser buscado.
 * @returns {Promise<Object>} Uma Promise que resolve para um objeto de usuário.
 */
function buscarDadosUsuario(userId) {
    console.log(`Buscando dados para o ID ${userId}...`);

    // Retorna uma Promise que resolve após 1 segundo (simulando latência de rede)
    return new Promise((resolve) => {
        setTimeout(() => {
            const dados = {
                1: { nome: "Alice", status: "Ativa", ultimoLogin: "2025-11-20" },
                2: { nome: "Bob", status: "Inativo", ultimoLogin: "2025-05-15" },
                3: { nome: "Charlie", status: "Ativa", ultimoLogin: "2025-11-24" }
            };
            
            // Resolve a Promise com os dados do usuário correspondente
            if (dados[userId]) {
                resolve(dados[userId]);
            } else {
                // Em um cenário real, você rejeitaria a Promise para lidar com erros
                resolve({ nome: "Usuário Não Encontrado", status: "Erro" });
            }
        }, 1000); // Atraso de 1000 milissegundos (1 segundo)
    });
}

// 2. Função assíncrona que orquestra a chamada
/**
 * Função principal que usa await para esperar o resultado da Promise.
 */
async function carregarRelatorio() {
    console.log("Iniciando carregamento do relatório...");

    try {
        // O 'await' pausa a execução da função 'carregarRelatorio'
        // até que a Promise retornada por 'buscarDadosUsuario(1)' seja resolvida.
        const usuario1 = await buscarDadosUsuario(1);
        console.log(`\n✅ Dados do Usuário 1 (Alice) carregados:`);
        console.log(usuario1);

        // A próxima busca só começa depois que a primeira termina.
        const usuario2 = await buscarDadosUsuario(2);
        console.log(`\n✅ Dados do Usuário 2 (Bob) carregados:`);
        console.log(usuario2);

    } catch (error) {
        // Se a Promise for rejeitada em 'buscarDadosUsuario', o 'catch' é executado.
        console.error("❌ Ocorreu um erro no carregamento:", error);
    }
    
    console.log("\nCarregamento do relatório concluído!");
}

// Execução da função principal
carregarRelatorio();