

exports.isLibrarian = (req, res, next) => {
    if(req.isAuthenticated()) {
        if(req.user.isAdmin){
            next();
        } else {
            req.flash('error', 'Only librarians may access this page.');
            res.redirect('/')
        }
    } else {
        res.send('whao')
    }
}