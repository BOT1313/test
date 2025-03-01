const { REST } = require("@discordjs/rest");
const { Routes, ActivityType } = require("discord-api-types/v10");
const { TOKEN } = require("../config.json");

module.exports = async (client) => {
  const rest = new REST({ version: "10" }).setToken(TOKEN || process.env.token);

  try {
    await rest.put(Routes.applicationCommands(client.user.id), {
      body: client.commands,
    });
    console.log("Komutlar başarıyla yüklendi.");
  } catch (error) {
    console.error("Komutlar yüklenirken bir hata oluştu:", error);
  }

  console.log(`${client.user.tag} Aktif!`);

  setInterval(async () => {
    // Tüm sunuculardaki toplam üye sayısını al
    const totalMembers = client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0);

    const activities = [
      `🟢 Beta sürümü : 1.2.0`, 
      `🟢 RobBot - Online`, 
      `🟢 Toplam Üye: ${totalMembers}`
    ];
    const random = activities[Math.floor(Math.random() * activities.length)];

    client.user.setPresence({
      activities: [{ name: random, type: ActivityType.Watching }], // 'WATCHING' yerine ActivityType.Watching kullanılıyor
      status: 'idle' // Botu rahatsız etmeyin modunda ayarlama
    });
  }, 60000); // 60.000 milisaniye = 60 saniye = 1 dakika
};
