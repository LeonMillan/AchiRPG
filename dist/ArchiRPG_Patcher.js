//=============================================================================
// ArchiRPG Patcher plugin v0.1.0
//=============================================================================

/*:
 * @plugindesc Loads RFC 6902 JSON Patches to patch game data during runtime.
 * @author LeonMillan
 * @orderAfter ArchiRPG
 * 
 * @help
 * To create JSON patches, see this guide:
 * (TODO)
 * 
 * [Copyright]
 * Based on fast-json-patch (c) 2013-2021 Joachim Wester
 * https://github.com/Starcounter-Jack/JSON-Patch
 * MIT license
 */

(function () {
    'use strict';

    const _hasOwnProperty = Object.prototype.hasOwnProperty;
    function hasOwnProperty(obj, key) {
      return _hasOwnProperty.call(obj, key);
    }
    function _objectKeys(obj) {
      if (Array.isArray(obj)) {
        const keys = new Array(obj.length);
        for (let k = 0; k < keys.length; k++) {
          keys[k] = "" + k;
        }
        return keys;
      }
      if (Object.keys) {
        return Object.keys(obj);
      }
      let keys = [];
      for (let i in obj) {
        if (hasOwnProperty(obj, i)) {
          keys.push(i);
        }
      }
      return keys;
    }
    ;
    function _deepClone(obj) {
      switch (typeof obj) {
        case "object":
          return JSON.parse(JSON.stringify(obj));
        case "undefined":
          return null;
        default:
          return obj;
      }
    }
    function isInteger(str) {
      let i = 0;
      const len = str.length;
      let charCode;
      while (i < len) {
        charCode = str.charCodeAt(i);
        if (charCode >= 48 && charCode <= 57) {
          i++;
          continue;
        }
        return false;
      }
      return true;
    }
    function escapePathComponent(path) {
      if (path.indexOf('/') === -1 && path.indexOf('~') === -1) return path;
      return path.replace(/~/g, '~0').replace(/\//g, '~1');
    }
    function unescapePathComponent(path) {
      return path.replace(/~1/g, '/').replace(/~0/g, '~');
    }
    function _getPathRecursive(root, obj) {
      let found;
      for (let key in root) {
        if (hasOwnProperty(root, key)) {
          if (root[key] === obj) {
            return escapePathComponent(key) + '/';
          } else if (typeof root[key] === 'object') {
            found = _getPathRecursive(root[key], obj);
            if (found != '') {
              return escapePathComponent(key) + '/' + found;
            }
          }
        }
      }
      return '';
    }
    function getPath(root, obj) {
      if (root === obj) {
        return '/';
      }
      const path = _getPathRecursive(root, obj);
      if (path === '') {
        throw new Error("Object not found in root");
      }
      return `/${path}`;
    }
    function hasUndefined(obj) {
      if (obj === undefined) {
        return true;
      }
      if (obj) {
        if (Array.isArray(obj)) {
          for (let i = 0, len = obj.length; i < len; i++) {
            if (hasUndefined(obj[i])) {
              return true;
            }
          }
        } else if (typeof obj === "object") {
          const objKeys = _objectKeys(obj);
          const objKeysLength = objKeys.length;
          for (var i = 0; i < objKeysLength; i++) {
            if (hasUndefined(obj[objKeys[i]])) {
              return true;
            }
          }
        }
      }
      return false;
    }
    function patchErrorMessageFormatter(message, args) {
      const messageParts = [message];
      for (const key in args) {
        const value = typeof args[key] === 'object' ? JSON.stringify(args[key], null, 2) : args[key];
        if (typeof value !== 'undefined') {
          messageParts.push(`${key}: ${value}`);
        }
      }
      return messageParts.join('\n');
    }
    class PatchError extends Error {
      constructor(message, name, index, operation, tree) {
        super(patchErrorMessageFormatter(message, {
          name,
          index,
          operation,
          tree
        }));
        this.name = name;
        this.index = index;
        this.operation = operation;
        this.tree = tree;
        Object.setPrototypeOf(this, new.target.prototype);
        this.message = patchErrorMessageFormatter(message, {
          name,
          index,
          operation,
          tree
        });
      }
    }

    const JsonPatchError = PatchError;
    const deepClone = _deepClone;
    const objOps = {
      add: function (obj, key, document) {
        obj[key] = this.value;
        return {
          newDocument: document
        };
      },
      remove: function (obj, key, document) {
        var removed = obj[key];
        delete obj[key];
        return {
          newDocument: document,
          removed
        };
      },
      replace: function (obj, key, document) {
        var removed = obj[key];
        obj[key] = this.value;
        return {
          newDocument: document,
          removed
        };
      },
      move: function (obj, key, document) {
        let removed = getValueByPointer(document, this.path);
        if (removed) {
          removed = _deepClone(removed);
        }
        const originalValue = applyOperation(document, {
          op: "remove",
          path: this.from
        }).removed;
        applyOperation(document, {
          op: "add",
          path: this.path,
          value: originalValue
        });
        return {
          newDocument: document,
          removed
        };
      },
      copy: function (obj, key, document) {
        const valueToCopy = getValueByPointer(document, this.from);
        applyOperation(document, {
          op: "add",
          path: this.path,
          value: _deepClone(valueToCopy)
        });
        return {
          newDocument: document
        };
      },
      test: function (obj, key, document) {
        return {
          newDocument: document,
          test: _areEquals(obj[key], this.value)
        };
      },
      _get: function (obj, key, document) {
        this.value = obj[key];
        return {
          newDocument: document
        };
      }
    };
    var arrOps = {
      add: function (arr, i, document) {
        if (isInteger(i)) {
          arr.splice(i, 0, this.value);
        } else {
          arr[i] = this.value;
        }
        return {
          newDocument: document,
          index: i
        };
      },
      remove: function (arr, i, document) {
        var removedList = arr.splice(i, 1);
        return {
          newDocument: document,
          removed: removedList[0]
        };
      },
      replace: function (arr, i, document) {
        var removed = arr[i];
        arr[i] = this.value;
        return {
          newDocument: document,
          removed
        };
      },
      move: objOps.move,
      copy: objOps.copy,
      test: objOps.test,
      _get: objOps._get
    };
    function getValueByPointer(document, pointer) {
      if (pointer == '') {
        return document;
      }
      var getOriginalDestination = {
        op: "_get",
        path: pointer
      };
      applyOperation(document, getOriginalDestination);
      return getOriginalDestination.value;
    }
    function applyOperation(document, operation, validateOperation = false, mutateDocument = true, banPrototypeModifications = true, index = 0) {
      if (validateOperation) {
        if (typeof validateOperation == 'function') {
          validateOperation(operation, 0, document, operation.path);
        } else {
          validator(operation, 0);
        }
      }
      if (operation.path === "") {
        let returnValue = {
          newDocument: document
        };
        if (operation.op === 'add') {
          returnValue.newDocument = operation.value;
          return returnValue;
        } else if (operation.op === 'replace') {
          returnValue.newDocument = operation.value;
          returnValue.removed = document;
          return returnValue;
        } else if (operation.op === 'move' || operation.op === 'copy') {
          returnValue.newDocument = getValueByPointer(document, operation.from);
          if (operation.op === 'move') {
            returnValue.removed = document;
          }
          return returnValue;
        } else if (operation.op === 'test') {
          returnValue.test = _areEquals(document, operation.value);
          if (returnValue.test === false) {
            throw new JsonPatchError("Test operation failed", 'TEST_OPERATION_FAILED', index, operation, document);
          }
          returnValue.newDocument = document;
          return returnValue;
        } else if (operation.op === 'remove') {
          returnValue.removed = document;
          returnValue.newDocument = null;
          return returnValue;
        } else if (operation.op === '_get') {
          operation.value = document;
          return returnValue;
        } else {
          if (validateOperation) {
            throw new JsonPatchError('Operation `op` property is not one of operations defined in RFC-6902', 'OPERATION_OP_INVALID', index, operation, document);
          } else {
            return returnValue;
          }
        }
      } else {
        if (!mutateDocument) {
          document = _deepClone(document);
        }
        const path = operation.path || "";
        const keys = path.split('/');
        let obj = document;
        let t = 1;
        let len = keys.length;
        let existingPathFragment = undefined;
        let key;
        let validateFunction;
        if (typeof validateOperation == 'function') {
          validateFunction = validateOperation;
        } else {
          validateFunction = validator;
        }
        while (true) {
          key = keys[t];
          if (key && key.indexOf('~') != -1) {
            key = unescapePathComponent(key);
          }
          if (banPrototypeModifications && (key == '__proto__' || key == 'prototype' && t > 0 && keys[t - 1] == 'constructor')) {
            throw new TypeError('JSON-Patch: modifying `__proto__` or `constructor/prototype` prop is banned for security reasons, if this was on purpose, please set `banPrototypeModifications` flag false and pass it to this function. More info in fast-json-patch README');
          }
          if (validateOperation) {
            if (existingPathFragment === undefined) {
              if (obj[key] === undefined) {
                existingPathFragment = keys.slice(0, t).join('/');
              } else if (t == len - 1) {
                existingPathFragment = operation.path;
              }
              if (existingPathFragment !== undefined) {
                validateFunction(operation, 0, document, existingPathFragment);
              }
            }
          }
          t++;
          if (Array.isArray(obj)) {
            if (key === '-') {
              key = obj.length;
            } else {
              if (validateOperation && !isInteger(key)) {
                throw new JsonPatchError("Expected an unsigned base-10 integer value, making the new referenced value the array element with the zero-based index", "OPERATION_PATH_ILLEGAL_ARRAY_INDEX", index, operation, document);
              } else if (isInteger(key)) {
                key = ~~key;
              }
            }
            if (t >= len) {
              if (validateOperation && operation.op === "add" && key > obj.length) {
                throw new JsonPatchError("The specified index MUST NOT be greater than the number of elements in the array", "OPERATION_VALUE_OUT_OF_BOUNDS", index, operation, document);
              }
              const returnValue = arrOps[operation.op].call(operation, obj, key, document);
              if (returnValue.test === false) {
                throw new JsonPatchError("Test operation failed", 'TEST_OPERATION_FAILED', index, operation, document);
              }
              return returnValue;
            }
          } else {
            if (t >= len) {
              const returnValue = objOps[operation.op].call(operation, obj, key, document);
              if (returnValue.test === false) {
                throw new JsonPatchError("Test operation failed", 'TEST_OPERATION_FAILED', index, operation, document);
              }
              return returnValue;
            }
          }
          obj = obj[key];
          if (validateOperation && t < len && (!obj || typeof obj !== "object")) {
            throw new JsonPatchError('Cannot perform operation at the desired path', 'OPERATION_PATH_UNRESOLVABLE', index, operation, document);
          }
        }
      }
    }
    function applyPatch(document, patch, validateOperation, mutateDocument = true, banPrototypeModifications = true) {
      if (validateOperation) {
        if (!Array.isArray(patch)) {
          throw new JsonPatchError('Patch sequence must be an array', 'SEQUENCE_NOT_AN_ARRAY');
        }
      }
      if (!mutateDocument) {
        document = _deepClone(document);
      }
      const results = new Array(patch.length);
      for (let i = 0, length = patch.length; i < length; i++) {
        results[i] = applyOperation(document, patch[i], validateOperation, true, banPrototypeModifications, i);
        document = results[i].newDocument;
      }
      results.newDocument = document;
      return results;
    }
    function applyReducer(document, operation, index) {
      const operationResult = applyOperation(document, operation);
      if (operationResult.test === false) {
        throw new JsonPatchError("Test operation failed", 'TEST_OPERATION_FAILED', index, operation, document);
      }
      return operationResult.newDocument;
    }
    function validator(operation, index, document, existingPathFragment) {
      if (typeof operation !== 'object' || operation === null || Array.isArray(operation)) {
        throw new JsonPatchError('Operation is not an object', 'OPERATION_NOT_AN_OBJECT', index, operation, document);
      } else if (!objOps[operation.op]) {
        throw new JsonPatchError('Operation `op` property is not one of operations defined in RFC-6902', 'OPERATION_OP_INVALID', index, operation, document);
      } else if (typeof operation.path !== 'string') {
        throw new JsonPatchError('Operation `path` property is not a string', 'OPERATION_PATH_INVALID', index, operation, document);
      } else if (operation.path.indexOf('/') !== 0 && operation.path.length > 0) {
        throw new JsonPatchError('Operation `path` property must start with "/"', 'OPERATION_PATH_INVALID', index, operation, document);
      } else if ((operation.op === 'move' || operation.op === 'copy') && typeof operation.from !== 'string') {
        throw new JsonPatchError('Operation `from` property is not present (applicable in `move` and `copy` operations)', 'OPERATION_FROM_REQUIRED', index, operation, document);
      } else if ((operation.op === 'add' || operation.op === 'replace' || operation.op === 'test') && operation.value === undefined) {
        throw new JsonPatchError('Operation `value` property is not present (applicable in `add`, `replace` and `test` operations)', 'OPERATION_VALUE_REQUIRED', index, operation, document);
      } else if ((operation.op === 'add' || operation.op === 'replace' || operation.op === 'test') && hasUndefined(operation.value)) {
        throw new JsonPatchError('Operation `value` property is not present (applicable in `add`, `replace` and `test` operations)', 'OPERATION_VALUE_CANNOT_CONTAIN_UNDEFINED', index, operation, document);
      } else if (document) {
        if (operation.op == "add") {
          var pathLen = operation.path.split("/").length;
          var existingPathLen = existingPathFragment.split("/").length;
          if (pathLen !== existingPathLen + 1 && pathLen !== existingPathLen) {
            throw new JsonPatchError('Cannot perform an `add` operation at the desired path', 'OPERATION_PATH_CANNOT_ADD', index, operation, document);
          }
        } else if (operation.op === 'replace' || operation.op === 'remove' || operation.op === '_get') {
          if (operation.path !== existingPathFragment) {
            throw new JsonPatchError('Cannot perform the operation at a path that does not exist', 'OPERATION_PATH_UNRESOLVABLE', index, operation, document);
          }
        } else if (operation.op === 'move' || operation.op === 'copy') {
          var existingValue = {
            op: "_get",
            path: operation.from,
            value: undefined
          };
          var error = validate([existingValue], document);
          if (error && error.name === 'OPERATION_PATH_UNRESOLVABLE') {
            throw new JsonPatchError('Cannot perform the operation from a path that does not exist', 'OPERATION_FROM_UNRESOLVABLE', index, operation, document);
          }
        }
      }
    }
    function validate(sequence, document, externalValidator) {
      try {
        if (!Array.isArray(sequence)) {
          throw new JsonPatchError('Patch sequence must be an array', 'SEQUENCE_NOT_AN_ARRAY');
        }
        if (document) {
          applyPatch(_deepClone(document), _deepClone(sequence), externalValidator || true);
        } else {
          externalValidator = externalValidator || validator;
          for (var i = 0; i < sequence.length; i++) {
            externalValidator(sequence[i], i, document, undefined);
          }
        }
      } catch (e) {
        if (e instanceof JsonPatchError) {
          return e;
        } else {
          throw e;
        }
      }
    }
    function _areEquals(a, b) {
      if (a === b) return true;
      if (a && b && typeof a == 'object' && typeof b == 'object') {
        var arrA = Array.isArray(a),
          arrB = Array.isArray(b),
          i,
          length,
          key;
        if (arrA && arrB) {
          length = a.length;
          if (length != b.length) return false;
          for (i = length; i-- !== 0;) if (!_areEquals(a[i], b[i])) return false;
          return true;
        }
        if (arrA != arrB) return false;
        var keys = Object.keys(a);
        length = keys.length;
        if (length !== Object.keys(b).length) return false;
        for (i = length; i-- !== 0;) if (!b.hasOwnProperty(keys[i])) return false;
        for (i = length; i-- !== 0;) {
          key = keys[i];
          if (!_areEquals(a[key], b[key])) return false;
        }
        return true;
      }
      return a !== a && b !== b;
    }
    ;

    const fs = require('fs');
    const PATCHES_FOLDER = "patch/";
    DataManager._patchCache = {};
    DataManager.loadPatchFile = function (name, src, next) {
      DataManager._patchCache[name] = null;
      const xhr = new XMLHttpRequest();
      const url = PATCHES_FOLDER + src;
      xhr.open("GET", url);
      xhr.overrideMimeType("application/json");
      xhr.onload = function () {
        const patchData = xhr.status < 400 ? JSON.parse(xhr.responseText) : null;
        DataManager._patchCache[name] = patchData;
        next.call(this, name, src);
      };
      xhr.onerror = function () {
        next.call(this, name, src);
      };
      xhr.send();
    };
    DataManager.onXhrLoad = function (xhr, name, src, url) {
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
    DataManager.loadDataFile = function (name, src) {
      function _realLoadDataFile(name, src) {
        const xhr = new XMLHttpRequest();
        const url = 'data/' + src;
        xhr.open('GET', url);
        xhr.overrideMimeType('application/json');
        xhr.onload = function () {
          DataManager.onXhrLoad(xhr, name, src, url);
        };
        if (DataManager.onXhrError) {
          xhr.onerror = function () {
            DataManager.onXhrError(name, src, url);
          };
        } else {
          xhr.onerror = this._mapLoader || function () {
            DataManager._errorUrl = DataManager._errorUrl || url;
          };
        }
        xhr.send();
      }
      window[name] = null;
      if (fs && !fs.existsSync(PATCHES_FOLDER + src)) {
        _realLoadDataFile.call(this, name, src);
      } else {
        DataManager.loadPatchFile(name, src, _realLoadDataFile);
      }
    };

})();
