/* Ben0bis Calendar, V2. */

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
}

// set just the day, month and year of a date, not the time.
Date.compareOnlyDate=function(d1,d2)
{
	if(d1.getDate()==d2.getDate() && d1.getMonth()==d2.getMonth() && d1.getFullYear()==d2.getFullYear())
		return true;
	return false;
}

// set the time parameters to 0,0,1,0
Date.removeTime = function(dat)
{
	var d = new Date(dat);
	d.setHours(0);
	d.setMinutes(0);
	d.setSeconds(1);
	d.setMilliseconds(0);
	return d;
}

/* set only the time of a specific date. */
Date.setTime = function(date, time)
{
	var d = new Date(date);
	d.setHours(time.getHours());
	d.setMinutes(time.getMinutes());
	d.setSeconds(time.getSeconds());
	return d;
}

// EVENT STRUCTURE ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

var BeCalEvent = function()
{
	var me = this;
	this.title = "Ohne Titel";				// title of the event.
	this.summary = "";						// summary of the event. (NOT YET USED)
	this.startDate = new Date();			// start date of the event.
	this.endDate = new Date();				// end date of the event.
	this.color = BeCal.eventDefaultColor;	// color of the event bars.
	var m_id=-1;							// internal unique id for fast search and stuff.
	this.getID = function() {return m_id;};	// return the unique id.
	
	// create the event.
	this.create = function(start, end, newtitle, newsummary="", newcolor = "") 
	{
		me.title = newtitle;
		me.summary = newsummary;
		me.startDate = new Date(start);
		me.endDate = new Date(end);
		if(newcolor=="")
			me.color=BeCal.eventDefaultColor;
		else
			me.color=newcolor;
		
		// assign an unique id.
		m_id=BeCalEvent.arrID;
		BeCalEvent.arrID++;		
	};
	
	// create the bar div and return it.
	var getBarDivText=function(text, x,y,width, height, addclass = "")
	{
		var txt='<div onclick="BeCal.openEventViewDialog('+m_id+');" onmouseover="BeCal.evtMouseOver('+m_id+');" onmouseout="BeCal.evtMouseOver('+m_id+', true);" class="becalEventBar '+addclass+' becalEventMouseOut evt_'+m_id+'" style="background-color:'+me.color+'; top:'+y+'px; left:'+x+'px; width:'+width+'px; height:'+height+'px;">'+text+'</div>';
		return txt;
	};
	
	// TODO: UNCOMMENT
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

		var firstDay = Date.removeTime(dayfields[0].date);					// first date on the table.
		var lastDay = Date.removeTime(dayfields[dayfields.length-1].date);	// last date on the table.
		var evtStartDay = Date.removeTime(this.startDate);					// start date of the event.
		var evtEndDay = Date.removeTime(this.endDate);						// end date of the event.
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
		while(!done)
		{	
			turn+=1;
			if(actualdate>evtEndDay)
			{
				//console.log("-- aborting: actualdate > enddate--");
				return result;
			}
	
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
//							result+='<div onclick="BeCal.openEventViewDialog('+m_id+');" onmouseover="BeCal.evtMouseOver('+m_id+');" onmouseout="BeCal.evtMouseOver('+m_id+', true);" class="calEventBar calEventMarker calEventMouseOut '+evtclass+'" style="background-color: '+this.color+'; top:'+realPosY+'px; left:'+(posX+1)+'px; width:10px; height:'+height+'px;"></div>';
							result += getBarDivText("", posX+1, realPosY, 10, height, "becalEventMarker");
							posX+=5;
							width-=5;
							firstone = false;
						}
						// add the bar.
						//result+='<div onclick="BeCal.openEventViewDialog('+m_id+');" onmouseover="BeCal.evtMouseOver('+m_id+');" onmouseout="BeCal.evtMouseOver('+m_id+', true);" class="calEventBar calEventMouseOut calEventNoBorder '+evtclass+'" style="background-color: '+this.color+'; top:'+realPosY+'px; left:'+posX+'px; width:'+width+'px; height:'+height+'px;">'+this.title+'</div>';
						result += getBarDivText(this.title, posX, realPosY, width, height, "becalEventNoBorder");
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
				//result+='<div onclick="BeCal.openEventViewDialog('+m_id+');" onmouseover="BeCal.evtMouseOver('+m_id+');" onmouseout="BeCal.evtMouseOver('+m_id+', true);" class="calEventBar calEventMarker calEventMouseOut '+evtclass+'" style="background-color: '+this.color+'; top:'+realPosY+'px; left:'+(posX+1)+'px; width:10px; height:'+height+'px;"></div>';
				result += getBarDivText("", posX+1, realPosY, 10, height, "becalEventMarker");
				posX+=5;
				width-=5;
				firstone = false;
			}
			
			// add the end marker.
			if(evtEndDay<=lastDay)
			{
				width-=10;			
//				result+='<div onclick="BeCal.openEventViewDialog('+m_id+');" onmouseover="BeCal.evtMouseOver('+m_id+');" onmouseout="BeCal.evtMouseOver('+m_id+', true);" class="calEventBar calEventMarker calEventMouseOut '+evtclass+'" style="background-color: '+this.color+'; top:'+realPosY+'px; left:'+(posX+width-4)+'px; width:10px; height:'+height+'px;"></div>';
				result += getBarDivText("", posX+width-4, realPosY, 10, height, "becalEventMarker");
			}
			
			// add the last bar (see above)
			//result+='<div onclick="BeCal.openEventViewDialog('+m_id+');" onmouseover="BeCal.evtMouseOver('+m_id+');" onmouseout="BeCal.evtMouseOver('+m_id+', true);" class="calEventBar calEventMouseOut calEventNoBorder '+evtclass+'" style="background-color: '+this.color+'; top:'+realPosY+'px; left:'+posX+'px; width:'+width+'px; height:'+height+'px;">'+this.title+'</div>';
			result += getBarDivText(this.title, posX, realPosY, width, height, "becalEventNoBorder");
			
			if(remainingDays<=0 && !newline)
				done=true;
		}
		// return the html text.
		return result;
	}
}
// next unique id for an event.
BeCalEvent.arrID = 0;

