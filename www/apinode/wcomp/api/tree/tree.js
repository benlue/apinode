ctrl.startup = function () {
	ctrl.sel("#menu").metisMenu();
};

ctrl.selectEndpoint = function(endpoint) {
	ctrl.callHandler('onSelectEndpoint', endpoint);
}
