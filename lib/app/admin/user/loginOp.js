/*!
* cnode
* authors: Ben Lue
* Copyright(c) 2015 Conwell Inc.
*/
var  async = require('async'),
	 soar = require('sql-soar'),
	 tokenUtil = require('../../../util/tokenUtil.js'),
	 userUtil = require('../util/userUtil.js');

var  _tsWindow = 60 * 24 * 60 * 60 * 1000;

var  usrExpr = soar.sql('GrpUser')
				   .filter({
					   op: 'and',
					   filters: [
						   {name: 'UGroup_id', op: '='},
						   {name: 'accName', op: '='}
					   ]
				   });
				   
var  qUsrCmd = {op: 'query', expr: usrExpr};

exports.checkArguments = function(rt, cb)  {
	var  inData = rt.inData;
	if (!inData.accName)
        return  rt.returnError(1, cb);
		//return  cb( {code: 1, message: 'Account name is missing.'});
	if (!inData.passwd)
        return  rt.returnError(2, cb);
		//return  cb(  {code: 2, message: 'Password is missing.'} );
		
	cb( null, true );
};


exports.run = function(rt, cb)  {
	var  inData = rt.inData,
		 accName = inData.accName;
	
	async.waterfall([
		function getUser(cb)  {
			var  query = {UGroup_id: rt.app.UGroup_id, accName: accName};
			soar.execute( qUsrCmd, query, function(err, usrData) {
				if (err)
					return cb({code: -100, message: 'Internal error.'});
					
				if (usrData)
					cb(null, usrData);
				else
                    rt.returnError(3, cb);
					//cb({code: 3, message: 'Login failed.'});
			});
		},
		function  matchPasswd(usrData, cb)  {
			var  salt = usrData.passwd.substring(0, 16),
				 passwd = userUtil.genPassword( inData.passwd, salt );
			
			//console.log('incoming passwd is: ' + inData.passwd);
			//console.log('original password: ' + usrData.passwd);
			//console.log('generated password: ' + passwd);
			if (usrData.passwd === passwd)
				cb( null, usrData);
			else
                rt.returnError(3, cb);
				//cb({code: 3, message: 'Login failed.'});
		},
		function issueToken(usrData, cb)  {
			// send the existing token or issue a new token
			var  userID = usrData.GrpUser_id;
				 
			tokenUtil.findToken(rt.app.CApp_id, userID, rt.remoteAddr, function(err, tknData)  {
				if (err)
					return cb( userUtil.internErr() );
				
				if (tknData)  {
					userUtil.destroyToken(userID, tknData.token, function(err) {
						if (err)
							cb( userUtil.internErr() );
						else
							newToken(usrData, rt, cb);
					});
				}
				else
					newToken(usrData, rt, cb);
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
			cb( result );
		}
	});
};


function  newToken(usrData, rt, cb)  {
	var  digest = rt.uPro.token.substring(0, 16),
		 randomNum = tokenUtil.random(),
		 token = digest + randomNum,
		 tknValid = Date.now() + _tsWindow,
		 usrID = usrData.GrpUser_id;
		 
	tokenUtil.recordToken(rt.app.CApp_id, usrID, randomNum, tknValid, rt.remoteAddr, function(err)  {
		if (err)
			return( userUtil.internErr() );
		
		cb(null, {userID: usrID, dspName: usrData.dspName}, {token: token, validTo: tknValid});
	});
};