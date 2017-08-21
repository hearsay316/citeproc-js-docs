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

*sys*
    **Required.** A JavaScript object providing (at least) the functions
    ``retrieveLocale()`` and ``retrieveItem()``.

*style*
    **Required.** CSL style as serialized XML (if ``xmldom.js`` is used)
    or as JavaScript object (if ``xmljson.js`` is used).

*lang*
    *Optional.* A language tag compliant with RFC 5646.  Defaults to ``en``.
    Styles that contain a ``default-locale`` attribute value
    on the ``style`` node will ignore this option unless
    the ``forceLang`` argument is set to a non-nil value.

*forceLang*
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
JavaScript object in CSL JSON format. There are three types of field
on a CSL JSON object: The example below illustrates the structure of
the fields:

.. code-block:: javascript

   {
      "id": "item123456789",
      "type": "book",
      "title": "Book One",
      "author": [
         {
            "family": "Jones",
            "given": "Michael"
         }
      ],
      "issued": {
         "date-parts": [[ 2000, 3, 15 ]]
      }
   }

*id*
    **Required.** The ID of an item must correspond to the ID used to
    fetch it. The value may be any string or numeric value, but must
    uniquely identify the item.

*type*
    **Required.** The type must be a valid CSL type under the schema
    of the installed style. See the schemata of `CSL <https://github.com/citation-style-language/schema/blob/master/csl-types.rnc>`_
    and `CSL-M <https://github.com/Juris-M/schema/blob/master/csl-mlz.rnc#L763>`_
    for their respective lists of valid types.

*title* (ordinary-field example)
    Ordinary fields such as *title* may be set as strings or numbers.
    For the fields available on each item type, see the `listing for
    CSL <http://aurimasv.github.io/z2csl/typeMap.xml>`_ provided by
    Aurimas Vinckevicius, and `that for CSL-M
    <http://fbennett.github.io/z2csl/>`_ provided by yours truly.

*author* (creator-field example)
    Set creator fields such as *author* as an array of objects.  Three
    object formats are recognized. The illustration shows the use of
    ``family`` and ``given`` elements for personal names. In this
    format, lowercase elements before the family name are treated as
    "non-dropping" particles, and lowercase elements following the
    given name as "dropping" particles.  An articular (e.g. "Jr" or
    "III") may follow the given name and any dropping particles, set
    off with a comma.

    Alternatively, ordinary names can be delivered to the processor
    as a set of discrete fields, as shown by the following (imaginary)
    name entry:

    .. code-block:: javascript

       "author": [
          {
             "dropping-particle": "van", 
             "family": "Meer", 
             "given": "Roderick", 
             "non-dropping-particle": "der",
             "suffix": "III"
          }
       ]

    Some personal names are represented by a single field
    (e.g. mononyms such as "Prince" or "Plato"). In such cases, the
    name can be delivered as a lone ``family`` element. Institutional
    names *may* be delivered in the same way, but it is preferred to
    set them instead as a ``literal`` element:

    .. code-block:: javascript

       "author": [
          {
             "literal": "International Business Machines"
          }
       ]

*issued* (date-field example)    
    Date fields such as *issued* may be set in either of two
    formats. The example above shows a date in array format.  To
    express a range in this format, the ending date would be set as a
    second array:

    .. code-block:: javascript

       "issued": {
          "date-parts": [[ 2000, 3, 15 ], [2000, 3, 17]]
       }

    Alternatively, dates may be set in raw form, as follows:

    .. code-block:: javascript

       "issued": {
          "raw": "2000-3-15"
       }

       "issued": {
          "raw": "2000-3-15/2000-3-17"
       }

    The date parser embedded in |citeproc-js| will correctly interpret
    a number of sensible date conventions, but the numeric
    year-month-day format is unambiguous, easy to remember and simple
    to produce.

----------------------------------
Public methods: data and rendering
----------------------------------

The instantiated processor offers a few basic methods for handling
input and obtaining rendered output. A few terms will be used with
a specific meaning in the descriptions below.

*item*
    An item is a single bundle of metadata for a source to be referenced.
    See the `CSL Specification <http://docs.citationstyles.org/en/stable/specification.html>`_
    for details on the fields available on an item, and the `CSL-JSON chapter of this manual <http://citeproc-js.readthedocs.io/en/latest/csl-json/markup.html>`_
    for the format of specific field types. Every item must have an ``id``
    and a ``type``.
    
*citation*
    A citation is a set of one or more items, optionally supplemented by
    locator information, prefixes or suffixes supplied by the user.

*registry*
    The processor maintains a stateful registry of details on each item
    submitted for processing. Registry entries are maintained
    automatically, and cover matters such as disambiguation parameters,
    sort sequence, and the first reference in which an item occurs.

*citable items*
    Citable items are those meant for inclusion only if used in one or
    more citations.

*uncited items*
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

*idList*
    **Required.** A JavaScript array of item ``id`` values,
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

*idList*
    **Required.** A JavaScript array of item ``id`` values,
    which may be number or string: 

    .. code-block:: javascript

        ['Item-1', 'Item-2']

!!!!!!!!!!!!!!!!
makeBibliography
!!!!!!!!!!!!!!!!

The ``makeBibliography()`` method returns a single bibliography object based on
the current state of the processor registry. It accepts on optional argument.


.. code-block:: javascript

   var result = citeproc.makeBibliography(filter);


   
The object returned is an array 


The value returned by this command is a two-element list, composed of
a JavaScript array containing certain formatting parameters, and a
list of strings representing bibliography entries.  It is the responsibility
of the calling application to compose the list into a finish string
for insertion into the document.  The first
element —- the array of formatting parameters —- contains the key/value
pairs shown below (the values shown are the processor defaults in the
HTML output mode):

.. sourcecode:: js

   [
      { 
         maxoffset: 0,
         entryspacing: 0,
         linespacing: 0,
         hangingindent: 0,
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


!!!!!!!!!!!!!!!!
Selective output
!!!!!!!!!!!!!!!!

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

.. sourcecode:: js

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

.. sourcecode:: js

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

.. sourcecode:: js

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

.. sourcecode:: js

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




!!!!!!!!!!!!!!!!!!!!!!
processCitationCluster
!!!!!!!!!!!!!!!!!!!!!!

!!!!!!!!!!!!!!!!!!!!!!
previewCitationCluster
!!!!!!!!!!!!!!!!!!!!!!

!!!!!!!!!!!!!!!!!!!
makeCitationCluster
!!!!!!!!!!!!!!!!!!!

