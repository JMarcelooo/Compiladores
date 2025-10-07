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
