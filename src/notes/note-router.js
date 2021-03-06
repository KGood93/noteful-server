const path = require('path')
const express = require('express')
const xss = require('xss')
const noteService = require('./note-service')

const notesRouter = express.Router()
const jsonParser = express.json()

const serializeNote = note => ({
    id: note.id,
    title: xss(note.title),
    content: xss(note.content),
    date_modified: note.date_modified,
    folder_id: note.folder_id
})

notesRouter
    .route('/api/notes')
    .get((req, res, next) => {
        const knexInstance = req.app.get('db')
        noteService.getAllNotes(knexInstance)
            .then(notes => {
                res.json(notes.map(serializeNote))
            })
            .catch(next)
    })
    .post(jsonParser, (req, res, next) => {
        const knexInstance = req.app.get('db')
        const {name, content, folder_id, date_modified} = req.body
        const newNote = {name, content, folder_id}

        for(const [key, value] of Object.entries(newNote)) {
            if(value == null) {
                return res
                    .status(400)
                    .json({
                        error: {message: `Missing '${key}' in request body`}
                    }) 
            }
        }

        newNote.date_modified = date_modified;

        noteService.insertNote(knexInstance, newNote)
            .then(note => {
                res 
                    .status(201)
                    .location(path.posix.join(req.originalUrl, `/${note.id}`))
                    .json(serializeNote(note))
            })
            .catch(next)
    })

    notesRouter
        .route('/api/notes/:note_id')
        .all((req, res, next) => {
            const knexInstance = req.app.get('db')
            noteService.getNoteById(knexInstance, req.params.note_id)
            .then(note => {
                if(!note) {
                    return res
                        .status(404)
                        .json({
                            error: {message:`Note '${note_id}' doesn't exist`}
                        })
                }
                res.note = note
                next()
            })
            .catch(next)
        })
        .get((req, res, next) => {
            res.json(serializeNote(res.note))
        })
        .delete((req, res, next) => {
            const knexInstance = req.app.get('db')
            noteService.deleteNote(knexInstance, req.params.note_id)
            .then(() => {
                res
                    .status(204)
                    .end()
            })
            .catch(next)
        })
        .patch(jsonParser, (req, res, next) => {
            const knexInstance = req.app.get('db')
            const {title, content, folder_id} = req.body
            const noteToUpdate = {title, content, folder_id}

            const numberOfValues = Object.values(noteToUpdate).filter(Boolean).length
            if(numberOfValues === 0) {
                return res
                    .status(400)
                    .json({
                        error: {message: `Request body must contain either 'name', 'content', or 'folder id'`}
                    })
            }
            noteService.updateNote(
                knexInstance,
                req.params.note_id,
                noteToUpdate
            )
            .then(() => {
                res
                    .status(204)
                    .end()
            })
            .catch(next)
        })

module.exports = notesRouter