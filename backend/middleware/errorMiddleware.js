const errorHandler = (err, req, res, next) => {
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message || 'Server Error';

  if (err.name === 'CastError') {
    statusCode = 404;
    message = 'Requested resource not found';
  }

  if (err.code === 11000) {
    statusCode = 400;
    message = 'An account or record with this value already exists';
  }

  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors).map((val) => val.message).join(', ');
  }

  if (err.name === 'MongooseServerSelectionError' || err.message?.includes('buffering timed out')) {
    statusCode = 503;
    message = 'Database service is disconnected or starting up. Please ensure MongoDB service is running.';
  }

  console.error('[Error Middleware]:', err.message || err);

  res.status(statusCode).json({
    success: false,
    message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack
  });
};

module.exports = { errorHandler };
