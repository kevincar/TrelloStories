// TrelloStories.js

// Load Cards
var Card = function(cardElement) {

	// Get Card Text
	var _getCardText = function() {
		var el = self.el;
		var curText = $(el).text();
		var cardIdInfo = curText.match(/\#(\w*)\s/);
		return curText.split(cardIdInfo[0])[1];
	};

	// Get Card ID
	var _getCardID = function() {
		var el = self.el
		var curText = $(el).text();
		var cardIdInfo = curText.match(/\#(\w*)\s/);
		return cardIdInfo[1];
	};

	// Get Card Story ID
	var _getCardStoryID = function() {
		if(self.text === undefined)
			self.text = _getCardText();
		var cardTextInfo = self.text.match(/([0-9][0-9][0-9]).*/);
		if(cardTextInfo === null)
			return null;

		return cardTextInfo[1];
	};

	// Get Card Name
	var _getCardName = function() {
		if(self.text === undefined)
			self.text = _getCardText(card);
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

	// Find cards with storyID
	var cardsOfStory = function(storyID, cards) {
		return cards.filter(function(i){return i.storyID===storyID;});
	};

	// Find cards in a list
	var cardsOfList = function(listName, cards) {
		return cards.filter(function(i){return i.list === listName;});
	};

	// Find all task cards.
	var taskCards = function(cards) {
		return cards.filter(function(i){return i.type === 'Tasks';});
	};

	// Is Story Complete?
	var isStoryComplete = function(storyID, cards) {
		if(cards === undefined)
			cards = Cards;
		var storyCards = cardsOfStory(storyID, cards);
		var storyTasks = taskCards(storyCards);
		var numStoryTasks = storyTasks.length;
		var storyTasksReadyForQA = cardsOfList('Ready for QA (Tasks)', storyTasks);
		var numStoryTasksReady = storyTasksReadyForQA.length;
		return numStoryTasks===numStoryTasksReady;
	};

	var whereIsStory = function(storyID, cards) {
		if(cards === undefined)
			cards = Cards;

		var storyCards = cardsOfStory(storyID, cards);
		var storyTasks = taskCards(storyCards);
		$.each(storyTasks, function(i, card){
			console.log(card.name+": "+card.listName);
		});
	};
	
	var applyWatch = function(){
		$('.active-card').on("focus", '', function(){
			console.log("Card lost focus");
		});
	};

	var self = this;
	self.el = cardElement;
	self.text = _getCardText();
	self.cardID = _getCardID();
	self.storyID = _getCardStoryID();
	self.name = _getCardName();
	self.listText = _getCardListText();
	self.listName = _getCardListName();
	self.type = _getCardType();
	applyWatch();

	self.highlight = function(color, flash){
		if(color === undefined)
			color = 'pink';
		if(flash === undefined)
			flash = false;
		$(self.el).closest(".list-card").css('background-color', color);

		if(flash)
			timer = setTimeout(function(){self.removeHighlight();}, 2000);
	};

	self.removeHighlight = function() {
		$(self.el).closest(".list-card").css("background-color", '');
	};

	return self;
};