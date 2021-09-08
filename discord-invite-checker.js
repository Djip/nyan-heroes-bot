require('dotenv').config();

const { REST }  = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { Client, Intents} = require('discord.js');
const fs = require('fs');
const nodeHtmlToImage = require('node-html-to-image');
const axios = require('./modules/axios')

const rest = new REST({version: '9'}).setToken(process.env.DISCORD_BOT_TOKEN);
const client = new Client({intents: [Intents.FLAGS.GUILDS]});
client.login(process.env.DISCORD_BOT_TOKEN);

(async () => {
    try {
        const api = await axios.api();

        let channel = null;

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
        return;

        await client.guilds.fetch(process.env.DISCORD_NYAN_HEROES_GUILT_ID).then(async response => {
            await response.channels.fetch('880448290477465642').then(async data => {
                console.log(data)
                channel = data

                await fs.readFile(__dirname + '/rank-card/index.html', async (err, data) => {
                    const backgroundImage = fs.readFileSync('./rank-card/background.png');
                    const base64BackgroundImage = new Buffer.from(backgroundImage).toString('base64');
                    const backgroundImageUri = 'data:image/png;base64,' + base64BackgroundImage;

                    const rankCard = await nodeHtmlToImage({
                        html: data.toString(),
                        content: { backgroundImage: backgroundImageUri},
                    })

                    channel.send({files: [rankCard]})
                });

                // channel.send(`!give-xp <@135130716219375617> 1`);

            })
        })

        return false
        if (channel) {
            await rest.get(Routes.guildInvites(process.env.DISCORD_NYAN_HEROES_GUILT_ID)).then(response => {
                response.forEach(invite => {
                    console.log(invite);
                    if (invite.uses > 0) {
                        channel.send(invite.inviter.username);
                        console.log(invite.inviter.username)
                    }
                })
            })
        }
    } catch (error) {
        console.error(error)
    }
})();

/*
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');

const commands = [{
    name: 'ping',
    description: 'Replies with Pong!'
}];

const rest = new REST({ version: '9' }).setToken(process.env.DISCORD_BOT_TOKEN);

(async () => {
    try {
        console.log('Started refreshing application (/) commands.');

        await rest.put(
            Routes.applicationGuildCommands(879737229705097286, 873169142742679607),
            { body: commands },
        );

        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error(error);
    }
})();

*/