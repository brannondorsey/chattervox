const compression = require('../build/compression.js')
const assert = require('assert')

describe('compression', async () => {

    let text = 'This is a bit of ASCII text to use for compression. And here is some UTF-8 徴枠ヌイヘ'
    let compressed = null
    let decompressed = null

    it('should compress text', async () => {
        compressed = await compression.compress(Buffer.from(text, 'utf8'))
    })

    it('should decompress text', async () => {
        decompressed = await compression.decompress(compressed)
    })

    it('decompressed text should match original text', () => {
        assert.ok(decompressed.toString('utf8') == text)
    })
})
