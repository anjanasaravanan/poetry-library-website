var Book = require('../models/book');
var Author = require('../models/author');
var Category = require('../models/category');
var BookInstance = require('../models/bookinstance');

var middleware = require('../middleware/index');

var async = require('async');
var isbn = require('node-isbn');



const { body,validationResult } = require('express-validator/check');
const { sanitizeBody } = require('express-validator/filter');
const bookinstance = require('../models/bookinstance');
const { category_list } = require('./categoryController');
const { Promise } = require('bluebird');
const { cloudinary } = require('../middleware');
const book = require('../models/book');

exports.index = (req, res) => {
    async.parallel({
        book_count: (callback) => {
            Book.countDocuments({}, callback); // empty object as match condition --> find all documents
        },
        book_instance_count: (callback) => {
            BookInstance.countDocuments({}, callback);
        },
        book_instance_available_count: (callback) => {
            BookInstance.countDocuments({status:'Available'}, callback);
        },
        author_count: (callback) => {
            Author.countDocuments({}, callback);
        },
        category_count: (callback) => {
            Category.countDocuments({}, callback);
        }
    }, (err, results) => {
        res.render('index', {title: 'Sims Library of Poetry', error: err, data: results});
    });
};



// Display list of all Books.
exports.book_list = (req, res, next) => {

    Book.find()
      .populate('authors')
      .populate('category')
      .exec(function (err, list_books) {
        if (err) { return next(err); }
        //Successful, so render
        res.render('book_list', { title: 'Catalog', book_list: list_books });
      });
      
  };

exports.book_list_post = (req, res, next) => {
    // searching by title
    Book.find().populate('authors').populate('category')
    .then((allBooks) => {
        searchResults = [];
        allBooks.forEach((book) => {
            if(book.title.toLowerCase().includes(req.body.title.toLowerCase()) || book.title.toLowerCase()==req.body.title.toLowerCase()){
                searchResults.push(book);
            }
        });
        res.render('book_list', {title: 'Search Results for "' + req.body.title + '"', book_list: searchResults})
    });


}

// Display detail page for a specific book.
exports.book_detail = function(req, res, next) {

    async.parallel({
        book: (callback) => {

            Book.findById(req.params.id)
              .populate('authors')
              .populate('category')
              .exec(callback);
        },
        book_instance: (callback) => {
            BookInstance.find( {'book': req.params.id })
            .exec(callback);
        },
    }, (err, results) => {
        if (err) { return next(err); }
        if (results.book==null) { // No results.
            var err = new Error('Book not found');
            err.status = 404;
            return next(err);
        }
        res.render('book_detail', { title: results.book.title, book: results.book, book_instances: results.book_instance, category_list: results.book.category} );
    });

};

exports.book_create_get = (req, res, next) => {
    // Get all authors and categories, to add to book
    Category.find()
    .exec((err, list_categories) => {
        if (err) {return next(err);}
        res.render('book_form', {title: 'ISBN Book Entry', category_list: list_categories})
    })
};

