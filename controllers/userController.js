const multer = require('multer');
const sharp = require('sharp');
const User = require('../models/userModel');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');

// prep multer for image upload

// * for saving on disk right away
// const diskStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'public/img/users');
//   },
//   filename: (req, file, cb) => {
//     cb(
//       null,
//       `user-${req.user.id}-${Date.now()}.${file.mimetype.split('/')[1]}`
//     );
//   }
// });

// * save on buffer

const memoryStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (!file.mimetype.startsWith('image')) {
    return cb(
      new AppError('Not an image. Please upload only images', 400),
      false
    );
  }
  cb(null, true);
};

const upload = multer({ storage: memoryStorage, fileFilter: multerFilter });

const filterObj = (body, ...allowedFields) => {
  const allowedObj = {};
  Object.keys(body).forEach(key => {
    if (allowedFields.includes(key)) allowedObj[key] = body[key];
  });
  return allowedObj;
};

exports.getAllUsers = factory.getMany(User);
exports.getUser = factory.getOne(User);

// Dont run those. this is Admin only!!!
exports.updateUser = factory.updateOne(User);
exports.deleteUser = factory.deleteOne(User);

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

exports.uploadUserPhoto = upload.single('photo');

exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next();

  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`);

  next();
});

exports.updateMe = catchAsync(async (req, res, next) => {
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'this address is not for updating password, please use /updatePassword',
        400
      )
    );
  }

  const filteredBody = filterObj(req.body, 'name', 'email');
  if (req.file) filteredBody.photo = req.file.filename;

  const user = await User.findByIdAndUpdate(req.user._id, filteredBody, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    status: 'success',
    data: {
      user
    }
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: 'success',
    data: null
  });
});
