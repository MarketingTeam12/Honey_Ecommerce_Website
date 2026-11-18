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

function verifyMagicBytes(file) {
  if (!file || !file.buffer || file.buffer.length < 4) return false;
  const ext = path.extname(file.originalname || "").toLowerCase();
  const buf = file.buffer;

  if (ext === ".pdf") {
    return buf.toString("ascii", 0, 4) === "%PDF";
  }
  if (ext === ".png") {
    return buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47;
  }
  if (ext === ".jpg" || ext === ".jpeg") {
    return buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
  }
  if (ext === ".docx") {
    return buf[0] === 0x50 && buf[1] === 0x4b;
  }
  if (ext === ".doc") {
    return buf[0] === 0xd0 && buf[1] === 0xcf;
  }
  return true;
}

function scanUploadedFiles(req, res, next) {
  const files = [];
  if (req.file) files.push(req.file);
  if (Array.isArray(req.files)) files.push(...req.files);
  if (req.files && typeof req.files === "object" && !Array.isArray(req.files)) {
    for (const key of Object.keys(req.files)) {
      if (Array.isArray(req.files[key])) files.push(...req.files[key]);
    }
  }

  for (const file of files) {
    if (file.buffer && !verifyMagicBytes(file)) {
      const err = new Error(
        `Security verification failed for "${file.originalname}": file content signature does not match declared type.`,
      );
      err.status = 400;
      return next(err);
    }
  }
  return next();
}

module.exports = upload;
module.exports.scanUploadedFiles = scanUploadedFiles;
module.exports.verifyMagicBytes = verifyMagicBytes;
module.exports.MAX_UPLOAD_SIZE_MB = MAX_UPLOAD_SIZE_MB;
module.exports.MAX_UPLOAD_SIZE_BYTES = MAX_UPLOAD_SIZE_BYTES;
module.exports.ALLOWED_EXTENSIONS = ALLOWED_EXTENSIONS;
module.exports.ALLOWED_MIME_TYPES = ALLOWED_MIME_TYPES;
module.exports.createDocumentFileFilter = createDocumentFileFilter;
