"use client";

import React, { useEffect, useState } from "react";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Link as LinkIcon,
  MoreHorizontal,
  Camera,
  Monitor,
  Smartphone,
  Globe,
  Clock,
  ShieldCheck,
} from "lucide-react";

import { useAuth } from "@/context/AuthContext";
import { useTranslation } from "react-i18next";

import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "./ui/tabs";
import TweetCard from "./TweetCard";
import { Card, CardContent } from "./ui/card";
import Editprofile from "./Editprofile";
import axiosInstance from "@/lib/axiosInstance";

/* =========================================================
   TYPES
========================================================= */

interface Tweet {
  id: string;
  author: {
    id: string;
    username: string;
    displayName: string;
    avatar: string;
    verified?: boolean;
  };
  content: string;
  timestamp: string;
  likes: number;
  retweets: number;
  comments: number;
  liked?: boolean;
  retweeted?: boolean;
  image?: string;
}

interface LoginHistory {
  browser?: string;
  operatingSystem?: string;
  device?: string;
  ipAddress?: string;
  loginTime?: string;
}

/* =========================================================
   DEMO TWEETS
========================================================= */

const demoTweets: Tweet[] = [
  {
    id: "1",
    author: {
      id: "1",
      username: "elonmusk",
      displayName: "Elon Musk",
      avatar:
        "https://images.pexels.com/photos/2379005/pexels-photo-2379005.jpeg?auto=compress&cs=tinysrgb&w=400",
      verified: true,
    },
    content:
      "Just had an amazing conversation about the future of AI. The possibilities are endless!",
    timestamp: "2h",
    likes: 1247,
    retweets: 324,
    comments: 89,
    liked: false,
    retweeted: false,
  },
  {
    id: "2",
    author: {
      id: "1",
      username: "sarahtech",
      displayName: "Sarah Johnson",
      avatar:
        "https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=400",
      verified: false,
    },
    content:
      "Working on some exciting new features for our app. Can't wait to share what we've been building! 🚀",
    timestamp: "4h",
    likes: 89,
    retweets: 23,
    comments: 12,
    liked: true,
    retweeted: false,
  },
  {
    id: "3",
    author: {
      id: "4",
      username: "designguru",
      displayName: "Alex Chen",
      avatar:
        "https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=400",
      verified: true,
    },
    content:
      "The new design system is finally complete! It took 6 months but the results are incredible. Clean, consistent, and accessible.",
    timestamp: "6h",
    likes: 456,
    retweets: 78,
    comments: 34,
    liked: false,
    retweeted: true,
    image:
      "https://images.pexels.com/photos/196645/pexels-photo-196645.jpeg?auto=compress&cs=tinysrgb&w=800",
  },
];

/* =========================================================
   PROFILE PAGE
========================================================= */

