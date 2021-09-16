const redis = require('redis')
const {promisify} = require("util");
const {TwitterApi} = require("twitter-api-v2");

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

    twitterClient.login(oauth_verifier).then(({ client: loggedClient, accessToken, accessSecret }) => {
        console.log(loggedClient)
        console.log(accessToken)
        console.log(accessSecret)
    }).catch(() => {
        res.status(403).send('Invalid verifier or access tokens!')
    })
}