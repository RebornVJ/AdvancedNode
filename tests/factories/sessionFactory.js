const Buffer = require('safe-buffer').Buffer;
const Keygrip = require('keygrip');
const keys = require('../../config/keys');
const keygrip = Keygrip([keys.cookieKey]);

module.exports = user => {
    // Generate a mock session and signature for testing purposes
    const sessionObject = {
        passport: {
            user: user._id.toString() // Ensure user ID is a string
        }
    };
    const session = Buffer.from(JSON.stringify(sessionObject)).toString('base64');
    
    const signature = keygrip.sign('session=' + session);

    return { session, signature}
}