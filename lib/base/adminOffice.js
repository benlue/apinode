/*!
* apinode
* authors: Ben Lue
* Copyright(c) 2015~2016 Gocharm Inc.
*/
var  async = require('async'),
	 soar = require('sql-soar'),
	 Promise = require('bluebird');

var  GUEST_USER_ID = 20,
	 MEMBER_ROLE = 6,
	 GUEST_ROLE = 7;
	 
var  caExpr = soar.sql('CApp')
				  .filter({name: 'caCode', op: '='}),
	 rsExpr = soar.sql('Resource')
				  .filter({
					  op: 'and',
					  filters: [
						  {name: 'CApp_id', op: '='},
						  {name: 'rsCode', op: '='}
					  ]
				  }),
	 opExpr = soar.sql('RsOp')
	 			  .filter({
					   op: 'and',
					   filters: [
						   {name: 'Resource_id', op: '='},
						   {name: 'opCode', op: '='}
					   ]
				   }),
	 opAccExpr = soar.sql('OpAccess')
	 				 .column(['ok'])
					 .filter({
						op: 'and',
						filters: [
							{name: 'ExeRole_id', op: '='},
							{name: 'RsOp_id', op: '='}
						]
					 }),
	 userExpr = soar.sql('GrpUser')
	 				.filter({
						 op: 'and',
						 filters: [
							 {name: 'UGroup_id', op: '='},
							 {name: 'Person_id', op: '='},
							 {name: 'accName', op: '='},
							 {name: 'GrpUser_id', op: '='}
						 ]
					 }),
	 uproExpr = soar.sql('GrpUser AS gu')
	 				.join({
						 table: 'ExeRole AS er',
						 onWhat: 'gu.ExeRole_id=er.ExeRole_id'
					 })
					.column(['UGroup_id AS grpID', 'gu.Person_id AS psnID', 'gu.extID', 'gu.ExeRole_id AS ExeRole_id', 'score'])
					.filter({name: 'GrpUser_id', op: '='}),
	 psnExpr = soar.sql('Person'),
	 grpExpr = soar.sql('UGroup')
	 			   .filter({name: 'grpCode', op: '='}),
	 canUseExpr = soar.sql('AuthApp')
	 				  .filter({
						   op: 'and',
						   filters: [
							   {name: 'CApp_id', op: '='},
							   {name: 'UseCApp_id', op: '='}
						   ]
					   });
					 
var  qCaCmd = {op: 'query', expr: caExpr},
	 qRsCmd = {op: 'query', expr: rsExpr},
	 qOpCmd = {op: 'query', expr: opExpr},
	 qOpAccCmd = {op: 'query', expr: opAccExpr},
	 qUserCmd = {op: 'query', expr: userExpr},
	 qUproCmd = {op: 'query', expr: uproExpr},
	 qGrpCmd = {op: 'query', expr: grpExpr},
	 qUseAppCmd = {op: 'query', expr: canUseExpr};

exports.getCA = function(caCode, cb)  {
	var  query = {
			caCode: caCode
		 };
		 
	soar.execute(qCaCmd, query, cb);
};

				  
exports.getRS = function(caID, rsCode, cb)  {
	var  query = {
			CApp_id: caID,
			rsCode: rsCode
		 };
		 
	soar.execute(qRsCmd, query, cb);
};


exports.getOP = function(rsID, opCode, cb)  {
	var  query = {
			Resource_id: rsID,
			opCode: opCode
		 };
		 
	soar.execute(qOpCmd, query, cb);
};


exports.getOpAcc = function(opID, roleID, cb)  {
	var  query = {
			RsOp_id: opID,
			ExeRole_id: roleID
		 };
		 
	soar.execute(qOpAccCmd, query, cb);
};


exports.getGroup = function(grpCode, cb)  {
	var  query = {grpCode: grpCode};
	soar.execute(qGrpCmd, query, cb);
};


exports.getUser = function(grpID, accName, cb)  {
	var  query = {UGroup_id: grpID, accName: accName};
	soar.execute(qUserCmd, query, cb);
};


exports.updateUPro = function(uPro, cb)  {
	if (uPro.userID === GUEST_USER_ID)  {
		uPro.roleID = GUEST_ROLE;
		uPro.roleScore = 0;
		uPro.isGuest = true;
		// TODO:
		uPro.extID = 1;
		cb();
	}
	else  {
		var  query = {GrpUser_id: uPro.userID};
		
		soar.execute(qUproCmd, query, function(err, userData) {
			if (err)
				return  cb(err);
			
			if (userData)  {
				uPro.psnID = userData.psnID;
				uPro.grpID = userData.grpID;
				uPro.roleScore = userData.score;
				uPro.roleID = userData.ExeRole_id;
				uPro.extID = userData.extID;
			}
			else  {
				uPro.userID = GUEST_USER_ID;
				uPro.roleID = GUEST_ROLE;
				uPro.roleScore = 0;
				uPro.isGuest = true;
				// TODO:
				uPro.extID = 1;
			}
			
			//console.log('user profile is:\n%s', JSON.stringify(uPro, null, 4));
			cb();
		});
	}
};


exports.createExtUser = function(grpID, accName, cb)  {
	async.waterfall([
		function(cb)  {
			soar.getConnection(cb);
		},
		function(conn, cb)  {
			conn.beginTransaction(function(err)  {
				cb(err, conn);
			});
		},
		function createPsn(conn, cb)  {
			var  data = {isNature: true},
				 cmd = {op: 'insert', expr: psnExpr, conn: conn};
				 
			soar.execute(cmd, data, null, function(err, psnPK) {
				cb(err, conn, psnPK);
			});
		},
		function createUser(conn, psnPK, cb)  {
			var  data = {UGroup_id: grpID, Person_id: psnPK.Person_id,
						 accName: accName, ExeRole_id: MEMBER_ROLE,
                         createTime: new Date(), isValid: true},
				 cmd = {op: 'insert', expr: userExpr, conn: conn};
                
			soar.execute(cmd, data, null, function(err, usrPK) {
				if (err)
					cb(err, conn);
				else
					cb(null, conn, usrPK);
			});		 
		}
	],
	function(err, conn, usrPK) {
		if (err)
			conn.rollback(function() {
				conn.release();
				cb(  err );
			});
		else
			conn.commit(function(err) {
				if (err)  {
					conn.rollback(function()  {
						conn.release();
						cb( err );
					})
				}
				else  {
					conn.release();
					cb( null, usrPK );
				}
			});
	});
};


exports.canUseApp = function(appID, canUseApp)  {
	return  new Promise(function(resolve, reject) {
		exports.getCA(canUseApp, function(err, caData)  {
			if (err)  {
				console.log(err.stack);
				return  reject(err);
			}
			
			if (caData)  {
				//console.log('use app is\n%s', JSON.stringify(caData, null, 4));
				if (caData.isPublic)
					// public module, open for access for every one
					resolve({CApp_id: appID, UseCApp_id: caData.CApp_id, readable: true, writable: false});
				else  {
					var  query = {CApp_id: appID, UseCApp_id: caData.CApp_id};
					soar.execute(qUseAppCmd, query, function(err, useData)  {
						if (err)
							reject(err);
						else
							resolve( useData );
					});
				}
			}
			else
				resolve();
		});
	});
};


/*
exports.canUseApp = function(appID, canUseAppID, cb)  {
	var  query = {CApp_id: appID, UseCApp_id: canUseAppID};
	soar.execute(qUseAppCmd, query, cb);
};
*/