var  soar = require('sql-soar'),
	 errUtil = require('../../../util/errUtil.js');

var  millisADay = 24 * 60 * 60 * 1000;

var  qLogExpr = soar.sql('coimLog.apiLog')
					.column(['accTime'])
					.filter(
						soar.chainFilters('AND', [
							{name: 'caID', op: '='},
							{name: 'userID', op: '='},
							{name: 'from', field: 'accTime', op:'>='},
							{name: 'to', field: 'accTime', op:'<'}
						])
					)
					.extra('ORDER BY accTime');
					
var  logCmd = {op: 'list', expr: qLogExpr};

exports.run = function(rt, cb)  {
	var  userID = rt.ep.id,
		 inData = rt.inData;
	//console.log('inData is:\n' + JSON.stringify(inData, null, 4));
		 
	var  fromDate = stringToDate(inData.from),
		 toDate = inData.to;
		 
	if (toDate)
		toDate = stringToDate(toDate, 1);
	else  {
		var  d = new Date();
		toDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
	}
	 
	var  query = {
			caID: inData.caID,
			userID: userID,
			from: toyyyymmdd(fromDate),
			to: toyyyymmdd(toDate)
		 };
		 
	soar.execute(logCmd, query, function(err, list)  {
		if (err)
			return  cb( errUtil.err(errUtil.DB_ERROR) );
			
		var  days = daysBetweenDate( fromDate, toDate ),
			 scaleInfo = toTimeSlot( days ),
			 scale = scaleInfo.scale,
			 columns = scaleInfo.columns,
			 distArray = Array.apply(null, Array(columns)).map(function() {return 0});
			 
		var  result = {
				scale: scale / 60000,	// in minutes
			 };
			 
		if (list.length === 0)  {
			result.list = new Array();
			return  cb({code: 0, message: 'Ok', value: result});
		}
		//console.log('total API calls: ' + list.length);
		
		var  initTime = fromDate.getTime();
		for (var i in list)  {
			var  item = list[i],
				 idx = Math.floor( (item.accTime - initTime) / scale );
				 
			if (idx >= columns)
				idx = columns - 1;
			distArray[idx]++;
		}
		
		result.list = distArray;
		cb({code: 0, message: 'Ok', value: result});
	});
}


function  toTimeSlot(days)  {
	var  minutes;
	
	if (days <= 4)
		minutes = 30 * days;
	else  if (days <= 7)
		minutes = 120;
	else
		minutes = days * 15;
		
	var  columns = days * 24 * 60 / minutes;
	return  {
		scale: minutes * 60 * 1000,
		columns: columns
	};
}


/**
 * How may days between from and to
 */
function  daysBetweenDate(d1, d2)  {
	// at least 1 day long
	return  Math.max( Math.round( (d2.getTime() - d1.getTime()) / millisADay ), 1); 
}


function  stringToDate(s, d)  {
	var  date;
	
	if (s.indexOf('-'))  {
		var  dp = s.split('-');
		date = new Date(dp[0], dp[1]-1, dp[2]);
	}
	else  {
		var  dp = s.split('/');
		date = new Date(dp[2], dp[0] - 1, dp[1]);
	}
	
	if (d)
		// make date adjustment
		date.setDate(date.getDate() + d);
		
	return  date;
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