const mongoose = require('mongoose');

const ensureDatabaseConnection = (res) => {
  if (mongoose.connection.readyState !== 1) {
    res.status(503).json({
      message: 'Database is not connected. Please try again once the database connection is available.',
    });
    return false;
  }

  return true;
};

module.exports = ensureDatabaseConnection;
