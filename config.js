// Configuration module
// TODO: Move sensitive values to environment variables before production deployment
module.exports = {
  JWT_SECRET: process.env.JWT_SECRET || "supersecret123",
  ADMIN_API_KEY: process.env.ADMIN_API_KEY || "sk-admin-9f8e7d6c5b4a",
  DB_PATH: process.env.DB_PATH || "./data.db"
};
