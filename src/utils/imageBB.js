import axios from 'axios';
import FormData from 'form-data';

export const uploadToImageBB = async (fileBuffer) => {
  if (!process.env.IMGBB_API_KEY || process.env.IMGBB_API_KEY === 'your_imgbb_api_key_here') {
    throw new Error('ImageBB API Key is missing or not configured. Please add a valid IMGBB_API_KEY to your .env file.');
  }

  try {
    const formData = new FormData();
    formData.append('image', fileBuffer.toString('base64'));
    
    const response = await axios.post(`https://api.imgbb.com/1/upload?key=${process.env.IMGBB_API_KEY}`, formData, {
      headers: {
        ...formData.getHeaders(),
      },
    });

    if (response.data && response.data.success) {
      return response.data.data.url;
    } else {
      throw new Error(response.data?.message || 'Failed to upload image to ImageBB');
    }
  } catch (error) {
    const errorMessage = error.response?.data?.error?.message || error.message || 'Image upload failed';
    throw new Error(errorMessage);
  }
};
