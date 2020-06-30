
    
    const FORCE_DELETE = process.env.FORCE_DELETE || false; 
    const authHeaderBuilder = require('./auth-header-builder');
  
    switch (process.env.CL_TARGET) {
        case 'CF':
            console.log('Running CloudFoundry Cleaner');
            const cfCleaner = require('./cf-cleaner');
            if (FORCE_DELETE) cfCleaner.clean(authHeaderBuilder.uaaAuthHeaders);
            break;
        case 'KUBE':
            console.log('Running Kubernetes Cleaner');
            const kubeCleaner = require('./kube-cleaner');
            if (FORCE_DELETE) {
                kubeCleaner.clean(authHeaderBuilder.iamAuthHeaders); 
            }
            break;
        default:
            console.log('Invalid argument.  Not running anything! set CL_TARGET environment variable to either  CF or KUBE');
    }



