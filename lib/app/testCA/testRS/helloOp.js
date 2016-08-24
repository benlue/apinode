/*!
* cnode
* authors: Ben Lue
* Copyright(c) 2015 Conwell Inc.
*/
exports.run = function(rt, cb)  {
	var  result = {
			code: 0,
			message: 'Ok',
			value: "Hello"
		 };
		 
	cb(null, result);
};