const AppError = require('../utils/AppError');

const handleCastErrorDB = err => {
  const message = `invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};
const handlerDuplicateFieldDb = err => {
  const message = `tour with the name of ${
    Object.values(err.keyValue)[0]
  } already exists`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = err => {
  const values = Object.values(err.errors).map(el => el.message);
  const message = `invalid fields: ${values.join('. ')}`;
  return new AppError(message, 400);
};

const handleJWTError = () =>
  new AppError('invalid token. Please log in again!', 401);
const handleJWTExpiredToken = () =>
  new AppError('Token has expired. Please log in again', 401);

const sendErrorDev = (err, req, res) => {
  if (req.originalUrl.startsWith('/api')) {
    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack
    });
  }

  console.error(err);

  return res
    .status(err.statusCode)
    .render('error', { title: 'Something went wrong', msg: err.message });
};

const sendErrorProd = (err, req, res) => {
  if (req.originalUrl.startsWith('/api')) {
    if (err.isOperation) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message
      });
    }
    // log error on server side
    console.error(err);

    // give dummy response to client

    return res.status(500).json({
      status: 'error',
      message: 'something went wrong'
    });
  }

  if (err.isOperation) {
    return res
      .status(err.statusCode)
      .render('error', { title: 'Something went wrong', msg: err.message });
  }
  // log error on server side
  console.error(err);

  // give dummy response to client

  return res.status(500).render('error', {
    title: 'something went wrong',
    msg: 'Please try again later'
  });
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.statusCode || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = { ...err };
    error.message = err.message;

    if (err.name === 'CastError') error = handleCastErrorDB(error);
    if (err.code === 11000) error = handlerDuplicateFieldDb(error);
    if (err.name === 'ValidationError') error = handleValidationErrorDB(error);
    if (err.name === 'JsonWebTokenError') error = handleJWTError();
    if (err.name === 'TokenExpiredError') error = handleJWTExpiredToken();

    sendErrorProd(error, req, res);
  }
};
