import 'dotenv/config';

export default ({ config }) => ({
  ...config,
  scheme: 'gamescheduler', // Replace with your app’s unique scheme
  extra: {
    ...config.extra,
    USE_DEV_COLLECTION: process.env.USE_DEV_COLLECTION === 'true',
  },
});
