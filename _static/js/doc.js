function finalizeCitation() {
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
            // true removes the existing citation from the database record
            fixupCitationPositionMap(true);
        }
        //node.parentNode.removeChild(node);
        return;
    }
    

    // Figure out our list position, and cites before and after.
    var nodes = document.getElementsByClassName('citation');
    var splitData = getCitationSplits(nodes);
    // Compose the citation.
    var citation;
    if (splitData.citation) {
        citation = splitData.citation;
        citation.citationItems = citationItems;
        citation.properties.noteIndex = splitData.citationsPre.length;
    } else {
        citation = {
            citationItems: citationItems,
            properties: {
                noteIndex: splitData.citationsPre.length
            }
        }
    }
    // Submit the citation.
    // Remove menu in bounce-back.
    workaholic.registerCitation(citation, splitData.citationsPre, splitData.citationsPost);
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
    if (config.mode === 'note') {
        var footnoteContainer = document.getElementById('footnote-container');
        footnoteContainer.hidden = false;
        var footnotes = document.getElementsByClassName('footnote-text');
    }
    for (var i=0,ilen=citations.length;i<ilen;i++) {
        var citation = citations[i];
        var index = citation[0];
        var txt = citation[1];
        var citationNode = citationNodes[index];
        fixupCitationPositionMap();
        if (config.mode === 'note') {
            var nodeIndex = config.citationPositionReverseMap[index];
            citationNode.innerHTML = '[' + (index+1) + ']';
            footnotes[nodeIndex].parentNode.hidden = false;
            footnotes[nodeIndex].innerHTML = txt;
        } else {
            citationNode.innerHTML = txt;
        }
    }
    var footnoteNumber = 1;
    var footnoteNumbers = document.getElementsByClassName('footnote-number');
    for (var i=0,ilen=footnoteNumbers.length;i<ilen;i++) {
        if (!footnoteNumbers[i].parentNode.hidden) {
            citationNodes[footnoteNumber-1].innerHTML = '[' + footnoteNumber + ']';
            footnoteNumbers[i].innerHTML = '' + footnoteNumber;
            footnoteNumber++;
        }
    }
}

function setBibliography(data) {
    var bibContainer = document.getElementById('bibliography-container');
    if (!data) {
        bibContainer.hidden = true;
        return;
    };
    var bib = document.getElementById('bibliography');
    bib.innerHTML = data.join('\n');
    bibContainer.hidden = false;
}
