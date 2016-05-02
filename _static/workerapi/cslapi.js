processorReady = false;

workaholic = new function () {
    this.initProcessor = initProcessor;
    this.registerCitation = registerCitation;

    var worker = new Worker('_static/workers/csl.js');
    this.worker = worker;
    
    function initProcessor(styleName, localeName) {
        // Instantiates the processor
        worker.postMessage({
            command: 'initProcessor',
            styleName: styleName,
            localeName: localeName
        });
    }

    function registerCitation(citation, preCitations, postCitations) {
        // Use return from getCitationID and data fetched from
        // selections in the UI to submit an edit request
        if (!processorReady) return;
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

    function setCitations(citations) {
        var nodes = document.getElementsByClassName('citation');
        // validate
        if (!nodes) {
            if (citations.length) {
                alert('ERROR: have citations, but no document nodes to set them in');
            }
            return;
        }
        if (citations.length > nodes.length) {
            alert('ERROR: have more citations than document nodes to set them in');
            return;
        }
        // process
        for (var i=0,ilen=citations.length;i<ilen;i++) {
            var citation = citations[i];
            var pos = citation[0];
            var txt = citation[1];
            var node = nodes[i];
            node.innerHTML = txt;
        }
    }

    worker.onmessage = function(e) {
        var d = e.data;
        switch(d.command) {
        case 'initProcessor':
            doCallback(d, function(d) {
                processorReady = true;
                console.log('Ready for action! '+processorReady);
            });
            break;
        case 'registerCitation':
            doCallback(d, function(d) {
                setCitations(d.citations);
            });
            break;
        case 'refreshCitations':
            doCallback(d, function(d) {
                setCitations(d.citations);
            });
            break;
        }
    }
}

function insertCitation(pos) {
    // Inserts a citation at the specified document
    // position of not already present.
}

function removeCitation(pos) {
    // Removes citation at the specified document
    // position if present.
}

function getCitationIDs() {
    // Return a list of all citation IDs in
    // document order. Return as two elements:
    // a list of previous citationID/note-numbers; and a
    // list of subsequent citationID/note-numbers. A citation
    // currently in process of insertion is
    // omitted.
}

function getBibliography() {
    // Get the bibliography
}

function updateBibliography() {
    // Update the bibliography if present.
}

function generateCitationID() {
    // Generates a random key for a newly minted citation.
}
