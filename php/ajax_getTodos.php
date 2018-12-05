<?php
// Retrieve all events between two dates.
include __DIR__."/sql.php";

$con=SQL::openConnection();
// example date: "2018-10-25T00:00:00.000" (year-month-dayThour:minute:second:millisecond)
//$result = SQL::getCalendarEventsBetween($startdate,$enddate);
$result = SQL::getOpenTodos();

$arr = [];
while($row=mysqli_fetch_object($result))
{
	$row->title=SQL::SQLtoText($row->title);
	$row->summary=SQL::SQLtoText($row->summary);
	$arr[] = $row;
}

SQL::closeConnection();

$json = json_encode($arr);
echo($json);
