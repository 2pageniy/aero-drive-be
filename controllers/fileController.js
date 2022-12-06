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
            const file = File.build({name, type, parentId, userId: req.user.id});
            const parentFile = parentId ? await File.findOne({where: {id: parentId}}) : null;
            if (!parentFile) {
                file.path = name;
            } else {
                file.path = path.join(parentFile.path, file.name);
            }
            await fileService.createDir(file)
            await file.save()

            return res.status(200).json(file)
        } catch (e) {
            return ApiError.badRequest('Error', e)
        }
    }

    async getFiles(req, res, next) {
        try {
            console.log(req.user.id)
            let files = await File.findAll({
                where: {
                    userId: req.user.id,
                    parentId: req.query.parent || null,
                }
            })
            return res.json(files)
        } catch (e) {
            return ApiError.internal('Error', e)
        }
    }

    async uploadFile(req, res, next) {
        try {
            const file = req.files.file;
            const parentId = req.body.parent;
            const parent = parentId ? await File.findOne({
                where: {
                    userId: req.user.id,
                    id: parentId
                }
            }) : null;

            const userId = req.user.id;
            const user = await User.findOne({where: {id: userId}});


            if (parseInt(user.usedSpace) + parseInt(file.size) > 1024*1024*1024) {
                next(ApiError.internal('Error', 'There no space on the disk'));
            }

            user.usedSpace = parseInt(user.usedSpace) + parseInt(file.size);

            let pathFileSystem;
            if (parent) {
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

            const dbFile = await File.create({
                name: file.name,
                type,
                size: file.size,
                path: pathFile,
                parentId: parent?.id,
                userId
            })

            await user.save();

            return res.json(dbFile)
        } catch (e) {
            console.log(e);
            next(ApiError.internal('Error', e));
        }
    }

    async downloadFile(req, res, next) {
        try {
            let file = await sequelize.query(`SELECT * FROM "files" AS "file" WHERE "file"."id" = ${req.query.id} AND "file"."userId" = ${req.user.id}`, { type: QueryTypes.SELECT });
            //const file = await File.findOne({where: {id: req.query.id, userId: 17}})
            file = file[0];
            const pathFile = path.join(__dirname, '..', 'files', req.user.id.toString(), file.path, file.name);

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
            let file = await sequelize.query(`SELECT * FROM "files" AS "file" WHERE "file"."id" = ${req.query.id} AND "file"."userId" = ${req.user.id}`, { type: QueryTypes.SELECT });
            file = file[0];

            if (!file) {
                next(ApiError.badRequest('file not found'))
            }
            console.log(1)
            fileService.deleteFile(file);
            console.log(2)

            await sequelize.query(`DELETE FROM "files" WHERE "files"."id" = ${req.query.id} AND "files"."userId" = ${req.user.id}`, {type: QueryTypes.DELETE});
            return res.json({message: 'File was deleted'})
        } catch (e) {
            console.log(e);
            next(ApiError.badRequest('Dir is not empty'))
        }
    }
}

module.exports = new FileController();