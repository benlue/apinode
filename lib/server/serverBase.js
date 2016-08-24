/*!
* cnode
* authors: Ben Lue
* Copyright(c) 2015 Gocharm Inc.
*/
var  admin = require('../base/adminOffice.js'),
	 async = require('async'),
	 crypto = require('crypto'),
	 dd = require('./pp/DeviceDetector.js'),
	 errUtil = require('../util/errUtil.js'),
	 logUtil = require('../util/logUtil.js'),
	 fs = require('fs'),
	 operators = require('../base/operators.js'),
	 path = require('path'),
	 Promise = require('bluebird'),
	 soar = require('sql-soar'),
	 tokenUtil = require('../util/tokenUtil.js'),
	 url = require('url');

var  TOKEN_LENGTH = 48,
	 GUEST_USER_ID = 20;
	 
var  _tsWindow = 60 * 24 * 60 * 60 * 1000;

// service point injection
var  reqCanUseApp,
	 reqCanUseDS;

module.exports = function(options) {
	options.appPath = options.appPath || path.join(__dirname, '../app/');
	
	soar.config( options.db || options );
	operators.config(options);

	// inject plugin functions
	reqCanUseApp = options.canUseAppSP || canUseApp;
	reqCanUseDS = options.canUseDsSP || canUseDS;
	
	var  base = function(req, res, next)  {
		getAppInfo(req)
		.then(function(caData) {
			if (caData.extURL)
				forwardRequest(caData, req, res, next);
			else
				handleRequest(caData, req, res, next);
		})
		.catch(function(err) {
			console.log(JSON.stringify(err, null, 4));
			answerReq( null, res, next, err );
		});
	};

	return  base;
};


function  forwardRequest(caData, req, res, next)  {
	// TODO: don't know what to do yet
	next();
};


function  handleRequest(caData, req, res, next)  {
	try  {
		var  appCode = caData.caCode,
			 rt = buildRT(appCode, req);
		rt.app = caData;
		
		if (rt.ep.app === 'api')  {
			if (rt.ep.rs === 'batch')
				batchRequest(rt, caData, res, next);
			else
				operators.getAPIDoc( rt.ep, function(result)  {
					answerReq( rt, res, next, result );
				});
		}
		else  {
			validateToken(caData, rt)
			.then(function(uPro) {
				rt.uPro = uPro;
				return  singleRequest(rt, caData);
			})
			.then(function(result) {
				doResponse( rt, res, next, result );
			})
			.catch(function(err) {
				//console.log('error is\n%s', JSON.stringify(err, null, 4));
				answerReq( rt, res, next, err );
			});
		}
	}
	catch (err)  {
		if (err.stack)  {
			console.log( err.stack );
			err = errUtil.err( errUtil.INTERNAL_ERR );
		}
		answerReq( rt, res, next, err );
	}
};


/**
 * Handle a single request.
 */
function  singleRequest(rt, caData)  {
	//rt.app = caData;
	
	return  reqCanUseApp(caData, rt.ep)
	.then(function(isOk) {
		if (isOk)
			return  reqCanUseDS(caData, rt.ep);
			
		throw  errUtil.err( errUtil.NO_PERMISSION );
	})
	.then(function(isOk)  {
		if (isOk)
			return invokeService(rt);
			
		throw  errUtil.err( errUtil.NO_PERMISSION );
	});
};


/**
 * We'll allow apps to leverage functions of other apps, and this is how it can be done.
 */
