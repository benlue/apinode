var  async = require('async'),
	 soar = require('sql-soar'),
	 tokenUtil = require('../../../util/tokenUtil.js'),
	 userUtil = require('../util/userUtil.js');

var  _tsWindow = 60 * 24 * 60 * 60 * 1000;

var  caExpr = soar.sql('CApp')
				  .filter({name: 'caCode', op: '='}),
	 usrExpr = soar.sql('GrpUser')
				   .filter({
					   op: 'and',
					   filters: [
						   {name: 'GrpUser_id', op: '='},
						   {name: 'UGroup_id', op: '='},
						   {name: 'Person_id', op: '='}
					   ]
				   });
				   
var  qAppCmd = {op: 'query', expr: caExpr},
	 qUsrCmd = {op: 'query', expr: usrExpr};

exports.checkArguments = function(rt, cb)  {
	var  caCode = rt.ep.id;
	if (!caCode)
		return  cb( {code: 1, message: 'Application code is missing.'});
		
	cb( null, true );
};


exports.run = function(rt, cb)  {
	var  caCode = rt.ep.id;
	
	async.waterfall([
		function getUser(cb)  {
			var  query = {GrpUser_id: rt.uPro.userID};
			soar.execute( qUsrCmd, query, function(err, usrData) {
				if (err)
					return cb({code: -100, message: 'Internal error.'});
					
				if (usrData)
					cb(null, usrData);
				else
					cb({code: 2, message: 'Switching app failed.'});
			});
		},
		function getApp(usrData, cb)  {
			soar.execute( qAppCmd, {caCode: caCode}, function(err, caData) {
				if (err)
					return cb({code: -100, message: 'Internal error.'});
					
				if (caData)
					cb(null, caData, usrData);
				else
					cb({code: 3, message: 'Unknown application.'});
			});
		},
		function switchApp(caData, usrData, cb)  {
			var  query = {UGroup_id: caData.UGroup_id, Person_id: usrData.Person_id};
			soar.execute( qUsrCmd, query, function(err, usrData2) {
				if (err)
					return cb({code: -100, message: 'Internal error.'});
					
				if (usrData2)
					cb(null, caData, usrData2);
				else
					cb({code: 4, message: 'Not allowed to switch.'});
			});
		},
		function issueToken(caData, usrData, cb)  {
			// send the existing token or issue a new token
			var  userID = usrData.GrpUser_id;
				 
			tokenUtil.findToken(caData.CApp_id, userID, rt.remoteAddr, function(err, tknData)  {
				if (err)
					return cb( userUtil.internErr() );
				
				var  digest = tokenUtil.generateDigest(caData.appKey, caData.appSecret);
				if (tknData)
					cb( null, 
						{userID: userID, dspName: usrData.dspName},
						{token: digest + tknData.token, vaidTo: tknData.tknExpire}
					);
				else
					newToken(caData.CApp_id, digest, usrData, rt, cb);
			});
		}
	],
	function(err, usrData, tknData) {
		if (err)
			cb(err);
		else  {
			var  result = {
					code: 0,
					message: 'Ok',
					value: usrData,
					token: tknData
				 };
			cb( null, result );
		}
	});
};


function  newToken(CApp_id, digest, usrData, rt, cb)  {
	var  randomNum = tokenUtil.random(),
		 token = digest + randomNum,
		 tknValid = Date.now() + _tsWindow,
		 usrID = usrData.GrpUser_id;
		 
	tokenUtil.recordToken(CApp_id, usrID, randomNum, tknValid, rt.remoteAddr, function(err)  {
		if (err)
			return( userUtil.internErr() );
		
		cb(null, {userID: usrID, dspName: usrData.dspName}, {token: token, validTo: tknValid});
	});
};