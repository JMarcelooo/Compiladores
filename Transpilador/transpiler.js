/**
 * transpilador.js
 * * Um transpilador simples de JavaScript para Rust.
 * Suporta: Variáveis, Funções (Async/Sync), Arrow Functions, Await,
 * If/Else, Loops, Operações Matemáticas e console.log.
 * * Uso: node transpilador.js <input.js> <output.rs>
 */

const fs = require('fs');
const parser = require('@babel/parser');

// ==========================================
// CONFIGURAÇÃO E UTILITÁRIOS
// ==========================================

const TIPO_PADRAO_NUMERO = 'f64'; // Rust exige tipos explícitos
const TIPO_PADRAO_STRING = 'String';

// Mapeamento de operadores JS para Rust
const MAPA_OPERADORES = {
    '+': '+', '-': '-', '*': '*', '/': '/', '%': '%',
    '===': '==', '==': '==', '!==': '!=', '!=': '!=',
    '>': '>', '<': '<', '>=': '>=', '<=': '<=',
    '&&': '&&', '||': '||', '=': '='
};

// ==========================================
// CLASSE DO TRANSPLIADOR
// ==========================================

class RustTranspiler {
    constructor() {
        this.output = [];
        this.indentLevel = 0;
        // Armazena funções declaradas para não colocá-las dentro da main
        this.functionCode = []; 
        // Armazena código que deve ir para a função main
        this.mainCode = [];
        // Flag para saber se estamos processando uma função ou o escopo global
        this.inFunction = false;
    }

    // Gera a indentação atual
    getIndent() {
        return '    '.repeat(this.indentLevel);
    }

    // Método principal que despacha o nó para a função correta
    visit(node) {
        if (!node) return '';

        switch (node.type) {
            case 'File': return this.visit(node.program);
            case 'Program': return this.visitProgram(node);
            
            // Declarações
            case 'VariableDeclaration': return this.visitVariableDeclaration(node);
            case 'FunctionDeclaration': return this.visitFunctionDeclaration(node);
            
            // Controle de Fluxo
            case 'IfStatement': return this.visitIfStatement(node);
            case 'WhileStatement': return this.visitWhileStatement(node);
            case 'ForStatement': return this.visitForStatement(node);
            case 'ReturnStatement': return this.visitReturnStatement(node);
            case 'BlockStatement': return this.visitBlockStatement(node);
            case 'ExpressionStatement': return this.visitExpressionStatement(node);

            // Expressões
            case 'BinaryExpression': return this.visitBinaryExpression(node);
            case 'LogicalExpression': return this.visitBinaryExpression(node); // Estrutura igual
            case 'CallExpression': return this.visitCallExpression(node);
            case 'MemberExpression': return this.visitMemberExpression(node);
            case 'UpdateExpression': return this.visitUpdateExpression(node);
            case 'AssignmentExpression': return this.visitAssignmentExpression(node);
            
            // --- NOVOS CASOS ADICIONADOS ---
            case 'ArrowFunctionExpression': return this.visitArrowFunctionExpression(node);
            case 'AwaitExpression': return this.visitAwaitExpression(node);

            // Literais e Identificadores
            case 'NumericLiteral': return this.visitNumericLiteral(node);
            case 'StringLiteral': return this.visitStringLiteral(node);
            case 'BooleanLiteral': return node.value.toString();
            case 'Identifier': return node.name;

            default:
                // console.warn(`⚠️ Nó ignorado: ${node.type}`);
                return `/* TODO: Implementar ${node.type} */`;
        }
    }

    // --- 1. ESTRUTURA GERAL ---

