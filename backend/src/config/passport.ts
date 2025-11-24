import passport from 'passport';
import { Strategy as GoogleStrategy, Profile } from 'passport-google-oauth20';
import pool from './database';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
  console.warn('Google OAuth credentials not configured. Google login will be disabled.');
}

export const configurePassport = () => {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    return;
  }

  passport.use(
    new GoogleStrategy(
      {
        clientID: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        callbackURL: `${BACKEND_URL}/api/auth/google/callback`,
      },
      async (accessToken, refreshToken, profile: Profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          const googleId = profile.id;
          const firstName = profile.name?.givenName || '';
          const lastName = profile.name?.familyName || '';

          if (!email) {
            return done(new Error('No email found in Google profile'), undefined);
          }

          // Check if user exists by Google ID
          let result = await pool.query(
            'SELECT * FROM users WHERE google_id = $1',
            [googleId]
          );

          if (result.rows.length > 0) {
            // User found by Google ID - return existing user
            return done(null, result.rows[0]);
          }

          // Check if user exists by email (for account linking)
          result = await pool.query(
            'SELECT * FROM users WHERE email = $1',
            [email]
          );

          if (result.rows.length > 0) {
            // User exists with this email - link Google account
            const updatedUser = await pool.query(
              'UPDATE users SET google_id = $1 WHERE email = $2 RETURNING *',
              [googleId, email]
            );
            return done(null, updatedUser.rows[0]);
          }

          // New user - create account
          // Generate a username from email (before @)
          const baseUsername = email.split('@')[0];
          let username = baseUsername;
          let counter = 1;

          // Ensure username is unique
          while (true) {
            const existingUsername = await pool.query(
              'SELECT id FROM users WHERE username = $1',
              [username]
            );
            if (existingUsername.rows.length === 0) break;
            username = `${baseUsername}${counter}`;
            counter++;
          }

          const newUser = await pool.query(
            `INSERT INTO users (email, username, google_id, first_name, last_name, password_hash)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING *`,
            [email, username, googleId, firstName, lastName, ''] // Empty password_hash for Google-only users
          );

          return done(null, newUser.rows[0]);
        } catch (error) {
          return done(error as Error, undefined);
        }
      }
    )
  );

  // Serialize user for session (we won't use sessions, but passport requires this)
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
      done(null, result.rows[0] || null);
    } catch (error) {
      done(error, null);
    }
  });
};

export default passport;
