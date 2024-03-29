// pizzakings.js

// configuration vars
const REFRESH_INTERVAL = 3 * 1000 // 3000 ms = 3 s
const AVATAR_REFRESH_INTERVAL = 60 * 1000 // 60000 ms = 60s
var AUTOREFRESH = true
const DEFAULT_ACCOUNT = 'null'
const rpc = 'https://api.hive-engine.com/rpc/contracts';

var urlParams = new URLSearchParams(window.location.search)
var ACCOUNT = urlParams.has('account') ? urlParams.get('account').toLowerCase().trim() : DEFAULT_ACCOUNT

if (urlParams.has('norefresh')) {
    AUTOREFRESH = false
}

if (ACCOUNT === DEFAULT_ACCOUNT) {
    ACCOUNT = window.prompt('Enter Hive account name:')
}

function getOwnedPlots(account) {
    return new Promise((resolve, reject) => {
        const query = {'id': 1,
                       'jsonrpc': '2.0',
                       'method': 'find',
                       'params': {
                            'contract': 'nft',
                            'table': 'HKFARMinstances',
                            'query': {
                                'properties.TYPE': 'plot',
                                'account': account
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

function getRentedPlots(account) {
    return new Promise((resolve, reject) => {
        const query = {'id': 1,
                       'jsonrpc': '2.0',
                       'method': 'find',
                       'params': {
                            'contract': 'nft',
                            'table': 'HKFARMinstances',
                            'query': {
                                'properties.TYPE': 'plot',
                                'properties.RENTEDINFO': account
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


function getSeeds(account, region) {
    let query = ''
    if (account) {
        query = {'id': 1,
           'jsonrpc': '2.0',
           'method': 'find',
           'params': {
                'contract': 'nft',
                'table': 'HKFARMinstances',
                'query': {
                    'properties.TYPE': 'seed',
                    'account': account
                }
            }}
    } else {
        query = {'id': 1,
           'jsonrpc': '2.0',
           'method': 'find',
           'params': {
                'contract': 'nft',
                'table': 'HKFARMinstances',
                'query': {
                    'properties.TYPE': 'seed'
                }
            }}
    }

    // filter seeds by region
    if (typeof region !== 'undefined') {
        var seedsForRegion = getSeedListForRegion(region)
        var seedNameFilter = []
        for (seedName of seedsForRegion) {
            seedNameFilter.push({'properties.NAME' : seedName})
        }
        query.params.query['$or'] = seedNameFilter
    }

    return axios.post(rpc, query).then((result) => {return result.data.result})
}


function zip(arrays) {
    return arrays[0].map(function(_,i){
        return arrays.map(function(array){return array[i]})
    });
}


function harvestSingle(wallet, seedID) {

    if (!seedID) {
        window.alert('Error! Report in Discord. Harvesting failed because seedID is null')
        return
    }

    continue_message = `Are you sure you want to harvest seed ${seedID}?\n
                        Warning: only harvest each seed once!`
    should_continue = window.confirm(continue_message)

    if (!should_continue) {
        return
    }

    custom_json_id = 'ssc-mainnet-hive'

    let json_payload = {
        'contractName': 'nft',
        'contractAction': 'transfer',
        'contractPayload':{
            'to':'hk-vault',
            'nfts':[
                {'symbol':'HKFARM',
                 'ids':[
                    String(seedID)
                  ]
                }
            ]
        }
    }

    json_payload = JSON.stringify(json_payload)

    console.log(json_payload)

    let resultPromise = hive_keychain.requestCustomJson(
        wallet,
        custom_json_id,
        'Active',
        json_payload,
        `Harvesting HK Plot for Seed ${seedID}`,
        function(response) {
            console.log(response);
            if (!response['success']) {
                console.log(`Failure! Keychain failed to authorize the transaction for @${wallet}`)
            } else {
                console.log(`Success! Plot harvested for @${wallet}`)
            }
        }
    )

    Promise.resolve(resultPromise)
}


function harvestMultiple(wallet, seedIDs) {

    if (seedIDs.length == 0) {
        window.alert(`Nothing to harvest! `)
        return
    }

    if (seedIDs.length > 20) {
        window.alert('Warning: only the first 20 seeds will be harvested.')
        seedIDs.splice(20)
    }
    
    continue_message = `Are you sure you want to harvest seeds ${JSON.stringify(seedIDs)}?\n
                        Warning: only harvest each seed once!`
    should_continue = window.confirm(continue_message)

    if (!should_continue) {
        return
    }

    custom_json_id = 'ssc-mainnet-hive'

    let json_payload = []

    for (seedID of seedIDs) {
        json_payload.push({
            'contractName': 'nft',
            'contractAction': 'transfer',
            'contractPayload':{
                'to':'hk-vault',
                'nfts':[
                    {'symbol':'HKFARM',
                     'ids':[
                        String(seedID)
                      ]
                    }
                ]
            }
        })
    }
    json_payload = JSON.stringify(json_payload)


    console.log(json_payload)

    let resultPromise = hive_keychain.requestCustomJson(
        wallet,
        custom_json_id,
        'Active',
        json_payload,
        `Harvesting HK Plot for Seeds ${JSON.stringify(seedIDs)}`,
        function(response) {
            console.log(response);
            if (!response['success']) {
                console.log(`Failure! Keychain failed to authorize the transaction for @${wallet}`)
            } else {
                console.log(`Success! Plots harvested for @${wallet}`)
            }
        }
    )

    Promise.resolve(resultPromise)
    
}


function waterMultiple(wallet, seedIDs, totalWaterNeeded) {

    if (seedIDs.length == 0) {
        window.alert('Nothing to water!')
        return
    }

    if (seedIDs.length > 20) {
        window.alert('Error: cannot water more than 20 seeds at once.')
        return
    }

    continue_message = `Are you sure you want to burn ${totalWaterNeeded} HKWATER to water seeds?: ${seedIDs}?`
    should_continue = window.confirm(continue_message)

    if (!should_continue) {
        return
    }

    custom_json_id = 'ssc-mainnet-hive'

    let json_payload = {
        'contractName': 'tokens',
        'contractAction': 'transfer',
        'contractPayload':{
            'to':'hk-vault',
            'symbol':'HKWATER',
            'quantity':String(totalWaterNeeded),
            'memo':JSON.stringify(seedIDs)
        }
    }

    json_payload = JSON.stringify(json_payload)

    console.log(json_payload)

    let resultPromise = hive_keychain.requestCustomJson(
        wallet,
        custom_json_id,
        'Active',
        json_payload,
        `Watering HK Plot for Seeds: ${seedIDs}`,
        function(response) {
            console.log(response);
            if (!response['success']) {
                console.log(`Failure! Keychain failed to authorize the transaction for @${wallet}`)
            } else {
                console.log(`Success! Plots watered for @${wallet}`)
            }
        }
    )

    Promise.resolve(resultPromise)
}


function plantOne(wallet, plotID, seedID) {
    custom_json_id = 'qwoyn_plant_plot'

    if (!plotID || !seedID) {
        window.alert('Error! Report in Discord. Planting failed because plotID or seedID is null')
        return
    }

    let json_payload = {'plotID': plotID, 'seedID': seedID}

    json_payload = JSON.stringify(json_payload)
    console.log(json_payload)

    continue_message = `Are you sure you want to plant seed ${seedID}, on plot ${plotID}?\n
                        Warning: only plant each seed once!`
    should_continue = window.confirm(continue_message)

    if (!should_continue) {
        return
    }

    let resultPromise = hive_keychain.requestCustomJson(
        wallet,
        custom_json_id,
        'Posting',
        json_payload,
        `Planting HK Plots`,
        function(response) {
            console.log(response);
            if (!response['success']) {
                console.log(`Failure! Keychain failed to authorize the transaction for @${wallet}`)
            } else {
                console.log(`Success! Plot planted for @${wallet}`)
            }
        }
    )

    Promise.resolve(resultPromise)
}


function getSeedListForRegion(regionName) {
    if (regionName === 'Asia') {
        return ['Aceh','Thai','Chocolate Thai']
    } else if (regionName === 'Jamaica') {
        return ['Lamb’s Bread','King’s Bread']
    } else if (regionName === 'Africa') {
        return ['Swazi Gold','Kilimanjaro','Durban Poison','Malawi']
    } else if (regionName === 'Afghanistan') {
        return ['Hindu Kush','Afghani','Lashkar Gah','Mazar I Sharif']
    } else if (regionName === 'Mexico') {
        return ['Acapulco Gold']
    } else if (regionName === 'South America') {
        return ['Colombian Gold','Panama Red']
    } else {
        return []
    }
}


function plotsAndSeedsUpdate() {

    Promise.all([getOwnedPlots(ACCOUNT),
                 getRentedPlots(ACCOUNT),
                 getSeeds(ACCOUNT, 'Asia'),
                 getSeeds(ACCOUNT, 'Jamaica'),
                 getSeeds(ACCOUNT, 'Africa'),
                 getSeeds(ACCOUNT, 'Afghanistan'),
                 getSeeds(ACCOUNT, 'Mexico'),
                 getSeeds(ACCOUNT, 'South America')]).then( (values) => {
        let [ownedPlots, rentedPlots, seedsAsia, seedsJamaica, seedsAfrica, seedsAfghan, seedsMex, seedsSA] = values

        var seeds = [].concat(seedsSA).concat(seedsAsia).concat(seedsJamaica).concat(seedsAfrica).concat(seedsAfghan).concat(seedsMex)
        console.log(`Seeds: ${seeds.length}`)

        let allPlots = ownedPlots.concat(rentedPlots)

        let hasPlotDataChanged = JSON.stringify(allPlots) !== document.querySelector('div#has-any-plot-changed').getAttribute('data-plots')
        let hasSeedDataChanged = JSON.stringify(seeds) !== document.querySelector('div#has-any-seed-changed').getAttribute('data-seeds')

        if (!hasSeedDataChanged && !hasPlotDataChanged) {
            return
        }

        if (hasPlotDataChanged)  {
            console.log('Plot data changed. Updating UI.')

            /*let oldPlotsData = document.querySelector('div#has-any-plot-changed').getAttribute('data-plots')
            let oldPlots = []
            if (oldPlotsData) {
                oldPlots = JSON.parse(oldPlotsData)
            }

            for (newPlot of allPlots) {
                for (oldPlot of oldPlots) {
                    if (oldPlot._id === newPlot._id && oldPlot != newPlot) {
                        console.log(`PlotID ${newPlot._id} changed`)
                    }
                }
            }*/

            document.querySelector('div#has-any-plot-changed').setAttribute('data-plots', JSON.stringify(allPlots))
        }

        if (hasSeedDataChanged) {
            console.log('Seed data changed. Updating UI.')
            document.querySelector('div#has-any-seed-changed').setAttribute('data-seeds', JSON.stringify(seeds))
        }

        let table_markup = ``
        document.querySelector('table#plots_table tbody').innerHTML = table_markup
        table_markup = ''
        var seedsByID = {}
        var seedsByName = {}
        var seedsReady = []
        var seedsNeedWater = []
        var plantedSeedIDs = []

        var totalWaterNeeded = 0

        // build dictionaries of available seeds by name and by ID
        // also build a list of seeds that are ready to harvest, for the "harvest all" button
        for (seed of seeds) {
            seedsByID[seed._id] = seed
            //console.log(seed)

            seedsByName[seed.properties.NAME] = seed

            let seedTime  = seed.properties.SPT
            if (seedTime === 0) {
                seedsReady.push(seed._id)
            }
        }

        // build a list of the seeds that have already been planted, so we don't try to plant one again
        for (plot of allPlots) {
            let plantedSeedID = plot.properties.SEEDID
            plantedSeedIDs.push(plantedSeedID)
        }

        for (plot of allPlots) {
            //console.log(plot)
            let plantedSeedID = plot.properties.SEEDID

            let regionName = plot.properties.NAME

            let seedName  = ''
            let seedWater = ''
            let seedYield = ''
            let seedTime  = ''
            let seedTimeStr = ''

            let plantBtn   = ''//'<button title="Plant" class="btn btn-secondary" disabled="disabled"><i class="fa-solid fa-seedling"></i></button>'
            let waterBtn   = ''//`<button title="Water" class="btn btn-primary" disabled="disabled"><i class="fa-solid fa-hand-holding-droplet"></i></button>`
            let harvestBtn = ''//'<button title="Harvest" class="btn btn-success" disabled="disabled"><i class="fa-solid fa-scissors"></i></button>'

            let isRented = plot.properties.RENTED & plot.properties.RENTED === true
            let rentedTo = plot.properties.RENTEDINFO

            // if the plot is occupied
            if (plot.properties.SEEDID != 0 && seedsByID[plot.properties.SEEDID] !== undefined) {
                seedName  = seedsByID[plantedSeedID].properties.NAME
                seedWater = seedsByID[plantedSeedID].properties.WATER
                seedYield = seedsByID[plantedSeedID].properties.PR
                seedTime  = seedsByID[plantedSeedID].properties.SPT
                seedTimeStr = seedTime


                if (seedTime !== '') {
                    seedTimeStr += ' day'
                }
                if (parseInt(seedTime) !== 1) {
                    seedTimeStr += 's'
                }

                if (seedWater !== 0) {
                    totalWaterNeeded += seedWater
                    seedsNeedWater.push(plantedSeedID)
                    waterBtn = `<button title="Water" class="btn btn-primary water" data-seed-id="${plantedSeedID}" data-seed-water="${seedWater}"><i class="fa-solid fa-hand-holding-droplet"></i></button>`
                    document.querySelector('button#water-all').removeAttribute('disabled')
                }

                // if it's ready to harvest, show a harvest button
                if (seedTime === 0) {
                    document.querySelector('#harvest-all').removeAttribute('disabled')
                    harvestBtn = `<button title="Harvest" class="btn btn-success harvest" data-seed-id="${plantedSeedID}"><i class="fa-solid fa-scissors"></i></button>`
                }
            } else if (plantedSeedID == 0){
                // if the plot is unoccupied and plantable, show the list of possible seeds
                if (!isRented || (isRented && rentedTo === ACCOUNT)) {
                    plantBtn = `<button id="b${plot._id}" title="Plant" class="btn btn-secondary plant" disabled="disabled" data-plot-id="${plot._id}"><i class="fa-solid fa-seedling"></i></button>`

                    seedList = ''
                    for (seedName of getSeedListForRegion(regionName)) {
                        for (seedID in seedsByID) {
                            let seed = seedsByID[seedID]

                            if (seed.properties.NAME === seedName && !plantedSeedIDs.includes(seed._id) && seed.properties.WATER !== 0) {
                                seedList += `<a class="dropdown-item" data-plot-id="${plot._id}" data-seed-id="${seedID}">${seedName} - ID:${seedID} - W:${seed.properties.WATER} HKWATER - Y:${seed.properties.PR} BUDS - T:${seed.properties.SPT} Days</a>`
                            }
                        }
                    }

                    seedName = `<div class="seeddropdown dropdown">
                  <button class="btn btn-secondary dropdown-toggle btn-sm" type="button" id="dropdownMenuButton" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">Select Seed
                  </button>
                  <div class="dropdown-menu" aria-labelledby="dropdownMenuButton">
                    ${seedList}
                  </div>
                </div>`
                }
                
            }

            // Show "empty" if the plot is unoccupied
            if (plantedSeedID == 0) {
                plantedSeedID = 'Empty'
            }

            table_markup += `<tr id="${plot._id}"><td>${plot._id}</td><td>${plot.properties.NAME}</td><td>${plot.account} ~ ${rentedTo ? rentedTo: 'n/a'}</td><td>${plantedSeedID}</td><td>${seedName}</td><td>${seedWater}</td><td>${seedYield}</td><td>${seedTimeStr}</td><td>${plantBtn}</td><td>${waterBtn}</td><td>${harvestBtn}</td></tr>`
        }

        // paint the main table
        document.querySelector('table#plots_table tbody').innerHTML = table_markup

        // add click handler for harvest-all button
        document.querySelector('button#harvest-all').onclick = function () {
            harvestMultiple(ACCOUNT,seedsReady)
        }

        // add click handler for water-all button
        document.querySelector('button#water-all').onclick = function (e) {
            // if click target is the icon, change target to parent button
            let buttonTarget;
            if (e.target.tagName.toLowerCase() === 'i') {
                buttonTarget = e.target.parentNode
            } else {
                buttonTarget = e.target
            }
            waterMultiple(ACCOUNT,seedsNeedWater,totalWaterNeeded)
            buttonTarget.setAttribute('disabled','disabled')
        }

        // add click handler for seed dropowns
        for (let option of document.querySelectorAll('a.dropdown-item')) {
            option.onclick = (e) => {
                let plotID = e.target.getAttribute('data-plot-id')
                let seedID = e.target.getAttribute('data-seed-id')
                e.target.parentNode.parentNode.children[0].innerHTML = seedID

                let plantBtn = document.querySelector(`button#b${plotID}`)
                plantBtn.setAttribute('data-seed-id', seedID)
                plantBtn.removeAttribute("disabled");
            }
        }
        // add click handler for plant buttons
        for (let button of document.querySelectorAll('button.plant')) {
            button.onclick = (e) => {
                // if click target is the icon, change target to parent button
                let buttonTarget;
                if (e.target.tagName.toLowerCase() === 'i') {
                    buttonTarget = e.target.parentNode
                } else {
                    buttonTarget = e.target
                }

                let plotID = buttonTarget.getAttribute('data-plot-id')
                let seedID = buttonTarget.getAttribute('data-seed-id')

                plantOne(ACCOUNT, plotID, seedID)
                buttonTarget.setAttribute('disabled','disabled')
            }
        }

        // add click handler for harvest buttons
        for (let button of document.querySelectorAll('button.harvest')) {
            button.onclick = (e) => {
                // if click target is the icon, change target to parent button
                let buttonTarget;
                if (e.target.tagName.toLowerCase() === 'i') {
                    buttonTarget = e.target.parentNode
                } else {
                    buttonTarget = e.target
                }

                let seedID = buttonTarget.getAttribute('data-seed-id')
                harvestSingle(ACCOUNT, seedID)
                buttonTarget.setAttribute('disabled','disabled')
            }
        }

        // add click handler for water buttons
        for (let button of document.querySelectorAll('button.water')) {
            button.onclick = (e) => {
                // if click target is the icon, change target to parent button
                let buttonTarget;
                if (e.target.tagName.toLowerCase() === 'i') {
                    buttonTarget = e.target.parentNode
                    console.log(buttonTarget)
                } else {
                    buttonTarget = e.target
                }

                let seedID = parseInt(buttonTarget.getAttribute('data-seed-id'))
                let water = buttonTarget.getAttribute('data-seed-water')
                waterMultiple(ACCOUNT, [seedID], water)
                buttonTarget.setAttribute('disabled','disabled')
            }
        }
    })
}


avatarRarities = {
    "Japot Flowerpot": "common",
    "Steve Stub": "common",
    "Ted Hunted": "common",
    "Timmy Open-Mind": "common",
    "Mildred Hunted": "common",
    "Ester Planter": "common",
    "Jaine Migraine": "common",
    "Julia Cadaverts": "common",
    "Scientist Maggi": "common",
    "Scientist Shaggi": "common",
    "Farmer Maggi": "common",
    "Farmer Shaggi": "common",
    "Lucky Maggi": "common",
    "Lucky Shaggi": "common",
    "Water Baroness Maggi": "common",
    "Water Baron Shaggi": "common",
    "Fly-bot": "common",
    "Bucketbot": "common",
    "Plank-279": "common",
    "Trunkset": "common",
    "Airhead Lieutenant": "rare",
    "Captain Puffs": "rare",
    "Colonel Cockroach": "rare",
    "Captain Jainer Strainer": "rare",
    "Carla. War Nurse": "rare",
    "Lieutenant O'Weed": "rare",
    "Magical Maggi": "rare",
    "Magical Shaggi": "rare",
    "OX-64": "rare",
    "L-417": "rare",
    "Scarebot-2088": "rare",
    "General Hockey-Pockey": "epic",
    "General Spice-Skunk": "epic",
    "Colonel White Widow": "epic",
    "Colonel \xc1ngeles Heartless": "epic",
    "The heavy Johnny- Mark-2": "epic",
    "Tank-420": "epic",
    "The Cannabi-Zombie King": "legendary",
    "The Cannabi-Zombie Queen": "legendary",
    "Spikebot-209": "legendary",
    "Spikebot-208": "legendary"
}


function getAvatars(wallet) {
    let api = `https://hashkings.info/userdata/${wallet}`

    return new Promise((resolve, reject) => {
        axios.get(api).then((result) => {
            return resolve(result.data.avatars)
        }).catch((err) => {
            console.log(err)
            return reject(err)
        })
     })
}


function getRaids() {
    let api = `https://hashkings.info/raids`

    return new Promise((resolve, reject) => {
        axios.get(api).then((result) => {
            return resolve(result.data.raids)
        }).catch((err) => {
            console.log(err)
            return reject(err)
        })
     })
}


function enterNextRaid(wallet, avatarID, raidID, avatarName, raidName) {
    if (!avatarID || !raidID) {
        window.alert('Error! Report in Discord. Raiding failed because avatarID or raidID is null')
        return
    }

    let custom_json_id = 'qwoyn_avatars_onraid'
    let json_payload = {'raid':raidID,'avatar':[avatarID]}

    json_payload = JSON.stringify(json_payload)
    console.log(json_payload)

    continue_message = `Are you sure you want to enter avatar ${avatarName} (${avatarID}), in raid ${raidName} (${raidID})?\n
                        Warning: only enter each avatar once!`
    should_continue = window.confirm(continue_message)

    if (!should_continue) {
        return
    }

    let resultPromise = hive_keychain.requestCustomJson(
        wallet,
        custom_json_id,
        'Posting',
        json_payload,
        `Entering Avatar into ${raidName} raid`,
        function(response) {
            console.log(response);
            if (!response['success']) {
                console.log(`Failure! Keychain failed to authorize the transaction for @${wallet}`)
            } else {
                console.log(`Success! Raid entered for @${wallet}`)
            }
        }
    )

    Promise.resolve(resultPromise)
}


function getAvatarLevel(avatar) {
    let e = parseInt(avatar.properties.XP)
    for (var t = 0, a = 45, n = 45; n < e; )
        ++t < 100 ? n = (a *= 1.08) + n : t > 100 && t < 200 ? n = (a *= 1.04) + n : t > 200 && (n = (a *= 1.02) + n);
    return t
}


function avatarsUpdate() {
    Promise.all([getAvatars(ACCOUNT),getRaids()]).then( (values) => {
        let [avatars, raids] = values
        
        let hasAvatarDataChanged = JSON.stringify(avatars) !== document.querySelector('div#has-any-avatar-changed').getAttribute('data-avatars')
        let hasRaidDataChanged = JSON.stringify(raids) !== document.querySelector('div#has-any-raid-changed').getAttribute('data-raids')

        if (!hasAvatarDataChanged && !hasRaidDataChanged) {
            return
        }

        if (!hasAvatarDataChanged) {
            console.log('Avatar data changed. Updating UI.')
            document.querySelector('div#has-any-avatar-changed').setAttribute('data-avatars', JSON.stringify(avatars))
        }

        if (!hasRaidDataChanged) {
            console.log('Raid data changed. Updating UI.')
            document.querySelector('div#has-any-raid-changed').setAttribute('data-raids', JSON.stringify(raids))
        }

        let table_markup = ''
        for (avatar of avatars) {

            let assigned_raid_id = 'None'
            for (raid of raids) {
                for (raid_avatar of raid['avatares']) {
                    if (parseInt(raid_avatar['avatar']) === avatar.id) {
                        assigned_raid_id = raid['boss']
                    }
                }
            }


            let raid_power = avatar.properties.XP * avatar.properties.POWER / 100
            let avatar_actions = ''


            let findRaidForAvatar = (avatar, raids) => {
                let raidMax25 = {}
                let raidMax50 = {}
                let raidMax75 = {}
                let raidMax100 = {}
                let raidMax9999 = {}

                for (raid of raids) {
                    switch(raid.lvl) {
                        case '25':
                            raidMax25 = raid
                            break
                        case '50':
                            raidMax50 = raid
                            break
                        case '75':
                            raidMax75 = raid
                            break
                        case '100':
                            raidMax100 = raid
                            break
                        case '9999':
                            raidMax9999 = raid
                            break
                    }
                }
                let avatarLevel = getAvatarLevel(avatar)
                if (avatarLevel <= 25) {
                    return raidMax25
                } else if (avatarLevel <= 50) {
                    return raidMax50
                } else if (avatarLevel <= 75) {
                    return raidMax75
                } else if (avatarLevel <= 100) {
                    return raidMax100
                } else if (avatarLevel <= 9999) {
                    return raidMax9999
                } else {
                    return {}
                }
            }

            // find appropriate raid for avatar's level
            let matchedRaid = findRaidForAvatar(avatar, raids)
            if (matchedRaid) {
                let next_raid_id = matchedRaid['_id']
                let next_raid_name = matchedRaid['boss']

                if (assigned_raid_id === 'None') {
                    avatar_actions = `<button class="btn btn-sm btn-danger enter-raid" title="Enter Next Raid" data-avatar-id="${avatar.id}" data-raid-id="${next_raid_id}" data-avatar-name="${avatar.properties.NAME}" data-raid-name="${next_raid_name}"><i class="fa-solid fa-person-rifle"></i></button>`
                }
            }
            table_markup += `<tr><td>${avatar.id}</td><td>${avatar.owner}</td><td>${avatar.properties.NAME}</td><td>${avatarRarities[avatar.properties.NAME]}</td><td>${avatar.properties.POWER.toFixed(3)}</td><td>${raid_power.toFixed(3)}</td><td>${avatar.properties.USAGE}</td><td>${avatar.properties.XP.toFixed(3)}</td><td>${getAvatarLevel(avatar)}</td><td>${assigned_raid_id}</td><td>${avatar_actions}</td></tr>`
        }

        // paint the avatars table
        document.querySelector('table#avatars_table tbody').innerHTML = table_markup

        // add event handlers for avatar actions
        for (let button of document.querySelectorAll('button.enter-raid')) {
            button.onclick = (e) => {
                // if click target is the icon, change target to parent button
                let buttonTarget;
                if (e.target.tagName.toLowerCase() === 'i') {
                    buttonTarget = e.target.parentNode
                    console.log(buttonTarget)
                } else {
                    buttonTarget = e.target
                }

                let avatarID = parseInt(buttonTarget.getAttribute('data-avatar-id'))
                let raidID = buttonTarget.getAttribute('data-raid-id')
                let avatarName = buttonTarget.getAttribute('data-avatar-name')
                let raidName = buttonTarget.getAttribute('data-raid-name')
                enterNextRaid(ACCOUNT, avatarID, raidID, avatarName, raidName)
                buttonTarget.setAttribute('disabled','disabled')
            }
        }
    })
}


// Fetch data on load and then refresh every N ms.
plotsAndSeedsUpdate()
avatarsUpdate()


if (AUTOREFRESH) {
    window.setInterval(plotsAndSeedsUpdate, REFRESH_INTERVAL)
    window.setInterval(avatarsUpdate, AVATAR_REFRESH_INTERVAL)
}

