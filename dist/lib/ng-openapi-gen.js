"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NgOpenApiGen = void 0;
exports.runNgOpenApiGen = runNgOpenApiGen;
exports.filterPaths = filterPaths;
const json_schema_ref_parser_1 = __importDefault(require("@apidevtools/json-schema-ref-parser"));
const eol_1 = __importDefault(require("eol"));
const lodash_1 = require("lodash");
const fs_extra_1 = __importDefault(require("fs-extra"));
const os_1 = __importDefault(require("os"));
const path_1 = __importDefault(require("path"));
const cmd_args_1 = require("./cmd-args");
const gen_utils_1 = require("./gen-utils");
const globals_1 = require("./globals");
const handlebars_manager_1 = require("./handlebars-manager");
const logger_1 = require("./logger");
const model_1 = require("./model");
const operation_1 = require("./operation");
const service_1 = require("./service");
const templates_1 = require("./templates");
const model_index_1 = require("./model-index");
/**
 * Main generator class
 */
class NgOpenApiGen {
    constructor(openApi, options) {
        this.openApi = openApi;
        this.options = options;
        this.models = new Map();
        this.services = new Map();
        this.operations = new Map();
        this.logger = new logger_1.Logger(options.silent);
        this.setDefaults();
        // Validate OpenAPI version
        this.validateOpenApiVersion();
        this.outDir = this.options.output || 'src/app/api';
        // Make sure the output path doesn't end with a slash
        if (this.outDir.endsWith('/') || this.outDir.endsWith('\\')) {
            this.outDir = this.outDir.substring(0, this.outDir.length - 1);
        }
        this.tempDir = this.outDir + '$';
        this.initTempDir();
        this.initHandlebars();
        this.readTemplates();
        this.readModels();
        this.readServices();
        // Ignore the unused models if not set to false in options
        if (this.options.ignoreUnusedModels !== false) {
            this.ignoreUnusedModels();
        }
    }
    /**
     * Set the temp dir to a system temporary directory if option useTempDir is set
     */
    initTempDir() {
        if (this.options.useTempDir === true) {
            const systemTempDir = path_1.default.join(os_1.default.tmpdir(), `ng-openapi-gen-${path_1.default.basename(this.outDir)}$`);
            this.tempDir = systemTempDir;
        }
    }
    /**
     * Actually generates the files
     */
    generate() {
        // Make sure the temporary directory is empty before starting
        (0, gen_utils_1.deleteDirRecursive)(this.tempDir);
        fs_extra_1.default.mkdirsSync(this.tempDir);
        try {
            // Generate each model
            const models = [...this.models.values()];
            for (const model of models) {
                this.write('model', model, model.fileName, 'models');
                if (this.options.enumArray && model.enumArrayFileName) {
                    this.write('enumArray', model, model.enumArrayFileName, 'models');
                }
            }
            // Generate each service and function
            const generateServices = !!this.options.services;
            const services = [...this.services.values()];
            for (const service of services) {
                if (generateServices) {
                    this.write('service', service, service.fileName, 'services');
                }
            }
            // Generate each function
            const functions = services.reduce((acc, service) => [
                ...acc,
                ...service.operations.reduce((opAcc, operation) => [
                    ...opAcc,
                    ...operation.variants
                ], [])
            ], []);
            // Detect duplicates by methodName and set exportName
            const methodNameCounts = new Map();
            for (const fn of functions) {
                const count = methodNameCounts.get(fn.methodName) || 0;
                methodNameCounts.set(fn.methodName, count + 1);
            }
            // Set exportName and paramsTypeExportName, then write each function
            for (const fn of functions) {
                const isDuplicate = (methodNameCounts.get(fn.methodName) || 0) > 1;
                if (isDuplicate) {
                    const tagSuffix = (0, lodash_1.upperFirst)(fn.operation.tag);
                    fn.exportName = fn.methodName + tagSuffix;
                    fn.paramsTypeExportName = fn.paramsType.replace('$Params', '') + tagSuffix + '$Params';
                }
                else {
                    fn.exportName = fn.importName;
                    fn.paramsTypeExportName = fn.paramsType;
                }
                this.write('fn', fn, fn.importFile, fn.importPath);
            }
            // Context object passed to general templates
            const general = { services, models, functions };
            // Generate the general files
            this.write('configuration', general, this.globals.configurationFile);
            this.write('response', general, this.globals.responseFile);
            this.write('requestBuilder', general, this.globals.requestBuilderFile);
            if (generateServices) {
                this.write('baseService', general, this.globals.baseServiceFile);
            }
            if (this.globals.apiServiceFile) {
                this.write('apiService', general, this.globals.apiServiceFile);
            }
            if (generateServices && this.globals.moduleClass && this.globals.moduleFile) {
                this.write('module', general, this.globals.moduleFile);
            }
            const modelIndex = this.globals.modelIndexFile || this.options.indexFile ? new model_index_1.ModelIndex(models, this.options) : null;
            if (this.globals.modelIndexFile) {
                this.write('modelIndex', { ...general, modelIndex }, this.globals.modelIndexFile);
            }
            if (this.globals.functionIndexFile) {
                this.write('functionIndex', general, this.globals.functionIndexFile);
            }
            if (generateServices && this.globals.serviceIndexFile) {
                this.write('serviceIndex', general, this.globals.serviceIndexFile);
            }
            if (this.options.indexFile) {
                this.write('index', { ...general, modelIndex }, 'index');
            }
            if (this.globals.utilsFile) {
                this.write('utils', general, this.globals.utilsFile);
            }
            // Now synchronize the temp to the output folder
            (0, gen_utils_1.syncDirs)(this.tempDir, this.outDir, this.options.removeStaleFiles !== false, this.logger);
            this.logger.info(`Generation from ${this.options.input} finished with ${models.length} models and ${services.length} services.`);
        }
        finally {
            // Always remove the temporary directory
            (0, gen_utils_1.deleteDirRecursive)(this.tempDir);
        }
    }
    write(template, model, baseName, subDir) {
        const ts = this.setEndOfLine(this.templates.apply(template, model));
        const file = path_1.default.join(this.tempDir, subDir || '.', `${baseName}.ts`);
        const dir = path_1.default.dirname(file);
        fs_extra_1.default.ensureDirSync(dir);
        fs_extra_1.default.writeFileSync(file, ts, { encoding: 'utf-8' });
    }
    initHandlebars() {
        this.handlebarsManager = new handlebars_manager_1.HandlebarsManager();
        this.handlebarsManager.readCustomJsFile(this.options);
        this.handlebarsManager.instance.registerHelper('isWriteMethod', (a) => String(a).toLowerCase() !== 'get');
    }
    readTemplates() {
        const hasLib = __dirname.endsWith(path_1.default.sep + 'lib');
        const builtInDir = path_1.default.join(__dirname, hasLib ? '../templates' : 'templates');
        const customDir = this.options.templates || '';
        this.globals = new globals_1.Globals(this.options);
        this.globals.rootUrl = this.readRootUrl();
        this.templates = new templates_1.Templates(builtInDir, customDir, this.handlebarsManager.instance);
        this.templates.setGlobals(this.globals);
    }
    readRootUrl() {
        if (!this.openApi.servers || this.openApi.servers.length === 0) {
            return '';
        }
        const server = this.openApi.servers[0];
        let rootUrl = server.url;
        if (rootUrl == null || rootUrl.length === 0) {
            return '';
        }
        const vars = server.variables || {};
        for (const key of Object.keys(vars)) {
            const value = String(vars[key].default);
            rootUrl = rootUrl.replace(`{${key}}`, value);
        }
        return rootUrl;
    }
    readModels() {
        const schemas = (this.openApi.components || {}).schemas || {};
        for (const name of Object.keys(schemas)) {
            const schema = schemas[name];
            if (!schema)
                continue;
            // Resolve reference if needed
            let resolvedSchema;
            if ('$ref' in schema) {
                // It's a ReferenceObject, resolve it
                resolvedSchema = (0, gen_utils_1.resolveRef)(this.openApi, schema.$ref);
            }
            else {
                // It's already a SchemaObject
                resolvedSchema = schema;
            }
            const model = new model_1.Model(this.openApi, name, resolvedSchema, this.options);
            this.models.set(name, model);
        }
    }
    readServices() {
        const defaultTag = this.options.defaultTag || 'Api';
        // First read all operations, as tags are by operation
        const operationsByTag = new Map();
        if (this.openApi.paths) {
            for (const opPath of Object.keys(this.openApi.paths)) {
                const pathSpec = this.openApi.paths[opPath];
                if (!pathSpec)
                    continue;
                for (const method of gen_utils_1.HTTP_METHODS) {
                    const methodSpec = pathSpec[method];
                    if (methodSpec) {
                        let id = methodSpec.operationId;
                        if (id) {
                            // Make sure the id is valid
                            id = (0, gen_utils_1.methodName)(id);
                        }
                        else {
                            // Generate an id
                            id = (0, gen_utils_1.methodName)(`${opPath}.${method}`);
                            this.logger.warn(`Operation '${opPath}.${method}' didn't specify an 'operationId'. Assuming '${id}'.`);
                        }
                        if (this.operations.has(id)) {
                            // Duplicated id. Add a suffix
                            let suffix = 0;
                            let newId = id;
                            while (this.operations.has(newId)) {
                                newId = `${id}_${++suffix}`;
                            }
                            this.logger.warn(`Duplicate operation id '${id}'. Assuming id ${newId} for operation '${opPath}.${method}'.`);
                            id = newId;
                        }
                        const operation = new operation_1.Operation(this.openApi, opPath, pathSpec, method, id, methodSpec, this.options);
                        // Set a default tag if no tags are found
                        if (operation.tags.length === 0) {
                            this.logger.warn(`No tags set on operation '${opPath}.${method}'. Assuming '${defaultTag}'.`);
                            operation.tags.push(defaultTag);
                        }
                        for (const tag of operation.tags) {
                            let operations = operationsByTag.get(tag);
                            if (!operations) {
                                operations = [];
                                operationsByTag.set(tag, operations);
                            }
                            operations.push(operation);
                        }
                        // Store the operation
                        this.operations.set(id, operation);
                    }
                }
            }
            // Then create a service per operation, as long as the tag is included
            const includeTags = this.options.includeTags || [];
            const excludeTags = this.options.excludeTags || [];
            const tags = this.openApi.tags || [];
            for (const tagName of operationsByTag.keys()) {
                if (includeTags.length > 0 && !includeTags.includes(tagName)) {
                    this.logger.info(`Ignoring tag ${tagName} because it is not listed in the 'includeTags' option`);
                    continue;
                }
                if (excludeTags.length > 0 && excludeTags.includes(tagName)) {
                    this.logger.info(`Ignoring tag ${tagName} because it is listed in the 'excludeTags' option`);
                    continue;
                }
                const operations = operationsByTag.get(tagName) || [];
                const tag = tags.find(t => t.name === tagName) || { name: tagName };
                const service = new service_1.Service(tag, operations, this.options);
                this.services.set(tag.name, service);
            }
        }
    }
    ignoreUnusedModels() {
        // First, collect all type names used by services
        const usedNames = new Set();
        for (const service of this.services.values()) {
            for (const imp of service.imports) {
                if (imp.path.includes('/models/')) {
                    usedNames.add(imp.typeName);
                }
            }
            for (const op of service.operations) {
                for (const variant of op.variants) {
                    for (const imp of variant.imports) {
                        if (imp.path.includes('/models/')) {
                            usedNames.add(imp.typeName);
                        }
                    }
                }
            }
            for (const imp of service.additionalDependencies) {
                usedNames.add(imp);
            }
        }
        // Collect dependencies on models themselves
        const referencedModels = Array.from(usedNames);
        usedNames.clear();
        referencedModels.forEach(name => this.collectDependencies(name, usedNames));
        // Then delete all unused models
        for (const model of this.models.values()) {
            if (!usedNames.has(model.name)) {
                this.logger.debug(`Ignoring model ${model.name} because it is not used anywhere`);
                this.models.delete(model.name);
            }
        }
    }
    collectDependencies(name, usedNames) {
        const model = this.models.get(name);
        if (!model || usedNames.has(model.name)) {
            return;
        }
        // Add the model name itself
        usedNames.add(model.name);
        // Then find all referenced names and recurse
        this.allReferencedNames(model.schema).forEach(n => this.collectDependencies(n, usedNames));
    }
    allReferencedNames(schema) {
        if (!schema) {
            return [];
        }
        // Type guard for ReferenceObject
        if ('$ref' in schema) {
            return [(0, gen_utils_1.simpleName)(schema.$ref)];
        }
        // Now we know it's a SchemaObject
        const result = [];
        (schema.allOf || []).forEach(s => Array.prototype.push.apply(result, this.allReferencedNames(s)));
        (schema.anyOf || []).forEach(s => Array.prototype.push.apply(result, this.allReferencedNames(s)));
        (schema.oneOf || []).forEach(s => Array.prototype.push.apply(result, this.allReferencedNames(s)));
        if (schema.properties) {
            for (const prop of Object.keys(schema.properties)) {
                Array.prototype.push.apply(result, this.allReferencedNames(schema.properties[prop]));
            }
        }
        if (typeof schema.additionalProperties === 'object') {
            Array.prototype.push.apply(result, this.allReferencedNames(schema.additionalProperties));
        }
        // Type guard for ArraySchemaObject (has items property)
        if ('type' in schema && schema.type === 'array' && 'items' in schema) {
            Array.prototype.push.apply(result, this.allReferencedNames(schema.items));
        }
        return result;
    }
    validateOpenApiVersion() {
        const version = this.openApi.openapi;
        if (!version) {
            throw new Error('OpenAPI specification version is missing');
        }
        // Check if it's a supported version (3.0.x or 3.1.x)
        const versionRegex = /^3\.(0|1)(\.\d+)?$/;
        if (!versionRegex.test(version)) {
            throw new Error(`Unsupported OpenAPI version: ${version}. Only OpenAPI 3.0.x and 3.1.x are supported.`);
        }
        this.logger.info(`Using OpenAPI specification version: ${version}`);
    }
    setEndOfLine(text) {
        switch (this.options.endOfLineStyle) {
            case 'cr':
                return eol_1.default.cr(text);
            case 'lf':
                return eol_1.default.lf(text);
            case 'crlf':
                return eol_1.default.crlf(text);
            default:
                return eol_1.default.auto(text);
        }
    }
    setDefaults() {
        if (this.options.module === undefined) {
            this.options.module = false;
        }
        else if (this.options.module === true) {
            this.options.module = 'ApiModule';
        }
        if (!this.options.enumStyle) {
            this.options.enumStyle = 'alias';
        }
        if (this.options.enumStyle === 'alias' && this.options.enumArray == null) {
            this.options.enumArray = true;
        }
    }
}
exports.NgOpenApiGen = NgOpenApiGen;
/**
 * Parses the command-line arguments, reads the configuration file and run the generation
 */
