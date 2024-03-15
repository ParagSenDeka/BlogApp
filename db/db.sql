CREATE TABLE blogData(
    title VARCHAR(20),
    description VARCHAR(300),
    author VARCHAR(20),
    crDate DATE,
    id SERIAL PRIMARY KEY,
    UNIQUE(id)
);