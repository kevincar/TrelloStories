//Includes
var trelloStories;
$(document).ready(function(){
	setTimeout(function(){
		var trelloStories = new TrelloObject(function(trello){
			console.log(trello);
		});
	}, 1000);
});