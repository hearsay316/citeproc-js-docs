var citationPositionMap = {};

function fixupCitationPositionMap(removeCurrent) {
    console.log('fixupCitationPositionMap()');
    citationPositionMap = {};
    var citemeNodes = document.getElementsByClassName('citeme');
    var citationIndex = 0;
    for (var i=0,ilen=citemeNodes.length;i<ilen;i++) {
        var node = citemeNodes[i];
        if (node.nextSibling && node.nextSibling.classList && node.nextSibling.classList.contains('citation')) {
            if (removeCurrent && node.firstChild) {
                citationByIndex = citationByIndex.slice(0,citationIndex).concat(citationByIndex.slice(citationIndex+1));
                continue;
            }
            citationPositionMap[i] = citationIndex;
            console.log('now '+i+" = "+citationIndex);
            citationIndex += 1;
        }
    }
}

function getCitationSplits() {
    console.log('getCitationSplits()');
    var citationsPre = [];
    var citationsPost = [];
    var current = citationsPre;
    var nodes = document.getElementsByClassName('citation');
    var offset = 0;
    for (var i=0,ilen=nodes.length;i<ilen;i++) {
        var node = nodes[i];
        if (node.previousSibling.firstChild) {
            current = citationsPost;
            if (!node.firstChild) {
                offset = -1;
            }
        } else {
            current.push([citationByIndex[i+offset].citationID, 0]);
            console.log(citationByIndex[i+offset].citationID);
        }
    }
    return [citationsPre, citationsPost];
}

window.addEventListener('load', function() {
    workaholic.initProcessor('chicago-author-date', 'en-US');
    var items = [
        "Geller 2002",
        "West 1934",
        "Allen 1878"
    ]
    function getCiteMeIndex(node) {
        var nodes = document.getElementsByClassName('citeme');
        for (var i=0,ilen=nodes.length;i<ilen;i++) {
            if (nodes[i].firstChild) {
                return i;
            }
        }
        return false;
    }
    function removeCiteMenu() {
        var node = document.getElementById('cite-menu');
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
        var next = node.parentNode.nextSibling;
        if (citationItems.length) {
            // If we have cites to set, assure there is a citation span node in place
            if (!next || !next.classList || !next.classList.contains('citation')) {
                var citationNode = document.createElement('span');
                citationNode.classList.add('citation');
                node.parentNode.parentNode.insertBefore(citationNode, node.parentNode.nextSibling);
            }
        } else {
            // Elsewise, assure that any existing citation span node is removed.
            if (next && next.classList && next.classList.contains('citation')) {
                var citationNode = next;
                citationNode.parentNode.removeChild(citationNode);
                // true removes the existing citation from the database record
                fixupCitationPositionMap(true);
            }
            node.parentNode.removeChild(node);
            return;
        }
        
        
        // Figure out our list position, and cites before and after.
        var prePost = getCitationSplits();
        // Compose the citation.
        var citation = {
            citationItems: citationItems,
            properties: {
                noteIndex: 0
            }
        }
        // Submit the citation.
        // Remove menu in bounce-back.
        workaholic.registerCitation(citation, prePost[0], prePost[1]);
    };
    document.body.addEventListener('click', function(e) {
        if (e.target.classList.contains('citeme')) {
            var node = e.target;
            if (document.getElementById('cite-menu')) return;

            var menu = document.createElement('div');
            menu.setAttribute('id', 'cite-menu');
            menu.innerHTML = '<div class="menu">'
                + '<input id="item01" type="checkbox" name="cite-menu-item" value="item01">Geller 2002<br/>'
                + '<input id="item02" type="checkbox" name="cite-menu-item" value="item02">West 1934<br/>'
                + '<input id="item03" type="checkbox" name="cite-menu-item" value="item03">Allen 1878<br/>'
                + '</div>';
            var button = document.createElement('button');
            button.setAttribute('type', 'button');
            button.innerHTML = 'Save';
            menu.firstChild.appendChild(button);
            node.appendChild(menu);

            // XXX If no citation attached, menu is blank
            if (node.nextSibling && node.nextSibling.classList && node.nextSibling.classList.contains('citation')) {
                // XXX If citation is attached, index should be in the map, so use it.
                var citemeIndex = getCiteMeIndex(node);
                var pos = citationPositionMap[citemeIndex];
                var citation = citationByIndex[pos];
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
