require('dotenv').config({ path: '../.env' });

const { Client, Intents, MessageEmbed } = require('discord.js');
const redis = require("redis");
const {promisify} = require("util");
const {TwitterApi} = require("twitter-api-v2");
const axios = require('../modules/axios')
const { validateEmail, completeMission } = require("../util")

const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MEMBERS, Intents.FLAGS.GUILD_MESSAGE_REACTIONS, Intents.FLAGS.DIRECT_MESSAGES, Intents.FLAGS.DIRECT_MESSAGE_TYPING, Intents.FLAGS.DIRECT_MESSAGE_REACTIONS] });
const emoji = '<:NyanWave:894093355552768060>'
const emojiId = '894093355552768060'
let redisClient, getAsync;
const missionClients = [];
let api;

client.on('ready', async interaction => {
    const users = []

    const guild = await client.guilds.cache.get(process.env.DISCORD_NYAN_HEROES_GUILT_ID)

    for (const user of users) {
        await guild.members.fetch(user).then(async fetchedUser => {
            await fetchedUser.roles.add('898673067977506816').then(response => {
                // console.log("Role added");
            }).catch(error => {
                console.log(error)
            })
        }).catch(error => {
            console.log(user + ' left')
        })
    }

    process.exit()
})

client.login(process.env.DISCORD_BOT_TOKEN).then().catch(error => {
    console.log("Discord Client Login Error")
    console.log(process.env.DISCORD_BOT_TOKEN)
    console.log(error)
})