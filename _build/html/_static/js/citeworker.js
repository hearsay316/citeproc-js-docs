/**
 * citeworker.js - 用于处理文献引用的Web Worker脚本
 *
 * 这个文件是citeproc-js文档系统的一部分，负责在后台线程中处理文献引用格式化，
 * 避免阻塞浏览器主线程，提高用户界面响应速度。
 */

// 导入citeproc.js库，这是处理文献引用格式化的核心库
importScripts('../js/citeproc.js');

// 存储文献条目数据的对象，键为文献ID，值为文献详细信息
var itemsObj = {};
// 存储司法管辖区信息的对象，用于处理不同地区的引用格式
var jurisdictionsObj = {};
// 存储当前使用的引用样式（CSL格式）
var style = null;
// 存储本地化信息的对象，用于处理不同语言的引用格式
var localesObj = null;
// 存储首选的语言环境设置
var preferredLocale = null;
// citeproc引擎实例，用于处理文献引用格式化
var citeproc = null;
// 按索引存储的引用数据
var citationByIndex = null;

/**
 * 默认缩写对象
 * 用于存储常用期刊名、机构名等的缩写形式
 */
var abbreviationObj = {
    'default': {
        'container-title': {
            'English Reports': '!authority>>>E.R.',
            'Archives of Dermatological Research': 'Arch. Dermatol.',
            'British Medical Journal': 'Brit. Med. J.',
        }, 'collection-title': {}, 'institution-entire': {}, 'institution-part': {
            'court.appeals': '!here>>>', 'House of Lords': 'HL',
        }, nickname: {}, number: {}, title: {}, place: {
            us: '!here>>>', 'us:c9': '9th Cir.',
        }, hereinafter: {}, classic: {},
    },
};

/**
 * 空的缩写对象模板
 * 用于初始化新的司法管辖区的缩写配置
 */
var emptyAbbreviationObj = {
    'container-title': {},
    'collection-title': {},
    'institution-entire': {},
    'institution-part': {},
    nickname: {},
    number: {},
    title: {},
    place: {},
    hereinafter: {},
    classic: {},
};

/**
 * 系统接口对象
 * 提供citeproc引擎需要的各种数据获取方法
 */
var sys = {
    /**
     * 根据文献ID获取文献条目数据
     * @param {string} itemID - 文献条目的唯一标识符
     * @returns {Object} 文献条目数据对象
     */
    retrieveItem: function (itemID) {
        return itemsObj[itemID];
    },

    /**
     * 根据语言环境获取本地化数据
     * @param {string} locale - 语言环境标识符，如"en-US"
     * @returns {string} 本地化XML数据
     */
    retrieveLocale: function (locale) {
        return localesObj[locale];
    },

    /**
     * 根据司法管辖区获取样式模块
     * @param {string} jurisdiction - 司法管辖区标识符
     * @param {string} preference - 首选项
     * @returns {string} 样式模块数据
     */
    retrieveStyleModule: function (jurisdiction, preference) {
        return jurisdictionsObj[jurisdiction];
    },

    /**
     * 获取缩写信息
     * @param {string} listname - 列表名称
     * @param {Object} obj - 缩写对象
     * @param {string} jurisdiction - 司法管辖区
     * @param {string} category - 类别
     * @param {string} key - 键名
     * @returns {string} 司法管辖区标识符
     */
    getAbbreviation: function (listname, obj, jurisdiction, category, key) {
        // 如果指定的司法管辖区不存在，则创建一个新的
        if (!obj[jurisdiction]) {
            obj[jurisdiction] = JSON.parse(JSON.stringify(emptyAbbreviationObj));
        }
        // 从默认配置中复制缩写信息
        obj[jurisdiction][category][key] = abbreviationObj['default'][category][key];
        // 返回司法管辖区标识符
        return jurisdiction;
    },
};

/**
 * 获取文件内容的通用函数
 * 使用XMLHttpRequest从服务器获取数据文件
 * @param {string} type - 文件类型（styles、locales、items、juris）
 * @param {string} filename - 文件名（不包含扩展名）
 * @param {Function} callback - 回调函数，处理获取到的数据
 */