function  internalRequest(rt, endpoint, inData, cb)  {
	if (arguments.length === 3)  {
		cb = inData;
		inData = {};
	}
	
	if (endpoint.indexOf('@') === -1)
		endpoint = '/@' + endpoint;
	else
		endpoint = '/' + endpoint;
		
	var  ep = parseEndpoint( rt.app.caCode, endpoint ),
		 caData = rt.app;
	ep.caID = caData.CApp_id;
	//console.log('roleID: ' + rt.uPro.roleID);
	//console.log('endpoint spec: ' + endpoint);
	//console.log("forward to endpoint:\n%s", JSON.stringify(ep, null, 4));
	
	var  nrt = {
			req: rt.req,
			remoteAddr: rt.remoteAddr,
			app: caData,
			ep: ep,
			uPro: rt.uPro,
			inData: inData || {},
			forward: internalRequest,
            returnError: returnErrorMessage
		 };
	
	reqCanUseApp(caData, ep)
	.then(function(isOk) {
		if (isOk)
			return  reqCanUseDS(caData, ep);
			
		throw  errUtil.err( errUtil.NO_PERMISSION );
	})
	.then(function(isOk) {
		if (isOk)  { 
			if (ep.app === 'admin' && ep.rs === 'token' && ep.op === 'request')  {
				// a special case of token request?
				nrt.req.headers['x-deva-appkey'] = rt.app.appKey;
				nrt.req.headers['x-deva-appsecret'] = rt.app.appSecret;
			}
			return  nrt;
		}
		
		throw  errUtil.err( errUtil.NO_PERMISSION );
	}).
	then(function(nrt)  {
		return  checkPermission(nrt);
	})
	.then(function(opData) {
		return  route(nrt, opData);
	})
	.then(function(result) {
		if (result.code)
			// in this case, the execution is not successful. Treat the result as errors.
			cb( result );
		else
			cb( null, result );
	})
	.catch(function(err) {
		if (err.stack)
			console.log( err.stack );
		//console.log( JSON.stringify(err, null, 4) );
		if (err.code)
			cb(err);
		else
			cb( null, err );
	});
}


/**
 * This function can be used to read the error message of endpoint based on the given locale
 */
function  returnErrorMessage(errCode, cb)  {
    var  ep = this.ep,
         locale = this.req.headers['x-deva-locale'] || 'en';
         
    operators.getErrorMessage( ep, function(err, errObj) {
        var message;
        
        if (errObj)  {
            //var  msgObj = errObj[String.valueOf(errCode)];
            var  msgObj = errObj[errCode + ''];
            if (msgObj)
                message = msgObj[locale] || msgObj['en'];
        }
        
        cb( {code: errCode, message: message || ''} );
    });
}


function  getAppInfo(req)  {
	var  appCode = req.headers.host.split('.')[0];
	if (!isNaN(appCode))
		appCode = req.headers['x-deva-appcode'];
		
	return  new Promise(function(resolve, reject) {
		if (!appCode)
			return  reject( errUtil.err(errUtil.NO_APP_REQ) );
			
		admin.getCA(appCode, function(err, caData) {
			if (err)
				return  reject(err);
			
			//console.log('app data is\n%s', JSON.stringify(caData, null, 4));
			resolve( caData );
		});
	});
};


