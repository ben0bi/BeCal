var BeCal = function() {};

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

// ++++++++++++++++++++++++++++++++++++++++++++++++ ENDOF DATE

// a calendar event
var CalEntry = function() 
{
	this.title = "Ohne Titel";
	this.summary = "";
	this.startDate = new Date();
	this.endDate = new Date();
	this.color = BeCal.evtDefaultColor;
	var m_id=-1;
	this.getID = function() {return m_id;};
	
	this.create = function(start, end, newtitle, newsummary="", newcolor = "") 
	{
		this.title = newtitle;
		this.summary = newsummary;
		this.startDate = start;
		this.endDate = end;
		if(newcolor=="")
			this.color=BeCal.evtDefaultColor;
		else
			this.color=newcolor;
		m_id=CalEntry.arrID;
		CalEntry.arrID++;
	}
	
	// create the bar div and return it.
	this.createMonthBars=function(dayfields)
	{
		var posX=0;						// x position to calculate with.
		var posY=0;						// y position to calculate with.
		var realPosY=0;					// the real y position.
		//var realPosX = 0;				// the real x position.
		var width=0;					// the bar width.
		var height=BeCal.evtHeight;		// the bar height.
		
		var evtclass = "evt_"+m_id;	// this bars own class.

		var result = "";	// the returning html text.

		var firstDay = Date.removeTime(dayfields[0].date);					// first date on the table.
		var lastDay = Date.removeTime(dayfields[dayfields.length-1].date);	// last date on the table.
		var evtStartDay = Date.removeTime(this.startDate);					// start date of the event.
		var evtEndDay = Date.removeTime(this.endDate);						// end date of the event.
		var actualdate = new Date(evtStartDay);								// actual date for the bars.
		var mydayfield=dayfields[0];										// field on table for the actual date.
		
		// get a free slot between the two dates.
		var myslot = BeCal.getFreeSlotBetween(evtStartDay,evtEndDay, BeCal.fields, true);
		
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
				mydayfield = BeCal.getDayField(actualdate,BeCal.fields);
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
			realPosY=mydayfield.top+BeCal.calFieldTopHeight+(myslot*BeCal.evtSlotHeight);
			
			width = 0;
		
			//console.log("X: "+parseInt(posX)+" Y: "+parseInt(posY));
	
			var r = remainingDays;
			var newline=false;
			width-=5; // include padding into the width.
			for(w=0;w<r;w++)
			{
				var nd = Date.removeTime(actualdate);
				nd.setDate(nd.getDate()+w);
				
				var newdayfield = BeCal.getDayField(nd, BeCal.fields);
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
						if(firstone==true && evtStartDay>=firstDay)
						{
							// maybe add the start marker.
							result+='<div onclick="BeCal.openEventViewDialog('+m_id+');" onmouseover="BeCal.evtMouseOver('+m_id+');" onmouseout="BeCal.evtMouseOver('+m_id+', true);" class="calEventBar calEventMarker calEventMouseOut '+evtclass+'" style="background-color: '+this.color+'; top:'+realPosY+'px; left:'+(posX+1)+'px; width:10px; height:'+height+'px;"></div>';
							posX+=5;
							width-=5;
							firstone = false;
						}
						result+='<div onclick="BeCal.openEventViewDialog('+m_id+');" onmouseover="BeCal.evtMouseOver('+m_id+');" onmouseout="BeCal.evtMouseOver('+m_id+', true);" class="calEventBar calEventMouseOut calEventNoBorder '+evtclass+'" style="background-color: '+this.color+'; top:'+realPosY+'px; left:'+posX+'px; width:'+width+'px; height:'+height+'px;">'+this.title+'</div>';
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
				result+='<div onclick="BeCal.openEventViewDialog('+m_id+');" onmouseover="BeCal.evtMouseOver('+m_id+');" onmouseout="BeCal.evtMouseOver('+m_id+', true);" class="calEventBar calEventMarker calEventMouseOut '+evtclass+'" style="background-color: '+this.color+'; top:'+realPosY+'px; left:'+(posX+1)+'px; width:10px; height:'+height+'px;"></div>';
				posX+=5;
				width-=5;
				firstone = false;
			}
			
			// add the end marker.
			if(evtEndDay<=lastDay)
			{
				width-=10;			
				result+='<div onclick="BeCal.openEventViewDialog('+m_id+');" onmouseover="BeCal.evtMouseOver('+m_id+');" onmouseout="BeCal.evtMouseOver('+m_id+', true);" class="calEventBar calEventMarker calEventMouseOut '+evtclass+'" style="background-color: '+this.color+'; top:'+realPosY+'px; left:'+(posX+width-4)+'px; width:10px; height:'+height+'px;"></div>';
			}
			
			// add the last bar (see above)
			result+='<div onclick="BeCal.openEventViewDialog('+m_id+');" onmouseover="BeCal.evtMouseOver('+m_id+');" onmouseout="BeCal.evtMouseOver('+m_id+', true);" class="calEventBar calEventMouseOut calEventNoBorder '+evtclass+'" style="background-color: '+this.color+'; top:'+realPosY+'px; left:'+posX+'px; width:'+width+'px; height:'+height+'px;">'+this.title+'</div>';
			
			if(remainingDays<=0 && !newline)
				done=true;
		}	
		return result;
	}
}
CalEntry.arrID = 0;

// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++ ENDOF CALENTRY

// how many slots can be in a day field?
BeCal.evtMaxSlots = 5;			// maximum slots. will be set on each render.
BeCal.evtSlotHeight = 17;		// height of one slot in pixels.
BeCal.evtHeight = 12;			// height of an event (without borders)
BeCal.calFieldTopHeight = 20;	// height of the top bar with the day number of a calender field.
BeCal.evtDefaultColor = "#333399";
// a day field with its position and size.

var CalDayField = function(day,x,y,w,h)
{
	this.date = Date.removeTime(day);
	this.top = y;
	this.left = x;
	this.width = w;
	this.height = h;
	
	// the slots are used to draw events above each other.
	var slots = new Array(BeCal.evtMaxSlots);
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

// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++ ENDOF CALDAYFIELD

// the list with all calendar entries.
BeCal.entries = new Array();
// the list with all the fields on the screen.
BeCal.fields = new Array();

BeCal.monthNames = ["Jan.", "Feb.", "März", "April", "Mai", "Juni",
					"July", "Aug.", "Sept.", "Okt.", "Nov.", "Dez."];
BeCal.monthNamesL = ["Januar", "Februar", "März", "April", "Mai", "Juni",
					"July", "August", "September", "Oktober", "November", "Dezember"];

					
// get the day field associated to a date.
BeCal.getDayField = function(date, fields)
{
	for(var q=0;q<fields.length;q++)
	{
		if(Date.compareOnlyDate(date,fields[q].date)==true)
			return fields[q];
	}
	return 0;
}

// return a slot index number which is free on all days between the two dates.
// returns -1 if no slot was found.
BeCal.getFreeSlotBetween = function(date1, date2, fields, occupyslots=false)
{
	//console.log("Getting free slots between: "+date1+" to " +date2);
	
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
	for(slot=0;slot<BeCal.evtMaxSlots;slot++)
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

// mouse over an event, highlight all their bars.
BeCal.evtMouseOver = function(evtid, mouseOut=false)
{
	if(mouseOut)
	{
		$('.evt_'+evtid).removeClass('calEventMouseOver');
		$('.evt_'+evtid).addClass('calEventMouseOut');
	}else{
		$('.evt_'+evtid).removeClass('calEventMouseOut');
		$('.evt_'+evtid).addClass('calEventMouseOver');
	}
}

// today needs to be a date.
BeCal.createMonthDisplay=function(today)
{
	console.log("--- creating month display ---")
	var myMonth = today.getMonth();
	var realToday = Date.removeTime(new Date());
	
	var calDayNameFieldHeight = 26;

	// build menu.
	var mt = "";
	mt = '<div id="calMonthName">'+BeCal.monthNamesL[today.getMonth()]+" "+today.getFullYear()+"</div>";
	mt+='<div id="calMonthAdvancer">';
	mt+='<a href="javascript:" class="advBtn calBtn" onclick="BeCal.getToday();">Heute</a>';
	mt+='<a href="javascript:" class="advBtn" onclick="advanceMonth(-1);">&nbsp;&lt;&nbsp;</a>';
	mt+='<a href="javascript:" class="advBtn" onclick="advanceMonth(1);">&nbsp;&gt;&nbsp;</a>';
	mt+='</div>';
	$('#calMenu').html(mt);

	// get the month begin.
	var monthBegin = new Date(today.getFullYear(), today.getMonth(), 1, 1, 1, 10, 0);
	var returnDate = Date.removeTime(monthBegin);
	var myMonth = today.getMonth();
	
	// maybe move the date some way forward.
	var monthBeginDay = monthBegin.getDay();
	if(monthBeginDay > 0)
		monthBegin.setDate(monthBegin.getDate() - monthBeginDay);

	// get and set widht and height.
	$('#calContent').height($('#content').height()-$('#calMenu').height()-11);
	var calFieldHeight = ($("#calContent").height()-calDayNameFieldHeight)*0.2;	
	var calFieldWidth =$("#calContent").width()*(1.0/7.0);
	
	var txt="";
	// create the day name fields.
	txt+='<div class="calDayField" style="top: 0px; left: 0px;"><div class="calDayNumber">&nbsp;So.</div>';
	txt+='<div class="calDayField" style="top: 0px; left: '+(calFieldWidth)+'px;"><div class="calDayNumber">&nbsp;Mo.</div></div>';
	txt+='<div class="calDayField" style="top: 0px; left: '+(calFieldWidth*2)+'px;"><div class="calDayNumber">&nbsp;Di.</div></div>';
	txt+='<div class="calDayField" style="top: 0px; left: '+(calFieldWidth*3)+'px;"><div class="calDayNumber">&nbsp;Mi.</div></div>';
	txt+='<div class="calDayField" style="top: 0px; left: '+(calFieldWidth*4)+'px;"><div class="calDayNumber">&nbsp;Do.</div></div>';
	txt+='<div class="calDayField" style="top: 0px; left: '+(calFieldWidth*5)+'px;"><div class="calDayNumber">&nbsp;Fr.</div></div>';
	txt+='<div class="calDayField lastCalField" style="top: 0px; left: '+(calFieldWidth*6)+'px;"><div class="calDayNumber">&nbsp;Sa.</div></div>';
	
	// create each day field.
	BeCal.fields = new Array();
	
	// set the max slots.
	BeCal.evtMaxSlots = 0;
	if(calFieldHeight-BeCal.calFieldTopHeight>0)
		BeCal.evtMaxSlots = parseInt((calFieldHeight-BeCal.calFieldTopHeight) / BeCal.evtSlotHeight)-1; // one is left for the multievent link.
	
	if(BeCal.evtMaxSlots<0)
		BeCal.evtMaxSlots=0;
	
	// console.log("----- Max Slots: "+BeCal.evtMaxSlots);
	
	// draw each day field and create its array member.
	var startScreenDate = new Date(Date.removeTime(monthBegin));
	var endScreenDate = new Date(startScreenDate);
	endScreenDate.setDate(startScreenDate.getDate()+35);
	for(weeks=0;weeks<5;weeks++)
	{  
		for(days=0;days<7;days++)
		{
			var mydate = Date.removeTime(monthBegin);
			mydate.setDate(monthBegin.getDate()+(weeks*7 + days));
			var posY = calFieldHeight*weeks+calDayNameFieldHeight;
			var posX = calFieldWidth*days;
			var cl="";
			if(days==6) cl=" lastCalField";
			if(weeks==4) cl+=" lowestCalField";
			if(Date.compareOnlyDate(realToday, mydate)==true)
				cl+=" calToday";
			var dt = mydate.getDate();
			if(mydate.getDate()==1)
				dt+=". "+BeCal.monthNames[mydate.getMonth()];
			
			// create the day field.
			var f = new CalDayField(mydate,posX,posY,calFieldWidth, calFieldHeight);
			BeCal.fields.push(f);
			var id=BeCal.fields.length-1; // id is the last index.
			txt+='<div class="calField'+cl+'" style="top:'+posY+'px; left: '+posX+'px;" onclick="BeCal.openEntryDialog('+id+');">';
			txt+='<div class="calDayNumber">&nbsp;'+dt+'</div>';
			txt+='<div class="calDayHiddenEvents" id="calDayHiddenEvtWrapper_'+id+'" onclick="BeCal.showHiddenEventView('+id+');"><div id="calDayHiddenEvt_'+id+'" class="calDayHiddenEventContent">&nbsp;+ 0</div></div>';
			txt+='</div>';
		}
	}
	
	// create all the event bars.
	var sortedFields = BeCal.sortEventsByLength(BeCal.entries, startScreenDate, endScreenDate);
	for(e=0;e<sortedFields.length;e++)
	{
		var event = sortedFields[e];
		txt+=event.createMonthBars(BeCal.fields);
	}
	
	// create the html.
	$("#calContent").html(txt);
	
	// set hidden event numbers.
	for(i=0;i<BeCal.fields.length;i++)
	{
		var f = BeCal.fields[i];
		if(f.hiddenEventCount>0)
		{
			$('#calDayHiddenEvt_'+i).html("+ "+f.hiddenEventCount);
			$('#calDayHiddenEvtWrapper_'+i).show();
		}else{
			$('#calDayHiddenEvt_'+i).html("");
			$('#calDayHiddenEvtWrapper_'+i).hide();
		}
	}
	
	// create width and height.
	$(".calDayField").each(function()
	{
		$(this).width(calFieldWidth);
	});
	$(".calField").each(function()
	{
		$(this).width(calFieldWidth);
		$(this).height(calFieldHeight);
	});
	
	// stop hidden events from clicking through
	$('.calDayHiddenEvents').click(function(e) 
	{
		// prevent the mouse from clicking through.
		e.stopPropagation();
	});
	
	// return the given date + x?	
	return returnDate;
}

// get the month of today.
BeCal.getToday=function() {BeCal.globaltoday = BeCal.createMonthDisplay(new Date());}

// sort the entrys by length.
BeCal.sortEventsByLength =function(entries, startDate, endDate)
{
	//console.log("Sorting between "+startDate+" / "+endDate);
	var arr = new Array();
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
}

// advance the month.
function advanceMonth(amount)
{
	var dt = BeCal.globaltoday;
	dt.setMonth(dt.getMonth()+amount);
	BeCal.globaltoday = BeCal.createMonthDisplay(dt);
	return BeCal.globaltoday;
}

// show the entry window to show an event (show mode)
BeCal.openEventViewDialog = function(eventid)
{
	console.log("EVT ID: "+eventid);
	var evt = BeCal.entries[eventid];
	
	var left=10;
	var top = 10;
	var menuHeight = $('#calMenu').height()+$('.calDayField').height();
	
	// it is an old entry, so we show the show stuff and hide the input stuff (show mode).
	$('#calNewEntryMenuDiv').hide();
	$('#calEntryShowDiv').show();
	
	$('#calTitleInputDiv').hide();
	$('#calTitleShowDiv').show();
	
	$('#calTitleShowDiv').html(evt.title);
	
	// set the dates in the inputs so we can get their formatted values for the non-input text.
	AnyTime.setCurrent( "calDateInput1", evt.startDate);
	AnyTime.setCurrent( "calDateInput2", evt.endDate);
	AnyTime.setCurrent( "calTimeInput1", evt.startDate);
	AnyTime.setCurrent( "calTimeInput2", evt.endDate);
	
	// now copy their values.
	$('#calTimeShow1').html($("#calTimeInput1").val());
	$('#calTimeShow2').html($("#calTimeInput2").val());
	$('#calDateShow1').html($("#calDateInput1").val());
	$('#calDateShow2').html($("#calDateInput2").val());

	// show the duration of the event.
	BeCal.showEntryDuration(evt.startDate, evt.endDate);
	
	// set the event color.
	BeCal.changeEntryWindowEvtColor(evt.color);
	
	showEntryWindow(parseInt(left),parseInt(top)+menuHeight, 1);
}

// show the new entry window at the desired position near the field where you clicked.
BeCal.openEntryDialog =function(becalfieldid) 
{
	var f = BeCal.fields[becalfieldid];
	
	var now = new Date();
	var day = new Date(f.date);

	// set the time to the day.
	day.setHours(now.getHours());
	day.setMinutes(now.getMinutes());
	day.setSeconds(0);
	
	var day2 = new Date(day);
	day2.setHours(day2.getHours()+1);
	
	// set the date fields.
	AnyTime.setCurrent( "calDateInput1", day);
	AnyTime.setCurrent( "calTimeInput1", day);
	
	AnyTime.setCurrent( "calDateInput2", day2);
	AnyTime.setCurrent( "calTimeInput2", day2);
	
	var menuHeight = $('#calMenu').height()+$('.calDayField').height();
	
	// it is a new entry, so we show the input stuff and hide the show stuff (entry mode).
	$('#calNewEntryMenuDiv').show();
	$('#calEntryShowDiv').hide();
	
	$('#calTitleInputDiv').show();
	$('#calTitleShowDiv').hide();
	
	BeCal.changeEntryWindowEvtColor(BeCal.evtNewEntryColor);
	
	showEntryWindow(parseInt(f.left),parseInt(f.top)+menuHeight, f.width);
	$('#calInputName').focus();
}

/* hide all UI windows. */
BeCal.hideAllWindows=function()
{
	// hide all time picker windows.
	$(".AnyTime-win").each(function(){$(this).hide();});
	
	$('#otherEntriesWindow').hide();
	$('#createEntryWindow').hide();	
}

// show the entry window.
function showEntryWindow(posX=0, posY=0, entryWidth=0)
{
	BeCal.hideAllWindows();
	
	var win = $('#createEntryWindow');
	var content = $('#calOverlay');
	var w = win.width();
	var h = win.height();
	var cw = content.width();
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
	
	win.jdShow();
	win.focus();
}

// show the window with all the hidden events from a day in it.
BeCal.showHiddenEventView=function(dayfieldid)
{
	console.log("DFID: "+dayfieldid);
	BeCal.hideAllWindows();
	
	var win = $('#otherEntriesWindow');
	var div = $('#otherEntriesDiv');
	var dayfield = BeCal.fields[dayfieldid];
	var txt='';
	var count = 0;
	for(var i=0;i<BeCal.entries.length;i++)
	{
		var e = BeCal.entries[i];
		if(Date.removeTime(e.startDate)<=Date.removeTime(dayfield.date) && Date.removeTime(e.endDate)>=Date.removeTime(dayfield.date))
		{
			txt+='<div id="hiddenEventDiv_'+e.getID()+'" class="calHiddenEvent" style="background-color:'+e.color+';" onclick="BeCal.openEventViewDialog('+e.getID()+')">'+e.title+'</div>';
			count+=1;
		}
	}
	win.jdHTML(txt);
	
	// adjust window size.
	/*var winheight = count * 17;
	if(winheight>180)
		winheight = 180;
	win.height(20+winheight);
	var content = win.find('.jdwindow-content');
	content.height(winheight);
	content.parent().height(winheight);
	div.height(winheight);
	*/
	
	win.jdShow();
	win.focus();
}

// restrict entry date inputs on change.
var isChangingDateInput = false;
BeCal.constrainDateInput=function()
{
	if(isChangingDateInput)
	{
//		console.log("already changing");
		return;
	}
	isChangingDateInput=true;
	
	//console.log("CONSTRAINING DATE INPUT START");
	// get the real dates.
	var day1 = Date.setTime(AnyTime.getCurrent('calDateInput1'),AnyTime.getCurrent('calTimeInput1'));
	var day2 = Date.setTime(AnyTime.getCurrent('calDateInput2'), AnyTime.getCurrent('calTimeInput2'));

	// get the times.
	var defaultConv = new AnyTime.Converter({format:'%H:%i'});
	var time1 = defaultConv.parse($('#calTimeInput1').val());
	var time2 = defaultConv.parse($('#calTimeInput2').val());

	// set the earliest date.
	var earliestdate = new Date(day1);
	earliestdate.setHours(0);
	earliestdate.setMinutes(0);
	earliestdate.setSeconds(1);
	
//	console.log("Setting earliest: "+earliestdate+" / "+time1);
	AnyTime.setEarliest('calDateInput2', earliestdate);

	// set the earliest time.	
	if(Date.compareOnlyDate(day1,day2)==true)
		AnyTime.setEarliest('calTimeInput2', time1);
	else
		AnyTime.setEarliest('calTimeInput2',defaultConv.parse("00:00"));
	
	$('#AnyTime--calDateInput2').hide();
	$('#AnyTime--calTimeInput2').hide();	
	isChangingDateInput=false;
}

// show duration of an event in the event creating/view window.
BeCal.showEntryDuration = function(date1=false, date2=false)
{
	var durationdiv = $('.calEntryDurationDiv');
	var txt = "Dauer:";
	var isBig = false;
	
	var daytime1 = 0;
	var daytime2 = 0;
	if(date1==false && date2==false)
	{
		// get the times from the inputs.
		daytime1 = AnyTime.getCurrent('calDateInput1');
		daytime2 = AnyTime.getCurrent('calDateInput2');
		var time1 = AnyTime.getCurrent('calTimeInput1');
		var time2 = AnyTime.getCurrent('calTimeInput2');
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
	
	// show duration.
	if(!isBig)
	{
		if(days>0)
			txt+=days+"d";
		if(hours>0 || (days>0 && minutes>0))
			txt+=hours+"h";
		if(minutes>0)
			txt+=minutes+"min";
	}else{
		txt+=isBig;
	}
	durationdiv.each(function() {$(this).html(txt);});
}

// the new entry color picker changed, change the color. ;)
BeCal.evtNewEntryColor = '#00FF00';
function entryColorPickerChanged(col)
{
	BeCal.evtNewEntryColor = col.toHexString();
	BeCal.changeEntryWindowEvtColor(BeCal.evtNewEntryColor);
}

// change color of top bar in the entry/show window.
BeCal.changeEntryWindowEvtColor=function(col)
{
	var entrywindow=$('#createEntryWindow');
	var topbar = entrywindow.find('.jdwindow-top');
	topbar.css('background-color', col);	
}

/* Create a new entry. */
BeCal.createNewEntry = function()
{	
	// create the entry with the date from the window.
	var e = new CalEntry();
	var start=Date.setTime(AnyTime.getCurrent('calDateInput1'), AnyTime.getCurrent('calTimeInput1'));
	var end=Date.setTime(AnyTime.getCurrent('calDateInput2'), AnyTime.getCurrent('calTimeInput2'));
	e.create(start, end, "CREATED", "", BeCal.evtNewEntryColor);
	BeCal.entries.push(e);
	
	$('#createEntryWindow').hide();
	BeCal.globaltoday=BeCal.createMonthDisplay(BeCal.globaltoday);
}

// create the pickers for the windows.
BeCal.createUI=function()
{
	// create the window for a new entry.
	var txt='<div id="calNewEntryMenuDiv"><table border="0"><tr><td>';
	txt+='<input type="text" id="calTimeInput1" class="calInputTime calInputMouseOver" value="12:34" /><br />';
	txt+='<input type="text" id="calDateInput1" class="calInputDate calInputMouseOver" size="50" value="Sun., 30. Sept. 1967" />';
	txt+='</td><td><div class="calInputMiddlestrich">-</div></td><td>';
	txt+='<input type="text" id="calTimeInput2" class="calInputTime calInputMouseOver" value="12:34" /><br />';
	txt+='<input type="text" id="calDateInput2" class="calInputDate calInputMouseOver" size="50" value="Sun., 30. Sept. 1967" />';
	txt+='</td></tr></table>';
	txt+='<div id="calEntryColorPickerDiv"><input id="calEntryColorPicker" /></div>';
	txt+='<div id="calEntryButtons"><a href="javascript:" class="okBtn" onclick="BeCal.createNewEntry()">Speichern</a></div>';
	txt+='</div><div id="calEntryShowDiv">';
	// window for the show stuff.
	txt+='<table border="0"><tr><td>';
	txt+='<div id="calTimeShow1" class="calInputTime"></div>';
	txt+='<div id="calDateShow1" class="calInputDate"></div>';
	txt+='</td><td><div class="calInputMiddlestrich">-</div></td><td>';
	txt+='<div id="calTimeShow2" class="calInputTime"></div>';
	txt+='<div id="calDateShow2" class="calInputDate"></div>';
	txt+='</td></tr></table>';

	txt+='</div>';
	
	txt+='<div class="calEntryDurationDiv"></div>';
	
	// add the title stuff.
	var title ='<div id="calTitleInputDiv">';
	title+='<input type="text" id="calInputName" class="calTitleName" placeholder="Titel hinzufügen"></input>';
	title+='</div><div id="calTitleShowDiv" class="calTitleName"> EVENT TITLE </div>';
	
	$('#calOverlay').jdCreateWindow("createEntryWindow",100,100,500,200, title, txt);
	
	// *************************************************************
	// the other entries window.
	title ="Weitere";
	txt='<div id="otherEntriesDiv"></div>';
	$('#calOverlay').jdCreateWindow("otherEntriesWindow",100,100,200,-200, title, txt);	

	// *************************************************************
		
	// create the pickers on the inputs.
	AnyTime.picker( "calDateInput1", { format: "%a, %d. %b. %z", firstDOW: 0 } );
	AnyTime.picker( "calTimeInput1", { format: "%H:%i" } );
	AnyTime.picker( "calDateInput2", { format: "%a, %d. %b. %z", firstDOW: 0 } );
	AnyTime.picker( "calTimeInput2", { format: "%H:%i" } );
	
	// this is the color picker.
	BeCal.evtNewEntryColor = BeCal.evtDefaultColor;
	$('#calEntryColorPicker').spectrum({
		color: BeCal.evtDefaultColor,
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
	
	// show some stuff.
	BeCal.showEntryDuration();
	
	// do something when the input fields change.
	$('#calDateInput1').on('change', function()
	{
		BeCal.constrainDateInput();
		BeCal.showEntryDuration();
	});
	$('#calTimeInput1').on('change', function()
	{
		BeCal.constrainDateInput();
		BeCal.showEntryDuration();
	});
	$('#calDateInput2').on('change', function()
	{
		BeCal.constrainDateInput();
		BeCal.showEntryDuration();
	});
	$('#calTimeInput2').on('change', function()
	{
		//BeCal.constrainDateInput();
		BeCal.showEntryDuration();
	});
}
