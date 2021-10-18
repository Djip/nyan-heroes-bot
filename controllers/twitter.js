const redis = require('redis')
const {promisify} = require("util");
const {TwitterApi} = require("twitter-api-v2");
const axios = require('../modules/axios')
const {Client, Intents} = require("discord.js");
const {completeMission} = require("../util");
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
        res.send(`Your Twitter account has been linked successfully.`)
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
                }).catch(error => {
                    console.log(error)
                    res.send(`Something went wrong linking your Twitter account, please try again.`)
                    redisClient.quit()
                })
            }).catch(error => {
                console.log(error)
                res.send(`Something went wrong linking your Twitter account, please try again.`)
                redisClient.quit()
            })
        }).catch(error => {
            console.log(error)
            res.send(`Something went wrong linking your Twitter account, please try again.`)
            redisClient.quit()
        })
    }
}

async function missionTwo(req, res) {
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
        res.send(`Your Twitter account has been linked successfully.`)
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
                    // await loggedClient.v2.userLikedTweets(twitterUser.id).then(async tweetResponse => {
                    //     const likes = tweetResponse.tweets;
                    //     let liked = false;
                    //     for (const like of likes) {
                    //         if (like.id === process.env.MISSION_TWO_TWEET_ID) {
                    //             liked = true;
                    //         }
                    //     }
                    //
                    //     if (liked) {
                    //         let retweeted = false;
                    //         const users = await loggedClient.v2.tweetRetweetedBy(process.env.MISSION_TWO_TWEET_ID);
                    //
                    //         users.data.forEach(user => {
                    //             if (user.username === response.data.screen_name) {
                    //                 retweeted = true
                    //             }
                    //         })
                    //
                    //         if (retweeted) {
                    //             await loggedClient.v2.userTimeline(twitterUser.id).then(async tweetResponse => {
                    //                 let commented = false;
                    //                 for (const tweet of tweetResponse.tweets) {
                    //                     if (tweet.text.match(/RT @nyanheroes/gi)) {
                    //                         retweeted = true;
                    //                     }
                    //                     let tagCount = tweet.text.match(/@/g);
                    //                     if (tweet.text.match(/@nyanheroes/gi) && tweet.text.match(/#nyanarmy/gi) && tagCount && tagCount.length >= 4) {
                    //                         commented = true;
                    //                     }
                    //                 }
                    //
                    //                 if (!commented) {
                    //                     await msg.reply(`In order to complete this mission, you have to reply under the post and tag 3 friends, and include #nyanarmy.`)
                    //                 } else {
                    //                     await completeMission(api, msg.author, 2);
                    //                     res.send(`You have officially completed Mission 2!`)
                    //                 }
                    //             }).catch(async error => {
                    //                 console.log(error)
                    //                 res.send(`Something went wrong trying to check Mission 2, please try to re-react to the message. Remember you have to have completed Mission 1 to complete mission 2.`)
                    //             })
                    //         } else {
                    //             res.send(`In order to complete this mission, you have to Retweet the post.`)
                    //         }
                    //     } else {
                    //         res.send(`In order to complete this mission, you have to Like the post.`)
                    //     }
                    // }).catch(async error => {
                    //     console.log(error)
                    //     res.send(`Please try again in 15 minutes.`)
                    // })

                    await loggedClient.v2.userTimeline(twitterUser.id, {'tweet.fields': ['id', 'created_at']}).then(async tweetResponse => {
                        let retweeted = false;
                        let commented = false;
                        for (const tweet of tweetResponse.tweets) {
                            if (tweet.created_at > '2021-10-18 20:00:00') {
                                if (tweet.text.match(/RT @nyanheroes/gi)) {
                                    retweeted = true;
                                }
                                let tagCount = tweet.text.match(/@/g);
                                if (tweet.text.match(/@nyanheroes/gi) && tweet.text.match(/#nyanarmy/gi) && tagCount && tagCount.length >= 4) {
                                    commented = true;
                                }
                            }
                        }

                        if (!retweeted) {
                            await res.send(`In order to complete this mission, retweet the post.`)
                        } else if (!commented) {
                            await res.send(`In order to complete this mission, you have to reply under the post and tag 3 friends, and include #nyanarmy.`)
                        } else {
                            await completeMission(api, discordUser, 2);
                            await res.send(`You have officially completed Mission 2!`)
                        }
                    })

                    redisClient.quit()
                }).catch(error => {
                    console.log(error)
                    res.send(`Something went wrong linking your Twitter account, please try again.`)
                    redisClient.quit()
                })
            }).catch(error => {
                console.log(error)
                res.send(`Something went wrong linking your Twitter account, please try again.`)
                redisClient.quit()
            })
        }).catch(error => {
            console.log(error)
            res.send(`Something went wrong linking your Twitter account, please try again.`)
            redisClient.quit()
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
    missionTwo,
    interactions
}