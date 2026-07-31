import { API_URL } from '@/app/utils/api';

export async function initializeStorageBucket() {
  try {
    const response = await fetch(`${API_URL}/admin/initialize-storage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      return { success: false, error: await response.text() };
    }

    const result = await response.json();
    return { success: result.success || true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

function dataUrlToFile(dataUrl: string): File {
  const matches = dataUrl.match(/^data:(.+);base64,(.+)$/);
  if (!matches) {
    throw new Error('Invalid base64 data URL');
  }

  const mimeType = matches[1];
  const base64Data = matches[2];
  const binaryString = atob(base64Data);
  const bytes = new Uint8Array(binaryString.length);

  for (let index = 0; index < binaryString.length; index += 1) {
    bytes[index] = binaryString.charCodeAt(index);
  }

  const extension = mimeType.split('/')[1] || 'bin';
  return new File([new Blob([bytes], { type: mimeType })], `image.${extension}`, { type: mimeType });
}

export async function uploadImage(file: File | string): Promise<string> {
  const fileToUpload = typeof file === 'string' ? dataUrlToFile(file) : file;
  const formData = new FormData();
  formData.append('file', fileToUpload);

  const response = await fetch(`${API_URL}/api/s3/upload`, {
    method: 'POST',
    body: formData,
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.error || result.message || 'Upload failed');
  }

  return result.url || result.imageUrl || result.objectUrl;
}

export async function deleteProductImage(imageUrl: string): Promise<boolean> {
  const response = await fetch(`${API_URL}/api/s3/files`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: imageUrl }),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || 'Failed to delete S3 object');
  }

  return true;
}

export async function uploadMultipleImages(files: (File | string)[]): Promise<string[]> {
  return Promise.all(files.map((file) => uploadImage(file)));
}
