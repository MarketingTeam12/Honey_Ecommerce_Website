const path = require("path");
const multer = require("multer");

const MAX_UPLOAD_SIZE_MB = 50;
const MAX_UPLOAD_SIZE_BYTES = MAX_UPLOAD_SIZE_MB * 1024 * 1024;

const ALLOWED_EXTENSIONS = new Set([".pdf", ".doc", ".docx", ".jpg", ".jpeg", ".png"]);
const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/jpg",
  "image/png",
]);

function createDocumentFileFilter() {
  return (req, file, cb) => {
    const ext = path.extname(file?.originalname || "").toLowerCase();
    const mime = String(file?.mimetype || "").toLowerCase();

    if (!ALLOWED_EXTENSIONS.has(ext) || (mime && !ALLOWED_MIME_TYPES.has(mime))) {
      const error = new Error(
        `Unsupported file type for "${file?.originalname || "file"}". Allowed types: PDF, DOC, DOCX, JPG, PNG.`,
      );
      error.status = 400;
      return cb(error);
    }

    return cb(null, true);
  };
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_UPLOAD_SIZE_BYTES },
  fileFilter: createDocumentFileFilter(),
});

module.exports = upload;
module.exports.MAX_UPLOAD_SIZE_MB = MAX_UPLOAD_SIZE_MB;
module.exports.MAX_UPLOAD_SIZE_BYTES = MAX_UPLOAD_SIZE_BYTES;
module.exports.ALLOWED_EXTENSIONS = ALLOWED_EXTENSIONS;
module.exports.ALLOWED_MIME_TYPES = ALLOWED_MIME_TYPES;
module.exports.createDocumentFileFilter = createDocumentFileFilter;
