/*!
* cnode
* authors: Ben Lue
* Copyright(c) 2015 Conwell Inc.
*/
var  gm = require('gm'),
	 fs = require('fs'),
	 mime = require('mime'),
	 path = require('path'),
	 soar = require('sql-soar'),
	 userUtil = require('../util/userUtil.js');
	
var  userExpr = soar.sql('GrpUser')
					.column(['iconURI'])
					.filter({name: 'GrpUser_id', op: '='});
					
var  qCmd = {op: 'query', expr: userExpr};
 
exports.checkArguments = function(rt, cb)  {
	var  id = rt.ep.id;
	if (id && isNaN(id))
		return  cb( {code: 1, message: 'The user ID is not valid.'});
		
	var  inData = rt.inData;
	checkInteger(inData, 'w');
	checkInteger(inData, 'h');
	checkInteger(inData, 'maxw');
	checkInteger(inData, 'maxh');
		
	cb( null, true );
};


exports.checkPermission = function(rt, cb)  {
	var  userID = rt.ep.id || rt.uPro.userID;
	
	soar.execute(qCmd, {GrpUser_id: userID}, function(err, userData) {
		if (err)
			return  cb( userUtil.internErr() );
			
		if (userData)  {
			rt.inData.userData = userData;
			cb( null, true );
		}
		else
			cb( {code: 2, message: 'No such user.'} );
	});
};


exports.run = function(rt, cb)  {
	var  inData = rt.inData,
		 iconURI = inData.userData.iconURI,
		 filePath = iconURI  ?  path.join(userUtil.getFileRoot(), '../' + iconURI) : path.join(__dirname, './defaultIcon.png'),
		 mtype = mime.lookup( inData.userData.iconURI );

	fs.exists(filePath, function(exists) {
		if (exists)  {
			if (inData.w || inData.h || inData.maxw || inData.maxh)  {
				var  gmImg = gm(filePath);
				gmImg.size(function(err, size) {
					if (err)  {
						console.log( err.stack );
						return  cb( {code: 9, message: 'Cannot determine image size.'});
					}

					var  nsize = calcSize( size, inData.w, inData.h, inData.maxw, inData.maxh ),
						 nImg = nsize.both  ?  gmImg.resize( nsize.width, nsize.height, "!") : gmImg.resize(nsize.width);

					var  sendData = {mimeType: mtype, stream: nImg.stream()};
					cb(null, {code:0, send: sendData});
				});
			}
			else  {
				var  sendData = {mimeType: mtype, file: filePath};
				cb(null, {code:0, send: sendData});
			}
		}
		else
			cb( {code: 10, message: 'The user does not have an icon.'});
	});
};


function  checkInteger(inData, key)  {
	if (inData.hasOwnProperty(key))  {
		var  i = parseInt( inData[key] );
		if (isNaN(i) || i <= 0)
			delete  inData[key];
		else
			inData[key] = i;
	}
};


function  calcSize(size, w, h, maxw, maxh)  {
	var  nsize = {};

	if (w || h)  {
		if (w && h)
			nsize.both = true;	// nothing to do
		else  if (w)
			h = w * size.height / size.width;
		else
			w = h * size.width / size.height;
	}
	else  {
		w = size.width;
		h = size.height;

		if (maxw && maxh)  {
			if (w > maxw && h > maxh)  {
				w = maxh * size.width / size.height;
				h = maxh;

				if (w > maxw)  {
					h = maxw * size.height / size.width;
					w = maxw;
				}
			}
			else  if (w > maxw)  {
				w = maxw;
				h = w * size.height / size.width;
			}
			else  if (h > maxh)  {
				h = maxh;
				w = h * size.width / size.height;
			}
		}
		else  if (maxw)  {
			if (w > maxw)  {
				w = maxw;
				h = w * size.height / size.width;
			}
		}
		else  if (maxh)  {
			if (h > maxh)  {
				h = maxh;
				w = h * size.width / size.height;
			}
		}
	}

	nsize.width = w;
	nsize.height = h;
	return  nsize;
};