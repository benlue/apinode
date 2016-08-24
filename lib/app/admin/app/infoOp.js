exports.run = function(rt, cb)  {
	var  app = rt.app, 
		 rtnData = {
			appCode: app.caCode,
			appKey: app.appKey,
			title: app.title,
			descTx: app.descTx,
			isExt: app.isExt,
			locID: app.lcaID
		};

	cb(null, {code: 0, message:'OK', value: rtnData});
}