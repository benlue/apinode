/*!
* cnode
* authors: yuting
* Copyright(c) 2016 Conwell Inc.
* 驗證是否為第三方 App 的會員帳號。只有第三方App才能使用此功能。***此API為內部使用，不公開。***
* 
第三方應用應提供一API做為一次性密鑰(secret)的驗證。
第三方應用將會員導至xxx.ezReceipt.cc/extLogin，並傳送會員帳號(accName)與一次性密鑰(secret)，密鑰長度為32。
	1. 由 coserv 呼叫 admin/user/verifyExt?accName=X&secret=mmm
		a. coimotoin 記錄與檢查 accName 與 secret， 若發現 secret 相同或是帳號不存在，則直接返回錯誤。
		b. coimotoin 呼叫 第三方應用API，傳送 secret，第三方則回傳對應的帳號(accName)。若是帳號不同，則返回錯誤。
	2. coserv 收到第一步回傳結果，若正確則直接登入。若錯誤則顯示錯誤畫面。
*/

var  soar = require('sql-soar');
var  async = require('async');
var  request = require('request');
var  tokenUtil = require('../../../util/tokenUtil.js');
var  userUtil = require('../util/userUtil.js');

var  _tsWindow = 60 * 24 * 60 * 60 * 1000;
var  KEY_LEN = 32; //secret 固定長度

var  accExpr = soar.sql('GrpUser gu')
				   .join({
					   table: "Person psn",
					   onWhat: "gu.Person_id=psn.Person_id"
				   })
				   .column(['GrpUser_id', 'dspName', 'passwd'])
				   .filter({
					   op: 'and',
					   filters: [
						   {name: 'UGroup_id', op: '='},
						   {name: 'accName', op: '='},
						   {name: 'isValid', op: '='}
					   ]
				   });

var  tknExpr = soar.sql('UserToken')
				   .filter({
					   op: 'and',
					   filters: [
						   {name: 'caID', op: '='},
						   {name: 'GrpUser_id', op: '='},
						   {name: 'devID', op: '='},
						   {name: 'tknExpire', op: '>='},
						   {name: 'isVapor', op: '='}
					   ]
				   });

var  esExpr = soar.sql('ExtSecret');

var  qAccCmd = { op: 'query', expr: accExpr };
var  qEsCmd = { op: 'query', expr: esExpr };
var  iEsCmd = { op: 'insert', expr: esExpr };
var  uEsCmd = { op: 'update', expr: esExpr };

var  iTknCmd = {op: 'insert', expr: tknExpr};
var  qTknCmd = {op: 'query', expr: tknExpr};

exports.checkArguments = function(rt, cb)  {
	var  inData = rt.inData;
	if (!inData.accName)
        return  cb( {code: 11, message: 'The **accName** parameter is missing or not valid.'});
    if (!inData.secret || inData.secret.length != KEY_LEN)
        return  cb( {code: 12, message: 'The **secret** parameter is missing or not valid.'});
		
	cb( null, inData.url );
}

exports.checkPermission = function(rt, cb)  {
	if (!rt.app.isExt)
		return  cb(null, false); //限定第三方 app 才可使用

	var  query = { 
			UGroup_id: rt.app.UGroup_id, 
			accName: rt.inData.accName,
			isValid: true
		};
	soar.execute( qAccCmd, query, function(err, usrData) {
		if (err) {
			console.log(err.stack);
			return  cb( internErr() );
		}

		rt.usrData = usrData;
		cb(null, true);
	});
}

