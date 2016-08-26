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
	var loc = getCookie("_xs_locale");
	if(!loc){
		var lang = window.navigator.languages ? window.navigator.languages[0] : window.navigator.userLanguage || window.navigator.language;
		if(lang.indexOf("zh") >= 0)
			ctrl.setLanguage("zh");
		else
			ctrl.setLanguage("en");
		window.reload();
	}
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

function getCookie(cname) {
	var name = cname + "=";
	var ca = document.cookie.split(';');
	for(var i=0; i<ca.length; i++) {
		var c = ca[i];
		while (c.charAt(0)==' ') c = c.substring(1);
		if (c.indexOf(name) == 0) return c.substring(name.length,c.length);
	}
	return "";
}