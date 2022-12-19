const fileService = require('../services/fileService');
const fs = require('fs');
const path = require('path');
const ApiError = require("../error/ApiError");
const { QueryTypes } = require('sequelize');
const sequelize = require('../db');
const uuid = require('uuid');

class FileController {
    async createDir(req, res) {
        try {
            const {name, type, parentId} = req.body;
            const file = {name, type, parentId: parentId || null, userId: req.user.id};
            const parentFile = parentId
                ?
                await sequelize.query(`SELECT * FROM files WHERE id = ${parentId}`, {type: QueryTypes.SELECT})
                :
                '';
            if (!parentFile) {
                file.path = name;
            } else {
                file.path = path.join(parentFile[0].path, file.name);
            }
            await fileService.createDir(file)

            await sequelize.query(`INSERT INTO files (name, type, path, "parentId", "userId") VALUES ('${file.name}', '${file.type}', '${file.path}', ${file.parentId}, ${file.userId})`, {type: QueryTypes.INSERT})
            const [dbDir] = await sequelize.query(`SELECT * FROM files WHERE path = '${file.path}'`, {type: QueryTypes.SELECT})

            return res.status(200).json(dbDir)
        } catch (e) {
            return ApiError.badRequest('Error', e)
        }
    }

    async getFiles(req, res, next) {
        try {
            const {sort} = req.query;

            const parent = req.query.parent ?? null;
            let files;
            if (parent) {
                files = await sequelize.query(`SELECT * FROM files WHERE "userId" = ${req.user.id} AND "parentId" = ${parent}`, {type: QueryTypes.SELECT})
            } else {
                files = await sequelize.query(`SELECT * FROM files WHERE "userId" = ${req.user.id} AND "parentId" IS NULL`, {type: QueryTypes.SELECT})
            }
            files = [...files];

            function sortFiles(a, b) {
                if (a > b) {
                    return 1;
                }
                if (a < b) {
                    return -1;
                }
                return 0;
            }

            switch (sort) {
                case 'name':
                    files.sort((a, b) => sortFiles(a.name, b.name))
                    break;

                case 'type':
                    files.sort((a, b) => sortFiles(a.type, b.type))
                    break;

                case 'date':
                    files.sort((a, b) => Date(a.createdAt) - Date(b.createdAt))
                    break;
            }

            return res.json(files)
        } catch (e) {
            return ApiError.internal('Error', e)
        }
    }

    async uploadFile(req, res, next) {
        try {
            const file = req.files.file;
            const parentId = req.body.parent;
            let parent = parentId ?
                await sequelize.query(`SELECT * FROM files WHERE "userId" = ${req.user.id} AND id = ${parentId}`, {type: QueryTypes.SELECT})
                :
                null;

            const userId = req.user.id;
            const [user] = await sequelize.query(`SELECT * FROM users WHERE id = ${userId}`, {type: QueryTypes.SELECT});

            const usedSpace = parseInt(user.usedSpace) + parseInt(file.size);

            if (usedSpace > 1024*1024*1024) {
                return next(ApiError.internal('Error', 'There no space on the disk'));
            }
            console.log(parent)
            let pathFileSystem;
            if (parent) {
                parent = parent[0];
                pathFileSystem = path.join(__dirname, '..', 'files', `${userId}`, `${parent.path}`, `${file.name}`);
            } else {
                pathFileSystem = path.join(__dirname, '..', 'files', `${userId}`, `${file.name}`);
            }


            if (fs.existsSync(pathFileSystem)) {
                return next(ApiError.internal('Error', 'File already exist'))
            }

            await file.mv(pathFileSystem);

            const type = path.extname(file.name).slice(1);
            let pathFile = file.name;
            if (parent) {
                pathFile = path.join(parent.path, file.name);
            }

            await sequelize.query(`INSERT INTO files (name, type, size, path, "parentId", "userId") VALUES ('${file.name}', '${type}', ${file.size}, '${pathFile}', ${parent?.id || null}, ${userId})`, {type: QueryTypes.INSERT})
            await sequelize.query(`UPDATE users SET "usedSpace" = ${usedSpace} WHERE id = ${user.id}`, {type: QueryTypes.UPDATE})
            while (parent) {
                await sequelize.query(`UPDATE files SET size = ${parent.size + file.size} WHERE id = ${parent.id}`, {type: QueryTypes.UPDATE})
                if (!parent.parentId) {
                    break;
                }
                [parent] = await sequelize.query(`SELECT * FROM files WHERE id = ${parent.parentId}`, {type: QueryTypes.SELECT})
            }

            const [dbFile] = await sequelize.query(`SELECT * FROM files WHERE path = '${pathFile}'`, {type: QueryTypes.SELECT})

            return res.json(dbFile)
        } catch (e) {
            console.log(e);
            return next(ApiError.internal('Error', e));
        }
    }

