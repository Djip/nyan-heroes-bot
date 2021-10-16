require('dotenv').config({ path: '../.env' });

const { Client, Intents, MessageEmbed } = require('discord.js');
const redis = require("redis");
const {promisify} = require("util");
const {TwitterApi} = require("twitter-api-v2");
const axios = require('../modules/axios')
const { validateEmail, completeMission } = require("../util")

const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MESSAGE_REACTIONS, Intents.FLAGS.DIRECT_MESSAGES, Intents.FLAGS.DIRECT_MESSAGE_TYPING, Intents.FLAGS.DIRECT_MESSAGE_REACTIONS] });
const emoji = '<:NyanWave:894093355552768060>'
const emojiId = '894093355552768060'
let redisClient, getAsync;
const missionClients = [];
let api;

client.on('ready', async interaction => {
    await setupRedis()
    api = await axios.api();
    const messageEmbed = new MessageEmbed()
        .setTitle('🔼 MISSION 1 INCOMING TRANSMISSION 🔼')
        .setDescription(`
TIME START:  October 16th @ 11 AM PST
TIME END:  October 17th @ 9 AM PST

[▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬]

🔽 MISSION 1 TASKS 🔽

Task 1 - First make sure your "Direct Messages" are ENABLED in your discord privacy settings
Task 2 - React to the ${emoji} below this message and our NYAN BOT will send you a DM with further instructions
Task 3 - Fill out your information with our NYAN BOT - Twitter, Email and Solana Wallet Address (MAKE SURE YOU TRIPLE CHECK YOUR WALLET ADDRESS!!!!)
Task 4 - Follow our Twitter https://twitter.com/nyanheroes and Telegram https://t.me/nyanheroes/
Task 5 - Change your discord nickname to include the word "NYAN" in it

[▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬]

Once your tasks are complete, our NYAN BOT will send you a confirmation message.

Up to 1000 of you trainees will win a whitelist spot to mint a Genesis NYAN.

😼 Good luck on your first mission soldier!😼
`)

    const channel = client.guilds.cache.get(process.env.DISCORD_NYAN_HEROES_GUILT_ID).channels.cache.get('896318245127225354');

    const message = await channel.send({ embeds: [messageEmbed] })
    await message.react(emoji)

    client.on('messageReactionAdd', async (reaction, user) => {
        if (reaction.emoji.id === emojiId && user.id !== process.env.DISCORD_BOT_CLIENT_ID && reaction.message.id === message.id) {
            let missionClient;
            try {
                let mission = 1;
                await api.get('missions/1', {
                    params: {
                        discord_id: user.id,
                        username: user.username,
                        discriminator: user.discriminator,
                        avatar: user.avatar
                    }
                }).then(response => {
                    mission = response.data.status
                }).catch(async error => {
                    await user.send(`Something went during Mission 1, please try to re-react to the message.`).then().catch()
                })

                if (mission !== 4) {
                    if (mission === 1) {
                        const twitterClient = new TwitterApi({
                            appKey: process.env.TWITTER_API_KEY,
                            appSecret: process.env.TWITTER_API_KEY_SECRET
                        })
                        const callbackUrl = process.env.TWITTER_CALLBACK_URL + '?discord_id=' + user.id
                        const authLink = await twitterClient.generateAuthLink(callbackUrl)
                        if (redisClient) {
                            redisClient.set('twitter-auth-' + user.id, JSON.stringify({
                                oauth_token: authLink.oauth_token,
                                oauth_token_secret: authLink.oauth_token_secret
                            }))
                            await user.send(`Please use the following URL to link your Twitter account: ${authLink.url}`).catch(e => {
                                console.log(e)
                            });
                        }
                    } else if (mission === 2) {
                        await stepTwo(user)
                    } else if (mission === 3) {
                        await stepThree(user)
                    }

                    missionClient = await setupClient()
                    missionClient.on("message", async (channel, progress) => {
                        let data = channel.split('_')
                        const guild = await client.guilds.cache.get(process.env.DISCORD_NYAN_HEROES_GUILT_ID)
                        const user = await guild.members.fetch(data[2])

                        if (progress === "2") {
                            await stepTwo(user)
                        } else if (progress === "3") {
                            await stepThree(user)
                        } else if (progress === "4") {
                            await stepFour(user)
                        }
                    })
                    missionClient.subscribe('mission_1_' + user.id)
                    missionClients.push(missionClient)
                } else {
                    await stepFour(user)
                }
            } catch (e) {
                if (missionClient) {
                    removeMissionClient(missionClient)
                }

                await user.send(`Something went during Mission 1, please try to re-react to the message.`).catch()

                console.log(e)
            }
        }
    })
})

