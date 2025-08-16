importScripts('../js/citeproc.js');

var itemsObj = {};
var jurisdictionsObj = {};
var style = null;
var localesObj = null;
var preferredLocale = null;
var citeproc = null;
var citationByIndex = null;
var abbreviationObj = {
    "default": {
        "container-title": {
            "English Reports": "!authority>>>E.R.",
            "Archives of Dermatological Research": "Arch. Dermatol.",
            "British Medical Journal": "Brit. Med. J."
        },
        "collection-title": {},
        "institution-entire": {},
        "institution-part": {
            "court.appeals": "!here>>>",
            "House of Lords": "HL"
        },
        nickname: {},
        number: {},
        title: {},
        place: {
            us: "!here>>>",
            "us:c9": "9th Cir."
        },
        hereinafter: {},
        classic: {}
    }
}
var emptyAbbreviationObj = {
    "container-title": {},
    "collection-title": {},
    "institution-entire": {},
    "institution-part": {},
    nickname: {},
    number: {},
    title: {},
    place: {},
    hereinafter: {},
    classic: {}
}
var sys = {
    retrieveItem: function(itemID) {
        return itemsObj[itemID];
    },
    retrieveLocale: function(locale) {
        return localesObj[locale];
    },
    retrieveStyleModule: function(jurisdiction, preference) {
        return jurisdictionsObj[jurisdiction];
    },
    getAbbreviation: function(listname, obj, jurisdiction, category, key) {
        if (!obj[jurisdiction]) {
            obj[jurisdiction] = JSON.parse(JSON.stringify(emptyAbbreviationObj));
        }
        obj[jurisdiction][category][key] = abbreviationObj['default'][category][key];
	return jurisdiction;
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
    } else if (type === 'juris') {
        filename = 'juris-' + filename + '.csl';
    }
    var url = '../data/' + type + '/' + filename;

    xhr.open('GET', url);
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                callback(xhr.responseText);
            } else {
                callback();
            }
        }
    }
    xhr.send(null);
}

