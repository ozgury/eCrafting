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
  return "<ul id='" + this.name + "-menu' class='nav nav-pills'>";
};
menu.prototype.endTag = function () {
  return "</ul>";
};
menu.prototype.menuStartTag = function (menu, selected) {
  var menuItemTagId = menu.path.replace(/\//g, '-') + "-menu-item";

  return "<li id='" + menuItemTagId + "' class='dropdown " + selected + "'>";
};
menu.prototype.menuLinkTag = function (req, menu, selected) {
  var popup = menu.popup ? 'popupMenu' : '';

  if (menu.sortedChildren.length > 0) {
    return "<a href='" + menu.url + "' title='" + req.t(menu.description) + "' data-toggle='dropdown'>" + req.t(menu.name) + "</a>";
  }
  return "<a href='" + menu.url + "' title='" + req.t(menu.description) + "'>" + req.t(menu.name) + "</a>";
//  return "<a href='" + menu.url + "' title='" + req.t(menu.description) + "' class='" + popup + " " + this.name + "-menu-link" + selected + (menu.cls ? " " + menu.cls : "") + "'>" + req.t(menu.name) + "</a>";
};
menu.prototype.menuEndTag = function (menu) {
  return "</li>";
};
menu.prototype.childrenStartTag = function () {
  return "<ul class='dropdown-menu'>";
};
menu.prototype.childrenEndTag = function () {
  return "</ul>";
};

menu.prototype.childrenIcon = function () {
  return "<i class='icon-download' ";
}