const fs = require('fs');
const path = require('path'); 
const parser = require('@babel/parser');


const RUST_RUNTIME_TEMPLATE = `
// --- ARQUIVO GERADO AUTOMATICAMENTE: runtime.rs ---
// Este módulo contém a emulação do comportamento dinâmico do JavaScript.

use std::rc::Rc;
use std::cell::RefCell;
use std::fmt;
use std::collections::HashMap;

// Definição de Função Dinâmica
pub type JsFunc = Rc<dyn Fn(Vec<JsVar>) -> JsVar>;

#[derive(Clone)]
pub enum JsValue {
    Undefined,
    Null,
    Number(f64),
    String(String),
    Boolean(bool),
    Array(Vec<JsVar>),
    Object(HashMap<String, JsVar>),
    Function(JsFunc),
}

impl fmt::Debug for JsValue {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::Undefined => write!(f, "Undefined"),
            Self::Null => write!(f, "Null"),
            Self::Number(arg0) => f.debug_tuple("Number").field(arg0).finish(),
            Self::String(arg0) => f.debug_tuple("String").field(arg0).finish(),
            Self::Boolean(arg0) => f.debug_tuple("Boolean").field(arg0).finish(),
            Self::Array(arg0) => f.debug_tuple("Array").field(arg0).finish(),
            Self::Object(arg0) => f.debug_tuple("Object").field(arg0).finish(),
            Self::Function(_) => write!(f, "Function(...)"),
        }
    }
}

pub type JsVar = Rc<RefCell<JsValue>>;

pub fn new_undefined() -> JsVar { Rc::new(RefCell::new(JsValue::Undefined)) }
pub fn new_null() -> JsVar { Rc::new(RefCell::new(JsValue::Null)) }
pub fn new_num(n: f64) -> JsVar { Rc::new(RefCell::new(JsValue::Number(n))) }
pub fn new_str(s: &str) -> JsVar { Rc::new(RefCell::new(JsValue::String(s.to_string()))) }
pub fn new_bool(b: bool) -> JsVar { Rc::new(RefCell::new(JsValue::Boolean(b))) }

pub fn new_func<F>(f: F) -> JsVar 
where F: Fn(Vec<JsVar>) -> JsVar + 'static {
    Rc::new(RefCell::new(JsValue::Function(Rc::new(f))))
}

pub fn new_array(items: Vec<JsVar>) -> JsVar {
    Rc::new(RefCell::new(JsValue::Array(items)))
}

pub fn new_object(props: Vec<(String, JsVar)>) -> JsVar {
    let mut map = HashMap::new();
    for (k, v) in props {
        map.insert(k, v);
    }
    Rc::new(RefCell::new(JsValue::Object(map)))
}

pub fn call(func: &JsVar, args: Vec<JsVar>) -> JsVar {
    let b = func.borrow();
    if let JsValue::Function(f) = &*b {
        return f(args);
    }
    println!("Erro Runtime: Tentou chamar algo que não é função.");
    new_undefined()
}

pub fn replace(dest: &JsVar, src: &JsVar) -> JsVar {
    let new_val = src.borrow().clone();
    *dest.borrow_mut() = new_val;
    dest.clone()
}

pub fn get(obj: &JsVar, key: &str) -> JsVar {
    let b = obj.borrow();
    match &*b {
        JsValue::Object(map) => {
            match map.get(key) {
                Some(val) => val.clone(),
                None => new_undefined(),
            }
        },
        JsValue::Array(arr) => {
            if key == "length" {
                return new_num(arr.len() as f64);
            }
            if let Ok(idx) = key.parse::<usize>() {
                if idx < arr.len() {
                    return arr[idx].clone();
                }
            }
            new_undefined()
        },
        _ => new_undefined(),
    }
}

pub fn set(obj: &JsVar, key: &str, val: &JsVar) -> JsVar {
    let mut b = obj.borrow_mut();
    match &mut *b {
        JsValue::Object(map) => {
            map.insert(key.to_string(), val.clone());
        },
        JsValue::Array(arr) => {
             if let Ok(idx) = key.parse::<usize>() {
                if idx < arr.len() {
                    arr[idx] = val.clone();
                } else if idx == arr.len() {
                    arr.push(val.clone());
                }
            }
        },
        _ => {}
    }
    val.clone()
}

pub fn for_each_variant<F>(arr: &JsVar, mut callback: F) 
where F: FnMut(Vec<JsVar>) -> JsVar {
    let b = arr.borrow();
    if let JsValue::Array(vec) = &*b {
        for (i, item) in vec.iter().enumerate() {
            callback(vec![item.clone(), new_num(i as f64), arr.clone()]);
        }
    }
}

pub fn for_each(arr: &JsVar, callback: &JsVar) {
    let b = arr.borrow();
    if let JsValue::Array(vec) = &*b {
        for (i, item) in vec.iter().enumerate() {
            call(callback, vec![item.clone(), new_num(i as f64), arr.clone()]);
        }
    }
}

impl fmt::Display for JsValue {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        match self {
            JsValue::Undefined => write!(f, "undefined"),
            JsValue::Null => write!(f, "null"),
            JsValue::Number(n) => write!(f, "{}", n),
            JsValue::String(s) => write!(f, "{}", s),
            JsValue::Boolean(b) => write!(f, "{}", b),
            JsValue::Function(_) => write!(f, "[Function]"),
            JsValue::Array(arr) => {
                write!(f, "[")?;
                for (i, item) in arr.iter().enumerate() {
                    if i > 0 { write!(f, ", ")?; }
                    write!(f, "{}", item.borrow())?;
                }
                write!(f, "]")
            },
            JsValue::Object(map) => {
                write!(f, "{{ ")?;
                for (i, (k, v)) in map.iter().enumerate() {
                    if i > 0 { write!(f, ", ")?; }
                    write!(f, "{}: {}", k, v.borrow())?;
                }
                write!(f, " }}")
            }
        }
    }
}

pub fn is_truthy(val: &JsVar) -> bool {
    match &*val.borrow() {
        JsValue::Boolean(b) => *b,
        JsValue::Number(n) => *n != 0.0 && !n.is_nan(),
        JsValue::String(s) => !s.is_empty(),
        JsValue::Null | JsValue::Undefined => false,
        JsValue::Object(_) | JsValue::Array(_) | JsValue::Function(_) => true, 
    }
}

pub fn add(a: &JsVar, b: &JsVar) -> JsVar {
    let val_a = a.borrow();
    let val_b = b.borrow();
    match (&*val_a, &*val_b) {
        (JsValue::Number(n1), JsValue::Number(n2)) => new_num(n1 + n2),
        (JsValue::String(s1), JsValue::String(s2)) => new_str(&format!("{}{}", s1, s2)),
        (JsValue::String(s1), JsValue::Number(n2)) => new_str(&format!("{}{}", s1, n2)),
        (JsValue::Number(n1), JsValue::String(s2)) => new_str(&format!("{}{}", n1, s2)),
        _ => new_undefined(),
    }
}
pub fn sub(a: &JsVar, b: &JsVar) -> JsVar {
    let val_a = a.borrow();
    let val_b = b.borrow();
    match (&*val_a, &*val_b) {
        (JsValue::Number(n1), JsValue::Number(n2)) => new_num(n1 - n2),
        _ => new_undefined(),
    }
}
pub fn mul(a: &JsVar, b: &JsVar) -> JsVar {
    let val_a = a.borrow();
    let val_b = b.borrow();
    match (&*val_a, &*val_b) {
        (JsValue::Number(n1), JsValue::Number(n2)) => new_num(n1 * n2),
        _ => new_undefined(),
    }
}
pub fn div(a: &JsVar, b: &JsVar) -> JsVar {
    let val_a = a.borrow();
    let val_b = b.borrow();
    match (&*val_a, &*val_b) {
        (JsValue::Number(n1), JsValue::Number(n2)) => new_num(n1 / n2),
        _ => new_undefined(),
    }
}

pub fn gt(a: &JsVar, b: &JsVar) -> bool {
    match (&*a.borrow(), &*b.borrow()) {
        (JsValue::Number(n1), JsValue::Number(n2)) => n1 > n2,
        _ => false,
    }
}
pub fn gte(a: &JsVar, b: &JsVar) -> bool {
    match (&*a.borrow(), &*b.borrow()) {
        (JsValue::Number(n1), JsValue::Number(n2)) => n1 >= n2,
        _ => false,
    }
}
pub fn lt(a: &JsVar, b: &JsVar) -> bool {
    match (&*a.borrow(), &*b.borrow()) {
        (JsValue::Number(n1), JsValue::Number(n2)) => n1 < n2,
        _ => false,
    }
}
pub fn lte(a: &JsVar, b: &JsVar) -> bool {
    match (&*a.borrow(), &*b.borrow()) {
        (JsValue::Number(n1), JsValue::Number(n2)) => n1 <= n2,
        _ => false,
    }
}
pub fn eq(a: &JsVar, b: &JsVar) -> bool {
    match (&*a.borrow(), &*b.borrow()) {
        (JsValue::Number(n1), JsValue::Number(n2)) => n1 == n2,
        (JsValue::Boolean(b1), JsValue::Boolean(b2)) => b1 == b2,
        (JsValue::String(s1), JsValue::String(s2)) => s1 == s2,
        (JsValue::Null, JsValue::Null) => true,
        (JsValue::Undefined, JsValue::Undefined) => true,
        _ => false,
    }
}
pub fn neq(a: &JsVar, b: &JsVar) -> bool { !eq(a, b) }

pub fn and(a: &JsVar, b: &JsVar) -> bool { is_truthy(a) && is_truthy(b) }
pub fn or(a: &JsVar, b: &JsVar) -> bool { is_truthy(a) || is_truthy(b) }
pub fn not(a: &JsVar) -> bool { !is_truthy(a) }

pub fn typeof_js(a: &JsVar) -> JsVar {
    let t = match &*a.borrow() {
        JsValue::Undefined => "undefined",
        JsValue::Null => "object",
        JsValue::Number(_) => "number",
        JsValue::String(_) => "string",
        JsValue::Boolean(_) => "boolean",
        JsValue::Array(_) => "object",
        JsValue::Object(_) => "object",
        JsValue::Function(_) => "function",
    };
    new_str(t)
}

pub fn log(args: &[&JsVar]) {
    let outputs: Vec<String> = args.iter().map(|v| format!("{}", v.borrow())).collect();
    println!("{}", outputs.join(" "));
}
pub fn to_fixed(val: &JsVar, digits: &JsVar) -> JsVar {
    let d = match &*digits.borrow() { JsValue::Number(n) => *n as usize, _ => 0 };
    match &*val.borrow() {
        JsValue::Number(n) => new_str(&format!("{:.1$}", n, d)),
        _ => new_str("NaN"),
    }
}

#[allow(non_snake_case)]
pub fn Promise(executor: &JsVar) -> JsVar {
    let resolve = new_func(move |args: Vec<JsVar>| -> JsVar {
        args.get(0).unwrap_or(&new_undefined()).clone()
    });
    call(executor, vec![resolve]);
    new_object(vec![("status".to_string(), new_str("resolved"))])
}

#[allow(non_snake_case)]
pub fn setTimeout(callback: &JsVar, _delay: &JsVar) -> JsVar {
    call(callback, vec![]);
    new_undefined()
}
`;

