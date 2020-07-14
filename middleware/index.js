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

// image upload setup
var multer = require('multer');
var storage = multer.diskStorage({
  filename: function(req, file, callback) {
    callback(null, Date.now() + file.originalname);
  }
});
var imageFilter = function (req, file, cb) {
  // accept image files only
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
    return cb(new Error('Only image files are allowed!'), false);
  }
  cb(null, true);
}
exports.upload = multer({ storage: storage, fileFilter: imageFilter});

var cloudinary = require('cloudinary');
cloudinary.config({
  cloud_name: 'dgcsg67jg',
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

exports.cloudinary = cloudinary;