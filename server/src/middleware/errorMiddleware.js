const notFound = (req, res, next) => {
  res.status(404);
  next(new Error(`Route not found: ${req.originalUrl}`));
};

const errorHandler = (err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;

  if (err.code === 11000) {
    return res.status(409).json({
      message: 'Duplicate value already exists.',
    });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({
      message: `Invalid ${err.path}.`,
    });
  }

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      message: Object.values(err.errors || {})
        .map((error) => error.message)
        .join(' ') || 'Validation failed.',
    });
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({
      message: 'Unexpected file field.',
    });
  }

  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      message: 'Resume file is too large. Please upload a PDF under 5 MB.',
    });
  }

  if (err.name === 'OpenAIError' || err.name === 'GoogleGenerativeAIError') {
    return res.status(502).json({
      message: err.message || 'AI provider request failed.',
    });
  }

  return res.status(err.statusCode || statusCode).json({
    message: err.message || 'Internal server error.',
  });
};

module.exports = {
  notFound,
  errorHandler,
};
