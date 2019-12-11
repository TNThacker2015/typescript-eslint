import { TSESLint } from '@typescript-eslint/experimental-utils';
import rule, {
  MessageIds,
  Options,
  PredefinedFormatsString,
  Selector,
  selectorTypeToMessageString,
} from '../../src/rules/naming-convention';
import { RuleTester, getFixturesRootDir } from '../RuleTester';

const ruleTester = new RuleTester({
  parser: '@typescript-eslint/parser',
});

// only need parserOptions for the `type` option tests
const rootDir = getFixturesRootDir();
const parserOptions = {
  tsconfigRootDir: rootDir,
  project: './tsconfig.json',
};

const formatTestNames: Readonly<Record<
  PredefinedFormatsString,
  Record<'valid' | 'invalid', string[]>
>> = {
  camelCase: {
    valid: ['strictCamelCase', 'lower', 'camelCaseUNSTRICT'],
    invalid: ['snake_case', 'UPPER_CASE', 'UPPER', 'StrictPascalCase'],
  },
  strictCamelCase: {
    valid: ['strictCamelCase', 'lower'],
    invalid: [
      'snake_case',
      'UPPER_CASE',
      'UPPER',
      'StrictPascalCase',
      'camelCaseUNSTRICT',
    ],
  },
  PascalCase: {
    valid: [
      'StrictPascalCase',
      'Pascal',
      'I18n',
      'PascalCaseUNSTRICT',
      'UPPER',
    ],
    invalid: ['snake_case', 'UPPER_CASE', 'strictCamelCase'],
  },
  StrictPascalCase: {
    valid: ['StrictPascalCase', 'Pascal', 'I18n'],
    invalid: [
      'snake_case',
      'UPPER_CASE',
      'UPPER',
      'strictCamelCase',
      'PascalCaseUNSTRICT',
    ],
  },
  UPPER_CASE: {
    valid: ['UPPER_CASE', 'UPPER'],
    invalid: [
      'lower',
      'snake_case',
      'SNAKE_case_UNSTRICT',
      'strictCamelCase',
      'StrictPascalCase',
    ],
  },
  // eslint-disable-next-line @typescript-eslint/camelcase
  snake_case: {
    valid: ['snake_case', 'lower'],
    invalid: [
      'UPPER_CASE',
      'SNAKE_case_UNSTRICT',
      'strictCamelCase',
      'StrictPascalCase',
    ],
  },
};

const REPLACE_REGEX = /%/g;

