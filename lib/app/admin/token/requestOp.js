/*!
* cnode
* authors: Ben Lue
* Copyright(c) 2015 Conwell Inc.
*/
var  admin = require('../../../base/adminOffice.js'),
	 errUtil = require('../../../util/errUtil.js'),
	 tokenUtil = require('../../../util/tokenUtil.js');

var  GUEST_USER_ID = 20;

var  _tsWindow = 60 * 24 * 60 * 60 * 1000;

exports.run = function(rt, cb)  {
	var  req = rt.req,
		 caData = rt.app,
		 appKey = req.headers['x-deva-appkey'],
		 appSecret = req.headers['x-deva-appsecret'],
		 digest = tokenUtil.generateDigest( appKey, caData.appSecret );
		 
	if (caData.appKey === appKey && (!appSecret || caData.appSecret === appSecret))  {
		// this is a valid request, we'll return a token to the client
		var  userID = rt.ep.id,
			 caID = caData.CApp_id;
		
		if (userID)  {
			// request for a user-scope token. Let's check if the user has a valid token
			// first of all, check if the user is an "external" user
			//var  idx = userID.indexOf('@');
			
			if (caData.isExt)  {
				// this request is made by "external users"
				var  accName = userID;
                     
				admin.getUser(caData.UGroup_id, accName, function(err, usrData) {
					if (err)
						return  cb(errUtil.err(errUtil.DB_ERR));
						
					if (usrData)
						grantToken(caID, usrData.GrpUser_id, rt.remoteAddr, digest,cb);
					else
						admin.createExtUser(caData.UGroup_id, accName, function(err, usrPK) {
							if (err)
								cb(errUtil.err(errUtil.DB_ERR));
							else
								grantToken(caID, usrPK.GrpUser_id, rt.remoteAddr, digest, cb);
						});
				});
			}
			else
				grantToken(caID, userID, rt.remoteAddr, digest, cb);
		}
		else
			// request for an application-scope token (guest token)
			//issueToken(caID, digest, GUEST_USER_ID, rt.remoteAddr, cb);
			grantToken(caID, GUEST_USER_ID, rt.remoteAddr, digest, cb);
	}
	else
		cb( errUtil.err( errUtil.NO_TOKEN_GRANT ) );
};


function  grantToken(caID, userID, devID, digest, cb)  {
	tokenUtil.findToken( caID, userID, devID, function(err, tknData) {
		if (err)  {
			console.log( err.stack );
			cb(errUtil.err(errUtil.DB_ERR));
		}
		else  {
			if (tknData)  {
				// a token exists for this user@remoteAddr
				var  result = {
						code: 0,
						message: 'Ok',
						token: {
							token: digest + tknData.token,
							validTo: tknData.tknExpire
						}
					 };
					 
				cb( null, result );
			}
			else
				issueToken(caID, digest, userID, devID, cb);
		}
	});
};


function  issueToken(caID, digest, user, devID, cb)  {
	var  randomNum = tokenUtil.random(),
		 token = digest + randomNum,
		 userID = user || GUEST_USER_ID,
		 tknValid = Date.now() + _tsWindow;
		 
	tokenUtil.recordToken(caID, userID, randomNum, tknValid, devID, function(err, pk) {
		if (err)  {
			console.log( err.stack );
			cb(errUtil.err(errUtil.DB_ERR));
		}
		else  {
			var  result = {
					code: 0,
					message: 'Ok',
					token: {
						token: token,
						validTo: tknValid
					}
				 };
				 
			cb( null, result );
		}
	});
};