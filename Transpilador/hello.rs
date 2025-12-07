// Gerado por Transpilador JS->Rust
mod runtime;
use runtime as rt;
use runtime::JsVar;

fn main() {
    let num = rt::new_undefined();
    
{
rt::replace(&num, &rt::new_num(0.0));
while rt::is_truthy(&rt::new_bool(rt::lt(&num.clone(), &rt::new_num(10.0)))) {
    rt::log(&[&num.clone()]);

rt::replace(&num, &rt::add(&num, &rt::new_num(1.0)));
}
};
}