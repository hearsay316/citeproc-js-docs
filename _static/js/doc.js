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

function setCitations(citations) {
    var citationNodes = document.getElementsByClassName('citation');
    // validate
    if (!citationNodes) {
        if (citations.length) {
            alert('ERROR: have citations, but no document nodes to set them in');
        }
        return;
    }
    
    if (citations.length > citationNodes.length) {
        alert('ERROR: have more citations than document nodes to set them in');
        return;
    }
    // process
    for (var i=0,ilen=citations.length;i<ilen;i++) {
        var citation = citations[i];
        var index = citation[0];
        var txt = citation[1];
        var citationNode = citationNodes[index];
        fixupCitationPositionMap();
        citationNode.innerHTML = txt;
    }
    var node = document.getElementById('cite-menu');
    node.parentNode.removeChild(node);
}

function setBibliography() {
    
}

function setFootnotes() {

}

