import { MediaTypeObject, OpenAPIObject } from './openapi-typings';
import { Options } from './options';
/**
 * Either a request body or response content
 */
export declare class Content {
    mediaType: string;
    spec: MediaTypeObject;
    options: Options;
    openApi: OpenAPIObject;
    type: string;
    constructor(mediaType: string, spec: MediaTypeObject, options: Options, openApi: OpenAPIObject, method?: string);
}
