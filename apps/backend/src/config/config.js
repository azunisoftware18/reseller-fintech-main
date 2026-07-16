const envConfig = {
  nodeEnv: process.env.NODE_ENV || 'development',
  enableCrons: process.env.ENABLE_CRONS || 'false',
  port: process.env.PORT || 8000,
  db: {
    user: process.env.DB_USER,
    pass: process.env.DB_PASS,
    name: process.env.DB_NAME,
    host: process.env.DB_HOST,
  },

  s3: {
    accessKey: process.env.S3_ACCESS_KEY,
    secretKey: process.env.S3_SECRET_KEY,
    region: process.env.S3_REGION,
    bucket: process.env.S3_BUCKET,
  },

  // db se ayenege recharge plugin ke urls
  // rechage: {
  //   mplanpluginUrl: process.env.MPLAN_PLUGIN_URL,
  //   rechargeExchangePluginUrl: process.env.RECHARGE_EXCHANGE_PLUGIN_URL,
  //   rechargeExchangeStatusPluginUrl:
  //     process.env.RECHARGE_EXCHANGE_STATUS_PLUGIN_URL,
  // },

  // callback: {
  //   callbackSecret: process.env.RECHARGE_CALLBACK_SECRET,
  // },
};

export default envConfig;
