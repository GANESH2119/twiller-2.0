"use client";

import i18n from "../i18n";

import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from "firebase/auth";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
} from "react";

import { auth } from "./firebase";
import axiosInstance from "../lib/axiosInstance";

/* =========================================================
   USER TYPE
========================================================= */

interface User {
  _id: string;
  username: string;
  displayName: string;
  avatar: string;
  bio?: string;
  joinedDate: string;
  email: string;
  phone: string;
  website: string;
  location: string;
  preferredLanguage?: string;
}

/* =========================================================
   AUTH CONTEXT TYPE
========================================================= */

interface AuthContextType {
  user: User | null;

  login: (
    email: string,
    password: string
  ) => Promise<void>;

  forgotPassword: (
    email: string
  ) => Promise<void>;

  signup: (
    email: string,
    password: string,
    username: string,
    displayName: string,
    phone: string
  ) => Promise<void>;

  updateProfile: (profileData: {
    displayName: string;
    bio: string;
    location: string;
    website: string;
    avatar: string;
    preferredLanguage: string;
  }) => Promise<void>;

  logout: () => void;

  isLoading: boolean;

  googlesignin: () => void;
}

/* =========================================================
   CREATE CONTEXT
========================================================= */

const AuthContext =
  createContext<AuthContextType | undefined>(
    undefined
  );

/* =========================================================
   USE AUTH
========================================================= */

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error(
      "useAuth must be used within an AuthProvider"
    );
  }

  return context;
};

/* =========================================================
   AUTH PROVIDER
========================================================= */

