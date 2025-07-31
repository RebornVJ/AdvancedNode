const mongoose = require('mongoose');
const redis = require('redis');
const util = require('util');

const redisUrl = 'redis://127.0.0.1:6379';
const client = redis.createClient(redisUrl);

client.hget = util.promisify(client.hget);

const exec = mongoose.Query.prototype.exec;

mongoose.Query.prototype.cache = function(options = {}) {
    this.useCache = true;
    this.hashKey = JSON.stringify(options.key || 'default');
    return this;
}

mongoose.Query.prototype.exec = async function() {
    if (!this.useCache) {
        return exec.apply(this, arguments);
    }
    const key = JSON.stringify(Object.assign({}, this.getQuery(), { collection: this.mongooseCollection.name }));

    // See if we have a value for 'key' in redis
    const cachedValue = await client.hget(this.hashKey, key);
    // if we do, return that
    if (cachedValue) {
        const doc = JSON.parse(cachedValue);
        console.log('Serving from cache:', key);
        // If the cached value is an array, we need to convert it back to Mongoose
        return Array.isArray(doc) ? doc.map(d => new this.model(d)) : new this.model(doc);
    }
    // otherwise, issue the query and store the result in redis

    const result = await exec.apply(this, arguments);

    client.hset(this.hashKey, key, JSON.stringify(result));
    client.expire(this.hashKey, 10); // Cache for 10 seconds
    console.log('Serving from database:', key);
    return result;
}

module.exports = {
    clearHash(hashKey) {
        client.del(JSON.stringify(hashKey));
    }
}