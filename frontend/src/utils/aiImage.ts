import toast from 'react-hot-toast';
import { compressPhoto } from '../lib/progressPhotos';

// The API rejects JSON bodies over 5 MB and base64 adds a third, so a camera file sent as is gets a 413.
const MAX_BYTES = 3.5 * 1024 * 1024;

/** Shrinks a photo for the AI endpoints; a format the browser cannot decode is sent unchanged. */
export async function shrinkAiImage(file: File): Promise<Blob | null> {
  let image: Blob = file;
  try {
    image = await compressPhoto(file);
  } catch {
    /* Keep the original file. */
  }
  if (image.size > MAX_BYTES) {
    toast.error('La foto pesa demasiado. Prueba con otra o con una captura de pantalla.');
    return null;
  }
  return image;
}

/** Same as {@link shrinkAiImage}, as the data URL the composers preview and send. */
export async function readAiImage(file: File): Promise<string | null> {
  const image = await shrinkAiImage(file);
  if (!image) return null;
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(typeof reader.result === 'string' ? reader.result : null);
    reader.readAsDataURL(image);
  });
}
