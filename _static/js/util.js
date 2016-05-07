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

function menuHasCitation(menuNode) {
    var sib = menuNode.parentNode.nextSibling;
    var hasCitation = (sib && sib.classList && sib.classList.contains('citation'));
    return hasCitation;
}

function getCitationItemIdsFrom(menuNode) {
    var citationItems = [];
    var checkboxes = menuNode.getElementsByTagName('input');
    for (var i=0,ilen=checkboxes.length;i<ilen;i++) {
        var checkbox = checkboxes[i];
        if (checkbox.checked) {
            citationItems.push({
                id: checkbox.getAttribute('value')
            });
        }
    }
    return citationItems;
}

function convertRebuildDataToCitationData(rebuildData) {
    if (!rebuildData) return;
    debug('rebuildCitations()');
    // rebuildData has this structure:
    //   [<citation_id>, <note_number>, <citation_string>]
    // domSetCitations() wants this structure:
    //   [<citation_index>, <citation_string>, <citation_id>]
    var citationData = rebuildData.map(function(obj){
        return [0, obj[2], obj[0]];
    })
    for (var i=0,ilen=citationData.length;i<ilen;i++) {
        citationData[i][0] = i;
    }
    return citationData;
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

function removeIdFromDataSets(mode, citationID) {
    var removePos = -1;
    for (var i=config.citationByIndex.length-1;i>-1;i--) {
        if (config.citationByIndex[i].citationID === citationID) {
            var citation = config.citationByIndex[i];
            removePos = config.citationIdToPos[citationID];
            delete config.posToCitationId[config.citationIdToPos[citation.citationID]];
            delete config.citationIdToPos[citation.citationID];
            if (mode === 'note') {
                config.citationByIndex = config.citationByIndex.slice(0, i).concat(config.citationByIndex.slice(i+1));
                for (var j=i,jlen=config.citationByIndex.length;j<jlen;j++) {
                    config.citationByIndex[j].properties.noteIndex += -1;
                }
            }
        }
    }
    return removePos;
}
