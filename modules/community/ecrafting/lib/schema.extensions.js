// Copyright (c) 2013 ecrafting.org, all rights reserved.
// http://www.ecrafting.org/

module.exports = function schemaExtensionsPlugin (schema, options) {
	schema.add({ created: Date });
	schema.add({ updated: Date });
	schema.pre('save', function (next) {
		if (!this.created) {
			this.created = new Date;
		}
		this.updated = new Date;
		next();
	});

	if (options && options.index) {
		schema.path('updated').index(options.index);
	}
}
