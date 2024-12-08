const express = require("express");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const fs = require("fs");
const csv = require("csv-parser");
const path = require("path");

const app = express();
const PORT = 3000;
const SECRET_KEY = "your_secret_key";

app.use(bodyParser.json());
app.use(express.static("public"));

// File paths
const USERS_CSV = path.join(__dirname, "users.csv");
const ASSOCIATIONS_CSV = path.join(__dirname, "associations.csv");

// Email transporter (replace with actual credentials)
const transporter = nodemailer.createTransport({
  service: "gmail",
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // true for port 465, false for other ports
  auth: {
    user: "irmuunboldbaatar10@gmail.com",
    pass: "ljbhnqljivrdqpwz",
  },
});

// Utility functions
const saveToCSV = (filePath, data) => {
  const headers = Object.keys(data).join(",") + "\n";
  const values = Object.values(data).join(",") + "\n";
  if (!fs.existsSync(filePath)) fs.writeFileSync(filePath, headers);
  fs.appendFileSync(filePath, values);
};

const findInCSV = async (filePath, key, value) => {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (row) => {
        if (row[key] === value) results.push(row);
      })
      .on("end", () => resolve(results))
      .on("error", reject);
  });
};

// Endpoints
app.post("/signup", async (req, res) => {
  const { email, password } = req.body;
  if (!/^[a-zA-Z0-9._%+-]+@shinemongol\.edu\.mn$/.test(email)) {
    return res.status(400).send("Please use a valid school email.");
  }

  const existingUsers = await findInCSV(USERS_CSV, "email", email);
  if (existingUsers.length) {
    return res.status(400).send("Email already registered.");
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const token = jwt.sign({ email }, SECRET_KEY, { expiresIn: "15m" });

  // Send verification email
  const verificationLink = `http://localhost:${PORT}/verify?token=${token}`;
  await transporter.sendMail({
    from: '"developer👻"<irmuunboldbaatar10@gmail.com`>',
    to: email,
    subject: "Verify Your Account",
    text: `Click here to verify your account: ${verificationLink}`,
  });

  saveToCSV(USERS_CSV, { email, password: hashedPassword, verified: false });
  res.status(200).send("A verification email has been sent to your inbox.");
});

app.get("/verify", (req, res) => {
  const token = req.query.token;
  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    const users = fs.readFileSync(USERS_CSV, "utf8").split("\n");
    const updatedUsers = users
      .map((line) => (line.includes(decoded.email) ? line.replace(",false", ",true") : line))
      .join("\n");
    fs.writeFileSync(USERS_CSV, updatedUsers);
    res.status(200).send("Account verified successfully!");
  } catch (err) {
    res.status(400).send("Invalid or expired token.");
  }
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = (await findInCSV(USERS_CSV, "email", email))[0];
  if (!user || !user.verified) return res.status(400).send("Account not verified or doesn't exist.");
  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(400).send("Incorrect password.");

  const token = jwt.sign({ email }, SECRET_KEY, { expiresIn: "1h" });
  res.status(200).json({ token });
});

app.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  const user = (await findInCSV(USERS_CSV, "email", email))[0];
  if (!user) return res.status(400).send("Email not registered.");

  const token = jwt.sign({ email }, SECRET_KEY, { expiresIn: "15m" });
  const resetLink = `http://localhost:${PORT}/reset-password?token=${token}`;
  await transporter.sendMail({
    from: "irmuunboldbaatar10@gmail.com",
    to: email,
    subject: "Reset Your Password",
    text: `Click here to reset your password: ${resetLink}`,
  });

  res.status(200).send("A password reset email has been sent to your inbox.");
});

app.post("/reset-password", async (req, res) => {
  const { token, newPassword } = req.body;
  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const users = fs.readFileSync(USERS_CSV, "utf8").split("\n");
    const updatedUsers = users
      .map((line) => (line.includes(decoded.email) ? line.replace(/[^,]+$/, hashedPassword) : line))
      .join("\n");
    fs.writeFileSync(USERS_CSV, updatedUsers);
    res.status(200).send("Password reset successful.");
  } catch (err) {
    res.status(400).send("Invalid or expired token.");
  }
});

app.get("/assigned", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).send("Unauthorized.");

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    const association = (await findInCSV(ASSOCIATIONS_CSV, "email", decoded.email))[0];
    if (!association) return res.status(404).send("No association found.");

    res.status(200).json({ name: association.name });
  } catch (err) {
    res.status(400).send("Invalid token.");
  }
});

// Start server
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
