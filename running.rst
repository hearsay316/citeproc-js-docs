=====================
Running the Processor
=====================

.. include:: substitutions.txt

|CCBYSA| `Frank Bennett <https://twitter.com/fgbjr>`_

------------------------

------------
Introduction
------------

The processor loads as a single ``CSL`` object, and must be instantiated
before use:

.. code-block:: javascript

   var citeproc = new CSL.Engine(sys, style, lang, forceLang);

**sys**
    *Required.* A JavaScript object providing (at least) the functions
    ``retrieveLocale()`` and ``retrieveItem()``.

**style**
    *Required.* CSL style as serialized XML (if ``xmldom.js`` is used)
    or as JavaScript object (if ``xmljson.js`` is used).

**lang**
    *Optional.* A language tag compliant with RFC 5646.  Defaults to ``en``.
    Styles that contain a ``default-locale`` attribute value
    on the ``style`` node will ignore this option unless
    the ``forceLang`` argument is set to a non-nil value.

**forceLang**
    *Optional.* When set to a non-nil value, force the use of the
    locale set in the ``lang`` argument, overriding
    any language set in the ``default-locale`` attribute
    on the ``style`` node.


--------------------------
Required ``sys`` functions
--------------------------

Two locally defined synchronous functions on the ``sys`` object must
be supplied to acquire runtime inputs.

!!!!!!!!!!!!!!
retrieveLocale
!!!!!!!!!!!!!!

The ``retrieveLocale()`` function fetches CSL locales needed at
runtime. The locale source is available for download from the `CSL
locales repository
<https://github.com/citation-style-language/locales>`_.  The function
takes a single RFC 5646 language tag as its sole argument, and returns
a locale object. The return may be a serialized XML string, an E4X
object, a DOM document, or a JSON or JavaScript representation of the
locale XML.  If the requested locale is not available, the function
must return a value that tests ``false``. The function *must* return a
value for the ``us`` locale.

!!!!!!!!!!!!
retrieveItem
!!!!!!!!!!!!

The ``retrieveItem()`` function fetches citation data for an item. The
function takes an item ID as its sole argument, and returns a
JavaScript object in `CSL JSON format <./csl-json/markup.html>`_.

----------------------------------
Public methods: data and rendering
----------------------------------

The instantiated processor offers a few basic methods for handling
input and obtaining rendered output. A few terms will be used with
a specific meaning in the descriptions below.

**item**
    An item is a single bundle of metadata for a source to be referenced.
    See the `CSL Specification <http://docs.citationstyles.org/en/stable/specification.html>`_
    for details on the fields available on an item, and the `CSL-JSON chapter of this manual <./csl-json/markup.html>`_
    for the format of specific field types. Every item must have an ``id``
    and a ``type``.
    
**citation**
    A citation is a set of one or more items, optionally supplemented by
    locator information, prefixes or suffixes supplied by the user.

**registry**
    The processor maintains a stateful registry of details on each item
    submitted for processing. Registry entries are maintained
    automatically, and cover matters such as disambiguation parameters,
    sort sequence, and the first reference in which an item occurs.

**citable items**
    Citable items are those meant for inclusion only if used in one or
    more citations.

**uncited items**
    Uncited items are those meant for inclusion regardless of whether
    they are used in a citation.

    
!!!!!!!!!!!
updateItems
!!!!!!!!!!!

The ``updateItems()`` method accepts a single argument when invoked
as a public method, and refreshes the registry with a designated
set of citable items. Citable items not listed in the argument are removed from the
registry:

.. code-block:: javascript

   citeproc.updateItems(idList);

**idList**
    *Required.* An array of item ``id`` values,
    which may be number or string: 

    .. code-block:: javascript

        ['Item-1', 'Item-2']

!!!!!!!!!!!!!!!!!!
updateUncitedItems
!!!!!!!!!!!!!!!!!!

Like its corollary above, the ``updateUncitedItems()`` method  the registry accepts a single
argument, but refreshes the registry with a designated set of uncited items.
Uncited items not listed in the argument are removed from the registry.


.. code-block:: javascript

   citeproc.updateItems(idList);

**idList**
    *Required.* A JavaScript array of item ``id`` values,
    which may be number or string: 

    .. code-block:: javascript

        ['Item-1', 'Item-2']

