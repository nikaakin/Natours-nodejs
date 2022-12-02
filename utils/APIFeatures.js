const Tour = require('../models/tourModel.js');

module.exports = class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    // excluding some fields
    const queryObj = { ...this.queryString };
    const excludeFields = ['page', 'sort', 'limit', 'fields'];
    excludeFields.forEach(field => delete queryObj[field]);

    // lte, gte, lt, gt
    let queryStr = JSON.stringify(this.queryString);
    queryStr = queryStr.replace(/\b(lte|lt|gte|gt)\b/g, match => `$${match}`);
    this.query = Tour.find(JSON.parse(queryStr));
    return this;
  }

  sort() {
    // sorting
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(',').join(' ');
      this.query.sort(sortBy);
    } else {
      this.query.sort('-createdAt');
    }
    return this;
  }

  limitFields() {
    // limit fields
    if (this.queryString.fields) {
      const limitBy = this.queryString.fields.split(',').join(' ');
      this.query.select(limitBy);
    } else {
      this.query.select('-__v');
    }
    return this;
  }

  paginate() {
    // Pagination
    const limit = +this.queryString.limit || 100;
    const page = +this.queryString.page || 1;
    const skip = (page - 1) * limit;

    this.query.skip(skip).limit(limit);
    return this;
  }
};
