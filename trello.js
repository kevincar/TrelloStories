// Trello Stoires
var TrelloObject = function() {
	var self = this;
	self.Cards = [];
	self.Lists = [];
	self.Stories = [];
	self.appKey = "1e9099f8056922e2437ec2a600e0c2a1";
	self.appToken = '';
	self.authenticated = false;
	self.board = '';
	self.REST = 'https://api.trello.com/1/';
	self.errorHandler = new ErrorHandler();

	var _loadTrello = function(){
		// Authenticate
		_authenticate(function(error, result){
			if(error)
				alert(error);
			else{
				self.authenticated = result;
				self.board = _loadBoard();

				// Lists
				self.Lists = _loadLists();

				// Cards
				self.Cards = _loadCards();

				// Stories
				self.Stories = _loadStories();
			}
		});

		// _loadAppEventListeners();
	};

	// loadCards - Loads the cards
	var _loadCards = function(){
		var Cards = [];
		$.ajax({
			async: false,
			type: 'GET',
			url: self.getAPIRequest('boards/'+self.board+'/cards'),
			error: self.errorHandler.ajaxError,
			success: function(data, textStatus, jqXHR) {
				for(var cardDataIndex in data) {
					var cardData = data[cardDataIndex];
					var card = new Card(cardData);
					Cards.push(card);
				}
			}
		});
		return Cards;
	};

	// loadLists - Load the lists
	var _loadLists = function(){
		var Lists = [];
		$.ajax({
			async: false,
			type: 'GET',
			url: self.getAPIRequest('boards/'+self.board+'/lists'),
			error: self.errorHandler.ajaxError,
			success: function(data, textStatus, jqXHR) {
				for(var listDataIndex in data){
					var listData = data[listDataIndex];
					var list = new List(listData);
					Lists.push(list);
				}
			}
		});
		return Lists;
	};

	// loadStories - Load the Stories
	var _loadStories = function(){
		var Stories = [];
		if(self.Cards === [])
			self.Cards = _loadCards();

		var storyCards = self.Cards.filter(function(i){return (i.storyID!==null && i.type==='Stories')});
		for(var index in storyCards) {
			var storyCard = storyCards[index];
			var story = new Story(storyCard, self.Cards);
			Stories.push(story);
		}
		return Stories;
	};

	// loadBoard - load the trello board
	var _loadBoard = function(){
		var path = window.location.pathname;
		var trelloInfo = path.match(/\/(\w)\/(\w*)\/(.*)/i);
		if(trelloInfo){
			var isBoard = trelloInfo[1]==='b';
			if(isBoard)
				return trelloInfo[2];
		}
	};

	// Authenticating The App Token
	var _authenticate = function(callback){
		chrome.storage.sync.get("trelloUserToken", function(items){
			if(typeof items.trelloUserToken !== 'undefined') {
				var token = items.trelloUserToken;
				self.appToken = token;
				callback(null, true);
			}
			else {
				callback("User Token has not been set. Please set the user token in the extension.");
			}
		});
	};

	// loadAppEventListeners - initiates listening for app commands
	var _loadAppEventListeners = function(){
		//MarkTasks - used to mark all the tasks assosiated with a story
		$(document).on("MarkTasks", function(event, element){
			
		});

		// $(document).on("authenticate", _authenticate);
	};

	self.getAPIRequest = function(url){
		return self.REST+url+"?key="+self.appKey+"&token="+self.appToken;
	};

	_loadTrello();

	return {
		Cards: self.Cards,
		Lists: self.Lists,
		Stories: self.Stories
	};
}