function getStyle(styleName, localeName) {
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

/**
 * 构建文献引用处理器函数
 * 该函数用于创建和初始化一个新的CSL引擎实例，处理文献引用格式
 */
function buildProcessor() {
     // console.log('Building processor with style:', style, 'and preferred locale:', preferredLocale);
    // 如果没有样式或首选语言，则返回错误
    // 创建一个新的CSL引擎实例，用于处理文献引用格式
    citeproc = new CSL.Engine(sys, style, preferredLocale);
    var itemIDs = []; // 用于存储文献项ID的数组

    // 如果存在按索引排列的引文数据
    if (citationByIndex) {
        // 遍历所有引文
        for (var i=0,ilen=citationByIndex.length;i<ilen;i++) {
            var citation = citationByIndex[i];
            // 遍历当前引文中的所有文献项
            for (var j=0,jlen=citation.citationItems.length;j<jlen;j++) {
                var itemID = citation.citationItems[j].id; // 获取文献项ID
                itemIDs.push(itemID); // 将文献项ID添加到数组中
            }
            // Set note numbers for style, assuming that all notes are citesupport notes
            // 判断citeproc对象的opt属性中的xclass是否等于'note'
            if (citeproc.opt.xclass === 'note') {
                console.log(citeproc.opt.xclass,'citeproc.opt.xclass');
                // 如果条件为真，则设置citation.properties的noteIndex属性为i+1
                citation.properties.noteIndex = (i + 1);
            } else {
                // 如果条件为假，则设置citation.properties的noteIndex属性为0
                citation.properties.noteIndex = 0;
            }
        }
    }

    // 获取项目列表，传入null作为第一个参数，itemIDs作为第二个参数
    // 然后传入两个回调函数
    getItems(null, itemIDs,
             // 第一个回调函数，用于获取司法管辖区信息
             function(callback) {
                 // 调用getJurisdictions函数，传入null、itemIDs和回调函数
                 getJurisdictions(null, itemIDs, callback);
             },
             // 第二个回调函数，用于处理获取项目后的操作
             function() {
                 // 初始化rebuildData为null
                 var rebuildData = null;
                 // 检查citationByIndex是否存在
                 if (citationByIndex) {
                    // 输出citationByIndex的值到控制台
                    console.log(citationByIndex,'citationByIndex');

                     // 使用citationByIndex重新构建处理器状态
                     rebuildData = citeproc.rebuildProcessorState(citationByIndex);
                     // 输出重新构建的数据到控制台
                     console.log('Rebuild data:', rebuildData);
                 }
                 // 将citationByIndex重置为null
                 citationByIndex = null;
                 // 初始化bibRes为null
                 var bibRes = null;
                 // 检查citeproc的bibliography.tokens是否存在
                 if (citeproc.bibliography.tokens.length) {
                     // 生成参考文献列表
                     bibRes = citeproc.makeBibliography();
                        // 输出参考文献数据到控制台
                        console.log('Bibliography data:', bibRes);
                 }
                 // 发送消息，包含初始化处理器的相关信息
                 postMessage({
                     command: 'initProcessor',  // 命令类型为初始化处理器
                     xclass: citeproc.opt.xclass, // 处理器的xclass属性
                     citationByIndex: citeproc.registry.citationreg.citationByIndex, // 引用索引
                     rebuildData: rebuildData, // 重新构建的数据
                     bibliographyData: bibRes, // 参考文献数据
                     result: 'OK'
                 });
             });
}

function getItems(d, itemIDs, itemsCallback, jurisdictionsCallback) {
    // Fetch locales, call buildProcessor()
    fetchItem(0, itemIDs, itemsCallback, jurisdictionsCallback);
}

function fetchItem(pos, itemIDs, itemsCallback, jurisdictionsCallback) {
    if (pos === itemIDs.length) {
        itemsCallback(jurisdictionsCallback);
        return;
    }
    getFileContent('items', itemIDs[pos], function(txt) {
        var itemID = itemIDs[pos];
        itemsObj[itemID] = JSON.parse(txt);
        fetchItem(pos+1, itemIDs, itemsCallback, jurisdictionsCallback);
    });
}

function getJurisdictions(d, itemIDs, jurisdictionsCallback) {
    // Installs jurisdiction style modules required by an
    // item in the processor context.
    var jurisdictionIDs = [];
    for (var i=0,ilen=itemIDs.length;i<ilen;i++) {
        var itemID = itemIDs[i];
        var item = itemsObj[itemID];
        if (item.jurisdiction) {
            var lst = item.jurisdiction.split(':');
            for (var j=0,jlen=lst.length;j<jlen;j++) {
                var jurisdiction = lst.slice(0, j+1).join(':');
                if (!jurisdictionsObj[jurisdiction] && jurisdictionIDs.indexOf(jurisdiction) === -1) {
                    jurisdictionIDs.push(jurisdiction);
                }
            }
        }
    }
    fetchJurisdiction(0, jurisdictionIDs, jurisdictionsCallback);
}

function fetchJurisdiction(pos, jurisdictionIDs, jurisdictionsCallback) {
    if (pos === jurisdictionIDs.length) {
        jurisdictionsCallback();
        return;
    }
    getFileContent('juris', jurisdictionIDs[pos], function(txt) {
        var jurisdictionID = jurisdictionIDs[pos];
        if (txt) {
            jurisdictionsObj[jurisdictionID] = txt;
        }
        fetchJurisdiction(pos+1, jurisdictionIDs, jurisdictionsCallback);
    });
}

onmessage = function(e) {
    var d = e.data;
    switch (d.command) {
    case 'initProcessor':
        preferredLocale = d.localeName;
        citationByIndex = d.citationByIndex;
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
        // First callback is executed after items are fetched
        // Second callback is executed after jurisdictions are fetched
        getItems(d, itemFetchLst,
                 function(callback) {
                     getJurisdictions(d, itemFetchLst, callback);
                 },
                 function() {
                     var citeRes = citeproc.processCitationCluster(d.citation, d.preCitations, d.postCitations);
                     var bibRes = null;
                     if (citeproc.bibliography.tokens.length) {
                         bibRes = citeproc.makeBibliography();
                     }
                     postMessage({
                         command: 'registerCitation',
                         result: 'OK',
                         citationData: citeRes[1],
                         bibliographyData: bibRes,
                         citationByIndex: citeproc.registry.citationreg.citationByIndex
                     });
                 });
        break;
    }
}
