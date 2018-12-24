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
$audiofile=$_POST['audiofile'];
$color=$_POST['color'];
$eventtype=$_POST['eventtype'];

echo("TO DB: $CUD $dbid $startdate $enddate $title $summary $color $audiofile");

// This is done in the sql queries.
//$title=SQL::textToSQL($title);
//$summary=SQL::textToSQL($summary);
//$audiofile=SQL::textToSQL($audiofile);

SQL::openConnection();

// create or update an entry.
if($CUD=='create')
{
	if($dbid==-1)
	{
		SQL::query(SQL::insert_event($title, $startdate, $enddate, $eventtype, $color, $audiofile, $summary));
	}else{
		// get old audio file name and delete the file when the name does not match the new one.
		$audiofilename = SQL::get_audio_filename($dbid);
		if($audiofilename!=$summary && $audiofilename!="")
			unlink("../DATA/AUDIO/$audiofilename");
		SQL::query(SQL::update_event($dbid, $title, $startdate, $enddate, $eventtype, $color, $audiofile, $summary));
	}
	echo(" DB write done.");
}

// delete an entry.
if($CUD=='delete')
{
	if($dbid>0)
	{
		$audiofilename = SQL::get_audio_filename($dbid);
		if($audiofilename!="")
			unlink("../DATA/AUDIO/$audiofilename");

		SQL::query(SQL::delete_event($dbid));
	}else{
		echo (" Delete failed: DBID <= 0 [$dbid]");
	}
	echo(" DB deletion done.");
}

SQL::closeConnection();
if(SQL::Feedback()!="")
	echo "SQL Feedback: ".SQL::Feedback();

//echo "Order: $order Title: $title <br />Blogtitle: $blogtitle<br />BlogText: $blogtext<br />";
?>
