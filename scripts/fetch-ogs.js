require('dotenv').config({ path: '../.env' });

const { Client, Intents } = require('discord.js');
const axios = require('../modules/axios')

const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MEMBERS] });

client.on('ready', async interaction => {
    const api = await axios.api();
    const guild = await client.guilds.cache.get(process.env.DISCORD_NYAN_HEROES_GUILT_ID)
    await guild.members.fetch()
    const members = await guild.roles.cache.get('880095627487379556').members;
    const saveMembers = [];

    await members.forEach(member => {
        saveMembers.push(member.user);
    })

    await api.post('users/ogs', {members: saveMembers}).then(reponse => {
        console.log('Members saved')
    }).catch(error => {
        console.log(error)
    })
})

client.login(process.env.DISCORD_BOT_TOKEN)