=======================
Dynamic editing example
=======================

.. include:: substitutions.txt
|CCBYSA|_ `Frank Bennett <https://twitter.com/fgbjr>`_

------------------------

------------
Introduction
------------

This page illustrates dynamic editing of citations.  In the sample
text below, clicking on a placeholder will open a menu with three
items that can be cited. Selecting one or more items and clicking
"Save" will adjust the citations and bibliography to reflect the
selections. Citation updates are controlled by an HTML5 web worker
with a simple API, that can be deployed to any web page, with suitable
code to call the worker and merge the result to the target text.

-----------
Sample text
-----------

|styles|

Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
eiusmod tempor incididunt ut labore et dolore magna aliqua. |citeme|
Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris
nisi ut aliquip ex ea commodo consequat. |citeme| Duis aute irure
dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat
nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt
in culpa qui officia deserunt mollit anim id est laborum. |citeme|

|footnotes|

|bib|
