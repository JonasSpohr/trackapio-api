let mongoose = require('mongoose');
mongoose.Promise = require('bluebird');

const user = 'root';
const pwd = 'Spohr1010';
const server = 'ds141401.mlab.com:41401';
const database = 'dev-env';

class Database {
  constructor() {
    this._connect()
  }
  _connect() {
    mongoose.connect(`mongodb://${user}:${pwd}@${server}/${database}`)
      .then(() => {
        console.log('Database connection successful')
      })
      .catch(err => {
        console.error('Database connection error')
        console.log(err)
      })
  }
}

module.exports = new Database()