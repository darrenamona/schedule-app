# 📅 Schedule App

A modern web-based scheduling platform built with **React.js**, **Firebase**, and **FullCalendar**. Users can manage personal calendars, propose and RSVP to group meetings, and visualize friends' availability with conflict-aware overlays.

## 🚀 Features

- 🔐 **Google Authentication** (via Firebase Auth)
- 📆 **Interactive Calendar UI** with drag-to-schedule and click-to-edit (FullCalendar)
- 👥 **Friend System** for adding and managing trusted collaborators
- 📨 **Group Meeting Invites** with RSVP support (✅ / ❌)
- 🔄 **Availability Merging** to visualize friends' busy time blocks
- 🎯 **Priority-Based Scheduling**: higher-priority events override lower ones with re-invites
- 🔍 **Translucent Invitations** until RSVP’d, with attendee status overview
- 💬 **Optional Meeting Fields**: description, location, link
- 🧹 **Clean UX**: responsive design using Bootstrap 5 and role-aware permissions

## 🛠 Tech Stack

- **Frontend**: React.js, Bootstrap 5, FullCalendar
- **Backend**: Firebase Firestore, Firebase Auth
- **Calendar Engine**: FullCalendar + TimeGrid + DayGrid + Interaction plugins

## 🔧 Setup Instructions

1. **Clone the repo**:
   ```bash
   git clone https://github.com/darrenamona/schedule-app.git
   cd schedule-app
````

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Create `.env` file** and store your Firebase config securely:

   ```bash
   REACT_APP_FIREBASE_API_KEY=your_key_here
   REACT_APP_FIREBASE_AUTH_DOMAIN=your_auth_domain
   REACT_APP_FIREBASE_PROJECT_ID=your_project_id
   REACT_APP_FIREBASE_STORAGE_BUCKET=your_bucket
   REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   REACT_APP_FIREBASE_APP_ID=your_app_id
   ```

4. **Update `firebase.js`** to use environment variables:

   ```js
   const firebaseConfig = {
     apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
     authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
     projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
     storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
     messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
     appId: process.env.REACT_APP_FIREBASE_APP_ID,
   };
   ```

5. **Run the app**:

   ```bash
   npm start
   ```


This project is open-source.
