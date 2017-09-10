var connect = require('connect');
var path = require('path');
pagePath = path.join(__dirname, '_build', 'html');
var serveStatic = require('serve-static');
connect().use(serveStatic(pagePath)).listen(8080, function(){
    console.log('Server running on 8080...');
});
