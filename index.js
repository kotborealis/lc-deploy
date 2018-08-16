const debug = require('debug')('lc-deploy-debug');
const log = require('debug')('lc-deploy');

const config = require('chen.js').config.resolve();

const branches = Object.keys(config.branch_to_path);

const {promisify} = require('util');
const exec = promisify(require('child_process').exec);
const {resolve} = require('path');

const http = require('http');
const qs = require('querystring');
const Formidable = require('formidable');

log(`Starting lc-deploy on port ${config.port}`);

http.createServer(async (req, res) => {
    try{
        await handler(req, res);
    }
    catch(error){
        debug(`Error: `, error);
        res.write(error);
        res.end();
    }
}).listen(config.port);

const handler = async (req, res) => {
    debug("Got request");

    if(req.method !== 'POST')
        throw `Not a POST request`;

    const {fields, files} = await parse(req);
    const {name = 'noname', branch, secret} = fields;

    debug("Fields: %O", fields);

    if(branches.indexOf(branch) < 0)
        throw `No such branch: ${branch}`;

    if(secret !== config.secret)
        throw `Bad secret: ${secret}`;

    if(!files.build)
        throw `No file named 'build'`;

    const path = config.branch_to_path[branch];
    log(`Deploying build ${name} from branch ${branch} to path ${path}`);

    debug(`Clearing path ${path}`);
    await exec(`rm -rf ${resolve(path, '*')}`);
    await exec(`mkdir -p ${resolve(path)}`);

    log(`Unpacking build to ${path}`);
    await exec(`tar -f ${files.build.path} ` + 
        `--strip-components=${config.strip_components} ` + 
        `-x -C ${path}`);

    log(`Deployed build ${name} from branch ${branch} to path ${path}`);

    res.end();
}

const parse = (req) => new Promise((resolve, reject) => {
    const form = new Formidable.IncomingForm();
    form.parse(req, (err, fields, files) => {
        if(err){
            reject(err);
        }            
        else{
            resolve({fields, files});
        }
    });
});