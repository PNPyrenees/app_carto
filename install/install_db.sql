CREATE SCHEMA app_carto;

CREATE TABLE app_carto.t_roles (
    role_id integer NOT NULL PRIMARY KEY,
    role_nom varchar(50),
    role_prenom varchar(50),
    role_email varchar(250),
    role_token varchar(500),
    role_token_expiration datetime without time zone,
    role_date_insert timestamp without time zone,
    role_date_update timestamp without time zone
);