ALTER TABLE noteful_notes
    ADD COLUMN
        date_modified TIMESTAMP DEFULT now() NOT NULL;