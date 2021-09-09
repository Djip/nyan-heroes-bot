require('dotenv').config();

const { SlashCommandBuilder } = require('@discordjs/builders');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { Client, Intents } = require('discord.js');
const client = new Client({intents: [Intents.FLAGS.GUILDS]});
client.login(process.env.DISCORD_BOT_TOKEN);

const everyoneRoleId = 873169142742679607;
const teamRoleId = 878912061592190976;

const commandsHook = [
    new SlashCommandBuilder()
        .setName('test')
        .setDescription('Fetch current rank/level information'),
    new SlashCommandBuilder()
        .setName('give-xp')
        .setDescription('Fetch current rank/level information')
        .addUserOption(option => option.setName('user').setDescription('The user to give xp').setRequired(true))
        .addIntegerOption(option => option.setName('xp').setDescription('How much xp to give').setRequired(true)),
    new SlashCommandBuilder()
        .setName('subtract-xp')
        .setDescription('Fetch current rank/level information')
        .addUserOption(option => option.setName('user').setDescription('The user to give xp').setRequired(true))
        .addIntegerOption(option => option.setName('xp').setDescription('How much xp to give').setRequired(true)),
]
    .map(command => command.toJSON());

const rest = new REST({ version: '9' }).setToken(process.env.DISCORD_BOT_TOKEN);

(async () => {
    try {
        await rest.put(
            Routes.applicationGuildCommands(process.env.DISCORD_BOT_CLIENT_ID, process.env.DISCORD_NYAN_HEROES_GUILT_ID),
            { body: commandsHook },
        ).then(async response => {
            const fullPermissions = []
            response.forEach(commandInfo => {
                if (commandInfo.name === 'give-xp' || commandInfo.name === 'subtract-xp') {
                    fullPermissions.push({
                        id: commandInfo.id,
                        permissions: [
                            {
                                id: everyoneRoleId,
                                type: 'ROLE',
                                permission: false
                            },
                            {
                                id: teamRoleId,
                                type: 'ROLE',
                                permission: true
                            }
                        ]
                    })
                }
            })

            await client.guilds.cache.get(process.env.DISCORD_NYAN_HEROES_GUILT_ID)?.commands.permissions.set({fullPermissions})
        });

        console.log('Successfully registered application commandsHook.');
    } catch (error) {
        console.error(error);
    }
})();