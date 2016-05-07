=======================
Dynamic editing example
=======================

.. include:: substitutions.txt
|CCBYSA|_ `Frank Bennett <https://twitter.com/fgbjr>`_

------------------------

------------
Introduction
------------

In the sample text below, click on a placeholder, select items and
click "Save" to watch the magic. The code behind the page is explained
below the demo.

----------------------
Demo: My Amazing Essay
----------------------

**Style:** |styles|

..
   **Locale:** |locales|

Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
eiusmod tempor incididunt ut labore et dolore magna aliqua. |citeme|
Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris
nisi ut aliquip ex ea commodo consequat. |citeme| Duis aute irure
dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat
nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt
in culpa qui officia deserunt mollit anim id est laborum. |citeme|

|footnotes|

|bib|

---------------
Running locally
---------------

One of the main purposes of this page is to provide a worked example
for developers. A good way to explore the way it all works is to
run the page locally. Here is how to set that up.

^^^^^^^^^^^^
Requirements
^^^^^^^^^^^^

- `git`_
- `node.js`_
- `npm`_
- `Sphinx`_

.. _git: https://git-scm.com/
.. _`node.js`: https://nodejs.org/en/
.. _npm: https://www.npmjs.com/
.. _Sphinx: http://www.sphinx-doc.org/en/stable/

^^^^^^^^^^^
Local setup
^^^^^^^^^^^

Fetch the repo
   Clone the ``citeproc-js`` documentation project and enter
   its top-level directory:

   .. code-block:: bash

      git clone https://github.com/Juris-M/citeproc-js-docs.git --recursive
      cd citeproc-js-docs


Build the page
   The following command should work:

   .. code-block:: bash

      make html

Run a server using ``node.js``
   The built page uses ``XMLHttpRequest()`` calls, so it must be
   viewed through a web server. To run a simple server using
   ``node.js``, an incantation like this should do the trick:

   .. code-block:: bash

      npm install -g http-server
      http-server _build/html

-------------
Code elements
-------------

^^^^^^^^^^
Data units
^^^^^^^^^^

Item object
  The document editing interface must provide some mechanism for
  selecting individual citeable items for inclusion in citations.  The
  mechanism in this demo is drastically simplified; production code
  will do something more sophisticated here. Items are held as hash
  objects in CSL JSON format, each with a unique ID (string or
  numeric). A simple object with the ID "item-1" and title "My Aunt
  Sally" will have the following form:

  .. code-block:: javascript

     {
         id: "item-1",
         title: "My Aunt Sally"
     }

  See the source files under ``_static/data/items`` for sample entries
  with each of the three CSL JSON data types (string, date, and creator).

Citation object
  In the data layer, a citation is a hash object that bundles one or
  more items for inclusion in the document. The citation object for
  a new citation is constructed "manually" without a ``citationID``:
  an ID is assigned by the processor and included in the return.
  A minimal citation object for a single item with an ``id`` of "item-1"
  citing page 123 of that source will have the following form:

  .. code-block:: javascript
  
     {
       citationItems: [
         {
           id: "item-1",
           label: "page",
           locator: "123"
         }
       ],
       properties: {
         noteIndex: 1
       }
     }

  In the example above, the ``label`` and ``locator`` attributes are
  optional. The ``noteIndex`` value is manadatory, and should be set
  to the note number for a citation in a footnote or in a ``note``
  style. For in-text citations in an ``in-text`` style, its value
  should be ``0``. 

``<span class-"citation"/>``
  Citations in the document are represented by ``html:span``
  elements of the ``citation`` class, each with a unique
  ``id`` attribute assigned by the citation processor.
  When initially inserted, a citation is assigned a
  temporary placeholder ``id`` (this demo uses
  ``citation-breadcrumb``), which is replaced by the
  processor-assigned ``id`` after processing.

``config.citationByIndex``
  An array of citation objects as delivered by the processor.
  The return from the processor will contain full metadata for
  each item in ``citationItems``, and a ``citationID`` as sibling
  to ``citationItems`` and ``properties`` (items submitted without
  a ``citationID`` will be assigned one by the processor).

^^^^^^^^^^^^^^^^^^^^
Demo-specific things
^^^^^^^^^^^^^^^^^^^^

The demo sets static placeholders at three locations in the text as
"pegs" where citations can be inserted. This is the only markup: when
the page is loaded, the document contains no citation
placeholders. This differs from a production deployment, which would
store citation placeholders with addressable IDs in the text.

To spoof a production deployment, the demo stores a map of citation
IDs to "peg" indices, and another map from "peg" indices to IDs.  The
maps are reconciled with the data in ``config.citationByIndex`` on each edit,
and saved into ``localStorage``, for use in re-inserting citation
markers on page reload. This jiggery-pokery will not be needed in a
production environment, where the document will be saved with its
citation markers and their IDs, corresponding to a saved copy of
the data in ``config.citationByIndex``.

**However:** In production, a hash of the existing citation IDs
contained in the document should be maintained, in order to
identify a newly added citation in the ``citations`` array
returned to ``registerCitation()``.