function  batchRequest(rt, caData, res, next)  {
	validateToken(caData, rt)
	.then(function(uPro) {
		rt.uPro = uPro;
		
		var  inData = rt.inData,
			 op = rt.ep.op,
			 appCode = caData.caCode;
			 
		if (inData._req)  {
			if (op === 'serial')  {
				//console.log('Serial uPro:\n%s', JSON.stringify(rt.uPro, null, 4));
				var  resultList = [];
				
				async.eachSeries( inData._req, function(req, cb) {
					// some op may add something to inData, so we have to clone inData
                    var  eachInData = cloneObj( req.in ),
                         eachUPro = cloneObj( uPro );
                        
					var  nrt = {req: rt.req, inData: eachInData, ep: parseEndpoint(appCode, req.ep),
							    uPro: eachUPro, remoteAddr: rt.remoteAddr,
                                forward: internalRequest,
                                returnError: returnErrorMessage,
								app: caData};
							 
					singleRequest(nrt, caData).then(function(result) {
						resultList.push( result );
						cb();
					}).catch(cb);
				}, function(err) {
					var  result;

					if (err)  {
						resultList.push( err );
						result = {code: errUtil.BATCH_SERIAL_FAIL, message: 'Serial batch failed.', value: resultList};
					}
					else
						result = {code: 0, message: 'Ok', value: resultList };
					answerReq( null, res, next, result );
				});
			}
			else  if (op === 'parallel')  {
				var  rtnList = new Array( inData._req.length ),
					 //rtList = new Array( inData._req.length ),
					 errFlag = false;

				// if errors occurred, Promise cannot return every result of each request. So use 'async' instead
				async.forEachOf(inData._req, function(req, idx, cb) {
                    // some op may add something to inData, so we have to clone inData
                    var  eachInData = cloneObj( req.in ),
                         eachUPro = cloneObj( uPro );
                        
					var  nrt = {req: rt.req, inData: eachInData, ep: parseEndpoint(appCode, req.ep),
							    uPro: eachUPro, forward: internalRequest, remoteAddr: rt.remoteAddr,
                                returnError: returnErrorMessage,
								app: caData};
					//rtList[idx] = nrt;
							 
					singleRequest(nrt, caData)
					.then(function(result) {
						rtnList[idx] = result;
					})
					.catch(function(err) {
						errFlag = true;
						rtnList[idx] = err;
					})
					.finally(function() {
						//logBatch( rtList, rtnList );
						cb();
					});
				},
				function(err) {
					if (errFlag)  {
						var  rtnObj = errUtil.err( errUtil.SOME_BATCH_ERR );
						rtnObj.value = rtnList;
						answerReq( rt, res, next, rtnObj );
					}
					else
						answerReq( rt, res, next, {code: 0, message: 'Ok', value: rtnList} );
				});
			}
			else
				answerReq( rt, res, next, errUtil.err( errUtil.WRONG_BATCH_OP ) );
		}
		else
			answerReq( rt, res, next, errUtil.err(errUtil.WRONG_PARAM) );
	})
	.catch(function(err) {
		answerReq( rt, res, next, err );
	});
};


function  cloneObj(obj)  {
    var  nobj = {};
    for (var k in obj)
        nobj[k] = obj[k];
    return  nobj;
}


/**
 * Check if the calling app can use the functional module.
 */
function  canUseApp(caData, ep)  {
	var  caID = caData.CApp_id;
	
	return  new Promise(function(resolve, reject) {
		if (caData.caCode === ep.app)  {
			ep.caID = caData.CApp_id;
			resolve(true);
		}
		else  {
			admin.canUseApp(caID, ep.app)
			.then(function(useData)  {
				if (useData)  {
					ep.caID = useData.UseCApp_id;
					return  resolve(true);
				}
				resolve(false);
			});
		}
	});
};


/**
 * Check if the calling app can use the data source.
 */
function  canUseDS(caData, ep)  {
	var  caID = caData.CApp_id;
	
	return  new Promise(function(resolve, reject) {
		if (caData.caCode === ep.ds)  {
			ep.ds = {
				ds: ep.ds,
				dsID: caID,
				readable: true,
				writable: true
			};
			resolve(true);
		}
		else  {
			admin.canUseApp(caID, ep.ds)
			.then(function(useData)  {
				if (useData)  {
					ep.ds = {
						ds: ep.ds,
						dsID: useData.UseCApp_id,
						readable: useData.readable,
						writeable: useData.writable
					};
					resolve(true);
				}
				else
					resolve(false);
			});
		}
	});
};


/**
 * parse the client request and return a "request-terms" object with the following properties:
 * .appCode: app-code of the request
 * .ep: the parsed endpoint into components
 * .inData: input data of the request
 * .req: the original client request
 * .remoteAddr: where is the request from (IP address or device ID of mobile devices)
 */
