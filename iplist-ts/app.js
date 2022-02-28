"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const simple_git_1 = __importDefault(require("simple-git"));
const fs_1 = __importDefault(require("fs"));
const IPNumber_1 = require("ip-num/IPNumber");
const binary_search_tree_1 = require("@datastructures-js/binary-search-tree");
const get_ip_range_1 = require("get-ip-range");
const app = (0, express_1.default)();
const repo = 'https://github.com/firehol/blocklist-ipsets';
let ipTree = new binary_search_tree_1.BinarySearchTree;
function ipRangeToArray(ip) {
    if (ip.indexOf("/") > 0) {
        return (0, get_ip_range_1.getIPRange)(ip);
    }
    else {
        return [ip];
    }
}
function getIpList(directory) {
    const dir = directory;
    const files = fs_1.default.readdirSync(dir);
    const treeReturn = new binary_search_tree_1.BinarySearchTree;
    for (const file of files) {
        if (file.endsWith(".ipset")) {
            fs_1.default.readFile(directory + file, (err, data) => {
                if (err)
                    throw err;
                var lines = data.toString().split(/\r?\n/);
                lines.forEach(line => {
                    if (line.startsWith("#") || line.length < 5)
                        return;
                    try {
                        let ipRange = ipRangeToArray(line);
                        ipRange.forEach(ip => {
                            let ipv4 = new IPNumber_1.IPv4(ip);
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
function isIpValid(ip) {
    try {
        let ipv4 = new IPNumber_1.IPv4(ip);
        let ip_num = ipv4.getValue().toJSNumber();
        return true;
    }
    catch (err) {
        return false;
    }
}
function isIpBlocked(ip) {
    let ipv4 = new IPNumber_1.IPv4(ip);
    let ip_num = ipv4.getValue().toJSNumber();
    const search = ipTree.find(ip_num);
    if (search)
        return true;
    else
        return false;
}
function updateBlockList(repo) {
    (0, simple_git_1.default)('./blocklist-ipsets/').fetch()
        .then(() => {
        ipTree = getIpList("./blocklist-ipsets/");
    });
}
function newBlockList(repo) {
    (0, simple_git_1.default)()
        .clone(repo)
        .then(() => {
        ipTree = getIpList("./blocklist-ipsets/");
    });
}
fs_1.default.access("./blocklist-ipsets/", function (error) {
    if (error) {
        newBlockList(repo);
    }
    else {
        updateBlockList(repo);
    }
});
setInterval(function () {
    updateBlockList(repo);
}, 300000);
app.get('/api/v1/ipblocklist/', (req, res) => {
    if (req.query.ip == null) {
        res.status(500).send("Forgot ip address!");
    }
    let ip = String(req.query.ip);
    if (!isIpValid(ip))
        return res.status(500).send("Invalid IP!");
    res.send({
        "result": isIpBlocked(ip)
    });
});
app.listen(3000, () => {
    console.log('IP Block Checker is listening on port 3000');
});
