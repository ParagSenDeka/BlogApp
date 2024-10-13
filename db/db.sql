CREATE TABLE IF NOT EXISTS public.users
(
    id SERIAL PRIMARY KEY,
    email VARCHAR(100) NOT NULL,
    password VARCHAR(100),
    user_id NUMERIC NOT NULL UNIQUE,  -- Change user_id to BIGINT
    CONSTRAINT users_email_key UNIQUE (email)
);

CREATE TABLE IF NOT EXISTS blogData
(
    id SERIAL PRIMARY KEY,
    title VARCHAR(20),
    description VARCHAR(300),
    author VARCHAR(20),
    user_id NUMERIC NOT NULL REFERENCES public.users(user_id),  -- Match user_id type with users table
    crDate DATE
);
