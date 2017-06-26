/*!
* acUtil
* authors: Ben Lue
* Copyright(c) 2015 ~ 2017 Gocharm Inc.
*/
var  admin = require('../base/adminOffice.js'),
     Promise = require('bluebird');

/**
 * Check if the calling app can use the functional module.
 */
exports.canUseApp = function(caData, ep)  {
	var  caID = caData.CApp_id;
	
	return  new Promise(function(resolve, reject) {
		if (caData.caCode === ep.app)  {
			ep.caID = caData.CApp_id;
			resolve(true);
		}
		else  {
			admin.canUseApp(caID, ep.app)
			.then(function(useData)  {
				if (useData)  {
					ep.caID = useData.UseCApp_id;
					return  resolve(true);
				}
				resolve(false);
			});
		}
	});
};