require('dotenv').config();

const { Client, Intents, MessageEmbed, MessageAttachment } = require('discord.js');
const fs = require("fs");
const nodeHtmlToImage = require("node-html-to-image");
const axios = require('./modules/axios')
const font2base64 = require('node-font2base64')
const redis = require('redis')
const { promisify } = require('util')
const {TwitterApi} = require("twitter-api-v2");
const { completeMission } = require("./util")

const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });
let redisClient, getAsync;
let api;

// client.on('messageCreate', async message => {
//     const messageWordCount = wordCount(message.content)
//
//     if (messageWordCount >= 5) {
//         const api = await axios.api()
//
//         await api.post(`users/give-message-xp`, {
//             user: message.author
//         }).then(response => {
//             console.log("Message XP Given")
//         }).catch(error => {
//             console.log(error)
//         })
//     }
// })

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) {
        return;
    }
    if (!redisClient) {
        await setupRedis()
    }
    if (!api) {
        api = await axios.api();
    }

    // if (interaction.commandName === 'give-xp') {
    //     const api = await axios.api()
    //     const user = interaction.options.getUser('user');
    //     const xp = interaction.options.getInteger('xp');
    //
    //     api.post('users/give-xp', {
    //         user,
    //         xp
    //     }).then(response => {
    //         if (interaction) {
    //             interaction.reply("XP Given")
    //         }
    //     }).catch(error => {
    //         if (interaction) {
    //             interaction.reply("Something went wrong")
    //         }
    //     })
    // }
    //
    // if (interaction.commandName === 'subtract-xp') {
    //     const api = await axios.api()
    //     const user = interaction.options.getUser('user');
    //     const xp = interaction.options.getInteger('xp');
    //
    //     api.post('users/subtract-xp', {
    //         user,
    //         xp
    //     }).then(response => {
    //         if (interaction) {
    //             interaction.reply("XP Removed")
    //         }
    //     }).catch(error => {
    //         if (interaction) {
    //             interaction.reply("Something went wrong")
    //         }
    //     })
    // }
    //
    // if (interaction.commandName === 'rank-test') {
    //     await interaction.reply({ content: "Fetching Rank..." })
    //     try {
    //         const api = await axios.api()
    //         fs.readFile(__dirname + '/rank-card/index.html', async (err, data) => {
    //             try {
    //                 const backgroundImage = fs.readFileSync('./rank-card/background.jpg');
    //                 const base64BackgroundImage = new Buffer.from(backgroundImage).toString('base64');
    //                 const backgroundImageUri = 'data:image/png;base64,' + base64BackgroundImage;
    //
    //                 let rankData;
    //                 await api.get(`users/rank`, {
    //                     params: {
    //                         discord_id: interaction.user.id,
    //                         username: interaction.user.username,
    //                         discriminator: interaction.user.discriminator,
    //                         avatar: interaction.user.avatar
    //                     }
    //                 }).then(response => {
    //                     rankData = response.data.data
    //                 }).catch(async error => {
    //                     console.log(error)
    //                     if (interaction) {
    //                         await interaction.editReply('Error, try again.')
    //                     }
    //                 })
    //
    //                 if (rankData) {
    //                     let ubuntuFontData;
    //                     await font2base64.encodeToDataUrl('./rank-card/Ubuntu-Regular.ttf').then(data => {
    //                         ubuntuFontData = data
    //                     })
    //
    //                     const currentXp = rankData.xp - rankData.level.xp_required;
    //                     const nextXp = rankData.next_level.xp_required - rankData.level.xp_required
    //
    //                     const rankCard = await nodeHtmlToImage({
    //                         html: data.toString(),
    //                         content: {
    //                             backgroundImage: backgroundImageUri,
    //                             avatar: interaction.user.avatarURL(),
    //                             username: interaction.user.username,
    //                             discriminator: interaction.user.discriminator,
    //                             rank: rankData.rank,
    //                             level: rankData.level.level,
    //                             currentXp: currentXp,
    //                             nextLevel: rankData.next_level.level,
    //                             nextXp: nextXp,
    //                             calculatedProgress: currentXp / nextXp * 100,
    //                             fontData: ubuntuFontData
    //                         },
    //                         transparent: true
    //                     })
    //
    //                     if (interaction) {
    //                         if (rankCard) {
    //                             await interaction.followUp({files: [rankCard]})
    //                         } else {
    //                             await interaction.editReply('Error, try again.')
    //                         }
    //                     }
    //                 }
    //             } catch (ex) {
    //                 console.log(ex)
    //                 if (interaction) {
    //                     await interaction.editReply('Error, try again.')
    //                 }
    //             }
    //         });
    //     } catch (ex) {
    //         console.log(ex)
    //         if (interaction) {
    //             await interaction.editReply('Error, try again.')
    //         }
    //     }
    // }
    //
    // if (interaction.commandName === 'link-twitter') {
    //     try {
    //         await setupRedis()
    //         const user = await client.users.cache.get(interaction.member.user.id);
    //         const twitterClient = new TwitterApi({ appKey: process.env.TWITTER_API_KEY, appSecret: process.env.TWITTER_API_KEY_SECRET })
    //         const callbackUrl = process.env.TWITTER_CALLBACK_URL + '?discord_id=' + user.id
    //         const authLink = await twitterClient.generateAuthLink(callbackUrl)
    //         redisClient.set('twitter-auth-' + user.id, JSON.stringify({oauth_token: authLink.oauth_token, oauth_token_secret: authLink.oauth_token_secret}))
    //
    //         msg.reply(`Please use the following URL to link your Twitter account: ${authLink.url}`);
    //         interaction.reply({ content: 'Please look in your DM.', ephemeral: true })
    //     } catch (e) {
    //         console.log(e)
    //     }
    // }
    //
    // if (interaction.commandName === 'leaderboard') {
    //     try {
    //         const api = await axios.api()
    //         await api.get('users/leaderboard').then(response => {
    //             let description = "", count = 1;
    //             response.data.data.forEach(user => {
    //                 description += `#${count} - ${user.username} - Level: ${user.level.level} - XP: ${user.xp}\n`
    //                 count++;
    //             })
    //             const message = new MessageEmbed()
    //                 .setTitle('Leaderboard')
    //                 .setDescription(description)
    //
    //             interaction.reply({embeds: [message]})
    //         }).catch(error => {
    //             console.log(error)
    //         })
    //     } catch (e) {
    //         if (interaction) {
    //             interaction.reply("Couldn't fetch Leaderboard, try again.")
    //         }
    //     }
    // }

    if (interaction.commandName === 'wallet') {
        try {
            await interaction.deferReply({ephemeral: true});
            const wallet = interaction.options.getString('wallet');

            if (wallet) {
                await api.put('users', {
                    user: interaction.user,
                    wallet: wallet
                }).then(async response => {
                    if (response.data) {
                        if (interaction) {
                            await interaction.editReply({content: `Your wallet has been saved.`, ephemeral: true})
                        }
                    } else {
                        if (interaction) {
                            await interaction.editReply({content: `Something went wrong, try again.`, ephemeral: true})
                        }
                    }
                }).catch(async error => {
                    console.log(error)
                    if (interaction) {
                        await interaction.editReply({content: `Something went wrong, try again.`, ephemeral: true})
                    }
                })
            } else {
                if (interaction) {
                    await interaction.editReply({content: `Please enter your public Solana Wallet address.`, ephemeral: true})
                }
            }
        } catch (e) {
            console.log(e)
            if (interaction) {
                await interaction.editReply({content: `Something went wrong, try again.`, ephemeral: true})
            }
        }
    }

    if (interaction.commandName === 'mission1') {
        try {
            await interaction.deferReply({ephemeral: true})
            let mission = 1
            await api.get('missions/1', {
                params: {
                    discord_id: interaction.member.user.id,
                    username: interaction.member.user.username,
                    discriminator: interaction.member.user.discriminator,
                    avatar: interaction.member.user.avatar
                }
            }).then(response => {
                mission = response.data.status
            }).catch(async error => {
                if (interaction) {
                    await interaction.editReply({ content: "Something went wrong linking your Twitter account, please use the command /mission-1 again.", ephemeral: true})
                }
            })

            if (mission === 1) {
                const twitterClient = new TwitterApi({
                    appKey: process.env.TWITTER_API_KEY,
                    appSecret: process.env.TWITTER_API_KEY_SECRET
                })
                const callbackUrl = process.env.TWITTER_CALLBACK_URL + '?discord_id=' + interaction.member.user.id
                const authLink = await twitterClient.generateAuthLink(callbackUrl)
                if (redisClient) {
                    redisClient.set('twitter-auth-' + interaction.member.user.id, JSON.stringify({
                        oauth_token: authLink.oauth_token,
                        oauth_token_secret: authLink.oauth_token_secret
                    }), function(error) {
                        console.log(error)
                    })

                    if (interaction) {
                        await interaction.editReply({ content: `Please use the following URL to link your Twitter account: ${authLink.url}`, ephemeral: true})
                    }
                } else {
                    if (interaction) {
                        await interaction.editReply({ content: "Something went wrong linking your Twitter account, please use the command /mission-1 again.", ephemeral: true})
                    }
                }
            } else {
                if (interaction) {
                    await interaction.editReply({ content: "You have already linked your Twitter.", ephemeral: true})
                }
            }
        } catch (e) {
            if (interaction) {
                await interaction.editReply({ content: "Something went wrong linking your Twitter account, please use the command /mission-1 again.", ephemeral: true})
            }
        }
    }

    if (interaction.commandName === 'twitter') {
        if (!redisClient) {
            await setupRedis();
        }
        try {
            await interaction.deferReply({ephemeral: true})
            const twitterClient = new TwitterApi({
                appKey: process.env.TWITTER_API_KEY,
                appSecret: process.env.TWITTER_API_KEY_SECRET
            })
            const callbackUrl = process.env.TWITTER_CALLBACK_URL + '?discord_id=' + interaction.member.user.id
            const authLink = await twitterClient.generateAuthLink(callbackUrl)
            if (redisClient) {
                redisClient.set('twitter-auth-' + interaction.member.user.id, JSON.stringify({
                    oauth_token: authLink.oauth_token,
                    oauth_token_secret: authLink.oauth_token_secret
                }), function(error) {
                    console.log(error)
                })

                if (interaction) {
                    await interaction.editReply({ content: `Please use the following URL to link your Twitter account: ${authLink.url}`, ephemeral: true})
                }
            } else {
                if (interaction) {
                    await interaction.editReply({ content: "Something went wrong linking your Twitter account.", ephemeral: true})
                }
            }
        } catch (e) {
            if (interaction) {
                await interaction.editReply({ content: "Something went wrong linking your Twitter account.", ephemeral: true})
            }
        }
    }

    if (interaction.commandName === 'mission2') {
        if (!redisClient) {
            await setupRedis();
        }
        try {
            await interaction.deferReply({ephemeral: true})
            const twitterClient = new TwitterApi({
                appKey: process.env.TWITTER_API_KEY,
                appSecret: process.env.TWITTER_API_KEY_SECRET
            })
            const callbackUrl = process.env.TWITTER_MISSION_TWO + '?discord_id=' + interaction.member.user.id
            const authLink = await twitterClient.generateAuthLink(callbackUrl)
            if (redisClient) {
                redisClient.set('twitter-auth-' + interaction.member.user.id, JSON.stringify({
                    oauth_token: authLink.oauth_token,
                    oauth_token_secret: authLink.oauth_token_secret
                }), function(error) {
                    console.log(error)
                })

                if (interaction) {
                    await interaction.editReply({ content: `Please use the following URL to check if you have completed Mission 2: ${authLink.url}`, ephemeral: true})
                }
            } else {
                if (interaction) {
                    await interaction.editReply({ content: `Something went wrong linking your Twitter account`, ephemeral: true})
                }
            }
        } catch (e) {
            if (interaction) {
                await interaction.editReply({ content: `Something went wrong linking your Twitter account`, ephemeral: true})
            }
        }
    }

    if (interaction.commandName === 'mission3') {
        try {
            const client = await getClient();
            const clientGet = promisify(client.get).bind(redisClient);
            await interaction.deferReply({ephemeral: true});
            const answer = interaction.options.getString('answer');

            let completed = false
            await clientGet(`mission_3_answered_${interaction.user.id}`).then(response => {
                if (response) {
                    completed = true
                }
            }).catch(error => {
            })

            if (!completed) {
                await api.get('missions/last-completion', {
                    params: {
                        discord_id: interaction.user.id,
                        username: interaction.user.username,
                        discriminator: interaction.user.discriminator,
                        avatar: interaction.user.avatar
                    }
                }).then(async response => {
                    if (response.data.mission >= 2) {
                        redisClient.set(`mission_3_answered_${interaction.user.id}`, true)
                        if (answer === 'Nekovia' || answer === 'nekovia') {
                            await completeMission(api, interaction.user, '3');
                        }

                        if (interaction) {
                            await interaction.editReply({
                                content: `Your submission for Mission 3 has been accepted.`,
                                ephemeral: true
                            })
                        }
                    } else {
                        if (interaction) {
                            await interaction.editReply({
                                content: `You have to complete Mission 1 and Mission 2, before you can submit your answer.`,
                                ephemeral: true
                            })
                        }
                    }
                    client.quit()
                }).catch(async error => {
                    if (interaction) {
                        await interaction.editReply({
                            content: `Something went wrong, please try again.`,
                            ephemeral: true
                        })
                    }
                    client.quit()
                })
            } else {
                if (interaction) {
                    await interaction.editReply({content: `You have already submitted your answer.`, ephemeral: true})
                }
                client.quit()
            }
        } catch (e) {
            console.log(e)
            if (interaction) {
                await interaction.editReply({content: `You have already submitted your answer.`, ephemeral: true})
            }
        }
    }
})

