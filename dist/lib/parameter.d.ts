import { OpenAPIObject, ParameterObject } from './openapi-typings';
import { Options } from './options';
type ParameterLocation = 'query' | 'header' | 'path' | 'cookie';
/**
 * An operation parameter
 */
export declare class Parameter {
    spec: ParameterObject;
    var: string;
    varAccess: string;
    name: string;
    tsComments: string;
    required: boolean;
    in: ParameterLocation;
    type: string;
    style?: string;
    explode?: boolean;
    parameterOptions: string;
    specific: boolean;
    constructor(spec: ParameterObject, options: Options, openApi: OpenAPIObject);
    createParameterOptions(): string;
}
export {};
