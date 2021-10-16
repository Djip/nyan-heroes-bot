const redis = require('redis')
const {promisify} = require("util");
const {TwitterApi} = require("twitter-api-v2");
const axios = require('../modules/axios')
const {Client, Intents} = require("discord.js");
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });

client.login(process.env.DISCORD_BOT_TOKEN)

async function callback(req, res) {
    const redisClient = await redis.createClient(process.env.REDIS_URL)
    redisClient.on("error", function (error) {
        console.error(error);
    });

    const getAsync = promisify(redisClient.get).bind(redisClient)

    let credentials;
    await getAsync('twitter-auth-' + req.query.discord_id).then(response => {
        credentials = JSON.parse(response)
        redisClient.del('twitter-auth-' + req.query.discord_id);
    }).catch(error => {
        res.status(400).send('Something went wrong, try again.')
    });
    const { oauth_verifier } = req.query

    if (!credentials) {
        res.send(`Your Twitter account has been linked successfully, please proceed to your next task.`)
        redisClient.quit()
    } else if (!credentials.oauth_token || !oauth_verifier || !credentials.oauth_token_secret) {
        redisClient.quit()
        return res.status(400).send('You denied the app or your session expired!');
    } else {
        const twitterClient = new TwitterApi({
            appKey: process.env.TWITTER_API_KEY,
            appSecret: process.env.TWITTER_API_KEY_SECRET,
            accessToken: credentials.oauth_token,
            accessSecret: credentials.oauth_token_secret
        })

        let discordUser
        await client.guilds.fetch(process.env.DISCORD_NYAN_HEROES_GUILT_ID).then(async guild => {
            await guild.members.fetch(req.query.discord_id).then(member => {
                discordUser = member.user
            }).catch(error => {
                console.log(error)
            })
        }).catch(error => {
            console.log(error)
        })

        await twitterClient.login(oauth_verifier).then(async ({client: loggedClient, accessToken, accessSecret}) => {
            await loggedClient.currentUser().then(async  twitterUser => {
                const api = await axios.api()
                await api.post('twitter/information', {
                    user: discordUser,
                    access_token: accessToken,
                    access_secret: accessSecret,
                    id: twitterUser.id,
                    screen_name: twitterUser.screen_name,
                }).then(async data => {
                    res.send(`Your Twitter account has been linked successfully. Be sure that you have filled out the Google form with your Solana Wallet address to enter the raffle.`)
                    // await discordUser.send(`Your Twitter account has been linked`);
                    //
                    // // Put a date/time restriciton on this
                    // redisClient.publish("mission_1_" + req.query.discord_id, "2")
                    redisClient.quit()

                    // closeWindow(res)
                    // await checkTweets(loggedClient, twitterUser, discordUser)
                }).catch(error => {
                    console.log(error)
                    res.send(`Something went wrong linking your Twitter account, please use the command /mission-1 again.`)
                    redisClient.quit()
                    // console.log(error)
                    // closeWindow(res)
                    // discordUser.send(`Something went wrong linking your Twitter account, please try again.`);
                })
            }).catch(error => {
                console.log(error)
                res.send(`Something went wrong linking your Twitter account, please use the command /mission-1 again.`)
                redisClient.quit()
                // console.log(error)
                // closeWindow(res)
                // discordUser.send(`Something went wrong linking your Twitter account, please try again.`);
            })
        }).catch(error => {
            console.log(error)
            res.send(`Something went wrong linking your Twitter account, please use the command /mission-1 again.`)
            redisClient.quit()
            // console.log(error)
            // closeWindow(res)
            // discordUser.send(`Something went wrong linking your Twitter account, please try again.`);
        })
    }
}

async function interactions(loggedClient, twitterUser, discordUser) {
    await checkTweets()
}

function closeWindow(res) {
    res.send('<script>window.close()</script>')
}

async function checkTweets(loggedClient, twitterUser, apiUser) {
    const api = await axios.api()
    let tweets = []
    await loggedClient.v2.userTimeline(twitterUser.id, {exclude: 'replies'}).then(async response => {
        tweets = tweets.concat(response.tweets)

        const tweetXp = []
        for (const tweet of tweets) {
            if (tweet.text.indexOf("RT @nyanheroes") !== -1) {
                tweetXp.push(tweet)
            }
        }

        await api.post('twitter/xp/retweet', {tweets: tweetXp, user: apiUser}).then(response => {

        }).catch(error => {
            console.log(error)
        })
    }).catch(error => {
        console.log(error)
    })
}

module.exports = {
    callback,
    interactions
}