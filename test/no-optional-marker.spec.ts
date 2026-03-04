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
    it('should replace ? with | null for optional properties in interface', () => {
      const container = genTypes.models.get('Container');
      expect(container).toBeDefined();
      const ts = genTypes.templates.apply('model', container);

      // Optional properties should NOT have ?
      expect(ts).not.toMatch(/'stringProp'\?/);
      expect(ts).not.toMatch(/'booleanProp'\?/);
      expect(ts).not.toMatch(/'integerProp'\?/);

      // Optional properties should have | null appended
      expect(ts).toMatch(/'stringProp': string \| null;/);
      expect(ts).toMatch(/'booleanProp': boolean \| null;/);
      expect(ts).toMatch(/'integerProp': number \| null;/);

      // Required properties should NOT have | null added
      expect(ts).toMatch(/'numberProp': number;/);
      expect(ts).toMatch(/'refEnumProp': RefEnum;/);
    });

    it('should still emit ? when noOptionalMarker is false/default', () => {
      const container = genTypesDefault.models.get('Container');
      const ts = genTypesDefault.templates.apply('model', container);

      // Optional properties SHOULD have ?
      expect(ts).toMatch(/'stringProp'\?/);
      expect(ts).toMatch(/'booleanProp'\?/);
    });

    it('should replace ? with | null in inline object types (gen-utils)', async () => {
      const inlineObj = genTypes.models.get('InlineObject');
      expect(inlineObj).toBeDefined();
      const ts = genTypes.templates.apply('model', inlineObj);
      const parser = new TypescriptParser();
      const ast = await parser.parseSource(ts);
      const decl = ast.declarations[0] as InterfaceDeclaration;
      const prop = decl.properties[0];
      // The inline object type should not contain ? but should have | null
      expect(prop.type).not.toContain('?');
      expect(prop.type).toContain('| null');
    });

    it('should replace ? with | null in allOf inline properties (gen-utils)', () => {
      const auditCdr = genTypes.models.get('AuditCdr');
      expect(auditCdr).toBeDefined();
      const ts = genTypes.templates.apply('model', auditCdr);
      // Should not have ? for optional allOf inline properties
      expect(ts).not.toMatch(/'callFrom'\?/);
      expect(ts).not.toMatch(/'callTo'\?/);
      // Should have | null instead
      expect(ts).toMatch(/'callFrom': string \| null/);
      expect(ts).toMatch(/'callTo': string \| null/);
    });

    it('should never produce double | null for already nullable types', () => {
      for (const [, model] of genTypes.models) {
        const ts = genTypes.templates.apply('model', model);
        expect(ts).not.toMatch(/\| null[^;]*\| null/);
      }
    });
  });

  describe('function generation (fn.handlebars)', () => {
    it('should replace ? with | null for optional parameters in function params interface', () => {
      for (const [, service] of genOps.services) {
        for (const op of service.operations) {
          for (const variant of op.variants) {
            const ts = genOps.templates.apply('fn', variant);
            const paramsMatch = ts.match(/export interface \w+\$Params \{([\s\S]*?)\}/);
            if (paramsMatch) {
              // No parameter should have ?
              expect(paramsMatch[1]).not.toContain('?:');
            }
          }
        }
      }
    });

    it('should add | null for optional parameters in function params interface', () => {
      let foundNullUnion = false;
      for (const [, service] of genOps.services) {
        for (const op of service.operations) {
          for (const variant of op.variants) {
            const ts = genOps.templates.apply('fn', variant);
            const paramsMatch = ts.match(/export interface \w+\$Params \{([\s\S]*?)\}/);
            if (paramsMatch && paramsMatch[1].includes('| null')) {
              foundNullUnion = true;
            }
          }
        }
      }
      expect(foundNullUnion).toBe(true);
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
