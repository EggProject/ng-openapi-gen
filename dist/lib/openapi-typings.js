"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenAPIV3 = void 0;
exports.isReferenceObject = isReferenceObject;
exports.isArraySchemaObject = isArraySchemaObject;
exports.isNullable = isNullable;
exports.getSchemaType = getSchemaType;
/**
 * Centralized OpenAPI type definitions and utilities for both OpenAPI 3.0 and 3.1 support
 */
const openapi_types_1 = require("openapi-types");
Object.defineProperty(exports, "OpenAPIV3", { enumerable: true, get: function () { return openapi_types_1.OpenAPIV3; } });
// === Type Guard Functions ===
// These functions provide safe type checking for OpenAPI objects
/**
 * Type guard to check if an object is a ReferenceObject
 */
function isReferenceObject(obj) {
    return obj && typeof obj === 'object' && '$ref' in obj;
}
/**
 * Type guard to check if a schema is an ArraySchemaObject
 */
function isArraySchemaObject(obj) {
    if (!('type' in obj)) {
        return false;
    }
    if (!('items' in obj)) {
        return false;
    }
    if (obj.type === 'array') {
        return true;
    }
    // OpenAPI 3.1 allows 'type' to be an array of types, so we need to check if it includes 'array'
    if (Array.isArray(obj.type) && obj.type.includes('array')) {
        return true;
    }
    return false;
}
/**
 * Checks if a schema is nullable (compatible with both OpenAPI 3.0 and 3.1)
 * OpenAPI 3.0 uses 'nullable: true', OpenAPI 3.1 uses 'type: [T, "null"]'
 */
function isNullable(schema) {
    // OpenAPI 3.0 style: nullable property
    if ('nullable' in schema && schema.nullable === true) {
        return true;
    }
    // OpenAPI 3.1 style: type array with "null"
    if ('type' in schema && Array.isArray(schema.type)) {
        return schema.type.includes('null');
    }
    return false;
}
/**
 * Safely extracts the type from a schema object
 */
function getSchemaType(schema) {
    if ('type' in schema && schema.type) {
        if (Array.isArray(schema.type)) {
            // OpenAPI 3.1 style - return all types for union handling
            return schema.type;
        }
        return schema.type;
    }
    // Return undefined for schemas without explicit type
    // This allows the caller to determine the appropriate default behavior
    return undefined;
}
//# sourceMappingURL=openapi-typings.js.map