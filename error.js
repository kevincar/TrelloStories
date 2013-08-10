var ErrorHandler = function(){
	var self = this;
	self.log = true;

	self.ajaxError = function(jqXHR, textStatus, errorThrown){
		var response = jqXHR.responseText;
		var code = jqXHR.status;
		if(self.log){
			console.log(response);
		}

		if(code===401)
			$(document).trigger("authenticate");
	};
};