    visitProgram(node) {
        node.body.forEach(statement => {
            const code = this.visit(statement);
            
            // Se for uma declaração de função, vai para o escopo global fora da main
            if (statement.type === 'FunctionDeclaration') {
                this.functionCode.push(code);
            } else {
                // Qualquer outra coisa solta vai para dentro da main()
                if (code) this.mainCode.push(this.getIndent() + code + (this.needsSemicolon(statement.type) ? ';' : ''));
            }
        });

        // Monta o arquivo final
        return [
            "// Gerado pelo Transpilador JS -> Rust",
            "",
            ...this.functionCode,
            "",
            "#[tokio::main] // Necessário para async/await (requer crate tokio)",
            "async fn main() {", // Main transformada em async para suportar awaits globais
            ...this.mainCode.map(line => "    " + line),
            "}"
        ].join('\n');
    }

    needsSemicolon(type) {
        return ['VariableDeclaration', 'ExpressionStatement', 'ReturnStatement', 'CallExpression', 'AssignmentExpression', 'UpdateExpression'].includes(type);
    }

    // --- 2. DECLARAÇÕES ---

    visitVariableDeclaration(node) {
        const declaration = node.declarations[0];
        const name = declaration.id.name;
        const init = this.visit(declaration.init);
        
        // Inferência de tipo básica
        let rustType = TIPO_PADRAO_NUMERO; 
        if (declaration.init) {
            if (declaration.init.type === 'StringLiteral') rustType = 'String';
            if (declaration.init.type === 'BooleanLiteral') rustType = 'bool';
            // Se for CallExpression com await, tenta inferir (difícil sem análise semântica profunda)
            if (declaration.init.type === 'AwaitExpression') rustType = TIPO_PADRAO_NUMERO; // Chute
        }

        const keyword = node.kind === 'const' ? 'let' : 'let mut';
        return `${keyword} ${name}: ${rustType} = ${init}`;
    }

    visitFunctionDeclaration(node) {
        const name = node.id.name;
        this.inFunction = true;
        
        const args = node.params.map(p => `${p.name}: ${TIPO_PADRAO_NUMERO}`).join(', ');
        const retType = ` -> ${TIPO_PADRAO_NUMERO}`; 
        const body = this.visitBlockStatement(node.body);
        
        // --- ATUALIZADO: Suporte a Async ---
        const asyncKeyword = node.async ? 'async ' : '';
        
        this.inFunction = false;
        return `${asyncKeyword}fn ${name}(${args})${retType} ${body}`;
    }

    // --- 3. CONTROLE DE FLUXO ---

    visitBlockStatement(node) {
        this.indentLevel++;
        const lines = node.body.map(stmt => {
            const code = this.visit(stmt);
            const semi = this.needsSemicolon(stmt.type) ? ';' : '';
            return `${this.getIndent()}${code}${semi}`;
        });
        this.indentLevel--;
        return `{\n${lines.join('\n')}\n${this.getIndent()}}`;
    }

    visitIfStatement(node) {
        const test = this.visit(node.test);
        const consequent = this.visit(node.consequent);
        let alternate = '';
        
        if (node.alternate) {
            const altCode = this.visit(node.alternate);
            if (node.alternate.type === 'IfStatement') {
                 alternate = ` else ${altCode}`;
            } else {
                 alternate = ` else ${altCode}`;
            }
        }

        return `if ${test} ${consequent}${alternate}`;
    }

    visitWhileStatement(node) {
        const test = this.visit(node.test);
        const body = this.visit(node.body);
        return `while ${test} ${body}`;
    }

    visitForStatement(node) {
        // Abordagem genérica: converter for loop C-style para bloco while em Rust
        const init = node.init ? this.visit(node.init) + ';' : '';
        const test = node.test ? this.visit(node.test) : 'true';
        const update = node.update ? this.visit(node.update) + ';' : '';
        const bodyContent = this.visit(node.body); 
        
        const innerBody = bodyContent.slice(1, -1); // remove { e }
        
        return `{\n${this.getIndent()}    ${init}\n${this.getIndent()}    while ${test} {${innerBody}\n${this.getIndent()}        ${update}\n${this.getIndent()}    }\n${this.getIndent()}}`;
    }

    visitReturnStatement(node) {
        const argument = node.argument ? this.visit(node.argument) : '';
        return `return ${argument}`;
    }

    visitExpressionStatement(node) {
        return this.visit(node.expression);
    }

