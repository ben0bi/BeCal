/* Ben0bis Calendar, V2. */

// show and hide UI-blocker functions.
function hideBlocker() {$('#blocker').hide();}
function showBlocker() {$('#blocker').show();}
hideBlocker();

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
	this.create = function(start, end, newtype, newtitle, newsummary="", newcolor = "") 
	{
		me.title = newtitle;
		me.summary = newsummary;
		me.startDate = new Date(start);
		me.endDate = new Date(end);
		me.eventtype = newtype;
		
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
	this.createFromDB = function(dbid,start, end, newtype, newtitle, newsummary, newcolor)
	{
		me.create(start, end, newtype, newtitle, newsummary, newcolor);
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
		
		var posX=0;							// x position to calculate with.
		var posY=0;							// y position to calculate with.
		var realPosY=0;						// the real y position.
		//var realPosX = 0;					// the real x position.
		var width=0;						// the bar width.
		var height=BeCal.eventBarHeight;	// the bar height.

		var result = "";	// the returning html text.

		var now = new Date();								// NOW date used for todos.
		//console.log(now);

		var firstDay = Date.removeTime(dayfields[0].date);					// first date on the table.
		var lastDay = Date.removeTime(dayfields[dayfields.length-1].date);	// last date on the table.
		
		var evtStartDay = Date.removeTime(this.startDate);					// start date of the event.
		var evtEndDay = Date.removeTime(this.endDate);						// end date of the event.
		
		// check if event is a todo. If so, maybe adjust dates.
		//console.log("Evttype: "+me.eventtype);
		if(me.eventtype==1)
		{
			if(evtStartDay<now)
				evtStartDay = now;
			evtEndDay = evtStartDay;
			evtEndDay.setHours(evtEndDay.getHours()+1);
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
		$('.evt_'+evtid).removeClass('becalEventMouseOver');
		$('.evt_'+evtid).addClass('becalEventMouseOut');
	}else{
		$('.evt_'+evtid).removeClass('becalEventMouseOut');
		$('.evt_'+evtid).addClass('becalEventMouseOver');
	}
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
	
	// color for a new entry.
	this.newEntryColor = BeCal.eventDefaultColor;
	
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
			me.createDBEvent(d.id, startd, endd,d.eventtype, d.title, d.summary, d.color);
		}
	};
	
	// DB FUNCTIONS
	var loadEventsBetween = function(startdate, enddate, successFunc)
	{
		showBlocker();
	
		// create SQL strings from the dates.
		var d1 = Date.toSQL(startdate);
		var d2 = Date.toSQL(enddate);
	
		// set up the php request.
		var url = 'php/ajax_getEvents.php';
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
	};
	
	// load the todos for the todo screen.
	var loadTodos = function(successFunc)
	{
		showBlocker();
		
		// set up the php request.
		var url = 'php/ajax_getTodos.php';
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

	};
	
	// save an event to the DB.
	var saveToDB = function(becalevt)
	{
		showBlocker();
		// create SQL strings from the dates.
		var d1 = Date.toSQL(becalevt.startDate);
		var d2 = Date.toSQL(becalevt.endDate);
	
		// set up the php request.
		var url = 'php/ajax_CUD_event.php';
		var data = {dbid: becalevt.getDBID(),
					startdate: d1,
					enddate: d2,
					title: becalevt.title,
					summary: becalevt.summary,
					color: becalevt.color,
					eventtype: becalevt.eventtype,
					CUD: 'create'};			// the CUD event to do.
					// ^if CUD == 'create', it will create OR update an object.
					// if CUD == 'delete', it will delete the object.
		
		// success function.
		var success = function(data)
		{
			console.log("CUD event result:" +data);
			m_renderDate=me.render(m_renderDate);
			// hideBlocker(); render will load all events and show blocker in the meanwhile
		}

		$.ajax({
			type: 'POST',
			url: url,
			data: data,
			success: success,
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
	this.createEvent = function(startdate, enddate, eventtype, title, summary="", color = "")
	{
		var e = new BeCalEvent();
		e.create(startdate, enddate, eventtype, title, summary, color);
		m_eventArray.push(e);
		return e;
	};
	
	// create an event from the DB.
	this.createDBEvent = function(dbid, startdate, enddate, eventtype, title, summary="", color="")
	{
		var e = new BeCalEvent();
		e.createFromDB(dbid, startdate, enddate, eventtype, title, summary, color);
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
		mt = '<div id="'+BeCal.divNameTopbarDate+'">TO-DOs</div>';
		mt+='<div id="'+BeCal.divNameTopbarAdvancer+'">';
			mt+='<span class="becalAdvanceBtn">&nbsp;</span>';
			mt+='<a href="javascript:" class="becalAdvanceBtn becalBtn" onclick="BeCal.setStateMonth();">-&gt; Kalender</a>';
//			mt+='<a href="javascript:" class="becalAdvanceBtn" onclick="BeCal.advanceMonth(-1);">&nbsp;&lt;&nbsp;</a>';
//			mt+='<a href="javascript:" class="becalAdvanceBtn" onclick="BeCal.advanceMonth(1);">&nbsp;&gt;&nbsp;</a>';
		mt+='</div>';
		$('#'+BeCal.divNameTopMenu).html(mt);

		// clear the content
		$('#'+BeCal.divNameContent).html("");
		
		loadTodos(function()
		{
			var txt="";
			var entries = m_eventArray;
			// first get all entries in range.
			// only push the timed events first.
			var now = new Date();
			var tdyfound = 0;
			for(var i = 0;i<entries.length;i++)
			{
				var e = entries[i];
				var start = new Date(e.startDate);
				if(start>=now && tdyfound==0)
				{
					txt+="<hr />++++ HEUTE: "+now.getDate()+"."+(now.getMonth()+1)+"."+now.getFullYear()+" ++++"
					tdyfound=1;
				}
				
				if(start>=now && Date.compareOnlyDate(start,now)==false && tdyfound==1)
				{
					txt+="<hr/>"
					tdyfound = 2;
				}
				
				txt+=start.getDate()+"."+(start.getMonth()+1)+"."+start.getFullYear()+": "+e.title+"<br />";
			}
			// create the html.
			$('#'+BeCal.divNameContent).html(txt);
		});		
	};
	
	// render a month screen.
	var createMonthDisplay = function(renderdate)
	{
		var realToday = Date.removeTime(new Date());		
		var calDayNameFieldHeight = 26;	// height of the top bar with the names of the days in it.

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
		var monthBegin = new Date(renderdate.getFullYear(), renderdate.getMonth(), 1, 1, 1, 10, 0);
		var myMonth = renderdate.getMonth();

		// set the return date to month begin.
		var returnDate = Date.removeTime(monthBegin);
		
		// maybe move the date some way backward.
		var monthBeginDay = monthBegin.getDay();
		if(monthBeginDay > 0)
			monthBegin.setDate(monthBegin.getDate() - monthBeginDay);
		
		// get and set widht and height.
		var cc = $('#'+BeCal.divNameContent);
		cc.height($(m_contentDivID).height()-$('#'+BeCal.divNameTopMenu).height()-11);
		var calFieldHeight = (cc.height()-calDayNameFieldHeight)*0.2;	
		var calFieldWidth =cc.width()*(1.0/7.0);
		
		var txt="";
		// create the day name fields.
		txt+='<div class="becalDayField" style="top: 0px; left: 0px;"><div class="becalDayNumber">&nbsp;So.</div>';
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
		for(weeks=0;weeks<5;weeks++)
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
				if(weeks==4) cl+=" becalLowestCalField";
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
			if(e.startDate<=endDate && (e.endDate>=startDate && e.eventtype==0))
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
			if(e.startDate<=endDate && e.eventtype==1)
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
	
	// create the (static) UI of the calendar app.
	var createUI = function()
	{
		// first, fill the content div.
		var txt = "";
		txt+='<div id="'+BeCal.divNameTopMenu+'"></div>';	// the top bar menu.
		txt+='<div id="'+BeCal.divNameContent+'"></div>';	// the calendar content.
		txt+='<div id="'+BeCal.divNameOverlay+'"></div>';	// the overlay for the jdoor windows.
		$(m_contentDivID).html(txt);
		
		// create the windows.
		// create the html for the edit entry view.
		txt ="";
		txt+='<div>';
			txt+='<table border="0"><tr><td>';
				txt+='<input type="text" id="'+BeCal.inputNameTime1+'" class="becalInputTime becalInputMouseOver" value="12:34" /><br />';
				txt+='<input type="text" id="'+BeCal.inputNameDate1+'" class="becalInputDate becalInputMouseOver" size="50" value="Sun., 30. Sept. 1967" />';
			txt+='</td><td><div class="becalInputMiddlestrich">-</div></td><td>';
				txt+='<input type="text" id="'+BeCal.inputNameTime2+'" class="becalInputTime becalInputMouseOver" value="12:34" /><br />';
				txt+='<input type="text" id="'+BeCal.inputNameDate2+'" class="becalInputDate becalInputMouseOver" size="50" value="Sun., 30. Sept. 1967" />';
			txt+='</td></tr></table>';
			txt+='<div id="'+BeCal.divNameColorPicker+'">';
				txt+='<input id="'+BeCal.inputNameColorPicker+'" />';
			txt+='</div>';
			
			txt+='<input id="'+BeCal.inputNameCheckTodo+'" class="check-todo" type="checkbox" value="unchecked" />';				
			
			txt+='<div class="becalEditButtonDiv" id="'+BeCal.divNameEditContainer+'">';
				txt+='<a href="javascript:" class="becalOkBtn becalEditBtn" onclick="BeCal.createNewEventBtnPressed()"></a>';
			txt+='</div>';
			
			// NEW: just the buttons for the show stuff, not more.
			txt+='<div class="becalEditButtonDiv" id="'+BeCal.divNameShowContainer+'"><nobr>';
				txt+='<a href="javascript:" class="becalBadBtn becalDeleteBtn" onclick="BeCal.deleteEventBtnPressed()"></a>&nbsp;';
				txt+='<a href="javascript:" class="becalOkBtn becalEditBtn" onclick="BeCal.updateEventBtnPressed()"></a>';
			txt+='</nobr></div>';
			
		txt+='</div>';
		
		// show the duration of the event.
		txt+='<div class="becalEntryDurationDiv"></div>';
		
		// create the title.
		var title ='<div id="'+BeCal.divNameEditTitle+'">';
			title+='<input type="text" id="'+BeCal.inputNameEventTitle+'" class="becalInputEventName w80" placeholder="Titel hinzufügen"></input>';
		title+='</div>'; //<div id="'+BeCal.divNameShowTitle+'" class="becalInputEventName"> EVENT TITLE </div>';
		
		// create the window.
		$('#'+BeCal.divNameOverlay).jdCreateWindow(BeCal.editEntryWindow,100,100,500,220, title, txt);
		
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
	};
	
	// constrain the date inputs so that the end date cannot be < start date.
	var constrainDateInput = function()
	{
		if(m_isChangingDateInput)
		{
//			console.log("already changing");
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
	
	// show the duration between the two dates on the edit/show event window.
	var showEntryDuration = function(date1 = false, date2 = false)
	{
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
	
		// return days.
		var days = Date.daysBetween(daytime1, daytime2)-1;
		daytime2.setDate(daytime1.getDate());
		
		if(days>=30)
			isBig=">= "+parseInt(days/30)+" Monat/e";
	
		if(days>=364)
			isBig=">= "+parseInt(days/364)+" Jahr/e";

		// return hours
		var hours = daytime2.getHours()-daytime1.getHours();
		daytime2.setHours(daytime1.getHours());
	
		// return minutes
		var minutes=daytime2.getMinutes()-daytime1.getMinutes();
		daytime2.setMinutes(daytime1.getMinutes());
		
		// adjust times
		if(minutes<0)
		{
			minutes=minutes+60;
			hours-=1;
		}
	
		if(hours<0)
		{
			hours=hours+24;
			days-=1;
		}
		
		// create duration text.
		if(!isBig)
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
			txt+=isBig;
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
		var txt='';
		var count = 0;
		for(var i=0;i<m_eventArray.length;i++)
		{
			var e = m_eventArray[i];
			if(Date.removeTime(e.startDate)<=Date.removeTime(dayfield.date) && Date.removeTime(e.endDate)>=Date.removeTime(dayfield.date))
			{
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
	
		$('#'+BeCal.otherEntriesWindow).hide();
		$('#'+BeCal.editEntryWindow).hide();	
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
	var showEditWindow = function(posX, posY, entryWidth)
	{
		hideAllWindows();
	
		var win = $('#'+BeCal.editEntryWindow);
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
	
		showEditWindow(parseInt(f.left),parseInt(f.top)+menuHeight, f.width);
		$('#'+BeCal.inputNameEventTitle).focus();
	};
	
	// open the dialog to show the event view.
	m_selectedEvent = null;
	this.openEventViewDialog = function(eventid)
	{
		var evt = me.getEventByID(eventid);
		m_selectedEvent = evt;
		//var evt = BeCal.entries[eventid];
		if(evt==null)
		{
			console.log("FATAL: Event with id "+eventid+" not found.");
			m_selectedEvent = null;
			return;
		}
		
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

		// show the duration of the event.
		showEntryDuration(evt.startDate, evt.endDate);
	
		// set the event color.
		changeEntryWindowEvtColor(evt.color);
		
		// NEW: also set the color picker color.
		$('#'+BeCal.inputNameColorPicker).spectrum("set", evt.color);
	
		// show the window.
		showEditWindow(parseInt(left),parseInt(top), 1);
	};
	
	// create a new event from the data in the edit window.
	this.createNewEventBtnPressed = function()
	{
		// create the entry with the date from the window.
		var e = new BeCalEvent();
		var start=Date.setTime(AnyTime.getCurrent(BeCal.inputNameDate1), AnyTime.getCurrent(BeCal.inputNameTime1));
		var end=Date.setTime(AnyTime.getCurrent(BeCal.inputNameDate2), AnyTime.getCurrent(BeCal.inputNameTime2));
		e.create(start, end, 0, $('#'+BeCal.inputNameEventTitle).val(), "", this.newEntryColor);
		m_eventArray.push(e);
	
		$('#'+BeCal.editEntryWindow).hide();
		$('#'+BeCal.inputNameEventTitle).val("");
		
		saveToDB(e);		
	};
	
	// update an event.
	this.updateEventBtnPressed = function()
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

		saveToDB(m_selectedEvent);
		m_selectedEvent = null;
		
		$('#'+BeCal.editEntryWindow).hide();
		$('#'+BeCal.inputNameEventTitle).val("");
 	};
	
	// delete a selected element.
	this.deleteEventBtnPressed = function()
	{
		// selectedevent will be set when you click on an existing event.
		if(m_selectedEvent!=null)
			removeFromDB(m_selectedEvent);
		m_selectedEvent = null;
		
		$('#'+BeCal.editEntryWindow).hide();
		$('#'+BeCal.inputNameEventTitle).val("");
	};
	
	// INIT
	if(BeCal.instance == null)
	{	
		BeCal.instance = me;
		createUI();
	}else{
		console.log("WARNING: There is already a BeCal instance. Aborting.");
	}
};

BeCal.instance = null;	// the singleton instance of this calendar.
// create a new entry from the new entry window.
BeCal.createNewEventBtnPressed = function()
{
	if(BeCal.instance!=null)
		BeCal.instance.createNewEventBtnPressed();
};

// update an existing event.
BeCal.updateEventBtnPressed = function()
{
	if(BeCal.instance!=null)
		BeCal.instance.updateEventBtnPressed();
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


// TEXT MONTH NAMES ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

BeCal.monthNames = ["Jan.", "Feb.", "März", "April", "Mai", "Juni",
					"July", "Aug.", "Sept.", "Okt.", "Nov.", "Dez."];
BeCal.monthNamesL = ["Januar", "Februar", "März", "April", "Mai", "Juni",
					"July", "August", "September", "Oktober", "November", "Dezember"];

// DIV and other IDs +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

// ids for the windows.
BeCal.editEntryWindow = "becalEditEntryWindow";
BeCal.otherEntriesWindow = "becalOtherEntriesWindow";

// ids for the main items.
BeCal.divNameTopMenu = "becalTopMenuDiv";
BeCal.divNameContent = "becalContentDiv";
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
//BeCal.divNameShowTitle = "becalUITitleShowDiv";
//BeCal.showNameTime1 = "becalUITimeShow1";
//BeCal.showNameTime2 = "becalUITimeShow2";
//BeCal.showNameDate1 = "becalUIDateShow1";
//BeCal.showNameDate2 = "becalUIDateShow2";

// DEFAULT VALUES ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

// the default color for an event.
BeCal.eventDefaultColor = "#333399";

BeCal.eventSlotHeight = 17;			// height of one slot in pixels.
BeCal.calendarFieldTopHeight = 20;	// height of the top bar with the day number of a calender field.

// the event bar height in pixels, without borders.
BeCal.eventBarHeight = 12;