import 'dotenv/config';

export default ({ config }) => ({
  ...config,
  scheme: 'gamescheduler', // required for linking support
  extra: {
    USE_DEV_COLLECTION: process.env.USE_DEV_COLLECTION === 'true',
    API_KEY: process.env.API_KEY,
    AUTH_DOMAIN: process.env.AUTH_DOMAIN,
    PROJECT_ID: process.env.PROJECT_ID,
    STORAGE_BUCKET: process.env.STORAGE_BUCKET,
    MESSAGING_SENDER_ID: process.env.MESSAGING_SENDER_ID,
    APP_ID: process.env.APP_ID,
  },
});
