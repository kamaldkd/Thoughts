import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "../models/User.js";

export default function setupPassport(passport) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email =
            profile.emails && profile.emails[0] && profile.emails[0].value;

          let user = null;

          // Prefer matching by googleId first
          if (profile.id) {
            user = await User.findOne({ googleId: profile.id });
          }

          // Fallback to email match
          if (!user && email) {
            user = await User.findOne({ email });
          }

          if (!user) {
            user = await User.create({
              username:
                profile.displayName ||
                (email ? email.split("@")[0] : `google_${profile.id}`),
              email: email || `${profile.id}@google.com`,
              password: null,
              googleId: profile.id,
            });
          } else if (!user.googleId) {
            user.googleId = profile.id;
            await user.save();
          }

          return done(null, user);
        } catch (err) {
          return done(err, null);
        }
      }
    )
  );
}
