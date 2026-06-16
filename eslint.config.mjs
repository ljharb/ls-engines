import ljharbConfig from '@ljharb/eslint-config/flat/node/22';

export default [
	{
		ignores: ['test/fixtures/**', 'coverage/**'],
	},
	...ljharbConfig,
	{
		rules: {
			'array-bracket-newline': 'off',
			'func-style': 'off',
			'id-length': 'off',
			'max-len': 'off',
			'max-lines': 'off',
			'max-lines-per-function': ['error', 110],
			'max-nested-callbacks': ['error', 4],
			'max-params': ['error', 6],
			'multiline-comment-style': 'off',
			'no-magic-numbers': ['warn', { ignore: [-1, 0] }],
			'object-curly-newline': 'off',
		},
	},
	{
		files: ['bin.mjs', 'checkCurrent.js', 'checkEngines.js'],
		rules: {
			'no-throw-literal': 'off',
		},
	},
	{
		files: ['checkEngines.js'],
		rules: {
			'max-lines-per-function': 'off',
			'max-params': 'off',
		},
	},
	{
		files: ['getLatestMajors.js'],
		rules: {
			'no-param-reassign': ['error', { props: false }],
		},
	},
	{
		files: ['test/**'],
		rules: {
			'max-lines-per-function': 'off',
			'max-params': 'off',
			'no-magic-numbers': 'off',
		},
	},
];
