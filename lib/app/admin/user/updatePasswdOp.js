/*!
* cnode
* authors: Ben Lue
* Copyright(c) 2015 Gocharm Inc.
*/
var  async = require('async'),
	 soar = require('sql-soar'),
	 userUtil = require('../util/userUtil.js');
	 
var  usrExpr = soar.sql('GrpUser AS gu')
				   .join({
					   table: 'FbUser AS fu',
					   onWhat: 'gu.GrpUser_id=fu.userID',
					   type: 'LEFT'
				   })
				   .column(['passwd', 'fbUserID'])
				   .filter({ name: 'GrpUser_id', op: '='}),
	 qUsrCmd = {op: 'query', expr: usrExpr};
	 
exports.checkArguments = function(rt, cb)  {
	var  inData = rt.inData;
	if (!inData.oldPasswd)
		return  cb( {code: 1, message: 'The original password is missing.'});
	if (!inData.passwd || !inData.passwd2)
		return  cb(  {code: 2, message: 'The new password is missing.'} );
	if (inData.passwd2 && inData.passwd !== inData.passwd2)
		return  cb( {code: 3, message: 'Password and confirmed password do not match.'} );
		
	cb( null, true );
};


exports.run = function(rt, cb)  {
	var  inData = rt.inData;
	
	async.waterfall([
		function getUser(cb)  {
			
			var  query = {GrpUser_id: rt.uPro.userID};
			soar.execute( qUsrCmd, query, function(err, usrData) {
				if (err || !usrData)
					return cb({code: -100, message: 'Internal error.'});
					
				cb(null, usrData);
			});
		},
		function  matchPasswd(usrData, cb)  {
			if (usrData.fbUserID && !usrData.passwd)
				return  cb( {code: 5, message: 'Cannot set password for the FB user.'});
				
			if (usrData.passwd)  {
				var  salt = usrData.passwd.substring(0, 16),
					 passwd = userUtil.genPassword( inData.oldPasswd, salt );
				
				//console.log('incoming passwd is: ' + inData.passwd);
				//console.log('original password: ' + usrData.passwd);
				//console.log('generated password: ' + passwd);
				if (usrData.passwd === passwd)
					cb( null, usrData);
				else
					cb({code: 4, message: 'The original password is not correct.'});
			}
			else
				return  cb( {code: 6, message: 'This user is not allowed to change his/her password.'});
		},
		function updatePasswd(usrData, cb)  {
			var  userID = rt.uPro.userID,
				 newPasswd = userUtil.genPassword( inData.passwd );
			
			soar.update('GrpUser', {passwd: newPasswd}, {GrpUser_id: userID}, function(err) {
				cb(err  ?  {code: -100, message: 'Internal error.'} : null);
			});
		}
	],
	function(err) {
		if (err)
			cb(null, err);
		else
			cb( null, {code: 0, message: 'Ok'} );
	});
};