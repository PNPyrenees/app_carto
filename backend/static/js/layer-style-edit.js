/**
 * Fonction initialisant le formulaire d'édition du style d'une couche
 */
initStyleForm = function(layer_uid) {

    // On masque tous les objets permettant l'édition du style
    styleFormHideAll()

    // Récupération du layer_uid sur lequel éditer le style
    document.getElementById("style-layer-modal").querySelector("input[name='layer-uid']").value = layer_uid

    // Récupération de la couche dont l'utilisateur veut changer le style
    var layer
    map.getLayers().forEach(tmp_layer => {
        if (ol.util.getUid(tmp_layer) == layer_uid){
            layer = tmp_layer
        }
    })

    // Récupération du style de la couche au format json
    json_style = layer.get("json_style")

    // Le style de la couche est-il un style simpe ?
    if (styleIsSimple(json_style)){
        buildFormForSimpleStyle(json_style)
        document.getElementById("type_style_select").value = 'simple'
    } else {
        buildFormForConditionnalStyle(json_style)
        document.getElementById("type_style_select").value = 'conditional'
    }

    // Construction du formulaire pour les étiquettes
    buildFormLabel(layer)    
}

/**
 * Fonction masquant tous les formulaires d'édition du style
 */
var styleFormHideAll = function(){
    // Initilisation de la fenetre modal

    //Initialisation de l'affichage pour les élément associé à un style simple
    document.getElementById("simple_style_form_geom_tab").querySelectorAll("a").forEach(tab => {
        tab.setAttribute("aria-selected", "false")
        tab.setAttribute("aria-disabled", "true")
        tab.classList.add("disabled")
        tab.classList.remove("active")
    })

    document.getElementById("simple_style_form_point").classList.remove("show")
    document.getElementById("simple_style_form_point").classList.remove("active")

    document.getElementById("simple_style_form_line").classList.remove("show")
    document.getElementById("simple_style_form_line").classList.remove("active")

    document.getElementById("simple_style_form_polygon").classList.remove("show")
    document.getElementById("simple_style_form_polygon").classList.remove("active")

    document.getElementById("simple_style_form").classList.add("hide")


    //Initialisation de l'affichage pour les élément associé à un style conditionnel
    document.getElementById("conditional_style_form_geom_tab").querySelectorAll("a").forEach(tab => {
        tab.setAttribute("aria-selected", "false")
        tab.setAttribute("aria-disabled", "true")
        tab.classList.add("disabled")
        tab.classList.remove("active")
    })

    document.getElementById("conditional_style_form_point").classList.remove("show")
    document.getElementById("conditional_style_form_point").classList.remove("active")
    document.getElementById("conditional_style_form_point").innerHTML = ''

    document.getElementById("conditional_style_form_line").classList.remove("show")
    document.getElementById("conditional_style_form_line").classList.remove("active")
    document.getElementById("conditional_style_form_line").innerHTML = ''

    document.getElementById("conditional_style_form_polygon").classList.remove("show")
    document.getElementById("conditional_style_form_polygon").classList.remove("active")
    document.getElementById("conditional_style_form_polygon").innerHTML = ''

    document.getElementById("conditional_style_form").classList.add("hide")

    // On masque les blocs associé au générateur de style conditionnel
    document.getElementById("conditional_style_selector_bloc").classList.add("hide")
    document.getElementById("categorised_style_editor_bloc").classList.add("hide")
    document.getElementById("graduated_style_editor_bloc").classList.add("hide")  

    document.querySelectorAll(".conditional-style-generator-btn").forEach(element => {
        element.style.opacity = 1
    })

    // On masque le fenêtre d'edition d'expression
    document.getElementById("expression_editor_bloc").classList.add("hide")
    
}

/**
 * Fonction permettrant de déterminer si le style d'une couche est simple ou conditionnel
 */
var styleIsSimple = function(json_style){

    var isSimple = true

    json_style.forEach( currentStyle => {
        if (currentStyle.styles.length != 1){
            isSimple = false
        }

        currentStyle.styles.forEach( styleParam => {
            if (styleParam.expression != null){
                isSimple = false
            }
        })
    })

    return(isSimple)
}

/**
 * Gestion du changement de type de style (simple/conditionnel) en fonction du "select"
 */
document.getElementById("type_style_select").addEventListener("change", event => {
    switch (event.target.value){
        case 'simple':
            document.getElementById("conditional_style_form").classList.add("hide")
            document.getElementById("simple_style_form").classList.remove("hide")
            document.getElementById("conditional_style_selector_bloc").classList.add("hide")
            document.getElementById("categorised_style_editor_bloc").classList.add("hide")
            document.getElementById("graduated_style_editor_bloc").classList.add("hide") 
            document.getElementById("conditional_style_selector_bloc").querySelectorAll(".conditional-style-generator-btn").forEach( element => {
                element.style.opacity = 1
            })

            break
        case 'conditional':
            document.getElementById("conditional_style_form").classList.remove("hide")
            document.getElementById("simple_style_form").classList.add("hide")
            document.getElementById("conditional_style_selector_bloc").classList.remove("hide")
            break
    }
})

/**
 * Peuple le formulaire d'édition d'un style simple
 */
var buildFormForSimpleStyle = function(json_style){
    document.getElementById("conditional_style_form").classList.add("hide")

    document.getElementById("simple_style_form").classList.remove("hide")

    json_style.forEach( (style, loopIndex) => {
        
        //Récupération du type de style (point, ligne, polygon...)
        styleType = style.style_type
        styleTypeLowerCase = styleType.toLowerCase()

        if (loopIndex == 0){
            document.getElementById("simple-style-tab-" + styleTypeLowerCase).setAttribute("aria-selected", "true")
            document.getElementById("simple-style-tab-" + styleTypeLowerCase).classList.add("active")
            document.getElementById("simple_style_form_" + styleTypeLowerCase).classList.add("active")
            document.getElementById("simple_style_form_" + styleTypeLowerCase).classList.add("show")
            // On active aussi les "tab" côté style conditionnel
            document.getElementById("conditional-style-tab-" + styleTypeLowerCase).setAttribute("aria-selected", "true")
            document.getElementById("conditional-style-tab-" + styleTypeLowerCase).classList.add("active")
            document.getElementById("conditional_style_form_" + styleTypeLowerCase).classList.add("active")
            document.getElementById("conditional_style_form_" + styleTypeLowerCase).classList.add("show")
        }


        document.getElementById("simple-style-tab-" + styleTypeLowerCase).setAttribute("aria-disabled", "false")
        document.getElementById("simple-style-tab-" + styleTypeLowerCase).classList.remove("disabled")
        // On active aussi les "tab" côté style conditionnel
        document.getElementById("conditional-style-tab-" + styleTypeLowerCase).setAttribute("aria-disabled", "false")
        document.getElementById("conditional-style-tab-" + styleTypeLowerCase).classList.remove("disabled")

        if (styleType == 'Point' || styleType == 'Polygon') {
            // On applique le style de remplissage
            var {hexColor, opacity} = RGBAToHex(style.styles[0].fill_color)
            document.getElementById("simple_style_" + styleTypeLowerCase + "_fill").querySelector("input[type='color']").value = hexColor
            document.getElementById("simple_style_" + styleTypeLowerCase + "_fill").querySelector("input[type='range']").value = opacity
        }

        // Si le style est de type point, on récupère le radiud
        if (styleType == 'Point'){
            document.getElementById("simple_style_point_radius").querySelector("input[type='number']").value = style.styles[0].radius
        }

        // On applique le style de la bordure
        var {hexColor, opacity} = RGBAToHex(style.styles[0].stroke_color)
        document.getElementById("simple_style_" + styleTypeLowerCase + "_stroke").querySelector("input[type='color']").value = hexColor
        document.getElementById("simple_style_" + styleTypeLowerCase + "_stroke").querySelector("input[type='range']").value = opacity
        document.getElementById("simple_style_" + styleTypeLowerCase + "_stroke").querySelector("input[type='number']").value = style.styles[0].stroke_width

        if (style.styles[0].stroke_linedash.length > 0){
            document.getElementById("simple_style_" + styleTypeLowerCase + "_stroke").querySelector("input[type='checkbox']").checked = true
        } else {
            document.getElementById("simple_style_" + styleTypeLowerCase + "_stroke").querySelector("input[type='checkbox']").checked = false
        }
        
        // On fini par afficher le bloc correspondant au style simple
        document.getElementById("simple_style_form").classList.remove("hide")
    })
}

