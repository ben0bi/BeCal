 /* Ben0bis Calendar, V2.5.1 */

var becalVersion = "2.5.3";
var g_becalDatabaseFile = "DATA/becaldatabase.gml";

// show and hide UI-blocker functions.
function hideBlocker() {$('#blocker').hide();}
function showBlocker(message = "Bitte warten, ich arbeite..") {$("#blockercontent").html(message);$('#blocker').show();}
hideBlocker();

// show a status
var m_statustimer = null;
var m_statusdirection = -1;

/* set another css file to a link with an id. */
function switchCSS(cssid, newcssfilename) {$('#'+cssid).attr('href', 'css/'+newcssfilename);}

/***************************************************************************************************************************************/
// Switching code from SQL to JSON.
/*
	Table structure:
		calendarevents
			id - BIGINT - primary key
			title - TEXT
			startdate - DATETIME
			enddate - DATETIME
			userid - BIGINT
			eventtype - INT
			summary - TEXT
			color - VARCHAR(10) - html #rrggbb
			audiofile - VARCHAR(255)
*/

/* new >2.5.2: json database instead of sql database.
	so, first creating the parser for gimli-parser.js
*/

// a calendar event with the values seen above.
var GMLParser_CALEVENT = function()
{
	var me = this;
	this.id = -1;
	this.title = "";
	this.startdate = new Date();
	this.enddate = new Date();
	this.userID = 0;	// not used yet.
	this.eventtype = 0;
	this.summary = "";
	this.color = "";
	this.audiofile = "";
	
	this.parseGML = function(json, rootPath)
	{
		if(__defined(json['ID']))
			me.id = parseInt(json['ID']);
		if(this.id=="NaN")
			me.id = -1;
		if(__defined(json['TITLE']))
			me.title = json['TITLE'];
		if(__defined(json['STARTDATE']))
			me.startdate = new Date(json['STARTDATE']);
		if(__defined(json['ENDDATE']))
			me.enddate = new Date(json['ENDDATE']);
		if(__defined(json['USERID']))
			me.userID = new Date(json['USERID']);
		if(__defined(json['EVENTTYPE']))
			me.eventtype = json['EVENTTYPE'];
		if(__defined(json['SUMMARY']))
			me.summary = json['SUMMARY'];
		if(__defined(json['COLOR']))
			me.color = json['COLOR'];
		if(__defined(json['AUDIOFILE']))
			me.audiofile = json['AUDIOFILE'];
	};
};

// the parser which parses all the events out of the json.
var GMLParser_CALENDAREVENTS = function()
{
	var me = this;
	this.events = [];
	this.clear = function() {me.events = [];};
	this.parseGML = function(json, rootPath)
	{
		if(__defined(json['EVENTS']))
		{
			for(var i=0;i<json['EVENTS'].length;i++)
			{
				var evt = new GMLParser_CALEVENT();
				evt.parseGML(json['EVENTS'][i], rootPath);
				if(evt.id>=0) // only add it to the list if an id is given.
				{
					me.events.push(evt);
				}else{
					log("Event with no-id or NaN-id found at list index "+i+"!", LOG_WARN);
				}
			}
		}else{
			log("No events in the given file found.", LOG_WARN);
		}
	};
};

GMLParser.addParser("CALEVENTS", new GMLParser_CALENDAREVENTS());
GMLParser.EVENTS = function() {return GMLParser.getParser("CALEVENTS").events;};
GMLParser.EVENTSBETWEEN = function(startdate, enddate)
{
	var events = GMLParser.events;
	var retevents = events;
	// XHEREX: get events between two dates.
	return retevents;
}
	
// do some funny loading texts.
var getLoadingText = function()
{
	var sel = parseInt(Math.random()*15)
	switch(sel)
	{
		case 0: return "Katze wird gestreichelt.."; break;
		case 1: return "Bitte warten, ich füttere die Tiere..";break;
		case 2: return "Pixel werden sortiert..";break;
		case 3: return "Bitte warten, ich zähle die Sterne..";
		case 4: return "Sekunde, ich werfe die Würfel..";
		case 5: return "Wasche Schwarzgeld..";
		case 6: return "Erschnüffle Bankdaten..";
		case 7: return "Dekoration wird angebracht..";
		case 8: return "Hacke Sicherheitssystem..";
		case 9: return "Schatz wird ausgegraben..";
		case 10: return "Beweise werden vernichtet..";
		case 11: return "Lade Akku auf..";
		case 12: return "Erweitere Perspektive..";
		case 13: return "Dokumente werden gefälscht..";
		case 14: return "Atem wird angehalten..";
		case 15: return "Atem wird angehalten..";
		default:
			return "Ladebalken wird geladen..";
	}
}

/***************************************************************************************************************************************/

// show a status in the status line at the bottom.
function status(text) 
{
	if(m_statustimer!=null)
	{
		clearInterval(m_statustimer);
		m_statustimer = null;
	}

	var txt='<span id="statusadvancer"><nobr>&nbsp;'+text+'&nbsp;</nobr></span>';
	var statusdiv = $('#'+BeCal.divNameStatus);
	statusdiv.html(txt);

	if(text.length>0)
	{
		statusdiv.removeClass("becalStatusOff");
		statusdiv.addClass("becalStatusOn");
	}else{
		statusdiv.removeClass("becalStatusOn");
		statusdiv.addClass("becalStatusOff");
	}

	// move it only when the width is bigger.
	var l1 = $('#statusadvancer').width();
	var l2= statusdiv.width();
	if(l1>l2)
	{
		m_statustimer = setInterval(function() 
		{
			var adv = $('#statusadvancer');
			var left = adv.css('left');
			var m_statusspeed = 2;
			var wcontent= $('#'+BeCal.divNameStatus).width();
			left = parseInt(left);
			//console.log("left: "+left);

			left = left + m_statusspeed*m_statusdirection;

			if(left+adv.width()<=wcontent-10)
				m_statusdirection = 1;
			if(left>=0)
				m_statusdirection=-1;

			adv.css('left', left+'px');
		},30);
	}
}

// show status with the value of a jquery entity.
function statusfromvalue(jqueryid)
{
	var val=$(jqueryid).val();
	status(val);
}

// AUDIO FUNCTIONS +++++++++++++++ SPEECH RECORDING +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
var g_audioRecorder = null;
var g_lastRecordedAudio = null; // you need to reset that when nothing happens.
g_audioDirectSave=null;
g_playLastRecord = true; // play the last recorded audio or not?
function audioRecord()
{
	// Stolen from:
	// https://medium.com/@bryanjenningz/how-to-record-and-play-audio-in-javascript-faa1b2b3e49b
	navigator.mediaDevices.getUserMedia({audio: true}).then(stream =>
	{
		// maybe stop and save a previous recording.
		audioStopRecord();
		console.log("Start recording audio..");

		// show stop button.
		$('.audioRecordBtn').removeClass('audio_not_recording');
		$('.audioRecordBtn').addClass('audio_recording');	
		
		const mediaRecorder = new MediaRecorder(stream);
		g_audioRecorder = mediaRecorder;

		mediaRecorder.start();
		const audioChunks = [];
		
		// add data to the chunks.
		mediaRecorder.addEventListener("dataavailable", event => {audioChunks.push(event.data);});
		
		// create a data blob with the audio chunks.
		mediaRecorder.addEventListener("stop", () => {
			const audioBlob = new Blob(audioChunks,{type: 'audio/wav'});
			const audioUrl = URL.createObjectURL(audioBlob);
			//console.log("URL for recorded audio: "+audioUrl);
			const audio = new Audio(audioUrl);
			if(g_lastRecordedAudio!=-1)
				g_lastRecordedAudio = audioBlob;
			else
				g_lastRecordedAudio=null;
			g_audioRecorder = null;
			
			// maybe just save after stopping.
			var s = g_audioDirectSave;
			g_audioDirectSave = null;
			if(s!=null)
				BeCal.DBsave(s);
			// maybe play the audio.
			if(g_playLastRecord)
				audio.play();
		});
	});
}

// stop the audio recording.
function audioStopRecord(doplay = true)
{
	g_playLastRecord = doplay;

	console.log("Stop recording audio.");
	$('.audioRecordBtn').removeClass('audio_recording');
	$('.audioRecordBtn').addClass('audio_not_recording');
	if(g_audioRecorder!=null){
		g_audioRecorder.stop();
		// it resets itself after the stop event.
	}else{
		g_audioRecorder=null;
		g_lastRecordedAudio=null;
	}
}

function audioSwitchRecording()
{
	if(g_audioRecorder==null)
	{	
		audioRecord()
	}else{
		audioStopRecord();
	}
}

function audioReset(doplay = true)
{
	g_lastRecordedAudio=-1;
	audioStopRecord(doplay);
}

// play the audio of an event if there exists one.
function audioPlayEvent(evt)
{
	if(evt.audiofile!=0 && evt.audiofile!="")
		audioPlayFile(evt.audiofile);
}

function audioPlaySelectedEvent()
{
	if(m_selectedEvent!=null)
		audioPlayEvent(m_selectedEvent);
}

// play an audio file.
// global audio for not playing more than one at a time.
g_singleAudio = null;
function audioPlayFile(filename)
{
	// maybe stop other sound.
	if(g_singleAudio!=null)
	{
		g_singleAudio.pause();
		g_singleAudio.currentTime=0;
	}
	
	console.log("Play Audio: "+filename);
	g_singleAudio = new Audio("DATA/AUDIO/"+filename);
	g_singleAudio.play();
}

// DATE FUNCTIONS ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

// this function is copied from stackoverflow. It calculates the days between two dates.
Date.daysBetween = function( date1, date2 ) {
  //Get 1 day in milliseconds
  var one_day=1000*60*60*24;

  // Convert both dates to milliseconds
  var date1_ms = date1.getTime();
  var date2_ms = date2.getTime();

  // maybe invert (new)
  if(date1_ms > date2_ms)
  {
	  var s=date1_ms;
	  date1_ms = date2_ms;
	  date2_ms=s;
  }
  
  // Calculate the difference in milliseconds
  var difference_ms = date2_ms - date1_ms;

  // Convert back to days and return
  return Math.round(difference_ms/one_day)+1; 
};

