require("dotenv").config();
const app = require("./app");
const connectDB = require("./config/database");
const mongoose = require("mongoose");

const PORT = process.env.PORT || 5000;

// ---------------------------------------------------------------------------
// Boot sequence — wait for DB before accepting traffic
// ---------------------------------------------------------------------------
async function start() {
    await connectDB();

    const server = app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });

    // -----------------------------------------------------------------------
    // Graceful shutdown — close HTTP server then DB connection
    // -----------------------------------------------------------------------
    const shutdown = async (signal) => {
        console.log(`\n[${signal}] Shutting down gracefully…`);

        server.close(async () => {
            try {
                await mongoose.connection.close();
                console.log("MongoDB connection closed.");
                process.exit(0);
            } catch (err) {
                console.error("Error closing MongoDB connection:", err);
                process.exit(1);
            }
        });

        // Force exit if graceful shutdown hangs for more than 10 s
        setTimeout(() => {
            console.error("Forced shutdown after timeout.");
            process.exit(1);
        }, 10_000);
    };

    process.on("SIGINT", () => shutdown("SIGINT"));
    process.on("SIGTERM", () => shutdown("SIGTERM"));
}

start();