/*!
* cnode
* authors: Ben Lue
* Copyright(c) 2015 Gocharm Inc.
*/
var  async = require('async'),
	 soar = require('sql-soar'),
	 userUtil = require('../util/userUtil.js');

var  psnExpr = soar.sql('Person')
				   .filter({
					   name: 'Person_id',
					   op: '='
				   }),
	 usrExpr = soar.sql('GrpUser')
				   .filter({
					   name: 'GrpUser_id',
					   op: '='
				   }),
	 addrExpr = soar.sql('Person AS psn')
	 				.join({
						 table: 'GeoLoc AS ge',
						 onWhat: 'psn.addrID=ge.geID'
					 })
					.column(['addr'])
					.filter({
						name: 'Person_id',
						op: '='
					}),
	 geoExpr = soar.sql('GeoLoc')
	 			   .filter({
						op: 'and',
						filters: [
							{name: 'latitude', op: '='},
							{name: 'longitude', op: '='},
							{name: 'geID', op: '='}
						]
					}),
	 ctExpr = soar.sql('City')
	 			  .column(['ctID'])
				  .filter({name: 'ctName', op: '='});
					
var  qAddrCmd = {op: 'query', expr: addrExpr};
				   
var  psnCol = ['fname', 'lname', 'nid', 'dob', 'gender', 'addrID', 'email', 'mobile'];
				   
exports.run = function(rt, cb)  {
	var  inData = rt.inData;
	
	if (inData.addr)  {
		rt.forward(rt, 'geo/address/update', {addr: inData.addr}, function(err, result) {
			if (err)  {
				console.log('user/update error:\n%s', JSON.stringify(err, null, 4));
				return  cb(userUtil.internErr());
			}
			
			inData.addrID = result.value.addrID;
			updateUser(rt, cb);
		});
	}
	else {
		delete  inData.addrID;
		updateUser(rt, cb);
	}
};


function  updateUser(rt, cb)  {
	var  psnID = rt.uPro.psnID,
		 userID = rt.uPro.userID,
		 inData = rt.inData;
		 
	async.waterfall([
		function(cb)  {
			soar.getConnection(cb);
		},
		function(conn, cb)  {
			conn.beginTransaction(function(err)  {
				cb(err, conn);
			});
		},
		function  updatePsn(conn, cb)  {
			var  data = {};
			for (var i in psnCol)  {
				var  key = psnCol[i];
				if (inData.hasOwnProperty(key))
					data[key] = inData[key];
			}
			
			if (Object.keys(data).length > 0)  {
				var  cmd = {
						op: 'update',
						expr: psnExpr,
						conn: conn
					 };
				soar.execute(cmd, data, {Person_id: psnID}, function(err) {
					cb(err, conn);
				});
			}
			else
				cb( null, conn );
		},
		function  updateUser(conn, cb)  {
			var  data = {};
			if (inData.hasOwnProperty('dspName'))
				data.dspName = inData.dspName;
			if (inData.hasOwnProperty('aux'))
				data._c_json = inData.aux;
				
			if (Object.keys(data).length > 0)  {
				var  cmd = {
						op: 'update',
						expr: usrExpr,
						conn: conn
					 };
				soar.execute(cmd, data, {GrpUser_id: userID}, function(err) {
					cb(err, conn);
				});
			}
			else
				cb( null, conn );
		}
	],
	function(err, conn) {
		if (err)  {
			conn.rollback(function() {
				conn.release();
				cb( null, err );
			});
		}
		else  {
			var  value = {id: userID},
				 result = {code: 0, message: 'Ok', value: value};

			conn.commit(function(err) {
				if (err)
					conn.rollback(function()  {
						conn.release();
						cb( null, {code:-100, message: 'Internal error.'} );
					});
				else  {
					conn.release();
					cb( null, result );
				}
			});
		}
	});
};