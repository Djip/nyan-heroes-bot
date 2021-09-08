require('dotenv').config();

const axios = require('axios');
const fs = require('fs');
const root = require('path').resolve('./')
const util = require('util');
const readFile = util.promisify(fs.readFile);

async function api() {
    let bearer;
    await readFile(`${root}/.bearer`, 'utf8').then(async data => {
        if (data) {
            bearer = data
        } else {
            bearer = await getBearer()
        }
    }).catch(async error => {
        bearer = await getBearer()
    })

    if (!bearer) {
        console.log("fail")
        return false;
    }

    const api = axios.create({
        baseURL: process.env.NYAN_HEROES_BOT_API_URL,
        headers: {
            'Authorization': `Bearer ${bearer}`,
            'Accept': 'application/json'
        }
    })

    api.interceptors.response.use(null, async (error) => {
        if (error.config && error.response && error.response.status === 401 && !error.config.url.match(/oauth\/token/)) {
            const bearer = await getBearer()

            if (bearer) {
                error.config.headers['Authorization'] = `Bearer ${bearer}`
                return axios.request(error.config);
            }
        }

        return Promise.reject(error);
    });

    return api;
}

async function getBearer() {
    let bearer;
    console.log("getting bearer")
    await axios.post(process.env.NYAN_HEROES_OAUTH_URL, {
        'grant_type': 'client_credentials',
        'client_id': process.env.NYAN_HEROES_OAUTH_CLIENT_ID,
        'client_secret': process.env.NYAN_HEROES_OAUTH_CLIENT_SECRET,
        'scope': '*'
    }).then(response => {
        try {
            console.log(`${root}/.bearer`);
            fs.writeFileSync(`${root}/.bearer`, response.data.access_token)
            bearer = response.data.access_token
        } catch (error) {
            console.log(error)
        }
    }).catch(error => {
        console.log(error)
    })

    return bearer
}

module.exports = {
    api
}