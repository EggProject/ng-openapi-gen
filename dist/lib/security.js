"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Security = void 0;
const gen_utils_1 = require("./gen-utils");
/**
 * An operation security
 */
class Security {
    constructor(key, spec, scope = []) {
        this.spec = spec;
        this.scope = scope;
        // Handle different types of security schemes
        if (spec.type === 'apiKey') {
            const apiKeySpec = spec;
            this.name = apiKeySpec.name || '';
            this.in = apiKeySpec.in || 'header';
        }
        else {
            this.name = '';
            this.in = 'header';
        }
        this.var = (0, gen_utils_1.methodName)(key);
        this.tsComments = (0, gen_utils_1.tsComments)(spec.description || '', 2);
        this.type = 'string'; // Default type for security parameters
    }
}
exports.Security = Security;
//# sourceMappingURL=security.js.map