exports.book_create_post = (req, res, next) => {

    function formatName(authorName) {
        var space_index = authorName.lastIndexOf(' ');
        if (space_index >= 0) {
            new_first_name = authorName.slice(0, space_index);
            new_family_name = authorName.slice(space_index+1);
        } else {
            new_family_name = authorName;
            new_first_name = ' ';
        }
        return [new_first_name, new_family_name];
    }

    isbn.resolve(req.body.isbn).then((book_data) => {
        Book.findOne({
            isbn: req.body.isbn
        }).populate('category').populate('author')
        .then((found_book) => {
            if (found_book) {
                //res.redirect(found_book.url);
                //found_book.populate('category').populate('author');
                res.render('book_form', {book: found_book, category_list: found_book.category, message: 'That book already exists!'})
            }
            else {
                var authorQueries = [];
                book_data.authors.forEach((author) => {
                    nameArray = formatName(author);
                    new_first_name = nameArray[0];
                    new_family_name = nameArray[1];
                    authorQueries.push(
                        Author.findOne({
                            first_name: new_first_name,
                            family_name: new_family_name
                        })
                    );
                });
                return Promise.all(authorQueries);
            }
        }).then((listAuthors) => {
            //create new book
            newBook = new Book({
                title: book_data.title,
                authors: listAuthors,
                description: book_data.description,
                isbn: req.body.isbn,
                category: req.body.category,
                publisher: book_data.publisher,
                publish_date: book_data.publishedDate,
                image: (book_data.imageLinks ? book_data.imageLinks.thumbnail : '../public/images/default-cover.jpg'),
                num_copies: req.body.num_copies
            });
            console.log('original listAuthors');
            console.log(listAuthors);
            if (listAuthors){ // messy
                for(i=0; i<listAuthors.length; i++){
                    if(listAuthors[i]==null){ // a new author
                        author = book_data.authors[i]
                        nameArray = formatName(author);
                        new_first_name = nameArray[0];
                        new_family_name = nameArray[1];
                        newAuthor = new Author({
                            first_name: new_first_name,
                            family_name: new_family_name,
                            books: [newBook._id]
                        });
                        //save new authors
                        listAuthors[i] = newAuthor;
                        newAuthor.save((err)=>{if (err) {return next(err);}});
                    }
                    else { // old authors
                        listAuthors[i].books.push(newBook); // add book to author's books.
                    }  
                } 
            }
            console.log('listAuthors');
            console.log(listAuthors);
            newBook.authors = listAuthors; // update authors
            //convert category to an array
            if(!(req.body.category instanceof Array)){
                if(typeof req.body.category==='undefined')
                req.body.category = [];
                else
                req.body.category = new Array(req.body.category);
            }
            console.log('newBook');
            console.log(newBook);
            //res.send(newBook);
            for(i=0; i<newBook.num_copies; i++){
                newCopy = new BookInstance({
                    book: newBook,
                    status: 'Available'
                });
                //save book instances
                newCopy.save((err) => {if (err) {return next(err);}});
            }
            //save book
            newBook.save()
            .then((newBook) => {
                res.redirect(newBook.url);
            });
        });
    }).catch((err) => {
        if (err) {res.redirect('/book/manual-entry');}
    });
};

// Display book delete form on GET.
exports.book_delete_get = function(req, res) {
    Book.findById(req.params.id)
    .exec((err, found_book) => {
        if (err) {return next(err);}
        if(found_book==null) {
            res.redirect('/books');
        }
        res.render('book_delete', {title: 'Delete Book', book: found_book});
    });    
};

//Handle book delete on POST.
exports.book_delete_post = function(req, res) {
    // delete book
    // if an author on the book does not have any other books, delete author
    // delete book instances
    Book.findByIdAndRemove(req.body.bookid)
    .then((foundBook) => {
        return Author.find({_id: {$in: foundBook.authors}})
    }).then((foundAuthors) => {
        foundAuthors.forEach((foundAuthor) => {
            removeAuthorQueries = [];
            if(foundAuthor.books.length==1){
                removeAuthorQueries.push(Author.findByIdAndRemove(foundAuthor._id));
            }
            Promise.all(removeAuthorQueries);
        })
    }).then(() => {
        return BookInstance.deleteMany({book: req.body.bookid})
    }).then(() => {
        res.redirect('/books')
    }).catch((err) => {if (err) {return next(err);}});
};


// Display book update form on GET.
exports.book_update_get = (req, res, next) => {
    // Get book, authors, and categories.
    async.parallel({
        book: (callback) => {
            Book.findById(req.params.id).populate('authors').populate('category').exec(callback);
        },
        authors: (callback) => {
            Author.find(callback);
        },
        categories: (callback) => {
            Category.find(callback);
        },
        }, (err, results) => {
            if (err) {return next(err); }
            if (results.book==null) {
                var err = new Error('Book not found');
                err.status = 404;
                return next(err);
            }
            // Mark selected categories as checked.
            for (var all_g_iter=0; all_g_iter<results.categories.length; all_g_iter++) {
                for (var book_g_iter=0; book_g_iter<results.book.category.length; book_g_iter++) {
                    if (results.categories[all_g_iter]._id.toString()==results.book.category[book_g_iter]._id.toString()) {
                        results.categories[all_g_iter].checked='true';
                    }
                }
            }
            res.render('book_update_form', {title: 'Update Book', authors: results.authors, categories: results.categories, book: results.book, 
                                            num_copies: results.book.num_copies});
        });
};