function  buildRT(appCode, req)  {
	var  uri = req.url,
		 psURI = url.parse(uri, true),
		 rt = {req: req, forward: internalRequest, returnError: returnErrorMessage};
		
	rt.ep = parseEndpoint(appCode, psURI.pathname);
	//console.log('endpoint is\n%s', JSON.stringify(rt.ep, null, 4));

	if (req.method === 'GET')
		rt.inData = psURI.query;

	else  if (req.method === 'POST')  {
		var  contentType = req.headers['content-type'],
			 inData;
			 
		// checking  || psURI.query.state is to get around service relay from some 3rd party API services such as 永豐金
		if (contentType === 'application/json' || psURI.query.state)  {
			if (psURI.query)  {
				inData = {};
				for (var k in psURI.query)
					inData[k] = psURI.query[k];
				for (var k in req.body)
					inData[k] = req.body[k];
			}
			else
				inData = req.body;
				
			rt.inData = inData;
		}
		else  if (contentType.substring(0, 19) === 'multipart/form-data')  {
			inData = req.body;
			inData.files = req.files;
			rt.inData = inData;
		}
		else
			throw  errUtil.err(errUtil.WRONG_REQ_CTYPE);
	}
	
	// one more thing: where is the request from
	rt.remoteAddr = req.headers['x-deva-clientkey'];
	if (!rt.remoteAddr)  {
		rt.remoteAddr = req.connection.remoteAddress;
		var  idx = rt.remoteAddr.lastIndexOf(':');
		if (idx > 0)
			rt.remoteAddr = rt.remoteAddr.substring(idx+1);
	}
	
	return  rt;
};


function  parseEndpoint(appCode, endp)  {
	var  parts = endp.split('/'),
		 endpoint;
		 
	if (parts.length < 3)
		throw  errUtil.err( errUtil.INVALID_EP );
		
	var  idx = parts[1].indexOf('@');
	if (idx >= 0)  {
		if (parts.length < 4)
			throw  errUtil.err( errUtil.INVALID_EP );
		
		endpoint = {
			ds: idx === 0  ? appCode: parts[1].substring(0, idx),
			app: parts[1].substring(idx+1),
			rs: parts[2],
			op: parts[3],
			id: parts.length > 4  ?  parts[4] : null
		};
	}
	else
		endpoint = {
			ds: appCode,
			app: appCode,
			rs: parts[1],
			op: parts[2],
			id: parts.length > 3  ?  parts[3] : null
		};
		
	idx = endpoint.op.indexOf('.');
	if (idx > 0)  {
		endpoint.postFix = endpoint.op.substring(idx+1);
		endpoint.op = endpoint.op.substring(0, idx);
	}
		
	//console.log('endpoint is\n%s', JSON.stringify(endpoint, null, 4));
	return  endpoint;
};


/**
 * validate access tokens. The token could be in user scope or application scope.
 * If the token is valid, uPro is generated with userID and grpID in it.
 */
function  validateToken(caData, rt)  {
	return  new Promise(function(resolve, reject) {
		var  ep = rt.ep;
		
		if (ep.rs === 'token' && ep.app === 'admin')
			// automatic pass of @admin/token/...
			resolve( {userID: GUEST_USER_ID} );
		else  {
			var  inData = rt.inData;
			
			if (inData.state)  {
				// "state" is used as the anti-csrf token
				var  stateStr = inData.state,
					 idx = stateStr.indexOf('http', 32);	// 32 is the default appKey length
				
				if (stateStr.substring(0, 2) === '__' && idx > 0)  {
					// when talking to FB, we'll embed the appKey and login done page in the 'state' variable
					var  appKey  = stateStr.substring(2, idx);
					if (appKey === caData.appKey)  {
						inData.nextPage = stateStr.substring(idx);
						return  resolve( {userID: GUEST_USER_ID} );
					}
				} 
			}
			
			// when dealing with FB login, we have to accept token as part of the URL
			var  token = rt.req.headers['x-deva-token'] || rt.inData._tkn;
			if (token)  {
				if (token.length < TOKEN_LENGTH)
					return  reject( errUtil.err(errUtil.INVALID_TOKEN) );

				tokenUtil.validateToken(caData, token, function(err, uPro) {
					if (err)
						return  reject( err );
						
					uPro.token = token;
					resolve( uPro );
				});
			}
			else  {
				var  appKey = rt.req.headers['x-deva-appkey'],
		 			 appSecret = rt.req.headers['x-deva-appsecret'];
				//console.log('input appKey: %s, appSecret: %s', appKey, appSecret);
				//console.log('app appKey: %s, appSecret: %s', caData.appKey, caData.appSecret);
					  
				if (caData.appKey === appKey)  {
					var  uPro = {userID: GUEST_USER_ID};
					resolve( uPro ); 
				}
		 		/*
				if (caData.appKey === appKey && (!appSecret || caData.appSecret === appSecret))  {
					var  uPro = {userID: GUEST_USER_ID};
					resolve( uPro );
				}
				*/
				else
					reject( errUtil.err(errUtil.NO_TOKEN) );
			}
		}
	});
};


