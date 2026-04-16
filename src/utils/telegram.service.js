import { Telegraf } from 'telegraf';
import { message } from 'telegraf/filters';
import TelegramAdmin from '../models/TelegramAdmin.js';

const botToken = process.env.TELEGRAM_BOT_TOKEN;
const adminPassword = process.env.TELEGRAM_ADMIN_PASSWORD || 'admin123';

if (!botToken) {
  console.warn('TELEGRAM_BOT_TOKEN is not defined in .env');
}

const bot = new Telegraf(botToken);

// Handle /start
bot.start(async (ctx) => {
  const chatId = ctx.chat.id.toString();
  const admin = await TelegramAdmin.findOne({ chatId });

  if (admin && admin.authorized) {
    return ctx.reply('مرحباً بك مجدداً أيها المسؤول! أنت مسجل بالفعل وتستقبل الطلبات.');
  }

  ctx.reply('مرحباً بك في بوت إدارة Herodex. من فضلك أدخل كلمة المرور للتسجيل وتلقي إشعارات الطلبات.');
});

// Handle password input
bot.on(message('text'), async (ctx) => {
  const chatId = ctx.chat.id.toString();
  const text = ctx.message.text;

  // If message starts with /, don't process as password
  if (text.startsWith('/')) return;

  const admin = await TelegramAdmin.findOne({ chatId });

  if (admin && admin.authorized) {
    // Admin is already authorized, we can add a simple help message or just ignore
    return;
  }

  if (text === adminPassword) {
    await TelegramAdmin.findOneAndUpdate(
      { chatId },
      { 
        authorized: true, 
        username: ctx.from.username,
        firstName: ctx.from.first_name 
      },
      { upsert: true, new: true }
    );
    ctx.reply('تم التحقق بنجاح! ✅\nستصلك إشعارات الطلبات هنا فور حدوثها.');
  } else {
    ctx.reply('❌ كلمة المرور غير صحيحة. من فضلك حاول مرة أخرى.');
  }
});

export const initTelegramBot = (app) => {
  if (!botToken) return;

  if (process.env.NODE_ENV === 'production') {
    const webhookPath = `/api/telegram-webhook`;
    const webhookUrl = `${process.env.BACKEND_URL}${webhookPath}`;
    
    app.post(webhookPath, (req, res) => {
      bot.handleUpdate(req.body, res);
    });

    bot.telegram.setWebhook(webhookUrl)
      .then(() => console.log(`🚀 Telegram Webhook set to: ${webhookUrl}`))
      .catch(err => console.error('Failed to set Telegram Webhook:', err));
  } else {
    bot.launch()
      .then(() => console.log('🚀 Telegram Bot is running (Long Polling)...'))
      .catch(err => console.error('Failed to launch Telegram Bot:', err));
  }
};

export const sendOrderNotification = async (order) => {
  try {
    const admins = await TelegramAdmin.find({ authorized: true });
    if (admins.length === 0) {
      console.log('No authorized Telegram admins found to notify.');
      return;
    }

    const message = `
🔔 *طلب جديد ناجح!*
--------------------------
🆔 *رقم الطلب:* \`${order._id}\`
👤 *العميل:* ${order.user?.name || 'مستخدم غير معروف'}
📞 *رقم الهاتف:* \`${order.shippingAddress.phone}\`
💰 *المبلغ الإجمالي:* ${order.totalPrice} EGP
💳 *طريقة الدفع:* ${order.paymentMethod === 'wallet' ? '📱 محفظة إلكترونية' : '💳 بطاقة بنكية'}
📍 *العنوان:* ${order.shippingAddress.address}, ${order.shippingAddress.city}

📦 *المنتجات:*
${order.items.map(item => `- ${item.name} (${item.quantity} x ${item.price} EGP)`).join('\n')}

✅ تمت عملية الدفع بنجاح.
    `;

    for (const admin of admins) {
      try {
        await bot.telegram.sendMessage(admin.chatId, message, { parse_mode: 'Markdown' });
      } catch (error) {
        console.error(`Failed to send message to admin ${admin.chatId}:`, error.message);
      }
    }
  } catch (error) {
    console.error('Error in sendOrderNotification:', error);
  }
};

export default { initTelegramBot, sendOrderNotification };
