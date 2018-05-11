var mongoose = require('../mongoose')
var Schema = mongoose.Schema
var Promise = require('bluebird')

var UserSchema = new Schema({
    username: String,
    email: String,
    password: String,
    creat_date: String,
    update_date: String,
    is_delete: Number,
    timestamp: Number,
    user_groups: String,
    last_update: String,
    continue_days: Number,
})

var User = mongoose.model('User', UserSchema)
Promise.promisifyAll(User)
Promise.promisifyAll(User.prototype)

module.exports = User
