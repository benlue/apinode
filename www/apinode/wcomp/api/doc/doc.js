ctrl.startup = function () {
	ctrl.sel(".markdown").each(function(idx,ele){
		ctrl.sel(ele).html(marked(ele.textContent));
	});
}

ctrl.changeDoc = function (endpoint) {
	ctrl.callHandler('onChangeDoc', endpoint);
}