function  invokeService(rt)  {
	var  uPro = rt.uPro;
	
	return  new Promise(function(resolve, reject) {
		//console.log('invoke service, uPro is\n%s', JSON.stringify(uPro, null, 4));
		admin.updateUPro(uPro, function(err)  {
			if (err)
				return  reject(errUtil.err( errUtil.DB_ERR ));
	
			//console.log('user profile is:\n%s', JSON.stringify(uPro, null, 4));
			checkPermission(rt)
			.then(function(opData) {
				return  route(rt, opData);
			})
			.then(function(result) {
				//return  cb(null, result);
				resolve( result );
			})
			.catch(function(err) {
				if (err.stack)  {
					console.log( err.stack );
					err = errUtil.err( errUtil.INTERNAL_ERR );
				}
				
				reject(err);
			});
		});
	});
};


function  doResponse(rt, res, next, result)  {
	if (result.send)  {
		res.writeHead(200, {'Content-Type': result.send.mimeType});
		//res.setHeader('content-type', result.send.mimeType);
		
		if (result.send.file)
			fs.createReadStream(result.send.file).pipe(res);
		else
			// respond with a stream
			result.send.stream.pipe( res );

		next();
	}
	else
		answerReq( rt, res, next, result );
};


function  checkPermission(rt)  {
	return  Promise.resolve(true);
	/*
	return  new Promise(function(resolve, reject) {
		var  caID = rt.ep.caID,
			 uPro = rt.uPro;
		//console.log('check permission: caID is ' + caID);
		//console.log('uPro is\n%s', JSON.stringify(uPro, null, 4));
		
		async.waterfall([
			function  getRS(cb)  {
				admin.getRS(caID, rt.ep.rs, function(err, rsData) {
					if (err)
						return  cb( errUtil.err(errUtil.DB_ERROR) );
						
					if (rsData)  {
						if (rsData.isPublic || !uPro.isGuest)
							cb(null, rsData);
						else
							cb( errUtil.err(errUtil.NO_PERMISSION) );
					}
					else
						cb( errUtil.err(errUtil.INVALID_RS) );
				});
			},
			function  getOP(rsData, cb)  {
				admin.getOP(rsData.Resource_id, rt.ep.op, function(err, opData) {
					if (err)
						return  cb( errUtil.err(errUtil.DB_ERROR) );
						
					if (opData)
						cb(null, opData);
					else
						cb( errUtil.err(errUtil.INVALID_OP) );
				});
			},
			function  getOpAcc(opData, cb)  {
				//console.log('get op access...roleID: ' + uPro.roleID);
				admin.getOpAcc(opData.RsOp_id, uPro.roleID, function(err, opAcc)  {
					if (err)
						return  cb( errUtil.err(errUtil.DB_ERROR) );
						
					if (opAcc && opAcc.ok)  {
						cb(null, opData);
					}
					else  {
						cb( errUtil.err(errUtil.NO_PERMISSION) );
					}
				});
			}
		],
		function(err, opData) {
			if (err)
				reject(err);
			else
				resolve(opData);
		});
	});
	*/
};


