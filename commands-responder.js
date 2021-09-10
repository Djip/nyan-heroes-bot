require('dotenv').config();

const { Client, Intents, MessageEmbed, MessageAttachment } = require('discord.js');
const fs = require("fs");
const nodeHtmlToImage = require("node-html-to-image");
const axios = require('./modules/axios')
const font2base64 = require('node-font2base64')

const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });


client.on('messageCreate', async message => {
    // console.log(message)
})

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) {
        return;
    }

    if (interaction.commandName === 'give-xp') {
        const api = await axios.api()
        const user = interaction.options.getUser('user');
        const xp = interaction.options.getInteger('xp');

        api.post('users/give-xp', {
            user,
            xp
        }).then(response => {
            if (interaction) {
                interaction.reply("XP Given")
            }
        }).catch(error => {
            if (interaction) {
                interaction.reply("Something went wrong")
            }
        })
    }

    if (interaction.commandName === 'subtract-xp') {
        const api = await axios.api()
        const user = interaction.options.getUser('user');
        const xp = interaction.options.getInteger('xp');

        api.post('users/subtract-xp', {
            user,
            xp
        }).then(response => {
            if (interaction) {
                interaction.reply("XP Removed")
            }
        }).catch(error => {
            if (interaction) {
                interaction.reply("Something went wrong")
            }
        })
    }

    if (interaction.commandName === 'test') {
        await interaction.reply({ content: "Fetching Rank..." })
        try {
            const api = await axios.api()
            fs.readFile(__dirname + '/rank-card/index.html', async (err, data) => {
                try {
                    const backgroundImage = fs.readFileSync('./rank-card/background.png');
                    const base64BackgroundImage = new Buffer.from(backgroundImage).toString('base64');
                    const backgroundImageUri = 'data:image/png;base64,' + base64BackgroundImage;

                    let rankData;
                    await api.get(`users/rank`, {
                        params: {
                            username: interaction.user.username,
                            discriminator: interaction.user.discriminator,
                            avatar: interaction.user.avatar
                        }
                    }).then(response => {
                        rankData = response.data.data
                    }).catch(async error => {
                        if (interaction) {
                            await interaction.editReply('Error, try again.')
                        }
                    })

                    if (rankData) {
                        let ubuntuFontData;
                        await font2base64.encodeToDataUrl('./rank-card/Ubuntu-Regular.ttf').then(data => {
                            ubuntuFontData = data
                        })

                        const currentXp = rankData.xp - rankData.level.xp_required;
                        const nextXp = rankData.next_level.xp_required - rankData.level.xp_required

                        const rankCard = await nodeHtmlToImage({
                            html: data.toString(),
                            content: {
                                backgroundImage: backgroundImageUri,
                                avatar: interaction.user.avatarURL(),
                                username: interaction.user.username,
                                discriminator: interaction.user.discriminator,
                                rank: rankData.rank,
                                level: rankData.level.level,
                                currentXp: currentXp,
                                nextLevel: rankData.next_level.level,
                                nextXp: nextXp,
                                calculatedProgress: currentXp / nextXp * 100,
                                fontData: ubuntuFontData
                            },
                            transparent: true
                        })

                        if (interaction) {
                            if (rankCard) {
                                await interaction.followUp({files: [rankCard]})
                            } else {
                                await interaction.editReply('Error, try again.')
                            }
                        }
                    }
                } catch (ex) {
                    console.log(ex)
                    if (interaction) {
                        await interaction.editReply('Error, try again.')
                    }
                }
            });
        } catch (ex) {
            console.log(ex)
            if (interaction) {
                await interaction.editReply('Error, try again.')
            }
        }
    }
})

client.login(process.env.DISCORD_BOT_TOKEN)