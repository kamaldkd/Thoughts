import dotenv from './env.js';
import app from './app.js';
import connectDB from './config/db.js';

connectDB();

process.on("unhandledRejection", (err) => {
  console.error("UNHANDLED REJECTION 💥", err);
  process.exit(1);
});

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("Server startup failed", err);
    process.exit(1);
  }
};

startServer();