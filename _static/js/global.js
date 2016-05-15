window.addEventListener('load', function(e){
    console.log('RUN! RUN FOR YOUR LIVES!');
    const moreButton = document.getElementById('more').parentNode;
    const moreParent = moreButton.parentNode;
    const siblings = [];
    while (moreParent.nextSibling) {
        let last = moreParent.parentNode.childNodes[moreParent.parentNode.childNodes.length - 1];
        siblings.push(last);
        moreParent.parentNode.removeChild(last);
    }
    const postContainer = document.createElement('div');
    postContainer.setAttribute('id', 'more-container');
    postContainer.hidden = true;
    moreParent.parentNode.insertBefore(postContainer, moreParent.nextSibling);
    for (let i = 0, ilen = siblings.length; i < ilen; i++) {
        postContainer.insertBefore(siblings[i], postContainer.firstChild);
    }
    moreButton.parentNode.removeChild(moreButton);
    moreParent.parentNode.insertBefore(moreButton, postContainer);
    moreButton.firstChild.hidden = false;
    if (document.URL.match(/\#/) && !document.URL.match(/#demo-my-amazing/)) {
        const more = document.getElementById('more');
        const moreContainer = document.getElementById('more-container');
        more.innerHTML = 'Less ...';
        moreContainer.hidden = false;
    }
});

window.addEventListener('hashchange', function(e){
    const more = document.getElementById('more');
    const moreContainer = document.getElementById('more-container');
    if (e.newURL.match(/\#/) && !document.URL.match(/#demo-my-amazing/)) {
        more.innerHTML = 'Less ...';
        moreContainer.hidden = false;
    } else {
        more.innerHTML = 'More ...';
        moreContainer.hidden = true;
    }
});

window.addEventListener('click', function(e){
    if (e.target.getAttribute('id') === 'more') {
        const more = document.getElementById('more');
        const moreContainer = document.getElementById('more-container');
        if (moreContainer.hidden) {
            more.innerHTML = 'Less ...';
            moreContainer.hidden = false;
        } else {
            more.innerHTML = 'More ...';
            moreContainer.hidden = true;
        }
    }
});
