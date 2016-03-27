=====================
Release Announcements
=====================

.. include:: substitutions.txt
|CCBYSA|_ `Frank Bennett <https://twitter.com/fgbjr>`_

------------------------

-------
v1.1.90
-------

There are many changes to the infrastructure behind this release, and
few changes to functionality apart from bug fixes. This back-room work
will allow quicker releases, and lays a solid foundation for the
development of legal style modules.

Here are the main items:

**Processor code on GitHub**
   Most citation-related programming activity takes place on GitHub,
   and I finally bit the bullet and moved the citeproc-js code there,
   for easier deployment and smoother collaboration with developers.

**JavaScript engine testing**
   Until recently, the processor was tested only in the Rhino
   JavaScript engine that runs in Java. Rhino is not used in browsers,
   and where the processor behaved differently under a browser engine
   (when sorting citations, for example), the fault was not picked up
   until a user noticed in the field. The test suite can now run
   alternative JS engines, and I will always test against the leading
   four engines (Rhino [Java], Spidermonkey [Firefox], V8 [Google
   Chrome], and JavaScript Core [Safari]) before releases.

**Style and locale parsing** 
   To do its thing, the processor must parse the XML of a style file
   and its associated locale strings for internal use. Although
   citeproc-js supported several methods of parsing XML (DOM, E4X, and
   a pre-parsed bespoke JSON format), setup was a non-standard
   ill-documented headache, with the processor "discovering" an
   unconnected parser object via JavaScript closure--a procedure that
   is as clumsy as it sounds. The parsers are now embedded in the
   processor itself, and it will digest any form of XML that you throw
   at it. Deployments should be much simpler for it.

**Validated test fixtures**
   The test suite that backs up processor development hadn't received
   much attention in recent years (apart from the addition of many
   test fixtures). The long-dormant facility for validating the CSL
   style objects used for testing has been resurrected, and all test
   CSL now passes validation. This brings greater assurance that what
   we see in the test framework will replicate in the field.

**Locators in legal style modules** 
   Modular style code is challenging for locator formatting, in
   particular, because these are heavily dependent on context, and the
   context is supplied by the calling style. With revisions to CSL-M,
   the extended version of CSL used in Juris-M styles, locators can be
   positioned using "smart conditions" that read the essential
   features of surrounding context. As a result the burden on legal
   style development has lightened considerably, and we are now ready
   to scale the system out to cover additional jurisdictions.

**Disambiguation**
   The processor compares the shortest form of citations for ambiguity
   before adding information to citations. Legal styles that implement
   a "five-footnote rule" must test the *near* form of cites for this
   to work. That wasn't happening, but it is now.

**Straight-quotes hanging bug** 
   When straight quotes were set as the preferred quotation marks in a
   new CSL locale, it triggered a hanging bug in the processor. This
   has been fixed.

**Nesting mismatch errors**
   The processor builds citations as deeply nested string sets, with
   the siblings joined by a delimiter at each level to produce printed
   output. For performance reasons the nesting is "spoofed" by markers
   in a list executed from start to finish, and if the markers are
   incorrectly place, weird things can happen (in theory). The markers
   were *very slightly* incorrect in two instances that manifested in
   Zotero/Juris-M, but not in the pre-release test suite. The bugs
   have been fixed, and the test suite has been fixed to pick these
   errors up if they every occur again.

**Arabic locale**
   The Arabic locale was not loading. At all. Ever. This has been
   fixed.

**Charset sniffing** 
   The regular expression used to guess whether the character set of
   some strings is "romanesque" included some dingbat-type
   characters. These have been removed.

**Safe syntax for global replacements**
   The processor was attempting to perform global replacements with
   str.replace("old", "new", "g"). This worked in Rhino, but broken in
   browser JavaScript engines. That code has been replaced with
   str.split("old").join("new"), which works correctly everywhere.

**Safer sorting**
   Internal sort keys included spaces, and spaces sorted differently
   depending on the JavaScript engine. Spaces have been replaced with
   "A" in sort keys, which has the effect of forcing the treatment of
   each element as a separate sort key.

**Remove lurking list comprehensions**
   List comprehensions (as in [key, val] = myFun();) were removed from
   citeproc-js quite some time ago, because they are not valid across
   all JavaScript engines. Two still remained in a debugging
   statement. They have been removed.
