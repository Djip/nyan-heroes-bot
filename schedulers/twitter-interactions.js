require('dotenv').config();

const axios = require('../modules/axios')
const { interactions } = require('../controllers/twitter')

(async () => {
    try {
        const api = await axios.api();

        await api.get('twitter/information').then(async response => {
            for await (const information of response) {
                console.log(information)
            }
        })

        process.exit()
    } catch (error) {
        console.error(error)
    }
})();