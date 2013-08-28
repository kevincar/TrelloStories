// TrelloStories.js
var Card;
// Load Cards
Card = (function(){
	
	/**
	 * Constructor - 
	 * @param - cardData. Data needed to load the card
	 * @param - listId. Not sure?
	 */
	function Card(cardData,listId) {
		// Initialize Variables
		var self = this;
		self.data = cardData;
		self.parentListId = listId;
		self.el = _getCardEl.apply(self);
		self.text = cardData.name;
		self.cardID = cardData.idShort;
		self.storyID = _getCardStoryID.apply(self);
		self.name = _getCardName.apply(self);
		self.listText = _getCardListText.apply(self);  // Should probably Be deprecated
		self.listName = _getCardListName.apply(self);  // Should probably Be deprecated
		self.type = _getCardType.apply(self);
		self.selected = false;
		self.checkItemID = null;	// Should be linked differently once everything is object oriented.
		self.checkListID = null;
		self.trelloObject = null;

		// Inititory Functions
		_addCardID.apply(self);

		// Event Listeners
		_initListeners.apply(self);
	}

    //========================================================================//
    //																		  //
    //							Public Functions							  //
    //																		  //
    //========================================================================//

	Card.prototype._convertChecklistsToCards = function(){
		var self = this,
			checkLists = self.data.idChecklists;
		for(var index in checkLists)
			window._trello.convertChecklistToCards(checkLists[index]);
	};

	Card.prototype.highlight = function(color, flash){
		var self = this;

		if(color === undefined)
			color = 'pink';
		if(flash === undefined)
			flash = false;
		$(self.el).closest(".list-card").css('box-shadow', '0px 0px 15px 5px '+color+' inset');

		if(flash)
			timer = setTimeout(function(){
				self.removeHighlight();
			}, 2000);
	};

	Card.prototype.removeHighlight = function() {
		var self = this;
		$(self.el).closest(".list-card").css("box-shadow", '');
	};

	Card.prototype.setName = function(name) {
		var self = this,
			newName = name;

		if(self.storyID){
			newName = self.storyID + " " + name;
		}

	 	if(self.trelloObject._trello.authorized()){
	 		var jqXHR = self.trelloObject._trello.put('cards/'+self.data.id+'/name', {value: newName}),
	 			cardInfo = JSON.parse(jqXHR.responseText);

	 		self.data = cardInfo;
 			self.text = cardInfo.name;
 			self.name = name;
 			return true;
	 	}
	 	return false;
	};

	Card.prototype.setStoryID = function(storyID) {
		var self = this;;
		storyID = parseInt(storyID);
		storyID = '00'+storyID;
		storyID = storyID.length>3?storyID.substring(storyID.length-3):storyID;

		if(!self.trelloObject)
			return console.error("card has no reference to parent trelloObject")

		// If this is the story Card then we're done
		if(self.type === 'Tasks'){
			// Ensure that the story requested exists
			var destStoryCard = self.trelloObject.Stories.filter(function(i){return i.storyID === storyID;});
			var srcStoryCard = self.trelloObject.Stories.filter(function(i){return i.storyID === self.storyID;});
			destStoryCard = destStoryCard.length>0?destStoryCard[0]:null;
			srcStoryCard = srcStoryCard.length>0?srcStoryCard[0]:null;
			if(destStoryCard) {
				// remove this card from the current story if it already belongs to one
				if(srcStoryCard){
					srcStoryCard.removeTask(self.data.id);
				}
				// add this card to the story task lists
				destStoryCard.taskCards.push(self);

				// add a checklist item in the story card to reresent this card.
				var checkItemInfo = destStoryCard.addTaskCheckItem(self.data.id);
				if(checkItemInfo){
					self.checkListID = checkItemInfo.checkListID;
					self.checkItemID = checkItemInfo.id;
				}

			}
			else {
				return console.error("Failed to set the story ID of this card. story "+storyID+" doesn't exist.");
			}
		}
		self.storyID = storyID;
		self.setName(self.name);
		return true;
	};

	Card.prototype.removeFromStory = function(){
		var self = this;

		// set the storyID
		self.storyID = null;
		// remove checkitem stuff
		self.checkListID = null;
		self.checkItemID = null;
		// Set the card text;
		if(self.setName(self.name))
			return true;
	};

    //========================================================================//
    //																		  //
    //							Private Functions							  //
    //																		  //
    //========================================================================//

	// Get Card Element
	function _getCardEl(){
		var self = this,
			cardEl = null;

		$(".list-card").each(function(i, e){
			var shortID = $(e).find("a span.card-short-id").text().match(/#([0-9]*)/)[1];
			if(shortID == self.data.idShort){
				cardEl = e;
			}
		});

		return cardEl;
	}

	// Get Card Story ID
	 function _getCardStoryID() {
	 	var self = this;
		if(self.text === undefined)
			self.text = self.data.name;
		var cardTextInfo = self.text.match(/([0-9][0-9][0-9]).*/);
		if(cardTextInfo === null)
			return null;

		return cardTextInfo[1];
	}

	// Get Card Name
	function _getCardName() {
		var self = this;
		if(self.text === undefined)
			self.text = self.data.name;
		var cardTextInfo = self.text.match(/([0-9][0-9][0-9])\s?(.*)/);
		if(cardTextInfo === null)
			return self.text;

		return cardTextInfo[2];
	}

	// Get Card List Text
	function _getCardListText() {
		var self = this,
			list = $(self.el).closest('.list'),
			listHeader = $(list).find('.list-header'),
			listName = $(listHeader).find('h2'),
			listNameText = $(listName).text();
		return listNameText;
	}

	// Get Card List Name
	function _getCardListName() {
		var self = this;
		if(self.listText === undefined)
			self.listText = _getCardListText.apply(self);
		var listInfo = self.listText.match(/(.*)\s\((.*)\)/);
		if(listInfo === null)
			return self.listText;
		return listInfo[1];
	}

	function _getCardType() {
		var self = this;
		if(self.listText === undefined)
			self.listText = _getCardListText.apply(self);
		var listInfo = self.listText.match(/(.*)\((.*)\)/);
		if(listInfo === null)
			return "Stories";
		return listInfo[2];
	}

	function _addCardID(){
		var self = this;
		if(self.el === undefined)
			self.el = _getCardEl.apply(self);

		$(self.el).attr("cardid", self.cardID);
	}

	function _applyOptions() {
		var self = this,
			actions = $('.pop-over').find('ul').eq(0),
			actionConvertChecklists = "<li><a class='js-convert-checklists' data='"+self.cardID+"'>Checklists to Cards.</a></li>";

		$(actions).append(actionConvertChecklists);
	}

	// Process a Card Move
	function _processMove(trello, requestInfo) {
		var self = this;
		var movedCardID = requestInfo.card,
			cardsArray = Object.keys(trello.Cards).map(function(key){return trello.Cards[key];}),
 			card = cardsArray.filter(function(i){return i.data.id === movedCardID;}),
 			card = card.length>0?card[0]:null;

		// Ensure that the move was on THIS card
		if(card.cardID == this.cardID) {
			// It'd be nice to figure a better way, but for some reason we need to wait.
			setTimeout(function(){_updateData.apply(self);}, 100);
		}
	}

	// Process what happens when editing a card
	function _processEdit(trello, requestInfo) {
		var self = this,
			requestedCardID = requestInfo.card;

		// Ensure that the request was for THIS card
		if(this.data.id === requestedCardID) {

		}
	}

	// Update the data of the card by making a request to the API
	function _updateData() {
		var self = this;
		Trello.rest("GET", "cards/"+self.data.id).then(function(data){
			self.data = data;
		});
	}

    //========================================================================//
    //																		  //
    //							Event Listeners 							  //
    //																		  //
    //========================================================================//

	function _initListeners(){
		var self = this;

		$('.pop-over').on('click', '[data='+self.cardID+'].js-convert-checklists', function(){self._convertChecklistsToCards();});

		// Register card moves
		$(document).on("cardMove", function(event, trello, requestInfo){_processMove.apply(self, [trello, requestInfo]);});

		// Register card Edits
		$(document).on("cardEdit", function(event, trello, requestInfo){_processEdit.apply(self, [trello, requestInfo]);});

		// DOM Manipulators
		// Watch the Popup menu for external card actions. Ensure the Popup is loaded First.
		$('[cardid='+self.cardID+']').on('click', '.js-card-menu', function(){setTimeout(function(){_applyOptions.apply(self);},50);});
	}

	return Card;
})();