import mongoose from 'mongoose';

const telegramAdminSchema = new mongoose.Schema({
  chatId: {
    type: String,
    required: true,
    unique: true
  },
  username: {
    type: String
  },
  firstName: {
    type: String
  },
  authorized: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

export default mongoose.model('TelegramAdmin', telegramAdminSchema);