// set just the day, month and year of a date, not the time.
Date.compareOnlyDate=function(d1,d2)
{
	if(d1.getDate()==d2.getDate() && d1.getMonth()==d2.getMonth() && d1.getFullYear()==d2.getFullYear())
		return true;
	return false;
};

// set the time parameters to 0,0,1,0
Date.removeTime = function(dat)
{
	var d = new Date(dat);
	d.setHours(0);
	d.setMinutes(0);
	d.setSeconds(1);
	d.setMilliseconds(0);
	return d;
};

/* set only the time of a specific date. */
Date.setTime = function(date, time)
{
	var d = new Date(date);
	d.setHours(time.getHours());
	d.setMinutes(time.getMinutes());
	d.setSeconds(time.getSeconds());
	return d;
};

// create an sql datetime string from a date.
Date.toSQL = function(datetime)
{
	var year = datetime.getFullYear();
	var month = datetime.getMonth()+1;
	var day = datetime.getDate();
	var hour = datetime.getHours();
	var minute=datetime.getMinutes();
	
	if(month<10)
		month="0"+month;
	if(day<10)
		day="0"+day;
	if(hour<10)
		hour="0"+hour;
	if(minute<10)
		minute="0"+minute;
	
	return year+"-"+month+"-"+day+"T"+hour+":"+minute+":00.000";	
};

// return DD.MM.YYYY
Date.toShortDate = function(datetime)
{
	var year = datetime.getFullYear();
	var month = datetime.getMonth()+1;
	var day = datetime.getDate();
	return day+"."+month+"."+year;
};

// return HH:mm
Date.toShortTime = function(datetime)
{
	var hour = datetime.getHours();
	var minute=datetime.getMinutes();
	if(hour<10)
		hour="0"+hour;
	if(minute<10)
		minute="0"+minute;
	return hour+":"+minute;
};

// EVENT STRUCTURE ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

// a calendar event.
var BeCalEvent = function()
{
	var me = this;
	
	// DB stuff
	var m_dbID = -1;							// DBid < 0 = new entry
	this.getDBID = function() {return m_dbID;}
	//var m_hasChanged = false;					// has the entry changed (also if the entry is new)
	
	// ENTRY DATA
	this.title = "Ohne Titel";				// title of the event.
	this.summary = "";						// summary of the event. (NOT YET USED)
	this.audiofile="";						// if there is some audio, it is linked to this variable per filename.
	this.startDate = new Date();			// start date of the event.
	this.endDate = new Date();				// end date of the event.
	this.color = BeCal.eventDefaultColor;	// color of the event bars.
	this.eventtype = 0;						// event type:
											// 0: calendar event.
											// 1: A TODO, Not done yet.
											// 2: TODO, DONE!
	this.userid = 0;						// The creator user id.
	var m_id=-1;							// internal unique id for fast search and stuff.
	this.getID = function() {return m_id;};	// return the unique id.
	
	// create the event.
	this.create = function(start, end, newtype, newtitle, newaudiofile="", newsummary="", newcolor = "") 
	{
		me.title = newtitle;
		me.summary = newsummary;
		me.startDate = new Date(start);
		me.endDate = new Date(end);
		me.eventtype = newtype;
		me.audiofile = newaudiofile;
		
		if(newcolor=="")
			me.color=BeCal.eventDefaultColor;
		else
			me.color=newcolor;
		
		// dbID has to be <0 if the event is new.
		m_dbID = -1;
		//m_hasChanged = true;
		
		// assign an unique id.
		m_id=BeCalEvent.arrID;
		BeCalEvent.arrID++;	

//console.log("New entry with title: "+newtitle); 
	};
	
	// create the entry from a database entry. This sets the dbid to >0 and haschanged to false.
	this.createFromDB = function(dbid,start, end, newtype, newtitle, newaudiofile, newsummary, newcolor)
	{
		me.create(start, end, newtype, newtitle, newaudiofile, newsummary, newcolor);
		m_dbID = dbid;
		//m_hasChanged = false;
	};

	// create the bar div and return it.
	var getBarDivText=function(text, x,y,width, height, addclass = "")
	{
		var txt='<div onclick="BeCal.openEventViewDialog('+m_id+');" onmouseover="BeCalEvent.eventMouseOver('+m_id+');" onmouseout="BeCalEvent.eventMouseOver('+m_id+', true);" class="becalEventBar '+addclass+' becalEventMouseOut evt_'+m_id+'" style="background-color:'+me.color+'; top:'+y+'px; left:'+x+'px; width:'+width+'px; height:'+height+'px;">'+text+'</div>';
		return txt;
	};

	// create bars in the month view.
	this.createMonthBars=function(calendar)
	{
		var dayfields = calendar.getDateFields();	// get the day fields from the calendar.

		var posX=0;					// x position to calculate with.
		var posY=0;					// y position to calculate with.
		var realPosY=0;					// the real y position.
		//var realPosX = 0;				// the real x position.
		var width=0;					// the bar width.
		var height=BeCal.eventBarHeight;	// the bar height.

		var result = "";	// the returning html text.

		var now = new Date();								// NOW date used for todos.
		//console.log(now);

		var firstDay = Date.removeTime(dayfields[0].date);					// first date on the table.
		var lastDay = Date.removeTime(dayfields[dayfields.length-1].date);	// last date on the table.
		lastDay.setHours(23);
		lastDay.setMinutes(59);
		lastDay.setSeconds(59);

		var evtStartDay = Date.removeTime(me.startDate);					// start date of the event.
		var evtEndDay = Date.removeTime(me.endDate);						// end date of the event.

		// check if event is a todo. If so, maybe adjust dates.
		if(me.eventtype==1 || me.eventtype==2)
		{
			// end day is start day for the todos.
			if(evtEndDay<now)
				evtEndDay = now;
			evtStartDay = new Date(evtEndDay);
			evtEndDay.setHours(evtStartDay.getHours()+1);
		}

		var actualdate = new Date(evtStartDay);								// actual date for the bars.
		var mydayfield=dayfields[0];										// field on table for the actual date.

		// get a free slot between the two dates.
		var myslot = calendar.getFreeSlotBetween(evtStartDay,evtEndDay, true);

		// check if event is on table.
		if(evtStartDay>lastDay || evtEndDay<firstDay || myslot<0)
		{
			//console.log("-- event not on table or no free slot found --");
			return result;
		}

		var processed =0;
		var turn = 0;
		//console.log("+++ Listing Event +++");

		var done = false;
		var firstone = true; // if this is set, it will add a border div to id.

		// check if it is a todo.
		pretext="";
		if(me.eventtype==1)
			pretext="(X)&nbsp;";

		while(!done)
		{
			turn+=1;
			// the date is in the future, abort.
			if(actualdate>evtEndDay)
				return result;

			// adjust actual date to begin of table.
			if(actualdate<firstDay)
				actualdate = new Date(firstDay);

			// get the remaining days between the two dates.
			var remainingDays = Date.daysBetween(actualdate, evtEndDay);

			//console.log("------ Turn "+turn+" -------------------------");
			//console.log("Event lasts "+remainingDays+" day/s.\nStart: "+evtStartDay+"\nEnd: "+evtEndDay+"\nActual: "+actualdate);

			// get the dayfield for the actual date.
			if(actualdate>=firstDay)
				mydayfield = calendar.getDayField(actualdate);
			else
				mydayfield=dayfields[0];

			// check if the dayfield was found.
			if(mydayfield==0)
			{
				console.log("Dayfield not found for date: "+actualdate.toString());
				return result;
			}

			processed =0;

			posX = mydayfield.left;
			posY = mydayfield.top;
			//realPosX = posX;
			realPosY=mydayfield.top+BeCal.calendarFieldTopHeight+(myslot*BeCal.eventSlotHeight);

			width = 0;

			//console.log("X: "+parseInt(posX)+" Y: "+parseInt(posY));

			var r = remainingDays;
			var newline=false;
			width-=5; // include padding into the width.
			for(w=0;w<r;w++)
			{
				var nd = Date.removeTime(actualdate);
				nd.setDate(nd.getDate()+w);

				var newdayfield = calendar.getDayField(nd);
				if(newdayfield!=0)
				{
					// check if the new day field is aligned with my day field.
					if(parseInt(newdayfield.top) == parseInt(posY))
					{
						width+=newdayfield.width;
						remainingDays-=1;
						processed+=1;
						//console.log("Adding width at top: "+newdayfield.top+" @ "+newdayfield.date.toString());
					}else{
						// * line break, leave the for loop.
						// add the first marker.
						if(firstone==true && evtStartDay>=firstDay)
						{
							// maybe add the start marker.
							result += getBarDivText("", posX+1, realPosY, 10, height, "becalEventMarker");
							posX+=5;
							width-=5;
							firstone = false;
						}
						// add the bar.
						result += getBarDivText(pretext+this.title, posX, realPosY, width, height, "becalEventNoBorder");
						actualdate = Date.removeTime(nd);
						//console.log("--> (Processed "+processed+" Remaining "+remainingDays+") Setting date: "+nd.toString());
						processed = 0;
						newline = true;
						break;
					}
				}else{
					console.log("(2) Dayfield not found for date: "+nd.toString());
					actualdate=Date.removeTime(nd);
					break;
				}
			}

			// * add the last div.

			// add the start marker.
			if(firstone==true && evtStartDay>=firstDay)
			{
				result += getBarDivText("", posX+1, realPosY, 10, height, "becalEventMarker");
				posX+=5;
				width-=5;
				firstone = false;
			}

			// add the end marker.
			if(evtEndDay<=lastDay)
			{
				width-=10;
				result += getBarDivText("", posX+width-4, realPosY, 10, height, "becalEventMarker");
			}

			// add the last bar (see above)
			result += getBarDivText(pretext+this.title, posX, realPosY, width, height, "becalEventNoBorder");

			if(remainingDays<=0 && !newline)
				done=true;
		}
		// return the html text.
		return result;
	}
}
// next unique id for an event.
BeCalEvent.arrID = 0;

