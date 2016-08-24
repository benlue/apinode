/*!
* coimnode
* authors: Ben Lue
* Copyright(c) 2015 Gocharm Inc.
*/
var  assert = require('assert'),
	 path = require('path'),
	 errUtil = require('../lib/util/errUtil.js');

var  base,
	 resMocker;
var  dbConfig = {
		host: "127.0.0.1",
		database: "cnode",
		user: "root",
		password: "root",
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


describe('Testing server base', function()  {
	
	it.skip('Request guest token', function(done) {
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
			var  result = resMocker.getResult();
			//console.log( JSON.stringify(result, null, 4) );
			assert.equal(result.token.token.substring(0, 16), '48c28df4417aac58', 'No error');
			done();
		});
	});
	
	it('Request user token', function(done) {
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
			var  result = resMocker.getResult();
			//console.log( JSON.stringify(result, null, 4) );
			assert.equal(result.token.token.substring(0, 16), '48c28df4417aac58', 'No error');
			done();
		});
	});

	it('Basic flow', function(done) {
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
			//console.log('application token is ' + token);
				 
			req.url = 'http://testCA.coimapi.net/testRS/hello';
			req.headers['x-deva-token'] = token;
			
			base(req, resMocker, function() {
				var  result = resMocker.getResult();
				//console.log("result is\n%s", JSON.stringify(result, null, 4));
				assert.equal(result.code, 0, 'No error');
				assert.equal(result.value, "Hello", "value is Hello");
				done();
			});
		});
	});
	
	it('External user request', function(done) {
		var  req = {
				method: 'GET',
				url: 'http://extCA.coimapi.net/@admin/token/request/248',
				headers: {
					host: 'extCA.coimapi.net',
					'x-deva-appkey': '005be9c9c8a64bc7b91c4dfa1b0cc7b0',
					'x-deva-appsecret': '2468'
				},
				connection: {remoteAddress: '127.0.0.1'}
			 };
			 
		base(req, resMocker, function() {
			var  result = resMocker.getResult();
			//console.log( JSON.stringify(result, null, 4) );
			var	 token = result.token.token;
			//console.log('application token is ' + token);
				 
			req.url = 'http://extCA.coimapi.net/@testCA/testRS/hello';
			req.headers['x-deva-token'] = token;
			
			base(req, resMocker, function() {
				var  result = resMocker.getResult();
				//console.log( JSON.stringify(result, null, 4) );
				assert.equal(result.code, 0, 'No error');
				assert.equal(result.value, "Hello", "value is Hello");
				done();
			});
		});
	});

});


