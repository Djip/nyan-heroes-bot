require('dotenv').config();

const { SlashCommandBuilder } = require('@discordjs/builders');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');

const commandsHook = [
    new SlashCommandBuilder().setName('test').setDescription('Fetch current rank/level information'),
]
    .map(command => command.toJSON());

const rest = new REST({ version: '9' }).setToken(process.env.DISCORD_BOT_TOKEN);

(async () => {
    try {
        await rest.put(
            Routes.applicationGuildCommands(process.env.DISCORD_BOT_CLIENT_ID, process.env.DISCORD_NYAN_HEROES_GUILT_ID),
            { body: commandsHook },
        );

        console.log('Successfully registered application commandsHook.');
    } catch (error) {
        console.error(error);
    }
})();