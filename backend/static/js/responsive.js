// Affichage du block 'toolbar' lors d'un clique sur le boutton responsive-bt-toolbar
document.getElementById("responsive-bt-toolbar").addEventListener('click', event => {
    document.getElementById("toolbar").style.display = 'block'
    //document.getElementById("toolbar").classList.add(slide-anim) = 'block'
});

// fermeture du block dont l'id est cité comme cible ('target') lors d'un clique sur le boutton class responsive-bt-close
for (var i = 0; i < document.getElementsByClassName("responsive-bt-close").length; i++) {
    document.getElementsByClassName("responsive-bt-close")[i].addEventListener('click', event => {
        target = event.currentTarget.getAttribute('target')
        console.log(target)
        document.getElementById(target).style.display = 'none'
    });
}

// Affichage du block 'layer' lors d'un clique sur le boutton responsive-bt-layers
document.getElementById("responsive-bt-layers").addEventListener('click', event => {
    document.getElementById("layerbar").style.display = 'block'
});
