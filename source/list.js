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

    /**
     * setOustandingStories - If this is called on a list, it sets that list to watch for incoming cards, to 
     *						  turn them into story cards
     */
     List.prototype.setOutstandingStories = function(){
     	var self = this;
     	$(document).on("cardMove", function(event, trello, requestInfo){_checkCardMove.apply(self, [trello, requestInfo]);});
     };


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

	/**
	 * _checkCardMove - verfies that a 'card move' action involve this list
	 */
	 function _checkCardMove(trello, requestInfo) {
	 	var self = this;
	 		listID = requestInfo.details.requestBody.formData.idList[0];

	 	if(self.listData.id == listID) {
	 		var movedCardID = requestInfo.card,
	 			cardsArray = Object.keys(trello.Cards).map(function(key){return trello.Cards[key];}),
	 			card = cardsArray.filter(function(i){return i.data.id === movedCardID;}),
	 			card = card.length>0?card[0]:null;

	 		// Turn the card into a story
	 		if(card && !card.storyID) {
	 			// Get next StoryID
	 			var storyID = "00" + parseInt(trello.Stories.length+1),
	 				storyID = storyID.length>3?storyID.substring(storyID.length-3):storyID;

		 		// change the name
		 		card.setName(storyID+" "+card.name);
		 		card.type = "Stories";

		 		// add the story data to our trelloObject
		 		card.storyID = storyID;
		 		var newStory = new Story(card, trello.Cards);
		 		trello.Stories.push(newStory);
	 		}
	 	}
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