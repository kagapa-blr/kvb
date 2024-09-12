-- Create the database if it doesn't exist with UTF-8 character set and collation
CREATE DATABASE IF NOT EXISTS kvb
    DEFAULT CHARACTER SET utf8mb4
    DEFAULT COLLATE utf8mb4_unicode_ci;

-- Switch to the newly created or existing database
USE kvb;

-- Table to store options for the first dropdown (Parva)
CREATE TABLE IF NOT EXISTS parva (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    parva_number INT NOT NULL UNIQUE,  -- Added UNIQUE constraint
    parvantya TEXT
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Table to store options for the second dropdown (Sandhi)
CREATE TABLE IF NOT EXISTS sandhi (
    id INT AUTO_INCREMENT PRIMARY KEY,
    parva_id INT,
    sandhi_number INT NOT NULL,
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
    suchane TEXT,
    padya TEXT,  -- New column added
    FOREIGN KEY (sandhi_id) REFERENCES sandhi(id)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20),
    email VARCHAR(255)
    -- Add any additional optional fields if needed
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;


-- Table to store padya first line with references to Parva, Sandhi, and Padya
CREATE TABLE IF NOT EXISTS akaradi_suchi (
    id INT AUTO_INCREMENT PRIMARY KEY,
    padyafirstline TEXT NOT NULL,
    parva_id INT NOT NULL,
    sandhi_id INT NOT NULL,
    padya_number INT NOT NULL,
    FOREIGN KEY (parva_id) REFERENCES parva(id),
    FOREIGN KEY (sandhi_id) REFERENCES sandhi(id),
    UNIQUE(parva_id, sandhi_id, padya_number) -- Ensure uniqueness of the combination
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;


-- Create table gade_suchigalu with parva_name instead of parva_number
CREATE TABLE IF NOT EXISTS gade_suchigalu (
    id INT AUTO_INCREMENT PRIMARY KEY,
    gade_suchi TEXT NOT NULL,
    parva_name TEXT NOT NULL,
    sandhi_number INT NOT NULL,
    parva_number INT NOT NULL,
    padya_number INT NOT NULL,
    UNIQUE(gade_suchi, parva_name, sandhi_number, padya_number) -- Ensure uniqueness of the combination
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;



CREATE TABLE IF NOT EXISTS tippani (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tippani TEXT NOT NULL,
    parva_id INT NOT NULL,
    sandhi_id INT NOT NULL,
    padya_number INT NOT NULL,
    FOREIGN KEY (parva_id) REFERENCES parva(id),
    FOREIGN KEY (sandhi_id) REFERENCES sandhi(id),
    UNIQUE (parva_id, sandhi_id, padya_number) -- Ensure uniqueness of the combination
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
