import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Comment } from "../models/comment.model.js";
import { Video } from "../models/video.model.js";
import mongoose from "mongoose";

const getVideoComments = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    
    if (!videoId) {
        throw new ApiError(400, "Video ID is required");
    }
    
    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found");
    }
    
    const comments = await Comment.aggregate([
        {
            $match: {
                video: new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
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
                    $first: "$owner"
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
    
    return res.status(200).json(
        new ApiResponse(200, comments, "Comments fetched successfully")
    );
});

const addComment = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { content } = req.body;
    
    if (!videoId) {
        throw new ApiError(400, "Video ID is required");
    }
    
    if (!content) {
        throw new ApiError(400, "Comment content is required");
    }
    
    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found");
    }
    
    // if (!video.isPublished) {
    //     throw new ApiError(404, "Video is not published");
    // }
    
    const comment = await Comment.create({
        content,
        video: videoId,
        owner: req.user._id
    });
    
    const createdComment = await Comment.findById(comment._id).populate("owner", "fullName username avatar");
    
    return res.status(201).json(
        new ApiResponse(201, createdComment, "Comment added successfully")
    );
});

const updateComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    const { content } = req.body;
    
    if (!commentId) {
        throw new ApiError(400, "Comment ID is required");
    }
    
    if (!content) {
        throw new ApiError(400, "Comment content is required");
    }
    
    const comment = await Comment.findById(commentId);
    if (!comment) {
        throw new ApiError(404, "Comment not found");
    }
    
    if (comment.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You can only edit your own comments");
    }
    
    const updatedComment = await Comment.findByIdAndUpdate(
        commentId,
        {
            $set: {
                content
            }
        },
        { new: true }
    ).populate("owner", "fullName username avatar");
    
    return res.status(200).json(
        new ApiResponse(200, updatedComment, "Comment updated successfully")
    );
});

const deleteComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    
    if (!commentId) {
        throw new ApiError(400, "Comment ID is required");
    }
    
    const comment = await Comment.findById(commentId);
    if (!comment) {
        throw new ApiError(404, "Comment not found");
    }
    
    if (comment.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You can only delete your own comments");
    }
    
    await Comment.findByIdAndDelete(commentId);
    
    return res.status(200).json(
        new ApiResponse(200, {}, "Comment deleted successfully")
    );
});

export {
    getVideoComments,
    addComment,
    updateComment,
    deleteComment
};
