========
CSL-JSON
========

.. include:: ../substitutions.txt
|CCBYSA| `Frank Bennett <https://twitter.com/fgbjr>`_

------------------------

------------
Introduction
------------

Citation data is added to the instantiated processor in JSON format, using
one of two structures:

* CSL-JSON `items` carry the details of individual references.  These
  must be made available to the `retrieveItem()` hook supplied by the
  calling application. Item data is in one of three forms:

  * Date fields.
  * Name fields.
  * Ordinary fields (both text or numeric).
    
    * In text fields, the processor recognizes a limited set of
      HTML-like tags for visual formatting.

* CSL-JSON `citations` carry the details of specific in-document
  citations:

  * Document position and configuration (such as sorting or the use of
    terminal punctuation); and
  * One or more `items` to be used in composing the citation, and
    pinpoint reference, prefix, and suffix details for each.

The structure of `item` and `citation` objects is described
below. The HTML-like syntax use to control string formatting
is described separately, as it has impact at user level.

-------------------------
HTML-like formatting tags
-------------------------

Several tags are recognized in CSL-JSON input. While they are set in
an HTML-like syntax for convenience of processing, that mimicry does
not imply general support for HTML markup in the processor: tags that
do not fit the patterns described below are treated as raw text, and
will be escaped and rendered verbatim in output.

Note that tags must be JSON-encoded in the input object::

   This is &lt;italic&gt; text.

**<i>italics</i>**
  Set the enclosed text in *italic* style. This tag will "flip-flop,"
  setting the text in roman type if the style applies italic style
  to the field.

**<b>bold</b>**
  Set the enclosed text in **boldface** type. This tag will "flip-flop,"
  setting the text in roman type if the style applies boldface type
  to the field.

**<span style="font-variant: small-caps;">superscript</span>**
  Set the enclosed text in |small-caps|. This tag will "flip-flop,"
  setting the text in roman type if the style applies small-caps
  to the field.

**<sup>superscript</sup>**
  Set the enclosed text in |superscript| form.

**<sub>subscript</sub>**
  Set the enclosed text in |subscript| form.

**<span class="nocase">superscript</span>**
  Suppress case-changes that would otherwise be applied to the
  enclosed text by the style.