// Handle book update on POST.
exports.book_update_post = (req, res, next) => {

    function formatName(authorName) {
        var space_index = authorName.lastIndexOf(' ');
        if (space_index >= 0) {
            new_first_name = authorName.slice(0, space_index);
            new_family_name = authorName.slice(space_index+1);
        } else {
            new_family_name = authorName;
            new_first_name = ' ';
        }
        return [new_first_name, new_family_name];
    }

    // converts category to an array
    if(!(req.body.category instanceof Array)){
        if(typeof req.body.category==='undefined')
        req.body.category = [];
        else
        req.body.category = new Array(req.body.category);
    }
    // crops author array
    var cropIndex = req.body.author.indexOf('');
    if(cropIndex != -1)
        req.body.author.splice(cropIndex);
    //console.log(req.body.category);
    console.log(req.body.author);

    // Sanitize fields.
    sanitizeBody('title').escape(),
    sanitizeBody('author').escape(),
    sanitizeBody('summary').escape(),
    sanitizeBody('isbn').escape(),
    sanitizeBody('category.*').escape()

    const errors = validationResult(req);

    // Create book object with old id
    Book.findById(req.params.id)
    .then((found_book) => {
        if(found_book==null){
            res.redirect('/books')
        }
        else {
            // search existing authors for each entered author
            var authorQueries = [];
            console.log('second')
            console.log(req.body.author);
            req.body.author.forEach((author) => {
                nameArray = formatName(author);
                new_first_name = nameArray[0];
                new_family_name = nameArray[1];
                console.log(new_first_name + new_family_name);
                authorQueries.push(
                    Author.findOne({
                        first_name: new_first_name,
                        family_name: new_family_name
                    })
                );
            });
            // save new book instances
            newCopies = req.body.num_copies - found_book.num_copies
            if(newCopies < 0) {
                for(i=0; i<-newCopies; i++){
                    bookinstance.findOneAndRemove({
                        book: found_book
                    }).exec((err, found_instance) => {
                        if (err) {return next(err);}
                    });
                }
            }
            else {
                for(i=0; i<newCopies; i++){
                    newCopy = new bookinstance({
                        book: found_book,
                        status: 'Available'
                    });
                    newCopy.save((err) => {if (err) {return next(err);}});
                }
            }
            return Promise.all(authorQueries);
        }
    }).then((listAuthors) => {
        //console.log(listAuthors);
        for(i=0; i<listAuthors.length; i++){
            if(listAuthors[i]==null){ // author does not exist, create and save.
                author = req.body.author[i]
                nameArray = formatName(author);
                new_first_name = nameArray[0];
                new_family_name = nameArray[1];
                newAuthor = new Author({
                    first_name: new_first_name,
                    family_name: new_family_name,
                    books: [req.params.id]
                });
                //save new authors
                listAuthors[i] = newAuthor;
                newAuthor.save((err)=>{if (err) {return next(err);}});
            }   
        }
        //console.log(listAuthors);
        
        var newBook = new Book({ 
            title: req.body.title,
            authors: listAuthors,
            description: req.body.description,
            isbn: req.body.isbn,
            category: (typeof req.body.category==='undefined') ? [] : req.body.category,
            num_copies: req.body.num_copies,
            _id: req.params.id, //This is required, or a new ID will be assigned!
            //image: (req.body.image ? req.body.image)
            //image: (typeof req.body.image==='undefined') ? 'http://localhost:3000/images/default-cover.jpg' : req.body.image
        });

        console.log('image test')
        console.log(req.body.image)
        console.log(newBook.image)

        if (!errors.isEmpty()) {
            // There are errors. Render form again with sanitized values/error messages.

            // Get all authors and categories for form.
            async.parallel({
                authors: function(callback) {
                    Author.find(callback);
                },
                categories: function(callback) {
                    Category.find(callback);
                },
            }, function(err, results) {
                console.log('error results')
                console.log(results)
                if (err) { return next(err); }

                // Mark our selected categories as checked.
                for (let i = 0; i < results.categories.length; i++) {
                    if (newBook.category.indexOf(results.categories[i]._id) > -1) {
                        results.categories[i].checked='true';
                    }
                }
                res.render('book_update_form', { title: 'Update Book',authors: results.authors, categories: results.categories, book: newBook, errors: errors.array() });
            });
            return;
        }
        console.log(newBook);
        return Book.findByIdAndUpdate(req.params.id, newBook, {})
    }).then((updatedBook) => {
        if (req.file) { // new image file uploaded
            middleware.cloudinary.uploader.upload(req.file.path)
            .then((result) => {
                //res.redirect(result.secure_url);
                return Book.findByIdAndUpdate(updatedBook._id, {'image': result.secure_url});
            })
            .then((updatedBookWithImage) => {
                console.log(updatedBookWithImage);
                res.redirect(updatedBookWithImage.url);
            });
        }
        else { // if no new cover image
            console.log(updatedBook);
            res.redirect(updatedBook.url);
        }
    }).catch((err) => {if (err) {return next(err);}});
  
};

