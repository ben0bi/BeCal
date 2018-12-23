<?php

// CUD - create, update or delete an item.
// audio files for BeCal

//require __DIR__."/sql.php";
if(isset($_FILES['file']) and !$_FILES['file']['error']){
    
	$fname=date('Y_m_d_H_i_s')."__".rand(1,10000).".wav";
	//$fname = "11" . ".wav";
	$fdir="../DATA/AUDIO/$fname";

	// maybe remove previous file.
	if(file_exists($fdir)) {
		chmod($fdir,0755); //Change the file permissions if allowed
		unlink($fdir); //remove the file
	}
	
    move_uploaded_file($_FILES['file']['tmp_name'], $fdir);
	echo($fname);
}else{echo("ERROR: AUDIO NOT SAVED!");}
?>
