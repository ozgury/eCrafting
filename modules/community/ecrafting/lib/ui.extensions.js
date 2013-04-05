// Copyright (c) 2013 ecrafting.org, all rights reserved.
// http://www.ecrafting.org/
 var rootpath = process.cwd() + '/',
  path = require('path'),
  calipso = require(path.join(rootpath, 'lib/calipso')),
  menu = require(path.join(rootpath, 'lib/core/Menu'));


/**
 * Menu rendering functions
 * Over-write to enable custom menu rendering
 */
menu.prototype.startTag = function () {
  return "<ul id='" + this.name + "-menu' class='menuxx" + (this.cls ? ' ' + this.cls : '') + "'>";
};
menu.prototype.endTag = function () {
  return "</ul>";
};
menu.prototype.menuStartTag = function (menu, selected) {
  var menuItemTagId = menu.path.replace(/\//g, '-') + "-menu-item";
  return "<li id='" + menuItemTagId + "' class='" + this.name + "-menu-item" + selected + "'>";
};
menu.prototype.menuLinkTag = function (req, menu, selected) {
  var popup = menu.popup ? 'popupMenu' : '';
  return "<a href='" + menu.url + "' title='" + req.t(menu.description) + "' class='" + popup + " " + this.name + "-menu-link" + selected + (menu.cls ? " " + menu.cls : "") + "'>" + req.t(menu.name) + "</a>";
};
menu.prototype.menuEndTag = function (menu) {
  return "</li>";
};
menu.prototype.childrenStartTag = function () {
  return "<ul>";
};
menu.prototype.childrenEndTag = function () {
  return "</ul>";
};

menu.prototype.childrenIcon = function () {
  return "<i class='icon-download' ";
}