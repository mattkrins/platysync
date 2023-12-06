import{r as l}from"./react-f1c107a9.js";import{s as f}from"./react-style-singleton-2b32e474.js";var e="right-scroll-bar-position",d="width-before-scroll-bar",p="with-scroll-bars-hidden",s="--removed-body-scroll-bar-size",h={left:0,top:0,right:0,gap:0},g=function(n){return parseInt(n||"",10)||0},m=function(n){var a=window.getComputedStyle(document.body),r=a[n==="padding"?"paddingLeft":"marginLeft"],t=a[n==="padding"?"paddingTop":"marginTop"],o=a[n==="padding"?"paddingRight":"marginRight"];return[g(r),g(t),g(o)]},u=function(n){if(n===void 0&&(n="margin"),typeof window>"u")return h;var a=m(n),r=document.documentElement.clientWidth,t=window.innerWidth;return{left:a[0],top:a[1],right:a[2],gap:Math.max(0,t-r+a[2]-a[0])}},b=f(),w=function(n,a,r,t){var o=n.left,c=n.top,v=n.right,i=n.gap;return r===void 0&&(r="margin"),`
  .`.concat(p,` {
   overflow: hidden `).concat(t,`;
   padding-right: `).concat(i,"px ").concat(t,`;
  }
  body {
    overflow: hidden `).concat(t,`;
    overscroll-behavior: contain;
    `).concat([a&&"position: relative ".concat(t,";"),r==="margin"&&`
    padding-left: `.concat(o,`px;
    padding-top: `).concat(c,`px;
    padding-right: `).concat(v,`px;
    margin-left:0;
    margin-top:0;
    margin-right: `).concat(i,"px ").concat(t,`;
    `),r==="padding"&&"padding-right: ".concat(i,"px ").concat(t,";")].filter(Boolean).join(""),`
  }
  
  .`).concat(e,` {
    right: `).concat(i,"px ").concat(t,`;
  }
  
  .`).concat(d,` {
    margin-right: `).concat(i,"px ").concat(t,`;
  }
  
  .`).concat(e," .").concat(e,` {
    right: 0 `).concat(t,`;
  }
  
  .`).concat(d," .").concat(d,` {
    margin-right: 0 `).concat(t,`;
  }
  
  body {
    `).concat(s,": ").concat(i,`px;
  }
`)},R=function(n){var a=n.noRelative,r=n.noImportant,t=n.gapMode,o=t===void 0?"margin":t,c=l.useMemo(function(){return u(o)},[o]);return l.createElement(b,{styles:w(c,!a,o,r?"":"!important")})};export{R,d as f,e as z};
