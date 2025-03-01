const { SlashCommandBuilder, PermissionsBitField, EmbedBuilder, ButtonBuilder, ActionRowBuilder } = require('discord.js');
const db = require('croxydb');

module.exports = {
    name: "fake-invite",
    description: 'Belirtilen kullanıcıya sahte davet ekler veya siler.',
    type: 1,
    options: [
        {
            name: 'işlem',
            description: 'Yapmak istediğiniz işlemi seçin.',
            type: 3, // String type
            required: true,
            choices: [
                { name: 'Ekle', value: 'ekle' },
                { name: 'Sil', value: 'sil' },
            ]
        },
        {
            name: 'kullanıcı',
            description: 'Sahte davet eklenecek veya silinecek kullanıcıyı seçin.',
            type: 6, // User type
            required: true,
        },
        {
            name: 'sayı',
            description: 'Eklenecek veya silinecek sahte davet sayısını girin.',
            type: 4, // Integer type
            required: true,
        },
    ],
    run: async (client, interaction) => {
        const işlem = interaction.options.getString('işlem');
        const user = interaction.options.getUser('kullanıcı');
        const fakeInviteCount = interaction.options.getInteger('sayı');
        const guildId = interaction.guild.id;
        const userId = user.id;

        if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageGuild)) {
            return interaction.reply({ content: "\`❌\` | Bu komutu kullanmak için **Yönetici** yetkisine sahip olmalısın!", ephemeral: true });
        }

        if (işlem === 'ekle') {
            const currentInviteCount = db.get(`inviteCount_${userId}_${guildId}`) || 0;
            const newInviteCount = currentInviteCount + fakeInviteCount;
            db.set(`inviteCount_${userId}_${guildId}`, newInviteCount);
            await interaction.reply({ content: `${user.tag} kullanıcısına ${fakeInviteCount} sahte davet eklendi. Toplam davet sayısı: ${newInviteCount}.`, ephemeral: true });
        } else if (işlem === 'sil') {
            const currentInviteCount = db.get(`inviteCount_${userId}_${guildId}`) || 0;
            const newInviteCount = currentInviteCount - fakeInviteCount < 0 ? 0 : currentInviteCount - fakeInviteCount;
            db.set(`inviteCount_${userId}_${guildId}`, newInviteCount);
            await interaction.reply({ content: `${user.tag} kullanıcısından ${fakeInviteCount} sahte davet silindi. Toplam davet sayısı: ${newInviteCount}.`, ephemeral: true });
        }
    }
};
