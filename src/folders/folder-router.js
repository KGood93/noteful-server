const path = require('path')
const express = require('express')
const xss = require('xss')
const folderService = require('./folder-service')

const foldersRouter = express.Router()
const jsonParser = express.json()

const serializeFolder = folder => ({
    id: folder.id,
    name: xss(folder.name)
})

foldersRouter
    .route('/folders')
    .get((req, res, next) => {
        const knexInstance = req.app.get('db')
        folderService.getAllFolders(knexInstance)
    .then(folders => {
        res.json(folders.map(serializeFolder))
        })
        .catch(next)
    })
    .post(jsonParser, (req, res, next) => {
        const knexInstance = req.app.get('db')
        const {name} = req.body
        const newFolder = {name}

        if(newFolder.name == null || newFolder.name == '') {
            return res
                .status(400)
                .json({
                    error: {message: 'Missing folder name'}
                })
        }

        folderService.insertFolder(knexInstance, newFolder)
            .then(folder => {
                res
                    .status(201)
                    .location(path.posix.join(req.originalUrl, `/${folder.id}`))
                    .json(serializeFolder(folder))
            })
            .catch(next)
    })

foldersRouter
    .route('/folders/:folder_id')
    .all((req, res, next) => {
        const knexInstance = req.app.get('db')
        folderService.getFolderById(
            knexInstance,
            req.params.folder_id
        )
        .then(folder => {
            if(!folder) {
                return res
                    .status(404)
                    .json({
                        error: {message: `Folder ${folder_id} doesn't exist`}
                    })
            }
            res.folder = folder
            next()
        })
        .catch(next)
    })
    .get((req, res, next) => {
        res.json(serializeFolder(res.folder))
    })
    .delete((req, res, next) => {
        const knexInstance = req.app.get('db')
        folderService.deleteFolder(knexInstance, req.params.folder_id)
            .then(() => {
                res
                    .status(204)
                    .end()
            })
        .catch(next)
    })
    .patch(jsonParser, (req, res, next) => {
        const knexInstance = req.app.get('db')
        const {name} = req.body

        if(name == null || name == '') {
            return
                res
                    .status(400)
                    .json({
                        error: {message: `Request body must contain a value for name`}
                    })
        }
        const folderToUpdate = {name}
        folderService.updateFolder(knexInstance, req.params.folder_id, folderToUpdate)
            .then((updateFolder) => {
                res
                    .status(204)
                    .end()
            })
            .catch(next)
    })
  
module.exports = foldersRouter  