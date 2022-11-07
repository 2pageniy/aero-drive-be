const Access = require('./Access');
const File = require('./File');
const Permission = require('./Permission');
const Role = require('./Role');
const User = require('./User');

User.hasMany(File, {onDelete: "CASCADE"});
File.belongsTo(User, {onDelete: "CASCADE"});

User.hasMany(Access, {onDelete: "CASCADE"});
Access.belongsTo(User, {onDelete: "CASCADE"});

User.hasMany(Permission, {onDelete: "CASCADE"});
Permission.belongsTo(User, {onDelete: "CASCADE"});

File.belongsTo(File, {as: 'parent'});

File.hasMany(Access);
Access.belongsTo(File);

Role.hasMany(Permission);
Permission.belongsTo(Role);

module.exports = {
    File,
    User,
    Access,
    Permission,
    Role
}