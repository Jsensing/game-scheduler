const admin = require('firebase-admin');
const { onDocumentCreated } = require('firebase-functions/v2/firestore');
const { onSchedule } = require('firebase-functions/v2/scheduler');

admin.initializeApp();

// Only these usernames receive notifications when test mode is ON
const TEST_WHITELIST = ['Jacob'];

/**
 * Triggered when a new event is created in Firestore
 * Sends a push notification to all users (or just the whitelist in test mode)
 */
exports.sendEventNotification = onDocumentCreated('events/{eventId}', async (event) => {
  const newEvent = event.data.data();
  const isTestMode = newEvent.testMode === true;

  const usersSnapshot = await admin.firestore().collection('users').get();
  const messages = [];

  usersSnapshot.forEach((userDoc) => {
    const userData = userDoc.data();
    if (!userData.pushToken) return;

    // In test mode, only send to whitelisted usernames
    if (isTestMode && !TEST_WHITELIST.includes(userData.username)) return;

    messages.push({
      to: userData.pushToken,
      sound: 'default',
      title: 'New Event Created! 🎉',
      body: `${newEvent.name} on ${newEvent.date}`,
      data: { eventId: event.data.id },
    });
  });

  if (messages.length === 0) {
    console.log('No recipients found, skipping notifications');
    return;
  }

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

/**
 * Runs every day at 12:00 PM CST (18:00 UTC)
 * Finds events happening in exactly 2 days and sends RSVP reminders
 * to users who have not yet responded
 * Respects test mode — in test mode only whitelisted users get reminders
 */
exports.sendRSVPReminders = onSchedule('0 18 * * *', async () => {
  const { default: fetch } = await import('node-fetch');

  // Calculate the date 2 days from now in YYYY-MM-DD format
  const twoDaysFromNow = new Date();
  twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2);
  const targetDate = twoDaysFromNow.toISOString().split('T')[0];

  console.log(`Checking for events on ${targetDate}`);

  // Get all events on that date
  const eventsSnapshot = await admin.firestore()
    .collection('events')
    .where('date', '==', targetDate)
    .get();

  if (eventsSnapshot.empty) {
    console.log('No events found for that date, skipping reminders');
    return;
  }

  // Get all users with push tokens
  const usersSnapshot = await admin.firestore().collection('users').get();
  const users = [];
  usersSnapshot.forEach((userDoc) => {
    const userData = userDoc.data();
    if (userData.pushToken && userData.username) {
      users.push({ username: userData.username, pushToken: userData.pushToken });
    }
  });

  if (users.length === 0) {
    console.log('No users with push tokens found');
    return;
  }

  const messages = [];

  eventsSnapshot.forEach((eventDoc) => {
    const eventData = eventDoc.data();
    const eventName = eventData.name;
    const rsvps = eventData.rsvps || [];
    const isTestMode = eventData.testMode === true;

    // Get list of usernames who have already RSVP'd
    const rsvpdUsernames = rsvps.map(r => r.username);

    // Send reminder to users who have NOT RSVP'd yet
    users.forEach((user) => {
      if (rsvpdUsernames.includes(user.username)) return; // Already RSVP'd, skip

      // In test mode, only send to whitelisted usernames
      if (isTestMode && !TEST_WHITELIST.includes(user.username)) return;

      messages.push({
        to: user.pushToken,
        sound: 'default',
        title: '📅 RSVP Reminder',
        body: `Don't forget to RSVP for ${eventName} in 2 days!`,
        data: { eventId: eventDoc.id, eventName, eventDate: targetDate },
      });
    });
  });

  if (messages.length === 0) {
    console.log('No reminders to send — everyone has RSVP\'d or test mode filtered all recipients');
    return;
  }

  // Send in chunks of 100 (Expo's limit)
  const chunkSize = 100;
  for (let i = 0; i < messages.length; i += chunkSize) {
    const chunk = messages.slice(i, i + chunkSize);

    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(chunk),
    });

    const result = await response.json();
    console.log('RSVP reminders sent:', result);
  }

  console.log(`Sent ${messages.length} RSVP reminder(s) for events on ${targetDate}`);
});