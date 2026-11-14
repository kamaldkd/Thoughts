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

Lotus uses Gemini's OpenAI-compatible chat endpoint by default. Add the Google
AI Studio key to the backend environment (locally in `Backend/.env`; in
production, in the backend host's environment settings):

```env
GEMINI_API_KEY=your-google-ai-studio-key
```

The default model is `gemini-3.5-flash-lite`. `LOTUS_MODEL` can override the
model, while `LOTUS_API_URL` and `LOTUS_API_KEY` can override the compatible
endpoint and key. These settings are backend-only; never put provider keys in
frontend `VITE_` variables. Gemini availability and free-tier quotas can change.
Lotus uses Gemini only by default and does not automatically send conversations
to a secondary provider.

### Lotus features and API

Lotus stores conversations and messages in the `LotusConversation` and
`LotusMessage` MongoDB collections. It also stores the selected response style
(`friendly`, `professional`, or `creative`) in `User.lotusMode`. Mongoose creates
the collections and indexes as the models are used. If production disables
automatic index creation, create the declared model indexes as part of the
deployment before serving traffic.

All routes are authenticated under `/api/lotus` and use the app's CSRF
protection:

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/conversations` | List the signed-in user's conversations |
| `POST` | `/conversations` | Create a conversation |
| `GET` | `/conversations/:id/messages` | Load a conversation |
| `PATCH` | `/conversations/:id` | Rename a conversation |
| `DELETE` | `/conversations/:id` | Delete a conversation and its messages |
| `POST` | `/conversations/:id/messages` | Store a user message and stream the Lotus response using SSE |
| `POST` | `/conversations/:id/regenerate` | Regenerate the latest reply using SSE |
| `GET`, `PATCH` | `/preferences` | Read or update the user's Lotus response style |

Generation is limited to 10 requests per signed-in user per minute, and user
messages are limited to 2,000 characters. Per-post Lotus actions fetch post
content on the backend and check private-profile access before using it as
context; discussion summaries include at most 30 comments. The Creative Studio
uses the same chat endpoint. Groq fallback, image understanding, voice, and web
search are not enabled.

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
