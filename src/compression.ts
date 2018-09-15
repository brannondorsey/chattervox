import * as zlib from 'zlib'

const compressionOptions: zlib.ZlibOptions = {
    level: zlib.constants.Z_BEST_COMPRESSION,
}

export async function compress(buffer: Buffer): Promise<Buffer> {
    return new Promise<Buffer>((resolve, reject) => {
        zlib.deflateRaw(buffer, compressionOptions, (err, data: Buffer) => {
            if (err) reject(err)
            else resolve(data)
        })
    })
}

export async function decompress(buffer: Buffer): Promise<Buffer> {
    return new Promise<Buffer>((resolve, reject) => {
        zlib.inflateRaw(buffer, compressionOptions, (err, data) => {
            if (err) reject(err)
            else resolve(data)
        })
    })
}
