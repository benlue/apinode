/*!
* devapi:cmd
* authors: Ben Lue
* Copyright(c) 2015 Conwell Inc.
*/
var  userUtil = require('./util/userUtil.js');

exports.init = function(options) {
	userUtil.setFileRoot( options.fileRoot );
};