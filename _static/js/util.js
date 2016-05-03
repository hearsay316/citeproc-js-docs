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
    console.log('fixupCitationPositionMap()');
    config.citationPositionMap = {};
    var citemeNodes = document.getElementsByClassName('citeme');
    var citationIndex = 0;
    for (var i=0,ilen=citemeNodes.length;i<ilen;i++) {
        var node = citemeNodes[i];
        if (node.nextSibling && node.nextSibling.classList && node.nextSibling.classList.contains('citation')) {
            if (removeCurrent && node.firstChild) {
                config.citationByIndex = config.citationByIndex.slice(0,citationIndex).concat(config.citationByIndex.slice(citationIndex+1));
                continue;
            }
            config.citationPositionMap[i] = citationIndex;
            citationIndex += 1;
        }
    }
}

function getCitationSplits() {
    console.log('getCitationSplits()');
    var citationsPre = [];
    var citationsPost = [];
    var current = citationsPre;
    var nodes = document.getElementsByClassName('citation');
    var offset = 0;
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
    return [citationsPre, citationsPost];
}
