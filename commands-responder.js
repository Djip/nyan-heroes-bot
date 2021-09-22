require('dotenv').config();

const { Client, Intents, MessageEmbed, MessageAttachment } = require('discord.js');
const fs = require("fs");
const nodeHtmlToImage = require("node-html-to-image");
const axios = require('./modules/axios')
const font2base64 = require('node-font2base64')
const redis = require('redis')
const { promisify } = require('util')
const {TwitterApi} = require("twitter-api-v2");

const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });
let redisClient, getAsync;

client.on('messageCreate', async message => {
    const messageWordCount = wordCount(message.content)

    if (messageWordCount >= 5) {
        const api = await axios.api()

        await api.post(`users/give-message-xp`, {
            user: message.author
        }).then(response => {
            console.log("Message XP Given")
        }).catch(error => {
            console.log(error)
        })
    }
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

    if (interaction.commandName === 'rank-test') {
        await interaction.reply({ content: "Fetching Rank..." })
        try {
            const api = await axios.api()
            fs.readFile(__dirname + '/rank-card/index.html', async (err, data) => {
                try {
                    const backgroundImage = fs.readFileSync('./rank-card/background.jpg');
                    const base64BackgroundImage = new Buffer.from(backgroundImage).toString('base64');
                    const backgroundImageUri = 'data:image/png;base64,' + base64BackgroundImage;

                    let rankData;
                    await api.get(`users/rank`, {
                        params: {
                            discord_id: interaction.user.id,
                            username: interaction.user.username,
                            discriminator: interaction.user.discriminator,
                            avatar: interaction.user.avatar
                        }
                    }).then(response => {
                        rankData = response.data.data
                    }).catch(async error => {
                        console.log(error)
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

    if (interaction.commandName === 'link-twitter') {
        try {
            await setupRedis()
            const user = await client.users.cache.get(interaction.member.user.id);
            const twitterClient = new TwitterApi({ appKey: process.env.TWITTER_API_KEY, appSecret: process.env.TWITTER_API_KEY_SECRET })
            const callbackUrl = process.env.TWITTER_CALLBACK_URL + '?discord_id=' + user.id
            const authLink = await twitterClient.generateAuthLink(callbackUrl)
            redisClient.set('twitter-auth-' + user.id, JSON.stringify({oauth_token: authLink.oauth_token, oauth_token_secret: authLink.oauth_token_secret}))

            user.send(`Please use the following URL to link your Twitter account: ${authLink.url}`);
            interaction.reply({ content: 'Please look in your DM.', ephemeral: true })
        } catch (e) {
            console.log(e)
        }
    }

    if (interaction.commandName === 'leaderboard') {
        try {
            const api = await axios.api()
            await api.get('users/leaderboard').then(response => {
                let description = "", count = 1;
                response.data.data.forEach(user => {
                    description += `#${count} - ${user.username} - Level: ${user.level.level} - XP: ${user.xp}\n`
                    count++;
                })
                const message = new MessageEmbed()
                    .setTitle('Leaderboard')
                    .setDescription(description)

                interaction.reply({embeds: [message]})
            }).catch(error => {
                console.log(error)
            })
        } catch (e) {
            if (interaction) {
                interaction.reply("Couldn't fetch Leaderboard, try again.")
            }
        }
    }
})

client.login(process.env.DISCORD_BOT_TOKEN)

async function setupRedis() {
    if (!redisClient) {
        redisClient = await redis.createClient(process.env.REDIS_URL, {
            tls: {
                rejectUnauthorized: false
            }
        })
        redisClient.on("error", function (error) {
            console.error(error);
        });

        getAsync = promisify(redisClient.get).bind(redisClient)
    }
}

function wordCount(string) {
    return string.split(' ').length;
}