import { InterfaceDeclaration, TypescriptParser } from 'typescript-parser';
import { NgOpenApiGen } from '../lib/ng-openapi-gen';
import { Options } from '../lib/options';
import allTypesSpec from './all-types.json';
import allOperationsSpec from './all-operations.json';
import { OpenAPIObject } from '../lib/openapi-typings';

const typesSpec = allTypesSpec as unknown as OpenAPIObject;
const opsSpec = allOperationsSpec as unknown as OpenAPIObject;

// Generate once per configuration, reuse across tests
const genTypes = new NgOpenApiGen(typesSpec, {
  input: 'all-types.json',
  output: 'out/no-optional-marker/',
  enumStyle: 'pascal',
  noOptionalMarker: true,
} as Options);
genTypes.generate();

const genTypesDefault = new NgOpenApiGen(typesSpec, {
  input: 'all-types.json',
  output: 'out/no-optional-marker-default/',
  enumStyle: 'pascal',
} as Options);
genTypesDefault.generate();

const genOps = new NgOpenApiGen(opsSpec, {
  input: 'all-operations.json',
  output: 'out/no-optional-marker-ops/',
  defaultTag: 'noTag',
  noOptionalMarker: true,
} as Options);
genOps.generate();

const genOpsDefault = new NgOpenApiGen(opsSpec, {
  input: 'all-operations.json',
  output: 'out/no-optional-marker-ops-default/',
  defaultTag: 'noTag',
} as Options);
genOpsDefault.generate();

describe('noOptionalMarker option', () => {

  describe('model generation (object.handlebars + gen-utils inline)', () => {
    it('should remove ? for optional non-nullable properties without adding | null', () => {
      const container = genTypes.models.get('Container');
      expect(container).toBeDefined();
      const ts = genTypes.templates.apply('model', container);

      // Optional properties should NOT have ?
      expect(ts).not.toMatch(/'stringProp'\?/);
      expect(ts).not.toMatch(/'booleanProp'\?/);
      expect(ts).not.toMatch(/'integerProp'\?/);

      // Non-nullable optional properties should NOT get | null
      expect(ts).toMatch(/'stringProp': string;/);
      expect(ts).toMatch(/'booleanProp': boolean;/);
      expect(ts).toMatch(/'integerProp': number;/);

      // Required properties unchanged
      expect(ts).toMatch(/'numberProp': number;/);
      expect(ts).toMatch(/'refEnumProp': RefEnum;/);
    });

    it('should preserve existing | null for nullable properties', () => {
      const container = genTypes.models.get('Container');
      const ts = genTypes.templates.apply('model', container);

      // Properties that are already nullable in the schema should keep | null
      expect(ts).toMatch(/'nullableObject': NullableObject \| null;/);
    });

    it('should still emit ? when noOptionalMarker is false/default', () => {
      const container = genTypesDefault.models.get('Container');
      const ts = genTypesDefault.templates.apply('model', container);

      // Optional properties SHOULD have ?
      expect(ts).toMatch(/'stringProp'\?/);
      expect(ts).toMatch(/'booleanProp'\?/);
    });

    it('should remove ? in inline object types (gen-utils)', async () => {
      const inlineObj = genTypes.models.get('InlineObject');
      expect(inlineObj).toBeDefined();
      const ts = genTypes.templates.apply('model', inlineObj);
      const parser = new TypescriptParser();
      const ast = await parser.parseSource(ts);
      const decl = ast.declarations[0] as InterfaceDeclaration;
      const prop = decl.properties[0];
      // The inline object type should not contain ?
      expect(prop.type).not.toContain('?');
    });

    it('should remove ? in allOf inline properties (gen-utils)', () => {
      const auditCdr = genTypes.models.get('AuditCdr');
      expect(auditCdr).toBeDefined();
      const ts = genTypes.templates.apply('model', auditCdr);
      expect(ts).not.toMatch(/'callFrom'\?/);
      expect(ts).not.toMatch(/'callTo'\?/);
      // Non-nullable properties should NOT get | null
      expect(ts).toMatch(/'callFrom': string;/);
      expect(ts).toMatch(/'callTo': string;/);
    });
  });

  describe('function generation (fn.handlebars)', () => {
    it('should remove ? for optional parameters in function params interface', () => {
      for (const [, service] of genOps.services) {
        for (const op of service.operations) {
          for (const variant of op.variants) {
            const ts = genOps.templates.apply('fn', variant);
            const paramsMatch = ts.match(/export interface \w+\$Params \{([\s\S]*?)\}/);
            if (paramsMatch) {
              expect(paramsMatch[1]).not.toContain('?:');
            }
          }
        }
      }
    });

    it('should emit ? for optional parameters when noOptionalMarker is false', () => {
      let foundOptional = false;
      for (const [, service] of genOpsDefault.services) {
        for (const op of service.operations) {
          for (const variant of op.variants) {
            const ts = genOpsDefault.templates.apply('fn', variant);
            const paramsMatch = ts.match(/export interface \w+\$Params \{([\s\S]*?)\}/);
            if (paramsMatch && paramsMatch[1].includes('?:')) {
              foundOptional = true;
            }
          }
        }
      }
      expect(foundOptional).toBe(true);
    });
  });
});
