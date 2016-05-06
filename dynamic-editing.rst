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

^^^^^
Setup
^^^^^

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
