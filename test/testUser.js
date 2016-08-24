/*!
* coimnode
* authors: Ben Lue
* Copyright(c) 2015 Gocharm Inc.
*/
var  assert = require('assert'),
	 path = require('path'),
	 errUtil = require('../lib/util/errUtil.js'),
	 userUtil = require('../lib/app/admin/util/userUtil.js'),
	 soar = require('sql-soar');

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


describe('Testing user related functions', function()  {

	it.skip('Create & delete user', function(done) {
		var  req = {
				method: 'GET',
				url: 'http://testCA.coimapi.net/@admin/@admin/token/request',
				headers: {
					host: 'testCA.coimapi.net',
					'x-deva-appkey': 'e692a81a8026454f9bf108aaab23d20a',
					'x-deva-appsecret': '5678'
				},
				connection: {remoteAddress: '127.0.0.1'}
			 };
			 
		base(req, resMocker, function() {
			var  token = resMocker.getResult().token.token;
			
			req.url = 'http://testCA.coimapi.net/@admin/user/create?accName=abc@foo&passwd=0000&passwd2=0000&fname=John';
			req.headers['x-deva-token'] = token;
			
			base(req, resMocker, function() {
				var  result = resMocker.getResult();
				//console.log( JSON.stringify(result, null, 4) );
				var	 userID = result.value.id,
					 token = result.token.token;
				//console.log( JSON.stringify(result, null, 4) );
					 
				req.url = "http://testCA.coimapi.net/@admin/user/delete/" + userID;
				req.headers['x-deva-token'] = token;
				base(req, resMocker, function() {
					done();
				});
			});
		});
	});
	
	it('Login', function(done) {
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
			var  token = resMocker.getResult().token.token;
			
			req.url = 'http://testCA.coimapi.net/@admin/user/login?accName=testMember&passwd=0000';
			req.headers['x-deva-token'] = token;
			
			base(req, resMocker, function() {
				var  result = resMocker.getResult();
				//console.log( JSON.stringify(result, null, 4) );
				var	 userID = result.value.userID,
					 token = result.token.token;
					 
				assert.equal(userID, 101, 'User id is 101');
				assert(token, 'should return a token');
				done();
			});
		});
	});

	it('User profile -- guest', function(done) {
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
			var  token = resMocker.getResult().token.token;
			
			req.url = 'http://testCA.coimapi.net/@admin/user/profile';
			req.headers['x-deva-token'] = token;
			
			base(req, resMocker, function() {
				var  result = resMocker.getResult();
				//console.log( JSON.stringify(result, null, 4) );
					 
				assert(result.value.isGuest, 'is a guest');
				done();
			});
		});
	});

	it('User profile -- member', function(done) {
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
			var  token = resMocker.getResult().token.token;
			
			req.url = 'http://testCA.coimapi.net/@admin/user/login?accName=testMember&passwd=0000';
			req.headers['x-deva-token'] = token;
			
			base(req, resMocker, function() {
				var  result = resMocker.getResult();
				//console.log( JSON.stringify(result, null, 4) );
				var	 token = result.token.token;
					 
				req.url = 'http://testCA.coimapi.net/@admin/user/profile';
				req.headers['x-deva-token'] = token;
				
				base(req, resMocker, function() {
					var  result = resMocker.getResult();
					assert(!result.value.isGuest, 'not a guest');
					done();
				});
			});
		});
	});
	
	it('Update password', function(done) {
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
			var  token = resMocker.getResult().token.token;
			
			req.url = 'http://testCA.coimapi.net/@admin/user/updatePasswd?oldPasswd=0000&passwd=1234&passwd2=1234';
			req.headers['x-deva-token'] = token;
			
			base(req, resMocker, function() {
				var  result = resMocker.getResult();
				//console.log( JSON.stringify(result, null, 4) );
				assert.equal(result.code, 0, 'Error code should be 0');
				
				req.url = 'http://testCA.coimapi.net/@admin/user/login?accName=testMember&passwd=1234';
				base(req, resMocker, function() {
					var  result = resMocker.getResult();
					assert.equal(result.code, 0, 'Error code should be 0');
					
					var  token = result.token.token;
					//console.log('new token is ' + token);
					req.url = 'http://testCA.coimapi.net/@admin/user/updatePasswd?oldPasswd=1234&passwd=0000&passwd2=0000';
					req.headers['x-deva-token'] = token;
					
					// recover the original password
					base(req, resMocker, function() {
						var  result = resMocker.getResult();
						//console.log( JSON.stringify(result, null, 4) );
						assert.equal(result.code, 0, 'Error code should be 0');
						done();
					});
				});
			});
		});
	});

	it('Logout', function(done) {
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
			var  token = resMocker.getResult().token.token;
			
			req.url = 'http://testCA.coimapi.net/@admin/user/logout';
			req.headers['x-deva-token'] = token;
			
			base(req, resMocker, function() {
				var  result = resMocker.getResult();
				//console.log( JSON.stringify(result, null, 4) );
				assert.equal(result.code, 0, 'Error code should be 0');
				assert.equal(result.token.token.substring(0, 16), '48c28df4417aac58', 'Guest token should be issued.');
				//assert(!result.token, 'Token is nullified');
				done();
			});
		});
	});
	
	it('update role -- failed, try to set role of an user with higher priviledge', function(done) {
		var  req = {
				method: 'GET',
				url: 'http://testCA.coimapi.net/@admin/token/request/110',
				headers: {
					host: 'testCA.coimapi.net',
					'x-deva-appkey': 'e692a81a8026454f9bf108aaab23d20a',
					'x-deva-appsecret': '5678'
				},
				connection: {remoteAddress: '127.0.0.1'}
			 };
			 
		base(req, resMocker, function() {
			var  token = resMocker.getResult().token.token;
			
			req.url = 'http://testCA.coimapi.net/@admin/user/updateRole/100?roleID=6';
			req.headers['x-deva-token'] = token;
			
			base(req, resMocker, function() {
				var  result = resMocker.getResult();
				//console.log( JSON.stringify(result, null, 4) );
				assert.equal(result.code, -20, 'Not allowed');
				done();
			});
		});
	});
	
	it('update role -- failed, try to set a higher role than the user himself', function(done) {
		var  req = {
				method: 'GET',
				url: 'http://testCA.coimapi.net/@admin/token/request/110',
				headers: {
					host: 'testCA.coimapi.net',
					'x-deva-appkey': 'e692a81a8026454f9bf108aaab23d20a',
					'x-deva-appsecret': '5678'
				},
				connection: {remoteAddress: '127.0.0.1'}
			 };
			 
		base(req, resMocker, function() {
			var  token = resMocker.getResult().token.token;
			
			req.url = 'http://testCA.coimapi.net/@admin/user/updateRole/101?roleID=2';
			req.headers['x-deva-token'] = token;
			
			base(req, resMocker, function() {
				var  result = resMocker.getResult();
				//console.log( JSON.stringify(result, null, 4) );
				assert.equal(result.code, 4, 'Not allowed');
				done();
			});
		});
	});
	
	it('update role', function(done) {
		var  req = {
				method: 'GET',
				url: 'http://testCA.coimapi.net/@admin/token/request/110',
				headers: {
					host: 'testCA.coimapi.net',
					'x-deva-appkey': 'e692a81a8026454f9bf108aaab23d20a',
					'x-deva-appsecret': '5678'
				},
				connection: {remoteAddress: '127.0.0.1'}
			 };
			 
		base(req, resMocker, function() {
			var  token = resMocker.getResult().token.token;
			
			req.url = 'http://testCA.coimapi.net/@admin/user/updateRole/101?roleID=5';
			req.headers['x-deva-token'] = token;
			
			base(req, resMocker, function() {
				var  result = resMocker.getResult();
				//console.log( JSON.stringify(result, null, 4) );
				assert.equal(result.code, 0, 'Error code should be 0.');
				
				req.url = 'http://testCA.coimapi.net/@admin/user/updateRole/101?roleID=6';
				base(req, resMocker, function() {
					done();
				});
			});
		});
	});
	
	it('view', function(done) {
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
			var  token = resMocker.getResult().token.token;
			
			req.url = 'http://testCA.coimapi.net/@admin/user/view';
			req.headers['x-deva-token'] = token;
			
			base(req, resMocker, function() {
				var  result = resMocker.getResult();
				//console.log( JSON.stringify(result, null, 4) );
				assert.equal(result.value.lname, 'User', 'last name is User.');
				done();
			});
		});
	});

	it('register', function(done) {
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
			var  token = resMocker.getResult().token.token;
			
			req.url = 'http://testCA.coimapi.net/@admin/user/register?accName=regUser&passwd=1234&dspName=abcd&addr=高雄市復興四路12號';
			req.headers['x-deva-token'] = token;
			
			base(req, resMocker, function() {
				var  result = resMocker.getResult();
				//console.log( JSON.stringify(result, null, 4) );
				
				assert(result.token, "No activation required.");
				var  userID = result.value.id,
					 token = result.token.token;
					 
				req.url = "http://testCA.coimapi.net/@admin/user/view";
				req.headers['x-deva-token'] = token;
				
				base(req, resMocker, function() {
					var  result = resMocker.getResult();
					//console.log( JSON.stringify(result, null, 4) );
					assert.equal(result.code, 0, 'Error occurred.')
					assert.equal(result.value.dspName, 'abcd', "dspName is 'abcd'");
					assert.equal(result.value.addr, '高雄市復興四路12號', "dspName is incorrect");
					
					req.url = 'http://testCA.coimapi.net/@admin/token/request/110';
					delete  req.headers['x-deva-token'];
					
					// request a new token so we can perfom 'delete
					base(req, resMocker, function() {
						var  result = resMocker.getResult();
						//console.log( JSON.stringify(result, null, 4) );
						var  token = result.token.token;
						req.url = "http://testCA.coimapi.net/@admin/user/delete/" + userID;
						req.headers['x-deva-token'] = token;
						
						base(req, resMocker, function() {
							var  result = resMocker.getResult();
							//console.log( JSON.stringify(result, null, 4) );
							done();
						});
					});
				});
			});
		});
	});

	it('reset password', function(done) {
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
			var  token = resMocker.getResult().token.token;
			
			req.url = 'http://testCA.coimapi.net/@admin/user/resetPasswd?accName=storeTester';
			req.headers['x-deva-token'] = token;
			
			base(req, resMocker, function() {
				var  result = resMocker.getResult();
				//console.log( JSON.stringify(result, null, 4) );
				
				var  passwd = userUtil.saltHashPasswd('storeTester', result.value.passwd);
				//console.log('plain text is: ' + result.value.passwd);
				//console.log('salted passwd is ' + passwd);
				req.url = 'http://testCA.coimapi.net/@admin/user/login?accName=storeTester&passwd=' + passwd;
				base(req, resMocker, function() {
					var  result = resMocker.getResult();
					//console.log( JSON.stringify(result, null, 4) );
					
					assert.equal(result.value.userID, 110, 'user ID is 110');
					done();
				});
			});
		});
	});
	
	it('update user', function(done) {
		var  req = {
				method: 'GET',
				url: 'http://testCA.coimapi.net/@admin/token/request/110',
				headers: {
					host: 'testCA.coimapi.net',
					'x-deva-appkey': 'e692a81a8026454f9bf108aaab23d20a',
					'x-deva-appsecret': '5678'
				},
				connection: {remoteAddress: '127.0.0.1'}
			 };
			 
		base(req, resMocker, function() {
			var  token = resMocker.getResult().token.token;
			
			req.url = 'http://testCA.coimapi.net/@admin/user/update?addr=高雄市前鎮區復興四路二號四樓';
			req.headers['x-deva-token'] = token;
			
			base(req, resMocker, function() {
				var  result = resMocker.getResult();
				//console.log( JSON.stringify(result, null, 4) );
				assert.equal(result.code, 0, 'Error occurred.');
				
				req.url = 'http://testCA.coimapi.net/@admin/user/view';
				base(req, resMocker, function() {
					var  result = resMocker.getResult().value;
					//console.log( JSON.stringify(result, null, 4) );
					assert.equal( result.addr, '高雄市前鎮區復興四路二號四樓', 'Address is wrong.');
					
					req.url = 'http://testCA.coimapi.net/@admin/user/update?addr=高雄市前鎮區復興四路八號八樓';
					base(req, resMocker, function() {
						var  result = resMocker.getResult();
						//console.log( JSON.stringify(result, null, 4) );
						assert.equal(result.code, 0, 'Error occurred.');
						done();
					});
				});
			});
		});
	});
	
	it('update user -- same location, different address', function(done) {
		var  req = {
				method: 'GET',
				url: 'http://testCA.coimapi.net/@admin/token/request/110',
				headers: {
					host: 'testCA.coimapi.net',
					'x-deva-appkey': 'e692a81a8026454f9bf108aaab23d20a',
					'x-deva-appsecret': '5678'
				},
				connection: {remoteAddress: '127.0.0.1'}
			 };
			 
		base(req, resMocker, function() {
			var  token = resMocker.getResult().token.token;
			
			req.url = 'http://testCA.coimapi.net/@admin/user/update?addr=高雄市復興四路八號八樓';
			req.headers['x-deva-token'] = token;
			
			base(req, resMocker, function() {
				var  result = resMocker.getResult();
				//console.log( JSON.stringify(result, null, 4) );
				assert.equal(result.code, 0, 'Error occurred.');
				
				req.url = 'http://testCA.coimapi.net/@admin/user/view';
				base(req, resMocker, function() {
					var  result = resMocker.getResult().value;
					assert.equal( result.addr, '高雄市復興四路八號八樓', 'Address is wrong.');
					
					req.url = 'http://testCA.coimapi.net/@admin/user/update?addr=高雄市前鎮區復興四路八號八樓';
					base(req, resMocker, function() {
						var  result = resMocker.getResult();
						//console.log( JSON.stringify(result, null, 4) );
						assert.equal(result.code, 0, 'Error occurred.');
						done();
					});
				});
			});
		});
	});
	
	it('Is accName available', function(done) {
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
			var  token = resMocker.getResult().token.token;
			
			req.url = 'http://testCA.coimapi.net/@admin/user/accNameOk?accName=testMember';
			req.headers['x-deva-token'] = token;
			
			base(req, resMocker, function() {
				var  result = resMocker.getResult().value;
				//console.log( JSON.stringify(result, null, 4) );
					 
				assert.equal(result.isOk, false, 'account name not available.');
				
				req.url = 'http://testCA.coimapi.net/@admin/user/accNameOk?accName=xxxxyy';
				req.headers['x-deva-token'] = token;
				
				base(req, resMocker, function() {
					var  result = resMocker.getResult().value;
					//console.log( JSON.stringify(result, null, 4) );
						 
					assert.equal(result.isOk, true, 'xxxyy is available.');
					done();
				});
			});
		});
	});

});