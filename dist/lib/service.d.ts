import { GenType } from './gen-type';
import { TagObject } from './openapi-typings';
import { Operation } from './operation';
import { Options } from './options';
/**
 * Context to generate a service
 */
export declare class Service extends GenType {
    operations: Operation[];
    constructor(tag: TagObject, operations: Operation[], options: Options);
    protected skipImport(): boolean;
    protected initPathToRoot(): string;
}
