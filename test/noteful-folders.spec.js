const {expect} = require('chai')
const knex = require('knex')
const app = require('../src/app')
const {makeFoldersArray} = require('./folder.fixtures')
const {makeNoteArray} = require('./notes.fixtures')

describe('Noteful Endpoints', function() {
    let db 

    before('make knex instance', () => {
        db = knex({
            client: 'pg',
            connection: process.env.TEST_DB_URL,
        })
        app.set('db', db)
    })

    after('disconnect from db', () => db.destroy())

    before('clean the tables', () => db.raw('TRUNCATE noteful_folders, noteful_notes RESTART IDENTITY CASCADE'))

    afterEach('cleanup', () => db.raw('TRUNCATE noteful_folders, noteful_notes RESTART IDENTITY CASCADE'))

    describe(`Folder Endpoints`, () => {
        
        describe(`GET /api/folders`, () => {
            context(`Given no folders`, () => {
                it(`responds with 200 and an empty list`, () => {
                    return supertest(app)
                        .get('/api/folders')
                        .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                        .expect(200, [])
                })
            })

            context('Given there are folders in the database', () => {
                const testFolders = makeFoldersArray();

                beforeEach('insert folders', () => {
                    return db
                        .into('noteful_folders')
                        .insert(testFolders)
                })

                it('GET /api/folders responds with 200 and all of the folders', () => {
                    return supertest(app)
                        .get('/api/folders')
                        .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                        .expect(200, testFolders)
                })
            })
        })

        describe(`GET /api/folders/:folder_id`, () => {
            context(`Given no folders`, () => {
                it(`responds with 404`, () => {
                    const folderId = 123456
                    return supertest(app)
                        .get(`/api/folders/${folderId}`)
                        .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                        .expect(404, { error: { message: `Folder doesn't exist` } })
                })
            })

            context(`Given there are folders in the database`, () => {
                const testFolders = makeFoldersArray()

                beforeEach('insert folders', () => {
                    return db
                        .into('noteful_folders')
                        .insert(testFolders)
                })

                it(`GET /api/folders/:folder_id responds with 200 and with requested folder`, () => {
                    const folderId = 2
                    const expectedFolder = testFolders[folderId - 1]
                    return supertest(app)
                        .get(`/api/folders/${folderId}`)
                        .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                        .expect(200, expectedFolder)
                })
            })
        })

        describe(`POST /api/folders`, () => {
            it(`creates a folder, responding with 201 and the new folder`, function() {
                this.retries(3)
                const newFolder = {
                    name: 'New Folder'
                }

                return supertest(app)
                    .post('/api/folders')
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .send(newFolder)
                    .expect(201)
                    .expect(res => {
                        expect(res.body.name).to.eql(newFolder.name)
                        expect(res.body).to.have.property('id')
                        expect(res.headers.location).to.eql(`/api/folders/${res.body.id}`)
                    })
                    .then(postRes => 
                        supertest(app)
                            .get(`/api/folders/${postRes.body.id}`)
                            .expect(postRes.body)
                    )
            })
        })

        describe(`DELETE /api/folders/:folder_id`, () => {
            context(`Given no folders`, () => {
                it(`responds with 404`, () => {
                    const folderId = 123456
                    return supertest(app)
                        .delete(`/api/folders/${folderId}`)
                        .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                        .expect(404, { error: { message: `Folder doesn't exist` } })
                })
            })

            context(`Given there are folders in the database`, () => {
                it(`deletes a folder and removes the folder`, () => {
                    const testFolders = makeFoldersArray();

                    beforeEach('insert folder', () => {
                        return db
                            .into('noteful_folders')
                            .insert(testFolders)
                    })

                    it('responds with 204 and removes the folder', () => {
                        const idToRemove = 2
                        const expectedFolders = testFolders.filter(folder => folder.id !== idToRemove)
                        return supertest(app)
                            .delete(`/api/folders/${idToRemove}`)
                            .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                            .expect(204)
                            .then(res => 
                                    supertest(app)
                                        .get(`/api/folders`)
                                        .expect(expectedFolders)
                                    )
                    })
                })
            })
        })
    })

    describe(`Note Endpoints`, () => {
        
        describe(`GET /api/notes`, () => {
            context(`Given no notes`, () => {
                it(`responds with 200 and an empty list`, () => {
                    return supertest(app)
                        .get('/api/notes')
                        .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                        .expect(200, [])
                })
            })

            context('Given there are notes in the database', () => {
                const testFolders = makeFoldersArray();
                const testNotes = makeNotesArray();

                beforeEach('insert notes', () => {
                    return db
                        .into('noteful_folders')
                        .insert(testFolders)
                        .then(() => {
                            return db
                                .into('noteful_notes')
                                .insert(testNotes)
                        })
                })

                it('GET /api/notes responds with 200 and all of the notes', () => {
                    return supertest(app)
                        .get('/api/notes')
                        .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                        .expect(200, testNotes)
                })
            })
        })

        describe(`GET /api/notes/:note_id`, () => {
            context(`Given no notes`, () => {
                it(`responds with 404`, () => {
                    const noteId = 123456
                    return supertest(app)
                        .get(`/api/notes/${noteId}`)
                        .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                        .expect(404, { error: { message: `Note doesn't exist` } })
                })
            })

            context(`Given there are notes in the database`, () => {
                const testFolders = makeFoldersArray()
                const testNotes = makeNotesArray()

                beforeEach('insert notes', () => {
                    return db
                        .into('noteful_folders')
                        .insert(testFolders)
                        .then(() => {
                            return db
                                .into('noteful_notes')
                                .insert(testNotes)
                        })
                })

                it(`GET /api/notes/:note_id responds with 200 and with requested note`, () => {
                    const noteId = 2
                    const expectedNote = testNotes[noteId - 1]
                    return supertest(app)
                        .get(`/api/notes/${noteId}`)
                        .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                        .expect(200, expectedNote)
                })
            })
        })

        describe(`POST /api/notes`, () => {
            const testFolders = makeFoldersArray()

            beforeEach('insert folders', () => {
                return db
                    .into('noteful_folders')
                    .insert(testFolders)
            })

            it(`creates a note, responding with 201 and the new note`, function() {
                this.retries(3)
                const newNote = {
                    name: 'New Note',
                    content: 'I am a test note',
                    folder_id: 1
                }

                return supertest(app)
                    .post('/api/notes')
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .send(newNote)
                    .expect(201)
                    .expect(res => {
                        expect(res.body.name).to.eql(newNote.name)
                        expect(res.body.content).to.eql(newNote.content)
                        expect(res.body.folder_id).to.eql(newNote.folder_id)
                        expect(res.body).to.have.property('id')
                        expect(res.headers.location).to.eql(`/api/notes/${res.body.id}`)
                    })
                    .then(postRes => 
                        supertest(app)
                            .get(`/api/notes/${postRes.body.id}`)
                            .expect(postRes.body)
                    )
            })
        })

        describe(`DELETE /api/notes/:note_id`, () => {
            context(`Given no notes`, () => {
                it(`responds with 404`, () => {
                    const noteId = 123456
                    return supertest(app)
                        .delete(`/api/notes/${noteId}`)
                        .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                        .expect(404, { error: { message: `Note doesn't exist` } })
                })
            })

            context(`Given there are notes in the database`, () => {            
                const testFolders = makeFoldersArray();
                const testNotes = makeNotesArray();                 

                beforeEach('insert notes', () => {
                    return db
                        .into('noteful_folders')
                        .insert(testFolders)
                        .then(() => {
                            return db
                                .into('noteful_notes')
                                .insert(testNotes)
                        })
                })

                it('responds with 204 and removes the note', () => {
                    const idToRemove = 2
                    const expectedNotes = testNotes.filter(note => note.id !== idToRemove)
                    return supertest(app)
                        .delete(`/api/notes/${idToRemove}`)
                        .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                        .expect(204)
                        .then(res => 
                                supertest(app)
                                    .get(`/api/notes`)
                                    .expect(expectedNotes)
                                )
                })
            })
        })

        describe(`PATCH /api/notes/:note_id`, () => {
            context(`Given no notes`, () => {
                it(`responds with 404`, () => {
                    const noteId = 123456
                    return supertest(app)
                        .delete(`/api/notes/${noteId}`)
                        .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                        .expect(404, { error: { message: `Note doesn't exist` } })
                })
            })

            context(`Given there are notes in the database`, () => {
                const testFolders = makeFoldersArray();
                const testNotes = makeNotesArray();              

                beforeEach('insert notes', () => {
                    return db
                        .into('noteful_folders')
                        .insert(testFolders)
                        .then(() => {
                            return db
                                .into('noteful_notes')
                                .insert(testNotes)
                        })
                })

                it('responds with 204 and updates the note', () => {
                    const idToUpdate = 2
                    const newNote = {
                        name: 'New Note',
                        content: 'I am a new note',
                        folder_id: 1
                    }   
                    const expectedNote = {
                        ...testNotes[idToUpdate -1],
                        ...newNote
                    }

                    return supertest(app)
                        .patch(`/api/notes/${idToUpdate}`)
                        .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                        .send(newNote)
                        .expect(204)
                        .then(res => 
                                supertest(app)
                                    .get(`/api/notes/${idToUpdate}`)
                                    .expect(expectedNote)
                        )
                })

                it(`responds with 400 when no required fields supplied`, () => {
                    const idToUpdate = 2
                    
                    return supertest(app)
                        .patch(`/api/notes/${idToUpdate}`)
                        .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                        .send({ irrelvantField: 'foo' })
                        .expect(400, {
                            error: {
                                message: `Request body must contain either 'name', 'content', or 'folder id'`
                            }
                        })
                })

                it(`responds with 204 when updating only a subset of fields`, () => {
                    const idToUpdate = 2
                    const newNote = {
                        content: 'New Message',
                    }
                    const expectedNote = {
                        ...testNotes[idToUpdate - 1],
                        ...newNote
                    }
                    
                    return supertest(app)
                        .patch(`/api/notes/${idToUpdate}`)
                        .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                        .send({
                            ...newNote,
                            fieldToIgnore: 'should not be in GET response'
                        })
                        .expect(204)
                        .then(res => 
                            supertest(app)
                                .get(`/api/notes/${idToUpdate}`)
                                .expect(expectedNote)
                        )
                })
            })
        })
    })
})