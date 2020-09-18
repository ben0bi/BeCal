#!/bin/bash

sudo apt-get install apache2
sudo apt-get install php libapache2-mod-php
sudo chmod www-data:www-data *
sudo chmod www-data:www-data DATA/*
sudo chmod www-data:www-data php/*

echo "Done."

