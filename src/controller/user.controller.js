
import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import { User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"
import mongoose from "mongoose";

const generateAccesssAndRefreshTokens = async(userId)=>{
    try{
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();
        user.refreshToken = refreshToken
        await user.save({validateBeforeSave : false})
        
        return {accessToken , refreshToken};
    }
    catch(error){
        throw new ApiError(500 , "Something  went wrong while generating access and refresh token 😔 😢 😞 😟 😥 😓 😿 💔 🥺 😩")

    }

}
const registerUser = asyncHandler(async (req,res)=>{
    
    //first i have to get information from the frontend
    const {fullName,email,username,password} = req.body;
    console.log(req.body)
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
        avatar : avatar.url,
        coverImage: coverImage?.url || "",
        email, 
        password,
        username: username.toLowerCase()
    })
        const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
        );

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered Successfully")
    )






})
const loginUser = asyncHandler(async (req,res)=>{
    //try to get info from the user
    //then check if all the info is provided
    //check the user on the basis of email or password
    //then check the user password
    //then generate access and refresh token
    //then return it to the user using cookie with a success message\
    
    console.log("Request body:", req.body);
    console.log("Request headers:", req.headers);
    
    const {email,password,username} = req.body || {}
    if(!(email || username)){
        throw new ApiError(400, "email or username is required")
    }
    if(!password){
        throw new ApiError(400, "password is required")
    }
    const user = await User.findOne({
        $or : [{email},{username}]
    })
    if(!user){
        throw new ApiError(404, "User not found")
    }
    const pass = req.body.password
    const isPasswordValid = await user.isPasswordCorrect(pass)

    if(!isPasswordValid){
        throw new ApiError(401,"Invalid user credential" )
    }

    const {accessToken,refreshToken} = await generateAccesssAndRefreshTokens(user._id);

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    const options = {
        httpOnly : true,
        secure : true,
    }

    return res.
    status(200).
    cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(new ApiResponse(200, loggedInUser, {
        user : loggedInUser,accessToken,refreshToken
    }
, "User logged in successfully"))





})

const logoutUser = asyncHandler(async(req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1 // this removes the field from document
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out"))
})
const refreshAccessToken = asyncHandler(async (req,res)=>{
    const incomingRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken
    if(!incomingRefreshToken){
        throw new ApiError(401,"Refrsh token is not found")
    }
    const decodedToken = jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET)
    const user = await User.findById(decodedToken?._id)
    if(!user){
        throw new ApiError(401 ,"Invalid refresh token")
    }
    if(incomingRefreshToken !== user.refreshToken){
        throw new ApiError("Refresh token is expired or invalid")
    }

    const options = {
        httpOnly : true,
        secure : true
    }

    const {accessToken,newrefreshToken} = await generateAccesssAndRefreshTokens(user._id);

    return res.
    status(200)
    .cookie("accessToken",accessToken ,options)
    .cookie("refreshToken",newrefreshToken,options)
    .json(new ApiResponse(200, {}, "Access token refrshed successfully"))



})

const changePassword = asyncHandler(async(req,res)=>{
    const {oldPassword, newPassword} = req.body
    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)
    if(!isPasswordCorrect){
        throw new ApiError(401,"invalid old password provided")
    }
    user.password = newPassword
    await user.save({validateBeforeSave:save})
    return res
    .status(200)
    .json(new ApiResponse(200,{},"Password updated successfully"))
})

const getCurrentUser = asyncHandler(async (req,res)=>{
    return res.json(200,req.user,"current user fetched successfully")

})


export {
    registerUser,
     loginUser,
     logoutUser,
     refreshAccessToken,
     changePassword

     };