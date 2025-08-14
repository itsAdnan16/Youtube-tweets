import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
} from "../controller/tweet.controller.js";

const router = Router();

// Protected routes - require authentication
router.use(verifyJWT);

// Create a new tweet
router.post("/", createTweet);

// Get user tweets
router.get("/user/:userId", getUserTweets);

// Update tweet
router.patch("/:tweetId", updateTweet);

// Delete tweet
router.delete("/:tweetId", deleteTweet);

export default router;
