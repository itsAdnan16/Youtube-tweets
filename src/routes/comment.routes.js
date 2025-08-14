import { Router } from "express";
import {
    getVideoComments,
    addComment,
    updateComment,
    deleteComment
} from "../controller/comment.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// Public route
router.route("/videos/:videoId/comments").get(getVideoComments);

// Protected routes
router.use(verifyJWT);

router.route("/videos/:videoId/comments").post(addComment);
router.route("/comments/:commentId")
    .patch(updateComment)
    .delete(deleteComment);

export default router;
