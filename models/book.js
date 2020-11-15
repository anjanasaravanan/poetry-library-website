var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var BookSchema = new Schema(
    {
        title: {type: String, required: true},
        authors: [{type: Schema.Types.ObjectId, ref: 'Author'}], //change to array for multiple authors. Not required? sure.
        description: {type: String},
        isbn: {type: String}, // not required because some books do not have them.
        category: [{type: Schema.Types.ObjectId, ref: 'Category'}],
        publisher: {type: String},
        publish_date: {type: Date},
        image: {type: String},
        num_copies: {type: Number, default: 1},
        email: [{type: String}]
    }
);

// Virtual for book's URL
BookSchema
.virtual('url')
.get(function () {
    return '/book/' + this._id;
});

// Export model
module.exports = mongoose.model('Book', BookSchema);