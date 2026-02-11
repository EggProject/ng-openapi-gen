import { Model } from './model';
import { OpenAPIObject, ReferenceObject, SchemaObject } from './openapi-typings';
import { Options } from './options';
/**
 * An object property
 */
export declare class Property {
    model: Model;
    name: string;
    schema: SchemaObject | ReferenceObject;
    required: boolean;
    options: Options;
    openApi: OpenAPIObject;
    identifier: string;
    tsComments: string;
    type: string;
    readOnly: boolean;
    constructor(model: Model, name: string, schema: SchemaObject | ReferenceObject, required: boolean, options: Options, openApi: OpenAPIObject);
    /**
     * Resolves the property type after imports are finalized
     */
    resolveType(): void;
}
