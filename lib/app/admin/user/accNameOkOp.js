/*!
* cnode
* authors: Ben Lue
* Copyright(c) 2015 Conwell Inc.
*/
var  userUtil = require('../util/userUtil.js');

exports.checkArguments = function(rt, cb)  {
	var  accName = rt.inData.accName;
	
	if (accName && (typeof accName === 'string'))  {
		if (accName.length < 6)
			cb( {code: 2, message: 'Account name should have at least 6 characters.'});
		else
			cb( null, true );
	}
	else
		cb( {code: 1, message: 'Not a valid account name'});
};


exports.run = function(rt, cb)  {
	userUtil.accNameOk(rt.inData.accName, rt.app.UGroup_id, function(err, usrData) {
		if (err)
			return  cb({code: -100, message: 'Internal error'});
		
		var  result = {isOk: usrData  ?  false : true};
		cb( null, {code: 0, message: 'Ok', value: result} );
	});
};