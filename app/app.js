const express = require("express");
const router = express.Router();
const db = require("./services/db");
const bcrypt = require("bcryptjs");

// Homepage
router.get("/", (req, res) => {
  res.render("index", {
    title: "My index page",
    heading: "Ultimate Game Guides!",
    layout: "layout",
  });
});

// User listing
router.get("/user-list", async (req, res) => {
  try {
    const results = await db.query("SELECT * FROM Users");
    res.render("user-list", {
      title: "User List",
      data: results,
      layout: "layout",
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error loading user list");
  }
});

// Profile
router.get("/profile/:id", async (req, res) => {
  try {
    const userId = req.params.id;

    // Get user basic info
    const results = await db.query("SELECT * FROM Users WHERE User_ID = ?", [userId]);
    if (results.length === 0) return res.status(404).send("User not found");

    const user = results[0];

    // Count guides
    const [guideCount] = await db.query(
      "SELECT COUNT(*) AS total FROM Guides WHERE User_ID = ?",
      [userId]
    );

    // Count total likes across user's guides
    const [likeCount] = await db.query(
      `SELECT COUNT(*) AS total FROM Likes 
       WHERE Guide_ID IN (SELECT Guide_ID FROM Guides WHERE User_ID = ?) 
       AND Value = 'like'`,
      [userId]
    );

    res.render("profile", {
      title: `${user.Username}'s Profile`,
      user,
      guideCount: guideCount.total,
      likeCount: likeCount.total,
      layout: "layout"
    });

  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});


// Guide detail + comments + likes/dislikes ✅
router.get("/detail/:id", async (req, res) => {
  try {
    const [guide] = await db.query(
      "SELECT g.*, u.Username FROM Guides g JOIN Users u ON g.User_ID = u.User_ID WHERE g.Guide_ID = ?",
      [req.params.id]
    );
    if (!guide) return res.status(404).send("Guide not found");

    const comments = await db.query(
      "SELECT c.Comment_Text, u.Username FROM Comments c JOIN Users u ON c.User_ID = u.User_ID WHERE c.Guide_ID = ?",
      [req.params.id]
    );

    const [likeCount] = await db.query(
      "SELECT COUNT(*) AS count FROM Likes WHERE Guide_ID = ? AND Value = 'like'",
      [req.params.id]
    );
    const [dislikeCount] = await db.query(
      "SELECT COUNT(*) AS count FROM Likes WHERE Guide_ID = ? AND Value = 'dislike'",
      [req.params.id]
    );

    res.render("detail", {
      title: guide.Title,
      guide,
      comments,
      likes: likeCount.count,
      dislikes: dislikeCount.count,
      layout: "layout",
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to load guide");
  }
});

// ✅ Like/dislike handler
router.post("/detail/:id/react", async (req, res) => {
  if (!req.session.user) return res.redirect("/auth");

  const { reaction } = req.body;
  const userId = req.session.user.id;
  const guideId = req.params.id;

  if (!['like', 'dislike'].includes(reaction)) {
    return res.status(400).send("Invalid reaction");
  }

  try {
    const existing = await db.query(
      "SELECT * FROM Likes WHERE Guide_ID = ? AND User_ID = ?",
      [guideId, userId]
    );

    if (existing.length > 0) {
      await db.query(
        "UPDATE Likes SET Value = ? WHERE Guide_ID = ? AND User_ID = ?",
        [reaction, guideId, userId]
      );
    } else {
      await db.query(
        "INSERT INTO Likes (Guide_ID, User_ID, Value) VALUES (?, ?, ?)",
        [guideId, userId, reaction]
      );
    }

    res.redirect(`/detail/${guideId}`);
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to process reaction");
  }
});

// Post a comment
router.post("/detail/:id/comment", async (req, res) => {
  if (!req.session.user) {
    return res.redirect("/auth");
  }

  const { comment } = req.body;
  const userId = req.session.user.id;
  const guideId = req.params.id;

  try {
    await db.query(
      "INSERT INTO Comments (Guide_ID, User_ID, Comment_Text) VALUES (?, ?, ?)",
      [guideId, userId, comment]
    );
    res.redirect(`/detail/${guideId}`);
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to post comment");
  }
});

// Guide listing with tag filter
router.get("/listing", async (req, res) => {
  const { tag } = req.query;

  try {
    let query = "SELECT * FROM Guides";
    let params = [];

    if (tag === "singleplayer" || tag === "multiplayer") {
      query += " WHERE Tags = ?";
      params.push(tag);
    }

    const results = await db.query(query, params);

    res.render("listing", {
      title: "Listing",
      data: results,
      selectedTag: tag,
      layout: "layout",
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error loading listings");
  }
});

// Tags route
router.get("/Tags", async (req, res) => {
  const { tag } = req.query;

  try {
    let results;
    if (tag) {
      results = await db.query("SELECT * FROM Guides WHERE Tags = ?", [tag]);
    } else {
      results = await db.query("SELECT * FROM Guides");
    }

    res.render("Tags", {
      title: "Tags",
      heading: "Browse by Tag",
      selectedTag: tag,
      tags: ['singleplayer', 'multiplayer'],
      guides: results,
      layout: "layout",
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error loading tags");
  }
});

router.get("/inbox", async (req, res) => {
  if (!req.session.user) return res.redirect("/auth");

  const userId = req.session.user.id;

  try {
    const threads = await db.query(`
      SELECT DISTINCT u.User_ID, u.Username
      FROM Users u
      JOIN Messages m ON (u.User_ID = m.Sender_ID OR u.User_ID = m.Receiver_ID)
      WHERE (m.Sender_ID = ? OR m.Receiver_ID = ?) AND u.User_ID != ?
    `, [userId, userId, userId]);

    res.render("inbox", {
      title: "Inbox",
      threads,
      layout: "layout"
    });

  } catch (err) {
    console.error(err);
    res.status(500).send("Error loading inbox");
  }
});

router.get("/messages/:id", async (req, res) => {
  if (!req.session.user) return res.redirect("/auth");

  const userId = req.session.user.id;
  const otherId = req.params.id;

  try {
    // Fetch conversation messages
    const messages = await db.query(`
      SELECT m.*, u.Username AS SenderName
      FROM Messages m
      JOIN Users u ON m.Sender_ID = u.User_ID
      WHERE (m.Sender_ID = ? AND m.Receiver_ID = ?)
         OR (m.Sender_ID = ? AND m.Receiver_ID = ?)
      ORDER BY m.Sent_At ASC
    `, [userId, otherId, otherId, userId]);

    // Fetch the recipient username
    const [otherUser] = await db.query("SELECT Username FROM Users WHERE User_ID = ?", [otherId]);

    res.render("messages", {
      title: "Messages",
      messages,
      receiverId: otherId,
      receiverName: otherUser ? otherUser.Username : "Unknown",
      layout: "layout"
    });

  } catch (err) {
    console.error("Failed to load messages:", err);
    res.status(500).send("Failed to load messages");
  }
});

router.post("/send/:id", async (req, res) => {
  if (!req.session.user) return res.redirect("/auth");

  const senderId = req.session.user.id;
  const receiverId = req.params.id;
  const { message } = req.body;

  try {
    await db.query(
      "INSERT INTO Messages (Sender_ID, Receiver_ID, Message_Text) VALUES (?, ?, ?)",
      [senderId, receiverId, message]
    );
    res.redirect(`/profile/${receiverId}`);
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to send message");
  }
});


// Leaderboard: Top users by total likes
router.get("/leaderboard", async (req, res) => {
  try {
    const leaderboard = await db.query(`
      SELECT u.Username, COUNT(g.Guide_ID) AS guideCount, COUNT(l.Like_ID) AS likeCount
      FROM Users u
      LEFT JOIN Guides g ON u.User_ID = g.User_ID
      LEFT JOIN Likes l ON g.Guide_ID = l.Guide_ID AND l.Value = 'like'
      GROUP BY u.User_ID
      ORDER BY likeCount DESC, guideCount DESC
      LIMIT 10
    `);

    res.render("leaderboard", {
      title: "Leaderboard",
      users: leaderboard,
      layout: "layout"
    });

  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to load leaderboard");
  }
});


// Show guide submission form
router.get("/submit", (req, res) => {
  if (!req.session.user) {
    return res.redirect("/auth");
  }

  res.render("submit", {
    title: "Submit a Guide",
    layout: "layout",
  });
});

// Handle guide submission
router.post("/submit", async (req, res) => {
  if (!req.session.user) {
    return res.redirect("/auth");
  }

  const { title, description, tags } = req.body;
  const userId = req.session.user.id;

  try {
    await db.query(
      "INSERT INTO Guides (User_ID, Title, Description, Tags) VALUES (?, ?, ?, ?)",
      [userId, title, description, tags]
    );
    res.redirect("/listing");
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to submit guide");
  }
});

// DB test
router.get("/db_test", async (req, res) => {
  try {
    const results = await db.query("SELECT * FROM Comments");
    res.send(results);
  } catch (err) {
    console.error(err);
    res.status(500).send("DB test failed");
  }
});

// Hello/Goodbye
router.get("/goodbye", (req, res) => {
  res.send("Goodbye world!");
});

router.get("/hello/:name", (req, res) => {
  res.send(`Hello ${req.params.name}`);
});

// Auth routes
router.get("/auth", (req, res) => {
  res.render("auth", { error: null });
});

router.post("/register", async (req, res) => {
  const { username, email, password } = req.body;
  try {
    const existing = await db.query("SELECT * FROM Users WHERE Email = ?", [email]);
    if (existing.length > 0) {
      return res.render("auth", { error: "Email already exists." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await db.query(
      "INSERT INTO Users (Username, Email, Password_Hash) VALUES (?, ?, ?)",
      [username, email, hashedPassword]
    );
    res.redirect("/auth");
  } catch (err) {
    console.error(err);
    res.render("auth", { error: "Registration failed." });
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const userResult = await db.query("SELECT * FROM Users WHERE Email = ?", [email]);
    if (userResult.length === 0) {
      return res.render("auth", { error: "Invalid credentials." });
    }

    const user = userResult[0];
    const match = await bcrypt.compare(password, user.Password_Hash);
    if (!match) {
      return res.render("auth", { error: "Invalid credentials." });
    }

    req.session.user = {
      id: user.User_ID,
      username: user.Username,
    };

    res.redirect("/");
  } catch (err) {
    console.error(err);
    res.render("auth", { error: "Login failed." });
  }
});

router.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/");
  });
});

module.exports = router;
