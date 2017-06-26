/*!
* reqUtil
* authors: Ben Lue
* Copyright(c) 2015 ~ 2017 Gocharm Inc.
*/
var  errUtil = require('./errUtil.js');

exports.parseEndpoint = function(appCode, endp)  {
	var  parts = endp.split('/'),
		 endpoint;
		 
	if (parts.length < 3)
		throw  errUtil.err( errUtil.INVALID_EP );
		
	var  idx = parts[1].indexOf('@');
	if (idx >= 0)  {
		if (parts.length < 4)
			throw  errUtil.err( errUtil.INVALID_EP );
		
		endpoint = {
			ds: idx === 0  ? appCode: parts[1].substring(0, idx),
			app: parts[1].substring(idx+1),
			rs: parts[2],
			op: parts[3],
			id: parts.length > 4  ?  parts[4] : null
		};
	}
	else
		endpoint = {
			ds: appCode,
			app: appCode,
			rs: parts[1],
			op: parts[2],
			id: parts.length > 3  ?  parts[3] : null
		};
		
	idx = endpoint.op.indexOf('.');
	if (idx > 0)  {
		endpoint.postFix = endpoint.op.substring(idx+1);
		endpoint.op = endpoint.op.substring(0, idx);
	}
		
	//console.log('endpoint is\n%s', JSON.stringify(endpoint, null, 4));
	return  endpoint;
};