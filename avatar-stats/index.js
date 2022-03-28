

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

Promise.resolve(getAvatar(avatar_id)).then( (res) => {
    console.log(res)

    for (attribute in res[0]) {
        

        if (attribute === 'properties') {
            let properties = res[0]['properties']
            for (attribute2 in properties) {

                document.querySelector('div#avatar_content').innerHTML += attribute2 + ' : ' + JSON.stringify(properties[attribute2]) + '<br>'

            }
        } else {
            document.querySelector('div#avatar_content').innerHTML += attribute + ' : ' + JSON.stringify(res[0][attribute]) + '<br>'
        }
    }

    
})

