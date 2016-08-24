var  path = require('path');

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

(function()  {
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
			fileRoot: '/Users/ben/Documents/projMedia/devapi',
			elasServer: 'http://127.0.0.1:9200'
		 };

	base = require('../cnode.js')(options);
})();


module.exports = {
    'batch serial': batchSerial
}


/**
 * Add tags to a page, view it adn list it to verify. Finally, remove a tag.
 */
function  batchSerial(beforeExit, assert)  {
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

		req.method = 'POST',
		req.headers['x-deva-token'] = token;
		req.headers['content-type'] = 'application/json';
		req.url = 'http://testCA.coimapi.net/@api/batch/serial';
		req.body = {
			_req: [
                {
                    ep: '/@cms/page/view/101',
                    in: {draft: true}
                },
                {
                    ep: '/@cms/page/view/146',
                    in: {draft: true}
                }
            ]
		};

		base(req, resMocker, function() {
			var  result = resMocker.getResult();
			console.log( JSON.stringify(result, null,4) );
			assert.equal(result.code, 0);
            /*
			// page created. Let's delete it.
			var  pageID = result.value.id;
			req.url = 'http://testCA.coimapi.net/@cms/page/view/' + pageID;
			req.body = {draft: true};

			base(req, resMocker, function() {
				var  result = resMocker.getResult();
				console.log( JSON.stringify(result, null,4) );
				assert.equal(result.code, 0);
				assert.equal(result.value.isDraft, 0);

				delete  req.body;

				base(req, resMocker, function() {
					var  result = resMocker.getResult();
					console.log( JSON.stringify(result, null,4) );
					assert.equal(result.code, 0);
					assert.equal(result.value.isDraft, 0);
				});
			});
            */
		});
	});
}