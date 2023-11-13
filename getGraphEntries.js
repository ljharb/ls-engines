'use strict';

const getTree = require('get-dep-tree');

module.exports = async function getGraphEntries({
	mode,
	dev,
	peer,
	production,
	selectedEngines,
	logger = void undefined,
	path = void undefined,
}) {
	const tree = await getTree(mode, { dev, logger, path, peer, production });
	const nodesWithEngines = tree.inventory.filter(({
		package: {
			_inBundle,
			engines,
		},
		dev: nodeDev = false,
		peer: nodePeer = false,
	}) => ( // eslint-disable-line no-extra-parens
		!_inBundle
		&& engines
		&& ((dev || !nodeDev) && (production || nodeDev) && (peer || !nodePeer)) // TODO: figure out why get-dep-tree isn't pruning properly
		&& selectedEngines.some((engine) => engines[engine])
	));
	const tuples = Array.from(
		nodesWithEngines,
		({ name, package: { engines } }) => [name, engines],
	);
	return tuples.filter(([, engines]) => engines && selectedEngines.some((engine) => engines[engine] !== '*'));
};
