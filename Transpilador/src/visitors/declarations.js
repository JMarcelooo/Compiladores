module.exports = {
    VariableDeclaration(node, transpiler) {
        const decl = node.declarations[0];
        const name = decl.id.name;
        const init = decl.init ? transpiler.visit(decl.init) : 'rt::new_undefined()';
        return `let ${name} = ${init}`;
    },

    FunctionDeclaration(node, transpiler) {
        const name = node.id.name;
        const body = transpiler.generateFunctionBody(node.body, node.params);
        return `let ${name} = rt::new_func(move |args: Vec<JsVar>| -> JsVar ${body});`;
    }
};