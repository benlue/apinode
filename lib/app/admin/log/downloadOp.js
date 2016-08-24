var  cnodeConfig = require('../../../../cnodeConfig.json'),
	 fs = require('fs'),
	 path = require('path'),
	 util = require('util');

exports.run = function(rt, cb)  {
	var  inData = rt.inData,
		 date = inData.date || new Date();
		 
	if (!date)  {
		var  today = new Date();
		date = util.format('%s-%s-%s', today.getFullYear(), zeroFill(today.getMonth()+1), zeroFill(today.getDate()));
	}
	
	if (!cnodeConfig.logDir)
		return  cb({code: 1, message: "This system does not support file log."});
		
	var  logFile = path.join( cnodeConfig.logDir, "cnode-" + date + ".log");
	fs.readFile( logFile, function(err, data) {
		if (err)
			cb( {code: 2, message: "Unable to fetch the log file."});
		else
			cb( null, {code: 0, message: 'Ok', value: data});
	});
	
};

function  zeroFill(n)  {
	var  s = n + '';
	if (s.length < 2)
		s = '0' + s;
	return  s;
}