function buildStyleMenu() {
    var lastStyle = localStorage.getItem('defaultStyle');
    var stylesMenu = document.getElementById('citation-styles');
    for (var i=0,ilen=config.styleData.length;i<ilen;i++) {
        var styleData = config.styleData[i];
        var option = document.createElement('option');
        option.setAttribute('value', styleData.id);
        if (styleData.id === localStorage.getItem('defaultStyle')) {
            option.selected = true;
        }
        option.innerHTML = styleData.title;
        stylesMenu.appendChild(option);
    }
}

function getCiteMeIndex(node) {
    var nodes = document.getElementsByClassName('citeme');
    for (var i=0,ilen=nodes.length;i<ilen;i++) {
        if (nodes[i].firstChild) {
            return i;
        }
    }
    return false;
}

function removeCiteMenu() {
    var menu = document.getElementById('cite-menu');
    if (menu) {
        menu.parentNode.removeChild(menu);
    }
}


function fixupCitationPositionMap(removeCurrent) {
    console.log('fixupCitationPositionMap('+removeCurrent+')');
    // Run this after citation node is initially set, and
    // before removal of the menu.
    config.citationPositionMap = {};
    var citemeNodes = document.getElementsByClassName('citeme');
    var citationIndex = 0;
    var removeCitationNode = null;
    var removePos = null;
    for (var i=0,ilen=citemeNodes.length;i<ilen;i++) {
        var node = citemeNodes[i];
        if (node.nextSibling && node.nextSibling.classList && node.nextSibling.classList.contains('citation')) {
            if (removeCurrent && node.firstChild) {
                removeCitationNode = node.nextSibling;
                removePos = citationIndex;
                removeFootnotePos = config.citationPositionReverseMap[removePos];
                continue;
            } else {
                config.citationPositionMap[i] = citationIndex;
               citationIndex++;
            }
        }
    }
    config.citationPositionReverseMap = {};
    for (var key in config.citationPositionMap) {
        config.citationPositionReverseMap[config.citationPositionMap[key]] = key;
    }
    config.citationPlacements = [];
    for (var i=0,ilen=config.citationByIndex.length;i<ilen;i++) {
        config.citationPlacements.push(config.citationPositionReverseMap[i]);
    }
    localStorage.setItem('citationByIndex', JSON.stringify(config.citationByIndex));
    localStorage.setItem('citationPlacements', JSON.stringify(config.citationPlacements));
    if (removeCurrent) {
        if (removeCitationNode) {
            removeCitationNode.parentNode.removeChild(removeCitationNode);
        }
        if ('number' === typeof removePos) {
            config.citationByIndex = config.citationByIndex.slice(0, removePos).concat(config.citationByIndex.slice(removePos+1));
        }

        if (config.citationByIndex.length === 0) {
            workaholic.initProcessor(config.defaultStyle, config.defaultLocale);
        } else {
            console.log('Remove by refreshing');
            if (config.mode === 'note') {
                var footnotes = document.getElementById('footnotes').children;
                footnotes[removeFootnotePos].hidden = true;
            }
            var splitData = getCitationSplits();
            splitData.citation.properties.noteIndex = 1;
            config.processorReady = true;
            workaholic.registerCitation(splitData.citation, splitData.citationsPre, splitData.citationsPost);
        }
    }
    // console.log('configsies: '+JSON.stringify(config.citationPositionMap));
}

function rebuildCitations(rebuildData) {
    if (!rebuildData) return;
    config.citationByIndex = JSON.parse(localStorage.getItem('citationByIndex'));
    config.citationPlacements = JSON.parse(localStorage.getItem('citationPlacements'));
    prepCitations(config.citationPlacements);
    var citations = [for (datum of rebuildData) [0, datum[2]]]
    for (var i=0,ilen=citations.length;i<ilen;i++) {
        citations[i][0] = i;
    }
    setCitations(citations);
}

function prepCitations(citationPlacements) {
    var citemeNodes = document.getElementsByClassName('citeme');
    for (var i=0,ilen=citationPlacements.length;i<ilen;i++) {
        var pos = citationPlacements[i];
        var citemeNode = citemeNodes[pos];
        var citation = document.createElement('span');
        citation.classList.add('citation');
        citemeNodes[i].parentNode.insertBefore(citation, citemeNodes[i].nextSibling);
    }
}

function hideAllFootnotes() {
    var footnotes = document.getElementById('footnotes');
    for (var i=0,ilen=footnotes.children.length;i<ilen;i++) {
        footnotes.children[i].hidden = true;
    }
}

function getCitationSplits(nodes) {
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
                splitData[current].push([config.citationByIndex[i+offset].citationID, 0]);
            }
        }
    } else {
        splitData.citation = config.citationByIndex[0];
        splitData.citationsPost = [for (citation of config.citationByIndex.slice(1)) [citation.citationID, 0]];
    }
    if (config.mode === 'note') {
        for (var i=0,ilen=splitData.citationsPre.length;i<ilen;i++) {
            splitData.citationsPre[i][1] = (i+1);
        }
        var offset = (splitData.citationsPre.length + 2);
        for (var i=0,ilen=splitData.citationsPost.length;i<ilen;i++) {
            splitData.citationsPost[i][1] = (i+offset);
        }
    }
    return splitData;
}

