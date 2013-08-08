// Trello Stoires
var TrelloObject = function() {
	var self = this;
	self.Cards = [];
	self.Lists = [];
	self.Stories = [];

	var _loadTrello = function(){
		// Lists
		self.Lists = _loadLists();

		// Cards
		self.Cards = _loadCards();

		// Stories
		self.Stories = _loadStories();

		_loadAppEventListeners();
	};

	// loadCards - Loads the cards
	var _loadCards = function(){
		var Cards = [];
		$(".list-card a").each(function(i,e){
			var card = new Card($(e));
			Cards.push(card);
		});
		return Cards;
	};

	// loadLists - Load the lists
	var _loadLists = function(){
		var Lists = [];
		$(".list").each(function(i,e){
			var list = new List($(e));
			Lists.push(list);
		});
		return Lists;
	};

	// loadStories - Load the Stories
	var _loadStories = function(){
		var Stories = [];
		if(self.Cards === [])
			self.Cards = _loadCards();

		var storyCards = self.Cards.filter(function(i){return (i.storyID!==null && i.type==='Stories')});
		for(index in storyCards) {
			var storyCard = storyCards[index];
			var story = new Story(storyCard, self.Cards);
			Stories.push(story);
		}
		return Stories;
	};

	// loadAppEventListeners - initiates listening for app commands
	var _loadAppEventListeners = function(){
		//MarkTasks - used to mark all the tasks assosiated with a story
		$(document).on("MarkTasks", function(event, element){
			
		});
	};

	_loadTrello();

	return self;
}