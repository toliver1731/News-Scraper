var mongoose = require('mongoose');

let connection = mongoose.connect(
 process.env.MONGODB_URI || "mongodb://localhost/wheelchairwiki",
  {
    useMongoClient: true
  }
);

module.exports = connection;