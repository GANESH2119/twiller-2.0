import { useAuth } from "@/context/AuthContext";
import React, { useState } from "react";

import { useTranslation } from "react-i18next";

import { Card, CardContent } from "./ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { Image, Smile, Calendar, MapPin, BarChart3, Globe, Mic  } from "lucide-react";
import { Separator } from "./ui/separator";
import axios from "axios";
import axiosInstance from "@/lib/axiosInstance";
const TweetComposer = ({ onTweetPosted }: any) => {
  const { user } = useAuth();

const { t } = useTranslation();

  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [imageurl, setimageurl] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState("");
  const maxLength = 200;
  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if(!user || !content.trim())return
    try {
      const tweetdata={
        author:user?._id,
        content,
        image:imageurl,
        audio: audioUrl || null
      }
      const res=await axiosInstance.post('/post',tweetdata)
      onTweetPosted({
  ...res.data,
  author: {
    _id: user._id,
    username: user.username,
    displayName: user.displayName,
    avatar: user.avatar,
    verified: false,
  },
})
      const keywords = ["cricket", "science"];

const hasKeyword = keywords.some((word) =>
  content.toLowerCase().includes(word)
);

const notificationsEnabled =
  localStorage.getItem("notifications") === "true";

if (
  hasKeyword &&
  notificationsEnabled &&
  Notification.permission === "granted"
) {
  new Notification("New Tweet Alert", {
    body: content,
  });
}     setErrorMessage("");
setContent("");
setimageurl("");
      
    
    } catch (error: any) {
  console.log(error);

  setErrorMessage(
    error?.response?.data?.error ||
    "Failed to post tweet"
  );
}finally{
      setIsLoading(false)
    }
  };

  const characterCount = content.length;
  const isOverLimit = characterCount > maxLength;
  const isNearLimit = characterCount > maxLength * 0.8;
  if (!user) return null;
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setIsLoading(true);
    const image = e.target.files[0];
    const formdataimg = new FormData();
    formdataimg.set("image", image);
    try {
      const res = await axios.post(
        "https://api.imgbb.com/1/upload?key=5733fecc13f812d5aafd2ab4359e29e9",
        formdataimg
      );
      const url = res.data.data.display_url;
      if (url) {
        setimageurl(url);
      }
    } catch (error: any) {
      console.log("IMAGE ERROR:",error.response?.data);
    
    } finally {
      setIsLoading(false);
    }
  };
  
const handleAudioUpload = async (
  e: React.ChangeEvent<HTMLInputElement>
) => {
  if (!e.target.files || e.target.files.length === 0) return;

  const audio = e.target.files[0];

  if (audio.size > 100 * 1024 * 1024) {
    alert("File size should not exceed 100MB");
    return;
  }

  const currentHour = new Date().getHours();

  if (currentHour < 14 || currentHour >= 19) {
    alert("Audio uploads are allowed only between 2 PM and 7 PM IST");
    return;
  }

  const audioElement = document.createElement("audio");
  audioElement.src = URL.createObjectURL(audio);

  audioElement.onloadedmetadata = async () => {
    if (audioElement.duration > 300) {
      alert("Audio duration should not exceed 5 minutes");
      return;
    }

    const formData = new FormData();
    formData.append("audio", audio);

    try {
      const res = await axiosInstance.post(
        "/upload-audio",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setAudioUrl(res.data.audioUrl);
      setAudioFile(audio);

    } catch (error) {
      console.log(error);
      alert("Audio upload failed");
    }
  };
};

  return (
    <Card className="bg-black border-gray-800 border-x-0 border-t-0 rounded-none">
      <CardContent className="p-4">
        <div className="flex gap-3 w-full">
          <Avatar className="h-12 w-12">
            <AvatarImage src={user.avatar || undefined} alt={user.displayName} />
            <AvatarFallback>{user.displayName[0]}</AvatarFallback>
          </Avatar>

          <div className="flex-1">
            <form onSubmit={handleSubmit}>
              <Textarea
                placeholder={t("whatsHappening")}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="bg-transparent border-none text-xl text-white placeholder-gray-500 resize-none min-h-[120px] focus-visible:ring-0 focus-visible:ring-offset-0"
              />
              {errorMessage && (
  <p className="text-red-500 mt-2">
    {errorMessage}
  </p>
)}
              {audioFile && (
  <p className="text-white mt-2">
    Audio Selected: {audioFile.name}
  </p>
)}

{imageurl && (
  <img
    src={imageurl}
    alt="preview"
    className="mt-3 rounded-xl max-h-96 w-full object-contain"
  />
)}

              <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between mt-4">
                <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between mt-4">
                  <label
                    htmlFor="tweetImage"
                    className="p-2 rounded-full hover:bg-blue-900/20 cursor-pointer"
                  >
                    <Image className="h-5 w-5 text-white" />
                    <input
                      type="file"
                      accept="image/*"
                      id="tweetImage"
                      className="hidden"
                      onChange={handlePhotoUpload}
                      disabled={isLoading}
                    />
                  </label>
                  <label
  htmlFor="tweetAudio"
  className="p-2 rounded-full hover:bg-blue-900/20 cursor-pointer"
>
  <Mic className="h-5 w-5 text-white" />

  <input
    type="file"
    accept="audio/*"
    id="tweetAudio"
    className="hidden"
    onChange={handleAudioUpload}
  />
</label>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-2 rounded-full hover:bg-blue-900/20 text-white"
                  >
                    <BarChart3 className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-2 rounded-full hover:bg-blue-900/20 text-white"
                  >
                    <Smile className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-2 rounded-full hover:bg-blue-900/20 text-white"
                  >
                    <Calendar className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-2 rounded-full hover:bg-blue-900/20 text-white"
                  >
                    <MapPin className="h-5 w-5" />
                  </Button>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Globe className="h-4 w-4 text-blue-400" />
                    <span className="hidden sm:inline text-sm text-blue-400 font-semibold">
  {t("everyoneCanReply")}
</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    {characterCount > 0 && (
                      <div className="flex items-center space-x-2">
                        <div className="relative w-8 h-8">
                          <svg className="w-8 h-8 transform -rotate-90">
                            <circle
                              cx="16"
                              cy="16"
                              r="14"
                              stroke="currentColor"
                              strokeWidth="2"
                              fill="none"
                              className="text-gray-700"
                            />
                            <circle
                              cx="16"
                              cy="16"
                              r="14"
                              stroke="currentColor"
                              strokeWidth="2"
                              fill="none"
                              strokeDasharray={`${2 * Math.PI * 14}`}
                              strokeDashoffset={`${
                                2 *
                                Math.PI *
                                14 *
                                (1 - characterCount / maxLength)
                              }`}
                              className={
                                isOverLimit
                                  ? "text-red-500"
                                  : isNearLimit
                                  ? "text-yellow-500"
                                  : "text-blue-500"
                              }
                            />
                          </svg>
                        </div>
                        {isNearLimit && (
                          <span
                            className={`text-sm ${
                              isOverLimit ? "text-red-500" : "text-yellow-500"
                            }`}
                          >
                            {maxLength - characterCount}
                          </span>
                        )}
                      </div>
                    )}
                    <Separator
                      orientation="vertical"
                      className="h-6 bg-gray-700"
                    />

                    <Button
                      type="submit"
                      disabled={!content.trim() || isOverLimit|| isLoading}
                      className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-700 disabled:text-gray-500 text-white font-semibold rounded-full px-6"
                    >
                      {t("post")}
                    </Button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TweetComposer;
