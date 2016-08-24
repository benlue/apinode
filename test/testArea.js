/*!
* devapi
* authors: Ben Lue
* Copyright(c) 2015 Gocharm Inc.
*/
var  assert = require('assert'),
	 path = require('path');

var  base,
	 resMocker;

var  dbConfig = {
		host: "127.0.0.1",
		database: "cnode",
		user: "root",
		password: "xxxx",
		supportBigNumbers : true,
		connectionLimit   : 32
	 };

before(function()  {
	resMocker  = {
		setHeader: function(key, value)  {},
		end: function(s)  {
			this.result = s;
			//console.log( s );
		},
		getResult: function() {
			return  JSON.parse(this.result);
		}
	};
	
	// initialize applications
	var  options = {
			dbConfig: dbConfig,
			appPath: path.join(__dirname, '../lib/app/'),
			fileRoot: '/Users/ben/Documents/projMedia/devapi'
		 };

	base = require('../lib/server/serverBase.js')(options);
});


describe('Testing geo/address', function()  {

	it('update address', function(done) {
		var  req = {
				method: 'GET',
				url: 'http://testCA.coimapi.net/@admin/token/request/101',
				headers: {
					host: 'testCA.coimapi.net',
					'x-deva-appkey': 'e692a81a8026454f9bf108aaab23d20a',
					'x-deva-appsecret': '5678'
				},
				connection: {remoteAddress: '127.0.0.1'}
			 };
			 
		base(req, resMocker, function() {
			var  result = resMocker.getResult(),
				 token = result.token.token;
			//console.log('user token is ' + token);
				 
			req.url = 'http://testCA.coimapi.net/@geo/address/update?addr=基隆市中正區北寧路382號382-5號';
			req.headers['x-deva-token'] = token;
			
			base(req, resMocker, function() {
				var  result = resMocker.getResult().value;
				//console.log( JSON.stringify(result, null, 4) );

				assert(result.addrID, 'updated successfully.');
				done();
			});
		});
	});

	it('address to location', function(done) {
		var  req = {
				method: 'GET',
				url: 'http://testCA.coimapi.net/@admin/token/request/101',
				headers: {
					host: 'testCA.coimapi.net',
					'x-deva-appkey': 'e692a81a8026454f9bf108aaab23d20a',
					'x-deva-appsecret': '5678'
				},
				connection: {remoteAddress: '127.0.0.1'}
			 };
			 
		base(req, resMocker, function() {
			var  result = resMocker.getResult(),
				 token = result.token.token;
			//console.log('user token is ' + token);
				 
			req.url = 'http://testCA.coimapi.net/@geo/address/toLoc?addr=基隆市中正區北寧路382號382-5號';
			req.headers['x-deva-token'] = token;
			
			base(req, resMocker, function() {
				var  result = resMocker.getResult().value;
				//console.log( JSON.stringify(result, null, 4) );

				assert.equal(result.zip, '202', 'zip code is 202');
				done();
			});
		});
	});

	it('info', function(done) {
		var  req = {
				method: 'GET',
				url: 'http://testCA.coimapi.net/@admin/token/request/101',
				headers: {
					host: 'testCA.coimapi.net',
					'x-deva-appkey': 'e692a81a8026454f9bf108aaab23d20a',
					'x-deva-appsecret': '5678'
				},
				connection: {remoteAddress: '127.0.0.1'}
			 };
			 
		base(req, resMocker, function() {
			var  result = resMocker.getResult(),
				 token = result.token.token;
			//console.log('user token is ' + token);
				 
			req.url = 'http://testCA.coimapi.net/@geo/address/update?addr=基隆市中正區北寧路382號382-5號3樓';
			req.headers['x-deva-token'] = token;
			
			base(req, resMocker, function() {
				var  result = resMocker.getResult();
				//console.log( JSON.stringify(result, null, 4) );
				assert.equal(result.code, 0, 'Error occurred');

				req.url = 'http://testCA.coimapi.net/@geo/address/info/' + result.value.addrID;

				base(req, resMocker, function() {
					var  result = resMocker.getResult().value;
					//console.log( JSON.stringify(result, null, 4) );
					assert.equal(result.addr, '基隆市中正區北寧路382號382-5號3樓', 'address is not correct.');
					done();
				});
			});
		});
	});

	it('address to location, guest cannot query private locations', function(done) {
		var  req = {
				method: 'GET',
				url: 'http://testCA.coimapi.net/@admin/token/request',
				headers: {
					host: 'testCA.coimapi.net',
					'x-deva-appkey': 'e692a81a8026454f9bf108aaab23d20a',
					'x-deva-appsecret': '5678'
				},
				connection: {remoteAddress: '127.0.0.1'}
			 };
			 
		base(req, resMocker, function() {
			var  result = resMocker.getResult(),
				 token = result.token.token;
			//console.log('user token is ' + token);
				 
			req.url = 'http://testCA.coimapi.net/@geo/address/toLoc?addr=基隆市中正區北寧路382號382-5號';
			req.headers['x-deva-token'] = token;
			
			base(req, resMocker, function() {
				var  result = resMocker.getResult();
				//console.log( JSON.stringify(result, null, 4) );

				assert.equal(result.code, 2, 'error code is 2');
				done();
			});
		});
	});
});


