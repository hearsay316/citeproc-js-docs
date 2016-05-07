workaholic = new function () {
    this.initProcessor = initProcessor;
    this.registerCitation = registerCitation;

    var worker = new Worker('_static/offthread/worker.js');
    
    function initProcessor(styleName, localeName, clearDocument) {
        // Instantiates the processor
        debug('initProcessor() [CALL]');
        config.processorReady = false;
        if (clearDocument) {
            clearDocument();
        }
        worker.postMessage({
            command: 'initProcessor',
            styleName: styleName,
            localeName: localeName,
            citationByIndex: config.citationByIndex
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

    function doCallback(d, callback) {
        if (d.result === 'OK') {
            callback(d);
        } else {
            alert('ERROR: '+d.msg);
        }
    }

    worker.onmessage = function(e) {
        var d = e.data;
        switch(d.command) {
        case 'initProcessor':
            doCallback(d, function(d) {
                debug('initProcessor() [RESPONSE]');
                config.mode = d.xclass;
                removeCiteMenu();
                config.processorReady = true;
                rebuildCitations(d.rebuildData);
                setBibliography(d.bibliography);
            });
            break;
        case 'registerCitation':
            doCallback(d, function(d) {
                debug('registerCitation() [RESPONSE]');
                config.citationByIndex = d.citationByIndex;
                setCitations(d.citations);
                setBibliography(d.bibliography);
                localStorage.setItem('citationByIndex', JSON.stringify(config.citationByIndex));
                localStorage.setItem('citationIdToPos', JSON.stringify(config.citationIdToPos));
                localStorage.setItem('posToCitationId', JSON.stringify(config.posToCitationId));
                removeCiteMenu();
                config.processorReady = true;
            });
            break;
        }
    }
}
