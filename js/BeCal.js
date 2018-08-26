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

// a calendar event
var CalEntry = function() 
{
	this.title = "Ohne Titel";
	this.summary = "";
	this.startDate = new Date();
	this.endDate = new Date();
	this.color = "#333366";
	
	this.create = function(start, end, newtitle, newsummary="", newcolor = "") 
	{
		this.title = newtitle;
		this.summary = newsummary;
		this.startDate = start;
		this.endDate = end;
		if(newcolor=="")
			this.color="#333399";
		else
			this.color=newcolor;
	}
	
	// create the bar div and return it.
	this.createMonthBars=function(dayfields)
	{
		var posX=0;
		var posY=0;
		var realPosY=0;
		var realPosX = 0;
		var width=0;
		var height=10;

		var result = "";
		var firstDay = Date.removeTime(dayfields[0].date);					// first date on the table.
		var lastDay = Date.removeTime(dayfields[dayfields.length-1].date);	// last date on the table.
		var evtStartDay = Date.removeTime(this.startDate);					// start date of the event.
		var evtEndDay = Date.removeTime(this.endDate);						// end date of the event.
		var actualdate = new Date(evtStartDay);							// actual date for the bars.
		var mydayfield=dayfields[0];										// field on table for the actual date.
		
		// check if event is on table.
		if(evtStartDay>lastDay || evtEndDay<firstDay)
		{
			//console.log("-- event not on table --");
			return result;
		}
		
		var processed =0;
		var turn = 0;
		console.log("+++ Listing Event +++");
		
		var done = false;
		var firstone = true; // if this is set, it will add a border div to id.
		while(!done)
		{	
			turn+=1;
			if(actualdate>evtEndDay)
			{
				console.log("-- aborting: actualdate > enddate--");
				return result;
			}
	
			// adjust actual date to begin of table.
			if(actualdate<firstDay)
				actualdate = new Date(firstDay);

			// get the remaining days between the two dates.
			var remainingDays = Date.daysBetween(actualdate, evtEndDay);
			
			console.log("------ Turn "+turn+" -------------------------");
			console.log("Event lasts "+remainingDays+" day/s.\nStart: "+evtStartDay+"\nEnd: "+evtEndDay+"\nActual: "+actualdate);
		
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
			realPosX = posX;
			realPosY=mydayfield.top+30;
			
			width = 0;
			height = 15;
		
			console.log("X: "+parseInt(posX)+" Y: "+parseInt(posY));
					
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
						console.log("Adding width at top: "+newdayfield.top+" @ "+newdayfield.date.toString());
					}else{
						// *line break, leave the for loop.
						if(firstone==true && evtStartDay>=firstDay)
						{
							result+='<div class="calEventBar calEventMarker" style="background-color: '+this.color+'; top:'+realPosY+'px; left:'+(posX+1)+'px; width:10px; height:'+height+'px;"></div>';
							posX+=5;
							width-=5;
							firstone = false;
						}
						result+='<div class="calEventBar" style="background-color: '+this.color+'; top:'+realPosY+'px; left:'+posX+'px; width:'+width+'px; height:'+height+'px;">'+this.title+'</div>';
						actualdate = Date.removeTime(nd);
						console.log("--> (Processed "+processed+" Remaining "+remainingDays+") Setting date: "+nd.toString());
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
				result+='<div class="calEventBar calEventMarker" style="background-color: '+this.color+'; top:'+realPosY+'px; left:'+(posX+1)+'px; width:10px; height:'+height+'px;"></div>';
				posX+=5;
				width-=5;
				firstone = false;
			}
			
			// add the end marker.
			if(evtEndDay<=lastDay)
			{
				width-=10;			
				result+='<div class="calEventBar calEventMarker" style="background-color: '+this.color+'; top:'+realPosY+'px; left:'+(posX+width-4)+'px; width:10px; height:'+height+'px;"></div>';
			}
			
			result+='<div class="calEventBar" style="background-color: '+this.color+'; top:'+realPosY+'px; left:'+posX+'px; width:'+width+'px; height:'+height+'px;">'+this.title+'</div>';
			
			if(remainingDays<=0 && !newline)
				done=true;
		}
		return result;
	}
}

// a day field with its position and size.
var CalDayField = function(day,x,y,w,h)
{
	this.date = Date.removeTime(day);
	this.top = y;
	this.left = x;
	this.width = w;
	this.height = h;
}

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

