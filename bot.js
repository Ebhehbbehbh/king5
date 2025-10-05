const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const moment = require('moment');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// ════════════════════════════════════════════════════
// ███  ضع معلومات البوت هنا  ███
const BOT_TOKEN = process.env.BOT_TOKEN || '8209265822:AAHY3qWox6vmKvv4Er8RSy_gsV2_o8MrK6E';
const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID || '7604667042';
const PORT = process.env.PORT || 3000;
// ██████████████████████████████████████████████████

const bot = new TelegramBot(BOT_TOKEN, { polling: true });
let botStats = {
  startTime: new Date(),
  totalUsers: 0,
  totalMessages: 0
};
let connectedUsers = new Map();

// إعدادات السيرفر
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/api/stats', (req, res) => {
  res.json({
    uptime: moment(botStats.startTime).fromNow(),
    totalUsers: botStats.totalUsers,
    totalMessages: botStats.totalMessages,
    activeUsers: connectedUsers.size
  });
});

// أوامر البوت
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const userName = msg.from.first_name;
  
  if (!connectedUsers.has(chatId)) {
    connectedUsers.set(chatId, {
      id: chatId,
      name: userName,
      joinDate: new Date(),
      messageCount: 0
    });
    botStats.totalUsers++;
  }

  botStats.totalMessages++;

  const welcomeMsg = `🎉 أهلاً بك ${userName}!

🤖 *البوت الاحترافي*

📊 *الأوامر المتاحة:*
/start - بدء البوت
/help - المساعدة  
/stats - الإحصائيات

🌐 *لوحة التحكم:*
رابط الإدارة: https://king5-bot.onrender.com`;

  bot.sendMessage(chatId, welcomeMsg, { parse_mode: 'Markdown' });
  
  io.emit('userUpdate', {
    users: Array.from(connectedUsers.values()),
    stats: botStats
  });
});

bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;
  botStats.totalMessages++;

  const helpMsg = `📖 *دليل الأوامر*

/start - بدء البوت والترحيب
/help - عرض المساعدة
/stats - إحصائيات البوت

⚡ البوت يعمل بكفاءة!`;

  bot.sendMessage(chatId, helpMsg, { parse_mode: 'Markdown' });
});

bot.onText(/\/stats/, (msg) => {
  const chatId = msg.chat.id;
  botStats.totalMessages++;

  const statsMsg = `📊 *إحصائيات البوت*

👥 المستخدمين: ${botStats.totalUsers}
💬 الرسائل: ${botStats.totalMessages}
🕐 التشغيل: ${moment(botStats.startTime).fromNow()}
⚡ البوت نشط!`;

  bot.sendMessage(chatId, statsMsg, { parse_mode: 'Markdown' });
});

// معالجة الرسائل العادية
bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  
  if (msg.text && !msg.text.startsWith('/')) {
    botStats.totalMessages++;
    
    if (connectedUsers.has(chatId)) {
      const user = connectedUsers.get(chatId);
      user.messageCount++;
      user.lastActivity = new Date();
    }

    io.emit('newMessage', {
      user: msg.from.first_name,
      message: msg.text,
      timestamp: new Date()
    });
  }
});

// ويب سوكيت
io.on('connection', (socket) => {
  console.log('👤 مستخدم متصل بالواجهة');
  
  socket.emit('initialData', {
    users: Array.from(connectedUsers.values()),
    stats: botStats
  });

  socket.on('disconnect', () => {
    console.log('👤 مستخدم مغادر من الواجهة');
  });
});

// تشغيل السيرفر
server.listen(PORT, () => {
  console.log(`🚀 السيرفر شغال على البورت ${PORT}`);
  console.log(`📊 لوحة التحكم: http://localhost:${PORT}`);
  console.log(`🤖 البوت جاهز للاستخدام!`);
});

// معالجة الأخطاء
bot.on('error', (error) => {
  console.log('❌ خطأ في البوت:', error);
});

process.on('uncaughtException', (error) => {
  console.log('❌ خطأ غير متوقع:', error);
});