/**
 * Peuple le formulaire d'édition d'un style conditionnel
 */
var buildFormForConditionnalStyle = function(json_style){

    document.getElementById("conditional_style_form").classList.remove("hide")
    document.getElementById("simple_style_form").classList.add("hide")
    
    document.getElementById("conditional_style_selector_bloc").classList.remove("hide")

    document.getElementById("conditional_style_categorised_generator_btn").style.opacity = 1
    document.getElementById("conditional_style_graduated_generator_btn").style.opacity = 1
    document.getElementById("conditional_style_new_rules_generator_btn").style.opacity = 1

    json_style.forEach( (style, loopIndex) => {

        var styleType = style.style_type
        var styleTypeLowerCase = styleType.toLowerCase()

        if (loopIndex == 0){
            document.getElementById("conditional-style-tab-" + styleTypeLowerCase).setAttribute("aria-selected", "true")
            document.getElementById("conditional-style-tab-" + styleTypeLowerCase).classList.add("active")
            document.getElementById("conditional_style_form_" + styleTypeLowerCase).classList.add("active")
            document.getElementById("conditional_style_form_" + styleTypeLowerCase).classList.add("show")
            // On active aussi les "tab" côté style simple
            document.getElementById("simple-style-tab-" + styleTypeLowerCase).setAttribute("aria-selected", "true")
            document.getElementById("simple-style-tab-" + styleTypeLowerCase).classList.add("active")
            document.getElementById("simple_style_form_" + styleTypeLowerCase).classList.add("active")
            document.getElementById("simple_style_form_" + styleTypeLowerCase).classList.add("show")
        }

        document.getElementById("conditional-style-tab-" + styleTypeLowerCase).setAttribute("aria-disabled", "false")
        document.getElementById("conditional-style-tab-" + styleTypeLowerCase).classList.remove("disabled")
        // On active aussi les "tab" côté style simple
        document.getElementById("simple-style-tab-" + styleTypeLowerCase).setAttribute("aria-disabled", "false")
        document.getElementById("simple-style-tab-" + styleTypeLowerCase).classList.remove("disabled")
       
        // Création des classe pour chaque style reseigné
        style.styles.forEach( (conditionalStyle, index) => {
            // Récupération du nom du style
            var conditionalStyleName = conditionalStyle.style_name

            // Récupération de la couleur de remplissage et opacité
            var conditionalStyleFillColor
            var conditionalStyleFillOpacity
            if (styleType == 'Point' || styleType == 'Polygon') {
                var {hexColor, opacity} = RGBAToHex(conditionalStyle.fill_color)
                conditionalStyleFillColor = hexColor
                conditionalStyleFillOpacity = opacity
            }

            // Récupération de la taille du point
            var conditionalStyleRadius
            if (styleType == 'Point'){
                conditionalStyleRadius = conditionalStyle.radius
            }

            var {hexColor, opacity} = RGBAToHex(conditionalStyle.stroke_color)
            var conditionalStyleStrokeColor = hexColor
            var conditionalStyleStrokeOpacity = opacity
            var conditionalStyleStrokeWidth = conditionalStyle.stroke_width

            var conditionalStyleFilterText = conditionalStyle.expression

            // Attribution des valeur au prototype
            var prototype = document.getElementById("conditional_style_form_" + styleTypeLowerCase).getAttribute("prototype")
            prototype = prototype.replace(/__IDX__/g, styleType + '_' + index)
            prototype = prototype.replace(/__COND_STYLE_LABEL__/g, conditionalStyleName)
            prototype = prototype.replace(/__COND_STYLE_FILL_COLOR__/g, conditionalStyleFillColor)
            prototype = prototype.replace(/__COND_STYLE_FILL_OPACITY__/g, conditionalStyleFillOpacity)
            prototype = prototype.replace(/__COND_STYLE_FILTER__/g, conditionalStyleFilterText.replace(/"/g, '&quot;'))
            prototype = prototype.replace(/__COND_STYLE_STROKE_COLOR__/g, conditionalStyleStrokeColor)
            prototype = prototype.replace(/__COND_STYLE_STROKE_OPACITY__/g, conditionalStyleStrokeOpacity)
            prototype = prototype.replace(/__COND_STYLE_STROKE_WIDTH__/g, conditionalStyleStrokeWidth)
            prototype = prototype.replace(/__COND_STYLE_POINT_RADIUS__/g, conditionalStyleRadius)

            var conditionalStyleStrokeDashChecker = ''
            if (conditionalStyle.stroke_linedash.length > 0){
                conditionalStyleStrokeDashChecker = 'checked'
            }
            prototype = prototype.replace(/__COND_STYLE_STROKE_DASH_CHECKER__/g, conditionalStyleStrokeDashChecker)

            var template = document.createElement('template')
            template.innerHTML = prototype
            document.getElementById("conditional_style_form_" + styleTypeLowerCase).appendChild(template.content)
        })
    })
}

/**
 * Peuple le formulaire d'édition des étiquettes
 */
var buildFormLabel = function(layer){
    // Pour commencer, on désactive (s'il est actif) l'affichage du formulaire dédié aux étiquettes
    if (document.getElementById("style_feature_label_checkbox").checked == true){
        document.getElementById("style_feature_label_checkbox").click()
    }
    // On vide la liste de champ utilisable comme étiquette
    document.getElementById("style_feature_label_field").innerHTML = ''
    // Puis on le peuple avec le liste des champ de la couche
    var columnNameList = layer.getSource().getFeatures()[0].getKeys()
    var geomColumnNameIndex = columnNameList.indexOf('geometry')
    columnNameList.splice(geomColumnNameIndex, 1)
    columnNameList.sort()
    columnNameList.forEach(item => {
        var tmp_option = document.createElement("option")
        tmp_option.value = item
        tmp_option.text = item
        document.getElementById("style_feature_label_field").add(tmp_option, null)
    })
    // Récupération du feature_label issue du json_style
    var feature_label
    json_style.forEach(style => {
        style.styles.forEach(style => {
            if (style.feature_label != null && feature_label == null) {
                feature_label = style.feature_label
            }
        })
    })
    // Initialisation de l'affichage et alimentation des champs
    if(feature_label != null){
        // On affiche le formulaire d'étiquette
        document.getElementById("style_feature_label_checkbox").click()

        // Alimentation du selecteur de champ
        document.getElementById("style_feature_label_field").value = feature_label.text

        // Renseignement de la yaille de police
        document.getElementById("style_feature_label_size").value = feature_label.size

        // Renseignement du style de caractère
        document.getElementById("style_feature_label_weight").value = feature_label.weight

        // Renseignement de la couleur du texte
        var {hexColor, opacity} = RGBAToHex(feature_label.color)
        document.getElementById("style_feature_label_color").value = hexColor
        
        // Renseignement de la couleur d'arrière plan
        var {hexColor, opacity} = RGBAToHex(feature_label.background_color)
        document.getElementById("style_feature_label_background_color").value = hexColor

        // Renseignement de l'opacité de l'arrière plan
        document.getElementById("style_feature_label_background_opacity").value = opacity

    } else {
        // Renseignement de la yaille de police
        document.getElementById("style_feature_label_size").value = 12

        // Renseignement du style de caractère
        document.getElementById("style_feature_label_weight").value = 'Normal'

        // Renseignement de la couleur du texte
        document.getElementById("style_feature_label_color").value = '#000000'
        
        // Renseignement de la couleur d'arrière plan
        document.getElementById("style_feature_label_background_color").value = '#ffffff'

        // Renseignement de l'opacité de l'arrière plan
        document.getElementById("style_feature_label_background_opacity").value = 1
    }
}

/**
 * Fonction permettant de convertir une couleur rgba en hexadécimal
 */
var RGBAToHex = function(rgba) {
    rgba = rgba.replace(/\s/g, '');

    // Turn "rgb(r,g,b)" into [r,g,b]
    if (rgba.indexOf("(") == 4 ){
        // ici on est bien sur une couleur en rgba
        rgba = rgba.substr(5).split(")")[0].split(',')
    } else {
        // Ici on est sur une couleur rgb
        rgba = rgba.substr(4).split(")")[0].split(',')
        // donc on force l'opacité à 1
        rgba.push(1)
    }
  
    let r = (+rgba[0]).toString(16)
    let g = (+rgba[1]).toString(16)
    let b = (+rgba[2]).toString(16)
    let opacity = rgba[3]

    if (r.length == 1)
      r = "0" + r
    if (g.length == 1)
      g = "0" + g
    if (b.length == 1)
      b = "0" + b
    
  
    let hexColor = "#" + r + g + b
    return { hexColor, opacity }
}

/**
 * Fonction permettant de convertir une couleur hexadécimal en rgba
 */
var hexToRGBA = function (hex, opacity) {
    var tmp = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    var result
    
    if (tmp) {
        let r = parseInt(tmp[1], 16)
        let g = parseInt(tmp[2], 16)
        let b = parseInt(tmp[3], 16)

        result = 'rgba(' + r + ',' + g + ',' + b + ',' + opacity + ')'
    }
    
    return result
}

/**
 * Application du style 
 */
document.getElementById("style-layer-submit").addEventListener("click", function(event){

    //Récupération de l'UID du layer en cours d'édition
    var layer_uid = event.currentTarget.parentNode.querySelector("input[name='layer-uid']").value

    // Récupératin de la couche en cours d'édition
    var layer
    map.getLayers().forEach(currentLayer => {
        if (ol.util.getUid(currentLayer) == layer_uid){
            layer = currentLayer
        }
    });

    // Récupération du style de la couche au format json
    var json_style = layer.get("json_style")

    var new_json_style = []

    var style_type = document.getElementById("type_style_select").value
    switch (style_type){
        case 'simple':
            new_json_style = computeSimpleStyle(new_json_style)            
            break        
        case 'conditional':
            new_json_style = computeConditionalStyle(new_json_style)
            break
    }

    if (document.getElementById("style_feature_label_checkbox").checked){
        new_json_style = computeLabelStyle(new_json_style)
    }

    // On applique le style à la couche
    layer.setStyle(buildStyle(new_json_style));
    layer.set("json_style", new_json_style)
    layer.getSource().getFeatures().forEach(feature => {
        feature.setStyle(buildStyle(new_json_style))
    })

    // Suppression de la précédente légende
    document.getElementById('layer-legend-'+layer_uid).innerHTML = ''
    // Construction de la nouvelle légende
    buildLegendForLayer(layer_uid, new_json_style)

    // Fermeture du modal
    styleLayerModal.hide()
})

/**
 * Applique un style simple à la couche
 */
var computeSimpleStyle = function (new_json_style){
    if (!document.getElementById("simple-style-tab-point").classList.contains('disabled')){
        // Ici on traite le nouveaux style de type point

        var point_style_fill_opacity = document.getElementById("simple_style_point_fill").querySelector("input[type='range']").value
        var point_style_fill_color = hexToRGBA(document.getElementById("simple_style_point_fill").querySelector("input[type='color']").value, point_style_fill_opacity)

        var point_style_radius = document.getElementById("simple_style_point_radius").querySelector("input[type='number']").value

        var point_style_stroke_opacity = document.getElementById("simple_style_point_stroke").querySelector("input[type='range']").value
        var point_style_stroke_color = hexToRGBA(document.getElementById("simple_style_point_stroke").querySelector("input[type='color']").value, point_style_stroke_opacity)
        var point_style_stroke_width = document.getElementById("simple_style_point_stroke").querySelector("input[type='number']").value
        var point_style_stroke_is_dashed = document.getElementById("simple_style_point_stroke").querySelector("input[type='checkbox']").checked
        var point_style_stroke_dashed = []
        if (point_style_stroke_is_dashed == true){
            point_style_stroke_dashed = [4,8]
        }

        var json_style_point = {
                "styles": [
                {
                    "expression": null,
                    "radius": point_style_radius,
                    "fill_color": point_style_fill_color,
                    "stroke_color": point_style_stroke_color,
                    "stroke_width": point_style_stroke_width,
                    "stroke_linedash": point_style_stroke_dashed
                }
                ],
                "style_type": "Point"
            }

        new_json_style.push(json_style_point)
    }

    if (!document.getElementById("simple-style-tab-line").classList.contains('disabled')){
        // Ici on traite le nouveaux style de type line

        var line_style_stroke_opacity = document.getElementById("simple_style_line_stroke").querySelector("input[type='range']").value
        var line_style_stroke_color = hexToRGBA(document.getElementById("simple_style_line_stroke").querySelector("input[type='color']").value, line_style_stroke_opacity)
        var line_style_stroke_width = document.getElementById("simple_style_line_stroke").querySelector("input[type='number']").value
        var line_style_stroke_is_dashed = document.getElementById("simple_style_line_stroke").querySelector("input[type='checkbox']").checked
        var line_style_stroke_dashed = []
        if (line_style_stroke_is_dashed == true){
            line_style_stroke_dashed = [4,8]
        }

        var json_style_line = {
                "styles": [
                {
                    "expression": null,
                    "stroke_color": line_style_stroke_color,
                    "stroke_width": line_style_stroke_width,
                    "stroke_linedash": line_style_stroke_dashed
                }
                ],
                "style_type": "Line"
            }

        new_json_style.push(json_style_line)
    }

    if (!document.getElementById("simple-style-tab-polygon").classList.contains('disabled')){
        // Ici on traite le nouveaux style de type polygon

        var polygon_style_fill_opacity = document.getElementById("simple_style_polygon_fill").querySelector("input[type='range']").value
        var polygon_style_fill_color = hexToRGBA(document.getElementById("simple_style_polygon_fill").querySelector("input[type='color']").value, polygon_style_fill_opacity)

        var polygon_style_stroke_opacity = document.getElementById("simple_style_polygon_stroke").querySelector("input[type='range']").value
        var polygon_style_stroke_color = hexToRGBA(document.getElementById("simple_style_polygon_stroke").querySelector("input[type='color']").value, polygon_style_stroke_opacity)
        var polygon_style_stroke_width = document.getElementById("simple_style_polygon_stroke").querySelector("input[type='number']").value
        var polygon_style_stroke_is_dashed = document.getElementById("simple_style_polygon_stroke").querySelector("input[type='checkbox']").checked
        var polygon_style_stroke_dashed = []
        if (polygon_style_stroke_is_dashed == true){
            polygon_style_stroke_dashed = [4,8]
        }

        var json_style_polygon = {
                "styles": [
                {
                    "expression": null,
                    "fill_color": polygon_style_fill_color,
                    "stroke_color": polygon_style_stroke_color,
                    "stroke_width": polygon_style_stroke_width,
                    "stroke_linedash": polygon_style_stroke_dashed
                }
                ],
                "style_type": "Polygon"
            }

        new_json_style.push(json_style_polygon)
    }

    return new_json_style
}

/**
 * Applique un style conitionnel à la couche
 */
var computeConditionalStyle = function (new_json_style){
    
    if (!document.getElementById("conditional-style-tab-point").classList.contains('disabled')){
        
        tmp_style = []
        
        // Ici on traite le nouveaux style conditionnel de type point
        document.getElementById("conditional_style_form_point").querySelectorAll(".conditional-style").forEach(conditionalStyle => {

            var point_style_fill_opacity = conditionalStyle.querySelector(".conditional_style_point_fill").querySelector("input[type='range']").value
            var point_style_fill_color = hexToRGBA(conditionalStyle.querySelector(".conditional_style_point_fill").querySelector("input[type='color']").value, point_style_fill_opacity)

            var point_style_radius = conditionalStyle.querySelector(".conditional_style_point_radius").querySelector("input[type='number']").value

            var point_style_stroke_opacity = conditionalStyle.querySelector(".conditional_style_point_stroke").querySelector("input[type='range']").value
            var point_style_stroke_color = hexToRGBA(conditionalStyle.querySelector(".conditional_style_point_stroke").querySelector("input[type='color']").value, point_style_stroke_opacity)
            var point_style_stroke_width = conditionalStyle.querySelector(".conditional_style_point_stroke").querySelector("input[type='number']").value
            var point_style_stroke_is_dashed = conditionalStyle.querySelector(".conditional_style_point_stroke").querySelector("input[type='checkbox']").checked
            var point_style_stroke_dashed = []
            if (point_style_stroke_is_dashed == true){
                point_style_stroke_dashed = [4,8]
            }

            var point_style_label = conditionalStyle.querySelector(".conditional_style_point_label").value
            var point_style_expression = conditionalStyle.querySelector(".conditional_style_point_expression").value

            tmp_style.push({
                "radius": point_style_radius,
                "expression": point_style_expression,
                "fill_color": point_style_fill_color,
                "style_name": point_style_label,
                "stroke_color": point_style_stroke_color,
                "stroke_width": point_style_stroke_width,
                "stroke_linedash": point_style_stroke_dashed
            })
        })


        var json_style_point = {
            "styles": tmp_style,
            "style_type": "Point"
        }

        new_json_style.push(json_style_point)
    }

    if (!document.getElementById("conditional-style-tab-line").classList.contains('disabled')){
        // Ici on traite le nouveaux style conditionnel de type line
        tmp_style = []
        
        // Ici on traite le nouveaux style conditionnel de type point
        document.getElementById("conditional_style_form_line").querySelectorAll(".conditional-style").forEach(conditionalStyle => {

            var line_style_stroke_opacity = conditionalStyle.querySelector(".conditional_style_line_stroke").querySelector("input[type='range']").value
            var line_style_stroke_color = hexToRGBA(conditionalStyle.querySelector(".conditional_style_line_stroke").querySelector("input[type='color']").value, line_style_stroke_opacity)
            var line_style_stroke_width = conditionalStyle.querySelector(".conditional_style_line_stroke").querySelector("input[type='number']").value
            var line_style_stroke_is_dashed = conditionalStyle.querySelector(".conditional_style_line_stroke").querySelector("input[type='checkbox']").checked
            var line_style_stroke_dashed = []
            if (line_style_stroke_is_dashed == true){
                line_style_stroke_dashed = [4,8]
            }

            var line_style_label = conditionalStyle.querySelector(".conditional_style_line_label").value
            var line_style_expression = conditionalStyle.querySelector(".conditional_style_line_expression").value

            tmp_style.push({
                "expression": line_style_expression,
                "style_name": line_style_label,
                "stroke_color": line_style_stroke_color,
                "stroke_width": line_style_stroke_width,
                "stroke_linedash": line_style_stroke_dashed
            })
        })

        var json_style_line = {
            "styles": tmp_style,
            "style_type": "Line"
        }

        

        new_json_style.push(json_style_line)
        
    }

    if (!document.getElementById("conditional-style-tab-polygon").classList.contains('disabled')){

        tmp_style = []
        // Ici on traite le nouveaux style conditionnel de type polygon
        document.getElementById("conditional_style_form_polygon").querySelectorAll(".conditional-style").forEach(conditionalStyle => {
        
            var polygon_style_fill_opacity = conditionalStyle.querySelector(".conditional_style_polygon_fill").querySelector("input[type='range']").value
            var polygon_style_fill_color = hexToRGBA(conditionalStyle.querySelector(".conditional_style_polygon_fill").querySelector("input[type='color']").value, polygon_style_fill_opacity)

            var polygon_style_stroke_opacity = conditionalStyle.querySelector(".conditional_style_polygon_stroke").querySelector("input[type='range']").value
            var polygon_style_stroke_color = hexToRGBA(conditionalStyle.querySelector(".conditional_style_polygon_stroke").querySelector("input[type='color']").value, polygon_style_stroke_opacity)
            var polygon_style_stroke_width = conditionalStyle.querySelector(".conditional_style_polygon_stroke").querySelector("input[type='number']").value
            var polygon_style_stroke_is_dashed = conditionalStyle.querySelector(".conditional_style_polygon_stroke").querySelector("input[type='checkbox']").checked
            var polygon_style_stroke_dashed = []
            if (polygon_style_stroke_is_dashed == true){
                polygon_style_stroke_dashed = [4,8]
            }

            var polygon_style_label = conditionalStyle.querySelector(".conditional_style_polygon_label").value
            var polygon_style_expression = conditionalStyle.querySelector(".conditional_style_polygon_expression").value

            tmp_style.push({
                "expression": polygon_style_expression,
                "fill_color": polygon_style_fill_color,
                "style_name": polygon_style_label,
                "stroke_color": polygon_style_stroke_color,
                "stroke_width": polygon_style_stroke_width,
                "stroke_linedash": polygon_style_stroke_dashed
            })
        })

        var json_style_polygon = {
            "styles": tmp_style,
            "style_type": "Polygon"
        }

        new_json_style.push(json_style_polygon)
    }

    return new_json_style
}

/**
 * Applique la configuration des étiquette à la couche
 */
var computeLabelStyle = function(new_json_style){
    // Récupération de la configuration du style d'étiquette
    var label_field = document.getElementById("style_feature_label_field").value 
    var label_size = document.getElementById("style_feature_label_size").value
    var label_weight = document.getElementById("style_feature_label_weight").value
    var label_color = hexToRGBA(document.getElementById("style_feature_label_color").value, 1)
    var label_backgroun_opacity = document.getElementById("style_feature_label_background_opacity").value
    var label_background_color = hexToRGBA(document.getElementById("style_feature_label_background_color").value, label_backgroun_opacity)

    var feature_label = {
        "size": label_size,
        "text": label_field,
        "color": label_color,
        "weight": label_weight,
        "background_color": label_background_color
      }
    
    new_json_style.forEach((json_style, index1) => {  
        json_style.styles.forEach( (style, index2) => {
            new_json_style[index1].styles[index2]["feature_label"] = feature_label
        })
    })
    
    return new_json_style

}

/**
 * Gestion de l'affichage du "selecteur" de champ à utiliser comme étiquette
 */
document.getElementById("style_feature_label_checkbox").addEventListener("click", event => {
    if (event.currentTarget.checked){
        document.getElementById("style_feature_label_bloc").classList.remove("hide")
        document.getElementById("conditional_style_form_geom_tabs-content").style.maxHeight = "40vh"
    } else {
        document.getElementById("style_feature_label_bloc").classList.add("hide")
        document.getElementById("conditional_style_form_geom_tabs-content").style.maxHeight = "50vh"
    }
})

/**
 * Gestion de l'affichage des "sous-champ" des générateurs de catégorie
 */
document.getElementById("conditional_style_categorised_generator_btn").addEventListener("click", event => {
    // On masque le bloc d'édition d'un style gradué 
    document.getElementById("graduated_style_editor_bloc").classList.add("hide")

    // On affiche le bloc d'édition d'un style catégorisé
    document.getElementById("categorised_style_editor_bloc").classList.remove("hide")

    // Gestion de la couleur des bouttons
    document.getElementById("conditional_style_selector_bloc").querySelectorAll(".conditional-style-generator-btn").forEach(element => {
        element.style.opacity = 0.5
    })
    event.currentTarget.style.opacity = 1

    // Récupération du layer_uid
    layer_uid = document.getElementById("style_layer_modal_footer").querySelector("input[name='layer-uid']").value

    // Récupération de la liste des champs
    var columnNameList = null
    map.getLayers().forEach(layer => {
        if (ol.util.getUid(layer) == layer_uid){
            columnNameList = layer.getSource().getFeatures()[0].getKeys()
            var geomColumnNameIndex = columnNameList.indexOf('geometry')
            columnNameList.splice(geomColumnNameIndex, 1)
            columnNameList.sort()   
        }
    })

    // on "reset" la liste des colonnes
    document.getElementById("conditional_style_categorised_generator_field_select").innerHTML = ''
    if (columnNameList != null) {
        columnNameList.forEach(item => {
            var tmp_option = document.createElement("option")
            tmp_option.value = item
            tmp_option.text = item
            document.getElementById("conditional_style_categorised_generator_field_select").add(tmp_option, null)
        })
    }
})

/**
 * Gestion de l'affichage des "sous-champ" des générateurs gradué
 */
document.getElementById("conditional_style_graduated_generator_btn").addEventListener("click", event => {
    // On masque le bloc d'édition d'un style catégorisé
    document.getElementById("categorised_style_editor_bloc").classList.add("hide")

    // On affiche le bloc d'édition d'un style gradué 
    document.getElementById("graduated_style_editor_bloc").classList.remove("hide")

    // Gestion de la couleur des boutton
    document.getElementById("conditional_style_selector_bloc").querySelectorAll(".conditional-style-generator-btn").forEach(element => {
        element.style.opacity = 0.5
    })
    event.currentTarget.style.opacity = 1

    
    // Récupération du layer_uid
    layer_uid = document.getElementById("style_layer_modal_footer").querySelector("input[name='layer-uid']").value

    // Identification des champs purement numérique
    var columnNameList = []
    map.getLayers().forEach(layer => {
        if (ol.util.getUid(layer) == layer_uid){
            var featureColumns = layer.getSource().getFeatures()[0].getKeys()

            var isNumeric = null
            featureColumns.forEach(columnName => {

                // On ne traite pas le colonne 'geometry'
                if (columnName != 'geometry'){
                    isNumeric = null
                    layer.getSource().getFeatures().forEach(feature => {    
                        
                        feature_data = feature.getProperties()

                        // A partir du moment ou une valeur n'est pas numérique, isNumeric reste à false
                        if (isNumeric == true || isNumeric == null){
                            if (typeof feature_data[columnName] == 'number'){
                                isNumeric = true
                            } else {
                                isNumeric = false
                            }
                        }
                    })

                    if (isNumeric == true) {
                        columnNameList.push(columnName)
                    }
                }
            })

            columnNameList.sort()
        }
    })

    // on "reset" la liste des colonnes
    document.getElementById("conditional_style_graduated_generator_field_select").innerHTML = ''
    if (columnNameList != null) {
        columnNameList.forEach(item => {
            var tmp_option = document.createElement("option")
            tmp_option.value = item
            tmp_option.text = item
            document.getElementById("conditional_style_graduated_generator_field_select").add(tmp_option, null)
        })
    }
})

/**
 * Gestion de l'action d'ajout d'une nouvelle règle
 */
document.getElementById("conditional_style_new_rules_generator_btn").addEventListener("click", event => {
    // On masque le bloc d'édition d'un style catégorisé
    document.getElementById("categorised_style_editor_bloc").classList.add("hide")

    // On masque le bloc d'édition d'un style gradué 
    document.getElementById("graduated_style_editor_bloc").classList.add("hide")

    // Gestion de la couleur des boutton
    document.getElementById("conditional_style_selector_bloc").querySelectorAll(".conditional-style-generator-btn").forEach(element => {
        element.style.opacity = 0.5
    })
    event.currentTarget.style.opacity = 1

    // Ajout d'un bloc "style"
    var target = document.getElementById("conditional_style_form_geom_tab").querySelector("a.active").getAttribute("data-bs-target").replace('#', '')
    
    // Initialisation de l'identifiant du style
    var tmpGeomType = target.split('_')
    var geomType = tmpGeomType[tmpGeomType.length - 1]
    var currentIndex = document.getElementById(target).querySelectorAll(".conditional-style").length ?? 0

    var styleIndex = geomType.charAt(0).toUpperCase() + geomType.slice(1) + '_' + currentIndex 

    // Initialisation du nom du style
    var conditionalStyleName = ''

    // Génération d'une couleur aléatoire
    let {color_rgba, color_rgb}  = random_color(0.8)
    let { hexColor, opacity } = RGBAToHex(color_rgba)
    var conditionalStyleFillColor = hexColor
    var conditionalStyleFillOpacity = opacity

    if (geomType == 'line'){
        conditionalStyleStrokeColor = hexColor
        conditionalStyleStrokeOpacity = 1
        conditionalStyleStrokeWidth = 3
    } else {
        conditionalStyleStrokeColor = "#000000"
        conditionalStyleStrokeOpacity = 1
        conditionalStyleStrokeWidth = 1
    }

    // Initialisation de l'expression
    var conditionalStyleFilterText = ''

    // Attribution de la taille du point
    var conditionalStyleRadius = 5

    // Alimentation du prototype
    var prototype = document.getElementById(target).getAttribute("prototype")

    prototype = prototype.replace(/__IDX__/g, styleIndex)
    prototype = prototype.replace(/__COND_STYLE_LABEL__/g, conditionalStyleName)
    prototype = prototype.replace(/__COND_STYLE_FILL_COLOR__/g, conditionalStyleFillColor)
    prototype = prototype.replace(/__COND_STYLE_FILL_OPACITY__/g, conditionalStyleFillOpacity)
    prototype = prototype.replace(/__COND_STYLE_FILTER__/g, conditionalStyleFilterText.replace(/"/g, '&quot;'))
    prototype = prototype.replace(/__COND_STYLE_STROKE_COLOR__/g, conditionalStyleStrokeColor)
    prototype = prototype.replace(/__COND_STYLE_STROKE_OPACITY__/g, conditionalStyleStrokeOpacity)
    prototype = prototype.replace(/__COND_STYLE_STROKE_WIDTH__/g, conditionalStyleStrokeWidth)
    prototype = prototype.replace(/__COND_STYLE_POINT_RADIUS__/g, conditionalStyleRadius)

    // Ajout du style vierge à la liste
    document.getElementById(target).insertAdjacentHTML('beforeend', prototype)

    // On repasse les bouton de génération de classe en foncé
    document.getElementById("conditional_style_selector_bloc").querySelectorAll(".conditional-style-generator-btn").forEach(element => {
        element.style.opacity = 1
    })
})

/**
 * Génération de classe catégorisé
 */
document.getElementById("conditional_style_categorised_generator_execute").addEventListener("click", event => {
    // Récupération du layer_uid
    layer_uid = document.getElementById("style_layer_modal_footer").querySelector("input[name='layer-uid']").value

    deleteCurrentClasse()

    // Récupération du nom du champ retenu pour la classification
    field_name = document.getElementById("conditional_style_categorised_generator_field_select").value

    // Récupération des valeurs uniques et des type de géométrie
    var values = []
    var geomTypes = []
    map.getLayers().forEach(layer => {
        if (ol.util.getUid(layer) == layer_uid){
            layer.getSource().getFeatures().forEach(feature => {
                var current_value = feature.get(field_name)
                if (! values.includes(current_value)){
                    values.push(current_value)
                }

                // Récupération du type de géométry
                if(feature.getGeometry()){
                    var current_geomType = feature.getGeometry().getType()
                    if (! geomTypes.includes(current_geomType)){
                        geomTypes.push(current_geomType)
                    }
                }                
            })
        }
    })
  
    values.sort()


    // Pour chaque valeur
    values.forEach( (value, index) => {
        // définition d'une couleur aléatoir
        let {color_rgba, color_rgb}  = random_color(0.8)
        let { hexColor, opacity } = RGBAToHex(color_rgba)

        // Attribution du nom du style
        conditionalStyleName = value

        // Attribution de la couleur de remplissage et opacité
        var conditionalStyleFillColor = hexColor
        var conditionalStyleFillOpacity = opacity

        // Attribution de la taille du point
        var conditionalStyleRadius = 5
        
        var conditionalStyleFilterText = "feature.get('" + field_name + "') == "

        // Ecriture de l'expression
        switch (typeof value){
            case 'number' : 
                conditionalStyleFilterText = conditionalStyleFilterText + value
                break
            case 'string' : 
                conditionalStyleFilterText = conditionalStyleFilterText + "'" + value.replace(/'/g, "&#92;&apos;" /* remplace ' par \' */ ) + "'"
                break
            case 'boolean' :
                conditionalStyleFilterText = conditionalStyleFilterText + value
                break
            default : 
                conditionalStyleName = "Sans valeur"
                conditionalStyleFilterText = conditionalStyleFilterText + "null"

        }

        // Et pour chaque type de géométrie
        geomTypes.forEach(geomType => {
            styleTypeLowerCase = geomType.toLowerCase()

            // On surcharge le type pour passer de "linestring" à "line"
            if(styleTypeLowerCase == 'linestring' || styleTypeLowerCase == 'multilinestring' ){
                styleTypeLowerCase = 'line'
            }

            if(styleTypeLowerCase == 'multipoint' ){
                styleTypeLowerCase = 'point'
            }

            if(styleTypeLowerCase == 'multipolygon' ){
                styleTypeLowerCase = 'polygon'
            }

            if (styleTypeLowerCase == 'line'){
                conditionalStyleStrokeColor = hexColor
                conditionalStyleStrokeOpacity = 1
                conditionalStyleStrokeWidth = 3
            } else {
                conditionalStyleStrokeColor = "#000000"
                conditionalStyleStrokeOpacity = 1
                conditionalStyleStrokeWidth = 1
            }

            // Création du bloc "filtre"
            var prototype = document.getElementById("conditional_style_form_" + styleTypeLowerCase).getAttribute("prototype")

            prototype = prototype.replace(/__IDX__/g, styleTypeLowerCase + '_' + index)
            prototype = prototype.replace(/__COND_STYLE_LABEL__/g, conditionalStyleName)
            prototype = prototype.replace(/__COND_STYLE_FILL_COLOR__/g, conditionalStyleFillColor)
            prototype = prototype.replace(/__COND_STYLE_FILL_OPACITY__/g, conditionalStyleFillOpacity)
            prototype = prototype.replace(/__COND_STYLE_FILTER__/g, conditionalStyleFilterText.replace(/"/g, '&quot;'))
            prototype = prototype.replace(/__COND_STYLE_STROKE_COLOR__/g, conditionalStyleStrokeColor)
            prototype = prototype.replace(/__COND_STYLE_STROKE_OPACITY__/g, conditionalStyleStrokeOpacity)
            prototype = prototype.replace(/__COND_STYLE_STROKE_WIDTH__/g, conditionalStyleStrokeWidth)
            prototype = prototype.replace(/__COND_STYLE_POINT_RADIUS__/g, conditionalStyleRadius)

            // On ajoute le prototype dans la liste
            document.getElementById("conditional_style_form_" + styleTypeLowerCase).insertAdjacentHTML('beforeend', prototype)
        })

    })

})

/**
 * Génération de classe gradué
 */
document.getElementById("conditional_style_graduated_generator_execute").addEventListener("click", event => {
    // Récupération du layer_uid
    var layer_uid = document.getElementById("style_layer_modal_footer").querySelector("input[name='layer-uid']").value

    deleteCurrentClasse()

    // Récupération du nom du champ retenu pour la classification
    var field_name = document.getElementById("conditional_style_graduated_generator_field_select").value

    // Récupération du nombre de classe
    var nb_class = document.getElementById("conditional_style_graduated_generator_nb_class").value
    //var nb_class = document.getElementById()

    // Récupération de la valeur min et max et des type de géométrye
    var min = null
    var max = null
    var geomTypes = []
    map.getLayers().forEach(layer => {
        if (ol.util.getUid(layer) == layer_uid){
            layer.getSource().getFeatures().forEach(feature => {
                let feature_data = feature.getProperties()

                if (feature_data[field_name] < min || min == null){
                    min = feature_data[field_name]
                }

                if (feature_data[field_name] > max || max == null){
                    max = feature_data[field_name]
                }

                // Récupération du type de géométry
                if(feature.getGeometry()){
                    var current_geomType = feature.getGeometry().getType()
                    if (! geomTypes.includes(current_geomType)){
                        geomTypes.push(current_geomType)
                    }
                }    
            })
        }
    })
    
    // calcul de la borne (incrément)
    borner = floatRound((max - min) / nb_class, 4)

    // Initialisation des bornes
    var bornes = []
    var current_borne_min = min
    var current_borne_max = current_borne_min + borner

    // Calcul de chaque borne
    for (i=0; i<nb_class; i++){

        bornes.push({"min": current_borne_min, "max": current_borne_max})

        // On augmente les bornes min / max
        current_borne_min = current_borne_max
        if (i == nb_class-1) {
            current_borne_max = max
        } else {
            current_borne_max = floatRound(current_borne_max + borner, 4)
        }
    }

    // Création de la palette de couleur
    var rainbow = new Rainbow()
    rainbow.setNumberRange(1, nb_class)

    // Calcul en fonction de la palette sélectionné
    var selectedGradien = document.getElementById("conditional_style_graduated_generator_grandient_dropdown").value.split(',')
    rainbow.setSpectrumFromArray(selectedGradien)  
    var gradientColors = []
    for (var i = 1; i <= nb_class; i++) {
        var hexColour = rainbow.colourAt(i)
        gradientColors.push("#" + hexColour)
    }

    // Inversion de la palette si coché
    if (document.getElementById("conditional_style_graduated_generator_grandient_inverse").checked == true){
        gradientColors = gradientColors.reverse()
    }

    // Génération des classes pour chaque valeur
    bornes.forEach( (borne, index) => {
        // Récupération de la couleur de la palette
        let hexColor = gradientColors[index]
        let opacity = 0.8

        // Attribution du nom du style
        conditionalStyleName = borne.min + " - " + borne.max

        // Attribution de la couleur de remplissage et opacité
        var conditionalStyleFillColor = hexColor
        var conditionalStyleFillOpacity = opacity

        // Attribution de la taille du point
        var conditionalStyleRadius = 5
        
        // Ecriture de l'expression
        var conditionalStyleFilterText = ''
        if (index == bornes.length - 1){
            // Si c'est la dernière condition alors on change l'opérateur < par <= pour englober la valeur haute
            conditionalStyleFilterText = "feature.get('" + field_name + "') >= " + borne.min + " && feature.get('" + field_name + "') <= " + borne.max
        } else {
            conditionalStyleFilterText = "feature.get('" + field_name + "') >= " + borne.min + " && feature.get('" + field_name + "') < " + borne.max
        }
        

        // Et pour chaque type de géométrie
        geomTypes.forEach(geomType => {
            styleTypeLowerCase = geomType.toLowerCase()

            // On surcharge le type pour passer de "linestring" à "line"
            if(styleTypeLowerCase == 'linestring' || styleTypeLowerCase == 'multilinestring' ){
                styleTypeLowerCase = 'line'
            }

            if(styleTypeLowerCase == 'multipoint' ){
                styleTypeLowerCase = 'point'
            }

            if(styleTypeLowerCase == 'multipolygon' ){
                styleTypeLowerCase = 'polygon'
            }

            if (styleTypeLowerCase == 'line'){
                conditionalStyleStrokeColor = hexColor
                conditionalStyleStrokeOpacity = 1
                conditionalStyleStrokeWidth = 3
            } else {
                conditionalStyleStrokeColor = "#000000"
                conditionalStyleStrokeOpacity = 1
                conditionalStyleStrokeWidth = 1
            }

            // Création du bloc "filtre"
            var prototype = document.getElementById("conditional_style_form_" + styleTypeLowerCase).getAttribute("prototype")

            prototype = prototype.replace(/__IDX__/g, styleTypeLowerCase + '_' + index)
            prototype = prototype.replace(/__COND_STYLE_LABEL__/g, conditionalStyleName)
            prototype = prototype.replace(/__COND_STYLE_FILL_COLOR__/g, conditionalStyleFillColor)
            prototype = prototype.replace(/__COND_STYLE_FILL_OPACITY__/g, conditionalStyleFillOpacity)
            prototype = prototype.replace(/__COND_STYLE_FILTER__/g, conditionalStyleFilterText.replace(/"/g, '&quot;'))
            prototype = prototype.replace(/__COND_STYLE_STROKE_COLOR__/g, conditionalStyleStrokeColor)
            prototype = prototype.replace(/__COND_STYLE_STROKE_OPACITY__/g, conditionalStyleStrokeOpacity)
            prototype = prototype.replace(/__COND_STYLE_STROKE_WIDTH__/g, conditionalStyleStrokeWidth)
            prototype = prototype.replace(/__COND_STYLE_POINT_RADIUS__/g, conditionalStyleRadius)

            // On ajoute le prototype dans la liste
            document.getElementById("conditional_style_form_" + styleTypeLowerCase).insertAdjacentHTML('beforeend', prototype)
        })

    })    
})

/**
 * Suppression d'une légende conditionnelle
 */
var removeLegendClass = function(event){
    var legendElement = event.currentTarget.closest(".conditional-style")
    legendElement.parentNode.querySelector(".hr-bloc-legend").remove()
    legendElement.remove()
}

/**
 * Fonction supprimant les classe renseigné dans le style conditionnel
 */
var deleteCurrentClasse = function(){
    document.getElementById("conditional_style_form_point").innerHTML = ""
    document.getElementById("conditional_style_form_line").innerHTML = ""
    document.getElementById("conditional_style_form_polygon").innerHTML = ""
}

/**
 * Gestion du bouton de selection de la palette (pour les styles gradués)
 */
var selectGradient = function (gradient){

    document.getElementById("conditional_style_graduated_generator_grandient_dropdown").value = gradient
    document.getElementById("conditional_style_graduated_generator_grandient_dropdown").style.background = "linear-gradient(to right," + gradient.join(', ') + ")"
}

/**
 * Fonction permettant d'insérer du text en fonction de la position du curseur
 */
 function insertAtCursor(myField, myValue) {
    if (myField.selectionStart || myField.selectionStart == '0') {
        var startPos = myField.selectionStart;
        var endPos = myField.selectionEnd;
        myField.value = myField.value.substring(0, startPos)
            + myValue
            + myField.value.substring(endPos, myField.value.length);
    } else {
        myField.value += myValue;
    }
}

/**
 * Gestion d'un clic sur un des champs listé dans l'éditeur d'expression
 */
var expressionFieldSelect = function(event){
    
    // event.detail === 1 permet de s'assurer qu'on est sur un simple clic et pas un double
    if (event.currentTarget.classList.contains("expression-field-selected") && event.detail === 1){
        // Ici on a cliqué sur un champ déjà sélectionn
        // Alors on désactive le bouton permettant de lister les valeurs        
        document.getElementById("expression_editor_list_values_btn").disabled = true
        
        // Et on retire le style 
        event.currentTarget.classList.remove("expression-field-selected")
    } else {
        // Ici on clic sur un champ qui n'est pas séléectionné
        // Alors on retire le style pour tous les champs
        document.getElementById("expression_editor_field_list").querySelectorAll("li").forEach(element => {
            element.classList.remove("expression-field-selected")
        })
        // On l'ajoute pour le champ cliqué
        event.currentTarget.classList.add("expression-field-selected")

        // On active le bouton permettant de lister les valeurs
        document.getElementById("expression_editor_list_values_btn").disabled = false
    }    
}

/**
 * Fonction permettant d'ajouter un champ à l'expression
 */
var addFieldToExpression = function(event){
    var field = "feature.get('" + event.currentTarget.innerHTML + "')"

    var textarea = document.getElementById("expression_editor_textarea")

    insertAtCursor(textarea, field)
}

/**
 * Fonction permettant d'ajouter une valeur à l'expression
 */
 var addValueToExpression = function(event){
    var value = event.currentTarget.innerHTML

    var textarea = document.getElementById("expression_editor_textarea")

    insertAtCursor(textarea, value)
}

/**
 * Fonction permettant d'ajouter un opérateur à l'expression
 */
addOperatorToExpression = function(event) {
    var value = event.currentTarget.getAttribute("operator")

    var textarea = document.getElementById("expression_editor_textarea")

    insertAtCursor(textarea, value)
}

/**
 * Ouverture de l'éditeur d'expression
 */
var conditionalStyleEditExpression = function (event, conditionalStyleId){
    // On initialise le panneau d'édition
    initExpressionEditorPanel()

    // On reseigne l'identifiant du style 
    document.getElementById("expression_editor_conditional_style_id").value = conditionalStyleId
    var geomType = conditionalStyleId.split('_')[0].toLowerCase()

    // On reseigne l'expression
    var currentExpression = document.querySelector(".conditional-style[conditional-style-id='" + conditionalStyleId + "']").querySelector(".conditional_style_" + geomType +"_expression").value
    document.getElementById("expression_editor_textarea").value = currentExpression

    /* On peuple la liste des champs */
    // Récupération du layer_uid
    var layer_uid = document.getElementById("style_layer_modal_footer").querySelector("input[name='layer-uid']").value
    
    // Récupération de la liste des champs
    var columnNameList = null
    map.getLayers().forEach(layer => {
        if (ol.util.getUid(layer) == layer_uid){
            columnNameList = layer.getSource().getFeatures()[0].getKeys()
            var geomColumnNameIndex = columnNameList.indexOf('geometry')
            columnNameList.splice(geomColumnNameIndex, 1)
            columnNameList.sort()   
        }
    })

    // pour chaque champ on créé l'élément html sur la base du prorotype
    columnNameList.forEach(column => {
        var prototype = document.getElementById("expression_editor_field_list").getAttribute("prototype")

        prototype = prototype.replace(/__FIELDNAME__/g, column)
        document.getElementById("expression_editor_field_list").insertAdjacentHTML('beforeend', prototype)
    })

    document.getElementById("expression_editor_bloc").classList.remove("hide")
}

/**
 * Initialisation de la fenêtre d'édition d'expression
 */
initExpressionEditorPanel = function(){
    document.getElementById("expression_editor_field_list").innerHTML = ''
    document.getElementById("expression_editor_field_value").innerHTML = ''
    document.getElementById("expression_editor_textarea").value = ''
    document.getElementById("expression_editor_conditional_style_id").value = ''
}

/**
 * Listing des valeurs possible associé à un champ
 */
document.getElementById("expression_editor_list_values_btn").addEventListener("click", event => {
    // Récupération du layer_uid
    var layer_uid = document.getElementById("style_layer_modal_footer").querySelector("input[name='layer-uid']").value

    // On vide la liste des champ actuelle
    document.getElementById("expression_editor_field_value").innerHTML = ''

    // Récupération du champ sélectionné
    var fieldName = document.getElementById("expression_editor_field_list").querySelector("li.expression-field-selected").innerHTML

    // Récupération des valeur possible
    var values = []
    var isNumeric
    var isBoolean
    map.getLayers().forEach(layer => {
        if (ol.util.getUid(layer) == layer_uid){
            layer.getSource().getFeatures().forEach(feature => {
                var current_value = feature.get(fieldName)

                // Permet d'identifier si toutes les valeur sont numérique
                if (isNumeric == true || isNumeric == null){
                    if (typeof current_value == 'number'){
                        isNumeric = true
                    } else {
                        isNumeric = false
                    }
                }

                // Permet d'identifier si toutes les valeur sont booléenne
                if (isBoolean == true || isBoolean == null){
                    if (typeof current_value == 'boolean'){
                        isBoolean = true
                    } else {
                        isBoolean = false
                    }
                }

                if (! values.includes(current_value)){
                    values.push(current_value)
                }               
            })
        }
    })
  
    values.sort()

    values.forEach(value => {
        // Si on est pas sur des valeur numérique ou booléenne alors il faut ajouter des apostrophes
        if (isNumeric == false && isBoolean == false){
            value = "'" + value + "'"
        }

        // Ajout de la valeur dans la liste
        var prototype = document.getElementById("expression_editor_field_value").getAttribute("prototype")
        prototype = prototype.replace(/__VALUE__/g, value)
        document.getElementById("expression_editor_field_value").insertAdjacentHTML('beforeend', prototype)
    })    
})

/**
 * Annulation de l'édition d'une expression
 */
document.getElementById("expression_editor_cancel_btn").addEventListener("click", event => {
    document.getElementById("expression_editor_bloc").classList.add("hide")
})

/**
 * Validation de l'édition d'une expression
 */
document.getElementById("expression_editor_valid_btn").addEventListener("click", event => {
    // Récupération de l'identifiant du style dont l'expression est en cours d'édition
    var style_id = document.getElementById("expression_editor_conditional_style_id").value
    var geomType = style_id.split('_')[0].toLowerCase()

    // Récupération de l'expression
    var expression = document.getElementById("expression_editor_textarea").value

    var conditionalStyle = document.getElementById("style-layer-modal").querySelector(".conditional-style[conditional-style-id=" + style_id + "]")

    conditionalStyle.querySelector(".conditional_style_" + geomType + "_expression").value = expression

    // Fermeture de la fenêtre d'édition de l'expression
    document.getElementById("expression_editor_bloc").classList.add("hide")
})
