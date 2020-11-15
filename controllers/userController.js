var User = require('../models/user');
var async = require('async');

const passport = require('passport');
const { response } = require('express');
const user = require('../models/user');
const Book = require('../models/book');
const { use } = require('passport');


exports.login_get = (req, res, next) => {
    res.render('login');
};

exports.login_post = [
    passport.authenticate('local', {
        successRedirect: '/librarian-portal',
        failureRedirect: '/login',
        failureFlash: true,
        successFlash: 'Login successful!'}),

    (req, res) => {}
];

exports.register_get = (req, res, next) => {
    res.render('register');
};

exports.register_post = (req, res, next) => {
    var newUser = new User({username: req.body.username});
    if(req.body.adminCode === process.env.ADMIN_CODE){
        newUser.isAdmin = true;
    }
    User.register(newUser, req.body.password, (err, user) => {
        if (err) {
            console.log(err);
            return res.render('register', {error: err.message});
        }
        passport.authenticate('local')(req, res, () => {
            req.flash('success', 'Successfully signed up! Nice to meet you, ' + req.body.username);
            if(newUser.isAdmin){
                res.redirect('/librarian-portal');
            }
            else {
                res.redirect('/')
            }
        });
    });
};

exports.temporary_register_page = (req, res, next) => {
    res.render('temp_reg');
}

exports.logout = (req, res, next) => {
    req.logout();
    req.flash('success', 'See you later!');
    res.redirect('/')
}

exports.librarian_portal_get = (req, res, next) => {
    res.render('librarian_portal');
}

exports.checkout_get = (req, res, next) => {
    user.findById(req.user._id)
    .then((foundUser) => {
        foundBooks = [];
        foundUser.books.forEach((foundBook) => {
            foundBooks.push(Book.findById(foundBook).populate('authors').populate('category'))
        })
        return Promise.all(foundBooks)
    }).then((foundBooks) => {
        res.render('checkout', {foundBooks: foundBooks})
    })
}

exports.checkout_post = (req, res, next) => {
    for(i=0; i<req.user.books.length; i++){
        if (req.user.books[i] == req.body.bookid) {
            console.log(i)
            req.user.books.splice(i,1)
            console.log(req.user.books)
            break
        }
    }
    User.findByIdAndUpdate(req.user._id, {'books': req.user.books})
    .then((foundUser) => {
        foundBooks = []
        foundUser.books.forEach((book) => {
            foundBooks.push(Book.findById(book).populate('authors').populate('category'))
        })
        return Promise.all(foundBooks)
    })
    .then((foundBooks) => {
        res.redirect('/checkout')
    })
    .catch((err) => {
        if (err) {return next(err);}
    })
}


exports.checkout_finalize_get = (req, res, next) => {
    user.findById(req.user._id)
    .then((foundUser) => {
        foundBooks = [];
        foundUser.books.forEach((foundBook) => {
            foundBooks.push(Book.findById(foundBook).populate('authors').populate('category'))
        })
        return Promise.all(foundBooks)
    }).then((foundBooks) => {
        res.render('checkout_finalize', {foundBooks: foundBooks})
    })
}

exports.checkout_finalize_post = async (req, res, next) => {


    foundBooks = []
    JSON.parse(req.body.booklist).forEach((checkedOutBook) => {
        foundBooks.push(Book.findById(checkedOutBook))
    })

    Promise.all(foundBooks)
    .then(async (resolvedBooks) => {
        checkouts = []
        resolvedBooks.forEach(async (checkedOutBook) => {
            if (checkedOutBook.email === []) {
                checkouts.push((Book.findByIdAndUpdate(checkedOutBook, {email: [req.body.email]}, {new: true, useFindAndModify: false})))
            }
            else{
                checkouts.push(Book.findByIdAndUpdate(checkedOutBook, {$push: {email: req.body.email}}, {new: true, useFindAndModify: false}))
            }
        })
        return await Promise.all(checkouts)
    })
    .then((confirmedBooks) => {
        user.findByIdAndUpdate(req.user._id, {books: []}, {useFindAndModify: false})
        .then((foundUser) => {
            res.render('checkout_receipt', {booklist:confirmedBooks})
        })
    })
    .catch((err) => {
        if (err) {return next(err);}
    })
}

exports.checkin_get = (req, res, next) => {
    res.render('checkin')
}

exports.checkin_post = (req, res, next) => {
    Book.find({'email': {$in: req.body.email}}).populate('authors').populate('category')
    .then((foundBooks) => {
        res.render('checkin', {booklist: foundBooks})
    })
}

exports.checkin_list_get = (req, res, next) => {
    Book.find({'email': {$in: req.body.email}}).populate('authors').populate('category')
    .then((foundBooks) => {
        res.render('checkin_list', {booklist: foundBooks})
    })
}

exports.checkin_list_post = (req, res, next) => {
    var email_string = req.body.email.slice(2, req.body.email.length-2)
    // don't know why the above is happening, but faq it amirite L)
    Book.findByIdAndUpdate(req.body.bookid, {$pull: {'email': email_string}}, {new: true, useFindAndModify: false})
    .then((foundBook) => {
        console.log(foundBook)
        return Book.find({'email': {$in: email_string}}).populate('authors').populate('category')
    })
    .then((bookList) => {
        console.log(bookList)
        res.render('checkin_list', {booklist: bookList})
    }) 
    
}