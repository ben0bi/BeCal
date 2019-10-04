<?php

// CUD - create, update or delete an item.

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

//echo("OS: $json ".sizeof($json_data['EVENTS']));

// maybe create a new data chunk.
if(sizeof($json_data['EVENTS'])<=0)
{
	$json_data = [];
	$json_data['EVENTS']=[];
}

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

// delete an audio file if it exists.
function deleteAudioFile($dbindex)
{
	global $json_data;
	$audiofilename = $json_data['EVENTS'][$dbindex]['AUDIOFILE'];
	if($audiofilename!=$summary && $audiofilename!="")
		unlink("../DATA/AUDIO/$audiofilename");

}

function saveJsonData()
{
	global $json_data;
	global $datafile;
	$jdata = json_encode($json_data);
	if(file_put_contents($datafile, $jdata))
	{
		echo("File saved.");
	}else{
	        echo "Error while saving the database.";
	}
}

// get old audio file name and delete the file when the name does not match the new one.
$idx = -1;	// the real index.
// search for the given id
for($i=0;$i<sizeof($json_data['EVENTS']);$i++)
{
	if(intval($json_data['EVENTS'][$i]['ID'])==$dbid)
	{
		$idx=$i;
		break;
	}
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

	if($dbid==-1)
	{
		// set a new id.
		$nen['ID'] = get_Next_DBID();
		// add the entry
		$json_data['EVENTS'][] = $nen;
	}else{
		// we found the entry, change it.
		if($idx>=0)
		{
			// maybe first delete the old audio file.
			deleteAudioFile($idx);
			// set new old id
			$nen['ID'] = $dbid;
			$json_data['EVENTS'][$idx] = $nen;
		}else{
			echo("Entry with ID $dbid not found.");
		}
	}
	// save the data.
	saveJsonData();
}

// delete an entry.
if($CUD=='delete')
{
	if($dbid>=0)
	{
		deleteAudioFile($idx);
		$n=[];
		$n['EVENTS']=[];
		// copy all except the one to delete.
		foreach($json_data['EVENTS'] as $itm)
		{
			if($itm['ID']!=$dbid)
				$n['EVENTS'][] = $itm;
		}
		$json_data = $n;
		saveJsonData();
	}else{
		echo (" Delete failed: DBID < 0 [$dbid]");
	}
	echo(" DB deletion done.");
}

//echo "Order: $order Title: $title <br />Blogtitle: $blogtitle<br />BlogText: $blogtext<br />";
?>
