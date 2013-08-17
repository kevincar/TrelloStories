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

		// DOM Manipulators
    	// Watch for Card Option Clicks. Ensure to load them once the Menu is loaded
    	$('[storyid='+self.storyID+']').on('click', '.js-card-menu', function(){setTimeout(function(){applyOptions.apply(self);}, 50);});
    	
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