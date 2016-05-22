tinymce.PluginManager.add('citeaddedit', function(editor) {
    
    var citesupport = editor.plugins.citesupport.citesupport;

    function getIDs (citationID) {
        var itemIDs = [];
        var citation = null;
        for (var i = 0, ilen = citesupport.config.citationByIndex.length; i < ilen; i++) {
            if (citesupport.config.citationByIndex[i].citationID === citationID) {
                citation = citesupport.config.citationByIndex[i];
                break;
            }
        }
        // Although citation should ALWAYS exist if document data has cleared validation
        if (citation) {
            itemIDs = citation.citationItems.map(function(obj){
                return obj.id;
            });
        }
        return itemIDs;
    }

    function buildMenu() {
        var menu = [];
        var itemData = [
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
        ];
        for (var i = 0, ilen = itemData.length; i < ilen; i++) {
            menu.push({
                type: 'checkbox',
                name: itemData[i].id,
                label: ' ',
                text: itemData[i].title,
                value: itemData[i].id
            });
        }
        return menu;
    }

    function configMenu(menu, itemIDs) {
        for (var i = 0, ilen = itemIDs.length; i < ilen; i++) {
            var itemID = itemIDs[i];
            for (var j = 0, jlen = menu.length; j < jlen; j++) {
                if (itemID === menu[j].name) {
                    menu[j].checked = true;
                }
            }
        }
        return menu;
    }

    function pruneNodeList(nodeList) {
        var retList = [];
        for (var i = 0, ilen = nodeList.length; i < ilen; i++) {
            if (nodeList[i].parentNode.classList.contains('mce-offscreen-selection')) {
                continue;
            }
            retList.push(nodeList[i]);
        }
        return retList;
    }

	function showDialog() {
        // Get selected node, and citationID if any
		var selectedNode = editor.selection.getNode(), citationID = '';
		var isCitation = selectedNode.tagName == 'SPAN' && editor.dom.hasClass(selectedNode, 'citation');
		if (isCitation) {
			citationID = selectedNode.id || '';
		}
        // Reconcile citationByIndex and editor nodes
        var citations = pruneNodeList(editor.getDoc().getElementsByClassName('citation'));
        var newCitationByIndex = [];
        var newCitationIdToPos = {};
        var offset = 0;

        for (var i = 0, ilen = citations.length; i < ilen; i++) {
            var node = citations[i];
            var citationPos = citesupport.config.citationIdToPos[node.id];
            var citation = citesupport.config.citationByIndex[citationPos];
            if ("undefined" !== typeof newCitationIdToPos[node.id]) {
                citation = JSON.parse(JSON.stringify(citation));
                delete citation.citationID;
            } else {
                newCitationIdToPos[node.id] = (i);
            }
            newCitationByIndex.push(citation);
        }
        citesupport.config.citationByIndex = newCitationByIndex;
        citesupport.config.citationIdToPos = newCitationIdToPos;
        
        // Okay!
        // So if we're at a citation, we check its ID and look up its itemIDs in
        // the current citationByIndex map. It has to be in there.
        var menu = buildMenu();
        var itemIDs = getIDs(citationID);
        var menu = configMenu(menu, itemIDs);

        // Popup
		editor.windowManager.open({
			title: 'Add/Edit citation',
			body: menu,
			onsubmit: function(e) {
                // What has been selected???
                var newCitationItems = [];
                for (var key in e.data) {
                    if (e.data[key]) {
                        newCitationItems.push({
                            id: key
                        });
                    }
                }
                var citation;
				if (!isCitation) {
                    if (newCitationItems.length) {
					    editor.selection.collapse(true);
					    editor.execCommand('mceInsertContent', false, '<span class="citation mceNonEditable">{Citation}</span>');
                        // Get citation and proceed
                        citation = {
                            citationItems: newCitationItems,
                            properties: {
                                noteIndex: 0
                            }
                        }
                    } else {
                        // Did not add anything, so just quit
                        return;
                    }
                } else if (citationID) {
                    var citationPos = citesupport.config.citationIdToPos[citationID];
                    if (newCitationItems.length) {
                        // Get citation and proceed
                        citation = citesupport.config.citationByIndex[citationPos];
                        citation.citationItems = newCitationItems;
                    } else {
                        // Remove this citation from data and from DOM
                        citesupport.config.citationByIndex = newCitationByIndex.slice(0, citationPos).concat(newCitationByIndex.slice(citationPos + 1));
                        delete citesupport.config.citationIdToPos[citationID];
                        if (citesupport.config.citationByIndex.length === 0) {
                            // If no citations remain, reinit
                            callInitProcessor();
                        } else {
                            // Otherwise use first citation for update and remove this citation
                            citation = citesupport.config.citationByIndex[0];
                            var citationNode = citesupport.editor.getDoc().getElementById(citationID);
                            citationNode.parentNode.removeChild(citationNode);
                        }
                    }
                }
                // Now trawl through citations again and figure out where we are
                var citations = pruneNodeList(editor.getDoc().getElementsByClassName('citation'));
                var citationsPre = [];
                var citationsPost = [];
                var offset = 0;
                for (var i = 0, ilen = citations.length; i < ilen; i++) {
                    var citationNode = citations[i];
                    if (citationNode.id === citationID || !citationNode.id) {
                        var offset = 0;
                        if (isCitation) {
                            offset = 1;
                        }
                        if (citesupport.config.citationByIndex.slice(0, i).length) {
                            citationsPre = citesupport.config.citationByIndex.slice(0, i).map(function(obj){
                                return [obj.citationID, 0]
                            });
                        }
                        if (citesupport.config.citationByIndex.slice(i + offset).length) {
                            citationsPost = citesupport.config.citationByIndex.slice(i + offset).map(function(obj){
                                return [obj.citationID, 0];
                            });;
                        }
                        break;
                    }
                }
                // Aaaaaand fix up note numbers if this is a note style
                if (citesupport.config.mode === 'note') {
                    for (var i = 0, ilen = citationsPre.length; i < ilen; i++) {
                        citationsPre[i][1] = (i + 1);
                    }
                    var offset = (citationsPre.length + 1);
                    citation.properties.noteIndex = (offset);
                    for (var i = 0, ilen = citationsPost.length; i < ilen; i++) {
                        citationsPost[i][1] = (i + offset + 1);
                    }
                }
                console.log('citation: '+citation.citationID);
                console.log('citationsPre: '+JSON.stringify(citationsPre));
                console.log('citationsPost: '+JSON.stringify(citationsPost));
                citesupport.callRegisterCitation(citation, citationsPre, citationsPost);
			}
		});
	}

	editor.addCommand('mceCite', showDialog);

	editor.addButton('citeaddedit', {
		icon: false,
		text: 'Add/Edit citation',
		onclick: showDialog
		//stateSelector: 'span:not([class*="citation"])'
	});

	editor.addMenuItem('citeaddedit', {
		icon: false,
		text: 'AddEdit citation',
		context: 'insert',
		onclick: showDialog
	});


});
