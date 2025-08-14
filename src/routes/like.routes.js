import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    toggleVideoLike,
    toggleCommentLike,
    toggleTweetLike,
    getLikedVideos
} from "../controller/like.controller.js";

const router = Router();

// Protected routes - require authentication
router.use(verifyJWT);

// Toggle video like
router.post("/video/:videoId", toggleVideoLike);

// Toggle comment like
router.post("/comment/:commentId", toggleCommentLike);

// Toggle tweet like
router.post("/tweet/:tweetId", toggleTweetLike);

// Get liked videos
router.get("/videos", getLikedVideos);

export default router;
