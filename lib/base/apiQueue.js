/*!
* apinode
* authors: Ben Lue
* Copyright(c) 2015~2016 Gocharm Inc.
*/
var  async = require('async'),
     http = require('http'),
     admin = require('./adminOffice.js'),
     serverBase = require('../server/serverBase.js');

var  apiQueue = async.queue(queueProcessor, 10);


exports.push = function(task)  {
    apiQueue.push( task );
};


/**
 * A task should have the following properties:
 * .rt: runtime environment
 * .ep: an API endpoint
 * .param: input data to the endpoint
 * .listener: a web address to send out the process result (remote event listener)
 */
function  queueProcessor(task, cb) {
    var  rt = task.rt,
         uPro = cloneObj( rt.uPro ),
         appCode = rt.app.caCode,
         ep = serverBase.analyzeEndpoint(appCode, task.ep);

    var  nrt = {
            req: null,
            inData: task.param,
            ep: ep,
            uPro: uPro
         },
         listener = task.listener;

    //admin.getCA(rt.appCode, function(err, caData) {
    admin.getCA(rt.app.caCode, function(err, caData) {
        if (err)  {
            console.log( err.stack );
            return  cb(err);
        }

        nrt.app = caData;
        
        serverBase.serviceWithTrust(nrt, caData)
        .then(function(result) {
            //console.log('queue result:\n%s', JSON.stringify(result, null, 4));
            if (task.cb)
                notifyListener(nrt, result, listener, cb);
            else
                cb();
        })
        .catch(function(err) {
            //console.log('error is\n%s', JSON.stringify(err, null, 4));
            if (task.cb)
                notifyListener(nrt, err, listener, cb);
            else
                cb();
        });
    });
}


function  notifyListener(rt, result, listener, cb)  {
    var  postBody,
            postFix = rt  ?  rt.ep.postFix : undefined;

    if (postFix === 'txt')
        postBody = result.value;
    else
        postBody = JSON.stringify(result);

    // issue a notification to the remote event listener
    var  opt = {
            host: listener.host,
            port: listener.port || 80,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
         };

    request(opt, result, cb);
}


function  request(opt, postData, cb)  {
	var  p_data = JSON.stringify( postData || {} );

	// consider non-English characters
	opt.headers['Content-Length'] = Buffer.byteLength(p_data);

	var postReq = http.request(opt, function(res) {
        res.on('end', function () {
            cb();
        });
	});

	postReq.on('error', function(e) {
		console.log('Remote notification failed.');
        cb( e );
	});

	// post the data
	postReq.write(p_data);
	postReq.end();
}


function  cloneObj(obj)  {
    var  nobj = {};
    for (var k in obj)
        nobj[k] = obj[k];
    return  nobj;
}