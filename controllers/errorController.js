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

const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack
  });
};

const sendErrorProd = (err, res) => {
  if (err.isOperation) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message
    });
  } else {
    // log error on server side
    console.error(err);

    // give dummy response to client

    res.status(500).json({
      status: 'error',
      message: 'something went wrong'
    });
  }
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.statusCode || 'error';
  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = { ...err };

    if (err.name === 'CastError') error = handleCastErrorDB(error);
    if (err.code === 11000) error = handlerDuplicateFieldDb(error);
    if (err.name === 'ValidationError') error = handleValidationErrorDB(error);
    if (err.name === 'JsonWebTokenError') error = handleJWTError();
    if (err.name === 'TokenExpiredError') error = handleJWTExpiredToken();

    sendErrorProd(error, res);
  }
};
