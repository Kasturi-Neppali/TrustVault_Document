-- MySQL dump 10.13  Distrib 8.0.46, for Win64 (x86_64)
--
-- Host: localhost    Database: trustvault_db
-- ------------------------------------------------------
-- Server version	8.0.45

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `audit_logs`
--

DROP TABLE IF EXISTS `audit_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `audit_logs` (
  `log_id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `document_id` int DEFAULT NULL,
  `action` varchar(50) NOT NULL,
  `result` enum('ALLOWED','DENIED') NOT NULL,
  `reason` varchar(255) DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `timestamp` timestamp(6) NULL DEFAULT CURRENT_TIMESTAMP(6),
  `previous_hash` char(64) DEFAULT NULL,
  `current_hash` char(64) NOT NULL,
  PRIMARY KEY (`log_id`),
  UNIQUE KEY `current_hash` (`current_hash`),
  KEY `idx_audit_user` (`user_id`),
  KEY `idx_audit_document` (`document_id`),
  KEY `idx_audit_timestamp` (`timestamp`),
  CONSTRAINT `audit_logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL,
  CONSTRAINT `audit_logs_ibfk_2` FOREIGN KEY (`document_id`) REFERENCES `documents` (`document_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `audit_logs`
--

LOCK TABLES `audit_logs` WRITE;
/*!40000 ALTER TABLE `audit_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `audit_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `document_permissions`
--

DROP TABLE IF EXISTS `document_permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `document_permissions` (
  `permission_id` int NOT NULL AUTO_INCREMENT,
  `document_id` int NOT NULL,
  `viewer_id` int NOT NULL,
  `can_view` tinyint(1) DEFAULT '1',
  `can_download` tinyint(1) DEFAULT '0',
  `granted_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `expires_at` datetime DEFAULT NULL,
  `revoked_at` datetime DEFAULT NULL,
  PRIMARY KEY (`permission_id`),
  KEY `idx_permission_viewer` (`viewer_id`),
  KEY `idx_permission_document` (`document_id`),
  CONSTRAINT `document_permissions_ibfk_1` FOREIGN KEY (`document_id`) REFERENCES `documents` (`document_id`),
  CONSTRAINT `document_permissions_ibfk_2` FOREIGN KEY (`viewer_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `document_permissions`
--

LOCK TABLES `document_permissions` WRITE;
/*!40000 ALTER TABLE `document_permissions` DISABLE KEYS */;
/*!40000 ALTER TABLE `document_permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `documents`
--

DROP TABLE IF EXISTS `documents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `documents` (
  `document_id` int NOT NULL AUTO_INCREMENT,
  `owner_id` int NOT NULL,
  `document_name` varchar(255) NOT NULL,
  `storage_path` varchar(500) NOT NULL,
  `file_hash` char(64) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_deleted` tinyint(1) NOT NULL DEFAULT '0',
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`document_id`),
  KEY `idx_document_owner` (`owner_id`),
  CONSTRAINT `documents_ibfk_1` FOREIGN KEY (`owner_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `documents`
--

LOCK TABLES `documents` WRITE;
/*!40000 ALTER TABLE `documents` DISABLE KEYS */;
/*!40000 ALTER TABLE `documents` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `login_attempts`
--

DROP TABLE IF EXISTS `login_attempts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `login_attempts` (
  `attempt_id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `email` varchar(150) NOT NULL,
  `status` enum('SUCCESS','FAILURE') NOT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `attempted_at` timestamp(6) NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`attempt_id`),
  KEY `user_id` (`user_id`),
  KEY `idx_login_email` (`email`),
  KEY `idx_login_time` (`attempted_at`),
  CONSTRAINT `login_attempts_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `login_attempts`
--

LOCK TABLES `login_attempts` WRITE;
/*!40000 ALTER TABLE `login_attempts` DISABLE KEYS */;
INSERT INTO `login_attempts` VALUES (1,3,'admin@example.com','SUCCESS',NULL,'2026-11-06 18:15:56.450954'),(2,6,'alice@gmail.com','SUCCESS',NULL,'2026-11-06 18:30:47.151072'),(3,7,'bob@gmail.com','SUCCESS',NULL,'2026-11-06 18:39:12.395023'),(4,NULL,'charlie@123','FAILURE','127.0.0.1','2026-11-07 04:32:18.251919'),(5,8,'charlie@123.gmail.com','SUCCESS','127.0.0.1','2026-11-07 04:32:35.069009'),(6,3,'admin@example.com','SUCCESS','127.0.0.1','2026-11-07 05:24:25.065271');
/*!40000 ALTER TABLE `login_attempts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `roles`
--

DROP TABLE IF EXISTS `roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `roles` (
  `role_id` int NOT NULL AUTO_INCREMENT,
  `role_name` varchar(20) NOT NULL,
  PRIMARY KEY (`role_id`),
  UNIQUE KEY `role_name` (`role_name`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `roles`
--

LOCK TABLES `roles` WRITE;
/*!40000 ALTER TABLE `roles` DISABLE KEYS */;
INSERT INTO `roles` VALUES (1,'ADMIN'),(2,'OWNER'),(3,'VIEWER');
/*!40000 ALTER TABLE `roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `user_id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `email` varchar(150) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role_id` int NOT NULL,
  `status` enum('ACTIVE','INACTIVE','SUSPENDED') DEFAULT 'ACTIVE',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `email` (`email`),
  KEY `role_id` (`role_id`),
  CONSTRAINT `users_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `roles` (`role_id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'Kasturi','kasturi@example.com','TEMP_HASH_1',2,'ACTIVE','2026-11-06 10:10:02'),(2,'Ravi','ravi@example.com','TEMP_HASH_2',3,'ACTIVE','2026-11-06 10:10:02'),(3,'System Admin','admin@example.com','$2b$12$QPabe9iHho/FEsWvO1aOsOoYBHO8TqHEShNMGinBoF2eTw4kxX9si',1,'ACTIVE','2026-11-06 10:10:02'),(4,'Kasturi','kasturi2@example.com','$2b$12$7ZdZrLnKf.rTkALK/mg9HOM9SxWJTG9NY/L.q.Tko9yEB/Fts4GeG',2,'ACTIVE','2026-11-06 10:58:00'),(6,'Alice','alice@gmail.com','$2b$12$ugwNEl2VmxHuQaJ3oFQP1ebvPy2e3tw3SLrP5naVTOIn7mAxxFs1O',2,'ACTIVE','2026-11-06 18:30:27'),(7,'Bob','bob@gmail.com','$2b$12$isHeB3s0i/kLfsYanBk0Wui9/qrjQ.jnRRPN0oXQj6zlQ1lBBt10e',2,'ACTIVE','2026-11-06 18:38:51'),(8,'charlile','charlie@123.gmail.com','$2b$12$1mFiK0D.EPQlwa2ZBp7AMO6Z/QT2QlXkW3KoTG5u1AvWy54IhMYC6',2,'ACTIVE','2026-11-07 04:31:50');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-11-07 12:33:32
