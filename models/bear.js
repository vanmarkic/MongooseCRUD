// app/models/bear.js

var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;

var BearSchema   = new Schema({
    name: String, 
    password: String, 
    admin: Boolean 
},{
    collection : 'bears'
});

module.exports = mongoose.model('Bear', BearSchema);

