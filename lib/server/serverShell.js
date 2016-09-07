/*!
* apinode
* authors: Ben Lue
* Copyright(c) 2015~2016 Gocharm Inc.
*/
var  serverBase = require('./serverBase.js');

module.exports = function(options) {
    serverBase.init(options);
	return  serverBase.intake;
};