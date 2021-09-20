const redis = require('redis')
const {promisify} = require("util");
const {TwitterApi} = require("twitter-api-v2");
const axios = require('../modules/axios')
const {Client, Intents} = require("discord.js");
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });

client.login(process.env.DISCORD_BOT_TOKEN)

exports.callback = async function (req, res) {
    const redisClient = await redis.createClient(process.env.REDIS_URL, {
        tls: {
            rejectUnauthorized: false
        }
    })
    redisClient.on("error", function (error) {
        console.error(error);
    });

    const getAsync = promisify(redisClient.get).bind(redisClient)

    let credentials;
    await getAsync('twitter-auth-' + req.query.discord_id).then(response => {
        credentials = JSON.parse(response)
    }).catch(error => {
        res.status(400).send('Something went wrong, try again.')
    });
    const { oauth_verifier } = req.query

    if (!credentials.oauth_token || !oauth_verifier || !credentials.oauth_token_secret) {
        return res.status(400).send('You denied the app or your session expired!');
    }

    const twitterClient = new TwitterApi({
        appKey: process.env.TWITTER_API_KEY,
        appSecret: process.env.TWITTER_API_KEY_SECRET,
        accessToken: credentials.oauth_token,
        accessSecret: credentials.oauth_token_secret
    })

    await twitterClient.login(oauth_verifier).then(async ({client: loggedClient, accessToken, accessSecret}) => {
        await loggedClient.currentUser().then(async user => {
            let success;
            const api = await axios.api()
            const discordUser = await client.users.cache.get(req.query.discord_id);
            await api.post('twitter/information', {
                user: discordUser,
                access_token: accessToken,
                access_secret: accessSecret,
                id: user.id,
                screen_name: user.screen_name,
            }).then(data => {
                discordUser.send(`Your Twitter account has been linked`);
                success = true
            }).catch(error => {
                console.log(error)
                discordUser.send(`Something went wrong linking your Twitter account, please try again.`);
                success = false
            })

            if (success) {
                await loggedClient.v2.userTimeline(user.id).then(response => {
                    for (const tweet of response) {
                        console.log(tweet)
                    }
                }).catch(error => {
                    console.log(error)
                })
            }
        }).catch(error => {
            console.log(error)
            res.status(403).send('Something went wrong, please try again.')
        })
    }).catch(error => {
        console.log(error)
        res.status(403).send('Invalid verifier or access tokens!')
    })
}