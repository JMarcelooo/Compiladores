// --- PALAVRAS-CHAVE E VARIAVEIS ---

function escopoExemplo() {
    if (true) {
        var nomeVar = "Sou visível em toda função";
        let nomeLet = "Sou visível apenas nesse bloco";
        const PI = 3.14;
    }

    console.log(nomeVar); // Funciona
    //console.log(nomeLet); Erro!
}

escopoExemplo();

//let for = "erro"; Erro de sintaxe, 'for' é uma palavra reservada.

