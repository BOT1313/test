const { Client, EmbedBuilder, PermissionsBitField } = require("discord.js");
const db = require("croxydb");

module.exports = {
    name: "davet-sistemi",
    description: 'Gelişmiş davet sistemini ayarlarsın.',
    type: 1,
    options: [
        {
            name: "davet-kanalı",
            description: "Davet mesajlarının gönderileceği kanal.",
            type: 7,
            required: true,
            channel_types: [0]
        },
        {
            name: "hoşgeldin",
            description: "Hoş geldin mesajını aç/kapat.",
            type: 3,
            required: true,
            choices: [
                {
                    name: 'Aç',
                    value: "aç"
                },
                {
                    name: 'Kapat',
                    value: "kapat"
                },
            ]
        }
    ],
    run: async (client, interaction) => {

        const permission_embed = new EmbedBuilder()
            .setColor("Red")
            .setDescription("\`❌\` | Davet sistemini ayarlayabilmek için **Yönetici** yetkisine sahip olmalısın!")

        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) return interaction.reply({ embeds: [permission_embed], ephemeral: true })

        const channel = interaction.options.getChannel("davet-kanalı")
        const hoşgeldin = interaction.options.getString("hoşgeldin")

        const success_embed = new EmbedBuilder()
            .setColor("Green")
            .setAuthor({ name: `${interaction.user.username} tarafından`, iconURL: interaction.user.avatarURL() })
            .setDescription(`> \`✅\` **Davet log sistemi başarıyla ayarlandı!**\n\n \`#️⃣\` Kanal: ${channel}\n\`👋\` Hoşgeldin Mesajı: ${hoşgeldin}`)
            .setThumbnail(interaction.user.avatarURL())

        db.set(`davetLog_${interaction.guild.id}`, { channel: channel.id, hoşgeldin: hoşgeldin })
        return interaction.reply({ embeds: [success_embed] })
    }
}
