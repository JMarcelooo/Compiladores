const fs = require('fs');
const path = require('path');
const parser = require('@babel/parser');
const RustTranspiler = require('./src/core/Transpiler');
const RUST_RUNTIME = require('./src/templates/runtime');

function main() {
    const args = process.argv.slice(2);
    if (args.length < 2) {
        console.error("❌ Use: node index.js <input.js> <output.rs>");
        process.exit(1);
    }
    
    const inputPath = args[0];
    const outputPath = args[1];
    const outputDir = path.dirname(outputPath);

    try {
        const jsCode = fs.readFileSync(inputPath, 'utf8');
        
        const ast = parser.parse(jsCode, { 
            sourceType: 'module', 
            plugins: ['asyncGenerators'] 
        });


        const transpiler = new RustTranspiler();
        const rustCode = transpiler.processAst(ast.program);
        

        fs.writeFileSync(outputPath, rustCode);
        fs.writeFileSync(path.join(outputDir, 'runtime.rs'), RUST_RUNTIME);
        
        console.log(`✅ Sucesso! Compilado para: ${outputPath}`);
        
    } catch (err) {
        console.error("❌ Erro:", err.stack); 
    }
}

main();