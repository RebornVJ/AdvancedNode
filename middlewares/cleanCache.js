const {clearHash} = require('../services/cache');

module.exports = async (req, res, next) => {
    // Clear the cache for the user after any write operation
    await next();
    clearHash(req.user.id); // Clear cache for the user
    console.log('Cache cleared for user:', req.user.id);
}