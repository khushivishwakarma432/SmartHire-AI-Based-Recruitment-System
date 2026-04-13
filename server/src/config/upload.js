const fs = require('fs');
const path = require('path');

const multer = require('multer');
const uploadsDirectory = path.join(__dirname, '../../uploads');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    fs.mkdirSync(uploadsDirectory, { recursive: true });
    cb(null, uploadsDirectory);
  },
  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();
    const baseName = path.basename(file.originalname, extension).replace(/[^a-zA-Z0-9-_]/g, '-');

    cb(null, `${Date.now()}-${baseName}${extension}`);
  },
});

const fileFilter = (req, file, cb) => {
  const isPdfMimeType = file.mimetype === 'application/pdf';
  const isPdfExtension = path.extname(file.originalname).toLowerCase() === '.pdf';

  if (!isPdfMimeType || !isPdfExtension) {
    const error = new Error('Only PDF files are allowed.');
    error.statusCode = 400;
    cb(error);
    return;
  }

  cb(null, true);
};

const uploadResume = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

module.exports = uploadResume;
