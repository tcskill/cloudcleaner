# cloudcleaner
# 
# This automates the removal of either all CloudFoundry or Kubernetes clusers on IBM Cloud
# this is an updated version of the original project devex-playground-cleaner
# 
# New in this release: 
# 
# Updated the API to the newer ibmcloud end points, removing old bluemix references
# Added environment variable for selecting either CF or KUBE as the CLI changed for CF in IBM Cloud
# Added functions to target the new CloudFoundry API
# Fixed CF token being retrieved from command line and implemented new function for processing CF tokens
# Implemented FORCE_DELETE environment variable
# Implemented, documented, updated REGISTRY_API environment variable

## Important Notes

Expects the ibmcloud CLI installed with the Cloud Foundry plugin.

Starting from version 1.0.0, the IBM Cloud CLI no longer bundles the Cloud Foundry CLI by default. To run Cloud Foundry commands via the IBM Cloud CLI, install the Cloud Foundry CLI by using the 'ibmcloud cf install' command.

Expects following environment variables
* CL_TARGET - either CF or KUBE to indicate which cloud environment to clean
* API_KEY - API key to use to login to IBM Cloud
* CF_API - CF API endpoint, defaults to "https://api.us-south.cf.cloud.ibm.com", see below for other regions
* CF_ORG - CF organization to remove apps and services
* CF_SPACE - CF space to remove apps and services
* LOG_LEVEL - logger level, defaults to 'debug'
* FORCE_DELETE - true/false, defaults tofalse. If not set to true nothing will actually be deleted. 
* KUBE_CLUSTER - Kubernetes cluster name
* REGISTRY_API - Kubernetes registry API endpoint, defaults to "https://us.icr.io/api", see below for other regions


API endpoints for interacting with Cloud Foundry Public
US SOUTH	api.us-south.cf.cloud.ibm.com
US EAST	api.us-east.cf.cloud.ibm.com
EU-GB	api.eu-gb.cf.cloud.ibm.com
EU-DE	api.eu-de.cf.cloud.ibm.com
AU-SYD	api.au-syd.cf.cloud.ibm.com

API endpoints for the Kubernetes registry
region	    Domain name	Private domain name	
ap-north	jp.icr.io	private.jp.icr.io	
ap-south	au.icr.io	private.au.icr.io	
eu-central	de.icr.io	private.de.icr.io	
uk-south	uk.icr.io	private.uk.icr.io	
us-south	us.icr.io	private.us.icr.io

