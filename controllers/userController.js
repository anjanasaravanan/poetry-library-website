var User = require('../models/user');
var async = require('async');

const passport = require('passport');
const { response } = require('express');
const user = require('../models/user');


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
        res.render('checkout', {foundBooks: foundUser.books})
    })
}