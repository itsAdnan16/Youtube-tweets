import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import mongoose from "mongoose";

const healthCheck = asyncHandler(async (req, res) => {
    // Check database connection
    const dbStatus = mongoose.connection.readyState === 1 ? "connected" : "disconnected";
    
    // Check memory usage
    const memoryUsage = process.memoryUsage();
    
    // Check uptime
    const uptime = process.uptime();
    
    const healthStatus = {
        status: "OK",
        timestamp: new Date().toISOString(),
        uptime: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m ${Math.floor(uptime % 60)}s`,
        database: {
            status: dbStatus,
            name: mongoose.connection.name || "Not connected"
        },
        system: {
            platform: process.platform,
            nodeVersion: process.version,
            memory: {
                rss: `${Math.round(memoryUsage.rss / 1024 / 1024)} MB`,
                heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)} MB`,
                heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`,
                external: `${Math.round(memoryUsage.external / 1024 / 1024)} MB`
            }
        }
    };
    
    return res.status(200).json(
        new ApiResponse(200, healthStatus, "Health check completed successfully")
    );
});

export {
    healthCheck
};




