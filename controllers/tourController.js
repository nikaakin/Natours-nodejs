const Tour = require('../models/tourModel.js');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');
const AppError = require('../utils/AppError');

exports.aliasTopTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.ratingsAverage = { gte: 4.6 };
  req.query.fields = 'name,ratingsAverage,price';
  next();
};

exports.getAllTours = factory.getMany(Tour);
exports.getTour = factory.getOne(Tour, {
  path: 'reviews'
});
exports.createTour = factory.createOne(Tour);
exports.updateTour = factory.updateOne(Tour);
exports.deleteTour = factory.deleteOne(Tour);

exports.getTourStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } }
    },
    {
      $group: {
        _id: { $toUpper: '$difficulty' },
        // _id: { $toUpper: '$ratingsAverage' },
        numberOfDocs: { $sum: 1 },
        avgPrice: { $avg: '$price' },
        avgRating: { $avg: '$ratingsAverage' },
        Quantity: { $sum: '$ratingsQuantity' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' }
      }
    },
    // { $match: { _id: { $ne: 'EASY' } } },
    { $sort: { avgPrice: 1 } }
  ]);
  res.status(200).json({
    status: 'success',
    data: {
      stats
    }
  });
});

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = +req.params.year;
  const plan = await Tour.aggregate([
    { $unwind: { path: '$startDates' } },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`)
        }
      }
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        numberOfTours: { $sum: 1 },
        tours: { $push: { name: '$name', difficulty: '$difficulty' } }
      }
    },
    {
      $addFields: { month: '$_id' }
    },
    {
      $project: { _id: 0 }
    },
    {
      $sort: { month: -1 }
    }
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      plan
    }
  });
});

exports.getToursWithin = catchAsync(async function(req, res, next) {
  const { distance, unit, latlng } = req.params;
  const [lat, lng] = latlng.split(',');
  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;

  if (!lat || !lng) {
    next(
      new AppError(
        'please provide lagitude and longitude in following format - lat,lng ',
        400
      )
    );
  }

  const tours = await Tour.find({
    startLocation: {
      $geoWithin: {
        $centerSphere: [[lng, lat], radius]
        // its available only with $near not $geoWithin
        // $maxDistance: distance,
        // $minDistance: 0
      }
    }
  });

  res.status(200).json({
    status: 'success ',
    results: tours.length,
    data: {
      data: tours
    }
  });
});

exports.getDistances = catchAsync(async function(req, res, next) {
  const { latlng } = req.params;
  const [lat, lng] = latlng.split(',');

  if (!lat || !lng) {
    next(
      new AppError(
        'please provide lagitude and longitude in following format - lat,lng ',
        400
      )
    );
  }

  const distances = await Tour.aggregate([
    {
      $geoNear: {
        near: { type: 'Point', coordinates: [+lng, +lat] },
        distanceField: 'distance',
        distanceMultiplier: 0.001
      }
    },
    {
      $project: {
        distance: 1,
        name: 1
      }
    },
    {
      $limit: 5
    }
  ]);

  res.status(200).json({
    status: 'success ',
    results: distances.length,
    data: {
      data: distances
    }
  });
});

// db.places.aggregate([
//   {
//     $geoNear: {
//       near: { type: 'Point', coordinates: [-73.99279, 40.719296] },
//       distanceField: 'dist.calculated',
//       maxDistance: 2,
//       query: { category: 'Parks' },
//       includeLocs: 'dist.location',
//       spherical: true
//     }
//   }
// ]);
