/* 
	jDoor
	
	This library relies on jQuery.
	Include jQuery first to use this library.
	
	by Beni Yager @ ben0bi enterprises @ 2016
	twitter.com/ben0bi
	benedictinerklosterbruder.blogspot.com
	ben0bi.homenet.org
	
	Not compatible with Internet Explorer.
	Works with Edge. Please upgrade. ;)
	
	LICENSE:
		Use as you want by following these rules:
	1. Author credits above must remain in files.
	2. AUTHOR needs to be CREDITed in your software, VISIBLE TO the END-USER IN the SOFTWARE.
	(Not in a Readme-File in some folder, he must be credited IN your application.)
	
	jDoor-credits-window for your happiness:
	
	$('#myscreen').jdCreateAuthorCredits();
			
	Minimum credits you must include:
		Beni Yager
		[twitter.com/][@]ben0bi
		
	For that two lines of text IN your application, you get the full package which you can use as you want,
	private and commercial.
*/

/* 
	Usage:
	To create a window, just type
		$('#target_screen(not body!)').jdCreateWindow("myWindow", x,y,width,height, "Some Content <br />HTML allowed.");
	Create: You MUST create the window inside a div or section or something. The body is not (yet) supported.
*/


(function($)
{
	// "globally" used variables.
	var _mouse = {x:0,y:0};
	var _jdbWindowMoving =false;
	var _jdWindowToMove;
	var _jdWindowOffsetX =0;
	var _jdWindowOffsetY =0;
	
	// used for constraints.
	var _jdScreenWidth=0;
	var _jdScreenHeight=0;
	var _jdTopBar = {x:0, y:0, w:0, h:0, hideleft:0, hideright:0};
	
	// initiate moving of a window.
	var _jdInitiateMoving = function(target)
	{
		if(target.hasClass('jdwindow-top'))
		{
			_jdWindowToMove = target.parent();
			
			var windowHide = _jdWindowToMove.find('.jdwindow-hide');
			
			// get position and size of the top bar.
			_jdTopBar.x = parseInt(target.position().left);
			_jdTopBar.y = parseInt(target.position().top);
			_jdTopBar.w = target.width();
			_jdTopBar.h = target.height();
			
			var htop = parseInt(windowHide.position().top);
			var hleft = parseInt(windowHide.position().left);
			var hwidth = windowHide.width();
			var hheight = windowHide.height();
					
			var jdWindowScreen = _jdWindowToMove.parent();
			
			_jdScreenWidth = jdWindowScreen.width();
			_jdScreenHeight = jdWindowScreen.height();
			
			var offset = _jdWindowToMove.position(); // offset of the window to the surrounding screen.
			
			_jdWindowOffsetX = (_mouse.x - offset.left);
			_jdWindowOffsetY = (_mouse.y - offset.top);
			
			// check if hideleft or hideright must be set.
			// it is set when the top bar is beneath the hide button to adjust minimumfloatin. (only left right, not top bottom!)
			_jdTopBar.hideleft =0;
			_jdTopBar.hideright =0;
			
			var min = $.fn.jdoor.defaults.MinimumFloatIn;
			
			// maybe set hideright
			if(hleft + hwidth >= _jdWindowToMove.width() - (min*0.1)
				&& _jdTopBar.y < htop + hheight
				&& _jdTopBar.y + _jdTopBar.h > htop
				&& _jdTopBar.x + _jdTopBar.w > hleft
				&& _jdTopBar.x < hleft + hwidth
				)
			{
				_jdTopBar.hideright = hwidth;
			}
				
			// maybe set hideleft
			if(hleft <= min * 0.1
				&& _jdTopBar.y < htop + hheight
				&& _jdTopBar.y + jdTopBar.h > htop
				&& _jdTopBar.x + _jdTopBar.w > hleft
				&& _jdTopBar.x < hleft + hwidth
				)
			{
				_jdTopBar.hideleft = hwidth;
			}
			
			_jdbWindowMoving = true;
		}else{
			console.log("ERROR: jDoor Move Init not on class jdwindow-top.");
		}
	};
	
	// set a cookie
	var _jdSetCookie=function(cookiename, cookievalue, expiredays)
	{
		if(!$.fn.jdoor.defaults.UseCookies)
			return;
		
		var d= new Date();
		d.setTime(d.getTime() +(expiredays*24*60*60*1000));
		var expires="expires="+d.toUTCString();
		document.cookie=cookiename+"="+cookievalue+"; "+expires;
		//alert("Cookie set: "+cookiename+"="+cookievalue+" // "+document.cookie);
	};
	
	// get a cookie
	var _jdGetCookie=function(cookiename)
	{
		if(!$.fn.jdoor.defaults.UseCookies)
			return "";

		var cname=cookiename+"=";
		var ca=document.cookie.split(';');
		for(var i=0;i<ca.length;i++)
		{
			var c=ca[i];
			while(c.charAt(0)==' ')
			{
				c=c.substring(1);
			}
			if(c.indexOf(cname)==0)
			{
				return c.substring(cname.length,c.length);
			}
		}
		return "";
	};
	
	// set the cookies for the target window.
	var _jdSetCookiePosition=function(targetwindowID,x,y)
	{		
		_jdSetCookie('jdoorcookie_x_'+targetwindowID,x,365);
		_jdSetCookie('jdoorcookie_y_'+targetwindowID,y,365);
	};
	
	// get the cookies for the target window.
	var _jdGetCookiePosition=function(targetwindow)
	{
		var id=targetwindow.attr('id');
		var x=_jdGetCookie('jdoorcookie_x_'+id);
		var y=_jdGetCookie('jdoorcookie_y_'+id);
		
		if(x!="")
			x=parseFloat(x);
		else
			x=targetwindow.position.left;
		
		if(y!="")
			y=parseFloat(y);
		else
			y=targetwindow.position.top;
		
		targetwindow.css({position: 'absolute', top: y, left: x});
	}
	
	// move a window which is initialized for moving.
	var _jdMoveWindow = function()
	{
		if(_jdbWindowMoving)
		{
			var newPosX = _mouse.x - _jdWindowOffsetX; 		// new window position x
			var newPosY = _mouse.y - _jdWindowOffsetY; 		// new window position y
			var min = $.fn.jdoor.defaults.MinimumFloatIn;	// minimum float-in on edge of targetscreen.
			
			if(newPosX + _jdTopBar.x + _jdTopBar.hideright > _jdScreenWidth - min)
			{
				newPosX = _jdScreenWidth - min - _jdTopBar.x - _jdTopBar.hideleft;
			}
			
			if(newPosX + _jdTopBar.x + _jdTopBar.w - _jdTopBar.hideleft < min)
			{
				newPosX = min - _jdTopBar.x - _jdTopBar.w + _jdTopBar.hideright;
			}
			
			if(newPosY + _jdTopBar.y + _jdTopBar.h < min)
				newPosY = min - _jdTopBar.y - _jdTopBar.h;
			
			if(newPosY + _jdTopBar.y > _jdScreenHeight - min)
				newPosY = _jdScreenHeight - min - _jdTopBar.y;
			
			
			// set new position
			_jdWindowToMove.css({position: 'absolute', top: newPosY, left: newPosX});
			// set the cookies.
			_jdSetCookiePosition(_jdWindowToMove.attr('id'),newPosX,newPosY);
		}
	};

	// lock window/s.
	var _jdLock = function(target) {target.find('.jdwindow-lock').show();};
	
	// unlock window/s.
	var _jdUnlock = function(target) {target.find('.jdwindow-lock').hide();};
	
	// stop moving window.
	var _jdStopWindowMoving = function()
	{
		if(_jdbWindowMoving)
			_jdUnlock(_jdWindowToMove);
			
		_jdbWindowMoving =false;
	};
	
	// gets highest zindex from the given target screen. (jquery element)
	var _jdGetHighZ = function(targetscreen)
	{
		var z = 0;
		var windows = targetscreen.find(".jdwindow").each(function()
		{
			var zc=parseInt($(this).css('z-index'));
			if(zc>z)
				z=zc;
		});
		return z;	
	};
	
	// decreases the zindex of all windows above startindex by 1.
	var _jdDecreaseZIndex = function(targetscreen, startindex)
	{
		var windows = targetscreen.find(".jdwindow").each(function()
		{
			var zc=parseInt($(this).css('z-index'));
			if(zc>startindex)
			{
				zc=zc-1;
				if(zc < 1)
					zc = 1;
				$(this).css('z-index',zc);
			}
		});		
	};
	
	// set the focus on a window.
	var _jdFocus = function(target)
	{
		var win=target;
		if(!win.hasClass('jdwindow'))
		{
			console.log("ERROR: jdFocus not on a jdwindow.");
			return;
		}
		
		var targetscreen = win.parent();
		var myz=win.css('z-index');
		var highZ = _jdGetHighZ(targetscreen);
		var mouseintopbar = false;
		
		// lock all screens, then unlock this one.		
		// check if it is in the top bar. if so, do not unlock it.
		var topbar=win.find('.jdwindow-top');
		
		if(_mouse.x >= topbar.offset().left &&
			_mouse.x <= topbar.offset().left + topbar.width() &&
			_mouse.y >= topbar.offset().top &&
			_mouse.y <= topbar.offset().top + topbar.height())
		{
			mouseintopbar = true;
		}

		// performance hack: only lock all if it is NOT the top one or if the window will be moved.
		if(myz!=highZ || mouseintopbar)
			_jdLock(targetscreen);

		// if the mouse is not in the top bar, unlock the window right now.
		// if it IS in the top bar, it will be unlocked on mouseup.
		if(!mouseintopbar)
			_jdUnlock(win);
		
		if(highZ>myz)
		{
			highZ=highZ+1;			
			win.css('z-index',highZ);
			
			_jdDecreaseZIndex(targetscreen,myz);
		}
	};
	
	// called when pressing the hide-button.
	_jdHideWindow = function(target)
	{
			// hide the window directly
			if(target.hasClass('jdwindow'))
				target.hide();
		
			// hide the parent if it's a sub-window.
			if(target.hasClass('jdwindow-top') ||
				target.hasClass('jdwindow-hide') ||
				target.hasClass('jdwindow-hide-clicker') ||
				target.hasClass('jdwindow-content'))
				target.parent().hide();
	};
	
	// intern public jdoor functions.
	$.fn.jdoor = function(func) 
	{
		// jdoor(1) = Focus window.
		if(func==1)
			_jdFocus($(this));
		
		// jdoor(2) = Initiate moving on window.
		if(func==2)
			_jdInitiateMoving($(this));
		
		// jdoor(3) = Hide Window (not element, the window belonging to that element.)
		if(func==3)
			_jdHideWindow($(this));
	};
	
	/* Creates a moveable window in the target area.
		windowname: the window name and id.
		x,y: top and left in pixels. 
			You can use 'center' to center the window on the target screen.
		w,h: width and height in pixels. You can use 'dyn', 'dynamic', 'auto' 
			or a negative number to use the dynamic content size.
			content: html content which appears in the window.
	*/	
	_jdCreateWindow = function(target, windowname, x, y, w, h, title, content)
	{
		return target.each(function()
		{
			var targetscreen = $(this);
			// lock all screens
			_jdLock(targetscreen);

			// get the last z-index and make it +1
			var zi=_jdGetHighZ(targetscreen) + 1;
		
			var topbarheight = $.fn.jdoor.defaults.WindowTopBarHeight;
			var windowhidecontent = $.fn.jdoor.defaults.WindowHideIconContent;
			
			// Dynamic screen size.
			var width="";
			var height="";
			if(w=='dynamic' || w=='dyn' || w=='auto')
				w=0;
			else
			{
				if(w>=0)
					width="width:"+w+"px;";
				else
					width="max-width:"+Math.abs(w)+"px;";
			}
			
			if(h=='dynamic' || h=='dyn' || h=='auto')
				h=0;
			else
			{
				if(h>=0)
					height="height:"+(h+topbarheight)+"px;";
				else
					height="max-height:"+(Math.abs(h)+topbarheight)+"px;";
			}
			
			// maybe center the window - does not center right with dynamic sizes!
			if(x == 'center') {x = targetscreen.width()*0.5 - parseInt(Math.abs(w))*0.5;}
			if(y == 'center') {y = targetscreen.height()*0.5 - parseInt(Math.abs(h))*0.5;}
		
			var pref='';
	
			pref = pref + "<div class='jdwindow' id='"+windowname+"' name='"+windowname+"' onmousedown='$(this).jdoor(1);' style='overflow: hidden; position:absolute; top:"+y+"px; left:"+x+"px; z-index:"+zi+"; "+width+" "+height+"'>";
			pref = pref +"<div class='jdwindow-top' onmousedown='$(this).jdoor(2);' style='height:"+topbarheight+"px; display: block; z-index: 2;'>"+title+"</div>";
			// makeup icon
			pref = pref +"<div class='jdwindow-hide' style='width:"+topbarheight+"px; height:"+topbarheight+"px; z-index: 3;'>"+windowhidecontent+"</div>";
			// the real button is transparent.
			pref = pref +"<div class='jdwindow-hide-clicker' onclick='$(this).jdoor(3);' style='width:"+topbarheight+"px; height:"+topbarheight+"px; z-index: 4;'></div>";

			// maybe set width and height and scroll bars.
			width="";
			height="";
			var scrollx='overflow-x: hidden;';
			var scrolly='overflow-y: hidden;';
			if(w>0)
			{
				width="width: "+w+"px;";
				scrollx='overflow-x: auto;';
			}
			
			if(h>0)
			{
				height="height: "+(h-5)+"px;";
				scrolly='overflow-y: auto;';
			}
			
			// set max-width/height on negative numbers.
			if(w<0)
			{
				width="max-width: "+Math.abs(w)+"px;";
				scrollx='overflow-x: auto;';
			}

			if(h<0)
			{
				height="max-height: "+(Math.abs(h)-5)+"px;";
				scrolly='overflow-y: auto;';
			}

			// first make a wrapper div around the content.
			pref=pref+"<div style='position:relative; "+width+" "+height+" overflow:hidden;'>";
			// insert the content div.
			pref=pref+"<div class='jdwindow-content' style='position: relative; top: 0px; left: 0px; "+width+" "+height+" "+scrollx+" "+scrolly+"'>";
			pref=pref+content;
			pref=pref+"</div>";
			// ..and the lock div.
			// (only the window with the focus is unlocked.)
			pref=pref+"<div class='jdwindow-lock' style='display: none; z-index: 100; position: absolute; left:0px; top:0px; width:100%; height:100%;'></div>";
			pref=pref+"</div></div>";
		
			var htm=targetscreen.html();
			targetscreen.html(htm+pref);
			
			// get cookie position.
			_jdGetCookiePosition($('#'+windowname));
		});
	}
		
	/* Creates a moveable window in the target area.
		windowname: the window name and id.
		x,y: top and left in pixels. 
			You can use 'center' to center the window on the target screen.
		w,h: width and height in pixels. You can use 'dyn', 'dynamic', 'auto' 
			or a negative number to use the dynamic content size.
			content: html content which appears in the window.
	*/	
	$.fn.jdCreateWindow = function(windowname,x,y,w,h,title,content)
	{
		return _jdCreateWindow($(this),windowname,x,y,w,h,title,content);
	};

	/* Creates a window with the author credits. */
	$.fn.jdCreateAuthorCredits = function()
	{
		return _jdCreateWindow($(this), 'jdoor_window_author_credits', 'center', 'center', 'dyn','dyn', "", "<div style='margin: 10px;'>jDoor by<br />\
			<a href='http://ben0bi.homenet.org' target='_new'>Beni Yager</a><br>\
			<a href='http://twitter.com/ben0bi' target='new'>@ben0bi</a></div>");
	};
	
	/* creates a window with an embedded youtube video. */
	$.fn.jdCreateYoutubeWindow = function(windowname, x, y, w, h,title, youtubeid)
	{
		var width="";
		var height="";
		
		if(w!='dynamic' && w!='dyn' && w!='auto' && parseInt(w)>=0)
			width="width:"+w+"px;";
		
		if(h!='dynamic' && h!='dyn' && h!='auto' && parseInt(h)>=0)
			height="height:"+(h-4)+"px;";
		
		var content="<iframe src='http://youtube.com/embed/"+youtubeid+"' style='"+width+" "+height+" border:0px;'></iframe>";
		return _jdCreateWindow($(this), windowname,x,y,w,h, title, content);
	};
	
	/* changes the content of a jdwindow. Target must have the jdwindow class. 
		Target must include a tag with the jdwindow-content class.*/
	$.fn.jdHTML = function(htm)
	{
		var win = $(this);
		if(win.hasClass("jdwindow"))
		{
			if(typeof(htm)!=='undefined')
				win.find(".jdwindow-content").html(htm);
			return win.find(".jdwindow-content").html();
		}else{
			console.log("ERROR: jdHTML target must have jdwindow class.");
		}
		return null;
	}
	
	/* shows a jdwindow and sets the focus for it. */
	$.fn.jdShow = function()
	{
		var el=$(this);
		el.show();
		_jdFocus(el);
		return $(this);
	}
	
	$.fn.jdHideAllWindows = function()
	{
		$(this).find(".jdwindow").hide();
		return $(this);
	}
		
	var _jdSetMouse = function(x,y)
	{
		_mouse.x = x;
		_mouse.y = y;
	};
	
	$.fn.Mouse = function() {return _mouse;};
	
	$(document).ready() 
	{
		// set the mouse and maybe move the window.
		$('body').mousemove(function(e)
		{
			_jdSetMouse(e.pageX, e.pageY);
			_jdMoveWindow();
		});
		
		// also set the mouse on mousedown.
		$('body').mousedown(function(e) {_jdSetMouse(e.pageX, e.pageY);});
		
		// unset window moving on mouse up.
		$("body").mouseup(function() {_jdStopWindowMoving();});
	
		// same on click to get sure.
		$("body").click(function(){_jdStopWindowMoving();});
	}
})(jQuery)

$.fn.jdoor.defaults =
{
	WindowTopBarHeight: 20,
	WindowHideIconContent: 'X',
	MinimumFloatIn: 10,
	UseCookies: true
};