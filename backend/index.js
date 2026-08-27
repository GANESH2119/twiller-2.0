import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./models/user.js";
import Tweet from "./models/tweet.js";
import multer from "multer";
import nodemailer from "nodemailer";
import Razorpay from "razorpay";
import twilio from "twilio";
import { UAParser } from "ua-parser-js";

dotenv.config();

/* =========================================================
   TWILIO
========================================================= */

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

/* =========================================================
   RAZORPAY
========================================================= */

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/* =========================================================
   NODEMAILER
========================================================= */

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/* =========================================================
   EMAIL OTP STORAGE
========================================================= */

const emailOtps = new Map();

/* =========================================================
   EXPRESS APP
========================================================= */

const app = express();

app.set("trust proxy", 1);

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(express.json());

app.use("/uploads", express.static("uploads"));

/* =========================================================
   MULTER
========================================================= */

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },

  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });

/* =========================================================
   RANDOM PASSWORD
========================================================= */

function generatePassword(length = 8) {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  let password = "";

  for (let i = 0; i < length; i++) {
    password += chars.charAt(
      Math.floor(Math.random() * chars.length)
    );
  }

  return password;
}

/* =========================================================
   DEVICE / BROWSER INFORMATION
========================================================= */

function getClientInfo(req) {
  const parser = new UAParser(req.headers["user-agent"]);

  const result = parser.getResult();

  let device = "Desktop";

  if (result.device.type === "mobile") {
    device = "Mobile";
  } else if (result.device.type === "tablet") {
    device = "Tablet";
  }

  const browser = result.browser.name || "Unknown";

  const operatingSystem =
    result.os.name || "Unknown";

  let ipAddress =
    req.headers["x-forwarded-for"] ||
    req.socket.remoteAddress ||
    "Unknown";

  if (typeof ipAddress === "string") {
    ipAddress = ipAddress.split(",")[0].trim();
  }

  return {
    browser,
    operatingSystem,
    device,
    ipAddress,
  };
}

/* =========================================================
   HOME
========================================================= */

app.get("/", (req, res) => {
  res.send("Twiller backend is running successfully");
});

/* =========================================================
   EMAIL OTP - SEND
========================================================= */

app.post("/send-otp", async (req, res) => {
  try {
    const { email } = req.body;

    console.log("SEND OTP REQUEST FOR:", email);

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const otp = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    console.log("LOGIN OTP GENERATED:", otp);

    // IMPORTANT: OTP ni Map lo store cheyyali
    emailOtps.set(email.toLowerCase(), {
      otp: otp,
      expiresAt: Date.now() + 10 * 60 * 1000,
    });

    console.log(
      "OTP STORED SUCCESSFULLY FOR:",
      email
    );

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Twiller OTP Verification",
      text: `Your OTP is ${otp}. It is valid for 10 minutes.`,
    });

    console.log(
      "LOGIN OTP EMAIL SENT TO:",
      email
    );

    return res.status(200).json({
      success: true,
      message: "OTP sent successfully",
    });

  } catch (error) {
    console.error("SEND OTP ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to send OTP",
      error: error.message,
    });
  }
});

/* =========================================================
   EMAIL OTP - VERIFY
========================================================= */

app.post("/verify-email-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required",
      });
    }

    const emailKey = email.toLowerCase();

    const storedOtpData =
      emailOtps.get(emailKey);

    console.log(
      "VERIFY OTP FOR:",
      email
    );

    if (!storedOtpData) {
      return res.status(400).json({
        success: false,
        message:
          "OTP not found. Please request a new OTP.",
      });
    }

    if (Date.now() > storedOtpData.expiresAt) {
      emailOtps.delete(emailKey);

      return res.status(400).json({
        success: false,
        message:
          "OTP expired. Please request a new OTP.",
      });
    }

    if (
      storedOtpData.otp !==
      otp.toString().trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    emailOtps.delete(emailKey);

    console.log(
      "OTP VERIFIED SUCCESSFULLY:",
      email
    );

    return res.status(200).json({
      success: true,
      message:
        "OTP verified successfully",
    });

  } catch (error) {
    console.error(
      "VERIFY EMAIL OTP ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "OTP verification failed",
      error: error.message,
    });
  }
});

/* =========================================================
   MOBILE OTP - SEND
========================================================= */

app.post("/send-mobile-otp", async (req, res) => {
  try {
    const { phone } = req.body;

    console.log("PHONE:", phone);

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: "Phone number is required",
      });
    }

    await client.verify.v2
      .services(
        process.env.TWILIO_VERIFY_SERVICE_SID
      )
      .verifications.create({
        to: phone,
        channel: "sms",
      });

    return res.status(200).json({
      success: true,
      message: "OTP sent successfully",
    });

  } catch (error) {
    console.error(
      "MOBILE SEND OTP ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to send mobile OTP",
      error: error.message,
    });
  }
});

