const fileService = require('../services/fileService');
const fs = require('fs');
const path = require('path');
const ApiError = require("../error/ApiError");
const { QueryTypes } = require('sequelize');
const sequelize = require('../db')

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
                next(ApiError.internal('Error', 'There no space on the disk'));
            }

            let pathFileSystem;
            if (parent) {
                parent = parent[0];
                pathFileSystem = path.join(__dirname, '..', 'files', `${userId}`, `${parent.path}`, `${file.name}`);
            } else {
                pathFileSystem = path.join(__dirname, '..', 'files', `${userId}`, `${file.name}`);
            }


            if (fs.existsSync(pathFileSystem)) {
                next(ApiError.internal('Error', 'File already exist'))
            }

            await file.mv(pathFileSystem);

            const type = path.extname(file.name).slice(1);
            let pathFile = file.name;
            if (parent) {
                pathFile = path.join(parent.path, file.name);
            }

            await sequelize.query(`INSERT INTO files (name, type, size, path, "parentId", "userId") VALUES ('${file.name}', '${type}', ${file.size}, '${pathFile}', ${parent?.id || null}, ${userId})`, {type: QueryTypes.INSERT})
            await sequelize.query(`UPDATE users SET "usedSpace" = ${usedSpace} WHERE id = ${user.id}`, {type: QueryTypes.UPDATE})

            const [dbFile] = await sequelize.query(`SELECT * FROM files WHERE path = '${pathFile}'`, {type: QueryTypes.SELECT})

            return res.json(dbFile)
        } catch (e) {
            console.log(e);
            next(ApiError.internal('Error', e));
        }
    }

    async downloadFile(req, res, next) {
        try {
            const [file] = await sequelize.query(`SELECT * FROM files WHERE id = ${req.query.id} AND "userId" = ${req.user.id}`, { type: QueryTypes.SELECT });
            const pathFile = path.join(__dirname, '..', 'files', req.user.id.toString(), file.path);

            if (fs.existsSync(pathFile)) {
                return res.download(pathFile, file.name);
            }

            next(ApiError.badRequest('Download Error'))
        } catch(e) {
            console.log(e);
            next(ApiError.internal('Download error', e));
        }
    }

    async deleteFile(req, res, next) {
        try {
            const [file] = await sequelize.query(`SELECT * FROM files WHERE id = ${req.query.id} AND "userId" = ${req.user.id}`, { type: QueryTypes.SELECT });
            const [user] = await sequelize.query(`SELECT * FROM users WHERE id = ${req.user.id}`, { type: QueryTypes.SELECT });

            if (!file) {
                next(ApiError.badRequest('file not found'))
            }

            fileService.deleteFile(file);

            await sequelize.query(`UPDATE users SET "usedSpace" = ${user.usedSpace - file.size} WHERE id = ${user.id}`, {type: QueryTypes.UPDATE})
            await sequelize.query(`DELETE FROM "files" WHERE id = ${req.query.id} AND "userId" = ${req.user.id}`, {type: QueryTypes.DELETE});
            return res.json({message: 'File was deleted'})
        } catch (e) {
            console.log(e);
            next(ApiError.badRequest('Dir is not empty'))
        }
    }

    async searchFile(req, res, next) {
        try {
            const searchName = req.query.search;
            let files = await sequelize.query(`SELECT * FROM files WHERE "userId" = ${req.user.id}`, {type: QueryTypes.SELECT})
            console.log(searchName)
            files = files.filter(file => file.name.includes(searchName));

            return res.json(files)

        } catch (e) {
            console.log(e)
            next(ApiError.badRequest('Error'))
        }
    }
}

module.exports = new FileController();