    // --- 4. EXPRESSÕES ---

    visitBinaryExpression(node) {
        const left = this.visit(node.left);
        const right = this.visit(node.right);
        const operator = MAPA_OPERADORES[node.operator] || node.operator;
        return `${left} ${operator} ${right}`;
    }

    visitUpdateExpression(node) {
        const arg = this.visit(node.argument);
        if (node.operator === '++') return `${arg} += 1.0`;
        if (node.operator === '--') return `${arg} -= 1.0`;
        return `${arg} ${node.operator}`; 
    }

    visitAssignmentExpression(node) {
        const left = this.visit(node.left);
        const right = this.visit(node.right);
        return `${left} = ${right}`;
    }

    visitCallExpression(node) {
        // Lógica especial para métodos funcionais de array (.map, .filter)
        if (node.callee.type === 'MemberExpression') {
            const method = node.callee.property.name;
            const obj = this.visit(node.callee.object);
            
            if (['map', 'filter'].includes(method)) {
                const args = node.arguments.map(arg => this.visit(arg)).join(', ');
                // Transforma lista.map(x => x) em lista.iter().map(|x| x).collect::<Vec<_>>()
                return `${obj}.iter().${method}(${args}).collect::<Vec<_>>()`
            }
        }

        const callee = this.visit(node.callee);
        const args = node.arguments.map(arg => this.visit(arg));

        // Caso especial: console.log -> println!
        if (callee === 'console.log') {
            const formatStr = args.map(() => '{}').join(' ');
            if (args.length > 0) {
                return `println!("${formatStr}", ${args.join(', ')})`;
            } else {
                return `println!("")`;
            }
        }

        return `${callee}(${args.join(', ')})`;
    }

    visitMemberExpression(node) {
        const obj = this.visit(node.object);
        const prop = node.property.name; 
        
        if (obj === 'console' && prop === 'log') return 'console.log';
        
        return `${obj}.${prop}`;
    }

    visitNumericLiteral(node) {
        let val = node.value.toString();
        if (!val.includes('.')) val += '.0'; // Força float
        return val;
    }

    visitStringLiteral(node) {
        return `String::from("${node.value}")`;
    }

    // --- NOVO: Arrow Functions ---
    visitArrowFunctionExpression(node) {
        const args = node.params.map(p => p.name).join(', ');
        
        let body = '';
        if (node.body.type === 'BlockStatement') {
            body = this.visitBlockStatement(node.body);
        } else {
            body = this.visit(node.body);
        }
        
        // 'move' é frequentemente necessário para async/closures
        return `move |${args}| ${body}`;
    }

    // --- NOVO: Await ---
    visitAwaitExpression(node) {
        const argument = this.visit(node.argument);
        // JS: await promise -> Rust: promise.await
        return `${argument}.await`;
    }
}

// ==========================================
// EXECUÇÃO
// ==========================================

function main() {
    const args = process.argv.slice(2);
    if (args.length < 2) {
        console.error("❌ Uso: node transpilador.js <arquivo_entrada.js> <arquivo_saida.rs>");
        process.exit(1);
    }

    const inputFile = args[0];
    const outputFile = args[1];

    try {
        const jsCode = fs.readFileSync(inputFile, 'utf8');
        
        // 1. Parse (Gera AST)
        // Nota: Adicionamos plugins para garantir suporte a sintaxe moderna
        const ast = parser.parse(jsCode, {
            sourceType: 'module',
            plugins: ['typescript', 'asyncGenerators', 'bigInt', 'classProperties', 'classPrivateProperties', 'classPrivateMethods']
        });

        // 2. Transpile (AST -> Rust)
        const transpiler = new RustTranspiler();
        const rustCode = transpiler.visit(ast);

        // 3. Write (Salva arquivo)
        fs.writeFileSync(outputFile, rustCode);
        
        console.log(`✅ Transpilação concluída! Arquivo salvo em: ${outputFile}`);
        
    } catch (err) {
        console.error("❌ Erro durante a transpilação:", err.message);
    }
}

main();