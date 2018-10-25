<?php

include __DIR__."/php/sql.php";

echo("PHP TEST\n");
$con=SQL::openConnection();
$result = SQL::getCalendarEventsBetween("2018-10-25T00:00:00.000","2018-10-26T00:00:00.000");

while($row=mysqli_fetch_object($result))
{
	echo($row->title.'\n');
}

SQL::closeConnection();
echo("SQL Feedback: ".SQL::Feedback()."\n");
echo("TEST DONE\n");


