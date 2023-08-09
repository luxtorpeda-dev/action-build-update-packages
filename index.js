const core = require('@actions/core');
const { context, GitHub } = require('@actions/github');
const fs = require('fs').promises;
const path = require('path');

const packagesFileName = "metadata/packagessniper_v2.json";

console.log('Starting.');

async function run() {
    try {
        const fileStr = await fs.readFile(packagesFileName, 'utf-8');
        const packages = JSON.parse(fileStr);
        
        const files = JSON.parse(core.getInput('matrix')).include;
        const version = core.getInput('version');
        const appIdsStr = core.getInput('app_ids');
        const appIds = appIdsStr.split(' ');
        
        const newData = {};
        const finalFiles = [];
        let common;
        
        for(let i = 0; i < files.length; i++) {
            const fileName = files[i].name;
            const extension = files[i].extension;
            const fileNameArr = fileName.split(/\-(?=[^\-]+$)/);
            const engineName = fileNameArr[0];
            const steamid = fileNameArr[1];
            
            const finalFile = {
                fileName,
                steamid,
                engineName,
                extension
            };
            
            if(steamid === 'common') {
                common = finalFile;
                continue;
            } else {
                finalFiles.push(finalFile);
            }
        }
        
        if(common) {
            for(let i = 0; i < appIds.length; i++) {
                finalFiles.push({
                    fileName: common.fileName,
                    steamid: appIds[i],
                    engineName: common.engineName,
                    extension: common.extension,
                    common: true
                });
            }
        }
        
        for(let i = 0; i < finalFiles.length; i++) {
            const engineName = finalFiles[i].engineName;
            const steamid = finalFiles[i].steamid;
            const fileName = finalFiles[i].fileName;
            const extension = finalFiles[i].extension;
            const isCommon = finalFiles[i].common;
    
            console.log(`Found ${engineName} for steam-id ${steamid}`);

            if(steamid === 'default') {
                const game = packages.default_engine;
                const newDownloadObj = {
                    name: engineName,
                    url: `https://github.com/luxtorpeda-dev/packages/releases/download/${engineName}-${version}/`,
                    file: `${fileName}-${version}${extension}`,
                    cache_by_name: isCommon
                };

                let pushToArray = false;
                let overwriteArrIdx = -1;

                if(!game.download || !game.download.length) {
                    pushToArray = true;
                    game.download = [];
                } else {
                    for(let y = 0; y < game.download.length; y++) {
                        if(game.download[y].name === engineName) {
                            overwriteArrIdx = y;
                            break;
                        }
                    }

                    if(overwriteArrIdx === -1) {
                        pushToArray = true;
                    }
                }

                if(pushToArray) {
                    game.download.push(newDownloadObj);
                } else if(overwriteArrIdx !== -1) {
                    game.download[overwriteArrIdx] = newDownloadObj;
                }

                console.log(`Updating ${steamid} to ${JSON.stringify(game.download)}`);
                packages.default_engine = game;
                continue;
            }

            for(let z = 0; z < packages.games.length; z++) {
                const game = packages.games[z];
                if(game.app_id === steamid) {
                    const newDownloadObj = {
                        name: engineName,
                        url: `https://github.com/luxtorpeda-dev/packages/releases/download/${engineName}-${version}/`,
                        file: `${fileName}-${version}${extension}`,
                        cache_by_name: isCommon
                    };

                    let pushToArray = false;
                    let overwriteArrIdx = -1;

                    if(!game.download || !game.download.length) {
                        pushToArray = true;
                        game.download = [];
                    } else {
                        for(let y = 0; y < game.download.length; y++) {
                            if(game.download[y].name === engineName) {
                                overwriteArrIdx = y;
                                break;
                            }
                        }

                        if(overwriteArrIdx === -1) {
                            pushToArray = true;
                        }
                    }

                    if(pushToArray) {
                        game.download.push(newDownloadObj);
                    } else if(overwriteArrIdx !== -1) {
                        game.download[overwriteArrIdx] = newDownloadObj;
                    }

                    console.log(`Updating ${steamid} to ${JSON.stringify(game.download)}`);
                    packages.games[z] = game;
                    break;
                }
            }
        }
        
        const finalPackagesStr = JSON.stringify(packages, null, 4);
        await fs.writeFile(packagesFileName, finalPackagesStr);
    }
    catch (error) {
        core.setFailed(error.message);
    }
}

run();
