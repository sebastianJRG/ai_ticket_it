import prettierConfig from 'eslint-config-prettier';
import jsdoc from 'eslint-plugin-jsdoc';
import globals from 'globals';

export default [
	{
		ignores: ['**/node_modules/**', 'frontend/.expo/**', 'frontend/dist/**']
	},
	// Reglas transversales para el monorepo
	{
		files: ['**/*.js', '**/*.jsx'],
		rules: {
			'no-unused-vars': ['warn', { varsIgnorePattern: '^React$' }],
			'no-undef': 'error'
		}
	},
	// Entorno de ejecución estricto para Backend (Node + Express)
	{
		files: ['backend/**/*.js'],
		languageOptions: {
			globals: {
				...globals.node
			}
		}
	},
	// Entorno de ejecución para Frontend (React Native)
	{
		files: ['frontend/**/*.js', 'frontend/**/*.jsx'],
		languageOptions: {
			parserOptions: { ecmaFeatures: { jsx: true } },
			globals: {
				...globals.browser,
				...globals.react,
				// process.env.EXPO_PUBLIC_* y global en tests
				process: 'readonly',
				global: 'writable'
			}
		}
	},
	// JSDoc obligatorio en el código del frontend (constitución, principio 6).
	// Los props desestructurados se documentan con @typedef/@property, por eso
	// no se exige un @param por cada propiedad desestructurada.
	{
		files: ['frontend/src/**/*.js', 'frontend/src/**/*.jsx'],
		plugins: { jsdoc },
		settings: { jsdoc: { mode: 'typescript' } },
		rules: {
			'jsdoc/require-jsdoc': [
				'error',
				{
					publicOnly: true,
					require: {
						FunctionDeclaration: true,
						ClassDeclaration: true,
						ArrowFunctionExpression: true,
						FunctionExpression: true,
						MethodDefinition: true
					}
				}
			],
			'jsdoc/require-param': ['error', { checkDestructured: false }],
			'jsdoc/require-param-type': 'error',
			'jsdoc/require-returns': 'error',
			'jsdoc/require-file-overview': [
				'error',
				{ tags: { file: { mustExist: true, preventDuplicates: true } } }
			],
			'jsdoc/check-tag-names': ['error', { definedTags: ['owner', 'license'] }]
		}
	},
	// Tests del frontend (Jest)
	{
		files: ['frontend/__tests__/**/*.js', 'frontend/__tests__/**/*.jsx'],
		languageOptions: {
			globals: {
				...globals.jest
			}
		}
	},
	// Debe ir al final: apaga las reglas de ESLint que interfieren con Prettier
	prettierConfig
];
