const { toRustFloat } = require('../utils/formatters'); 
module.exports = {
    NumericLiteral(node) {
        let val = node.value.toString();
        if (!val.includes('.')) val += '.0';
        return `rt::new_num(${toRustFloat(node.value)})`;
    },

    StringLiteral(node) {
        return `rt::new_str("${node.value}")`;
    },

    BooleanLiteral(node) {
        return `rt::new_bool(${node.value})`;
    },

    TemplateLiteral(node, transpiler) {
        let formatStr = "";
        let args = [];
        node.quasis.forEach((quasi, i) => {
            formatStr += quasi.value.raw;
            if (!quasi.tail) {
                formatStr += "{}"; 
                args.push(transpiler.visit(node.expressions[i]));
            }
        });
        const argsFormatted = args.map(a => `&${a}.borrow()`).join(', ');
        if (args.length > 0) return `rt::new_str(&format!("${formatStr}", ${argsFormatted}))`;
        return `rt::new_str("${formatStr}")`;
    }
};