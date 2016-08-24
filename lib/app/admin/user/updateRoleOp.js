/*!
* cnode
* authors: Ben Lue
* Copyright(c) 2015 Gocharm Inc.
*/
var  soar = require('sql-soar');

var  usrExpr = soar.sql('GrpUser AS gu')
				   .join({
					   table: 'ExeRole AS er',
					   onWhat: 'gu.ExeRole_id=er.ExeRole_id'
				   })
				   .column(['score']).
				   filter({
					   op: 'and',
					   filters: [
						   {name: 'GrpUser_id', op: '='},
						   {name: 'UGroup_id', op: '='}
					   ]
				   });
				   
var  qUsrCmd = {op: 'query', expr: usrExpr};

exports.checkArguments = function(rt, cb)  {
	var  id = rt.ep.id;
	if (!id || isNaN(id))
		return  cb( {code: 1, message: 'The user ID should be specified.'});
		
	if (id === rt.uPro.userID)
		return  cb( {code: 2, message: 'You cannot change the execution role of your own'} );
		
	var  roleID = rt.inData.roleID;
	if (!roleID || isNaN(roleID))
		return  cb( {code: 3, message: 'The role ID should be specified.'});
	
	cb( null, true );
};


exports.checkPermission = function(rt, cb)  {
	var  grpID = rt.app.UGroup_id,
		 userID = rt.ep.id;
	
	soar.execute(qUsrCmd, {UGroup_id: grpID, GrpUser_id: userID}, function(err, usrData)  {
		if (err)
			return  cb({code: -100, message: 'Internal error'});
			
		//console.log('user score: %d, target score: %d', rt.uPro.roleScore, usrData.score);
		cb( null, rt.uPro.roleScore >= usrData.score);
	});
};


exports.run = function(rt, cb)  {
	var  roleID = rt.inData.roleID,
		 userID = rt.ep.id;
	
	soar.query('ExeRole', {ExeRole_id: roleID}, function(err, roleData) {
		if (err)
			return  cb({code: -100, message: 'Internal error'});
			
		if (roleData.score > rt.uPro.roleScore)
			cb({code: 4, message: "You are not authorized to set an user's role being stronger than yourself."});
		else  {
			soar.update('GrpUser', {ExeRole_id: roleID}, {GrpUser_id: userID}, function(err) {
				if (err)
					cb({code: -100, message: 'Internal error'});
				else
					cb({code: 0, message: 'Ok'});
			});
		}
	});
};