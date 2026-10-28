const appModule = require('../server/dist/app.js');
const app = appModule.default || appModule;
const { connectDB } = require('../server/dist/config/db.js');

module.exports = async (request, response) => {
  try {
    await connectDB();
    return app(request, response);
  } catch (error) {
    console.error('[Vercel] API initialization failed:', error);
    return response.status(500).json({
      success: false,
      message: 'The API could not connect to its database. Check the server environment configuration.',
    });
  }
};
