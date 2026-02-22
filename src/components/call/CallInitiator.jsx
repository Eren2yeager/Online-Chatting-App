'use client';

import { useState } from "react";

export default function CallInitiator({ onInitiate, disabled }) {
  const [targetUserId, setTargetUserId] = useState("");
  const [callType, setCallType] = useState("video");

  const handleSubmit = () => {
    if (targetUserId.trim()) {
      onInitiate(targetUserId.trim(), callType);
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 mb-6">
      <h2 className="text-xl font-bold mb-4">Start a Call</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm text-gray-400 mb-2">Target User ID:</label>
          <input
            type="text"
            value={targetUserId}
            onChange={(e) => setTargetUserId(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
            placeholder="Enter user ID"
            className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={disabled}
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-2">Call Type:</label>
          <div className="flex gap-4">
            <button
              onClick={() => setCallType("audio")}
              className={`px-6 py-2 rounded-lg transition-colors ${
                callType === "audio" ? "bg-blue-600" : "bg-gray-700 hover:bg-gray-600"
              }`}
              disabled={disabled}
            >
              🎙️ Audio
            </button>
            <button
              onClick={() => setCallType("video")}
              className={`px-6 py-2 rounded-lg transition-colors ${
                callType === "video" ? "bg-blue-600" : "bg-gray-700 hover:bg-gray-600"
              }`}
              disabled={disabled}
            >
              📹 Video
            </button>
          </div>
        </div>
        <button
          onClick={handleSubmit}
          disabled={disabled || !targetUserId.trim()}
          className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-6 py-3 rounded-lg font-bold transition-colors"
        >
          📞 Start Call
        </button>
      </div>
    </div>
  );
}
