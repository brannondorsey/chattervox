const assert = require('assert')
const { installed, running, start, kill } = require('../build/DirewolfManager.js')
describe('DirewolfManager', () => {  

    describe('installed()', () => {
        
        it('should report direwolf is installed', () => {
            assert.ok(installed(), 'If direwolf is not installed, please install direwolf and re-run this test. If direwolf is installed there may be a problem with this function.')
        })

        it('should report a fake direwolf is not installed', () => {
            assert.equal(installed('/fake/path/to/direwolf'), false)
        })
    })

    describe('running(), start(), and kill()', () => {
        
        it('fake direwolf should not be running', async () => {
            assert.equal(await running('/fake/path/to/direwolf'), false)
        })

        it('should not be running', async () => {
            assert.equal(await running(), false)
        })

        it('should start without error', async () => {
            await start()
        })

        it('should be running', async () => {
            assert.equal(await running(), true)
        })

        it('should be killed', async() => {
            await kill()
        })

        it('should not be running', async () => {
            assert.equal(await running(), false)
        })

        it('should start after being killed', async () => {
            await start()
        })

        it('should be running a second time', async () => {
            assert.equal(await running(), true)
        })

        it('should be killed a second time', async () => {
            await kill()
        })

        it('should not be running after being killed a second time', async () => {
            assert.equal(await running(), false)
        })

        it('should error trying to start with a fake direwolf path', async () => {
            try {
                await start('/fake/path/to/direwolf')
                assert.fail('start() did not throw an error using a fake path')
            } catch(err) {
                assert.ok(true)
            }
        })

        it('should not be running after starting with a fake path', async () => {
            assert.equal(await running(), false)
        })

        it('kill should throw an error when no process is running', async () => {
            try {
                await kill()
                assert.fail('kill() did not throw an error when no process was running')
            } catch(err) {
                assert.ok(true)
            }
        })
    })
})