function  route(rt, opData)  {
	return  new Promise(function(resolve, reject) {
		var  op = operators.getOperator(rt.ep);
		
		if (op)  {
			async.waterfall([
				function  checkParam(cb)  {
					if (op.checkArguments)  {
						op.checkArguments(rt, function(err, isOk)  {
							if (err || !isOk)
								cb( err  ?  err : errUtil.err(errUtil.WRONG_PARAM) );
							else
								cb();
						});
					}
					else
						cb();
				},
				function  checkPermit(cb)  {
					if (op.checkPermission)  {
						op.checkPermission(rt, function(err, isOk) {
							if (err || !isOk)
								cb( err  ?  err : errUtil.err(errUtil.NO_PERMISSION) );
							else
								cb();
						});
					}
					else
						cb();
				},
				function  run(cb)  {
					try  {
						op.run(rt, cb);
					}
					catch (err)  {
						//console.log('operator error');
						if (err.stack)
							console.log( err.stack );
						cb( errUtil.err(errUtil.INTERNAL_ERR) );
					}
				}
			],
			function(err, result) {
				if (err)
					reject(err);
				else
					resolve( result );
			});
		}
		else
			reject( errUtil.err(errUtil.UNDEFINED_OP) );
	});
};


/**
 * An helper function to answer requests
 */
function  answerReq(rt, res, next, result)  {
	//res.setHeader('Content-Type', 'application/json');
	res.setHeader('Access-Control-Allow-Origin', '*');
	//res.setHeader('Access-Control-Allow-Headers', 'origin, X-Requested-With, content-type, accept');
	res.setHeader('Access-Control-Allow-Headers', '*');
	res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
	
	// the codes below are mostly useful for url redirect
	var  moveOn = true;
	if (result._httpCode)  {
		if (result._httpHeaders)
			res.writeHead( result._httpCode, result._httpHeaders );
		else
			res.writeHead( result._httpCode );

		if (!result._data)  {
			moveOn = false;
			res.end();
		}
	}
	
	if (moveOn)  {
		var  postFix = rt  ?  rt.ep.postFix : undefined;
		if (postFix === 'txt') {
			res.setHeader('content-type', 'text/plain');
			res.end(result.value);
		}
		else {
			res.setHeader('content-type', 'application/json');
			res.end( JSON.stringify(result) );
		}
		
		// do loggin
		if (rt)  {
			// we don't log /api/batch...
			var  ep = rt.ep;
			if (ep.app != 'api')
				logging(rt, result);
		}
	}
	
	next();
};


/**
 * Log each request
 */
function  logging(rt, result)  {
	var  uPro = rt.uPro,
		 ep = rt.ep,
		 endpoint = ep.app + '/' + ep.rs + "/" + ep.op;
		 
	if (ep.id)
		endpoint += "/" + ep.id;
		 
	var  userAgent = rt.req  ?  (rt.req.headers['user-agent'] || '') : '',
		 clientType = userAgent.length > 16  ?  "mobile" : dd.detect(userAgent).category,
		 logData = {
			caID: rt.app.CApp_id,
			dsID: rt.ep.ds.dsID,
			ep : endpoint,
			app: ep.app,
			rs: ep.rs,
			op: ep.op,
			id: ep.id,
			c_ip: rt.remoteAddr,
			c_type: clientType,
			c_agent: userAgent,
			time: new Date()
		 };
		 
	if (uPro)  {
		logData.userID = uPro.userID;
		logData.isGuest = uPro.isGuest;
		logData.token = uPro.token;
	}
	else  {
		logData.userID = GUEST_USER_ID;
		logData.isGuest = true;
		logData.token = '';
	}
	
	//console.log('user agent: ' + userAgent);
	//console.log('client type: ' + JSON.stringify(logData.c_type, null, 4));
	logData.code = result  ?  result.code : errUtil.INVALID_EP;
	logUtil.log( logData );
	//console.log('[%d/%d] %s  %d %s', logData.userID, logData.caID, logData.ep, logData.code, logData.time);
};


/*
function  logBatch(rtList, resultList)  {
	for (var i = 0, len = rtList.length; i < len; i++)
		logging(rtList[i], resultList[i]);
};
*/