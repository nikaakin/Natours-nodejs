const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fs = require('fs');
const Tour = require('./../../models/tourModel');
const User = require('./../../models/userModel');

dotenv.config({ path: './config.env' });

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);
mongoose.connect(DB).then(con => con);

const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours-simple.json`));
const importTours = async () => {
  try {
    await Tour.create(tours);
    console.log('Succesfully added');
  } catch (err) {
    console.log(err);
  }
  process.exit();
};
const deleteTours = async () => {
  try {
    await Tour.deleteMany();
    console.log('Succesfully deleted');
  } catch (err) {
    console.log(err);
  }
  process.exit();
};

const deleteUsers = async () => {
  try {
    await User.deleteMany();
    console.log('Succesfully deleted');
  } catch (err) {
    console.log(err);
  }
  process.exit();
};

if (process.argv[2] === '--import') {
  importTours();
}
if (process.argv[2] === '--delete') {
  deleteTours();
}
if (process.argv[2] === '--deleteUsers') {
  deleteUsers();
}
