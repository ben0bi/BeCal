-- phpMyAdmin SQL Dump
-- version 4.6.6deb4
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Erstellungszeit: 04. Jan 2019 um 19:59
-- Server-Version: 10.1.23-MariaDB-9+deb9u1
-- PHP-Version: 7.0.30-0+deb9u1

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Datenbank: `BeCal`
--
CREATE DATABASE IF NOT EXISTS `BeCal` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE `BeCal`;

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `calendarevents`
--
-- Erstellt am: 24. Dez 2018 um 18:14
--

CREATE TABLE IF NOT EXISTS `calendarevents` (
  `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Primary Key',
  `title` text NOT NULL,
  `startdate` datetime NOT NULL,
  `enddate` datetime NOT NULL,
  `userid` int(11) DEFAULT '0' COMMENT 'Id of the creator',
  `eventtype` int(11) NOT NULL DEFAULT '0',
  `summary` text,
  `color` varchar(10) NOT NULL DEFAULT '#FF00FF' COMMENT 'Color in html #RRGGBB',
  `audiofile` varchar(255) DEFAULT NULL COMMENT 'Name of the Audio File',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=120 DEFAULT CHARSET=utf8mb4;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
