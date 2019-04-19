var fs = require('fs');
var path = require('path');
var spawnSync = require('child_process').spawnSync;

var scriptDir = path.dirname(require.main.filename);

var citeprocPath = path.join(scriptDir, "..", "..");
var docsPath = path.join(scriptDir, "..");

function getTags() {
    var res = spawnSync("git", ["tag"], {cwd: citeprocPath});
    tags = res.stdout.toString();
    tags = tags.split("\n").filter(obj => obj);
    return tags;
}

function getPairs(tags) {
	var newtags = [];

	for (var tag of tags) {
        skip = false;
		var mytag = tag.replace(/^v/, "");
		var startswith = mytag.slice(0, 4);
		if (["1.1.", "1.2."].indexOf(startswith) === -1) {
			continue;
		}
		var splt = tag.split(".");
		for (var i in splt) {
            if (!splt[i].match(/^[0-9]+$/)) {
                skip = true;
                break;
            }
			splt[i] = parseInt(splt[i], 10);
		}
        if (skip) {
            continue;
        }
        if ([1, 2].indexOf(splt[1]) === -1) {
            continue
        }
		while (splt.length < 3) {
			 splt.push(0);
		}
		newtags.push({arr: splt, str: tag});
	}

	function sortVersions(a, b) {
		for (var i=0, ilen=5; i < ilen; i++) {
			if (a.arr[i] > b.arr[i]) {
				return -1;
			} else if (a.arr[i] < b.arr[i]) {
				return 1;
			}
		}
		return 0;
	}

	newtags.sort(sortVersions);
	newtags.reverse();
	newtags.push({
		arr: false,
		str: "HEAD"
	});
	newtags.reverse();

	var pairs = [];
	var lastObj = false;
	for (var item of newtags) {
		if (lastObj && (lastObj.arr[0] === item.arr[0] || lastObj.str === "HEAD")) {
			pairs.push([item.str, lastObj.str]);
		}
		lastObj = item;
	}
	return pairs;
}

function getGitLog(from, to) {
	// Get tags
	var args = [
        "log",
		"--date=format-local:%F %R (JST)",
		"--date-order",
		"--ancestry-path",
		"--format=format:------%n%n%s%n%n:commit:%n    \`%h <https://github.com/Juris-M/citeproc-js/commit/%H>\`_%n:author:%n    %an%n:date:%n    %ad%n%+b%n",
		from + "^1.." + to + "^0"
	];
	var res = spawnSync("git", args, {cwd: citeprocPath});
    res = res.stdout.toString();
    res = res.replace(/\*/g, "\n\n*")
    return res;
}

function setIndexHeader(version) {
	return "========================\n"
		+ "Citeproc-js changes for v1." + version + "\n"
		+ "========================\n"
		+ "\n"
		+ ".. include:: ../../substitutions.txt\n"
		+ "|CCBYSA|_ Frank Bennett <https://twitter.com/fgbjr>_\n"
		+ "\n"
		+ "\n"
		+ ".. toctree::\n"
		+ "   :maxdepth: 1\n"
        + "\n";
}

function setVersionChangesHeader(logname) {
	return "========================================================\n"
		+ logname + "\n"
		+ "========================================================\n"
		+ "\n"
		+ ".. include:: ../../substitutions.txt\n"
		+ "|CCBYSA|_ Frank Bennett <https://twitter.com/fgbjr>_\n"
		+ "\n";
}

// Execution

function run () {
    var tags = getTags();
    var pairs = getPairs(tags);
    var logIdx = {};
    logIdx["1"] = setIndexHeader("1");
    logIdx["2"] = setIndexHeader("2");
    for (var pair of pairs) {
        var logname = pair.join("-");
        var version = logname.replace(/v?1\.([12])\..*/, "$1");
        if (version === "1") {
            outdir="../docs/news/v1.1"
        } else if (version === "2") {
            outdir="../docs/news/v1.2"
        } else {
            console.log("Boom "+version);
            process.exit();
        }
        logIdx[version] += "   " + logname + ".rst\n";
        var logTxt = setVersionChangesHeader(logname);
        logTxt += getGitLog(pair[0], pair[1]);
        var outFile = path.join(docsPath, "news", "v1." + version, logname + ".rst");
        fs.writeFileSync(outFile, logTxt);
    }
    var outFile =  path.join(docsPath, "news", "v1.1", "index.rst");
    fs.writeFileSync(outFile, logIdx["1"]);
    var outFile =  path.join(docsPath, "news", "v1.2", "index.rst");
    fs.writeFileSync(outFile, logIdx["2"]);
}

run();
