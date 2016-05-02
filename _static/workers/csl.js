importScripts('citeproc.js');

var itemsObj = {};
var style = null;
var localesObj = null;
var preferredLocale = null;
var citeproc = null;

var sys = {
    retrieveItem: function(itemID) {
        return itemsObj[itemID];
    },
    retrieveLocale: function(locale) {
        return localesObj[locale];
    }
}

function getFileContent(type, filename, callback) {
    var xhr = new XMLHttpRequest();
    if (type === 'styles') {
        filename = filename + '.csl';
    } else if (type === 'locales') {
        filename = 'locales-' + filename + '.xml';
    } else if (type === 'items') {
        filename = filename + '.json';
        console.log('fetch item: '+filename);
    }
    var url = '../' + type + '/' + filename;

    xhr.open('GET', url);
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
            console.log("Found us some text: "+xhr.responseText);
            callback(xhr.responseText);
        }
    }
    xhr.send(null);
}

function getStyle(styleName, localeName) {
    console.log("XXX get style "+styleName);
    // Fetch style, call getLocales()
    getFileContent('styles', styleName, function(txt) {
        style = txt;
        var locales = extractRawLocales(style, localeName);
        locales = normalizeLocales(locales);
        getLocales(locales);
    });
}

function extractRawLocales(style, localeName) {
    var locales = ['en-US'];
    if (localeName) {
        locales.push(localeName);
    }
    var m = style.match(/locale=\"[^\"]+\"/g)
    if (m) {
        for (var i=0,ilen=m.length;i<ilen;i++) {
            var vals = m[i].slice(0, -1).slice(8).split(/\s+/);
            for (var j=0,jlen=vals.length;j<jlen;j++) {
                var val = vals[j];
                locales.push(val);
            }
        }
    }
    return locales;
}

function normalizeLocales(locales) {
    var obj = {};
    for (var i=0,ilen=locales.length;i<ilen;i++) {
        var locale = locales[i];
        locale = locale.split('-').slice(0, 2).join('-');
        if (CSL.LANGS[locale]) {
            obj[locale] = true;
        } else {
            locale = locale.split('-')[0];
            if (CSL.LANG_BASES[locale]) {
                locale = CSL.LANG_BASES[locale].split('_').join('-');
                obj[locale] = true;
            }
        }
    }
    return Object.keys(obj);
}

function getLocales(locales) {
    // Fetch locales, call buildProcessor()
    console.log("XXX get locales "+typeof locales+" "+locales);
    localesObj = {};
    fetchLocale(0, locales, function() {
        buildProcessor();
    });
}

function fetchLocale(pos, locales, callback) {
    if (pos === locales.length) {
        callback();
        return;
    }
    getFileContent('locales', locales[pos], function(txt) {
        var locale = locales[pos];
        localesObj[locale] = txt;
        fetchLocale(pos+1, locales, callback);
    });
}

function buildProcessor() {
    console.log('Build processor');
    citeproc = new CSL.Engine(sys, style, preferredLocale);
    console.log('Done!');
    postMessage({
        command: 'initProcessor',
        result: 'OK'
    });
}

function getItems(d, itemIDs) {
    // Fetch locales, call buildProcessor()
    fetchItem(0, itemIDs, function() {
        console.log(JSON.stringify(d.citation));
        var res = citeproc.processCitationCluster(d.citation, d.preCitations, d.postCitations);
        postMessage({
            command: 'registerCitation',
            result: 'OK',
            citations: res[1]
        });
    });
}

function fetchItem(pos, itemIDs, callback) {
    if (pos === itemIDs.length) {
        callback();
        return;
    }
    getFileContent('items', itemIDs[pos], function(txt) {
        var itemID = itemIDs[pos];
        itemsObj[itemID] = JSON.parse(txt);
        fetchItem(pos+1, itemIDs, callback);
    });
}

function configureJurisdictions(jurisdictionIDs) {
    // Installs jurisdiction style modules required by an
    // item in the processor context.
    // [forthcoming]
}

onmessage = function(e) {
    var d = e.data;
    switch (d.command) {
    case 'initProcessor':
        preferredLocale = d.localeName;
        getStyle(d.styleName, d.localeName);
        break;
    case 'registerCitation':
        itemFetchLst = [];
        for (var i=0,ilen=d.citation.citationItems.length;i<ilen;i++) {
            var itemID = d.citation.citationItems[i].id;
            if (!itemsObj[itemID]) {
                itemFetchLst.push(itemID);
            }
        }
        getItems(d, itemFetchLst);
        break;
    }
}
