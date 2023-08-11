// On est sur du A3 donc 420 x 297
/*const dims = {
    a0: [1189, 841],
    a1: [841, 594],
    a2: [594, 420],
    a3: [420, 297],
    a4: [297, 210],
    a5: [210, 148],
};*/

const map_dims = {
    /*a0: [1189, 841],
    a1: [841, 594],
    a2: [594, 420],*/
    a3: [325, 267],
    /*a4: [297, 210],
    a5: [210, 148],*/
};

const logo_img = new Image()
logo_img.src = '/static/images/logo_structure.png'
const logo_img_height = 30 // A adpter si on autorise plusieurs formats
const logo_img_width = Math.round(logo_img_height * logo_img.width / logo_img.height)

const north_arrow_img = new Image()
north_arrow_img.src = '/static/images/north_arrow.png'

// source_bloc_y est une variable partégé entre
// plusieur fonction donc on la rend globale
// En effet la position de la flèche nord, et de l'echelle 
// dépend de la position du bloc source (lui même fonction du nombre de source)
var source_bloc_y

const exportButton = document.getElementById("pdf-generator-submit")
exportButton.addEventListener("click", event => {
    map2pdf()
})

/**
 * Converti la carte en PDF
 */
var map2pdf = function () {
    exportButton.disabled = true
    document.getElementById("pdf-generator-loading-spinner").classList.remove("hide")

    const format = "a3"

    // Déclaration du fichier PDF
    const pdf = new jspdf.jsPDF('landscape', undefined, format)

    // Création du header
    createPdfHeader(pdf)

    // Création du contenu du PDF
    // INFO : l'export du pdf (pdf.save()) se fait dans cette fonction car il ne peut 
    // être réaliser que lorsque la carte a été complétement chargé

    const map_dim = map_dims[format]
    createPdfContent(pdf, map_dim)
}


var createPdfHeader = function (pdf) {
    // Ajout du logo dans l'entête
    pdf.addImage(logo_img, 'JPEG', 0, 0, logo_img_width, logo_img_height)

    // Ajout du titre
    pdf.setFontSize(24)
    let title = document.getElementById("pdf-generator-title-input").value

    let title_max_width = 420 - logo_img_width - 60

    tab_title = pdf.splitTextToSize(title, title_max_width)
    title_y = Math.round(15 / tab_title.length)
    pdf.text(tab_title, 210, title_y, { align: "center", baseline: "middle" })

}

var createPdfContent = function (pdf, map_dim) {

    const resolution = 120
    const width = Math.round((map_dim[0] * resolution) / 25.4)
    const height = Math.round((map_dim[1] * resolution) / 25.4)
    const size = map.getSize()
    const viewResolution = map.getView().getResolution()
    const center = map.getView().getCenter()

    // On modfie l'élément html de la carte pour que le format
    // corresponde au format de la carte sur le PDF
    const printSize = [width, height]
    const scaling = Math.min(width / size[0], height / size[1])
    const print_resolution = viewResolution / scaling
    resizeMap(printSize, print_resolution, center)

    /**
     * Une fois la carte chargé, on l'ajoute au PDF
     */
    map.once('rendercomplete', async function () {

        // Ajout de la carte au PDF
        addMapToPDF(pdf, width, height, map_dim)

        // Ajout de la légende au PDF
        await addLegendToPDF(pdf)

        addSourceToPDF(pdf)

        await addScaleAndNorthArrowToPDF(pdf, map_dim)

        addBorderToPDF(pdf)

        // Création du PDF
        pdf.save('map.pdf');

        // Fermeture du modal 
        pdfGeneratorModal.hide()

        // Réinitialisation de champ "Titre de la carte"
        document.getElementById("pdf-generator-title-input").value = ''

        // Remise de l'élément html de la carte au format initial
        resizeMap(size, viewResolution, center)
        exportButton.disabled = false;
        document.getElementById("pdf-generator-loading-spinner").classList.add("hide")

    })
}

var resizeMap = function (size, resolution, center) {
    map.setSize(size)
    map.getView().setResolution(resolution)
    map.getView().setCenter(center)
}

