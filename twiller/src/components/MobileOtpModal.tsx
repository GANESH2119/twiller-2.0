import React, { useState } from "react";
import axios from "axios";

interface Props {
  isOpen: boolean;
  phone: string;
  onClose: () => void;
  onVerified: () => void;
}

const MobileOtpModal = ({
  isOpen,
  phone,
  onClose,
  onVerified,
}: Props) => {
  const [otp, setOtp] = useState("");

  if (!isOpen) return null;

  const verifyOtp = async () => {
    try {
      const res = await axios.post(
        "http://localhost:5000/verify-mobile-otp",
        {
          phone,
          otp,
        }
      );

      if (res.data.success) {
        alert("OTP Verified");
        onVerified();
        onClose();
      }
    } catch (error) {
      alert("Invalid OTP");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-black border border-gray-700 p-6 rounded-lg w-96">
        <h2 className="text-white text-xl mb-4">
          Mobile OTP Verification
        </h2>

        <input
          type="text"
          placeholder="Enter OTP"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          className="w-full p-3 rounded bg-gray-900 text-white border border-gray-600"
        />

        <div className="flex gap-2 mt-4">
          <button
            onClick={verifyOtp}
            className="bg-green-600 px-4 py-2 rounded text-white"
          >
            Verify
          </button>

          <button
            onClick={onClose}
            className="bg-red-600 px-4 py-2 rounded text-white"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default MobileOtpModal;