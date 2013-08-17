//Includes
var trelloStories;
$(document).ready(function(){
	setTimeout(function(){
		var trelloStories = new TrelloObject(function(trello){

			console.log(trello);
			// Special stuff goes here!

			// Set our trello board's Outstanding Storie Sprint List
			trello.setOutstandingStories('Outstanding Sprint Stories');
		});
	}, 1000);
});