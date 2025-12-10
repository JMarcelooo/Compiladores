const visitorRegistry = require('../visitors/index');
const Context = require('./Context');

class RustTranspiler {
    constructor() {
        this.context = new Context();
        this.visitors = visitorRegistry;
    }

    getIndent() {
        return this.context.getWhitespace();
    }
    get indentLevel() {
        return this.context.indentLevel;
    }

    set indentLevel(val) {
        this.context.indentLevel = val;
    }

    visit(node) {
        if (!node) return 'rt::new_undefined()';
        const handler = this.visitors[node.type];
        if (handler) {
            return handler(node, this);
        }
        console.warn(`⚠️ Nó não suportado: ${node.type}`);
        return `/* TODO: ${node.type} */ rt::new_undefined()`;
    }

    processAst(programNode) {
        if (!programNode || !programNode.body) return "";
        
        programNode.body.forEach(stmt => {
            const code = this.visit(stmt);
            if (stmt.type === 'FunctionDeclaration') {
                this.context.pushFunction(code);
            } else {
                this.context.pushMain(code);
            }
        });
        return this.generateFinalCode();
    }

    generateFinalCode() {
        
        return [
            "// Gerado por Transpilador JS->Rust",
            "mod runtime;", 
            "use runtime as rt;", 
            "use runtime::JsVar;", 
            "",
            "fn main() {",
            ...this.context.functionCode.map(l => "    " + l),
            ...this.context.mainCode.map(l => "    " + l),
            "    rt::pause();",
            "}"
        ].join('\n');
    }

    generateRawClosure(node) {
        const body = this.generateFunctionBody(node.body, node.params);
        return `|args: Vec<JsVar>| -> JsVar ${body}`;
    }

    generateFunctionBody(bodyNode, params) {
        const argMapping = params.map((p, i) => {
            return `let ${p.name} = args.get(${i}).unwrap_or(&rt::new_undefined()).clone();`;
        }).join('\n    ');

        let bodyContent = "";
        
        if (bodyNode.type === 'BlockStatement') {
            this.indentLevel++; 
            
            const stmts = bodyNode.body.map(stmt => {
               const code = this.visit(stmt);
               const needsSemi = !['IfStatement', 'FunctionDeclaration', 'WhileStatement', 'ForStatement', 'TryStatement'].includes(stmt.type);
               return `${this.getIndent()}${code}${needsSemi ? ';' : ''}`;
            }).join('\n');
            
            this.indentLevel--; 
            
            const lastStmt = bodyNode.body[bodyNode.body.length - 1];
            const hasReturn = lastStmt && lastStmt.type === 'ReturnStatement';
            const finalReturn = hasReturn ? '' : `\n${this.getIndent()}rt::new_undefined()`;

            bodyContent = `{\n    ${argMapping}\n${stmts}${finalReturn}\n}`;
        } else {
            const retVal = this.visit(bodyNode);
            bodyContent = `{\n    ${argMapping}\n    return ${retVal};\n}`;
        }
        return bodyContent;
    }
}

module.exports = RustTranspiler;