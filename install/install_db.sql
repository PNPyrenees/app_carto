/*
 * Partie 1 : Script SQL à jouer sur la base de données applicative
 */

CREATE EXTENSION postgis;
CREATE EXTENSION pg_trgm;

CREATE SCHEMA app_carto;

CREATE TABLE app_carto.t_roles (
    role_id integer NOT NULL PRIMARY KEY,
    role_nom varchar(50),
    role_prenom varchar(50),
    role_email varchar(250),
    role_token varchar(500),
    role_token_expiration timestamp without time zone,
    role_date_insert timestamp without time zone,
    role_date_update timestamp without time zone
);

CREATE TABLE app_carto.t_layers (
    layer_id serial PRIMARY KEY,
    layer_schema_name varchar(50) NOT NULL,
    layer_table_name varchar(255) NOT NULL,
    layer_columns varchar[],
    layer_geom_column varchar(50),
    layer_group varchar(50),
    layer_label varchar(255) NOT NULL,
    layer_is_default boolean,
    layer_default_style jsonb,
    layer_is_warning boolean,
    layer_attribution varchar(255),
    layer_is_editable boolean,
    layer_allowed_geometry varchar[],
    layer_media_fields varchar[],
    layer_metadata_uuid uuid
);

CREATE OR REPLACE VIEW app_carto.v_layers_list_by_group AS
WITH tmp_layers AS (
	SELECT
		layer_group,
		layer_id,
		layer_label,
		COALESCE(layer_metadata_uuid::varchar, '') AS layer_metadata_uuid
	FROM
		app_carto.t_layers
	ORDER BY
		layer_group,
		layer_label
)
SELECT 
	layer_group,
	json_agg(('{"layer_id" : '|| layer_id ||', "layer_label": "'|| layer_label ||'", "layer_metadata_uuid": "' || layer_metadata_uuid || '" }')::json) AS l_layers
	/*layer_id,
	layer_label*/
FROM tmp_layers
GROUP BY layer_group
;

/* Création des table de maille */
CREATE TABLE app_carto.bib_mesh_scale (
    mesh_scale_id serial NOT NULL PRIMARY KEY,
    mesh_scale_label varchar(50),
    active boolean
);

INSERT INTO app_carto.bib_mesh_scale (
    mesh_scale_label,
    active
)
VALUES 
    ('Maille 5km', true),
    ('Maille 2km', true),
    ('Maille 1km', true),
    ('Maille 500m', true),
    ('Maille 250m', true),
    ('Maille 100m', true)
;

CREATE TABLE app_carto.bib_mesh (
    mesh_id serial NOT NULL PRIMARY KEY,
    mesh_scale_id integer NOT NULL,
    geom geometry(Polygon, 2154),

	CONSTRAINT fk_bib_mesh_id_mesh_scale FOREIGN KEY (mesh_scale_id)
			REFERENCES app_carto.bib_mesh_scale (mesh_scale_id) MATCH SIMPLE
			ON UPDATE CASCADE
			ON DELETE NO ACTION
);

/* Création de la table recevant les observations */
CREATE TABLE app_carto.t_observations (
    obs_id integer NOT NULL PRIMARY KEY,
    observateurs varchar[],
    geom geometry(Geometry,2154), /* Remplacer le code de la projection par la géométrie locale */
    obs_uuid uuid NOT NULL,
    nom_cite varchar(1000),
    cd_ref integer,
    nom_valide varchar(500),
    nom_vern varchar(1000),
    regne varchar(20),
    group2_inpn varchar(200),
    date_min timestamp without time zone NOT NULL,
    date_max timestamp without time zone NOT NULL,
    altitude_min integer,
    altitude_max integer,
    meta_last_action_date timestamp, /* optionnel - utilisé pour l'automatisation de la mise à jour des données */
    last_action character(1) /* optionnel - utilisé pour l'automatisation de la mise à jour des données */
);

CREATE VIEW app_carto.v_group_taxo_list AS 
    SELECT DISTINCT group2_inpn AS group_label
    FROM app_carto.t_observations
	WHERE group2_inpn IS NOT NULL
    ORDER BY group2_inpn
;

CREATE VIEW app_carto.v_regne_list AS 
    SELECT DISTINCT regne AS group_label
    FROM app_carto.t_observations
	WHERE regne IS NOT NULL
    ORDER BY regne
