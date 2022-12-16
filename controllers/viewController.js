const Tour = require('../models/tourModel');
const Booking = require('../models/bookingModel');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');

exports.getOverview = catchAsync(async function(req, res, next) {
  const tours = await Tour.find();

  res.status(200).render('overview', { title: 'All tours', tours });
});

exports.getTour = catchAsync(async function(req, res, next) {
  const { slug } = req.params;

  const tour = await Tour.findOne({ slug }).populate({
    path: 'reviews',
    fields: 'review rating user'
  });

  if (!tour) {
    next(new AppError("Can't find a tour", 404));
  }

  res.status(200).render('tour', { title: `${tour.name} Tour`, tour });
});

exports.getLoginForm = function(req, res, next) {
  res.status(200).render('login', { title: 'Log in' });
};

exports.getAccount = (req, res) => {
  res.status(200).render('account', { title: 'Your Account' });
};

exports.getMyTours = catchAsync(async function(req, res, next) {
  const { user } = req;

  const bookings = await Booking.find({ user: user.id });

  /* // could be done this way too:
  const tourIDs = bookings.map(el => el.tour.id);
  //  $in will call all IDs from tourIds
  const tours = await Tour.find({ _id: { $in: tourIDs } });
  */
  const tours = bookings.map(booking => booking.tour);

  res.status(200).render('overview', { title: `My Tours`, tours });
});
