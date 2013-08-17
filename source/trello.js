// Trello Stoires
var TrelloObject;


// Class TrelloObject
TrelloObject = (function() {

    /**
     * Constructor
     * @param callback - Function that will be called when the object is finished contructing
     *                   The first parameter will be an error (if it errored) and the second
     *                   will be a boolean value (true) on success.
     */
    function TrelloObject(callback) {

    	// Initialize Variables
    	var self = this;
		self.Cards = {};
		self.Lists = {};
		self.Stories = [];
		self.appToken = '';
		self.authenticated = false;
		self.board = '';
		self.view = '';
		self.errorHandler = new ErrorHandler();
		self._trello = Trello;

		// Authorize
		self._trello.authorize({
			type:"popup",
			name:"TrelloStories",
			scope : {read:true,write:true},
			expiration: "never",
			success: function(){
				self.authenticated = true;
				_loadTrello.apply(self);
				callback(self);
			}
		});

		return self;
    }


    //========================================================================//
    //																		  //
    //							Public Functions							  //
    //																		  //
    //========================================================================//

	TrelloObject.prototype.convertChecklistToCards = function(checkListId){
		var self = this;
		if(self._trello.authorized())
		{
			var checklistInfo = JSON.parse(self._trello.checklists.get(checkListId).responseText);
			var moveToListName = checklistInfo.name;
			moveToListName = moveToListName.match(/.*\[(.*)\].*/)[1];
			var listArray = Object.keys(self.Lists).map(function(key){return self.Lists[key];});
			var moveToListId = listArray.filter(function(i){return i.listData.name === moveToListName});
			// for(var index in self.Lists){
			// 	if(self.Lists[index].listData.name === moveToListName){
			// 		moveToListId = index;
			// 	}
			// }
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
	};

	TrelloObject.prototype.createCard = function(listId, cardData){
		var self = this;
		if(self._trello.authorized())
		{
			//card data should {name:value[,desc:value]}
			var cardInfo = JSON.parse(self._trello.post("lists/"+listId+"/cards",cardData).responseText);
			self.Cards[cardInfo.id] = new Card(cardInfo);
			return cardInfo.id;
		}
		return null;
	};

	/**
	 * setOutstandingStoires - Sets which list to set as the start for stories in a sprint
	 *						   This sets up a listener on that list so that cards moved into
	 * 						   that list become stories.
	 */
	TrelloObject.prototype.setOutstandingStories = function(listName) {
		var self = this,
			listArray = Object.keys(self.Lists).map(function(key){return self.Lists[key];}),
			list = listArray.filter(function(i){return i.name == listName}),
			list = list.length>0?list[0]:null;

		if(!list) {
			return console.log("Could not find the list with the name: "+listName);
		}

		list.setOutstandingStories();
	};

    //========================================================================//
    //																		  //
    //							Private Functions							  //
    //																		  //
    //========================================================================//

    /**
     * _loadTrello - Private Function. Main function to initialize Variables within our main TrelloObject
     */
	function _loadTrello(){
		var self = this;

		// Load Boards
		self.board = _loadBoard.apply(self);

		// Lists
		self.Lists = _loadLists.apply(self);

		// Cards
		self.Cards = _loadCards.apply(self);

		// Stories
		self.Stories = _loadStories.apply(self);

		// Listeners
		_initListeners.apply(self);
	}

	/**
	 * _loadBoard - Loads the board information into the TrelloObject
	 * @return - Returns the ID of the current Board.
	 */
	function _loadBoard(){
		var self = this,
			boardID = urlGet('b');
			
		self.view = 'b';
		if(boardID === undefined) {
			var cardID = urlGet('c');
			self.view = 'c';
			self._trello.rest('GET', 'cards/'+cardID+'/board/shortLink', function(shortLink){
				boardID = shortLink._value;
			}, self.errorHandler.ajaxError);
		}
		return boardID;
	}

	/**
	 * _loadLists - Loads all the information for Lists of the current board into the Trello Object
	 * @return - Returns an array of Objects for each List
	 */
	function _loadLists(){
		var self = this,
			Lists = {};
		if(self._trello.authorized())
			self._trello.boards.get(self.board+"/lists", function(lists){
				for(var index in lists) {
					var list = new List(lists[index]);
					Lists[list.listData.id] = list;
				}
			},self.errorHandler.ajaxError);
		else
			console.log("nope");
		
		return Lists;
	}

	/**
	 * _loadCards - Loads all the information for the Cards of the current board into the TrelloObject
	 * @return - returns an array of Card Objects for each card.
	 */
	function _loadCards(){
		var self = this,
			Cards = {};
		if(self._trello.authorized())
		{
			self._trello.rest("GET","board/"+self.board+"/cards", function(cards){
				for(var index in cards) {
					var card = new Card(cards[index]);
					Cards[card.data.id] = card;
				}
			},self.errorHandler.ajaxError);
		}
		else
			console.log("nope");

		return Cards;
	}


	/**
	 * _loadStories - Private Funciton that loads all the information for the cards of the current board into the Trello Object
	 * @return - returns an array of Card objects for every Story Card in the board.
	 */
	function _loadStories(){
		var self = this,
			Stories = [];
		if(self.Cards === [])
			self.Cards = _loadCards();

		for(var index in self.Cards) {
			var card = self.Cards[index];
			if(card.storyID !== null && card.type === 'Stories'){
				var storyCard = self.Cards[index];
				var story = new Story(storyCard, self.Cards);
				Stories.push(story);
			}
		}
		return Stories;
	}

	/**
	 * _initMessages - Initialized the Messaging system between the backend of the
	 *                 extension and the content scripts
	 */
	function _initMessages(){
		var self = this;
		// Send a message to the background to begin watching for URL changes
		chrome.runtime.sendMessage({request: "initMessages"}, function(response){
			if(typeof response === 'undefined' ? true : response.response !== 'success') {
				console.log("Failed to initiate Messaging system with the extension background.");
			}
		});

		// Listen for incoming messages from our background script
		chrome.runtime.onMessage.addListener(function(request, sender, sendResponse){
			
			// Send Back a success Response.
			sendResponse({response: 'success'});
			
			// Parse Url! - Might want to make a funciton to handle this task
			var url = request.url,
				requestInfo = {
				board: urlGet('boards', url),
				card: urlGet('cards', url),
				actions: decodeURIComponent(urlGet('actions', url)),
				details: request
			};

			if(request.method === 'PUT' || request.method === 'POST') {
				_processChanges.apply(self, [requestInfo]);
			}
		});
	}

	/**
	 * _processChanges - The function should only be called when changes occur on the board
	 *                   that require AJAX calls to the Trello API. This is to process those
	 *                   changes for further use in this extension, such as tracking cards
	 *					 across lists and other various changes.
	 *                   This function should only trigger events that other objects can 
	 *                   handle where appropriate to avoid tangling responsibilites.
	 */
	function _processChanges(requestInfo) {
		var self = this;

		// Process for when cards are moved across lists.
		if(requestInfo.details.method === 'PUT' && 
			!!requestInfo.card && 
			!!requestInfo.details.requestBody.formData.idList
			&& !!requestInfo.details.requestBody.formData.pos) {
			$(document).trigger('cardMove', [self, requestInfo]);
		}
	}

	/**
	 * _changeCardName - This can only be called when a card object requests it.
	 *                   This will change the name of a card
	 */
	 function _changeCardName(card, newName){
	 	var self = this;
	 	if(self._trello.authorized()){
	 		var jqXHR = self._trello.put('cards/'+card.data.shortLink+'/name', {value: newName}),
	 			cardInfo = JSON.parse(jqXHR.responseText);

	 		self.data = cardInfo;
 			self.name = cardInfo.name;
 			return true;
	 	}
	 	return false;
	 }

    //========================================================================//
    //																		  //
    //							Event Listeners 							  //
    //																		  //
    //========================================================================//

    /**
     * _initListeners - Normally Individual objects should container their own event listeners.
     *                  In the event that creating an event listener on the cards/stories/lists/etc.
     *                  is too invovled or complicatedwe can create specail event listeners that 
     *                  the TrelloObject will manage and can then fire triggers that the Objects can catch.
     */
    function _initListeners() {
    	var self = this;

    	// Listen for requests to change Card Names
    	$(document).on("cardNameChange", function(event, card, newName){_changeCardName.apply(self, [card, newName]);});

    	// Background messaging system
	    // This Background messaging system will allow us to catch, log, and respond to AJAX requests
	    // This means we can watch for any and all changes made to all boards, lists, and cards.
    	_initMessages.apply(self);
    }


    
    return TrelloObject;
})();
