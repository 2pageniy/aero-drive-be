const fileService = require('../services/fileService');
const fs = require('fs');
const path = require('path');
const File = require('../models/File');
const ApiError = require("../error/ApiError");
const User = require("../models/User");
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
            console.log(file.name, file.type, file.path, file.parentId, file.userId);
            await sequelize.query(`INSERT INTO files (name, type, path, "parentId", "userId") VALUES ('${file.name}', '${file.type}', '${file.path}', ${file.parentId}, ${file.userId})`, {type: QueryTypes.INSERT})

            return res.status(200).json(file)
        } catch (e) {
            return ApiError.badRequest('Error', e)
        }
    }

    async getFiles(req, res, next) {
        try {
            const parent = req.query.parent ?? null;
            let files;
            if (parent) {
                files = await sequelize.query(`SELECT * FROM files WHERE "userId" = ${req.user.id} AND "parentId" = ${parent}`, {type: QueryTypes.SELECT})
            } else {
                files = await sequelize.query(`SELECT * FROM files WHERE "userId" = ${req.user.id} AND "parentId" IS NULL`, {type: QueryTypes.SELECT})
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
}

module.exports = new FileController();