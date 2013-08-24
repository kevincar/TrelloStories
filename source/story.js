var Story; 

Story = (function(){

	/**
	 * Constructor
	 * @param - card
	 * @param - cards
	 */
	function Story(card, cards){

		// Initialize Variables
		var self = this;
		self.storyCard = card;
		self.cards = Object.keys(cards).map(function(key){return cards[key];});
		self.storyID = card.storyID;
		self.taskCards = _getTasks.apply(self);
		self.completedTaskList = 'Ready for QA';

		// Initializer Functions
		_applyID.apply(self);
		_initListeners.apply(self);
	}

	//========================================================================//
    //																		  //
    //							Public Functions							  //
    //																		  //
    //========================================================================//

	Story.prototype.markTasks = function(){
		var self = this;
		for(var index in self.taskCards) {
			var card = self.taskCards[index];
			$(card.el).css('background-color', 'pink');
		}
	};

    //========================================================================//
    //																		  //
    //							Private Functions							  //
    //																		  //
    //========================================================================//

	
	function _getTasks(){
		var self = this;
		var storyTaskCards = self.cards.filter(function(i){return (i.type=="Tasks" && i.storyID==self.storyCard.storyID);});
		return storyTaskCards;
	}

	function _applyID(){
		var self = this,
			card = self.storyCard;
		$(card.el).closest('.list-card').attr('storyID', card.storyID);
	};

	function _convertChecklistsToCards(){
		var self = this,
			checkLists = self.storyCard.data.idChecklists;
		for(var index in checkLists)
			window._trello.convertChecklistToCards(checkLists[index],self.storyID);
	}


	function _handlerIsComplete() {
		var self = this,
			readyTasks = self.cards.filter(function(i){return i.listName === 'Ready for QA'}),
			storyTasksReady = readyTasks.filter(function(i){return i.storyID === self.storyID}),
			numStoryTasksReady = storyTasksReady.length,
			numStoryTasks = self.taskCards.length,
			isCompleted = numStoryTasksReady === numStoryTasks;

		if(isCompleted)
			self.storyCard.highlight('lightgreen', true);
		else
			self.storyCard.highlight('pink', true)
		$(".pop-over").hide();
	}

	function _handlerMarkTasks() {
		var self = this,
			cardIndex, card;
		for(cardIndex in self.cards) {
			card = self.cards[cardIndex];
			card.removeHighlight();
		}
		for(cardIndex in self.taskCards) {
			card = self.taskCards[cardIndex];
			card.highlight();
		}
		$(".pop-over").hide();
	}

	function _isComplete(){
		var self = this,
			numCompletedTasks = self.taskCards.filter(function(i){return i.listName === self.completedTaskList}).length,
			numStoryTasks = self.taskCards.length,
			isCompleted = (numStoryTasks === numCompletedTasks) && numStoryTasks > 0;
			
		if(isCompleted)
			self.storyCard.highlight('pink');
		else
			self.storyCard.removeHighlight();
	}

	function applyOptions() {
		var self = this,
			card = self.storyCard;

		$('[data='+card.cardID+'].js-convert-checklists').remove();
		var actions = $('.pop-over').find('ul').eq(0),
			actionMarkTasks = "<li><a class='js-mark-story-tasks' data='"+card.storyID+"'>Mark Tasks.</a></li>",
			actionIsComplete = "<li><a class='js-is-story-complete' data='"+card.storyID+"'>Check Completion.</a></li>",
			actionConvertChecklists = "<li><a class='js-convert-checklists' data='"+card.cardID+"'>Checklists to Cards.</a></li>";

		$(actions).append(actionMarkTasks);
		$(actions).append(actionIsComplete);
		$(actions).append(actionConvertChecklists);
	}

	// effect the popOver's for different context. we may want to have applyOptions be called from here instead.
	function _processPopOverLoad(event, record) {
		var self = this;
		// Add actions for checkLists
		// Ensure that they're in edit mode
		if(urlGet('c')!==undefined) {
			// WE only want the content change and when it's getting loaded
			var display = $(".pop-over").attr("style").split(/[:;]\s?/gi).filter(function(v,k,a){return a[k-1]=='display';});
			var popOverTitle = $('.pop-over span.header-title').text();
			var popOverIsOpen = display.length>0?display=='block':false;
			var isCheckListPopOver = popOverTitle.indexOf('[')>-1;
			if(event.target == $(".pop-over .content")[0] && popOverIsOpen && isCheckListPopOver) {
				_applyChecklistOptions.apply(self);
			}
		}
	}

	// Called when needed to apply new options/actions to the checklist menu
	// Might be nice to create a popOverAction class that can handle stuff like this.
	function _applyChecklistOptions() {
		var self = this;
		var card = self.storyCard;
		var actions = $(".pop-over").find('ul').eq(0);
		var actionConvertChecklists = "<li><a class='js-convert-checklists' data='"+card.cardID+"'>Checklist To Cards</a></li>";

		$(actions).append(actionConvertChecklists);
	}

	// Adding a checklist auto
	function _addTaskFromCheckList(trello, requestInfo) {
		var self = this;

		// THIS card
		if(self.storyCard.data.id == requestInfo.card) {
			// Get data from the checklist
			var checkListData = JSON.parse(trello._trello.checklists.get("52145a84f68a4ae5690023c5").responseText);
			var destListName = checkListData.name.match(/.*\[(.*)\].*/);
			destListName = destListName?destListName[1]:null;
			var listArray = Object.keys(trello.Lists).map(function(key){return trello.Lists[key];});
			var destListId = listArray.filter(function(i){return i.listData.name === destListName});
			destListId = destListId.length>0?destListId[0].listData.id:null;
			if(destListId !== null){
				var mostRecentCheckItem = checkListData.checkItems.pop();
				var newCardName = self.storyID + " " + mostRecentCheckItem.name;
				var newCardData = {
					name: newCardName,
					desc: "**Parent Card:** `"+self.storyCard.name+"`\n**Parent List:** `"+self.storyCard.listText+"`\n\n---"
				};
				trello.createCard(destListId, self.storyID, newCardData);
			}
			else {
				console.error("Failed to add task from checklist: Couldn't find destination list name in checklist name.");
			}
		}
	}

	// Delete a card after a task was deleted
	function _deleteTaskFromCheckList(trello, requestInfo, checkItem) {
		var self = this;

		// THIS card
		if(self.storyCard.data.id == requestInfo.card && checkItem) {
			var cardsArray = Object.keys(trello.Cards).map(function(k){return trello.Cards[k];});
			var card = cardsArray.filter(function(i){return i.name === checkItem.name;});
			card = card.length>0?card[0]:null;
			if(card) {
				trello.deleteCard(card);
			}
		}
	}

    //========================================================================//
    //																		  //
    //							Event Listeners 							  //
    //																		  //
    //========================================================================//

    function _initListeners(){
    	var self = this,
    		card = self.storyCard;

    	// New Options for cards. Watch for interaction on the popup.
    	$('.pop-over').on('click', '[data='+card.storyID+'].js-convert-checklists', function(){_convertChecklistsToCards.apply(self);});
		$('.pop-over').on('click', '[data='+card.storyID+'].js-is-story-complete', function(){_handlerIsComplete.apply(self);});
		$('.pop-over').on('click', '[data='+card.storyID+'].js-mark-story-tasks', function(){_handlerMarkTasks.apply(self);});

		// Watch for checkListItems added to this story card. Wait till the post is clear.
		$(document).on('checkItemAdd', function(event, trello, requestInfo){setTimeout(function(){_addTaskFromCheckList.apply(self, [trello, requestInfo]);}, 100);});

		// Watch for checkItem deletiongs on this card. 
		$(document).on('checkItemDelete', function(event, trello, requestInfo, checkItem){_deleteTaskFromCheckList.apply(self, [trello, requestInfo, checkItem]);});
		$(document).on('click', '.js-delete-item', function(){console.log("Checklist item delete button pressed!");});

		// DOM Manipulators
    	// Watch for Card Option Clicks. Ensure to load them once the Menu is loaded
    	$('[storyid='+self.storyID+']').on('click', '.js-card-menu', function(){setTimeout(function(){applyOptions.apply(self);}, 50);});
    	$('.pop-over').on('contentChange', function(event, record){_processPopOverLoad.apply(self, arguments);});
    	// $(document).on('click', '.js-open-check-list-menu', function(){console.log("HEY");});
    	
    	// Listens for completed Tasks.
    	self.watchID = _watchTasks.apply(self, [5]);
    }

	var _watchTasks = function(seconds){
		var self = this,
			time = seconds * 1000;
		return setInterval(function(){_isComplete.apply(self);}, time);
	};

	return Story;
})();