# 🧠 Thoughts — Share What’s On Your Mind

**Thoughts** is a modern full-stack social media application where users can share their thoughts, interact with posts, and connect with others in a clean and minimal interface.  
The project focuses on real-world features like authentication, CRUD operations, media handling, and responsive UI.

🔗 **Live Demo:** https://thoughts-social.vercel.app

---

## ✨ Features

- 🔐 User Authentication (Register / Login / Logout)
- 📝 Create, Read, Update, Delete Thoughts
- 🖼️ Image support with fallback avatars
- ❤️ Like,Comment & interact with thoughts
- 👤 User profiles
- 🔄 Persistent login using JWT and OAuth 2.0
- 📱 Fully responsive design
- ⚡ Fast and optimized frontend

---

## 🛠️ Tech Stack

### Frontend
- **React**
- **TypeScript**
- **Vite**
- **Tailwind CSS**
- **React Router**
- **Axios**

### Backend
- **Node.js**
- **Express.js**
- **MongoDB (Atlas)**
- **Mongoose**
- **JWT Authentication**
- **Cloudinary (for images)**

## Lotus AI Setup

Lotus uses Gemini's OpenAI-compatible chat endpoint by default. Add your Google
AI Studio key to the backend environment (locally in `Backend/.env`; in
production, in the backend host's environment settings):

```env
GEMINI_API_KEY=your-google-ai-studio-key
```

The default model is `gemini-4-hydrogen`; set `LOTUS_MODEL` to override it.
`LOTUS_API_URL` and `LOTUS_API_KEY` can also override the Gemini defaults for a
different OpenAI-compatible provider. Keep all keys on the backend, never in
frontend `VITE_` variables. Free-tier model availability and quotas can change;
Lotus also limits each signed-in user to five requests per minute.

### Deployment
- **Frontend:** Vercel  
- **Backend:** Render  
- **Database:** MongoDB Atlas

---

## 📂 Project Structure


thoughts/
│
├── frontend/
│ ├── src/
│ │ ├── components/
│ │ ├── pages/
│ │ ├── hooks/
│ │ ├── context/
│ │ └── lib/
│ └── vite.config.ts
│
├── backend/
│ ├── models/
│ ├── routes/
│ ├── controllers/
│ ├── middleware/
│ └── server.js
│
└── README.md


## 🧩 What I Learned from This Project

Building a full authentication flow using JWT

Handling protected routes in React

Managing global auth state with Context API

Deploying frontend & backend separately

Debugging real production issues (CORS, env vars, refresh 404s)

Writing cleaner, scalable code

## 🔮 Future Improvements

💬 Comments on thoughts

🔔 Notifications

📊 Analytics dashboard

🎥 Instagram-style media slider for posts

🔍 Search & hashtags

## 👨‍💻 Author

Kamal Dhakad
Aspiring Software Engineer | Full-Stack Developer

GitHub: https://github.com/kamaldkd

LinkedIn: https://linkedin.com/in/kamaldhakad

## ⭐ Show Some Love

If you like this project, don’t forget to star the repo ⭐
Feedback and suggestions are always welcome!
