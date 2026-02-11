"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Property = void 0;
const gen_utils_1 = require("./gen-utils");
/**
 * An object property
 */
class Property {
    constructor(model, name, schema, required, options, openApi) {
        this.model = model;
        this.name = name;
        this.schema = schema;
        this.required = required;
        this.options = options;
        this.openApi = openApi;
        // Defer type resolution until after imports are finalized
        this.type = ''; // Will be set later
        this.identifier = (0, gen_utils_1.escapeId)(this.name);
        this.readOnly = schema.readOnly || false;
        const description = schema.description || '';
        this.tsComments = (0, gen_utils_1.tsComments)(description, 1, schema.deprecated);
    }
    /**
     * Resolves the property type after imports are finalized
     */
    resolveType() {
        this.type = (0, gen_utils_1.tsType)(this.schema, this.options, this.openApi, this.model);
    }
}
exports.Property = Property;
//# sourceMappingURL=property.js.map