CREATE OR REPLACE FUNCTION app_carto.update_observation_data(
	)
    RETURNS void
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
AS $BODY$
	declare now timestamp without time zone;
	gn2pg_log record;
	counter integer;
BEGIN 	

SELECT now() INTO now;
RAISE NOTICE '% : Lancement de la synchronisation des observations de "AppCarto"', now;

/*
 * Télécharement des données depuis un GN_Export
 */
-- 4 -> identifiant de l'export dans GeoNaure
RAISE NOTICE 'Téléchargement des données avec gn2pg';
PERFORM gn2pg.gn2pg(
	'<GEONATURE_URL>', 
	<EXPORT_ID>, 
	'<TOKEN>',
	'gn2pg', 
	'tmp_gn_synthese_for_appcarto',
	'filter_d_up_meta_last_action_date=' || max(meta_last_action_date) + interval '1 second'
)
FROM app_carto.t_observations
;

RAISE NOTICE 'Fin du téléchargement des données';

/* Récupération du dernier log de téléchargement des données de gn2pg */
SELECT * INTO gn2pg_log FROM gn2pg.log order by date desc LIMIT 1;

RAISE NOTICE '% : [%] - %', gn2pg_log.date, gn2pg_log.statut, gn2pg_log.message;

IF TRUE IN (SELECT EXISTS (	SELECT 1 FROM information_schema.tables WHERE table_schema = 'gn2pg' AND table_name = 'tmp_gn_synthese_for_appcarto') AS table_existence) THEN

	-- Dénombrement des nouvelles observations
	SELECT count(*) INTO counter FROM gn2pg.tmp_gn_synthese_for_appcarto WHERE last_action = 'I';
	IF counter = 0 THEN
		RAISE NOTICE 'Aucune nouvelle observation va être ajoutée';
	ELSEIF counter = 1 THEN
		RAISE NOTICE '1 observation va être ajoutée';
	ELSE 
		RAISE NOTICE '% observations vont être ajoutées', counter;
	END IF;
	
	-- Dénombrement des observations faisant l'objet d'une modification
	SELECT count(*) INTO counter FROM gn2pg.tmp_gn_synthese_for_appcarto WHERE last_action = 'U';
	IF counter = 0 THEN
		RAISE NOTICE 'Aucune observation va être actualisée';
	ELSEIF counter = 1 THEN
		RAISE NOTICE '1 observation va être actualisée';
	ELSE 
		RAISE NOTICE '% observations vont être actualisées', counter;
	END IF;
	
	-- Dénombrement des observations ayant été supprimé
	SELECT count(*) INTO counter FROM gn2pg.tmp_gn_synthese_for_appcarto WHERE last_action = 'D';
	IF counter = 0 THEN
		RAISE NOTICE 'Aucune observation va être supprimée';
	ELSEIF counter = 1 THEN
		RAISE NOTICE '1 observation va être supprimée';
	ELSE 
		RAISE NOTICE '% observations vont être supprimées', counter;
	END IF;
	
	/* 
	 * Suppression des observations supprimées de la synthèse de GeoNature ou modifiées (annule et remplace)
	 */
	DELETE FROM app_carto.cor_observation_mesh
	WHERE obs_id in (
		SELECT id_synthese::integer 
		FROM gn2pg.tmp_gn_synthese_for_appcarto 
	--	WHERE last_action IN ('D', 'U')
	)
	;
	
	DELETE FROM app_carto.cor_observation_commune
	WHERE obs_id in (
		SELECT id_synthese::integer 
		FROM gn2pg.tmp_gn_synthese_for_appcarto 
	--	WHERE last_action IN ('D', 'U')
	)
	;
	
	DELETE FROM app_carto.cor_observation_status
	WHERE obs_id in (
		SELECT id_synthese::integer 
		FROM gn2pg.tmp_gn_synthese_for_appcarto 
	--	WHERE last_action IN ('D', 'U')
	)
	;
	
	DELETE FROM app_carto.t_observations
	WHERE obs_id in (
		SELECT id_synthese::integer 
		FROM gn2pg.tmp_gn_synthese_for_appcarto 
	--	WHERE last_action IN ('D', 'U')
	)
	;
	
	/* 
	 * Insertion des observations 
	 */
	INSERT INTO app_carto.t_observations(
		obs_id,
		obs_uuid,
		date_min,
		date_max,
		altitude_min,
		altitude_max,
		observateurs,
		cd_ref,
		nom_valide,
		nom_vern,
		regne,
		group2_inpn,
		geom,
		meta_last_action_date,
		last_action
	)
	SELECT
		id_synthese::integer 			AS obs_id,
		unique_id_sinp::uuid 			AS obs_uuid,
	 	date_min::timestamp 			AS date_min,
		date_max::timestamp 			AS date_max,
		altitude_min::integer 			AS altitude_min,
		altitude_max::integer 			AS altitude_max,
		('{' || observateurs ||'}')::varchar[] 	AS observateurs,
		cd_ref::integer 			AS cd_ref,
		nom_valide::varchar			AS nom_valide,
		nom_vern::varchar			AS nom_vern,
		regne::varchar				AS regne,
		group2_inpn::varchar			AS group2_inpn,
		st_GeomFromText(wkt, 2154) 		AS geom,
		meta_last_action_date::timestamp 	AS meta_last_action_date,
		last_action::character(1) 		AS last_action
	FROM
		gn2pg.tmp_gn_synthese_for_appcarto
	WHERE 
		(last_action IN ('I', 'U') OR last_action IS NULL)
	;

	/* 
	 * Insertion dans cor_observation_commune 
	 */
	INSERT INTO app_carto.cor_observation_commune(
		obs_id,
		insee_com
	)
	WITH 
		tmp_cor AS (
			SELECT 
				id_synthese::integer AS obs_id, 
				UNNEST(ARRAY (SELECT jsonb_array_elements_text(insee_coms::jsonb))) as insee_com 
			FROM 
				gn2pg.tmp_gn_synthese_for_appcarto
		)
	SELECT 
		s.id_synthese::integer AS obs_id,
		t.insee_com
	FROM
		gn2pg.tmp_gn_synthese_for_appcarto s
		LEFT JOIN tmp_cor t ON s.id_synthese::integer = t.obs_id
	WHERE 
		(last_action IN ('I', 'U') OR last_action IS NULL)
		AND t.insee_com IN (SELECT insee_com FROM app_carto.bib_commune)
	;
	
	/* 
	 *Insertion dans cor_observation_status
	 */
	INSERT INTO app_carto.cor_observation_status (
		obs_id, 
		status_type_id
	)
	/* Statut de protection */
	WITH
		tmp_lr_nat AS (
			SELECT
				id_synthese::integer AS obs_id,
				UNNEST(string_to_array(lr_nat, ' ; ')) as lr_nat
			FROM
				gn2pg.tmp_gn_synthese_for_appcarto
			WHERE
				(last_action IN ('I', 'U') OR last_action IS NULL)
				AND lr_nat IS NOT NULL
		),
		tmp_lr_reg AS (
			SELECT
				id_synthese::integer AS obs_id,
				UNNEST(string_to_array(lr_reg, ' ; ')) as lr_reg
			FROM
				gn2pg.tmp_gn_synthese_for_appcarto
			WHERE
				(last_action IN ('I', 'U') OR last_action IS NULL)
				AND lr_reg IS NOT NULL
		)
	SELECT DISTINCT
		id_synthese::integer AS obs_id, 
		CASE 
			WHEN protection = 'Nationale' THEN 1
			WHEN protection = 'Régionale' THEN 2
			WHEN protection = 'Départementale' THEN 3
		END AS status_type_id
	FROM
		gn2pg.tmp_gn_synthese_for_appcarto
	WHERE 
		(last_action IN ('I', 'U') OR last_action IS NULL)
		AND protection IN ('Nationale', 'Régionale', 'Départementale')
	UNION
	/* Liste rouge nationale */
	SELECT DISTINCT
		obs_id,
		CASE 
			WHEN lr_nat = 'NE' THEN 4
			WHEN lr_nat = 'NA' THEN 5
			WHEN lr_nat = 'DD' THEN 6
			WHEN lr_nat = 'LC' THEN 7
			WHEN lr_nat = 'NT' THEN 8
			WHEN lr_nat = 'VU' THEN 9
			WHEN lr_nat = 'EN' THEN 10
			WHEN lr_nat = 'CR' THEN 11
			WHEN lr_nat = 'CR*' THEN 11
		END AS status_type_id
	FROM tmp_lr_nat
	UNION
	/* Liste rouge régionale */
	SELECT DISTINCT
		obs_id,
		CASE 
			WHEN lr_reg = 'NE' THEN 12
			WHEN lr_reg = 'NA' THEN 13
			WHEN lr_reg = 'DD' THEN 14
			WHEN lr_reg = 'LC' THEN 15
			WHEN lr_reg = 'NT' THEN 16
			WHEN lr_reg = 'VU' THEN 17
			WHEN lr_reg = 'EN' THEN 18
			WHEN lr_reg = 'CR' THEN 19
			WHEN lr_reg = 'CR*' THEN 19
		END AS status_type_id
	FROM tmp_lr_reg
	UNION
	/* Reglementaire */
	SELECT DISTINCT
		id_synthese::integer AS obs_id,
		20
	FROM
		gn2pg.tmp_gn_synthese_for_appcarto
	WHERE
		(last_action IN ('I', 'U') OR last_action IS NULL)
		AND reglement IS NOT NULL
	UNION
	/* N2000 - Oiseaux */
	SELECT DISTINCT
		id_synthese::integer AS obs_id,
		21
	FROM
		gn2pg.tmp_gn_synthese_for_appcarto
	WHERE
		(last_action IN ('I', 'U') OR last_action IS NULL)
		AND n2000 = 'Directive oiseaux' 
	UNION
	/* N2000 - Habitat */
	SELECT DISTINCT
		id_synthese::integer AS obs_id,
		22
	FROM
		gn2pg.tmp_gn_synthese_for_appcarto
	WHERE
		(last_action IN ('I', 'U') OR last_action IS NULL)
		AND n2000 = 'Directive habitat' 
	;
	
	/*
	 * Relation observation-mailles
	 */
	INSERT INTO app_carto.cor_observation_mesh (
		obs_id,
		mesh_id
	)
	SELECT DISTINCT
		s.id_synthese::integer AS  obs_id, 
		m.mesh_id
	FROM
		gn2pg.tmp_gn_synthese_for_appcarto s
		LEFT JOIN app_carto.bib_mesh m ON st_intersects(st_GeomFromText(s.wkt, 2154), m.geom)
	WHERE
		(s.last_action IN ('I', 'U') OR s.last_action IS NULL)
	;
	
	/*
	 * Suppression de la table temporaire
	 */
	DROP TABLE gn2pg.tmp_gn_synthese_for_appcarto;
	
ELSE
	RAISE NOTICE 'Aucune donnée ajoutée, modifiée ou supprimée';
END IF;

SELECT now() INTO now;
RAISE NOTICE '% : Fin de la synchronisation des observations de "AppCarto"', now;
END;
$BODY$;