// A DAY FIELD IN THE UI +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

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
	
	// create an event and add it to the list.
	this.createEvent = function(startdate, enddate, title, summary="", color = "")
	{
		var e = new BeCalEvent();
		e.create(startdate,enddate,title, summary, color);
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
			default:
				console.log("RENDER ERROR: Renderstate not accepted.");
				return new Date();
		}
		// FATAL ERROR.
		console.log("FATAL RENDER ERROR!");
		return null;
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
		mt+='<a href="javascript:" class="becalAdvanceBtn becalBtn" onclick="BeCal.getToday();">Heute</a>';
		mt+='<a href="javascript:" class="becalAdvanceBtn" onclick="advanceMonth(-1);">&nbsp;&lt;&nbsp;</a>';
		mt+='<a href="javascript:" class="becalAdvanceBtn" onclick="advanceMonth(1);">&nbsp;&gt;&nbsp;</a>';
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
				txt+='<div class="becalField'+cl+'" style="top:'+posY+'px; left: '+posX+'px;" onclick="BeCal.openEntryDialog('+id+');">';
				txt+='<div class="becalDayNumber">&nbsp;'+dt+'</div>';
				txt+='<div class="becalDayHiddenEvents" id="becalDayHiddenEvtWrapper_'+id+'" onclick="BeCal.showHiddenEventView('+id+');">';
				txt+='<div id="becalDayHiddenEvt_'+id+'" class="becalDayHiddenEventContent">&nbsp;+ 0</div></div>';
				txt+='</div>';
			}
		}

		// create all the event bars.
		var sortedFields = sortEventsByLength(startScreenDate, endScreenDate);
		for(e=0;e<sortedFields.length;e++)
		{
			var event = sortedFields[e];
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

		return returnDate;
	};
	
	// sort all the events of the calendar by length. longest first.
	var sortEventsByLength = function(startDate, endDate)
	{
		//console.log("Sorting between "+startDate+" / "+endDate);
		var arr = new Array();
		var entries = m_eventArray;
		// first get all entries in range.
		for(var i = 0;i<entries.length;i++)
		{
			var e = entries[i];
			if(e.startDate<=endDate && e.endDate>=startDate)
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
		txt+='<div id="'+BeCal.divNameEditContainer+'">';
			txt+='<table border="0"><tr><td>';
				txt+='<input type="text" id="'+BeCal.inputNameTime1+'" class="becalInputTime becalInputMouseOver" value="12:34" /><br />';
				txt+='<input type="text" id="'+BeCal.inputNameDate1+'" class="becalInputDate becalInputMouseOver" size="50" value="Sun., 30. Sept. 1967" />';
			txt+='</td><td><div class="becalInputMiddlestrich">-</div></td><td>';
				txt+='<input type="text" id="'+BeCal.inputNameTime2+'" class="becalInputTime becalInputMouseOver" value="12:34" /><br />';
				txt+='<input type="text" id="'+BeCal.inputNameDate2+'" class="becalInputDate becalInputMouseOver" size="50" value="Sun., 30. Sept. 1967" />';
			txt+='</td></tr></table>';
			txt+='<div id="'+BeCal.divNameColorPicker+'"><input id="'+BeCal.inputNameColorPicker+'" /></div>';
			txt+='<div class="becalEditButtonDiv">';
				txt+='<a href="javascript:" class="becalOkBtn" onclick="BeCal.createNewEventBtnPressed()">Speichern</a>';
			txt+='</div>';
		txt+='</div>';
		
		// window for the show stuff.
		txt+='<div id="'+BeCal.divNameShowContainer+'">';
			txt+='<table border="0"><tr><td>';
				txt+='<div id="'+BeCal.showNameTime1+'" class="becalInputTime"></div>';
				txt+='<div id="'+BeCal.showNameDate1+'" class="becalInputDate"></div>';
			txt+='</td><td><div class="becalInputMiddlestrich">-</div></td><td>';
				txt+='<div id="'+BeCal.showNameTime2+'" class="becalInputTime"></div>';
				txt+='<div id="'+BeCal.showNameDate2+'" class="becalInputDate"></div>';
			txt+='</td></tr></table>';
			txt+='<div class="becalEditButtonDiv">';
				txt+='<a href="" class="becalOkBtn becalEditBtn"></a>';
			txt+='</div>';
		txt+='</div>';
		
		// show the duration of the event.
		txt+='<div class="becalEntryDurationDiv"></div>';
		
		// create the title.
		var title ='<div id="'+BeCal.divNameEditTitle+'">';
			title+='<input type="text" id="'+BeCal.inputNameEventTitle+'" class="becalInputEventName w80" placeholder="Titel hinzufügen"></input>';
		title+='</div><div id="'+BeCal.divNameShowTitle+'" class="becalInputEventName"> EVENT TITLE </div>';
		
		// create the window.
		$('#'+BeCal.divNameOverlay).jdCreateWindow(BeCal.editEntryWindow,100,100,500,200, title, txt);
		
		// *************************************************************
		// the other entries window.
		title ="Weitere";
		txt='<div id="'+BeCal.otherEntriesDiv+'"></div>';
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
				entryColorPickerChanged(color);
			},
			move: function(color)
			{
				entryColorPickerChanged(color);
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
		}else{
			// get times from the parameters.
			daytime1=new Date(date1);
			daytime2=new Date(date2);
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
			minutes=60-minutes;
			hours-=1;
		}
	
		if(hours<0)
		{
			hours=24 - hours;
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
		
			if(days==hours==minutes==0)
			{
				txt = "Zeitlos";
			}
		}else{
			txt+=isBig;
		}
		
		// set the divs content.
		durationdiv.each(function() {$(this).html(txt);});
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
}

// get the actual date.
BeCal.getToday = function()
{
	if(BeCal.instance!=null)
		BeCal.instance.getToday();
}

// render the stored date
BeCal.render = function()
{
	if(BeCal.instance!=null)
		BeCal.instance.render(BeCal.instance.getRenderDate());
}

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

// ids for the show entry window
BeCal.divNameShowContainer = "becalUIShowEntryContainer";
BeCal.divNameShowTitle = "becalUITitleShowDiv";
BeCal.showNameTime1 = "becalUITimeShow1";
BeCal.showNameTime2 = "becalUITimeShow2";
BeCal.showNameDate1 = "becalUIDateShow1";
BeCal.showNameDate2 = "becalUIDateShow2";

// DEFAULT VALUES ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

// the default color for an event.
BeCal.eventDefaultColor = "#333399";

BeCal.eventSlotHeight = 17;			// height of one slot in pixels.
BeCal.calendarFieldTopHeight = 20;	// height of the top bar with the day number of a calender field.

// the event bar height in pixels, without borders.
BeCal.eventBarHeight = 12;