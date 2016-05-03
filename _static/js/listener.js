window.addEventListener('load', function() {
    buildStyleMenu();
    workaholic.initProcessor(config.defaultStyle, config.defaultLocale);
    document.body.addEventListener('change', function(e) {
        if (e.target.getAttribute('id') === 'citation-styles') {
            config.defaultStyle = e.target.value;
            localStorage.setItem('defaultStyle', config.defaultStyle);
            workaholic.initProcessor(config.defaultStyle, config.defaultLocale);
        }
    });
    document.body.addEventListener('click', function(e) {
        if (e.target.classList.contains('citeme')) {
            var node = e.target;
            if (document.getElementById('cite-menu')) return;

            var citeMenu = document.createElement('div');
            citeMenu.setAttribute('id', 'cite-menu');
            var innerHTML = '<div class="menu">'
            var tmpl = '<input id="%%ID%%" type="checkbox" name="cite-menu-item" value="%%ID%%">%%TITLE%%<br/>'
            for (var i=0,ilen=config.itemData.length;i<ilen;i++) {
                var datum = config.itemData[i];
                innerHTML += tmpl.split('%%ID%%').join(datum.id).replace('%%TITLE%%', datum.title);
            }
            innerHTML += '</div>';
            citeMenu.innerHTML = innerHTML;
            var button = document.createElement('button');
            button.setAttribute('type', 'button');
            button.innerHTML = 'Save';
            var menu = citeMenu.getElementsByClassName('menu')[0];
            menu.appendChild(button);
            node.appendChild(citeMenu);

            // XXX If no citation attached, menu is blank
            if (node.nextSibling && node.nextSibling.classList && node.nextSibling.classList.contains('citation')) {
                // XXX If citation is attached, index should be in the map, so use it.
                var citemeIndex = getCiteMeIndex(node);
                var pos = config.citationPositionMap[citemeIndex];
                var citation = config.citationByIndex[pos];
                console.log("This should be a citation: "+citation);
                var itemIDs = citation.citationItems.map(function(obj){
                    return obj.id;
                });
                for (var i=0,ilen=itemIDs.length;i<ilen;i++) {
                    var menuItem = document.getElementById(itemIDs[i]);
                    menuItem.checked = true;
                }
            }
            button.addEventListener('click', finalizeCitation);
        }
    });
});
