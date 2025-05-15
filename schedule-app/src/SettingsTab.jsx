// src/SettingsTab.jsx
import React from 'react';
import { auth } from './firebase';

export default function SettingsTab() {
  const handleLogout = () => {
    auth.signOut();
  };

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <h2 className="text-xl font-bold mb-4">Settings</h2>
      <button
        onClick={handleLogout}
        className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
      >
        Sign out
      </button>
    </div>
  );
}
