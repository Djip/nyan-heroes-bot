require('dotenv').config({ path: '../.env' });

const { Client, Intents, MessageEmbed } = require('discord.js');
const redis = require("redis");
const {promisify} = require("util");
const {TwitterApi} = require("twitter-api-v2");
const axios = require('../modules/axios')
const { validateEmail } = require("../util")

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
        .setTitle('Mission 1')
        .setDescription("Test description\nTest description")

    const channel = client.guilds.cache.get(process.env.DISCORD_NYAN_HEROES_GUILT_ID).channels.cache.get('896318245127225354');

    const message = await channel.send({ embeds: [messageEmbed] })
    message.react(emoji)

    client.on('messageReactionAdd', async (reaction, user) => {
        if (reaction.emoji.id === emojiId && user.id !== process.env.DISCORD_BOT_CLIENT_ID) {
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
                }).catch(error => {

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

                    const missionClient = await setupClient()
                    missionClient.on("message", async (channel, progress) => {
                        let data = channel.split('_')
                        const guild = await client.guilds.cache.get(process.env.DISCORD_NYAN_HEROES_GUILT_ID)
                        const user = await guild.members.fetch(data[2])

                        if (progress === "2") {
                            await stepTwo(user)
                        } else if (progress === "3") {
                            await stepThree(user)
                        } else if (progress === "4") {
                            await stepFour(user.user)
                        }
                    })
                    missionClient.subscribe('mission_1_' + user.id)
                    missionClients.push(missionClient)
                } else {
                    await stepFour(user)
                }
            } catch (e) {
                console.log(e)
            }
        }
    })
})

client.login(process.env.DISCORD_BOT_TOKEN)

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
                    await message.author.send(`Your email has been saved`)
                    redisClient.publish("mission_1_" + message.author.id, "3")
                }).catch(error => {
                    message.author.send(``)
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
                await message.author.send(`Your Wallet has been saved`)
                redisClient.publish("mission_1_" + message.author.id, "4")
            }).catch(error => {
                message.author.send(``)
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
        const guild = await client.guilds.cache.get(process.env.DISCORD_NYAN_HEROES_GUILT_ID)
        const fetchedUser = await guild.members.fetch(user.id)
        if (fetchedUser.nickname.match(/Nyan/gi)) {
            await user.send(`You have officially completed Mission 1!`)
        } else {
            await user.send(`Remember to change your nickname to include "Nyan" in order to fully complete mission 1. We will automatically check again in 2 minutes from now.`)
            setTimeout(async () => {
                const guild = await client.guilds.cache.get(process.env.DISCORD_NYAN_HEROES_GUILT_ID)
                const fetchedUser = await guild.members.fetch(user.id)
                if (fetchedUser.nickname.match(/Nyan/gi)) {
                    await user.send(`You have officially completed Mission 1!`)
                } else {
                    await user.send(`Remember to change your nickname to include "Nyan" in order to fully complete mission 1. Please re-react to the message in the #mission-1 channel to complete Mission 1, when you have changed your nickname.`)
                }
            }, 120000)
        }
    } catch (e) {
        console.log(e)
    }
}