client.login(process.env.DISCORD_BOT_TOKEN).then().catch(error => {
    console.log("Discord Client Login Error")
    console.log(process.env.DISCORD_BOT_TOKEN)
    console.log(error)
})

function removeMissionClient(missionClient) {
    missionClient.unsubscribe()
    missionClient.quit()
    missionClients.splice(missionClients.indexOf(missionClient), 1)
}

async function setupRedis() {
    if (!redisClient) {
        redisClient = await setupClient()

        getAsync = promisify(redisClient.get).bind(redisClient)
    }
}

async function setupClient() {
    const client = await redis.createClient(process.env.REDIS_URL, {
        tls: {
            rejectUnauthorized: false
        }
    })
    client.on("error", function (error) {
        console.error(error);
    });

    return client;
}

async function stepTwo(user) {
    try {
        const message = await user.send(`Please enter your email`)

        message.channel.awaitMessages({ time: 60000, max: 1, errors: ['time'] }).then(async collected => {
            const message = collected.last();

            if (validateEmail(message.content)) {
                await api.post('missions/1', { user: message.author, email: message.content}).then(async response => {
                    await message.author.send(`Your email has been saved`).catch()
                    redisClient.publish("mission_1_" + message.author.id, "3")
                }).catch(error => {
                    message.author.send(`Something went during Mission 1, please try to re-react to the message.`).catch()
                })
            }
        }).catch(error => {
            console.log(error)
        })
    } catch (e) {
        console.log(e)
    }
}

async function stepThree(user) {
    try {
        const message = await user.send(`Please enter your public Solana Wallet address - Triple check that it is correct!`)

        message.channel.awaitMessages({time: 60000, max: 1, errors: ['time']}).then(async collected => {
            const message = collected.last();

            await api.post('missions/1', {user: message.author, wallet: message.content}).then(async response => {
                await message.author.send(`Your Wallet has been saved`).catch(error => {
                    console.log(error)
                })
                redisClient.publish("mission_1_" + message.author.id, "4")
            }).catch(error => {
                message.author.send(`Something went during Mission 1, please try to re-react to the message.`).catch()
            })
        }).catch(error => {
            console.log(error)
        })
    } catch (e) {
        console.log(e)
    }
}

async function stepFour(user) {
    try {
        let guild = await client.guilds.cache.get(process.env.DISCORD_NYAN_HEROES_GUILT_ID)
        let fetchedUser = await guild.members.fetch(user.id)
        if (fetchedUser.nickname.match(/Nyan/gi)) {
            await completeMission(api, user, 1)
            await user.send(`You have officially completed Mission 1!`)
        } else {
            await user.send(`Remember to change your nickname to include "Nyan" in order to fully complete mission 1. We will automatically check again in 2 minutes from now.`)
            setTimeout( async () => {
                try {
                    let guild = await client.guilds.fetch(process.env.DISCORD_NYAN_HEROES_GUILT_ID)
                    await guild.members.fetch({ user: user.id, force: true}).then(response => {
                        fetchedUser = response
                    })
                    if (fetchedUser.nickname.match(/Nyan/gi)) {
                        await completeMission(api, user, 1)
                        await user.send(`You have officially completed Mission 1!`).catch()
                    } else {
                        await user.send(`Remember to change your nickname to include "Nyan" in order to fully complete mission 1. Please re-react to the message in the #mission-1 channel to complete Mission 1, when you have changed your nickname.`).catch()
                    }
                } catch (e) {
                    console.log(e)
                }
            }, 10000)
        }
    } catch (e) {
        console.log(e)
    }
}