async function runNgOpenApiGen() {
    const options = (0, cmd_args_1.parseOptions)();
    const refParser = new json_schema_ref_parser_1.default();
    let input = options.input;
    const timeout = options.fetchTimeout == null ? 20000 : options.fetchTimeout;
    try {
        // If input is a URL, try downloading it locally first to avoid URL-based $ref resolution issues
        if (input.startsWith('http://') || input.startsWith('https://')) {
            try {
                const response = await fetch(input);
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                const specContent = await response.text();
                // Write to a temporary file
                const tempFile = path_1.default.join(os_1.default.tmpdir(), `ng-openapi-gen-${Date.now()}.json`);
                await fs_extra_1.default.writeFile(tempFile, specContent);
                input = tempFile;
                // Clean up temp file after processing
                process.on('exit', () => {
                    try {
                        fs_extra_1.default.unlinkSync(tempFile);
                    }
                    catch {
                        // Ignore cleanup errors
                    }
                });
            }
            catch (fetchError) {
                console.warn(`Failed to download spec from URL, will try direct parsing: ${fetchError}`);
                // Fall back to original input
                input = options.input;
            }
        }
        // Parse the OpenAPI specification without dereferencing to preserve $ref properties
        // The generator expects $ref properties to remain intact for proper model generation
        const openApi = await refParser.parse(input, {
            resolve: {
                http: { timeout }
            }
        });
        const { excludeTags = [], excludePaths = [], includeTags = [] } = options;
        openApi.paths = filterPaths(openApi.paths ?? {}, excludeTags, excludePaths, includeTags);
        const gen = new NgOpenApiGen(openApi, options);
        gen.generate();
    }
    catch (err) {
        console.log(`Error on API generation from ${input}: ${err}`);
        process.exit(1);
    }
}
function filterPaths(paths, excludeTags = [], excludePaths = [], includeTags = []) {
    paths = JSON.parse(JSON.stringify(paths));
    const filteredPaths = {};
    for (const key in paths) {
        if (!paths.hasOwnProperty(key))
            continue;
        if (excludePaths?.includes(key)) {
            console.log(`Path ${key} is excluded by excludePaths`);
            continue;
        }
        const pathItem = paths[key];
        if (!pathItem)
            continue;
        let shouldRemovePath = false;
        const httpMethods = ['get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace'];
        for (const method of httpMethods) {
            const operation = pathItem[method];
            if (!operation)
                continue;
            const tags = operation.tags || [];
            // if tag on method in includeTags then continue
            if (tags.some(tag => includeTags.includes(tag))) {
                continue;
            }
            // if tag on method in excludeTags then remove the method
            if (tags.some(tag => excludeTags.includes(tag)) || !!includeTags?.length) {
                console.log(`Path ${key} is excluded by excludeTags`);
                delete pathItem[method];
                // if path has no method left then "should remove"
                const remainingMethods = httpMethods.filter(m => pathItem[m]);
                if (remainingMethods.length === 0) {
                    shouldRemovePath = true;
                    break;
                }
            }
        }
        if (shouldRemovePath) {
            continue;
        }
        filteredPaths[key] = pathItem;
    }
    return filteredPaths;
}
//# sourceMappingURL=ng-openapi-gen.js.map