"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HTTP_METHODS = void 0;
exports.simpleName = simpleName;
exports.unqualifiedName = unqualifiedName;
exports.qualifiedName = qualifiedName;
exports.modelFile = modelFile;
exports.namespace = namespace;
exports.ensureNotReserved = ensureNotReserved;
exports.typeName = typeName;
exports.enumName = enumName;
exports.methodName = methodName;
exports.fileName = fileName;
exports.toBasicChars = toBasicChars;
exports.tsComments = tsComments;
exports.modelClass = modelClass;
exports.serviceClass = serviceClass;
exports.escapeId = escapeId;
exports.tsType = tsType;
exports.resolveRef = resolveRef;
exports.deleteDirRecursive = deleteDirRecursive;
exports.syncDirs = syncDirs;
const fs_extra_1 = __importDefault(require("fs-extra"));
const jsesc_1 = __importDefault(require("jsesc"));
const lodash_1 = require("lodash");
const path_1 = __importDefault(require("path"));
const openapi_typings_1 = require("./openapi-typings");
exports.HTTP_METHODS = ['get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace'];
/**
 * Returns the simple name, that is, the last part after '/'
 */
function simpleName(name) {
    const pos = name.lastIndexOf('/');
    return name.substring(pos + 1);
}
/**
 * Returns the unqualified model class name, that is, the last part after '.'
 */
function unqualifiedName(name, options) {
    const pos = name.lastIndexOf('.');
    return modelClass(name.substring(pos + 1), options);
}
/**
 * Returns the qualified model class name, that is, the camelized namespace (if any) plus the unqualified name
 */
function qualifiedName(name, options) {
    const ns = namespace(name);
    const unq = unqualifiedName(name, options);
    return ns ? typeName(ns) + unq : unq;
}
/**
 * Returns the filename where to write a model with the given name
 */
function modelFile(name, options) {
    let result = '';
    const ns = namespace(name);
    if (ns) {
        result += `/${ns}`;
    }
    const file = unqualifiedName(name, options);
    return result += '/' + fileName(file);
}
/**
 * Returns the namespace path, that is, the part before the last '.' split by '/' instead of '.'.
 * If there's no namespace, returns undefined.
 */
function namespace(name) {
    name = name.replace(/^\.+/g, '');
    name = name.replace(/\.+$/g, '');
    const pos = name.lastIndexOf('.');
    return pos < 0 ? undefined : name.substring(0, pos).replace(/\./g, '/');
}
const RESERVED_KEYWORDS = ['abstract', 'arguments', 'await', 'boolean', 'break', 'byte', 'case', 'catch', 'char', 'class', 'const', 'continue', 'debugger', 'default', 'delete', 'do', 'double', 'else', 'enum', 'eval', 'export', 'extends', 'false', 'final', 'finally', 'float', 'for', 'function', 'goto', 'if', 'implements', 'import', 'in', 'instanceof', 'int', 'interface', 'let', 'long', 'native', 'new', 'null', 'package', 'private', 'protected', 'public', 'return', 'short', 'static', 'super', 'switch', 'synchronized', 'this', 'throw', 'throws', 'transient', 'true', 'try', 'typeof', 'var', 'void', 'volatile', 'while', 'with', 'yield'];
/**
 * If the given name is a JS reserved keyword, suffix it with a `$` character
 */
function ensureNotReserved(name) {
    return RESERVED_KEYWORDS.includes(name) ? name + '$' : name;
}
/**
 * Returns the type (class) name for a given regular name
 */
function typeName(name, options) {
    if (options?.camelizeModelNames === false) {
        return (0, lodash_1.upperFirst)(toBasicChars(name, true));
    }
    else {
        return (0, lodash_1.upperFirst)(methodName(name));
    }
}
/**
 * Returns the name of the enum constant for a given value
 */
function enumName(value, options) {
    let name = toBasicChars(value, true);
    if (options.enumStyle === 'ignorecase') {
        return name;
    }
    else if (options.enumStyle === 'upper') {
        name = (0, lodash_1.upperCase)(name).replace(/\s+/g, '_');
    }
    else {
        name = (0, lodash_1.upperFirst)((0, lodash_1.camelCase)(name));
    }
    if (/^\d/.test(name)) {
        name = '$' + name;
    }
    return name;
}
/**
 * Returns a suitable method name for the given name
 * @param name The raw name
 */
function methodName(name) {
    return (0, lodash_1.camelCase)(toBasicChars(name, true));
}
/**
 * Returns the file name for a given type name
 */
