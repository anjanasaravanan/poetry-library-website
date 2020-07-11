var Author = require('../models/author');
var async = require('async');
var Book = require('../models/book');

const { body, validationResult } = require('express-validator/check');
const { sanitizeBody } = require('express-validator/filter');
const bookinstance = require('../models/bookinstance');
const author = require('../models/author');

// Display list of all Authors
exports.author_list = (req, res, next) => {
    Author.find()
    .populate('author')
    .sort([['family_name', 'ascending']])
    .exec((err, list_authors) => {
        if (err) {return next(err); }
        res.render('author_list', {title: 'Featured Authors', author_list: list_authors });
    });
    
};

exports.author_list_post = function (req, res, next) {

    Author.find().populate('books')
    .then((allAuthors) => {
        searchResults = [];
        allAuthors.forEach((author) => {
            if(author.family_name.includes(req.body.name) || author.first_name.includes(req.body.name) || author.name.includes(req.body.name) || author.name === req.body.name){
                searchResults.push(author);
            }
        });
        res.render('author_list', {title: 'Search Results for "' + req.body.name + '"', author_list: searchResults});
    })



    // Author.find(
    //     {
    //         'family_name': req.body.family_name,
    //     })
    //     .exec((err, foundAuthors) => {
    //         if (err) {return next(err); }
    //         if (foundAuthors[0]) { // at least one author found!
    //             res.render('author_list', {title: 'Search Result for "' + req.body.family_name + '"', author_list: foundAuthors})
    //             //res.redirect(found_author.url);
    //         }
    //         else {
    //             Author.find()
    //             .populate('author')
    //             .sort([['family_name', 'ascending']])
    //             .exec((err, list_authors) => {
    //                 if (err) {return next(err); }
    //                 res.render('author_list', {title: 'Featured Authors', author_list: list_authors, not_found: true})
    //             })
    //         }
    //     });
}

// Display detail page for a specific Author
exports.author_detail = function(req, res, next) {

    async.parallel({
        author: (callback) => {
            Author.findById(req.params.id)
                .exec(callback);
        },
        authors_books: (callback) => {
            Book.find({ 'authors': req.params.id })
                .populate('category')
                .exec(callback);
        },
    }, (err, results) => {
        if (err) {return next(err);}
        if (results.author==null) {
            var err = new Error('Author not found');
            err.status = 404;
            return next(err);
        }
        //res.render('book_list', { title: results.author.name, book_list: results.authors_books})
        res.render('author_detail', {title: 'Author Detail', author: results.author, author_books: results.authors_books });
    });
};

// Display Author create form on GET
exports.author_create_get = (req, res, next) => {
    res.render('author_form', {title: 'Create Author'});
}

// Handle Author create on POST
exports.author_create_post = [
    // Validate fields.
    body('first_name').isLength({min:1}).trim().withMessage('First name must be specified.')
        .isAlphanumeric().withMessage('First name has non-alphanumeric characters.'),
    body('family_name').isLength({min: 1}).trim().withMessage('Family name must be specified.')
        .isAlphanumeric().withMessage('Family name has non-alphanumeric characters.'),
    body('date_of_birth', 'Invalid date of birth').optional({ checkFalsy: true }).isISO8601(),
    body('date_of_death', 'Invalid date of death').optional({ checkFalsy: true }).isISO8601(),

    // Sanitize fields.
    sanitizeBody('first_name').escape(),
    sanitizeBody('family_name').escape(),
    sanitizeBody('date_of_birth').toDate(),
    sanitizeBody('date_of_death').toDate(),

    // Process request after validation & sanitation.
    (req, res, next) => {
        // Extract validation errors from a request.
        const errors = validationResult(req);

        if(!errors.isEmpty()) {
            res.render('author_form', { title: 'Create Author', author: req.body, errors: errors.array() });
            return;
        }
        else {
            Author.findOne(
                { // check for pre-existing author
                    'first_name': (req.body.first_name ? req.body.first_name : ' '), 
                    'family_name': req.body.family_name,
                    'date_of_birth': req.body.date_of_birth,
                    'date_of_death': req.body.date_of_death})
                .exec((err, found_author) => {
                    if (err) {return next(err); }
                    if (found_author) { // Author already exists
                        res.redirect(found_author.url);
                    }
                    else {
                        // Cleared to create new author
                        var author = new Author(
                            {
                                first_name: req.body.first_name,
                                family_name: req.body.family_name,
                                date_of_birth: req.body.date_of_birth,
                                date_of_death: req.body.date_of_death,
                                books: []
                            });
                        author.save(function (err) {
                            if (err) {return next(err); }
                            res.redirect(author.url);
                        });
                    }
                });
        }
    }
];

