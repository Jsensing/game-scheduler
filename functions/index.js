const admin = require('firebase-admin');
const { onDocumentCreated } = require('firebase-functions/v2/firestore');

admin.initializeApp();

exports.sendEventNotification = onDocumentCreated('events/{eventId}', async (event) => {
  const newEvent = event.data.data();

  // Get all users with push tokens
  const usersSnapshot = await admin.firestore().collection('users').get();
  const messages = [];

  usersSnapshot.forEach((userDoc) => {
    const userData = userDoc.data();
    if (userData.pushToken) {
      messages.push({
        to: userData.pushToken,
        sound: 'default',
        title: 'New Event Created!',
        body: `${newEvent.name} on ${newEvent.date}`,
        data: { eventId: event.data.id },
      });
    }
  });

  // Skip if no users have push tokens
  if (messages.length === 0) {
    console.log('No push tokens found, skipping notifications');
    return;
  }

  // Send notifications using Expo Push API
  // Using import() for fetch since it's not globally available in all Node versions
  const { default: fetch } = await import('node-fetch');

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