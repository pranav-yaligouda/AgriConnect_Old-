import React, { useRef } from 'react';
import { Box, Typography, IconButton, Stack, Button, CircularProgress, Alert } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

interface ImageUploadProps {
  images: string[]; // Cloudinary URLs or object URLs for preview
  onImagesChange: (images: File[], previewUrls: string[]) => void;
  uploading: boolean;
  error?: string;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ images, onImagesChange, uploading, error }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const fileArr = Array.from(files);
    const previewUrls = fileArr.map(file => URL.createObjectURL(file));
    onImagesChange(fileArr, previewUrls);
    // Reset input so the same file can be selected again
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemove = (idx: number) => {
    // Parent should manage File[] and previewUrls
    // Here, just notify parent to remove at idx
    // (Parent should update state and revokeObjectURL as needed)
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
        onClick={() => fileInputRef.current?.click()}
      >
        Upload Images
        <input
          type="file"
          accept="image/*"
          multiple
          hidden
          ref={fileInputRef}
          onChange={handleInputChange}
        />
      </Button>
      {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
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