!!!!!!!!!!!!!!!!!!!!!!
processCitationCluster
!!!!!!!!!!!!!!!!!!!!!!

Use the ``processCitationCluster()`` method to generate and
maintain citations dynamically in the text of a document. The method
takes three arguments:

.. code-block:: javascript
   
   var result = citeproc.processCitationCluster(citation, citationsPre, citationsPost);

**citation**
    The citation argument is a citation object as described in the `CSL-JSON section <./csl-json/markup.html>`_ of
    this manual.

**citationsPre**
    An array citationID/note-number pairs preceding the target citation.

**citationsPost**
    A list of citationID/note-number pairs following the target citation
    (note numbers to reflect the state of the document after the insertion).

The result is an array of two elements: a data object, and
an array of one or more index/string pairs, one for each citation
affected by the citation edit or insertion operation.

Code invoking ``processCitationCluster()`` on a document from which several citations
have already been registered in the processor might look like this:

.. code-block:: javascript

   var citation = {
       properties: {
           noteIndex: 3
       },
       citationItems: {
           id: 'Item-X' // A work by Richard Snoakes
       }
   }
   var citationsPre = [ ["citation-quaTheb4", 1], ["citation-mileiK4k", 2] ];
   var citationsPost = [ ["citation-adaNgoh1", 4] ];
   var result = citeproc.processCitationCluster(citation, citationsPre, citationsPost);
   console.log(JSON.stringify(result[0], null, 2));
   {
       "bibchange": true
   }
   console.log(JSON.stringify(result[1], null, 2));
   [
       [ 1,"(Ronald Snoakes 1950)" ], // Existing citation modified by disambiguation
       [ 3,"(Richard Snoakes 1950)" ]
   ]

A worked example showing the result of multiple transactions can be
found in the `processor test suite`__.

__ https://github.com/citation-style-language/test-suite/blob/master/processor-tests/humans/integration_IbidOnInsert.txt


!!!!!!!!!!!!!!!!!!!!!!
previewCitationCluster
!!!!!!!!!!!!!!!!!!!!!!

Use ``previewCitationCluster()`` to generate accurately formatted
citations as they would appear at a given location within a document
managed using ``processCitationCluster()``. The method accepts four
arguments, the first three of which are identical to those accepted
by ``processCitationCluster()``. The fourth argument may be used to
control the output mode.

.. code-block:: javascript

    var result = citeproc..processCitationCluster(citation, citationsPre, citationsPost, format);

**citation**
    *See ``processCitationCluster()`` above.*

**citationsPre**
    *See ``processCitationCluster()`` above.*

**citationsPost**
    *See ``processCitationCluster()`` above.*

**format**
    The optional format argument may be one of ``html``, ``text`` or ``rtf``.
    If this argument is not provided, the default value set in the instantiated
    processor is used.

The result is a string representation of the target citation, in the
specified format. Changes made to the registry (necessary for correct
disambiguation, sorting and other adjustments) are reversed after the
citation is generated, leaving the registry in its original state.

    
!!!!!!!!!!!!!!!!!!!
makeCitationCluster
!!!!!!!!!!!!!!!!!!!

Use ``makeCitationCluster()`` to generate citations without the burden of
registry adjustments. The method accepts an array of cite-items as its
sole argument:

.. code-block:: javascript

    var result = citeproc.makeCitationCluster(idList);

**idList**
    An array of cite-items, as specified in the `CSL-JSON section <./csl-json/markup.html>`_ of
    this manual. Note the additional cite-item options noted there.

While ``makeCitationCluster()`` is faster than its companions, note that
it does not perform the citation sort, if any, that might be required by the
style, and that it does not perform disambiguation or apply style rules to
adjust the cites as appropriate to the context.


!!!!!!!!!!!!!!!!
makeBibliography
!!!!!!!!!!!!!!!!

The ``makeBibliography()`` method returns a single bibliography object based on
the current state of the processor registry. It accepts on optional argument.


.. code-block:: javascript

   var result = citeproc.makeBibliography(filter);

The value returned by this command is a two-element list, composed of
a JavaScript array containing certain formatting parameters, and a
list of strings representing bibliography entries.  It is the responsibility
of the calling application to compose the list into a finish string
for insertion into the document.  The first
element —- the array of formatting parameters —- contains the key/value
pairs shown below (the values shown are the processor defaults in the
HTML output mode, with registered items "Item-1" and "Item-2").