var addMapToPDF = function (pdf, width, height, map_dim) {

    const mapCanvas = document.createElement('canvas')
    mapCanvas.width = width
    mapCanvas.height = height
    const mapContext = mapCanvas.getContext('2d')
    Array.prototype.forEach.call(
        document.querySelectorAll('.ol-layer canvas'),
        function (canvas) {
            if (canvas.width > 0) {
                const opacity = canvas.parentNode.style.opacity
                //mapContext.globalAlpha = opacity === '' ? 1 : Number(opacity)
                if (opacity === '') {
                    mapContext.globalAlpha = 1
                } else {
                    mapContext.globalAlpha = Number(opacity)
                }
                const transform = canvas.style.transform
                // Get the transform parameters from the style's transform matrix
                const matrix = transform
                    .match(/^matrix\(([^\(]*)\)$/)[1]
                    .split(',')
                    .map(Number);
                // Apply the transform to the export map context
                CanvasRenderingContext2D.prototype.setTransform.apply(
                    mapContext,
                    matrix
                )
                mapContext.drawImage(canvas, 0, 0);
            }
        }
    );

    // Ajout de la carte au PDF
    pdf.addImage(mapCanvas.toDataURL('image/jpeg'), 'JPEG', 95, 30, map_dim[0], map_dim[1])
}

var addLegendToPDF = async function (pdf) {
    /**
     * Création de la légende
     */
    let list_of_layer = document.querySelectorAll("#layer_list li")

    let line_height = 8
    let line_y = 40

    // Alignement des titre de légende
    const line_x = 10

    const symbol_position_x = 15
    const symbol_label_x = 25

    for (var i = 0; i < list_of_layer.length; i++) {
        if (list_of_layer[i].querySelector("input[type='checkbox']").checked) {
            //Récupération du nom de la couche
            layer_name = list_of_layer[i].querySelector(".layer-name").innerHTML

            //On définit la taille du texte de la légende
            pdf.setFontSize(12)
            // On veut que le nom de la couche soit en gras
            pdf.setFont("helvetica", "bold")
            // Ecriture du nom des couches
            let tab_layer_name = pdf.splitTextToSize(layer_name, 75)
            tab_layer_name.forEach((line, index) => {
                pdf.text(line, line_x, line_y, { align: "left" })

                //
                if (index < tab_layer_name.length - 1) {
                    line_y += 5
                } else {
                    line_y += 2
                }
            })

            /**
             * Ajout des symboles
             */

            // Le label du symbol doit être en "normal"
            pdf.setFont("helvetica", "normal")

            // Récupération du bloc de symbol
            let layer_legend = list_of_layer[i].querySelector(".layer-legend")

            // Ou déroule le bloc de symbole si il ne l'ai pas déjà
            let need_to_be_hide = false
            if (layer_legend.classList.contains("hide")) {
                layer_legend.classList.remove("hide")
                need_to_be_hide = true
            }

            // Transformation de chaque symbol en image pour intégration dans le PDF

            // On défini l'opacité du symbol sur le PDF
            pdf.setGState(new pdf.GState({ opacity: 1 }));

            var l_legend_row = layer_legend.querySelectorAll(".legend-row")
            for (let i = 0; i < l_legend_row.length; i++) {
                let legend_row = l_legend_row[i]

                html_symbol = legend_row.querySelector(".legend-col-symbol")


                // Récupération du label associé au symbol
                symbole_label = legend_row.querySelector(".legend-col-label").innerHTML
                tab_symbole_label = pdf.splitTextToSize(symbole_label, 50)
                tab_symbole_label.forEach((symbole_label, index) => {
                    if (index > 0) {
                        line_y += 5
                    }

                    pdf.text(symbole_label, symbol_label_x, line_y, { align: "left", baseline: "top" })
                })

                var symbol_y = line_y - ((tab_symbole_label.length - 1) * 5 / 2)

                if (html_symbol.querySelector("div").classList.contains("legend-poly")) {

                    //Transformation du symbol de type "polygon" en canvas pour intégration dans le pdf
                    await html2canvas(html_symbol).then(canvas => {
                        pdf.addImage(canvas.toDataURL('image/jpeg'), 'JPEG', symbol_position_x, symbol_y, 9, 4)
                    })

                    line_y += 6
                } else if (html_symbol.querySelector("div").classList.contains("legend-line")) {
                    //line_y += 2
                    symbol_y += 1
                    //Transformation du symbol de type "line" en canvas pour intégration dans le pdf
                    await html2canvas(html_symbol).then(canvas => {
                        pdf.addImage(canvas.toDataURL('image/jpeg'), 'JPEG', symbol_position_x, symbol_y, 9, 1)
                    })

                    line_y += 6
                } else if (html_symbol.querySelector("div").classList.contains("legend-point")) {
                    //Transformation du symbol de type "point" en canvas pour intégration dans le pdf

                    await html2canvas(html_symbol).then(canvas => {
                        pdf.addImage(canvas.toDataURL('image/jpeg'), 'JPEG', symbol_position_x, symbol_y, 9, 4)
                    })

                    line_y += 6
                } else {
                    //Transformation des autres type de symbol en canvas pour intégration dans le pdf
                    await html2canvas(html_symbol).then(canvas => {
                        console.log("symbole size : " + canvas.width + " x " + canvas.height)
                        icon_width = canvas.width * 6 / canvas.height
                        pdf.addImage(canvas.toDataURL('image/jpeg'), 'JPEG', symbol_position_x, symbol_y, icon_width, 6)
                    })

                    line_y += 8
                }

            }

            // On ré-enroule le bloc de symbol s'il n'été pas déroulé
            if (need_to_be_hide) {
                layer_legend.classList.add("hide")
            }

            // Espacement pour l'élément de la légende suivant
            line_y += line_height - 5
        }
    }
}

var addSourceToPDF = function (pdf) {
    /**
    * Construction de la liste des sources
    */
    attributions = []
    map.getLayers().forEach(layer => {
        if (layer.getVisible() == true) {
            description_layer = layer.get("description_layer")
            if (description_layer) {
                attribution = description_layer.layer_attribution
                if (attribution) {
                    // On ajoute l'attribution seulement si elle n'est ps déjà dans la liste
                    if (!attributions.includes(attribution)) {
                        attributions.push(attribution)
                    }
                }
            }
        }
    })

    let source_font_size = 10
    pdf.setFontSize(source_font_size)

    let source_bloc_width = 162
    let tab_attributions = pdf.splitTextToSize("Source(s) : " + attributions.sort().join(' ; '), source_bloc_width)
    let source_bloc_height = tab_attributions.length * (source_font_size / 2)

    source_bloc_y = Math.round(297 - source_bloc_height)
    let source_bloc_x = 95

    pdf.setFillColor('#FFFFFF')
    pdf.setDrawColor(0, 0, 0) // Bordure
    pdf.rect(source_bloc_x, source_bloc_y, source_bloc_width, source_bloc_height, 'FD')

    let source_line_y = source_bloc_y + 1
    tab_attributions.forEach((line, index) => {
        pdf.text(line, source_bloc_x + 2, source_line_y, { align: "left", baseline: "top" })

        source_line_y += source_font_size / 2
    })
}

var addScaleAndNorthArrowToPDF = async function (pdf, map_dim) {
    /**
     * Définition de l'emplacement de la fleche nord
     */
    let north_arrow_x = 100
    let north_arrow_y = source_bloc_y - 10

    /**
     * Définition de l'emplacement de l'echelle 
     */
    let pdf_scale_x = north_arrow_x + 10
    let pdf_scale_y = source_bloc_y - 9
    let pdf_scale_height = 7

    let html_scale_width = document.getElementsByClassName("ol-scale-line")[0].offsetWidth

    let pdf_scale_width = html_scale_width * map_dim[0] / document.querySelectorAll('.ol-layer canvas')[0].offsetWidth

    /**
     * Définition de l'emplacement du bloc "fleche nord" et "scale"
     */
    let north_arrox_and_scale_bloc_x = 95
    let north_arrox_and_scale_bloc_y = source_bloc_y - 12
    let north_arrox_and_scale_bloc_width = pdf_scale_width + 20
    let north_arrox_and_scale_bloc_height = 12

    /**
     * Ajout des élément fleche nord et scale au pdf
     */
    // Bloc
    pdf.setGState(new pdf.GState({ opacity: 0.7 }));
    pdf.setFillColor('#FFFFFF')
    pdf.rect(north_arrox_and_scale_bloc_x, north_arrox_and_scale_bloc_y, north_arrox_and_scale_bloc_width, north_arrox_and_scale_bloc_height, 'F')
    pdf.setGState(new pdf.GState({ opacity: 1 }));

    // Fleche nord
    pdf.addImage(north_arrow_img, 'PNG', north_arrow_x, north_arrow_y, 5, 8)

    // Scale (a partir du html)
    await html2canvas(document.getElementsByClassName("ol-scale-line")[0]).then(canvas => {

        //pdf.setGState(new pdf.GState({opacity: 0.9}));
        pdf.addImage(canvas.toDataURL('image/jpeg'), 'JPEG', pdf_scale_x, pdf_scale_y, pdf_scale_width, pdf_scale_height)
    })
}

var addBorderToPDF = function (pdf) {
    /**
     * Création des bordures
     */
    //Création du contour
    pdf.lines([[0, 0], [420, 0], [0, 297], [-420, 0], [0, -297]], 0, 0, [1, 1], 'S', true)

    //Création d'une ligne séparant le header du reste
    pdf.line(0, 30, 420, 30, 'S');

    //Création d'une ligne séparant le logo du titre
    pdf.line(logo_img_width, 0, logo_img_width, 30, 'S');

    //Créatin d'une ligne séparant le bloc de légende et la carte
    pdf.line(95, 30, 95, 297, 'S');
}





