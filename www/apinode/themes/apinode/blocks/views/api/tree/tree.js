var lastEndpoint;

ctrl.startup = function() {
	var apiTreeCtrl = __.getCtrl('apiTreeComp');	

	apiTreeCtrl.addHandler('onSelectEndpoint', function(endpoint){
		lastEndpoint = endpoint;
		draw(endpoint);
	});
}

ctrl.refreshDoc = function() {
	draw(lastEndpoint);
}

function draw(endpoint) {
	if(endpoint){
		var params = {};
		if(endpoint){
			params = {
				params: {
					app: "<%=bi.query.app%>",
					stID: <%=bi.query.stID%>,
					endpoint: endpoint
				}
			}
		}

		__.getCtrl('apiDoc').reload('/api/content', params, function(emCtrl){
			emCtrl.addHandler('onChangeDoc', draw);
		});
	} else {
		__.getCtrl('apiDoc').reload('/api/welcome');
	}
}
