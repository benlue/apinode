/*!
* cnode
* authors: Ben Lue
* Copyright(c) 2015 Gocharm Inc.
*/
var  fs = require('fs'),
	 path = require('path'),
	 request = require('request'),
	 soar = require('sql-soar'),
	 util = require('util');

var  cnodeConfig = require('../../cnodeConfig.json'),
	 elasLog = cnodeConfig.elasLog,
	 logDir, // = cnodeConfig.logDir,
	 saveToDB = cnodeConfig.db.length > 1;

var  todayDate,
	 todayIndex,
	 todayLogFile,
	 logStream;

exports.setLogDir = function(ld)  {
	logDir = ld;
};

	 
exports.log = function log(logData)  {
	var  logTime = logData.time;
	
	if (elasLog)  {
		var  options = {
				//url: elasLog + "/" + indexName + "/log",
				url: elasLog + "/log/cnode",
				method: "POST",
				body: JSON.stringify(logData)
			 };
				
		request( options, function(err, resp, body) {
			if (err)
				console.log( err.stack );
		});
		/*
		findIndex( logTime, function(err, indexName) {
			if (!err)  {
				var  options = {
						//url: elasLog + "/" + indexName + "/log",
						url: elasLog + "/log/cnode",
						method: "POST",
						body: JSON.stringify(logData)
					 };
					 
				request( options, function(err, resp, body) {
					if (err)
						console.log( err.stack );
				});
			}
		});
		*/
	}
	
	if (saveToDB)
		logToDB(logData, function() {
			logToFile(logData);
		});
	else
		logToFile(logData);
	/*
	if (logDir)  {
		getLogStream( logTime, function(err, stream)  {
			if (stream)  {
				var  s = util.format('[%d/%d] %s %s %s -- %d %s %s\n', logData.userID, logData.caID, logData.c_ip, logData.c_type, logData.ep, logData.code, logData.time, logData.token);
				stream.write(s);
			}
		});
	}
	else
		console.log('[%d/%d] %s %s %s -- %d %s', logData.userID, logData.caID, logData.c_ip, logData.c_type, logData.ep, logData.code, logData.time);
	*/
}


function  logToDB(logData, cb)  {
	if ((logData.userID >= 598 && logData.userID <= 613) ||
		(logData.userID >= 491 && logData.userID <= 506) ||
		(logData.userID >= 374 && logData.userID <= 459) ||
		(logData.userID >= 311 && logData.userID <= 370) ||
		(logData.userID <= 309)) {
		// exclude test accounts
		return  cb();
	}
	
	// rewrite field name
	if (logData.time)
		logData.accTime = logData.time;
	
	soar.insert('coimLog.apiLog', logData, function(err)  {
		if (err)
			console.log( err.stack );
		cb();
	});
}


function  logToFile(logData)  {
	if (logDir)  {
		var  logTime = logData.time;
		getLogStream( logTime, function(err, stream)  {
			if (stream)  {
				var  s = util.format('[%d/%d] %s %s %s -- %d %s %s\n', logData.userID, logData.caID, logData.c_ip, logData.c_type, logData.ep, logData.code, logData.time, logData.token);
				stream.write(s);
			}
		});
	}
	else
		console.log('[%d/%d] %s %s %s -- %d %s', logData.userID, logData.caID, logData.c_ip, logData.c_type, logData.ep, logData.code, logData.time);
}


function  getLogStream(logTime, cb)  {
	var  day = logTime.getDate();
	if (day === todayDate && logStream)
		return  cb( null, logStream );
		
	todayLogFile = util.format('cnode-%s-%s-%s.log', logTime.getFullYear(), zeroFill(logTime.getMonth()+1), zeroFill(logTime.getDate()));
	todayDate = day;
	
	if (logStream)  {
		logStream.end();
		logStream = null;
	}
	
	var  logFile = path.join(logDir, todayLogFile);
	//console.log('log name is %s, log path is %s', todayLogFile, logFile);
	fs.exists(logFile, function(exists)  {
		if (exists)  {
			logStream = fs.createWriteStream(logFile, {flags: 'a', encoding: 'utf-8'});
			cb( null, logStream );
		}
		else  {
			logStream = fs.createWriteStream(logFile, {flags: 'w', encoding: 'utf-8'});
			cb( null, logStream );
		}
	});
}


/**
 * Find out the index name of the specified date
 */
function  findIndex(logTime, cb)  {
	var  day = logTime.getDate();
	if (day === todayDate && todayIndex)
		return  cb( null, todayIndex );
		
	todayIndex = util.format('cnode-%s.%s.%s', logTime.getFullYear(), zeroFill(logTime.getMonth()+1), zeroFill(logTime.getDate()));
	todayDate = day;
	
	// close down log stream
	if (logStream)  {
		logStream.end();
		logStream = null;
	}
	
	var  options = {
			uri: elasLog + '/' + todayIndex,
			method: 'HEAD'
		 };
	//console.log('option is\n%s', JSON.stringify(options, null, 4));
		 
	request( options, function(err, resp, body) {
		if (err)  {
			console.log( err.stack );
			return  cb( err );
		}
		
		if (resp.statusCode === 200)
			cb( null, todayIndex );
		else  {
			// we'll try to create a new index for a day's log
			options.method = "PUT";
			request( options, function(err, resp, body) {
				if (err)  {
					console.log( err.stack );
					return  cb( err );
				}
				cb( null, todayIndex );
			});
		}
	});
};


function  zeroFill(n)  {
	var  s = n + '';
	if (s.length < 2)
		s = '0' + s;
	return  s;
}