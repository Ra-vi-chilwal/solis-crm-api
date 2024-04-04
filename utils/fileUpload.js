const multer = require('multer');
const path = require('path');

const setupFileUpload = () => {
  const storage = multer.diskStorage({
    destination:function (req, file, cb) {
        // Specify the directory where uploaded files will be stored
        cb(null, `${__dirname}/../public/uploads/`)
      },
    filename: (req, file, callback) => {
      callback(null, Date.now() + '_' + req.user.company.company + path.extname(file.originalname));
    }
  });

  const upload = multer({
    storage: storage,
    fileFilter: (req, file, callback) => {
      const allowedFileTypes = /pdf|jpg|jpeg|png|gif|mp4|mov/;
      const extname = allowedFileTypes.test(path.extname(file.originalname).toLowerCase());
      const mimetype = allowedFileTypes.test(file.mimetype);
      if (extname && mimetype) {
        return callback(null, true);
      } else {
        callback('Error: Only PDFs, images (jpg, jpeg, png, gif), and videos (mp4, mov) are allowed.');
      }
    }
  });

  return upload;
};

module.exports = setupFileUpload;
