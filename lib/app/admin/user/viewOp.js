/*!
* cnode
* authors: Ben Lue
* Copyright(c) 2015 Gocharm Inc.
*/
var  soar = require('sql-soar');

var  usrExpr = soar.sql('GrpUser AS gu')
				   .join({
					   table: 'Person AS psn',
					   onWhat: 'gu.Person_id=psn.Person_id'
				   })
				   .join({
					   table: 'GeoLoc AS ge',
					   onWhat: 'psn.addrID=ge.geID',
					   type: 'LEFT'
				   })
				   .join({
					   table: 'FbUser AS fu',
					   onWhat: 'gu.GrpUser_id=fu.userID',
					   type: 'LEFT'
				   })
				   .column(['GrpUser_id AS userID', 'gu.iconURI', 'fu.iconURI AS fbIcon', 'accName', 'fbUserID', 'dspName', 'nid', 'fname', 'lname', 'dob', 'gender', 'email', 'mobile', 'addr', '_c_json AS aux'])
				   .filter({
					   name: 'GrpUser_id', op: '='
				   });
				   
var  usrCmd = {op: 'query', expr: usrExpr};

exports.run = function(rt, cb)  {
	var  userID = rt.uPro.userID;
	
	soar.execute(usrCmd, {GrpUser_id: userID}, function(err, usrData) {
		if (err)
			return  cb({code: -100, message: 'Internal error.'});
			
		usrData.iconURI = usrData.iconURI || usrData.fbIcon;
		delete  usrData.fbIcon;
		
		cb( null, {code: 0, message: 'Ok', value: usrData} );
	});
};