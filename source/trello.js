// Trello Stoires
var TrelloObject = function(callback) {
	var self = this;
	self.Cards = {};
	self.Lists = {};
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
				 _watchForCardChanges();
			}
	};

	// loadCards - Loads the cards
	var _loadCards = function(){
		var Cards = [];
		if(self._trello.authorized())
		{
			self._trello.rest("GET","board/"+self.board+"/cards"
				,function(cards){
					for(var index in cards) {
						var card = new Card(cards[index]);
						Cards[card.data.id] = card;
					}
				}
				,self.errorHandler.ajaxError
			);
			_watchForCardChanges();
		}
		else
		console.log("nope");
		return Cards;
	};

	// loadLists - Load the lists
	var _loadLists = function(){
		var Lists = [];
		if(self._trello.authorized())
			self._trello.boards.get(self.board+"/lists"
			,function(lists){
				for(var index in lists) {
					var list = new List(lists[index]);
					Lists[list.listData.id] = list;
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

		for(var index in self.Cards) {
			if(self.Cards[index].storyID !== null && self.Cards[index].type === 'Stories'){
				var storyCard = self.Cards[index];
				var story = new Story(storyCard, self.Cards);
				Stories.push(story);
			}
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

	// Trello may be cancelling any request from here. We actually may NEED the background script 
	// to comunicate more thoroughly 
	// We actually might not need this, nor the background script.
	// var _watchTrello = function(){
	// 	// Send a message to the background to begin watching for URL changes
	// 	chrome.runtime.sendMessage({request: "StartWatch"}, function(response){
	// 		if(response.response !== 'success') {
	// 			console.log("_watch Trello Failed...");
	// 		}
	// 	});

	// 	// Listen for incoming messages from our background script
	// 	chrome.runtime.onMessage.addListener(function(request, sender, sendResponse){
			
	// 		// Send Back a success Response.
	// 		sendResponse({response: 'success'});
			
	// 		var url = request.url;

	// 		var boardID = urlGet('b');
	// 		// Try to get a cardID
	// 		var cardID = urlGet('c');

	// 		if(cardID !== undefined) {
	// 			var selectedCard = self.Cards.filter(function(card){return card.data.shortLink === cardID;})[0];
	// 			selectedCard.selected = true;
	// 		}
	// 		else if(boardID !== undefined)
	// 			_deselectCards();

	// 	});
	// };

	var _deselectCards = function(){
		var selectedCards = self.Cards.filter(function(card){return card.selected;});
		for(var sci in selectedCards) {
			var selectedCard = selectedCards[sci];
			selectedCard.selected  = false;
		}
	};

	var _watchForCardChanges = function(){
		
	};

	self.convertChecklistToCards = function(checkListId){
		if(self._trello.authorized())
		{
			var checklistInfo = JSON.parse(self._trello.checklists.get(checkListId).responseText);
			var moveToListName = checklistInfo.name;
			moveToListName = moveToListName.match(/.*\[(.*)\].*/)[1];
			var moveToListId = null;
			for(var index in self.Lists){
				if(self.Lists[index].listData.name === moveToListName){
					moveToListId = index;
				}
			}
			if(moveToListId != null){
				for(var item in checklistInfo.checkItems){
					itemInfo = checklistInfo.checkItems[item];
					originCard = self.Cards[checklistInfo.idCard];
					var storyId = null;
					if(arguments.length > 1)
						storyId = arguments[1];
					self.createCard(moveToListId,{name:((storyId!=null)?storyId+" ":"")+itemInfo.name,desc:"**Parent Card:** `"+originCard.name+"`\n**Parent List:** `"+originCard.listText+"`\n\n---"});
				}
			}
		}
	}

	self.createCard = function(listId, cardData){
		if(self._trello.authorized())
		{
			//card data should {name:value[,desc:value]}
			var cardInfo = JSON.parse(self._trello.post("lists/"+listId+"/cards",cardData).responseText);
			self.Cards[cardInfo.id] = new Card(cardInfo);
			return cardInfo.id;
		}
		return null;
	}

	self._trello.authorize({
				type:"popup",
				name:"TrelloStories",
				scope : {read:true,write:true},
				expiration: "never",
				success: function(){
					_loadTrello(null,true);
					callback(self);
				}
			});;	
}