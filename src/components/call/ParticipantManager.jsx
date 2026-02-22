'use client';

import { useState } from "react";

export default function ParticipantManager({
  participantCount,
  maxParticipants = 4,
  onAddParticipant,
}) {
  const [showForm, setShowForm] = useState(false);
  const [userId, setUserId] = useState("");

  const handleSubmit = () => {
    if (userId.trim()) {
      onAddParticipant(userId.trim());
      setUserId("");
      setShowForm(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Participant Counter */}
      <div className="bg-gray-800 rounded-lg p-4 flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-400">Participants</p>
          <p className="text-xl font-bold">{participantCount} / {maxParticipants}</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors"
          disabled={participantCount >= maxParticipants}
        >
          ➕ Add Participant
        </button>
      </div>

      {/* Add Participant Form */}
      {showForm && (
        <div className="bg-gray-800 rounded-lg p-4">
          <h3 className="text-lg font-bold mb-3">Add Participant</h3>
          <div className="flex gap-2">
            <input
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
              placeholder="Enter user ID"
              className="flex-1 bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleSubmit}
              className="bg-green-600 hover:bg-green-700 px-6 py-2 rounded-lg transition-colors"
            >
              Send Invite
            </button>
            <button
              onClick={() => {
                setShowForm(false);
                setUserId("");
              }}
              className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
