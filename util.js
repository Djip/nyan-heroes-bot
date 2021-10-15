module.exports.validateEmail = (email) => {
    const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
}

module.exports.completeMission = async (api, user, mission) => {
    await api.post('missions/complete', {
        user,
        'mission': mission
    }).then(response => {

    }).catch(error => {
        console.log(error)
    })
}