export default function ProfilePage() {
  const { user } = useAuth();
  const { t } = useTranslation();

  const [activeTab, setActiveTab] = useState("posts");
  const [showEditModal, setShowEditModal] = useState(false);

  const [tweets, setTweets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [notificationsEnabled, setNotificationsEnabled] =
    useState(false);

  /*
    AuthContext User type may not yet contain loginHistory.
    Backend response does contain it, so we safely read it here.
  */
  const loginHistory: LoginHistory[] =
    (user as any)?.loginHistory || [];

  /* =========================================================
     FETCH TWEETS
  ========================================================= */

  const fetchTweets = async () => {
    try {
      setLoading(true);

      const res = await axiosInstance.get("/post");

      setTweets(res.data || []);
    } catch (error) {
      console.error("Failed to fetch tweets:", error);
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     INITIAL LOAD
  ========================================================= */

  useEffect(() => {
    fetchTweets();
  }, []);

  useEffect(() => {
    const saved =
      localStorage.getItem("notifications") === "true";

    setNotificationsEnabled(saved);
  }, []);

  /* =========================================================
     NOTIFICATION TOGGLE
  ========================================================= */

  const toggleNotifications = () => {
    const value = !notificationsEnabled;

    setNotificationsEnabled(value);

    localStorage.setItem(
      "notifications",
      String(value)
    );
  };

  /* =========================================================
     CURRENT USER TWEETS
  ========================================================= */

  const userTweets = tweets.filter(
    (tweet: any) =>
      tweet.author?._id === user?._id
  );

  /* =========================================================
     FORMAT LOGIN TIME
  ========================================================= */

  const formatLoginTime = (time?: string) => {
    if (!time) return "Unknown";

    const date = new Date(time);

    if (Number.isNaN(date.getTime())) {
      return "Unknown";
    }

    return date.toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  /* =========================================================
     DEVICE ICON
  ========================================================= */

  const getDeviceIcon = (device?: string) => {
    const value = (device || "").toLowerCase();

    if (value.includes("mobile")) {
      return (
        <Smartphone className="h-5 w-5 text-blue-400" />
      );
    }

    return (
      <Monitor className="h-5 w-5 text-blue-400" />
    );
  };

  /* =========================================================
     NO USER
  ========================================================= */

  if (!user) {
    return null;
  }

  /* =========================================================
     UI
  ========================================================= */

  return (
    <div className="min-h-screen bg-black">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="sticky top-0 bg-black/90 backdrop-blur-md border-b border-gray-800 z-10">

        <div className="flex items-center px-4 py-3 space-x-8">

          <Button
            variant="ghost"
            size="sm"
            className="p-2 rounded-full hover:bg-gray-900"
          >
            <ArrowLeft className="h-5 w-5 text-white" />
          </Button>

          <div>
            <h1 className="text-xl font-bold text-white">
              {user.displayName}
            </h1>

            <p className="text-sm text-gray-400">
              {userTweets.length} {t("posts")}
            </p>
          </div>

        </div>
      </div>

      {/* =====================================================
          COVER PHOTO
      ===================================================== */}

      <div className="relative">

        <div className="h-32 md:h-48 bg-gradient-to-r from-blue-600 to-purple-600 relative">

          <Button
            variant="ghost"
            size="sm"
            className="absolute top-4 right-4 p-2 rounded-full bg-black/50 hover:bg-black/70"
          >
            <Camera className="h-5 w-5 text-white" />
          </Button>

        </div>

        {/* =================================================
            PROFILE PICTURE
        ================================================= */}

        <div className="absolute -bottom-12 md:-bottom-16 left-4">

          <div className="relative">

            <Avatar className="h-20 w-20 md:h-32 md:w-32 border-4 border-black">

              <AvatarImage
                src={user.avatar || undefined}
                alt={user.displayName}
              />

              <AvatarFallback className="text-2xl">
                {user.displayName?.[0] || "U"}
              </AvatarFallback>

            </Avatar>

            <Button
              variant="ghost"
              size="sm"
              className="absolute bottom-2 right-2 p-2 rounded-full bg-black/70 hover:bg-black/90"
            >
              <Camera className="h-4 w-4 text-white" />
            </Button>

          </div>
        </div>

        {/* =================================================
            PROFILE BUTTONS
        ================================================= */}

        <div className="flex justify-end gap-2 px-4 pt-4">

          <Button
            variant="outline"
            className="border-gray-600 text-white bg-gray-950 font-semibold rounded-full px-4 md:px-6"
            onClick={() => setShowEditModal(true)}
          >
            {t("editProfile")}
          </Button>

          <Button
            variant="outline"
            className="border-gray-600 text-white bg-gray-950 rounded-full px-4 md:px-6"
            onClick={toggleNotifications}
          >
            {notificationsEnabled
              ? t("notificationsOn")
              : t("notificationsOff")}
          </Button>

        </div>

      </div>

      {/* =====================================================
          PROFILE INFO
      ===================================================== */}

      <div className="px-4 pb-4 mt-28 md:mt-20">

        <div className="flex flex-wrap items-center gap-3 text-gray-400 text-sm mb-3">

          <div>

            <h1 className="text-xl md:text-2xl font-bold text-white break-words">
              {user.displayName}
            </h1>

            <p className="text-gray-400">
              @{user.username}
            </p>

          </div>

          <Button
            variant="ghost"
            size="sm"
            className="p-2 rounded-full hover:bg-gray-900"
          >
            <MoreHorizontal className="h-5 w-5 text-gray-400" />
          </Button>

        </div>

        {user.bio && (
          <p className="text-white mb-3 leading-relaxed">
            {user.bio}
          </p>
        )}

        <div className="flex flex-wrap gap-3 text-gray-400 text-sm mb-3">

          <div className="flex items-center space-x-1">
            <MapPin className="h-4 w-4" />

            <span>
              {user.location
                ? user.location
                : "Earth"}
            </span>
          </div>

          <div className="flex items-center space-x-1">

            <LinkIcon className="h-4 w-4" />

            <span className="text-blue-400">
              {user.website
                ? user.website
                : "example.com"}
            </span>

          </div>

          <div className="flex items-center space-x-1">

            <Calendar className="h-4 w-4" />

            <span>
              {t("joined")}{" "}

              {user.joinedDate &&
                new Date(
                  user.joinedDate
                ).toLocaleDateString("en-US", {
                  month: "long",
                  year: "numeric",
                })}
            </span>

          </div>

        </div>
      </div>

      {/* =====================================================
          TASK 6 - LOGIN HISTORY
      ===================================================== */}

      <div className="px-4 pb-6">

        <Card className="bg-black border border-gray-800">

          <CardContent className="p-4 md:p-6">

            {/* Header */}

            <div className="flex items-center gap-3 mb-5">

              <div className="p-2 rounded-full bg-blue-500/10">

                <ShieldCheck className="h-6 w-6 text-blue-400" />

              </div>

              <div>

                <h2 className="text-lg md:text-xl font-bold text-white">
                  Login History
                </h2>

                <p className="text-sm text-gray-400">
                  Recent login sessions for your account
                </p>

              </div>

            </div>

            {/* Login History */}

            {loginHistory.length === 0 ? (

              <div className="border border-gray-800 rounded-xl p-6 text-center">

                <Clock className="h-8 w-8 text-gray-500 mx-auto mb-3" />

                <p className="text-gray-400">
                  No login history available yet.
                </p>

              </div>

            ) : (

              <div className="space-y-3">

                {loginHistory
                  .slice()
                  .reverse()
                  .map(
                    (
                      login: LoginHistory,
                      index: number
                    ) => (

                      <div
                        key={`${login.loginTime || "login"}-${index}`}
                        className="border border-gray-800 rounded-xl p-4 hover:bg-gray-950 transition"
                      >

                        {/* Top row */}

                        <div className="flex items-start justify-between gap-3">

                          <div className="flex items-center gap-3">

                            <div className="p-2 rounded-full bg-gray-900">

                              {getDeviceIcon(
                                login.device
                              )}

                            </div>

                            <div>

                              <p className="font-semibold text-white">

                                {login.browser ||
                                  "Unknown Browser"}

                              </p>

                              <p className="text-sm text-gray-400">

                                {login.device ||
                                  "Unknown Device"}

                              </p>

                            </div>

                          </div>

                          {index === 0 && (
                            <span className="text-xs px-2 py-1 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">
                              Recent
                            </span>
                          )}

                        </div>

                        {/* Details */}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">

                          <div className="flex items-center gap-2 text-sm">

                            <Globe className="h-4 w-4 text-gray-500" />

                            <span className="text-gray-400">
                              Operating System:
                            </span>

                            <span className="text-white">
                              {login.operatingSystem ||
                                "Unknown"}
                            </span>

                          </div>

                          <div className="flex items-center gap-2 text-sm">

                            {getDeviceIcon(
                              login.device
                            )}

                            <span className="text-gray-400">
                              Device:
                            </span>

                            <span className="text-white">
                              {login.device ||
                                "Unknown"}
                            </span>

                          </div>

                          <div className="flex items-center gap-2 text-sm">

                            <Globe className="h-4 w-4 text-gray-500" />

                            <span className="text-gray-400">
                              IP Address:
                            </span>

                            <span className="text-white break-all">
                              {login.ipAddress ||
                                "Unknown"}
                            </span>

                          </div>

                          <div className="flex items-center gap-2 text-sm">

                            <Clock className="h-4 w-4 text-gray-500" />

                            <span className="text-gray-400">
                              Login Time:
                            </span>

                            <span className="text-white">
                              {formatLoginTime(
                                login.loginTime
                              )}
                            </span>

                          </div>

                        </div>

                      </div>
                    )
                  )}

              </div>
            )}

          </CardContent>

        </Card>

      </div>

      {/* =====================================================
          TABS
      ===================================================== */}

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full overflow-hidden"
      >

        <TabsList className="flex w-full overflow-x-auto whitespace-nowrap bg-transparent border-b border-gray-800 rounded-none h-auto">

          <TabsTrigger
            value="posts"
            className="flex-shrink-0 px-4 data-[state=active]:bg-transparent data-[state=active]:text-white data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:rounded-none text-gray-400 hover:bg-gray-900/50 py-4 font-semibold"
          >
            {t("posts")}
          </TabsTrigger>

          <TabsTrigger
            value="replies"
            className="flex-shrink-0 px-4 data-[state=active]:bg-transparent data-[state=active]:text-white data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:rounded-none text-gray-400 hover:bg-gray-900/50 py-4 font-semibold"
          >
            {t("replies")}
          </TabsTrigger>

          <TabsTrigger
            value="highlights"
            className="flex-shrink-0 px-4 data-[state=active]:bg-transparent data-[state=active]:text-white data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:rounded-none text-gray-400 hover:bg-gray-900/50 py-4 font-semibold"
          >
            {t("highlights")}
          </TabsTrigger>

          <TabsTrigger
            value="articles"
            className="flex-shrink-0 px-4 data-[state=active]:bg-transparent data-[state=active]:text-white data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:rounded-none text-gray-400 hover:bg-gray-900/50 py-4 font-semibold"
          >
            {t("articles")}
          </TabsTrigger>

          <TabsTrigger
            value="media"
            className="flex-shrink-0 px-4 data-[state=active]:bg-transparent data-[state=active]:text-white data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:rounded-none text-gray-400 hover:bg-gray-900/50 py-4 font-semibold"
          >
            {t("media")}
          </TabsTrigger>

        </TabsList>

        {/* ===================================================
            POSTS
        =================================================== */}

        <TabsContent
          value="posts"
          className="mt-0"
        >

          <div className="divide-y divide-gray-800">

            {loading ? (

              <Card className="bg-black border-none">

                <CardContent className="py-12 text-center">

                  <div className="text-gray-400">

                    <h3 className="text-2xl font-bold mb-2">
                      Loading posts...
                    </h3>

                    <p>
                      Please wait.
                    </p>

                  </div>

                </CardContent>

              </Card>

            ) : userTweets.length === 0 ? (

              <Card className="bg-black border-none">

                <CardContent className="py-12 text-center">

                  <div className="text-gray-400">

                    <h3 className="text-2xl font-bold mb-2">
                      You haven't posted yet
                    </h3>

                    <p>
                      When you post, it will show up here.
                    </p>

                  </div>

                </CardContent>

              </Card>

            ) : (

              userTweets.map(
                (tweet: any) => (
                  <TweetCard
                    key={tweet._id}
                    tweet={tweet}
                  />
                )
              )

            )}

          </div>

        </TabsContent>

        {/* ===================================================
            REPLIES
        =================================================== */}

        <TabsContent
          value="replies"
          className="mt-0"
        >

          <Card className="bg-black border-none">

            <CardContent className="py-12 text-center">

              <div className="text-gray-400">

                <h3 className="text-2xl font-bold mb-2">
                  You haven't replied yet
                </h3>

                <p>
                  When you reply to a post,
                  it will show up here.
                </p>

              </div>

            </CardContent>

          </Card>

        </TabsContent>

        {/* ===================================================
            HIGHLIGHTS
        =================================================== */}

        <TabsContent
          value="highlights"
          className="mt-0"
        >

          <Card className="bg-black border-none">

            <CardContent className="py-12 text-center">

              <div className="text-gray-400">

                <h3 className="text-2xl font-bold mb-2">
                  Lights, camera … attachments!
                </h3>

                <p>
                  When you post photos or videos,
                  they will show up here.
                </p>

              </div>

            </CardContent>

          </Card>

        </TabsContent>

        {/* ===================================================
            ARTICLES
        =================================================== */}

        <TabsContent
          value="articles"
          className="mt-0"
        >

          <Card className="bg-black border-none">

            <CardContent className="py-12 text-center">

              <div className="text-gray-400">

                <h3 className="text-2xl font-bold mb-2">
                  You haven't written any articles
                </h3>

                <p>
                  When you write articles,
                  they will show up here.
                </p>

              </div>

            </CardContent>

          </Card>

        </TabsContent>

        {/* ===================================================
            MEDIA
        =================================================== */}

        <TabsContent
          value="media"
          className="mt-0"
        >

          <Card className="bg-black border-none">

            <CardContent className="py-12 text-center">

              <div className="text-gray-400">

                <h3 className="text-2xl font-bold mb-2">
                  Lights, camera … attachments!
                </h3>

                <p>
                  When you post photos or videos,
                  they will show up here.
                </p>

              </div>

            </CardContent>

          </Card>

        </TabsContent>

      </Tabs>

      {/* =====================================================
          EDIT PROFILE
      ===================================================== */}

      <Editprofile
        isopen={showEditModal}
        onclose={() => setShowEditModal(false)}
      />

    </div>
  );
}