// Here we will add our javacript functions to clarify our design.

//INITIALIZATION

persistence.store.websql.config(persistence, 'timeleft', 'A database to store different dates', 5 * 1024 * 1024);

var Event = persistence.define('Event', {
	name: 'TEXT',
	date: 'DATE'
});
	
persistence.schemaSync();

FlurryAgent.startSession('7KGWW355H2R28P4GKPWV');

function validDate(date){
	var now = new Date();
	return date > now;
}
function storeEvent(name,date, id){
	if(!name || !date || !validDate(date)){
		// The data provided is wrong. Tell to the user.
		blackberry.ui.dialog.standardAskAsync("You must provide the event name and a future date.", blackberry.ui.dialog.D_OK,{}, {title:"Incomplete fields"});
	}
	else{
		if(!id){ // NEW
			var evento = new Event({
				name: name,
				date: date
			});
			persistence.add(evento);
		}
		else{//EDIT
			Event.load(id, 
				function(x){
					x.name = name;
					x.date = date;
					persistence.add(x);
					persistence.flush();
				}
			);

		}
		bb.popScreen();
	}
}

function removeEvent(id, back){
	blackberry.ui.dialog.standardAskAsync("Are you sure that you want to remove this value?", blackberry.ui.dialog.D_OK_CANCEL, 
		function (response){
			if (response.return == "Ok"){
				Event.load(id, 
					function(x){
						persistence.remove(x);
						persistence.flush();
					}
				);
				FlurryAgent.logEvent('Remove Event');
				
				if(back){
					bb.popScreen();
				}
				else{
					// Sigo en la página de eliminar eventos. 
					// Ocultar el evento.
					var list = document.getElementById('list');
					var div = document.getElementById(id);
					list.removeChild(div);
					list.refresh();
				}
			}
		}
	, {title:"Be careful"});
}


function removeValue(valueID, back){
	blackberry.ui.dialog.standardAskAsync("Are you sure that you want to remove this value?", blackberry.ui.dialog.D_OK_CANCEL, 
		function (response){
			if (response.return == "Ok"){ 
				Value.load(valueID, 
					function(x){
						persistence.remove(x);
						persistence.flush();					
					}
				);
				if(back){
					bb.popScreen();
				}
				else{
					hideValueAfterRemove(valueID);
				}
			}
		}
	, {title:"Be careful"});
}

function timeLeft(date) {
	//Get 1 day in milliseconds
	var one_day=1000*60*60*24;
	// Convert both dates to milliseconds
	var date1_ms = new Date().getTime();
	var date2_ms = date.getTime();

	// Calculate the difference in milliseconds
	var difference_ms = date2_ms - date1_ms;
	//take out milliseconds
	difference_ms = difference_ms/1000;
	var seconds = Math.floor(difference_ms % 60);
	difference_ms = difference_ms/60; 
	var minutes = Math.floor(difference_ms % 60);
	difference_ms = difference_ms/60; 
	var hours = Math.floor(difference_ms % 24);  
	var days = Math.floor(difference_ms/24);

	var precision = localStorage.getItem('precision');
	//return days + ' days, ' + hours + ' hours, ' + minutes + ' minutes, and ' + seconds + ' seconds';
	if(precision == "M"){
		return days + ' days, ' + hours + ' hours and ' + minutes + ' minutes';
	}
	else{
		if(precision == "H"){
			return days + ' days and ' + hours + ' hours';
		}
		else{
			return days + ' days';
		}
	}
}

function loadConfig(){
	document.addEventListener('webworksready', 
		function() {
			console.log('BB10 APIs are ready');	
			bb.init(
			{
				ondomready : 
				function(element, id, params) {
					if (id == 'mainScreen'){
						FlurryAgent.logEvent('Main Screen');
						appendEvents();
						bbm.register();
					}
					if (id == 'newEvent') {
						FlurryAgent.logEvent('New Event');
					}
					if(id == 'removeEvents'){
						appendEventsToBeRemoved();
					}
					if(id == 'settings'){
						loadSettings();
					}
					if(id == 'event'){
						addParams(params.id, params.name, params.date);
					}
					if(id == 'editEvent'){
						populateParams(params.id, params.name, params.date);
					}
				}
			});
			if (localStorage.getItem('dateFormat') == null) {
				localStorage.setItem('dateFormat', 'DD/MM/YYYY HH:mm');
			};
			
			if (localStorage.getItem('order') == null) {
				localStorage.setItem('order', 'date');
			};

			if (localStorage.getItem('precision') == null) {
				localStorage.setItem('precision', 'D');
			};
			// Open our first screen
			bb.pushScreen('main_screen.html', 'mainScreen');
		}
	);
}
