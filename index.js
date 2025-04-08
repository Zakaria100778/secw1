"use strict";

require("dotenv").config();
const express = require("express");
const path = require("path");
const session = require("express-session");
const bodyParser = require("body-parser");

const app = express();
const routes = require("./app/app");

// --- View engine and static folder setup ---
app.set("views", path.join(__dirname, "app/views"));
app.set("view engine", "pug");
app.use(express.static(path.join(__dirname, "static")));

// --- Middleware ---
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// --- Session handling ---
app.use(session({
  secret: process.env.SESSION_SECRET || "keyboard_cat",
  resave: false,
  saveUninitialized: false
}));

// --- Make session user available to all templates ---
app.use((req, res, next) => {
  res.locals.user = req.session.user;
  next();
});

// --- Mount routes ---
app.use("/", routes);

// --- Global Express error handler ---
app.use((err, req, res, next) => {
  console.error("Global error handler caught:", err.stack);
  res.status(500).send("Something broke!");
});

// --- Catch unhandled errors outside Express ---
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

// --- Start server ---
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
