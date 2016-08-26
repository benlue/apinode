/*!
* cnode
* authors: Ben Lue
* Copyright(c) 2015 Gocharm Inc.
*/
var  fs = require('fs'),
	 path = require('path');

var  _appPath,
	 _opPool = {};

exports.config = function(option)  {
	_appPath = option.appPath;
	if (_appPath)  {
		if (_appPath.charAt(0) === '.')
			_appPath = path.join(__dirname, _appPath);

		try  {
			var  appInit = require(path.join(_appPath, 'appInit.js'));
			appInit.config(option);
		}
		catch (e)  {
			console.log( e.stack );
		}
	}
	else
		_appPath = path.join(__dirname, '../app/');
	
	var  dirList = fs.readdirSync(_appPath);
	for (var i in dirList)  {
		var  fname = path.join(_appPath, dirList[i] + '/' + dirList[i] + 'App.js');
		
		try  {
			if (fs.existsSync(fname))  {
				var  initApp = require(fname);
			 
				if (initApp)
					initApp.init(option);
			}
		}
		catch (err)  {
			console.log( err.stack );
		}
	}
};


exports.getOperator = function(ep)  {
	var  key = ep.app + '.' + ep.rs + '.' + ep.op,
		 opMod = _opPool[key];
		 
	if (opMod === undefined)  {
		var  modPath = ep.app + '/' + ep.rs + '/' + ep.op + 'Op.js',
			 opPath;
		
		if (ep.app === 'admin' || ep.app === 'geo')
			opPath = path.join(__dirname, '../app/' + modPath);
		else
			opPath = path.join(_appPath, modPath);
		//console.log('op path is ' + opPath);
		
		try  {
			if (fs.existsSync(opPath))
				opMod = require( opPath );
		}
		catch (err)  {
			console.log( err.stack );
			opMod = null;
		}
		_opPool[key] = opMod;
	}
	
	return  opMod;
};


exports.getAPIDoc = function(ep, cb)  {
	if (!ep.id)
		return  cb( {code: 1, message: 'The given endpoint is not complete.'});
		
	var  opPath = ep.rs + '/' + ep.op + '/' + ep.id + '.json',
		 docPath;
	
	if (ep.rs === 'admin' || ep.app === 'geo')
		docPath = path.join(__dirname, '../app/_api/' + opPath);
	else
		docPath = path.join(_appPath, './_api/' + opPath);
		
	fs.exists(docPath, function(exists) {
		if (exists)  {
			fs.readFile(docPath, {encoding: 'utf8'}, function(err, data)  {
				if (err)
					cb( {code: 2, message: 'No such API'});
				else
					try  {
						var  api = JSON.parse(data);
						cb( {code: 0, message: 'Ok', value: api} );
					}
					catch (err)  {
						console.log( err.stack );
						cb( {code: -100, message: 'Internal error.'} );
					}
			});
		}
		else
			cb( {code: 2, message: 'No such API'});
	});
}

exports.getAPIList = function(cb)  {

	var docPath = path.join(_appPath, './_api/apiTree.json');

	fs.exists(docPath, function(exists) {
		if (exists)  {
			fs.readFile(docPath, {encoding: 'utf8'}, function(err, data)  {
				if (err)
					cb( {code: 2, message: 'Cannot find apiTree.json'});
				else
					try  {
						var  api = JSON.parse(data);
						cb( {code: 0, message: 'Ok', value: api} );
					}
					catch (err)  {
						console.log( err.stack );
						cb( {code: -100, message: 'Internal error.'} );
					}
			});
		}
		else
			cb( {code: 2, message: 'Cannot find apiTree.json'});
	});


}

exports.getErrorMessage = function(ep, cb)  {
    var  docPath = '_api/' + ep.app + '/' + ep.rs + '/' + ep.op + '.json';
    
    if (ep.app === 'admin' || ep.app === 'geo')
        docPath = path.join(__dirname, '../app/' + docPath);
    else
        docPath = path.join(_appPath, docPath);
    //console.log('doc path is: ' + docPath);
        
    fs.readFile(docPath, 'utf8', function(err, data) {
        if (err)
            cb(err);
        else  {
            //console.log( data );
            var  doc = JSON.parse( data );
            cb( null, doc.error );
        }
    });
}