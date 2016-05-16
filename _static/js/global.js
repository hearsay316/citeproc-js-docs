function hasRoomForMenu(obj) {

    function findXpos(obj) {
	    var curleft = curtop = 0;
        if (obj.offsetParent) {
            do {
			    curleft += obj.offsetLeft;
			    curtop += obj.offsetTop;
            } while (obj = obj.offsetParent);
        }
	    return [curleft,curtop][0];
    }

    function findScreenWidth() {
        var w = window,
        d = document,
        e = d.documentElement,
        g = d.getElementsByTagName('body')[0],
        x = w.innerWidth || e.clientWidth || g.clientWidth
        return x;
    }
    
    return ((findScreenWidth() - findXpos(obj)) > 114);
}

window.addEventListener('load', function(e){
    var moreButton = document.getElementById('more').parentNode;
    var moreParent = moreButton.parentNode;
    var siblings = [];
    while (moreParent.nextSibling) {
        let last = moreParent.parentNode.childNodes[moreParent.parentNode.childNodes.length - 1];
        siblings.push(last);
        moreParent.parentNode.removeChild(last);
    }
    var postContainer = document.createElement('div');
    postContainer.setAttribute('id', 'more-container');
    postContainer.hidden = true;
    moreParent.parentNode.insertBefore(postContainer, moreParent.nextSibling);
    for (let i = 0, ilen = siblings.length; i < ilen; i++) {
        postContainer.insertBefore(siblings[i], postContainer.firstChild);
    }
    moreButton.parentNode.removeChild(moreButton);
    moreParent.parentNode.insertBefore(moreButton, postContainer);
    moreButton.firstChild.hidden = false;
    if (document.URL.match(/\#/) && !document.URL.match(/#(?:my-amazing|dynamic-editing)/)) {
        var more = document.getElementById('more');
        var moreContainer = document.getElementById('more-container');
        more.innerHTML = 'Less ...';
        moreContainer.hidden = false;
    }
});

window.addEventListener('hashchange', function(e){
    var more = document.getElementById('more');
    var moreContainer = document.getElementById('more-container');
    if (e.newURL.match(/\#/) && !document.URL.match(/#my-amazing/)) {
        more.innerHTML = 'Less ...';
        moreContainer.hidden = false;
    } else {
        more.innerHTML = 'More ...';
        moreContainer.hidden = true;
    }
});

window.addEventListener('click', function(e){
    if (e.target.getAttribute('id') === 'more') {
        var more = document.getElementById('more');
        var moreContainer = document.getElementById('more-container');
        if (moreContainer.hidden) {
            more.innerHTML = 'Less ...';
            moreContainer.hidden = false;
        } else {
            more.innerHTML = 'More ...';
            moreContainer.hidden = true;
        }
    }
});
