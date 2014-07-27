var script = document.createElement('script');
script.type = 'text/javascript';
script.src = chrome.extension.getURL('script.js');
window.document.body.appendChild(script);

var link = document.createElement('link');
link.rel = 'stylesheet';
link.type = 'text/css';
link.href = chrome.extension.getURL('style.css');
window.document.head.appendChild(link);
