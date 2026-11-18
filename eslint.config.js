import prettierConfig from 'eslint-config-prettier';
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
				...globals.react
			}
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
