ctrl.startup = function() {
	var apiDocCtrl = __.getCtrl('apiDocComp');
	if(apiDocCtrl)
		apiDocCtrl.addHandler('onChangeDoc', function(endpoint){
			ctrl.callHandler('onChangeDoc', endpoint);
		});
}