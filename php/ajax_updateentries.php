<?php

require __DIR__."/sql.php";

$pageid=$_POST['pageid'];
$blogtitle=$_POST['blogtitle'];
$blogtext=$_POST['blogtext'];

SQL::openConnection();

if($blogtitle!="" || $blogtext!="")
{
	SQL::query(SQL::insert_blogpost($pageid,$blogtitle,$blogtext));
	//echo "..done.<br>";
	echo $sentence_new_blogpost_created."<br />";
}

SQL::closeConnection();
if(SQL::Feedback()!="")
	echo "SQL Feedback: ".SQL::Feedback();

//echo "Order: $order Title: $title <br />Blogtitle: $blogtitle<br />BlogText: $blogtext<br />";

ComicCMS::showArchives('../', 291);
?>
