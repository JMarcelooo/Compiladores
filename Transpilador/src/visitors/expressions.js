const { toRustVec } = require('../utils/formatters');
module.exports = {
    Identifier(node) {
        return `${node.name}.clone()`;
    },

    ArrayExpression(node, transpiler) {
        const elements = node.elements.map(el => transpiler.visit(el));
        return `rt::new_array(${toRustVec(elements)})`;
    },

    ObjectExpression(node, transpiler) {
        const props = node.properties.map(prop => {
            const key = prop.key.name || prop.key.value;
            const val = transpiler.visit(prop.value);
            return `("${key}".to_string(), ${val})`;
        }).join(', ');
        return `rt::new_object(vec![${props}])`;
    },

    BinaryExpression(node, transpiler) {
        const left = transpiler.visit(node.left);
        const right = transpiler.visit(node.right);
        
        switch (node.operator) {
            case '+': return `rt::add(&${left}, &${right})`;
            case '-': return `rt::sub(&${left}, &${right})`;
            case '*': return `rt::mul(&${left}, &${right})`;
            case '/': return `rt::div(&${left}, &${right})`;
            case '>': return `rt::new_bool(rt::gt(&${left}, &${right}))`;
            case '>=': return `rt::new_bool(rt::gte(&${left}, &${right}))`;
            case '<': return `rt::new_bool(rt::lt(&${left}, &${right}))`;
            case '<=': return `rt::new_bool(rt::lte(&${left}, &${right}))`;
            case '==': case '===': return `rt::new_bool(rt::eq(&${left}, &${right}))`;
            case '!=': case '!==': return `rt::new_bool(rt::neq(&${left}, &${right}))`;
            default: return `rt::new_undefined()`;
        }
    },

    LogicalExpression(node, transpiler) {
        const left = transpiler.visit(node.left);
        const right = transpiler.visit(node.right);
        if (node.operator === '&&') return `rt::new_bool(rt::and(&${left}, &${right}))`;
        if (node.operator === '||') return `rt::new_bool(rt::or(&${left}, &${right}))`;
        return `rt::new_undefined()`;
    },

    UnaryExpression(node, transpiler) {
        const arg = transpiler.visit(node.argument);
        if (node.operator === '!') return `rt::new_bool(rt::not(&${arg}))`;
        if (node.operator === 'typeof') return `rt::typeof_js(&${arg})`;
        if (node.operator === '-') return `rt::sub(&rt::new_num(0.0), &${arg})`;
        return `rt::new_undefined()`;
    },

    MemberExpression(node, transpiler) {
        const obj = transpiler.visit(node.object);
        const prop = node.property.name || node.property.value; 
        if (node.computed && node.property.type !== 'StringLiteral' && node.property.type !== 'NumericLiteral') {
             return `rt::new_undefined()`;
        }
        return `rt::get(&${obj}, "${prop}")`;
    },

    AssignmentExpression(node, transpiler) {
        const right = transpiler.visit(node.right);
        if (node.left.type === 'MemberExpression') {
            const obj = transpiler.visit(node.left.object);
            const prop = node.left.property.name || node.left.property.value;
            return `rt::set(&${obj}, "${prop}", &${right})`;
        }
        if (node.left.type === 'Identifier') {
            const name = node.left.name;
            if (node.operator === '=') return `rt::replace(&${name}, &${right})`;
            if (node.operator === '+=') return `rt::replace(&${name}, &rt::add(&${name}, &${right}))`;
            if (node.operator === '-=') return `rt::replace(&${name}, &rt::sub(&${name}, &${right}))`;
        }
        return `rt::new_undefined()`;
    },

    UpdateExpression(node, transpiler) {
        const arg = node.argument.name;
        if (node.operator === '++') return `rt::replace(&${arg}, &rt::add(&${arg}, &rt::new_num(1.0)))`;
        if (node.operator === '--') return `rt::replace(&${arg}, &rt::sub(&${arg}, &rt::new_num(1.0)))`;
        return `rt::new_undefined()`;
    },

    NewExpression(node, transpiler) {
        const callCode = module.exports.CallExpression(node, transpiler);
        return `/* new */ ${callCode}`; 
    },

    ArrowFunctionExpression(node, transpiler) {
        const body = transpiler.generateFunctionBody(node.body, node.params);
        return `rt::new_func(move |args: Vec<JsVar>| -> JsVar ${body})`;
    },

    CallExpression(node, transpiler) {
        if (node.callee.type === 'MemberExpression') {
            const method = node.callee.property.name;
            
            if (method === 'forEach') {
                const arr = transpiler.visit(node.callee.object);
                if (node.arguments.length > 0 && node.arguments[0].type === 'ArrowFunctionExpression') {
                    const arrowNode = node.arguments[0];
                    const rawClosure = transpiler.generateRawClosure(arrowNode);
                    return `rt::for_each_variant(&${arr}, ${rawClosure})`;
                } else {
                    const callback = transpiler.visit(node.arguments[0]);
                    return `rt::for_each(&${arr}, &${callback})`;
                }
            }
            if (method === 'toFixed') {
                const obj = transpiler.visit(node.callee.object);
                const digits = node.arguments.length > 0 ? transpiler.visit(node.arguments[0]) : 'rt::new_num(0.0)';
                return `rt::to_fixed(&${obj}, &${digits})`;
            }
            if (node.callee.object.name === 'console' && (method === 'log' || method === 'error')) {
                const args = node.arguments.map(arg => transpiler.visit(arg));
                const argsRefs = args.map(a => `&${a}`).join(', ');
                return `rt::log(&[${argsRefs}])`;
            }
        }

        if (node.callee.type === 'Identifier') {
            const name = node.callee.name;
            if (name === 'Promise') {
                const exec = transpiler.visit(node.arguments[0]);
                return `rt::Promise(&${exec})`;
            }
            if (name === 'setTimeout') {
                const cb = transpiler.visit(node.arguments[0]);
                const delay = transpiler.visit(node.arguments[1]);
                return `rt::setTimeout(&${cb}, &${delay})`;
            }
            if (name === 'prompt') {
                const args = node.arguments.map(arg => transpiler.visit(arg));
                const argsRefs = args.map(a => `&${a}`).join(', ');
                return `rt::prompt(&[${argsRefs}])`;
            }
        }

        const callee = transpiler.visit(node.callee);
        const args = node.arguments.map(arg => transpiler.visit(arg)).join(', ');
        return `rt::call(&${callee}, vec![${args}])`;
    }
};