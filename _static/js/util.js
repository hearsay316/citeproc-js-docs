function buildStyleMenu() {
    debug('buildStyleMenu()');
    if (localStorage.getItem('defaultStyle')) {
        config.defaultStyle = localStorage.getItem('defaultStyle');
    }
    var stylesMenu = document.getElementById('citation-styles');
    for (var i=0,ilen=config.styleData.length;i<ilen;i++) {
        var styleData = config.styleData[i];
        var option = document.createElement('option');
        option.setAttribute('value', styleData.id);
        if (styleData.id === config.defaultStyle) {
            option.selected = true;
        }
        option.innerHTML = styleData.title;
        stylesMenu.appendChild(option);
    }
}

function fixupNoteNumbers() {
    debug('fixupNoteNumbers()');
    if (config.mode !== 'note') return;
    var citationNodes = document.getElementsByClassName('citation');
    for (var i=0,ilen=citationNodes.length;i<ilen;i++) {
        var citationNode = citationNodes[i];
        citationNode.innerHTML = '[' + (i+1) + ']'
    }
    var footnoteNumberNodes = document.getElementsByClassName('footnote-number');
    var footnoteNumber = 1;
    for (var i=0,ilen=footnoteNumberNodes.length;i<ilen;i++) {
        var footnoteNumberNode = footnoteNumberNodes[i];
        if (!footnoteNumberNode.parentNode.hidden) {
            footnoteNumberNode.innerHTML = "" + footnoteNumber;
            footnoteNumber++;
        }
    }
}

function fixupPrePostNoteNumbers(citationsPre, citationsPost) {
    debug('fixupPrePostNoteNumbers()');
    for (var i=0,ilen=citationsPre.length;i<ilen;i++) {
        citationsPre[i][1] = (i + 1);
    }
    var offset = (citationsPre.length+1)
    for (var i=0,ilen=citationsPost.length;i<ilen;i++) {
        citationsPost[i][1] = (i + offset + 1);
    }
}

function prepCitations() {
    debug('prepCitations()');
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

function getCiteMeIndex(node) {
    debug('getCiteMeIndex()');
    var nodes = document.getElementsByClassName('citeme');
    for (var i=0,ilen=nodes.length;i<ilen;i++) {
        if (nodes[i].firstChild) {
            return i;
        }
    }
    return false;
}

function removeCiteMenu() {
    debug('removeCiteMenu()');
    var menu = document.getElementById('cite-menu');
    if (menu) {
        menu.parentNode.removeChild(menu);
    }
}

function getCurrentCitationInfo() {
    debug('getCurrentCitationInfo()');
    var info = {
        pos: 0,
        citationID: null,
        positionNode: null
    };
    var citemeNodes = document.getElementsByClassName('citeme');
    var citationIndex = 0;
    for (var i=0,ilen=citemeNodes.length;i<ilen;i++) {
        var node = citemeNodes[i];
        var sib = node.nextSibling;
        var hasCitationNode = sib && sib.classList && sib.classList.contains('citation');
        if (node.firstChild) {
            info.pos = i;
            info.citationIndex = citationIndex;
            if (hasCitationNode) {
                info.citationID = sib.getAttribute('id');
            } else {
                info.positionNode = node;
            }
            break;
        } else if (hasCitationNode) {
            citationIndex++;
        }
    }
    return info;
}


function removeCitation() {
    debug('removeCitation()');
    var info = getCurrentCitationInfo();
    if (info.citationID) {
        var citationToRemove = document.getElementById(info.citationID);
        citationToRemove.parentNode.removeChild(citationToRemove);
        delete config.posToCitationId[config.citationIdToPos[citationToRemove.citationID]];
        delete config.citationIdToPos[citationToRemove.citationID];
        localStorage.setItem('posToCitationId', JSON.stringify(config.posToCitationId));
        localStorage.setItem('citationIdToPos', JSON.stringify(config.citationIdToPos));
    }
    var removePos = -1;
    for (var i=config.citationByIndex.length-1;i>-1;i--) {
        if (config.citationByIndex[i].citationID === info.citationID) {
            var citation = config.citationByIndex[i];
            removePos = config.citationIdToPos[info.citationID];
            delete config.posToCitationId[config.citationIdToPos[citation.citationID]];
            delete config.citationIdToPos[citation.citationID];
            
            config.citationByIndex = config.citationByIndex.slice(0, i).concat(config.citationByIndex.slice(i+1));
            for (var j=i,jlen=config.citationByIndex.length;j<jlen;j++) {
                config.citationByIndex[j].properties.noteIndex += -1;
            }
        }
    }
    fixupNoteNumbers();
    if (config.citationByIndex.length === 0) {
        localStorage.removeItem('citationByIndex');
        workaholic.initProcessor(config.defaultStyle, config.defaultLocale, clearDocument);
    } else {
        if (config.mode === 'note') {
            var footnotes = document.getElementById('footnotes').children;
            footnotes[removePos].hidden = true;
        }
        var splitData = getCitationSplits();
        splitData.citation.properties.noteIndex = 1;
        config.processorReady = true;
        workaholic.registerCitation(splitData.citation, splitData.citationsPre, splitData.citationsPost);
    }
}

function rebuildCitations(rebuildData) {
    if (!rebuildData) return;
    debug('rebuildCitations()');
    var citations = rebuildData.map(function(obj){
        return [0, obj[2], obj[0]];
    })
    for (var i=0,ilen=citations.length;i<ilen;i++) {
        citations[i][0] = i;
    }
    setCitations(citations);
}

function hideAllFootnotes() {
    debug('hideAllFootnotes()');
    var footnotes = document.getElementById('footnotes');
    for (var i=0,ilen=footnotes.children.length;i<ilen;i++) {
        footnotes.children[i].hidden = true;
    }
}

function getCitationSplits(nodes) {
    debug('getCitationSplits()');
    var splitData = {
        citation: null,
        citationsPre: [],
        citationsPost: []
    }
    var current = 'citationsPre';
    var offset = 0;
    if (nodes) {
        for (var i=0,ilen=nodes.length;i<ilen;i++) {
            var node = nodes[i];
            if (node.previousSibling.firstChild) {
                current = 'citationsPost';
                if (!node.firstChild) {
                    // Inserting a new citation
                    offset = -1;
                } else {
                    // Editing an existing citation
                    splitData.citation = config.citationByIndex[i];
                }
            } else {
                splitData[current].push([config.citationByIndex[i + offset].citationID, 0]);
            }
        }
    } else {
        splitData.citation = config.citationByIndex[0];
        splitData.citationsPost = config.citationByIndex.slice(1).map(function(obj){
            return [obj.citationID, 0];
        })
    }
    return splitData;
}

