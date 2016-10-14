/*!
* cnode
* authors: Ben Lue
* Copyright(c) 2015 Gocharm Inc.
*/
var  soar = require('sql-soar'),
	 errUtil = require('../../../util/errUtil.js'),
	 tokenUtil = require('../../../util/tokenUtil.js'),
	 userUtil = require('../util/userUtil.js');
	
var  GUEST_USER_ID = 20;
var  _tsWindow = 60 * 24 * 60 * 60 * 1000;

var  tknExpr = soar.sql('UserToken')
				   .filter({
					   op: 'and',
					   filters: [
						   {name: 'GrpUser_id', op: '='},
						   {name: 'token', op: '='}
					   ]
				   }),
	 tknCmd = {op: 'delete', expr: tknExpr};
	 
exports.run = function(rt, cb)  {
	var  uPro = rt.uPro,
		 query = {
			GrpUser_id: uPro.userID,
			token: uPro.token
		 };
		 
	soar.execute(tknCmd, query, function(err)  {
		if (err)
			cb( userUtil.internErr() );
		else
			// let's destroy the old token
			var  randomNum = uPro.token.substring(16);
			
			userUtil.destroyToken(uPro.userID, randomNum, function(err)  {
				if (err)
					cb( userUtil.internErr() );
				else  {
					//cb({code: 0, message: 'Ok', token: false});
					var  appData = rt.app,
						 digest = tokenUtil.generateDigest( appData.appKey, appData.appSecret );
					issueGuestToken(appData.CApp_id, digest, rt.remoteAddr, cb);
				}
			});
	});
};


function  issueGuestToken(caID, digest, devID, cb)  {
	var  randomNum = tokenUtil.random(),
		 token = digest + randomNum,
		 tknValid = Date.now() + _tsWindow;
		 
	tokenUtil.recordToken(caID, GUEST_USER_ID, randomNum, tknValid, devID, function(err, pk) {
		if (err)
			cb(errUtil.err(errUtil.DB_ERR));
		else  {
			var  result = {
					code: 0,
					message: 'Ok',
					token: {
						token: token,
						validTo: tknValid
					}
				 };
				 
			cb( result );
		}
	});
};