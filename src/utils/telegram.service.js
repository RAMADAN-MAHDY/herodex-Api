import { Telegraf } from 'telegraf';
import { message } from 'telegraf/filters';
import TelegramAdmin from '../models/TelegramAdmin.js';

const botToken = process.env.TELEGRAM_BOT_TOKEN;
const adminPassword = process.env.TELEGRAM_ADMIN_PASSWORD || '123456789rR@';

if (!botToken) {
  console.warn('TELEGRAM_BOT_TOKEN is not defined in .env');
}

const bot = new Telegraf(botToken);

// Handle /start
bot.start(async (ctx) => {
  const chatId = ctx.chat.id.toString();
  
  await TelegramAdmin.findOneAndUpdate(
    { chatId },
    { 
      authorized: true, 
      username: ctx.from.username,
      firstName: ctx.from.first_name 
    },
    { upsert: true, returnDocument: 'after' }
  );

  console.log(`New Admin Registered: ${chatId}`);
  ctx.reply('مرحباً بك أيها المسؤول! تم تفعيل حسابك بنجاح لاستقبال إشعارات الطلبات. ✅\nستصلك هنا كافة تفاصيل الطلبات الجديدة فور حدوثها.');
});

export const initTelegramBot = (app) => {
  if (!botToken) {
    console.error('❌ TELEGRAM_BOT_TOKEN is missing! Bot cannot start.');
    return;
  }

  // Detect environment strictly
  const nodeEnv = (process.env.NODE_ENV || 'development').toLowerCase();
  const isVercel = process.env.VERCEL === '1' || !!process.env.VERCEL_URL;
  const isProduction = nodeEnv === 'production' && isVercel;

  console.log(`🤖 Bot Environment: NODE_ENV=${nodeEnv}, Vercel=${isVercel ? 'Yes' : 'No'}`);
  console.log(`🤖 Mode: ${isProduction ? 'PRODUCTION (Webhook)' : 'DEVELOPMENT (Polling)'}`);

  if (isProduction) {
    const webhookPath = `/api/telegram-webhook`;
    const backendUrl = process.env.BACKEND_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null);
    
    if (!backendUrl) {
      console.error('❌ BACKEND_URL or VERCEL_URL is missing! Webhook cannot be set.');
      return;
    }

    const webhookUrl = `${backendUrl}${webhookPath}`;
    
    app.post(webhookPath, (req, res) => {
      bot.handleUpdate(req.body, res);
    });

    bot.telegram.setWebhook(webhookUrl)
      .then(() => {
        console.log(`✅ Telegram Webhook successfully set to: ${webhookUrl}`);
      })
      .catch(err => {
        console.error('❌ Failed to set Telegram Webhook:', err.message);
      });
  } else {
    // Local development - Using deleteWebhook first to ensure switching from production works
    bot.telegram.deleteWebhook()
      .then(() => {
        return bot.launch();
      })
      .then(() => {
        console.log('🚀 Telegram Bot is running (Long Polling)...');
      })
      .catch(err => {
        console.error('❌ Failed to launch Telegram Bot (Local):', err.message);
      });
  }
};

export const sendOrderNotification = async (order) => {
  try {
    console.log(`Telegram Notification: Processing order ${order._id}...`);
    const admins = await TelegramAdmin.find({ authorized: true });
    
    if (admins.length === 0) {
      console.log('⚠️ No authorized Telegram admins found in database.');
      return;
    }

    console.log(`Admin(s) found: ${admins.length}. Sending messages...`);
    
    const message = `
🔔 *طلب جديد!*
--------------------------
🆔 *رقم الطلب:* \`${order._id}\`
👤 *العميل:* ${order.user?.name || order.guestName || 'زائر'}
📞 *رقم الهاتف:* \`${order.shippingAddress.phone}\`
💰 *المبلغ الإجمالي:* ${order.totalPrice} EGP
💳 *طريقة الدفع:* ${order.paymentMethod === 'wallet' ? '📱 محفظة إلكترونية' : order.paymentMethod === 'COD' ? '💵 دفع عند الاستلام' : '💳 بطاقة بنكية'}
📍 *العنوان:* ${order.shippingAddress.address}, ${order.shippingAddress.city}

📦 *المنتجات:*
${order.items.map(item => `- ${item.name} (${item.quantity} x ${item.price} EGP)`).join('\n')}

${order.paymentMethod === 'COD' ? '⏳ بانتظار التحصيل عند الاستلام.' : '✅ تمت عملية الدفع بنجاح.'}
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
