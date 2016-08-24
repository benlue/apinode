/*!
* cnode
* authors: Ben Lue
* Copyright(c) 2015 Gocharm Inc.
*/
var  soar = require('sql-soar');

var  GUEST_USER_ID = 20;

var  usrExpr = soar.sql('GrpUser AS gu')
				   .join({
					   table: 'ExeRole AS er',
					   onWhat: 'gu.ExeRole_id=er.ExeRole_id'
				   })
				   .join({
					   table: 'FbUser AS fu',
					   onWhat: 'gu.GrpUser_id=fu.userID',
					   type: 'LEFT'
				   })
				   .column(['GrpUser_id', 'dspName', 'gu.iconURI', 'fu.iconURI AS fbIcon', 'score AS roleScore'])
				   .filter({name: 'GrpUser_id', op: '='});
				   
var  qUsrCmd = {op: 'query', expr: usrExpr};

exports.run = function(rt, cb)  {
	var  uPro = rt.uPro,
		 usrID = rt.ep.id || uPro.userID;
		 
	soar.execute(qUsrCmd, {GrpUser_id: usrID}, function(err, usrData) {
		if (err)
			return  cb({code: -100, message: 'Internal error.'});
			
		usrData.iconURI = usrData.iconURI || usrData.fbIcon;
		usrData.isGuest = usrData.GrpUser_id === GUEST_USER_ID;
		delete  usrData.GrpUser_id;
		delete  usrData.fbIcon;
			 
		cb(null, {code: 0, message: 'Ok', value: usrData});
	});
};