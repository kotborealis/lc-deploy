const config = require('chen.js').config.resolve();

const branches = Object.keys(config.branch_to_path);

const {promisify} = require('util');
const exec = promisify(require('child_process').exec);
const {resolve} = require('path');

const http = require('http');
const createHandler = require('github-webhook-handler');
const handler = createHandler({path: '/', secret: config.secret});

console.info(`Starting lc-deploy on port ${config.port}`);

http.createServer((req, res) => 
    handler(req, res, err => { 
        res.statusCode = 404;
        res.end("404");
    })
).listen(config.port);

handler.on('error', e => console.error(`Webhook error:`, e));

handler.on('release', async (e) => {
    const name = e.payload.release.name;
    const id = e.payload.release.assets[0].id;

    const repo = e.payload.repository;

    console.log(`Deploying release ${name}`);

    let branch = null;
    try{
        branch = parse_release_name(name, branches);
        console.log(`Deploying release ${name} from branch ${branch}`);
    }
    catch(e){
        console.error(e);
    }

    const path = config.branch_to_path[branch];
    console.log(`Deploying release ${name} from branch ${branch} to path ${path}`);

    console.log(`Clearing path ${path}`);
    await exec(`rm -rf ${resolve(path, '*')}`);
    await exec(`mkdir -p ${resolve(path)}`);

    console.log(`Downloading & unpacking build to ${path}`);
    await exec(`curl -L -s -H "Accept: application/octet-stream" ` + 
        `"https://api.github.com/repos/${repo.full_name}/releases/assets/${id}` + 
        `?access_token=${config.auth_token}" ` + 
        `| tar --strip-components=${config.strip_components} -x -C ${path}`);

    console.log(`Deployed release ${name} from branch ${branch} to path ${path}`);
});

const parse_release_name = (name, branches = []) => {
    const _ = branches.map(branch => 
        name.indexOf(branch) >= 0 ? branch : undefined
    )
    .filter(i => i);

    if(_.length === 0){
        throw new Error(`Failed to parse release name ` + 
            `(${name}, ${JSON.stringify(branches)}): ` +
            `not configured`);
    }

    if(_.length === 1){
        return _[0];
    }

    if(_.length > 1){
        throw new Error(`Failed to parse release name ` + 
            `(${name}, ${JSON.stringify(branches)}): ` +
            `multiple possible branches`);
    }
};