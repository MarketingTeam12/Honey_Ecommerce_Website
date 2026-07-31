export interface ImageObjectLike {
  url?: string | null;
  alt?: string | null;
}

export type ImageSourceLike = string | ImageObjectLike | null | undefined;

export function normalizeImageSource(image: ImageSourceLike): string {
  if (typeof image === 'string') {
    return image.trim();
  }

  if (image && typeof image === 'object' && typeof image.url === 'string') {
    return image.url.trim();
  }

  return '';
}

export function getFirstValidImage(
  images: ImageSourceLike[] | null | undefined,
  fallback = '',
): string {
  if (!Array.isArray(images)) {
    return fallback;
  }

  for (const image of images) {
    const normalized = normalizeImageSource(image);
    if (normalized) {
      return normalized;
    }
  }

  return fallback;
}

export function normalizeProductImages(
  images: ImageSourceLike[] | null | undefined,
  fallbackAlt: string,
): Array<{ url: string; alt: string }> {
  if (!Array.isArray(images)) {
    return [];
  }

  return images
    .map((image) => {
      if (typeof image === 'string') {
        const normalized = image.trim();
        return normalized ? { url: normalized, alt: fallbackAlt } : null;
      }

      if (image && typeof image === 'object') {
        const normalized = normalizeImageSource(image);
        if (!normalized) {
          return null;
        }

        return {
          url: normalized,
          alt: image.alt?.trim() || fallbackAlt,
        };
      }

      return null;
    })
    .filter((image): image is { url: string; alt: string } => Boolean(image));
}
