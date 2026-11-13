import { API_URL } from '@/app/utils/api';

export async function initializeStorageBucket() {
  try {
    const response = await fetch(`${API_URL}/admin/initialize-storage`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      return { success: false, error: await response.text() };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function uploadFile(file: File, path: string, folder = 'documents') {
  try {
    const formData = new FormData();
    formData.append('folder', folder);
    formData.append('file', file, path || file.name);

    const response = await fetch(`${API_URL}/api/s3/upload`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    const data = await response.json();
    if (!response.ok) {
      return { success: false, error: data.error || data.message || 'Upload failed' };
    }

    return {
      success: true,
      data: {
        key: data.key,
        path: data.key,
        signedUrlEndpoint: data.signedUrlEndpoint,
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getSignedUrl(fileKeyOrPath: string) {
  if (!fileKeyOrPath) {
    return { success: false, error: 'File key is required' };
  }

  try {
    const response = await fetch(
      `${API_URL}/api/s3/signed-url?key=${encodeURIComponent(fileKeyOrPath)}`,
      { credentials: 'include' },
    );
    const data = await response.json();
    if (!response.ok || !data?.signedUrl) {
      return { success: false, error: data?.message || 'Unable to generate signed URL' };
    }
    return {
      success: true,
      url: data.signedUrl as string,
      expiresIn: data.expiresIn as number,
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteFile(filePath: string) {
  try {
    const response = await fetch(`${API_URL}/api/s3/files`, {
      method: 'DELETE',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: filePath }),
    });

    if (!response.ok) {
      return { success: false, error: await response.text() };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