;
/* Table de correspondance entre une observation et les mailles */ 
CREATE TABLE app_carto.cor_observation_mesh (
    mesh_id integer,
    obs_id integer,

	CONSTRAINT fk_cor_observation_mesh_mesh_id FOREIGN KEY (mesh_id)
			REFERENCES app_carto.bib_mesh (mesh_id) MATCH SIMPLE
			ON UPDATE CASCADE
			ON DELETE NO ACTION,

	CONSTRAINT fk_cor_observation_mesh_obs_id FOREIGN KEY (obs_id)
			REFERENCES app_carto.t_observations (obs_id) MATCH SIMPLE
			ON UPDATE CASCADE
			ON DELETE NO ACTION
);
CREATE INDEX idx_cor_observations_mesh_id_obs ON app_carto.cor_observation_mesh(obs_id);

/* Table permettant de gérer les groupes de status */ 
/* nb : Les groupes de status s'affiche sous forme de case à cocher */
CREATE TABLE app_carto.bib_group_status (
    group_status_id serial NOT NULL PRIMARY KEY,
    group_status_label varchar(50),
    group_status_description text,
    group_status_is_warning boolean,
    active boolean
);

INSERT INTO app_carto.bib_group_status (
    groupe_status_label,
    groupe_status_description, 
    group_status_is_warning,
    active
)
VALUES 
    ('Espèce protégées', 'Protection nationale (art I / II / III) + Listes régionales + Listes départementales', true, true),--1
    ('Espèces menacées', 'Liste rouge (France et régionale) - catégorie ''CR'', ''VU'', ''EN''', true, true),--2
    ('Espèces quasi-menacées', 'Liste rouge (France et régionale) - catégorie ''NT''', false, true),--3
    ('Espèces envahissante', NULL, false, false),--4
    ('Espèces réglementaire', NULL, false, false),--5
    ('Natura 2000', NULL, false, false)--6
;

/* Table permettant de déclarer les status */ 
/* nb : Les statuts s'affiche sous forme de liste déroulante */
CREATE TABLE app_carto.bib_status_type (
    status_type_id serial NOT NULL PRIMARY KEY,
    status_type_label varchar(50),
    group_status_id integer,
    active boolean,

	CONSTRAINT fk_bib_mesh_group_status_id FOREIGN KEY (group_status_id)
			REFERENCES app_carto.bib_group_status (group_status_id) MATCH SIMPLE
			ON UPDATE CASCADE
			ON DELETE NO ACTION
);

INSERT INTO app_carto.bib_status_type (
    status_type_label,
    group_status_id,
    active
)
VALUES 
    ('Protection Nationale', 1, true), ---1
    ('Protection Régionale', 1, true), --2
    ('Protection Départementale', 1, true), --3
    
    ('Liste rouge France - NE', NULL, false), --4
    ('Liste rouge France - NA', NULL, false), --5
    ('Liste rouge France - DD', NULL, false), --6
    ('Liste rouge France - LC', NULL, true), --7
    ('Liste rouge France - NT', 3, true), --8
    ('Liste rouge France - VU', 2, true), --9
    ('Liste rouge France - EN', 2, true), --10
    ('Liste rouge France - CR/CR*', 2, true), --11
 
    ('Liste rouge Régionale - NE', NULL, false), --12
    ('Liste rouge Régionale - NA', NULL, false), --13
    ('Liste rouge Régionale - DD', NULL, false), --14
    ('Liste rouge Régionale - LC', NULL, true), --15
    ('Liste rouge Régionale - NT', 3, true), --16
    ('Liste rouge Régionale - VU', 2, true), --17
    ('Liste rouge Régionale - EN', 2, true), --18
    ('Liste rouge Régionale - CR/CR*', 2, true), --19
 
    ('Réglementaire', 5, true), --20
 
    ('N2000 - Directive oiseaux', 6, true), --21
    ('N2000 - Directive habitat', 6, true) --22
;

/* Table de correspondance entre une observation et les statuts */ 
CREATE TABLE app_carto.cor_observation_status (
    obs_id integer,
    status_type_id integer,

	CONSTRAINT fk_cor_observation_status_status_type_id FOREIGN KEY (status_type_id)
			REFERENCES app_carto.bib_status_type (status_type_id) MATCH SIMPLE
			ON UPDATE CASCADE
			ON DELETE NO ACTION,

	CONSTRAINT fk_cor_observation_status_obs_id FOREIGN KEY (obs_id)
			REFERENCES app_carto.t_observations (obs_id) MATCH SIMPLE
			ON UPDATE CASCADE
			ON DELETE NO ACTION
);
CREATE INDEX idx_cor_observations_status_id_obs ON app_carto.cor_observation_status(obs_id);

