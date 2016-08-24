var  cnodeConfig = require('./cnodeConfig.json'),
	 apiNode = require('./apiNode.js');

apiNode.init( cnodeConfig );
apiNode.restart();

if (cnodeConfig.certDir)
	// start the SSL version
	apiNode.restart(null, cnodeConfig.certDir);