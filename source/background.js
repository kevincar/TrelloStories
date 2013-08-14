// Background

// Listen for incoming requests from the Client Script
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse){
	if(request.request === 'StartWatch') {
		StartWatch();
	}
	sendResponse({response: "success"});
});

// Begin Listening for Trello AJAX Requests.
var StartWatch = function(){
	var filter = {
		urls: [
			'*://trello.com/b/*',
			'*://trello.com/c/*',
			'*://trello.com/1/*'
		]
	};

	chrome.webRequest.onCompleted.addListener(function(details){
		var tabID = details.tabId, // The tabID of the url change
			url = details.url;		

		// Send a message to the trello Object in the content scripts
		// notifying that the URL has potentially to changed.
		var messageData = {url: url};
		chrome.tabs.get(tabID, function(tab){
			chrome.tabs.sendMessage(tabID, messageData, function(response){
				if(response.response !== 'success') {
					console.log("Failed to send the message to the content script!");
				}
			});
		});
	}, filter);
};