import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: { type: String },
  image: { type: String, required: true },
  deleteUrl: { type: String, required: false }
}, { timestamps: true });

export default mongoose.model('Category', categorySchema);
