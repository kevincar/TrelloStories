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
		self.requestLogger = [];

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
			moveToListName = moveToListName.match(/.*\[(.*)\].*/);
			moveToListName = moveToListName?moveToListName[1]:null;
			var listArray = Object.keys(self.Lists).map(function(key){return self.Lists[key];});
			var moveToListId = listArray.filter(function(i){return i.listData.name === moveToListName});
			moveToListId = moveToListId?moveToListId[0].listData.id:null;
			// for(var index in self.Lists){
			// 	if(self.Lists[index].listData.name === moveToListName){
			// 		moveToListId = index;
			// 	}
			// }
			if(moveToListId !== null && moveToListId.length>0){
				for(var item in checklistInfo.checkItems){
					itemInfo = checklistInfo.checkItems[item];
					originCard = self.Cards[checklistInfo.idCard];
					var storyId = originCard.storyID;
					if(arguments.length > 1)
						storyId = arguments[1];
					self.createCard(moveToListId,storyId,{name:((storyId!=null)?storyId+" ":"")+itemInfo.name,desc:"**Parent Card:** `"+originCard.name+"`\n**Parent List:** `"+originCard.listText+"`\n\n---"});
				}
			}
			else {
				console.log("Failed to find list to create cards in.");
			}
		}
	};

	TrelloObject.prototype.createCard = function(listId, storyId, cardData){
		var self = this;
		if(self._trello.authorized())
		{
			//card data should {name:value[,desc:value]}
			var cardInfo = JSON.parse(self._trello.post("lists/"+listId+"/cards",cardData).responseText);
			self.Cards[cardInfo.id] = new Card(cardInfo);
			if(storyId !== null) {
				var storyCard = self.Stories.filter(function(i){return i.storyID == storyId;});
				storyCard = storyCard.length>0?storyCard[0]:null;
				storyCard.taskCards.push(self.Cards[cardInfo.id]);
			}
			return cardInfo.id;
		}
		return null;
	};

	// Delete a card
	TrelloObject.prototype.deleteCard = function(card) {
		var self = this;
		if(self._trello.authorized()) {
			var response = JSON.parse(self._trello.delete("cards/"+card.data.id).responseText);
			delete self.Cards[card.data.id];
		}
		return null;
	}

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
			// Log the request (NO multiples)
			// var alreadyRequested = self.requestLogger.indexOf(request.requestId) !== -1;
			// if(alreadyRequested)
			// 	return false;

			// self.requestLogger.push(request.requestId);
			console.log(window.r = request);
			
			// Send Back a success Response.
			sendResponse({response: 'success'});
			
			// Parse Url! - Might want to make a funciton to handle this task
			var url = request.url,
				requestInfo = {
				board: urlGet('boards', url),
				card: urlGet('cards', url),
				checklist: urlGet('checklist', url),
				checkItem: urlGet('checkItem', url),
				actions: decodeURIComponent(urlGet('actions', url)),
				details: request
			};

			if(request.method === 'PUT' || request.method === 'POST') {
				_processChanges.apply(self, [requestInfo]);
			}

			if(request.method === 'GET') {
				_processRequest.apply(self, [requestInfo]);
			}

			if(request.method === 'DELETE') {
				_processDelete.apply(self, [requestInfo]);
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
			return true;
		}

		// Process for when Tasks are added to the checklist of a card.
		if(requestInfo.details.method === 'POST' &&
			!!requestInfo.checklist &&
			urlGet(requestInfo.checklist, requestInfo.details.url) === 'checkItem') {
			$(document).trigger('checkItemAdd', [self, requestInfo]);
			return true;
		}

		// Process for when checkItems are renamed
		// it would be better if we created more objects, like checklist objects and checkItem
		// objects that we could query instead of calling the API. that way the API would only
		// need to be called when to sync the data.
		if(requestInfo.details.method === 'PUT' &&
			!!requestInfo.checklist &&
			!!requestInfo.checkItem &&
			!!requestInfo.details.requestBody.formData.name) {
			var checklistData = JSON.parse(self._trello.checklists.get(requestInfo.checklist).responseText);
			var checkItemId = requestInfo.checkItem;
			var checkItem = checklistData.checkItems.filter(function(i){return i.id === checkItemId;});
			checkItem = checkItem.length>0?checkItem[0]:null;
			var cardsArray = Object.keys(self.Cards).map(function(key){return self.Cards[key];});
			var card = cardsArray.filter(function(i){return i.checkItemID == checkItem.id;});
			card = card.length>0?card[0]:null
			$(document).trigger('checkItemNameChange', [self, requestInfo, card]);
			return true;
		}

		// process for when task cards are renamed
		if(requestInfo.details.method === 'PUT' &&
			!!requestInfo.card &&
			!!requestInfo.details.requestBody.formData.name) {
			var cardsArray = Object.keys(self.Cards).map(function(key){return self.Cards[key];});
			var card = cardsArray.filter(function(i){return i.data.id == requestInfo.card});
			card = card.length>0?card[0]:null;
			$(document).trigger('cardNameChange', [self, requestInfo, card]);
		}
	}

	/**
	 * _processRequest - Processes GET requests
	 */
	function _processRequest(requestInfo) {
		var self = this;

		// Process for when cards are clicked on to edit them
		if(!!requestInfo.card && !!requestInfo.actions) {
			$(document).trigger("cardEdit", [self, requestInfo]);
		}
	}

	// process delete
	function _processDelete(requestInfo) {
		var self = this;

		// Process of when any checkItems are deleted
		if(!!requestInfo.checkItem) {
			// we need to be a bit more specific with Deletions. 
			// We must pass in needed information here since deletions could be processed
			// before the trigger is picked up, then id's will be usless.
			var checklistData = JSON.parse(self._trello.checklists.get(requestInfo.checklist).responseText);
			var checkItemId = requestInfo.checkItem;
			var checkItem = checklistData.checkItems.filter(function(i){return i.id === checkItemId;});
			checkItem = checkItem.length>0?checkItem[0]:null;
			$(document).trigger('checkItemDelete', [self, requestInfo, checkItem]);
		}

		// Process when any cards are deleted
		if(!!requestInfo.card && !urlGet(requestInfo.card, requestInfo.url)) {
			var cardsArray = Object.keys(self.Cards).map(function(key){return self.Cards[key];});
			var card = cardsArray.filter(function(i){return i.data.id === requestInfo.card;});
			card = card.length>0?card[0]:null
			$(document).trigger('cardDelete', [self, requestInfo, card]);
		}
	}

	/**
	 * _changeCardName - This can only be called when a card object requests it.
	 *                   This will change the name of a card
	 */
	 function _changeCardName(card, newName){
	 	var self = this;
	 	if(self._trello.authorized()){
	 		var jqXHR = self._trello.put('cards/'+card.data.id+'/name', {value: newName}),
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
