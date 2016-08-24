var  path = require('path'),
     cnodeConfig = require('./cnodeConfig.json'),
	 apiNode = require('./apiNode.js');

// first start the api-server...
apiNode.init( cnodeConfig );
apiNode.restart();

var  serverConfig = {
        "apiEngine": {
            "host": "coimapi.tw",
            "port": 80,
            "method": "POST"
        },
        "server": {
            "wwwPath": path.join(__dirname, './www'),
            "port": 8080, //process.env.PORT,
            "maxSockets": 200
        }
     },
     coServ = require('coserv');

// start the web server...
coServ.init(serverConfig);
coServ.restart();