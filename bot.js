require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const fs = require('fs');

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

const TOKEN = process.env.DISCORD_TOKEN;
const LINK_LIMIT = 3; // Número máximo de links por día
const DATA_FILE = 'linkCount.json';
const TARGET_CHANNEL_ID = '1367382492432039988'; // Reemplaza con el ID del canal

let linkData = {};

// Cargar datos si ya existen
if (fs.existsSync(DATA_FILE)) {
  linkData = JSON.parse(fs.readFileSync(DATA_FILE));
}

// Reiniciar conteo diariamente
setInterval(() => {
  linkData = {};
  fs.writeFileSync(DATA_FILE, JSON.stringify(linkData));
  console.log('Contador de links reiniciado.');
}, 24 * 60 * 60 * 1000); // Cada 24 horas

client.on('messageCreate', message => {
  if (message.author.bot) return;

  // Asegúrate de que el mensaje provenga del canal específico
  if (message.channel.id !== TARGET_CHANNEL_ID) return;

  const linkRegex = /(https?:\/\/[^\s]+)/gi;
  const userId = message.author.id;
  const today = new Date().toISOString().slice(0, 10); // yyyy-mm-dd

  if (linkRegex.test(message.content)) {
    if (!linkData[today]) linkData[today] = {};
    if (!linkData[today][userId]) linkData[today][userId] = 0;

    if (linkData[today][userId] >= LINK_LIMIT) {
      message.delete().catch(console.error);
      message.channel.send(`<@${userId}>, has alcanzado el límite diario de ${LINK_LIMIT} enlaces.`)
        .then(msg => setTimeout(() => msg.delete(), 5000)); // Borra mensaje tras 5s
      return;
    }

    linkData[today][userId]++;
    fs.writeFileSync(DATA_FILE, JSON.stringify(linkData));
  }
});

client.once('ready', () => {
  console.log(`✅ Bot conectado como ${client.user.tag}`);
});

client.login(TOKEN);