// today needs to be a date.
BeCal.createMonthDisplay=function(today)
{
	var myMonth = today.getMonth();
	var realToday = Date.removeTime(new Date());

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
	var calFieldHeight = ($("#calContent").height()-20)*0.2;	
	var calFieldWidth =$("#calContent").width()*(1.0/7.0);
	
	var txt="";
	// create the day name fields.
	txt+='<div class="calDayField" style="top: 0px; left: 0px;">&nbsp;So.</div>';
	txt+='<div class="calDayField" style="top: 0px; left: '+(calFieldWidth)+'px;">&nbsp;Mo.</div>';
	txt+='<div class="calDayField" style="top: 0px; left: '+(calFieldWidth*2)+'px;">&nbsp;Di.</div>';
	txt+='<div class="calDayField" style="top: 0px; left: '+(calFieldWidth*3)+'px;">&nbsp;Mi.</div>';
	txt+='<div class="calDayField" style="top: 0px; left: '+(calFieldWidth*4)+'px;">&nbsp;Do.</div>';
	txt+='<div class="calDayField" style="top: 0px; left: '+(calFieldWidth*5)+'px;">&nbsp;Fr.</div>';
	txt+='<div class="calDayField lastCalField" style="top: 0px; left: '+(calFieldWidth*6)+'px;">&nbsp;Sa.</div>';
	
	// create each day field.
	BeCal.fields = new Array();
	for(weeks=0;weeks<5;weeks++)
	{  
		for(days=0;days<7;days++)
		{
			var mydate = Date.removeTime(monthBegin);
			mydate.setDate(monthBegin.getDate()+(weeks*7 + days));
			var posY = calFieldHeight*weeks+20;
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
			txt+='<div class="calField'+cl+'" style="top:'+posY+'px; left: '+posX+'px;" onclick="openEntryDialog('+id+'))"><br />&nbsp;'+dt+'</div>';
		}
	}
	
	// at last, create all the events.
	for(e=0;e<BeCal.entries.length;e++)
	{
		var event = BeCal.entries[e];
		txt+=event.createMonthBars(BeCal.fields);
	}
	
	$("#calContent").html(txt);
	
	$(".calDayField").each(function()
	{
		$(this).width(calFieldWidth);
	});
	$(".calField").each(function()
	{
		$(this).width(calFieldWidth);
		$(this).height(calFieldHeight);
	});
	
	// return the given date + x?	
	return returnDate;
}

// get the month of today.
BeCal.getToday=function() {BeCal.globaltoday = BeCal.createMonthDisplay(new Date());}

// advance the month.
function advanceMonth(amount)
{
	var dt = BeCal.globaltoday;
	dt.setMonth(dt.getMonth()+amount);
	BeCal.globaltoday = BeCal.createMonthDisplay(dt);
	//$("#createEntryWindow").jdShow();
	return BeCal.globaltoday;
}

// show the new entry window at the desired position near the field where you clicked.
function openEntryDialog(becalfieldid) 
{
	var f = BeCal.fields[becalfieldid];
	var menuHeight = $('#calMenu').height()+$('.calDayField').height();
	showEntryWindow(parseInt(f.top),parseInt(f.left)+menuHeight, jqEntry.width());
}

// show the entry window and set the focus to the input.
function showEntryWindow(posX=0, posY=0, entryWidth=0)
{
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
	
	$('#createEntryWindow').show();
	$('#calInputName').focus();
}

// create the pickers for the windows.
BeCal.createPickers=function()
{
	var txt='<table border="0"><tr><td>';
	txt+='<input type="text" id="calTimeInput1" class="calInputTime" value="12:34" /><br />';
	txt+='<input type="text" id="calDateInput1" class="calInputDate" size="50" value="Sun., 30. Sept. 1967" />';
	txt+='</td><td><div class="calInputMiddlestrich">-</div></td><td>';
	txt+='<input type="text" id="calTimeInput2" class="calInputTime" value="12:34" /><br />';
	txt+='<input type="text" id="calDateInput2" class="calInputDate" size="50" value="Sun., 30. Sept. 1967" />';
	txt+='</td></tr></table>';
	$('#calOverlay').jdCreateWindow("createEntryWindow",100,100,500,200, '<input type="text" id="calInputName" placeholder="Titel hinzufügen"></input>', txt);

	AnyTime.picker( "calDateInput1", { format: "%a, %d. %b. %z", firstDOW: 0 } );
	AnyTime.picker( "calTimeInput1", { format: "%H:%i" } );
	AnyTime.picker( "calDateInput2", { format: "%a, %d. %b. %z", firstDOW: 0 } );
	AnyTime.picker( "calTimeInput2", { format: "%H:%i" } );
}