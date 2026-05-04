import mongoose from 'mongoose';

const shippingRateSchema = new mongoose.Schema({
  governorate: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  cost: {
    type: Number,
    required: true,
    min: 0,
  },
  time: {
    type: String,
    required: true,
    trim: true,
  },
}, { timestamps: true });

export default mongoose.model('ShippingRate', shippingRateSchema);
