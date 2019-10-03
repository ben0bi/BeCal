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

// get the next unique id.
function get_Next_DBID()
{
	global $json_data;
	$id=0;
	$q=0;
	foreach($json_data['EVENTS'] as $e)
	{
		$q++;
		$i=intval($e['ID']);
		if($i>=$id)
			$id=$i+1;
	}
	echo("Next DB ID: $id");
	return $id;
}

// create or update an entry.
if($CUD=='create')
{
	// create an entry..
	$nen = [];
		$nen['TITLE']=$title;
		$nen['STARTDATE']=$startdate;
		$nen['ENDDATE']=$enddate;
		$nen['EVENTTYPE']=$eventtype;
		$nen['COLOR']=$color;
		$nen['AUDIOFILE']=$audiofile;
		$nen['SUMMARY']=$summary;
		$nen['USERID']=$userid;

	// maybe create a new data chunk.
	if(sizeof(json_data['EVENTS'])<=0)
	{
		$json_data=[];
		$json_data['EVENTS']=[];
	}

	if($dbid==-1)
	{
		// set a new id.
		$nen['ID'] = get_Next_DBID();
		// add the entry
		$json_data['EVENTS'][] = $nen;
		// save the data

	}else{
		// get old audio file name and delete the file when the name does not match the new one.
		$idx = -1;
		// search for the given id
		for($i=0;$i<sizeof($json_data['EVENTS']);$i++)
		{
			if(intval($json_data['EVENTS'][$i]['ID'])==$dbid)
			{
				$idx=$i;
				break;
			}
		}
		// we found the entry, change it.
		if($idx>=0)
		{
			// maybe first delete the old audio file.
			$audiofilename = $json_data['EVENTS'][$idx]['AUDIOFILE'];
			if($audiofilename!=$summary && $audiofilename!="")
				unlink("../DATA/AUDIO/$audiofilename");
			// set new old id
			$nen['ID'] = $dbid;
			$json_data['EVENTS'][$idx] = $nen;
		}else{
			echo("Entry with ID $dbid not found.");
		}
	}
	// save the data.
	$jdata = json_encode($json_data);
	if(file_put_contents($datafile, $jdata))
	{
		echo("File saved.");
	}else{
	        echo "Error while saving the database.";
	}
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

//echo "Order: $order Title: $title <br />Blogtitle: $blogtitle<br />BlogText: $blogtext<br />";
?>
