
// pagination
function paginateResults() {
  return async (req, res, next) => {

    console.log('paginateResult started')
    rawResults = res.book_list
    rawLength = rawResults.length

    if (req.query.page == undefined) {
      page = 1
      limit = 20
    } else {
      page = parseInt(req.query.page)
      limit = parseInt(req.query.limit)
    }
    console.log(page)
    console.log(limit)

    startIndex = (page - 1) * limit
    endIndex = page * limit

    results = {}

    if (endIndex < rawLength) {
      results.next = {
        page: page + 1,
        limit: limit
      }
    }
    if (startIndex > 0) {
      results.previous = {
        page: page - 1,
        limit: limit
      }
    }
    try {
      // allResults = await model.find().populate('authors').populate('category').exec();
      // allResults.sort((function (a, b) { let textA = a.authors[0] ? a.authors[0].family_name.toUpperCase() : ''; let textB = b.authors[0] ? b.authors[0].family_name.toUpperCase() : ''; return (textA==='') ? 1 : (textB=='') ? -1 : (textA < textB) ? -1 : (textA > textB) ? 1 : 0;}))
      // results.current = allResults.slice(startIndex, startIndex+limit)
      rawResults.sort((function(a,b) { let textA = a.authors[0] ? a.authors[0].family_name.toUpperCase() : ''; let textB = b.authors[0] ? b.authors[0].family_name.toUpperCase() : ''; return (textA==='') ? 1 : (textB=='') ? -1 : (textA < textB) ? -1 : (textA > textB) ? 1 : 0; }))
      results.current = rawResults.slice(startIndex, startIndex+limit)
      //results.current = allResults.limit(limit).skip(startIndex).exec()

      res.paginatedResults = results

      res.render('book_list', { title: res.title, book_list: results.current, next: results.next, previous: results.previous, total_length: rawLength, prefix: res.prefix})
    
    } catch (err) {
      res.status(500).json({ message: err.message })
    }
  }
}

exports.paginateResults = paginateResults;

// check if user is a librarian
exports.isLibrarian = (req, res, next) => {
    if(req.isAuthenticated()) {
        if(req.user.isAdmin){
            next();
        } else {
            req.flash('error', 'Only librarians may access this page.');
            res.redirect('/')
        }
    } else {
        res.send('You do not have permission to access this page.') // render error page with redirect button to home.
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