const request = require('sync-request');
const _ = require('lodash');
const logger = require('log4js').getLogger('cf-cleaner');
logger.level = process.env.LOG_LEVEL || 'debug';

// grab the API url or default to us-south
const CF_API = process.env.CF_API || "https://api.us-south.cf.cloud.ibm.com"; 
const CF_ORG = process.env.CF_ORG;
const CF_SPACE = process.env.CF_SPACE;

if (!CF_ORG) { throw "CF_ORG environment variable is not defined" };
if (!CF_SPACE) { throw "CF_SPACE environment variable is not defined" };

let CF_ORG_GUID;
let CF_SPACE_GUID;

module.exports = {
	clean: function(uaaAuthHeader){
		logger.trace('clean');

		getCFOrgAndSpaceGuids(uaaAuthHeader);
		logger.debug('CF_ORG_GUID', CF_ORG_GUID);
		logger.debug('CF_SPACE_GUID', CF_SPACE_GUID);

		const cfApps = getAllCFApps(uaaAuthHeader);
		logger.debug('cfApps', cfApps);

		//deleteAllCFApps(uaaAuthHeader, cfApps);

		const cfServices = getAllCFServices(uaaAuthHeader);
		logger.debug('cfServices', cfServices);

		//deleteAllCFServices(uaaAuthHeader, cfServices);
	}
}

function getCFOrgAndSpaceGuids(uaaAuthHeader){
	logger.trace('getCFOrgAndSpaceGuids');
	var resp = request('GET', CF_API + "/v2/organizations", uaaAuthHeader);

	try{
		const resources = JSON.parse(resp.getBody('utf8')).resources;
		let orgGuid = null;
		_.forEach(resources, (resource) => {
			if (resource.entity.name == CF_ORG){
				orgGuid = resource.metadata.guid;
			}
		});
		CF_ORG_GUID = orgGuid;
	} catch (e){
		throw "Failed to retrieve list of orgs", e;
	}

	resp = request('GET', CF_API + '/v2/organizations/' + CF_ORG_GUID + '/spaces', uaaAuthHeader);
	try{
		const resources = JSON.parse(resp.getBody('utf8')).resources;
		let spaceGuid = null;
		_.forEach(resources, (resource) => {
			if (resource.entity.name == CF_SPACE){
				spaceGuid = resource.metadata.guid;
			}
		});
		CF_SPACE_GUID = spaceGuid;
	} catch (e){
		throw "Failed to retrieve list of spaces", e;
	}
}

function getAllCFApps(uaaAuthHeader){
	logger.trace('getAllCFApps');
	var resp = request('GET', CF_API + "/v2/apps?q=space_guid:" + CF_SPACE_GUID, uaaAuthHeader);
	try {
		const resources = JSON.parse(resp.getBody('utf8')).resources;
		let apps = [];
		_.forEach(resources, (resource) => {
			apps.push({
				name: resource.entity.name,
				guid: resource.metadata.guid,
				url: resource.metadata.url
			})
		});
		return apps;
	} catch (e){
		throw "Failed to retrieve list of apps", e;
	}
}

function deleteAllCFApps(uaaAuthHeader, cfApps){
	logger.trace('deleteAllCFApps');
	_.forEach(cfApps, (app) => {
		let url = CF_API + app.url;
		logger.debug("Invoking DELETE on", url);
		var resp = request('DELETE', url, uaaAuthHeader);
		if (resp.statusCode < 200 || resp.statusCode > 299){
			logger.debug(resp.statusCode, "FAIL");
			try { logger.debug(resp.getBody('utf8')); } catch (e){}
		} else {
			logger.debug(resp.statusCode, "OK");
		}
	});
}

function getAllCFServices(uaaAuthHeader){
	logger.trace('getAllCFServices');
	var resp = request('GET', CF_API + '/v2/service_instances?q=space_guid:' + CF_SPACE_GUID, uaaAuthHeader);
	try {
		const resources = JSON.parse(resp.getBody('utf8')).resources;
		let services = [];
		_.forEach(resources, (resource) => {
			services.push({
				name: resource.entity.name,
				guid: resource.metadata.guid,
				url: resource.metadata.url
			})
		});
		return services;
	} catch (e){
		throw "Failed to retrieve list of services", e;
	}
}

function deleteAllCFServices(uaaAuthHeader, cfServices){
	logger.trace('deleteAllCFServices');
	_.forEach(cfServices, (service) => {
		let url = CF_API + service.url + "?recursive=true&async=false";
		logger.debug("Invoking DELETE on", url);
		var resp = request('DELETE', url, uaaAuthHeader);
		if (resp.statusCode < 200 || resp.statusCode > 299){
			logger.debug(resp.statusCode, "FAIL");
			try { logger.debug(resp.getBody('utf8')); } catch (e){}
		} else {
			logger.debug(resp.statusCode, "OK");
		}
	});
}