// mouse is over an event bar.
BeCalEvent.eventMouseOver=function(evtid, mouseOut=false)
{
	if(mouseOut)
	{
		// out of the field.
		$('.evt_'+evtid).removeClass('becalEventMouseOver');
		$('.evt_'+evtid).addClass('becalEventMouseOut');
	}else{
		// into the field..
		$('.evt_'+evtid).removeClass('becalEventMouseOut');
		$('.evt_'+evtid).addClass('becalEventMouseOver');
	}

	// maybe set status.
	if(BeCal.instance!=null)
		BeCal.instance.eventMouseOver(evtid, mouseOut);
};

// A DAY FIELD IN THE UI +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

// a day field on the month view.
var BeCalDayField = function(day,x,y,w,h,slotcount)
{
	this.date = Date.removeTime(day);
	this.top = y;
	this.left = x;
	this.width = w;
	this.height = h;

	// the slots are used to draw events above each other.
	var slots = new Array(slotcount);
	this.hiddenEventCount = 0;
	var clearSlots = function()
	{
		this.hiddenEventCount = 0;
		for(i=0;i<slots.length;i++)
			slots[i]=false;
	}

	// return a slot.
	this.isSlotOccupied = function(index)
	{
		if(index>=0 && index<slots.length)
			return slots[index];
		// unknown slots are always occupied. ;)
		return true;
	}
	
	// set a slot value.
	this.occupySlot=function(index, occupy = true)
	{
		if(index>=0 && index<slots.length)
			slots[index]=occupy;		
	}
	
	clearSlots();
}

// CALENDAR SINGLETON +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

