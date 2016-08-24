/*!
* cnode
* authors: Ben Lue
* Copyright(c) 2015 Gocharm Inc.
*/
var  async = require('async'),
	 soar = require('sql-soar'),
	 tokenUtil = require('../../../util/tokenUtil.js'),
	 userUtil = require('../util/userUtil.js');
	 
// Below are some default data used by account creation.
var  MEMBER_ROLE = 6;
	 
var  EMAIL_ACC_SCHEME = 1,
	 MOBILE_ACC_SCHEME = 2;
	 
var  psnCol = ['fname', 'lname', 'nid', 'dob', 'gender', 'addrID', 'email', 'mobile'];
	 
var  _tsWindow = 60 * 24 * 60 * 60 * 1000;
	 
var  psnExpr = soar.sql('Person')
				   .filter({name: 'Person_id', op: '='}),
	 usrExpr = soar.sql('GrpUser')
	 			   .filter({
						op: 'and',
						filters: [
							{name: 'UGroup_id', op: '='},
							{name: 'accName', op: '='}
						]
					}),
	 tknExpr = soar.sql('UserToken');

exports.checkArguments = function(rt, cb)  {
	var  inData = rt.inData;
	if (!inData.accName)
		return  cb( {code: 1, message: 'Account name is missing.'});
	if (!inData.passwd)
		return  cb(  {code: 2, message: 'Password is missing.'} );
	if (inData.passwd2 && inData.passwd !== inData.passwd2)
		return  cb( {code: 3, message: 'Password and confirmed password do not match.'} );
	
	var  app = rt.app;
	if (app.accScheme === EMAIL_ACC_SCHEME)  {
		if (!isEmail(inData.accName))
			return  cb( {code: 4, message: 'The account name should be a valid email.'});
			
		inData.email = inData.accName;
	}
	else  if (app.accScheme === MOBILE_ACC_SCHEME)  {
		if (!isMobile(inData.accName))
			return  cb( {code: 5, message: 'The account name should be a valid mobile phone number.'});
			
		inData.mobile = inData.accName;
	}
		
	cb( null, true );
};


exports.run = function(rt, cb)  {
	userUtil.accNameOk(rt.inData.accName, rt.app.UGroup_id, function(err, usrData) {
		if (err)
			return  cb(userUtil.internErr());
			
		if (usrData)
			cb({code: 10, message: 'The account name has been used (not available).'});
		else  {
			var  inData = rt.inData,
				 addr = inData.addr;
			delete  inData.addrID;
			
			createAccount(rt, function(err, result)  {
				if (err)
					return  cb(err);
					
				if (addr)  {
					// run as the new user to update the address
					var  psnID = result.value.psnID,
						 uPro = {
							psnID: psnID,
							userID: result.value.id,
							roleID: 6,
							isGuest: false
						 },
						 oldUpro = rt.uPro;
					rt.uPro = uPro;
					delete  result.value.psnID;
					
					rt.forward(rt, 'geo/address/update', {addr: addr}, function(err, res) {
						rt.uPro = oldUpro;
						if (err)  {
							console.log('user/update error:\n%s', JSON.stringify(err, null, 4));
							return  cb(userUtil.internErr());
						}
						
						var  addrID = res.value.addrID;
						soar.update('Person', {addrID: addrID}, {Person_id: psnID}, function(err) {
							cb( null, result );
						});
					});
				}
				else
					cb( null, result );
			});
		}
	});
};


