<?php

// CUD - create, update or delete an item.

//require __DIR__."/sql.php";

// new > 2.5.4: json saveing.

$CUD=$_POST['CUD'];
$dbid=$_POST['dbid'];
$startdate=$_POST['startdate'];
$enddate=$_POST['enddate'];
$title=$_POST['title'];
$summary=$_POST['summary'];
$audiofile=$_POST['audiofile'];
$color=$_POST['color'];
$eventtype=$_POST['eventtype'];
$userid=$_POST['userid'];

echo("TO DB: $CUD $dbid $startdate $enddate $title $summary $color $audiofile");

$datafile = '../DATA/becaldatabase.gml';

// Read JSON file
$json = file_get_contents($datafile);

//Decode JSON
$json_data = json_decode($json,true);

echo("OS: $json ".sizeof($json_data['EVENTS']));

if(sizeof($json_data['EVENTS'])<=0)
	$json_data['EVENTS']=[];

// SQL::openConnection();
function get_Next_DBID()
{
	echo("GET NEXT DBID");
	global $json_data;
	$id=0;
	$q=0;
	foreach($json_data['EVENTS'] as $e)
	{
		$q++;
		echo("ENTRY # ".$q);
		$i=intval($e['ID']);
		if($i>=$id)
			$id=$i+1;
	}
	return $id;
}

// create or update an entry.
//if($CUD=='create')
{
//	if($dbid==-1)
//	{
		//SQL::query(SQL::insert_event($title, $startdate, $enddate, $eventtype, $color, $audiofile, $summary));
		if(sizeof(json_data['EVENTS'])<=0)
		{
			$json_data=[];
			$json_data['EVENTS']=array();
		}
		$nen = [];
		$nen['ID'] = get_Next_DBID();
		$nen['TITLE']=$title;
		$nen['STARTDATE']=$startdate;
		$nen['ENDDATE']=$enddate;
		$nen['EVENTTYPE']=$eventtype;
		$nen['COLOR']=$color;
		$nen['AUDIOFILE']=$audiofile;
		$nen['SUMMARY']=$summary;
		$nen['USERID']=$userid;
		$json_data['EVENTS'][] = $nen;
		$jdata = json_encode($json_data);
		if(file_put_contents($datafile, $jdata))
		{
			echo("Added event: ".$nen['ID']." ".$title);
	    	}else{
	        	echo "Error while saving the data.";
		}
//	}else{
		// get old audio file name and delete the file when the name does not match the new one.
/*		$audiofilename = SQL::get_audio_filename($dbid);
		if($audiofilename!=$summary && $audiofilename!="")
			unlink("../DATA/AUDIO/$audiofilename");
		SQL::query(SQL::update_event($dbid, $title, $startdate, $enddate, $eventtype, $color, $audiofile, $summary));
	}
*/	echo(" DB write done.");
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
