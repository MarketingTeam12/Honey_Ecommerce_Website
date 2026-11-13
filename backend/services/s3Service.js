const crypto = require("crypto");
const path = require("path");
const {
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { s3Client, getBucketName, isS3Configured } = require("../config/s3");

function sanitizeSegment(value) {
  return String(value || "")
    .trim()
    .replace(/[^a-zA-Z0-9._/-]+/g, "-")
    .replace(/\/+/g, "/")
    .replace(/^-+|-+$/g, "");
}

function getFileExtension(fileName = "", mimeType = "") {
  const ext = path.extname(fileName);
  if (ext) return ext.toLowerCase();

  const mimeToExt = {
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
    "application/pdf": ".pdf",
    "application/msword": ".doc",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
    "text/plain": ".txt",
  };

  return mimeToExt[String(mimeType || "").toLowerCase()] || "";
}

function buildObjectKey(originalName, folder = "uploads") {
  const cleanFolder = sanitizeSegment(folder) || "uploads";
  const ext = getFileExtension(originalName);
  const baseName = sanitizeSegment(path.basename(originalName, path.extname(originalName))) || "file";
  const unique = `${Date.now()}-${crypto.randomBytes(8).toString("hex")}`;
  return `${cleanFolder}/${unique}-${baseName}${ext}`;
}

function buildFileUrl(req, key) {
  return `/api/s3/signed-url?key=${encodeURIComponent(key)}`;
}

function extractKeyFromUrl(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";

  try {
    const parsed = new URL(raw);
    const queryKey = parsed.searchParams.get("key");
    if (queryKey) {
      return decodeURIComponent(queryKey);
    }

    if (parsed.pathname.includes("/api/s3/files/")) {
      return decodeURIComponent(parsed.pathname.split("/api/s3/files/")[1] || "");
    }

    const parts = parsed.pathname.split("/").filter(Boolean);
    return parts.slice(1).join("/");
  } catch {
    return raw;
  }
}

async function uploadBuffer({ buffer, originalName, mimeType, folder = "uploads" }) {
  if (!isS3Configured()) {
    throw new Error("AWS S3 is not configured");
  }

  const key = buildObjectKey(originalName, folder);
  const command = new PutObjectCommand({
    Bucket: getBucketName(),
    Key: key,
    Body: buffer,
    ContentType: mimeType || "application/octet-stream",
    CacheControl: "private, no-cache, no-store, must-revalidate",
    ServerSideEncryption: "AES256",
  });

  await s3Client.send(command);
  return { key };
}

async function uploadFileFromRequest(req, file, folder = "uploads") {
  const result = await uploadBuffer({
    buffer: file.buffer,
    originalName: file.originalname || file.name || "file",
    mimeType: file.mimetype || file.type,
    folder,
  });

  return {
    ...result,
    url: buildFileUrl(req, result.key),
  };
}

async function deleteObjectByKey(key) {
  if (!isS3Configured() || !key) return false;

  await s3Client.send(new DeleteObjectCommand({
    Bucket: getBucketName(),
    Key: key,
  }));

  return true;
}

async function getRedirectUrl(key, expiresInSeconds = 300) {
  if (!isS3Configured() || !key) {
    throw new Error("AWS S3 is not configured");
  }

  const command = new GetObjectCommand({
    Bucket: getBucketName(),
    Key: key,
  });

  return getSignedUrl(s3Client, command, {
    expiresIn: expiresInSeconds,
  });
}

module.exports = {
  sanitizeSegment,
  buildObjectKey,
  buildFileUrl,
  extractKeyFromUrl,
  uploadBuffer,
  uploadFileFromRequest,
  deleteObjectByKey,
  getRedirectUrl,
};