describe.skip('Testing geo', function()  {

	it('list area', function(done) {
		var  req = {
				method: 'GET',
				url: 'http://testCA.coimapi.net/@admin/token/request',
				headers: {
					host: 'testCA.coimapi.net',
					'x-deva-appkey': 'e692a81a8026454f9bf108aaab23d20a',
					'x-deva-appsecret': '5678'
				},
				connection: {remoteAddress: '127.0.0.1'}
			 };
			 
		base(req, resMocker, function() {
			var  result = resMocker.getResult(),
				 token = result.token.token;
			//console.log('user token is ' + token);
				 
			req.url = 'http://testCA.coimapi.net/@geo/area/list/1';
			req.headers['x-deva-token'] = token;
			
			base(req, resMocker, function() {
				var  result = resMocker.getResult().value;
				//console.log( JSON.stringify(result, null, 4) );

				assert.equal(result.list.length, 5, '5 areas');
				done();
			});
		});
	});

	it('list cities', function(done) {
		var  req = {
				method: 'GET',
				url: 'http://testCA.coimapi.net/@admin/token/request',
				headers: {
					host: 'testCA.coimapi.net',
					'x-deva-appkey': 'e692a81a8026454f9bf108aaab23d20a',
					'x-deva-appsecret': '5678'
				},
				connection: {remoteAddress: '127.0.0.1'}
			 };
			 
		base(req, resMocker, function() {
			var  result = resMocker.getResult(),
				 token = result.token.token;
			//console.log('user token is ' + token);
				 
			req.url = 'http://testCA.coimapi.net/@geo/city/list/3';
			req.headers['x-deva-token'] = token;
			
			base(req, resMocker, function() {
				var  result = resMocker.getResult().value;
				//console.log( JSON.stringify(result, null, 4) );

				assert.equal(result.list.length, 5, '5 cities');
				done();
			});
		});
	});

	it('list cities of a country', function(done) {
		var  req = {
				method: 'GET',
				url: 'http://testCA.coimapi.net/@admin/token/request',
				headers: {
					host: 'testCA.coimapi.net',
					'x-deva-appkey': 'e692a81a8026454f9bf108aaab23d20a',
					'x-deva-appsecret': '5678'
				},
				connection: {remoteAddress: '127.0.0.1'}
			 };
			 
		base(req, resMocker, function() {
			var  result = resMocker.getResult(),
				 token = result.token.token;
			//console.log('user token is ' + token);
				 
			req.url = 'http://testCA.coimapi.net/@geo/city/list?natID=1';
			req.headers['x-deva-token'] = token;
			
			base(req, resMocker, function() {
				var  result = resMocker.getResult().value;
				//console.log('city count: ' + result.length);
				//console.log( JSON.stringify(result, null, 4) );

				assert.equal(result.list.length, 22, '22 cities');
				done();
			});
		});
	});

	it('list district', function(done) {
		var  req = {
				method: 'GET',
				url: 'http://testCA.coimapi.net/@admin/token/request',
				headers: {
					host: 'testCA.coimapi.net',
					'x-deva-appkey': 'e692a81a8026454f9bf108aaab23d20a',
					'x-deva-appsecret': '5678'
				},
				connection: {remoteAddress: '127.0.0.1'}
			 };
			 
		base(req, resMocker, function() {
			var  result = resMocker.getResult(),
				 token = result.token.token;
			//console.log('user token is ' + token);
				 
			req.url = 'http://testCA.coimapi.net/@geo/district/list/2';
			req.headers['x-deva-token'] = token;
			
			base(req, resMocker, function() {
				var  result = resMocker.getResult().value;
				//console.log( JSON.stringify(result, null, 4) );

				assert.equal(result.list.length, 12, '12 districts');
				done();
			});
		});
	});
});