"use strict";

// Okay, so we've done the first pass over this.
// The essential ops:

// (1) Open a menu at current document position.
// (2) Insert, edit, or remove citation node.

// Unpacking that, it looks like this:

// (1) Open a menu at current document position.
//   (a) Set a class:citation span placeholder if necessary.
//   (b) Hang menu off of class:citation span.
// (2) Perform click-handler from menu, which:
//   * If no citationID on class:citation span ...
//      ... and empty menu: just deletes the node.
//      ... and menu content: file request w/empty citationID
//   * If has citationID on class:citation span ...
//      ... and empty menu, then ...
//           ... if now no citations, file init request.
//           ... if still citations, refile 1st citation.
//      ... and menu content: file request w/citationID


class CiteSupportBase {

    constructor() {
        this.config = {
            debug: true,
            mode: 'note',
            defaultLocale: 'en-US',
            defaultStyle: 'jm-indigobook-law-review',
            citationIDs: {},
            citationByIndex: [],
            processorReady: false
        };
        const me = this;
        this.worker = new Worker('_static/js/citeworker.js');
        this.worker.onmessage = function(e) {
            switch(e.data.command) {
            /**
             * In response to `callInitProcessor` request, refresh
             *   `config.mode`, and document citations (if any)
             *   and document bibliography (if any).
             *
             * @param {string} xclass Either `note` or `in-text` as a string
             * @param {Object[]} rebuildData Array of elements with the form `[citationID, noteNumber, citeString]`
             * @param {Object[]} bibliographyData Array of serialized xHTML bibliography entries
             */
            case 'initProcessor':
                me.debug('initProcessor()');
                me.config.mode = e.data.xclass;
                const citationData = me.convertRebuildDataToCitationData(e.data.rebuildData);
                me.setCitations(me.config.mode, citationData);
                me.setBibliography(e.data.bibliographyData);
                me.config.processorReady = true;
                break;
             /**
              * In response to `callRegisterCitation`, refresh `config.citationsByIndex`,
              *   set citations that require update in the document, replace
              *   the bibliography in the document, and save the `citationByIndex` array
              *   and the `citationIDs` object for persistence.
              *
              * @param {Object[]} citationByIndex Array of registered citation objects
              * @param {Object[]} citationData Array of elements with the form `[noteNumber, citeString]`
              * @param {Object[]} bibliographyData Array of serialized xHTML bibliography entries
              */
            case 'registerCitation':
                me.debug('registerCitation()');
                me.config.citationByIndex = e.data.citationByIndex;
                // setCitations() implicitly updates this.config.citationIDs
                me.setCitations(me.config.mode, e.data.citationData, true);
                me.setBibliography(e.data.bibliographyData);
                me.saveData(me.config.citationByIndex, me.config.citationIDs);
                me.config.processorReady = true;
                break;
            }
        }
    }

    /**
     * Logs messages to the console if `config.debug` is true
     * @param  {string} txt The message to log
     * @return {void}
     */
    debug(txt) {
        if (this.config.debug) {
            console.log(`*** ${txt}`);
        }
    }

    /**
     * Initializes the processor, optionally populating it with a
     *   preexisting list of citations.
     *
     * @param {string} styleName The ID of a style
     * @param {string} localeName The ID of a locale
     * @param {Object[]} citationByIndex An array of citation objects with citationIDs
     * @return {void}
     */
    callInitProcessor(styleName, localeName, citationByIndex) {
        this.debug('callInitProcessor()');
        this.config.processorReady = false;
        if (!citationByIndex) {
            citationByIndex = [];
        }
        this.worker.postMessage({
            command: 'initProcessor',
            styleName: styleName,
            localeName: localeName,
            citationByIndex: citationByIndex
        });
    }

    /**
     * Registers a single citation in the processor to follow
     *   citations described by `preCitations` and precede those
     *   described in `postCitations`.
     *
     * @param {Object{}} citation A citation object
     * @param {Object[]} preCitations An array of `[citationID, noteNumber]` pairs in document order
     * @param {Object[]} postCitations An array of `[citationID, noteNumber]` pairs in document order
     * @return {void}
     */
    callRegisterCitation(citation, preCitations, postCitations) {
        if (!config.processorReady) return;
        this.debug('callRegisterCitation()');
        this.config.processorReady = false;
        worker.postMessage({
            command: 'registerCitation',
            citation: citation,
            preCitations: preCitations,
            postCitations: postCitations
        });
    }