/* =========================================================
   MOBILE OTP - VERIFY
========================================================= */

app.post("/verify-mobile-otp", async (req, res) => {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({
        success: false,
        message:
          "Phone and OTP are required",
      });
    }

    const verification =
      await client.verify.v2
        .services(
          process.env.TWILIO_VERIFY_SERVICE_SID
        )
        .verificationChecks.create({
          to: phone,
          code: otp,
        });

    if (
      verification.status === "approved"
    ) {
      return res.status(200).json({
        success: true,
        message:
          "Mobile OTP verified successfully",
      });
    }

    return res.status(400).json({
      success: false,
      message: "Invalid OTP",
    });

  } catch (error) {
    console.error(
      "TWILIO VERIFY ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/* =========================================================
   FORGOT PASSWORD
========================================================= */

app.post("/forgot-password", async (req, res) => {
  try {
    const { email, identifier } = req.body;

    const userEmail =
      email || identifier;

    if (!userEmail) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const user = await User.findOne({
      email: userEmail,
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.lastPasswordReset) {
      const lastReset =
        new Date(user.lastPasswordReset);

      const today = new Date();

      if (
        lastReset.getDate() ===
          today.getDate() &&
        lastReset.getMonth() ===
          today.getMonth() &&
        lastReset.getFullYear() ===
          today.getFullYear()
      ) {
        return res.status(400).json({
          success: false,
          message:
            "You can use this option only one time per day.",
        });
      }
    }

    const newPassword =
      generatePassword(8);

    user.password = newPassword;
    user.lastPasswordReset =
      new Date();

    await user.save();

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: userEmail,
      subject: "Twiller Password Reset",
      text:
        `Your new password is: ${newPassword}`,
    });

    return res.status(200).json({
      success: true,
      message:
        "New password sent to your email",
    });

  } catch (error) {
    console.error(
      "FORGOT PASSWORD ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/* =========================================================
   REGISTER
========================================================= */

app.post("/register", async (req, res) => {
  try {
    const existinguser =
      await User.findOne({
        email: req.body.email,
      });

    if (existinguser) {
      return res.status(200).send(
        existinguser
      );
    }

    const newUser =
      new User(req.body);

    await newUser.save();

    return res.status(201).send(
      newUser
    );

  } catch (error) {
    return res.status(400).send({
      error: error.message,
    });
  }
});

/* =========================================================
   GET LOGGED-IN USER
========================================================= */

app.get("/loggedinuser", async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).send({
        error: "Email required",
      });
    }

    const user = await User.findOne({
      email,
    });

    if (!user) {
      return res.status(404).send({
        error: "User not found",
      });
    }

    return res.status(200).send(user);

  } catch (error) {
    return res.status(400).send({
      error: error.message,
    });
  }
});

/* =========================================================
   SAVE LOGIN HISTORY
========================================================= */

app.post("/login-history", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const user = await User.findOne({
      email,
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const clientInfo =
      getClientInfo(req);

    if (
      clientInfo.device === "Mobile"
    ) {
      const now = new Date();

      const hour =
        now.getHours();

      const minute =
        now.getMinutes();

      const currentMinutes =
        hour * 60 + minute;

      const startTime = 10 * 60;
      const endTime = 13 * 60;

      if (
        currentMinutes < startTime ||
        currentMinutes >= endTime
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Mobile login is allowed only between 10:00 AM and 1:00 PM.",
        });
      }
    }

    user.loginHistory.push({
      browser:
        clientInfo.browser,

      operatingSystem:
        clientInfo.operatingSystem,

      device:
        clientInfo.device,

      ipAddress:
        clientInfo.ipAddress,

      loginTime:
        new Date(),
    });

    await user.save();

    return res.status(200).json({
      success: true,
      message:
        "Login history saved successfully",
    });

  } catch (error) {
    console.error(
      "LOGIN HISTORY ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/* =========================================================
   GET LOGIN HISTORY
========================================================= */

app.get("/login-history", async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const user =
      await User.findOne(
        { email },
        { loginHistory: 1 }
      );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      loginHistory:
        user.loginHistory || [],
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/* =========================================================
   CREATE RAZORPAY ORDER
========================================================= */

app.post("/create-order", async (req, res) => {
  try {
    const { amount } = req.body;

    const options = {
      amount: amount * 100,
      currency: "INR",
      receipt:
        "receipt_" + Date.now(),
    };

    const order =
      await razorpay.orders.create(
        options
      );

    return res.status(200).json(order);

  } catch (error) {
    return res.status(500).json({
      error: error.message,
    });
  }
});

/* =========================================================
   UPDATE PROFILE
========================================================= */

app.patch(
  "/userupdate/:email",
  async (req, res) => {
    try {
      const { email } = req.params;

      const updated =
        await User.findOneAndUpdate(
          { email },
          {
            $set: req.body,
          },
          {
            new: true,
            upsert: false,
          }
        );

      if (!updated) {
        return res.status(404).json({
          error: "User not found",
        });
      }

      if (
        req.body.subscriptionPlan &&
        req.body.subscriptionPlan !==
          "Free"
      ) {
        const invoiceNumber =
          "INV-" + Date.now();

        const paymentDate =
          new Date().toLocaleString();

        const expiryDate =
          new Date();

        expiryDate.setDate(
          expiryDate.getDate() + 30
        );

        await User.findOneAndUpdate(
          { email },
          {
            subscriptionExpiry:
              expiryDate,
          }
        );

        await transporter.sendMail({
          from:
            process.env.EMAIL_USER,

          to: email,

          subject:
            "Twiller Subscription Activated",

          text: `
Subscription Activated Successfully

Invoice No: ${invoiceNumber}

Plan: ${req.body.subscriptionPlan}

Tweet Limit: ${req.body.tweetLimit}

Payment Date: ${paymentDate}

Expiry Date: ${expiryDate.toDateString()}

Thank you for subscribing to Twiller.
          `,
        });
      }

      return res.status(200).send(
        updated
      );

    } catch (error) {
      return res.status(400).send({
        error: error.message,
      });
    }
  }
);

/* =========================================================
   AUDIO UPLOAD
========================================================= */

app.post(
  "/upload-audio",
  upload.single("audio"),
  (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message:
            "Audio file is required",
        });
      }

      const baseUrl =
        `${req.protocol}://${req.get("host")}`;

      const audioUrl =
        `${baseUrl}/uploads/${req.file.filename}`;

      return res.status(200).json({
        success: true,
        audioUrl,
      });

    } catch (error) {
      return res.status(400).json({
        error: error.message,
      });
    }
  }
);

