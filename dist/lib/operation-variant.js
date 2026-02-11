"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OperationVariant = void 0;
const lodash_1 = require("lodash");
const gen_type_1 = require("./gen-type");
const gen_utils_1 = require("./gen-utils");
const openapi_typings_1 = require("./openapi-typings");
/**
 * An operation has a variant per distinct possible body content
 */
class OperationVariant extends gen_type_1.GenType {
    constructor(operation, methodName, requestBody, successResponse, options) {
        super(methodName, n => n, options);
        this.operation = operation;
        this.methodName = methodName;
        this.requestBody = requestBody;
        this.successResponse = successResponse;
        this.options = options;
        this.responseMethodName = `${methodName}$Response`;
        if (successResponse) {
            this.resultType = successResponse.type;
            this.responseType = this.inferResponseType(successResponse, operation, options);
            this.accept = successResponse.mediaType;
        }
        else {
            this.resultType = 'void';
            this.responseType = 'text';
            this.accept = '*/*';
        }
        this.isVoid = this.resultType === 'void';
        this.isNumber = this.resultType === 'number';
        this.isBoolean = this.resultType === 'boolean';
        this.isOther = !this.isVoid && !this.isNumber && !this.isBoolean;
        this.responseMethodTsComments = (0, gen_utils_1.tsComments)(this.responseMethodDescription(), 1, operation.deprecated);
        this.bodyMethodTsComments = (0, gen_utils_1.tsComments)(this.bodyMethodDescription(), 1, operation.deprecated);
        this.importPath = 'fn/' + (0, gen_utils_1.fileName)(this.operation.tag);
        this.importName = (0, gen_utils_1.ensureNotReserved)(methodName);
        this.importFile = (0, gen_utils_1.fileName)(methodName);
        this.paramsType = `${(0, lodash_1.upperFirst)(methodName)}$Params`;
        this.paramsImport = {
            importName: this.paramsType,
            importFile: this.importFile,
            importPath: this.importPath
        };
        // Collect parameter imports
        for (const parameter of this.operation.parameters) {
            this.collectImports(parameter.spec.schema, false, true);
        }
        // Collect the request body imports
        this.collectImports(this.requestBody?.spec?.schema);
        // Collect the response imports
        this.collectImports(this.successResponse?.spec?.schema);
        // Finally, update the imports
        this.updateImports();
    }
    inferResponseType(successResponse, operation, { customizedResponseType = {} }) {
        const customizedResponseTypeByPath = customizedResponseType[operation.path];
        if (customizedResponseTypeByPath) {
            return customizedResponseTypeByPath.toUse;
        }
        // When the schema is in binary format, return 'blob'
        let schemaOrRef = successResponse.spec?.schema || { type: 'string' };
        if ((0, openapi_typings_1.isReferenceObject)(schemaOrRef)) {
            schemaOrRef = (0, gen_utils_1.resolveRef)(operation.openApi, schemaOrRef.$ref);
        }
        const schema = schemaOrRef;
        if (schema.format === 'binary') {
            return 'blob';
        }
        const mediaType = successResponse.mediaType.toLowerCase();
        if (mediaType.includes('/json') || mediaType.includes('+json')) {
            return 'json';
        }
        else if (mediaType.startsWith('text/')) {
            return 'text';
        }
        else {
            return 'blob';
        }
    }
    responseMethodDescription() {
        return `${this.descriptionPrefix()}This method provides access to the full \`HttpResponse\`, allowing access to response headers.
To access only the response body, use \`${this.methodName}()\` instead.${this.descriptionSuffix()}`;
    }
    bodyMethodDescription() {
        return `${this.descriptionPrefix()}This method provides access only to the response body.
To access the full response (for headers, for example), \`${this.responseMethodName}()\` instead.${this.descriptionSuffix()}`;
    }
    descriptionPrefix() {
        let description = (this.operation.spec.description || '').trim();
        let summary = this.operation.spec.summary;
        if (summary) {
            if (!summary.endsWith('.')) {
                summary += '.';
            }
            description = summary + '\n\n' + description;
        }
        if (description !== '') {
            description += '\n\n';
        }
        return description;
    }
    descriptionSuffix() {
        const sends = this.requestBody ? 'sends `' + this.requestBody.mediaType + '` and ' : '';
        const handles = this.requestBody
            ? `handles request body of type \`${this.requestBody.mediaType}\``
            : 'doesn\'t expect any request body';
        return `\n\nThis method ${sends}${handles}.`;
    }
    skipImport() {
        return false;
    }
    initPathToRoot() {
        return this.importPath.split(/\//g).map(() => '..').join('/') + '/';
    }
    get tag() {
        return this.operation.tags[0] || this.options.defaultTag || 'Api';
    }
}
exports.OperationVariant = OperationVariant;
//# sourceMappingURL=operation-variant.js.map