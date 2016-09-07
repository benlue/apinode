/*!
* apinode
* authors: Ben Lue
* Copyright(c) 2015~2016 Gocharm Inc.
*/
var  bodyParser = require('body-parser'),
	 connect = require('connect'),
     http = require('http'),
	 https = require('https'),
	 path = require('path'),
	 fs = require('fs'),
	 cnodeConfig = require('./cnodeConfig.json'),
	 cors = require('./lib/server/cors.js');
     
var  uploadPath,
     serverShell;

exports.init = function(config)  {
    // upload files will be saved here before any further processing
    uploadPath = path.join( config.fileRoot, './temp' );

    // make http maxSockets a reasonable number
    var  maxSockets = config.maxSockets || 2000;
    http.globalAgent.maxSockets = maxSockets;

    // init serverShell...
    serverShell = require('./lib/server/serverShell.js')(config);
};


exports.restart = function(port, certPath)  {
    var  app = connect()
			.use(require('morgan')('dev'))
			.use(bodyParser.urlencoded({extended: true}))
			.use(require('connect-multiparty')({uploadDir: uploadPath}))
			.use(bodyParser.json())
			.use(cors())
			.use(serverShell);

    if (certPath)  {
        // dealing with SSL certificates...
        if (certPath.charAt(0) !== '/' && certPath.charAt(1) !== ':')
            certPath = path.join(___dirname, certPath);

        var  certFiles = [
                path.join(certPath, './primary_inter.cer'),
                path.join(certPath, './secondary_inter.cer')
            ];
            
        var  ca = (function() {
            var _i, _len, _results;
            
            _results = [];
            for (_i = 0, _len = certFiles.length; _i < _len; _i++) {
                file = certFiles[_i];
                _results.push(fs.readFileSync( file ));
            }
            return _results;
        })();

        var  options = {
            ca: ca,
            key: fs.readFileSync( path.join(certPath, './coimapi.tw.key') ),
            cert: fs.readFileSync( path.join(certPath, './coimapi_tw.cer') )
        };

        https.createServer(options, app).listen(port || 3443);
    }
    else
        http.createServer(app).listen(port || 4000);
};