// ==========================================
// 2. O TRANSPLIADOR V14
// ==========================================

class RustRuntimeTranspiler {
    constructor() {
        this.output = [];
        this.indentLevel = 0;
        this.functionCode = []; 
        this.mainCode = [];
    }

    getIndent() { return '    '.repeat(this.indentLevel); }

    visit(node) {
        if (!node) return 'rt::new_undefined()';

        switch (node.type) {
            case 'File': return this.visit(node.program);
            case 'Program': return this.visitProgram(node);
            
            case 'VariableDeclaration': return this.visitVariableDeclaration(node);
            case 'FunctionDeclaration': return this.visitFunctionDeclaration(node);
            
            case 'BlockStatement': return this.visitBlockStatement(node);
            case 'ExpressionStatement': return this.visitExpressionStatement(node);
            case 'IfStatement': return this.visitIfStatement(node);
            case 'ReturnStatement': return this.visitReturnStatement(node);
            case 'WhileStatement': return this.visitWhileStatement(node);
            case 'ForStatement': return this.visitForStatement(node);
            case 'TryStatement': return this.visitTryStatement(node);
            case 'ThrowStatement': return this.visitThrowStatement(node);
            
            case 'BinaryExpression': return this.visitBinaryExpression(node);
            case 'LogicalExpression': return this.visitLogicalExpression(node);
            case 'UnaryExpression': return this.visitUnaryExpression(node);
            case 'CallExpression': return this.visitCallExpression(node);
            case 'AssignmentExpression': return this.visitAssignmentExpression(node);
            case 'ArrowFunctionExpression': return this.visitArrowFunctionExpression(node);
            case 'MemberExpression': return this.visitMemberExpression(node);
            case 'Identifier': return this.visitIdentifier(node);
            case 'TemplateLiteral': return this.visitTemplateLiteral(node);
            case 'ArrayExpression': return this.visitArrayExpression(node);
            case 'ObjectExpression': return this.visitObjectExpression(node);
            case 'UpdateExpression': return this.visitUpdateExpression(node);
            case 'NewExpression': return this.visitNewExpression(node);

            case 'NumericLiteral': return this.visitNumericLiteral(node);
            case 'StringLiteral': return `rt::new_str("${node.value}")`;
            case 'BooleanLiteral': return `rt::new_bool(${node.value})`;

            default:
                return `/* TODO: ${node.type} */ rt::new_undefined()`;
        }
    }