function getFileContent(type, filename, callback) {
    // 创建XMLHttpRequest对象用于发送HTTP请求
    var xhr = new XMLHttpRequest();

    // 根据文件类型添加相应的扩展名
    if (type === 'styles') {
        filename = filename + '.csl';  // 引用样式文件使用.csl扩展名
    } else if (type === 'locales') {
        filename = 'locales-' + filename + '.xml';  // 本地化文件使用locales-前缀和.xml扩展名
    } else if (type === 'items') {
        filename = filename + '.json';  // 文献条目文件使用.json扩展名
    } else if (type === 'juris') {
        filename = 'juris-' + filename + '.csl';  // 司法管辖区文件使用.juris-.csl扩展名
    }

    // 构建完整的文件URL路径
    var url = '../data/' + type + '/' + filename;

    // 配置HTTP请求
    xhr.open('GET', url);
    // 设置请求状态变化的处理函数
    xhr.onreadystatechange = function () {
        // 当请求完成时处理响应
        if (xhr.readyState === 4) {
            // 如果请求成功（HTTP状态码为200）
            if (xhr.status === 200) {
                // 调用回调函数处理响应数据
                callback(xhr.responseText);
            } else {
                // 如果请求失败，调用回调函数但不传递数据
                callback();
            }
        }
    };
    // 发送HTTP请求
    xhr.send(null);
}

/**
 * 获取引用样式文件
 * @param {string} styleName - 样式名称
 * @param {string} localeName - 语言环境名称
 */
function getStyle(styleName, localeName) {
    // 获取指定名称的样式文件，获取成功后调用getLocales函数
    getFileContent('styles', styleName, function (txt) {
        // 保存样式数据
        style = txt;
        // 从样式中提取需要的本地化信息
        var locales = extractRawLocales(style, localeName);
        // 标准化本地化信息
        locales = normalizeLocales(locales);
        // 获取本地化数据
        getLocales(locales);
    });
}

/**
 * 从样式文件中提取原始本地化信息
 * @param {string} style - 样式文件内容
 * @param {string} localeName - 语言环境名称
 * @returns {Array} 需要的本地化列表
 */
