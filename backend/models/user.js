import mongoose from "mongoose";

/* =========================================================
   LOGIN HISTORY SCHEMA

   Stores:
   - Browser
   - Operating System
   - Device
   - IP Address
   - Login Time
========================================================= */

const LoginHistorySchema = new mongoose.Schema(
  {
    browser: {
      type: String,
      default: "Unknown",
    },

    operatingSystem: {
      type: String,
      default: "Unknown",
    },

    device: {
      type: String,
      default: "Desktop/Laptop",
    },

    ipAddress: {
      type: String,
      default: "Unknown",
    },

    loginTime: {
      type: Date,
      default: Date.now,
    },
  },
  {
    _id: false,
  }
);

/* =========================================================
   USER SCHEMA
========================================================= */

const UserSchema = new mongoose.Schema({
  /* =======================================================
     BASIC USER INFORMATION
  ======================================================= */

  username: {
    type: String,
    required: true,
  },

  displayName: {
    type: String,
    required: true,
  },

  avatar: {
    type: String,
    required: false,
  },

  email: {
    type: String,
    required: true,
    unique: true,
  },

  phone: {
    type: String,
    default: "",
  },

  /* =======================================================
     PROFILE INFORMATION
  ======================================================= */

  bio: {
    type: String,
    default: "",
  },

  location: {
    type: String,
    default: "",
  },

  website: {
    type: String,
    default: "",
  },

  joinedDate: {
    type: Date,
    default: Date.now,
  },

  /* =======================================================
     PASSWORD / SECURITY
  ======================================================= */

  password: {
    type: String,
    required: false,
  },

  lastPasswordReset: {
    type: Date,
    default: null,
  },

  /* =======================================================
     SUBSCRIPTION
  ======================================================= */

  subscriptionPlan: {
    type: String,
    default: "Free",
  },

  tweetLimit: {
    type: Number,
    default: 1,
  },

  tweetsPosted: {
    type: Number,
    default: 0,
  },

  subscriptionExpiry: {
    type: Date,
    default: null,
  },

  /* =======================================================
     LANGUAGE
  ======================================================= */

  preferredLanguage: {
    type: String,
    default: "en",
  },

  /* =======================================================
     LOGIN HISTORY - TASK 6
     
     Every successful login can store:
     Browser
     Operating System
     Device
     IP Address
     Login Time
  ======================================================= */

  loginHistory: {
    type: [LoginHistorySchema],
    default: [],
  },
});

/* =========================================================
   EXPORT USER MODEL
========================================================= */

export default mongoose.model("User", UserSchema);