    visitProgram(node) {
        node.body.forEach(stmt => {
            const code = this.visit(stmt);
            if (stmt.type === 'FunctionDeclaration') {
                this.functionCode.push(code);
            } else {
                if (code) this.mainCode.push(this.getIndent() + code + ';');
            }
        });

        // MODIFICAÇÃO V14: Header de importação em vez de Template Inline
        return [
            "// Gerado por Transpilador JS->Rust",
            "mod runtime;", // Procura por runtime.rs
            "use runtime as rt;", // Alias 'rt'
            "use runtime::JsVar;", // Importa o tipo JsVar para assinaturas
            "",
            "fn main() {",
            ...this.functionCode.map(l => "    " + l),
            ...this.mainCode.map(l => "    " + l),
            "}"
        ].join('\n');
    }

    visitNumericLiteral(node) {
        let val = node.value.toString();
        if (!val.includes('.')) val += '.0';
        return `rt::new_num(${val})`;
    }

    visitVariableDeclaration(node) {
        const decl = node.declarations[0];
        const name = decl.id.name;
        const init = decl.init ? this.visit(decl.init) : 'rt::new_undefined()';
        return `let ${name} = ${init}`;
    }

    visitArrayExpression(node) {
        const elements = node.elements.map(el => this.visit(el)).join(', ');
        return `rt::new_array(vec![${elements}])`;
    }

