/*!
* cnode
* authors: Ben Lue
* Copyright(c) 2015 Conwell Inc.
*/
var  fs = require('fs'),
	 mime = require('mime'),
	 path = require('path'),
	 soar = require("sql-soar"),
	 userUtil = require('../util/userUtil.js');

var  userExpr = soar.sql('GrpUser')
					.column(['iconURI'])
					.filter({name: 'GrpUser_id', op: '='});
					
var  uCmd = {op: 'update', expr: userExpr};

exports.run = function(rt, cb)  {
	var  inData = rt.inData,
		 userID = rt.uPro.userID;
	
	var  keys = Object.keys(inData.files),
		 fileObj = inData.files[keys[0]],
		 suffix = mime.extension(fileObj.type);

	fs.rename( fileObj.path, makePath(userID, suffix), function(err) {
		if (err)  {
			console.log( err.stack );
			return  cb( userUtil.internErr() );
		}

		var  iconURI = 'user/user' + userID + '/icon.'+suffix;
		soar.execute(uCmd, {iconURI: iconURI}, {GrpUser_id: userID}, function(err) {
			if (err)  {
				console.log( err.stack );
				return  cb( userUtil.internErr() );
			}
				
			cb( null, {code: 0, message: 'Ok'} );
		});
	});
};


function  makePath(userID, suffix)  {
	var  fpath = path.join(userUtil.getFileRoot(), '../user/user' + userID);
	console.log('file path is ' + fpath);
	if (!fs.existsSync(fpath))
		fs.mkdirSync( fpath );
	
	return  path.join(fpath, './icon.' + suffix);
};