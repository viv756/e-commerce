const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/upload/category');
  },
  filename: (req, file, cb) => {
    const originalname = file.originalname;
    const extname = path.extname(originalname);
    const basename = path.basename(originalname, extname);
    const pathname = `${Date.now()}.webp`;
    cb(null, pathname);
  },
});

const upload = multer({ storage });

module.exports = upload;