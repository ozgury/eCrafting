// Copyright (c) 2013 ecrafting.org, all rights reserved.
// http://www.ecrafting.org/
 var rootpath = process.cwd() + '/',
	path = require('path'),
	calipso = require(path.join(rootpath, 'lib/calipso'));



function Utilities() {
}

var utilities = new Utilities();

var me = Utilities.prototype;

module.exports = utilities;

me.commaSeparatedtoArray = function (valueList, defaultValue) {
	if (!valueList) {
		return defaultValue;
	}
	var list = valueList.split(",");

	list.forEach(function (val, index) {
		list[index] = val.trim();
	});
	return list;
}