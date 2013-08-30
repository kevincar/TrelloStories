// Background

// Listen for incoming requests from the Client Script
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse){
	if(request.request === 'initMessages') {
		initMessages();
	}
	sendResponse({response: "success"});
});

// Begin Listening for Trello AJAX Requests.
var initMessages = function(){
	var filter = {
		urls: [
			'*://trello.com/b/*',
			'*://trello.com/c/*',
			'*://trello.com/1/*'
		]
	};

	// Listen for AJAX Requests and send messages back to the content scripts
	// notifying them of the URL requested.
	chrome.webRequest.onBeforeRequest.addListener(function(details){
		var tabID = details.tabId, // The tabID of the Request
			url = details.url;
		// Send a message to the trello Object in the content scripts
		// notifying that there was an HTTP request

		chrome.tabs.get(tabID, function(tab){
			chrome.tabs.sendMessage(tabID, details, function(response){
				if(typeof response === 'undefined'?true:response.response !== 'success') {
					console.log("Failed to send the message to the content script!");
				}
			});
		});
	}, filter, ['requestBody']);

	
	chrome.tabs.getSelected(null, function(tab){
		chrome.pageAction.show(tab.id);
	});
};