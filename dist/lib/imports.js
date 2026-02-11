"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Imports = exports.Import = void 0;
const gen_utils_1 = require("./gen-utils");
/** A general import */
class Import {
    constructor(name, typeName, qName, path, file, typeOnly) {
        this.name = name;
        this.typeName = typeName;
        this.qualifiedName = qName;
        this.useAlias = this.typeName !== this.qualifiedName;
        this.typeOnly = typeOnly;
        this.path = path;
        this.file = file;
        this.fullPath = `${this.path.split('/').filter(p => p.length).join('/')}/${this.file.split('/').filter(p => p.length).join('/')}`;
        this.importName = name;
        this.importPath = path;
        this.importFile = file;
        this.importTypeName = typeName;
        this.importQualifiedName = qName;
    }
}
exports.Import = Import;
/**
 * Manages the model imports to be added to a generated file
 */
class Imports {
    constructor(options, currentTypeName) {
        this.options = options;
        this.currentTypeName = currentTypeName;
        this._imports = new Map();
    }
    /**
     * Adds an import
     */
    add(param, typeOnly) {
        let imp;
        if (typeof param === 'string') {
            // A model
            const importTypeName = (0, gen_utils_1.unqualifiedName)(param, this.options);
            let importQualifiedName = (0, gen_utils_1.qualifiedName)(param, this.options);
            // Check for collision with current type name
            if (this.currentTypeName && importTypeName === this.currentTypeName) {
                // Add suffix to avoid collision
                let suffix = 1;
                let aliasedTypeName = `${importTypeName}_${suffix}`;
                while (this.hasImportWithTypeName(aliasedTypeName)) {
                    suffix++;
                    aliasedTypeName = `${importTypeName}_${suffix}`;
                }
                // Keep the original typeName for import, use alias for qualifiedName
                importQualifiedName = aliasedTypeName;
            }
            imp = new Import(param, importTypeName, importQualifiedName, 'models/', (0, gen_utils_1.modelFile)(param, this.options), typeOnly);
        }
        else {
            // An Importable
            imp = new Import(param.importName, param.importTypeName ?? param.importName, param.importQualifiedName ?? param.importName, `${param.importPath}`, param.importFile, typeOnly);
        }
        this._imports.set(imp.name, imp);
    }
    hasImportWithTypeName(typeName) {
        for (const imp of this._imports.values()) {
            if (imp.qualifiedName === typeName) {
                return true;
            }
        }
        return false;
    }
    toArray() {
        const array = [...this._imports.values()];
        array.sort((a, b) => a.importName.localeCompare(b.importName, 'en'));
        return array;
    }
    get size() {
        return this._imports.size;
    }
}
exports.Imports = Imports;
//# sourceMappingURL=imports.js.map