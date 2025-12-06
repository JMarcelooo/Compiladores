
// --- INÍCIO DO RUNTIME JS EM RUST ---
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
    println!("Erro: Tentou chamar algo que não é função: {:?}", b);
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

// --- Iteração Genérica (Para closures raw) ---
pub fn for_each_variant<F>(arr: &JsVar, mut callback: F) 
where F: FnMut(Vec<JsVar>) -> JsVar {
    let b = arr.borrow();
    if let JsValue::Array(vec) = &*b {
        for (i, item) in vec.iter().enumerate() {
            callback(vec![item.clone(), new_num(i as f64), arr.clone()]);
        }
    }
}

// --- Iteração Padrão (Para JsFunc) ---
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
// --- FIM DO RUNTIME ---


mod rt { pub use super::*; }


fn main() {
    let calcularIMC = rt::new_func(move |args: Vec<JsVar>| -> JsVar {
    let peso = args.get(0).unwrap_or(&rt::new_undefined()).clone();
    let altura = args.get(1).unwrap_or(&rt::new_undefined()).clone();
    if rt::is_truthy(&rt::new_bool(rt::or(&rt::new_bool(rt::or(&rt::new_bool(rt::or(&rt::new_bool(rt::neq(&rt::typeof_js(&peso.clone()), &rt::new_str("number"))), &rt::new_bool(rt::neq(&rt::typeof_js(&altura.clone()), &rt::new_str("number"))))), &rt::new_bool(rt::lte(&peso.clone(), &rt::new_num(0.0))))), &rt::new_bool(rt::lte(&altura.clone(), &rt::new_num(0.0)))))) {
        return rt::new_str("Erro: Peso e altura devem ser números positivos.");
    }
    let alturaAoQuadrado = rt::mul(&altura.clone(), &altura.clone());
    let imc = rt::div(&peso.clone(), &alturaAoQuadrado.clone());
    return imc.clone();
});
    let peso = rt::new_num(75.0);
    let altura = rt::new_num(1.75);
    let resultadoIMC = rt::call(&calcularIMC.clone(), vec![peso.clone(), altura.clone()]);
    rt::log(&[&rt::new_str(&format!("Peso: {} kg", &peso.clone().borrow()))]);
    rt::log(&[&rt::new_str(&format!("Altura: {} m", &altura.clone().borrow()))]);
    if rt::is_truthy(&rt::new_bool(rt::eq(&rt::typeof_js(&resultadoIMC.clone()), &rt::new_str("number")))) {
    rt::log(&[&rt::new_str(&format!("Seu IMC é: {}", &rt::to_fixed(&resultadoIMC.clone(), &rt::new_num(2.0)).borrow()))]);
    if rt::is_truthy(&rt::new_bool(rt::lt(&resultadoIMC.clone(), &rt::new_num(18.5)))) {
        rt::log(&[&rt::new_str("Classificação: Abaixo do peso.")]);
    } else if rt::is_truthy(&rt::new_bool(rt::and(&rt::new_bool(rt::gte(&resultadoIMC.clone(), &rt::new_num(18.5))), &rt::new_bool(rt::lte(&resultadoIMC.clone(), &rt::new_num(24.9)))))) {
        rt::log(&[&rt::new_str("Classificação: Peso normal.")]);
    } else {
        rt::log(&[&rt::new_str("Classificação: Sobrepeso ou obesidade.")]);
    }
} else {
    rt::log(&[&resultadoIMC.clone()]);
};
}