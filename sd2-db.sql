- Disable foreign key checks to avoid constraint issues during deletion
SET FOREIGN_KEY_CHECKS = 0;

-- Create the schema (database) if it does not exist
CREATE DATABASE IF NOT EXISTS gaming_guides;

-- Use the created schema
USE gaming_guides;

-- Table: Users
CREATE TABLE IF NOT EXISTS Users (
  User_ID INT AUTO_INCREMENT PRIMARY KEY,
  Username VARCHAR(100) NOT NULL,
  Email VARCHAR(100) UNIQUE NOT NULL,
  Password_Hash VARCHAR(255) NOT NULL
);

-- Table: Guides
CREATE TABLE IF NOT EXISTS Guides (
  Guide_ID INT AUTO_INCREMENT PRIMARY KEY,
  User_ID INT NOT NULL,
  Title VARCHAR(255) NOT NULL,
  Description TEXT NOT NULL,
  Tags VARCHAR(255),
  Created_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (User_ID) REFERENCES Users(User_ID) ON DELETE CASCADE
);

-- Table: Ratings
CREATE TABLE IF NOT EXISTS Ratings (
  Rating_ID INT AUTO_INCREMENT PRIMARY KEY,
  Guide_ID INT NOT NULL,
  User_ID INT NOT NULL,
  Rating INT NOT NULL,
  CONSTRAINT chk_rating CHECK (Rating BETWEEN 1 AND 5),
  FOREIGN KEY (Guide_ID) REFERENCES Guides(Guide_ID) ON DELETE CASCADE,
  FOREIGN KEY (User_ID) REFERENCES Users(User_ID) ON DELETE CASCADE
);

-- Table: Comments
CREATE TABLE IF NOT EXISTS Comments (
  Comment_ID INT AUTO_INCREMENT PRIMARY KEY,
  Guide_ID INT NOT NULL,
  User_ID INT NOT NULL,
  Comment_Text TEXT NOT NULL,
  Created_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (Guide_ID) REFERENCES Guides(Guide_ID) ON DELETE CASCADE,
  FOREIGN KEY (User_ID) REFERENCES Users(User_ID) ON DELETE CASCADE
);

-- Delete existing data (optional, for testing multiple runs)
DELETE FROM Comments;
DELETE FROM Ratings;
DELETE FROM Guides;
DELETE FROM Users;

-- Reset auto-increment values (if needed)
ALTER TABLE Users AUTO_INCREMENT = 1;
ALTER TABLE Guides AUTO_INCREMENT = 1;
ALTER TABLE Ratings AUTO_INCREMENT = 1;
ALTER TABLE Comments AUTO_INCREMENT = 1;

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- Insert sample data into Users table with unique emails
INSERT INTO Users (Username, Email, Password_Hash) VALUES
('David', 'david1@example.com', 'hashedpassword1'),
('Zakaria', 'zakaria@example.com', 'hashedpassword2'),
('Mihnea', 'mihnea@example.com', 'hashedpassword3'),
('Mohamed', 'mohamed@example.com', 'hashedpassword4');

-- Insert sample data into Guides table
INSERT INTO Guides (User_ID, Title, Description, Tags) VALUES
(1, 'Pro Tips for Fortnite', 'Best strategies for winning in Fortnite.', 'fortnite, battle royale'),
(2, 'Minecraft Building Guide', 'How to build amazing structures in Minecraft.', 'minecraft, creative mode'),
(3, 'Elden Ring Boss Strategies', 'Detailed strategies for defeating tough bosses.', 'elden ring, bosses');

-- Insert sample data into Ratings table
INSERT INTO Ratings (Guide_ID, User_ID, Rating) VALUES
(1, 2, 5),
(2, 1, 4),
(3, 3, 5);

-- Insert sample data into Comments table
INSERT INTO Comments (Guide_ID, User_ID, Comment_Text) VALUES
(1, 2, 'Great tips! Helped me a lot.'),
(2, 1, 'Nice guide, very detailed.'),
(3, 3, 'This strategy saved me hours of grinding!');

-- Show all tables in the database
SHOW TABLES;

-- Show all inserted data
SELECT 'Users Table' AS Section;
SELECT * FROM Users;

SELECT 'Guides Table' AS Section;
SELECT * FROM Guides;

SELECT 'Ratings Table' AS Section;
SELECT * FROM Ratings;

SELECT 'Comments Table' AS Section;
SELECT * FROM Comments;