"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Model = void 0;
const lodash_1 = require("lodash");
const enum_value_1 = require("./enum-value");
const gen_type_1 = require("./gen-type");
const gen_utils_1 = require("./gen-utils");
const openapi_typings_1 = require("./openapi-typings");
const property_1 = require("./property");
/**
 * Context to generate a model
 */
class Model extends gen_type_1.GenType {
    constructor(openApi, name, schema, options) {
        super(name, gen_utils_1.unqualifiedName, options);
        this.openApi = openApi;
        this.schema = schema;
        const description = schema.description || '';
        this.tsComments = (0, gen_utils_1.tsComments)(description, 0, schema.deprecated);
        const type = (0, openapi_typings_1.getSchemaType)(schema);
        // Handle enums
        const typeForEnum = Array.isArray(type) ? type[0] : type;
        if ((schema.enum || []).length > 0 && typeForEnum && ['string', 'number', 'integer'].includes(typeForEnum)) {
            this.enumArrayName = (0, lodash_1.upperCase)(this.typeName).replace(/\s+/g, '_');
            this.enumArrayFileName = (0, gen_utils_1.fileName)(this.typeName + '-array');
            const names = schema['x-enumNames'] || [];
            const descriptions = schema['x-enumDescriptions'] || [];
            const values = schema.enum || [];
            this.enumValues = [];
            for (let i = 0; i < values.length; i++) {
                const enumValue = new enum_value_1.EnumValue(typeForEnum, names[i], descriptions[i], values[i], options);
                this.enumValues.push(enumValue);
            }
            // When enumStyle is 'alias' it is handled as a simple type.
            this.isEnum = options.enumStyle !== 'alias';
        }
        const hasAllOf = schema.allOf && schema.allOf.length > 0;
        const hasOneOf = schema.oneOf && schema.oneOf.length > 0;
        this.isObject = (type === 'object' || !!schema.properties) && !(0, openapi_typings_1.isNullable)(schema) && !hasAllOf && !hasOneOf;
        this.isSimple = !this.isObject && !this.isEnum;
        this.readOnly = schema.readOnly || false;
        if (this.isObject) {
            // Object
            const propertiesByName = new Map();
            this.collectObject(schema, propertiesByName);
            const sortedNames = [...propertiesByName.keys()];
            sortedNames.sort();
            this.properties = sortedNames.map(propName => propertiesByName.get(propName));
        }
        this.collectImports(schema);
        this.updateImports();
        // handle orphan required property names
        if (hasAllOf) {
            this.collectOrphanRequiredProperties(schema);
        }
        // Resolve types after imports are finalized
        if (this.isObject) {
            // Resolve property types
            for (const property of this.properties) {
                property.resolveType();
            }
            // Finalize additional properties type
            this.finalizeAdditionalPropertiesType();
        }
        if (this.isSimple) {
            // Simple / array / enum / union / intersection - generate after imports are resolved
            this.simpleType = (0, gen_utils_1.tsType)(schema, options, openApi, this);
        }
    }
    initPathToRoot() {
        if (this.namespace) {
            // for each namespace level go one directory up
            // plus the "models" directory
            return this.namespace.split('/').map(() => '../').join('').concat('../');
        }
        return '../';
    }
    skipImport(name) {
        // Don't import own type
        return this.name === name;
    }
    /**
     * Returns the appropriate type name for a referenced model, considering import aliases
     */
    getImportTypeName(referencedModelName) {
        // Find if there's an import for this model
        const imp = this.imports.find(i => i.name === referencedModelName);
        if (imp) {
            // Use the import's qualified name (which might be an alias)
            return imp.qualifiedName;
        }
        // Fallback to the regular qualified name
        return (0, gen_utils_1.qualifiedName)(referencedModelName, this.options);
    }
    collectObject(schema, propertiesByName) {
        if (schema.type === 'object' || !!schema.properties) {
            // An object definition
            const properties = schema.properties || {};
            const required = schema.required || [];
            const readOnly = schema.readOnly || false;
            const propNames = Object.keys(properties);
            for (const propName of propNames) {
                const prop = new property_1.Property(this, propName, properties[propName], required.includes(propName), this.options, this.openApi);
                propertiesByName.set(propName, prop);
            }
            // Handle additional properties (defer type resolution if needed)
            if (schema.additionalProperties === true) {
                this.additionalPropertiesType = 'any';
            }
            else if (schema.additionalProperties) {
                // Store for later resolution
                this._additionalPropertiesSchema = schema.additionalProperties;
            }
            this.readOnly = readOnly;
        }
        if (schema.allOf) {
            schema.allOf.forEach(s => {
                if ((0, openapi_typings_1.isReferenceObject)(s)) {
                    // Resolve reference and collect properties
                    const resolved = (0, gen_utils_1.resolveRef)(this.openApi, s.$ref);
                    this.collectObject(resolved, propertiesByName);
                }
                else {
                    this.collectObject(s, propertiesByName);
                }
            });
        }
    }
    /**
     * Finalizes additional properties type after all property types are resolved
     */
    finalizeAdditionalPropertiesType() {
        if (this._additionalPropertiesSchema) {
            // When there are additional properties, we need an union of all types for it.
            // See https://github.com/cyclosproject/ng-openapi-gen/issues/68
            const propTypes = new Set();
            const appendType = (type) => {
                if (type.startsWith('null | ')) {
                    propTypes.add('null');
                    propTypes.add(type.substring('null | '.length));
                }
                else {
                    propTypes.add(type);
                }
            };
            for (const prop of this.properties) {
                appendType(prop.type);
                if (!prop.required) {
                    propTypes.add('undefined');
                }
            }
            const propType = (0, gen_utils_1.tsType)(this._additionalPropertiesSchema, this.options, this.openApi, this);
            appendType(propType);
            this.additionalPropertiesType = [...propTypes].sort().join(' | ');
        }
    }
    /**
     * Collects property names from allOf where only array of required properties is specified
     */
    collectOrphanRequiredProperties(schema) {
        for (const subschema of schema.allOf || []) {
            if ((0, openapi_typings_1.isReferenceObject)(subschema)) {
                continue;
            }
            if (subschema.required && !subschema.properties) {
                this.orphanRequiredProperties = (this.orphanRequiredProperties || []).concat(subschema.required);
            }
        }
    }
}
exports.Model = Model;
//# sourceMappingURL=model.js.map