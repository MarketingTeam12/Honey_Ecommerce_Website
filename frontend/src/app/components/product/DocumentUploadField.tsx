import { useId, useRef, useState } from 'react';
import { Check, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { Label } from '@/app/components/ui/label';
import {
  ALLOWED_DOCUMENT_EXTENSIONS,
  MAX_UPLOAD_SIZE_MB,
  validateDriveLink,
  validateUploadFiles,
} from '@/app/utils/documentUpload';

interface DocumentUploadFieldProps {
  files: File[];
  onFilesChange: (nextFiles: File[]) => void;
  driveLink?: string;
  onDriveLinkChange?: (nextLink: string) => void;
  driveLinkError?: string;
  onDriveLinkErrorChange?: (error: string) => void;
  showDriveLink?: boolean;
  label?: string;
}

/**
 * Shared multi-file document uploader with strict client type/size/duplicate checks,
 * native <progress> feedback, per-file removal, and optional restricted Drive link input.
 */
export function DocumentUploadField({
  files,
  onFilesChange,
  driveLink = '',
  onDriveLinkChange,
  driveLinkError = '',
  onDriveLinkErrorChange,
  showDriveLink = false,
  label = 'Upload your documents',
}: DocumentUploadFieldProps) {
  const inputId = useId();
  const driveId = useId();
  const driveErrorId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(files.length > 0 ? 100 : 0);
  const [isPreparing, setIsPreparing] = useState(false);
  const [uploadErrors, setUploadErrors] = useState<string[]>([]);

  const processIncomingFiles = async (incoming: File[]) => {
    if (incoming.length === 0) return;

    const outcome = validateUploadFiles(incoming, files);
    setUploadErrors(outcome.errors);

    outcome.errors.forEach((msg) => toast.error(msg));
    outcome.notices.forEach((msg) => toast.info(msg));

    if (outcome.accepted.length === 0) {
      return;
    }

    setIsPreparing(true);
    setUploadProgress(15);

    // Read file headers briefly to verify browser readability and report deterministic progress
    for (let index = 0; index < outcome.accepted.length; index += 1) {
      const file = outcome.accepted[index];
      await file.slice(0, Math.min(file.size, 65536)).arrayBuffer();
      const pct = Math.round(((index + 1) / outcome.accepted.length) * 100);
      setUploadProgress(pct);
    }

    setIsPreparing(false);
    setUploadProgress(100);
    onFilesChange([...files, ...outcome.accepted]);
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const incoming = Array.from(e.target.files || []);
    e.target.value = '';
    await processIncomingFiles(incoming);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const incoming = Array.from(e.dataTransfer.files || []);
    await processIncomingFiles(incoming);
  };

  const handleDriveBlur = () => {
    if (!onDriveLinkErrorChange) return;
    const result = validateDriveLink(driveLink);
    onDriveLinkErrorChange(result.valid ? '' : result.error || '');
  };

  return (
    <div className="space-y-3">
      <Label htmlFor={inputId} className="block font-semibold text-gray-900">
        {label} <span className="text-red-600">*</span>
      </Label>

      <div className="relative" onDragOver={handleDragOver} onDrop={handleDrop}>
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          multiple
          onChange={handleFileInput}
          className="sr-only"
          accept={ALLOWED_DOCUMENT_EXTENSIONS.join(',')}
        />
        <label
          htmlFor={inputId}
          className="flex flex-col items-center justify-center w-full min-h-[128px] px-4 py-4 transition bg-white border-2 border-gray-300 border-dashed rounded-lg cursor-pointer hover:border-[#1a1f5c]"
        >
          <Upload className="w-9 h-9 mb-2 text-gray-500" aria-hidden="true" />
          <p className="mb-1 text-sm md:text-base text-gray-700 text-center">
            Drag and drop or <span className="font-semibold text-[#1a1f5c] underline">click to upload</span>
          </p>
          <p className="text-xs md:text-sm text-gray-600 text-center">
            PDF, DOC, DOCX, JPG, PNG (Max {MAX_UPLOAD_SIZE_MB} MB per file)
          </p>
        </label>
      </div>

      {(isPreparing || files.length > 0) && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-gray-700">
            <span role="status" aria-live="polite">
              {isPreparing
                ? `Validating & preparing files (${uploadProgress}%)...`
                : `${files.length} file${files.length === 1 ? '' : 's'} ready (${uploadProgress}%)`}
            </span>
          </div>
          <progress
            value={uploadProgress}
            max={100}
            aria-label="Document upload preparation progress"
            className="w-full h-2 accent-[#1a1f5c] rounded overflow-hidden"
          />
        </div>
      )}

      {uploadErrors.length > 0 && (
        <div
          role="alert"
          className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-xs sm:text-sm text-red-800 space-y-1"
        >
          {uploadErrors.map((err, index) => (
            <p key={index}>{err}</p>
          ))}
        </div>
      )}

      {files.length > 0 && (
        <ul className="space-y-1.5" aria-label="Uploaded files">
          {files.map((file, idx) => (
            <li
              key={`${file.name}-${file.size}-${idx}`}
              className="text-sm text-gray-800 flex items-center justify-between gap-2 bg-gray-50 border border-gray-200 px-3 py-2 rounded-lg"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Check className="w-4 h-4 text-green-700 flex-shrink-0" aria-hidden="true" />
                <span className="truncate">
                  {file.name} ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  const next = files.filter((_, i) => i !== idx);
                  onFilesChange(next);
                  if (next.length === 0) setUploadProgress(0);
                }}
                aria-label={`Remove ${file.name}`}
                className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center p-2 text-red-700 hover:bg-red-50 rounded transition-colors flex-shrink-0"
                title={`Remove ${file.name}`}
              >
                <Trash2 className="w-4 h-4" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {showDriveLink && onDriveLinkChange && (
        <div className="pt-1">
          <Label htmlFor={driveId} className="mb-1.5 block text-sm md:text-base font-medium text-gray-800">
            Restricted Cloud Link (optional, for files over {MAX_UPLOAD_SIZE_MB} MB)
          </Label>
          <input
            id={driveId}
            type="url"
            value={driveLink}
            onChange={(e) => {
              onDriveLinkChange(e.target.value);
              if (driveLinkError && onDriveLinkErrorChange) {
                const recheck = validateDriveLink(e.target.value);
                if (recheck.valid) onDriveLinkErrorChange('');
              }
            }}
            onBlur={handleDriveBlur}
            aria-invalid={Boolean(driveLinkError)}
            aria-describedby={driveLinkError ? driveErrorId : undefined}
            placeholder="https://drive.google.com/... (Google Drive, OneDrive, Dropbox, or WeTransfer)"
            className={`w-full min-h-[44px] rounded-lg border px-3 py-2 text-sm md:text-base ${
              driveLinkError ? 'border-red-600' : 'border-gray-300'
            }`}
          />
          {driveLinkError && (
            <p id={driveErrorId} role="alert" className="mt-1 text-xs sm:text-sm text-red-700 font-medium">
              {driveLinkError}
            </p>
          )}
          <p className="mt-1 text-xs text-gray-600">
            For files over {MAX_UPLOAD_SIZE_MB} MB, use an <code className="font-mono">https://</code> link with{' '}
            <strong>password-protected or restricted access</strong> and share it{' '}
            <strong>only with Honey Translations</strong> (never set link sharing to public).
          </p>
        </div>
      )}
    </div>
  );
}
