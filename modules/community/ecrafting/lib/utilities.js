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
	if (defaultValue === null || (defaultValue.length === 1 && (defaultValue[0].trim() === '' || defaultValue[0].trim() === '///?'))) {
		defaultValue = [];
	}
	if (!valueList) {
		return defaultValue;
	}
	var list = valueList.split(",");

	list.forEach(function (val, index) {
		list[index] = val.trim();
	});
	return list;
}

me.isAdminOrDataOwner = function (req, data) {
	return (req.session.user && req.session.user.isAdmin) || (req.session.user && data && (req.session.user.username === data.owner));
}

me.isUserCircleMember = function (username, c) {
	if (c.owner === username)
		return true;
	var len = c.members.length;
	
	for (var i = 0; i<len; i++){
		if (username === c.members[i]) 
			return true;
	}
	return false;
}