^^^^^^^^^^
Worker API
^^^^^^^^^^

In the demo, citation infrastructure is contained in the global
``workaholic`` function object, loaded from ``_static/offthread/api.js``.
The object exposes two methods to the document context.

``workaholic.initProcessor(styleID, localeID)``
   This method is used on page load, on change of style, and when all
   citations have been removed from the document.  The ``styleID``
   argument is mandatory. If ``localeID`` is not provided, the
   processor will be configured with the ``en-US`` locale.

   The ``workaholic.initProcessor`` method implicitly accesses the
   ``config.citationByIndex`` array, which must be accessible in page
   context. If the array is empty, the processor will be initialized
   without citations. If the array contains citations, the processor
   will be initialized to that document state, and return an array of
   arrays as ``rebuildData``, for use in reconstructing citations in
   the document text. Each sub-array contains a citation ID, a note
   number, and a citation string. For example, if the ``styleID`` is
   for a ``note`` style, and if ``config.citationByIndex`` yields the
   citations "Wurzel Gummidge (1990)" and "My Aunt Sally (2001)," the
   ``rebuildData`` structure would look like this:

   .. code-block:: javascript

      [
          [
             "lu7Tu3ki",
             "1",
             "Wurzel Gummidge (1990)"
          ],
          [
             "ko4aNoo9",
             "2",
             "My Aunt Sally (2001)"
             
          ]
      ]

``workaholic.registerCitation(citation, preCitations, postCitations)``
   This method is used to add or to edit citations. All three
   arguments are mandatory. ``citation`` is an ordinary citation
   object as described above. ``preCitations`` and ``postCitations``
   are arrays of arrays, in which each sub-array is composed of a
   citation ID and a note number. For example, if a note citation
   is to be inserted between the "Wurzel Gummidge" and "Aunt Sally"
   citations in the example above, these would have the following form:

   .. code-block:: javascript

      preCitations = [
          [
              "lu7Tu3ki",
              "1"
          ]
      ];

      postCitations = [
          [
              "ko4aNoo9",
              "3"
          ]
      ];

   Notice the change to the note number: the processor registers
   note numbers for use in back-references, but maintenance of 
   correct note numbering must be handled in document-side code.

   The ``workaholic.registerCitation`` method receives two values from the
   processor: ``citationByIndex`` (described above) and ``citations``.
   The latter is an array of one or more arrays, each composed of a
   citation position index, a string, and a citation ID. For example,
   the return value to insert a citation "Calvin (1995); Hobbes
   (2016)" between the "Wurzel Gummidge" and "My Aunt Sally" citations
   would look something like this:

   .. code-block:: javascript

      [
         [
             1,
             "Calvin (1995); Hobbes (2016)",
             "Ith7eg8T"
         ]
      ]

   Note that the return value might contain updates for multiple
   citations.


------------------
Editing operations
------------------

^^^^^^^^^^^^^^^^^^^^^^^^
Initialize the processor
^^^^^^^^^^^^^^^^^^^^^^^^

At startup against a document with no existing
citations:

.. code-block:: javascript

   workaholic.initProcessor(styleID, localeID);


^^^^^^^^^^^^^^^^^^^^^^
Restore document state
^^^^^^^^^^^^^^^^^^^^^^

If the previously stored copy of ``config.citationByIndex`` contains
citation objects, the processor will return an array of
data for insertion into the document, one element for each
citation, in document order:

.. code-block:: javascript

   workaholic.initProcessor(styleID, localeID);

Insert the strings into their target ``html:span`` tags
and you are ready to go.

^^^^^^^^^^^^^^^^^^^^^
Insert a new citation
^^^^^^^^^^^^^^^^^^^^^

After setting an ``html:span`` tag with class ``citation`` and a
placeholder ID at the location of the new citation, constructing a
citation object and generating data arrays for citations before and
after the target:

.. code-block:: javascript

   workaholic.registerCitation(citation, preCitations, postCitations);

When inserting strings from the ``citations`` array into their
respective locations, the freshly added citation will be the
one with an unknown citation ID.

^^^^^^^^^^^^^^^^^^^^^^^^^
Edit an existing citation
^^^^^^^^^^^^^^^^^^^^^^^^^

The process is the same as for inserting a new citation, except
that no placeholder tag is set, and all citation IDs will be
known:

.. code-block:: javascript

   workaholic.processCitationCluster(citation, preCitations, postCitations);

^^^^^^^^^^^^^^^^^
Delete a citation
^^^^^^^^^^^^^^^^^

Remove the ``html:span`` node of the target citation, remove
its data from the ``config.citationByIndex`` array, and remove its
ID from any hash where its value is recorded. Then update
citations by "editing" the first citation in the document:

.. code-block:: javascript

   workaholic.processCitationCluster(citation, [], postCitations);

^^^^^^^^^^^^^^^^^^^^
Remove last citation
^^^^^^^^^^^^^^^^^^^^

If ``config.citationByIndex`` has length zero after removing the
target citation, reinitialize the processor:

.. code-block:: javascript

   workaholic.initProcessor(styleID, localeID);

