 const { expect } = require('chai')
 const knex = require('knex')
 const app = require('../src/app')
 const { makeNotesArray } = require('./notes.fixtures')
 const { makeFoldersArray } = require('./folders.fixtures')

 describe('Note Endpoints', function() {
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

     describe(`GET /api/notes`, () => {
         context(`Given no notes`, () => {
             it(`responds with 200 and an empty list`, () => {
                 return supertest(app)
                     .get('/api/notes')
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
                     .expect(404, { error: { message: `Note doesn't exist` } })
             })
         })

         context(`Given there are notes in the database`, () => {
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
                 const expectNote = testNotes[noteId - 1]
                 return supertest(app)
                     .get(`/api/notes/${noteId}`)
                     .expect(200, expectNote)
             })
         })
     })

     describe(`POST /api/notes`, () => {
         it(`creates a note, responding with 201 and the new note`, function() {
             this.retries(3)
             const newNote = {
                 name: 'New Note'
             }

             return supertest(app)
                 .post('/api/notes')
                 .send(newNote)
                 .expect(201)
                 .expect(res => {
                     expect(res.body.name).to.eql(newNote.name)
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
                     .expect(404, { error: { message: `Note doesn't exist` } })
             })
         })

         context(`Given there are notes in the database`, () => {
             it(`deletes a note and removes the note`, () => {
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
                         .expect(204)
                         .then(res => 
                                 supertest(app)
                                     .get(`/api/notes`)
                                     .expect(expectedNotes)
                                 )
                 })
             })
         })
     })
})