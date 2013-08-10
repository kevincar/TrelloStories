$(document).ready(function(){
	chrome.storage.sync.get('trelloUserToken', function(items){
		var curVal = items.trelloUserToken;
		if(curVal == '')
			$("#test").val("CRUD");
		$("#token").val(curVal);
	});
	$(document).on('change', '#token', function(event){
		var value = $(event.target).val();
		chrome.storage.sync.set({"trelloUserToken":value});
	});
	$(document).on('click', "button", function(event){
		chrome.tabs.create({url:'https://trello.com/1/authorize?key=1e9099f8056922e2437ec2a600e0c2a1&name=TrelloStories&expiration=never&response_type=token'});
	});
});