function  createAccount(rt, cb)  {
	var  inData = rt.inData;

	inData.passwd = userUtil.genPassword( inData.passwd );
	delete  inData.passwd2;
	
	async.waterfall([
		function(cb)  {
			soar.getConnection(cb);
		},
		function(conn, cb)  {
			conn.beginTransaction(function(err)  {
				cb(err, conn);
			});
		},
		function doPerson(conn, cb)  {
			var  psnData = {};
			for (var i in psnCol)  {
				var  key = psnCol[i];
				if (inData.hasOwnProperty(key))
					psnData[key] = inData[key];
			}
			
			createPerson(psnData, conn, function(err, psnPK) {
				if (err)
					return  cb(userUtil.internErr(), conn);

				cb( null, conn, psnPK );
			});
		},
		function doUser(conn, psnPK, cb)  {
			var  usrData = {
					accName: inData.accName,
					passwd: inData.passwd,
					dspName: inData.dspName,
					Person_id: psnPK.Person_id,
					UGroup_id: rt.app.UGroup_id,
					ExeRole_id: MEMBER_ROLE
				 };
				 
			if (rt.app.actScheme)  {
				usrData.actID = userUtil.genActivationCode();
				usrData.actScheme = rt.app.actScheme;
			}
			else  {
				// if user accounts do not need activation
				usrData.isValid = true;
				usrData.actScheme = 0;
			}
				
			if (inData.aux)
				usrData._c_json = inData.aux;
			
			createUser( usrData, conn, function(err, usrPK) {
				if (err)
					return  cb(userUtil.internErr(), conn);

				usrData.GrpUser_id = usrPK.GrpUser_id;
				cb( null, conn, usrData );
			});
		},
		function genToken(conn, usrData, cb)  {
			if (rt.app.actScheme)
				cb(null, conn, usrData);
			else  {
				// because we have to enclose this in a transaction, we cannot call tokenUtil.recordToken()
				var  digest = rt.uPro.token.substring(0, 16),
					 randomNum = tokenUtil.random(),
					 token = digest + randomNum,
					 tknValid = Date.now() + _tsWindow;
					
				var  data = {
						caID: rt.app.CApp_id,
						GrpUser_id: usrData.GrpUser_id,
						token: randomNum,
						tknExpire: tknValid,
						devID: rt.remoteAddr
					 },
					 cmd = {op: 'insert', expr: tknExpr, conn: conn};
					 
				soar.execute(cmd, data, null, function(err, pk) {
					if (err)
						cb({code: -100, message: 'Internal error'}, conn);
					else  {
						var  tknData = {
								token: token,
								validTo: tknValid
							 };
							 
						cb(null, conn, usrData, tknData);
					}
				});
			}
		}
	],
	function(err, conn, usrData, tknData) {
		if (err)  {
			conn.rollback(function() {
				conn.release();
				cb( null, err );
			});
		}
		else  {
			var  value = {
					id: usrData.GrpUser_id,
					psnID: usrData.Person_id,		// should be removed before returning to user
					actScheme: usrData.actScheme
				 },
				 result = {code: 0, message: 'Ok', value: value};
				 
			if (usrData.actID)
				value.actID = usrData.actID;
				
			if (tknData)
				result.token = tknData;

			conn.commit(function(err) {
				if (err)  {
					conn.rollback(function()  {
						conn.release();
						cb( null, userUtil.internErr() );
					});
				}
				else  {
					conn.release();
					cb( null, result );
				}
			});
		}
	});
};


function  createPerson(data, conn, cb)  {
	var  cmd = {
			op: 'insert',
			expr: psnExpr,
			conn: conn
		 };
		 
	data.isNature = data.hasOwnProperty('isNature')  ? data.isNature : 1;

	//console.log('insert data is\n%s', JSON.stringify(psnData, null, 4));
	soar.execute(cmd, data, null, cb);
};


function  createUser(data, conn, cb)  {
	var  dspName = data.dspName;

	if (!dspName)  {
		dspName = data.email || data.accName;
		if (dspName)  {
			var  idx = dspName.indexOf('@');
			dspName = dspName.substring(0, idx);

			idx = dspName.indexOf('.');
			if (idx > 0)
				dspName = dspName.substring(0, idx);
		}
	}
	data.dspName = dspName;
	data.createTime = new Date();

	var  usrCmd = {
		 	op: 'insert',
		 	expr: usrExpr,
			conn: conn
		 };

	soar.execute(usrCmd, data, null, cb);
};


function  isEmail(s)  {
	var  idx = s.indexOf('@');
	if (idx > 1)  {
		idx = s.indexOf('.', idx+1);
		return  idx > 1;
	}
	
	return  false;
};


function  isMobile(s)  {
	return  s.length === 10 && s.indexOf('09') === 0;
};