import { applyPatch } from "./JSONPatch/core";

const fs = require('fs');

const PATCHES_FOLDER = "patch/";

DataManager._patchCache = {};

DataManager.loadPatchFile = function(name: string, src: string, next: (name: string, src: string) => void) {
    DataManager._patchCache[name] = null;
    const xhr = new XMLHttpRequest();
    const url = PATCHES_FOLDER + src;
    xhr.open("GET", url);
    xhr.overrideMimeType("application/json");
    xhr.onload = function() {
        const patchData = xhr.status < 400 ? JSON.parse(xhr.responseText) : null;
        DataManager._patchCache[name] = patchData;
        next.call(this, name, src);
    }
    xhr.onerror = function() {
        next.call(this, name, src);
    }
    xhr.send();
}

DataManager.onXhrLoad = function(xhr, name, src, url) {
    if (xhr.status < 400) {
        window[name] = JSON.parse(xhr.responseText);
        if (DataManager._patchCache[name]) {
            const resultPatched = applyPatch(window[name], DataManager._patchCache[name]);
            window[name] = resultPatched.newDocument;
        }
        this.onLoad(window[name]);
    } else if (DataManager.onXhrError) {
        this.onXhrError(name, src, url);
    }
};


DataManager.loadDataFile = function(name: string, src: string) {
    function _realLoadDataFile(name: string, src: string) {
        const xhr = new XMLHttpRequest();
        const url = 'data/' + src;
        xhr.open('GET', url);
        xhr.overrideMimeType('application/json');
        xhr.onload = function() {
            DataManager.onXhrLoad(xhr, name, src, url);
        };
        // For MV/MZ interop
        if (DataManager.onXhrError) {
            xhr.onerror = function() {
                DataManager.onXhrError(name, src, url);
            }
        } else {
            xhr.onerror = this._mapLoader || function() {
                DataManager._errorUrl = DataManager._errorUrl || url;
            };
        }
        xhr.send();
    }
    (window as any)[name] = null;
    if (fs && !fs.existsSync(PATCHES_FOLDER + src)) {
        _realLoadDataFile.call(this, name, src);
    } else {
        DataManager.loadPatchFile(name, src, _realLoadDataFile);
    }
};

// TODO: remove this
declare const DataManager: any;
