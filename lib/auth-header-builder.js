const Shell = require('shelljs');
const _ = require('lodash');
const fs = require('fs');
const logger = require('log4js').getLogger('auth-header-builder');
logger.level = process.env.LOG_LEVEL || 'debug';

const API_KEY = process.env.API_KEY;

if (!API_KEY) { throw "API_KEY environment variable is not defined" };
if (runCommand('which ibmcloud') === '') { throw 'ibmcloud CLI is not installed'};

runCommand('ibmcloud login --apikey ' + API_KEY);
let oauthTokensRaw = runCommand('ibmcloud iam oauth-tokens').split('\n');
const iamAuthHeaders = retrieveAuthHeader('IAM', oauthTokensRaw);
var uaaAuthHeaders;

if (process.env.CL_TARGET=='CF') {
	runCommand('ibmcloud target --cf-api '+process.env.CF_API+' -o '+process.env.CF_ORG+' -s '+process
	.env.CF_SPACE).split('\n');
	var uaaTokensRaw = runCommand('ibmcloud cf oauth-token').split('\n');
	uaaAuthHeaders = retrieveUAAAuthHeader(uaaTokensRaw);
} 


module.exports = {
	iamAuthHeaders: iamAuthHeaders,
	uaaAuthHeaders: uaaAuthHeaders
}

function runCommand(cmd){
	logger.trace('runCommand');
	logger.debug('>> Executing ::', cmd);
	return Shell.exec(cmd).stdout;
}

function retrieveUAAAuthHeader(uaaTokensRaw){
	let token;
	token = uaaTokensRaw.toString().split('Invoking \'cf oauth-token\'...,,bearer ')[1];

	return {
		headers: {
			Authorization: 'bearer ' + token.slice(0,(token.length-1))
		}
	};
}

function retrieveAuthHeader(prefix, oauthTokensRaw){
	logger.trace('retrieveAuthHeader', prefix);
	let token;
	_.forEach(oauthTokensRaw, (value) => {
		if (_.startsWith(value, prefix)){
			token = value.split('Bearer ')[1];
		}
	});
	return {
		headers: {
			Authorization: 'Bearer ' + token
		}
	};
}