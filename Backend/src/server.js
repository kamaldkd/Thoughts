import './env.js';
import { createServer } from "http";
import app from './app.js';
import connectDB from './config/db.js';
import { initCronJobs } from './jobs/syncFollowCounts.js';
import { initSocketServer } from './sockets/socketManager.js';

process.on("unhandledRejection", (err) => {
  console.error("UNHANDLED REJECTION 💥", err);
  process.exit(1);
});

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    await connectDB();

    // Wrap Express in an HTTP server so Socket.IO can share the same port
    const httpServer = createServer(app);

    // Attach Socket.IO
    const io = initSocketServer(httpServer);

    // Make `io` accessible to Express middleware / controllers if needed
    app.set("io", io);

    httpServer.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Socket.IO attached on port ${PORT}`);
      initCronJobs();
    });
  } catch (err) {
    console.error("Server startup failed", err);
    process.exit(1);
  }
};

startServer();