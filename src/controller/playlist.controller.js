import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Playlist } from "../models/playlist.model.js";
import { Video } from "../models/video.model.js";
import mongoose from "mongoose";

const createPlaylist = asyncHandler(async (req, res) => {
    const { name, description, isPublic = true } = req.body;
    
    if (!name) {
        throw new ApiError(400, "Playlist name is required");
    }
    
    if (name.trim().length === 0) {
        throw new ApiError(400, "Playlist name cannot be empty");
    }
    
    const playlist = await Playlist.create({
        name: name.trim(),
        description: description?.trim() || "",
        owner: req.user._id,
        isPublic: isPublic
    });
    
    const createdPlaylist = await Playlist.findById(playlist._id).populate("owner", "fullName username avatar");
    
    return res.status(201).json(
        new ApiResponse(201, createdPlaylist, "Playlist created successfully")
    );
});

const getUserPlaylists = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    
    if (!userId) {
        throw new ApiError(400, "User ID is required");
    }
    
    const matchStage = {
        owner: new mongoose.Types.ObjectId(userId)
    };
    
    // If not the owner, only show public playlists
    if (userId !== req.user._id.toString()) {
        matchStage.isPublic = true;
    }
    
    const playlists = await Playlist.aggregate([
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
        new ApiResponse(200, playlists, "User playlists fetched successfully")
    );
});

const getPlaylistById = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;
    
    if (!playlistId) {
        throw new ApiError(400, "Playlist ID is required");
    }
    
    const playlist = await Playlist.findById(playlistId);
    
    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }
    
    // Check if user can access the playlist
    if (!playlist.isPublic && playlist.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Access denied to this playlist");
    }
    
    const playlistWithVideos = await Playlist.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(playlistId)
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
            $lookup: {
                from: "videos",
                localField: "videos",
                foreignField: "_id",
                as: "videos",
                pipeline: [
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
        }
    ]);
    
    return res.status(200).json(
        new ApiResponse(200, playlistWithVideos[0], "Playlist fetched successfully")
    );
});

const updatePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;
    const { name, description, isPublic } = req.body;
    
    if (!playlistId) {
        throw new ApiError(400, "Playlist ID is required");
    }
    
    if (!name && !description && isPublic === undefined) {
        throw new ApiError(400, "At least one field is required to update");
    }
    
    const playlist = await Playlist.findById(playlistId);
    
    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }
    
    if (playlist.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You can only edit your own playlists");
    }
    
    const updateData = {};
    if (name) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description?.trim() || "";
    if (isPublic !== undefined) updateData.isPublic = isPublic;
    
    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $set: updateData
        },
        { new: true }
    ).populate("owner", "fullName username avatar");
    
    return res.status(200).json(
        new ApiResponse(200, updatedPlaylist, "Playlist updated successfully")
    );
});

const deletePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;
    
    if (!playlistId) {
        throw new ApiError(400, "Playlist ID is required");
    }
    
    const playlist = await Playlist.findById(playlistId);
    
    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }
    
    if (playlist.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You can only delete your own playlists");
    }
    
    await Playlist.findByIdAndDelete(playlistId);
    
    return res.status(200).json(
        new ApiResponse(200, {}, "Playlist deleted successfully")
    );
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params;
    
    if (!playlistId || !videoId) {
        throw new ApiError(400, "Playlist ID and Video ID are required");
    }
    
    const playlist = await Playlist.findById(playlistId);
    
    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }
    
    if (playlist.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You can only modify your own playlists");
    }
    
    const video = await Video.findById(videoId);
    
    if (!video) {
        throw new ApiError(404, "Video not found");
    }
    
    if (playlist.videos.includes(videoId)) {
        throw new ApiError(400, "Video is already in the playlist");
    }
    
    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $push: { videos: videoId }
        },
        { new: true }
    ).populate("owner", "fullName username avatar");
    
    return res.status(200).json(
        new ApiResponse(200, updatedPlaylist, "Video added to playlist successfully")
    );
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params;
    
    if (!playlistId || !videoId) {
        throw new ApiError(400, "Playlist ID and Video ID are required");
    }
    
    const playlist = await Playlist.findById(playlistId);
    
    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }
    
    if (playlist.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You can only modify your own playlists");
    }
    
    if (!playlist.videos.includes(videoId)) {
        throw new ApiError(400, "Video is not in the playlist");
    }
    
    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $pull: { videos: videoId }
        },
        { new: true }
    ).populate("owner", "fullName username avatar");
    
    return res.status(200).json(
        new ApiResponse(200, updatedPlaylist, "Video removed from playlist successfully")
    );
});

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    updatePlaylist,
    deletePlaylist,
    addVideoToPlaylist,
    removeVideoFromPlaylist
};




