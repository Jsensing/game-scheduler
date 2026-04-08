const admin = require('firebase-admin');
const { onDocumentCreated } = require('firebase-functions/v2/firestore');

admin.initializeApp();

// Only these usernames receive notifications when test mode is ON
const TEST_WHITELIST = ['Jacob'];

exports.sendEventNotification = onDocumentCreated('events/{eventId}', async (event) => {
  const newEvent = event.data.data();
  const isTestMode = newEvent.testMode === true;

  // Get all users with push tokens
  const usersSnapshot = await admin.firestore().collection('users').get();
  const messages = [];

  usersSnapshot.forEach((userDoc) => {
    const userData = userDoc.data();
    if (!userData.pushToken) return;

    // In test mode, only send to whitelisted usernames
    // In normal mode, send to everyone
    if (isTestMode && !TEST_WHITELIST.includes(userData.username)) return;

    messages.push({
      to: userData.pushToken,
      sound: 'default',
      title: 'New Event Created! 🎉',
      body: `${newEvent.name} on ${newEvent.date}`,
      data: { eventId: event.data.id },
    });
  });

  // Skip if nobody to notify
  if (messages.length === 0) {
    console.log('No recipients found, skipping notifications');
    return;
  }

  // Send notifications using Expo Push API
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
  console.log(`Notifications sent (testMode: ${isTestMode}):`, result);
});