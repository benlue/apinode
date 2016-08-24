/*!
* cnode
* authors: Ben Lue
* Copyright(c) 2015 Conwell Inc.
*/
exports.run = function(rt, cb)  {
	var  x = a + 3,
		 result = {
			code: 0,
			message: 'Ok',
			value: x
		 };
		 
	cb(null, result);
};