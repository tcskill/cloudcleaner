const Shell = require('shelljs');
const request = require('sync-request');
const _ = require('lodash');
const logger = require('log4js').getLogger('kube-cleaner');
logger.level = process.env.LOG_LEVEL || 'debug';

const REGISTRY_API = process.env.REGISTRY_API || "https://us.icr.io/api";
const KUBE_CLUSTER = process.env.KUBE_CLUSTER;

if (!KUBE_CLUSTER) { throw "KUBE_CLUSTER environment variable is not defined" };

if (runCommand('which kubectl') === '') { throw 'Kubectl is not installed'};
if (runCommand('which helm') === '') { throw 'Helm is not installed'};

module.exports = {
	clean: function(iamAuthHeaders){
		logger.trace('clean');
		const tokenElements = iamAuthHeaders.headers.Authorization.split('Bearer ')[1].split(".");
		const tokenPayload = JSON.parse(Buffer.from(tokenElements[1], 'base64'));
		const accountId = tokenPayload.account.bss;
		iamAuthHeaders.headers.Account = accountId;
		logger.debug('accountId', accountId);
		const images = getAllImages(iamAuthHeaders);
		logger.debug('images', images);
		//deleteAllImages(iamAuthHeaders, images);
		var charts = getAllHelmCharts(iamAuthHeaders);
		logger.debug('charts', charts);
		//deleteAllHelmCharts(charts);
		const secrets = getAllSecrets();
		logger.debug('secrets', secrets);
		//deleteAllSecrets(secrets);
	}
}

function getAllImages(iamAuthHeaders){
	logger.trace('getAllImages');
	var resp = request('GET', REGISTRY_API+'/v1/images', iamAuthHeaders);

	try {
		const resources = JSON.parse(resp.getBody('utf8'));
		let images = [];
		_.forEach(resources, (resource) => {
			_.forEach(resource.RepoTags, (repoTag)=>{
				if (
					repoTag.indexOf('namespace_devex/bmd-codegen-swagger-validator') === -1 &&
					repoTag.indexOf('namespace_devex/bmd-codegen-yeoman') === -1 &&
					repoTag.indexOf('namespace_devex/testapp') === -1
				) {
					images.push(repoTag);
				}
			});
		});
		return images;
	} catch (e){
		throw "Failed to retrieve list of images", e;
	}
}

function deleteAllImages(iamAuthHeader, images){
	logger.trace('deleteAllImages');
	_.forEach(images, (image)=>{
		const url = REGISTRY_API + '/v1/images/' + image;
		logger.debug("Invoking DELETE on", url);
		var resp = request('DELETE', url, iamAuthHeader);
		if (resp.statusCode < 200 || resp.statusCode > 299){
			logger.debug(resp.statusCode, "FAIL");
			try { logger.debug(resp.getBody('utf8')); } catch (e){}
		} else {
			logger.debug(resp.statusCode, "OK");
		}
	});
}

function getAllHelmCharts(){
	logger.trace('getAllHelmCharts');
	var stdOut = runCommand("$(ibmcloud ks cluster config " + KUBE_CLUSTER + " | grep export) && helm list | awk '{print $1}'").split('\n');
	stdOut.shift();
	let charts = [];
	_.forEach(stdOut, (line) => {
		charts.push(line.trim());
	});
	return charts;
}

function deleteAllHelmCharts(charts){
	logger.trace('deleteAllHelmCharts');
	var cmd = '$(ibmcloud ks cluster config ' + KUBE_CLUSTER + ' | grep export) && helm delete --purge ';
	cmd += charts.join(" ");
	logger.debug('cmd', cmd);
	runCommand(cmd);
}

function getAllSecrets(){
	logger.trace('getAllSecrets');
	var stdOut = runCommand("$(ibmcloud ks cluster config " + KUBE_CLUSTER + " | grep export) && kubectl get secrets | awk '{print $1}'").split('\n');
	stdOut.shift();
	let secrets = [];
	_.forEach(stdOut, (secret) => {
		if (_.startsWith(secret, 'binding-')) {
			secrets.push(secret.trim());
		}
	});
	return secrets;
}

function deleteAllSecrets(secrets){
	logger.trace('getAllSecrets');
	var cmd = '$(ibmcloud ks cluster config ' + KUBE_CLUSTER + ' | grep export) && kubectl delete secret ';
	cmd += secrets.join(" ");
	logger.debug('cmd', cmd);
	runCommand(cmd);
}

function runCommand(cmd){
	logger.trace('runCommand');
	logger.debug('>> Executing ::', cmd);
	return Shell.exec(cmd).stdout;
}