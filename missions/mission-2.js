require('dotenv').config({ path: '../.env' });

const { Client, Intents, MessageEmbed } = require('discord.js');
const axios = require('../modules/axios')
const { completeMission } = require("../util")
const {TwitterApi} = require("twitter-api-v2");

const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MESSAGE_REACTIONS, Intents.FLAGS.DIRECT_MESSAGES, Intents.FLAGS.DIRECT_MESSAGE_TYPING, Intents.FLAGS.DIRECT_MESSAGE_REACTIONS] });
const emoji = '<:NyanWave:894093355552768060>'
const emojiId = '894093355552768060'
let api;

client.on('ready', async interaction => {
    api = await axios.api();
    const messageEmbedOne = new MessageEmbed()
        .setTitle('🔼 MISSION 2 INCOMING TRANSMISSION 🔼')
        .setDescription(`
TIME START:  October 18th @ 11 AM PST
TIME END:  October 19th @ 9 AM PST

[▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬]

🔽 MISSION 2 TASKS 🔽

Task 1 - Complete Mission 1 Tasks
Task 2 - LIKE and RETWEET our pinned post on Twitter https://twitter.com/nyanheroes
Task 3 - REPLY under the pinned post and tag 3 Key Opinion Leader's in the NFT community with over 5K followers, this reply should include the tag #nyanarmy
Task 4 - React to the ${emoji} below this post to check if your tasks are complete, our NYAN BOT will send you a confirmation message.

[▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬]

Up to 900 of you trainees will win a whitelist spot to mint a Genesis NYAN.
`)

    const channel = client.guilds.cache.get(process.env.DISCORD_NYAN_HEROES_GUILT_ID).channels.cache.get('896318319391567902');

    const message = await channel.send({ embeds: [messageEmbedOne] })
    await message.react(emoji)

    client.on('messageReactionAdd', async (reaction, user) => {
        if (reaction.emoji.id === emojiId && user.id !== process.env.DISCORD_BOT_CLIENT_ID && reaction.message.id === message.id) {
            try {
                let done = false;
                await api.get('missions/2', {
                    params: {
                        discord_id: user.id,
                        username: user.username,
                        discriminator: user.discriminator,
                        avatar: user.avatar
                    }
                }).then(response => {
                    if (response.data.success) {
                        done = true;
                    }
                }).catch(error => {
                    console.log(error)
                })

                if (!done) {
                    await api.get('twitter/information/current', {
                        params: {
                            discord_id: user.id,
                            username: user.username,
                            discriminator: user.discriminator,
                            avatar: user.avatar
                        }
                    }).then(async response => {
                        const twitterClient = new TwitterApi({
                            appKey: process.env.TWITTER_API_KEY,
                            appSecret: process.env.TWITTER_API_KEY_SECRET,
                            accessToken: response.data.accessToken,
                            accessSecret: response.data.accessSecret
                        })
                        const appClient = await twitterClient.appLogin()
                        await appClient.v2.userLikedTweets(response.data.twitter_id).then(async tweetResponse => {
                            const likes = tweetResponse.tweets;
                            let liked = false;
                            for (const like of likes) {
                                if (like.id === '1449059740156190721') {
                                    liked = true;
                                }
                            }

                            if (liked) {
                                await appClient.v2.userTimeline(response.data.twitter_id).then(async tweetResponse => {
                                    let retweeted = false;
                                    let commented = false;
                                    for (const tweet of tweetResponse.tweets) {
                                        if (tweet.text.match(/RT @nyanheroes/gi)) {
                                            retweeted = true;
                                        }
                                        let tagCount = tweet.text.match(/@/g);
                                        if (tweet.text.match(/@nyanheroes/gi) && tagCount && tagCount.length >= 4) {
                                            commented = true;
                                        }
                                    }

                                    if (!retweeted) {
                                        await user.send(`In order to complete this mission, you have to Retweet the pinned post.`)
                                    } else if (!commented) {
                                        await user.send(`In order to complete this mission, you have to REPLY under the pinned post and tag 3 Key Opinion Leader's in the NFT community with over 5K followers.`)
                                    } else {
                                        await completeMission(api, user, 2);
                                        await user.send(`You have officially completed Mission 2!`)
                                    }
                                }).catch(async error => {
                                    console.log(error)
                                    await user.send(`Something went wrong trying to check Mission 2, please try to re-react to the message. Remember you have to have completed Mission 1 to complete mission 2.`)
                                })
                            } else {
                                await user.send(`In order to complete this mission, you have to Like the pinned post.`)
                            }
                        }).catch(async error => {
                            console.log(error)
                            await user.send(`Something went wrong trying to check Mission 2, please try to re-react to the message. Remember you have to have completed Mission 1 to complete mission 2.`)
                        })
                    }).catch(async error => {
                        console.log(error)
                        await user.send(`Something went wrong trying to check Mission 2, please try to re-react to the message.`)
                    })
                } else {
                    await user.send(`You have officially completed Mission 2!`)
                }
            } catch (e) {
                console.log(e)
            }
        }
    })
})

client.login(process.env.DISCORD_BOT_TOKEN)