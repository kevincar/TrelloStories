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
		self.trelloObject = null;

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

	Story.prototype.setStoryID = function(storyID) {
		var self = this;
		var storyID = parseInt(storyID);
		storyID = '00' + storyID;
		storyID = storyID.length>3?storyID.substring(storyID.length-3):storyID;

		// Update Trello.stories
		// Remove the story 
		self.trelloObject.Stories = self.trelloObject.Stories.filter(function(i){return i.storyID !== self.storyID;});
		// reset the story card ID
		self.storyCard.setStoryID(storyID);
		self.storyID = storyID;
		// Add the story
		self.trelloObject.Stories.push(self);
	

		//change all Task card names and ID's to reflect the change 
		var taskCards = self.taskCards;
		for(var taskCardIndex in taskCards) {
			var taskCard = taskCards[taskCardIndex];
			taskCard.setStoryID(storyID);
		}
		return true;
	};

	Story.prototype.removeTask = function(cardid) {
		var self = this;
		var taskCard = self.taskCards.filter(function(i){return i.data.id === cardid;});
		taskCard = taskCard.length>0?taskCard[0]:null;
		if(!taskCard)
			return console.error("Card "+cardid+" is not a task of story "+self.storyID);


		// Remove the checkItem from the Story Card
		self.removeTaskCheckItem(cardid);
		// Remove the story ID from the card name
		taskCard.removeFromStory();
		// Remove from task list
		self.taskCards = self.taskCards.filter(function(i){return i.data.id !== cardid;});
	};

	Story.prototype.removeTaskCheckItem = function(cardid) {
		var self = this,
			taskCheckItem = _getTaskCheckItem.apply(self, [cardid]),
			checkItem = taskCheckItem;
		var checkListID = checkItem.checkListID;
		if(self.trelloObject._trello.authorized()) {
			var data = {
				idCheckItem: checkItem.id
			};
			var jqXHR = self.trelloObject._trello.delete("checklists/"+checkListID+"/checkItems/"+checkItem.id, data);
			return JSON.parse(jqXHR.responseText);
		}
	};

	Story.prototype.addTaskCheckItem = function(cardid) {
		var self = this,
			checklists = _getStoryCheckLists.apply(this);

		//get the first checklsit
		var checklist = checklists[0];
		
		// Make sure that the checkItem doesn't already exist
		var checkItems = JSON.parse(self.trelloObject._trello.get("checklists/"+checklist.id+"/checkItems").responseText);
		var checkItem = checkItems.filter(function(i){return i.id === self.trelloObject.Cards[cardid].checkItemID;});
		checkItem = checkItem.length>0?checkItem[0]:null;
	
		//add the checklist
		if(self.trelloObject._trello.authorized() && !checkItem) {
			var checkItemData = {
				name: self.trelloObject.Cards[cardid].name
			};
			var response = JSON.parse(self.trelloObject._trello.post("checklists/"+checklist.id+"/checkItems", checkItemData).responseText);
			response.checkListID = checklist.id;
			return response;
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
		// Fix the cards so that they have checkItemIDs
		// this needs to be improved so it's not so specific
		var storyCheckLists = JSON.parse(Trello.get("cards/"+self.storyCard.data.id+"/checklists").responseText);
		var storyCheckItems = storyCheckLists.map(function(checkList){var checkItems = checkList.checkItems;for(var i in checkItems){var checkItem = checkItems[i]; return checkItem}});
		for(var indexA in storyCheckLists) {
			var checkList = storyCheckLists[indexA];
			var checkListItems = checkList.checkItems;
			for(var indexB in checkListItems) {
				var checkItem = checkListItems[indexB];
				for(var indexC in storyTaskCards) {
					var storyTaskCard = storyTaskCards[indexC];
					if(checkItem.name === storyTaskCard.name){
						storyTaskCard.checkItemID = checkItem.id;
						storyTaskCard.checkListID = checkList.id;
					}
				}
			}
		}
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

	function _getTaskCheckItem(cardid) {
		var self = this;

		var taskCard = self.taskCards.filter(function(i){return i.data.id === cardid;});
		taskCard = taskCard.length>0?taskCard[0]:null;
		if(!taskCard)
			return console.error("No task with the id of "+cardid+" exists in story "+self.storyID);

		var storyCheckItems = _getStoryCheckItems.apply(self);
		var checkItemID = taskCard.checkItemID;
		var checkItem = storyCheckItems.filter(function(i){return i.id == checkItemID;});
		checkItem = checkItem.length>0?checkItem[0]:null;

		if(!checkItem)
			return console.error("No checkItem with the id of "+checkItemID+" exists in story "+self.storyID);

		return checkItem;
	}

	function _getStoryCheckItems() {
		var self = this;

		// if(!self.storyCheckItems) {
			var storyCheckLists = _getStoryCheckLists.apply(self);
			self.storyCheckItems = [];
			for(var storyCheckListsIndex in storyCheckLists) {
				var checkList = storyCheckLists[storyCheckListsIndex];
				for(checkItemIndex in checkList.checkItems) {
					var checkItem = checkList.checkItems[checkItemIndex];
					checkItem.checkListID = checkList.id;
					self.storyCheckItems.push(checkItem);
				}
			}
		// }

		return self.storyCheckItems;
	}

	function _getStoryCheckLists() {
		var self = this;

		// if(!self.storyCheckLists)
			self.storyCheckLists = JSON.parse(self.trelloObject._trello.get('cards/'+self.storyCard.data.id+'/checklists').responseText);

		return self.storyCheckLists;
	}

	// Adding a checklist auto
	function _addTaskFromCheckList(trello, requestInfo) {
		var self = this;

		// THIS card
		if(self.storyCard.data.id == requestInfo.card) {
			// Get data from the checklist
			var checkListData = JSON.parse(trello._trello.checklists.get(requestInfo.checklist).responseText);
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
				var newCardId = trello.createCard(destListId, self.storyID, newCardData);
				trello.Cards[newCardId].checkItemID = mostRecentCheckItem.id;
				trello.Cards[newCardId].checkListID = checkListData.id;
				trello.Cards[newCardId].trelloObject = self.trelloObject;
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
				self.taskCards = self.taskCards.filter(function(i){return i.data.id !== card.data.id;});
			}
		}
	}

	// Delete a checkItem after the corresponding task(card) is deleted
	function _deletedCard(trello, requestInfo, card) {
		var self = this;

		// THIS card
		if(self.storyID === card.storyID && card) {
			var storyCheckLists = JSON.parse(trello._trello.get("cards/"+self.storyCard.data.id+"/checklists").responseText);
			var allCheckItems = storyCheckLists.map(function(checkList){for(i in checkList.checkItems){checkList.checkItems[i]['checkListId'] = checkList.id;return checkList.checkItems[i];}});
			var checkItemToDelete = allCheckItems.filter(function(i){return i.name == card.name;});
			checkItemToDelete = checkItemToDelete.length>0?checkItemToDelete[0]:null;
			if(trello._trello.authorized() && checkItemToDelete){
				var response = JSON.parse(trello._trello.delete("checklists/"+checkItemToDelete.checkListId+"/checkItems/"+checkItemToDelete.id).responseText);
				self.taskCards = self.taskCards.filter(function(i){return i.data.id !== card.data.id;});
			}
		}
	}

	// Used for when a checkItem is renamed so that the card(task) will be synced
	function _renameTaskCard(trello, requestInfo, card) {
		var self = this;

		// THIS card
		if(self.storyCard.data.id === requestInfo.card && card) {
			var newCheckItemName = requestInfo.details.requestBody.formData.name[0];
			var newCardName = self.storyID + " " + newCheckItemName;
			if(trello._trello.authorized()) {
				card.setName(newCardName);
				// Replace the card with the updated one.
				self.taskCards = self.taskCards.filter(function(i){return i.data.id !== card.data.id;});
				self.taskCards.push(card);
			}
		}
	}

	// Used for when a task card is renamed so the checkItem will be synced
	function _renameTaskCheckItem(trello, requestInfo, card) {
		var self = this;

		// THIS card
		if(self.storyID === card.storyID) {
			var checkItem
			if(trello._trello.authorized()) {
				var newName = requestInfo.details.requestBody.formData.name[0].match(/[0-9][0-9][0-9]\s(.*)/)[1];
				var checkItemData = {
					idChecklist: card.checkListID,
					idCheckItem: card.checkItemID,
					value: newName
				};
				var response = JSON.parse(trello._trello.put("cards/"+self.storyCard.data.id+"/checklist/"+card.checkListID+"/checkItem/"+card.checkItemID+"/name", checkItemData).responseText);
				self.taskCards = self.taskCards.filter(function(i){return i.data.id !== card.data.id;});
				self.taskCards.push(card);
				trello.Cards[card.data.id] = card;
			}
		}
	}

	function _processStoryCardRename(trello, requestInfo, storyCard) {
		var self = this;

		// THIS
		if(self.storyCard.data.id === storyCard.data.id) {
			var newName = requestInfo.details.requestBody.formData.name[0];
			var newStoryID = newName.match(/([0-9][0-9][0-9]).*/i);
			newStoryID = newStoryID?newStoryID[1]:null;

			if(newStoryID) {
				// Make sure that the story doesn't already exist
				var story = self.trelloObject.Stories.filter(function(i){return i.storyID === newStoryID;});
				story = story.length>0?story[0]:null;
				if(!story)
					self.setStoryID(newStoryID);
				else {
					self.storyCard.setName(self.storyCard.name);
					return console.error("Cannot set the story card to story "+newStoryID+" because it already exists");
				}
			}
			else
				return console.error("Failed to get the new StoryID.");
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
		
		// Watch for task deletes
		$(document).on('cardDelete', function(event, trello, requestInfo, card){_deletedCard.apply(self, [trello, requestInfo, card]);});

		// Watch for task name changes
		$(document).on('checkItemNameChange', function(event, trello, requestInfo, card){_renameTaskCard.apply(self, [trello, requestInfo, card]);});

		// Wathc for card renames
		$(document).on('cardNameChangeFromTask', function(event, trello, requestInfo, card){_renameTaskCheckItem.apply(self, [trello, requestInfo, card]);});

		// Watch for story Card renames
		$(document).on('storyNameChange', function(event, trello, requestInfo, storyCard){_processStoryCardRename.apply(self, [trello, requestInfo, storyCard]);});

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