import { Options } from './options';
/**
 * Stores the global variables used on generation
 */
export declare class Globals {
    configurationClass: string;
    configurationFile: string;
    configurationParams: string;
    baseServiceClass: string;
    baseServiceFile: string;
    apiServiceClass?: string;
    apiServiceFile?: string;
    requestBuilderClass: string;
    requestBuilderFile: string;
    responseClass: string;
    responseFile: string;
    utilsFile?: string;
    moduleClass?: string;
    moduleFile?: string;
    modelIndexFile?: string;
    functionIndexFile?: string;
    serviceIndexFile?: string;
    rootUrl?: string;
    promises: boolean;
    generateServices: boolean;
    experimental?: boolean;
    constructor(options: Options);
}
