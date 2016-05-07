function citationAddOrEditHandler(event) {
    debug('citationAddOrEditHandler()');
    var menu = document.getElementById('cite-menu');
    var insertingNewCitation = false;
    var citationItems = getCitationItemIdsFrom(menu);
    var hasCitation = menuHasCitation(menu);

    // If there are no citation items from the menu,
    // then we are either removing an existing citation
    // or doing nothing.
    if (citationItems.length === 0) {
        if (hasCitation) {
            // Remove existing citation
            removeCitation();
        } else {
            // Do nothing
            removeCiteMenu();
        }
        return;
    } else {
        if (!hasCitation) {
            domInsertEmptyCitationMarkerAt(menu);
            insertingNewCitation = true;
        }
    }

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

function removeCitation() {
    debug('removeCitation()');
    var info = getCurrentCitationInfo();

    // Remove citation from DOM
    if (info.citationID) {
        domRemoveCitation(info.citationID);
    }
    
    // Remove citation from citationByIndex, posToCitationId, and citationIdToPos
    // Adjust note numbers in citationByIndex child properties if note style
    removePos = removeIdFromDataSets(config.mode, info.citationID);

    // If we have no citations left, initialize the processor
    // Otherwise, re-insert the first citation in the list to trigger and update
    if (config.citationByIndex.length === 0) {
        localStorage.removeItem('citationByIndex');
        workaholic.initProcessor(config.defaultStyle, config.defaultLocale, config.citationByIndex);
    } else {
        domHideFootnoteAt(removePos);
        var splitData = getCitationSplits();
        splitData.citation.properties.noteIndex = 1;
        config.processorReady = true;
        workaholic.registerCitation(splitData.citation, splitData.citationsPre, splitData.citationsPost);
    }
}

