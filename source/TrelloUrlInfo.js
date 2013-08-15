var urlGet = function(key){
	var pathnameVars = (window.location.pathname).split("/");
	var searchVars = window.location.search;
	var index;
	if(searchVars.length > 0)
		var searchVars = searchVars.substring(1).split("&|=");
	else
		searchVars = [];
	if((index = pathnameVars.indexOf(key)) > -1 && index < pathnameVars.length - 1)
		return pathnameVars[index+1];
	
	if((index = searchVars.indexOf(key)) > -1 && index < searchVars.length - 1)
		return searchVars[index+1];
};