// the calendar singleton instance.
var BeCal = function(contentdivid)
{
	var m_contentDivID = contentdivid;
	var me = this;
	var m_isChangingDateInput = false; // a thread safeness variable.
	
	var m_eventArray = new Array();		// array with all the events in it.
	var m_datefieldArray = new Array(); // array with all the date fields in it (UI)
	this.getDateFields = function() {return m_datefieldArray;};	// used in the events.
	var m_maxEventSlots = 5;			// max slots on a field to put events into.

	var m_renderstate = "month";	// drawing state. Not yet used.
	
	var m_renderDate = new Date();	// previously BeCal.globalToday
	this.getRenderDate = function() {return m_renderDate;};
	
	// the actual view for the todos.
	var m_actualTodoView = 2; // 1 = alle, 2 = not done, 0 = done
		
	// color for a new entry.
	this.newEntryColor = BeCal.eventDefaultColor;
	
	// mouse is over or out of an event. Show new status.
	this.eventMouseOver = function(evtid, mouseOut)
	{
		if(!mouseOut)
		{
			var evt=me.getEventByID(evtid);
			if(evt!=null)
			{
				var spc =""
				var evttype = evt.eventtype;
				// maybe add the summary to the status.
				if(evt.summary!="")
					spc=" ";
				
				if(evttype==0)	// event
					status(Date.toShortDate(evt.startDate)+" "+Date.toShortTime(evt.startDate)+" => "+Date.toShortDate(evt.endDate)+" "+Date.toShortTime(evt.endDate)+" : "+evt.title+spc+evt.summary);
				if(evttype==1) // TODO not done
					status("<span class=\"statuscharpos kreuz\"></span> &nbsp;TODO: "+evt.title+spc+evt.summary+" bis am "+Date.toShortDate(evt.endDate)+" "+Date.toShortTime(evt.endDate));
				if(evttype==2) // Done TODO
					status("<span class=\"statuscharpos haken\"></span> &nbsp;ERLEDIGT: "+evt.title+spc+evt.summary+" am "+Date.toShortDate(evt.startDate)+" "+Date.toShortTime(evt.startDate));
			}
		}else{
			status("");
		}
	};
	
	// fill the events list with some data from the DB.
	var clearAndFillEvents = function(data)
	{
		me.clearEvents();
		for(var i=0;i<data.length;i++)
		{
			var d = data[i];
			var startd = new Date(d.startdate);
			var endd = new Date(d.enddate);
			//console.log(i+":"+d.title+" from "+d.startdate+" to "+d.enddate);
			//console.log(" -> from "+startd+" to "+endd);
			me.createDBEvent(d.id, startd, endd,d.eventtype, d.title, d.audiofile, d.summary, d.color);
		}
	};
		
	// DB FUNCTIONS
	var loadEventsBetween = function(startdate, enddate, successFunc)
	{
		showBlocker(getLoadingText());
	
// NEW: LOAD FROM JSON
		// load the file each time we load the events, for synced everything.
		PARSEGMLFILE(g_becalDatabaseFile , function() 
		{
			var data = GMLParser.EVENTSBETWEEN(startdate, enddate);
			log(data.length+" events loaded.");
			clearAndFillEvents(data);
			successFunc();
			hideBlocker();
		},
		// the error function
		function()
		{
			// just show the week field without data.
			//showBlocker("ERROR: Could not load a GML file.");
			status("Could not load the database file. Maybe it does not exist yet.");
			clearAndFillEvents([]);
			successFunc();
			hideBlocker();
		});

		// set up the php request.
/*		var url = 'php/ajax_getEvents.php';
		var data = {startdate: d1, enddate: d2};
		var success = function(data)
		{
			console.log(data.length+" events loaded.");
			clearAndFillEvents(data);
			// do something.
			successFunc();
			hideBlocker();
		};

		// send the ajax request.
		$.ajax({
			type: 'POST',
			url: url,
			data: data,
			success: success,
			dataType: 'json'
		});
*/
	};
	
	// load the todos for the todo screen.
	var loadTodos = function(successFunc)
	{
		showBlocker(getLoadingText());
		// XHEREX
// NEW: LOAD FROM JSON
		// load the file each time we load the events, for synced everything.
		PARSEGMLFILE(g_becalDatabaseFile , function() 
		{
			var data = GMLParser.TODOS();//(startdate, enddate);
			log(data.length+" events loaded.");
			clearAndFillEvents(data);
			successFunc();
			hideBlocker();
		},
		// the error function
		function()
		{
			// just show the week field without data.
			//showBlocker("ERROR: Could not load a GML file.");
			status("Could not load the database file. Maybe it does not exist yet.");
			clearAndFillEvents([]);
			successFunc();
			hideBlocker();
		});
		// set up the php request.
/*		var url = 'php/ajax_getTodos.php';
		var data = {nop: 'null'};
		var success = function(data)
		{
			console.log(data.length+" TODO's loaded.");
			clearAndFillEvents(data);
			// do something.
			successFunc();
			hideBlocker();
		};
		
		// send the ajax request.
		$.ajax({
			type: 'POST',
			url: url,
			data: data,
			success: success,
			dataType: 'json'
		});
*/
	};
	
	// save an event to the DB.
	this.DBsave = function(evt) {saveToDB(evt);};
	var saveToDB = function(becalevt)
	{
		showBlocker();
		// maybe stop audio
		//audioStopRecord(false);
		// maybe save the audio first.
		if(g_lastRecordedAudio!=null || g_audioRecorder!=null)
		{
			console.log("Saving AUDIO:");
			if(g_audioRecorder!=null)
			{
				console.log("Need to stop recording first.");
				g_audioDirectSave=becalevt;
				g_audioRecorder.stop();
				return;
				// maybe wait for the audiorecorder to stop.
			}
			
			// get the audio blob.
			var lastAudio=0;
			if(g_lastRecordedAudio!=null)
				lastAudio=g_lastRecordedAudio;

			// set up the php request.
			var url = 'php/ajax_save_audiofile.php';
		
			// success function for audio saving.
			var audioprocessed = function(data)
			{
				console.log(" CUD audiofile result:" +data);
				if(data!="ERROR: AUDIO NOT SAVED!")
					becalevt.audiofile = data; // set the audio filename.
				// save the event after the audio was saved.
				saveToDB_afteraudio(becalevt);
				// hideBlocker(); render will load all events and show blocker in the meanwhile
				audioReset();
			}
		
			var data = new FormData();
			data.append('file', lastAudio);

			$.ajax({
				url :  url,
				type: 'POST',
				data: data,
				contentType: false,
				processData: false,
				success: audioprocessed,
				error: audioprocessed
			});
		}else{
			// there is no audio, just save the event.
			saveToDB_afteraudio(becalevt);
			audioReset();
		}
	}
	
	function saveToDB_afteraudio(becalevt)
	{
		// create SQL strings from the dates.
		var d1 = Date.toSQL(becalevt.startDate);
		var d2 = Date.toSQL(becalevt.endDate);

		// set up the php request.
		var url = 'php/ajax_CUD_event.php';
		var data = {dbid: becalevt.getDBID(),
					CUD: 'create',
					startdate: d1,
					enddate: d2,
					title: becalevt.title,
					summary: becalevt.summary,
					audiofile: becalevt.audiofile,
					color: becalevt.color,
					eventtype: becalevt.eventtype
					};			// the CUD event to do.
					// ^if CUD == 'create', it will create OR update an object.
					// if CUD == 'delete', it will delete the object.
		
		// success function.
		var aftersavemethod = function(data)
		{
			console.log("CUD event result:" +data);		
			m_renderDate=me.render(m_renderDate);
			// hideBlocker(); render will load all events and show blocker in the meanwhile
		}
		
		$.ajax({
			type: 'POST',
			url: url,
			data: data,
			success: aftersavemethod,
			error: aftersavemethod,
			dataType: 'text'
		});
	}

	// save an event to the DB.
	var removeFromDB = function(becalevt)
	{
		showBlocker();
		// create SQL strings from the dates.
	
		// set up the php request.
		// we only need the db id but CUD will read all the other values.
		var url = 'php/ajax_CUD_event.php';
		var data = {dbid: becalevt.getDBID(),
					startdate: '0',
					enddate: '0',
					title: '0',
					summary: '0',
					audiofile: '0',
					color: '0',
					eventtype: 0,
					CUD: 'delete'};			// the CUD event to do.
					// ^if CUD == 'create', it will create OR update an object.
					// if CUD == 'delete', it will delete the object.
		
		// success function.
		var success = function(data)
		{
			console.log("CUD event result:" +data);
			m_renderDate=me.render(m_renderDate);
			// hideBlocker(); render will load all events and show blocker in the meanwhile.
		}

		$.ajax({
			type: 'POST',
			url: url,
			data: data,
			success: success,
			dataType: 'text'
		});		
	}
	
	// ENDOF DB FUNCTIONS
	
	this.clearEvents = function() {m_eventArray = new Array();};
	
	// create an event and add it to the list.
	this.createEvent = function(startdate, enddate, eventtype, title, audiofile="", summary="", color = "")
	{
		var e = new BeCalEvent();
		e.create(startdate, enddate, eventtype, title, audiofile, summary, color);
		m_eventArray.push(e);
		return e;
	};
	
	// create an event from the DB.
	this.createDBEvent = function(dbid, startdate, enddate, eventtype, title, audiofile="", summary="", color="")
	{
		var e = new BeCalEvent();
		e.createFromDB(dbid, startdate, enddate, eventtype, title, audiofile, summary, color);
		m_eventArray.push(e);
		return e;
	};
	
	// return an event by its id.
	this.getEventByID = function(id)
	{
		for(var i=0;i<m_eventArray.length;i++)
		{
			if(m_eventArray[i].getID()==id)
				return m_eventArray[i];
		}
		return null;
	};
	
	// get the day field associated to a date.
	this.getDayField = function(searchdate)
	{
		var fields = m_datefieldArray;
		for(var q=0;q<fields.length;q++)
		{
			if(Date.compareOnlyDate(searchdate,fields[q].date)==true)
				return fields[q];
		}
		return 0;
	};

	// get the actual date and draw the screen with the given state.
	this.getToday = function() {m_renderDate = this.render(new Date());};

	// render the screen and return the globaltoday.
	this.render = function(renderdate)
	{
		switch(m_renderstate.toLowerCase())
		{
			case "month":
				console.log("--> rendering month display for "+renderdate);
				return createMonthDisplay(renderdate);
			case "todos":
				console.log("--> rendering TODO display.");
				createTodoDisplay();
				return renderdate;
			default:
				console.log("RENDER ERROR: Renderstate not accepted.");
				return new Date();
		}
		// FATAL ERROR.
		console.log("FATAL RENDER ERROR!");
		return null;
	};

	// remove all backgrounds from the content.
	var setBackground = function(newbackgroundclass)
	{
		$(m_contentDivID).removeClass("calendarBackground");
		$(m_contentDivID).removeClass("todoBackground");

		$(m_contentDivID).addClass(newbackgroundclass);
	}

	// initialize the TODO-display.
	this.setStateMonth = function()
	{
		setBackground('calendarBackground');
		m_renderstate = "month";
		this.render(m_renderDate);
	};

	// initialize the TODO-display.
	this.setStateTodos = function()
	{
		setBackground('todoBackground');
		m_renderstate = "todos";
		this.render(m_renderDate);
	};

	// render the todos.
	var createTodoDisplay = function()
	{
		// build menu.
		var mt = "";
		var actTodo = "#unset";
		if(m_actualTodoView==0) actTodo= "DONE";
		if(m_actualTodoView==1) actTodo= "ALLE";
		if(m_actualTodoView==2) actTodo= "TODO";

		mt = '<div id="'+BeCal.divNameTopbarDate+'">TO-DOs</div>';
		mt+='<div id="'+BeCal.divNameTopbarAdvancer+'">';
			mt+='<span class="becalAdvanceBtn">&nbsp;</span>';
			mt+='<a href="javascript:" class="becalAdvanceBtn becalBtn" onclick="BeCal.switchTodoView();">'+actTodo+'</a>&nbsp;';
			mt+='<a href="javascript:" class="becalAdvanceBtn becalBtn" onclick="BeCal.setStateMonth();">-&gt; Kalender</a>';
//			mt+='<a href="javascript:" class="becalAdvanceBtn" onclick="BeCal.advanceMonth(1);">&nbsp;&gt;&nbsp;</a>';
		mt+='</div>';
		$('#'+BeCal.divNameTopMenu).html(mt);

		// clear the content and set the height.
		var cc = $('#'+BeCal.divNameContent);
		cc.height(window.innerHeight-$('#'+BeCal.divNameTopMenu).height()-$('#'+BeCal.divNameStatus).height()-12);
		cc.html("");

		loadTodos(function()
		{
			var txt='<div class="fullscreen scrollvertical"><br />';
			var entries = m_eventArray;
			// first get all entries in range.
			// only push the timed events first.
			var now = new Date();
			var tdyfound = 0;
			for(var i = 0;i<entries.length;i++)
			{
				var e = entries[i];

				// maybe ommit this entry.
				if((e.eventtype==2 && m_actualTodoView==2) ||
					(e.eventtype==1 && m_actualTodoView==0))
					continue;

				var end = new Date(e.endDate);
				if(end>=now && tdyfound==0)
				{
					txt+="<hr />++++ HEUTE: "+now.getDate()+"."+(now.getMonth()+1)+"."+now.getFullYear()+" ++++"
					tdyfound=1;
				}

				if(end>=now && Date.compareOnlyDate(end,now)==false && tdyfound==1)
				{
					txt+="<hr/>"
					tdyfound = 2;
				}

				txt+='<div class="becalTodo" onmouseover="BeCalEvent.eventMouseOver('+e.getID()+')" onmouseout="status(\'\')">';
				if(e.eventtype==1)
				{
					txt+='<span class="todocharpos kreuz" onclick="BeCal.updateEventType('+e.getID()+', 2)"></span> <span class="becalTodoText becalTodoNotDone" onclick="BeCal.openEventViewDialog('+e.getID()+')">';
				}else{
					txt+='<span class="todocharpos haken" onclick="BeCal.updateEventType('+e.getID()+', 1)"></span> <span class="becalTodoText becalTodoDone" onclick="BeCal.openEventViewDialog('+e.getID()+')">';
				}

				// maybe add audio icon.
				var audio="";
				if(e.audiofile!="" && e.audiofile!=null)
					audio='<span class="todoDisplay_has_audio_file"></span>&nbsp;';

				// create the text for the entry.
				txt+=end.getDate()+"."+(end.getMonth()+1)+"."+end.getFullYear()+": "+audio+e.title+"</span></div>";
			}

			txt+="</div>";

			// create the html.
			$('#'+BeCal.divNameContent).html(txt);
		});
	};

	// switch between the todos.
	this.switchTodoView = function()
	{
		m_actualTodoView++;
		if(m_actualTodoView>2)
			m_actualTodoView=0;
		m_renderDate=me.render(m_renderDate);
	}

	// update only the event type for an event.
	this.updateEventType=function(eventid, eventtype)
	{
		var e = me.getEventByID(eventid);
		if(e==null)
		{
			console.log("Event not found for updating the type.");
			return;
		}
		$('#'+BeCal.updateTodoWindow).hide();
		e.eventtype=eventtype;
		saveToDB(e);
	};

	// render a month screen.
	var createMonthDisplay = function(renderdate)
	{
		var realToday = Date.removeTime(new Date());
		var calDayNameFieldHeight = 26;	// height of the top bar with the names of the days in it.
		var calStatusFieldHeight = 26; // height of the bottom bar with the status text in it.

		// build menu.
		var mt = "";
		mt = '<div id="'+BeCal.divNameTopbarDate+'">'+BeCal.monthNamesL[renderdate.getMonth()]+" "+renderdate.getFullYear()+"</div>";
		mt+='<div id="'+BeCal.divNameTopbarAdvancer+'">';
			mt+='<a href="javascript:" class="becalAdvanceBtn" onclick="BeCal.advanceMonth(-1);">&nbsp;&lt;&nbsp;</a>';
			mt+='<a href="javascript:" class="becalAdvanceBtn" onclick="BeCal.advanceMonth(1);">&nbsp;&gt;&nbsp;</a>';
			mt+='<a href="javascript:" class="becalAdvanceBtn becalBtn" onclick="BeCal.getToday();">Heute</a>&nbsp;';
			mt+='<a href="javascript:" class="becalAdvanceBtn becalBtn" onclick="BeCal.setStateTodos();">-&gt; To-Do\'s</a>';
		mt+='</div>';
		$('#'+BeCal.divNameTopMenu).html(mt);

		// get the month begin.
		var myMonth = renderdate.getMonth();
		var monthBegin = new Date(renderdate.getFullYear(), myMonth, 1, 1, 1, 10, 0);

		// set the return date to month begin.
		var returnDate = Date.removeTime(monthBegin);

		// maybe move the date some way backward.
		var monthBeginDay = monthBegin.getDay();
		if(monthBeginDay > 0)
			monthBegin.setDate(monthBegin.getDate() - monthBeginDay);

		// how many week lines do we render?
		var linecount = 5;
		// only add a line if the monthbeginday is >= wednesday and month is not february.
		if(monthBeginDay>3 && myMonth!=1)
			linecount = 6;

		// get and set width and height.
		var cc = $('#'+BeCal.divNameContent);
		cc.height(window.innerHeight-$('#'+BeCal.divNameTopMenu).height()-$('#'+BeCal.divNameStatus).height()-12);

		var calFieldHeight = (cc.height()-calDayNameFieldHeight)* (1.0/linecount);	//x * 0.2 = x / 5
		var calFieldWidth =cc.width()*(1.0/7.0);

		var txt="";
		// create the day name fields.
		txt+='<div class="becalDayField" style="top: 0px; left: 0px;"><div class="becalDayNumber">&nbsp;So.</div></div>';
		txt+='<div class="becalDayField" style="top: 0px; left: '+(calFieldWidth)+'px;"><div class="becalDayNumber">&nbsp;Mo.</div></div>';
		txt+='<div class="becalDayField" style="top: 0px; left: '+(calFieldWidth*2)+'px;"><div class="becalDayNumber">&nbsp;Di.</div></div>';
		txt+='<div class="becalDayField" style="top: 0px; left: '+(calFieldWidth*3)+'px;"><div class="becalDayNumber">&nbsp;Mi.</div></div>';
		txt+='<div class="becalDayField" style="top: 0px; left: '+(calFieldWidth*4)+'px;"><div class="becalDayNumber">&nbsp;Do.</div></div>';
		txt+='<div class="becalDayField" style="top: 0px; left: '+(calFieldWidth*5)+'px;"><div class="becalDayNumber">&nbsp;Fr.</div></div>';
		txt+='<div class="becalDayField becalLastCalField" style="top: 0px; left: '+(calFieldWidth*6)+'px;"><div class="becalDayNumber">&nbsp;Sa.</div></div>';

		// create the day fields.
		m_datefieldArray = new Array();

		// calculate the slots-per-field.
		m_maxEventSlots = 0;
		if(calFieldHeight-BeCal.calendarFieldTopHeight>0)
		m_maxEventSlots = parseInt((calFieldHeight-BeCal.calendarFieldTopHeight) / BeCal.eventSlotHeight)-1; // one is left for the multievent link.

		if(m_maxEventSlots<0)
			m_maxEventSlots=0;

		// draw each day field and create its array member.
		var startScreenDate = new Date(Date.removeTime(monthBegin));
		var endScreenDate = new Date(startScreenDate);
		endScreenDate.setDate(startScreenDate.getDate()+35);
		endScreenDate.setHours(23);
		endScreenDate.setMinutes(59);
		endScreenDate.setSeconds(59);
		for(weeks=0;weeks<linecount;weeks++)
		{
			for(days=0;days<7;days++)
			{
				// set the date.
				var mydate = Date.removeTime(monthBegin);
				mydate.setDate(monthBegin.getDate()+(weeks*7 + days));
				// set position.
				var posY = calFieldHeight*weeks+calDayNameFieldHeight;
				var posX = calFieldWidth*days;
				// set classes.
				var cl="";
				if(days==6) cl=" becalLastCalField";
				if(weeks==linecount-1) cl+=" becalLowestCalField";
				if(Date.compareOnlyDate(realToday, mydate)==true)
					cl+=" becalToday";
				var dt = mydate.getDate();
				if(mydate.getDate()==1)
					dt+=". "+BeCal.monthNames[mydate.getMonth()];

				// create the day field.
				var f = new BeCalDayField(mydate,posX,posY,calFieldWidth, calFieldHeight, m_maxEventSlots);
				// and push it to the array.
				m_datefieldArray.push(f);
				var id=m_datefieldArray.length-1; // id is the last index.

				// add some html
				txt+='<div class="becalField'+cl+'" style="top:'+posY+'px; left: '+posX+'px;" onclick="BeCal.openEditDialog('+id+');">';
				txt+='<div class="becalDayNumber">&nbsp;'+dt+'</div>';
				txt+='<div class="becalDayHiddenEvents" id="becalDayHiddenEvtWrapper_'+id+'" onclick="BeCal.showHiddenEventView('+id+');">';
				txt+='<div id="becalDayHiddenEvt_'+id+'" class="becalDayHiddenEventContent">&nbsp;+ 0</div></div>';
				txt+='</div>';
			}
		}

		// clear the content
		$('#'+BeCal.divNameContent).html("");

		// load the events asyncronous.
		loadEventsBetween(startScreenDate, endScreenDate, function()
		{
			// create all the event bars.
			var sortedFields = sortEventsByLength(startScreenDate, endScreenDate);

			ac = 0;
			for(e=0;e<sortedFields.length;e++)
			{
				ac++;
				var event = sortedFields[e];
				// create the month bar and add it to the html text.
				txt+=event.createMonthBars(me);
			}

			// create the html.
			$('#'+BeCal.divNameContent).html(txt);

			// create width and height.
			$(".becalDayField").each(function()
			{
				$(this).width(calFieldWidth);
			});
			$(".becalField").each(function()
			{
				$(this).width(calFieldWidth);
				$(this).height(calFieldHeight);
			});

			// set hidden event numbers.
			for(i=0;i<m_datefieldArray.length;i++)
			{
				var f = m_datefieldArray[i];
				if(f.hiddenEventCount>0)
				{
					$('#becalDayHiddenEvt_'+i).html("+ "+f.hiddenEventCount);
					$('#becalDayHiddenEvtWrapper_'+i).show();
				}else{
					$('#becalDayHiddenEvt_'+i).html("");
					$('#becalDayHiddenEvtWrapper_'+i).hide();
				}
			}

			// stop hidden events from clicking through
			$('.becalDayHiddenEvents').click(function(e) {e.stopPropagation();});
		});

		return returnDate;
	};

	// sort all the events of the calendar by length. longest first.
	var sortEventsByLength = function(startDate, endDate)
	{
		//console.log("Sorting between "+startDate+" / "+endDate);
		var arr = new Array();
		var entries = m_eventArray;

		// first get all entries in range.
		// only push the timed events first.
		for(var i = 0;i<entries.length;i++)
		{
			var e = entries[i];
			if(e.eventtype==0 && e.startDate<=endDate && e.endDate>=startDate)
				arr.push(e);
		}

		// now sort them all by length.
		var arr2 = new Array();
		if(arr.length>1)
		{
			var found = true;
			while(found==true)
			{
				// reset found.
				found = false;
				for(var i=0;i<arr.length-1;i++)
				{
					var a1 = arr[i];
					var a2 = arr[i+1];

					var d1 = Date.daysBetween(a1.startDate, a1.endDate);
					var d2 = Date.daysBetween(a2.startDate, a2.endDate);

					// maybe switch the values.
					if(d2 > d1) // the more days, the further up we go.
					{
						//console.log("Switching "+d1+a1.title+" with "+d2+a2.title);
						arr[i]=a2;
						arr[i+1]=a1;
						found = true;
						break;
					}
				}
			}
		}

		// at last push the todos, so they do not inflict on the length.
		for(var i = 0;i<entries.length;i++)
		{
			var e = entries[i];
			if(e.eventtype==1 && e.endDate<=endDate) // && e.endDate>=startDate)
				arr.push(e);
		}

		return arr;
	};

	// return a slot index number which is free on all days between the two dates.
	// returns -1 if no slot was found.
	this.getFreeSlotBetween = function(date1, date2, occupyslots=false)
	{
		//console.log("Getting free slots between: "+date1+" to " +date2);
		var fields = m_datefieldArray;
		// get start and end on the fields.
		var startField = fields[0];
		var endField = fields[fields.length-1];

		var startFieldDate = startField.date;
		var endFieldDate = endField.date;

		// the indexes for checking the slots.
		var startIndex = 0;
		var endIndex = fields.length-1;

		// dates are out of scope.
		if(date1>endFieldDate)
			return -1;
		if(date2<startFieldDate)
			return -1;

		// get indexes for the dates.
		for(i=0;i<fields.length;i++)
		{
			var f = fields[i];
			if(Date.compareOnlyDate(date1,f.date)==true)
				startIndex = i;
			if(Date.compareOnlyDate(date2,f.date)==true)
				endIndex = i;
		}

		//console.log("IDX: "+startIndex+" to "+endIndex);

		// now check for all slots.
		var returnslot = -1;
		for(slot=0;slot<m_maxEventSlots;slot++)
		{
			var found = false;
			for(idx=startIndex;idx<=endIndex;idx++)
			{
				if(fields[idx].isSlotOccupied(slot)==true)
				{
					found = true;
					break; // break the second for.
				}
			}
			// no occupation found, set the slot.
			if(found==false)
			{
				returnslot=slot;
				break; // break the first for.
			}
		}

		// maybe occupy the found slot.
		if(occupyslots==true || occupyslots>=1)
		{
			for(idx=startIndex;idx<=endIndex;idx++)
			{
				if(returnslot > -1)
				{
					fields[idx].occupySlot(returnslot,true);
				}else{
					//console.log("hidden "+idx);
					fields[idx].hiddenEventCount+=1;
				}
			}
		}

		//console.log("Returning slot: "+returnslot);
		return returnslot;
	}

	// show the "a" todo button (?)
	var showTodoBtn = function(isdone=false)
	{
		$('#BecalTodoDOBtn').hide();
		$('#BecalTodoDONEBtn').hide();
		if(isdone)
			$('#BecalTodoDOBtn').show();
		else
			$('#BecalTodoDONEBtn').show();
	}

	// create the (static) UI of the calendar app.
	var createUI = function()
	{
		// first, fill the content div.
		var txt = "";
		txt+='<div id="'+BeCal.divNameTopMenu+'"></div>';	// the top bar menu.
		txt+='<div id="'+BeCal.divNameContent+'"></div>';	// the calendar content.
		txt+='<div id="'+BeCal.divNameStatus+'"></div>';
		txt+='<div id="'+BeCal.divNameOverlay+'"></div>';	// the overlay for the jdoor windows.
		$(m_contentDivID).html(txt);

		// create the windows.
		// create the html for the edit entry view.
		txt="";
		txt+='<div class="becalWindow">';
			txt +="<div>";
			txt+='<table border="0"><tr><td>';
				txt+='<div id="becalStartDateView">';
					txt+='<input type="text" id="'+BeCal.inputNameTime1+'" class="becalInputTime becalInputMouseOver" value="12:34" /><br />';
					txt+='<input type="text" id="'+BeCal.inputNameDate1+'" class="becalInputDate becalInputMouseOver" size="50" value="Sun., 30. Sept. 1967" />';
				txt+='</div><div id="becalTodoTextView"></div>';
			txt+='</td><td><div class="becalInputMiddlestrich"></div></td><td>';
				txt+='<input type="text" id="'+BeCal.inputNameTime2+'" class="becalInputTime becalInputMouseOver" value="12:34" /><br />';
				txt+='<input type="text" id="'+BeCal.inputNameDate2+'" class="becalInputDate becalInputMouseOver" size="50" value="Sun., 30. Sept. 1967" />';
			txt+='</td></tr></table>';
			txt+='<div id="'+BeCal.divNameColorPicker+'">';
				txt+='<input id="'+BeCal.inputNameColorPicker+'" />';
			txt+='</div>';

			// the todo checkbox
			txt+='<div id="todocheckboxdiv" onclick="BeCal.checkBoxTodo(true)">';
			txt+='<nobr><input id="'+BeCal.inputNameCheckTodo+'" onclick="BeCal.checkBoxTodo(true)" class="check-todo" type="checkbox" value="unchecked" />';
			txt+='<span class="TodoCheckName eventname"></span></nobr></div>';

			// the edit button container.
			txt+='<div class="becalEditButtonDiv" id="'+BeCal.divNameEditContainer+'">';
				txt+='<a href="javascript:" class="becalOkBtn becalEditBtn" onclick="BeCal.createNewEventBtnPressed()"></a>';
			txt+='</div>';

			//TEST txt+='<a href="javascript:" onclick="switchCSS(\'customstyle\',\'style_minimal.css\')">CS</a>';

			// NEW: just the buttons for the show (update, not create) stuff, not more.
			txt+='<div class="becalEditButtonDiv" id="'+BeCal.divNameShowContainer+'"><nobr>';
				txt+='<a href="javascript:" class="becalBadBtn becalDeleteBtn" onclick="BeCal.deleteEventBtnPressed()"></a>&nbsp;';
				txt+='<a href="javascript:" class="becalOkBtn becalEditBtn" onclick="BeCal.updateEventBtnPressed()"></a>';
			txt+='</nobr></div>';

		txt+='</div>';

		// show the duration of the event.
		txt+='<div class="becalEntryDurationDiv"></div>';
		txt+='</div>';

		// create the title. It contains an input field and an audio record button.
		var title ='<div id="'+BeCal.divNameEditTitle+'" onmouseover="statusfromvalue(\'#'+BeCal.inputNameEventTitle+'\')" onmouseout="status(\'\')">';
			title+='<div id="eventView_has_audio_file"></div>'; // the speaker icon.
			title+='<span id="audioRecordBtn" class="audioRecordBtn audio_not_recording" onclick="audioSwitchRecording()"></span>';
			title+='<input type="text" id="'+BeCal.inputNameEventTitle+'" onclick="audioPlaySelectedEvent()" class="becalInputEventName" placeholder="Titel hinzufügen"></input>';
		title+='</div>'; //<div id="'+BeCal.divNameShowTitle+'" class="becalInputEventName"> EVENT TITLE </div>';

		// create the window.
		$('#'+BeCal.divNameOverlay).jdCreateWindow(BeCal.editEntryWindow,100,100,500,220, title, txt);

		// *************************************************************
		// the window to check a todo before the edit window pops up.
		txt='<div class="becalWindow"><div class="intermediaryTodoButtons"><nobr>';
				txt+='<a href="javascript:" id="BecalTodoDONEBtn" class="becalOkBtn becalHakenBtn" onclick="BeCal.updateEventBtnPressed(2)"></a>';
				txt+='<a href="javascript:" id="BecalTodoDOBtn" class="becalBadBtn becalKreuzBtn" onclick="BeCal.updateEventBtnPressed(1)"></a>&nbsp;';
				txt+='<a href="javascript:" class="becalBadBtn becalDeleteBtn" onclick="BeCal.deleteEventBtnPressed()"></a>&nbsp;';
				txt+='<a href="javascript:" class="becalOkBtn becalEditBtn" onclick="BeCal.editEventBtnInTodoOverlayPressed()"></a>';
		txt+='</nobr></div></div>';
		$('#'+BeCal.divNameOverlay).jdCreateWindow(BeCal.updateTodoWindow,100,100,180,60, '<div onclick="audioPlaySelectedEvent()">Todo..</div>', txt);
		showTodoBtn();

		// *************************************************************
		// the other entries window.
		title ="Weitere";
		txt='<div id="'+BeCal.divNameOtherEntries+'"></div>';
		$('#'+BeCal.divNameOverlay).jdCreateWindow(BeCal.otherEntriesWindow,100,100,200,-200, title, txt);

		// *************************************************************

		// create the pickers on the inputs.
		AnyTime.picker( BeCal.inputNameDate1, { format: "%a, %d. %b. %z", firstDOW: 0 } );
		AnyTime.picker( BeCal.inputNameTime1, { format: "%H:%i" } );
		AnyTime.picker( BeCal.inputNameDate2, { format: "%a, %d. %b. %z", firstDOW: 0 } );
		AnyTime.picker( BeCal.inputNameTime2, { format: "%H:%i" } );

		// create the color picker.
		$('#'+BeCal.inputNameColorPicker).spectrum({
			color: BeCal.eventDefaultColor,
			showPaletteOnly: true,
			togglePaletteOnly: true,
			togglePaletteMoreText: '==>',
			togglePaletteLessText: '<==',
			clickoutFiresChange: true,
			change: function(color) 
			{
				editColorPickerChanged(color);
			},
			move: function(color)
			{
				editColorPickerChanged(color);
			},
		palette: [
				["#336","#363","#633","#663","#636","#366"],
				["#339","#393","#933","#993","#939","#399"],
				["#33A","#3A3","#A33","#AA3","#A3A","#3AA"],
				["#33F","#3F3","#F33","#FF3","#F3F","#3FF"],
			]
		});
		
		// show the actual entry duration.
		showEntryDuration();
		
		// do something when the input fields change.
		$('#'+BeCal.inputNameDate1).on('change', function()
		{
			constrainDateInput();
			showEntryDuration();
		});
		$('#'+BeCal.inputNameTime1).on('change', function()
		{
			constrainDateInput();
			showEntryDuration();
		});
		$('#'+BeCal.inputNameDate2).on('change', function()
		{
			constrainDateInput();
			showEntryDuration();
		});
		$('#'+BeCal.inputNameTime2).on('change', function()
		{
			//constrainDateInput();
			showEntryDuration();
		});
	
		// hide all the created UI windows.
		$('#'+BeCal.divNameOverlay).jdHideAllWindows();
		
		// show a welcome message in the status field.
		status("Welcome to BeCal. Date: "+Date().toString());
	};
		
	// constrain the date inputs so that the end date cannot be < start date.
	// use unconstrain if it is a todo.
	var constrainDateInput = function()
	{
		// some other "thread" is already changing this stuff.
		if(m_isChangingDateInput)
		{
			//console.log("already changing");
			return;
		}
		m_isChangingDateInput=true;
	
		//console.log("CONSTRAINING DATE INPUT START");
		// get the real dates.
		var day1 = Date.setTime(AnyTime.getCurrent(BeCal.inputNameDate1),AnyTime.getCurrent(BeCal.inputNameTime1));
		var day2 = Date.setTime(AnyTime.getCurrent(BeCal.inputNameDate2), AnyTime.getCurrent(BeCal.inputNameTime2));

		// get the times.
		var defaultConv = new AnyTime.Converter({format:'%H:%i'});
		var time1 = defaultConv.parse($('#'+BeCal.inputNameTime1).val());
		var time2 = defaultConv.parse($('#'+BeCal.inputNameTime2).val());

		// set the earliest date to the end date.
		var earliestdate = new Date(day1);
		earliestdate.setHours(0);
		earliestdate.setMinutes(0);
		earliestdate.setSeconds(1);
	
		//	console.log("Setting earliest: "+earliestdate+" / "+time1);
		AnyTime.setEarliest(BeCal.inputNameDate2, earliestdate);

		// set the earliest time.	
		if(Date.compareOnlyDate(day1,day2)==true)
			AnyTime.setEarliest(BeCal.inputNameTime2, time1);
		else
			AnyTime.setEarliest(BeCal.inputNameTime2, defaultConv.parse("00:00"));
	
		// hide some fields.
		$('#AnyTime--'+BeCal.inputNameDate2).hide();
		$('#AnyTime--'+BeCal.inputNameTime2).hide();	
		m_isChangingDateInput=false;
	};
	
	// unconstrain the datetime input of field 2 for todos.
	this.unconstrainDateTimeInput = function()
	{
		m_isChangingDateInput = true;

		var defaultConv = new AnyTime.Converter({format:'%H:%i'});
		var earliestdate = new Date("1900-01-01T00:00:00");
		AnyTime.setEarliest(BeCal.inputNameDate2, earliestdate);
		AnyTime.setEarliest(BeCal.inputNameTime2, defaultConv.parse("00:00"));
		
		$('#AnyTime--'+BeCal.inputNameDate2).hide();
		$('#AnyTime--'+BeCal.inputNameTime2).hide();	
	};
	
	// undo the unconstrain on todos.
	this.UNunconstrainDateTimeInput = function()
	{
		m_isChangingDateInput = false;
		constrainDateInput();
	};
	
	// show the duration between the two dates on the edit/show event window.
	var m_blockEntryDuration = false;
	var showEntryDuration = function(date1 = false, date2 = false)
	{		
		// prevent from reset all the time.
		if(m_blockEntryDuration==true)
			return;
		
		var durationdiv = $('.becalEntryDurationDiv');
		var txt = "Dauer:";
		var isBig = false;
		
		var daytime1 = 0;
		var daytime2 = 0;
		if(date1==false && date2==false)
		{
			// get the times from the inputs.
			daytime1 = AnyTime.getCurrent(BeCal.inputNameDate1);
			daytime2 = AnyTime.getCurrent(BeCal.inputNameDate2);
			var time1 = AnyTime.getCurrent(BeCal.inputNameTime1);
			var time2 = AnyTime.getCurrent(BeCal.inputNameTime2);
			daytime1=Date.setTime(daytime1,time1);
			daytime2=Date.setTime(daytime2, time2);
			//console.log("Got time from input.");
		}else{
			// get times from the parameters.
			daytime1=new Date(date1);
			daytime2=new Date(date2);
			//console.log("Got time from parameters. ;)");
		}
		
		// get the milliseconds since 1970.
		var ms1 = daytime1.getTime();
		var ms2 = daytime2.getTime();
		
		//console.log("ms1:"+ms1+" ms2:"+ms2);
		var timeinMS = ms2-ms1;
		//console.log("MS: "+timeinMS);
		
		// the seconds.
		var seconds = parseInt(timeinMS * 1/1000); // prevent zero division by multiplication.
		//console.log("Seconds:"+seconds);
				
		// the minutes.
		var timeinMinutes = parseInt(seconds * 1/60);
		//console.log("Minutes: "+timeinMinutes);
		
		var minutes = timeinMinutes % 60;
		timeinMinutes -= minutes;
		//console.log("Minutes 2:"+timeinMinutes+" Rest: "+minutes);

		// the hours.
		var timeinHours = parseInt(timeinMinutes * 1/60);
		//console.log("Hours: "+timeinHours);
		
		var hours = timeinHours % 24;
		timeinHours -= hours;
		//console.log("Hours 2: "+timeinHours+" Rest: "+hours);
		
		var days = parseInt(timeinHours * 1/24);

		if(days>=7)
		{
			var weeks= parseInt(days*1/7);
			var n="";
			if(weeks>1)
				n="n";
			isBig = ">= "+weeks+" Woche"+n;
		}
		
		if(days>=30)
		{
			var months = days * 1/30;
			var e="";
			if(months>1)
				e="e";
			isBig = ">= "+months+" Monat"+e;
		}		
		
		// create duration text.
		if(isBig==false)
		{
			if(days>0)
				txt+=days+"d";
			if(hours>0 || (days>0 && minutes>0))
				txt+=hours+"h";
			if(minutes>0)
				txt+=minutes+"min";

			//console.log(">D:"+days+" H:"+hours+" M:"+minutes);
			
			if(days==0 && hours==0 && minutes==0)
			{
				txt = "Zeitlos";
			}
		}else{
			txt=isBig;
		}
		
		// set the divs content.
		durationdiv.each(function() {$(this).html(txt);});
	};

	// advance the actual month about some amount.
	this.advanceMonth = function(amount)
	{
		var dt = m_renderDate;
		dt.setMonth(dt.getMonth()+amount);
		m_renderDate = this.render(dt);
		return m_renderDate;
	};

	// show the window with all hidden events for a dayfield.
	this.showHiddenEventView=function(dayfieldid)
	{
		//console.log("DFID: "+dayfieldid);
		hideAllWindows();

		// get windows and content and stuff.
		var win = $('#'+BeCal.otherEntriesWindow);
		var div = $('#'+BeCal.divNameOtherEntries);
		var content = $('#'+BeCal.divNameOverlay);

		var dayfield = m_datefieldArray[dayfieldid];
		var today = new Date();
		today = Date.removeTime(today);
		var txt='';
		var count = 0;
		for(var i=0;i<m_eventArray.length;i++)
		{
			var e = m_eventArray[i];
			// check if the event is on the field or if it is a todo and its the
			// today field and the todo is <= today.
			if((Date.removeTime(e.startDate)<=Date.removeTime(dayfield.date) && Date.removeTime(e.endDate)>=Date.removeTime(dayfield.date))||
			(e.eventtype==1 && e.endDate <= today && Date.removeTime(dayfield.date).toString() == today.toString()))
			{
				console.log("TDY: "+today+" dfd:"+Date.removeTime(dayfield.date));
				txt+='<div id="becalHiddenEventDiv_'+e.getID()+'" class="becalHiddenEvent" style="background-color:'+e.color+';" onclick="BeCal.openEventViewDialog('+e.getID()+')">'+e.title+'</div>';
				count+=1;
			}
		}
		win.jdHTML(txt);

	// adjust window position.
		// get mouse position
		var mouse = $().Mouse();
		var mouseX = mouse.x;
		var mouseY = mouse.y;

		// get some values.
		var w = win.width();
		var h = win.height();
		var cw=content.width();
		var ch=content.height();

		mouseY -= ($('#content').height()-ch)+h; // first is the top bar height, second is the window height.

		// constrain values
		if(mouseX+w>cw)
			mouseX=mouseX-w;
		if(mouseY+h>ch)
			mouseY=ch-h-4;

		if(mouseX<0)
			mouseX=0;
		if(mouseY<0)
			mouseY=0;

		// set position
		win.css('left', mouseX+'px');
		win.css('top', mouseY+'px');

		win.jdShow();
		win.focus();
	};

	// hide all UI windows.
	var hideAllWindows = function()
	{
		// hide all time picker windows.
		$(".AnyTime-win").each(function(){$(this).hide();});

		audioReset(false);
		$('#'+BeCal.otherEntriesWindow).hide();
		$('#'+BeCal.editEntryWindow).hide();
		$('#'+BeCal.updateTodoWindow).hide();
	};

	// change color of top bar in the entry/show window.
	var changeEntryWindowEvtColor=function(col)
	{
		//console.log("Changing entry window top bar color to "+col+".");
		var entrywindow=$('#'+BeCal.editEntryWindow);
		var topbar = entrywindow.find('.jdwindow-top');
		topbar.css('background-color', col);
	};

	// show the edit window.
	var showWindowPos = function(windowtitle, posX, posY, entryWidth)
	{
		hideAllWindows();

		var win = $('#'+windowtitle);
		var content = $('#'+BeCal.divNameOverlay);
		var w = win.width();
		var h = win.height();
		var cw=content.width();
		var ch=content.height();
	
		// set window position
		posX += entryWidth*0.75;
		if(posX+w>cw)
			posX=posX-w-entryWidth*0.5;
		if(posY+h>ch)
			posY=ch-h-4;
		
		if(posX<0)
			posX=0;
		if(posY<0)
			posY=0;

		win.css('left', posX+'px');
		win.css('top', posY+'px');

		// show the window.
		win.jdShow();
		win.focus();
	};
	
	// the color picker of the edit window changed.
	var editColorPickerChanged = function(col)
	{
		me.newEntryColor = col.toHexString();
		changeEntryWindowEvtColor(me.newEntryColor);
	};
	
	// open the edit entry dialog.
	this.openEditDialog = function(datefieldid)
	{
		// reset the selected event.
		m_selectedEvent = null;
		
		$('#eventView_has_audio_file').hide();
		//audioReset(); // it will stop on hideallwindows in showwindowpos.
		
		// hide the intermediary interface window.
		$('#'+BeCal.updateTodoWindow).hide();

		// get the date field where the click happened.
		var f = m_datefieldArray[datefieldid];
	
		var now = new Date();
		var day = new Date(f.date);

		// set the time to the day.
		day.setHours(now.getHours());
		day.setMinutes(now.getMinutes());
		day.setSeconds(0);
	
		// set the end time one hour later.
		var day2 = new Date(day);
		day2.setHours(day2.getHours()+1);
	
		// set the date fields.
		AnyTime.setCurrent( BeCal.inputNameDate1, day);
		AnyTime.setCurrent( BeCal.inputNameTime1, day);

		AnyTime.setCurrent( BeCal.inputNameDate2, day2);
		AnyTime.setCurrent( BeCal.inputNameTime2, day2);
	
		var menuHeight = $('#'+BeCal.divNameTopMenu).height()+$('.becalDayField').height();
	
		// it is a new entry, so we show the input stuff and hide the show stuff (entry mode).
		$('#'+BeCal.divNameEditContainer).show();

		// NEW: No show stuff anymore, just the menu
		 $('#'+BeCal.divNameShowContainer).hide();
	
		changeEntryWindowEvtColor(me.newEntryColor);
		$('#'+BeCal.inputNameColorPicker).spectrum("set", me.newEntryColor);
	
		showWindowPos(BeCal.editEntryWindow, parseInt(f.left),parseInt(f.top)+menuHeight, f.width);
		$('#'+BeCal.inputNameEventTitle).focus();
	};
	
	// open the dialog to show the event view.
	m_selectedEvent = null;
	this.openEventViewDialog = function(eventid, afterintermediary=false)
	{
		// reset the audio recording.
		//audioReset(); // it will stop on hideallwindows in showwindowpos.
				
		// hide the intermediary interface window.
		$('#'+BeCal.updateTodoWindow).hide();
		
		// prevent duration div from updating all the time.
		m_blockEntryDuration = true;
		
		var evt = me.getEventByID(eventid);
		m_selectedEvent = evt;
		//var evt = BeCal.entries[eventid];
		if(evt==null)
		{
			console.log("FATAL: Event with id "+eventid+" not found.");
			m_selectedEvent = null;
			return; 
		}

		// show or hide the speaker icon. TODO: audio in table.
		if(evt.audiofile!=null && evt.audiofile!="")
			$('#eventView_has_audio_file').show();
		else
			$('#eventView_has_audio_file').hide();
		
		// maybe play the associated sound.
		audioPlayEvent(evt);

		// get the event type and set it to the checkboxes.
		var eventtype = evt.eventtype;
		
		// it is a normal event.
		if(eventtype==0)
			$('#'+BeCal.inputNameCheckTodo).prop('checked', false);
		
		// it is a TODO.
		if(eventtype>=1)
			$('#'+BeCal.inputNameCheckTodo).prop('checked', true);
		
		// show the right button.
		if(eventtype==1)
			showTodoBtn(false); // todo not done.
		if(eventtype==2) // a done todo.
			showTodoBtn(true);

		// update the checkbox content.
		BeCal.checkBoxTodo();
		
		var left=$().Mouse().x;
		var top=$().Mouse().y;
		//var menuHeight = $('#'+BeCal.divNameTopMenu).height()+$('.becalDayField').height();
	
		// it is an old entry, so we show the show stuff and hide the input stuff (show mode).
		$('#'+BeCal.divNameEditContainer).hide();
		
		// NEW: No show stuff anymore, just the menu
		$('#'+BeCal.divNameShowContainer).show();
	
		// OLD: divnameSHOWtitle.html...
		$('#'+BeCal.inputNameEventTitle).val(evt.title);
	
		// set the dates in the inputs so we can get their formatted values for the non-input text.
		AnyTime.setCurrent( BeCal.inputNameDate1, evt.startDate);
		AnyTime.setCurrent( BeCal.inputNameDate2, evt.endDate);
		AnyTime.setCurrent( BeCal.inputNameTime1, evt.startDate);
		AnyTime.setCurrent( BeCal.inputNameTime2, evt.endDate);
	
		// set the event color.
		changeEntryWindowEvtColor(evt.color);
		
		// NEW: also set the color picker color.
		$('#'+BeCal.inputNameColorPicker).spectrum("set", evt.color);
	
		m_blockEntryDuration = false;
		// show the duration of the event.
		showEntryDuration(evt.startDate, evt.endDate);

		// maybe show the intermediary interface
		if(eventtype>=1 && afterintermediary==false)
		{
			showWindowPos(BeCal.updateTodoWindow, parseInt(left), parseInt(top), 1);
			$('#'+BeCal.updateTodoWindow).jdShow();
			return;
		}

		// show the window.
		showWindowPos(BeCal.editEntryWindow,parseInt(left),parseInt(top), 1);
	};
	
	// open the event view dialog from the intermediary todo button overlay.
	this.editEventBtnInTodoOverlayPressed =function()
	{
		// hide the intermediary interface window.
		$('#'+BeCal.updateTodoWindow).hide();
		
		// open the event view for the selected item.
		if(m_selectedEvent!=null)
			me.openEventViewDialog(m_selectedEvent.getID(),true);
		else
			console.log("ERROR: Event not found after clicking edit on intermediary todo overlay.");
	};
	
	// create a new event from the data in the edit window.
	this.createNewEventBtnPressed = function()
	{
		// create the entry with the date from the window.
		var e = new BeCalEvent();
		var start=Date.setTime(AnyTime.getCurrent(BeCal.inputNameDate1), AnyTime.getCurrent(BeCal.inputNameTime1));
		var end=Date.setTime(AnyTime.getCurrent(BeCal.inputNameDate2), AnyTime.getCurrent(BeCal.inputNameTime2));
		var evttype = 0;
		var todo = $('#'+BeCal.inputNameCheckTodo).prop('checked');
		if(todo==true)
			evttype=1;
		
		e.create(start, end, evttype, $('#'+BeCal.inputNameEventTitle).val(), "", "", this.newEntryColor);
		m_eventArray.push(e);
	
		$('#'+BeCal.editEntryWindow).hide();
		$('#'+BeCal.inputNameEventTitle).val("");
		
		saveToDB(e);		
	};
	
	// update an event.
	this.updateEventBtnPressed = function(eventtype = -1)
	{
		console.log("Updating event.");
		if(m_selectedEvent==null)
		{
			console.log("ERROR: No event selected.")
			return;
		}
		
		// The event is saved in the m_selectedEvent variable, just set the new values.
		m_selectedEvent.startDate=Date.setTime(AnyTime.getCurrent(BeCal.inputNameDate1), AnyTime.getCurrent(BeCal.inputNameTime1));
		m_selectedEvent.endDate=Date.setTime(AnyTime.getCurrent(BeCal.inputNameDate2), AnyTime.getCurrent(BeCal.inputNameTime2));
		m_selectedEvent.title = $('#'+BeCal.inputNameEventTitle).val();
		m_selectedEvent.color = $('#'+BeCal.inputNameColorPicker).spectrum('get').toHexString(); // TODO: Set new color
		
		// get the old event type.
		var oldtype = m_selectedEvent.eventtype;
		
		// set the event type from update window.
		var todocheck = $('#'+BeCal.inputNameCheckTodo).prop('checked');
		if(todocheck==true)
			m_selectedEvent.eventtype = 1;
		else
			m_selectedEvent.eventtype = 0;
		
		// maybe set it to done.
		if(oldtype==2 && todocheck==true)
			m_selectedEvent.eventtype = 2;
		
		// set the event type from function parameter.
		if(eventtype!=-1)
			m_selectedEvent.eventtype = eventtype;

		$('#'+BeCal.editEntryWindow).hide();
		$('#'+BeCal.updateTodoWindow).hide();

		saveToDB(m_selectedEvent);
		m_selectedEvent = null;
		
		$('#'+BeCal.inputNameEventTitle).val("");
 	};
	
	// delete a selected element.
	this.deleteEventBtnPressed = function()
	{
		hideAllWindows();		
		$('#'+BeCal.inputNameEventTitle).val("");

		// selectedevent will be set when you click on an existing event.
		if(m_selectedEvent!=null)
			removeFromDB(m_selectedEvent);
		m_selectedEvent = null;
	};
	
	// INIT
	if(BeCal.instance == null)
	{	
		BeCal.instance = me;
		createUI();
		BeCal.checkBoxTodo();
	}else{
		console.log("WARNING: There is already a BeCal instance. Aborting.");
	}
};

