const express = require('express')
const path = require('path')
const folderService = require('./folder-service')

const foldersRouter = express.Router()
const jsonParser = express.json()

foldersRouter
    .route('/')
    .get((req, res, next) => {
        const knexInstance = req.app.get('db')
        folderService.getAllFolders(knexInstance)
            .then(folders => {
                res.json(folders)
            })
            .catch(next)
    })
    .post(jsonParser, (req, res, next) => {
        const {name} = req.body
        const newFolder = {name}

        if(newFolder.name == null ) {
            return res
                .status(400)
                .json({
                    error: {message: 'Missing folder name'}
                })
        }

        folderService.insertFolder(
            req.app.get('db'),
            newFolder
        )
            .then(folder => {
                res
                    .status(201)
                    .location(path.posix.join(req.originalUrl, `/${folder.id}`))
                    .json(folder)
            })
            .catch(next)
    })

foldersRouter
    .route('/:folder_id')
    .all((req, res, next) => {
        folderService.getFolderById(
            req.app.get('db'),
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
        res.json(res.folder)
    })
    .delete((req, res, next) => {
        folderService.deleteFolder(
            req.app.get('db'),
            req.params.folder_id
        )
        .then(() => {
            res
                .status(204)
                .end()
        })
        .catch(next)
    })
  
module.exports = foldersRouter  