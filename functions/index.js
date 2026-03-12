const functions = require('firebase-functions');
const admin = require('firebase-admin');
const fetch = require('node-fetch');

admin.initializeApp();

exports.sendEventNotification = functions.firestore
  .document('events/{eventId}')
  .onCreate(async (snap, context) => {
    const newEvent = snap.data();
    
    // Get all users with push tokens
    const usersSnapshot = await admin.firestore().collection('users').get();
    const messages = [];
    
    usersSnapshot.forEach((userDoc) => {
      const userData = userDoc.data();
      if (userData.pushToken) {
        messages.push({
          to: userData.pushToken,
          sound: 'default',
          title: 'New Event Created! 🎉',
          body: `${newEvent.name} on ${newEvent.date}`,
          data: { eventId: snap.id },
        });
      }
    });
    
    // Send notifications using Expo Push API
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messages),
    });
    
    const result = await response.json();
    console.log('Notification sent:', result);
  });