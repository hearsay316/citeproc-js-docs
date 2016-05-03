function getCiteMeIndex(node) {
    var nodes = document.getElementsByClassName('citeme');
    for (var i=0,ilen=nodes.length;i<ilen;i++) {
        if (nodes[i].firstChild) {
            return i;
        }
    }
    return false;
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
                continue;
            } else {
                config.citationPositionMap[i] = citationIndex;
                citationIndex++;
            }
        }
    }
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
            var citation = config.citationByIndex[0];
            var prePost = getCitationSplits();
            workaholic.registerCitation(citation, prePost[0], prePost[1]);
        }
    }
    console.log('configsies: '+JSON.stringify(config.citationPositionMap));
}

function getCitationSplits(nodes) {
    var citationsPre = [];
    var citationsPost = [];
    var current = citationsPre;
    var offset = 0;
    if (nodes) {
        for (var i=0,ilen=nodes.length;i<ilen;i++) {
            var node = nodes[i];
            if (node.previousSibling.firstChild) {
                current = citationsPost;
                if (!node.firstChild) {
                    offset = -1;
                }
            } else {
                current.push([config.citationByIndex[i+offset].citationID, 0]);
                console.log(config.citationByIndex[i+offset].citationID);
            }
        }
    } else {
        citationsPost = [for (citation of config.citationByIndex.slice(1)) [citation.citationID, 0]];
    }
    return [citationsPre, citationsPost];
}

