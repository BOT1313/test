const { Client, EmbedBuilder, PermissionsBitField, ChannelType, WebhookClient } = require("discord.js");
const db = require("croxydb");
const fs = require("fs");
const path = require("path");
const configPath = path.join(__dirname, "../config.json");

let config;

try {
    config = require(configPath);
} catch (error) {
    console.error("Cannot find config.json file:", error);
    process.exit(1);
}

if (!config.channels) {
    config.channels = {};
}

module.exports = {
    name: "verileri-sifirla",
    description: 'Veritabanını sıfırlar ve kuruculara DM ile bildirim gönderir.',
    type: 1,
    run: async (client, interaction) => {
        const developerIds = config.DEVELOPER_IDS || [];
        const userId = interaction.user.id;

        if (!developerIds.includes(userId)) {
            const permission_embed = new EmbedBuilder()
                .setColor("Red")
                .setDescription("`❌` | Bu komutu kullanabilmek için yetkiniz yok!");
            return interaction.reply({ embeds: [permission_embed], ephemeral: true });
        }

        await interaction.deferReply({ ephemeral: true });

        const guild = interaction.guild;

        if (!guild) {
            const error_embed = new EmbedBuilder()
                .setColor("Red")
                .setDescription("`❌` | Sunucu bilgisi alınamadı!");
            return interaction.editReply({ embeds: [error_embed], ephemeral: true });
        }

        console.log(`Developers: ${developerIds.join(", ")}`);

        // Emojileri veritabanından çek
        const emojiKeys = [
            'arrow',
            'hareketli_arrow',
            'robux_png',
            'robux2_png',
            'bildirim',
            'nokta',
            'giveaway',
            'wumpus',
            'loading'
        ];

        const emojis = {};
        for (const key of emojiKeys) {
            const emojiId = db.get(`emoji_${key}_${guild.id}`);
            if (emojiId) {
                emojis[key] = client.emojis.cache.get(emojiId);
                if (emojis[key]) {
                    console.log(`Fetched emoji for key ${key}: ${emojis[key].toString()}`);
                } else {
                    console.warn(`Emoji with ID ${emojiId} not found in cache for key ${key}`);
                }
            }
        }

        const progressMessages = [
            `Temizleniyor... ${emojis.loading ? emojis.loading.toString() : ''} %10`,
            `Temizleniyor... ${emojis.loading ? emojis.loading.toString() : ''} %20`,
            `Temizleniyor... ${emojis.loading ? emojis.loading.toString() : ''} %30`,
            `Temizleniyor... ${emojis.loading ? emojis.loading.toString() : ''} %40`,
            `Temizleniyor... ${emojis.loading ? emojis.loading.toString() : ''} %50`,
            `Temizleniyor... ${emojis.loading ? emojis.loading.toString() : ''} %60`,
            `Temizleniyor... ${emojis.loading ? emojis.loading.toString() : ''} %70`,
            `Temizleniyor... ${emojis.loading ? emojis.loading.toString() : ''} %80`,
            `Temizleniyor... ${emojis.loading ? emojis.loading.toString() : ''} %90`,
            `Temizleniyor... ${emojis.loading ? emojis.loading.toString() : ''} %100`
        ];

        for (const message of progressMessages) {
            await interaction.editReply({ content: message, ephemeral: true });
            await new Promise(resolve => setTimeout(resolve, 500)); // 0.5 saniye bekleme
        }

        // Veritabanını temizle
        db.deleteAll();

        // Geliştiricilere DM gönder
        for (const devId of developerIds) {
            if (!devId) {
                console.warn(`Geçersiz geliştirici ID: ${devId}`);
                continue;
            }

            try {
                const developer = await client.users.fetch(devId);
                if (developer) {
                    await developer.send("Veritabanı başarıyla temizlendi.");
                } else {
                    console.warn(`Geliştirici ${devId} bulunamadı.`);
                }
            } catch (error) {
                console.error(`Geliştiriciye DM gönderilemedi (ID: ${devId}): ${error}`);
            }
        }

        // Log tutma
        const logChannelId = config.channels.log; // Log kanal ID'sini config dosyasından al
        if (logChannelId) {
            try {
                const logChannel = await client.channels.fetch(logChannelId);
                if (logChannel) {
                    logChannel.send("Veritabanı başarıyla temizlendi.");
                }
            } catch (error) {
                console.error(`Log kanalına mesaj gönderilemedi (ID: ${logChannelId}): ${error}`);
            }
        }

        const success_embed = new EmbedBuilder()
            .setColor("Green")
            .setDescription(`\`✅\` | Veritabanı başarıyla temizlendi! ${emojis.robux_png ? emojis.robux_png.toString() : ''}`);
        await interaction.editReply({ embeds: [success_embed], ephemeral: true });
    }
};
