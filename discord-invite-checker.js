require('dotenv').config();

const { REST }  = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { Client, Intents} = require('discord.js');
const axios = require('./modules/axios')

const rest = new REST({version: '9'}).setToken(process.env.DISCORD_BOT_TOKEN);
const client = new Client({intents: [Intents.FLAGS.GUILDS]});
client.login(process.env.DISCORD_BOT_TOKEN);

(async () => {
    try {
        const api = await axios.api();

        await rest.get(Routes.guildInvites(process.env.DISCORD_NYAN_HEROES_GUILT_ID)).then(async response => {
            for (const invite of response) {
                if (invite.uses > 0) {
                    api.post('discord-invites/give-xp', invite).then(response => {
                        console.log(response)
                    }).catch(error => {
                        console.log(error)
                    })
                }
            }
        })
    } catch (error) {
        console.error(error)
    }
})();