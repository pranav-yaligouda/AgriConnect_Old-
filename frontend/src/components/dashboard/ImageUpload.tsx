import React, { useRef, useState } from 'react';
import { Box, Typography, IconButton, Stack, Button, CircularProgress, Alert } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { useNotification } from '../../contexts/NotificationContext';
import { isValidImageFile } from '../../utils/validateImageFile';
import { readAndCompressImage } from 'browser-image-resizer';

interface ImageUploadProps {
  images: string[]; // Cloudinary URLs or object URLs for preview
  onImagesChange: (images: File[], previewUrls: string[]) => void;
  uploading: boolean;
  error?: string;
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/jpg'];
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png'];
const INVALID_TYPE_MSG = 'Only JPG and PNG images are allowed.';

const PRODUCT_RESIZE_CONFIG = {
  quality: 0.9,
  maxWidth: 1200,
  maxHeight: 1200,
  autoRotate: true,
  debug: false,
};

const ImageUpload: React.FC<ImageUploadProps> = ({ images, onImagesChange, uploading, error }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const { notify } = useNotification();

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    let files = Array.from(e.target.files || []);
    if (files.length > 3) files = files.slice(0, 3);
    const resizedFiles: File[] = [];
    const previewUrls: string[] = [];
    for (const file of files) {
      const { valid, reason } = await isValidImageFile(file);
      if (!valid) {
        setLocalError(reason || 'Invalid image file.');
        notify(reason || 'Invalid image file.', 'error');
        return;
      }
      try {
        const resized = await readAndCompressImage(file, PRODUCT_RESIZE_CONFIG);
        resizedFiles.push(resized);
        previewUrls.push(URL.createObjectURL(resized));
      } catch (err) {
        setLocalError('Failed to resize image.');
        notify('Failed to resize image.', 'error');
        return;
      }
    }
    setLocalError(null);
    onImagesChange(resizedFiles, previewUrls);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Clear local error if user removes all images or tries a new valid upload
  React.useEffect(() => {
    if (images.length === 0 && localError) {
      setLocalError(null);
    }
  }, [images, localError]);

  const handleRemove = (idx: number) => {
    onImagesChange(
      images.filter((_, i) => i !== idx) as any, // parent should handle File[]
      images.filter((_, i) => i !== idx)
    );
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Button
        variant="outlined"
        component="label"
        disabled={uploading}
      >
        Upload Images
        <input
          type="file"
          accept=".jpg,.jpeg,.png,image/jpeg,image/png"
          multiple
          hidden
          ref={fileInputRef}
          onChange={handleInputChange}
        />
      </Button>
      {(error || localError) && <Alert severity="error" sx={{ mt: 2 }}>{localError || error}</Alert>}
      <Stack direction="row" spacing={2} sx={{ mt: 2, overflowX: 'auto' }}>
        {images.map((img, idx) => (
          <Box key={img + idx} sx={{ position: 'relative' }}>
            <Box component="img" src={img} sx={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 1, border: '1px solid', borderColor: 'divider' }} />
            <IconButton onClick={() => handleRemove(idx)} sx={{ position: 'absolute', top: 4, right: 4, bgcolor: 'background.paper', color: 'error.main' }} size="small">
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Box>
        ))}
        {uploading && <CircularProgress size={32} sx={{ alignSelf: 'center' }} />}
      </Stack>
    </Box>
  );
};

export default ImageUpload;