/************************************************************************************************* GLOBAL FUNCTIONS *****************************/

BeCal.instance = null;	// the singleton instance of this calendar.
// create a new entry from the new entry window.
BeCal.createNewEventBtnPressed = function()
{
	if(BeCal.instance!=null)
		BeCal.instance.createNewEventBtnPressed();
};

// update an existing event.
BeCal.updateEventBtnPressed = function(eventtype = -1)
{
	if(BeCal.instance!=null)
		BeCal.instance.updateEventBtnPressed(eventtype);
};

// delete a selected event.
BeCal.deleteEventBtnPressed = function()
{
	if(BeCal.instance!=null)
		BeCal.instance.deleteEventBtnPressed();
};

// get the actual date.
BeCal.getToday = function()
{
	if(BeCal.instance!=null)
		BeCal.instance.getToday();
};

// render the stored date
BeCal.render = function()
{
	if(BeCal.instance!=null)
		BeCal.instance.render(BeCal.instance.getRenderDate());
};

// advance the month
BeCal.advanceMonth = function(amount)
{
	if(BeCal.instance!=null)
		return BeCal.instance.advanceMonth(amount);
};

// show the window with all the hidden events from a day in it.
BeCal.showHiddenEventView=function(dayfieldid)
{
	if(BeCal.instance!=null)
		BeCal.instance.showHiddenEventView(dayfieldid);
};

