import express from 'express';
import simpleGit from 'simple-git';
import fs from 'fs';
import { IPv4 } from "ip-num/IPNumber";
import { BinarySearchTree, BinarySearchTreeNode, AvlTree, AvlTreeNode } from '@datastructures-js/binary-search-tree';
import { getIPRange } from 'get-ip-range';

const app = express();
const repo = 'https://github.com/firehol/blocklist-ipsets';
let ipTree = new BinarySearchTree;

function ipRangeToArray (ip : string) {
    if (ip.indexOf("/") > 0) {
        return getIPRange(ip);
    } else {
        return [ip];
    }
}

function getIpList (directory: string) {
    const dir = directory
    const files = fs.readdirSync(dir)
    const treeReturn = new BinarySearchTree;

    for (const file of files) {
        if (file.endsWith(".ipset")) {
            fs.readFile(directory + file, (err, data) => {
                if (err) throw err;
                var lines = data.toString().split(/\r?\n/);
                lines.forEach(line => {
                    if (line.startsWith("#") || line.length < 5) return;
                    try {
                        let ipRange = ipRangeToArray(line);
                        ipRange.forEach(ip => {
                            let ipv4 = new IPv4(ip);
                            let ip_num = ipv4.getValue().toJSNumber();
                            treeReturn.insert(ip_num);                            
                        });
                    } 
                    catch (err) {
                        console.log(err);
                    }
                });
            });
        }
    }       
    return treeReturn; 
}

function isIpValid(ip: string) {
    try {
        let ipv4 = new IPv4(ip);
        let ip_num = ipv4.getValue().toJSNumber();
        return true;
    } 
    catch (err) {
        return false;
    }
}
function isIpBlocked(ip: string) {
    let ipv4 = new IPv4(ip);
    let ip_num = ipv4.getValue().toJSNumber();

    const search = ipTree.find(ip_num);
    if (search) return true;
    else return false;
}

function updateBlockList(repo: string) {
    simpleGit('./blocklist-ipsets/').fetch()
    .then(() => {
        ipTree = getIpList("./blocklist-ipsets/");
    });
}

function newBlockList(repo: string) {
    simpleGit()
    .clone(repo)
    .then(() => {
      ipTree = getIpList("./blocklist-ipsets/");
  })
}



fs.access("./blocklist-ipsets/", function(error) {
    if (error) {
        newBlockList(repo);
    } else {
        updateBlockList(repo);
    }
})

setInterval(function(){ 
    updateBlockList(repo);
}, 300000)


app.get('/api/v1/ipblocklist/', (req, res) => {
    if (req.query.ip == null) {
        res.status(500).send("Forgot ip address!");
    }
    let ip = String(req.query.ip);
    if (! isIpValid(ip)) return res.status(500).send("Invalid IP!");

    res.send({
        "result" : isIpBlocked(ip)
    });
})

app.get('/health', (req, res) => {
    res.status(200).send("healthy");
})

app.listen(3000, () => {
    console.log('IP Block Checker is listening on port 3000');
})
