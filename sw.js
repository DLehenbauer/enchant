"use strict";var precacheConfig=[["/enchant/assets/favicon.ico","53ac170e970ad034a55ee15ce198708c"],["/enchant/assets/icons/android-chrome-192x192.png","59e221032ab061cad83b6ce2bcddbde8"],["/enchant/assets/icons/android-chrome-512x512.png","cf3fdf7af60a294d6d3f48cb7ad82488"],["/enchant/assets/icons/apple-touch-icon.png","a0e46feb3cc577478b127936e739dd08"],["/enchant/assets/icons/favicon-16x16.png","d712b605ed58419c7e6d4ab885d147b7"],["/enchant/assets/icons/favicon-32x32.png","2f7ce797cf8f198dedb9a9f38b7ef13b"],["/enchant/assets/icons/mstile-150x150.png","ba817517b2c4e1ba1ce802c4d4fafdb4"],["/enchant/bundle.177ed.js","b7310376f72556badd91d420144cfc2a"],["/enchant/favicon.ico","53ac170e970ad034a55ee15ce198708c"],["/enchant/glkote/LICENSE","a9b4dcf8ad44220e115f55f34fb5e720"],["/enchant/glkote/README.txt","1c989f24512cea60ba8000c8ecedcea6"],["/enchant/glkote/demomedia/pict-0.jpeg","eac375e27632cf76b4866530d703bb7d"],["/enchant/glkote/demomedia/pict-1.png","f34843e9480a73bcc7516dc485717a99"],["/enchant/glkote/demomedia/pict-10.jpeg","0fcbd25bca24c61a7ec1ddab1ece523f"],["/enchant/glkote/demomedia/pict-11.jpeg","3b093ad1e113be15ada10fd58cddf897"],["/enchant/glkote/demomedia/pict-2.png","97c56ce34d92f5ad21d1f9531886c384"],["/enchant/glkote/demomedia/pict-5.png","38fea85f3de5b0297e26018527d7be73"],["/enchant/glkote/dialog.css","46ef5f526110c0198f9df0cafae6db49"],["/enchant/glkote/dialog.js","ae9484aa48889646877d2626dd301ec6"],["/enchant/glkote/docs.html","2a696926f0ac0e3e785981a75ad54796"],["/enchant/glkote/electrofs.js","989eb85b46d24aa691a37ed9d9800760"],["/enchant/glkote/gi_debug.css","2372b0224e47fe96f9f958f3a3a4a106"],["/enchant/glkote/gi_debug.js","7cda3a34a1ee3f9cf38163ed8d536e85"],["/enchant/glkote/glkapi.js","7d4997c941b9e0a27a507572d7d4ec28"],["/enchant/glkote/glkote-demo2.css","dae652bd06d4682abf515e1532fa7281"],["/enchant/glkote/glkote.css","3ee30cc817d0555ad89b0da24115465b"],["/enchant/glkote/glkote.js","95a8785f088bcb71c3e357d9cc650f2d"],["/enchant/glkote/jquery-1.12.4.js","fb2d334dabf4902825df4fe6c2298b4b"],["/enchant/glkote/jquery-1.12.4.min.js","4f252523d4af0b478c810c2547a63e19"],["/enchant/glkote/sample-demo.html","8953e64f12f801f29ea37a9b599c3a4b"],["/enchant/glkote/sample-demo.js","3e80e0a109d1ba122253b9b9af62debe"],["/enchant/glkote/sample-demo2.html","47cb4e8e497ac0f4c919ede6f03594da"],["/enchant/glkote/sample-demobase.html","e497afb56f644f9deca8164257bd1154"],["/enchant/glkote/sample-demodebug.html","8276c4586be6fa567c41ade104f04b6a"],["/enchant/glkote/sample-help.html","6143871e048fdb70698f0fd13ec99396"],["/enchant/glkote/sample-minimal.html","2691a042b89f9277e4469c647065b06b"],["/enchant/glkote/sample-remote.html","0d548415049d9431e90b7a274aac932e"],["/enchant/glkote/waiting.gif","a802bc93a17caf650b43f3b2ed6e1542"],["/enchant/index.html","330e0dd8ce18f81a18565a24e5c0e773"],["/enchant/manifest.json","264df7ffe1ed7b8320d525bb646b0b0f"],["/enchant/style.7eb00.css","9f89856d440501aae55e8a987c4ce3b9"],["/enchant/vs/base/worker/workerMain.js","93cdf8019f17ddfdbcbc7d00fcb1a786"],["/enchant/vs/basic-languages/src/bat.js","e51f2cd80e0cd7ec1dcff4a90e684094"],["/enchant/vs/basic-languages/src/coffee.js","ed3bca6cd2700565f57c1a1dde618568"],["/enchant/vs/basic-languages/src/cpp.js","54bfcf0015c44907f5c2fb2196e1dd58"],["/enchant/vs/basic-languages/src/csharp.js","a7e1364b05b1876835b79dbc352ef325"],["/enchant/vs/basic-languages/src/css.js","a7b9d6e850a4349f9d14916194be041a"],["/enchant/vs/basic-languages/src/dockerfile.js","36fc3b44c33edc66bb38ceae042e56d2"],["/enchant/vs/basic-languages/src/fsharp.js","140e636ea1605cb9dc149aef82f433b1"],["/enchant/vs/basic-languages/src/go.js","2f7827643fb34c6b31db0de15bfb5faf"],["/enchant/vs/basic-languages/src/handlebars.js","a5bb8ec7e9ebe498f22e6574d52afd5d"],["/enchant/vs/basic-languages/src/html.js","b4ac31ee3c7fee961840dce71d2b4b0c"],["/enchant/vs/basic-languages/src/ini.js","7efdf6ef2739f4b764c819d10fe33346"],["/enchant/vs/basic-languages/src/java.js","865e1b3795015e91639c4b7c8eb4161a"],["/enchant/vs/basic-languages/src/less.js","606c56b2caef781ee79be92fa0ec73d0"],["/enchant/vs/basic-languages/src/lua.js","25ebf7b2bdaf938882802ce193f22f1b"],["/enchant/vs/basic-languages/src/markdown.js","e4ef9a583b4a9b184ba0cb46bbf29d8c"],["/enchant/vs/basic-languages/src/msdax.js","e486a9bf9d45fe031359a381d168d1c2"],["/enchant/vs/basic-languages/src/objective-c.js","aa7540b900b058ff3769e4c708c71d88"],["/enchant/vs/basic-languages/src/php.js","44242b01b7b7d982ec278f9af3469c10"],["/enchant/vs/basic-languages/src/postiats.js","b0ce479e2f34bc3a934881d42878dc9d"],["/enchant/vs/basic-languages/src/powershell.js","7784001d1ea6ebf755ce7a778aa1ece2"],["/enchant/vs/basic-languages/src/pug.js","653127a3f1af6b633b66910b3d020b7a"],["/enchant/vs/basic-languages/src/python.js","66f336259b4ac3e1afcf20350f6cbc85"],["/enchant/vs/basic-languages/src/r.js","68f2cd091513a7e8efbf6c836cfa3a01"],["/enchant/vs/basic-languages/src/razor.js","3d8fd5eca2c05e49e670f60b3696b37f"],["/enchant/vs/basic-languages/src/ruby.js","fdf1dfb0e84028e4494149e8709a10db"],["/enchant/vs/basic-languages/src/sb.js","4a922f1aae92304528d92ecf20705c7e"],["/enchant/vs/basic-languages/src/scss.js","1489d414500bf1e3187fc31981849404"],["/enchant/vs/basic-languages/src/solidity.js","ae00d1fca04371d175c4b6bce9d7d2f1"],["/enchant/vs/basic-languages/src/sql.js","85a85b94c90bcb4740cd9e731b4903a5"],["/enchant/vs/basic-languages/src/swift.js","e316b6013d070ad64076b6ef793cd276"],["/enchant/vs/basic-languages/src/vb.js","7814472a1bdcdf3a8a3ae49d091f7fb2"],["/enchant/vs/basic-languages/src/xml.js","29542b689cfc3091cc86027a3e2adb09"],["/enchant/vs/basic-languages/src/yaml.js","b4f1fd85a61b500c905e4a1a656e764b"],["/enchant/vs/editor/contrib/suggest/browser/media/String_16x.svg","48e754cb54c78a85dcc9aaea9a27847e"],["/enchant/vs/editor/contrib/suggest/browser/media/String_inverse_16x.svg","6e5c0ce7ec09969f07ea6ee078ef8ad6"],["/enchant/vs/editor/editor.main.css","ad44f47d754a4d6cc7389b05fc37a508"],["/enchant/vs/editor/editor.main.js","3a82940062c2a1874398c094a6e60dde"],["/enchant/vs/editor/editor.main.nls.de.js","4019650a865961530de6e171a5a44c85"],["/enchant/vs/editor/editor.main.nls.es.js","bca78689da6bf40a1d67326898fb88a3"],["/enchant/vs/editor/editor.main.nls.fr.js","4cf5f1adcf63ca2472cb66e40e2c8baf"],["/enchant/vs/editor/editor.main.nls.hu.js","9308e02b6c62b43386e75306d78a4a36"],["/enchant/vs/editor/editor.main.nls.it.js","4acb3ff02176e79df6ab573eea3e8185"],["/enchant/vs/editor/editor.main.nls.ja.js","17922fedcf1e6ed0134b3ee94b0a0962"],["/enchant/vs/editor/editor.main.nls.js","f490fab3eb9c793b20f99db9b6e48d95"],["/enchant/vs/editor/editor.main.nls.ko.js","6be4c0e0eb005bce674dbbdb8e7a7e38"],["/enchant/vs/editor/editor.main.nls.pt-br.js","5bd4e381e481dd824f04985295b40eb2"],["/enchant/vs/editor/editor.main.nls.ru.js","c3f5724ee2fbff5e8f3b5f2ccac4a7e8"],["/enchant/vs/editor/editor.main.nls.tr.js","ce8907e3f4fd52bc74620c26e264c78c"],["/enchant/vs/editor/editor.main.nls.zh-cn.js","9d9f318a1e6852ff0c2c4bd8a09cc6e9"],["/enchant/vs/editor/editor.main.nls.zh-tw.js","12127046be5ba373438d9141f25205f3"],["/enchant/vs/editor/standalone/browser/quickOpen/symbol-sprite.svg","649fb0a55b0e0fc9d79e6b7872a14c10"],["/enchant/vs/language/css/cssMode.js","40f15898b7a09b6fb6b260d7c1dd3f56"],["/enchant/vs/language/css/cssWorker.js","5b7f6412ba66802576e4ac4eb504bdbb"],["/enchant/vs/language/html/htmlMode.js","001e24dec3cf105d1e099316c83a5632"],["/enchant/vs/language/html/htmlWorker.js","f065b0b4b1a6c1919bc3370d249df808"],["/enchant/vs/language/json/jsonMode.js","4a3dab54b23af097e9e414100867200e"],["/enchant/vs/language/json/jsonWorker.js","4dcceaade2ef2a37ea5b3f6883f5fe95"],["/enchant/vs/language/typescript/lib/typescriptServices.js","517e6ef05aa497f98e19d6c03a9879dc"],["/enchant/vs/language/typescript/src/mode.js","d96c89a5dacbac90292dcb9502217398"],["/enchant/vs/language/typescript/src/worker.js","d929d97d845eebf18fb20f4f55a9ca49"],["/enchant/vs/loader.js","c8164365b9ce6609cb37358a167fb342"]],cacheName="sw-precache-v3-sw-precache-webpack-plugin-"+(self.registration?self.registration.scope:""),ignoreUrlParametersMatching=[/^utm_/],addDirectoryIndex=function(e,a){var c=new URL(e);return"/"===c.pathname.slice(-1)&&(c.pathname+=a),c.toString()},cleanResponse=function(e){if(!e.redirected)return Promise.resolve(e);return("body"in e?Promise.resolve(e.body):e.blob()).then(function(a){return new Response(a,{headers:e.headers,status:e.status,statusText:e.statusText})})},createCacheKey=function(e,a,c,n){var s=new URL(e);return n&&s.pathname.match(n)||(s.search+=(s.search?"&":"")+encodeURIComponent(a)+"="+encodeURIComponent(c)),s.toString()},isPathWhitelisted=function(e,a){if(0===e.length)return!0;var c=new URL(a).pathname;return e.some(function(e){return c.match(e)})},stripIgnoredUrlParameters=function(e,a){var c=new URL(e);return c.hash="",c.search=c.search.slice(1).split("&").map(function(e){return e.split("=")}).filter(function(e){return a.every(function(a){return!a.test(e[0])})}).map(function(e){return e.join("=")}).join("&"),c.toString()},hashParamName="_sw-precache",urlsToCacheKeys=new Map(precacheConfig.map(function(e){var a=e[0],c=e[1],n=new URL(a,self.location),s=createCacheKey(n,hashParamName,c,!1);return[n.toString(),s]}));function setOfCachedUrls(e){return e.keys().then(function(e){return e.map(function(e){return e.url})}).then(function(e){return new Set(e)})}self.addEventListener("install",function(e){e.waitUntil(caches.open(cacheName).then(function(e){return setOfCachedUrls(e).then(function(a){return Promise.all(Array.from(urlsToCacheKeys.values()).map(function(c){if(!a.has(c)){var n=new Request(c,{credentials:"same-origin"});return fetch(n).then(function(a){if(!a.ok)throw new Error("Request for "+c+" returned a response with status "+a.status);return cleanResponse(a).then(function(a){return e.put(c,a)})})}}))})}).then(function(){return self.skipWaiting()}))}),self.addEventListener("activate",function(e){var a=new Set(urlsToCacheKeys.values());e.waitUntil(caches.open(cacheName).then(function(e){return e.keys().then(function(c){return Promise.all(c.map(function(c){if(!a.has(c.url))return e.delete(c)}))})}).then(function(){return self.clients.claim()}))}),self.addEventListener("fetch",function(e){if("GET"===e.request.method){var a,c=stripIgnoredUrlParameters(e.request.url,ignoreUrlParametersMatching),n="index.html";(a=urlsToCacheKeys.has(c))||(c=addDirectoryIndex(c,n),a=urlsToCacheKeys.has(c));var s="index.html";!a&&"navigate"===e.request.mode&&isPathWhitelisted(["^(?!\\/__).*"],e.request.url)&&(c=new URL(s,self.location).toString(),a=urlsToCacheKeys.has(c)),a&&e.respondWith(caches.open(cacheName).then(function(e){return e.match(urlsToCacheKeys.get(c)).then(function(e){if(e)return e;throw Error("The cached response that was expected is missing.")})}).catch(function(a){return console.warn('Couldn\'t serve response for "%s" from cache: %O',e.request.url,a),fetch(e.request)}))}});