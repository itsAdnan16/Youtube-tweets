import mongoose from "mongoose";

const likeSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  video: { type: mongoose.Schema.Types.ObjectId, ref: "Video" },
  comment: { type: mongoose.Schema.Types.ObjectId, ref: "Comment" },
  tweet: { type: mongoose.Schema.Types.ObjectId, ref: "Tweet" }
}, { timestamps: true });

// Ensure a user can like a specific video only once
likeSchema.index(
  { user: 1, video: 1 },
  { unique: true, partialFilterExpression: { video: { $exists: true } } }
);

// Ensure a user can like a specific comment only once
likeSchema.index(
  { user: 1, comment: 1 },
  { unique: true, partialFilterExpression: { comment: { $exists: true } } }
);

// Ensure a user can like a specific tweet only once
likeSchema.index(
  { user: 1, tweet: 1 },
  { unique: true, partialFilterExpression: { tweet: { $exists: true } } }
);

// Use named export to match the existing import statements
export const Like = mongoose.model("Like", likeSchema);
