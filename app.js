require("dotenv").config();
const express = require("express");
const path = require("path");
const fs = require("fs");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const axios = require("axios");
const { URL } = require("url"); // Import URL module
const { error } = require("console");
const app = express();
const session = require("express-session");
const LegitController = require("./controllers/LegitController");
const certificateController = require("./controllers/certificateController");

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

// middleware setup
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
app.use(
  session({
    secret: "your-secret-key",
    resave: false,
    saveUninitialized: true,
    cookie: {
      httpOnly: true,
      secure: false, // Set to true if using HTTPS
      maxAge: 1000 * 60 * 60 * 24, // 1 day session expiration
    },
  })
);

// Route for home page
app.get("/", (req, res) => {
  res.render("index");
});
app.get("/about", (req, res) => {
  res.render("about");
});
app.get("/services", (req, res) => {
  res.render("service");
});

// Route for contact page with form
app.get("/contact", (req, res) => {
  res.render("contact");
});
app.get("/code", (req, res) => {
  res.render("random");
});
// Route to display legitimacy page
app.get("/legit", LegitController.showLegitPage);

// Route to handle legitimacy form submission
app.post("/check-legitimacy", LegitController.checkLegitimacy);
// Route to handle legitimacy check via URL parameter
app.get("/legit/:websitename", LegitController.checkLegitimacyByUrl);
app.post("/check-certificate", LegitController.checkCertificate);
app.post("/download/certificate/pdf", certificateController.downloadPDF);
app.post("/download/certificate/image", certificateController.downloadImage);
// Route to handle form submission
app.post("/send-message", async (req, res) => {
  const { name, email, phone, message } = req.body;

  // Format the message for Telegram
  const telegramMessage = `
    New contact form submission:
    Name: ${name}
    Email: ${email}
    Message: ${message}
    Phone: ${phone}
  `;

  const telegramUrl = `https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`;

  try {
    // Send the message to Telegram
    await axios.post(telegramUrl, {
      chat_id: process.env.CHAT_ID,
      text: telegramMessage,
    });

    // Send a response to the user
    res.send("Message sent successfully!");
  } catch (error) {
    console.error("Error sending message to Telegram:", error);
    res.status(500).send("Failed to send message.");
  }
});

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});
// error handler
app.use(function (err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
