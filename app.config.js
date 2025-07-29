import 'dotenv/config';

export default ({ config }) => ({
  ...config,
  extra: {
    ...config.extra,
    USE_DEV_COLLECTION: process.env.USE_DEV_COLLECTION === 'true',
  },
});
