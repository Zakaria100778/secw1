"use strict";

require("dotenv").config();
const express = require("express");
const path = require("path");
const session = require("express-session");
const bodyParser = require("body-parser");

const app = express();
const routes = require("./app/app");

// Set up views and static
app.set("views", path.join(__dirname, "app/views"));
app.set("view engine", "pug");
app.use(express.static(path.join(__dirname, "static")));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Session middleware
app.use(session({
  secret: process.env.SESSION_SECRET || "keyboard_cat",
  resave: false,
  saveUninitialized: false
}));

// Make user available to all views
app.use((req, res, next) => {
  res.locals.user = req.session.user;
  next();
});

// Mount routes
app.use("/", routes);

// Start server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
