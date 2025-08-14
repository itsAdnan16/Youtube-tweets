import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Video } from "../models/video.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import {User} from "../models/user.model.js";
import mongoose from "mongoose";
import { Like } from "../models/like.model.js";

const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
    
    const matchStage = {};
    if (query) {
        matchStage.$or = [
            { title: { $regex: query, $options: "i" } },
            { description: { $regex: query, $options: "i" } }
        ];
    }
    
    if (userId) {
        matchStage.owner = new mongoose.Types.ObjectId(userId);
    }
    
    matchStage.isPublished = true;
    
    const sortStage = {};
    if (sortBy && sortType) {
        sortStage[sortBy] = sortType === "desc" ? -1 : 1;
    } else {
        sortStage.createdAt = -1;
    }
    
    // Get total count for pagination
    const totalVideos = await Video.countDocuments(matchStage);
    
    const videos = await Video.aggregate([
        {
            $match: matchStage
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
            $sort: sortStage
        },
        {
            $skip: (parseInt(page) - 1) * parseInt(limit)
        },
        {
            $limit: parseInt(limit)
        }
    ]);
    
    // Calculate pagination info
    const totalPages = Math.ceil(totalVideos / parseInt(limit));
    const hasNextPage = parseInt(page) < totalPages;
    
    const responseData = {
        docs: videos,
        hasNextPage: hasNextPage,
        totalPages: totalPages,
        currentPage: parseInt(page),
        totalVideos: totalVideos
    };
    
    return res.status(200).json(
        new ApiResponse(200, responseData, "Videos fetched successfully")
    );
});

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body;
    
    if (!title || !description) {
        throw new ApiError(400, "Title and description are required");
    }
    
    const videoLocalPath = req.files?.videoFile?.[0]?.path;
    const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path;
    
    if (!videoLocalPath) {
        throw new ApiError(400, "Video file is required");
    }
    
    if (!thumbnailLocalPath) {
        throw new ApiError(400, "Thumbnail is required");
    }
    
    const videoFile = await uploadOnCloudinary(videoLocalPath);
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
    
    if (!videoFile) {
        throw new ApiError(500, "Error while uploading video");
    }
    
    if (!thumbnail) {
        throw new ApiError(500, "Error while uploading thumbnail");
    }
    
    const video = await Video.create({
        videoFile: videoFile.url,
        thumbnail: thumbnail.url,
        title,
        description,
        duration: videoFile.duration,
        owner: req.user._id
    });
    
    const createdVideo = await Video.findById(video._id);
    
    if (!createdVideo) {
        throw new ApiError(500, "Something went wrong while creating the video");
    }
    
    return res.status(201).json(
        new ApiResponse(201, createdVideo, "Video published successfully")
    );
});

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    
    console.log('=== GET VIDEO BY ID DEBUG ===');
    console.log('Requested videoId:', videoId);
    console.log('User ID:', req.user._id);
    
    if (!videoId) {
        throw new ApiError(400, "Video ID is required");
    }
    
    // Validate that videoId is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(videoId.trim())) {
        throw new ApiError(400, "Invalid video ID format");
    }
    
    const video = await Video.findById(videoId.trim());
    
    if (!video) {
        throw new ApiError(404, "Video not found");
    }
    
    if (!video.isPublished) {
        throw new ApiError(404, "Video is not published");
    }
    
    // Increment views
    await Video.findByIdAndUpdate(videoId.trim(), {
        $inc: { views: 1 }
    });
    
    // Add to user's watch history
    await User.findByIdAndUpdate(req.user._id, {
        $addToSet: { watchHistory: videoId.trim() }
    });
    
    // Check if user has liked this video (using the new 'user' field)
    const userLike = await Like.findOne({
        user: req.user._id,
        video: videoId.trim()
    });
    
    console.log('User like found:', userLike ? userLike._id : 'NONE');
    console.log('isLiked will be set to:', !!userLike);
    
    const videoWithOwner = await Video.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(videoId.trim())
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
                },
                isLiked: !!userLike  // Add the isLiked field
            }
        }
    ]);
    
    console.log('Final video data:', videoWithOwner[0]);
    
    return res.status(200).json(
        new ApiResponse(200, videoWithOwner[0], "Video fetched successfully")
    );
});

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { title, description } = req.body;
    
    if (!videoId) {
        throw new ApiError(400, "Video ID is required");
    }
    
    // Validate that videoId is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(videoId.trim())) {
        throw new ApiError(400, "Invalid video ID format");
    }
    
    if (!title && !description) {
        throw new ApiError(400, "At least one field is required to update");
    }
    
    const video = await Video.findById(videoId.trim());
    
    if (!video) {
        throw new ApiError(404, "Video not found");
    }
    
    if (video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You can only edit your own videos");
    }
    
    const updatedVideo = await Video.findByIdAndUpdate(
        videoId.trim(),
        {
            $set: {
                ...(title && { title }),
                ...(description && { description })
            }
        },
        { new: true }
    );
    
    return res.status(200).json(
        new ApiResponse(200, updatedVideo, "Video updated successfully")
    );
});

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    
    if (!videoId) {
        throw new ApiError(400, "Video ID is required");
    }
    
    // Validate that videoId is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(videoId.trim())) {
        throw new ApiError(400, "Invalid video ID format");
    }
    
    const video = await Video.findById(videoId.trim());
    
    if (!video) {
        throw new ApiError(404, "Video not found");
    }
    
    if (video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You can only delete your own videos");
    }
    
    await Video.findByIdAndDelete(videoId.trim());
    
    return res.status(200).json(
        new ApiResponse(200, {}, "Video deleted successfully")
    );
});

const toggleVideoStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    
    if (!videoId) {
        throw new ApiError(400, "Video ID is required");
    }
    
    // Validate that videoId is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(videoId.trim())) {
        throw new ApiError(400, "Invalid video ID format");
    }
    
    const video = await Video.findById(videoId.trim());
    
    if (!video) {
        throw new ApiError(404, "Video not found");
    }
    
    if (video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You can only toggle status of your own videos");
    }
    
    const updatedVideo = await Video.findByIdAndUpdate(
        videoId.trim(),
        {
            $set: {
                isPublished: !video.isPublished
            }
        },
        { new: true }
    );
    
    return res.status(200).json(
        new ApiResponse(200, updatedVideo, "Video status toggled successfully")
    );
});

const incrementVideoViews = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    
    if (!videoId) {
        throw new ApiError(400, "Video ID is required");
    }
    
    // Validate that videoId is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(videoId.trim())) {
        throw new ApiError(400, "Invalid video ID format");
    }
    
    const video = await Video.findById(videoId.trim());
    
    if (!video) {
        throw new ApiError(404, "Video not found");
    }
    
    const updatedVideo = await Video.findByIdAndUpdate(
        videoId.trim(),
        {
            $inc: { views: 1 }
        },
        { new: true }
    );
    
    return res.status(200).json(
        new ApiResponse(200, updatedVideo, "Video views incremented successfully")
    );
});

const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    
    console.log('=== BACKEND TOGGLE VIDEO LIKE DEBUG ===');
    console.log('Received videoId:', videoId);
    console.log('videoId type:', typeof videoId);
    console.log('videoId length:', videoId?.length);
    console.log('User ID:', req.user._id);
    
    if (!videoId) {
        console.error('CRITICAL: No videoId provided');
        throw new ApiError(400, "Video ID is required");
    }
    
    if (typeof videoId !== 'string' || videoId.trim() === '') {
        console.error('CRITICAL: Invalid videoId format:', videoId);
        throw new ApiError(400, "Invalid video ID format");
    }
    
    // Validate videoId format
    if (!mongoose.Types.ObjectId.isValid(videoId.trim())) {
        console.error('CRITICAL: Invalid MongoDB ObjectId format:', videoId);
        throw new ApiError(400, "Invalid video ID format");
    }
    
    const video = await Video.findById(videoId.trim());
    if (!video) {
        console.error('CRITICAL: Video not found for ID:', videoId);
        throw new ApiError(404, "Video not found");
    }
    
    console.log('Found video:', video._id);
    
    try {
        // First, check if like already exists
        const existingLike = await Like.findOne({
            user: req.user._id,
            video: videoId.trim()
        });
        
        console.log('Existing like found:', existingLike ? existingLike._id : 'NONE');
        
        if (existingLike) {
            // Like exists, so unlike it
            await Like.findByIdAndDelete(existingLike._id);
            console.log('Like removed successfully');
            
            return res.status(200).json(
                new ApiResponse(200, { liked: false }, "Video unliked successfully")
            );
        } else {
            // No like exists, so create one
            console.log('Creating new like...');
            const newLike = await Like.create({
                user: req.user._id,
                video: videoId.trim()
            });
            
            console.log('New like created successfully:', newLike._id);
            
            return res.status(200).json(
                new ApiResponse(200, { liked: true }, "Video liked successfully")
            );
        }
    } catch (error) {
        console.error('Error in toggleVideoLike:', error);
        
        // Handle duplicate key errors gracefully
        if (error.code === 11000) {
            console.log('Duplicate key error detected, attempting cleanup...');
            
            try {
                // If we get a duplicate key error, it means a like was created elsewhere
                // Find and remove the duplicate, then return the correct state
                const existingLike = await Like.findOneAndDelete({
                    user: req.user._id,
                    video: videoId.trim()
                });
                
                if (existingLike) {
                    console.log('Duplicate like cleaned up:', existingLike._id);
                    return res.status(200).json(
                        new ApiResponse(200, { liked: false }, "Video unliked successfully")
                    );
                }
            } catch (cleanupError) {
                console.error('Error during cleanup:', cleanupError);
            }
        }
        
        // Re-throw the error for the global error handler
        throw error;
    }
});
console.log('isPublished default:', Video.schema.paths.isPublished.defaultValue);

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    toggleVideoStatus,
    incrementVideoViews,
    toggleVideoLike
};