    async downloadFile(req, res, next) {
        try {
            const [file] = await sequelize.query(`SELECT * FROM files WHERE id = ${req.query.id}`, { type: QueryTypes.SELECT });
            const pathFile = path.join(__dirname, '..', 'files', file.userId.toString(), file.path);

            if (fs.existsSync(pathFile)) {
                return res.download(pathFile, file.name);
            }

            return next(ApiError.badRequest('Download Error'))
        } catch(e) {
            console.log(e);
            next(ApiError.internal('Download error', e));
        }
    }

    async deleteFile(req, res, next) {
        try {
            const [file] = await sequelize.query(`SELECT * FROM files WHERE id = ${req.query.id} AND "userId" = ${req.user.id}`, { type: QueryTypes.SELECT });
            const [user] = await sequelize.query(`SELECT * FROM users WHERE id = ${req.user.id}`, { type: QueryTypes.SELECT });
            let parent;
            if (file.parentId) {
                [parent] = await sequelize.query(`SELECT * FROM files WHERE id = ${file.parentId} AND "userId" = ${req.user.id}`, { type: QueryTypes.SELECT });;
            }

            if (!file) {
                return next(ApiError.badRequest('file not found'))
            }

            fileService.deleteFile(file);

            while (parent) {
                await sequelize.query(`UPDATE files SET size = ${parent.size - file.size} WHERE id = ${parent.id}`, {type: QueryTypes.UPDATE})
                if (!parent.parentId) {
                    break;
                }
                [parent] = await sequelize.query(`SELECT * FROM files WHERE id = ${parent.parentId}`, {type: QueryTypes.SELECT})
            }

            await sequelize.query(`UPDATE users SET "usedSpace" = ${user.usedSpace - file.size} WHERE id = ${user.id}`, {type: QueryTypes.UPDATE})
            await sequelize.query(`DELETE FROM "files" WHERE id = ${req.query.id} AND "userId" = ${req.user.id}`, {type: QueryTypes.DELETE});
            return res.json({message: 'File was deleted'})
        } catch (e) {
            console.log(e);
            return next(ApiError.badRequest('Dir is not empty'))
        }
    }

    async searchFile(req, res, next) {
        try {
            const searchName = req.query.search;
            let files = await sequelize.query(`SELECT * FROM files WHERE "userId" = ${req.user.id}`, {type: QueryTypes.SELECT})

            files = files.filter(file => {
                const fileName = file.name.toLowerCase();
                return fileName.includes(searchName.toLowerCase())
            });

            return res.json(files)

        } catch (e) {
            console.log(e)
            next(ApiError.badRequest('Error'))
        }
    }

    async uploadAvatar(req, res, next) {
        try {
            const file = req.files.file;
            const [user] = await sequelize.query(`SELECT * FROM users WHERE id = ${req.user.id}`, {type: QueryTypes.SELECT});
            const avatarName = uuid.v4() + '.jpg';

            await file.mv(path.join(__dirname, '..', 'static', avatarName));
            await sequelize.query(`UPDATE users SET "avatar" = '${avatarName}' WHERE id = ${user.id}`, {type: QueryTypes.UPDATE})
            user.avatar = avatarName;
            user.roles = req.user.roles;

            return res.json(user);
        }
         catch (e) {
            console.log(e);
            next(ApiError.badRequest('Upload avatar error'))
        }
    }

    async deleteAvatar(req, res, next) {
        try {
            const [user] = await sequelize.query(`SELECT * FROM users WHERE id = ${req.user.id}`, {type: QueryTypes.SELECT});

            await fs.unlinkSync(path.join(__dirname, '..', 'static', user.avatar))
            await sequelize.query(`UPDATE users SET "avatar" = null WHERE id = ${user.id}`, {type: QueryTypes.UPDATE})
            user.avatar = null;
            user.roles = req.user.roles;

            return res.json(user);
        }
        catch (e) {
            console.log(e);
            next(ApiError.badRequest('Delete avatar error'))
        }
    }

    async addFavorite(req, res, next) {
        try {
            const {file} = req.body;
            if (file.favorite) {
                await sequelize.query(`UPDATE files SET "favorite" = false WHERE id = ${file.id} AND "userId" = ${req.user.id}`, {type: QueryTypes.UPDATE})
            } else {
                await sequelize.query(`UPDATE files SET "favorite" = true WHERE id = ${file.id} AND "userId" = ${req.user.id}`, {type: QueryTypes.UPDATE})
            }
            return res.json({message: 'File change favorite'})
        } catch (e) {
            console.log(e)
            next(ApiError.badRequest('Error favorite'))
        }
    }

