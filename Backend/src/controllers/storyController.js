import {
  createStory as addStory,
  deleteStory as removeStory,
  fetchStoryTray,
  markStoryViewed,
} from "../services/StoryService.js";

export const getStories = async (req, res) => {
  const stories = await fetchStoryTray(req.userId);
  res.json({ stories });
};

export const createStory = async (req, res) => {
  const story = await addStory(req.userId, req.file);
  res.status(201).json({
    story: {
      _id: story._id,
      expiresAt: story.expiresAt,
    },
  });
};

export const viewStory = async (req, res) => {
  await markStoryViewed(req.params.storyId, req.userId);
  res.status(204).end();
};

export const deleteStory = async (req, res) => {
  await removeStory(req.params.storyId, req.userId);
  res.status(204).end();
};
