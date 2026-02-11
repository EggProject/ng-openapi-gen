import { EnumValue } from './enum-value';
import { GenType } from './gen-type';
import { OpenAPIObject, SchemaObject } from './openapi-typings';
import { Options } from './options';
import { Property } from './property';
/**
 * Context to generate a model
 */
export declare class Model extends GenType {
    openApi: OpenAPIObject;
    schema: SchemaObject;
    isSimple: boolean;
    isEnum: boolean;
    isObject: boolean;
    simpleType: string;
    enumValues: EnumValue[];
    enumArrayName?: string;
    enumArrayFileName?: string;
    elementType: string;
    properties: Property[];
    additionalPropertiesType: string;
    orphanRequiredProperties: string[];
    readOnly: boolean;
    constructor(openApi: OpenAPIObject, name: string, schema: SchemaObject, options: Options);
    protected initPathToRoot(): string;
    protected skipImport(name: string): boolean;
    /**
     * Returns the appropriate type name for a referenced model, considering import aliases
     */
    getImportTypeName(referencedModelName: string): string;
    private collectObject;
    private _additionalPropertiesSchema?;
    /**
     * Finalizes additional properties type after all property types are resolved
     */
    private finalizeAdditionalPropertiesType;
    /**
     * Collects property names from allOf where only array of required properties is specified
     */
    private collectOrphanRequiredProperties;
}
