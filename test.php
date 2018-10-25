<?php

include __DIR__."/php/sql.php";

echo("PHP TEST\n");
$con=SQL::openConnection();
$result = SQL::query(SQL::select_all("calendarevents"));
$result2=SQL::getFirstRow($result);
if(!$result2)
	echo "NOTHING";
else
	echo("SOMETHING ".$result2->title);
SQL::closeConnection();
echo("Feedback: ".SQL::Feedback()."\n");
echo("TEST DONE\n");


