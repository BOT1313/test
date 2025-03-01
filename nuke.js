const { Client, GatewayIntentBits, PermissionsBitField, EmbedBuilder, ButtonBuilder, ActionRowBuilder } = require('discord.js');
const db = require("croxydb");

module.exports = {
    name: "nuke",
    description: 'Belirtilen kanalı temizler ve yeniden oluşturur.',
    type: 1,
    run: async (client, interaction) => {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
            return interaction.reply({ content: "\`❌\` | Kanala nuke atabilmek için **Yönetici** yetkisine sahip olmalısın!", ephemeral: true });
        }

        const channel = interaction.channel;

        const nukeEmoji = '💥';
        const confirmButton = new ButtonBuilder()
            .setCustomId('confirm_nuke')
            .setLabel('Nuke')
            .setEmoji(nukeEmoji)
            .setStyle('Danger');

        const cancelButton = new ButtonBuilder()
            .setCustomId('cancel_nuke')
            .setLabel('İptal')
            .setStyle('Secondary');

        const row = new ActionRowBuilder().addComponents(confirmButton, cancelButton);

        const embed = new EmbedBuilder()
            .setColor("#FF0000") // Kırmızı renk kodu
            .setTitle(`${nukeEmoji} Kanalı Nuke Et!`)
            .setDescription('\`❓\` | Bu kanalın tüm mesajlarını temizlemek ve yeniden oluşturmak istediğinizden emin misiniz?')
            .setFooter({ text: 'Nuke Komutu', iconURL: client.user.displayAvatarURL() });

        await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });

        const filter = i => ['confirm_nuke', 'cancel_nuke'].includes(i.customId) && i.user.id === interaction.user.id;
        const collector = interaction.channel.createMessageComponentCollector({ filter, time: 15000 });

        collector.on('collect', async i => {
            if (i.customId === 'confirm_nuke') {
                const nukedChannel = await channel.clone();
                await channel.delete();

                const nukedEmbed = new EmbedBuilder()
                    .setColor("#00FF00") // Açık yeşil renk kodu
                    .setTitle(`${nukeEmoji} Kanal Yeniden Oluşturuldu!`)
                    .setDescription('\`✅\` | Bu kanal başarıyla yeniden oluşturuldu!')
                    .setFooter({ text: 'Nuke Komutu', iconURL: client.user.displayAvatarURL() });

                await i.reply({ embeds: [nukedEmbed], ephemeral: true });

                collector.stop();
            } else if (i.customId === 'cancel_nuke') {
                await i.reply({ content: "\`❌\` | Nuke işlemi iptal edildi.", ephemeral: true });
                collector.stop();
            }
        });

        collector.on('end', collected => {
            if (collected.size === 0) {
                interaction.editReply({ content: "\`❗\` | Nuke işlemi zaman aşımına uğradı.", components: [] });
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