    async createCopyFile(req, res, next) {
        try {
            const {file} = req.body;
            let parent;
            if (file.parentId) {
                [parent] = await sequelize.query(`SELECT * FROM files WHERE id = ${file.parentId} AND "userId" = ${req.user.id}`, { type: QueryTypes.SELECT });;
            }

            const extname = path.extname(file.name);
            const fileName = file.name.slice(0, file.name.length - extname.length);

            let pathFile = path.join(file.path, '..', `${fileName}`);

            let count = 1;
            let finalPath = `${pathFile}(${count})${extname}`
            while(fs.existsSync(path.join(__dirname, '..', 'files', `${req.user.id}`, `${finalPath}`))) {
                count += 1;
                finalPath = `${pathFile}(${count})${extname}`;
            }

            const [user] = await sequelize.query(`SELECT * FROM users WHERE id = ${req.user.id}`, {type: QueryTypes.SELECT});
            await sequelize.query(`INSERT INTO files (name, type, size, path, "parentId", "userId") VALUES ('${fileName}(${count})${extname}', '${file.type}', ${file.size}, '${finalPath}', ${file.parentId}, ${file.userId})`, {type: QueryTypes.INSERT})
            await sequelize.query(`UPDATE users SET "usedSpace" = ${parseInt(user.usedSpace) + file.size} WHERE id = ${req.user.id}`, {type: QueryTypes.UPDATE})
            while (parent) {
                await sequelize.query(`UPDATE files SET size = ${parent.size + file.size} WHERE id = ${parent.id}`, {type: QueryTypes.UPDATE})
                if (!parent.parentId) {
                    break;
                }
                [parent] = await sequelize.query(`SELECT * FROM files WHERE id = ${parent.parentId}`, {type: QueryTypes.SELECT})
            }
            const [dbFile] = await sequelize.query(`SELECT * FROM files WHERE "userId" = ${req.user.id} AND path = '${finalPath}'`, {type: QueryTypes.SELECT});

            await fs.copyFileSync(path.join(__dirname, '..', 'files', `${req.user.id}`, file.path), path.join(__dirname, '..', 'files', `${req.user.id}`, `${finalPath}`))

            return res.json(dbFile)
        } catch (e) {
            console.log(e)
            next(ApiError.badRequest('Error copy file'))
        }
    }

    async readFile(req, res, next) {
        try {
            const {file} = req.body;

            const pathFile = path.join(__dirname, '..', 'files', `${file.userId}`, file.path);
            const stream = fs.createReadStream(pathFile, );
            let data = '';
            stream.on('data', chunk => data += chunk);
            stream.on('end', () => res.json({data}));
        } catch (e) {
            console.log(e)
            next(ApiError.badRequest('Error read file'))
        }
    }

    async createAccessLink(req, res, next) {
        try {
            const file = req.body.file;
            const link = uuid.v4();

            await sequelize.query(`UPDATE files SET "access_link" = '${link}' WHERE id = ${file.id}`, {type: QueryTypes.UPDATE})
            const [accessFile] = await sequelize.query(`SELECT * FROM accesses WHERE "fileId" = ${file.id}`, {type: QueryTypes.SELECT})
            if (!accessFile) {
                await sequelize.query(`INSERT INTO accesses ("fileId", "userId") VALUES (${file.id}, ${req.user.id})`, {type: QueryTypes.INSERT})
            }

            return res.json({message: 'Link was created', link})
        } catch (e) {
            console.log(e);
            next(ApiError.badRequest('Error create link'))
        }
    }

    async getFilesOnLink(req, res, next) {
        try {
            const link = req.query.link;

            const [file] = await sequelize.query(`SELECT * FROM files WHERE "access_link" = '${link}'`, {type: QueryTypes.SELECT})

            return res.json(file);
        } catch (e) {
            console.log(e);
            next(ApiError.notFound())
        }
    }

    async renameFile(req, res, next) {
        try {
            const file = req.body.file;
            const newName = req.body.name;
            const oldPath = path.join(__dirname, '..', 'files', `${req.user.id}`, `${file.path}`);
            const newPath = path.join(__dirname, '..', 'files', `${req.user.id}`, `${file.path}`, '..', `${newName}`);

            // Проверяем существует ли имя файла, на которое собираемся переименовать
            if (fs.existsSync(newPath)) {
                return next(ApiError.badRequest('This name is already exists'));
            }

            const pathFile = path.join(file.path, '..', newName);
            const extname = path.extname(newName).slice(1);
            fs.renameSync(oldPath, newPath)
            await sequelize.query(`UPDATE files SET name = '${newName}', type = '${extname}', path = '${pathFile}' WHERE id = ${file.id}`, {type: QueryTypes.UPDATE})

            file.type = extname;
            file.path = pathFile;
            file.name = newName;

            return res.json({message: 'all right', file})
        } catch (e) {
            console.log(e);
            next(ApiError.badRequest('Error rename'))
        }
    }
}

module.exports = new FileController();