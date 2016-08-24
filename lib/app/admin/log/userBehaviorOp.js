var  async = require('async'),
	 soar = require('sql-soar'),
	 errUtil = require('../../../util/errUtil.js');
	 
var  timeSH = 10 * 60 * 1000;	// 10 min in milliseconds

var  qLogExpr = soar.sql('coimLog.apiLog')
					.column(['userID', 'token', 'c_ip'])
					.filter(
						soar.chainFilters('AND', [
							{name: 'from', field: 'accTime', op:'>='},
							{name: 'to', field: 'accTime', op:'<='}
						])
					)
					.extra('GROUP BY token'),
	 qEachExpr = soar.sql('coimLog.apiLog')
	 				 .filter(
						soar.chainFilters('AND', [
							{name: 'token', op: '='},
							{name: 'from', field: 'accTime', op:'>='},
							{name: 'to', field: 'accTime', op:'<='}
						])
					  )
					 .extra('ORDER BY accTime');
					
var  lLogCmd = {
		op: 'list',
		expr: qLogExpr
	 },
	 lItemCmd = {
		op: 'list',
		expr: qEachExpr
	 };

exports.checkArguments = function(rt, cb)  {
	var  inData = rt.inData;
	
	//if (isNaN(inData._ps))
	//	delete inData._ps;
		
	if (!inData.from)
		inData.from = toyyyymmdd( new Date() ) + 'T00:00:00';
		
	if (!inData.to)
		inData.to = (new Date()).toISOString();
		
	cb( null, true );
}


exports.run = function(rt, cb)  {
	var  inData = rt.inData,
		 ptype = inData.ptype || 'times';
		 
	soar.execute(lLogCmd, rt.inData, function(err, result) {
		if (err)
			return  cb( errUtil.err(errUtil.DB_ERROR) );
	
		var  sessionList = [];
		async.each(result, function(item, cb) {
			if (item.token)  {
				var  query = {
						token: item.token,
						from: inData.from,
						to: inData.to
					 };
					 
				soar.execute(lItemCmd, query, function(err, res) {
					if (err)
						return  cb(err);
						
					var  si = toSessions( res );
					si.userID = item.userID;
					si.device = item.c_ip;
					sessionList.push( si );
					//console.log('[%d] has %d API calls, %d sessions, total session times', item.userID, si.calls, si.sessionList.length, si.sessionTimes);
					cb();
				});
			}
			else
				cb();
		},
		function(err) {
			if (err)
				return  cb( errUtil.err(errUtil.DB_ERROR) );
			
			//console.log('total record counts: ' + sessionList.length);
			var  rtnValue,
				 columns = inData.columns || 40;
				 
			switch (ptype) {
				case 'calls':
					var  scale = inData.scale || 10,	//  default 10 calls
					rtnValue = groupByCalls(scale, columns, sessionList);
					break;
					
				case 'hot':
					var  size = inData.size || 20;
					rtnValue = hotUsers(size, sessionList);
					break;
					
				default:
					var  timeScale = inData.scale || 2000,	//  default 2 seconds
					rtnValue = groupBySessionTimes(timeScale, columns, sessionList);
					break;
			}
			//console.log(JSON.stringify(rtnValue, null, 4));
			cb(null, {code: 0, message: 'Ok', value: rtnValue});
		});	
	});
}


function  hotUsers(size, list)  {
	// first, order by session duration (from long to short)
	list.sort(function(a, b) {
		return  b.sessionTimes - a.sessionTimes;
	});
	
	var  len = Math.min( list.length, size );
	return  {list: list.slice(0, len)};
}


function  groupByCalls(scale, columns, list)  {
	var  callArray = Array.apply(null, Array(columns)).map(function() {return 0});
		 
	if (list.length)  {
		// first, order by API calls
		list.sort(function(a, b) {
			return  a.calls - b.calls;
		});
		
		var  minCalls = list[0].calls;
		for (var i = 0, len = list.length; i < len; i++)  {
			var  idx = Math.floor( (list[i].calls - minCalls) / scale );
			callArray[idx >= columns  ?  columns-1 : idx] += 1;
		}
		//console.log( JSON.stringify(timeArray) );
	}
	
	return  {
		scale: scale,
		data: callArray
	};
}


function  groupBySessionTimes(timeScale, columns, list)  {
	// first, order by session duration
	list.sort(function(a, b) {
		return  a.sessionTimes - b.sessionTimes;
	});
	
	var  minTime = list[0].sessionTimes,
		 timeArray = Array.apply(null, Array(columns)).map(function() {return 0});
		 
	for (var i = 0, len = list.length; i < len; i++)  {
		var  idx = Math.floor( (list[i].sessionTimes - minTime) / timeScale );
		timeArray[idx >= columns  ?  columns-1 : idx] += 1;
	}
	//console.log( JSON.stringify(timeArray) );
	
	return  {
		scale: timeScale,
		data: timeArray
	};
}


/**
 * API log list of the same person
 */
function  toSessions(list)  {
	var  startTime = list[0].accTime,
		 lastTime = startTime,
		 totalTimes = 0,
		 sessionList = [];
	
	for (var i=1, len=list.length; i < len; i++)  {
		var  item = list[i],
			 accTime = item.accTime.getTime();
		
		var  timeSpan = accTime - lastTime;
		if (timeSpan > timeSH)  {
			sessionList.push( lastTime - startTime );
			startTime = accTime;
		}
		
		lastTime = accTime;
	}
	sessionList.push( lastTime - startTime );
	
	for (var i = 0, len = sessionList.length; i < len; i++)
		totalTimes += sessionList[i];
	//console.log('API calls: %d, max time span: %s', list.length, maxTimeSpan);
	
	return  {
		calls: list.length,
		sessionList: sessionList,
		sessionTimes: totalTimes
	};
}


function  toyyyymmdd(d)  {
	var  y = d.getFullYear().toString(),
		 m = padZero(d.getMonth() + 1),
		 day = padZero(d.getDate());
		 
	return  y + '-' + m + '-' + day;
}


function  padZero(n)  {
	return n < 10 ? '0' + n : n.toString();
}