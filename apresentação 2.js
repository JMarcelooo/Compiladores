// --- TIPOS DE DADOS ---

// Tipos Primitivos
let idade = 25; //Number
let nome = "Maria"; //String
let ativo = true; //Boolean
let projeto = null; //Null
let tarefa; //Undefined

//Tipo composto (objeto);
let pessoa = {
    nome: "Carlos",
    idade: 30
};


//Array (um tipo de objeto) - dinâmico
let tecnologias = ["JavaScript", "WebWorkers"];
tecnologias.push("SharedArrayBuffer"); // Vetor é dinâmico

console.log(`A tecnologia principal é ${tecnologias[0]}`); // Acesso por índice numérico

// --- PONTEIRO E REFERENCIAS ---

//Passagem por VALOR (primitivos)

let a = 10;
let b = a; // 'b' é uma cópia de 'a'
b = 20;
console.log(`a = ${a}, b = ${b}`);

// Passagem por Referência (objetos)
let objA = {valor:10};
let objB = objA // 'objB' aponta para o MESMO objeto que 'objA'
objB.valor = 20
console.log(`objA.valor = ${objA.valor}, objB.valor = ${objB.valor}`)


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


// --- EXPRESSOES ---

let resultado1 = 5 + 2 * 10;
let resultado2 = (5 + 2) * 10;

console.log(`Resultado 1: ${resultado1}`);
console.log(`Resultado 2: ${resultado2}`);

// --- Estrutura de controle ---

//condicional if else

let temperatura = 25;
if (temperatura > 30){
    console.log("Está calor!");
} else {
    console.log("Temperatura agradável");
}

// Repetição (for ... of)

let numeros = [10,20,30];
console.log("iterando sobre o array");

for (const numero of numeros){
    console.log(numero);
}