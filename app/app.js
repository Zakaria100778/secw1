const express = require("express");
const router = express.Router();
const db = require('./services/db');
const bcrypt = require("bcryptjs");

// Homepage
router.get("/", (req, res) => {
  res.render("index", {
    title: 'My index page',
    heading: 'Ultimate Game Guides!',
    layout: 'layout'
  });
});

// User listing
router.get("/user-list", async (req, res) => {
  try {
    const results = await db.query("SELECT * FROM Users");
    res.render("user-list", {
      title: 'User List',
      data: results,
      layout: 'layout'
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error loading user list");
  }
});

// Profile
router.get("/profile/:id", async (req, res) => {
  try {
    const results = await db.query("SELECT * FROM Users WHERE User_ID = ?", [req.params.id]);
    if (results.length === 0) return res.status(404).send("User not found");

    const user = results[0];
    res.render("profile", {
      title: `${user.Username}'s Profile`,
      user,
      layout: 'layout'
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

// Tags page
router.get("/Tags", (req, res) => {
  res.render("Tags", {
    title: 'My Tags page',
    heading: 'Tags',
    layout: 'layout'
  });
});

// Guide detail
router.get("/detail/:id", async (req, res) => {
  try {
    const results = await db.query(
      'SELECT g.*, u.Username FROM Guides g JOIN Users u ON g.User_ID = u.User_ID WHERE g.Guide_ID = ?',
      [req.params.id]
    );
    if (results.length === 0) return res.status(404).send("Guide not found");

    res.render("detail", {
      title: results[0].Title,
      guide: results[0],
      layout: 'layout'
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to load guide");
  }
});

// Guide listing
router.get("/listing", async (req, res) => {
  try {
    const results = await db.query("SELECT * FROM Guides");
    res.render("listing", {
      title: 'listing',
      data: results,
      layout: 'layout'
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error loading listings");
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

// Simple test routes
router.get("/goodbye", (req, res) => {
  res.send("Goodbye world!");
});

router.get("/hello/:name", (req, res) => {
  res.send(`Hello ${req.params.name}`);
});

// Auth page
router.get("/auth", (req, res) => {
  res.render("auth", { error: null });
});

// Register
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

// Login
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
      username: user.Username
    };

    res.redirect("/");
  } catch (err) {
    console.error(err);
    res.render("auth", { error: "Login failed." });
  }
});

// Logout
router.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/");
  });
});

// Export router
module.exports = router;