/* =========================================================
   CREATE TWEET
========================================================= */

app.post("/post", async (req, res) => {
  try {
    const user =
      await User.findById(
        req.body.author
      );

    if (!user) {
      return res.status(404).send({
        error: "User not found",
      });
    }

    if (
      user.tweetsPosted >=
      user.tweetLimit
    ) {
      return res.status(400).send({
        error:
          "Tweet limit reached. Upgrade your plan.",
      });
    }

    const tweet =
      new Tweet(req.body);

    await tweet.save();

    user.tweetsPosted += 1;

    await user.save();

    return res.status(201).send(
      tweet
    );

  } catch (error) {
    return res.status(400).send({
      error: error.message,
    });
  }
});

/* =========================================================
   GET ALL TWEETS
========================================================= */

app.get("/post", async (req, res) => {
  try {
    const tweet =
      await Tweet.find()
        .sort({
          timestamp: -1,
        })
        .populate("author");

    return res.status(200).send(
      tweet
    );

  } catch (error) {
    return res.status(400).send({
      error: error.message,
    });
  }
});

/* =========================================================
   LIKE TWEET
========================================================= */

app.post(
  "/like/:tweetid",
  async (req, res) => {
    try {
      const { userId } = req.body;

      const tweet =
        await Tweet.findById(
          req.params.tweetid
        );

      if (!tweet) {
        return res.status(404).send({
          error: "Tweet not found",
        });
      }

      if (
        !tweet.likedBy.includes(
          userId
        )
      ) {
        tweet.likes += 1;

        tweet.likedBy.push(
          userId
        );

        await tweet.save();
      }

      return res.send(tweet);

    } catch (error) {
      return res.status(400).send({
        error: error.message,
      });
    }
  }
);

/* =========================================================
   RETWEET
========================================================= */

app.post(
  "/retweet/:tweetid",
  async (req, res) => {
    try {
      const { userId } = req.body;

      const tweet =
        await Tweet.findById(
          req.params.tweetid
        );

      if (!tweet) {
        return res.status(404).send({
          error: "Tweet not found",
        });
      }

      if (
        !tweet.retweetedBy.includes(
          userId
        )
      ) {
        tweet.retweets += 1;

        tweet.retweetedBy.push(
          userId
        );

        await tweet.save();
      }

      return res.send(tweet);

    } catch (error) {
      return res.status(400).send({
        error: error.message,
      });
    }
  }
);

/* =========================================================
   MONGODB CONNECTION + SERVER START
========================================================= */

const port =
  process.env.PORT || 5000;

const url =
  process.env.MONOGDB_URL;

mongoose
  .connect(url)
  .then(async () => {
    console.log(
      "✅ Connected to MongoDB"
    );

    try {
      await transporter.verify();

      console.log(
        "✅ Gmail transporter is ready"
      );
    } catch (error) {
      console.error(
        "❌ Gmail transporter error:",
        error.message
      );
    }

    app.listen(port, () => {
      console.log(
        `🚀 Server running on port ${port}`
      );
    });
  })
  .catch((err) => {
    console.error(
      "❌ MongoDB connection error:",
      err.message
    );
  });