    /**
     * Converts the array returned by the processor `rebuildProcessor()` method
     * to the form digested by our own `setCitations()` method.
     *
     * rebuildData has this structure:
     *    [<citation_id>, <note_number>, <citation_string>]
     *
     * setCitations() wants this structure:
     *    [<citation_index>, <citation_string>, <citation_id>]
     * 
     * @param {Object[]} rebuildData An array of values for insertion of citations into a document
     * @return {Object[]}
     */
    convertRebuildDataToCitationData(rebuildData) {
        if (!rebuildData) return;
        this.debug('convertRebuildDataToCitationData()');
        const citationData = rebuildData.map(function(obj){
            return [0, obj[2], obj[0]];
        })
        for (let i = 0, ilen = citationData.length; i < ilen; i++) {
            citationData[i][0] = i;
        }
        return citationData;
    }
    
    /**
     * Set or acquire a citation node for editing. If the node is
     * newly set, it will not have a processor-assigned citationID.
     * The presence or absence of citationID is used in later code to
     * determine how to handle a save operation.
     * 
     * This is demo code: replace it with something more sophisticated
     * for production.
     *
     * @param {Event} e An event generated by the DOM
     */
    citationWidgetHandler(e) {
        this.debug('citationWidgetHandler()');

        // In the demo, citations are set on a "citeme peg"
        // hard-coded into the document.
        //
        // If the peg has a citation node as its following sibling,
        // open it for editing.
        //
        // If the peg is not followed by a citation node, add
        // one and open it for editing.
        
        const peg = e.target;
        const sibling = peg.nextSibling;
        const hasCitation = (sibling && sibling.classList && sibling.classList.contains('citation'));
        let citation;
        if (hasCitation) {
            citation = sibling;
        } else {
            citation = document.createElement('span');
            citation.classList.add('citation');
            peg.parentNode.insertBefore(citation, peg.nextSibling);
        }
        this.citationWidget(citation);
    }
    
    /**
     * Presents an interface for inserting citations.
     * 
     * This is demo code: replace this function with something more
     * sophisticated for production.
     *
     * @param {htmlElement} citation A span node with class `citation`
     * @return {void}
     */
    citationWidget(citationNode) {
        this.debug('citationWidget()');

        const itemData = [
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
        ]

        const citeMenu = document.createElement('div');
        citeMenu.setAttribute('id', 'cite-menu');
        var innerHTML = '<div class="menu">'
        var tmpl = 

        for (var i=0,ilen=itemData.length;i<ilen;i++) {
            let itemID = itemData[i].id;
            let itemTitle = itemData[i].title;
            innerHTML += `<label><input id="${itemID}" type="checkbox" name="cite-menu-item" value="${itemID}">${itemTitle}</label><br/>`
        }
        innerHTML += '<button type="button">Save</button></div>';
        citeMenu.innerHTML = innerHTML;
        var button = document.createElement('button');
        button.setAttribute('type', 'button');
        button.innerHTML = 'Save';

        citationNode.innerHTML = "";
        citationNode.appendChild(citeMenu);
        
        const citationID = citationNode.getAttribute('id');
        if (citationID) {
            let citation;
            for (let i = 0, ilen = this.config.citationByIndex.length; i < ilen; i++) {
                if (this.config.citationByIndex[i].id === citationID) {
                    citation = this.config.citationByIndex[i];
                }
            }
            // Although citation should ALWAYS exist if document data has passed validation
            if (citation) {
                const itemIDs = citation.citationItems.map(function(obj){
                    return obj.id;
                });
                for (let i = 0, ilen = itemIDs.length; i < ilen; i++) {
                    let menuItem = document.getElementById(itemIDs[i]);
                    menuItem.checked = true;
                }
            }
        }
        button.addEventListener('click', this.citationEditHandler);
    }

    /**
     * Done to here
     */

}


