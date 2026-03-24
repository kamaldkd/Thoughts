import Thought from "../models/Thought.js";

export const isAuthor = async (req, res, next) => {
  let { id } = req.params;
  let thought = await Thought.findById(id);
  if (!thought) {
    return res.status(404).json({ message: "Thought not found" });
  }
  if (!thought.author.equals(req.userId)) {
    return res
      .status(403)
      .json({ message: "Not authorized to perform this action" });
  }
  next();
};
