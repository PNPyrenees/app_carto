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

CREATE TABLE app_carto.t_layers (
    layer_id serial PRIMARY KEY,
    layer_schema_name varchar(50) NOT NULL,
    layer_table_name varchar(50) NOT NULL,
    layer_group varchar(50),
    layer_label varchar(50) NOT NULL,
    layer_is_default boolean,
    layer_default_style jsonb,
    layer_is_challenge boolean
);

CREATE VIEW app_carto.v_layers_list_by_group AS
WITH tmp_layers AS (
	SELECT
		layer_group,
		layer_id,
		layer_label
	FROM
		app_carto.t_layers
	ORDER BY
		layer_group,
		layer_label
)
SELECT 
	layer_group,
	json_agg(('{"layer_id" : '|| layer_id ||', "layer_label": "'|| layer_label ||'"}')::json) AS l_layers
	/*layer_id,
	layer_label*/
FROM tmp_layers
GROUP BY layer_group
;