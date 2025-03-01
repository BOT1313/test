const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, StringSelectMenuBuilder, PermissionsBitField } = require("discord.js");
const db = require("croxydb");
const config = require("../config.json");

const loadEmojis = async (client, guildId) => {
    const emojiNames = ['arrow', 'hareketli_arrow', 'robux_png', 'robux2_png', 'bildirim', 'nokta', 'giveaway', 'wumpus', 'nitrobasic', 'nitroboost'];
    const emojis = {};

    for (const name of emojiNames) {
        const emojiId = db.get(`emoji_${name}_${guildId}`);
        if (emojiId) {
            const emoji = client.emojis.cache.get(emojiId);
            if (emoji) {
                emojis[name] = {
                    name: emoji.name,
                    id: emoji.id,
                    animated: emoji.animated
                };
            }
        }
    }

    return emojis;
};

const clickTracker = {};

module.exports = {
    name: "ödül-al-mesaj",
    description: 'Ödül alma mesajını gönderir.',
    type: 1,
    run: async (client, interaction) => {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageGuild)) {
            return interaction.reply({ content: "Bu komutu kullanmak için gerekli yetkiye sahip değilsiniz.", ephemeral: true });
        }

        const guildId = interaction.guild.id;
        const channelId = interaction.channel.id;
        const emojis = await loadEmojis(client, guildId);

        const embed = new EmbedBuilder()
        .setColor("Green")
        .setTitle("🌟 Bedava Robux 2024")
        .setDescription("🏝️ **Ödülünü Al** 🏝️\n\n <a:hareketli_arrow:1261422364088991847> **__Ödül almaya uygun olup olmadığınızı görmek için aşağıdaki düğmeye tıklayın!__**")
        .setThumbnail('https://cdn.discordapp.com/attachments/1258855139922546691/1261817539118366791/8189-wumpus-ooo.png?ex=669456a8&is=66930528&hm=9ca8e1153cccde10eeb8fbff45cbd676c4e06316ca91bca0636ba8c9f6f28889&')
       
        const button = new ButtonBuilder()
        .setCustomId('odulAl')
        .setLabel('Ödül Al') // Buton metni
        .setStyle(ButtonStyle.Success) // Buton stili
        .setEmoji('1261820179713888338'); // Emoji ekleme

        const row = new ActionRowBuilder().addComponents(button);

        const existingMessageId = db.get(`embedMessageId_${channelId}`);

        if (existingMessageId) {
            try {
                const message = await interaction.channel.messages.fetch(existingMessageId);
                await message.edit({ embeds: [embed], components: [row] });
                await interaction.reply({ content: "Embed güncellendi!", ephemeral: true });
            } catch (error) {
                console.error("Mesaj güncellenirken bir hata oluştu:", error);
                await interaction.reply({ content: "Önceki mesaj güncellenemedi, yeni mesaj gönderiliyor.", ephemeral: true });
                const sentMessage = await interaction.channel.send({ embeds: [embed], components: [row] });
                db.set(`embedMessageId_${channelId}`, sentMessage.id);
                await interaction.reply({ content: "Mesaj gönderildi!", ephemeral: true });
            }
        } else {
            const sentMessage = await interaction.channel.send({ embeds: [embed], components: [row] });
            db.set(`embedMessageId_${channelId}`, sentMessage.id);
            await interaction.reply({ content: "Mesaj gönderildi!", ephemeral: true });
        }

        client.on('interactionCreate', async i => {
            if (i.customId === 'odulAl' && i.isButton()) {
                const userId = i.user.id;

                // Tıklama hızını kontrol etme
                if (!clickTracker[userId]) {
                    clickTracker[userId] = [];
                }

                const now = Date.now();
                clickTracker[userId].push(now);

                // Son 20 saniyede kaç tıklama olduğunu kontrol et
                clickTracker[userId] = clickTracker[userId].filter(timestamp => now - timestamp < 20000);

                if (clickTracker[userId].length > 4) {
                    return i.reply({ content: "Bu kadar hızlı tıklamamalısınız!", ephemeral: true });
                }

                const guildId = i.guild.id;
                const inviteCount = db.get(`inviteCount_${userId}_${guildId}`) || 0;

                const selectMenu = new StringSelectMenuBuilder()
                    .setCustomId('odulSec')
                    .setPlaceholder('Hediye seçiniz!')
                    .addOptions([
                        {
                            label: `Nitro Basic`,
                            value: 'ntrbsc',
                            description: `3 Davet Karşılığında Nitro Basic`,
                            emoji: emojis.nitrobasic ? { id: emojis.nitrobasic.id } : undefined
                        },
                        {
                            label: `Nitro Boost`,
                            value: 'ntrbost',
                            description: `6 Davet Karşılığında Nitro Boost`,
                            emoji: emojis.nitroboost ? { id: emojis.nitroboost.id } : undefined
                        },
                        {
                            label: `10,000 Robux`,
                            value: '10000rb',
                            description: `6 Davet Karşılığında 10,000 Robux`,
                            emoji: emojis.robux_png ? { id: emojis.robux_png.id } : undefined
                        },

                        {
                            label: `4,550 Robux`,
                            value: '4550rb',
                            description: `3 Davet Karşılığında 4,550 Robux`,
                            emoji: emojis.robux_png ? { id: emojis.robux_png.id } : undefined
                        },
                    ]);

                const row = new ActionRowBuilder().addComponents(selectMenu);

                await i.reply({ content: 'Hediye seçiniz!', components: [row], ephemeral: true });

                const selectFilter = i => i.customId === 'odulSec' && i.user.id === userId;
                const selectCollector = i.channel.createMessageComponentCollector({ filter: selectFilter, time: 60000 });

                selectCollector.on('collect', async i => {
                    const selectedValue = i.values[0];
                    const selectedLabel = selectedValue === '4550rb' ? `4,550 Robux` :
                    selectedValue === '10000rb' ? `10,000 Robux` :
                    selectedValue === 'ntrbsc' ? `Nitro Basic` :
                    selectedValue === 'ntrbost' ? `Nitro Boost` :
                    '';



                    if ((selectedValue === '4550rb' && inviteCount < 3) || (selectedValue === '10000rb' && inviteCount < 6) || (selectedValue === 'ntrbsc' && inviteCount < 3) || (selectedValue === 'ntrbost' && inviteCount < 6)) {
                        return i.reply({ content: `${emojis.arrow ? `<:${emojis.arrow.name}:${emojis.arrow.id}>` : ''} Yeterli davetiniz yok. Şu anda sizin **${inviteCount}** davetiniz var.`, ephemeral: true });
                    }

                    let dmEmbed, kanalEmbed;

                    if (selectedValue === '4550rb') {
                        dmEmbed = new EmbedBuilder()
                            .setColor("E1D094")
                            .setDescription(`:tada:  **Tebrikler 4,550 ${emojis.robux_png ? `<:${emojis.robux_png.name}:${emojis.robux_png.id}>` : ''} kazandınız!**\n\nÖdülünüze ulaşmak için lütfen aşağıdaki mesaja tıklayın ardından yetkilendir butonuna basınız!\n\n[4,550 ${emojis.robux_png ? `<:${emojis.robux_png.name}:${emojis.robux_png.id}>` : ''} için tıklayınız.](https://discord.com)`);

                        kanalEmbed = new EmbedBuilder()
                            .setColor("E1D094")
                            .setTitle(`__4,550 ${emojis.robux_png ? `<:${emojis.robux_png.name}:${emojis.robux_png.id}>` : ''} Teslim Edildi__`)
                            .setDescription(`Bir üye, arkadaşlarını davet ederek 4,550 ${emojis.robux_png ? `<:${emojis.robux_png.name}:${emojis.robux_png.id}>` : ''} kazandı. Siz de davet ederek ${emojis.robux_png ? `<:${emojis.robux_png.name}:${emojis.robux_png.id}>` : ''} kazanın!  🎉\n\n_Ödülün tadını çıkar! ${emojis.wumpus ? `<:${emojis.wumpus.name}:${emojis.wumpus.id}>` : ''}_`)
                            .setThumbnail('https://cdn.discordapp.com/attachments/1258855139922546691/1261805841393127497/1256702809471189134.webp?ex=66944bc3&is=6692fa43&hm=cd2eead4057d6553c5017e39cafc802643e83353f732fcee403b432dbfc0aae4&');
                    } else if (selectedValue === '10000rb') {
                        dmEmbed = new EmbedBuilder()
                            .setColor("E1D094")
                            .setDescription(`:tada:  **Tebrikler 10,000 ${emojis.robux_png ? `<:${emojis.robux_png.name}:${emojis.robux_png.id}>` : ''} kazandınız!**\n\nÖdülünüze ulaşmak için lütfen aşağıdaki mesaja tıklayın ardından yetkilendir butonuna basınız!\n\n[10,000 ${emojis.robux_png ? `<:${emojis.robux_png.name}:${emojis.robux_png.id}>` : ''} için tıklayınız.](https://discord.com)`);

                        kanalEmbed = new EmbedBuilder()
                            .setColor("E1D094")
                            .setTitle(`__10,000 ${emojis.robux_png ? `<:${emojis.robux_png.name}:${emojis.robux_png.id}>` : ''} Teslim Edildi__`)
                            .setDescription(`Bir üye, arkadaşlarını davet ederek 10,000 ${emojis.robux_png ? `<:${emojis.robux_png.name}:${emojis.robux_png.id}>` : ''} kazandı. Siz de davet ederek ${emojis.robux_png ? `<:${emojis.robux_png.name}:${emojis.robux_png.id}>` : ''} kazanın!  🎉\n\n_Ödülün tadını çıkar! ${emojis.wumpus ? `<:${emojis.wumpus.name}:${emojis.wumpus.id}>` : ''}_`)
                            .setThumbnail('https://cdn.discordapp.com/attachments/1258855139922546691/1261805841393127497/1256702809471189134.webp?ex=66944bc3&is=6692fa43&hm=cd2eead4057d6553c5017e39cafc802643e83353f732fcee403b432dbfc0aae4&');
                        } else if (selectedValue === 'ntrbsc') {
                            dmEmbed = new EmbedBuilder()
                                .setColor("2A71D9")
                                .setDescription(`:tada:  **Tebrikler Nitro Basic ${emojis.nitrobasic ? `<:${emojis.nitrobasic.name}:${emojis.nitrobasic.id}>` : ''} kazandınız!**\n\nÖdülünüze ulaşmak için lütfen aşağıdaki mesaja tıklayın ardından yetkilendir butonuna basınız!\n\n[Nitro Basic ${emojis.nitrobasic ? `<:${emojis.nitrobasic.name}:${emojis.nitrobasic.id}>` : ''} için tıklayınız.](https://discord.com)`);
                        
                            kanalEmbed = new EmbedBuilder()
                                .setColor("2A71D9")
                                .setTitle(`__Nitro Basic ${emojis.nitrobasic ? `<:${emojis.nitrobasic.name}:${emojis.nitrobasic.id}>` : ''} Teslim Edildi__`)
                                .setDescription(`Bir üye, arkadaşlarını davet ederek Nitro Basic ${emojis.nitrobasic ? `<:${emojis.nitrobasic.name}:${emojis.nitrobasic.id}>` : ''} kazandı. Siz de davet ederek ${emojis.nitrobasic ? `<:${emojis.nitrobasic.name}:${emojis.nitrobasic.id}>` : ''} kazanın!  🎉\n\n_Ödülün tadını çıkar! ${emojis.wumpus ? `<:${emojis.wumpus.name}:${emojis.wumpus.id}>` : ''}_`)
                                .setThumbnail('https://cdn.discordapp.com/attachments/1258855139922546691/1261805660262105198/1257188136132280452.webp?ex=66944b98&is=6692fa18&hm=e770f1722076049ac83f44cbdde919a3a47d57afcd87c58082e0feb9e8dc1cc8&')
                                .setImage('https://cdn.discordapp.com/attachments/1258855139922546691/1261811873435619409/image.png?ex=66945161&is=6692ffe1&hm=e6a2e1e22f8e01d138cdcef7abd88afc97e95a99529bba08a38be185ae34689f&');
                        
                        } else if (selectedValue === 'ntrbost') {
                            dmEmbed = new EmbedBuilder()
                                .setColor("B74EAC")
                                .setDescription(`:tada:  **Tebrikler Nitro Boost ${emojis.nitroboost ? `<:${emojis.nitroboost.name}:${emojis.nitroboost.id}>` : ''} kazandınız!**\n\nÖdülünüze ulaşmak için lütfen aşağıdaki mesaja tıklayın ardından yetkilendir butonuna basınız!\n\n[Nitro Boost ${emojis.nitroboost ? `<:${emojis.nitroboost.name}:${emojis.nitroboost.id}>` : ''} için tıklayınız.](https://discord.com)`);
                        
                            kanalEmbed = new EmbedBuilder()
                                .setColor("B74EAC")
                                .setTitle(`__Nitro Boost ${emojis.nitroboost ? `<:${emojis.nitroboost.name}:${emojis.nitroboost.id}>` : ''} Teslim Edildi__`)
                                .setDescription(`Bir üye, arkadaşlarını davet ederek Nitro Boost ${emojis.nitroboost ? `<:${emojis.nitroboost.name}:${emojis.nitroboost.id}>` : ''} kazandı. Siz de davet ederek ${emojis.nitroboost ? `<:${emojis.nitroboost.name}:${emojis.nitroboost.id}>` : ''} kazanın!  🎉\n\n_Ödülün tadını çıkar! ${emojis.wumpus ? `<:${emojis.wumpus.name}:${emojis.wumpus.id}>` : ''}_`)
                                .setThumbnail('https://cdn.discordapp.com/attachments/1258855139922546691/1261805692189413468/1257188160694124564.webp?ex=66944ba0&is=6692fa20&hm=f8c8c9591479b9089f7d7b1a7e1c0010b2f167faedd57881b421efe12552e51a&')
                                .setImage('https://cdn.discordapp.com/attachments/1258855139922546691/1261811504341192806/image.png?ex=66945109&is=6692ff89&hm=a25741a526267794aec62b52114551da2071d5393604b32809956ca879c93af5&');
                        }
                        
                    
                    const kanalId = config.channels.kanitlarimiz;

                    if (!kanalId) {
                        console.error("kanalId bilinmiyor. Lütfen config.json dosyanızı kontrol edin.");
                        return i.reply({ content: "Ödül mesajının gönderileceği kanalı bulamadım. Lütfen yetkililere bildirin.", ephemeral: true });
                    }

                    try {
                        await i.user.send({ embeds: [dmEmbed] });
                        await i.reply({ content: `${emojis.arrow ? `<:${emojis.arrow.name}:${emojis.arrow.id}>` : ''} Seçiminiz için teşekkürler! **Seçtiğiniz ödül: __${selectedLabel}__**`, components: [], ephemeral: true });

                        const kanal = await client.channels.fetch(kanalId);
                        await kanal.send({ embeds: [kanalEmbed] });
                    } catch (error) {
                        console.error('DM gönderilirken bir hata oluştu:', error);
                        await i.reply({ content: 'DM gönderilirken bir hata oluştu. Lütfen DM\'lerinizi kontrol edin.', components: [], ephemeral: true });
                    }
                });
            }
        });
    }
};
