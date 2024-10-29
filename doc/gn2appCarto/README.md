# gn2appCarto 

Cette section à pour but de présenter une méthode pour synchroniser les données d'observation de façon incrémentale d'un GeoNature (équipé du module export) vers la table t_observations de AppCarto.

# Configuration de l'export GeoNature

Déclaration de la vue
```sql
CREATE OR REPLACE VIEW gn_exports.v_synthese_for_appcarto
 AS
 SELECT s.id_synthese,
    st_astext(s.the_geom_local) AS wkt,
    s.unique_id_sinp,
    s.date_min,
    s.date_max,
    s.altitude_min,
    s.altitude_max,
    array_agg(DISTINCT com.area_code) FILTER (WHERE com.area_code IS NOT NULL) AS insee_coms,
    t.cd_ref,
    s.nom_cite,
    t.nom_valide,
    t.nom_vern,
    t.regne,
    t.group2_inpn,
    COALESCE(string_agg(DISTINCT (r.prenom_role::text || ' '::text) || r.nom_role::text, ', '::text), s.observers::text) AS observateurs,
    ss.protection,
    ss.reglementaire AS reglement,
    ss.lr_monde,
    ss.lr_europe AS lr_eur,
    ss.lr_nationale AS lr_nat,
    ss.lr_regionale AS lr_reg,
    ss.n2000,
    s.meta_update_date AS meta_last_action_date,
    COALESCE(s.last_action, 'U'::bpchar) AS last_action
   FROM gn_synthese.synthese s
     LEFT JOIN gn_synthese.cor_area_synthese cas USING (id_synthese)
     LEFT JOIN ref_geo.l_areas dept ON cas.id_area = dept.id_area AND dept.id_type = 26
     LEFT JOIN ref_geo.l_areas com ON cas.id_area = com.id_area AND com.id_type = 25
     LEFT JOIN taxonomie.taxref t USING (cd_nom)
     LEFT JOIN gn_synthese.cor_observer_synthese cos USING (id_synthese)
     LEFT JOIN utilisateurs.t_roles r USING (id_role)
     LEFT JOIN utilisateurs.bib_organismes org USING (id_organisme)
     LEFT JOIN ref_nomenclatures.t_nomenclatures ls ON s.id_nomenclature_life_stage = ls.id_nomenclature
     LEFT JOIN ref_nomenclatures.t_nomenclatures sex ON s.id_nomenclature_sex = sex.id_nomenclature
     LEFT JOIN gn_meta.t_datasets jdd USING (id_dataset)
     LEFT JOIN ref_nomenclatures.t_nomenclatures pres ON s.id_nomenclature_observation_status = pres.id_nomenclature
     LEFT JOIN ref_nomenclatures.t_nomenclatures valid ON s.id_nomenclature_valid_status = valid.id_nomenclature
     LEFT JOIN ref_nomenclatures.t_nomenclatures sens ON s.id_nomenclature_sensitivity = sens.id_nomenclature
     LEFT JOIN ref_nomenclatures.t_nomenclatures oc ON s.id_nomenclature_obj_count = oc.id_nomenclature
     LEFT JOIN ref_nomenclatures.t_nomenclatures tc ON s.id_nomenclature_type_count = tc.id_nomenclature
     LEFT JOIN gn_synthese.v_synthese_statut ss ON s.id_synthese = ss.id_synthese
  WHERE (COALESCE(pres.cd_nomenclature, 'NSP'::character varying)::text = ANY (ARRAY['NSP'::character varying::text, 'Pr'::character varying::text])) AND (COALESCE(valid.cd_nomenclature, '0'::character varying)::text = ANY (ARRAY['0'::character varying::text, '1'::character varying::text, '2'::character varying::text]))
  GROUP BY s.id_synthese, s.the_geom_local, s.unique_id_sinp, s.date_min, s.date_max, t.cd_ref, s.nom_cite, t.nom_valide, t.nom_vern, t.regne, t.group2_inpn, s.observers, ss.protection, ss.reglementaire, ss.lr_monde, ss.lr_europe, ss.lr_nationale, ss.lr_regionale, ss.n2000
UNION
 SELECT t_log_synthese.id_synthese,
    NULL::text AS wkt,
    NULL::uuid AS unique_id_sinp,
    NULL::timestamp without time zone AS date_min,
    NULL::timestamp without time zone AS date_max,
    NULL::integer AS altitude_min,
    NULL::integer AS altitude_max,
    NULL::character varying[] AS insee_coms,
    NULL::integer AS cd_ref,
    NULL::character varying AS nom_cite,
    NULL::character varying AS nom_valide,
    NULL::character varying AS nom_vern,
    NULL::character varying AS regne,
    NULL::character varying AS group2_inpn,
    NULL::text AS observateurs,
    NULL::text AS protection,
    NULL::text AS reglement,
    NULL::text AS lr_monde,
    NULL::text AS lr_eur,
    NULL::text AS lr_nat,
    NULL::text AS lr_reg,
    NULL::text AS n2000,
    t_log_synthese.meta_last_action_date,
    t_log_synthese.last_action
   FROM gn_synthese.t_log_synthese
  WHERE t_log_synthese.last_action = 'D'::bpchar
UNION
 SELECT s.id_synthese,
    NULL::text AS wkt,
    NULL::uuid AS unique_id_sinp,
    NULL::timestamp without time zone AS date_min,
    NULL::timestamp without time zone AS date_max,
    NULL::integer AS altitude_min,
    NULL::integer AS altitude_max,
    NULL::character varying[] AS insee_coms,
    NULL::integer AS cd_ref,
    NULL::character varying AS nom_cite,
    NULL::character varying AS nom_valide,
    NULL::character varying AS nom_vern,
    NULL::character varying AS regne,
    NULL::character varying AS group2_inpn,
    NULL::text AS observateurs,
    NULL::text AS protection,
    NULL::text AS reglement,
    NULL::text AS lr_monde,
    NULL::text AS lr_eur,
    NULL::text AS lr_nat,
    NULL::text AS lr_reg,
    NULL::text AS n2000,
    s.meta_update_date AS meta_last_action_date,
    'D'::character(1) AS last_action
   FROM gn_synthese.synthese s
     LEFT JOIN ref_nomenclatures.t_nomenclatures pres ON s.id_nomenclature_observation_status = pres.id_nomenclature
     LEFT JOIN ref_nomenclatures.t_nomenclatures valid ON s.id_nomenclature_valid_status = valid.id_nomenclature
  WHERE NOT (COALESCE(pres.cd_nomenclature, 'NSP'::character varying)::text = ANY (ARRAY['NSP'::character varying::text, 'Pr'::character varying::text])) OR NOT (COALESCE(valid.cd_nomenclature, '0'::character varying)::text = ANY (ARRAY['0'::character varying::text, '1'::character varying::text, '2'::character varying::text]));
;
```

