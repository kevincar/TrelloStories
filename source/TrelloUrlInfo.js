var urlGet = function(key, url){
	if(url === undefined){
		url = window.location.href;
	}

    var pathname = url.match(/.*:\/\/[A-z|\.]*\/(.*)/)[1],
		pathnameVars = (pathname).split("/"),
		search = url.match(/.*(\?.*)/)!==null?url.match(/.*(\?.*)/)[1]:[],
		searchVars = search,
		index;

	if(searchVars.length > 0)
		var searchVars = searchVars.substring(1).split("&|=");
	else
		searchVars = [];
	if((index = pathnameVars.indexOf(key)) > -1 && index < pathnameVars.length - 1)
		return pathnameVars[index+1];
	
	if((index = searchVars.indexOf(key)) > -1 && index < searchVars.length - 1)
		return searchVars[index+1];
};