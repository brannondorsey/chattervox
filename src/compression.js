const zlib = require('zlib')
const util = require('util')

const compressionOptions = {
    level: zlib.constants.Z_BEST_COMPRESSION,
}

async function compress(buffer) {
    return new Promise((resolve, reject) => {
        zlib.deflateRaw(buffer, compressionOptions, (err, data) => {
            if (err) reject(err)
            else resolve(data)
        })
    })
}

async function decompress(buffer) {
    return new Promise((resolve, reject) => {
        zlib.inflateRaw(buffer, compressionOptions, (err, data) => {
            if (err) reject(err)
            else resolve(data)
        })
    })
}

module.exports = {
    compress,
    decompress
}