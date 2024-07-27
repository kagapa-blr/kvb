-- Create the database if it doesn't exist with UTF-8 character set and collation
CREATE DATABASE IF NOT EXISTS kvb
    DEFAULT CHARACTER SET utf8mb4
    DEFAULT COLLATE utf8mb4_unicode_ci;

-- Switch to the newly created or existing database
USE kvb;

-- Table to store options for the first dropdown (Parva)
CREATE TABLE IF NOT EXISTS parva (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Table to store options for the second dropdown (Sandhi)
CREATE TABLE IF NOT EXISTS sandhi (
    id INT AUTO_INCREMENT PRIMARY KEY,
    parva_id INT,
    name VARCHAR(255) NOT NULL,
    FOREIGN KEY (parva_id) REFERENCES parva(id)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Table to store options for the third dropdown (Padya)
CREATE TABLE IF NOT EXISTS padya (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sandhi_id INT,
    padya_number INT NOT NULL,
    pathantar TEXT,
    gadya TEXT,
    tippani TEXT,
    artha TEXT,
    padya TEXT,  -- New column added
    FOREIGN KEY (sandhi_id) REFERENCES sandhi(id)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Table to store user details
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE
    password VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20),
    email VARCHAR(255),
    -- Add any additional optional fields if needed
    CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
);
