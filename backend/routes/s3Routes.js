const express = require("express");
const upload = require("../middleware/upload");
const { requireAuth } = require("../middleware/auth");
const userService = require("../services/userService");
const {
  deleteObjectByKey,
  extractKeyFromUrl,
  getRedirectUrl,
  uploadFileFromRequest,
} = require("../services/s3Service");
const { isS3Configured, getBucketName } = require("../config/s3");

const router = express.Router();

const SIGNED_URL_TTL_SECONDS = 300;

function sanitizeFolderForUser(requestedFolder, userId, admin) {
  const raw = String(requestedFolder || "documents").trim().replace(/^\/+|\/+$/g, "");
  if (admin) {
    return raw || "uploads";
  }
  // Scope customer uploads under documents/<userId> so documents remain private per account.
  return `documents/${encodeURIComponent(String(userId))}`;
}

async function authorizeObjectAccess(user, key, requireOwnershipForPublic = false) {
  if (!user) return false;
  if (await userService.isAdmin(user)) return true;

  const normalizedKey = String(key || "").replace(/^\/+/, "");
  const userPrefix = `documents/${encodeURIComponent(String(user.id))}/`;
  const altPrefix = `uploads/${encodeURIComponent(String(user.id))}/`;
  if (normalizedKey.startsWith(userPrefix) || normalizedKey.startsWith(altPrefix)) {
    return true;
  }

  if (!requireOwnershipForPublic) {
    return false;
  }
  return false;
}

router.get("/health", (req, res) => {
  res.json({
    success: true,
    configured: isS3Configured(),
    bucket: process.env.AWS_S3_BUCKET_NAME || null,
    region: process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || null,
  });
});

router.post("/upload", requireAuth, upload.single("file"), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    const admin = await userService.isAdmin(req.user);
    const folder = sanitizeFolderForUser(req.body?.folder, req.user.id, admin);
    const uploaded = await uploadFileFromRequest(req, req.file, folder);

    res.json({
      success: true,
      key: uploaded.key,
      signedUrlEndpoint: `/api/s3/signed-url?key=${encodeURIComponent(uploaded.key)}`,
      bucket: isS3Configured() ? getBucketName() : null,
      private: true,
    });
  } catch (error) {
    next(error);
  }
});

router.post("/upload-multiple", requireAuth, upload.array("files", 20), async (req, res, next) => {
  try {
    const files = Array.isArray(req.files) ? req.files : [];
    const admin = await userService.isAdmin(req.user);
    const folder = sanitizeFolderForUser(req.body?.folder, req.user.id, admin);
    const uploads = await Promise.all(
      files.map((file) => uploadFileFromRequest(req, file, folder)),
    );

    res.json({
      success: true,
      files: uploads.map((file) => ({
        key: file.key,
        signedUrlEndpoint: `/api/s3/signed-url?key=${encodeURIComponent(file.key)}`,
        private: true,
      })),
    });
  } catch (error) {
    next(error);
  }
});

router.get("/signed-url", requireAuth, async (req, res, next) => {
  try {
    const key = extractKeyFromUrl(req.query?.key || req.query?.url);
    if (!key) {
      return res.status(400).json({ success: false, message: "File key is required" });
    }

    if (!(await authorizeObjectAccess(req.user, key))) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    const signedUrl = await getRedirectUrl(key, SIGNED_URL_TTL_SECONDS);
    return res.json({
      success: true,
      key,
      signedUrl,
      expiresIn: SIGNED_URL_TTL_SECONDS,
    });
  } catch (error) {
    next(error);
  }
});

router.get("/files/:key", requireAuth, async (req, res, next) => {
  try {
    const key = decodeURIComponent(req.params.key || "");
    if (!key) {
      return res.status(400).json({ success: false, message: "File key is required" });
    }

    if (!(await authorizeObjectAccess(req.user, key))) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    const signedUrl = await getRedirectUrl(key, SIGNED_URL_TTL_SECONDS);
    return res.redirect(signedUrl);
  } catch (error) {
    next(error);
  }
});

router.delete("/files", requireAuth, async (req, res, next) => {
  try {
    const key = extractKeyFromUrl(req.body?.key || req.body?.url || req.query?.key || req.query?.url);
    if (!key) {
      return res.status(400).json({ success: false, message: "File key is required" });
    }

    if (!(await authorizeObjectAccess(req.user, key, true))) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    await deleteObjectByKey(key);
    res.json({ success: true, deletedKey: key });
  } catch (error) {
    next(error);
  }
});

router.get("/proxy", requireAuth, async (req, res, next) => {
  try {
    const key = extractKeyFromUrl(req.query?.key || req.query?.url);
    if (!key) {
      return res.status(400).json({ success: false, message: "File key is required" });
    }

    if (!(await authorizeObjectAccess(req.user, key))) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    const signedUrl = await getRedirectUrl(key, SIGNED_URL_TTL_SECONDS);
    return res.redirect(signedUrl);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
