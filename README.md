# BeCal
Onfline Calendar: You can set it up on your own server and use it locally.

Using JSON. No Database setup needed here. You just need php (and thus, a server) for saving, updating and deleting events.
All data can be read locally without PHP! (You can share the whole calendar with your data on an usb stick to look at it...)

See the screenshot "becalscreenshot.png" above.

If you cannot save or load the data, maybe you need to change file permissions:

chown www-data:www-data DATA/
chown www-data:www-data DATA/*

or, for less security :), call:

chmod 755 DATA/
chmod 755 DATA/*

If not even this does work, use 777, that is read and write for everyone, including execution. (fully disclosed file)

I use(d) the google calendar but there you cannot change the theme and this white is way to bright.
Also, I cannot find any documentation about gapi.client.calendar anywhere, just this weird json calls I cannot figure out how to use. Why? Because in the example, they use gapi.client.calendar and not this json mentioned in their own documentation. I tried to download the reminders but I could not bring it to work. Also, I want to get offline soon, so I need a calendar on my own LAN server.

Why do I want to go offline? Because of advertising. I hate it. I cannot stand the after 2015-internet, it's absolutely crap.
So I decided to make my own internet, download the best music from "your" ad-contaminated data sniffing "every shit needs a login"-internet. No, thank you. My net has no logins, no ads, no nothing. Not even cookies. I don't have to hide something behind some password wall. When I have to hide something, I just won't put it on the net. Did you find ANY foto of mine? Ha. :)

tl;dr: There is no security involved here, do your login stuff elsewhere. This calendar is public for all when you put the server into the net, so just don't do it. :)
