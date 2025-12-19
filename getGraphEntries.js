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
	const nodesWithEngines = await tree.querySelectorAll(':attr(engines, [node])');
	return nodesWithEngines
		.flatMap(({
			name,
			package: {
				_inBundle,
				engines,
			},
			dev: nodeDev = false,
			peer: nodePeer = false,
		}) => (
			!_inBundle
			&& engines
			&& ((dev || !nodeDev) && (production || nodeDev) && (peer || !nodePeer)) // TODO: figure out why get-dep-tree isn't pruning properly
			&& selectedEngines.some((engine) => engines[engine] !== '*')
				? [[name, engines]]
				: []
		))
		.toSorted(([a, aE], [b, bE]) => a.localeCompare(b) || aE.node.localeCompare(bE.node));
};