Créez un nouvel export depuis l'interface d'administration du module dans GeoNature.
Renseignez les champs de la façon suivante (ceux non spécifiés ici peuvent être renseignés librement)

Nom de l'export : Export pour AppCarto
Nom du schema PostgreSQL : gn_exports
Nom de la vue SQL : v_synthese_for_appcarto

Récupérez l'identifiant et le token associé à l'export en vous rendant dans le module exports et en cliquant sur le bouton "Token" au niveau de l'export créé (la valeur du token est automatiquement copiée).


# Installation de gn2pg (sql)

Installer gn2pg dans la base de données de appCarto et suivant les indications présentées [ici](https://github.com/PnX-SI/Ressources-techniques/tree/master/GeoNature/gn2pg) 

# Script SQL de synchronisation

Modifier le fichier update_observation_data.sql pour remplacer les paramètres <GEONATURE_URL>, <EXPORT_ID> et <TOKEN> (ligne 22, 23 et 24)
Dans la base de données de AppCarto, créez la fonction de synchronisation en exécutant le script SQL du fichier update_observation_data.sql

# Planification
Sur votre serveur linux, créez un dossier que vous nommerez "gn2appcarto" dans lequel vous allez créer les 2 fichiers suivants:

- gn2appCarto.sql :
```sql
SELECT app_carto.update_observation_data();
```

- gn2appCarto.sh (en adaptant les paramètres identifiés par "<XXX>"):
```sh
/usr/bin/psql postgresql://<USER_PG>:<PASS_PG>@<HOST_PG>:<PORT_PG>/app_carto -f <ABSOLUTE_PATH_TO>/gn2appCarto/gn2appCarto.sql > <ABSOLUTE_PATH_TO>/gn2appCarto/gn2appCarto.log 2>&1 && cat <ABSOLUTE_PATH_TO>/gn2appCarto/gn2appCarto.log 
```

Si vous avez un Postfix de configuré sur le serveur, vous pouvez adapter le fichier gn2appCarto.sh pour qu'il vous envoie un mail à la fin de l'exécution :

```sh
/usr/bin/psql postgresql://<USER_PG>:<PASS_PG>@<HOST_PG>:<PORT_PG>/app_carto -f <ABSOLUTE_PATH_TO>/gn2appCarto/gn2appCarto.sql > <ABSOLUTE_PATH_TO>/gn2appCarto/gn2appCarto.log 2>&1 && cat <ABSOLUTE_PATH_TO>/gn2appCarto/gn2appCarto.log  | mail -s "[Gn2AppCarto] - Log de synchronisation" <DESTINATAIRE_EMAIL>
```

Il ne reste plus qu'à configurer crontab pour exéctuter régulièrement la fonction de synchronisation
Par exemple pour une synchro quotidienne à minuit : 
```sh
00 00 * * * <ABSOLUTE_PATH_TO>/gn2appCarto/gn2appCarto.sh
```