const CiteSupport = CiteSupportBase => class extends CiteSupportBase {

    /**
     * Function to be run immediately after document has been loaded, and
     *   before any editing operations.
     *
     * @return {void}
     */
    initDocument() {
        this.debug('initDocument()');
        this.callInitProcessor(this.config.defaultStyle, this.config.defaultLocale);
    }

    /**
     * Update all citations based on data returned by the processor.
     * The update has two effects: (1) the id of all in-text citation
     * nodes is set to the processor-assigned citationID; and (2)
     * citation texts are updated. For footnote styles, the footnote
     * block is regenerated from scratch, using hidden text stored
     * in the citation elements.
     * 
     * @param {string} mode The mode of the current style, either `in-text` or `note`
     * @param {Object[]} data An array of elements with the form `[citationIndex, citationText, citationID]`
     * @return {void}
     */
    setCitations(mode, data) {
        this.debug('setCitations()');

        // Assure that every citation node has citationID
        // (there is a little redundancy here, we update all nodes
        // for which update details are returned by the processor)
        let citationNodes = document.getElementsByClassName('citation');
        for (let i = 0, ilen = data.length; i < ilen; i++) {
            let citationNode = citationNodes[data[i][0]];
            let citationID = data[i][2];
            citationNode.setAttribute('id', citationID);
        }
        
        if (mode === 'note') {
            const footnoteContainer = document.getElementById('footnote-container');
            if (data.length) {
                footnoteContainer.hidden = false;
            } else {
                footnoteContainer.hidden = true;
            }
            for (let i = 0, ilen = data.length; i < ilen; i++) {
                // Get data for each cite for update (ain't pretty)
                let tuple = data[i];
                let citationID = tuple[2];
                let citationNode = document.getElementById(citationID);
                let citationText = tuple[1];
                let citationIndex = tuple[0];
                let footnoteNumber = (citationIndex + 1);

                // The update itself is tricky and hackish because
                // HTML has no native mechanism for binding
                // footnote markers to footnotes proper.
                //
                //   (1) We write the citationText in a hidden sibling to
                // the in-text note number. This gives us a persistent
                // record of the footnote text.
                //
                //   (2) We then (later) iterate over the citation
                // nodes to regenerate the footnote block from scratch.
                citationNode.innerHTML = `[${footnoteNumber}]<span hidden="true">${citationText}</span>`;
            }
            // Reset the number on all footnote markers
            // (the processor does not issue updates for note-number-only changes)
            const citationNodes = document.getElementsByClassName('citation');
            for (let i = 0, ilen = citationNodes.length; i < ilen; i++) {
                let citationNode = citationNodes[i];
                let footnoteNumber = (i + 1);
                let footnoteNumberTextNode = document.createTextNode(`${footnoteNumber}`);
                citationNode.replaceChild(citationNode.firstChild, footnoteNumberTextNode);
            }
            // Remove all footnotes
            const footnotes = footnoteContainer.childNodes;
            for (let i = 0, ilen = footnotes.length; i < ilen; i++) {
                footnotes[0].parentNode.removeChild(footnotes[0]);
            }
            // Regenerate all footnotes from hidden texts
            for (let i = 0, ilen = citationNodes.length; i < ilen; i++) {
                let footnoteText = citationNodes[i].childNodes[1].innerHTML;
                let footnoteNumber = (i + 1);
                let footnote = document.createElement('div');
                footnote.classList.add('footnote');
                footnote.innerHTML = `<span class="footnote"><span class="footnote-number">[${footnoteNumber}]</span><span class="footnote-text">${footnoteText}</span></span>`;
                footnoteContainer.appendChild(footnote);
            }
        } else {
            for (let i = 0, ilen = data.length; i < ilen; i++) {
                let tuple = data[i];
                let citationID = tuple[2];
                let citationNode = document.getElementById(citationID);
                let citationText = tuple[1];
                citationNode.innerHTML = citationText;
            }
        }
    }

    /**
     * Replace bibliography with xHTML returned by the processor.
     *
     * @param {Object[]} data An array consisting of [0] an object with style information and [1] an array of serialized xHMTL bibliography entries.
     */
    setBibliography(data) {
        this.debug('setBibliography()');
        const bibContainer = document.getElementById('bibliography-container');
        if (!data || !data[1] || data[1].length === 0) {
            bibContainer.hidden = true;
            return;
        };
        const bib = document.getElementById('bibliography');
        bib.innerHTML = data[1].join('\n');
        const entries = document.getElementsByClassName('csl-entry');
        if (data[0].hangingindent) {
            for (let i = 0, ilen = entries.length; i < ilen; i++) {
                let entry = entries[i];
                entry.setAttribute('style', 'padding-left: 1.3em;text-indent: -1.3em;');
            }
        } else if (data[0]['second-field-align']) {
            for (let i = 0, ilen = entries.length; i < ilen; i++) {
                let entry = entries[i];
                entry.setAttribute('style', 'white-space: nowrap;');
            }
            const numbers = document.getElementsByClassName('csl-left-margin');
            for (let i = 0, ilen = numbers.length; i < ilen; i++) {
                let number = numbers[i];
                number.setAttribute('style', 'float: left;padding-right: 0.3em;');
            }
            const texts = document.getElementsByClassName('csl-right-inline');
            for (let i = 0, ilen = texts.length; i < ilen; i++) {
                let text = texts[i];
                text.setAttribute('style', 'display: inline-block;white-space: normal;');
            }
        }
        bibContainer.hidden = false;
    }

    showMenu() {
        this.debug('showMenu()');
        
    }
    
    handleMenuSelect() {
        this.debug('handleMenuSelect()');
    }
    
}


