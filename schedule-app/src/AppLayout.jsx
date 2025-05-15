import React, { useState } from 'react';
import CalendarTab from './CalendarTab';
import ScheduleMeetingTab from './ScheduleMeetingTab';
import FriendsTab from './FriendsTab';

function AppLayout() {
  const [activeTab, setActiveTab] = useState('calendar');
  return (
    <div className="flex flex-col md:flex-row h-screen">
      {/* Sidebar navigation (using Tailwind for layout) */}
      <aside className="flex flex-col bg-gray-100 md:h-screen md:w-64 w-full p-3 md:border-r border-b border-gray-300">
        <nav>
          <button 
            className={`text-left w-full p-2 ${activeTab === 'calendar' ? 'bg-gray-300 font-semibold' : 'hover:bg-gray-200'}`} 
            onClick={() => setActiveTab('calendar')}
          >
            Calendar
          </button>
          <button 
            className={`text-left w-full p-2 ${activeTab === 'schedule' ? 'bg-gray-300 font-semibold' : 'hover:bg-gray-200'}`} 
            onClick={() => setActiveTab('schedule')}
          >
            Schedule Meeting
          </button>
          <button 
            className={`text-left w-full p-2 ${activeTab === 'friends' ? 'bg-gray-300 font-semibold' : 'hover:bg-gray-200'}`} 
            onClick={() => setActiveTab('friends')}
          >
            Friends
          </button>
        </nav>
      </aside>
      {/* Main content area for tabs */}
      <main className="flex-1 p-4 overflow-auto">
        {activeTab === 'calendar' && <CalendarTab />}
        {activeTab === 'schedule' && <ScheduleMeetingTab />}
        {activeTab === 'friends' && <FriendsTab />}
      </main>
    </div>
  );
}

export default AppLayout;
