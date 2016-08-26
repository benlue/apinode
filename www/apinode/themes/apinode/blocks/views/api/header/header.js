ctrl.logout = function() {
	__.api({url: "/@admin/user/logout"}, function(data) {
		if (data.errCode)
			alert( data.message );
		else  {
			window.location = "/";
		}
	});
}

ctrl.startup = function(){	
	
}

ctrl.setLanguage = function(language) {
	if(language === "en"){
		setCookie("_xs_locale", "en", 180);
		ctrl.sel("#language > a").html('<span class="flag-icon flag-icon-us"></span> English</a>');
	} else if(language === "zh", 180) {
		setCookie("_xs_locale", "zh");
		ctrl.sel("#language > a").html('<span class="flag-icon flag-icon-tw"></span> 正體中文</a>');
	} else {
		setCookie("_xs_locale", "zh", 180);
		ctrl.sel("#language > a").html('<span class="flag-icon flag-icon-tw"></span> 正體中文</a>');
	}
	__.getCtrl("apiTree").refreshDoc();
} 

function setCookie(cname, cvalue, exdays) {
    var d = new Date();
    d.setTime(d.getTime() + (exdays*24*60*60*1000));
    var expires = "expires="+d.toUTCString();
    document.cookie = cname + "=" + cvalue + "; " + expires + "; path=/";
}
