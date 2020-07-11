var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var CategorySchema = new Schema(
    {
        name: {type: String, min: [3, 'too few characters'], max: 100, required: true},
    }
);

// Virtual for Category's URL
CategorySchema
.virtual('url')
.get(function () {
    return '/category/' + this._id;
});

// Export model
module.exports = mongoose.model('Category', CategorySchema);