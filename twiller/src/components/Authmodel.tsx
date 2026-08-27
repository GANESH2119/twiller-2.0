"use client";

import React, { useState } from "react";
import axios from "axios";

import {
  X,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
} from "lucide-react";

import LoadingSpinner from "./loading-spinner";
import { Button } from "./ui/button";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "./ui/card";

import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Separator } from "./ui/separator";

import { useAuth } from "@/context/AuthContext";
import TwitterLogo from "./Twitterlogo";

/* =========================================================
   BACKEND API URL

   Set this in Vercel Environment Variables:
   NEXT_PUBLIC_API_URL=https://your-backend-url.onrender.com
========================================================= */

const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: "login" | "signup";
}

export default function AuthModal({
  isOpen,
  onClose,
  initialMode = "login",
}: AuthModalProps) {
  const {
    login,
    signup,
    forgotPassword,
    logout,
    isLoading,
  } = useAuth();

  const [mode, setMode] = useState<"login" | "signup">(
    initialMode
  );

  const [showPassword, setShowPassword] = useState(false);

  /* =========================================================
     FORM DATA
  ========================================================= */

  const [formData, setFormData] = useState({
    email: "",
    phone: "",
    password: "",
    username: "",
    displayName: "",
  });

  const [errors, setErrors] = useState<
    Record<string, string>
  >({});

  /* =========================================================
     SIGNUP OTP
  ========================================================= */

  const [signupOtp, setSignupOtp] = useState("");

  const [generatedSignupOtp, setGeneratedSignupOtp] =
    useState("");

  const [signupOtpSent, setSignupOtpSent] =
    useState(false);

  /* =========================================================
     LOGIN OTP
  ========================================================= */

  const [loginOtp, setLoginOtp] = useState("");

  const [generatedLoginOtp, setGeneratedLoginOtp] =
    useState("");

  const [loginOtpSent, setLoginOtpSent] =
    useState(false);

  /* =========================================================
     FORGOT PASSWORD
  ========================================================= */

  const [recoveryPhone, setRecoveryPhone] =
    useState("");

  const [recoveryOtp, setRecoveryOtp] =
    useState("");

  const [showRecoveryOptions, setShowRecoveryOptions] =
    useState(false);

  /* =========================================================
     BROWSER DETECTION
  ========================================================= */

  const getBrowser = () => {
    const userAgent = navigator.userAgent;

    if (
      userAgent.includes("Edg/") ||
      userAgent.includes("Edge/")
    ) {
      return "Microsoft";
    }

    if (
      userAgent.includes("Chrome/") &&
      !userAgent.includes("Edg/")
    ) {
      return "Chrome";
    }

    return "Other";
  };

  /* =========================================================
     VALIDATE FORM
  ========================================================= */

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email =
        "Please enter a valid email";
    }

    if (!formData.password.trim()) {
      newErrors.password = "Password is required";
    } else if (
      formData.password.length < 6
    ) {
      newErrors.password =
        "Password must be at least 6 characters";
    }

    if (mode === "signup") {
      if (!formData.username.trim()) {
        newErrors.username =
          "Username is required";
      } else if (
        formData.username.length < 3
      ) {
        newErrors.username =
          "Username must be at least 3 characters";
      } else if (
        !/^[a-zA-Z0-9_]+$/.test(
          formData.username
        )
      ) {
        newErrors.username =
          "Username can only contain letters, numbers, and underscores";
      }

      if (!formData.displayName.trim()) {
        newErrors.displayName =
          "Display name is required";
      }

      if (!formData.phone.trim()) {
        newErrors.phone =
          "Phone number is required";
      }
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  /* =========================================================
     SEND LOGIN OTP
  ========================================================= */

  const sendLoginOtp = async () => {
    if (!formData.email.trim()) {
      alert("Please enter your email first.");
      return;
    }

    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      alert("Please enter a valid email.");
      return;
    }

    if (!API_URL) {
      alert(
        "Backend API URL is not configured."
      );
      return;
    }

    try {
      const res = await axios.post(
        `${API_URL}/send-otp`,
        {
          email: formData.email,
        }
      );

      if (res.data.success) {
        setGeneratedLoginOtp(
          String(res.data.otp)
        );

        setLoginOtpSent(true);
        setLoginOtp("");

        alert(
          "OTP sent successfully to your email."
        );
      }
    } catch (error: any) {
      console.error(
        "LOGIN OTP ERROR:",
        error.response?.data || error.message
      );

      alert(
        error.response?.data?.error ||
          error.response?.data?.message ||
          "Failed to send OTP. Please try again."
      );
    }
  };

  /* =========================================================
     SEND SIGNUP OTP
  ========================================================= */

  const sendSignupOtp = async () => {
    if (!formData.email.trim()) {
      alert("Please enter your email first.");
      return;
    }

    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      alert("Please enter a valid email.");
      return;
    }

    if (!API_URL) {
      alert(
        "Backend API URL is not configured."
      );
      return;
    }

    try {
      const res = await axios.post(
        `${API_URL}/send-otp`,
        {
          email: formData.email,
        }
      );

      if (res.data.success) {
        setGeneratedSignupOtp(
          String(res.data.otp)
        );

        setSignupOtpSent(true);
        setSignupOtp("");

        alert("OTP sent successfully.");
      }
    } catch (error: any) {
      console.error(
        "SIGNUP OTP ERROR:",
        error.response?.data || error.message
      );

      alert(
        error.response?.data?.error ||
          error.response?.data?.message ||
          "Failed to send OTP."
      );
    }
  };

  /* =========================================================
     VERIFY LOGIN OTP
  ========================================================= */

  const verifyLoginOtp = () => {
    if (!loginOtp.trim()) {
      alert("Please enter the OTP.");
      return false;
    }

    if (
      loginOtp.trim() !==
      generatedLoginOtp
    ) {
      alert("Invalid OTP.");
      return false;
    }

    return true;
  };

  /* =========================================================
     VERIFY SIGNUP OTP
  ========================================================= */

  const verifySignupOtp = () => {
    if (!signupOtp.trim()) {
      alert("Please enter the OTP.");
      return false;
    }

    if (
      signupOtp.trim() !==
      generatedSignupOtp
    ) {
      alert("Invalid OTP.");
      return false;
    }

    return true;
  };

  /* =========================================================
     SAVE LOGIN HISTORY
  ========================================================= */

  const saveLoginHistory = async () => {
    if (!API_URL) {
      throw new Error(
        "Backend API URL is not configured."
      );
    }

    try {
      const res = await axios.post(
        `${API_URL}/login-history`,
        {
          email: formData.email,
        }
      );

      return res;
    } catch (error: any) {
      console.error(
        "LOGIN HISTORY ERROR:",
        error.response?.data || error.message
      );

      if (
        error.response?.status === 403
      ) {
        throw new Error(
          error.response?.data?.message ||
            "Mobile login is currently not allowed."
        );
      }

      throw new Error(
        error.response?.data?.message ||
          "Unable to save login history."
      );
    }
  };

  /* =========================================================
     SEND MOBILE OTP
  ========================================================= */

  const sendMobileOtp = async () => {
    if (!recoveryPhone.trim()) {
      alert(
        "Please enter mobile number."
      );
      return;
    }

    if (!API_URL) {
      alert(
        "Backend API URL is not configured."
      );
      return;
    }

    try {
      const res = await axios.post(
        `${API_URL}/send-mobile-otp`,
        {
          phone: recoveryPhone,
        }
      );

      if (res.data.success) {
        alert(
          "Mobile OTP sent successfully."
        );
      }
    } catch (error: any) {
      console.error(
        "MOBILE OTP ERROR:",
        error.response?.data || error.message
      );

      alert(
        error.response?.data?.error ||
          error.response?.data?.message ||
          "Failed to send mobile OTP."
      );
    }
  };

  /* =========================================================
     VERIFY MOBILE OTP
  ========================================================= */

  const verifyMobileOtp = async () => {
    if (
      !recoveryPhone.trim() ||
      !recoveryOtp.trim()
    ) {
      alert(
        "Enter phone number and OTP."
      );
      return;
    }

    if (!API_URL) {
      alert(
        "Backend API URL is not configured."
      );
      return;
    }

    try {
      const res = await axios.post(
        `${API_URL}/verify-mobile-otp`,
        {
          phone: recoveryPhone,
          otp: recoveryOtp,
        }
      );

      if (res.data.success) {
        alert(
          "Mobile OTP verified successfully."
        );
      }
    } catch (error: any) {
      console.error(
        "VERIFY MOBILE OTP ERROR:",
        error.response?.data || error.message
      );

      alert(
        error.response?.data?.error ||
          error.response?.data?.message ||
          "Invalid OTP."
      );
    }
  };

  /* =========================================================
     MAIN SUBMIT
  ========================================================= */

  const handleSubmit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    if (
      !validateForm() ||
      isLoading
    ) {
      return;
    }

    try {
      /* SIGNUP */

      if (mode === "signup") {
        if (!signupOtpSent) {
          alert(
            "Please send OTP to your email first."
          );
          return;
        }

        if (!verifySignupOtp()) {
          return;
        }

        await signup(
          formData.email,
          formData.password,
          formData.username,
          formData.displayName,
          formData.phone
        );

        alert(
          "Account created successfully."
        );

        resetForm();
        onClose();
        return;
      }

      /* LOGIN */

      const browser = getBrowser();

      console.log(
        "Detected browser:",
        browser
      );

      /* CHROME OTP */

      if (browser === "Chrome") {
        if (!loginOtpSent) {
          alert(
            "Google Chrome detected. Please send and verify the OTP before login."
          );
          return;
        }

        if (!verifyLoginOtp()) {
          return;
        }
      }

      /* FIREBASE LOGIN */

      await login(
        formData.email,
        formData.password
      );

      /* SAVE LOGIN HISTORY */

      try {
        await saveLoginHistory();
      } catch (historyError: any) {
        try {
          await logout();
        } catch (logoutError) {
          console.error(
            "LOGOUT ERROR:",
            logoutError
          );
        }

        alert(
          historyError.message ||
            "Login is not allowed at this time."
        );

        return;
      }

      alert("Login successful.");

      resetForm();
      onClose();

    } catch (error: any) {
      console.error(
        "AUTHENTICATION ERROR:",
        error
      );

      setErrors({
        general:
          error?.message ||
          "Authentication failed. Please try again.",
      });
    }
  };

  /* =========================================================
     RESET FORM
  ========================================================= */

  const resetForm = () => {
    setFormData({
      email: "",
      phone: "",
      password: "",
      username: "",
      displayName: "",
    });

    setErrors({});

    setSignupOtp("");
    setGeneratedSignupOtp("");
    setSignupOtpSent(false);

    setLoginOtp("");
    setGeneratedLoginOtp("");
    setLoginOtpSent(false);

    setRecoveryPhone("");
    setRecoveryOtp("");

    setShowRecoveryOptions(false);
  };

  /* =========================================================
     INPUT CHANGE
  ========================================================= */

  const handleInputChange = (
    field: string,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }
  };

  /* =========================================================
     SWITCH MODE
  ========================================================= */

  const switchMode = () => {
    setMode(
      mode === "login"
        ? "signup"
        : "login"
    );

    resetForm();
  };

  /* =========================================================
     CLOSE
  ========================================================= */

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) {
    return null;
  }

  /* =========================================================
     UI
  ========================================================= */

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">

      <Card className="w-full max-w-md bg-black border-gray-800 text-white">

        <CardHeader className="relative pb-6">

          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-4 text-white hover:bg-gray-900"
            onClick={handleClose}
          >
            <X className="h-5 w-5" />
          </Button>

          <div className="text-center">

            <div className="mb-6 flex justify-center">
              <TwitterLogo
                size="xl"
                className="text-white"
              />
            </div>

            <CardTitle className="text-2xl font-bold">
              {mode === "login"
                ? "Sign in to X"
                : "Create your account"}
            </CardTitle>

          </div>

        </CardHeader>

        <CardContent className="space-y-6">

          {errors.general && (
            <div className="bg-red-900/20 border border-red-800 rounded-lg p-3 text-red-400 text-sm">
              {errors.general}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="space-y-4"
          >

            {mode === "signup" && (
              <>
                <div className="space-y-2">

                  <Label
                    htmlFor="displayName"
                    className="text-white"
                  >
                    Display Name
                  </Label>

                  <div className="relative">

                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />

                    <Input
                      id="displayName"
                      type="text"
                      placeholder="Your display name"
                      value={
                        formData.displayName
                      }
                      onChange={(e) =>
                        handleInputChange(
                          "displayName",
                          e.target.value
                        )
                      }
                      className="pl-10 bg-transparent border-gray-600 text-white"
                      disabled={isLoading}
                    />

                  </div>

                  {errors.displayName && (
                    <p className="text-red-400 text-sm">
                      {errors.displayName}
                    </p>
                  )}

                </div>

                <div className="space-y-2">

                  <Label
                    htmlFor="phone"
                    className="text-white"
                  >
                    Phone Number
                  </Label>

                  <Input
                    id="phone"
                    type="text"
                    placeholder="Enter phone number"
                    value={formData.phone}
                    onChange={(e) =>
                      handleInputChange(
                        "phone",
                        e.target.value
                      )
                    }
                    className="bg-transparent border-gray-600 text-white"
                    disabled={isLoading}
                  />

                  {errors.phone && (
                    <p className="text-red-400 text-sm">
                      {errors.phone}
                    </p>
                  )}

                </div>

                <div className="space-y-2">

                  <Label
                    htmlFor="username"
                    className="text-white"
                  >
                    Username
                  </Label>

                  <div className="relative">

                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                      @
                    </span>

                    <Input
                      id="username"
                      type="text"
                      placeholder="username"
                      value={formData.username}
                      onChange={(e) =>
                        handleInputChange(
                          "username",
                          e.target.value
                        )
                      }
                      className="pl-8 bg-transparent border-gray-600 text-white"
                      disabled={isLoading}
                    />

                  </div>

                  {errors.username && (
                    <p className="text-red-400 text-sm">
                      {errors.username}
                    </p>
                  )}

                </div>
              </>
            )}

            <div className="space-y-2">

              <Label
                htmlFor="email"
                className="text-white"
              >
                Email
              </Label>

              <div className="relative">

                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />

                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={(e) =>
                    handleInputChange(
                      "email",
                      e.target.value
                    )
                  }
                  className="pl-10 bg-transparent border-gray-600 text-white"
                  disabled={isLoading}
                />

              </div>

              {errors.email && (
                <p className="text-red-400 text-sm">
                  {errors.email}
                </p>
              )}

            </div>

            {mode === "signup" && (
              <>
                <Button
                  type="button"
                  onClick={sendSignupOtp}
                  className="w-full bg-green-600 hover:bg-green-700"
                  disabled={isLoading}
                >
                  {signupOtpSent
                    ? "Resend Signup OTP"
                    : "Send Signup OTP"}
                </Button>

                {signupOtpSent && (
                  <div className="space-y-2">

                    <Label
                      htmlFor="signupOtp"
                      className="text-white"
                    >
                      Email OTP
                    </Label>

                    <Input
                      id="signupOtp"
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      placeholder="Enter 6-digit OTP"
                      value={signupOtp}
                      onChange={(e) =>
                        setSignupOtp(
                          e.target.value.replace(
                            /\D/g,
                            ""
                          )
                        )
                      }
                      className="bg-transparent border-gray-600 text-white"
                      disabled={isLoading}
                    />

                  </div>
                )}
              </>
            )}

            {mode === "login" && (
              <div className="space-y-3">

                <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-3 text-blue-300 text-sm">
                  <strong>
                    Task 6 Security:
                  </strong>{" "}
                  Chrome users must verify their
                  email using OTP. Microsoft Edge
                  users can login without OTP.
                </div>

                <Button
                  type="button"
                  onClick={sendLoginOtp}
                  className="w-full bg-green-600 hover:bg-green-700"
                  disabled={isLoading}
                >
                  {loginOtpSent
                    ? "Resend Login OTP"
                    : "Send Login OTP"}
                </Button>

                {loginOtpSent && (
                  <div className="space-y-2">

                    <Label
                      htmlFor="loginOtp"
                      className="text-white"
                    >
                      Email OTP
                    </Label>

                    <Input
                      id="loginOtp"
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      placeholder="Enter 6-digit OTP"
                      value={loginOtp}
                      onChange={(e) =>
                        setLoginOtp(
                          e.target.value.replace(
                            /\D/g,
                            ""
                          )
                        )
                      }
                      className="bg-transparent border-gray-600 text-white"
                      disabled={isLoading}
                    />

                    <p className="text-xs text-gray-400">
                      Chrome login requires this
                      OTP verification.
                    </p>

                  </div>
                )}

              </div>
            )}

            <div className="space-y-2">

              <Label
                htmlFor="password"
                className="text-white"
              >
                Password
              </Label>

              <div className="relative">

                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />

                <Input
                  id="password"
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={(e) =>
                    handleInputChange(
                      "password",
                      e.target.value
                    )
                  }
                  className="pl-10 pr-10 bg-transparent border-gray-600 text-white"
                  disabled={isLoading}
                />

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                  onClick={() =>
                    setShowPassword(
                      !showPassword
                    )
                  }
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>

              </div>

              {errors.password && (
                <p className="text-red-400 text-sm">
                  {errors.password}
                </p>
              )}

            </div>

            <Button
              type="submit"
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-full text-lg"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <LoadingSpinner size="sm" />
                  <span>
                    {mode === "login"
                      ? "Signing in..."
                      : "Creating account..."}
                  </span>
                </div>
              ) : (
                mode === "login"
                  ? "Sign in"
                  : "Create account"
              )}
            </Button>

          </form>

          <div className="relative">
            <Separator className="bg-gray-700" />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-black px-2 text-gray-400 text-sm">
              OR
            </span>
          </div>

          {mode === "login" && (
            <div className="text-right">

              <button
                type="button"
                className="text-blue-400 hover:text-blue-300 text-sm"
                onClick={() =>
                  setShowRecoveryOptions(
                    !showRecoveryOptions
                  )
                }
              >
                Forgot Password?
              </button>

              {showRecoveryOptions && (
                <div className="mt-3 space-y-3">

                  <Input
                    type="text"
                    placeholder="Enter Mobile Number"
                    value={recoveryPhone}
                    onChange={(e) =>
                      setRecoveryPhone(
                        e.target.value
                      )
                    }
                    className="bg-transparent border-gray-600 text-white"
                  />

                  <Button
                    type="button"
                    className="w-full bg-green-600 hover:bg-green-700"
                    onClick={sendMobileOtp}
                  >
                    Send Mobile OTP
                  </Button>

                  <Input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="Enter OTP"
                    value={recoveryOtp}
                    onChange={(e) =>
                      setRecoveryOtp(
                        e.target.value.replace(
                          /\D/g,
                          ""
                        )
                      )
                    }
                    className="bg-transparent border-gray-600 text-white"
                  />

                  <Button
                    type="button"
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    onClick={verifyMobileOtp}
                  >
                    Verify Mobile OTP
                  </Button>

                  <Button
                    type="button"
                    className="w-full bg-black border border-gray-600 text-white hover:bg-gray-800"
                    onClick={async () => {
                      if (
                        !formData.email
                      ) {
                        alert(
                          "Please enter your email."
                        );
                        return;
                      }

                      try {
                        await forgotPassword(
                          formData.email
                        );
                      } catch (error) {
                        console.error(
                          error
                        );
                      }
                    }}
                  >
                    Generate Random Password (Email)
                  </Button>

                </div>
              )}

            </div>
          )}

          <div className="text-center">

            <p className="text-gray-400">
              {mode === "login"
                ? "Don't have an account?"
                : "Already have an account?"}

              <Button
                type="button"
                variant="link"
                className="text-blue-400 hover:text-blue-300 font-semibold pl-1"
                onClick={switchMode}
                disabled={isLoading}
              >
                {mode === "login"
                  ? "Sign up"
                  : "Sign in"}
              </Button>

            </p>

          </div>

          {mode === "signup" && (
            <div className="text-center text-xs text-gray-400">
              By signing up, you agree to our
              Terms of Service and Privacy
              Policy, including Cookie Use.
            </div>
          )}

        </CardContent>

      </Card>

    </div>
  );
}