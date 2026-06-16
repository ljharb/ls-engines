'use strict';

/** @import { EnginesRecord } from './validVersionsForEngines' */

const getTree = require('get-dep-tree');

/** @type {import('./getGraphEntries')} */
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
	return /** @type {{ name: string, package: { _inBundle?: boolean, engines?: EnginesRecord }, dev?: boolean, peer?: boolean }[]} */ (nodesWithEngines)
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
				? /** @type {[string, EnginesRecord][]} */ ([[name, engines]])
				: []
		))
		.toSorted(([a, aE], [b, bE]) => a.localeCompare(b) || /** @type {NonNullable<typeof aE.node>} */ (aE.node).localeCompare(/** @type {NonNullable<typeof bE.node>} */ (bE.node)));
};
