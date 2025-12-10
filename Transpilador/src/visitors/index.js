const literals = require('./literals');
const declarations = require('./declarations');
const statements = require('./statements');
const expressions = require('./expressions');

module.exports = {
    ...literals,
    ...declarations,
    ...statements,
    ...expressions,

    File(node, transpiler) {
        return transpiler.visit(node.program);
    },
    
    Program(node, transpiler) {
        return node.body.map(n => transpiler.visit(n)).join('\n');
    }
};