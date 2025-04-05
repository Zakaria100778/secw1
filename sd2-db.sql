-- Disable foreign key checks to avoid constraint issues during table creation
SET FOREIGN_KEY_CHECKS = 0;

-- Create the database if it doesn't exist
CREATE DATABASE IF NOT EXISTS gaming_guides;

-- Use the database
USE gaming_guides;

-- Create Users table
CREATE TABLE IF NOT EXISTS Users (
  User_ID INT AUTO_INCREMENT PRIMARY KEY,
  Username VARCHAR(100) NOT NULL,
  Email VARCHAR(100) UNIQUE NOT NULL,
  Password_Hash VARCHAR(255) NOT NULL
);

-- Create Guides table
CREATE TABLE IF NOT EXISTS Guides (
  Guide_ID INT AUTO_INCREMENT PRIMARY KEY,
  User_ID INT NOT NULL,
  Title VARCHAR(255) NOT NULL,
  Description TEXT NOT NULL,
  Tags VARCHAR(255),
  Created_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (User_ID) REFERENCES Users(User_ID) ON DELETE CASCADE
);

-- Create Ratings table
CREATE TABLE IF NOT EXISTS Ratings (
  Rating_ID INT AUTO_INCREMENT PRIMARY KEY,
  Guide_ID INT NOT NULL,
  User_ID INT NOT NULL,
  Rating INT NOT NULL,
  CONSTRAINT chk_rating CHECK (Rating BETWEEN 1 AND 5),
  FOREIGN KEY (Guide_ID) REFERENCES Guides(Guide_ID) ON DELETE CASCADE,
  FOREIGN KEY (User_ID) REFERENCES Users(User_ID) ON DELETE CASCADE
);

-- Create Comments table
CREATE TABLE IF NOT EXISTS Comments (
  Comment_ID INT AUTO_INCREMENT PRIMARY KEY,
  Guide_ID INT NOT NULL,
  User_ID INT NOT NULL,
  Comment_Text TEXT NOT NULL,
  Created_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (Guide_ID) REFERENCES Guides(Guide_ID) ON DELETE CASCADE,
  FOREIGN KEY (User_ID) REFERENCES Users(User_ID) ON DELETE CASCADE
);

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- ✅ Optional: Insert sample data (feel free to remove or modify)
INSERT IGNORE INTO Users (Username, Email, Password_Hash) VALUES
('David', 'david1@example.com', 'hashedpassword1'),
('Zakaria', 'zakaria@example.com', 'hashedpassword2'),
('Mihnea', 'mihnea@example.com', 'hashedpassword3'),
('Mohamed', 'mohamed@example.com', 'hashedpassword4');

INSERT IGNORE INTO Guides (User_ID, Title, Description, Tags) VALUES
(1, 'Pro Tips for Fortnite', 'Best strategies for winning in Fortnite.', 'fortnite, battle royale'),
(2, 'Minecraft Building Guide', 'How to build amazing structures in Minecraft.', 'minecraft, creative mode'),
(3, 'Elden Ring Boss Strategies', 'Detailed strategies for defeating tough bosses.', 'elden ring, bosses');

INSERT IGNORE INTO Ratings (Guide_ID, User_ID, Rating) VALUES
(1, 2, 5),
(2, 1, 4),
(3, 3, 5);

INSERT IGNORE INTO Comments (Guide_ID, User_ID, Comment_Text) VALUES
(1, 2, 'Great tips! Helped me a lot.'),
(2, 1, 'Nice guide, very detailed.'),
(3, 3, 'This strategy saved me hours of grinding!');
