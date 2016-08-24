/*!
* cnode
* authors: Ben Lue
* Copyright(c) 2015 Gocharm Inc.
*/
exports.err = function(errCode)  {
	return  {code: errCode, message: errMessage(errCode)};
};


/**
 * This function can be used to generate the error object which can be returned as the result 
 * of an erroneous API call. If the locale parameter is given, the corresponding text message
 * will be returned. However, if the text message does not have the desired locale, the English
 * version will be returned. 
 */
exports.opErr = function(op, errCode, locale)  {
    
}


function  errMessage(code)  {
	var  msg;
	switch (code)  {
		case  exports.OK:
			msg = 'Ok';
			break;
			
		case  exports.WRONG_REQ_CTYPE:
			msg = "Request content-type must be 'application/json'.";
			break;
			
		case  exports.NO_TOKEN:
			msg = 'Token is missing.';
			break;
			
		case  exports.INVALID_TOKEN:
			msg = "Invalid token.";
			break;
			
		case  exports.TOKEN_EXPIRE:
			msg = "Token expired.";
			break;
			
		case  exports.NO_TOKEN_GRANT:
			msg = "Not valid credential. No token granted";
			break;
			
		case  exports.NO_APP_REQ:
			msg = 'Unable to find the app-code of this request.';
			break;
		
		case  exports.INVALID_EP:
			msg = 'Invalid endpoint format.';
			break;
			
		case  exports.INVALID_APP:
			msg = 'Unable to find the application specified in the request.';
			break;
				
		case  exports.INVALID_RS:
			msg = 'Unable to find the resource specified in the request endpoint.';
			break;
			
		case  exports.INVALID_OP:
			msg = 'Unable to find the operator specified in the request endpoint.';
			break;
			
		case  exports.UNDEFINED_OP:
			msg = 'The operator is not defined.';
			break;
			
		case  exports.WRONG_PARAM:
			msg = "Wrong input parameters.";
			
		case  exports.NO_PERMISSION:
			msg = "Not allowed to access the endpoint.";
			break;
			
		case  exports.WRONG_BATCH_OP:
			msg = "Not a recognized batch operation (should be 'serial' or 'parallel').";
			break;
			
		case  exports.SOME_BATCH_ERR:
			msg = "Some requested services in the batch produce error results.";
			break;
			
		case  exports.DB_ERROR:
			msg = "Internal (database) error.";
			break;
			
		case  exports.CONNECT_FAIL:
			msg = "Unable to connect to the internal search server.";
			break;
			
		case  exports.RESPONSE_FMT_ERR:
			msg = 'Unexpected response format from the internal search server.';
			break;
			
		case  exports.FAIL_INDEX_REQ:
			msg = 'Failed to query the internal search server.';
			break;
			
		case  exports.INTERNAL_ERR:
			msg = 'Internal error.';
			break;
	}
	
	return  msg;
};


// define some constants here
function  defineConstant(name, v)  {
	Object.defineProperty(exports, name, {
		value: v,
		enumerable: true
	});
};

defineConstant('OK', 0);
defineConstant('WRONG_REQ_CTYPE', -1);
defineConstant('NO_TOKEN', -2);
defineConstant('INVALID_TOKEN', -3);
defineConstant('TOKEN_EXPIRE', -4);
defineConstant('NO_TOKEN_GRANT', -5);
defineConstant('INTERNAL_ERR', -100);

defineConstant('NO_APP_REQ', -10);
defineConstant('INVALID_EP', -11);
defineConstant('INVALID_APP', -12);
defineConstant('INVALID_RS', -13);
defineConstant('INVALID_OP', -14);
defineConstant('UNDEFINED_OP', -15);
defineConstant('WRONG_PARAM', -16);

defineConstant('NO_PERMISSION', -20);
defineConstant('WRONG_BATCH_OP', -21);
defineConstant('SOME_BATCH_ERR', -22);

defineConstant('DB_ERROR', -30);

defineConstant('ELAS_CONNECT_FAIL', -40);
defineConstant('ELAS_RESPONSE_FMT_ERR', -41);
defineConstant('ELAS_FAIL_INDEX_REQ', -42);

defineConstant('BATCH_SERIAL_FAIL', -50);