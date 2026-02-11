import { Content } from './content';
import { RequestBodyObject } from './openapi-typings';
import { Options } from './options';
/**
 * Describes a request body
 */
export declare class RequestBody {
    spec: RequestBodyObject;
    content: Content[];
    options: Options;
    tsComments: string;
    required: boolean;
    constructor(spec: RequestBodyObject, content: Content[], options: Options);
}