.. code-block:: javascript

   [
      { 
         maxoffset: 0,
         entryspacing: 0,
         linespacing: 0,
         hangingindent: false,
         second-field-align: false,
         bibstart: "<div class=\"csl-bib-body\">\n",
         bibend: "</div>",
         bibliography_errors: [],
         entry_ids: [\"Item-1\", \"Item-2\"]
      },
      [
         "<div class=\"csl-entry\">Book A</div>",
         "<div class=\"csl-entry\">Book C</div>"
      ]
   ]


*maxoffset*
   Some citation styles apply a label (either a number or an
   alphanumeric code) to each bibliography entry, and use this label
   to cite bibliography items in the main text.  In the bibliography,
   the labels may either be hung in the margin, or they may be set
   flush to the margin, with the citations indented by a uniform
   amount to the right.  In the latter case, the amount of indentation
   needed depends on the maximum width of any label.  The
   ``maxoffset`` value gives the maximum number of characters that
   appear in any label used in the bibliography.  The client that
   controls the final rendering of the bibliography string should use
   this value to calculate and apply a suitable indentation length.

*entryspacing*
   An integer representing the spacing between entries in the bibliography.

*linespacing*
   An integer representing the spacing between the lines within
   each bibliography entry.

*hangingindent*
   The number of em-spaces to apply in hanging indents within the
   bibliography.

*second-field-align*
   When the ``second-field-align`` CSL option is set, this returns
   either "flush" or "margin".  The calling application should
   align text in bibliography output as described in the `CSL specification`__.
   Where ``second-field-align`` is not set, this return value is set to ``false``.

*bibstart*
   A string to be appended to the front of the finished bibliography
   string.
   
*bibend*
   A string to be appended to the end of the finished bibliography
   string.


__ http://citationstyles.org/downloads/specification.html#bibliography-specific-options



------------
Dirty Tricks
------------

!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
Partial suppression of citation content
!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!


In ordinary operation, the processor generates citation strings
suitable for a given position in the document.  To support some use
cases, the processor is capable of delivering special-purpose
fragments of a citation.


^^^^^^^^^^^^^^^
``author-only``
^^^^^^^^^^^^^^^

When the ``makeCitationCluster()`` command (not documented here) is
invoked with a non-nil ``author-only`` element, everything but the
author name in a cite is suppressed.  The name is returned without
decorative markup (italics, superscript, and so forth).

.. code-block:: javascript

   var my_ids = { 
     ["ID-1", {"author-only": 1}]
   }

You might think that printing the author of a cited work,
without printing the cite itself, is a useless thing to do.
And if that were the end of the story, you would be right ...


^^^^^^^^^^^^^^^^^^^
``suppress-author``
^^^^^^^^^^^^^^^^^^^

To suppress the rendering of names in a cite, include a ``suppress-author``
element with a non-nil value in the supplementary data:

.. code-block:: javascript

   var my_ids = [
       ["ID-1", { "locator": "21", "suppress-author": 1 }]
   ]

This option is useful on its own.  It can also be used in
combination with the ``author-only`` element, as described below.


^^^^^^^^^^^^^^^^^^^^^^^^^^
Automating text insertions
^^^^^^^^^^^^^^^^^^^^^^^^^^

Calls to the ``makeCitationCluster()`` command with the ``author-only`` 
and to ``processCitationCluster()`` or ``appendCitationCluster()`` with the
``suppress-author`` control elements can be used to produce
cites that divide their content into two parts.  This permits the
support of styles such as the Chinese national standard style GB7714-87,
which requires formatting like the following:

   **The Discovery of Wetness**

   While it has long been known that rocks are dry :superscript:`[1]`  
   and that air is moist :superscript:`[2]` it has been suggested by Source [3] that 
   water is wet.

   **Bibliography**

   [1] John Noakes, *The Dryness of Rocks* (1952).

   [2] Richard Snoakes, *The Moistness of Air* (1967).

   [3] Jane Roe, *The Wetness of Water* (2000).

In an author-date style, the same passage should be rendered more or
less as follows:

   **The Discovery of Wetness**

   While it has long been known that rocks are dry (Noakes 1952)  
   and that air is moist (Snoakes 1967) it has been suggested by Roe (2000)
   that water is wet.

   **Bibliography**

   John Noakes, *The Dryness of Rocks* (1952).

   Richard Snoakes, *The Moistness of Air* (1967).

   Jane Roe, *The Wetness of Water* (2000).

In both of the example passages above, the cites to Noakes and Snoakes
can be obtained with ordinary calls to citation processing commands.  The
cite to Roe must be obtained in two parts: the first with a call
controlled by the ``author-only`` element; and the second with
a call controlled by the ``suppress-author`` element, *in that order*:

.. code-block:: javascript

   var my_ids = { 
     ["ID-3", {"author-only": 1}]
   }

   var result = citeproc.makeCitationCluster( my_ids );

... and then ...
   
.. code-block:: javascript

   var citation, result;

   citation = { 
     "citationItems": ["ID-3", {"suppress-author": 1}],
     "properties": { "noteIndex": 5 }
   }

   [data, result] = citeproc.processCitationCluster( citation );

In the first call, the processor will automatically suppress decorations (superscripting).
Also in the first call, if a numeric style is used, the processor will provide a localized 
label in lieu of the author name, and include the numeric source identifier, free of decorations.
In the second call, if a numeric style is used, the processor will suppress output, since
the numeric identifier was included in the return to the first call.

Detailed illustrations of the interaction of these two control
elements are in the processor test fixtures in the
"discretionary" category: 

* `AuthorOnly`__
* `CitationNumberAuthorOnlyThenSuppressAuthor`__
* `CitationNumberSuppressAuthor`__
* `SuppressAuthorSolo`__

__ http://bitbucket.org/bdarcus/citeproc-test/src/tip/processor-tests/humans/discretionary_AuthorOnly.txt
__ http://bitbucket.org/bdarcus/citeproc-test/src/tip/processor-tests/humans/discretionary_CitationNumberAuthorOnlyThenSuppressAuthor.txt
__ http://bitbucket.org/bdarcus/citeproc-test/src/tip/processor-tests/humans/discretionary_CitationNumberSuppressAuthor.txt
__ http://bitbucket.org/bdarcus/citeproc-test/src/tip/processor-tests/humans/discretionary_SuppressAuthorSolo.txt


!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
Selective output with ``makeBibliography()``
!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

The ``makeBibliography()`` command accepts one optional argument,
which is a nested JavaScript object that may contain
*one of* the objects ``select``, ``include`` or ``exclude``, and
optionally an additional  ``quash`` object.  Each of these four objects
is an array containing one or more objects with ``field`` and ``value``
attributes, each with a simple string value (see the examples below).
The matching behavior for each of the four object types, with accompanying
input examples, is as follows:

``select``
   For each item in the bibliography, try every match object in the array against
   the item, and include the item if, and only if, *all* of the objects match.

.. admonition:: Hint

   The target field in the data items registered in the processor
   may either be a string or an array.  In the latter case,
   an array containing a value identical to the
   relevant value is treated as a match.

.. code-block:: javascript

   var myarg = {
      "select" : [
         {
            "field" : "type",
            "value" : "book"
         },
         {  "field" : "categories",
             "value" : "1990s"
         }
      ]
   }

   var mybib = cp.makeBibliography(myarg);

``include``
   Try every match object in the array against the item, and include the
   item if *any* of the objects match.

.. code-block:: javascript

   var myarg = {
      "include" : [
         {
            "field" : "type",
            "value" : "book"
         }
      ]
   }

   var mybib = cp.makeBibliography(myarg);

``exclude``
   Include the item if *none* of the objects match.

.. code-block:: javascript

   var myarg = {
      "exclude" : [
         {
            "field" : "type",
            "value" : "legal_case"
         },
         {
            "field" : "type",
            "value" : "legislation"
         }
      ]
   }

   var mybib = cp.makeBibliography(myarg);

``quash``
   Regardless of the result from ``select``, ``include`` or ``exclude``,
   skip the item if *all* of the objects match.


.. admonition:: Hint

   An empty string given as the field value will match items
   for which that field is missing or has a nil value.

.. code-block:: javascript

   var myarg = {
      "include" : [
         {
            "field" : "categories",
            "value" : "classical"
         }
      ],
      "quash" : [
         {
            "field" : "type",
            "value" : "manuscript"
         },
         {
            "field" : "issued",
            "value" : ""
         }
      ]
   }

   var mybib = cp.makeBibliography(myarg);




