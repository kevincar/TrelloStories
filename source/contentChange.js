// Create a new jQuery Event 'contentChange' for triggers to be called on contentChange
var watch = new MutationObserver(function(records){
	for(var recordIndex in records) {
		var record = records[recordIndex],
			el = record.target;

		$(el).trigger('contentChange', [record]);
	}
}).observe(document, {childList:true,subtree:true});