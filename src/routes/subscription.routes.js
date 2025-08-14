import { Router } from "express";
import {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
} from "../controller/subscription.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// All subscription routes are protected
router.use(verifyJWT);

router.route("/toggle/:channelId").post(toggleSubscription);
router.route("/subscribers/:channelId").get(getUserChannelSubscribers);
router.route("/subscribed").get(getSubscribedChannels);

export default router;
