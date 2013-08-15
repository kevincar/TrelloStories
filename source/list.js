// LIST
var List;


List = (function(){
	
	/**
	 * Constructor - Creates a List object that corresponds with the List in the DOM so that it
	 *               is a live and interactive object. In essance, what ever is done to this object
	 *               should be done to the DOM object
	 * @params - listData. The list data from the Trello API used to create the List Object
	 */
	function List(listData) {
		var self = this;

		self.listData = listData;
		self.el = _getListEl.apply(self);
		self.name = _getListName.apply(self);
		self.type = _getListType.apply(self);
		_initListeners.apply(self);
	}
	
    //========================================================================//
    //																		  //
    //							Public Functions							  //
    //																		  //
    //========================================================================//

    //========================================================================//
    //																		  //
    //							Private Functions							  //
    //																		  //
    //========================================================================//

    // Retrieves the DOM element that corresponds to the List Object.
	function _getListEl(){
		var self = this,
	    	listEl = null;
		$(".list").each(function(i,e){
			var listName = $(e).find("h2").text;
			if(listName = self.listData.name){
				listEl = e;
			}
		});
		return listEl;
	}

	// Retreive the List name
	function _getListName(){
		var self = this,
			listText = self.listData.name,
			listTextInfo = listText.match(/(.*)\s\(.*\)/);

		if(listTextInfo === null)
			return listText;

		return listTextInfo[1];
	}

	// Retreive List Type
	function _getListType(){
		var self = this,
			listText = self.listData.name,
			listTextInfo = listText.match(/(.*)\s\((.*)\)/);

		if(listTextInfo === null)
			return "none";

		return listTextInfo[2];
	}

    //========================================================================//
    //																		  //
    //							Event Listeners 							  //
    //																		  //
    //========================================================================//
	function _initListeners(){

	}

	return List;

})();