function fileName(text) {
    return (0, lodash_1.kebabCase)(toBasicChars(text));
}
/**
 * Converts a text to a basic, letters / numbers / underscore representation.
 * When firstNonDigit is true, prepends the result with an uderscore if the first char is a digit.
 */
function toBasicChars(text, firstNonDigit = false) {
    text = (0, lodash_1.deburr)((text || '').trim());
    text = text.replace(/[^\w$]+/g, '_');
    if (firstNonDigit && /[0-9]/.test(text.charAt(0))) {
        text = '_' + text;
    }
    return text;
}
/**
 * Returns the TypeScript comments for the given schema description, in a given indentation level
 */
function tsComments(description, level, deprecated) {
    const indent = '  '.repeat(level);
    if (description === undefined || description.length === 0) {
        return indent + (deprecated ? '/** @deprecated */' : '');
    }
    const lines = description.trim().split('\n');
    let result = '\n' + indent + '/**\n';
    lines.forEach(line => {
        result += indent + ' *' + (line === '' ? '' : ' ' + line.replace(/\*\//g, '* / ')) + '\n';
    });
    if (deprecated) {
        result += indent + ' *\n' + indent + ' * @deprecated\n';
    }
    result += indent + ' */\n' + indent;
    return result;
}
/**
 * Applies the prefix and suffix to a model class name
 */
function modelClass(baseName, options) {
    return `${options.modelPrefix || ''}${typeName(baseName, options)}${options.modelSuffix || ''}`;
}
/**
 * Applies the prefix and suffix to a service class name
 */
function serviceClass(baseName, options) {
    return `${options.servicePrefix || ''}${typeName(baseName, options)}${options.serviceSuffix || 'Service'}`;
}
/**
 * Escapes the name of a property / parameter if not valid JS identifier
 */
function escapeId(name) {
    if (/^[a-zA-Z]\w*$/.test(name)) {
        return name;
    }
    else {
        return `'${name.replace(/\'/g, '\\\'')}'`;
    }
}
/**
 * Appends | null to the given type
 */
function maybeAppendNull(type, nullable) {
    if (` ${type} `.includes('null') || !nullable) {
        // The type itself already includes null
        return type;
    }
    return (type.includes(' ') ? `(${type})` : type) + (nullable ? ' | null' : '');
}
function rawTsType(schema, options, openApi, container) {
    // An union of types
    const union = schema.oneOf || schema.anyOf || [];
    if (union.length > 0) {
        if (union.length > 1) {
            return `(${union.map(u => tsType(u, options, openApi, container)).join(' | ')})`;
        }
        else {
            return union.map(u => tsType(u, options, openApi, container)).join(' | ');
        }
    }
    const type = (0, openapi_typings_1.getSchemaType)(schema);
    // Handle OpenAPI 3.1 union types (type array)
    if (Array.isArray(type)) {
        const nonNullTypes = type.filter(t => t !== 'null');
        const hasNull = type.includes('null');
        if (nonNullTypes.length > 1) {
            // Generate union of the different types
            const unionTypes = nonNullTypes.map(t => {
                // Create a schema object with single type for recursive processing
                const singleTypeSchema = { ...schema, type: t };
                return rawTsType(singleTypeSchema, options, openApi, container);
            }).filter(t => t !== null);
            // Remove duplicates
            const uniqueTypes = [...new Set(unionTypes)];
            if (uniqueTypes.length === 1) {
                return hasNull ? `(${uniqueTypes[0]} | null)` : uniqueTypes[0];
            }
            const unionType = uniqueTypes.join(' | ');
            return hasNull ? `(${unionType} | null)` : `(${unionType})`;
        }
        else if (nonNullTypes.length === 1) {
            // Single non-null type, process normally
            const singleType = nonNullTypes[0];
            const singleTypeSchema = { ...schema, type: singleType };
            const result = rawTsType(singleTypeSchema, options, openApi, container);
            return hasNull ? `(${result} | null)` : result;
        }
        else if (hasNull) {
            // Only null type
            return 'null';
        }
        // Fallback to any if no valid types
        return 'any';
    }
    // An array
    if (type === 'array' || (0, openapi_typings_1.isArraySchemaObject)(schema)) {
        // Check for OpenAPI 3.1 prefixItems (tuple types)
        if ('prefixItems' in schema && Array.isArray(schema.prefixItems)) {
            const prefixItems = schema.prefixItems;
            const tupleTypes = prefixItems.map((item) => tsType(item, options, openApi, container));
            // Check if additional items are allowed
            const additionalItems = schema.items;
            if (additionalItems === false || additionalItems === undefined) {
                // Exact tuple - no additional items
                return `[${tupleTypes.join(', ')}]`;
            }
            else if (additionalItems) {
                // Tuple with additional items of specific type
                const additionalType = tsType(additionalItems, options, openApi, container);
                return `[${tupleTypes.join(', ')}, ...${additionalType}[]]`;
            }
            else {
                // Tuple with any additional items
                return `[${tupleTypes.join(', ')}, ...any[]]`;
            }
        }
        const items = (0, openapi_typings_1.isArraySchemaObject)(schema) && 'items' in schema ? schema.items : {};
        const itemsType = tsType(items, options, openApi, container);
        return `Array<${itemsType}>`;
    }
    // All the types
    const allOf = schema.allOf || [];
    let intersectionType = [];
    if (allOf.length > 0) {
        intersectionType = allOf.map(u => tsType(u, options, openApi, container));
    }
    // An object
    if (type === 'object' || schema.properties) {
        let result = '{\n';
        const properties = schema.properties || {};
        const required = schema.required;
        for (const baseSchema of allOf) {
            const discriminators = findAllDiscriminators(baseSchema, schema, openApi);
            for (const discriminator of discriminators) {
                result += `'${discriminator.propName}': '${discriminator.value}';\n`;
            }
        }
        for (const propName of Object.keys(properties)) {
            const property = properties[propName];
            if (!property) {
                continue;
            }
            if (property.description) {
                result += tsComments(property.description, 0, property.deprecated);
            }
            result += `'${propName}'`;
            const propRequired = required && required.includes(propName);
            if (!propRequired) {
                result += '?';
            }
            const propertyType = tsType(property, options, openApi, container);
            result += `: ${propertyType};\n`;
        }
        if (schema.additionalProperties) {
            const additionalProperties = schema.additionalProperties === true ? {} : schema.additionalProperties;
            result += `[key: string]: ${tsType(additionalProperties, options, openApi, container)};\n`;
        }
        result += '}';
        intersectionType.push(result);
    }
    if (intersectionType.length > 0) {
        return intersectionType.join(' & ');
    }
    // Inline enum
    const enumValues = schema.enum || (schema.const ? [schema.const] : []);
    if (enumValues.length > 0) {
        if (type === 'number' || type === 'integer' || type === 'boolean') {
            return enumValues.join(' | ');
        }
        else {
            return enumValues.map(v => `'${(0, jsesc_1.default)(v)}'`).join(' | ');
        }
    }
    // A Blob
    if (type === 'string' && schema.format === 'binary') {
        return 'Blob';
    }
    // A simple type (integer doesn't exist as type in JS, use number instead)
    if (type) {
        const finalType = type === 'integer' ? 'number' : type;
        return finalType;
    }
    // If no type is specified, default to 'any'
    return 'any';
}
/**
 * Returns the TypeScript type for the given type and options
 */
function tsType(schemaOrRef, options, openApi, container) {
    if (!schemaOrRef) {
        // No schema
        return 'any';
    }
    if ((0, openapi_typings_1.isReferenceObject)(schemaOrRef)) {
        // A reference
        const resolved = resolveRef(openApi, schemaOrRef.$ref);
        const name = simpleName(schemaOrRef.$ref);
        // When referencing the same container, use its type name
        if (container && container.name === name) {
            return maybeAppendNull(container.typeName, (0, openapi_typings_1.isNullable)(resolved));
        }
        // Check if the container has an import alias for this reference
        if (container && typeof container.getImportTypeName === 'function') {
            const aliasedTypeName = container.getImportTypeName(name);
            return maybeAppendNull(aliasedTypeName, (0, openapi_typings_1.isNullable)(resolved));
        }
        // Fallback to qualified name
        return maybeAppendNull(qualifiedName(name, options), (0, openapi_typings_1.isNullable)(resolved));
    }
    // Resolve the actual type (maybe nullable)
    const schema = schemaOrRef;
    const type = rawTsType(schema, options, openApi, container);
    return maybeAppendNull(type, (0, openapi_typings_1.isNullable)(schema));
}
/**
 * Resolves a reference
 * @param ref The reference name, such as #/components/schemas/Name, or just Name
 */
function resolveRef(openApi, ref) {
    if (!ref.includes('/')) {
        ref = `#/components/schemas/${ref}`;
    }
    let current = null;
    for (let part of ref.split('/')) {
        part = part.trim();
        if (part === '#' || part === '') {
            current = openApi;
        }
        else if (current == null) {
            break;
        }
        else {
            current = current[part];
        }
    }
    if (current == null || typeof current !== 'object') {
        throw new Error(`Couldn't resolve reference ${ref}`);
    }
    return current;
}
/**
 * Recursively deletes a directory
 */
function deleteDirRecursive(dir) {
    if (fs_extra_1.default.existsSync(dir)) {
        fs_extra_1.default.readdirSync(dir).forEach((file) => {
            const curPath = path_1.default.join(dir, file);
            if (fs_extra_1.default.lstatSync(curPath).isDirectory()) { // recurse
                deleteDirRecursive(curPath);
            }
            else { // delete file
                fs_extra_1.default.unlinkSync(curPath);
            }
        });
        fs_extra_1.default.rmdirSync(dir);
    }
}
/**
 * Synchronizes the files from the source to the target directory. Optionally remove stale files.
 */
function syncDirs(srcDir, destDir, removeStale, logger) {
    fs_extra_1.default.ensureDirSync(destDir);
    const srcFiles = fs_extra_1.default.readdirSync(srcDir);
    const destFiles = fs_extra_1.default.readdirSync(destDir);
    for (const file of srcFiles) {
        const srcFile = path_1.default.join(srcDir, file);
        const destFile = path_1.default.join(destDir, file);
        if (fs_extra_1.default.lstatSync(srcFile).isDirectory()) {
            // A directory: recursively sync
            syncDirs(srcFile, destFile, removeStale, logger);
        }
        else {
            // Read the content of both files and update if they differ
            const srcContent = fs_extra_1.default.readFileSync(srcFile, { encoding: 'utf-8' });
            const destContent = fs_extra_1.default.existsSync(destFile) ? fs_extra_1.default.readFileSync(destFile, { encoding: 'utf-8' }) : null;
            if (srcContent !== destContent) {
                fs_extra_1.default.writeFileSync(destFile, srcContent, { encoding: 'utf-8' });
                logger.debug('Wrote ' + destFile);
            }
        }
    }
    if (removeStale) {
        for (const file of destFiles) {
            const srcFile = path_1.default.join(srcDir, file);
            const destFile = path_1.default.join(destDir, file);
            if (!fs_extra_1.default.existsSync(srcFile) && fs_extra_1.default.lstatSync(destFile).isFile()) {
                fs_extra_1.default.unlinkSync(destFile);
                logger.debug('Removed stale file ' + destFile);
            }
        }
    }
}
/**
 * Recursively finds all discriminators from a base schema and its inheritance chain for a derived schema.
 */
function findAllDiscriminators(baseSchemaOrRef, derivedSchema, openApi) {
    const discriminators = [];
    const visited = new Set();
    function collectDiscriminators(currentSchemaOrRef) {
        const currentSchema = ((0, openapi_typings_1.isReferenceObject)(currentSchemaOrRef) ? resolveRef(openApi, currentSchemaOrRef.$ref) : currentSchemaOrRef);
        // Avoid infinite recursion
        const schemaKey = (0, openapi_typings_1.isReferenceObject)(currentSchemaOrRef) ? currentSchemaOrRef.$ref : JSON.stringify(currentSchema);
        if (visited.has(schemaKey)) {
            return;
        }
        visited.add(schemaKey);
        // Check if current schema has a discriminator
        const discriminator = tryGetDiscriminator(currentSchemaOrRef, derivedSchema, openApi);
        if (discriminator) {
            discriminators.push(discriminator);
        }
        // Recursively check allOf schemas
        if (currentSchema.allOf) {
            for (const allOfSchema of currentSchema.allOf) {
                collectDiscriminators(allOfSchema);
            }
        }
    }
    collectDiscriminators(baseSchemaOrRef);
    return discriminators;
}
/**
 * Tries to get a discriminator info from a base schema and for a derived one.
 */
function tryGetDiscriminator(baseSchemaOrRef, derivedSchema, openApi) {
    const baseSchema = ((0, openapi_typings_1.isReferenceObject)(baseSchemaOrRef) ? resolveRef(openApi, baseSchemaOrRef.$ref) : baseSchemaOrRef);
    const discriminatorProp = baseSchema.discriminator?.propertyName;
    if (discriminatorProp) {
        const discriminatorValue = tryGetDiscriminatorValue(baseSchema, derivedSchema, openApi);
        if (discriminatorValue) {
            return {
                propName: discriminatorProp,
                value: discriminatorValue
            };
        }
    }
    return undefined;
}
/**
 * Tries to get a discriminator value from a base schema and for a derived one.
 */
function tryGetDiscriminatorValue(baseSchema, derivedSchema, openApi) {
    const mapping = baseSchema.discriminator?.mapping;
    if (mapping) {
        const mappingIndex = Object.values(mapping).findIndex((ref) => resolveRef(openApi, ref) === derivedSchema);
        return Object.keys(mapping)[mappingIndex] ?? null;
    }
    return null;
}
//# sourceMappingURL=gen-utils.js.map