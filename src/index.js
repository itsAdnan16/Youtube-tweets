import mongoose from "mongoose";
import { DB_NAME } from "./constants.js";
import express from "express";
import connectDB from "./db/index.js";
import dotenv from "dotenv";

dotenv.config({
  path: './.env'
});


connectDB()

// const app = express();
// (async()=>{
//     try{
//         await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
//         app.on("error",(err)=>{
//             console.log("ERRR:",err)
//             throw err;
//         })
//         app.listen(process.env.PORT,()=>{
//             console.log(`App is listening on port ${process.env.PORT}`)
//         })
//     }
//     catch(error){
//         console.log("Error connecting to MongoDB:",error);
//     }

// })()
