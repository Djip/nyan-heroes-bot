require('dotenv').config();

const { Client, Intents } = require('discord.js');
const fs = require("fs");
const nodeHtmlToImage = require("node-html-to-image");

const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });


client.on('messageCreate', async message => {
    console.log(message)
})

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) {
        return;
    }

    if (interaction.commandName === 'test') {
        await fs.readFile(__dirname + '/rank-card/index.html', async (err, data) => {
            const backgroundImage = fs.readFileSync('./rank-card/background.png');
            const base64BackgroundImage = new Buffer.from(backgroundImage).toString('base64');
            const backgroundImageUri = 'data:image/png;base64,' + base64BackgroundImage;

            const rankCard = await nodeHtmlToImage({
                html: data.toString(),
                content: {
                    backgroundImage: backgroundImageUri,
                    avatar: interaction.user.avatarURL(),
                    username: interaction.user.username,
                    discriminator: interaction.user.discriminator
                },
                transparent: true
            })

            if (interaction) {
                interaction.reply({files: [rankCard]})
            }
        });
    }
})

client.login(process.env.DISCORD_BOT_TOKEN)