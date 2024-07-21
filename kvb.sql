CREATE DATABASE kvb;

USE kvb;

-- Table to store options for the first dropdown (Parva)
CREATE TABLE parva (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL
);

-- Table to store options for the second dropdown (Sandhi)
CREATE TABLE sandhi (
    id INT AUTO_INCREMENT PRIMARY KEY,
    parva_id INT,
    name VARCHAR(255) NOT NULL,
    FOREIGN KEY (parva_id) REFERENCES parva(id)
);

-- Table to store options for the third dropdown (Padya)
CREATE TABLE padya (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sandhi_id INT,
    name VARCHAR(255) NOT NULL,
    padya_number INT NOT NULL,
    pathantar TEXT,
    gadya TEXT,
    tippani TEXT,
    artha TEXT,
    FOREIGN KEY (sandhi_id) REFERENCES sandhi(id)
);