// open the edit entry dialog.
BeCal.openEditDialog = function(dayfieldid)
{
	if(BeCal.instance!=null)
		BeCal.instance.openEditDialog(dayfieldid);
};

// open the event view dialog.
BeCal.openEventViewDialog = function(eventid)
{
	if(BeCal.instance!=null)
		BeCal.instance.openEventViewDialog(eventid)
};

// initialize the todo display.
BeCal.setStateTodos = function()
{
	if(BeCal.instance!=null)
		BeCal.instance.setStateTodos();
};

// initialize the month.
BeCal.setStateMonth = function()
{
	if(BeCal.instance!=null)
		BeCal.instance.setStateMonth();
};

// extern save to db for audio file.
BeCal.DBsave = function(evt)
{
	if(BeCal.instance!=null)
		BeCal.instance.DBsave(evt);
};

// switch between the 3 todo states.
BeCal.switchTodoView = function()
{
	if(BeCal.instance!=null)
		BeCal.instance.switchTodoView();
};

// the todo checkbox was checked, do something.
BeCal.checkBoxTodo = function(invert=false)
{
	var checked = $('#'+BeCal.inputNameCheckTodo).prop('checked');
	if(invert)
	{
		checked = !checked;
		$('#'+BeCal.inputNameCheckTodo).prop('checked', checked);
	}
	
	var tn = $('.TodoCheckName');
	if(checked)
	{
		$('#becalStartDateView').hide();
		//$('.becalInputMiddlestrich').hide();
		$('#becalTodoTextView').show();
		tn.removeClass('eventname');
		tn.addClass('todoname');
		
		if(BeCal.instance!=null)
			BeCal.instance.unconstrainDateTimeInput();		
	}else{
		$('#becalTodoTextView').hide();
		//$('.becalInputMiddlestrich').show();
		$('#becalStartDateView').show();		
		tn.removeClass('todoname');
		tn.addClass('eventname');

		if(BeCal.instance!=null)
			BeCal.instance.UNunconstrainDateTimeInput();
	}
}

