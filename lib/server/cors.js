/*!
* coim2
* authors: Ben Lue
* Copyright(c) 2015 Gocharm Inc.
*/
var  url = require('url');

module.exports = function() {
	var  cors = function(req, res, next)  {
		if (req.method === 'OPTIONS')
			handleOptionsMethod(req, res, next);
		next();
	};

	return  cors;
};


function  handleOptionsMethod(req, res)  {
	res.setHeader('Access-Control-Allow-Origin', '*');
	//res.setHeader('Access-Control-Allow-Headers', 'origin, X-Requested-With, content-type, accept');
	res.setHeader('Access-Control-Allow-Headers', '*');
	res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
	//res.setHeader('Access-Control-Allow-Methods', '*');
	//res.setHeader('content-type', 'text/html; charset=utf-8');
	//res.end();
};