workaholic = new function () {
    this.initProcessor = initProcessor;
    this.registerCitation = registerCitation;

    var worker = new Worker('_static/offthread/worker.js');
    
    function initProcessor(styleName, localeName) {
        // Instantiates the processor
        config.processorReady = false;
        var citations = document.getElementsByClassName('citation');
        for (var i=citations.length-1;i>-1;i--) {
            citations[i].parentNode.removeChild(citations[i]);
        }
        var bibContainer = document.getElementById('bibliography-container');
        bibContainer.hidden = true;
        var footnoteContainer = document.getElementById('footnote-container');
        footnoteContainer.hidden = true;
        hideAllFootnotes();
        worker.postMessage({
            command: 'initProcessor',
            styleName: styleName,
            localeName: localeName,
            citationByIndex: localStorage.getItem('citationByIndex')
        });
    }

    function registerCitation(citation, preCitations, postCitations) {
        // Use return from getCitationID and data fetched from
        // selections in the UI to submit an edit request
        if (!config.processorReady) return;
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
                config.mode = d.xclass;
                console.log('xclass: '+config.mode);
                removeCiteMenu();
                config.processorReady = true;
                rebuildCitations(d.rebuildData);
            });
            break;
        case 'registerCitation':
            doCallback(d, function(d) {
                config.citationByIndex = d.citationByIndex.slice();
                setCitations(d.citations);
                setBibliography(d.bibliography);
                removeCiteMenu();
                config.processorReady = true;
            });
            break;
        }
    }
}
