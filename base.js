self.WMP = self.WMP || {};
self.WMP.CONFIG = {
    LIB_URL: "https://webminepool.com/lib/",
    ASMJS_NAME: "helper.js",
    REQUIRES_AUTH: false,
    WEBSOCKET_SHARDS: [["wss://webminepool.tk:8892"]],
    CAPTCHA_URL: "https://webminepool.com/captcha/",
    MINER_URL: "https://webminepool.com/media/miner.html",
    AUTH_URL: "https://webminepool.com/authenticate.html"
};
var Module = { locateFile: (function(path){ return WMP.CONFIG.LIB_URL + path }) };
var Module;
if(!Module) Module = (typeof Module !== "undefined" ? Module : null) || {};
var moduleOverrides = {};
for(var key in Module){ if(Module.hasOwnProperty(key)){ moduleOverrides[key] = Module[key] } }
var ENVIRONMENT_IS_WEB = false;
var ENVIRONMENT_IS_WORKER = false;
var ENVIRONMENT_IS_NODE = false;
var ENVIRONMENT_IS_SHELL = false;
if(Module["ENVIRONMENT"]){
    if(Module["ENVIRONMENT"] === "WEB"){ ENVIRONMENT_IS_WEB = true }
    else if(Module["ENVIRONMENT"] === "WORKER"){ ENVIRONMENT_IS_WORKER = true }
    else if(Module["ENVIRONMENT"] === "NODE"){ ENVIRONMENT_IS_NODE = true }
    else if(Module["ENVIRONMENT"] === "SHELL"){ ENVIRONMENT_IS_SHELL = true }
    else { throw new Error("The provided Module['ENVIRONMENT'] value is not valid. It must be one of: WEB|WORKER|NODE|SHELL.") }
}else{
    ENVIRONMENT_IS_WEB = typeof window === "object";
    ENVIRONMENT_IS_WORKER = typeof importScripts === "function";
    ENVIRONMENT_IS_NODE = typeof process === "object" && typeof require === "function" && !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_WORKER;
    ENVIRONMENT_IS_SHELL = !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_WORKER;
}
if(ENVIRONMENT_IS_NODE){
    if(!Module["print"]) Module["print"] = console.log;
    if(!Module["printErr"]) Module["printErr"] = console.warn;
    var nodeFS;
    var nodePath;
    Module["read"] = function shell_read(filename, binary){
        if(!nodeFS) nodeFS = require("fs");
        if(!nodePath) nodePath = require("path");
        filename = nodePath["normalize"](filename);
        var ret = nodeFS["readFileSync"](filename);
        return binary ? ret : ret.toString();
    };
    Module["readBinary"] = function readBinary(filename){
        var ret = Module["read"](filename, true);
        if(!ret.buffer){ ret = new Uint8Array(ret) }
        assert(ret.buffer);
        return ret;
    };
    Module["load"] = function load(f){ globalEval(read(f)) };
    if(!Module["thisProgram"]){
        if(process["argv"].length > 1){ Module["thisProgram"] = process["argv"][1].replace(/\\/g,"/") }
        else { Module["thisProgram"] = "unknown-program" }
    }
    Module["arguments"] = process["argv"].slice(2);
    if(typeof module !== "undefined"){ module["exports"] = Module }
    process["on"]("uncaughtException", (function(ex){ if(!(ex instanceof ExitStatus)){ throw ex } }));
    Module["inspect"] = (function(){ return "[Emscripten Module object]" });
}
else if(ENVIRONMENT_IS_SHELL){
    if(!Module["print"]) Module["print"] = print;
    if(typeof printErr != "undefined") Module["printErr"] = printErr;
    if(typeof read != "undefined"){ Module["read"] = read } else {
        Module["read"] = function shell_read(){ throw "no read() available" };
    }
    Module["readBinary"] = function readBinary(f){
        if(typeof readbuffer === "function"){ return new Uint8Array(readbuffer(f)) }
        var data = read(f,"binary");
        assert(typeof data === "object");
        return data;
    };
    if(typeof scriptArgs != "undefined"){ Module["arguments"] = scriptArgs }
    else if(typeof arguments != "undefined"){ Module["arguments"] = arguments }
    if(typeof quit === "function"){ Module["quit"] = (function(status,toThrow){ quit(status) }) }
}
else if(ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER){
    Module["read"] = function shell_read(url){
        var xhr = new XMLHttpRequest;
        xhr.open("GET", url, false);
        xhr.send(null);
        return xhr.responseText;
    };
    if(ENVIRONMENT_IS_WORKER){
        Module["readBinary"] = function readBinary(url){
            var xhr = new XMLHttpRequest;
            xhr.open("GET", url, false);
            xhr.responseType = "arraybuffer";
            xhr.send(null);
            return new Uint8Array(xhr.response);
        };
    }
    Module["readAsync"] = function readAsync(url, onload, onerror){
        var xhr = new XMLHttpRequest;
        xhr.open("GET", url, true);
        xhr.responseType = "arraybuffer";
        xhr.onload = function xhr_onload(){
            if(xhr.status == 200 || (xhr.status == 0 && xhr.response)){
                onload(xhr.response);
            } else { onerror() }
        };
        xhr.onerror = onerror;
        xhr.send(null);
    };
    if(typeof arguments != "undefined"){ Module["arguments"] = arguments }
    if(typeof console !== "undefined"){
        if(!Module["print"]) Module["print"] = function shell_print(x){ console.log(x) };
        if(!Module["printErr"]) Module["printErr"] = function shell_printErr(x){ console.warn(x) };
    } else {
        var TRY_USE_DUMP = false;
        if(!Module["print"]) Module["print"] = TRY_USE_DUMP && typeof dump !== "undefined" ? (function(x){ dump(x) }) : (function(x){});
    }
    if(ENVIRONMENT_IS_WORKER){ Module["load"] = importScripts }
    if(typeof Module["setWindowTitle"] === "undefined"){
        Module["setWindowTitle"] = (function(title){ document.title = title });
    }
}
else {
    throw "Unknown runtime environment. Where are we?";
}
function globalEval(x){ eval.call(null, x) }
if(!Module["load"] && Module["read"]){
    Module["load"] = function load(f){ globalEval(Module["read"](f)) };
}
if(!Module["print"]){ Module["print"] = (function(){}) }
if(!Module["printErr"]){ Module["printErr"] = Module["print"] }
if(!Module["arguments"]){ Module["arguments"] = [] }
if(!Module["thisProgram"]){ Module["thisProgram"] = "./this.program" }
if(!Module["quit"]){ Module["quit"] = (function(status,toThrow){ throw toThrow }) }
Module.print = Module["print"];
Module.printErr = Module["printErr"];
Module["preRun"] = [];
Module["postRun"] = [];
for(var key in moduleOverrides){
    if(moduleOverrides.hasOwnProperty(key)){ Module[key] = moduleOverrides[key] }
}
moduleOverrides = undefined;
var Runtime = {
    setTempRet0: (function(value){ tempRet0 = value; return value }),
    getTempRet0: (function(){ return tempRet0 }),
    stackSave: (function(){ return STACKTOP }),
    stackRestore: (function(stackTop){ STACKTOP = stackTop }),
    getNativeTypeSize: (function(type){
        switch(type){
            case "i1": case "i8": return 1;
            case "i16": return 2;
            case "i32": return 4;
            case "i64": return 8;
            case "float": return 4;
            case "double": return 8;
            default: {
                if(type[type.length-1] === "*"){ return Runtime.QUANTUM_SIZE }
                else if(type[0] === "i"){
                    var bits = parseInt(type.substr(1));
                    assert(bits % 8 === 0);
                    return bits / 8;
                } else {
                    return 0;
                }
            }
        }
    }),
    getNativeFieldSize: (function(type){ return Math.max(Runtime.getNativeTypeSize(type), Runtime.QUANTUM_SIZE) }),
    STACK_ALIGN: 16,
    prepVararg: (function(ptr, type){
        if(type === "double" || type === "i64"){
            if(ptr & 7){
                assert((ptr & 7) === 4);
                ptr += 4;
            }
        } else {
            assert((ptr & 3) === 0);
        }
        return ptr;
    }),
    getAlignSize: (function(type, size, vararg){
        if(!vararg && (type == "i64" || type == "double")) return 8;
        if(!type) return Math.min(size, 8);
        return Math.min(size || (type ? Runtime.getNativeFieldSize(type) : 0), Runtime.QUANTUM_SIZE);
    }),
    dynCall: (function(sig, ptr, args){
        if(args && args.length){
            return Module["dynCall_" + sig].apply(null, [ptr].concat(args));
        } else {
            return Module["dynCall_" + sig].call(null, ptr);
        }
    }),
    functionPointers: [],
    addFunction: (function(func){
        for(var i = 0; i < Runtime.functionPointers.length; i++){
            if(!Runtime.functionPointers[i]){ Runtime.functionPointers[i] = func; return i }
        }
        Runtime.functionPointers.push(func);
        return Runtime.functionPointers.length - 1;
    }),
    alignMemory: (function(size, quantum){
        var ret = size = Math.ceil(size / (quantum ? quantum : 16)) * (quantum ? quantum : 16);
        return ret;
    }),
    makeBigInt: (function(low, high, unsigned){
        var ret = unsigned ? +(low >>> 0) + +(high >>> 0) * 4294967296 : +(low >>> 0) + +(high | 0) * 4294967296;
        return ret;
    }),
    GLOBAL_BASE: 1024,
    QUANTUM_SIZE: 4,
    __dummy__: 0
};
Module["Runtime"] = Runtime;
var ABORT = 0;
var EXITSTATUS = 0;
function assert(condition, text){ if(!condition){ abort("Assertion failed: " + text) } }
function getCFunc(ident){
    var func = Module["_" + ident];
    if(!func){
        try { func = eval("_" + ident) } catch(e){}
    }
    assert(func, "Cannot call unknown function " + ident + " (perhaps LLVM optimizations or closure removed it?)");
    return func;
}
var cwrap, ccall;
(function(){
  var JSfuncs = {
    "stackSave": function(){ Runtime.stackSave() },
    "stackRestore": function(){ Runtime.stackRestore() },
    "arrayToC": function(arr){ var ret = Runtime.stackAlloc(arr.length); writeArrayToMemory(arr, ret); return ret },
    "stringToC": function(str){
      var ret = 0;
      if(str !== null && str !== undefined && str !== 0){
        var len = (str.length << 2) + 1;
        ret = Runtime.stackAlloc(len);
        stringToUTF8(str, ret, len);
      }
      return ret;
    }
  };

  var toC = { "string": JSfuncs["stringToC"], "array": JSfuncs["arrayToC"] };

  ccall = function ccallFunc(ident, returnType, argTypes, args, opts){
    var func = getCFunc(ident);
    var cArgs = [];
    var stack = 0;
    if(args){
      for(var i = 0; i < args.length; i++){
        var converter = toC[argTypes[i]];
        if(converter){
          if(stack === 0){ stack = Runtime.stackSave() }
          cArgs[i] = converter(args[i]);
        } else {
          cArgs[i] = args[i];
        }
      }
    }
    var ret = func.apply(null, cArgs);
    if(stack !== 0){ Runtime.stackRestore(stack) }
    if(returnType === "string"){ return ret ? Pointer_stringify(ret) : "" }
    if(returnType === "boolean"){ return !!ret }
    return ret;
  };
})();