/* Création de la table commune */
CREATE TABLE app_carto.bib_commune (
    insee_com varchar(5) NOT NULL PRIMARY KEY,
    nom_com varchar(200)
);

/* Table de correspondance entre une observation et les communes */ 
CREATE TABLE app_carto.cor_observation_commune (
    obs_id integer,
    insee_com varchar(5),

	CONSTRAINT fk_cor_observation_commune_insee_com FOREIGN KEY (insee_com)
			REFERENCES app_carto.bib_commune (insee_com) MATCH SIMPLE
			ON UPDATE CASCADE
			ON DELETE NO ACTION,

	CONSTRAINT fk_cor_observation_commune FOREIGN KEY (obs_id)
			REFERENCES app_carto.t_observations (obs_id) MATCH SIMPLE
			ON UPDATE CASCADE
			ON DELETE NO ACTION
);
CREATE INDEX idx_cor_observations_commune_id_obs ON app_carto.cor_observation_commune(obs_id);

/* Création de la table référentiel toponyme */
CREATE TABLE IF NOT EXISTS app_carto.bib_toponyme (
    toponyme_id serial NOT NULL PRIMARY KEY,
    toponyme_nom varchar(255) NOT NULL,
    toponyme_type varchar(50),
    toponyme_precision_geo varchar(255),
    geom geometry(Geometry,2154)
);

/* Création de la table d'import de couche */
CREATE TABLE IF NOT EXISTS app_carto.t_imported_layer (
    imported_layer_id serial NOT NULL PRIMARY KEY,
    role_id integer,
    imported_layer_name varchar(255),
    imported_layer_geojson jsonb,
    imported_layer_import_date timestamp without time zone,
    imported_layer_last_view timestamp without time zone,

    CONSTRAINT fk_t_imported_layer_role_id FOREIGN KEY (role_id)
        REFERENCES app_carto.t_roles (role_id) MATCH SIMPLE
        ON UPDATE CASCADE
        ON DELETE NO ACTION
);

/* Création de la table de logs */ 
CREATE TABLE IF NOT EXISTS app_carto.t_logs(
    log_id serial PRIMARY KEY,
    log_date timestamp without time zone DEFAULT now(),
    log_type character varying(32) COLLATE pg_catalog."default",
    role_id integer,
    log_data jsonb,

    CONSTRAINT fk_t_logs_role_id FOREIGN KEY (role_id)
        REFERENCES app_carto.t_roles (role_id) MATCH SIMPLE
        ON UPDATE CASCADE
        ON DELETE NO ACTION
);

/* Création de la table projet */
create table app_carto.t_projects (
	project_id serial,
	role_id integer NOT NULL,
	project_name varchar(255) NOT NULL,
	project_content jsonb NOT NULL,
    project_creation_date timestamp without time zone default now(),
	project_update_date timestamp without time zone default now(),

	CONSTRAINT t_project_pkey PRIMARY KEY (project_id),
    CONSTRAINT fk_t_project_role_id FOREIGN KEY (role_id)
        REFERENCES app_carto.t_roles (role_id) MATCH SIMPLE
        ON UPDATE CASCADE
        ON DELETE NO ACTION
);

/* Création de la table de référence des droits */
CREATE TABLE app_carto.bib_authorization (
	authorization_id serial,
	authorization_code varchar(32),
	authorization_label varchar(255),
	authorization_description text,

	CONSTRAINT bib_authorization_pkey PRIMARY KEY (authorization_id)
);

