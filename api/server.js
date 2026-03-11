require('dotenv').config();
const connectDB = require('../server/db');
const app = require('../server/app');

module.exports = async (req, res) => {
  await connectDB();
  return app(req, res);
};