class SafeStorage {
    
    constructor(citesupport) {
        this.citesupport = citesupport;
    }
    
    _safeStorageGet(key, fallback) {
        let ret;
        const val = localStorage.getItem(key);
        if (!val) {
            this.citesupport.debug('No value in storage!');
            ret = fallback;
        } else {
            try {
                ret = JSON.parse(val);
            } catch (e) {
                this.citesupport.debug(`JSON parse error! ${key} ${val}`);
                ret = fallback;
            }
        }
        this.citesupport.config[key] = ret;
        return ret;
    }
    
    set defaultLocale(localeName) {
        this.citesupport.config.defaultLocale = localeName;
        localStorage.setItem('defaultLocale', localeName);
    }
    
    set defaultStyle(styleName) {
        this.citesupport.config.styleName = styleName;
        localStorage.setItem('defaultStyle', styleName);
    }
    
    set citationByIndex(citationByIndex) {
        this.citesupport.config.citationByIndex = citationByIndex;
        localStorage.setItem('citationByIndex', JSON.stringify(citationByIndex));
    }

    get defaultLocale() {
        return this._safeStorageGet('defaultLocale', 'en-US');
    }
    
    get defaultStyle() {
        return this._safeStorageGet('defaultStyle', 'jm-indigobook-law-review');
    }
    
    get citationByIndex() {
        return this._safeStorageGet('citationByIndex', []);
    }

}

class MyCiteSupport extends CiteSupport(CiteSupportBase) {
    
    constructor() {
        super();
        this.posToCitationId = [];
        this.safeStorage = new SafeStorage(this);
    }
    
    /**
     * Replace citation span nodes and get ready to roll. Puts
     *   document into the state it would have been in at first
     *   opening had it been properly saved.
     *
     * @return {void}
     */
    spoofDocument() {
        this.debug('spoofDocument()');

        // Stage 1: Check that all array items have citationID
        const citationByIndex = this.safeStorage.citationByIndex;
        const citationIDs = {};
        for (let i=0, ilen=this.config.citationByIndex.length; i > ilen; i++) {
            let citation = this.config.citationByIndex[i];
            if (!this.config.citationIDs[citation.citationID]) {
                console.log('*** WARNING: encountered a stored citation that was invalid or had no citationID. Removing citations.');
                this.safeStorage.citationByIndex = [];
                this.safeStorage.citationIDs = {};
                break;
            }
            citationIDs[citation.citationID] = true;
        }
        this.config.citationIDs = citationIDs;
            
        // Stage 2: check that all citeme pegs are in posToCitationId with existing citationIDs and set span tags
        const pegs = document.getElementsByClassName('citeme');
        for (let i=0, ilen=this.config.citationByIndex.length; i < ilen; i++) {
            let citationID = this.config.citationByIndex[i].citationID;
            if ("number" !== typeof this.citationIdToPos[citationID]) {
                console.log('*** WARNING: invalid state data. Removing citations.');
                this.safeStorage.citationByIndex = [];
                this.safeStorage.citationIDs = {};
                break;
            } else {
                let citationNode = document.createElement('span');
                citationNode.classList.add('citation');
                citationNode.setAttribute('id', citationID);
                let peg = pegs[this.citationIdToPos[citationID]];
                peg.parentNode.insertBefore(citationNode, peg.nextSibling);
            }
        }
        
        // Stage 3: check that number of citation nodes and number of stored citations matches
        const objectLength = citesupport.config.citationByIndex.length;
        const nodeLength = document.getElementsByClassName('citation').length;
        if (objectLength !== nodeLength) {
            console.log('*** WARNING: document citation node and citation object counts do not match. Removing citations.');
            this.safeStorage.citationByIndex = [];
            this.safeStorage.citationIDs = {};
            const citations = document.getElementsByClassName('citation');
            for (let i=0, ilen=citations.length; i < ilen; i++) {
                citations[0].parentNode.removeChild(citations[0]);
            }
        }
    }
}


const citesupport = new MyCiteSupport();


window.addEventListener('load', function(e){
    citesupport.spoofDocument();
    citesupport.initDocument();
});
