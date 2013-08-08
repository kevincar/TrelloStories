var Story = function(card, cards){
	var self = this;

	var _getTasks = function(){
		var storyTaskCards = cards.filter(function(i){return (i.type=="Tasks" && i.storyID==card.storyID);});
		return storyTaskCards;
	};


	self.storyCard = card;
	self.storyID = card.storyID;
	self.taskCards = _getTasks();

	self.markTasks = function(){
		for(var index in self.taskCards) {
			var card = self.taskCards[index];
			$(card.el).css('background-color', 'pink');
		}
	};

	self.applyActions = function() {
		var card = self.storyCard;
		$('[storyid='+card.storyID+']').on('click', '.js-card-menu', function(){
			var actions = $('.pop-over').find('ul').eq(0);
			var actionMarkTasks = "<li><a class='js-mark-story-tasks' data='"+card.storyID+"'>Mark Tasks...</a></li>";
			$(actions).append(actionMarkTasks);
			var actionIsComplete = "<li><a class='js-is-story-complete' data='"+card.storyID+"'>Is Completed?...</a></li>";
			$(actions).append(actionIsComplete);
			// $('.pop-over').show();
		});
		$(document).on('click', '[data='+card.storyID+'].js-mark-story-tasks', _handlerMarkTasks);
		$(document).on('click', '[data='+card.storyID+'].js-is-story-complete', _handlerIsComplete);
	};

	self.applyID = function(){
		var card = self.storyCard;
		$(card.el).closest('.list-card').attr('storyID', card.storyID);
	};

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

	self.applyID();
	self.applyActions();

	return self;
};