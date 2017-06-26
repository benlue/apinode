apinode
-------
An API server which can greatly reduce the work when implementing your own API services.

## Get Started
It's quite easy to set up your own API server using **apinode**. Below is a sample code:

    var  apiNode = require('apinode');

    var  config = {
            appPath: "...",
            logDir: "..."
         };

    apiNode.init( config );
    apiNode.restart();

Yes, it's that simple. You initialize **apinode** with a config object, and set sail of it. The configuration usually has at least two properties: the "appPath" property specifying where is your application code and the "logDir" specifying the log directory where **apinode** will dump its output log.

## Write Your Own Service
To start with, let's depict the file structure of a typical **apinode** project:

    + lib
      + app
        + _api
        + app_1
          + resource_1
            + op_1
            + op_2
          + resource_2
          + ...
        + app_2
        + ... app_n

The enpoints served by **apinode** are formulated as app/resource/op. For example, admin/user/login is a built-in service endpoint of **apinode**. If you want to create an endpoint as blog/article/list, you should create a listOp.js file under the lib/app/blog/article directory.

### The Operator
The actual API services should be provided by operators. An operator is a node module which should be saved in the lib/app/your_app/your_resource directory so it can be found and invoked by **apinode**. An operator should at least define a run() function to offer the intended service. Below is a very simple example:

    exports.fun = function(rt, cb)  {
        this.answerOk('Hello There!', cb);
    }

The **rt** parameter carries the run-time environment and **cb** is the callback function to indicate an operator has finished its job. Since this is a very short introduction, we'll not touch too many ground. The **apinode** module itself contains a built-in app called "admin" which is under the lib/app/admin direcoty. You can browse through that direcoty and find quite a few operator examples.