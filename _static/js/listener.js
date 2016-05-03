window.addEventListener('load', function() {
    workaholic.initProcessor('chicago-author-date', 'en-US');
    document.body.addEventListener('click', function(e) {
        if (e.target.classList.contains('citeme')) {
            var node = e.target;
            if (document.getElementById('cite-menu')) return;

            var menu = document.createElement('div');
            menu.setAttribute('id', 'cite-menu');
            menu.innerHTML = '<div class="menu">'
            var tmpl = '<input id="%%ID%%" type="checkbox" name="cite-menu-item" value="%%ID%%">%%TITLE%%<br/>'
            for (var i=0,ilen=config.itemData.length;i<ilen;i++) {
                var datum = config.itemData[i];
                menu.innerHTML += tmpl.split('%%ID%%').join(datum.id).replace('%%TITLE%%', datum.title);
            }
            menu.innerHTML += '<button type="button">Save</button>'
            menu.innerHTML += '</div>';
            node.appendChild(menu);

            // XXX If no citation attached, menu is blank
            if (node.nextSibling && node.nextSibling.classList && node.nextSibling.classList.contains('citation')) {
                // XXX If citation is attached, index should be in the map, so use it.
                var citemeIndex = getCiteMeIndex(node);
                var pos = config.citationPositionMap[citemeIndex];
                var citation = config.citationByIndex[pos];
                console.log("This should be a citation: "+citation);
                var itemIDs = [for (item of citation.citationItems) item.id];
                for (var i=0,ilen=itemIDs.length;i<ilen;i++) {
                    var menuItem = document.getElementById(itemIDs[i]);
                    menuItem.checked = true;
                }
            }
            button.addEventListener('click', removeCiteMenu);
        }
    });
});
