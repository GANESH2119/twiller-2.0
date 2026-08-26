import React from "react";

import { useTranslation } from "react-i18next";

import axiosInstance from "@/lib/axiosInstance";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";


const SubscriptionPlans = () => {

    const { user } = useAuth();


    const { t } = useTranslation();

    const plans = [
  {
    name: "Bronze",
    displayName: t("bronze"),
    price: "₹100",
    tweets: t("threeTweets"),
  },
  {
    name: "Silver",
    displayName: t("silver"),
    price: "₹300",
    tweets: t("fiveTweets"),
  },
  {
    name: "Gold",
    displayName: t("gold"),
    price: "₹1000",
    tweets: t("unlimitedTweets"),
  },
];

const handleBuyNow = async (plan: string) => {
  const currentHour = new Date().getHours();

  if (false) {
    alert("Payments allowed only between 10 AM and 11 AM IST");
    return;
  }
try {

  let tweetLimit = 1;

  if (plan === "Bronze") {
    tweetLimit = 3;
  } else if (plan === "Silver") {
    tweetLimit = 5;
  } else if (plan === "Gold") {
    tweetLimit = 999999;
  }

  const amount =
  plan === "Bronze"
    ? 100
    : plan === "Silver"
    ? 300
    : 1000;

const orderResponse = await axiosInstance.post(
  "/create-order",
  { amount }
);

const options = {
  key: "rzp_test_SxWuT3Ojdpo9Wi",

  amount: orderResponse.data.amount,

  currency: "INR",

  name: "Twiller",

  description: `${plan} Subscription`,

  order_id: orderResponse.data.id,

  handler: async function () {

    await axiosInstance.patch(
      `/userupdate/${user?.email}`,
      {
        subscriptionPlan: plan,
        tweetLimit: tweetLimit,
        tweetsPosted: 0,
      }
    );

    alert(`${plan} Plan Activated Successfully`);
  },
};

const razorpay = new (window as any).Razorpay(options);

razorpay.open();

} catch (error) {
  console.log(error);
  alert("Failed to activate plan");
}
  
  
};

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-white mb-6">
         {t("subscriptionPlans")}
      </h1>

      <div className="grid md:grid-cols-3 gap-4">
        {plans.map((plan) => (
          <Card
            key={plan.name}
            className="bg-black border border-gray-700"
          >
            <CardContent className="p-6 text-center">
              <h2 className="text-xl font-bold text-white">
                {plan.displayName}
              </h2>

              <p className="text-3xl font-bold text-blue-500 mt-4">
                {plan.price}
              </p>

              <p className="text-gray-300 mt-3">
                {plan.tweets}
              </p>

              <Button
  className="mt-5 w-full bg-[#1D4ED8] hover:bg-[#1E40AF] text-white"
  onClick={() => handleBuyNow(plan.name)}
>
  {t("buyNow")}
</Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default SubscriptionPlans;