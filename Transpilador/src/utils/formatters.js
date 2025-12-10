function toRustFloat(value) {
    let str = value.toString();

    if (!str.includes('.')) {
        return str + '.0';
    }
    return str;
}


function toRustVec(items) {
    if (!items || items.length === 0) return 'vec![]';
    return `vec![${items.join(', ')}]`;
}

function sanitizeString(str) {
    return str
        .replace(/\\/g, '\\\\') 
        .replace(/"/g, '\\"');  
}

module.exports = {
    toRustFloat,
    toRustVec,
    sanitizeString
};