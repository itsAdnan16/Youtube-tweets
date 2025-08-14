import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Like } from "../models/like.model.js";
import { Video } from "../models/video.model.js";
import { Comment } from "../models/comment.model.js";
import { Tweet } from "../models/tweet.model.js";
import mongoose from "mongoose";

// Toggle like for a video
const toggleVideoLike = asyncHandler(async (req, res) => {
  try {
    const { videoId } = req.params;
    const userId = req.user._id;

    console.log('=== TOGGLE VIDEO LIKE DEBUG ===');
    console.log('videoId:', videoId);
    console.log('userId:', userId);

    if (!videoId) {
      throw new ApiError(400, "Video ID is required");
    }

    // Validate videoId format
    if (!mongoose.Types.ObjectId.isValid(videoId)) {
      throw new ApiError(400, "Invalid video ID format");
    }

    const video = await Video.findById(videoId);
    if (!video) {
      throw new ApiError(404, "Video not found");
    }

    const existingLike = await Like.findOne({ user: userId, video: videoId });

    if (existingLike) {
      // Unlike
      await Like.deleteOne({ _id: existingLike._id });
      console.log('Like removed successfully');
      return res.status(200).json(
        new ApiResponse(200, { liked: false }, "Unliked successfully")
      );
    }

    // Like
    const newLike = await Like.create({ user: userId, video: videoId });
    console.log('Like created successfully:', newLike._id);
    return res.status(200).json(
      new ApiResponse(200, { liked: true }, "Liked successfully")
    );

  } catch (error) {
    console.error("Toggle like error:", error);
    throw error; // Let asyncHandler handle the error response
  }
});

// Toggle like for a comment
const toggleCommentLike = asyncHandler(async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user._id;

    if (!commentId) {
      throw new ApiError(400, "Comment ID is required");
    }

    if (!mongoose.Types.ObjectId.isValid(commentId)) {
      throw new ApiError(400, "Invalid comment ID format");
    }

    const comment = await Comment.findById(commentId);
    if (!comment) {
      throw new ApiError(404, "Comment not found");
    }

    const existingLike = await Like.findOne({ user: userId, comment: commentId });

    if (existingLike) {
      await Like.deleteOne({ _id: existingLike._id });
      return res.status(200).json(
        new ApiResponse(200, { liked: false }, "Comment unliked successfully")
      );
    }

    const newLike = await Like.create({ user: userId, comment: commentId });
    return res.status(200).json(
      new ApiResponse(200, { liked: true }, "Comment liked successfully")
    );

  } catch (error) {
    console.error("Toggle comment like error:", error);
    throw error;
  }
});

// Toggle like for a tweet
const toggleTweetLike = asyncHandler(async (req, res) => {
  try {
    const { tweetId } = req.params;
    const userId = req.user._id;

    if (!tweetId) {
      throw new ApiError(400, "Tweet ID is required");
    }

    if (!mongoose.Types.ObjectId.isValid(tweetId)) {
      throw new ApiError(400, "Invalid tweet ID format");
    }

    const comment = await Comment.findById(tweetId);
    if (!comment) {
      throw new ApiError(404, "Tweet not found");
    }

    const existingLike = await Like.findOne({ user: userId, tweet: tweetId });

    if (existingLike) {
      await Like.deleteOne({ _id: existingLike._id });
      return res.status(200).json(
        new ApiResponse(200, { liked: false }, "Tweet unliked successfully")
      );
    }

    const newLike = await Like.create({ user: userId, tweet: tweetId });
    return res.status(200).json(
      new ApiResponse(200, { liked: true }, "Tweet liked successfully")
    );

  } catch (error) {
    console.error("Toggle tweet like error:", error);
    throw error;
  }
});

const getLikedVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    
    console.log('=== GET LIKED VIDEOS DEBUG ===');
    console.log('User ID:', req.user._id);
    console.log('Page:', page, 'Limit:', limit);
    
    try {
        const likedVideos = await Like.aggregate([
            {
                $match: {
                    user: new mongoose.Types.ObjectId(req.user._id),
                    video: { $exists: true, $ne: null }
                }
            },
            {
                $lookup: {
                    from: "videos",
                    localField: "video",
                    foreignField: "_id",
                    as: "videoData",
                    pipeline: [
                        {
                            $lookup: {
                                from: "users",
                                localField: "owner",
                                foreignField: "_id",
                                as: "ownerData",
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
                                owner: {
                                    $first: "$ownerData"
                                }
                            }
                        }
                    ]
                }
            },
            {
                $addFields: {
                    video: {
                        $first: "$videoData"
                    }
                }
            },
            {
                $sort: {
                    createdAt: -1
                }
            },
            {
                $skip: (parseInt(page) - 1) * parseInt(limit)
            },
            {
                $limit: parseInt(limit)
            }
        ]);
        
        console.log('Found liked videos:', likedVideos.length);
        console.log('Sample video data:', likedVideos[0]);
        
        return res.status(200).json(
            new ApiResponse(200, likedVideos, "Liked videos fetched successfully")
        );
    } catch (error) {
        console.error('Error in getLikedVideos:', error);
        throw error;
    }
});

export {
    toggleVideoLike,
    toggleCommentLike,
    toggleTweetLike,
    getLikedVideos
};




