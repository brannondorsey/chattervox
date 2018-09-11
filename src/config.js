const fs = require('fs')
const util = require('util')

const config = {
    callsign: 'N0CALL',
    nick: '',
    keystore: 'keystore.json',
    kissPort: '/tmp/kisstnc',
    kissBaud: 9600
}

async function save(callsign, nick) {

}

async function load() {

}

module.exports = {
    save,
    load
}