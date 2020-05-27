const core = require('@actions/core');
const { context, GitHub } = require('@actions/github');
const fs = require('fs').promises;
const path = require('path');

const packagesFileName = "metadata/packages.json";

console.log('Starting.');

async function run() {
    try {
        const fileStr = await fs.readFile(packagesFileName, 'utf-8');
        const packages = JSON.parse(fileStr);
        
        const files = JSON.parse(core.getInput('matrix')).include;
        const version = core.getInput('version');
        
        const newData = {};
        
        for(let i = 0; i < files.length; i++) {
            const fileName = files[i].name;
            const extension = files[i].extension;
            const fileNameArr = fileName.split(/\-(?=[^\-]+$)/);
            const engineName = fileNameArr[0];
            const steamid = fileNameArr[1];
            
            console.log(`Found ${engineName} for steam-id ${steamid}`);
            
            if(packages[steamid]) {
                if(!newData[steamid]) {
                    newData[steamid] = packages[steamid];
                    newData[steamid].download = [];
                }
                
                newData[steamid].download.push({
                    name: engineName,
                    url: `https://bintray.com/luxtorpeda-dev/assets/download_file?file_path=`,
                    file: `${fileName}-${version}${extension}`
                });
                
                console.log(`Updating ${steamid} to ${JSON.stringify(newData[steamid].download)}`);
            }
        }
        
        for(let steamid in newData) {
            packages[steamid] = newData[steamid];
        }
        
        const finalPackagesStr = JSON.stringify(packages, null, 4);
        await fs.writeFile(packagesFileName, finalPackagesStr);
    }
    catch (error) {
        core.setFailed(error.message);
    }
}

run();
