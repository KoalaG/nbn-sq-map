if(!self.define){let e,n={};const r=(r,s)=>(r=new URL(r+".js",s).href,n[r]||new Promise((n=>{if("document"in self){const e=document.createElement("script");e.src=r,e.onload=n,document.head.appendChild(e)}else e=r,importScripts(r),n()})).then((()=>{let e=n[r];if(!e)throw new Error(`Module ${r} didn’t register its module`);return e})));self.define=(s,l)=>{const i=e||("document"in self?document.currentScript.src:"")||location.href;if(n[i])return;let c={};const d=e=>r(e,i),t={module:{uri:i},exports:c,require:d};n[i]=Promise.all(s.map((e=>t[e]||d(e)))).then((e=>(l(...e),c)))}}define(["./workbox-a3780f17"],(function(e){"use strict";e.setCacheNameDetails({prefix:"NTMv1"}),self.skipWaiting(),e.clientsClaim(),e.precacheAndRoute([{url:"./index.html",revision:"dd8dbae3421800891b92753c952dadc1"},{url:"2b3e1faf89f94a483539.png",revision:null},{url:"416d91365b44e4b4f477.png",revision:null},{url:"578.bf722ab2b55be04d2217.js",revision:null},{url:"578.bf722ab2b55be04d2217.js.LICENSE.txt",revision:"15065872cc81afdd00dbbf9b2946a5e8"},{url:"8f2c4d11474275fbc161.png",revision:null},{url:"app.d1060ddd63dc5e53819c.js",revision:null},{url:"app.d1060ddd63dc5e53819c.js.LICENSE.txt",revision:"2a4173e519c9e0bedcc65515f93f5894"},{url:"e01c0d3d072cedcaf4d0.png",revision:null},{url:"e9948aecf44289fffa34.png",revision:null}],{}),e.cleanupOutdatedCaches(),e.registerRoute((({request:e,url:n})=>n.pathname.includes("/nbn-bulk/map")&&!e.headers.has("sw-network-first")),new e.CacheFirst({cacheName:"NTMv1-nbn_places",plugins:[new e.ExpirationPlugin({maxAgeSeconds:86400})]}),"GET"),e.registerRoute((({request:e,url:n})=>n.pathname.includes("/nbn-bulk/map")&&e.headers.has("sw-network-first")),new e.NetworkFirst({cacheName:"NTMv1-nbn_places",plugins:[new e.ExpirationPlugin({maxAgeSeconds:86400})]}),"GET"),e.registerRoute((({url:e})=>e.pathname.includes("/rastertiles/")),new e.CacheFirst({cacheName:"NTMv1-rastertiles",plugins:[new e.ExpirationPlugin({maxAgeSeconds:2592e3})]}),"GET"),e.registerRoute(/.*/,new e.NetworkFirst({cacheName:"NTMv1-other",plugins:[]}),"GET")}));
//# sourceMappingURL=service-worker.js.map
