import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    updatePlaylist,
    deletePlaylist,
    addVideoToPlaylist,
    removeVideoFromPlaylist
} from "../controller/playlist.controller.js";

const router = Router();

// Protected routes - require authentication
router.use(verifyJWT);

// Create a new playlist
router.post("/", createPlaylist);

// Get user playlists
router.get("/user/:userId", getUserPlaylists);

// Get playlist by ID
router.get("/:playlistId", getPlaylistById);

// Update playlist
router.patch("/:playlistId", updatePlaylist);

// Delete playlist
router.delete("/:playlistId", deletePlaylist);

// Add video to playlist
router.post("/:playlistId/video/:videoId", addVideoToPlaylist);

// Remove video from playlist
router.delete("/:playlistId/video/:videoId", removeVideoFromPlaylist);

export default router;
