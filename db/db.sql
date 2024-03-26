CREATE TABLE blogData(
    title VARCHAR(20),
    description VARCHAR(300),
    author VARCHAR(20),
    crDate DATE,
    id SERIAL PRIMARY KEY,
    UNIQUE(id)
);

CREATE TABLE IF NOT EXISTS public.users
(
    id integer NOT NULL DEFAULT nextval('users_id_seq'::regclass),
    email character varying(100) COLLATE pg_catalog."default" NOT NULL,
    password character varying(100) COLLATE pg_catalog."default",
    CONSTRAINT users_pkey PRIMARY KEY (id),
    CONSTRAINT users_email_key UNIQUE (email)
)
