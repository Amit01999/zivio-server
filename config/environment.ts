export const config: {
  mongoUri: string;
  jwtSecret: string;
  jwtExpiry: string;
  port: number;
  host: string;
  nodeEnv: string;
} = {
  mongoUri: process.env.MONGO_URI ||
    'mongodb+srv://Shopno:Shopno24@cluster1.npnsgne.mongodb.net/ZivioLiving?retryWrites=true&w=majority&appName=Cluster1',
  jwtSecret: process.env.JWT_SECRET || 'dev_secret_CHANGE_IN_PRODUCTION_min_32_chars',
  jwtExpiry: process.env.JWT_EXPIRY || '7d',
  port: parseInt(process.env.PORT || '5000', 10),
  host: process.env.HOST || 'localhost',
  nodeEnv: process.env.NODE_ENV || 'development'
};
