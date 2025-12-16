import ljharbConfig from '@ljharb/eslint-config/flat/node/22';

export default [
	{
		ignores: ['test/fixtures/**', 'coverage/**'],
	},
	...ljharbConfig.map((config) => (config.files ? config : { ...config, files: ['**/*.js', 'bin/ls-engines'] })),
	{
		rules: {
			'array-bracket-newline': 0,
			'func-style': 0,
			'id-length': 0,
			'max-len': 0,
			'max-lines': 0,
			'max-lines-per-function': [2, 110],
			'max-nested-callbacks': [2, 4],
			'max-params': [2, 6],
			'multiline-comment-style': 0,
			'object-curly-newline': 0,
		},
	},
	{
		files: ['checkCurrent.js', 'checkEngines.js'],
		rules: {
			'no-throw-literal': 0,
		},
	},
	{
		files: ['checkEngines.js'],
		rules: {
			'max-lines-per-function': 0,
			'max-params': 0,
		},
	},
	{
		files: ['getLatestMajors.js'],
		rules: {
			'no-param-reassign': [2, { props: false }],
		},
	},
	{
		files: ['test/**'],
		rules: {
			'max-lines-per-function': 0,
			'max-params': 0,
		},
	},
];