// The edit button in the update todo overlay was pressed.
BeCal.editEventBtnInTodoOverlayPressed =function()
{
	if(BeCal.instance!=null)
		BeCal.instance.editEventBtnInTodoOverlayPressed();
};

// update only the type of an event.
BeCal.updateEventType = function(evtid, evttype)
{
	if(BeCal.instance!=null)
		BeCal.instance.updateEventType(evtid, evttype);
};

// TEXT MONTH NAMES ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

BeCal.monthNames = ["Jan.", "Feb.", "März", "April", "Mai", "Juni",
					"July", "Aug.", "Sept.", "Okt.", "Nov.", "Dez."];
BeCal.monthNamesL = ["Januar", "Februar", "März", "April", "Mai", "Juni",
					"July", "August", "September", "Oktober", "November", "Dezember"];

// DIV and other IDs +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

// ids for the windows.
BeCal.editEntryWindow = "becalEditEntryWindow";
BeCal.otherEntriesWindow = "becalOtherEntriesWindow";
BeCal.updateTodoWindow = "becalUpdateTodoWindow";

// ids for the main items.
BeCal.divNameTopMenu = "becalTopMenuDiv";
BeCal.divNameContent = "becalContentDiv";
BeCal.divNameStatus = "becalStatusDiv";
BeCal.divNameOverlay = "becalOverlayDiv";

