const fileService = require('../services/fileService');
const File = require('../models/File');

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
            console.log(e)
            return res.status(400).json(e)
        }
    }
}

module.exports = new FileController();