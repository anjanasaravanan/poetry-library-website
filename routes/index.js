var express = require('express');
var router = express.Router();
var passport = require('passport')

// Require controller modules.
var book_controller = require('../controllers/bookController');
var author_controller = require('../controllers/authorController');
var category_controller = require('../controllers/categoryController');
var book_instance_controller = require('../controllers/bookinstanceController');
var user_controller = require('../controllers/userController');
var middleware = require('../middleware/index')

/* GET home page. */
router.get('/', book_controller.index);

// GET register page.
//router.get('/register', user_controller.register_get);

router.get('/register', user_controller.temporary_register_page);

// handle POST request for registering a user.
router.post('/register', user_controller.register_post);


// LOGIN PAGE
router.get('/login', user_controller.login_get)

// handle POST request for login
router.post('/login', user_controller.login_post);

// LOGOUT PAGE
router.get('/logout', user_controller.logout);

// GET librarian portal
router.get('/librarian-portal', middleware.isLibrarian, user_controller.librarian_portal_get);




// GET request for creating a Book. NOTE This must come before routes that display Book (uses id).
router.get('/book/create', middleware.isLibrarian, book_controller.book_create_get);
// POST request for creating Book.
router.post('/book/create', middleware.isLibrarian, book_controller.book_create_post);

// GET request for manual book entry (no ISBN)
router.get('/book/manual-entry', middleware.isLibrarian, book_controller.book_manual_get);

// POST request for manual book entry
router.post('/book/manual-entry', middleware.isLibrarian, middleware.upload.single('image'), book_controller.book_manual_post);

// GET request to delete Book.
router.get('/book/:id/delete', middleware.isLibrarian, book_controller.book_delete_get);

// POST request to delete Book.
router.post('/book/:id/delete', middleware.isLibrarian, book_controller.book_delete_post);

// GET request to update Book.
router.get('/book/:id/update', middleware.isLibrarian, book_controller.book_update_get);

// POST request to update Book.
router.post('/book/:id/update', middleware.isLibrarian, book_controller.book_update_post);

// GET request for one Book.
router.get('/book/:id', book_controller.book_detail);

// GET request for list of all Book items.  Catalog.
router.get('/books', book_controller.book_list);

// POST request on book list page, for the search feature.
router.post('/books', book_controller.book_list_post);


/// AUTHOR ROUTES ///

// GET request for creating Author. NOTE This must come before route for id (i.e. display author).
router.get('/author/create', middleware.isLibrarian, author_controller.author_create_get);

// POST request for creating Author.
router.post('/author/create', middleware.isLibrarian, author_controller.author_create_post);

// GET request to delete Author.
router.get('/author/:id/delete', middleware.isLibrarian, author_controller.author_delete_get);

// POST request to delete Author.
router.post('/author/:id/delete', middleware.isLibrarian, author_controller.author_delete_post);

// GET request to update Author.
router.get('/author/:id/update', middleware.isLibrarian, author_controller.author_update_get);

// POST request to update Author.
router.post('/author/:id/update', middleware.isLibrarian, author_controller.author_update_post);

// GET request for one Author.
router.get('/author/:id',  author_controller.author_detail);

// POST request (search feature on author page)
//router.post('/author/:id', author_controller.author_detail_post);

// GET request for list of all Authors.
router.get('/authors', author_controller.author_list);

// POST request for search feature on Author list page.
router.post('/authors', author_controller.author_list_post)

/// category ROUTES ///

// GET request for creating a category. NOTE This must come before route that displays category (uses id).
router.get('/category/create', middleware.isLibrarian, category_controller.category_create_get);

//POST request for creating category.
router.post('/category/create', middleware.isLibrarian, category_controller.category_create_post);

// GET request to delete category.
router.get('/category/:id/delete', middleware.isLibrarian, category_controller.category_delete_get);

// POST request to delete category.
router.post('/category/:id/delete', middleware.isLibrarian, category_controller.category_delete_post);

// GET request to update category.
router.get('/category/:id/update', middleware.isLibrarian, category_controller.category_update_get);

// POST request to update category.
router.post('/category/:id/update', middleware.isLibrarian, category_controller.category_update_post);

// GET request for one category.
router.get('/category/:id', category_controller.category_detail);

// POST request for category search feature
//router.post('/category/:id', category_controller.category_detail_post);

// GET request for list of all category.
router.get('/categories', category_controller.category_list);

/// BOOKINSTANCE ROUTES ///

// GET request for creating a BookInstance. NOTE This must come before route that displays BookInstance (uses id).
router.get('/bookinstance/create', middleware.isLibrarian, book_instance_controller.bookinstance_create_get);

// POST request for creating BookInstance.   THIS IS THE LIBRARIAN FEATURE TO UPLOAD BOOKS, OKAY?!
router.post('/bookinstance/create', middleware.isLibrarian, book_instance_controller.bookinstance_create_post);

// GET request to delete BookInstance.
router.get('/bookinstance/:id/delete', middleware.isLibrarian, book_instance_controller.bookinstance_delete_get);

// POST request to delete BookInstance.
router.post('/bookinstance/:id/delete', middleware.isLibrarian, book_instance_controller.bookinstance_delete_post);

// GET request to update BookInstance.
router.get('/bookinstance/:id/update', middleware.isLibrarian, book_instance_controller.bookinstance_update_get);

// POST request to update BookInstance.
router.post('/bookinstance/:id/update', middleware.isLibrarian, book_instance_controller.bookinstance_update_post);

// GET request for one BookInstance.
router.get('/bookinstance/:id', book_instance_controller.bookinstance_detail);

// GET request for list of all BookInstance.
router.get('/bookinstances', book_instance_controller.bookinstance_list);


module.exports = router;
