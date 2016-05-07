function domClearDocument() {
    debug('domClearDocument()');
    domRemoveCitations();
    domHideBibliographySection();
    domHideFootnoteSection();
    domHideFootnotes();
    domPrepCitations();
}

function domRemoveCitations() {
    var citationNodes = document.getElementsByClassName('citation');
    for (var i=0,ilen=citationNodes.length;i<ilen;i++) {
        citationNodes[0].parentNode.removeChild(citationNodes[0]);
    }
}

function domHideBibliographySection() {
    var bibContainer = document.getElementById('bibliography-container');
    bibContainer.hidden = true;
}

function domHideFootnoteSection() {
    var footnoteContainer = document.getElementById('footnote-container');
    footnoteContainer.hidden = true;
}

function domHideFootnotes() {
    debug('hideAllFootnotes()');
    var footnotes = document.getElementById('footnotes');
    for (var i=0,ilen=footnotes.children.length;i<ilen;i++) {
        footnotes.children[i].hidden = true;
    }
}

function domPrepCitations() {
    debug('domPrepCitations()');
    var positionNodes = document.getElementsByClassName('citeme');
    for (var i=0,ilen=config.citationByIndex.length;i<ilen;i++) {
        var citation = config.citationByIndex[i];
        var positionNode = positionNodes[config.citationIdToPos[citation.citationID]];
        var citationNode = document.createElement('span');
        citationNode.classList.add('citation');
        citationNode.setAttribute('id', citation.citationID);
        positionNode.parentNode.insertBefore(citationNode, positionNode.nextSibling);
    }
}

function domSetNewCitation(currentCitationInfo, citationID) {
    if ("number" !== typeof config.citationIdToPos[citationID]) {
        var citationNode = document.getElementById('citation-breadcrumb');
        citationNode.setAttribute('id', citationID);
        config.citationIdToPos[citationID] = currentCitationInfo.pos;
        config.posToCitationId[currentCitationInfo.pos] = citationID;
    }
}

function finalizeCitation() {
    debug('finalizeCitation()');
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
    var insertingNewCitation = false;
    var next = node.parentNode.nextSibling;
    if (citationItems.length === 0) {
        if (next && next.classList && next.classList.contains('citation')) {
            removeCitation();
        } else {
            node.parentNode.removeChild(node);
        }
        return;
    } else {
        if (!next || !next.classList || !next.classList.contains('citation')) {
            var citationNode = document.createElement('span');
            citationNode.classList.add('citation');
            node.parentNode.parentNode.insertBefore(citationNode, node.parentNode.nextSibling);
            citationNode.setAttribute('id', 'citation-breadcrumb');
            insertingNewCitation = true;
        }
    }

    var info = getCurrentCitationInfo();

    // Get citation details for submission
    var citationNodes = document.getElementsByClassName('citation');
    var splitData = getCitationSplits(citationNodes);
    // Compose the citation.
    var citation;
    if (splitData.citation) {
        citation = splitData.citation;
        citation.citationItems = citationItems;
    } else {
        citation = {
            citationItems: citationItems,
            properties: {
                noteIndex: 0
            }
        }
    }
    if (config.mode === 'note') {
        citation.properties.noteIndex = (splitData.citationsPre.length + 1);
        fixupPrePostNoteNumbers(splitData.citationsPre, splitData.citationsPost);
    }
    // Submit the citation.
    // Remove menu in bounce-back.
    workaholic.registerCitation(citation, splitData.citationsPre, splitData.citationsPost);
};

function setCitations(mode, citeTuples, currentCitationInfo) {
    debug('setCitations()');
    // 
    for (var i=0,ilen=citeTuples.length;i<ilen;i++) {
        var tuple = citeTuples[i];
        var citationIndex = tuple[0];
        var citationText = tuple[1];
        var citationID = tuple[2];
        if (currentCitationInfo) {
            domSetNewCitation(currentCitationInfo, citationID);
        }
    }
    if (mode === 'note') {
        var footnotes = document.getElementsByClassName('footnote-text');
        var footnoteNumbers = document.getElementsByClassName('footnote-number');
    }
    if (mode === 'note') {
        var footnoteContainer = document.getElementById('footnote-container');
        if (citeTuples.length) {
            footnoteContainer.hidden = false;
        } else {
            footnoteContainer.hidden = true;
        }
    }
    var citationNodes = document.getElementsByClassName('citation');
    for (var i=0,ilen=citeTuples.length;i<ilen;i++) {
        var tuple = citeTuples[i];
        var citationNumber = tuple[0];
        var citationText = tuple[1];
        var citationID = tuple[2];
        debug('citationID='+citationID);
        var citationNode = document.getElementById(citationID);
        if (mode === 'note') {
            citationNode.innerHTML = '[' + (citationNumber+1) + ']';
            var idx = config.citationIdToPos[citationID];
            footnotes[idx].parentNode.hidden = false;
            footnotes[idx].innerHTML = citationText;
            footnoteNumbers[idx].innerHTML = "" + (citationNumber+1);
        } else {
            citationNode.innerHTML = citationText;
        }
    }
    fixupNoteNumbers();
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
