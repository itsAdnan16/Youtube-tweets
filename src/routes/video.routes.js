import { Router } from "express";
import {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    toggleVideoStatus,
    incrementVideoViews
} from "../controller/video.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

// Public routes
router.route("/").get(getAllVideos);
router.route("/:videoId").get(verifyJWT, getVideoById);

// Protected routes
router.route("/").post(
    verifyJWT,
    upload.fields([
        { name: "videoFile", maxCount: 1 },
        { name: "thumbnail", maxCount: 1 }
    ]),
    publishAVideo
);

router.route("/:videoId")
    .patch(verifyJWT, updateVideo)
    .delete(verifyJWT, deleteVideo);

router.route("/:videoId/toggle-status").patch(verifyJWT, toggleVideoStatus);
router.route("/:videoId/views").patch(incrementVideoViews);

export default router;
