'use strict';

const preloadList = require('node-preload');
preloadList.push(require.resolve('node-recorder'));

require('node-recorder');
delete process.env.NODE_OPTIONS;
process.env.NODE_NO_WARNINGS = 1;