// Display Author delete form on GET.
exports.author_delete_get = function(req, res) {
    Author.findById(req.params.id)
    .exec((err, found_author) => {
        if (err) {return next(err);}
        if (found_author==null) {
            res.redirect('/authors');
        }
        res.render('author_delete', {title: 'Delete Author', author: found_author});
    });
};

// Handle Author delete on POST.
exports.author_delete_post = function(req, res, next) {

    // delete authors
    // delete books if only author
    // delete book instances if deleting books
    Author.findByIdAndRemove(req.body.authorid)
    .then((foundAuthor) => {
        return Book.find({authors: {$in: [foundAuthor]}});
    }).then((foundBooks) => {
        console.log('foundBooks');
        console.log(foundBooks)
        deleteBookQueries = [];
        foundBooks.forEach((foundBook) => {
            if(foundBook.authors.length==1){ // if deleted author is only author on book, delete book
                deleteBookQueries.push(Book.findByIdAndRemove(foundBook._id));
            }
            else { // otherwise, just remove this author from the book
                foundBook.authors.splice(foundBook.authors.indexOf(req.body.authorid), 1);
                Book.findByIdAndUpdate(foundBook._id, {authors: foundBook.authors})
                .then((updatedBook) => {
                    console.log(updatedBook);
                }).catch((err) => {if (err) {return next(err);}});
            }
        });
        return Promise.all(deleteBookQueries);
    }).then((deletedBooks) => {
        console.log('deletedBooks')
        console.log(deletedBooks)
        deleteInstanceQueries = [];
        deletedBooks.forEach((deletedBook) => {
            deleteInstanceQueries.push(bookinstance.deleteMany({book: deletedBook}));
        });
        return Promise.all(deleteInstanceQueries)
    }).then((deletedInstances) => {
        res.redirect('/authors')
    }).catch((err) => {if (err) {return next(err);}});


    // Author.findByIdAndRemove(req.body.authorid)
    // .then((foundAuthor) => {
    //     return Book.find({authors: [foundAuthor]})
    // }).then((foundBooks) => {
    //     console.log('foundBooks');
    //     console.log(foundBooks);
    //     return bookinstance.deleteMany({book: {$in: foundBooks}})
    // }).then(() => {
    //     return Book.deleteMany({authors: [req.body.authorid]})
    // }).then((foundBooks) => {
    //     res.redirect('/catalog');
    // }).catch((err) => {
    //     if (err) {return next(err);}
    // });
};

// Display Author update form on GET. // add bio feature
exports.author_update_get = (req, res, next) => {
    Author.findById(req.params.id)
    .exec((err, found_author) => {
        if (err) {return next(err);}
        res.render('author_form', {title: 'Update Author', author: found_author});
    });
};

// Handle Author update on POST.
exports.author_update_post = (req, res, next) => {
    var author = new Author(
        {
            first_name: req.body.first_name,
            family_name: req.body.family_name,
            date_of_birth: req.body.date_of_birth,
            date_of_death: req.body.date_of_death,
            _id: req.params.id
        }
    );
    Author.findByIdAndUpdate(req.params.id, author, {}, (err, new_book) => {
        if (err) {return next(err);}
        res.redirect(new_book.url);
    });
}