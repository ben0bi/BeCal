<?php

// CUD - create, update or delete an item.
// audio files for BeCal

//require __DIR__."/sql.php";
if(isset($_FILES['file']) and !$_FILES['file']['error']){
    
	$fname=date('Y_m_d_H_i_s')."__".rand(1,10000).".WAV";
	//$fname = "11" . ".wav";
	$fdir="../DATA/AUDIO/$fname";

	// maybe remove a file with the same name (unwanted because of unique ids)
	if(file_exists($fdir)) {
		chmod($fdir,0755); //Change the file permissions if allowed
		unlink($fdir); //remove the file
	}
	
	// copy the file to the new location.
    move_uploaded_file($_FILES['file']['tmp_name'], $fdir);
	// return the new filename.
	echo($fname);
}else{echo("ERROR: AUDIO NOT SAVED!");}
?>
