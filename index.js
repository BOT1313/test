const { Client, GatewayIntentBits, Partials, EmbedBuilder, Collection } = require("discord.js");
const { TOKEN, DEVELOPER_IDS } = require("./config.json");
const db = require("croxydb");
const fs = require("fs");
const path = require("path");

// İNTENTS
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildEmojisAndStickers,
        GatewayIntentBits.GuildIntegrations,
        GatewayIntentBits.GuildWebhooks,
        GatewayIntentBits.GuildInvites,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildMessageTyping,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.DirectMessageReactions,
        GatewayIntentBits.DirectMessageTyping,
        GatewayIntentBits.MessageContent
    ],
    shards: "auto",
    partials: [
        Partials.Message,
        Partials.Channel,
        Partials.GuildMember,
        Partials.Reaction,
        Partials.GuildScheduledEvent,
        Partials.User,
        Partials.ThreadMember
    ]
});

// Komutlar ve Eventler
client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    
    if (!command.name) {
        console.error(`[ERROR] ${file} dosyasında 'name' tanımlı değil.`);
        continue;
    }

    client.commands.set(command.name, command);
    console.log(`[COMMAND] ${command.name} komutu yüklendi.`);
}

const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = require(filePath);
    const eventName = file.split(".")[0];
    client.on(eventName, event.bind(null, client));
    console.log(`[EVENT] ${eventName} eventi yüklendi.`);
}

// Hata bildirimi fonksiyonu
async function notifyDevelopers(error) {
    for (const developerId of DEVELOPER_IDS) {
        try {
            const developer = await client.users.fetch(developerId);
        } catch (sendError) {
            console.error(`Hata bildirimi gönderilemedi: ${sendError.message}`);
        }
    }
}

// Hata yönetimi
process.on("unhandledRejection", async (reason, p) => {
    console.error("Yakalanamayan Reddetme: ", reason);
    await notifyDevelopers(reason);
});

process.on("uncaughtException", async (error) => {
    console.error("Yakalanamayan Hata: ", error);
    await notifyDevelopers(error);
});

// Discord botunu başlatma
client.login(TOKEN);

// Davet takipçisi
const InvitesTracker = require('@androz2091/discord-invites-tracker');
const tracker = InvitesTracker.init(client, {
    fetchGuilds: true,
    fetchVanity: true,
    fetchAuditLogs: true
});

// Davet olayı izleyicisi
tracker.on('guildMemberAdd', async (member, type, invite) => {
    try {
        const data = db.get(`davetLog_${member.guild.id}`);
        if (!data) return;

        const inviteChannel = member.guild.channels.cache.get(data.channel);
        if (!inviteChannel) return db.delete(`davetLog_${member.guild.id}`);

        const invitedMember = db.get(`invitedInfo_${member.id}_${member.guild.id}`);
        if (invitedMember && invitedMember.inviterId) {
            const currentInviteCount = db.get(`inviteCount_${invitedMember.inviterId}_${member.guild.id}`) || 0;
            db.set(`inviteCount_${invitedMember.inviterId}_${member.guild.id}`, currentInviteCount + 1);

            if (data.message === "embed") {
                const inviteEmbed = new EmbedBuilder()
                    .setColor('#00FF00')
                    .setAuthor({ name: `🎉 ${member.user.username} giriş yaptı!`, iconURL: member.user.displayAvatarURL() })
                    .setDescription(`<@${member.id}>, <@${invitedMember.inviterId}> tarafından davet edildi ve şu anda **${currentInviteCount + 1}** daveti var!`)
                    .setFooter({ text: `Bugün saat ${new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}` })
                    .setTimestamp();

                await inviteChannel.send({ embeds: [inviteEmbed] });
            } else if (data.message === "mesaj") {
                await inviteChannel.send(`Hoşgeldin ${member}! Daha önce <@${invitedMember.inviterId}> tarafından davet edilmişsin! :tada:`);
            }
        } else if (type === 'normal' && invite.inviter) {
            const currentInviteCount = db.get(`inviteCount_${invite.inviter.id}_${member.guild.id}`) || 0;
            db.set(`inviteCount_${invite.inviter.id}_${member.guild.id}`, currentInviteCount + 1);

            if (data.message === "embed") {
                const inviteEmbed = new EmbedBuilder()
                    .setColor('#00FF00')
                    .setAuthor({ name: `🎉 ${member.user.username} giriş yaptı!`, iconURL: member.user.displayAvatarURL() })
                    .setDescription(`<@${member.id}>, <@${invite.inviter.id}> tarafından davet edildi ve şu anda **${currentInviteCount + 1}** daveti var!`)
                    .setFooter({ text: `Bugün saat ${new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}` })
                    .setTimestamp();

                await inviteChannel.send({ embeds: [inviteEmbed] });
            } else if (data.message === "mesaj") {
                await inviteChannel.send(`Hoşgeldin ${member}! **${invite.inviter.username}** sayesinde buradasın! :tada:`);
            }
            db.set(`invitedInfo_${member.id}_${member.guild.id}`, { inviterId: invite.inviter.id, inviteCode: invite.code });
        } else if (type === 'permissions') {
            if (data.message === "embed") {
                const inviteEmbed = new EmbedBuilder()
                    .setColor('DARK_BUT_NOT_BLACK')
                    .setAuthor({ name: `${member.user.username} giriş yaptı!` })
                    .setDescription(`Hoşgeldin ${member}! Sunucuyu yönet yetkim olmadığı için nasıl geldiğini bulamadım!`)
                    .setFooter({ text: `Nasıl davet edildiğini bulamadım, yetkim yok` })
                    .setTimestamp();

                await inviteChannel.send({ embeds: [inviteEmbed] });
            } else if (data.message === "mesaj") {
                await inviteChannel.send(`Hoşgeldin ${member}! Sunucuyu yönet yetkim olmadığı için nasıl geldiğini bulamadım!`);
            }
        } else if (type === 'unknown') {
            if (data.message === "embed") {
                const inviteEmbed = new EmbedBuilder()
                    .setColor('DARK_BUT_NOT_BLACK')
                    .setAuthor({ name: `${member.user.username} giriş yaptı!` })
                    .setDescription(`Hoşgeldin ${member}! Nasıl geldiğini bulamadım, gökten mi indin? :tada:`)
                    .setFooter({ text: `Nasıl geldi anlamadım, kimsede söylemiyor` })
                    .setTimestamp();

                await inviteChannel.send({ embeds: [inviteEmbed] });
            } else if (data.message === "mesaj") {
                await inviteChannel.send(`Hoşgeldin ${member}! Nasıl geldiğini bulamadım, gökten mi indin? :tada:`);
            }
        }
    } catch (error) {
        console.error(`Davet olayı işlenirken hata oluştu: ${error.message}`);
        await notifyDevelopers(`Davet olayı işlenirken hata oluştu: ${error.stack}`);
    }
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
        await command.run(client, interaction);
    } catch (error) {
        console.error(error);
        await interaction.reply({ content: 'Bu komutu çalıştırırken bir hata oluştu!', ephemeral: true });
    }
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isButton() || interaction.customId !== 'odulAl') return;

    const userId = interaction.user.id;
    // Diğer buton işlemleri buraya eklenebilir.
});
