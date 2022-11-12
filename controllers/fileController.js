const fileService = require('../services/fileService');
const fs = require('fs');
const path = require('path');
const File = require('../models/File');
const ApiError = require("../error/ApiError");
const User = require("../models/User");

class FileController {
    async createDir(req, res) {
        try {
            const {name, type, parentId} = req.body;
            const file = File.build({name, type, parentId, userId: req.user.id});
            const parentFile = parentId ? await File.findOne({where: {id: parentId}}) : null;
            if (!parentFile) {
                file.path = name;
            } else {
                file.path = `${parentFile.path}\\${file.name}`
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
                    parentId
                }
            }) : null;

            const userId = req.user.id;
            const user = await User.findOne({id: userId});

            if (user.usedSpace + file.size > 10000) {
                return ApiError.internal('Error', 'There no space on the disk')
            }

            user.usedSpace += file.size;

            let pathFile;
            if (parent) {
                pathFile = path.join(__dirname, '..', 'files', `${userId}`, `${parent.path}`, `${file.name}`);
            } else {
                pathFile = path.join(__dirname, '..', 'files', `${userId}`, `${file.name}`);
            }


            if (fs.existsSync(pathFile)) {
                return ApiError.internal('Error', 'File already exist');
            }

            await file.mv(pathFile);

            const type = path.extname(file.name).slice(1);
            const dbFile = await File.create({
                name: file.name,
                type,
                size: file.size,
                path: parent?.path,
                parentId: parent?.id,
                userId
            })

            await user.save();

            return res.json(dbFile)
        } catch (e) {
            console.log(e);
            return ApiError.internal('Error', e)
        }
    }
}

module.exports = new FileController();