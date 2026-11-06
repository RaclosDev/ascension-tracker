import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';

/** Mirrors the backend ProgressPhotoDtos records. */
export type Pose = 'FRONT' | 'SIDE' | 'BACK';

export interface ProgressPhoto {
  id: string;
  pose: Pose;
  takenOn: string;
  /** Signed and short-lived: refetch the list for a fresh one. */
  url: string;
  sizeBytes: number;
  createdAt: string;
}

export interface PhotoList {
  /** false while the server has no photo storage configured. */
  enabled: boolean;
  photos: ProgressPhoto[];
}

export const POSE_LABELS: Record<Pose, string> = {
  FRONT: 'Frente',
  SIDE: 'Perfil',
  BACK: 'Espalda',
};
export const POSES = Object.keys(POSE_LABELS) as Pose[];

/** Longest side after shrinking: sharp enough to compare, small enough to stay around 200–400 KB. */
const MAX_SIDE = 1600;
const QUALITY = 0.8;
// The signed URLs last 15 minutes; refresh a little before.
const URL_REFRESH_MS = 12 * 60 * 1000;

const keys = { mine: ['progress-photos'] as const };

/** Scales (width, height) so the longest side is at most {@link MAX_SIDE}, never enlarging. */
export function fitWithin(width: number, height: number, max = MAX_SIDE) {
  const scale = Math.min(1, max / Math.max(width, height));
  return { width: Math.round(width * scale), height: Math.round(height * scale) };
}

/**
 * Shrinks a photo on the phone and re-encodes it as WebP (JPEG where the browser cannot write WebP).
 * Redrawing on a canvas also drops the EXIF data, location included.
 */
export async function compressPhoto(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  try {
    const { width, height } = fitWithin(bitmap.width, bitmap.height);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('canvas');
    ctx.drawImage(bitmap, 0, 0, width, height);
    const webp = await toBlob(canvas, 'image/webp');
    if (webp?.type === 'image/webp') return webp;
    const jpeg = await toBlob(canvas, 'image/jpeg');
    if (!jpeg) throw new Error('encode');
    return jpeg;
  } finally {
    bitmap.close();
  }
}

const toBlob = (canvas: HTMLCanvasElement, type: string) =>
  new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, QUALITY));

export const useMyPhotos = () =>
  useQuery({
    queryKey: keys.mine,
    refetchInterval: URL_REFRESH_MS,
    queryFn: async () => (await api.get<PhotoList>('/progress-photos')).data,
  });

export function useUploadPhoto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ blob, pose, takenOn }: { blob: Blob; pose: Pose; takenOn: string }) => {
      const form = new FormData();
      form.append('file', blob, blob.type === 'image/webp' ? 'photo.webp' : 'photo.jpg');
      form.append('pose', pose);
      form.append('takenOn', takenOn);
      return (
        await api.post<ProgressPhoto>('/progress-photos', form, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      ).data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.mine }),
  });
}

export function useDeletePhoto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/progress-photos/${encodeURIComponent(id)}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.mine }),
  });
}

/** Photos grouped by day, newest day first; the list already comes sorted. */
export function groupByDay(photos: ProgressPhoto[]) {
  const days: { takenOn: string; photos: ProgressPhoto[] }[] = [];
  for (const photo of photos) {
    const last = days[days.length - 1];
    if (last?.takenOn === photo.takenOn) last.photos.push(photo);
    else days.push({ takenOn: photo.takenOn, photos: [photo] });
  }
  for (const day of days) {
    day.photos.sort((a, b) => POSES.indexOf(a.pose) - POSES.indexOf(b.pose));
  }
  return days;
}
