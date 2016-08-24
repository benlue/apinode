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
							{name: 'GrpUser_id', op: '='}
						]
					});

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
			
			updateAccount(rt, function(err, result)  {
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


function  updateAccount(rt, cb)  {
	var  inData = rt.inData,
		 uPro = rt.uPro;

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
			
			updatePerson(uPro.psnID, psnData, conn, function(err, psnPK) {
				if (err)
					return  cb(userUtil.internErr(), conn);

				cb( null, conn, psnPK );
			});
		},
		function doUser(conn, psnPK, cb)  {
			var  usrData = {
					accName: inData.accName,
					passwd: inData.passwd,
					dspName: inData.dspName
				 };
				 
			if (rt.app.actScheme)  {
				usrData.actID = userUtil.genActivationCode();
				usrData.actScheme = rt.app.actScheme;
				usrData.isValid = false;
			}
			else  {
				// if user accounts do not need activation
				usrData.isValid = true;
				usrData.actScheme = 0;
			}
				
			if (inData.aux)
				usrData._c_json = inData.aux;
			
			updateUser( uPro.userID, usrData, conn, function(err) {
				if (err)
					return  cb(userUtil.internErr(), conn);

				cb( null, conn, usrData );
			});
		}
	],
	function(err, conn, usrData) {
		if (err)  {
			conn.rollback(function() {
				conn.release();
				cb( null, err );
			});
		}
		else  {
			var  value = {
					id: uPro.userID,
					psnID: uPro.psnID,		// should be removed before returning to user
					actScheme: usrData.actScheme
				 },
				 result = {code: 0, message: 'Ok', value: value};
				 
			if (usrData.actID)
				value.actID = usrData.actID;

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


function  updatePerson(psnID, data, conn, cb)  {
	var  cmd = {
			op: 'update',
			expr: psnExpr,
			conn: conn
		 };
		 
	data.isNature = data.hasOwnProperty('isNature')  ? data.isNature : 1;

	soar.execute(cmd, data, {Person_id: psnID}, cb);
};


function  updateUser(userID, data, conn, cb)  {
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
		 	op: 'update',
		 	expr: usrExpr,
			conn: conn
		 };

	soar.execute(usrCmd, data, {GrpUser_id: userID}, cb);
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