const User = require('./User');
const Role = require('./Role');
const Permission = require('./Permission');
const File = require('./File');
const Access = require('./Access');

// User.hasMany(File, {onDelete: "CASCADE"});
// File.belongsTo(User, {onDelete: "CASCADE"});
//
// User.hasMany(Access, {onDelete: "CASCADE"});
// Access.belongsTo(User, {onDelete: "CASCADE"});
//
// User.hasMany(Permission, {onDelete: "CASCADE"});
// Permission.belongsTo(User, {onDelete: "CASCADE"});
//
// File.belongsTo(File, {as: 'parent'});
//
// File.hasMany(Access);
// Access.belongsTo(File);
//
// Role.hasMany(Permission);
// Permission.belongsTo(Role);

module.exports = {
    User,
    File,
    Access,
    Permission,
    Role
};