describe('Testing batch services', function()  {
	
	it('Serial execution', function(done) {
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
			//console.log('application token is ' + token);
				 
			req.method = 'POST';
			req.url = 'http://testCA.coimapi.net/@api/batch/serial';
			req.headers['x-deva-token'] = token;
			req.headers['content-type'] = 'application/json';
			req.body = {
				_req: [
					{
						ep: '/testRS/hello'
					},
					{
						ep: '/testRS/hello'
					}
				]
			};
			
			base(req, resMocker, function() {
				var  result = resMocker.getResult().value;
				//console.log( JSON.stringify(result, null, 4) );
				
				assert.equal(result.length, 2, '2 results');
				assert.equal(result[0].value, 'Hello', 'result is hello');
				done();
			});
		});
	});
	
	it('Parallel execution', function(done) {
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
			//console.log('application token is ' + token);
				 
			req.method = 'POST';
			req.url = 'http://testCA.coimapi.net/@api/batch/parallel';
			req.headers['x-deva-token'] = token;
			req.headers['content-type'] = 'application/json';
			req.body = {
				_req: [
					{
						ep: '/testRS/hello'
					},
					{
						ep: '/testRS/hello'
					}
				]
			};
			
			base(req, resMocker, function() {
				var  result = resMocker.getResult().value;
				//console.log( JSON.stringify(result, null, 4) );
				
				assert.equal(result.length, 2, '2 results');
				assert.equal(result[0].value, 'Hello', 'result is hello');
				done();
			});
		});
	});
	
	it('Parallel execution with errors occurred', function(done) {
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
			//console.log('application token is ' + token);
				 
			req.method = 'POST';
			req.url = 'http://testCA.coimapi.net/@api/batch/parallel';
			req.headers['x-deva-token'] = token;
			req.headers['content-type'] = 'application/json';
			req.body = {
				_req: [
					{
						ep: '/testRS/hello'
					},
					{
						ep: '/testRS/unknown'
					}
				]
			};
			
			base(req, resMocker, function() {
				var  result = resMocker.getResult().value;
				//console.log( JSON.stringify(result, null, 4) );
				
				assert.equal(result.length, 2, '2 results');
				assert.equal(result[1].code, errUtil.INVALID_OP, 'the second request is not valid.');
				done();
			});
		});
	});
	
	it('Run without token', function(done) {
		var  req = {
				method: 'POST',
				url: 'http://testCA.coimapi.net/@api/batch/serial',
				headers: {
					host: 'testCA.coimapi.net',
					'content-type': 'application/json',
					'x-deva-appkey': 'e692a81a8026454f9bf108aaab23d20a',
					'x-deva-appsecret': '5678'
				},
				body: {
					_req: [
						{
							ep: '/testRS/hello'
						},
						{
							ep: '/testRS/hello'
						}
					]
				},
				connection: {remoteAddress: '127.0.0.1'}
			 };
			 
		base(req, resMocker, function() {
			var  result = resMocker.getResult().value;
			//console.log( JSON.stringify(result, null, 4) );
			
			assert.equal(result.length, 2, '2 results');
			assert.equal(result[0].value, 'Hello', 'result is hello');
			done();
		});
	});
	
});


describe('Testing error handling', function()  {
	
	it('No app-code', function(done) {
		var  req = {
				method: 'GET',
				url: 'http://127.0.0.1/rs/op',
				headers: {
					host: '127.0.0.1'
				}
			 };
			 
		base(req, resMocker, function() {
			var  result = resMocker.getResult();
			//console.log( JSON.stringify(result, null, 4) );
			assert.equal(result.code, errUtil.NO_APP_REQ, 'No app-code error');
			done();
		});
	});
	
	it('Not valid token', function(done) {
		var  req = {
				method: 'GET',
				url: 'http://testCA.coimapi.net/@abc/rs/op',
				headers: {
					host: 'testCA.coimapi.net',
					'x-deva-token': 'fb2927d828af22f5' + '000000'
				},
				connection: {remoteAddress: '127.0.0.1'}
			 };
			 
		base(req, resMocker, function() {
			var  result = resMocker.getResult();
			//console.log( JSON.stringify(result, null, 4) );
			assert.equal(result.code, errUtil.INVALID_TOKEN, 'Invalid token');
			done();
		});
	});
	
	it('Un-recognized batch command', function(done) {
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
			//console.log('application token is ' + token);
				 
			req.method = 'POST';
			req.url = 'http://testCA.coimapi.net/@api/batch/par';
			req.headers['x-deva-token'] = token;
			req.headers['content-type'] = 'application/json';
			req.body = {
				_req: [
					{
						ep: '/testRS/hello'
					},
					{
						ep: '/testRS/hello'
					}
				]
			};
			
			base(req, resMocker, function() {
				var  result = resMocker.getResult();
				//console.log( JSON.stringify(result, null, 4) );
				
				assert.equal(result.code, errUtil.WRONG_BATCH_OP, 'Invalid batch command');
				done();
			});
		});
	});
	
	it('Op has errors', function(done) {
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
			//console.log('application token is ' + token);
				 
			req.url = 'http://testCA.coimapi.net/testRS/error';
			req.headers['x-deva-token'] = token;
			
			base(req, resMocker, function() {
				var  result = resMocker.getResult();
				//console.log("result is\n%s", JSON.stringify(result, null, 4));
				assert.equal(result.code, errUtil.INTERNAL_ERR, 'internal error');
				done();
			});
		});
	});
});