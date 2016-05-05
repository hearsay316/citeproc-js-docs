function debug (txt) {
    if (config.debug) {
        console.log('*** '+txt);
    }
}

var config = {
    debug: true,
    mode: 'note',
    defaultLocale: 'en-US',
    defaultStyle: 'jm-indigobook-law-review',
    posToCitationId: {},
    citationIdToPos: {},
    processorReady: false,
    citationByIndex: [],
    itemData: [
        {
            title: "Geller 2002",
            id: "item01"
        },
        {
            title: "West 1934",
            id: "item02"
        },
        {
            title: "Allen 1878",
            id: "item03"
        },
        {
            title: "American case",
            id: "item04"
        },
        {
            title: "British case",
            id: "item05"
        }
    ],
    styleData: [
        {
            title: "American Medical Association",
            id: "american-medical-association"
        },
        {
            title: "Chicago Manual of Style 16th edition (author-date)",
            id: "chicago-author-date"
        },
        {
            title: "JM Chicago Manual of Style 16th edition (full note)",
            id: "jm-chicago-fullnote-bibliography"
        },
        {
            title: "JM Indigo Book",
            id: "jm-indigobook"
        },
        {
            title: "JM Indigo Book (law reviews)",
            id: "jm-indigobook-law-review"
        },
        {
            title: "OSCOLA - Oxford Standard for Citation of Legal Authorities",
            id: "jm-oscola"
        }
    ]
}

function safeStorageGet(key, fallback) {
    var ret;
    var val = localStorage.getItem(key);
    if (!val) {
        debug('No value in storage!');
        ret = fallback;
    } else {
        try {
            ret = JSON.parse(val);
        } catch (e) {
            debug('JSON parse error! '+key+" "+val);
            ret = fallback;
        }
    }
    config[key] = ret;
    return ret;
}

safeStorageGet('citationIdToPos', {});
safeStorageGet('posToCitationId', {});
safeStorageGet('citationByIndex', []);

// Validate. All citation IDs and positions must be in maps,
// and vice-a-versa
function validateStorage () {
    var seenCitationIDs = {};
    for (var i=config.citationByIndex.length-1;i>-1;i--) {
        var citation = config.citationByIndex[i];
        if ("number" === typeof config.citationIdToPos[citation.citationID]) {
            seenCitationIDs[citation.citationID] = true;
        } else {
            debug('WARNING: removing unindexed citation from storage');
            config.citationByIndex = config.citationByIndex.slice(0, i).concat(config.citationByIndex.slice(i+1));
        }
    }
    for (var key in config.citationIdToPos) {
        if (!seenCitationIDs[key]) {
            debug('WARNING: removing orphan index entry from storage');
            delete config.citationIdToPos[key];
        }
    }
    config.posToCitationId = {};
    for (var i=0,ilen=config.citationByIndex.length;i<ilen;i++) {
        var citation = config.citationByIndex[i];
        config.posToCitationId[config.citationIdToPos[citation.citationID]] = citation.citationID;
    }
    for (var i=0,ilen=config.citationByIndex.length;i<ilen;i++) {
        if (config.mode === 'note') {
            config.citationByIndex[i].properties.noteIndex = (i+1);
        } else {
            config.citationByIndex[i].properties.noteIndex = 0;
        }
    }
    localStorage.setItem('citationIdToPos', JSON.stringify(config.citationIdToPos));
    localStorage.setItem('posToCitationId', JSON.stringify(config.posToCitationId));
    localStorage.setItem('citationByIndex', JSON.stringify(config.citationByIndex));
    debug('CONFIG citationByIndex: '+JSON.stringify(config.citationByIndex.map(function(obj){return obj.citationID})));
    debug('CONFIG citationIdToPos: '+JSON.stringify(config.citationIdToPos));
    debug('CONFIG posToCitationId: '+JSON.stringify(config.posToCitationId));
}
validateStorage();
