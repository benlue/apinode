/*!
* cnode
* authors: Ben Lue
* Copyright(c) 2015 Conwell Inc.
*/
var  soar = require('sql-soar'),
	 userUtil = require('../util/userUtil.js');

var  accExpr = soar.sql('GrpUser gu')
				   .join({
					   table: "Person psn",
					   onWhat: "gu.Person_id=psn.Person_id"
				   })
				   .column(['GrpUser_id', 'passwd', 'email'])
				   .filter({
					   op: 'and',
					   filters: [
						   {name: 'GrpUser_id', op: '='},
						   {name: 'UGroup_id', op: '='},
						   {name: 'accName', op: '='},
						   {name: 'isValid', op: '='}
					   ]
				   });
				   
var  qAccCmd = {op: 'query', expr: accExpr},
	 uAccCmd = {op: 'update', expr: accExpr};

exports.checkArguments = function(rt, cb)  {
	var  inData = rt.inData;
	if (!inData.accName)
		return  cb( {code: 1, message: 'The user account should be specified.'});
		
	if (inData.length && isNaN(inData.length))
		return  cb( {code: 1, message: 'Not a valid password length.'});
		
	inData.length = inData.length || 6;
		
	cb( null, true );
};


exports.checkPermission = function(rt, cb)  {
	var  inData = rt.inData,
		 query = {
			UGroup_id: rt.app.UGroup_id,
			accName: inData.accName,
			isValid: true
		 };
	
	soar.execute(qAccCmd, query, function(err, accData) {
		if (err)
			return  cb(userUtil.internErr());
			
		if (accData)  {
			if (accData.email)  {
				inData.userID = accData.GrpUser_id;
				inData.email = accData.email;
				cb( null, true );
			}
			else
				cb({code: 3, message: 'No email account to send out the new password notification.'});
		}
		else
			cb( {code: 2, message: 'Not a valid user account.'});
	});
};


exports.run = function(rt, cb)  {
	var  inData = rt.inData,
		 plainTx = userUtil.autoGenPassword(inData.length),
		 salted = userUtil.saltHashPasswd( inData.accName, plainTx ),
		 passwd = userUtil.genPassword( salted );
		 
	//console.log('plain text is: ' + plainTx);
	//console.log('salted passwd is: ' + salted);
	var  app = rt.app;
	userUtil.sendNewPasswdEmail(app, inData.email, plainTx, function(err) {
		if (err)
			return  cb( {code: 10, message: 'Unable to send email notification.'});
			
		soar.update('GrpUser', {passwd: passwd}, {GrpUser_id: inData.userID}, function(err)  {
			if (err)  {
				console.log( err.stack );
				return  cb(userUtil.internErr());
			}
	
			cb( {code: 0, message: 'Ok', value: {passwd: plainTx}} );
		});
	});
};