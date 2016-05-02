window.addEventListener('load', function() {
    workaholic.initProcessor('chicago-author-date', 'en-US');
    var items = [
        "Geller 2002",
        "West 1934",
        "Allen 1878"
    ]
    function removeCiteMenu() {
        var node = document.getElementById('cite-menu');
        var next = node.parentNode.nextSibling;
        if (!next || !next.classList || !next.classList.contains('citation')) {
            var citationNode = document.createElement('span');
            citationNode.classList.add('citation');
            node.parentNode.parentNode.insertBefore(citationNode, node.parentNode.nextSibling);
        }
        // Get the cite itemIDs
        var citationItems = [];
        var checkboxes = node.getElementsByTagName('input');
        for (var i=0,ilen=checkboxes.length;i<ilen;i++) {
            var checkbox = checkboxes[i];
            if (checkbox.checked) {
                citationItems.push({
                    id: checkbox.getAttribute('value')
                });
            }
        }
        // Figure out our list position, and cites before and after.
        var notePosition = 1;
        var citationsPre = [];
        var citationsPost = [];
        // Compose the citation.
        var citation = {
            citationItems: citationItems,
            properties: {
                noteIndex: 1
            }
        }
        // Submit the citation.
        workaholic.registerCitation(citation, citationsPre, citationsPost);

        // On the bounce-back, remove any existing cite from this location,
        // and insert the new one. Done.

        // Remove the cite menu in the bounce-back -- it's our position marker!

        node.parentNode.removeChild(node);
    };
    document.body.addEventListener('click', function(e) {
        if (e.target.classList.contains('citeme')) {
            var node = e.target;
            if (node.nextSibling && node.nextSibling.getAttribute && node.nextSibling.getAttribute('id') === 'cite-menu') return;
            if (document.getElementById('cite-menu')) return;
            var menu = document.createElement('div');
            menu.setAttribute('id', 'cite-menu');
            menu.innerHTML = '<div class="menu">'
                + '<input type="checkbox" name="cite-menu-item" value="item01">Geller 2002<br/>'
                + '<input type="checkbox" name="cite-menu-item" value="item02">West 1934<br/>'
                + '<input type="checkbox" name="cite-menu-item" value="item03">Allen 1878<br/>'
                + '</div>';
            var button = document.createElement('button');
            button.setAttribute('type', 'button');
            button.innerHTML = 'Save';
            menu.firstChild.appendChild(button);
            //node.parentNode.insertBefore(menu, node.nextSibling);
            node.appendChild(menu);
            button.addEventListener('click', removeCiteMenu);
        } else if (e.target.getAttribute('name') === 'cite-menu-item') {
            var node = e.target;
            var citemeNode = e.target.parentNode.parentNode.parentNode;
            var nodes = document.getElementsByClassName('citeme');

            var citationPositions = [];

            for (var i=0,ilen=nodes.length;i<ilen;i++) {
                if (nodes[i].firstChild) {
                    // Whether we include this or not depends on whether one of
                    // the boxes will be ticked when this is all done. So go look.
                    var checkboxes = node.parentNode.getElementsByTagName('input');
                    for (var j=0,jlen=checkboxes.length;j<jlen;j++) {
                        var checkbox = checkboxes[j];
                        if (checkbox.checked) {
                            citationPositions.push(i);
                            break;
                        }
                    }
                } else if (citemeNode.nextSibling && citemeNode.nextSibling.classList && citemeNode.classList.contains('citation')) {
                    citationPositions.push(i);
                }
            }
            //localStorage.setItem('citationPositions', JSON.stringify(citationPositions));
        }
    });
});
