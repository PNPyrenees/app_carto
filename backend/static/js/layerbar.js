/**
 * Gestion du drag and drop dans la liste des couches
 */
let selected = null

// création de l'objet temporaire permettant
// de visualiser la zone de dépôt
let blank_obj = document.createElement('li');
blank_obj.id = "drag_and_drop_blank"

function dragOver(e) {
  if (selected != e.target){
    if (isBefore(selected, e.target)) {
      e.target.parentNode.insertBefore(blank_obj, e.target)
    } else {
      e.target.parentNode.insertBefore(blank_obj, e.target.nextSibling)
    }
  } else {
    if (document.getElementById("drag_and_drop_blank")){
      document.getElementById("drag_and_drop_blank").remove()
    }
  }
}

function dragEnd(e) {
  if (document.getElementById("drag_and_drop_blank")){
    if (isBefore(selected, e.target)) {
      e.target.parentNode.insertBefore(selected, blank_obj.target)
    } else {
      e.target.parentNode.insertBefore(selected, blank_obj.nextSibling)
    }
  }
  selected.style.opacity = 1
  document.getElementById("drag_and_drop_blank").remove()

  changeLayerOrder()

  selected = null
}

function dragStart(e) {
  e.dataTransfer.effectAllowed = 'move'
  e.dataTransfer.setData('text/plain', null)
  selected = e.target
  selected.style.opacity = 0.5
}

function isBefore(el1, el2) {
  let cur
  if (el2.parentNode === el1.parentNode) {
    for (cur = el1.previousSibling; cur; cur = cur.previousSibling) {
      if (cur === el2) return true
    }
  }
  return false;
}

/**
 * Gestion de l'affichage de la couche 
 * sur la carte
 */
//document.getElementsByClassName("checkbox-layer")