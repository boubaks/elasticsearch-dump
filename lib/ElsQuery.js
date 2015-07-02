/*
** GLOBALS
*/

/**********************************************************************
******************************queryELS OBJECT**************************
**********************************************************************/
var me = undefined;
var BASIC_MAPPINGEXEC_LENGTH = 6;
exports.ElsQuery = function(callback) {
    this.query = {};
    this.options = {};
    this.mappingExecution = [
	{param: '$page', defaultValue: 1, fcn: handlePage},
	{param: '$limit', defaultValue: 10, fcn: handleLimit},
	{param: '$sort', defaultValue: null, fcn: handleSort},
	{param: '$skip', defaultValue: 0, fcn: handleSkip},
	{param: '$handle', defaultValue: null, fcn: handleQuery},
	{param: '$count', defaultValue: false, fcn: handleCount},
	{param: ['$exists', '$type'], defaultValue: null, fcn: handleElement},
	// {param: ['$gt', '$gte', '$in', '$lt', '$lte', '$ne', '$nin'], defaultValue: null, fcn: handleComparison},
	// {param: ['$and', '$nor', '$not', '$or'], defaultValue: null, fcn: handleLogical},
    ];
    me = this;
    callback(this);
}

/**********************************************************************
****************************PRIVATE FUNCTIONS**************************
**********************************************************************/
exports.ElsQuery.prototype.isParam = function(param) {
    for (iterator in me.mappingExecution) {
	if ((typeof(me.mappingExecution[iterator].param) == 'object' && me.mappingExecution[iterator].param.indexOf(param) > -1) ||
	    me.mappingExecution[iterator].param == param)
	    return (true);
    }
    return (false);
}

/**********************************************************************
****************************PUBLIC FUNCTIONS**************************
**********************************************************************/

/*
** generate a query for elasticsearch from a simple query
** generate use set the elasticquery and get it directly
*/
exports.ElsQuery.prototype.generate = function(type, query, aggregation, options, callback) {
    for (iterator in me.mappingExecution) {
	this[me.mappingExecution[iterator].param] = query[me.mappingExecution[iterator].param] ?
	    query[me.mappingExecution[iterator].param] : me.mappingExecution[iterator].defaultValue;
    }
    this.set(type, query, aggregation, options, function(err) {
	var queryELS = me.get();
	callback(err, queryELS);
    });
}

function processExec(step, query, queryELS, callback) {
    me.mappingExecution[step].fcn(query, queryELS, function(err, results) {
	queryELS = results;
	++step;
	if (step < me.mappingExecution.length) {
	    processExec(step, query, queryELS, callback);
	} else {
	    callback(err, queryELS);
	}
    });
}

/*
** set the elasticquery
*/
exports.ElsQuery.prototype.set = function(type, query, aggregations, options, callback) {
    var iterator = 0;
    var queryELS = {
	"query": {
	    "filtered": {
		"query": {
		    "term": {
			"_type": type
		    }
		},
		"filter": {
		    "bool": {
			"must": [],
			"must_not": [],
			"should": []
		    }
		}
	    }
	}
    };
    this.options = options;
    if (aggregations)
	query.aggregations = aggregations;
    processExec(iterator, query, queryELS, function(err, results) {
	me.query = results;
	callback(err);
    });
}

/*
** return the elasticquery
*/
exports.ElsQuery.prototype.get = function() {
    return (this.query);
}

/*
** add a function passed in parameters to the generate function flow
*/
exports.ElsQuery.prototype.addHandle = function(param, defaultValue, fcn) {
    this.mappingExecution.unshift({param: param, defaultValue: defaultValue, fcn: fcn});
}

/*
** delete a handle
*/

exports.ElsQuery.prototype.deleteHandle = function(index, all) {
    if (all == true) {
	var length = this.mappingExecution.length;
	this.mappingExecution.splice(0, (length - BASIC_MAPPINGEXEC_LENGTH));
    } else {
	this.mappingExecution.splice(index, 1);
    }
}

/*
** get the handles parameters
*/
exports.ElsQuery.prototype.getHandles = function() {
    var handles = this.mappingExecution;
    console.log(handles);
}

/*
** Handle functions.
*/
function handleLimit(query, queryELS, callback) {
    callback(null, queryELS);
}

function handleSort(query, queryELS, callback) {
    var sortQuery = null;
    try {
    	sortQuery = query['$sort'] ?  JSON.parse(query['$sort']) : null;
    } catch (e) {
	console.log('Error:', e);
    }
    if (sortQuery) {
	for (value in sortQuery) {
	    if (sortQuery[value] == 0) {
	    	delete (sortQuery[value]);
	    } else if (sortQuery[value] > 0) {
	    	sortQuery[value] = {"order": "asc"};
	    } else {
	    	sortQuery[value] = {"order": "desc"};
	    }
	}
   	queryELS.sort = [sortQuery];
    }
    callback(null, queryELS);
}

function manageExists(existsQuery, queryELS, callback) {
    var must = queryELS.query.filtered.filter.bool.must ? queryELS.query.filtered.filter.bool.must : new Array();
    var must_not = queryELS.query.filtered.filter.bool.must_not ? queryELS.query.filtered.filter.bool.must_not : new Array();
    if (existsQuery) {
	var obj = {};
	for (param in existsQuery) {
	    obj = {"exists": {"field": param}};
	    if (existsQuery[param] == true) {
		must.push(obj);
	    } else {
		must_not.push(obj);
	    }
	}
	queryELS.query.filtered.filter.bool.must = must;
	queryELS.query.filtered.filter.bool.must_not = must_not;
	callback(queryELS);
    } else {
	callback(queryELS);
    }
}

function manageType(type, queryELS, callback) {
    if (type) {
	queryELS.query.filtered.query.term._type = type;
	callback(queryELS);
    } else {
	callback(queryELS);
    }
}

function handleElement(query, queryELS, callback) {
    if (query.$exists || query.$type) {
	manageExists(query.$exists, queryELS, function(queryExists) {
	    queryELS = queryExists;
	    manageType(query.$type, queryELS, function(queryType) {
		queryELS = queryType;
		callback(null, queryELS);
	    });
	});
    } else {
	callback(null, queryELS);
    }
}

function handleSkip(query, queryELS, callback) {
    callback(null, queryELS);
}

function handlePage(query, queryELS, callback) {
    callback(null, queryELS);
}

function handleCount(query, queryELS, callback) {
    callback(null, queryELS);
}

function handleQuery(query, queryELS, callback) {
    var must = queryELS.query.filtered.filter.bool.must ? queryELS.query.filtered.filter.bool.must : new Array();
    for (param in query) {
	if (me.isParam(param) == false) {
	    var term = {};
	    term[param] = query[param];
	    if (me.options && me.options.term && me.options.term == true) {
		must.push({"term": term});
	    } else {
		must.push({"query": {"match": term}});
	    }
	}
    }
    if (must.length > 0)
	queryELS.query.filtered.filter.bool.must = must;
    callback(null, queryELS);
}