INSERT INTO app_carto.bib_authorization (authorization_code, authorization_label, authorization_description)
VALUES
	('GET_REF_LAYER', 'Consulter des couches de références', 'Autorise l''utilisateur à consulter des couches de référence. Il est possible de restreindre la liste de couches consultables au niveau de l''attribution du droit à un groupe.'),
	('GET_OBS_DATA', 'Consulter les données d''observation', 'Autorise l''utilisateur à interroger les données d''observation. Il est possible de restreindre la restitution qu''à certaines echelles de restitution (maille) au niveau de l''attribution du droit à un groupe'),
	('DRAW', 'Créer des couches de dessin', 'Autorise l''utilisateur à créer des couches de dessin temporaire'),
	('IMPORT', 'Importer des donner', 'Autorise l''utilisateur à importer des données SIG'),
	('EXPORT', 'Exporter des données', 'Autorise l''utilisateur à exporter des données. Si cette autorisation n''est pas attribuée à l''utilisateur, ce dernier sera tout de même en mesure d''exporter ses données importées ou les couches de dessins qu''il aura créé.'),
	('WARNING_CALCULATOR', 'Utiliser la calculette des enjeux', 'Autorise l''utilisateur à exploiter la calulette des enjeux. La calculette des enjeux retournera toutes les couches sur lesquelles elle se base (couche de référence et d''observation) même si l''utilisateur n''est pas autoriser à consulter ce type de données.'),
	('EXPORT_PDF', 'Exporter des cartes au format PDF', 'Autorise l''utilisateur à faire des exports en PDF.'),
	('EDIT_REF_LAYER', 'Modifier des couches de données', 'Autorise l''utilisateur à apporter des modifications aux couches de données éditables. Il est possible de restreindre l''édition qu''à certaines couches spécifiques au niveau de l''attribution du droit à un groupe.')
;

/* Création de la table de définition des groupes */
CREATE TABLE app_carto.t_group (
	group_id serial,
	group_name varchar(255),
	group_description text,

	CONSTRAINT t_group_pkey PRIMARY KEY (group_id)
);

INSERT INTO app_carto.t_group (group_name, group_description)
VALUES
	('default', 'Groupe par défaut ayant tous les droits')
;

/* Table de relation entre un groupe d'utilisateur et une authorization */
CREATE TABLE app_carto.cor_group_authorization (
	group_id integer,
	authorization_id integer,
	group_authorization_constraint int[],

	CONSTRAINT cor_group_authorization_pkey PRIMARY KEY (group_id, authorization_id),
    CONSTRAINT fk_cor_group_authorization_group_id FOREIGN KEY (group_id)
        REFERENCES app_carto.t_group (group_id) MATCH SIMPLE
        ON UPDATE CASCADE
        ON DELETE NO ACTION,
    CONSTRAINT fk_cor_group_authorization_authorization_id FOREIGN KEY (authorization_id)
        REFERENCES app_carto.bib_authorization (authorization_id) MATCH SIMPLE
        ON UPDATE CASCADE
        ON DELETE NO ACTION
);

/* Attribution de tous les droits au groupe par défaut */
INSERT INTO app_carto.cor_group_authorization (group_id, authorization_id)
VALUES
	(1, 1),
	(1, 2),
	(1, 3),
	(1, 4),
	(1, 5),
	(1, 6),
	(1, 7),
	(1, 8)
;

/* Table de relation entre un utilisateur et un groupe */
CREATE TABLE app_carto.cor_role_group (
	role_id integer,
	group_id integer,

	CONSTRAINT cor_role_group_pkey PRIMARY KEY (role_id, group_id),
    CONSTRAINT fk_cor_role_group_role_id FOREIGN KEY (role_id)
        REFERENCES app_carto.t_roles (role_id) MATCH SIMPLE
        ON UPDATE CASCADE
        ON DELETE NO ACTION,
    CONSTRAINT fk_cor_role_group_group_id FOREIGN KEY (group_id)
        REFERENCES app_carto.t_group (group_id) MATCH SIMPLE
        ON UPDATE CASCADE
        ON DELETE NO ACTION
);

/*
 * Partie 2 : Script à jouer sur la base de données SIG
 */
/* Création d'une fonction permettant de jouer une requete sql écrite en text */
create or replace function eval( sql  text ) returns text as $$
declare
    as_txt  text;
begin
    if  sql is null  then  return null ;  end if ;
    execute  sql  into  as_txt ;
    return  as_txt ;
end;
$$ language plpgsql

/* Fonction permettant de retirer une clés d'un json */
CREATE OR REPLACE FUNCTION public.json_object_delete_keys("json" json, VARIADIC "keys_to_delete" TEXT[])
  RETURNS json
  LANGUAGE sql
  IMMUTABLE
  STRICT
AS $function$
SELECT COALESCE(
  (SELECT ('{' || string_agg(to_json("key") || ':' || "value", ',') || '}')
   FROM json_each("json")
   WHERE "key" <> ALL ("keys_to_delete")),
  '{}'
)::json
$function$;