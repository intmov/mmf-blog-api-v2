var mongoose = require('../mongoose')
var Schema = mongoose.Schema
var Promise = require('bluebird')

var GroupSchema = new Schema({
    groupName: String,
    creat_date: String,
    is_delete: Number,
    timestamp: Number
})

var Group = mongoose.model('Group', GroupSchema)
Promise.promisifyAll(Group)
Promise.promisifyAll(Group.prototype)

module.exports = Group
