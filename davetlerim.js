const { Client, GatewayIntentBits, PermissionsBitField, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require('discord.js');
const db = require("croxydb");

module.exports = {
    name: "davetlerim",
    description: 'Toplam davet sayısını gösterir.',
    type: 1,
    run: async (client, interaction) => {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageGuild)) {
            return interaction.reply({ content: "Bu komutu kullanmak için gerekli yetkiye sahip değilsiniz.", ephemeral: true });
        }

        await interaction.reply({ content: "Mesaj gönderildi", ephemeral: true });

        let embedMessageId = db.get(`embedMessageId_${interaction.guild.id}`);
        let embedMessage;

        if (embedMessageId) {
            embedMessage = await interaction.channel.messages.fetch(embedMessageId).catch(() => null);
            if (!embedMessage) {
                embedMessageId = null;
            }
        }

        if (!embedMessageId) {
            const button = new ButtonBuilder()
                .setCustomId('check_invites')
                .setLabel('Davet Kontrol')
                .setStyle(ButtonStyle.Success);

            const row = new ActionRowBuilder().addComponents(button);

            embedMessage = await interaction.channel.send({
                embeds: [
                    new EmbedBuilder()
                        .setColor("#00FF00")
                        .setAuthor({ name: interaction.guild.name, iconURL: interaction.guild.iconURL() })
                        .setTitle('Davet Kontrol')
                        .setDescription('Davet sayını kontrol etmek için aşağıdaki butona bas!')
                        .setThumbnail(client.user.displayAvatarURL())
                        .setFooter({ text: 'Davet Kontrol Sistemi', iconURL: client.user.displayAvatarURL() })
                ],
                components: [row]
            });

            db.set(`embedMessageId_${interaction.guild.id}`, embedMessage.id);
        }

        client.on('interactionCreate', async i => {
            if (i.customId === 'check_invites' && i.isButton()) {
                const userId = i.user.id;
                const guildId = i.guild.id;

                const inviteCount = db.get(`inviteCount_${userId}_${guildId}`) || 0;
                const inviteRemoveCount = db.get(`inviteRemoveCount_${userId}_${guildId}`) || 0;

                const inviteEmbed = new EmbedBuilder()
                    .setColor("#00FF00")
                    .setAuthor({ name: `Hoşgeldiniz 👋 ${i.user.username}`, iconURL: i.user.avatarURL() })
                    .setDescription('Davet bilgileriniz aşağıda yer almaktadır!')
                    .addFields({ name: "👤 Davet Sayınız", value: `**${inviteCount + inviteRemoveCount}** adet kişiyi davet ettiniz!`, inline: true })
                    .setThumbnail(i.user.displayAvatarURL());

                await i.reply({ embeds: [inviteEmbed], ephemeral: true });
            }
        });
    }
};

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.DirectMessages
    ]
});

client.on('ready', async () => {
    const guilds = client.guilds.cache;

    guilds.forEach(async (guild) => {
        const embedMessageId = db.get(`embedMessageId_${guild.id}`);
        if (embedMessageId) {
            const channel = guild.channels.cache.find(channel => channel.messages.cache.has(embedMessageId));
            if (channel) {
                const embedMessage = await channel.messages.fetch(embedMessageId).catch(() => null);
                if (embedMessage) {
                    client.on('interactionCreate', async i => {
                        if (i.customId === 'check_invites' && i.isButton()) {
                            const userId = i.user.id;
                            const guildId = guild.id;

                            const inviteCount = db.get(`inviteCount_${userId}_${guildId}`) || 0;
                            const inviteRemoveCount = db.get(`inviteRemoveCount_${userId}_${guildId}`) || 0;

                            const inviteEmbed = new EmbedBuilder()
                                .setColor("#00FF00")
                                .setAuthor({ name: `${i.user.username} davet verileri`, iconURL: i.user.avatarURL() })
                                .setDescription('Hoş geldiniz! Davet bilgileriniz aşağıda yer almaktadır.')
                                .addFields({ name: "Davet Sayınız", value: `${inviteCount + inviteRemoveCount} adet kişiyi davet ettiniz!`, inline: true })
                                .setThumbnail(i.user.displayAvatarURL());

                            await i.reply({ embeds: [inviteEmbed], ephemeral: true });
                        }
                    });
                }
            }
        }
    });
});