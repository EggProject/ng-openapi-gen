import { Importable } from './importable';
import { Options } from './options';
/** A general import */
export declare class Import implements Importable {
    name: string;
    typeName: string;
    qualifiedName: string;
    path: string;
    file: string;
    useAlias: boolean;
    fullPath: string;
    typeOnly: boolean;
    importName: string;
    importPath: string;
    importFile: string;
    importTypeName?: string;
    importQualifiedName?: string;
    constructor(name: string, typeName: string, qName: string, path: string, file: string, typeOnly: boolean);
}
/**
 * Manages the model imports to be added to a generated file
 */
export declare class Imports {
    private options;
    private currentTypeName?;
    private _imports;
    constructor(options: Options, currentTypeName?: string | undefined);
    /**
     * Adds an import
     */
    add(param: string | Importable, typeOnly: boolean): void;
    private hasImportWithTypeName;
    toArray(): Import[];
    get size(): number;
}
