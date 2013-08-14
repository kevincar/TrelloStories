// TrelloStories.js

// Load Cards
var Card = function(cardData,listId) {

	// Get Card Element
	var _getCardEl = function(){
		var cardEl = null
		$(".list-card").each(function(i, e){
			var shortID = $(e).find("a span.card-short-id").text().match(/#([0-9]*)/)[1];
			if(shortID == cardData.idShort){
				cardEl = e;
			}
		});
		return cardEl;
	};

	// Get Card Story ID
	var _getCardStoryID = function() {
		if(self.text === undefined)
			self.text = cardData.name;
		var cardTextInfo = self.text.match(/([0-9][0-9][0-9]).*/);
		if(cardTextInfo === null)
			return null;

		return cardTextInfo[1];
	};

	// Get Card Name
	var _getCardName = function() {
		if(self.text === undefined)
			self.text = cardData.name;
		var cardTextInfo = self.text.match(/([0-9][0-9][0-9]).*/);
		if(cardTextInfo === null)
			return self.text;

		return self.text.split(cardTextInfo[1])[1];
	};

	// Get Card List Text
	var _getCardListText = function() {
		var list = $(self.el).closest('.list');
		var listHeader = $(list).find('.list-header');
		var listName = $(listHeader).find('h2');
		var listNameText = $(listName).text();
		return listNameText;
	};

	// Get Card List Name
	var _getCardListName = function() {
		if(self.listText === undefined)
			self.listText = _getCardListText();
		var listInfo = self.listText.match(/(.*)\s\((.*)\)/);
		if(listInfo === null)
			return self.listText;
		return listInfo[1];
	};

	var _getCardType = function() {
		if(self.listText === undefined)
			self.listText = _getCardListText();
		var listInfo = self.listText.match(/(.*)\((.*)\)/);
		if(listInfo === null)
			return "Stories";
		return listInfo[2];
	};

	var _addCardID = function(){
		if(self.el === undefined)
			self.el = _getCardEl();

		$(self.el).attr("cardid", self.cardID);
	};

	var _watch = function (){
		$(document).on('click', '[cardid='+self.cardID+'] .pirate-overlay', _handlerCheckEditing);
	};

	var _handlerCheckEditing = function(){
		// console.log("Card " + self.cardID + " was clicked!");
	};

	var self = this;
	self.data = cardData;
	self.parentListId = listId;
	self.el = _getCardEl();
	self.text = cardData.name;
	self.cardID = cardData.idShort;
	self.storyID = _getCardStoryID();
	self.name = _getCardName();
	self.listText = _getCardListText();
	self.listName = _getCardListName();
	self.type = _getCardType();
	_addCardID();
	_watch();

	self._convertChecklistsToCards = function(){
		var checkLists = self.data.idChecklists;
		for(var index in checkLists)
			window._trello.convertChecklistToCards(checkLists[index]);
	}

	var _applyActions = function() {
		$('[cardid='+self.cardID+']').on('click', '.js-card-menu', function(){
			setTimeout(function(){
				var actions = $('.pop-over').find('ul').eq(0);
				var actionConvertChecklists = "<li><a class='js-convert-checklists' data='"+self.cardID+"'>Checklists to Cards.</a></li>";
				$(actions).append(actionConvertChecklists);
				// $('.pop-over').show();
			}, 50);
		});
		$(document).on('click', '[data='+self.cardID+'].js-convert-checklists', self._convertChecklistsToCards);
	};
	_applyActions();

	self.highlight = function(color, flash){
		if(color === undefined)
			color = 'pink';
		if(flash === undefined)
			flash = false;
		// $(self.el).closest(".list-card").css('background-color', color);
		$(self.el).closest(".list-card").css('box-shadow', '0px 0px 15px 5px '+color+' inset');

		if(flash)
			timer = setTimeout(function(){self.removeHighlight();}, 2000);
	};

	self.removeHighlight = function() {
		// $(self.el).closest(".list-card").css("background-color", '');
		$(self.el).closest(".list-card").css("box-shadow", '');
	};

	return self;
};