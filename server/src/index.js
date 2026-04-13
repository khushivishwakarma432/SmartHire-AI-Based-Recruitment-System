const dotenv = require('dotenv');

dotenv.config();

const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000;
const REQUIRED_ENV_VARS = ['MONGODB_URI', 'JWT_SECRET'];

const startServer = async () => {
  try {
    const missingRequired = REQUIRED_ENV_VARS.filter((key) => !process.env[key]);
    if (missingRequired.length) {
      throw new Error(`Missing required environment variables: ${missingRequired.join(', ')}`);
    }

    if (!process.env.CLIENT_URL) {
      console.warn('CLIENT_URL is not configured. CORS will allow all origins.');
    }

    if (!process.env.GEMINI_API_KEY) {
      console.warn('GEMINI_API_KEY is not configured. AI scoring will be unavailable.');
    }

    await connectDB();

    const server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`Server startup failed because port ${PORT} is already in use.`);
      } else {
        console.error(`Server startup failed: ${error.message}`);
      }

      process.exit(1);
    });
  } catch (error) {
    console.error(`Server startup failed: ${error.message}`);
    process.exit(1);
  }
};

startServer();
