import { camelCase, deburr, kebabCase, last, upperCase, upperFirst } from '../lib/case';

/**
 * A `lib/case.ts` modul a lodash 4.17.21 hat segédfüggvényének 1:1 viselkedési
 * reprodukciója. Az alábbi elvárt értékek a lodash 4.17.21-ből származnak
 * (a kutatási dosszié `verify-projects.mjs` rigje 388 inputon 0 eltérést mért).
 */
describe('lib/case.ts (lodash 4.17.21 reproduction)', () => {
  describe('upperFirst', () => {
    const cases: [string, string][] = [
      ['', ''],
      ['fred', 'Fred'],
      ['FRED', 'FRED'],
      ['fred flintstone', 'Fred flintstone'],
      ['API_v2', 'API_v2'],
      ['déjà', 'Déjà'],
    ];
    it.each(cases)('upperFirst(%j) === %j', (input, expected) => {
      expect(upperFirst(input)).toBe(expected);
    });
  });

  describe('camelCase', () => {
    const cases: [string, string][] = [
      ['Foo Bar', 'fooBar'],
      ['--foo-bar--', 'fooBar'],
      ['__FOO_BAR__', 'fooBar'],
      ['XMLHttpRequest', 'xmlHttpRequest'],
      ['API_v2', 'apiV2'],
      ['user2name', 'user2Name'],
      ['déjà_vu', 'dejaVu'],
      ['café', 'cafe'],
      ['operationId', 'operationId'],
      ['keepFullResponseMediaType', 'keepFullResponseMediaType'],
      ['create-account', 'createAccount'],
      ['NODE_ENV', 'nodeEnv'],
      ['H2CO3', 'h2Co3'],
      ['PascalCaseKebab-case', 'pascalCaseKebabCase'],
    ];
    it.each(cases)('camelCase(%j) === %j', (input, expected) => {
      expect(camelCase(input)).toBe(expected);
    });
  });

  describe('kebabCase', () => {
    const cases: [string, string][] = [
      ['Foo Bar', 'foo-bar'],
      ['fooBar', 'foo-bar'],
      ['__FOO_BAR__', 'foo-bar'],
      ['XMLHttpRequest', 'xml-http-request'],
      ['getUserById', 'get-user-by-id'],
      ['API_v2', 'api-v-2'],
      ['camelizeModelNames', 'camelize-model-names'],
      ['createAccount', 'create-account'],
      ['NODE_ENV', 'node-env'],
    ];
    it.each(cases)('kebabCase(%j) === %j', (input, expected) => {
      expect(kebabCase(input)).toBe(expected);
    });
  });

  describe('upperCase', () => {
    const cases: [string, string][] = [
      ['--foo-bar', 'FOO BAR'],
      ['fooBar', 'FOO BAR'],
      ['__foo_bar__', 'FOO BAR'],
      ['hello world', 'HELLO WORLD'],
      ['XMLHttpRequest', 'XML HTTP REQUEST'],
      ['APIv2', 'AP IV 2'],
      ['deja vu', 'DEJA VU'],
    ];
    it.each(cases)('upperCase(%j) === %j', (input, expected) => {
      expect(upperCase(input)).toBe(expected);
    });
  });

  describe('deburr', () => {
    const cases: [string, string][] = [
      ['déjà vu', 'deja vu'],
      ['naïve', 'naive'],
      ['Æ', 'Ae'],
      ['æ', 'ae'],
      ['Œ', 'Oe'],
      ['œ', 'oe'],
      ['Đ', 'D'],
      ['đ', 'd'],
      ['ß', 'ss'],
      ['Þ', 'Th'],
      ['þ', 'th'],
      ['Ħ', 'H'],
      ['ħ', 'h'],
      ['Crème brûlée', 'Creme brulee'],
      ['', ''],
    ];
    it.each(cases)('deburr(%j) === %j', (input, expected) => {
      expect(deburr(input)).toBe(expected);
    });
  });

  describe('last', () => {
    it('returns the last element of a non-empty array', () => {
      expect(last([1, 2, 3])).toBe(3);
    });
    it('returns the last element for the media-type split call site', () => {
      expect(last(['application', 'json'])).toBe('json');
    });
    it('returns undefined for an empty array', () => {
      expect(last([])).toBeUndefined();
    });
  });

  describe('edge cases flagged by the research dossier', () => {
    it('empty string maps to empty across every compounder', () => {
      expect(camelCase('')).toBe('');
      expect(kebabCase('')).toBe('');
      expect(upperCase('')).toBe('');
      expect(deburr('')).toBe('');
      expect(upperFirst('')).toBe('');
    });

    it('only-separator input produces an empty string', () => {
      expect(camelCase('---___   ')).toBe('');
      expect(kebabCase('---___   ')).toBe('');
      expect(upperCase('---___   ')).toBe('');
    });

    it('all-diacritics input is fully deburred', () => {
      expect(deburr('àáâãäåçèéêë')).toBe('aaaaaaceeee');
      expect(camelCase('àáâãäåçèéêë')).toBe('aaaaaaceeee');
    });

    it('very long input is handled without truncation', () => {
      const long = 'a'.repeat(2000);
      expect(camelCase(long)).toHaveLength(2000);
    });
  });
});
