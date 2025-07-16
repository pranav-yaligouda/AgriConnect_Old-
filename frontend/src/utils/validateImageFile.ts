import imageType from 'image-type';

export async function isValidImageFile(file: File): Promise<{ valid: boolean; reason?: string }> {
  const allowed = ['image/jpeg', 'image/png'];
  const arrayBuffer = await file.arrayBuffer();
  const type = await imageType(new Uint8Array(arrayBuffer));
  if (!type) return { valid: false, reason: 'Unknown or unsupported file type.' };
  if (!allowed.includes(type.mime)) {
    return { valid: false, reason: 'Invalid image type. Only JPEG and PNG are allowed.' };
  }
  return { valid: true };
}