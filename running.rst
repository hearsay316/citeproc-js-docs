=====================
Running the Processor
=====================

.. include:: substitutions.txt

|CCBYSA|_ `Frank Bennett <https://twitter.com/fgbjr>`_

------------------------

------------
Introduction
------------

The processor loads as a single ``CSL`` object. To run the processor, create
and instance with the ``CSL.Engine()`` method:

.. code-block:: javascript

   var citeproc = CSL.Engine(sys, style, lang, forceLang);

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