type Cases = {
  code: string[];
  options: Omit<Options[0], 'format'>;
}[];
function createValidTestCases(cases: Cases): TSESLint.ValidTestCase<Options>[] {
  const newCases: TSESLint.ValidTestCase<Options>[] = [];

  for (const test of cases) {
    for (const [formatLoose, names] of Object.entries(formatTestNames)) {
      const format = [formatLoose as PredefinedFormatsString];
      for (const name of names.valid) {
        const createCase = (
          preparedName: string,
          options: Selector,
        ): TSESLint.ValidTestCase<Options> => ({
          options: [
            {
              ...options,
              filter: '[iI]gnored',
            },
          ],
          code: `// ${JSON.stringify(options)}\n${test.code
            .map(code => code.replace(REPLACE_REGEX, preparedName))
            .join('\n')}`,
        });

        newCases.push(
          createCase(name, {
            ...test.options,
            format,
          }),

          // leadingUnderscore
          createCase(name, {
            ...test.options,
            format,
            leadingUnderscore: 'forbid',
          }),
          createCase(`_${name}`, {
            ...test.options,
            format,
            leadingUnderscore: 'require',
          }),
          createCase(`_${name}`, {
            ...test.options,
            format,
            leadingUnderscore: 'allow',
          }),
          createCase(name, {
            ...test.options,
            format,
            leadingUnderscore: 'allow',
          }),

          // trailingUnderscore
          createCase(name, {
            ...test.options,
            format,
            trailingUnderscore: 'forbid',
          }),
          createCase(`${name}_`, {
            ...test.options,
            format,
            trailingUnderscore: 'require',
          }),
          createCase(`${name}_`, {
            ...test.options,
            format,
            trailingUnderscore: 'allow',
          }),
          createCase(name, {
            ...test.options,
            format,
            trailingUnderscore: 'allow',
          }),

          // prefix
          createCase(`MyPrefix${name}`, {
            ...test.options,
            format,
            prefix: ['MyPrefix'],
          }),
          createCase(`MyPrefix2${name}`, {
            ...test.options,
            format,
            prefix: ['MyPrefix1', 'MyPrefix2'],
          }),

          // suffix
          createCase(`${name}MySuffix`, {
            ...test.options,
            format,
            suffix: ['MySuffix'],
          }),
          createCase(`${name}MySuffix2`, {
            ...test.options,
            format,
            suffix: ['MySuffix1', 'MySuffix2'],
          }),
        );
      }
    }
  }

  return newCases;
}
function createInvalidTestCases(
  cases: Cases,
): TSESLint.InvalidTestCase<MessageIds, Options>[] {
  const newCases: TSESLint.InvalidTestCase<MessageIds, Options>[] = [];

  for (const test of cases) {
    for (const [formatLoose, names] of Object.entries(formatTestNames)) {
      const format = [formatLoose as PredefinedFormatsString];
      for (const name of names.invalid) {
        const createCase = (
          preparedName: string,
          options: Selector,
          messageId: MessageIds,
          data: Record<string, unknown> = {},
        ): TSESLint.InvalidTestCase<MessageIds, Options> => ({
          options: [
            {
              ...options,
              filter: '[iI]gnored',
            },
          ],
          code: `// ${JSON.stringify(options)}\n${test.code
            .map(code => code.replace(REPLACE_REGEX, preparedName))
            .join('\n')}`,
          errors: test.code.map(() => ({
            messageId,
            ...(test.options.selector !== 'default' &&
            test.options.selector !== 'variableLike' &&
            test.options.selector !== 'memberLike' &&
            test.options.selector !== 'typeLike'
              ? {
                  data: {
                    type: selectorTypeToMessageString(test.options.selector),
                    name: preparedName,
                    ...data,
                  },
                }
              : // meta-types will use the correct selector, so don't assert on data shape
                {}),
          })),
        });

        const prefixSingle = ['MyPrefix'];
        const prefixMulti = ['MyPrefix1', 'MyPrefix2'];
        const suffixSingle = ['MySuffix'];
        const suffixMulti = ['MySuffix1', 'MySuffix2'];

        newCases.push(
          createCase(
            name,
            {
              ...test.options,
              format,
            },
            'doesNotMatchFormat',
            { formats: format.join(', ') },
          ),

          // leadingUnderscore
          createCase(
            `_${name}`,
            {
              ...test.options,
              format,
              leadingUnderscore: 'forbid',
            },
            'unexpectedUnderscore',
            { position: 'leading' },
          ),
          createCase(
            name,
            {
              ...test.options,
              format,
              leadingUnderscore: 'require',
            },
            'missingUnderscore',
            { position: 'leading' },
          ),

          // trailingUnderscore
          createCase(
            `${name}_`,
            {
              ...test.options,
              format,
              trailingUnderscore: 'forbid',
            },
            'unexpectedUnderscore',
            { position: 'trailing' },
          ),
          createCase(
            name,
            {
              ...test.options,
              format,
              trailingUnderscore: 'require',
            },
            'missingUnderscore',
            { position: 'trailing' },
          ),

          // prefix
          createCase(
            name,
            {
              ...test.options,
              format,
              prefix: prefixSingle,
            },
            'missingAffix',
            { position: 'prefix', affixes: prefixSingle.join(', ') },
          ),
          createCase(
            name,
            {
              ...test.options,
              format,
              prefix: prefixMulti,
            },
            'missingAffix',
            {
              position: 'prefix',
              affixes: prefixMulti.join(', '),
            },
          ),

          // suffix
          createCase(
            name,
            {
              ...test.options,
              format,
              suffix: suffixSingle,
            },
            'missingAffix',
            { position: 'suffix', affixes: suffixSingle.join(', ') },
          ),
          createCase(
            name,
            {
              ...test.options,
              format,
              suffix: suffixMulti,
            },
            'missingAffix',
            {
              position: 'suffix',
              affixes: suffixMulti.join(', '),
            },
          ),
        );
      }
    }
  }

  return newCases;
}

