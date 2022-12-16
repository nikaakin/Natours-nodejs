const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { promisify } = require('util');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const Email = require('../utils/email');

const createToken = id =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });

const createSendToken = (res, user, statusCode) => {
  const token = createToken(user._id);

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true
  };

  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;
  res.cookie('jwt', token, cookieOptions);

  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user
    }
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const { name, email, password, passwordConfirm, role } = req.body;

  const newUser = await User.create({
    name,
    email,
    password,
    passwordConfirm,
    role
  });

  await new Email(
    { email, name },
    `${req.protocol}://${req.get('host')}/me`
  ).sendWelcome();

  createSendToken(res, newUser, 201);
});

exports.signin = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  //check if email and password exists
  if (!email || !password)
    return next(new AppError('please provide email and password', 400));

  // check if user exists and password is correct
  const user = await User.findOne({ email }).select('+password');

  if (
    !user ||
    !(await user.comparePasswords(password.toString(), user.password))
  )
    return next(new AppError('wrong password or email', 401));

  // if everything is okay send client a token
  createSendToken(res, user, 200);
});

exports.protect = catchAsync(async (req, res, next) => {
  //
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(
      new AppError('You are not logged in. Please login to get access ', 401)
    );
  }

  //
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // check if user still exists
  const curUser = await User.findById(decoded.id);

  if (!curUser) {
    return next(new AppError('This user no longer exists.', 401));
  }
  // check if user changed password after token was created
  if (curUser.changePasswordAfter(decoded.iat, curUser.passwordChangedAt)) {
    return next(
      new AppError('user recently changed password. Please log in again.', 401)
    );
  }

  req.user = curUser;
  res.locals.user = curUser;
  next();
});

exports.isLoggedIn = async (req, res, next) => {
  //
  try {
    let token;
    if (req.cookies.jwt) {
      token = req.cookies.jwt;

      if (!token) {
        return next(
          new AppError(
            'You are not logged in. Please login to get access ',
            401
          )
        );
      }
      //
      const decoded = await promisify(jwt.verify)(
        token,
        process.env.JWT_SECRET
      );

      // check if user still exists
      const curUser = await User.findById(decoded.id);

      if (!curUser) {
        return next(new AppError('This user no longer exists.', 401));
      }
      // check if user changed password after token was created
      if (curUser.changePasswordAfter(decoded.iat, curUser.passwordChangedAt)) {
        return next(
          new AppError(
            'user recently changed password. Please log in again.',
            401
          )
        );
      }
      // giving templates user variable
      res.locals.user = curUser;
      return next();
    }
  } catch (err) {
    return next();
  }
  next();
};

exports.restrictTo = (...allowedRoles) => {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new AppError('you dont have permission to perform this action', 403)
      );
    }
    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  //
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(new AppError('There is no user with this email', 404));
  }

  //
  const token = await user.createPasswordResetToken();
  user.save({ validateBeforeSave: false });

  try {
    //
    const resetURL = `${req.protocol}://${req.get(
      'host'
    )}/api/v1/users/resetpassword/${token}`;
    await new Email(user, resetURL).sendPasswordReset();

    res.status(200).json({
      status: 'success',
      message: 'Token email was sent successfull'
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpire = undefined;
    await user.save({ validateBeforeSave: false });

    next(
      new AppError(
        'There was an error sending the email. Please try again later!',
        500
      )
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  //
  const token = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: token,
    passwordResetExpire: { $gt: Date.now() }
  });
  if (!user) {
    return next(new AppError('Token is invalid or has expired', 400));
  }

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetExpire = undefined;
  user.passwordResetToken = undefined;
  await user.save();

  createSendToken(res, user, 200);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id).select('+password');

  if (!(await user.comparePasswords(req.body.passwordCurrent, user.password))) {
    return next(new AppError('wrong password', 401));
  }

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();

  createSendToken(res, user, 200);
});

exports.signout = (req, res, next) => {
  res.cookie('jwt', 'loggedOut', {
    expires: new Date(Date.now() + 10000),
    httpOnly: true
  });

  res.status(200).json({
    status: 'success'
  });
};
