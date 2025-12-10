module.exports = {
    BlockStatement(node, transpiler) {
        transpiler.indentLevel++;
        const lines = node.body.map(stmt => {
            const code = transpiler.visit(stmt);
            const needsSemi = !['IfStatement', 'FunctionDeclaration', 'WhileStatement', 'ForStatement', 'TryStatement'].includes(stmt.type);
            return `${transpiler.getIndent()}${code}${needsSemi ? ';' : ''}`;
        });
        transpiler.indentLevel--;
        return `{\n${lines.join('\n')}\n${transpiler.getIndent()}}`; 
    },

    ExpressionStatement(node, transpiler) {
        return transpiler.visit(node.expression);
    },
    
    IfStatement(node, transpiler) {
        const test = transpiler.visit(node.test);
        const consequent = transpiler.visit(node.consequent);
        let alternate = '';
        if (node.alternate) {
            const altCode = transpiler.visit(node.alternate);
            alternate = ` else ${altCode}`;
        }
        return `if rt::is_truthy(&${test}) ${consequent}${alternate}`;
    },

    WhileStatement(node, transpiler) {
        const test = transpiler.visit(node.test);
        const body = transpiler.visit(node.body); 
        return `while rt::is_truthy(&${test}) ${body}`;
    },

    ForStatement(node, transpiler) {
        const init = node.init ? transpiler.visit(node.init) + ';' : '';
        const test = node.test ? transpiler.visit(node.test) : 'rt::new_bool(true)';
        const update = node.update ? transpiler.visit(node.update) + ';' : '';
        const bodyContent = transpiler.visit(node.body);
        
        let loopBody = bodyContent;
        if (update) {
            if (loopBody.trim().endsWith('}')) {
                const lastBraceIndex = loopBody.lastIndexOf('}');
                loopBody = loopBody.substring(0, lastBraceIndex) + 
                           `\n${transpiler.getIndent()}${update}\n}`;
            } else {
                loopBody = `{\n${loopBody}\n${update}\n}`;
            }
        }
        return `\n${transpiler.getIndent()}{\n${transpiler.getIndent()}${init}\n${transpiler.getIndent()}while rt::is_truthy(&${test}) ${loopBody}\n${transpiler.getIndent()}}`;
    },

    ReturnStatement(node, transpiler) {
        const arg = node.argument ? transpiler.visit(node.argument) : 'rt::new_undefined()';
        return `return ${arg}`;
    },

    TryStatement(node, transpiler) {
        const tryBlock = transpiler.visit(node.block);
        let catchBlock = "";
        if (node.handler) {
             const paramName = node.handler.param ? node.handler.param.name : 'err';
             const handlerBody = transpiler.visit(node.handler.body);
             catchBlock = `
    if false {
        let ${paramName} = rt::new_str("Error");
${handlerBody}
    }`;
        }
        return `${tryBlock}\n${catchBlock}`;
    },

    ThrowStatement(node, transpiler) {
        const arg = transpiler.visit(node.argument);
        return `panic!("Throw: {}", ${arg})`;
    }
};