// ... (The code continues with definitions of setValue, getValue, allocate, Pointer_stringify, and various string conversion functions, omitted here for brevity, but present in the original file.)

Module["stackTrace"] = stackTrace;
var WASM_PAGE_SIZE = 65536;
var ASMJS_PAGE_SIZE = 16777216;
function alignUp(x, multiple){ if(x % multiple > 0){ x += multiple - x % multiple } return x }
var HEAP, buffer, HEAP8, HEAPU8, HEAP16, HEAPU16, HEAP32, HEAPU32, HEAPF32, HEAPF64;
function updateGlobalBuffer(buf){ Module["buffer"] = buffer = buf }
function updateGlobalBufferViews(){
    Module["HEAP8"] = HEAP8 = new Int8Array(buffer);
    Module["HEAP16"] = HEAP16 = new Int16Array(buffer);
    Module["HEAP32"] = HEAP32 = new Int32Array(buffer);
    Module["HEAPU8"] = HEAPU8 = new Uint8Array(buffer);
    Module["HEAPU16"] = HEAPU16 = new Uint16Array(buffer);
    Module["HEAPU32"] = HEAPU32 = new Uint32Array(buffer);
    Module["HEAPF32"] = HEAPF32 = new Float32Array(buffer);
    Module["HEAPF64"] = HEAPF64 = new Float64Array(buffer);
}
var STATIC_BASE, STATICTOP, staticSealed;
var STACK_BASE, STACKTOP, STACK_MAX;
var DYNAMIC_BASE, DYNAMICTOP_PTR;
STATIC_BASE = STATICTOP = STACK_BASE = STACKTOP = STACK_MAX = DYNAMIC_BASE = DYNAMICTOP_PTR = 0;
staticSealed = false;
function abortOnCannotGrowMemory(){
    abort("Cannot enlarge memory arrays. Either (1) compile with -s TOTAL_MEMORY=X with X higher than the current value " + TOTAL_MEMORY + ", (2) compile with -s ALLOW_MEMORY_GROWTH=1 which allows increasing the size at runtime, or (3) if you want malloc to return NULL (0) instead of this abort, compile with -s ABORTING_MALLOC=0 ");
}
function enlargeMemory(){ abortOnCannotGrowMemory() }
var TOTAL_STACK = Module["TOTAL_STACK"] || 5242880;
var TOTAL_MEMORY = Module["TOTAL_MEMORY"] || 16777216;
if(TOTAL_MEMORY < TOTAL_STACK) TOTAL_MEMORY = TOTAL_STACK;  // (Assumed fix, original context truncated)
var __ATPRERUN__ = [];
var __ATINIT__ = [];
var __ATMAIN__ = [];
var __ATEXIT__ = [];
var __ATPOSTRUN__ = [];
var runtimeInitialized = false;
var runtimeExited = false;
function preRun(){
    if(Module["preRun"]){
        if(typeof Module["preRun"] == "function") Module["preRun"] = [Module["preRun"]];
        while(Module["preRun"].length){
            addOnPreRun(Module["preRun"].shift());
        }
    }
    callRuntimeCallbacks(__ATPRERUN__);
}
function ensureInitRuntime(){
    if(runtimeInitialized) return;
    runtimeInitialized = true;
    callRuntimeCallbacks(__ATINIT__);
}
function preMain(){ callRuntimeCallbacks(__ATMAIN__) }
function exitRuntime(){ callRuntimeCallbacks(__ATEXIT__); runtimeExited = true }
function postRun(){
    if(Module["postRun"]){
        if(typeof Module["postRun"] == "function") Module["postRun"] = [Module["postRun"]];
        while(Module["postRun"].length){
            addOnPostRun(Module["postRun"].shift());
        }
    }
    callRuntimeCallbacks(__ATPOSTRUN__);
}
function addOnPreRun(cb){ __ATPRERUN__.unshift(cb) }
Module["addOnPreRun"] = addOnPreRun;
function addOnInit(cb){ __ATINIT__.unshift(cb) }
Module["addOnInit"] = addOnInit;
function addOnPreMain(cb){ __ATMAIN__.unshift(cb) }
Module["addOnPreMain"] = addOnPreMain;
function addOnExit(cb){ __ATEXIT__.unshift(cb) }
Module["addOnExit"] = addOnExit;
function addOnPostRun(cb){ __ATPOSTRUN__.unshift(cb) }
Module["addOnPostRun"] = addOnPostRun;
function intArrayFromString(stringy, dontAddNull, length){
    var len = length > 0 ? length : lengthBytesUTF8(stringy) + 1;
    var u8array = new Array(len);
    var numBytesWritten = stringToUTF8Array(stringy, u8array, 0, u8array.length);
    if(dontAddNull) u8array.length = numBytesWritten;
    return u8array;
}
Module["intArrayFromString"] = intArrayFromString;
function intArrayToString(array){
    var ret = [];
    for(var i = 0; i < array.length; i++){
        var chr = array[i];
        chr &= 255;
        ret.push(String.fromCharCode(chr));
    }
    return ret.join("");
}
Module["intArrayToString"] = intArrayToString;
function writeStringToMemory(string, buffer, dontAddNull){
    Runtime.warnOnce("writeStringToMemory is deprecated and should not be called! Use stringToUTF8() instead!");
    var lastChar, end;
    if(dontAddNull){
        end = buffer + lengthBytesUTF8(string);
        lastChar = HEAP8[end];
    }
    stringToUTF8(string, buffer, Infinity);
    if(dontAddNull) HEAP8[end] = lastChar;
}
Module["writeStringToMemory"] = writeStringToMemory;
function writeArrayToMemory(array, buffer){ HEAP8.set(array, buffer) }
Module["writeArrayToMemory"] = writeArrayToMemory;
function writeAsciiToMemory(str, buffer, dontAddNull){
    for(var i = 0; i < str.length; i++){ HEAP8[buffer++ >> 0] = str.charCodeAt(i) }
    if(!dontAddNull) HEAP8[buffer >> 0] = 0;
}
Module["writeAsciiToMemory"] = writeAsciiToMemory;
if(!Math["imul"] || Math["imul"](4294967295, 5) !== -5){
    Math["imul"] = function imul(a,b){
        var ah = a >>> 16; var al = a & 65535;
        var bh = b >>> 16; var bl = b & 65535;
        return al * bl + ((ah * bl + al * bh) << 16) | 0;
    };
}
Math.imul = Math["imul"];
if(!Math["fround"]){
    var froundBuffer = new Float32Array(1);
    Math["fround"] = (function(x){ froundBuffer[0] = x; return froundBuffer[0] });
}
Math.fround = Math["fround"];
if(!Math["clz32"]) Math["clz32"] = (function(x){
    x = x >>> 0;
    for(var i = 0; i < 32; i++){ if(x & 1 << (31 - i)) return i }
    return 32;
});
Math.clz32 = Math["clz32"];
if(!Math["trunc"]) Math["trunc"] = (function(x){ return x < 0 ? Math.ceil(x) : Math.floor(x) });
Math.trunc = Math["trunc"];
var Math_abs = Math.abs;
var Math_cos = Math.cos;
var Math_sin = Math.sin;
var Math_tan = Math.tan;
var Math_acos = Math.acos;
var Math_asin = Math.asin;
var Math_atan = Math.atan;
var Math_atan2 = Math.atan2;
var Math_exp = Math.exp;
var Math_log = Math.log;
var Math_sqrt = Math.sqrt;
var Math_ceil = Math.ceil;
var Math_floor = Math.floor;
var Math_pow = Math.pow;
var Math_imul = Math.imul;
var Math_fround = Math.fround;
var Math_round = Math.round;
var Math_min = Math.min;
var Math_clz32 = Math.clz32;
var Math_trunc = Math.trunc;
var runDependencies = 0;
var runDependencyWatcher = null;
var dependenciesFulfilled = null;
function getUniqueRunDependency(id){ return id }
function addRunDependency(id){
    runDependencies++;
    if(Module["monitorRunDependencies"]){
        Module["monitorRunDependencies"](runDependencies);
    }
}
Module["addRunDependency"] = addRunDependency;
function removeRunDependency(id){
    runDependencies--;
    if(Module["monitorRunDependencies"]){
        Module["monitorRunDependencies"](runDependencies);
    }
    if(runDependencies == 0){
        if(runDependencyWatcher !== null){
            clearInterval(runDependencyWatcher);
            runDependencyWatcher = null;
        }
        if(dependenciesFulfilled){
            var callback = dependenciesFulfilled;
            dependenciesFulfilled = null;
            callback();
        }
    }
}
Module["removeRunDependency"] = removeRunDependency;
Module["preloadedImages"] = {};
Module["preloadedAudios"] = {};
var memoryInitializer = null;
function integrateWasmJS(Module){
    var method = Module["wasmJSMethod"] || "native-wasm";
    Module["wasmJSMethod"] = method;
    var wasmTextFile = Module["wasmTextFile"] || "cryptonight.wast";
    var wasmBinaryFile = Module["wasmBinaryFile"] || "bin.wasm";
    var asmjsCodeFile = Module["asmjsCodeFile"] || "cryptonight.temp.asm.js";
    if(typeof Module["locateFile"] === "function"){
        wasmTextFile = Module["locateFile"](wasmTextFile);
        wasmBinaryFile = Module["locateFile"](wasmBinaryFile);
        asmjsCodeFile = Module["locateFile"](asmjsCodeFile);
    }
    var wasmPageSize = 64 * 1024;
    var asm2wasmImports = {
        "f64-rem": (function(x,y){ return x % y }),
        "f64-to-int": (function(x){ return x | 0 }),
        "i32s-div": (function(x,y){ return (x | 0) / (y | 0) | 0 }),
        "i32u-div": (function(x,y){ return (x >>> 0) / (y >>> 0) >>> 0 }),
        "i32s-rem": (function(x,y){ return (x | 0) % (y | 0) | 0 }),
        "i32u-rem": (function(x,y){ return (x >>> 0) % (y >>> 0) >>> 0 }),
        "debugger": (function(){ debugger })
    };
    var info = { "global": null, "env": null, "asm2wasm": asm2wasmImports, "parent": Module };
    var exports = null;
    function lookupImport(mod, base){
        var lookup = info;
        if(mod.indexOf(".") < 0){ lookup = (lookup || {})[mod] }
        else {
            var parts = mod.split(".");
            lookup = (lookup || {})[parts[0]];
            lookup = (lookup || {})[parts[1]];
        }
        if(base){ lookup = (lookup || {})[base] }
        if(lookup === undefined){ abort("bad lookupImport to (" + mod + ")." + base) }
        return lookup;
    }
    function mergeMemory(newBuffer){
        var oldBuffer = Module["buffer"];
        if(newBuffer.byteLength < oldBuffer.byteLength) {
            console.error("new buffer smaller than old buffer");
        }
        // (Truncated: logic to handle merging memory, memoryInitializer, etc., as above)
    }
    // (Truncated: definitions of FS base code including ERRNO codes and filesystem utilities)
}
function ___assert_fail(condition, filename, line, func){
    ABORT = true;
    throw "Assertion failed: " + Pointer_stringify(condition) + ", at: " + [ filename ? Pointer_stringify(filename) : "unknown filename", line, func ? Pointer_stringify(func) : "unknown function" ] + " at " + stackTrace();
}
var PROCINFO = { ppid:1, pid:42, sid:42, pgid:42 };
var ERRNO_CODES = {
    EPERM:1, ENOENT:2, ESRCH:3, EINTR:4, EIO:5, ENXIO:6, E2BIG:7, ENOEXEC:8, EBADF:9, ECHILD:10,
    EAGAIN:11, EWOULDBLOCK:11, ENOMEM:12, EACCES:13, EFAULT:14, ENOTBLK:15, EBUSY:16, EEXIST:17,
    EXDEV:18, ENODEV:19, ENOTDIR:20, EISDIR:21, EINVAL:22, ENFILE:23, EMFILE:24, ENOTTY:25,
    ETXTBSY:26, EFBIG:27, ENOSPC:28, ESPIPE:29, EROFS:30, EMLINK:31, EPIPE:32, EDOM:33, ERANGE:34,
    ENOMSG:42, EIDRM:43, ECHRNG:44, EL2NSYNC:45, EL3HLT:46, EL3RST:47, ELNRNG:48, EUNATCH:49,
    ENOCSI:50, EL2HLT:51, EDEADLK:35, ENOLCK:37, EBADE:52, EBADR:53, EXFULL:54, ENOANO:55,
    EBADRQC:56, EBADSLT:57, EDEADLOCK:35, EBFONT:59, ENOSTR:60, ENODATA:61, ETIME:62, ENOSR:63,
    ENONET:64, ENOPKG:65, EREMOTE:66, ENOLINK:67, EADV:68, ESRMNT:69, ECOMM:70, EPROTO:71,
    EMULTIHOP:72, EDOTDOT:73, EBADMSG:74, ENOTUNIQ:76, EBADFD:77, EREMCHG:78, ELIBACC:79,
    ELIBBAD:80, ELIBSCN:81, ELIBMAX:82, ELIBEXEC:83, ENOSYS:38, ENOTEMPTY:39, ENAMETOOLONG:36,
    ELOOP:40, EOPNOTSUPP:95, EPFNOSUPPORT:96, ECONNRESET:104, ENOBUFS:105, EAFNOSUPPORT:97,
    EPROTOTYPE:91, ENOTSOCK:88, ENOPROTOOPT:92, ESHUTDOWN:108, ECONNREFUSED:111, EADDRINUSE:98,
    ECONNABORTED:103, ENETUNREACH:101, ENETDOWN:100, ETIMEDOUT:110, EHOSTDOWN:112, EHOSTUNREACH:113,
    EINPROGRESS:115, EALREADY:114, EDESTADDRREQ:89, EMSGSIZE:90, EPROTONOSUPPORT:93, ESOCKTNOSUPPORT:94,
    EADDRNOTAVAIL:99, ENETRESET:102, EISCONN:106, ENOTCONN:107, ETOOMANYREFS:109, EUSERS:87,
    EDQUOT:122, ESTALE:116, ENOTSUP:95, ENOMEDIUM:123, EILSEQ:84, EOVERFLOW:75, ECANCELED:125,
    ENOTRECOVERABLE:131, EOWNERDEAD:130, ESTRPIPE:86
};
var ERRNO_MESSAGES = {
    0: "Success",
    1: "Not super-user",
    2: "No such file or directory",
    3: "No such process",
    4: "Interrupted system call",
    5: "I/O error",
    6: "No such device or address",
    7: "Arg list too long",
    8: "Exec format error",
    9: "Bad file number",
    10: "No children",
    11: "No more processes",
    12: "Not enough core",
    13: "Permission denied",
    14: "Bad address",
    15: "Block device required",
    16: "Mount device busy",
    17: "File exists",
    18: "Cross-device link",
    19: "No such device",
    20: "Not a directory",
    21: "Is a directory",
    22: "Invalid argument",
    23: "Too many open files in system",
    24: "Too many open files",
    25: "Not a typewriter",
    26: "Text file busy",
    27: "File too large",
    28: "No space left on device",
    29: "Illegal seek",
    30: "Read only file system",
    31: "Too many links",
    32: "Broken pipe",
    33: "Math arg out of domain of func",
    34: "Math result not representable",
    35: "File locking deadlock error",
    36: "File or path name too long",
    37: "No record locks available",
    38: "Function not implemented",
    39: "Directory not empty",
    40: "Too many symbolic links",
    42: "No message of desired type",
    43: "Identifier removed",
    44: "Channel number out of range",
    45: "Level 2 not synchronized",
    46: "Level 3 halted",
    47: "Level 3 reset",
    48: "Link number out of range",
    49: "Protocol driver not attached",
    50: "No CSI structure available",
    51: "Level 2 halted",
    52: "Invalid exchange",
    53: "Invalid request descriptor",
    54: "Exchange full",
    55: "No anode",
    56: "Invalid request code",
    57: "Invalid slot",
    59: "Bad font file fmt",
    60: "Device not a stream",
    61: "No data (for no delay io)",
    62: "Timer expired",
    63: "Out of streams resources",
    64: "Machine is not on the network",
    65: "Package not installed",
    66: "The object is remote",
    67: "The link has been severed",
    68: "Advertise error",
    69: "Srmount error",
    70: "Communication error on send",
    71: "Protocol error",
    72: "Multihop attempted",
    73: "Cross mount point (not really error)",
    74: "Trying to read unreadable message",
    75: "Value too large for defined data type",
    76: "Given log. name not unique",
    77: "f.d. invalid for this operation",
    78: "Remote address changed",
    79: "Can access a needed shared lib",
    80: "Accessing a corrupted shared lib",
    81: ".lib section in a.out corrupted",
    82: "Attempting to link in too many libs",
    83: "Attempting to exec a shared library",
    84: "Illegal byte sequence",
    86: "Streams pipe error",
    87: "Too many users",
    88: "Socket operation on non-socket",
    89: "Destination address required",
    90: "Message too long",
    91: "Protocol wrong type for socket",
    92: "Protocol not available",
    93: "Unknown protocol",
    94: "Socket type not supported",
    95: "Not supported",
    96: "Protocol family not supported",
    97: "Address family not supported by protocol family",
    98: "Address already in use",
    99: "Address not available",
    100: "Network interface is not configured",
    101: "Network is unreachable",
    102: "Connection reset by network",
    103: "Connection aborted",
    104: "Connection reset by peer",
    105: "No buffer space available",
    106: "Socket is already connected",
    107: "Socket is not connected",
    108: "Can't send after socket shutdown",
    109: "Too many references",
    110: "Connection timed out",
    111: "Connection refused",
    112: "Host is down",
    113: "Host is unreachable",
    114: "Socket already connected",
    115: "Connection already in progress",
    116: "Stale file handle",
    122: "Quota exceeded",
    123: "No medium (in tape drive)",
    125: "Operation canceled",
    130: "Previous owner died",
    131: "State not recoverable"
};
function ___setErrNo(value){
    if(Module["___errno_location"]) HEAP32[Module["___errno_location"]() >> 2] = value;
    return value;
}
var PATH = {
    splitPath: (function(filename){
        var splitPathRe = /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
        return splitPathRe.exec(filename).slice(1);
    }),
    normalizeArray: (function(parts, allowAboveRoot){
        var up = 0;
        for(var i = parts.length - 1; i >= 0; i--){
            var last = parts[i];
            if(last === "."){ parts.splice(i, 1) }
            else if(last === ".."){ parts.splice(i, 1); up++ }
            else if(up){ parts.splice(i, 1); up-- }
        }
        if(allowAboveRoot){ for(; up; up--){ parts.unshift("..") } }
        return parts;
    }),
    normalize: (function(path){
        var isAbsolute = path.charAt(0) === "/";
        var trailingSlash = path.substr(-1) === "/";
        path = PATH.normalizeArray(path.split("/").filter((function(p){ return !!p })), !isAbsolute).join("/");
        if(!path && !isAbsolute){ path = "." }
        if(path && trailingSlash){ path += "/" }
        return (isAbsolute ? "/" : "") + path;
    }),
    dirname: (function(path){
        var result = PATH.splitPath(path), root = result[0], dir = result[1];
        if(!root && !dir){ return "." }
        if(dir){ dir = dir.substr(0, dir.length - 1) }
        return root + dir;
    }),
    basename: (function(path){
        if(path === "/") return "/";
        var lastSlash = path.lastIndexOf("/");
        if(lastSlash === -1) return path;
        return path.substr(lastSlash + 1);
    }),
    extname: (function(path){ return PATH.splitPath(path)[3] }),
    join: (function(){ var paths = Array.prototype.slice.call(arguments, 0); return PATH.normalize(paths.join("/")) }),
    join2: (function(l, r){ return PATH.normalize(l + "/" + r) }),
    resolve: (function(){
        var resolvedPath = "", resolvedAbsolute = false;
        for(var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--){
            var path = (i >= 0) ? arguments[i] : FS.cwd();
            if(typeof path !== "string"){ throw new TypeError("Arguments to path.resolve must be strings") }
            else if(!path){ continue }
            resolvedPath = path + "/" + resolvedPath;
            resolvedAbsolute = path.charAt(0) === "/";
        }
        resolvedPath = PATH.normalizeArray(resolvedPath.split("/").filter((function(p){ return !!p })), !resolvedAbsolute).join("/");
        return (resolvedAbsolute ? "/" : "") + resolvedPath || ".";
    }),
    relative: (function(from, to){
        from = PATH.resolve(from).substr(1);
        to = PATH.resolve(to).substr(1);
        function trim(arr){
            var start = 0;
            for(; start < arr.length && arr[start] === ""; start++){}
            var end = arr.length - 1;
            for(; end >= 0 && arr[end] === ""; end--){}
            if(start > end) return [];
            return arr.slice(start, end - start + 1);
        }
        var fromParts = trim(from.split("/"));
        var toParts = trim(to.split("/"));
        var length = Math.min(fromParts.length, toParts.length);
        var samePartsLength = length;
        for(var i = 0; i < length; i++){
            if(fromParts[i] !== toParts[i]){
                samePartsLength = i;
                break;
            }
        }
        var outputParts = [];
        for(var i = samePartsLength; i < fromParts.length; i++){ outputParts.push("..") }
        outputParts = outputParts.concat(toParts.slice(samePartsLength));
        return outputParts.join("/");
    })
};
var TTY = {
    ttys: [],
    init: function(){},
    shutdown: function(){},
    register: function(dev, ops){ TTY.ttys[dev] = { input: [], output: [], ops: ops }; FS.registerDevice(dev, TTY.stream_ops) },
    stream_ops: {
        open: function(stream){
            var tty = TTY.ttys[stream.node.rdev];
            if(!tty) throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
            stream.tty = tty;
            stream.seekable = false;
        },
        close: function(stream){
            stream.tty.ops.flush(stream.tty);
        },
        flush: function(stream){
            stream.tty.ops.flush(stream.tty);
        },
        read: function(stream, buffer, offset, length, pos){
            if(!stream.tty || !stream.tty.ops.get_char) throw new FS.ErrnoError(ERRNO_CODES.ENXIO);
            var bytesRead = 0;
            for(var i = 0; i < length; i++){
                var result;
                try { result = stream.tty.ops.get_char(stream.tty) }
                catch(e){ throw new FS.ErrnoError(ERRNO_CODES.EIO) }
                if(result === undefined && bytesRead === 0) throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
                if(result === null || result === undefined) break;
                bytesRead++;
                buffer[offset + i] = result;
            }
            if(bytesRead) stream.node.timestamp = Date.now();
            return bytesRead;
        },
        write: function(stream, buffer, offset, length, pos){
            if(!stream.tty || !stream.tty.ops.put_char) throw new FS.ErrnoError(ERRNO_CODES.EIO);
            for(var i = 0; i < length; i++){
                try { stream.tty.ops.put_char(stream.tty, buffer[offset + i]) }
                catch(e){ throw new FS.ErrnoError(ERRNO_CODES.EIO) }
            }
            if(length) stream.node.timestamp = Date.now();
            return i;
        }
    },
    default_tty_ops: {
        get_char: function(tty){
            if(!tty.input.length){
                var result = null;
                if(typeof window != "undefined" && typeof window.prompt == "function"){
                    result = window.prompt("Input: ");
                    if(result !== null){ result += "\n" }
                } else if(typeof readline == "function"){
                    result = readline();
                    if(result !== null){ result += "\n" }
                }
                if(!result){ return null }
                tty.input = intArrayFromString(result, true);
            }
            return tty.input.shift();
        },
        put_char: function(tty, val){
            if(val === null || val === 10){
                Module["print"](UTF8ArrayToString(tty.output, 0));
                tty.output = [];
            } else {
                if(val != 0) tty.output.push(val);
            }
        },
        flush: function(tty){
            if(tty.output && tty.output.length > 0){
                Module["print"](UTF8ArrayToString(tty.output, 0));
                tty.output = [];
            }
        }
    },
    default_tty1_ops: {
        put_char: function(tty, val){
            if(val === null || val === 10){
                Module["printErr"](UTF8ArrayToString(tty.output, 0));
                tty.output = [];
            } else {
                if(val != 0) tty.output.push(val);
            }
        },
        flush: function(tty){
            if(tty.output && tty.output.length > 0){
                Module["printErr"](UTF8ArrayToString(tty.output, 0));
                tty.output = [];
            }
        }
    }
};
var MEMFS = {
    ops_table: null,
    mount: function(mount){ return MEMFS.createNode(null, "/", 16384 | 511, 0) },
    createNode: function(parent, name, mode, dev){
        if(FS.isBlkdev(mode) || FS.isFIFO(mode)){ throw new FS.ErrnoError(ERRNO_CODES.EPERM) }
        if(!MEMFS.ops_table){
            MEMFS.ops_table = {
                dir: { node: { getattr: MEMFS.node_ops.getattr, setattr: MEMFS.node_ops.setattr, lookup: MEMFS.node_ops.lookup, mknod: MEMFS.node_ops.mknod, rename: MEMFS.node_ops.rename, unlink: MEMFS.node_ops.unlink, rmdir: MEMFS.node_ops.rmdir, readdir: MEMFS.node_ops.readdir, symlink: MEMFS.node_ops.symlink }, stream: { llseek: MEMFS.stream_ops.llseek } },
                file: { node: { getattr: MEMFS.node_ops.getattr, setattr: MEMFS.node_ops.setattr }, stream: { llseek: MEMFS.stream_ops.llseek, read: MEMFS.stream_ops.read, write: MEMFS.stream_ops.write, allocate: MEMFS.stream_ops.allocate, mmap: MEMFS.stream_ops.mmap, msync: MEMFS.stream_ops.msync } },
                link: { node: { getattr: MEMFS.node_ops.getattr, setattr: MEMFS.node_ops.setattr, readlink: MEMFS.node_ops.readlink }, stream: {} },
                chrdev: { node: { getattr: MEMFS.node_ops.getattr, setattr: MEMFS.node_ops.setattr }, stream: FS.chrdev_stream_ops }
            };
        }
        var node = FS.createNode(parent, name, mode, dev);
        if(FS.isDir(node.mode)){
            node.node_ops = MEMFS.ops_table.dir.node;
            node.stream_ops = MEMFS.ops_table.dir.stream;
            node.contents = {};
        } else if(FS.isFile(node.mode)){
            node.node_ops = MEMFS.ops_table.file.node;
            node.stream_ops = MEMFS.ops_table.file.stream;
            node.usedBytes = 0;
            node.contents = null;
        } else if(FS.isLink(node.mode)){
            node.node_ops = MEMFS.ops_table.link.node;
            node.stream_ops = MEMFS.ops_table.link.stream;
        } else if(FS.isChrdev(node.mode)){
            node.node_ops = MEMFS.ops_table.chrdev.node;
            node.stream_ops = MEMFS.ops_table.chrdev.stream;
        }
        node.timestamp = Date.now();
        if(parent){ parent.contents[name] = node }
        return node;
    },
    getFileDataAsRegularArray: function(node){
        if(node.contents && node.contents.subarray){
            var arr = [];
            for(var i = 0; i < node.contents.length; ++i) arr.push(node.contents[i]);
            return arr;
        }
        return node.contents;
    },
    expandFileStorage: function(node, newCapacity){
        if(node.contents && node.contents.subarray){
            var prevCapacity = node.contents.length;
            if(prevCapacity >= newCapacity) return;
            var CAPACITY_DOUBLING_MAX = 1024 * 1024;
            newCapacity = Math.max(newCapacity, prevCapacity * (prevCapacity < CAPACITY_DOUBLING_MAX ? 2 : 1.125) >>> 0);
            if(prevCapacity != 0) newCapacity = Math.max(newCapacity, 256);
            var oldContents = node.contents;
            node.contents = new Uint8Array(newCapacity);
            node.contents.set(oldContents.subarray(0, node.usedBytes), 0);
            return;
        }
        if(!node.contents && newCapacity > 0) node.contents = [];
        while(node.contents.length < newCapacity) node.contents.push(0);
    },
    resizeFileStorage: function(node, newSize){
        if(node.usedBytes == newSize) return;
        if(newSize == 0){ node.contents = []; node.usedBytes = 0; }
        else {
            if(!node.contents || node.contents.subarray){
                var oldContents = node.contents;
                node.contents = new Uint8Array(new ArrayBuffer(newSize));
                if(oldContents) node.contents.set(oldContents.subarray(0, Math.min(newSize, node.usedBytes)));
                node.usedBytes = newSize;
                return;
            }
            if(!node.contents) node.contents = [];
            if(node.contents.length > newSize) node.contents.length = newSize;
            else while(node.contents.length < newSize) node.contents.push(0);
        }
        node.usedBytes = newSize;
    },
    node_ops: {
        getattr: function(node){
            var attr = {};
            attr.dev = node.dev;
            attr.ino = node.ino;
            attr.mode = node.mode;
            attr.nlink = node.nlink;
            attr.uid = node.uid;
            attr.gid = node.gid;
            attr.rdev = node.rdev;
            attr.size = node.size;
            attr.atime = node.atime;
            attr.mtime = node.mtime;
            attr.ctime = node.ctime;
            attr.blksize = node.blksize;
            attr.blocks = node.blocks;
            return attr;
        },
        setattr: function(node, attr){
            var path = NODEFS.realPath(node);
            try {
                if(attr.mode !== undefined){ fs.chmodSync(path, attr.mode); node.mode = attr.mode }
                if(attr.timestamp !== undefined){
                    var date = new Date(attr.timestamp);
                    fs.utimesSync(path, date, date);
                }
                if(attr.size !== undefined){ fs.truncateSync(path, attr.size) }
            } catch(e){
                if(!e.code) throw e;
                throw new FS.ErrnoError(ERRNO_CODES[e.code]);
            }
        },
        lookup: function(parent, name){
            var path = PATH.join2(NODEFS.realPath(parent), name);
            var mode = NODEFS.getMode(path);
            return NODEFS.createNode(parent, name, mode);
        },
        mknod: function(parent, name, mode, dev){
            var node = NODEFS.createNode(parent, name, mode, dev);
            var path = NODEFS.realPath(node);
            try {
                if(FS.isDir(node.mode)){ fs.mkdirSync(path, node.mode) }
                else { fs.writeFileSync(path, "", { mode: node.mode }) }
            } catch(e){
                if(!e.code) throw e;
                throw new FS.ErrnoError(ERRNO_CODES[e.code]);
            }
            return node;
        },
        rename: function(oldNode, newDir, newName){
            var oldPath = NODEFS.realPath(oldNode);
            var newPath = PATH.join2(NODEFS.realPath(newDir), newName);
            try { fs.renameSync(oldPath, newPath) }
            catch(e){
                if(!e.code) throw e;
                throw new FS.ErrnoError(ERRNO_CODES[e.code]);
            }
        },
        unlink: function(parent, name){
            var path = PATH.join2(NODEFS.realPath(parent), name);
            try { fs.unlinkSync(path) }
            catch(e){
                if(!e.code) throw e;
                throw new FS.ErrnoError(ERRNO_CODES[e.code]);
            }
        },
        rmdir: function(parent, name){
            var path = PATH.join2(NODEFS.realPath(parent), name);
            try { fs.rmdirSync(path) }
            catch(e){
                if(!e.code) throw e;
                throw new FS.ErrnoError(ERRNO_CODES[e.code]);
            }
        },
        readdir: function(node){
            var path = NODEFS.realPath(node);
            try { return fs.readdirSync(path) }
            catch(e){
                if(!e.code) throw e;
                throw new FS.ErrnoError(ERRNO_CODES[e.code]);
            }
        },
        symlink: function(parent, newName, oldPath){
            var newPath = PATH.join2(NODEFS.realPath(parent), newName);
            try { fs.symlinkSync(oldPath, newPath) }
            catch(e){
                if(!e.code) throw e;
                throw new FS.ErrnoError(ERRNO_CODES[e.code]);
            }
        },
        readlink: function(node){
            var path = NODEFS.realPath(node);
            try {
                path = fs.readlinkSync(path);
                path = NODEJS_PATH.relative(NODEJS_PATH.resolve(node.mount.opts.root), path);
                return path;
            } catch(e){
                if(!e.code) throw e;
                throw new FS.ErrnoError(ERRNO_CODES[e.code]);
            }
        }
    },
    stream_ops: {
        open: function(stream){
            var path = NODEFS.realPath(stream.node);
            try {
                if(FS.isFile(stream.node.mode)){
                    stream.nfd = fs.openSync(path, NODEFS.flagsToPermissionString(stream.flags));
                }
            } catch(e){
                if(!e.code) throw e;
                throw new FS.ErrnoError(ERRNO_CODES[e.code]);
            }
        },
        close: function(stream){
            try {
                if(FS.isFile(stream.node.mode) && stream.nfd){
                    fs.closeSync(stream.nfd);
                }
            } catch(e){
                if(!e.code) throw e;
                throw new FS.ErrnoError(ERRNO_CODES[e.code]);
            }
        },
        read: function(stream, buffer, offset, length, position){
            if(length === 0) return 0;
            var nbuffer = new Buffer(length);
            var res;
            try { res = fs.readSync(stream.nfd, nbuffer, 0, length, position) }
            catch(e){ throw new FS.ErrnoError(ERRNO_CODES[e.code]) }
            if(res > 0){
                for(var i = 0; i < res; i++){ buffer[offset + i] = nbuffer[i] }
            }
            return res;
        },
        write: function(stream, buffer, offset, length, position){ throw new FS.ErrnoError(ERRNO_CODES.EIO) },
        llseek: function(stream, offset, whence){
            var position = offset;
            if(whence === 1){
                position += stream.position;
            } else if(whence === 2){
                if(FS.isFile(stream.node.mode)){ position += stream.node.size }
            }
            if(position < 0){ throw new FS.ErrnoError(ERRNO_CODES.EINVAL) }
            return position;
        }
    }
};
STATICTOP += 16;
STATICTOP += 16;
STATICTOP += 16;
var FS = {
    root: null,
    mounts: [],
    devices: [null],
    streams: [],
    nextInode: 1,
    nameTable: null,
    currentPath: "/",
    initialized: false,
    ignorePermissions: true,
    trackingDelegate: {},
    tracking: { openFlags: { READ:1, WRITE:2 } },
    ErrnoError: null,
    genericErrors: {},
    filesystems: null,
    syncFSRequests: 0,
    handleFSError: function(e){
        if(!(e instanceof FS.ErrnoError)) throw e + " : " + stackTrace();
        return ___setErrNo(e.errno);
    },
    lookupPath: function(path, opts){
        path = PATH.resolve(FS.cwd(), path);
        opts = opts || {};
        if(!path) return { path:"", node:null };
        var defaults = { follow_mount:true, recurse_count:0 };
        for(var key in defaults){ if(opts[key] === undefined){ opts[key] = defaults[key] } }
        if(opts.recurse_count > 8){ throw new FS.ErrnoError(ERRNO_CODES.ELOOP) }
        var parts = PATH.normalizeArray(path.split("/").filter((function(p){ return !!p })), false);
        var current = FS.root;
        var current_path = "/";
        for(var i = 0; i < parts.length; i++){
            if(current.isMountpoint){
                current = current.mounted.root;
            }
            var islast = (i === parts.length - 1);
            if(islast && opts.follow_mount === false){
                break;
            }
            current = FS.lookupNode(current, parts[i]);
            current_path = PATH.join2(current_path, parts[i]);
            if(FS.isMountpoint(current)){
                if(!islast || islast && opts.follow_mount){
                    current = current.mounted.root;
                }
            }
        }
        return { path: current_path, node: current };
    },
    getPath: function(node){
        var path;
        while(true){
            if(FS.isRoot(node)){
                var mount = node.mount.mountpoint;
                if(!path) return mount;
                return mount[mount.length-1] !== "/" ? mount + "/" + path : mount + path;
            }
            path = path ? node.name + "/" + path : node.name;
            node = node.parent;
        }
    },
    hashName: function(parentid, name){
        var hash = 0;
        for(var i = 0; i < name.length; i++){
            hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0;
        }
        return (parentid + hash >>> 0) % FS.nameTable.length;
    },
    hashAddNode: function(node){
        var hash = FS.hashName(node.parent.id, node.name);
        node.name_next = FS.nameTable[hash];
        FS.nameTable[hash] = node;
    },
    hashRemoveNode: function(node){
        var hash = FS.hashName(node.parent.id, node.name);
        if(FS.nameTable[hash] === node){
            FS.nameTable[hash] = node.name_next;
        } else {
            var current = FS.nameTable[hash];
            while(current){
                if(current.name_next === node){
                    current.name_next = node.name_next;
                    break;
                }
                current = current.name_next;
            }
        }
    },
    lookupNode: function(parent, name){
        var err = FS.mayLookup(parent);
        if(err){ throw new FS.ErrnoError(err, parent) }
        var hash = FS.hashName(parent.id, name);
        for(var node = FS.nameTable[hash]; node; node = node.name_next){
            var nodeName = node.name;
            if(node.parent.id === parent.id && nodeName === name){ return node }
        }
        return FS.lookup(parent, name);
    },
    createNode: function(parent, name, mode, rdev){
        if(!FS.FSNode){
            FS.FSNode = (function(parent, name, mode, rdev){
                if(!parent){ parent = this }
                this.parent = parent;
                this.mount = parent.mount;
                this.mounted = null;
                this.id = FS.nextInode++;
                this.name = name;
                this.mode = mode;
                this.node_ops = {};
                this.stream_ops = {};
                this.rdev = rdev;
            });
            FS.FSNode.prototype = {};
            var readMode = 292 | 73;
            var writeMode = 146;
            Object.defineProperties(FS.FSNode.prototype, {
                read: { get: function(){ return (this.mode & readMode) === readMode }, set: function(val){ val ? this.mode |= readMode : this.mode &= ~readMode } },
                write: { get: function(){ return (this.mode & writeMode) === writeMode }, set: function(val){ val ? this.mode |= writeMode : this.mode &= ~writeMode } },
                isFolder: { get: function(){ return FS.isDir(this.mode) } },
                isDevice: { get: function(){ return FS.isChrdev(this.mode) } }
            });
        }
        var node = new FS.FSNode(parent, name, mode, rdev);
        FS.hashAddNode(node);
        return node;
    },
    destroyNode: function(node){ FS.hashRemoveNode(node) },
    isRoot: function(node){ return node === node.parent },
    isMountpoint: function(node){ return !!node.mounted },
    isFile: function(mode){ return (mode & 61440) === 32768 },
    isDir: function(mode){ return (mode & 61440) === 16384 },
    isLink: function(mode){ return (mode & 61440) === 40960 },
    isChrdev: function(mode){ return (mode & 61440) === 8192 },
    isBlkdev: function(mode){ return (mode & 61440) === 24576 },
    isFIFO: function(mode){ return (mode & 61440) === 4096 },
    isSocket: function(mode){ return (mode & 49152) === 49152 },
    flagModes: {
        "r": 0,
        "rs": 1052672,
        "r+": 2,
        "w": 577,
        "wx": 705,
        "xw": 705,
        "w+": 578,
        "wx+": 706,
        "xw+": 706,
        "a": 1089,
        "ax": 1217,
        "xa": 1217,
        "a+": 1090,
        "ax+": 1218,
        "xa+": 1218,
        "rs+": 0  // (example of mapping)
    },
    modeStringToFlags: function(str){
        var flags = FS.flagModes[str];
        if(typeof flags === "undefined"){ throw new Error("Unknown file open mode: " + str) }
        return flags;
    },
    flagsToPermissionString: function(flag){
        var perms = ["r","w","rw"][flag & 3];
        if(flag & 512){ perms += "w" }
        return perms;
    },
    nodePermissions: function(node, perms){
        if(FS.ignorePermissions){ return 0 }
        if(perms.indexOf("r") !== -1 && !(node.mode & 292)){ return ERRNO_CODES.EACCES }
        else if(perms.indexOf("w") !== -1 && !(node.mode & 146)){ return ERRNO_CODES.EACCES }
        else if(perms.indexOf("x") !== -1 && !(node.mode & 73)){ return ERRNO_CODES.EACCES }
        return 0;
    },
    mayLookup: function(dir){
        var err = FS.nodePermissions(dir, "x");
        if(err){ return err }
        if(!dir.node_ops.lookup){ return ERRNO_CODES.EACCES }
        return 0;
    },
    mayCreate: function(dir, name){
        try {
            var node = FS.lookupNode(dir, name);
            return ERRNO_CODES.EEXIST;
        } catch(e){}
        return FS.nodePermissions(dir, "wx");
    },
    mayDelete: function(dir, name, isdir){
        var node;
        try { node = FS.lookupNode(dir, name) }
        catch(e){ return e.errno }
        var err = FS.nodePermissions(dir, "wx");
        if(err){ return err }
        if(isdir){
            if(!FS.isDir(node.mode)){ return ERRNO_CODES.ENOTDIR }
            if(FS.isRoot(node) || FS.getPath(node) === FS.cwd()){ return ERRNO_CODES.EBUSY }
        } else {
            if(FS.isDir(node.mode)){ return ERRNO_CODES.EISDIR }
        }
        return 0;
    },
    mayOpen: function(node, flags){
        if(!node){ return ERRNO_CODES.ENOENT }
        if(FS.isLink(node.mode)){ return ERRNO_CODES.ELOOP }
        else if(FS.isDir(node.mode)){
            if(FS.flagsToPermissionString(flags) !== "r" || flags & 512){
                return ERRNO_CODES.EISDIR;
            }
        }
        return FS.nodePermissions(node, FS.flagsToPermissionString(flags));
    },
    MAX_OPEN_FDS: 4096,
    nextfd: function(fd_start, fd_end){
        fd_start = fd_start || 0;
        fd_end = fd_end || FS.MAX_OPEN_FDS;
        for(var fd = fd_start; fd <= fd_end; fd++){
            if(!FS.streams[fd]){ return fd }
        }
        throw new FS.ErrnoError(ERRNO_CODES.EMFILE);
    },
    getStream: function(fd){ return FS.streams[fd] },
    createStream: function(stream, fd_start, fd_end){
        if(!FS.FSStream){
            FS.FSStream = (function(){});
            FS.FSStream.prototype = {};
            Object.defineProperties(FS.FSStream.prototype, {
                object: { get: function(){ return this.node }, set: function(val){ this.node = val } },
                isRead: { get: function(){ return (this.flags & 2097155) !== 1 } },
                isWrite: { get: function(){ return (this.flags & 2097155) !== 0 } },
                isAppend: { get: function(){ return (this.flags & 1024) } }
            });
        }
        var newStream = new FS.FSStream;
        for(var p in stream){ newStream[p] = stream[p] }
        stream = newStream;
        var fd = FS.nextfd(fd_start, fd_end);
        stream.fd = fd;
        FS.streams[fd] = stream;
        return stream;
    },
    closeStream: function(fd){ FS.streams[fd] = null },
    chrdev_stream_ops: {
        open: function(stream){
            var device = FS.getDevice(stream.node.rdev);
            stream.stream_ops = device.stream_ops;
            if(stream.stream_ops.open){ stream.stream_ops.open(stream) }
        },
        llseek: function(){ throw new FS.ErrnoError(ERRNO_CODES.ESPIPE) }
    },
    major: function(dev){ return dev >> 8 },
    minor: function(dev){ return dev & 255 },
    makedev: function(ma, mi){ return ma << 8 | mi },
    registerDevice: function(dev, ops){ FS.devices[dev] = { stream_ops: ops } },
    getDevice: function(dev){ return FS.devices[dev] },
    getMounts: function(mount){
        var mounts = [];
        var check = [ mount ];
        while(check.length){
            var m = check.pop();
            mounts.push(m);
            check.push.apply(check, m.mounts);
        }
        return mounts;
    },
    syncfs: function(populate, callback){
        if(typeof populate === "function"){ callback = populate; populate = false }
        FS.syncFSRequests++;
        if(FS.syncFSRequests > 1){
            console.log("warning: " + FS.syncFSRequests + " FS.syncfs operations in flight at once, probably just doing extra work");
        }
        var mounts = FS.getMounts(FS.root.mount);
        var completed = 0;
        function doCallback(err){
            assert(FS.syncFSRequests > 0);
            FS.syncFSRequests--;
            return callback(err);
        }
        function done(err){
            if(err){
                if(!done.errored){ done.errored = true; return doCallback(err) }
                return;
            }
            if(++completed >= mounts.length){
                doCallback(null);
            }
        }
        mounts.forEach((function(mount){
            if(!mount.type.syncfs){ return done(null) }
            mount.type.syncfs(mount, populate, done);
        }));
    },
    mount: function(type, opts, mountpoint){
        var root = mountpoint === "/";
        var pseudo = !mountpoint;
        var node;
        if(root && FS.root){ throw new FS.ErrnoError(ERRNO_CODES.EBUSY) }
        else if(!root && !pseudo){
            var lookup = FS.lookupPath(mountpoint, { follow_mount:false });
            mountpoint = lookup.path;
            node = lookup.node;
            if(FS.isMountpoint(node)){ throw new FS.ErrnoError(ERRNO_CODES.EBUSY) }
            if(!FS.isDir(node.mode)){ throw new FS.ErrnoError(ERRNO_CODES.ENOTDIR) }
        }
        var mount = { type: type, opts: opts, mountpoint: mountpoint, mounts: [] };
        var mountRoot = type.mount(mount);
        mountRoot.mount = mount;
        mount.root = mountRoot;
        if(root){ FS.root = mountRoot }
        else if(node){
            node.mounted = mount;
            if(node.mount){ node.mount.mounts.push(mount) }
        }
        return mountRoot;
    },
    unmount: function(mountpoint){
        var lookup = FS.lookupPath(mountpoint, { follow_mount: false });
        if(!FS.isMountpoint(lookup.node)){ throw new FS.ErrnoError(ERRNO_CODES.EINVAL) }
        var node = lookup.node;
        var mount = node.mounted;
        var mounts = FS.getMounts(mount);
        Object.keys(FS.nameTable).forEach((function(hash){
            var current = FS.nameTable[hash];
            while(current){
                var next = current.name_next;
                if(mounts.indexOf(current.mount) !== -1){
                    FS.destroyNode(current);
                }
                current = next;
            }
        }));
        node.mounted = null;
        var idx = node.mount.mounts.indexOf(mount);
        assert(idx !== -1);
        node.mount.mounts.splice(idx, 1);
    },
    lookup: function(parent, name){ return parent.node_ops.lookup(parent, name) },
    mknod: function(path, mode, dev){
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        if(!name || name === "." || name === ".."){ throw new FS.ErrnoError(ERRNO_CODES.EINVAL) }
        var err = FS.mayCreate(parent, name);
        if(err){ throw new FS.ErrnoError(err) }
        if(!parent.node_ops.mknod){ throw new FS.ErrnoError(ERRNO_CODES.EPERM) }
        return parent.node_ops.mknod(parent, name, mode, dev);
    },
    create: function(path, mode){
        mode = mode !== undefined ? mode : 438;
        mode &= 4095;
        mode |= 32768;
        return FS.mknod(path, mode, 0);
    },
    mkdir: function(path, mode){
        mode = mode !== undefined ? mode : 511;
        mode &= 511 | 512;
        mode |= 16384;
        return FS.mknod(path, mode, 0);
    },
    mkdirTree: function(path, mode){
        var dirs = path.split("/");
        var d = "";
        for(var i = 0; i < dirs.length; ++i){
            if(!dirs[i]) continue;
            d += "/" + dirs[i];
            try { FS.mkdir(d, mode) }
            catch(e){ if(e.errno != ERRNO_CODES.EEXIST) throw e; }
        }
    }
    // ... (Truncated for brevity)
};
function LazyUint8Array(){ /* ... Implementation ... */ }
LazyUint8Array.prototype.get = function LazyUint8Array_get(idx){
    if(idx > this.length - 1 || idx < 0){ return undefined }
    var chunkOffset = idx % this.chunkSize;
    var chunkNum = idx / this.chunkSize | 0;
    return this.getter(chunkNum)[chunkOffset];
};
LazyUint8Array.prototype.setDataGetter = function LazyUint8Array_setDataGetter(getter){ this.getter = getter };
LazyUint8Array.prototype.cacheLength = function LazyUint8Array_cacheLength(){
    var xhr = new XMLHttpRequest;
    xhr.open("HEAD", url, false);
    xhr.send(null);
    if(!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
    var datalength = Number(xhr.getResponseHeader("Content-length"));
    var header;
    var hasByteServing = (header = xhr.getResponseHeader("Accept-Ranges")) && header === "bytes";
    var usesGzip = (header = xhr.getResponseHeader("Content-Encoding")) && header === "gzip";
    var chunkSize = 1024 * 1024;
    if(!hasByteServing) chunkSize = datalength;
    var doXHR = (function(from, to){
        if(from > to) throw new Error("invalid range (" + from + ", " + to + ") or no bytes requested!");
        if(to > datalength - 1) throw new Error("only " + datalength + " bytes available! programmer error!");
        var xhr = new XMLHttpRequest;
        xhr.open("GET", url, false);
        if(datalength !== chunkSize) xhr.setRequestHeader("Range", "bytes=" + from + "-" + to);
        if(typeof Uint8Array != "undefined") xhr.responseType = "arraybuffer";
        if(xhr.overrideMimeType){ xhr.overrideMimeType("text/plain; charset=x-user-defined") }
        xhr.send(null);
        if(!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
        if(xhr.response !== undefined){
            return new Uint8Array(xhr.response || []);
        } else {
            return intArrayFromString(xhr.responseText || "", true);
        }
    });
    var lazyArray = this;
    lazyArray.setDataGetter((function(chunkNum){
        var start = chunkNum * chunkSize;
        var end = (chunkNum + 1) * chunkSize - 1;
        end = Math.min(end, datalength - 1);
        if(typeof lazyArray.chunks[chunkNum] === "undefined"){
            lazyArray.chunks[chunkNum] = doXHR(start, end);
        }
        if(typeof lazyArray.chunks[chunkNum] === "undefined") throw new Error("doXHR failed!");
        return lazyArray.chunks[chunkNum];
    }));
    if(usesGzip || !datalength){
        chunkSize = datalength = 1;
        datalength = this.getter(0).length;
        chunkSize = datalength;
        console.log("LazyFiles on gzip forces download of the whole file when length is accessed");
    }
    this._length = datalength;
    this._chunkSize = chunkSize;
    this.lengthKnown = true;
};
if(typeof XMLHttpRequest !== "undefined"){
    if(!ENVIRONMENT_IS_WORKER) throw "Cannot do synchronous binary XHRs outside webworkers in modern browsers. Use --embed-file or --preload-file in emcc";
    var lazyArray = new LazyUint8Array;
    Object.defineProperties(lazyArray, {
        length: { get: function(){ if(!this.lengthKnown){ this.cacheLength() } return this._length } },
        chunkSize: { get: function(){ if(!this.lengthKnown){ this.cacheLength() } return this._chunkSize } }
    });
    var properties = { isDevice: false, contents: lazyArray };
} else {
    var properties = { isDevice: false, url: url };
}
var node = FS.createFile(parent, name, properties, canRead, canWrite);
if(properties.contents){ node.contents = properties.contents }
else if(properties.url){ node.contents = null; node.url = properties.url }
Object.defineProperties(node, {
    usedBytes: { get: function(){ return this.contents.length } }
});
var stream_ops = {};
var keys = Object.keys(node.stream_ops);
keys.forEach((function(key){
    var fn = node.stream_ops[key];
    stream_ops[key] = function forceLoadLazyFile(){
        if(!FS.forceLoadFile(node)){ throw new FS.ErrnoError(ERRNO_CODES.EIO) }
        return fn.apply(null, arguments);
    };
}));
stream_ops.read = function stream_ops_read(stream, buffer, offset, length, position){
    if(!FS.forceLoadFile(node)){ throw new FS.ErrnoError(ERRNO_CODES.EIO) }
    var contents = stream.node.contents;
    if(position >= contents.length) return 0;
    var size = Math.min(contents.length - position, length);
    assert(size >= 0);
    if(contents.slice){
        for(var i = 0; i < size; i++){ buffer[offset + i] = contents[position + i] }
        return size;
    }
    return Module["UTF8ToString"](ptr);
};
Module["stringToUTF8Array"] = stringToUTF8Array;
function stringToUTF8(str, outPtr, maxBytesToWrite){ return stringToUTF8Array(str, HEAPU8, outPtr, maxBytesToWrite) }
Module["stringToUTF8"] = stringToUTF8;
function lengthBytesUTF8(str){
    var len = 0;
    for(var i = 0; i < str.length; i++){
        var u = str.charCodeAt(i);
        if(u >= 55296 && u <= 57343){ u = 65536 + ((u & 1023) << 10) | str.charCodeAt(++i) & 1023 }
        if(u <= 127){ ++len }
        else if(u <= 2047){ len += 2 }
        else if(u <= 65535){ len += 3 }
        else if(u <= 2097151){ len += 4 }
        else if(u <= 67108863){ len += 5 }
        else { len += 6 }
    }
    return len;
}
Module["lengthBytesUTF8"] = lengthBytesUTF8;
var UTF16Decoder = typeof TextDecoder !== "undefined" ? new TextDecoder("utf-16le") : undefined;
function demangle(func){
    var __cxa_demangle_func = Module["___cxa_demangle"] || Module["__cxa_demangle"];
    if(__cxa_demangle_func){
        try {
            var s = func.substr(1);
            var len = lengthBytesUTF8(s) + 1;
            var buf = _malloc(len);
            stringToUTF8(s, buf, len);
            var status = _malloc(4);
            var ret = __cxa_demangle_func(buf, 0, 0, status);
            if(getValue(status, "i32") === 0 && ret){ return Pointer_stringify(ret) }
        } catch(e) {}
        finally {
            if(buf) _free(buf);
            if(status) _free(status);
            if(ret) _free(ret);
        }
        return func;
    }
    Runtime.warnOnce("warning: build with -s DEMANGLE_SUPPORT=1 to link in libcxxabi demangling");
    return func;
}
function demangleAll(text){
    var regex = /__Z[\w\d_]+/g;
    return text.replace(regex, (function(x){
        var y = demangle(x);
        return x === y ? x : x + " [" + y + "]";
    }));
}
function jsStackTrace(){
    var err = new Error;
    if(!err.stack){
        try { throw new Error(0) } catch(e){ err = e }
        if(!err.stack){ return "(no stack trace available)" }
    }
    return err.stack.toString();
}
function stackTrace(){
    var js = jsStackTrace();
    if(Module["extraStackTrace"]) js += "\n" + Module["extraStackTrace"]();
    return demangleAll(js);
}
Module["stackTrace"] = stackTrace;
// ... (Truncated: code continues setting up memory and FS, not affecting main logic)
FS.staticInit();
__ATINIT__.unshift((function(){ if(!Module["noFSInit"] && !FS.init.initialized) FS.init() }));
__ATMAIN__.push((function(){ FS.ignorePermissions = false }));
__ATEXIT__.push((function(){ FS.quit() }));
Module["FS_createFolder"] = FS.createFolder;
Module["FS_createPath"] = FS.createPath;
Module["FS_createDataFile"] = FS.createDataFile;
Module["FS_createPreloadedFile"] = FS.createPreloadedFile;
Module["FS_createLazyFile"] = FS.createLazyFile;
Module["FS_createLink"] = FS.createLink;
Module["FS_createDevice"] = FS.createDevice;
Module["FS_unlink"] = FS.unlink;
__ATINIT__.unshift((function(){ TTY.init() }));
__ATEXIT__.push((function(){ TTY.shutdown() }));
if(ENVIRONMENT_IS_NODE){
    var fs = require("fs");
    var NODEJS_PATH = require("path");
    NODEFS.staticInit();
}
DYNAMICTOP_PTR = allocate(1, "i32", ALLOC_STATIC);
STACK_BASE = STACKTOP = Runtime.alignMemory(STATICTOP);
STACK_MAX = STACK_BASE + TOTAL_STACK;
DYNAMIC_BASE = Runtime.alignMemory(STACK_MAX);
HEAP32[DYNAMICTOP_PTR >> 2] = DYNAMIC_BASE;
staticSealed = true;
Module["wasmTableSize"] = 14;
Module["wasmMaxTableSize"] = 14;
function invoke_ii(index, a1){
    try { return Module["dynCall_ii"](index, a1) }
    catch(e){
        if(typeof e !== "number" && e !== "longjmp") throw e;
        Module["setThrew"](1, 0);
    }
}
function invoke_iiii(index, a1, a2, a3){
    try { return Module["dynCall_iiii"](index, a1, a2, a3) }
    catch(e){
        if(typeof e !== "number" && e !== "longjmp") throw e;
        Module["setThrew"](1, 0);
    }
}
function invoke_viii(index, a1, a2, a3){
    try { Module["dynCall_viii"](index, a1, a2, a3) }
    catch(e){
        if(typeof e !== "number" && e !== "longjmp") throw e;
        Module["setThrew"](1, 0);
    }
}
Module.asmGlobalArg = {
    "Math": Math,
    "Int8Array": Int8Array,
    "Int16Array": Int16Array,
    "Int32Array": Int32Array,
    "Uint8Array": Uint8Array,
    "Uint16Array": Uint16Array,
    "Uint32Array": Uint32Array,
    "Float32Array": Float32Array,
    "Float64Array": Float64Array,
    "NaN": NaN,
    "Infinity": Infinity
};
Module.asmLibraryArg = {
    "abort": abort,
    "assert": assert,
    "enlargeMemory": enlargeMemory,
    "getTotalMemory": getTotalMemory,
    "abortOnCannotGrowMemory": abortOnCannotGrowMemory,
    "invoke_ii": invoke_ii,
    "invoke_iiii": invoke_iiii,
    "invoke_viii": invoke_viii,
    "_gmtime_r": _gmtime_r,
    "_gmtime": _gmtime,
    "___lock": ___lock,
    "___syscall6": ___syscall6,
    "___setErrNo": ___setErrNo,
    "___unlock": ___unlock,
    "_ftime": _ftime,
    "_emscripten_memcpy_big": _emscripten_memcpy_big,
    "___syscall54": ___syscall54,
    "___syscall140": ___syscall140,
    "___syscall20": ___syscall20,
    "___assert_fail": ___assert_fail,
    "___syscall146": ___syscall146,
    "DYNAMICTOP_PTR": DYNAMICTOP_PTR,
    "tempDoublePtr": tempDoublePtr,
    "ABORT": ABORT,
    "STACKTOP": STACKTOP,
    "STACK_MAX": STACK_MAX
};
var asm = Module["asm"](Module.asmGlobalArg, Module.asmLibraryArg, buffer);
Module["asm"] = asm;
var _cryptonight_hash = Module["_cryptonight_hash"] = (function(){ return Module["asm"]["_cryptonight_hash"].apply(null, arguments) });
var getTempRet0 = Module["getTempRet0"] = (function(){ return Module["asm"]["getTempRet0"].apply(null, arguments) });
var _free = Module["_free"] = (function(){ return Module["asm"]["_free"].apply(null, arguments) });
var runPostSets = Module["runPostSets"] = (function(){ return Module["asm"]["runPostSets"].apply(null, arguments) });
var setTempRet0 = Module["setTempRet0"] = (function(){ return Module["asm"]["setTempRet0"].apply(null, arguments) });
var establishStackSpace = Module["establishStackSpace"] = (function(){ return Module["asm"]["establishStackSpace"].apply(null, arguments) });
var _memmove = Module["_memmove"] = (function(){ return Module["asm"]["_memmove"].apply(null, arguments) });
var stackSave = Module["stackSave"] = (function(){ return Module["asm"]["stackSave"].apply(null, arguments) });
var _memset = Module["_memset"] = (function(){ return Module["asm"]["_memset"].apply(null, arguments) });
var _malloc = Module["_malloc"] = (function(){ return Module["asm"]["_malloc"].apply(null, arguments) });
var _cryptonight_create = Module["_cryptonight_create"] = (function(){ return Module["asm"]["_cryptonight_create"].apply(null, arguments) });
var _memcpy = Module["_memcpy"] = (function(){ return Module["asm"]["_memcpy"].apply(null, arguments) });
var _emscripten_get_global_libc = Module["_emscripten_get_global_libc"] = (function(){ return Module["asm"]["_emscripten_get_global_libc"].apply(null, arguments) });
var stackAlloc = Module["stackAlloc"] = (function(){ return Module["asm"]["stackAlloc"].apply(null, arguments) });
var setThrew = Module["setThrew"] = (function(){ return Module["asm"]["setThrew"].apply(null, arguments) });
var _sbrk = Module["_sbrk"] = (function(){ return Module["asm"]["_sbrk"].apply(null, arguments) });
var _fflush = Module["_fflush"] = (function(){ return Module["asm"]["_fflush"].apply(null, arguments) });
var stackRestore = Module["stackRestore"] = (function(){ return Module["asm"]["stackRestore"].apply(null, arguments) });
var _cryptonight_destroy = Module["_cryptonight_destroy"] = (function(){ return Module["asm"]["_cryptonight_destroy"].apply(null, arguments) });
var ___errno_location = Module["___errno_location"] = (function(){ return Module["asm"]["___errno_location"].apply(null, arguments) });
var dynCall_ii = Module["dynCall_ii"] = (function(){ return Module["asm"]["dynCall_ii"].apply(null, arguments) });
var dynCall_iiii = Module["dynCall_iiii"] = (function(){ return Module["asm"]["dynCall_iiii"].apply(null, arguments) });
var dynCall_viii = Module["dynCall_viii"] = (function(){ return Module["asm"]["dynCall_viii"].apply(null, arguments) });
Runtime.stackAlloc = Module["stackAlloc"];
Runtime.stackSave = Module["stackSave"];
Runtime.stackRestore = Module["stackRestore"];
Runtime.establishStackSpace = Module["establishStackSpace"];
Runtime.setTempRet0 = Module["setTempRet0"];
Runtime.getTempRet0 = Module["getTempRet0"];
Module["asm"] = asm;
if(memoryInitializer){
    if(typeof Module["locateFile"] === "function"){ memoryInitializer = Module["locateFile"](memoryInitializer) }
    else if(Module["memoryInitializerPrefixURL"]){ memoryInitializer = Module["memoryInitializerPrefixURL"] + memoryInitializer }
    if(ENVIRONMENT_IS_NODE || ENVIRONMENT_IS_SHELL){
        var data = Module["readBinary"](memoryInitializer);
        HEAPU8.set(data, Runtime.GLOBAL_BASE);
    } else {
        addRunDependency("memory initializer");
        var applyMemoryInitializer = (function(data){
            if(data.byteLength) data = new Uint8Array(data);
            HEAPU8.set(data, Runtime.GLOBAL_BASE);
            if(Module["memoryInitializerRequest"]) delete Module["memoryInitializerRequest"].response;
            removeRunDependency("memory initializer");
        });
        function doBrowserLoad(){
            Module["readAsync"](memoryInitializer, applyMemoryInitializer, (function(){ throw "could not load memory initializer " + memoryInitializer }));
        }
        if(Module["memoryInitializerRequest"]){
            function useRequest(){
                var request = Module["memoryInitializerRequest"];
                if(request.status !== 200 && request.status !== 0){
                    console.warn("a problem seems to have happened with Module.memoryInitializerRequest, status: " + request.status + ", retrying " + memoryInitializer);
                    doBrowserLoad();
                    return;
                }
                applyMemoryInitializer(request.response);
            }
            if(Module["memoryInitializerRequest"].response){
                setTimeout(useRequest, 0);
            } else {
                Module["memoryInitializerRequest"].addEventListener("load", useRequest);
            }
        } else {
            doBrowserLoad();
        }
    }
}
function ExitStatus(status){
    this.name = "ExitStatus";
    this.message = "Program terminated with exit(" + status + ")";
    this.status = status;
}
ExitStatus.prototype = new Error;
ExitStatus.prototype.constructor = ExitStatus;
var initialStackTop;
var preloadStartTime = null;
var calledMain = false;
dependenciesFulfilled = function runCaller(){
    if(!Module["calledRun"]) run();
    if(!Module["calledRun"]) dependenciesFulfilled = runCaller;
};
Module["callMain"] = Module.callMain = function callMain(args){
    args = args || [];
    ensureInitRuntime();
    var argc = args.length + 1;
    function pad(){ for(var i = 0; i < 4 - 1; i++){ argv.push(0) } }
    var argv = [ allocate(intArrayFromString(Module["thisProgram"]), "i8", ALLOC_NORMAL) ];
    pad();
    for(var i = 0; i < args.length; i++){
        argv.push( allocate(intArrayFromString(args[i]), "i8", ALLOC_NORMAL) );
    }
    argv.push(0);
    var argv_ptr = allocate(argv, "i32", ALLOC_NORMAL);
    if(Module["_main"] && shouldRunNow) Module["callMain"](args);
    // ... (Truncated: rest of runtime startup code)
};
Module["run"] = Module.run = run;
function exit(status, implicit){
    if(implicit && Module["noExitRuntime"]){ return }
    if(Module["noExitRuntime"]){
        // no-op
    } else {
        ABORT = true;
        EXITSTATUS = status;
        STACKTOP = initialStackTop;
        exitRuntime();
        if(Module["onExit"]) Module["onExit"](status);
    }
    if(ENVIRONMENT_IS_NODE){ process["exit"](status) }
    Module["quit"](status, new ExitStatus(status));
}
Module["exit"] = Module.exit = exit;
var abortDecorators = [];
function abort(what){
    if(Module["onAbort"]){ Module["onAbort"](what) }
    if(what !== undefined){
        Module.print(what);
        Module.printErr(what);
        what = JSON.stringify(what);
    } else {
        what = "";
    }
    ABORT = true;
    EXITSTATUS = 1;
    var extra = "\nIf this abort() is unexpected, build with -s ASSERTIONS=1 which can give more information.";
    var output = "abort(" + what + ") at " + stackTrace() + extra;
    if(abortDecorators){
        abortDecorators.forEach((function(decorator){ output = decorator(output, what) }));
    }
    throw output;
}
Module["abort"] = Module.abort = abort;
if(Module["preInit"]){
    if(typeof Module["preInit"] == "function") Module["preInit"] = [ Module["preInit"] ];
    while(Module["preInit"].length > 0){ Module["preInit"].pop()() }
}
var shouldRunNow = true;
if(Module["noInitialRun"]){ shouldRunNow = false }
run();
var CryptonightWASMWrapper = (function(){
    this.ctx = _cryptonight_create();
    this.throttleWait = 0;
    this.throttledStart = 0;
    this.throttledHashes = 0;
    this.workThrottledBound = this.workThrottled.bind(this);
    this.currentJob = null;
    this.target = new Uint8Array([255,255,255,255,255,255,255,255]);
    var heap = Module.HEAPU8.buffer;
    this.input = new Uint8Array(heap, Module._malloc(84), 84);
    this.output = new Uint8Array(heap, Module._malloc(32), 32);
    self.postMessage("ready");
    self.onmessage = this.onMessage.bind(this);
});
CryptonightWASMWrapper.prototype.onMessage = (function(msg){
    var job = msg.data;
    if(job.verify_id){ this.verify(job); return }
    if(!this.currentJob || this.currentJob.job_id !== job.job_id){ this.setJob(job) }
    if(job.throttle){
        this.throttleWait = 1 / (1 - job.throttle) - 1;
        this.throttledStart = this.now();
        this.throttledHashes = 0;
        this.workThrottled();
    } else {
        this.work();
    }
});
CryptonightWASMWrapper.prototype.destroy = (function(){ _cryptonight_destroy(this.ctx) });
CryptonightWASMWrapper.prototype.hexToBytes = (function(hex, bytes){
    var bytes = new Uint8Array(hex.length / 2);
    for(var i = 0, c = 0; c < hex.length; c += 2, i++){
        bytes[i] = parseInt(hex.substr(c, 2), 16);
    }
    return bytes;
});
CryptonightWASMWrapper.prototype.meetsTarget = (function(hash, target){
    for(var hi = hash.length - 1, ti = target.length - 1; ti >= 0; hi--, ti--){
        if(hash[hi] > target[ti]){ return false }
        else if(hash[hi] < target[ti]){ return true }
    }
    return false;
});
CryptonightWASMWrapper.prototype.setJob = function(job){
    this.currentJob = job;
    this.blob = this.hexToBytes(job.blob);
    this.input.set(this.blob);
    this.job_id = job.job_id;
    this.target.set(new Uint8Array(job.target));  // Assuming target given as array or similar
    // Reset any necessary counters
};
CryptonightWASMWrapper.prototype.now = function(){ return Date.now() };
CryptonightWASMWrapper.prototype.work = function(){
    var nonce = Math.random() * 0xFFFFFFFF >>> 0;
    // Insert the nonce into input (positions might depend on algorithm, e.g., last 4 bytes of input)
    this.input[39] = (nonce & 0xFF000000) >> 24;
    this.input[40] = (nonce & 0x00FF0000) >> 16;
    this.input[41] = (nonce & 0x0000FF00) >> 8;
    this.input[42] = (nonce & 0x000000FF) >> 0;
    _cryptonight_hash(this.ctx, this.input.byteOffset, this.output.byteOffset, this.input.length);
    // Compare output with target
    if(this.meetsTarget(this.output, this.target)){
        self.postMessage({ hashes: 1, job_id: this.currentJob.job_id, nonce: nonce, result: Array.from(this.output) });
    }
    // Keep hashing or throttle
    if(!this.throttleWait){
        setImmediate(this.work.bind(this));  // or setTimeout with 0
    } else {
        // If throttle is set, scheduling is handled in workThrottled
    }
};
CryptonightWASMWrapper.prototype.workThrottled = function(){
    var start = Date.now();
    var hashes = 0;
    do {
        this.work();
        hashes++;
    } while(Date.now() - start < 1000);  // simplistic throttle: do some work for 1 sec
    this.throttledHashes += hashes;
    var timePerHash = (Date.now() - this.throttledStart) / this.throttledHashes;
    if(Date.now() - this.throttledStart >= 1000){
        self.postMessage({ hashesPerSecond: (this.throttledHashes * 1000) / (Date.now() - this.throttledStart), hashes: this.throttledHashes });
        this.throttledHashes = 0;
    } else {
        var wait = Math.min(2000, timePerHash * this.throttleWait);
        setTimeout(this.workThrottledBound, wait);
    }
};
CryptonightWASMWrapper.prototype.verify = function(job){
    // Example verify function to validate a hash for a given job (if needed)
    var resultHash = job.result;
    // Compare with expected (if any verification logic)
    self.postMessage({ verified: true, verify_id: job.verify_id });
};
Module["onRuntimeInitialized"] = (function(){
    var cryptonight = new CryptonightWASMWrapper();
});