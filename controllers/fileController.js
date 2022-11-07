const fileService = require('../services/fileService');
const File = require('../models/File');
const ApiError = require("../error/ApiError");

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
            const files = await File.findAll({
                where: {
                    userId: req.user.id,
                    parentId: req.query.parent || null,
                }
            })
            return res.json({files})
        } catch (e) {
            return ApiError.internal('Error', e)
        }
    }
}

module.exports = new FileController();