// LIST

var List = function(listElement) {
	var self = this;

	var _getListName = function(){
		var listText = $(self.el).find("h2").text(),
			listTextInfo = listText.match(/(.*)\s\(.*\)/);
		if(listTextInfo === null)
			return listText;

		return listTextInfo[1];
	};

	var _getListType = function(){
		var listText = $(self.el).find("h2").text(),
			listTextInfo = listText.match(/(.*)\s\((.*)\)/);
		if(listTextInfo === null)
			return "none";

		return listTextInfo[2];
	};

	var applyWatch = function(){
		$(document).on("cardAdded", function(event, card){
			
		});
	};

	self.el = listElement;
	self.name = _getListName();
	self.type = _getListType();
	applyWatch();

	return self;
};