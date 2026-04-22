import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  imageUrl: { type: String, required: true },
  deleteUrl: { type: String, required: false }
}, { timestamps: true });

export default mongoose.model('Review', reviewSchema);