exports.run = function(rt, cb) {
	var  inData = rt.inData,
		 usrData = rt.usrData;

	if (!usrData || usrData.passwd) //有密碼的話會是管理帳號
		return  cb( {code:0, message:'OK', value: {isValid: 0}} );
	delete usrData.passwd;

	var  caID = rt.app.CApp_id;
	
	async.waterfall([
		function checkSecret(cb) { //檢查 secret 是否與上次的相同
			var  query = {
					accName: inData.accName,
					caID: caID
				};
			soar.execute( qEsCmd, query, function(err, esData) {
				if (err)
					return  cb(err);

				if (!esData) {
					var  data = {
							caID: caID,
							accName: inData.accName,
							secret: inData.secret
						};
					soar.execute( iEsCmd, data, null, function(err, es) {
						cb(err, es.esID);
					});
				}
				else {
					if (esData && esData.secret == inData.secret) {
						console.log('esData.secret == inData.secret');
						return  cb( {code: 12, message: 'The **secret** parameter is missing or not valid.'});
					}
					
					cb(null, esData.esID);
				}
			});			
		},
		function call3RdAPI(esID, cb) {
			var options = {
				url: inData.url,
				method: "POST",
				json: {secret: inData.secret},
				timeout: 10000
			};
			console.log('post url:'+inData.url);
			request(options, function (err, resp, body) {
				if (!resp)
					cb (err);
				else if (resp.statusCode == 200) {
					console.log('body:'+JSON.stringify(body));
					var  accName;
					if (typeof(body) == 'string')
						accName = body;
					else {
						try {
							var  rtn = JSON.parse(body);
							accName = rtn.accName;
						}
						catch(e){
							return  cb ( internErr() );
						}
					}
					
					if (accName)
						cb( null, esID, accName );
					else
						cb ( internErr() );
				}
				else {
					console.log("resp.statusCode: "+resp.statusCode);
					cb ( internErr() );
				}
			});
		},
		function  checkAccName(esID, accName, cb) {
			if (inData.accName != accName) {
				console.log('inData.accName != accName');
				return  cb( {code: 12, message: 'The **secret** parameter is missing or not valid.'});
			}
			cb(null, esID);
		},
		function updateSecret(esID, cb) {
			var  query = {esID: esID},
				 data = {secret: inData.secret};
			soar.execute( uEsCmd, data, query, function(err) {
				cb(err);
			})
		},
		function issueToken(cb)  {
			// send the existing token or issue a new token
			var  userID = usrData.GrpUser_id;
				 
			findToken(caID, userID, rt.remoteAddr, function(err, tknData)  {
				if (err)
					return cb( internErr() );
				
				if (tknData)  {
					userUtil.destroyToken(userID, tknData.token, function(err) {
						if (err)
							cb( internErr() );
						else
							newToken(usrData, rt, cb);
					});
				}
				else
					newToken(usrData, rt, cb);
			});
		}
	],
	function(err, usrData, tknData) {
		if (err) {
			if (err.code && err.message)
				return  cb(err);
			console.log(err);
			return  cb( internErr() );
		}
		usrData.isValid = 1;
		var  result = {
				code: 0,
				message: 'Ok',
				value: usrData,
				token: tknData
			 };
		cb( null, result );
	});
}

function internErr()  {
	return  {code: -100, message: 'Internal error.'};
}

function findToken(caID, userID, devID, cb)  {
	var  query = {
		caID: caID, 
		GrpUser_id: userID, 
		devID: devID, 
		tknExpire: Date.now(),
		isVapor: true
	};
	
	soar.execute(qTknCmd, query, cb);
}

function  newToken(usrData, rt, cb)  {
	var  digest = rt.uPro.token.substring(0, 16),
		 randomNum = tokenUtil.random(),
		 token = digest + randomNum,
		 tknValid = Date.now() + _tsWindow,
		 usrID = usrData.GrpUser_id;
		 
	var  data = {
			caID: rt.app.CApp_id,
			GrpUser_id: usrData.GrpUser_id,
			token: randomNum,
			tknExpire: tknValid,
			devID: rt.remoteAddr,
			isVapor: true
		 };
		 
	soar.execute(iTknCmd, data, null, function(err) {
		if (err)
			return  cb(err);

		cb(null, {userID: usrID, dspName: usrData.dspName}, {token: token, validTo: tknValid});
	});
}