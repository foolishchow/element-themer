const download = require('download');
const Stream = require('stream');
const Emitter = require('events').EventEmitter;
const emitter = new Emitter();
const gs = require('glob-stream');
const fs = require('fs-extra');
const _fs = require('fs');
const path = require('path');
const Entities = require('html-entities').XmlEntities;
const cheerio = require('cheerio');

emitter.on('start',()=>{
    let ls = download('https://codeload.github.com/ElemeFE/element/zip/gh-pages', 'tmp',{extract:true})
    ls.on('downloadProgress', function(progress){
        console.info(progress)
    })
    console.info('download element-master example')
    ls.then(function (data) {
        console.info('download element-master success');
        emitter.emit('downloaded')
    })
});
emitter.on('downloaded',()=>{
    console.info('empty examples dir');
    fs.emptyDir('examples',err=>{
        if(err) return emitter.emit('err','empty dir examples',err);
        emitter.emit('emptyed')
        console.info('emptyed examples dir');
    })
});
class transform extends Stream.Transform{
    constructor(base,targetBase){
        super({objectMode: true});
        this.base = base;
        this.targetBase = targetBase;
    }

    _transform(chunk, encoding, callback) {
        let file = chunk.path.replace(this.base,'');
        let targetFile = path.join(this.targetBase,file);
        fs.ensureFileSync(targetFile);
        let target = _fs.createWriteStream(targetFile)
        _fs.createReadStream(chunk.path)
            .pipe(target)
        target.on('close',()=>{
            callback();
        })
            
    }

    _flush(callback) {
        callback();
    }
}
emitter.on('emptyed',()=>{
    console.info('copy files to examples dir');
    let base = path.join(__dirname,'../tmp/element-gh-pages'),
        targetBase = path.join(__dirname,'../examples');
    let trans = new transform(base,targetBase);   
    trans.on('finish',()=>{
        emitter.emit('copyed')
        console.info('copyed files to examples dir');
    }) 
    gs([
        'tmp/element-gh-pages/*.css',
        'tmp/element-gh-pages/*.js',
        'tmp/element-gh-pages/static/*.*',
        'tmp/element-gh-pages/index.html'
    ])
    .pipe(trans)
});

emitter.on('copyed',()=>{
    let indexFile = _fs.readFileSync('./examples/index.html');
    let $ = cheerio.load(indexFile);
    $('head').append('<link rel="stylesheet" href="./dev-theme/index.css">');
    let html =  new Entities().decode($.html());
    fs.writeFileSync('./examples/index.html',html)
});
emitter.emit('start')