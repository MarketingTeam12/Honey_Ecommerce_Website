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

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function uploadFile(file: File, path: string) {
  try {
    const formData = new FormData();
    formData.append('file', file, path || file.name);

    const response = await fetch(`${API_URL}/api/s3/upload`, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();
    if (!response.ok) {
      return { success: false, error: data.error || data.message || 'Upload failed' };
    }

    return { success: true, data: { path: data.url || data.imageUrl || data.objectUrl } };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getSignedUrl(filePath: string) {
  if (!filePath) {
    return { success: false, error: 'File path is required' };
  }

  if (/^https?:\/\//i.test(filePath)) {
    return { success: true, url: filePath };
  }

  return {
    success: true,
    url: `${API_URL}/api/s3/proxy?key=${encodeURIComponent(filePath)}`,
  };
}

export async function deleteFile(filePath: string) {
  try {
    const response = await fetch(`${API_URL}/api/s3/files`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: filePath }),
    });

    if (!response.ok) {
      return { success: false, error: await response.text() };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
