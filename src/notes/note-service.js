const noteService = {
    getAllNotes(knex) {
        return knex
            .select('*')
            .from('noteful_notes')
    },
    getNoteById(knex, id) {
        return knex
            .from('noteful_notes')
            .select('*')
            .where('id', id)
            .first() 
    },
    insertNote(knex, newNote) {
        return knex 
            .insert(newNote)
            .into('noteful_notes')
            .returning('*')
            .then(rows => {
                return rows[0]
            })
    },
    deleteNote(knex,id) {
        return knex
            .from('noteful_notes')
            .where({id})
            .delete() 
    },
    updateNote(knex, id, newNote) {
        return knex
            .from('noteful_notes')
            .where({id})
            .update(newNote)
    }
}

module.exports = noteService