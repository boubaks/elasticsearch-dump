var fs = require('fs');
var getopt = require('node-getopt');
var logger = require(__dirname + '/../lib/logger');
var ELSCLIENT = require(__dirname + '/../lib/ElsClient').ElsClient;
var ELSQUERY = require(__dirname + '/../lib/ElsQuery').ElsQuery;

var opt = getopt.create([
    ['i', 'indexFrom=ARG', 'index to export (default to all)'],
    ['t', 'typeFrom=ARG', 'type to export'],
	['P', 'portFrom=ARG', 'port to connect to'],
    ['H', 'hostFrom=ARG', 'server to connect to'],

    ['', 'indexTo=ARG', 'index to export (default to all)'],
    ['', 'typeTo=ARG', 'type to export'],
	['', 'portTo=ARG', 'port to connect to'],
    ['', 'hostTo=ARG', 'server to connect to'],

    ['q', 'query=ARG', 'export by a query'],
    ['e', 'elsQuery=ARG', 'export by a elasticsearch query'],
    ['h', 'help', 'display this help'],
    ['v', 'version', 'show version']
])
    .bindHelp()
    .parseSystem();

/*
** Recuperation Arguments
*/
var portFrom = opt.options.portFrom ? opt.options.portFrom : 9200;
var hostFrom = opt.options.hostFrom ? opt.options.hostFrom : 'localhost';
var indexFrom = opt.options.indexFrom ? opt.options.indexFrom : '_all';
var typeFrom = opt.options.typeFrom ? opt.options.typeFrom : indexFrom;

var portTo = opt.options.portTo ? opt.options.portTo : portFrom;
var hostTo = opt.options.hostTo ? opt.options.hostTo : hostFrom;
var indexTo = opt.options.indexTo ? opt.options.indexTo : indexFrom;
var typeTo = opt.options.typeTo ? opt.options.typeTo : typeFrom;


var query = opt.options.query ? opt.options.query : {};
var elsQuery = opt.options.elsQuery ? opt.options.elsQuery : null;

/*
** Initialization elasticsearch client & query
*/

var manageDump = function(from, size, elsClientFrom, elsClientTo, query) {
	var cpt = 0;
	console.log('manageDump');
	elsClientFrom.search(indexFrom, query, {from: from, size: 1}, function(err, response) {
		if (err) {
			console.log('error on search', err);
		} else if (response && response.hits && response.hits.hits && response.hits.hits.length > 0) {
			console.log('else if response');
			var entitiesLength = response.hits.hits.length;
			var entities = response.hits.hits;
			for (iterator in entities) {
				elsClientTo.put(indexTo, typeTo, entities[iterator]._id, entities[iterator]._source, {upsert: entities[iterator]._source}, function(err, response) {
					if (err) {
						console.log('error on put', err);
					} else {
						++cpt;
						if (cpt >= entitiesLength) {
							console.log('on if entitiesLength');
							manageDump(from + cpt, 1000, elsClientFrom, elsClientTo, query);
						}
					}
				});
			}
		} else {
			console.log('finished');
			process.kill();
		}
	});
}

console.log('---->', hostFrom, portFrom, hostTo, portTo)
new ELSCLIENT(hostFrom, portFrom, function(elsClientFrom, msg) {
    if (!elsClientFrom) {
		throw('Couldn\'t connect to ELS');
	}
	new ELSCLIENT(hostTo, portTo, function(elsClientTo, msg) {
	    if (!elsClientTo) {
			throw('Couldn\'t connect to ELS');
		}
	    new ELSQUERY(function(tmpQuery) {
	    	tmpQuery.generate(typeFrom, query, null, {term: true}, function(err, queryELS) {
			    if (err) {
				console.log(err);
			    } else {
				    if (elsQuery) {
				    	try {
				    		console.log('elsQuery', elsQuery);
							query = JSON.parse(elsQuery);
						} catch (e) {
							console.log(e);
							query = {};
						}
					} else {
						query = queryELS;
					}
					console.log('query', JSON.stringify(query));
					elsClientFrom.count(indexFrom, query, function(err, result) {
						console.log('count', result);
					    size = result.count;
					    if (size > 0) {
					    	manageDump(0, size, elsClientFrom, elsClientTo, query);
					    } else {
							logger.info('elasticsearch-exported=> no file exported');
							process.kill();
					    }
					});
				}
	    	});
		});
	});
});