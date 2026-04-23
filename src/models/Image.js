import mongoose from 'mongoose';

const imageSchema = new mongoose.Schema({
  originalPath: {
    type: String,
    required: true
  },
  mobilePath: {
    type: String,
    required: false // Not all images will have a mobile version
  },
  laptopPath: {
    type: String,
    required: false // Not all images will have a laptop version
  },
  type: {
    type: String,
    enum: ['mobile', 'laptop', 'general'], // 'general' for images not specifically mobile or laptop
    default: 'general'
  },
  aspectRatio: {
    type: String,
    required: false // Will be '16:9' for mobile, '21:9' for laptop, or null/undefined for general
  },
  deleteUrl: {
    type: String,
    required: false // To store the delete URL from ImageBB
  }

}, { timestamps: true });

imageSchema.index({ createdAt: -1 });

export default mongoose.model('Image', imageSchema);
