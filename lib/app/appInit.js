var  soar = require('sql-soar');

exports.config = function(options)  {
	//console.log( JSON.stringify(options, null, 4) );
	soar.config(options.db[0]);
};