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
    // new SlashCommandBuilder()
    //     .setName('rank-test')
    //     .setDescription('Fetch current rank/level information'),
    // new SlashCommandBuilder()
    //     .setName('leaderboard')
    //     .setDescription('Fetch top 10 Leaderboard'),
    // new SlashCommandBuilder()
    //     .setName('give-xp')
    //     .setDescription('Fetch current rank/level information')
    //     .addUserOption(option => option.setName('user').setDescription('The user to give xp').setRequired(true))
    //     .addIntegerOption(option => option.setName('xp').setDescription('How much xp to give').setRequired(true)),
    // new SlashCommandBuilder()
    //     .setName('subtract-xp')
    //     .setDescription('Fetch current rank/level information')
    //     .addUserOption(option => option.setName('user').setDescription('The user to give xp').setRequired(true))
    //     .addIntegerOption(option => option.setName('xp').setDescription('How much xp to give').setRequired(true)),
    // new SlashCommandBuilder()
    //     .setName('link-twitter')
    //     .setDescription('Link your Twitter to gain XP from re-tweets'),
    new SlashCommandBuilder()
        .setName('mission1')
        .setDescription('Link your Twitter'),
    new SlashCommandBuilder()
        .setName('mission2')
        .setDescription('Check if you have completed Mission 2'),
    new SlashCommandBuilder()
        .setName('twitter')
        .setDescription('Link your Twitter'),
    new SlashCommandBuilder()
        .setName('wallet')
        .setDescription('Save your wallet')
        .addStringOption(option => option.setName('wallet').setDescription('Please enter your public Solana Wallet address').setRequired(true)),
    new SlashCommandBuilder()
        .setName('mission3')
        .setDescription('Please choose your final answer.')
        .addStringOption(option => option.setName('answer')
            .setDescription('Please choose your final answer.')
            .setRequired(true)
            .addChoice('Catopia', 'catopia')
            .addChoice('Nyanland', 'nyanland')
            .addChoice('Nekovia', 'nekovia')
            .addChoice('Guardia', 'guardia')),
    new SlashCommandBuilder()
        .setName('mission4a')
        .setDescription('Please choose your final answer.')
        .addStringOption(option => option.setName('answer')
            .setDescription('Please choose your final answer.')
            .setRequired(true)
            .addChoice('6', '6')
            .addChoice('7', '7')
            .addChoice('8', '8')
            .addChoice('9', '9')),
    new SlashCommandBuilder()
        .setName('mission4b')
        .setDescription('Please choose your final answer.')
        .addStringOption(option => option.setName('answer')
            .setDescription('Please choose your final answer.')
            .setRequired(true)
            .addChoice('Protectors', 'protectors')
            .addChoice('Guardians', 'guardians')
            .addChoice('Defenders', 'defenders')
            .addChoice('Champions', 'champions')),
    new SlashCommandBuilder()
        .setName('mission4c')
        .setDescription('Please choose your final answer.')
        .addStringOption(option => option.setName('answer')
            .setDescription('Please choose your final answer.')
            .setRequired(true)
            .addChoice('Warrior', 'warrior')
            .addChoice('Soldier', 'soldier')
            .addChoice('Brawler', 'brawler')
            .addChoice('Defender', 'defender'))
]
    .map(command => command.toJSON());

const rest = new REST({ version: '9' }).setToken(process.env.DISCORD_BOT_TOKEN);

(async () => {
    try {
        await rest.put(
            Routes.applicationGuildCommands(process.env.DISCORD_BOT_CLIENT_ID, process.env.DISCORD_NYAN_HEROES_GUILT_ID),
            { body: commandsHook },
        ).then(async response => {
            for (const commandInfo of response) {
                if (commandInfo.name === 'give-xp' || commandInfo.name === 'subtract-xp' || commandInfo === 'rank' || commandInfo === 'link-twitter' || commandInfo === 'leaderboard') {
                    let command;
                    await client.guilds.cache.get(process.env.DISCORD_NYAN_HEROES_GUILT_ID).commands.fetch(commandInfo.id).then(data => {
                        command = data;
                        console.log(data)
                    }).catch(error => {
                        console.log(error)
                    });

                    const permissions = [
                        {
                            id: everyoneRoleId.toString(),
                            type: 'ROLE',
                            permission: false
                        },
                        {
                            id: teamRoleId.toString(),
                            type: 'ROLE',
                            permission: true
                        }
                    ]

                    await command.permissions.add({ permissions })
                }
            }
        });

        process.exit()
        console.log('Successfully registered application commandsHook.');
    } catch (error) {
        console.error(error);
    }
})();