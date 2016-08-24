How To Work With CNode: The Cooperative Server
==============================================

## What is a cooperative server
In additional to providing API services of its own, a CNode server can also do two interesting things:

+ Accepting requests from other servers.
+ Forward API requests to other servers.

## Accepting requests from other servers
CNode can accept requests from other servers. To leverage the service of a CNode, external servers have to register their apps with CNode and obtain the app-key as well as the app-secret from a CNode server. With that, external servers can issue requests to a CNode server in two scopes:

### Application scope requests
Application scope requests are like requests made by guests. In other words, application scope requests will be granted permissions only to public services or resources.

To make such requests, external servers have to:

1. register the external app on the CNode server and obtain the app-key and app-secret of the external app.
2. ask for an application scope token (the endpoint is "token/request") by presenting the app-key and app-secret in the request header.
3. if an application scope token is granted, the external server can use that token to access public services or resources on the CNode server.

### User scope requests
When an external server makes a request which will access non-public services, resources or data, such a request is an user scope request. To make user scope requests, a external server has to:

1. register the external app on the CNode server and obtain the app-key and app-secret of the external app.
2. ask for an **user** scope token (the endpoint is "token/request") by presenting the app-key, app-secret in the request header. The external server also has to include the user ID in the request endpoint. 
3. if an **user** scope token is granted, the external server can use that token to access private services or resources on the CNode server.

In step 2 described above, the CNode server receiving the user scope token petition will create records in the database for that external user. That is the external user ID will be recorded and recognized. When access to any private resource or data, that external user ID will be checked to see if such access is valid. As a result, external user A won't be able to access private data owned by external user B.

### Access non-public applications
When an external server tries to access non-public applications on a CNode server, there are special settings to be done. Public applications on a CNode server are available to all external applications as long as external applications can authenticate themselves by presenting the app-key and app-secret issued by the CNode server. However, for private applications presenting those credentials is not enough. External applications must be granted the access right to private applications. So the administrator tool of a CNode server should provide a way to grant access to private applications to other applications (not just external, also for interal apps).

## Forward API requests to other servers
A CNode server can forward requests to other cooperate CNode servers while keep the whole process transparent to clients. Clients actually do not know their requests are possibly fulfilled by other servers than the originally targeted server.

Request dispatching is done at the application level. That is if a CNode server finds out a request is on an alien server, it will forward the request to the actual server. A CNode server will not look behind applications to check if a specific resource can be served locally or remotely.

Before a CNode server A can forward requests to another CNode server B, the server A has to register its application on server B. As a result, we can see there is a complication that servers have to register their applicaitons to each other.