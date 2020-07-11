var Category = require('../models/category');
var Book = require('../models/book');
var async = require('async');

const validator = require('express-validator');

// Display list of all Category.
exports.category_list = function(req, res, next) {
    Category.find()
    .sort([['name', 'ascending']])
    .exec((err, list_categories) => {
        if (err) {return next(err); }
    res.render('category_list', {title: 'Categories', category_list: list_categories});
    });
};

// Display detail page for a specific Category.
exports.category_detail = function(req, res, next) {
    //res.send(req.params.id);
    async.parallel({
        category: (callback) => {
            Category.findById(req.params.id)
            .exec(callback);
        },
        category_books: (callback) => {
            Book.find({'category': req.params.id })
            .populate('authors')
            .populate('category')
            .exec(callback);
        },
        
    }, (err, results) => {
        if (err) {return next(err); }
        if (results.category==null) { // No results.
            var err = new Error('Category not found.');
            err.status = 404;
            return next(err);
        }
        res.render('category_detail', { title: results.category.name, category: results.category, category_books: results.category_books})
    });
};

 

// Display Category create form on GET.
exports.category_create_get = (req, res, next) => {
    res.render('category_form', {title: 'Create category'});
};

// Handle Category create on POST.
// An array of middleware functions, called in order
exports.category_create_post = [
    // Validate that name field is not empty
    validator.body('name', 'category name required').trim().isLength({min: 1}),

    // Sanitize (escape) the name field
    validator.sanitizeBody('name').escape(),

    // Process request after validation & sanitation
    (req, res, next) => {
        // Extract validation errors from request
        const errors = validator.validationResult(req);

        // Create Category object with escaped & trimmed data
        var category = new Category(
            {name: req.body.name}
        );

        if(!errors.isEmpty()) {
            // There are errors. Render form again with sanitized values/error messages
            res.render('category_form', {title: 'Create Category', category: category, errors: errors.array()});
            return;
        }
        else {
            // Data from form is valid
            // Check if Category with that name already exists
            Category.findOne({'name': req.body.name})
                .exec((err, found_category) => {
                    if (err) {return next(err);}

                    if (found_category) {
                        // Category already exists, redirect to detail page
                        res.redirect(found_category.url);
                    }
                    else {
                        // New Category can be created
                        category.save((err) => {
                            if (err) {return next(err);}
                            res.redirect(category.url);
                        });
                    }
                });
        }
    }
];

// Display Category delete form on GET.
exports.category_delete_get = function(req, res) {
    res.send('NOT IMPLEMENTED: Category delete GET');
};

// Handle Category delete on POST.
exports.category_delete_post = function(req, res) {
    res.send('NOT IMPLEMENTED: Category delete POST');
};

// Display Category update form on GET.
exports.category_update_get = function(req, res) {
    res.send('NOT IMPLEMENTED: Category update GET');
};

// Handle Category update on POST.
exports.category_update_post = function(req, res) {
    res.send('NOT IMPLEMENTED: Category update POST');
};