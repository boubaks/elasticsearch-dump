var elasticsearch = require('elasticsearch');
var logger = require(__dirname+'/logger');
var ObjectID = require('mongodb').ObjectID;

exports.ElsClient = function(host, port, callback)
{
    var me = this;
    me._client = new elasticsearch.Client({
	host: host+':'+port,
	// log: 'trace'
    });
    
    me._client.ping({
	requestTimeout: 1000,
	// undocumented params are appended to the query string
	hello: "elasticsearch!"
    }, function(error) {
	if (error) {
            logger.error('elasticsearch cluster is down!', error);
            callback(null, error);
	} else {
            logger.info('Connected to ELS');
            callback(me, "All is well");
	}
    });
};

exports.ElsClient.prototype.get = function(index, type, id, callback) {
    this._client.get({
	index: index,
	type: index,
	id: id
    }, function(error, response) {
	callback(error, response);
    });
};

exports.ElsClient.prototype.search = function(index, query, options, callback) {
    var tmpSearch = {
        index: index
    };
    for (option in options){
        tmpSearch[option] = options[option];
    }
    if (typeof query == 'string') {
        tmpSearch.q = query;
        this._client.search(tmpSearch, function(error, response) {
            callback(error, response);
        });
    } else {
        tmpSearch.body = query;
        this._client.search(tmpSearch, function(error, response) {
            callback(error, response);
        });
    }
};

exports.ElsClient.prototype.findAndModify = function(index, type, query, object, options, callback) {
    var body = {};
    var me = this;
    if(options) {
        for (option in options) {
            body[option] = options[option];
        }
    }
    body.doc = object;
    me.search(index, query, null, function(error, results) {
        if (results && results.hits && results.hits.hits.length > 0) {
            me.put(index, type, results.hits.hits[0]._id, object, null, function(err, res) {
                callback(err, res);
            });
        } else {
            me.post(index, type, object, function(err, res) {
                callback(err, res);
            })
        }
    });
};


exports.ElsClient.prototype.put = function(index, type, id, object, options, callback) {
    var body = {};
    if(options) {
        for (option in options) {
            body[option] = options[option];
        }
    }
    body.doc = object;
    this._client.update({
	index: index,
	type: type,
	id: id,
	body: body
    }, function(error, response) {
        callback(error, response);
    })
};

exports.ElsClient.prototype.post = function(index, type, object, callback) {
    var id = new ObjectID().toString();
    this._client.create({
	index: index,
	type: type,
	id: id,
	body: object
    }, function(error, response) {
	callback(error,response);
    });
};

exports.ElsClient.prototype.delete = function(index, type, id, callback) {
    this._client.delete({
	index: index,
	type: type,
	id: id
    }, function(error, response) {
	callback(error, response);
    });
};

exports.ElsClient.prototype.deleteByQuery = function(index, type, query, callback) {
    var tmpSearch = {
        index: index,
	type: type
    };
    if (typeof query == 'string') {
        tmpSearch.q = query;
    } else {
        tmpSearch.body = query;
    }
    this._client.deleteByQuery(tmpSearch, function(error, response) {
        callback(error, response);
    });
};

exports.ElsClient.prototype.count = function(index, query, callback) {
    var tmpSearch = {
        index: index
    };
    if (typeof query == 'string') {
        tmpSearch.q = query;
    } else {
        tmpSearch.body = query;
    }
    this._client.count(tmpSearch, function(error, response) {
	callback(error, response);
    });
};