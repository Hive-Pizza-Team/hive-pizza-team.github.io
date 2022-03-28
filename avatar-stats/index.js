

var avatar_id = parseInt(window.prompt('Avatar ID:'))
const rpc = 'https://api2.hive-engine.com/rpc/contracts'


function getAvatar(id) {
    return new Promise((resolve, reject) => {
        const query = {'id': 1,
                       'jsonrpc': '2.0',
                       'method': 'find',
                       'params': {
                            'contract': 'nft',
                            'table': 'HKFARMinstances',
                            'query': {
                                'properties.TYPE': 'avatar',
                                '_id': id
                            }
                        }}
        axios.post(rpc, query).then((result) => {
            return resolve(result.data.result)
        }).catch((err) => {
            console.log(err)
            return reject(err)
        })
    })
}

function getAvatarLevel(avatar) {
    let e = parseInt(avatar.properties.XP)
    for (var t = 0, a = 45, n = 45; n < e; )
        ++t < 100 ? n = (a *= 1.08) + n : t > 100 && t < 200 ? n = (a *= 1.04) + n : t > 200 && (n = (a *= 1.02) + n);
    return t
}

Promise.resolve(getAvatar(avatar_id)).then( (res) => {
    let avatar = res[0]

    for (attribute in avatar) {
        


        if (attribute === 'properties') {
            let properties = avatar['properties']
            for (attribute2 in properties) {

                document.querySelector('div#avatar_content').innerHTML += attribute2 + ' : ' + JSON.stringify(properties[attribute2]) + '<br>'

            }
        } else {
            document.querySelector('div#avatar_content').innerHTML += attribute + ' : ' + JSON.stringify(avatar[attribute]) + '<br>'
        }
    }

    let raid_power = avatar.properties.XP * avatar.properties.POWER / 100
    let level = getAvatarLevel(avatar)
    document.querySelector('div#avatar_content').innerHTML += 'RAID POWER' + ' : ' + JSON.stringify(raid_power) + '<br>'
    document.querySelector('div#avatar_content').innerHTML += 'LEVEL' + ' : ' + JSON.stringify(level) + '<br>'

    
})