client.on('messageCreate', async msg => {
    // This block will prevent the bot from responding to itself and other bots
    if(msg.author.bot) {
        return
    }

    if (!api) {
        api = await axios.api();
    }

    if(msg.content.startsWith("!mission2")) {
        await msg.reply(`Please use **/mission2** instead.`)
    }

    if (msg.content.startsWith("!mission-2-help")) {
        if (!redisClient) {
            await setupRedis();
        }
        try {
            const twitterClient = new TwitterApi({
                appKey: process.env.TWITTER_API_KEY,
                appSecret: process.env.TWITTER_API_KEY_SECRET
            })
            const callbackUrl = process.env.TWITTER_MISSION_TWO + '?discord_id=' + msg.author.id
            const authLink = await twitterClient.generateAuthLink(callbackUrl)
            if (redisClient) {
                redisClient.set('twitter-auth-' + msg.author.id, JSON.stringify({
                    oauth_token: authLink.oauth_token,
                    oauth_token_secret: authLink.oauth_token_secret
                }), function(error) {
                    console.log(error)
                })

                await msg.reply(`Please use the following URL to check if you have completed Mission 2: ${authLink.url}`)
            } else {
                await msg.reply("Something went wrong linking your Twitter account.")
            }
        } catch (e) {
            await msg.reply("Something went wrong linking your Twitter account.")
        }
    }
})

client.login(process.env.DISCORD_BOT_TOKEN)

async function getClient() {
    const client = await redis.createClient(process.env.REDIS_URL)
    redisClient.on("error", function (error) {
        console.error(error);
    });

    return client;
}

async function setupRedis() {
    if (!redisClient) {
        redisClient = await redis.createClient(process.env.REDIS_URL)
        redisClient.on("error", function (error) {
            console.error(error);
        });

        getAsync = promisify(redisClient.get).bind(redisClient)
    }
}

function wordCount(string) {
    return string.split(' ').length;
}