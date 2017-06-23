/*!
* cnode
* authors: Ben Lue
* Copyright(c) 2015 Gocharm Inc.
*/
var  crypto = require('crypto'),
	 soar = require('sql-soar'),
	 errUtil = require('./errUtil.js');

var  tknExpr = soar.sql('UserToken')
				   .filter({
					   op: 'and',
					   filters: [
						   {name: 'caID', op: '='},
						   {name: 'token', op: '='},
						   {name: 'GrpUser_id', op: '='},
						   {name: 'devID', op: '='},
						   {name: 'tknExpire', op: '>='}
					   ]
				   }),
	 lookupExpr = soar.sql('UserToken AS ut')
	 				  .join({table: 'GrpUser AS gu', onWhat: 'ut.GrpUser_id=gu.GrpUser_id'})
					  .column(['Person_id', 'ut.GrpUser_id', 'tknExpire'])
					  .filter({
						  op: 'and',
						  filters: [
							  {name: 'caID', op: '='},
							  {name: 'token', op: '='}
						  ]
					  });
				   
var  iTknCmd = {op: 'insert', expr: tknExpr},
	 qTknCmd = {op: 'query', expr: tknExpr},
	 lookupCmd = {op: 'query', expr: lookupExpr};


exports.tokenExist = function(caID, userID, cb)  {
	var  query = {
			caID: caID,
			GrpUser_id: userID
		 };
		 
	soar.execute(qTknCmd, query, cb);
}


/**
 * This function should be deprecated. Use exports.tokenExist() instead.
 */
exports.findToken = function(caID, userID, devID, cb)  {
	var  query = {caID: caID, GrpUser_id: userID, devID: devID, tknExpire: Date.now()};
	//if (userID)
	//	query.GrpUser_id = userID;
		 
	soar.execute(qTknCmd, query, cb);
};


exports.recordToken = function(caID, userID, token, tknValid, devID, cb)  {
	var  data = {
			caID: caID,
			GrpUser_id: userID,
			token: token,
			tknExpire: tknValid,
			devID: devID
		 };
		 
	soar.execute(iTknCmd, data, null, cb);
};


exports.validateToken = function(caData, token, cb)  {
	var  caID = caData.CApp_id,
		 appKey = caData.appKey,
		 appSecret = caData.appSecret;
		 
	// generate part-1 of the token
	var  digest = exports.generateDigest(appKey, appSecret);
	//console.log('digest is ' + digest);
	//console.log('incoming token is ' + token);
	
	if (token.substring(0, 16) !== digest)
		return  cb( errUtil.err(errUtil.INVALID_TOKEN) );
	
	lookupToken(caID, token.substring(16), function(err, tknData) {
		if (err || !tknData)
			return  cb( errUtil.err(errUtil.INVALID_TOKEN) );
			
		if (tknData.validTo < Date.now())
			return  cb( errUtil.err(errUtil.TOKEN_EXPIRED) );
			
		// now we can build the user-profile
		var  uPro = {
			psnID: tknData.Person_id,
			userID: tknData.GrpUser_id
		};
		cb( null, uPro );
	});
};


exports.generateDigest = function(appKey, appSecret)  {
	var  sha1 = crypto.createHash('sha1'),
		 idx = appSecret[0] - '0';
		
	sha1.update(appKey + appSecret);
	return  sha1.digest('hex').substring(idx, idx+16);
};


/**
 * generate a 32 digit hexadecimal string
 */
exports.random = function()  {
	var  randomNum;
	
	try  {
		randomNum = crypto.randomBytes(16).toString('hex');
	}
	catch (ex)  {
		// in case CPRNG cannot be generated...
		randomNum = 'xxxxxxxxxxxxxxxxyxxxxxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
			var  r = Math.random()*16|0,
				 v = c == 'x' ? r : (r&0x3|0x8);
			return v.toString(16);
		});
	}
	//console.log('token generated: ' + digest + randomNum);
	
	return  randomNum;
};


function lookupToken(caID, token, cb)  {
	var  query = {caID: caID, token: token};
	
	soar.execute(lookupCmd, query, cb);
};