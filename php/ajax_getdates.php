<?php
// Retrieve all events between two dates.
include __DIR__."/sql.php";

$con=SQL::openConnection();
$result = SQL::getCalendarEventsBetween("2018-10-25T00:00:00.000","2018-10-26T00:00:00.000");

$arr = [];
while($row=mysqli_fetch_object($result))
{
	$arr[] = $row;
}

SQL::closeConnection();

$json = json_encode($arr);
echo($json);
