const pool = require("../db");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");

const signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    //Check user exist or not
    const existUser = await pool.query("SELECT * FROM users WHERE email=$1", [
      email,
    ]);
    if (existUser.rows.length > 0) {
      return res.status(403).json({ message: "User already exists" });
    }

    if (!password) {
      return res.status(400).json({ message: "Password is required" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationCode = Math.floor(100000 + Math.random() * 900000); // Generate OTP

    // Save user to database
    const createdUser = await pool.query(
      "INSERT INTO users (name, email, password, verification_code) VALUES ($1, $2, $3, $4)",
      [name, email, hashedPassword, verificationCode]
    );

    // Send verification email with OTP
    await sendVerificationEmail(email, verificationCode);

    const user = createdUser.rows[0];
    res
      .status(201)
      .json({ message: "Signup successful. Please verify your email.", user });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Server Error" });
  }
};

const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    // Verify OTP logic
    // Fetch user from database
    const user = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    if (user.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if OTP matches
    if (user.rows[0].verification_code !== parseInt(otp)) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    // Update user's verification status
    await pool.query("UPDATE users SET verified = true WHERE email = $1", [
      email,
    ]);

    res
      .status(200)
      .json({ message: "Email verification successful. You can now login." });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Server Error" });
  }
};

const login = async (req, res) => {
  try {
    // Login logic
    const { email, password } = req.body;

    // Check if user exists
    const user = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    if (user.rows.length === 0) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(
      password,
      user.rows[0].password
    );
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Check if user is verified
    if (!user.rows[0].verified) {
      return res
        .status(401)
        .json({ message: "Email not verified. Please verify your email." });
    }

    res.status(200).json({ message: "Login successful" });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Server Error" });
  }
};

const sendVerificationEmail = async (email, verificationCode) => {
  // Send verification email logic using nodemailer
  try {
    const transporter = nodemailer.createTransport({
      // port: 587,
      // secure: false,
      service: "gmail",
      auth: {
        user: "mtshah92@gmail.com",
        pass: "blnkquosmhbzzeex",
      },
    });

    const mailOptions = {
      from: "mtshah92@gmail.com",
      to: email,
      subject: "Email Verification",
      text: `Your verification code is: ${verificationCode}`,
    };

    await transporter.sendMail(mailOptions);
    console.log("Verification email sent");
  } catch (error) {
    console.error("Error sending verification email:", error.message);
  }
};

module.exports = { signup, verifyOTP, login };
