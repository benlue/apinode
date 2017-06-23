/*!
* cnode
* authors: Ben Lue
* Copyright(c) 2015 Conwell Inc.
*/
var  crypto = require('crypto'),
	 path = require('path'),
	 soar = require('sql-soar'),
	 aws = require('aws-sdk'),
	 fs = require('fs');

var  tknExpr = soar.sql('UserToken')
				   .filter({
					  op: 'and',
					  filters: [
						  {name: 'GrpUser_id', op: '='},
						  {name: 'token', op: '='}
					  ] 
				   }),
	 usrExpr = soar.sql('GrpUser')
	 			   .column(['GrpUser_id'])
	 			   .filter({
						op: 'and',
						filters: [
							{name: 'UGroup_id', op: '='},
							{name: 'accName', op: '='}
						]
					});
				   
var  dTknCmd = {op: 'delete', expr: tknExpr},
	 qUsrCmd = {op: 'query', expr: usrExpr};
	 
var  _fileRoot;

exports.setFileRoot = function(froot)  {
	_fileRoot = path.join(froot, '/page');
};


exports.getFileRoot = function()  {
	return  _fileRoot;
};


exports.destroyToken = function(userID, token, cb)  {
	var  query = {GrpUser_id: userID};
	if (token)
		query.token = token;

	soar.execute(dTknCmd, query, cb);
};


exports.genPassword = function(passwd, salt)  {
	salt = salt || genRandom(16);
	var  hashed = crypto.pbkdf2Sync(passwd, salt, 5000, 16).toString('hex');
	return  salt + hashed;
};


/**
 * Salt and hash plain text password to make it safer to transfer over networks.
 */
exports.saltHashPasswd = function(accName, passwd)  {
	var  hash = crypto.createHash('sha1');
	hash.update( accName );
	var  salt = hash.digest('hex');
	
	hash = crypto.createHash('sha1');
	hash.update( salt + passwd );
	return  hash.digest('hex');
};


exports.genActivationCode = function()  {
	return  genRandom(48);
};


/**
 * Produce a system generated password when users forget theirs.
 */
exports.autoGenPassword = function(len)  {
	return  genRandom(len);
};


exports.accNameOk = function(accName, UGroup_id, cb)  {
	var  query = {accName: accName, UGroup_id: UGroup_id},
		 cmd = {
		 	op: 'list',
		 	expr: usrExpr
		 };

	soar.execute(qUsrCmd, query, cb);
};


exports.internErr = function()  {
	return  {code: -100, message: 'Internal error'};
};


function genRandom(len)  {
	var  rn;
	try  {
		rn = crypto.randomBytes(len/2).toString('hex');
	}
	catch (ex)  {
		// in case CPRNG cannot be generated...
		var  hash = crypto.createHash('sha1');
		hash.update( new Date().getTime().toString() );
		rn = hash.digest('hex').substring(0, len);
	}

	return  rn;
};


/* removed to app-space
aws.config.loadFromPath(path.join(__dirname, '../../../../config_ses.json'));
var  CAID_yogo = 1000,
	 CAID_ezreceipt = 501;

exports.sendNewPasswdEmail = function(app, email, newPasswd, cb) {
	var  ses = new aws.SES({apiVersion: '2010-12-01'}),
		 to = [email], // send to list
		 from = 'service@yugo.com.tw '; // this must relate to a verified SES account

	if(app.CApp_id == CAID_ezreceipt)
		from = 'service@ezreceipt.cc';
	
	genEmailTemplate(app.CApp_id, app.title, function(err, title, body) {
		if (err)
			return  cb(err);
		
		title += genDateTimeString(new Date());
		body = body.replace('$newPassword', newPasswd);
					
		ses.sendEmail({
			Source: from, 
			Destination: { ToAddresses: to },
			Message: {
				Subject: {
					Data: title
				},
				Body: {
					Html: {
						Data: body,
					}
				}
			}
		},
		function(err, data) {
			cb(err);
		});
	});
};
*/


function  genEmailTemplate(caID, caTitle, cb) {
	caID = parseInt(caID);
	var  fName = '',
		 title = '';
	switch (caID){
		case CAID_yogo:
			fName = 'sendNewPasswdEmail_yugo.html';
			title = '優購爽 新密碼通知 '
			break;
		case CAID_ezreceipt:
			fName = 'sendNewPasswdEmail_ezReceipt.html';
			title = caTitle+' 新密碼通知 '
			break;
		default:
			fName = 'sendNewPasswdEmail.html';
			title = caTitle+' 新密碼通知 '
	}
	
	var  fileName = path.join(__dirname, './'+fName);
	fs.readFile( fileName, {encoding: 'utf8'}, function(err, body) {
		cb(err, title, body);
	});
}

function  genDateTimeString(t) {
	var  time = ('0'+t.getHours()).slice(-2) +':'+ ('0'+t.getMinutes()).slice(-2);
	return  t.getFullYear() +'-'+ ('0'+(t.getMonth()+1)).slice(-2) +'-'+ ('0'+t.getDate()).slice(-2) + ' ' + time;
}