export const AuthProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [user, setUser] =
    useState<User | null>(null);

  const [isLoading, setIsLoading] =
    useState(true);

  /* =======================================================
     EXISTING SESSION CHECK
  ======================================================= */

  useEffect(() => {
    const unsubscribe =
      onAuthStateChanged(
        auth,
        async (firebaseUser) => {
          if (firebaseUser?.email) {
            try {
              const res =
                await axiosInstance.get(
                  "/loggedinuser",
                  {
                    params: {
                      email:
                        firebaseUser.email,
                    },
                  }
                );

              if (!res.data) {
                throw new Error(
                  "User not found"
                );
              }

              setUser(res.data);

              if (
                res.data.preferredLanguage
              ) {
                await i18n.changeLanguage(
                  res.data.preferredLanguage
                );
              }
            } catch (err) {
              console.log(
                "Failed to fetch user:",
                err
              );
            }
          } else {
            setUser(null);

            localStorage.removeItem(
              "twitter-user"
            );
          }

          setIsLoading(false);
        }
      );

    return () => unsubscribe();
  }, []);

  /* =======================================================
     BROWSER DETECTION
     
     Chrome:
     - OTP required

     Microsoft Edge:
     - OTP not required

     Important:
     Edge user-agent also contains "Chrome",
     so we check "Edg" first.
  ======================================================= */

  const isChromeBrowser = () => {
    if (
      typeof window === "undefined" ||
      typeof navigator === "undefined"
    ) {
      return false;
    }

    const userAgent =
      navigator.userAgent;

    const isEdge =
      /Edg\//i.test(userAgent);

    const isChrome =
      /Chrome\//i.test(userAgent);

    return isChrome && !isEdge;
  };

  /* =======================================================
     LOGIN
     
     FLOW:

     Email + Password
           ↓
     Firebase authentication
           ↓
     Chrome?
       ↓ YES
     Send Email OTP
           ↓
     Enter OTP
           ↓
     Verify OTP
           ↓
     Login History
           ↓
     Login successful

     Edge:
     Password → Login History → Login successful

     Mobile:
     Backend checks 10 AM - 1 PM
  ======================================================= */

  const login = async (
    email: string,
    password: string
  ) => {
    setIsLoading(true);

    try {
      /* ---------------------------------------------------
         STEP 1
         FIREBASE LOGIN
      --------------------------------------------------- */

      const usercred =
        await signInWithEmailAndPassword(
          auth,
          email,
          password
        );

      const firebaseuser =
        usercred.user;

      if (!firebaseuser?.email) {
        throw new Error(
          "Email not found"
        );
      }

      /* ---------------------------------------------------
         STEP 2
         GET USER FROM DATABASE
      --------------------------------------------------- */

      const res =
        await axiosInstance.get(
          "/loggedinuser",
          {
            params: {
              email:
                firebaseuser.email,
            },
          }
        );

      if (!res.data) {
        await signOut(auth);

        throw new Error(
          "User data not found"
        );
      }
      /* ---------------------------------------------------
         STEP 3
         CHROME EMAIL OTP
      --------------------------------------------------- */

      if (isChromeBrowser()) {
        try {
          console.log("Chrome detected. Sending login OTP...");

          const otpResponse = await axiosInstance.post(
            "/send-otp",
            {
              email: firebaseuser.email,
            }
          );

          console.log(
            "OTP API Response:",
            otpResponse.data
          );

          if (!otpResponse.data?.success) {
            await signOut(auth);

            throw new Error(
              "Failed to send login OTP."
            );
          }

          const generatedOtp =
            otpResponse.data.otp;

          const enteredOtp =
            window.prompt(
              "A verification OTP has been sent to your registered email.\n\nEnter OTP:"
            );

          /* ------------------------------------------------
             USER CANCELLED OTP
          ------------------------------------------------ */

          if (
            enteredOtp === null ||
            enteredOtp.trim() === ""
          ) {
            await signOut(auth);

            throw new Error(
              "Login cancelled. OTP verification is required for Chrome."
            );
          }

          /* ------------------------------------------------
             OTP CHECK
          ------------------------------------------------ */

          console.log(
            "Entered OTP:",
            enteredOtp.trim()
          );

          console.log(
            "Generated OTP:",
            String(generatedOtp)
          );

          if (
            enteredOtp.trim() !==
            String(generatedOtp).trim()
          ) {
            await signOut(auth);

            throw new Error(
              "Invalid OTP. Login failed."
            );
          }

          alert(
            "Email OTP verified successfully."
          );

        } catch (otpError: any) {
          console.error(
            "OTP Verification Error:",
            otpError
          );

          await signOut(auth);

          throw new Error(
            otpError.message ||
              "OTP verification failed."
          );
        }
      }

      /* ---------------------------------------------------
         STEP 4
         SAVE LOGIN HISTORY
         
         Backend automatically detects:
         - Browser
         - Operating System
         - Device
         - IP Address
         - Login Time

         Backend also checks:
         Mobile login only 10 AM - 1 PM
      --------------------------------------------------- */

      const securityResponse =
        await axiosInstance.post(
          "/login-history",
          {
            email:
              firebaseuser.email,
          }
        );

      /* ---------------------------------------------------
         STEP 5
         CHECK SECURITY RESPONSE
      --------------------------------------------------- */

      if (
        securityResponse.data
          ?.success !== true
      ) {
        await signOut(auth);

        throw new Error(
          securityResponse.data
            ?.message ||
            "Login was blocked."
        );
      }

      /* ---------------------------------------------------
         STEP 6
         LOGIN SUCCESS
      --------------------------------------------------- */

      setUser(res.data);

      localStorage.setItem(
        "twitter-user",
        JSON.stringify(res.data)
      );

      /* ---------------------------------------------------
         STEP 7
         LANGUAGE
      --------------------------------------------------- */

      if (
        res.data.preferredLanguage
      ) {
        await i18n.changeLanguage(
          res.data.preferredLanguage
        );
      }
    } catch (error: any) {
      console.error(
        "Login Error:",
        error
      );

      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  /* =======================================================
     FORGOT PASSWORD
  ======================================================= */

  const forgotPassword =
    async (
      identifier: string
    ) => {
      try {
        const res =
          await axiosInstance.post(
            "/forgot-password",
            {
              identifier,
            }
          );

        alert(
          res.data.message
        );
      } catch (error: any) {
        alert(
          error.response
            ?.data?.message ||
            "Failed to send reset email"
        );
      }
    };

  /* =======================================================
     SIGNUP
  ======================================================= */

  const signup = async (
    email: string,
    password: string,
    username: string,
    displayName: string,
    phone: string
  ) => {
    setIsLoading(true);

    try {
      const usercred =
        await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );

      const firebaseuser =
        usercred.user;

      const newuser: any = {
        username,

        displayName,

        avatar:
          firebaseuser.photoURL ||
          "",

        email:
          firebaseuser.email,

        phone,
      };

      const res =
        await axiosInstance.post(
          "/register",
          newuser
        );

      if (res.data) {
        setUser(res.data);

        localStorage.setItem(
          "twitter-user",
          JSON.stringify(res.data)
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  /* =======================================================
     LOGOUT
  ======================================================= */

  const logout = async () => {
    setUser(null);

    await signOut(auth);

    localStorage.removeItem(
      "twitter-user"
    );
  };

  /* =======================================================
     UPDATE PROFILE
  ======================================================= */

  const updateProfile =
    async (profileData: {
      displayName: string;
      bio: string;
      location: string;
      website: string;
      avatar: string;
      preferredLanguage: string;
    }) => {
      if (!user) return;

      setIsLoading(true);

      try {
        const updatedUser: User = {
          ...user,
          ...profileData,
        };

        const res =
          await axiosInstance.patch(
            `/userupdate/${user.email}`,
            updatedUser
          );

        if (res.data) {
          setUser(updatedUser);

          localStorage.setItem(
            "twitter-user",
            JSON.stringify(
              updatedUser
            )
          );

          if (
            updatedUser.preferredLanguage
          ) {
            await i18n.changeLanguage(
              updatedUser.preferredLanguage
            );
          }
        }
      } finally {
        setIsLoading(false);
      }
    };

  /* =======================================================
     GOOGLE SIGN IN
  ======================================================= */

  const googlesignin =
    async () => {
      setIsLoading(true);

      try {
        const googleauthprovider =
          new GoogleAuthProvider();

        const result =
          await signInWithPopup(
            auth,
            googleauthprovider
          );

        const firebaseuser =
          result.user;

        if (
          !firebaseuser?.email
        ) {
          throw new Error(
            "No email found in Google account"
          );
        }

        let userData;

        /* -------------------------------------------------
           CHECK USER
        ------------------------------------------------- */

        try {
          const res =
            await axiosInstance.get(
              "/loggedinuser",
              {
                params: {
                  email:
                    firebaseuser.email,
                },
              }
            );

          userData = res.data;
        } catch (err: any) {
          /* -----------------------------------------------
             CREATE NEW GOOGLE USER
          ----------------------------------------------- */

          const newuser: any = {
            username:
              firebaseuser.email
                .split("@")[0],

            displayName:
              firebaseuser.displayName ||
              "User",

            avatar:
              firebaseuser.photoURL ||
              "",

            email:
              firebaseuser.email,
          };

          const registerRes =
            await axiosInstance.post(
              "/register",
              newuser
            );

          userData =
            registerRes.data;
        }

        /* -------------------------------------------------
           SAVE GOOGLE LOGIN HISTORY
        ------------------------------------------------- */

        if (userData) {
          const securityResponse =
            await axiosInstance.post(
              "/login-history",
              {
                email:
                  firebaseuser.email,
              }
            );

          if (
            securityResponse.data
              ?.success !== true
          ) {
            await signOut(auth);

            throw new Error(
              securityResponse.data
                ?.message ||
                "Google login was blocked."
            );
          }

          setUser(userData);

          localStorage.setItem(
            "twitter-user",
            JSON.stringify(
              userData
            )
          );

          if (
            userData.preferredLanguage
          ) {
            await i18n.changeLanguage(
              userData.preferredLanguage
            );
          }
        } else {
          throw new Error(
            "Login/Register failed: No user data returned"
          );
        }
      } catch (error: any) {
        console.error(
          "Google Sign-In Error:",
          error
        );

        alert(
          error.response
            ?.data?.message ||
          error.message ||
          "Login failed"
        );
      } finally {
        setIsLoading(false);
      }
    };

  /* =======================================================
     PROVIDER
  ======================================================= */

  return (
    <AuthContext.Provider
      value={{
        user,

        login,

        forgotPassword,

        signup,

        updateProfile,

        logout,

        isLoading,

        googlesignin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};