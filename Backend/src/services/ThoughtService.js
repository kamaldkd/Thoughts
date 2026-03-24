import fs from "fs";
import mongoose from "mongoose";
import { cloudinary } from "../config/cloudinary.js";
import { 
  createThoughtDoc, findThoughtById, getThoughtsList, 
  updateThoughtDoc, deleteThoughtDoc, findThoughtsByAuthorId, countThoughtsByAuthorId
} from "../repositories/ThoughtRepository.js";
import { findUserByUsername } from "../repositories/UserRepository.js";
import ExpressError from "../utils/ExpressError.js";

export const addThought = async (userId, text, files) => {
  let media = [];
  
  if (files && files.length > 0) {
    const uploadPromises = files.map(async (file) => {
      try {
        const isImage = file.mimetype.startsWith("image/");
        const result = await cloudinary.uploader.upload(file.path, {
          folder: "thoughts",
          resource_type: "auto",
          allowed_formats: isImage ? ["jpg", "png", "jpeg"] : ["mp4", "mov", "webm", "mkv"],
        });

        return { type: isImage ? "image" : "video", url: result.secure_url, public_id: result.public_id };
      } finally {
        if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      }
    });

    const results = await Promise.allSettled(uploadPromises);
    const failed = results.filter((r) => r.status === "rejected");
    const succeeded = results.filter((r) => r.status === "fulfilled").map((r) => r.value);

    if (failed.length > 0) {
      for (const item of succeeded) {
         try { await cloudinary.uploader.destroy(item.public_id); } catch(e) {}
      }
      throw new ExpressError(400, "Failed to upload some files. Upload aborted.");
    }
    media = succeeded.map(item => ({ type: item.type, url: item.url }));
  }

  const thought = await createThoughtDoc({ author: userId, text, media });
  return thought;
};

export const fetchThoughts = async (limitNum, cursor) => {
  let query = {};
  if (cursor) query._id = { $lt: cursor };
  
  const thoughts = await getThoughtsList(query, { limit: limitNum });
  const nextCursor = thoughts.length > 0 ? thoughts[thoughts.length - 1]._id : null;
  
  return { thoughts, nextCursor, hasMore: thoughts.length === limitNum };
};

export const fetchThoughtById = async (id) => {
  const thought = await findThoughtById(id);
  if (!thought) throw new ExpressError(404, "Thought not found");
  return thought;
};

export const fetchThoughtsOfUser = async (userId) => {
  const thoughts = await findThoughtsByAuthorId(userId);
  if (!thoughts.length) throw new ExpressError(404, "No thoughts found for this user");
  return thoughts;
};

export const fetchThoughtsByParamsUserId = async (userId) => {
  const thoughts = await findThoughtsByAuthorId(userId);
  const thoughtsCount = await countThoughtsByAuthorId(userId);
  if (!thoughts.length) throw new ExpressError(404, "No thoughts found for this user");
  return { thoughts, thoughtsCount };
};

export const editThought = async (id, text) => {
  const thought = await updateThoughtDoc(id, text);
  if (!thought) throw new ExpressError(404, "Thought not found");
  return thought;
};

export const removeThought = async (id) => {
  const thought = await findThoughtById(id);
  if (!thought) throw new ExpressError(404, "Thought not found");

  for (const mediaItem of thought.media) {
    try {
      const publicId = mediaItem.url.split("/").slice(-1)[0].split(".")[0];
      let resourceType = mediaItem.type === "image" ? "image" : "video";
      await cloudinary.uploader.destroy(`thoughts/${publicId}`, { resource_type: resourceType });
    } catch (error) {
      console.error("Error deleting media from Cloudinary:", mediaItem.url, error.message);
    }
  }

  await deleteThoughtDoc(id);
  return { message: "Thought deleted successfully" };
};

export const fetchUserThoughtsPaginated = async (username, limitNum, cursor) => {
  const user = await findUserByUsername(username);
  if (!user) throw new ExpressError(404, "User not found");

  const query = { author: user._id };
  if (cursor && mongoose.Types.ObjectId.isValid(cursor)) {
    query._id = { $lt: new mongoose.Types.ObjectId(cursor) };
  }

  const limitPlusOne = limitNum + 1;
  const thoughts = await getThoughtsList(query, { limit: limitPlusOne, select: "text media likesCount commentsCount createdAt" });

  const hasNextPage = thoughts.length > limitNum;
  if (hasNextPage) thoughts.pop();

  const nextCursor = thoughts.length > 0 ? thoughts[thoughts.length - 1]._id : null;

  return { thoughts, nextCursor, hasNextPage };
};