// Handle manual book entry on get
exports.book_manual_get = (req, res, next) => {
    Category.find()
    .exec((err, list_categories) => {
        if (err) {return next(err);}
        res.render('book_manual_entry', {title: 'Manual Entry', category_list: list_categories});
    })
};

exports.book_manual_post = (req, res, next) => {
   
    function formatName(authorName) {
        var space_index = authorName.lastIndexOf(' ');
        if (space_index >= 0) {
            new_first_name = authorName.slice(0, space_index);
            new_family_name = authorName.slice(space_index+1);
        } else {
            new_family_name = authorName;
            new_first_name = ' ';
        }
        return [new_first_name, new_family_name];
    }

    // crops author array
    var cropIndex = req.body.authors.indexOf('');
    if(cropIndex != -1)
        req.body.authors.splice(cropIndex);

    Book.findOne({
        title: req.body.title,
        isbn: req.body.isbn // crossreferencing by title & isbn, messy
    }).then((foundBook) => {
        if (foundBook) {
            res.redirect(foundBook.url);
        }
        else { // check if entered authors already exist
            var authorQueries = [];
            req.body.authors.forEach((author) => {
                nameArray = formatName(author);
                new_first_name = nameArray[0];
                new_family_name = nameArray[1];
                authorQueries.push(
                    Author.findOne({
                        first_name: new_first_name,
                        family_name: new_family_name
                    })
                );
            });
            return Promise.all(authorQueries); 
        }
    }).then((listAuthors) => {
        // create new book
        newBook = new Book({
            title: req.body.title,
            authors: listAuthors,
            description: req.body.description,
            isbn: req.body.isbn,
            category: req.body.category,
            //publisher: req.body.publisher,
            //publish_date: req.body.publishedDate,
            image: '', //open to receive updates later
            //image: book_data.imageLinks.thumbnail,  // add publisher, publish date, image features.
            num_copies: req.body.num_copies
        });
        for(i=0; i<listAuthors.length; i++){
            if(listAuthors[i]==null){ // if this is a new author, create and associate with book
                author = req.body.authors[i]
                nameArray = formatName(author);
                new_first_name = nameArray[0];
                new_family_name = nameArray[1];
                newAuthor = new Author({
                    first_name: new_first_name,
                    family_name: new_family_name,
                    books: [newBook._id]
                });
                // save new author
                listAuthors[i] = newAuthor;
                newAuthor.save((err)=>{if (err) {return next(err);}});
            }
            else { // if this is an old author, add this book to the author's books.
                listAuthors[i].books.push(newBook);
            } 
        }
        newBook.authors = listAuthors; // update newBook's authors
        // make sure category is an array
        if(!(req.body.category instanceof Array)){
            if(typeof req.body.category==='undefined')
            req.body.category = [];
            else
            req.body.category = new Array(req.body.category);
        }
        console.log('newBook');
        console.log(newBook);
        // create book instances
        for(i=0; i<newBook.num_copies; i++){
            newCopy = new BookInstance({
                book: newBook,
                status: 'Available'
            });
            //save book instances
            newCopy.save((err) => {if (err) {return next(err);}});
        }
        //save book
        return newBook.save();
    }).then((newBook) => {
        console.log(newBook);
        // upload cover image
        middleware.cloudinary.uploader.upload(req.file.path)
        .then((result) => {
            return Book.findByIdAndUpdate(newBook._id, {'image': result.secure_url});
        }).then((updatedBook) => {
            console.log(updatedBook);
            res.redirect(updatedBook.url);
        });
    }).catch((err) => {if (err) {return next(err);}});
}
