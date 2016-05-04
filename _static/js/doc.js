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
        } else {
            // If no citation and no selections, just close menu
            node.parentNode.removeChild(node);
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
        citation.properties.noteIndex = (splitData.citationsPre.length+1);
    } else {
        citation = {
            citationItems: citationItems,
            properties: {
                noteIndex: (splitData.citationsPre.length+1)
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
    if (!data || !data[1] || data[1].length === 0) {
        bibContainer.hidden = true;
        return;
    };
    var bib = document.getElementById('bibliography');
    bib.innerHTML = data[1].join('\n');
    var entries = document.getElementsByClassName('csl-entry');
    if (data[0].hangingindent) {
        for (var i=0,ilen=entries.length;i<ilen;i++) {
            var entry = entries[i];
            entry.setAttribute('style', 'padding-left: 1.3em;text-indent: -1.3em;');
        }
    } else if (data[0]['second-field-align']) {
        for (var i=0,ilen=entries.length;i<ilen;i++) {
            var entry = entries[i];
            entry.setAttribute('style', 'white-space: nowrap;');
        }
        var numbers = document.getElementsByClassName('csl-left-margin');
        for (var i=0,ilen=numbers.length;i<ilen;i++) {
            var number = numbers[i];
            number.setAttribute('style', 'float: left;padding-right: 0.3em;');
        }
        var texts = document.getElementsByClassName('csl-right-inline');
        for (var i=0,ilen=texts.length;i<ilen;i++) {
            var text = texts[i];
            text.setAttribute('style', 'display: inline-block;white-space: normal;');
        }
    }
    bibContainer.hidden = false;
}
