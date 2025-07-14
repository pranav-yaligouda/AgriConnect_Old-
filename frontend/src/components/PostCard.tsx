import React from "react";
import { Card, CardHeader, CardContent, CardMedia, Typography, IconButton, Box } from "@mui/material";
import FavoriteIcon from "@mui/icons-material/Favorite";
import ImageWithFallback from './ImageWithFallback';
import BookmarkIcon from "@mui/icons-material/Bookmark";

const fallbackImg = '/product-placeholder.jpg';

interface PostCardProps {
  post: any; // Replace 'any' with a specific Post type if available
  userId?: string; // Current logged-in user ID
  onDelete?: (postId: string) => void; // Callback after delete
}

import DeleteIcon from "@mui/icons-material/Delete";
import api from "../utils/axiosConfig";


const PostCard: React.FC<PostCardProps> = ({ post, userId, onDelete }) => {
  const [imgError, setImgError] = React.useState(false);
  return (
    <Card
      sx={{
        mb: 3,
        boxShadow: 3,
        borderRadius: 3,
        transition: 'box-shadow 0.2s',
        ':hover': { boxShadow: 8 },
        maxWidth: 600,
        mx: 'auto',
        width: '100%'
      }}
    >
      <CardHeader
        title={post.user?.name || "User"}
        subheader={new Date(post.createdAt).toLocaleString()}
        action={
          userId && post.user && post.user._id === userId && onDelete && (
            <IconButton aria-label="delete" onClick={async (e) => {
              e.stopPropagation();
              if (!window.confirm("Delete this post?")) return;
              try {
                await api.delete(`/posts/${post._id}`);
                onDelete(post._id);
              } catch (err: any) {
                alert(err?.response?.data?.message || "Failed to delete post");
              }
            }}>
              <DeleteIcon color="error" />
            </IconButton>
          )
        }
      />
      {(post.images && post.images.length > 0 && post.images[0]) || (post.media && post.media.length > 0 && post.media[0].url) ? (
        <Box>
          <ImageWithFallback
            src={(() => {
              const img = post.images && post.images.length > 0 && post.images[0]
                ? post.images[0]
                : post.media && post.media.length > 0 && post.media[0].url
                  ? post.media[0].url
                  : fallbackImg;
              if (typeof img === 'string' && img.startsWith('/uploads/')) {
                return import.meta.env.VITE_API_BASE_URL + img;
              }
              return img;
            })()}
            fallbackSrc="/product-placeholder.jpg"
            alt="Post media"
            style={{ objectFit: 'cover', width: '100%', borderRadius: 2, height: 300 }}
          />
        </Box>
      ) : null}
      <CardContent>
        <Typography variant="body1" gutterBottom>{post.caption}</Typography>
        <Box sx={{ display: "flex", gap: 2 }}>
          <IconButton color={post.liked ? "primary" : "default"}><FavoriteIcon /></IconButton>
          <IconButton color={post.saved ? "primary" : "default"}><BookmarkIcon /></IconButton>
        </Box>
      </CardContent>
    </Card>
  );
};

export default PostCard;
