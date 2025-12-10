
const fruta = "banana";
let mensagem;

switch (fruta) {
    case "maçã":
        mensagem = "Maçãs são ótimas para tortas.";
        break;
    case "banana":
        mensagem = "Bananas são ricas em potássio e fáceis de carregar.";
        break;
    case "laranja":
        mensagem = "Laranjas são cheias de vitamina C.";
        break;
    default:
        mensagem = `Não tenho uma informação específica sobre ${fruta}.`;
        break;
}

console.log(`A fruta é ${fruta}: ${mensagem}`);