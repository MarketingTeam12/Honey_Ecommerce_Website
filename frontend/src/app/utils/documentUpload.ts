export const MAX_UPLOAD_SIZE_MB = 50;
export const MAX_UPLOAD_SIZE_BYTES = MAX_UPLOAD_SIZE_MB * 1024 * 1024;

export const ALLOWED_DOCUMENT_EXTENSIONS = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'] as const;

const ALLOWED_DOCUMENT_MIME_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/jpg',
  'image/png',
]);

const ALLOWED_DRIVE_HOST_SUFFIXES = [
  'drive.google.com',
  'docs.google.com',
  'onedrive.live.com',
  '1drv.ms',
  'sharepoint.com',
  'dropbox.com',
  'dl.dropboxusercontent.com',
  'wetransfer.com',
  'we.tl',
];

export interface FileValidationOutcome {
  accepted: File[];
  errors: string[];
  notices: string[];
}

function getLowerExtension(fileName: string): string {
  const idx = fileName.lastIndexOf('.');
  return idx >= 0 ? fileName.slice(idx).toLowerCase() : '';
}

function formatFileSizeMb(bytes: number): string {
  return (bytes / (1024 * 1024)).toFixed(2);
}

function isAllowedType(file: File): boolean {
  const ext = getLowerExtension(file.name);
  if (!ALLOWED_DOCUMENT_EXTENSIONS.includes(ext as (typeof ALLOWED_DOCUMENT_EXTENSIONS)[number])) {
    return false;
  }
  // Some OS/browsers report empty MIME type for .doc/.docx; allow empty MIME only when extension is valid,
  // but reject explicitly mismatched dangerous MIMEs (e.g., text/html, image/svg+xml, application/x-msdownload).
  if (!file.type) {
    return true;
  }
  return ALLOWED_DOCUMENT_MIME_TYPES.has(file.type.toLowerCase());
}

function buildUniqueFile(file: File, usedNames: Set<string>): File {
  const lower = file.name.toLowerCase();
  if (!usedNames.has(lower)) {
    usedNames.add(lower);
    return file;
  }

  const ext = getLowerExtension(file.name);
  const stem = ext ? file.name.slice(0, -ext.length) : file.name;
  let counter = 2;
  let candidate = `${stem} (${counter})${ext}`;
  while (usedNames.has(candidate.toLowerCase())) {
    counter += 1;
    candidate = `${stem} (${counter})${ext}`;
  }
  usedNames.add(candidate.toLowerCase());
  return new File([file], candidate, { type: file.type, lastModified: file.lastModified });
}

/**
 * Validates selected/dropped customer documents against allowed types, the 50 MB limit,
 * and duplicate filenames/sizes.
 */
export function validateUploadFiles(
  incomingFiles: File[],
  existingFiles: File[] = [],
): FileValidationOutcome {
  const accepted: File[] = [];
  const errors: string[] = [];
  const notices: string[] = [];

  const exactSignatures = new Set(
    existingFiles.map((f) => `${f.name.toLowerCase()}::${f.size}`),
  );
  const usedNames = new Set(existingFiles.map((f) => f.name.toLowerCase()));

  for (const file of incomingFiles) {
    if (!isAllowedType(file)) {
      errors.push(
        `${file.name} is not a supported file type. Allowed formats: PDF, DOC, DOCX, JPG, PNG.`,
      );
      continue;
    }

    if (file.size > MAX_UPLOAD_SIZE_BYTES) {
      errors.push(
        `${file.name} (${formatFileSizeMb(file.size)} MB) exceeds the ${MAX_UPLOAD_SIZE_MB} MB limit. Please upload a restricted-access Drive link instead.`,
      );
      continue;
    }

    const signature = `${file.name.toLowerCase()}::${file.size}`;
    if (exactSignatures.has(signature)) {
      notices.push(`Skipped duplicate file "${file.name}".`);
      continue;
    }
    exactSignatures.add(signature);

    const uniqueFile = buildUniqueFile(file, usedNames);
    if (uniqueFile.name !== file.name) {
      notices.push(`Renamed duplicate filename "${file.name}" to "${uniqueFile.name}".`);
    }
    accepted.push(uniqueFile);
  }

  return { accepted, errors, notices };
}

/**
 * Validates that an optional external cloud link uses https:// and belongs to
 * a supported cloud transfer/storage provider (Google Drive, OneDrive, Dropbox, WeTransfer).
 */
export function validateDriveLink(rawUrl: string): { valid: boolean; error?: string } {
  const trimmed = String(rawUrl || '').trim();
  if (!trimmed) {
    return { valid: true };
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return {
      valid: false,
      error: 'Enter a valid https:// link from Google Drive, OneDrive, Dropbox, or WeTransfer.',
    };
  }

  if (parsed.protocol !== 'https:') {
    return {
      valid: false,
      error: 'Cloud link must start with https:// (secure link required).',
    };
  }

  const host = parsed.hostname.toLowerCase();
  const isAllowedProvider = ALLOWED_DRIVE_HOST_SUFFIXES.some(
    (suffix) => host === suffix || host.endsWith(`.${suffix}`),
  );

  if (!isAllowedProvider) {
    return {
      valid: false,
      error: 'Use an https:// link from Google Drive, OneDrive, Dropbox, or WeTransfer.',
    };
  }

  return { valid: true };
}
