const APIFeatures = require('../utils/APIFeatures');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');

exports.deleteOne = Model =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);

    if (!doc) {
      return next(new AppError('document not found', 404));
    }

    res.status(204).json({
      status: 'success',
      data: null
    });
  });

exports.updateOne = Model =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!doc) {
      return next(new AppError('document not found', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        data: doc
      }
    });
  });

exports.createOne = Model =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.create(req.body);

    res.status(201).json({
      status: 'success',
      data: {
        data: doc
      }
    });
  });

exports.getOne = (Model, popOptions) =>
  catchAsync(async (req, res, next) => {
    const query = Model.findById(req.params.id);
    if (popOptions) query.populate(popOptions);

    const doc = await query;

    if (!doc) {
      return next(new AppError('document not found', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        data: doc
      }
    });
  });

exports.getMany = Model =>
  catchAsync(async (req, res) => {
    // this (filtered) is for one occasion when you want to get all reviews for specific tour
    let filtered = {};
    if (req.params.tourId) filtered = { tour: req.params.tourId };

    const docs = await new APIFeatures(Model.find(filtered), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate().query;

    // SENDING RESPONSE
    res.status(200).json({
      status: 'success',
      results: docs.length,
      data: {
        data: docs
      }
    });
  });
