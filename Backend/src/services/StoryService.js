import fs from "fs";
import mongoose from "mongoose";
import { cloudinary } from "../config/cloudinary.js";
import Follow from "../models/Follow.js";
import Story from "../models/Story.js";
import ExpressError from "../utils/ExpressError.js";

const STORY_LIFETIME_MS = 24 * 60 * 60 * 1000;
const ALLOWED_IMAGE_FORMATS = ["jpg", "jpeg", "png", "webp", "gif", "heic", "heif"];
const ALLOWED_VIDEO_FORMATS = ["mp4", "mov", "webm", "mkv"];

const asId = (id) => id?.toString();

export const canViewStory = (author, viewerId, followedIds) => {
  if (!author) return false;
  const authorId = asId(author?._id || author);
  const isPrivate = typeof author === "object" && author.isPrivate === true;
  return (
    authorId === asId(viewerId) ||
    !isPrivate ||
    followedIds.has(authorId)
  );
};

const findAccessibleStory = async (storyId, viewerId) => {
  if (!mongoose.Types.ObjectId.isValid(storyId)) {
    throw new ExpressError(404, "Story not found");
  }

  const story = await Story.findOne({
    _id: storyId,
    expiresAt: { $gt: new Date() },
  }).populate("author", "username name avatar isPrivate");

  if (!story) throw new ExpressError(404, "Story not found");

  const following = await Follow.distinct("following", {
    follower: viewerId,
  });
  const followedIds = new Set(following.map(asId));

  if (!canViewStory(story.author, viewerId, followedIds)) {
    throw new ExpressError(404, "Story not found");
  }

  return story;
};

export const createStory = async (userId, file) => {
  if (!file) throw new ExpressError(400, "Choose a photo or video to share");

  const isImage = file.mimetype.startsWith("image/");
  const isVideo = file.mimetype.startsWith("video/");
  if (!isImage && !isVideo) {
    await fs.promises.unlink(file.path).catch((error) => {
      if (error.code !== "ENOENT") throw error;
    });
    throw new ExpressError(400, "Stories support photos and videos only");
  }

  let uploaded;
  try {
    uploaded = await cloudinary.uploader.upload(file.path, {
      folder: `stories/${userId}`,
      resource_type: isVideo ? "video" : "image",
      allowed_formats: isImage ? ALLOWED_IMAGE_FORMATS : ALLOWED_VIDEO_FORMATS,
    });
  } catch (error) {
    console.error("Failed to upload story media:", error);
    throw new ExpressError(502, "Could not upload your story. Please try again.");
  } finally {
    await fs.promises.unlink(file.path).catch((error) => {
      if (error.code !== "ENOENT") throw error;
    });
  }

  try {
    const story = await Story.create({
      author: userId,
      media: {
        url: uploaded.secure_url,
        type: isImage ? "image" : "video",
        publicId: uploaded.public_id,
      },
      expiresAt: new Date(Date.now() + STORY_LIFETIME_MS),
    });
    return story;
  } catch (error) {
    try {
      await cloudinary.uploader.destroy(uploaded.public_id, {
        resource_type: isVideo ? "video" : "image",
      });
    } catch (cleanupError) {
      console.error("Failed to remove unlinked story media:", cleanupError);
    }
    throw error;
  }
};

export const fetchStoryTray = async (viewerId) => {
  const following = await Follow.distinct("following", {
    follower: viewerId,
  });
  const followedIds = new Set(following.map(asId));
  const stories = await Story.find({ expiresAt: { $gt: new Date() } })
    .sort({ createdAt: -1 })
    .limit(500)
    .populate("author", "username name avatar isPrivate")
    .lean();

  const viewer = asId(viewerId);
  const groups = new Map();
  for (const story of stories) {
    const author = story.author;
    if (!author || !canViewStory(author, viewer, followedIds)) continue;

    const authorId = asId(author._id);
    if (!groups.has(authorId)) {
      groups.set(authorId, {
        author: {
          _id: authorId,
          username: author.username,
          name: author.name,
          avatar: author.avatar,
        },
        isOwn: authorId === viewer,
        stories: [],
        latestAt: story.createdAt,
      });
    }

    const group = groups.get(authorId);
    group.stories.push({
      _id: asId(story._id),
      media: {
        url: story.media.url,
        type: story.media.type,
      },
      createdAt: story.createdAt,
      expiresAt: story.expiresAt,
      viewed: (story.viewedBy || []).some((id) => asId(id) === viewer),
    });
  }

  return [...groups.values()]
    .map((group) => ({
      ...group,
      stories: group.stories.reverse(),
    }))
    .sort(
      (left, right) =>
        Number(right.isOwn) - Number(left.isOwn) ||
        new Date(right.latestAt).getTime() - new Date(left.latestAt).getTime()
    )
    .map(({ latestAt, ...group }) => group);
};

export const markStoryViewed = async (storyId, viewerId) => {
  const story = await findAccessibleStory(storyId, viewerId);
  if (asId(story.author._id) !== asId(viewerId)) {
    await Story.updateOne(
      { _id: story._id },
      { $addToSet: { viewedBy: viewerId } }
    );
  }
};

export const deleteStory = async (storyId, userId) => {
  if (!mongoose.Types.ObjectId.isValid(storyId)) {
    throw new ExpressError(404, "Story not found");
  }

  const story = await Story.findOne({ _id: storyId, author: userId });
  if (!story) throw new ExpressError(404, "Story not found");

  try {
    const result = await cloudinary.uploader.destroy(story.media.publicId, {
      resource_type: story.media.type === "video" ? "video" : "image",
    });
    if (!["ok", "not found"].includes(result.result)) {
      throw new Error(`Unexpected Cloudinary deletion result: ${result.result}`);
    }
  } catch (error) {
    console.error("Failed to delete story media:", error);
    throw new ExpressError(502, "Could not delete the story media. Please try again.");
  }

  await story.deleteOne();
};

export const cleanupExpiredStories = async () => {
  const expiredStories = await Story.find({
    expiresAt: { $lte: new Date() },
  }).limit(50);

  for (const story of expiredStories) {
    try {
      const result = await cloudinary.uploader.destroy(story.media.publicId, {
        resource_type: story.media.type === "video" ? "video" : "image",
      });
      if (!["ok", "not found"].includes(result.result)) {
        throw new Error(`Unexpected Cloudinary deletion result: ${result.result}`);
      }
      await story.deleteOne();
    } catch (error) {
      console.error(`Failed to clean up expired story ${story._id}:`, error);
    }
  }
};
