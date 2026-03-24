import sanitizeHtml from "sanitize-html";
import mongoSanitize from "express-mongo-sanitize";

// Recursively sanitize all incoming strings
const sanitizeObject = (obj) => {
  if (!obj) return;
  for (const key in obj) {
    if (typeof obj[key] === "string") {
      // Disallow all HTML tags/attributes
      obj[key] = sanitizeHtml(obj[key], {
        allowedTags: [],
        allowedAttributes: {}
      });
    } else if (typeof obj[key] === "object" && obj[key] !== null) {
      sanitizeObject(obj[key]);
    }
  }
};

export const xssSanitize = (req, res, next) => {
  try {
    if (req.body) sanitizeObject(req.body);
    if (req.query) sanitizeObject(req.query);
    if (req.params) sanitizeObject(req.params);
  } catch(e) {}
  next();
};

// Express Mongo Sanitize directly exported for app.js mount
export const dbSanitize = (req, res, next) => {
  try {
      mongoSanitize()(req, res, next);
  } catch(e) { next(); }
};
