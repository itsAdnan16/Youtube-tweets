import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Subscription } from "../models/subscription.model.js";
import { User } from "../models/user.model.js";
import mongoose from "mongoose";

const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params;
    
    if (!channelId) {
        throw new ApiError(400, "Channel ID is required");
    }
    
    if (channelId === req.user._id.toString()) {
        throw new ApiError(400, "You cannot subscribe to yourself");
    }
    
    const channel = await User.findById(channelId);
    if (!channel) {
        throw new ApiError(404, "Channel not found");
    }
    
    const existingSubscription = await Subscription.findOne({
        subscriber: req.user._id,
        channel: channelId
    });
    
    if (existingSubscription) {
        // Unsubscribe
        await Subscription.findByIdAndDelete(existingSubscription._id);
        
        return res.status(200).json(
            new ApiResponse(200, { subscribed: false }, "Unsubscribed successfully")
        );
    } else {
        // Subscribe
        const subscription = await Subscription.create({
            subscriber: req.user._id,
            channel: channelId
        });
        
        return res.status(200).json(
            new ApiResponse(200, { subscribed: true }, "Subscribed successfully")
        );
    }
});

const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params;
    
    if (!channelId) {
        throw new ApiError(400, "Channel ID is required");
    }
    
    const subscribers = await Subscription.aggregate([
        {
            $match: {
                channel: new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "subscriber",
                foreignField: "_id",
                as: "subscriber",
                pipeline: [
                    {
                        $project: {
                            fullName: 1,
                            username: 1,
                            avatar: 1
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                subscriber: {
                    $first: "$subscriber"
                }
            }
        }
    ]);
    
    return res.status(200).json(
        new ApiResponse(200, subscribers, "Subscribers fetched successfully")
    );
});

const getSubscribedChannels = asyncHandler(async (req, res) => {
    const subscribedChannels = await Subscription.aggregate([
        {
            $match: {
                subscriber: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "channel",
                foreignField: "_id",
                as: "channel",
                pipeline: [
                    {
                        $project: {
                            fullName: 1,
                            username: 1,
                            avatar: 1
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                channel: {
                    $first: "$channel"
                }
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "channel._id",
                foreignField: "owner",
                as: "videos",
                pipeline: [
                    {
                        $sort: { createdAt: -1 }
                    },
                    {
                        $limit: 1
                    },
                    {
                        $project: {
                            _id: 1,
                            title: 1,
                            thumbnail: 1,
                            duration: 1,
                            views: 1,
                            createdAt: 1
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                subscribedChannel: {
                    $mergeObjects: [
                        "$channel",
                        {
                            latestVideo: {
                                $cond: {
                                    if: { $gt: [{ $size: "$videos" }, 0] },
                                    then: { $first: "$videos" },
                                    else: null
                                }
                            }
                        }
                    ]
                }
            }
        },
        {
            $project: {
                subscribedChannel: 1
            }
        }
    ]);
    
    return res.status(200).json(
        new ApiResponse(200, subscribedChannels, "Subscribed channels fetched successfully")
    );
});

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
};
