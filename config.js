// Fixed: Require secrets to be set in environment variables
if (!process.env.JWT_SECRET) {
  console.error('ERROR: JWT_SECRET must be set in environment variables');
  process.exit(1);
}

module.exports = {
  JWT_SECRET: process.env.JWT_SECRET,
  ADMIN_API_KEY: process.env.ADMIN_API_KEY || null, // Optional
  DB_PATH: process.env.DB_PATH || "./data.db"
};