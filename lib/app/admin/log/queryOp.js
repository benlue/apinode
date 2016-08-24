var  request = require('request'),
	 errUtil = require('../../../util/errUtil.js');

var  cnodeConfig = require('../../../../cnodeConfig.json'),
	 elasLog = cnodeConfig.elasLog;
	 
exports.checkArguments = function(rt, cb)  {
	var  inData = rt.inData;
	
	if (isNaN(inData._ps))
		delete inData._ps;
		
	if (!inData.from)
		inData.from = toyyyymmdd( new Date() ) + 'T00:00:00';
		
	if (!inData.to)
		inData.to = (new Date()).toISOString();
		
	cb( null, true );
}


exports.run = function(rt, cb)  {
	var  caID = rt.app.CApp_id,
		 inData = rt.inData,
		 logQuery = composeQuery( caID, inData );
	//console.log('log query is\n' + JSON.stringify(logQuery, null, 4));
	
	var  options = {
			url: elasLog + "/log/cnode/_search",
			method: "POST",
			body: JSON.stringify(logQuery)
		 };
			
	request( options, function(err, resp, body) {
		if (err)  {
			console.log( err.stack );
			cb( errUtil.err( errUtil.ELAS_CONNECT_FAIL ) );
		}
		else  {
			try  {
				//console.log( 'Elastic: ' + body );
				var  resp = JSON.parse( body );
				if (resp.hasOwnProperty('error'))
					cb( errUtil.err( errUtil.ELAS_FAIL_INDEX_REQ ) );
				else  {
					var  result = {
							code: 0,
							message: 'Ok',
							value: resp
						 };
					cb( null, result );
				}
			}
			catch (e)  {
				cb( errUtil.err( errUtil.ELAS_RESPONSE_FMT_ERR ) );
			}
		}
	});
}


function  composeQuery(appID, inData)  {
	var  filters = [
			{
				term: {caID: appID}
			},
			{
				range: {
					"time": {
						"gte": inData.from,
						"lte": inData.to
					}
				}
			}
		 ],
		 logQuery = {
			size: inData._ps || 20,
			filter: {
				'and': filters
			},
			sort: {
				"time": {
					order: "desc"
				}
			}
		 };
		 
	if (inData.c_type)
		filters.push({
			term: {'c_type': inData.c_type}
		});
		
	if (inData.exUsers)  {
		for (var i in inData.exUsers)  {
			var  userID = inData.exUsers[i];
			filters.push({
				not: {
					term: {'userID': userID}
				}
			});
		}
	}
	//console.log(JSON.stringify(logQuery, null, 4));
		 
	return  logQuery;
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