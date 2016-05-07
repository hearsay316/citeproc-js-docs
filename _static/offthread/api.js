workaholic = new function () {
    this.initProcessor = initProcessor;
    this.registerCitation = registerCitation;

    var worker = new Worker('_static/offthread/worker.js');
    
    function initProcessor(styleName, localeName, citationByIndex) {
        // Instantiates the processor
        debug('initProcessor() [CALL]');
        config.processorReady = false;
        if (!citationByIndex) {
            citationByIndex = {};
        }
        domClearDocument();
        worker.postMessage({
            command: 'initProcessor',
            styleName: styleName,
            localeName: localeName,
            citationByIndex: citationByIndex
        });
    }

    function registerCitation(citation, preCitations, postCitations) {
        // Use return from getCitationID and data fetched from
        // selections in the UI to submit an edit request
        if (!config.processorReady) return;
        debug('registerCitation() [CALL]');
        config.processorReady = false;
        worker.postMessage({
            command: 'registerCitation',
            citation: citation,
            preCitations: preCitations,
            postCitations: postCitations
        });
    }

    worker.onmessage = function(e) {
        var d = e.data;
        switch(d.command) {
        case 'initProcessor':
            debug('initProcessor() [RESPONSE]');
            removeCiteMenu();
            config.mode = d.xclass;
            var citationData = convertRebuildDataToCitationData(d.rebuildData);
            domSetCitations(config.mode, citationData);
            domSetBibliography(d.bibliographyData);
            config.processorReady = true;
            break;
        case 'registerCitation':
            debug('registerCitation() [RESPONSE]');
            config.citationByIndex = d.citationByIndex;
            var currentCitationInfo = getCurrentCitationInfo();
            domSetCitations(config.mode, d.citationData, currentCitationInfo);
            domSetBibliography(d.bibliographyData);
            localStorage.setItem('citationByIndex', JSON.stringify(config.citationByIndex));
            localStorage.setItem('citationIdToPos', JSON.stringify(config.citationIdToPos));
            localStorage.setItem('posToCitationId', JSON.stringify(config.posToCitationId));
            removeCiteMenu();
            config.processorReady = true;
            break;
        }
    }
}