function extractRawLocales(style, localeName) {
    // 默认包含英语美国本地化
    var locales = ['en-US'];
    // 如果指定了其他语言环境，也添加到列表中
    if (localeName) {
        locales.push(localeName);
    }

    // 使用正则表达式匹配样式文件中的locale属性
    var m = style.match(/locale=\"[^\"]+\"/g);
    if (m) {
        // 遍历所有匹配到的locale属性
        for (var i = 0, ilen = m.length; i < ilen; i++) {
            // 提取locale属性值并按空格分割
            var vals = m[i].slice(0, -1)
                .slice(8)
                .split(/\s+/);
            // 将所有语言环境添加到列表中
            for (var j = 0, jlen = vals.length; j < jlen; j++) {
                var val = vals[j];
                locales.push(val);
            }
        }
    }
    return locales;
}

/**
 * 标准化本地化信息
 * @param {Array} locales - 原始本地化列表
 * @returns {Array} 标准化后的本地化列表
 */
function normalizeLocales(locales) {
    // 使用对象去重
    var obj = {};
    // 遍历所有本地化信息
    for (var i = 0, ilen = locales.length; i < ilen; i++) {
        var locale = locales[i];
        // 格式化语言环境标识符（如en-US格式）
        locale = locale.split('-')
            .slice(0, 2)
            .join('-');
        // 检查是否为支持的语言环境
        if (CSL.LANGS[locale]) {
            obj[locale] = true;
        } else {
            // 如果不是完整格式，尝试使用语言代码查找
            locale = locale.split('-')[0];
            if (CSL.LANG_BASES[locale]) {
                locale = CSL.LANG_BASES[locale].split('_')
                    .join('-');
                obj[locale] = true;
            }
        }
    }
    // 返回去重后的本地化列表
    return Object.keys(obj);
}

/**
 * 获取本地化数据
 * @param {Array} locales - 需要获取的本地化列表
 */
function getLocales(locales) {
    // 初始化本地化对象
    localesObj = {};
    // 递归获取所有本地化数据，完成后调用buildProcessor函数
    fetchLocale(0, locales, function () {
        buildProcessor();
    });
}

/**
 * 递归获取本地化数据
 * @param {number} pos - 当前处理的位置
 * @param {Array} locales - 本地化列表
 * @param {Function} callback - 完成后的回调函数
 */
function fetchLocale(pos, locales, callback) {
    // 如果所有本地化数据都已获取完毕，调用回调函数
    if (pos === locales.length) {
        callback();
        return;
    }
    // 获取当前位置的本地化数据
    getFileContent('locales', locales[pos], function (txt) {
        var locale = locales[pos];
        // 将获取到的数据保存到localesObj对象中
        localesObj[locale] = txt;
        // 递归处理下一个本地化数据
        fetchLocale(pos + 1, locales, callback);
    });
}

/**
 * 构建文献引用处理器函数
 * 该函数用于创建和初始化一个新的CSL引擎实例，处理文献引用格式
 */
function buildProcessor() {
    // 创建一个新的CSL引擎实例，用于处理文献引用格式
    citeproc = new CSL.Engine(sys, style, preferredLocale);
    // 用于存储文献项ID的数组
    var itemIDs = [];

    // 如果存在按索引排列的引文数据
    // 检查是否存在通过索引获取的引用
    if (citationByIndex) {
        // 遍历所有引文
        for (var i = 0, ilen = citationByIndex.length; i < ilen; i++) {
            var citation = citationByIndex[i];
            // 遍历当前引文中的所有文献项
            for (var j = 0, jlen = citation.citationItems.length; j < jlen; j++) {
                var itemID = citation.citationItems[j].id; // 获取文献项ID
                itemIDs.push(itemID); // 将文献项ID添加到数组中
            }
            // 为笔记类样式设置笔记索引
            // 判断citeproc对象的opt属性中的xclass是否等于'note'
            if (citeproc.opt.xclass === 'note') {
                // 如果是笔记类样式，则设置citation.properties的noteIndex属性为i+1
                citation.properties.noteIndex = (i + 1);
            } else {
                // 如果不是笔记类样式，则设置citation.properties的noteIndex属性为0
                citation.properties.noteIndex = 0;
            }
        }
    }

    // 获取项目列表，传入null作为第一个参数，itemIDs作为第二个参数
    // 然后传入两个回调函数
    getItems(null, itemIDs, // 第一个回调函数，用于获取司法管辖区信息
        function (callback) {
            // 调用getJurisdictions函数，传入null、itemIDs和回调函数
            getJurisdictions(null, itemIDs, callback);
        }, // 第二个回调函数，用于处理获取项目后的操作
        function () {
            // 初始化rebuildData为null
            var rebuildData = null;
            // 检查citationByIndex是否存在
            if (citationByIndex) {
                // 使用citationByIndex重新构建处理器状态
                rebuildData = citeproc.rebuildProcessorState(citationByIndex);
            }
            // 将citationByIndex重置为null
            citationByIndex = null;
            // 初始化bibRes为null
            var bibRes = null;
            // 检查citeproc的bibliography.tokens是否存在
            if (citeproc.bibliography.tokens.length) {
                // 生成参考文献列表
                bibRes = citeproc.makeBibliography();
            }
            // 发送消息，包含初始化处理器的相关信息
            postMessage({
                command: 'initProcessor',  // 命令类型为初始化处理器
                xclass: citeproc.opt.xclass, // 处理器的xclass属性
                citationByIndex: citeproc.registry.citationreg.citationByIndex, // 引用索引
                rebuildData: rebuildData, // 重新构建的数据
                bibliographyData: bibRes, // 参考文献数据
                result: 'OK',
            });
        });
}

/**
 * 获取项目数据的函数
 * @param {Object} d - 可能包含相关数据或配置的对象
 * @param {Array} itemIDs - 需要获取的项目ID数组
 * @param {Function} itemsCallback - 获取项目数据后的回调函数
 * @param {Function} jurisdictionsCallback - 获取司法管辖区数据后的回调函数
 */
function getItems(d, itemIDs, itemsCallback, jurisdictionsCallback) {
    // 调用fetchItem函数开始获取文献条目数据
    fetchItem(0, itemIDs, itemsCallback, jurisdictionsCallback);
}

/**
 * 递归获取项目数据的函数
 * @param {number} pos - 当前处理的项目ID在数组中的位置索引
 * @param {Array} itemIDs - 包含所有需要获取的项目ID的数组
 * @param {function} itemsCallback - 获取所有项目数据后的回调函数
 * @param {function} jurisdictionsCallback - 用于获取司法管辖区数据的回调函数
 */
function fetchItem(pos, itemIDs, itemsCallback, jurisdictionsCallback) {
    // 如果当前位置已经到达数组末尾，说明所有项目数据都已获取完毕
    if (pos === itemIDs.length) {
        // 执行回调函数，传入司法管辖区回调函数
        itemsCallback(jurisdictionsCallback);
        return;
    }
    // 异步获取文件内容
    getFileContent('items', itemIDs[pos], function (txt) {
        // 获取当前项目ID
        var itemID = itemIDs[pos];
        // 将解析后的JSON数据存储到itemsObj对象中，以itemID为键
        itemsObj[itemID] = JSON.parse(txt);
        // 递归调用自身，处理下一个项目
        fetchItem(pos + 1, itemIDs, itemsCallback, jurisdictionsCallback);
    });
}

/**
 * 获取司法管辖区数据
 * @param {Object} d - 数据对象
 * @param {Array} itemIDs - 文献条目ID列表
 * @param {Function} jurisdictionsCallback - 完成后的回调函数
 */
function getJurisdictions(d, itemIDs, jurisdictionsCallback) {
    // 需要获取的司法管辖区ID列表
    var jurisdictionIDs = [];
    // 遍历所有文献条目
    for (var i = 0, ilen = itemIDs.length; i < ilen; i++) {
        var itemID = itemIDs[i];
        var item = itemsObj[itemID];
        // 如果文献条目包含司法管辖区信息
        if (item.jurisdiction) {
            // 将司法管辖区标识符按层级分割
            var lst = item.jurisdiction.split(':');
            // 处理每个层级的司法管辖区
            for (var j = 0, jlen = lst.length; j < jlen; j++) {
                var jurisdiction = lst.slice(0, j + 1)
                    .join(':');
                // 如果该司法管辖区尚未获取且未在待获取列表中，则添加到待获取列表
                if (!jurisdictionsObj[jurisdiction] && jurisdictionIDs.indexOf(jurisdiction) === -1) {
                    jurisdictionIDs.push(jurisdiction);
                }
            }
        }
    }
    // 开始获取司法管辖区数据
    fetchJurisdiction(0, jurisdictionIDs, jurisdictionsCallback);
}

/**
 * 递归获取司法管辖区数据
 * @param {number} pos - 当前处理的位置
 * @param {Array} jurisdictionIDs - 司法管辖区ID列表
 * @param {Function} jurisdictionsCallback - 完成后的回调函数
 */
function fetchJurisdiction(pos, jurisdictionIDs, jurisdictionsCallback) {
    // 如果所有司法管辖区数据都已获取完毕，调用回调函数
    if (pos === jurisdictionIDs.length) {
        jurisdictionsCallback();
        return;
    }
    // 获取当前位置的司法管辖区数据
    getFileContent('juris', jurisdictionIDs[pos], function (txt) {
        var jurisdictionID = jurisdictionIDs[pos];
        // 如果获取到数据，则保存到jurisdictionsObj对象中
        if (txt) {
            jurisdictionsObj[jurisdictionID] = txt;
        }
        // 递归处理下一个司法管辖区
        fetchJurisdiction(pos + 1, jurisdictionIDs, jurisdictionsCallback);
    });
}

/**
 * 处理来自主线程的消息
 * 这是Web Worker的入口点，根据不同的命令执行相应的操作
 * @param {Object} e - 消息事件对象
 */
onmessage = function (e) {
    // 获取消息数据
    var d = e.data;
    // 根据命令类型执行不同操作
    switch (d.command) {
    case 'initProcessor':
        // 初始化处理器命令
        preferredLocale = d.localeName;          // 设置首选语言环境
        citationByIndex = d.citationByIndex;     // 设置引用索引数据
        getStyle(d.styleName, d.localeName);     // 获取并处理样式文件
        break;
    case 'registerCitation':
        // 注册引用命令
        var itemFetchLst = [];  // 需要获取的文献条目列表
        // 遍历引用中的所有文献条目
        for (var i = 0, ilen = d.citation.citationItems.length; i < ilen; i++) {
            var itemID = d.citation.citationItems[i].id;
            // 如果该文献条目尚未获取，则添加到待获取列表
            if (!itemsObj[itemID]) {
                itemFetchLst.push(itemID);
            }
        }
        // 首先获取文献条目数据，然后获取司法管辖区数据，最后处理引用
        getItems(d, itemFetchLst, function (callback) {
            getJurisdictions(d, itemFetchLst, callback);
        }, function () {
            console.log('citation data: ', d.citation,d.preCitations, d.postCitations);
            // 处理引用集群
            var citeRes = citeproc.processCitationCluster(d.citation, d.preCitations, d.postCitations);
            // 生成参考文献列表
            var bibRes = null;
            if (citeproc.bibliography.tokens.length) {
                bibRes = citeproc.makeBibliography();
            }
            // 发送处理结果回主线程
            postMessage({
                command: 'registerCitation',
                result: 'OK',
                citationData: citeRes[1],
                bibliographyData: bibRes,
                citationByIndex: citeproc.registry.citationreg.citationByIndex,
            });
        });
        break;
    }
};
