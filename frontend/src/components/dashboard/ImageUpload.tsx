import React from 'react';
import { Box, Typography, IconButton, Stack, Button } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

interface ImageUploadProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  uploading: boolean;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ images, onImagesChange, uploading }) => {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const readers = Array.from(files).map(file => {
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    });
    Promise.all(readers).then(base64Images => {
      onImagesChange([...images, ...base64Images]);
    });
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
          accept="image/*"
          multiple
          hidden
          onChange={handleInputChange}
        />
      </Button>
      <Stack direction="row" spacing={2} sx={{ mt: 2, overflowX: 'auto' }}>
        {images.map((img, idx) => (
          <Box key={img} sx={{ position: 'relative' }}>
            <Box component="img" src={img} sx={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 1, border: '1px solid', borderColor: 'divider' }} />
            <IconButton onClick={() => {
              const updated = [...images];
              updated.splice(idx, 1);
              onImagesChange(updated);
            }} sx={{ position: 'absolute', top: 4, right: 4, bgcolor: 'background.paper', color: 'error.main' }} size="small">
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Box>
        ))}
      </Stack>
    </Box>
  );
};

export default ImageUpload;