const cases: Cases = [
  // #region default
  {
    code: [
      'const % = 1;',
      'function % () {}',
      '(function (%) {});',
      'class Ignored { constructor(private %) {} }',
      'const ignored = { % };',
      'interface Ignored { %: string }',
      'type Ignored = { %: string }',
      'class Ignored { private % = 1 }',
      'class Ignored { constructor(private %) {} }',
      'class Ignored { private %() {} }',
      'const ignored = { %() {} };',
      'class Ignored { private get %() {} }',
      'enum Ignored { % }',
      'abstract class % {}',
      'interface % { }',
      'type % = { };',
      'enum % {}',
      'interface Ignored<%> extends Ignored<string> {}',
    ],
    options: {
      selector: 'default',
      filter: '[iI]gnored',
    },
  },
  // #endregion default

  // #region variable
  {
    code: [
      'const % = 1;',
      'let % = 1;',
      'var % = 1;',
      'const {%} = {ignored: 1};',
      'const {% = 2} = {ignored: 1};',
      'const {...%} = {ignored: 1};',
      'const [%] = [1];',
      'const [% = 1] = [1];',
      'const [...%] = [1];',
    ],
    options: {
      selector: 'variable',
    },
  },
  // #endregion variable

  // #region function
  {
    code: ['function % () {}', '(function % () {});', 'declare function % ();'],
    options: {
      selector: 'function',
    },
  },
  // #endregion function

  // #region parameter
  {
    code: [
      'function ignored(%) {}',
      '(function (%) {});',
      'declare function ignored(%);',
      'function ignored({%}) {}',
      'function ignored(...%) {}',
      'function ignored({% = 1}) {}',
      'function ignored({...%}) {}',
      'function ignored([%]) {}',
      'function ignored([% = 1]) {}',
      'function ignored([...%]) {}',
    ],
    options: {
      selector: 'parameter',
    },
  },
  // #endregion parameter

  // #region property
  {
    code: [
      'const ignored = { % };',
      'const ignored = { "%": 1 };',
      'interface Ignored { % }',
      'interface Ignored { "%": string }',
      'type Ignored = { % }',
      'type Ignored = { "%": string }',
      'class Ignored { private % }',
      'class Ignored { private "%" = 1 }',
      'class Ignored { private readonly % = 1 }',
      'class Ignored { private static % }',
      'class Ignored { private static readonly % = 1 }',
      'class Ignored { abstract % = 1 }',
      'class Ignored { declare % }',
    ],
    options: {
      selector: 'property',
    },
  },
  {
    code: [
      'class Ignored { abstract private static readonly % = 1; ignoredDueToModifiers = 1; }',
    ],
    options: {
      selector: 'property',
      modifiers: ['static', 'readonly'],
    },
  },
  // #endregion property

  // #region parameterProperty
  {
    code: [
      'class Ignored { constructor(private %) {} }',
      'class Ignored { constructor(readonly %) {} }',
      'class Ignored { constructor(private readonly %) {} }',
    ],
    options: {
      selector: 'parameterProperty',
    },
  },
  {
    code: ['class Ignored { constructor(private readonly %) {} }'],
    options: {
      selector: 'parameterProperty',
      modifiers: ['readonly'],
    },
  },
  // #endregion parameterProperty

  // #region method
  {
    code: [
      'const ignored = { %() {} };',
      'const ignored = { "%"() {} };',
      'const ignored = { %: () => {} };',
      'interface Ignored { %(): string }',
      'interface Ignored { "%"(): string }',
      'type Ignored = { %(): string }',
      'type Ignored = { "%"(): string }',
      'class Ignored { private %() {} }',
      'class Ignored { private "%"() {} }',
      'class Ignored { private readonly %() {} }',
      'class Ignored { private static %() {} }',
      'class Ignored { private static readonly %() {} }',
      'class Ignored { private % = () => {} }',
      'class Ignored { abstract %() }',
      'class Ignored { declare %() }',
    ],
    options: {
      selector: 'method',
    },
  },
  {
    code: [
      'class Ignored { abstract private static %() {}; ignoredDueToModifiers() {}; }',
    ],
    options: {
      selector: 'method',
      modifiers: ['abstract', 'static'],
    },
  },
  // #endregion method

  // #region accessor
  {
    code: [
      'const ignored = { get %() {} };',
      'const ignored = { set "%"(ignored) {} };',
      'class Ignored { private get %() {} }',
      'class Ignored { private set "%"(ignored) {} }',
      'class Ignored { private static get %() {} }',
    ],
    options: {
      selector: 'accessor',
    },
  },
  {
    code: [
      'class Ignored { private static get %() {}; get ignoredDueToModifiers() {}; }',
    ],
    options: {
      selector: 'accessor',
      modifiers: ['private', 'static'],
    },
  },
  // #endregion accessor

  // #region enumMember
  {
    code: ['enum Ignored { % }', 'enum Ignored { "%" }'],
    options: {
      selector: 'enumMember',
    },
  },
  // #endregion enumMember

  // #region class
  {
    code: ['class % {}', 'abstract class % {}', 'const ignored = class % {}'],
    options: {
      selector: 'class',
    },
  },
  {
    code: ['abstract class % {}; class ignoredDueToModifier {}'],
    options: {
      selector: 'class',
      modifiers: ['abstract'],
    },
  },
  // #endregion class

  // #region interface
  {
    code: ['interface % {}'],
    options: {
      selector: 'interface',
    },
  },
  // #endregion interface

  // #region typeAlias
  {
    code: ['type % = {};', 'type % = 1;'],
    options: {
      selector: 'typeAlias',
    },
  },
  // #endregion typeAlias

  // #region enum
  {
    code: ['enum % {}'],
    options: {
      selector: 'enum',
    },
  },
  // #endregion enum

  // #region typeParameter
  {
    code: [
      'class Ignored<%> {}',
      'function ignored<%>() {}',
      'type Ignored<%> = { ignored: % };',
      'interface Ignored<%> extends Ignored<string> {}',
    ],
    options: {
      selector: 'typeParameter',
    },
  },
  // #endregion typeParameter
];

