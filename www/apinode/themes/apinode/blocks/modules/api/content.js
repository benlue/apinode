var request = require('request'),
	util = require('util');

exports.execute = function(ctx, inData, cb)  {
	if(!inData.endpoint){
		cb({errCode: -1});
		return;
	}
	//console.log(JSON.stringify(ctx.bi,'',4));
	getDoc(inData.endpoint, null, (doc) => {
		var loc = ctx.bi.locale;

		doc.id = selLang(doc.id, loc);
		doc.descTx = selLang(doc.descTx, loc);
		
		recursion(doc.query, loc);
		recursion(doc.out, loc);

		for(k in doc.error) {
			doc.error[k] = selLang(doc.error[k], loc);
		}
		cb({errCode: 0, value: doc});
	});
};

function recursion(ary, loc){
	for(idx in ary) {
		ary[idx].descTx = selLang(ary[idx].descTx, loc);
		if(!ary[idx].more){
			recursion(ary[idx].more)
		}
	}
}


function getDoc(endpoint, preDoc, cb){
	var opt = {
		url: 'http://127.0.0.1:4000' + endpoint,
		method: 'POST',
		headers : {
			'x-deva-appcode': 'api',
			'Content-Type': 'application/json',
			'Content-Length': 0
		}
		
	};
	
	request(opt, (err, res, body) => {
		if (!err && res.statusCode == 200){
			var doc = JSON.parse(body).value;
			if(doc.extends){
				getDoc(cb, doc.extends[0], doc);
			} else {
				if(preDoc){
					doc = combineDoc(doc, preDoc);
				}
				cb(doc);
			}
		}
	});
}

function combineDoc(base, ext) {
	for(var i in ext.query){
		for(var j in base.query){
			if(base.query[j].key == ext.query[i].key){
				delete base.query[j];
			}
		}
	}
	ext.query = base.query.concat(ext.query).filter(function(ele){return ele != undefined});
	ext.out = ext.out.length > 0 ? ext.out : base.out;
	return ext;
}

function selLang(obj, lang){
	return isString(obj) ? obj : obj[lang];
}

function isString(s) {
	if (typeof s === 'string' || s instanceof String)
		return true;
	else
		return false;
}