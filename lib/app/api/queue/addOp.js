/*!
* apinode
* authors: Ben Lue
* Copyright(c) 2015~2016 Gocharm Inc.
*/
var  apiQueue = require('../../../base/apiQueue.js');

exports.run = function(rt, cb)  {
    var  inData = rt.inData,
         task = {
            rt: rt,
            ep: inData.ep,
            param: inData.param,
            listener: inData.listener
         };

    apiQueue.push( task );
    cb({code: 0, message: 'Ok'});
}