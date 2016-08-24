Architecture Overview of COIMOTION v2
=====================================

The coim2 server will require the following features or components:

+ An authorization layer to allow only authorized accesses.
+ A routing mechanizm to route requests to internal modules or co-working servers.
+ Internal business logic.

The server process flow is like the following:

    request -> token verification -> routing & permission -> biz logic

## Authorization Layer
For each sub-domain of the server, the authorization layer is responsible for discerning if an access token is valid. If it's valid, the request user is identified and the corresponding request will be allowed to go deeper in the server process chain.

If a request is made for a guest user, the client has to issue a credential tuple as (app-key, app-secret) to obtain an application token rather then an user token. If the client is unable to protected the app-secret so it won't be able to store and issue an app-secret. In that case, app-key only credential is acceptable and the application developers have to weight in the possible risks by themselves.

### The Token Format

An access token has the following format:

    [b0][hash][random]

The angle brackets [ ] does not take up any character or digit. They are used to indicate each token is composed of three parts. [b0] is a single-digit hexadecimal number used as a flag to tell if the token is an user token, application token or weak application token:

+ f: an user token
+ 8: an application token
+ 0: a weak application token

[hash] is the sha1 result of app-code + app-secret. The result of the sha1 hash is a hexadicimal string of length 40. We'll only take a substring of 15 out of it. The starting index is decided by the first digit of the app-secret.

[random] is a 32 digit hexadicimal random number (string). That number along with the application ID will be used to query the "AccToken" table. If an entry is found, we'll be able to know which user is the owner of the token (guest for application token).

## Routing and Permission Checking
When a request is granted, its request endpoint will be parsed to see if it's a valid enpoint path. The parser will discern an endpoint as an object with the following parts: app, resource, operator and id (id may not be needed). Once an endpoint can be successfully parsed, the following permission checks will be performed:

+ the request user is allowed to access the app and the resource.
+ the request user is also allowed to perform the operator.

If the above permission checks have passed, the request will be routed to the proper service provider. Request routing is done based on the following rules:

1. Based on the app-code, coim2 server has to decide if the servcie is hosted internally or the other way.
2. If the service is hosted internally, the request will be dispathed to the "business logic" unit.
3. Otherwise, coim2 server will look up app-code in its external service table. If an entry can be found, the request will be forwarded to the other "coim-compatible" server. Alien servers cannot be used to work with coim2 server in this way.

A "coim-compatible" server means the server can work with authorization protocol of the coim2 server.

A service can be defined as an alias of an external service. In that case, the original service should be defined in the coim-compatible endpoint format. When such a request passes authroization and permission checks, it will be routed to the target external service. Rather than using app-code to look up the routing destination of the request, the request operator will indicate the request is an alias of an external service. 

External services will need to be authorized unless the service look up table forsakes authroization. coim2 server has to send out the (app-key, app-secret, user-id) tuple to ask for permissions. If the request was originated from a guest user, the user-id in the authoring tuple can be empty.

## Handling Business Logic
Each coim2 server can host its own business logic. Each request will be routed to a module to be processed. For each module, the following functions can be implemented:

+ checkArguments(): checking parameters to this operator is ok.
+ checkPermission(): this is mainly used to check if the request user can access the requested data instance.
+ run(rt, cb): this function performs the actual business logic. **rt** is the request term and **cb** is the callback function.

### Permission Granting
There is a core feature which has to be supported in every coim-node. That key feature is to answer authorization requests.

Every coim-node server can host multiple applications. For each application, clients can ask for authorization by sending the app-key and app-secret of that application. A coim-node server is responsible for verifying the crenditial and grant the permission. In summary, a coim-node server should perform the following authorization related tasks:

+ Receive credentials as a (app-key, app-secret, user_id) tuple sent by clients and decide a permission should be granted.

+ Generate an access token for each permission granted.

