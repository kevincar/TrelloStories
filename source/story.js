var Story = function(card, cards){
	var self = this;

	var _getTasks = function(){
		var storyTaskCards = cards.filter(function(i){return (i.type=="Tasks" && i.storyID==card.storyID);});
		return storyTaskCards;
	};


	self.storyCard = card;
	self.storyID = card.storyID;
	self.taskCards = _getTasks();
	self.completedTaskList = 'Ready for QA';

	self.markTasks = function(){
		for(var index in self.taskCards) {
			var card = self.taskCards[index];
			$(card.el).css('background-color', 'pink');
		}
	};

	self.applyActions = function() {
		var card = self.storyCard;
		$('[storyid='+card.storyID+']').on('click', '.js-card-menu', function(){
			setTimeout(function(){
				$('[data='+card.cardID+'].js-convert-checklists').remove();
				var actions = $('.pop-over').find('ul').eq(0);
				var actionMarkTasks = "<li><a class='js-mark-story-tasks' data='"+card.storyID+"'>Mark Tasks.</a></li>";
				$(actions).append(actionMarkTasks);
				var actionIsComplete = "<li><a class='js-is-story-complete' data='"+card.storyID+"'>Check Completion.</a></li>";
				$(actions).append(actionIsComplete);
			}, 50);
		});
		$(document).on('click', '[data='+card.storyID+'].js-convert-checklists', _convertChecklistsToCards);
		$(document).on('click', '[data='+card.storyID+'].js-mark-story-tasks', _handlerMarkTasks);
		$(document).on('click', '[data='+card.storyID+'].js-is-story-complete', _handlerIsComplete);
	};

	self.applyID = function(){
		var card = self.storyCard;
		$(card.el).closest('.list-card').attr('storyID', card.storyID);
	};

	var _convertChecklistsToCards = function(){
		var checkLists = self.storyCard.data.idChecklists;
		for(var index in checkLists)
			window._trello.convertChecklistToCards(checkLists[index],self.storyID);
	}
	var _handlerMarkTasks = function(event) {
		for(var cardIndex in cards) {
			var card = cards[cardIndex];
			card.removeHighlight();
		}
		for(cardIndex in self.taskCards) {
			var card = self.taskCards[cardIndex];
			card.highlight();
		}
		$(".pop-over").hide();
	};

	var _handlerIsComplete = function(event) {
		var readyTasks = cards.filter(function(i){return i.listName === 'Ready for QA'});
		var storyTasksReady = readyTasks.filter(function(i){return i.storyID === self.storyID});
		var numStoryTasksReady = storyTasksReady.length;
		var numStoryTasks = self.taskCards.length;
		var isCompleted = numStoryTasksReady === numStoryTasks;
		if(isCompleted)
			self.storyCard.highlight('lightgreen', true);
		else
			self.storyCard.highlight('pink', true)
		$(".pop-over").hide();
	};

	var _isComplete = function(){
		var numCompletedTasks = self.taskCards.filter(function(i){return i.listName === self.completedTaskList}).length;
		var numStoryTasks = self.taskCards.length;
		var isCompleted = (numStoryTasks === numCompletedTasks) && numStoryTasks > 0;
		if(isCompleted)
			self.storyCard.highlight('pink');
		else
			self.storyCard.removeHighlight();
	};

	var _watchTasks = function(seconds){
		var time = seconds * 1000;
		return setInterval(function(){_isComplete();}, time);
	};

	self.applyID();
	self.applyActions();
	self.watchID = _watchTasks(5);

	return self;
};