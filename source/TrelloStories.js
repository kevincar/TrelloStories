//Includes
var trelloStories;
$(document).ready(function(){
	setTimeout(function(){
		var trelloStories = new TrelloObject(function(trello){
			// The following line is for testing purposes
			console.log(window._trello = trello);
			
			// Special stuff goes here! We should probably restrict this to different options
			// that should be able to be set in a popup for TrelloStory Extension Options.

			// Set our trello board's Outstanding Storie Sprint List
			trello.setOutstandingStories('Outstanding Sprint Stories');
		});
	}, 1000);
});