const mongoose = require('mongoose');
const slugify = require('slugify');
// const User = require('./userModel');

const tourSchema = mongoose.Schema(
  {
    name: {
      type: String,
      unique: true,
      required: [true, 'A tour must have a name'],
      trim: true,
      maxLength: [30, 'name should have less then 30 characters'],
      minLength: [10, 'name should have more then 10 characters']
    },
    slug: String,
    difficulty: {
      type: String,
      required: [true, 'A Tour must have a diffuculty'],
      enum: {
        values: ['easy', 'difficult', 'medium'],
        message: 'difficulty can be only: easy, medium, difficult'
      }
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A Tour must have a group size']
    },
    duration: {
      type: Number,
      required: [true, 'At Tour must have a duration']
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'rating cant be less then 1.0'],
      max: [5, 'rating cant be more then 5.0'],
      set: val => Math.round(val * 10) / 10
    },
    ratingsQuantity: {
      type: Number,
      default: 0
    },
    price: {
      type: Number,
      required: [true, 'Tour must have a price']
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function(val) {
          return this.price > val;
        },
        message: 'discounted price ({VALUE}) cant be more then original price'
      }
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'A Tour must have a description']
    },
    description: {
      type: String,
      trim: true
    },
    imageCover: {
      type: String,
      required: [true, 'A Tour must have an image cover']
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false
    },
    startLocation: {
      // GeoJSON
      type: {
        type: String,
        default: 'Point',
        enum: ['Point']
      },
      coordinates: [Number],
      description: String,
      address: String
    },
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point']
        },
        coordinates: [Number],
        description: String,
        address: String,
        day: Number
      }
    ],
    guides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User'
      }
    ]
  },
  { toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

tourSchema.index({ price: 1, ratingsAverage: 1 });
tourSchema.index({ slug: 1 });
tourSchema.index({ locations: '2dsphere' });

tourSchema.virtual('weeks').get(function() {
  return Math.ceil(this.duration / 7);
});

// need population for this
tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id'
});

tourSchema.pre('save', function(next) {
  this.slug = slugify(this.name);
  next();
});

// embeed users ('guides') into tours (not best practice)
// tourSchema.pre('save', async function(next) {
//   console.log(this);
//   const guidesPromise = this.guides.map(async id => await User.findById(id));

//   this.guides = await Promise.all(guidesPromise);
//   next();
// });

// tourSchema.post('save', function(doc, next) {
//   console.log(doc);
//   next();
// });

tourSchema.pre(/^find/, function(next) {
  this.find({ secretTour: { $ne: true } });
  this.start = Date.now();
  next();
});

tourSchema.pre(/^find/, function(next) {
  this.populate({ path: 'guides', select: '-__v -passwordChangedAt' });
  next();
});

// tourSchema.post(/^find/, function(docs, next) {
//   console.log(`took ${Date.now() - this.start}`);
//   next();
// });

// tourSchema.pre('aggregate', function(next) {
//   this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
//   next();
// });

module.exports = mongoose.model('Tour', tourSchema);