// ids for the other entries window.
BeCal.divNameOtherEntries = "becalOtherEntriesDiv";

// ids for the top menu
BeCal.divNameTopbarDate = "becalUITopbarDateName";
BeCal.divNameTopbarAdvancer = "becalUITopbarAdvancer";

// ids for the edit entry window.
BeCal.divNameEditContainer = "becalUIEditEntryContainer";
BeCal.divNameEditTitle = "becalUIEditEntryTitleContainer";
BeCal.inputNameEventTitle = "becalUIEditEntryNameInput";
BeCal.inputNameTime1 = "becalUIInputTime1";
BeCal.inputNameTime2 = "becalUIInputTime2";
BeCal.inputNameDate1 = "becalUIInputDate1";
BeCal.inputNameDate2 = "becalUIInputDate2";
BeCal.divNameColorPicker = "becalUIEntryColorPickerDiv";
BeCal.inputNameColorPicker = "becalUIEntryColorPicker";
BeCal.inputNameCheckTodo = "becalUIEntryCheckTodo";

// ids for the show entry window
BeCal.divNameShowContainer = "becalUIShowEntryContainer";

// DEFAULT VALUES ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

// the default color for an event.
BeCal.eventDefaultColor = "#333399";

BeCal.eventSlotHeight = 17;			// height of one slot in pixels.
BeCal.calendarFieldTopHeight = 20;	// height of the top bar with the day number of a calender field.

// the event bar height in pixels, without borders.
BeCal.eventBarHeight = 12;
