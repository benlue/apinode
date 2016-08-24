/*!
* cnode
* authors: Ben Lue
* Copyright(c) 2015 Conwell Inc.
*/
var  async= require('async'),
	 soar = require('sql-soar');

var  OPERATOR_ROLE_SCORE = 200;

var  exeExpr = soar.sql('ExeRole')
				   .filter({name: 'ExeRole_id', op: '='}),
	 psnExpr = soar.sql('Person')
				   .filter({name: 'Person_id', op: '='}),
	 usrExpr = soar.sql('GrpUser')
				   .filter({name: 'GrpUser_id', op: '='}),
	 tknExpr = soar.sql('UserToken')
	 			   .filter({name: 'GrpUser_id', op: '='});

var  qExeCmd = {op: 'query', expr: exeExpr};

exports.checkArguments = function(rt, cb)  {
	var  id = rt.ep.id;
	if (!id || isNaN(id))
		return  cb( {code: 1, message: 'The user ID should be specified.'});
		
	cb( null, true );
};


exports.checkPermission = function(rt, cb)  {
	var  roleID = rt.uPro.roleID;
	
	soar.execute(qExeCmd, {ExeRole_id: roleID}, function(err, roleData) {
		if (err)
			return  cb(err);
			
		cb(null, roleData.score >= OPERATOR_ROLE_SCORE);
	});
};


exports.run = function(rt, cb)  {
	var  usrID = rt.ep.id;
	
	async.waterfall([
		function(cb)  {
			soar.getConnection(cb);
		},
		function(conn, cb)  {
			conn.beginTransaction(function(err)  {
				cb(err, conn);
			});
		},
		function getUser(conn, cb)  {
			var  cmd = {op: 'query', expr: usrExpr, conn: conn};
			soar.execute(cmd, {GrpUser_id: usrID}, function(err, usrData) {
				if (err)
					return  cb({code:-100, message: 'Internal error.'}, conn);
					
				cb(null, conn, usrData);
			});
		},
		function clearAddr(conn, usrData, cb)  {
			// why we have to clear Person.addrID before deleting GrpUser??
			var  cmd = {op: 'update', expr: psnExpr, conn: conn};
			soar.execute(cmd, {addrID: null}, {Person_id: usrData.Person_id}, function(err) {
				if (err)  {
					console.log( JSON.stringify(err, null, 4));
					return  cb({code:-100, message: 'Internal error.'}, conn);
				}
					
				cb(null, conn, usrData);
			});
		},
		function delToken(conn, usrData, cb)  {
			var  cmd = {op: 'delete', expr: tknExpr, conn: conn};
			soar.execute(cmd, {GrpUser_id: usrID}, function(err) {
				if (err)  {
					console.log( JSON.stringify(err, null, 4));
					return  cb({code:-100, message: 'Internal error.'}, conn);
				}
					
				cb(null, conn, usrData);
			});
		},
		function delUser(conn, usrData, cb)  {
			var  cmd = {op: 'delete', expr: usrExpr, conn: conn};
			soar.execute(cmd, {GrpUser_id: usrID}, function(err) {
				if (err)
					return  cb({code:-100, message: 'Internal error.'}, conn);
					
				cb(null, conn, usrData);
			});
		},
		function delPsn(conn, usrData, cb)  {
			var  cmd = {op: 'delete', expr: psnExpr, conn: conn};
			soar.execute(cmd, {Person_id: usrData.Person_id}, function(err) {
				if (err)
					return  cb({code:-100, message: 'Internal error.'}, conn);
					
				cb(null, conn, usrData.GrpUser_id);
			})
		}
	],
	function(err, conn, userID) {
		if (err)  {
			if (conn)  {
				conn.rollback(function() {
					conn.release();
					cb( null, err );
				});
			}
			else
				cb( null, err );
		}
		else  {
			var  value = {id: userID},
				 result = {code: 0, message: 'Ok', value: value};

			if (conn)  {
				conn.commit(function(err) {
					if (err)  {
						conn.rollback(function()  {
							conn.release();
							cb( null, {code:-100, message: 'Internal error.'} );
						})
					}
					else  {
						conn.release();
						cb( null, result );
					}
				})
			}
			else
				cb( null, result );
		}
	});
};