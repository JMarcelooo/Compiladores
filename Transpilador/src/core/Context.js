class Context {
    constructor() {
        this.indentLevel = 0;
        this.functionCode = []; 
        this.mainCode = [];
    }

    indent() {
        this.indentLevel++;
    }

    dedent() {
        if (this.indentLevel > 0) this.indentLevel--;
    }

    getWhitespace() {
        return '    '.repeat(this.indentLevel);
    }

    pushMain(line) {
        if (line) {
            this.mainCode.push(this.getWhitespace() + line + ';');
        }
    }

    pushFunction(line) {
        this.functionCode.push(line);
    }

    getFinalRustCode() {
        return [
            "// Gerado por Transpilador JS->Rust",
            "mod runtime;", 
            "use runtime as rt;", 
            "use runtime::JsVar;", 
            "",
            "fn main() {",
            ...this.functionCode.map(l => "    " + l), 
            ...this.mainCode.map(l => "    " + l),
            "    rt::pause();",
            "}"
        ].join('\n');
    }
}

module.exports = Context;