ruleTester.run('naming-convention', rule, {
  valid: [
    ...createValidTestCases(cases),
    {
      code: `
        declare const string_camelCase: string;
        declare const string_camelCase: string | null;
        declare const string_camelCase: string | null | undefined;
        declare const string_camelCase: 'a' | null | undefined;
        declare const string_camelCase: string | 'a' | null | undefined;

        declare const number_camelCase: number;
        declare const number_camelCase: number | null;
        declare const number_camelCase: number | null | undefined;
        declare const number_camelCase: 1 | null | undefined;
        declare const number_camelCase: number | 2 | null | undefined;

        declare const boolean_camelCase: boolean;
        declare const boolean_camelCase: boolean | null;
        declare const boolean_camelCase: boolean | null | undefined;
        declare const boolean_camelCase: true | null | undefined;
        declare const boolean_camelCase: false | null | undefined;
        declare const boolean_camelCase: true | false | null | undefined;
      `,
      parserOptions,
      options: [
        {
          selector: 'variable',
          types: ['string'],
          format: ['camelCase'],
          prefix: ['string_'],
        },
        {
          selector: 'variable',
          types: ['number'],
          format: ['camelCase'],
          prefix: ['number_'],
        },
        {
          selector: 'variable',
          types: ['boolean'],
          format: ['camelCase'],
          prefix: ['boolean_'],
        },
      ],
    },
  ],
  invalid: [
    ...createInvalidTestCases(cases),
    {
      code: `
        declare const string_camelCase: string;
        declare const string_camelCase: string | null;
        declare const string_camelCase: string | null | undefined;
        declare const string_camelCase: 'a' | null | undefined;
        declare const string_camelCase: string | 'a' | null | undefined;

        declare const number_camelCase: number;
        declare const number_camelCase: number | null;
        declare const number_camelCase: number | null | undefined;
        declare const number_camelCase: 1 | null | undefined;
        declare const number_camelCase: number | 2 | null | undefined;

        declare const boolean_camelCase: boolean;
        declare const boolean_camelCase: boolean | null;
        declare const boolean_camelCase: boolean | null | undefined;
        declare const boolean_camelCase: true | null | undefined;
        declare const boolean_camelCase: false | null | undefined;
        declare const boolean_camelCase: true | false | null | undefined;
      `,
      options: [
        {
          selector: 'variable',
          types: ['string'],
          format: ['snake_case'],
          prefix: ['string_'],
        },
        {
          selector: 'variable',
          types: ['number'],
          format: ['snake_case'],
          prefix: ['number_'],
        },
        {
          selector: 'variable',
          types: ['boolean'],
          format: ['snake_case'],
          prefix: ['boolean_'],
        },
      ],
      parserOptions,
      errors: Array(16).fill({ messageId: 'doesNotMatchFormat' }),
    },
  ],
});