var request = require('request');
exports.execute = function(ctx, inData, cb)  {

	var opt = {
		url: 'http://127.0.0.1:4000/list/endpoint',
		method: 'POST',
		headers : {
			'x-deva-appcode': 'api',
			'Content-Type': 'application/json',
			'Content-Length': 0
		}
		
	};
	
	request(opt, (err, res, body) => {
		if (!err && res.statusCode == 200){
			var obj = JSON.parse(body);
			cb({errCode: 0, value: obj});
		}
	});
}