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
                    res.send(`Your Twitter account has been linked successfully. Be sure that you have filled out your Solana Wallet address to enter the raffle, using the /wallet command.`)
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
        res.send(`This link has already been used, please request a new one.`)
        redisClient.quit()
    } else if (!credentials.oauth_token || !oauth_verifier || !credentials.oauth_token_secret) {
        redisClient.quit()
        return res.status(400).send('You denied the app or your session expired!');
    } else {
        const api = await axios.api()
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

        let done = false;
        await api.get('missions/2', {
            params: {
                discord_id: discordUser.id,
                username: discordUser.username,
                discriminator: discordUser.discriminator,
                avatar: discordUser.avatar
            }
        }).then(response => {
            if (response.data.success) {
                done = true;
            }
        }).catch(error => {
            console.log(error)
        })

        if (!done) {
            await twitterClient.login(oauth_verifier).then(async ({client: loggedClient, accessToken, accessSecret}) => {
                await loggedClient.currentUser().then(async twitterUser => {
                    await loggedClient.v2.userByUsername(twitterUser.screen_name).then(async response => {
                        const twitterUserId = response.data.id

                        await api.post('twitter/information', {
                            user: discordUser,
                            access_token: accessToken,
                            access_secret: accessSecret,
                            id: twitterUserId,
                            screen_name: twitterUser.screen_name,
                        }).then(async data => {
                            await loggedClient.v2.userTimeline(twitterUserId, {
                                'expansions': 'referenced_tweets.id',
                                'tweet.fields': ['id', 'created_at']
                            }).then(async tweetResponse => {
                                let retweeted = false;
                                let commented = false;
                                // await tweetResponse.fetchNext(10).then(response => {
                                //     console.log("Fetched more results")
                                //     console.log(response)
                                // }).catch(error => {
                                //     console.log("Couldn't fetch more tweets")
                                //     console.log(error)
                                // })

                                for (const tweet of tweetResponse.tweets) {
                                    if (tweet.referenced_tweets) {
                                        console.log(tweet)
                                        if (tweet.referenced_tweets[0].id == process.env.MISSION_TWO_TWEET_ID) {
                                            if (tweet.referenced_tweets[0].type === 'retweeted' || tweet.referenced_tweets[0].type === 'quoted') {
                                                retweeted = true;
                                                console.log('retweeted')
                                            }
                                            let tagCount = tweet.text.match(/@/g);
                                            if (tweet.text.match(/@nyanheroes/gi) && tweet.text.match(/#nyanarmy/gi) && tagCount && tagCount.length >= 4) {
                                                commented = true;
                                                console.log('commented')
                                            }
                                        }
                                    }
                                }

                                if (!retweeted) {
                                    await res.send(`In order to complete this mission, retweet the post.`)
                                } else if (!commented) {
                                    await res.send(`In order to complete this mission, you have to reply under the post and tag 3 friends, and include #nyanarmy.`)
                                } else {
                                    await completeMission(api, discordUser, 2);
                                    await res.send(`You have officially completed Mission 2!<br />ATTENTION!!!! If you have NOT completed mission 1, please fill your Solana Wallet Address using the /twitter command.`)
                                }
                            }).catch(error => {
                                console.log("Timeline error")
                                console.log(error)
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
            }).catch(error => {
                console.log(error)
                res.send(`Something went wrong linking your Twitter account, please try again.`)
                redisClient.quit()
            })
        } else {
            await res.send(`You have officially completed Mission 2!<br />ATTENTION!!!! If you have NOT completed mission 1, please fill out this form with your Solana Wallet Address: <a href="https://forms.gle/JaCMQindiRXMNYZt7">https://forms.gle/JaCMQindiRXMNYZt7</a>.`)
            redisClient.quit()
        }
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