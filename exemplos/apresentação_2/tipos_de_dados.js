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
