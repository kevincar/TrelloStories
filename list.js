// LIST

var List = function(listData) {
	var self = this;

	var _getListEl = function(){
		var listEl = null;
		$(".list").each(function(i,e){
			var listName = $(e).find("h2").text;
			if(listName = listData.name){
				listEl = e;
			}
		});
		return listEl;
	};

	var _getListName = function(){
		var listText = listData.name;
			listTextInfo = listText.match(/(.*)\s\(.*\)/);
		if(listTextInfo === null)
			return listText;

		return listTextInfo[1];
	};

	var _getListType = function(){
		var listText = listData.name;
			listTextInfo = listText.match(/(.*)\s\((.*)\)/);
		if(listTextInfo === null)
			return "none";

		return listTextInfo[2];
	};
	var applyWatch = function(){};

	self.listData = listData;
	self.el = _getListEl();
	self.name = _getListName();
	self.type = _getListType();
	applyWatch;

	return self;
};