'use strict';

const { HttpProxyAgent } = require('http-proxy-agent');
const { HttpsProxyAgent } = require('https-proxy-agent');
const https = require('https');

// eslint-disable-next-line no-underscore-dangle
const _getJSON = (url, callback) => {
	let agent;
	if (new URL(url).protocol === 'http:' && process.env.HTTP_PROXY) {
		agent = new HttpProxyAgent(process.env.HTTP_PROXY);
	} else if (new URL(url).protocol === 'http:' && process.env.http_proxy) {
		agent = new HttpProxyAgent(process.env.http_proxy);
	} else if (new URL(url).protocol === 'https:' && process.env.HTTPS_PROXY) {
		agent = new HttpsProxyAgent(process.env.HTTPS_PROXY);
	} else if (new URL(url).protocol === 'https:' && process.env.https_proxy) {
		agent = new HttpsProxyAgent(process.env.https_proxy);
	}
	https.get(url, { agent }, (response) => {
		let data = '';

		// Handle incoming data
		response.on('data', (chunk) => {
			data += chunk;
		});

		// Handle end of the response
		response.on('end', () => {
			let body;
			try {
				body = JSON.parse(data);
			} catch (parseError) {
				callback(`Parse error: ${parseError}`);
				return;
			}

			// Check response status code
			// eslint-disable-next-line no-magic-numbers
			if (response.statusCode !== 200) {
				callback('Unexpected response code.');
				return;
			}

			callback(null, body);
		});

	}).on('error', (error) => {
		callback(error);
	});
};

const getJSON = (url, callback) => {
	// eslint-disable-next-line no-underscore-dangle
	let _callback = callback;
	if (!_callback) {
		_callback = () => { };
	}
	return new Promise((resolve, reject) => {
		_getJSON(url, (error, body) => {
			if (error) {
				reject(error);
				_callback(error);
				return;
			}
			resolve(body);
			_callback(null, body);
		});
	});
};

module.exports = getJSON;
