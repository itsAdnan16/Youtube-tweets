
import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import { User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"
import mongoose from "mongoose";
const registerUser = asyncHandler(async (req,res)=>{
    console.log('req.body:', req.body);
    
    //first i have to get information from the frontend
    const {fullName,email,username,password} = req.body;

    //check if anyone of this detail is missing
    if(!fullName || !email || !username || !password){
        throw new ApiError(400 , "Please provide all the details");
    }

    //check if the user already exists
    const existingUser = await User.findOne({
        $or : [{email},{username}]
    });

    if(existingUser){
        throw new ApiError(409,"User with email or username already exists")
    }

    //checking if the avatar is uploaded or not
    const avatarLocalPath = req.files?.avatar[0]?.path;

     let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }

    if(!avatarLocalPath){
        throw new ApiError(400,"Please upload an avatar image");
    }

    //upload the avatar file on cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    //if there is some error while uploading the avatar
    if(!avatar){
        throw new ApiError(500,"Error while uploading the avatar image");
    }

    const user = await User.create({
        fullName,
        email,
        username : username.toLowerCase(),
        password,
        avatar: avatar.url,
        coverImage: coverImage?.url, 
       
        
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered Successfully")
    )






})

export {registerUser};