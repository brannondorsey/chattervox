import * as zlib from 'zlib'

const compressionOptions: zlib.ZlibOptions = {
    level: zlib.constants.Z_BEST_COMPRESSION,
}

export async function compress(buffer: Buffer): Promise<any> {
    return new Promise((resolve, reject) => {
        zlib.deflateRaw(buffer, compressionOptions, (err, data: Buffer) => {
            if (err) reject(err)
            else resolve(data)
        })
    })
}

export async function decompress(buffer: Buffer): Promise<any> {
    return new Promise((resolve, reject) => {
        zlib.inflateRaw(buffer, compressionOptions, (err, data) => {
            if (err) reject(err)
            else resolve(data)
        })
    })
}
