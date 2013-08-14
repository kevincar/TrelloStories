// Trello Stoires
var TrelloObject = function(callback) {
	var self = this;
	self.Cards = [];
	self.Lists = [];
	self.Stories = [];
	// self.appKey = "1e9099f8056922e2437ec2a600e0c2a1";
	self.appToken = '';
	self.authenticated = false;
	self.board = '';
	// self.REST = 'https://api.trello.com/1/';
	self.errorHandler = new ErrorHandler();
	self._trello = Trello;

	var _loadTrello = function(error, result){
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

				//Watch Trello
				_watchTrello();
			}
	};

	// loadCards - Loads the cards
	var _loadCards = function(){
		var Cards = [];
		if(self._trello.authorized())
		self._trello.rest("GET","boards/"+self.board+"/cards"
			,function(cards){
				for(var index in cards) {
						var card = new Card(cards[index]);
						Cards.push(card);
				}
			}
			,self.errorHandler.ajaxError
		)
	else
		console.log("nope");
		return Cards;
	};

	// loadLists - Load the lists
	var _loadLists = function(){
		var Lists = [];
		if(self._trello.authorized())
		self._trello.rest("GET","boards/"+self.board+"/lists"
			,function(lists){
				for(var index in lists) {
					var list = new List(lists[index]);
					Lists.push(list);
				}
			}
			,self.errorHandler.ajaxError
		)
	else
		console.log("nope");
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
		var boardID = urlGet('b');
		if(boardID === undefined) {
			var cardID = urlGet('c');
			self._trello.rest('GET', 'cards/'+cardID+'/board/shortLink', function(shortLink){
				boardID = shortLink._value;
			}, self.errorHandler.ajaxError);
		}
		return boardID;
	};

	var _watchTrello = function(){
		chrome.webRequest.onCompleted.addListener(function(details){
			console.log(details);
		});
	};

	self._trello.authorize({
				type:"popup",
				name:"TrelloStories",
				scope : {read:true,write:true},
				expiration: "never",
				success: function(){
					_loadTrello(null,true);
					callback({Cards: self.Cards,Lists: self.Lists,Stories: self.Stories});
				}
			});;	
}