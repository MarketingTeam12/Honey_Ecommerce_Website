const express = require("express");
const upload = require("../middleware/upload");
const {
  buildFileUrl,
  deleteObjectByKey,
  extractKeyFromUrl,
  getRedirectUrl,
  uploadFileFromRequest,
} = require("../services/s3Service");
const { isS3Configured, getBucketName } = require("../config/s3");

const router = express.Router();

router.get("/health", (req, res) => {
  res.json({
    success: true,
    configured: isS3Configured(),
    bucket: process.env.AWS_S3_BUCKET_NAME || null,
    region: process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || null,
  });
});

router.post("/upload", upload.single("file"), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    const uploaded = await uploadFileFromRequest(req, req.file, req.body?.folder || "uploads");

    res.json({
      success: true,
      key: uploaded.key,
      url: uploaded.url,
      objectUrl: uploaded.url,
      bucket: isS3Configured() ? getBucketName() : null,
    });
  } catch (error) {
    next(error);
  }
});

router.post("/upload-multiple", upload.array("files", 20), async (req, res, next) => {
  try {
    const files = Array.isArray(req.files) ? req.files : [];
    const uploads = await Promise.all(
      files.map((file) => uploadFileFromRequest(req, file, req.body?.folder || "uploads")),
    );

    res.json({
      success: true,
      files: uploads.map((file) => ({
        key: file.key,
        url: file.url,
      })),
    });
  } catch (error) {
    next(error);
  }
});

router.get("/files/:key", async (req, res, next) => {
  try {
    const key = decodeURIComponent(req.params.key || "");
    if (!key) {
      return res.status(400).json({ success: false, message: "File key is required" });
    }

    const signedUrl = await getRedirectUrl(key);
    return res.redirect(signedUrl);
  } catch (error) {
    next(error);
  }
});

router.delete("/files", async (req, res, next) => {
  try {
    const key = extractKeyFromUrl(req.body?.key || req.body?.url || req.query?.key || req.query?.url);
    if (!key) {
      return res.status(400).json({ success: false, message: "File key is required" });
    }

    await deleteObjectByKey(key);
    res.json({ success: true, deletedKey: key });
  } catch (error) {
    next(error);
  }
});

router.get("/proxy", async (req, res, next) => {
  try {
    const key = extractKeyFromUrl(req.query?.key || req.query?.url);
    if (!key) {
      return res.status(400).json({ success: false, message: "File key is required" });
    }

    const signedUrl = await getRedirectUrl(key);
    return res.redirect(signedUrl);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