    visitObjectExpression(node) {
        const props = node.properties.map(prop => {
            const key = prop.key.name || prop.key.value;
            const val = this.visit(prop.value);
            return `("${key}".to_string(), ${val})`;
        }).join(', ');
        return `rt::new_object(vec![${props}])`;
    }

    visitIdentifier(node) {
        return `${node.name}.clone()`;
    }

    visitMemberExpression(node) {
        const obj = this.visit(node.object);
        const prop = node.property.name || node.property.value; 
        if (node.computed && node.property.type !== 'StringLiteral' && node.property.type !== 'NumericLiteral') {
             return `rt::new_undefined()`;
        }
        return `rt::get(&${obj}, "${prop}")`;
    }

    visitAssignmentExpression(node) {
        const right = this.visit(node.right);
        if (node.left.type === 'MemberExpression') {
            const obj = this.visit(node.left.object);
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
    }

    visitUpdateExpression(node) {
        const arg = node.argument.name;
        if (node.operator === '++') return `rt::replace(&${arg}, &rt::add(&${arg}, &rt::new_num(1.0)))`;
        if (node.operator === '--') return `rt::replace(&${arg}, &rt::sub(&${arg}, &rt::new_num(1.0)))`;
        return `rt::new_undefined()`;
    }

    visitNewExpression(node) {
        const callCode = this.visitCallExpression(node);
        return `/* new */ ${callCode}`; 
    }

    visitCallExpression(node) {
        if (node.callee.type === 'MemberExpression') {
            const method = node.callee.property.name;
            
            if (method === 'forEach') {
                const arr = this.visit(node.callee.object);
                if (node.arguments.length > 0 && node.arguments[0].type === 'ArrowFunctionExpression') {
                    const arrowNode = node.arguments[0];
                    const rawClosure = this.generateRawClosure(arrowNode);
                    return `rt::for_each_variant(&${arr}, ${rawClosure})`;
                } else {
                    const callback = this.visit(node.arguments[0]);
                    return `rt::for_each(&${arr}, &${callback})`;
                }
            }
            if (method === 'toFixed') {
                const obj = this.visit(node.callee.object);
                const digits = node.arguments.length > 0 ? this.visit(node.arguments[0]) : 'rt::new_num(0.0)';
                return `rt::to_fixed(&${obj}, &${digits})`;
            }
            if (node.callee.object.name === 'console' && (method === 'log' || method === 'error')) {
                const args = node.arguments.map(arg => this.visit(arg));
                const argsRefs = args.map(a => `&${a}`).join(', ');
                return `rt::log(&[${argsRefs}])`;
            }
        }

        if (node.callee.type === 'Identifier') {
            const name = node.callee.name;
            if (name === 'Promise') {
                const exec = this.visit(node.arguments[0]);
                return `rt::Promise(&${exec})`;
            }
            if (name === 'setTimeout') {
                const cb = this.visit(node.arguments[0]);
                const delay = this.visit(node.arguments[1]);
                return `rt::setTimeout(&${cb}, &${delay})`;
            }
        }

        const callee = this.visit(node.callee);
        const args = node.arguments.map(arg => this.visit(arg)).join(', ');
        return `rt::call(&${callee}, vec![${args}])`;
    }

    visitFunctionDeclaration(node) {
        const name = node.id.name;
        const body = this.generateFunctionBody(node.body, node.params);
        return `let ${name} = rt::new_func(move |args: Vec<JsVar>| -> JsVar ${body});`;
    }

    visitArrowFunctionExpression(node) {
        const body = this.generateFunctionBody(node.body, node.params);
        return `rt::new_func(move |args: Vec<JsVar>| -> JsVar ${body})`;
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

    visitBlockStatement(node) {
        this.indentLevel++;
        const lines = node.body.map(stmt => {
            const code = this.visit(stmt);
            const needsSemi = !['IfStatement', 'FunctionDeclaration', 'WhileStatement', 'ForStatement', 'TryStatement'].includes(stmt.type);
            return `${this.getIndent()}${code}${needsSemi ? ';' : ''}`;
        });
        this.indentLevel--;
        return `{\n${lines.join('\n')}\n${this.getIndent()}}`; 
    }

    visitTryStatement(node) {
        const tryBlock = this.visit(node.block);
        let catchBlock = "";
        if (node.handler) {
             const paramName = node.handler.param ? node.handler.param.name : 'err';
             const handlerBody = this.visit(node.handler.body);
             catchBlock = `
    if false {
        let ${paramName} = rt::new_str("Error");
${handlerBody}
    }`;
        }
        return `${tryBlock}\n${catchBlock}`;
    }

    visitThrowStatement(node) {
        const arg = this.visit(node.argument);
        return `panic!("Throw: {}", ${arg})`;
    }

    visitBinaryExpression(node) {
        const left = this.visit(node.left);
        const right = this.visit(node.right);
        if (node.operator === '+') return `rt::add(&${left}, &${right})`;
        if (node.operator === '-') return `rt::sub(&${left}, &${right})`;
        if (node.operator === '*') return `rt::mul(&${left}, &${right})`;
        if (node.operator === '/') return `rt::div(&${left}, &${right})`;
        if (node.operator === '>') return `rt::new_bool(rt::gt(&${left}, &${right}))`;
        if (node.operator === '>=') return `rt::new_bool(rt::gte(&${left}, &${right}))`;
        if (node.operator === '<') return `rt::new_bool(rt::lt(&${left}, &${right}))`;
        if (node.operator === '<=') return `rt::new_bool(rt::lte(&${left}, &${right}))`;
        if (node.operator === '==' || node.operator === '===') return `rt::new_bool(rt::eq(&${left}, &${right}))`;
        if (node.operator === '!=' || node.operator === '!==') return `rt::new_bool(rt::neq(&${left}, &${right}))`;
        return `rt::new_undefined()`;
    }

    visitLogicalExpression(node) {
        const left = this.visit(node.left);
        const right = this.visit(node.right);
        if (node.operator === '&&') return `rt::new_bool(rt::and(&${left}, &${right}))`;
        if (node.operator === '||') return `rt::new_bool(rt::or(&${left}, &${right}))`;
        return `rt::new_undefined()`;
    }

    visitUnaryExpression(node) {
        const arg = this.visit(node.argument);
        if (node.operator === '!') return `rt::new_bool(rt::not(&${arg}))`;
        if (node.operator === 'typeof') return `rt::typeof_js(&${arg})`;
        if (node.operator === '-') return `rt::sub(&rt::new_num(0.0), &${arg})`;
        return `rt::new_undefined()`;
    }

    visitTemplateLiteral(node) {
        let formatStr = "";
        let args = [];
        node.quasis.forEach((quasi, i) => {
            formatStr += quasi.value.raw;
            if (!quasi.tail) {
                formatStr += "{}"; 
                args.push(this.visit(node.expressions[i]));
            }
        });
        const argsFormatted = args.map(a => `&${a}.borrow()`).join(', ');
        if (args.length > 0) return `rt::new_str(&format!("${formatStr}", ${argsFormatted}))`;
        return `rt::new_str("${formatStr}")`;
    }

    visitExpressionStatement(node) { return this.visit(node.expression); }
    
    visitIfStatement(node) {
        const test = this.visit(node.test);
        const consequent = this.visit(node.consequent);
        let alternate = '';
        if (node.alternate) {
            const altCode = this.visit(node.alternate);
            alternate = ` else ${altCode}`;
        }
        return `if rt::is_truthy(&${test}) ${consequent}${alternate}`;
    }

    visitWhileStatement(node) {
        const test = this.visit(node.test);
        const body = this.visit(node.body); 
        return `while rt::is_truthy(&${test}) ${body}`;
    }

    visitForStatement(node) {
        const init = node.init ? this.visit(node.init) + ';' : '';
        const test = node.test ? this.visit(node.test) : 'rt::new_bool(true)';
        const update = node.update ? this.visit(node.update) + ';' : '';
        const bodyContent = this.visit(node.body);
        let loopBody = bodyContent;
        if (update) {
            if (loopBody.trim().endsWith('}')) {
                const lastBraceIndex = loopBody.lastIndexOf('}');
                loopBody = loopBody.substring(0, lastBraceIndex) + 
                           `\n${this.getIndent()}${update}\n}`;
            } else {
                loopBody = `{\n${loopBody}\n${update}\n}`;
            }
        }
        return `\n${this.getIndent()}{\n${this.getIndent()}${init}\n${this.getIndent()}while rt::is_truthy(&${test}) ${loopBody}\n${this.getIndent()}}`;
    }

    visitReturnStatement(node) {
        const arg = node.argument ? this.visit(node.argument) : 'rt::new_undefined()';
        return `return ${arg}`;
    }
}

// ==========================================
// EXECUÇÃO
// ==========================================

function main() {
    const args = process.argv.slice(2);
    if (args.length < 2) {
        console.error("❌ Uso: node transpilador_v3.js <input.js> <output.rs>");
        process.exit(1);
    }
    
    const inputPath = args[0];
    const outputPath = args[1];
    
    // Caminho para o runtime.rs (na mesma pasta do output)
    const outputDir = path.dirname(outputPath);
    const runtimePath = path.join(outputDir, 'runtime.rs');

    try {
        const jsCode = fs.readFileSync(inputPath, 'utf8');
        const ast = parser.parse(jsCode, { sourceType: 'module', plugins: ['asyncGenerators'] });
        const transpiler = new RustRuntimeTranspiler();
        const rustCode = transpiler.visit(ast);
        
        // 1. Escreve o main.rs
        fs.writeFileSync(outputPath, rustCode);
        
        // 2. Escreve o runtime.rs automaticamente
        fs.writeFileSync(runtimePath, RUST_RUNTIME_TEMPLATE);
        
        console.log("---------------------------------------------------");
        console.log(`✅ Transpilação Concluída!`);
        console.log(`   📄 Arquivo Principal: ${outputPath}`);
        console.log(`   📚 Biblioteca Runtime: ${runtimePath}`);
        console.log("---------------------------------------------------");
        console.log(`🚀 Para compilar, execute: rustc ${outputPath}`);
        
    } catch (err) {
        console.error("❌ Erro:", err.message);
    }
}

main();