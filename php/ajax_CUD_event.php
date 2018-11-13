<?php

// CUD - create, update or delete an item.
// 

require __DIR__."/sql.php";

$CUD=$_POST['CUD'];
$dbid=$_POST['dbid'];
$startdate=$_POST['startdate'];
$enddate=$_POST['enddate'];
$title=$_POST['title'];
$summary=$_POST['summary'];
$color=$_POST['color'];
$eventtype=$_POST['eventtype'];

echo("TO DB: $CUD $dbid $startdate $enddate $title $summary $color");

$title=SQL::textToSQL($title);
$summary=SQL::textToSQL($summary);

SQL::openConnection();
if($CUD=='create')
{
	if($dbid==-1)
		SQL::query(SQL::insert_event($title, $startdate, $enddate, $eventtype, $color, $summary));
	else
		echo("** update event not yet functional. **");
	//echo "..done.<br>";
	echo(" DB write done.");
}

SQL::closeConnection();
if(SQL::Feedback()!="")
	echo "SQL Feedback: ".SQL::Feedback();

//echo "Order: $order Title: $title <br />Blogtitle: $blogtitle<br />BlogText: $blogtext<br />";
?>