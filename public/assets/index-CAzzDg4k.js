(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const i of document.querySelectorAll('link[rel="modulepreload"]'))s(i);new MutationObserver(i=>{for(const r of i)if(r.type==="childList")for(const l of r.addedNodes)l.tagName==="LINK"&&l.rel==="modulepreload"&&s(l)}).observe(document,{childList:!0,subtree:!0});function t(i){const r={};return i.integrity&&(r.integrity=i.integrity),i.referrerPolicy&&(r.referrerPolicy=i.referrerPolicy),i.crossOrigin==="use-credentials"?r.credentials="include":i.crossOrigin==="anonymous"?r.credentials="omit":r.credentials="same-origin",r}function s(i){if(i.ep)return;i.ep=!0;const r=t(i);fetch(i.href,r)}})();const Ni="modulepreload",Li=function(n){return"/teacher-student/"+n},Ss={},Ai=function(e,t,s){let i=Promise.resolve();if(t&&t.length>0){let h=function(u){return Promise.all(u.map(p=>Promise.resolve(p).then(b=>({status:"fulfilled",value:b}),b=>({status:"rejected",reason:b}))))};document.getElementsByTagName("link");const l=document.querySelector("meta[property=csp-nonce]"),c=l?.nonce||l?.getAttribute("nonce");i=h(t.map(u=>{if(u=Li(u),u in Ss)return;Ss[u]=!0;const p=u.endsWith(".css"),b=p?'[rel="stylesheet"]':"";if(document.querySelector(`link[href="${u}"]${b}`))return;const _=document.createElement("link");if(_.rel=p?"stylesheet":Ni,p||(_.as="script"),_.crossOrigin="",_.href=u,c&&_.setAttribute("nonce",c),document.head.appendChild(_),p)return new Promise((k,I)=>{_.addEventListener("load",k),_.addEventListener("error",()=>I(new Error(`Unable to preload CSS for ${u}`)))})}))}function r(l){const c=new Event("vite:preloadError",{cancelable:!0});if(c.payload=l,window.dispatchEvent(c),!c.defaultPrevented)throw l}return i.then(l=>{for(const c of l||[])c.status==="rejected"&&r(c.reason);return e().catch(r)})},yn="/teacher-student/".replace(/\/+$/,""),Ft=yn+"/api",pt={"field-bg":"var(--surface)","field-bg-focus":"var(--surface)","field-border":"var(--border-strong)","field-border-width":"1px","field-rule":"var(--field-border, var(--border-strong))","field-rule-width":"0px","field-radius":"var(--radius-sm)","field-padding-y":"8px","field-padding-x":"10px","field-font-size":"14px","field-line-height":"21px","field-focus-border":"var(--accent)","field-focus-ring":"var(--accent-soft)","field-focus-ring-width":"3px","field-invalid-border":"var(--danger)","field-invalid-rule":"var(--danger)","field-invalid-ring":"var(--danger-soft)","btn-radius":"var(--radius-sm)","btn-border-width":"1px","btn-padding-y":"8px","btn-padding-x":"16px","btn-font-size":"14px","btn-line-height":"20px","btn-font-weight":"500","btn-focus-ring":"var(--accent-soft)","btn-focus-ring-width":"3px","btn-primary-bg":"var(--accent)","btn-primary-fg":"var(--on-accent)","btn-primary-border":"var(--accent)","btn-primary-shadow":"none","btn-primary-bg-hover":"var(--accent-strong)","btn-primary-fg-hover":"var(--on-accent)","btn-primary-border-hover":"var(--accent-strong)","btn-secondary-bg":"var(--surface-2)","btn-secondary-fg":"var(--text)","btn-secondary-border":"var(--border)","btn-secondary-shadow":"none","btn-secondary-bg-hover":"var(--accent-soft)","btn-secondary-fg-hover":"var(--text)","btn-secondary-border-hover":"var(--border-strong)","btn-ghost-bg":"transparent","btn-ghost-fg":"var(--text-muted)","btn-ghost-border":"transparent","btn-ghost-shadow":"none","btn-ghost-bg-hover":"var(--surface-2)","btn-ghost-fg-hover":"var(--text)","btn-ghost-border-hover":"transparent","btn-danger-bg":"var(--danger)","btn-danger-fg":"var(--on-danger)","btn-danger-border":"var(--danger)","btn-danger-shadow":"none","btn-danger-bg-hover":"var(--danger-strong, var(--danger))","btn-danger-fg-hover":"var(--on-danger)","btn-danger-border-hover":"var(--danger-strong, var(--danger))","btn-disabled-bg":"var(--surface-2)","btn-disabled-fg":"var(--text-muted)","btn-disabled-border":"var(--border)","btn-disabled-opacity":"0.7"},xn=["field-border-width","field-rule-width","field-focus-ring-width","btn-border-width","btn-focus-ring-width"],Pi={thin:"1px",medium:"3px",thick:"5px"};function wn(n){const e=n.trim();return/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(e)&&parseFloat(e)===0?"0px":Pi[e.toLowerCase()]??e}function Di(){return xn.map(n=>{const e=wn(pt[n]);return`@property --${n}{syntax:"<length>";inherits:true;initial-value:${e}}`}).join("")}const kn={"font-display":"Georgia,'Times New Roman',serif","font-ui":"system-ui,-apple-system,'Segoe UI',sans-serif","space-1":"4px","space-2":"8px","space-3":"12px","space-4":"16px","space-5":"24px","space-6":"32px","space-7":"48px","space-8":"64px","radius-sm":"4px","radius-md":"8px","radius-pill":"999px","dur-fast":"120ms","dur-base":"200ms","dur-slow":"320ms","ease-standard":"cubic-bezier(.2,.7,.3,1)"},$n={primary:"var(--accent)","primary-text":"var(--on-accent)","btn-bg":"var(--surface-2)","btn-hover":"var(--accent-soft)","input-bg":"var(--surface)","topbar-bg":"var(--surface)","topbar-logo":"var(--text-muted)","active-bg":"var(--accent-soft)","active-text":"var(--accent-strong)","hover-bg":"var(--surface-2)",error:"var(--danger)",radius:"var(--radius-md)",shadow:"var(--shadow-1)","shadow-elevated":"var(--shadow-2)","done-opacity":"0.4"},Hi={...$n,"done-opacity":"0.35"},Gc={...kn,...$n,...pt,bg:"#f8f9fa",surface:"#ffffff","surface-2":"#f1f3f5",text:"#212529","text-muted":"#5c636a",border:"#dee2e6","border-strong":"#868e96",accent:"#3b5bdb","accent-strong":"#2f44ad","accent-soft":"#edf2ff","on-accent":"#ffffff",success:"#217a36","success-soft":"#ebfbee",warning:"#a85400","warning-soft":"#fff4e6",danger:"#c92a2a","danger-strong":"#a51111","danger-soft":"#fff5f5","on-danger":"#ffffff",info:"#1864ab","info-soft":"#e7f5ff","shadow-1":"0 1px 2px rgba(33,37,41,.06)","shadow-2":"0 4px 12px rgba(33,37,41,.10)","shadow-3":"0 16px 40px rgba(33,37,41,.22)"},Kc={...kn,...Hi,...pt,bg:"#141517",surface:"#1a1b1e","surface-2":"#25262b",text:"#e9ecef","text-muted":"#a6a7ab",border:"#373a40","border-strong":"#868e96",accent:"#91a7ff","accent-strong":"#bac8ff","accent-soft":"#232840","on-accent":"#141517",success:"#69db7c","success-soft":"#17301e",warning:"#ffa94d","warning-soft":"#33260f",danger:"#ff8787","danger-strong":"#ffa8a8","danger-soft":"#331f1f","on-danger":"#141517",info:"#74c0fc","info-soft":"#17242f","shadow-1":"0 1px 2px rgba(0,0,0,.4)","shadow-2":"0 4px 14px rgba(0,0,0,.5)","shadow-3":"0 16px 44px rgba(0,0,0,.6)"};class Oi{constructor(){this.tracking=null,this.batching=!1,this.pending=new Set}subscribe(e){this.tracking&&(e.add(this.tracking),this.tracking.deps.add(e))}notify(e){for(const t of[...e])t.disposed||(this.batching?this.pending.add(t):t.run())}runTracked(e,t){if(e.disposed)return;Cn(e);const s=this.tracking;this.tracking=e;try{t()}finally{this.tracking=s}}untrack(e){const t=this.tracking;this.tracking=null;try{return e()}finally{this.tracking=t}}batch(e){this.batching=!0;try{e()}finally{this.batching=!1;const t=[...this.pending];this.pending.clear();for(const s of t)s.disposed||s.run()}}}const ge=new Oi;function Cn(n){for(const e of n.deps)e.delete(n);n.deps.clear()}class m{constructor(e){this.subs=new Set,this.val=e}get(){return ge.subscribe(this.subs),this.val}peek(){return this.val}set(e){Object.is(this.val,e)||(this.val=e,ge.notify(this.subs))}update(e){this.set(e(this.val))}}class y{constructor(e){this.subs=new Set,this.val=void 0;const t=this,s={run(){ge.runTracked(s,()=>{const i=e();Object.is(t.val,i)||(t.val=i,ge.notify(t.subs))})},deps:new Set};s.run()}get(){return ge.subscribe(this.subs),this.val}peek(){return this.val}}function w(n){const e={run(){ge.runTracked(e,n)},deps:new Set};return e.run(),()=>{e.disposed=!0,Cn(e)}}function Ce(n){ge.batch(n)}function j(n){return ge.untrack(n)}class zi{constructor(){this.instances=new Map}get(e){let t=this.instances.get(e);return t||(t=new e,this.instances.set(e,t)),t}set(e,t){this.instances.set(e,t)}reset(){this.instances.clear()}}const we=new zi,Pe=yn;function Rt(n){return Pe?n===Pe?"/":n.startsWith(Pe+"/")?n.slice(Pe.length):n:n}function ji(n){return Pe+n}class H{constructor(){this.route=new m(Rt(location.pathname??"/")),this.search=new m(location.search??""),window.addEventListener("popstate",()=>Ce(()=>{this.route.set(Rt(location.pathname)),this.search.set(location.search)}))}navigate(e,t){const s=typeof t=="boolean"?{replace:t}:t??{},i=e.indexOf("#"),r=i>=0?e.slice(i):"",l=i>=0?e.slice(0,i):e,c=l.indexOf("?"),h=c>=0?l.slice(0,c):l,u=c>=0?l.slice(c+1):"",p=s.query!==void 0?Vi(s.query):u?"?"+u:"",b=ji(h)+p+r;(s.replace?history.replaceState:history.pushState).call(history,null,"",b),Ce(()=>{this.route.set(h),this.search.set(p)})}back(){history.back()}link(e,t="active"){const s=e.split("#")[0].split("?")[0];return{onclick:i=>{i.preventDefault(),this.navigate(e)},className:()=>{const i=this.route.get();return i===s||i.startsWith(s+"/")?t:""}}}params(e){const t=e.split("/");return new y(()=>{const s=this.route.get().split("/"),i={};for(const[r,l]of t.entries())l.startsWith(":")&&(i[l.slice(1)]=s[r]??"");return i})}query(e){return new y(()=>new URLSearchParams(this.search.get()).get(e)??void 0)}queries(){return new y(()=>{const e={};for(const[t,s]of new URLSearchParams(this.search.get()))e[t]=s;return e})}}function Vi(n){const e=new URLSearchParams;for(const[s,i]of Object.entries(n))i==null||i===""||e.set(s,String(i));const t=e.toString();return t?"?"+t:""}function Fi(n){return e=>n[e]}const Ri="@media (prefers-reduced-motion: reduce){*,*::before,*::after{animation-duration:.01ms !important;animation-iteration-count:1 !important;transition-duration:.01ms !important}}",Es="data-basics-global";function Mi(){if(document.head.querySelector(`style[${Es}]`))return;const n=document.createElement("style");n.setAttribute(Es,""),n.textContent=Di()+Ri,document.head.appendChild(n)}function Bi(n,e){Mi();const t=new Set(xn),s=(r,l,c)=>{const h=Object.entries(r).map(([u,p])=>`--${u}:${t.has(u)?wn(p):p}`).join(";");return`${l}{color-scheme:${c};${h}}`},i=document.createElement("style");return i.textContent=s(n,'[data-theme="light"]',"light")+s(e,'[data-theme="dark"]',"dark"),document.head.appendChild(i),r=>`var(--${r})`}const Is="basics-js-theme";class Sn{constructor(){this.dark=new m(!1);const e=localStorage.getItem(Is),t=matchMedia("(prefers-color-scheme: dark)").matches;this.dark.set(e?e==="dark":t),w(()=>{const s=this.dark.get();document.documentElement.setAttribute("data-theme",s?"dark":"light"),localStorage.setItem(Is,s?"dark":"light")})}toggle(){this.dark.update(e=>!e)}}function T(n){const e=document.createElement("template");return e.innerHTML=n,e}function qi(n,e){let t;for(const s of Object.keys(e))n.startsWith(s+"/")&&(!t||s.length>t.length)&&(t=s);return t?e[t]:void 0}const Ts=new Set;class E{constructor(e={}){this.props=e,this.disposers=[],this.children=[];const t=this.constructor;if(t.styles&&!Ts.has(t)){Ts.add(t);const s=document.createElement("style");s.textContent=t.styles,document.head.appendChild(s)}}onMount(){}onDestroy(){}inject(e){return we.get(e)}track(e){this.disposers.push(e)}ref(e,t){return e.querySelector(`[bind="${t}"]`)}spawn(e,t,...s){const i=j(()=>{const r=new e(s[0]);return r.mount(t),r});return this.children.push(i),i}mount(e){e.appendChild(this.render()),this.onMount()}destroy(){j(()=>{this.onDestroy();for(const e of this.children)e.destroy();this.children.length=0;for(const e of this.disposers)e();this.disposers.length=0})}wire(e,t,s){const i=s??(l=>this.track(l)),r=e.content.cloneNode(!0);for(const l of r.querySelectorAll("[bind]")){const c=t[l.getAttribute("bind")];if(c)if(typeof c=="function")i(w(()=>{const h=c();l instanceof HTMLInputElement||l instanceof HTMLTextAreaElement?l.value=String(h):l.textContent=String(h)}));else for(const[h,u]of Object.entries(c)){const p=h.includes("-");h.startsWith("on")&&typeof u=="function"?l.addEventListener(h.slice(2),u):typeof u=="function"?i(w(()=>{const b=u();p?l.setAttribute(h,String(b)):l[h]=b})):p?l.setAttribute(h,String(u)):l[h]=u}}return r}wireEl(e,t,s){return this.wire(e,t,s).firstElementChild}slot(e,t){const s=this.props[e];if(s==null)return!1;const i=this.ref(t,e);return i?(typeof s=="string"?i.textContent=s:typeof s=="function"&&s.prototype instanceof E?this.spawn(s,i):typeof s=="function"&&s(i,{spawn:(r,l,...c)=>this.spawn(r,l,...c),track:r=>this.track(r)}),!0):!1}$each(e,t,s,i=(r,l)=>l){const r=typeof t=="function"?t:()=>t.get(),l=new Map,c=new Map;this.track(()=>{for(const h of c.values())h.forEach(u=>u());c.clear()}),this.track(w(()=>{const h=r(),u=new Map;for(const[b,_]of h.entries()){const k=i(_,b);if(l.has(k))u.set(k,l.get(k));else{const I=[];u.set(k,j(()=>s(_,b,N=>I.push(N)))),c.set(k,I)}}for(const[b,_]of l)u.has(b)||(_.remove(),j(()=>c.get(b)?.forEach(k=>k())),c.delete(b));let p=e.firstChild;for(const b of u.values())b===p?p=p.nextSibling:e.insertBefore(b,p);l.clear();for(const[b,_]of u)l.set(b,_)}))}$condition(e,t,s,i){let r=null;this.track(w(()=>{r&&(r.remove(),r=null);const l=t.get();r=j(()=>l?s():i?.()??null),r&&e.appendChild(r)}))}$swap(e,t,s,i){let r=null;this.track(w(()=>{if(r){const h=r;r=null,j(()=>h.destroy())}e.textContent="";const l=t.get(),c=s[l]??qi(l,s)??i;c&&(r=j(()=>{const h=new c;return h.mount(e),h}))})),this.track(()=>r?.destroy())}}const rt=new Set;function Gi(n){return rt.add(n),()=>rt.delete(n)}function Ki(){for(const n of Array.from(rt)){rt.delete(n);try{n()}catch(e){console.error("[startApp] a dispose callback threw",e)}}}async function Wi(n,e,t){const s=document.querySelector(e);s.textContent="";const i=we.get(H);let r=null,l=!1,c=null,h=!!t?.hot?.data.hmr;const u=async p=>{r&&(r.destroy(),r=null,s.textContent=""),p?(c||(c=(await Ai(()=>import("./obs-shell.component-CVtu7E18.js"),[])).ObsShellComponent),r=j(()=>new c)):(!h&&t?.onInit&&(await t.onInit(),h=!0),r=j(()=>new n)),j(()=>r.mount(s)),l=p};await u(Rt(location.pathname).startsWith("/_obs")),w(()=>{const p=i.route.get().startsWith("/_obs");p!==l&&u(p)}),t?.hot&&(t.hot.data.hmr=!0,t.hot.dispose(()=>{try{r?.destroy()}catch(p){console.error("[startApp] the root component threw while disposing",p)}if(r=null,Ki(),t.onDispose)try{t.onDispose()}catch(p){console.error("[startApp] onDispose threw",p)}}),t.hot.accept())}class ye extends Error{constructor(e,t,s,i){super(t),this.status=e,this.details=s,this.traceId=i,this.name="ApiError"}}const Ui=10,tt=[];let st=[],De=null;function En(n){tt.push(n),tt.length>Ui&&tt.shift()}function In(n,e,t){const s={code:n,message:e,url:typeof location<"u"?location.href:"",context:[...tt],timestamp:new Date().toISOString()};t!==void 0&&(s.traceId=t),st.push(s),Yi()}function Yi(){De||(De=setTimeout(Tn,5e3))}function Tn(){if(De&&(clearTimeout(De),De=null),st.length===0)return;const n=st;st=[];for(const e of n){const t=JSON.stringify(e);typeof navigator<"u"&&navigator.sendBeacon?navigator.sendBeacon(`${Ft}/_obs/errors`,new Blob([t],{type:"application/json"})):typeof fetch<"u"&&fetch(`${Ft}/_obs/errors`,{method:"POST",headers:{"Content-Type":"application/json"},body:t}).catch(()=>{})}}typeof document<"u"&&document.addEventListener("visibilitychange",()=>{document.visibilityState==="hidden"&&Tn()});const Zi=3e4,Xi=2,Ue=new Map,Nn=new WeakMap;function Qi(n){if(n instanceof ye)return n.traceId;if(n!=null&&typeof n=="object")return Nn.get(n)}async function x(n){if(n.method==="GET"){const e=Ue.get(n.url);if(e)return e;const t=Ns(n,Xi);return Ue.set(n.url,t),t.then(()=>Ue.delete(n.url),()=>Ue.delete(n.url)),t}return Ns(n,0)}async function Ns(n,e){const t=n.timeout??Zi;let s;for(let i=0;i<=e;i++){const r=crypto.randomUUID();try{return await ea(Ji(n,r),t)}catch(l){if(s=l,!(l instanceof ye)&&l!=null&&typeof l=="object"&&Nn.set(l,r),l instanceof ye||i===e)break;await new Promise(c=>setTimeout(c,1e3*2**i))}}throw s}async function Ji(n,e){const t={"X-Trace-Id":e},s={method:n.method,headers:t};n.body!==void 0&&(t["Content-Type"]="application/json",s.body=JSON.stringify(n.body));const i=await fetch(n.url,s),r=i.headers.get("x-trace-id")??e;if(En({type:"api",detail:`${n.method} ${n.url}`,timestamp:new Date().toISOString()}),!i.ok){const l=await i.json().catch(()=>({error:i.statusText}));throw new ye(i.status,l.error??i.statusText,l.details,r)}return i.json()}function ea(n,e){let t;const s=new Promise((i,r)=>{t=setTimeout(()=>r(new Error("Request timeout")),e)});return Promise.race([n,s]).finally(()=>clearTimeout(t))}const Mt=new Set;let kt=!1;function ta(n){return Mt.add(n),()=>{Mt.delete(n)}}function sa(){if(!kt){kt=!0;try{for(const n of[...Mt])try{n()}catch(e){try{In("session-listener",na(e))}catch{}}}finally{kt=!1}}}function na(n){try{if(n instanceof Error){const e=n.message;if(typeof e=="string")return e}return String(n)}catch{return"listener threw a value that could not be described"}}async function $(n,e,t,s={}){Ce(()=>{n.set(!0),e.set(null)});try{const i=await t();return n.set(!1),i}catch(i){const r=ia(i);Ce(()=>{n.set(!1),e.set(r)}),In(r.code,r.message,Qi(i)),r.code==="auth"&&s.sessionExpiry!==!1&&sa();return}}function ia(n){return n instanceof ye?n.status===401?{code:"auth",message:"Unauthorized"}:n.status===409?{code:"conflict",message:"Data has changed — please try again"}:n.status===400?{code:"validation",message:n.message}:n.status===429?{code:"rateLimit",message:"Too many requests"}:{code:"server",message:"Server error"}:n instanceof Error?n.message==="Request timeout"?{code:"timeout",message:"Request timeout"}:{code:"network",message:"Network error"}:{code:"unknown",message:"Unknown error"}}const Ls={sessionExpiry:!1};function aa(n){return{me:()=>x({method:"GET",url:`${n}/auth/me`}),login:e=>x({method:"POST",url:`${n}/auth/login`,body:e}),logout:()=>x({method:"POST",url:`${n}/auth/logout`,body:{}})}}class re{constructor(){this.api=aa(Ft),this.currentUser=new m(null),this.loading=new m(!1),this.error=new m(null),this.offSessionExpired=ta(()=>{this.currentUser.peek()!==null&&this.currentUser.set(null)}),this.offAppDispose=Gi(()=>this.destroy())}destroy(){this.offSessionExpired(),this.offSessionExpired=()=>{},this.offAppDispose(),this.offAppDispose=()=>{}}async load(){const e=await $(this.loading,this.error,()=>this.api.me());e&&this.currentUser.set(e),this.error.get()?.code==="auth"&&this.error.set(null)}async login(e,t){const s=await $(this.loading,this.error,()=>this.api.login({username:e,password:t}),Ls);return s?(this.currentUser.set(s),!0):!1}async logout(){await $(this.loading,this.error,()=>this.api.logout(),Ls);const e=this.error.get();(!e||e.code==="auth")&&this.currentUser.set(null)}}const As={"font-display":"Lora,Georgia,'Times New Roman',serif","font-ui":"'Open Sans','Segoe UI',system-ui,sans-serif","space-1":"4px","space-2":"8px","space-3":"12px","space-4":"16px","space-5":"24px","space-6":"32px","space-7":"48px","space-8":"64px","radius-sm":"4px","radius-md":"8px","radius-pill":"999px","dur-fast":"120ms","dur-base":"200ms","dur-slow":"320ms","ease-standard":"cubic-bezier(.2,.7,.3,1)"},Ps={"field-bg":"var(--bg)","field-border":"var(--border)","field-bg-focus":"var(--surface)","field-rule":"var(--border-strong)","field-rule-width":"2px","field-padding-y":"10px","field-padding-x":"12px","field-invalid-border":"var(--border)","btn-padding-y":"9px","btn-padding-x":"20px","btn-font-size":"13px","btn-font-weight":"600","btn-primary-shadow":"var(--shadow-1)","btn-secondary-bg":"transparent","btn-secondary-bg-hover":"transparent","btn-secondary-fg-hover":"var(--accent)","btn-secondary-border":"var(--border-strong)","btn-secondary-border-hover":"var(--accent)","btn-ghost-bg-hover":"var(--accent-soft)","btn-ghost-fg-hover":"var(--accent)","btn-danger-bg":"transparent","btn-danger-fg":"var(--danger)","btn-danger-border":"var(--danger)","btn-danger-bg-hover":"var(--danger)","btn-danger-fg-hover":"var(--on-danger)","btn-danger-border-hover":"var(--danger)"},a=Bi({...As,...Ps,bg:"#F6F4F1",surface:"#FFFFFF","surface-2":"#EFEBE4",text:"#1C1F21","text-muted":"#696159",border:"#DED7CF","border-strong":"#9A8E7B",accent:"#845C24","accent-strong":"#6B4A1D","accent-soft":"#F3EADD","on-accent":"#FFFFFF","brass-line":"#CFAA81",cream:"#FFE9C2",success:"#2E6047","success-soft":"#E4EFE8",warning:"#9A4A1E","warning-soft":"#F7E9DE",danger:"#A3292F","danger-soft":"#F8E6E6","on-danger":"#FFFFFF",info:"#3E5974","info-soft":"#E3EAF1","shadow-1":"0 1px 2px rgba(28,31,33,.06)","shadow-2":"0 4px 12px rgba(28,31,33,.10)","shadow-3":"0 16px 40px rgba(28,31,33,.22)"},{...As,...Ps,bg:"#131A20",surface:"#1C1F21","surface-2":"#262A2B",text:"#F1ECE3","text-muted":"#AFA698",border:"#3B372F","border-strong":"#7A7059",accent:"#CFAA81","accent-strong":"#E2C29C","accent-soft":"#2C271F","on-accent":"#1C1F21","brass-line":"#8A6B45",cream:"#FFE9C2",success:"#8CC5A4","success-soft":"#1E2B23",warning:"#E1955F","warning-soft":"#2E231A",danger:"#E39396","danger-soft":"#332122","on-danger":"#1C1F21",info:"#93B3CE","info-soft":"#1E2733","shadow-1":"0 1px 2px rgba(0,0,0,.4)","shadow-2":"0 4px 14px rgba(0,0,0,.5)","shadow-3":"0 16px 44px rgba(0,0,0,.6)"}),xe=new Map,oe=new m("en"),Ds=new Set;let ot="en";function Ln(n,e){xe.set(n,{...xe.get(n),...e})}function ra(n){ot=n,xe.has(oe.peek())||oe.set(n)}function He(){return oe.get()}function oa(n){oe.set(n)}function Oe(n){return xe.get(oe.get())?.[n]??xe.get(ot)?.[n]}function An(n){return Ds.has(n)||(Ds.add(n),console.warn(`[i18n] missing key "${n}" for locale "${oe.peek()}"`)),n}function Pn(n,e){return e?n.replace(/\{(\w+)\}/g,(t,s)=>s in e?String(e[s]):t):n}function o(n,e){const t=Oe(n);return t===void 0?An(n):Pn(t,e)}const Hs=new Map;function la(n){let e=Hs.get(n);return e||(e=new Intl.PluralRules(n),Hs.set(n,e)),e}function q(n,e,t){const s=oe.get(),i=e===0&&Oe(`${n}.zero`)!==void 0?"zero":la(s).select(e),r=Oe(`${n}.${i}`)??Oe(`${n}.other`);return r===void 0?An(`${n}.${i}`):Pn(r,{count:e,...t})}function Jt(n){return n&&n.charAt(0).toLocaleUpperCase(oe.get())+n.slice(1)}function lt(n){return n instanceof Date?n:new Date(n)}const Os=new Map;function da(n,e){const t=n+JSON.stringify(e);let s=Os.get(t);return s||(s=new Intl.DateTimeFormat(n,e),Os.set(t,s)),s}function G(n,e={year:"numeric",month:"long",day:"numeric"}){return da(oe.get(),e).format(lt(n))}function ca(n){const e=oe.get();return G(n,{month:"short"}).replace(/\.$/,"").toLocaleUpperCase(e)}function es(n){return ca(n).slice(0,3)}function mt(n){const e=lt(n),t=s=>String(s).padStart(2,"0");return`${e.getFullYear()}-${t(e.getMonth()+1)}-${t(e.getDate())}`}const zs=new Map;function js(n,e){const t=n+"|"+e;let s=zs.get(t);return s||(s=new Intl.RelativeTimeFormat(n,{numeric:"auto",style:e}),zs.set(t,s)),s}function Vs(n){return new Date(n.getFullYear(),n.getMonth(),n.getDate()).getTime()}const Bt=60,nt=60*Bt,ha=24*nt,ua={[-1]:"relative.yesterday",0:"relative.today",1:"relative.tomorrow"};function gt(n,e=new Date){const t=lt(n),s=lt(e),i=oe.get(),r=js(i,"short"),l=(t.getTime()-s.getTime())/1e3,c=Math.abs(l),h=Math.round((Vs(t)-Vs(s))/(ha*1e3));if(h===0||c<6*nt)return c<Bt?r.format(Math.round(l),"second"):c<nt?r.format(Math.round(l/Bt),"minute"):r.format(Math.round(l/nt),"hour");if(Math.abs(h)<7){const u=ua[h];return(u===void 0?void 0:Oe(u))??js(i,"long").format(h,"day")}return t.getFullYear()===s.getFullYear()?G(t,{day:"numeric",month:"long"}):G(t,{day:"numeric",month:"long",year:"numeric"})}const Fs="basics-js-locale";function pa(n){if(!n)return;if(xe.has(n))return n;const e=n.split("-")[0];return xe.has(e)?e:void 0}class ma{constructor(){this.code=new m(ot);const e=localStorage.getItem(Fs);this.code.set(pa(e)??void 0??ot),w(()=>{const s=this.code.get();oa(s),document.documentElement.setAttribute("lang",s)})}set(e){this.code.set(e),localStorage.setItem(Fs,e)}}const ga={"app.brand":"Lindgren Equestrian","nav.label":"Huvudmeny","nav.openMenu":"Öppna menyn","nav.home":"Hem","nav.inbox":"Inkorg","nav.inboxPending.one":"{count} inbjudan väntar","nav.inboxPending.other":"{count} inbjudningar väntar","nav.group.training":"Träning","nav.lessons":"Lektioner","nav.trainingSessions":"Träningspass","nav.group.planning":"Planering & stall","nav.plans":"Planer","nav.goals":"Mål","nav.stable":"Hästar","nav.group.teaching":"Undervisning","nav.students":"Mina elever","nav.library":"Bibliotek","nav.invitations":"Inbjudningar","nav.programs":"Program","topBar.theme.toLight":"Ljust läge","topBar.theme.toDark":"Mörkt läge","topBar.signOut":"Logga ut","relative.yesterday":"i går","relative.today":"i dag","relative.tomorrow":"i morgon","objectKind.goal":"Mål","objectKind.plan":"Plan","objectKind.lesson":"Lektion","objectKind.trainingSession":"Träningspass","objectKind.exercise":"Övning","share.private":"Privat","share.sharedWith":"Delad: {name}","share.sharedWithMore.one":"Delad: {name} +{count}","share.sharedWithMore.other":"Delad: {name} +{count}","share.sharedWithAll":"Delad med {names}","share.sharedUnknown":"Delad: okänd mottagare","role.teacher":"Lärare","role.student":"Elev","notes.heading.zero":"Anteckningar","notes.heading.one":"Anteckningar · {count}","notes.heading.other":"Anteckningar · {count}","notes.empty":"Inga anteckningar än.","notes.placeholder":"Skriv en anteckning…","notes.submit":"Lägg till","notes.visibility":"Synlighet","notes.shareUnavailable":"Ingen att dela med","notes.hintPrivate":"Bara du ser den här anteckningen.","notes.hintShared":"{names} ser anteckningen och kan svara.","notes.hintNoRecipients":"Du har ingen att dela med än — anteckningen blir privat.","notes.edit":"Redigera","notes.delete":"Ta bort","notes.save":"Spara","notes.cancel":"Avbryt","notes.deleteTitle":"Ta bort anteckningen?","notes.deleteConsequence":"Anteckningen försvinner för alla som kan se den och går inte att få tillbaka.","notes.error":"Anteckningen kunde inte hämtas eller sparas. Försök igen.","notes.error.conflict":"Anteckningen har ändrats någon annanstans. Hämta den senaste versionen och försök igen.","notes.error.notFound":"Anteckningen finns inte längre.","notes.error.validation":"Anteckningen gick inte igenom. Se över texten och försök igen.","detail.moreActions":"Fler handlingar","students.heading":"Mina elever","students.invite":"Bjud in elev","students.loading":"Hämtar elever…","students.error":"Eleverna kunde inte hämtas.","students.retry":"Försök igen","students.empty.heading":"Ingen elev än","students.empty.body":"Bjud in din första elev med e-post. När hen tackar ja samlas lektioner, planer och mål här.","students.invitedOnly.body":"Inbjudan är skickad. Eleven dyker upp här så snart hen har skapat ett konto med samma adress och tackat ja.","student.nextLesson":"Nästa lektion {when}","invite.field.email":"Elevens e-post","invite.field.email.hint":"Samma adress som eleven skapar sitt konto med.","invite.submit":"Skicka inbjudan","invite.cancel":"Avbryt","invite.error.emailRequired":"Fyll i elevens e-postadress.","invite.error.emailInvalid":"Kontrollera adressen — den behöver ett @ och en domän, till exempel namn@exempel.se.","invite.error.conflict":"Det finns redan en obesvarad inbjudan till {email}.","invite.error.failed":"Inbjudan kunde inte skickas. Försök igen.","invite.sent":"Inbjudan är skickad till {email}.","invitations.heading":"Inbjudna","invitations.loading":"Hämtar inbjudningar…","invitations.error":"Inbjudningarna kunde inte hämtas.","invitations.empty":"Inga inbjudningar väntar.","invitations.sent":"Skickad {when}","invitations.status.pending":"Väntar på svar","invitations.status.accepted":"Accepterad","invitations.status.declined":"Tackade nej","invitations.status.revoked":"Återkallad","invitations.status.expired":"Avslutad","invitations.revoke":"Återkalla","invitations.revokeError":"Inbjudan kunde inte återkallas. Försök igen.","invitations.confirm.title":"Återkalla inbjudan?","invitations.confirm.message":"{email} kan inte längre tacka ja, och inbjudan går inte att få tillbaka. Vill du bjuda in adressen igen får du skicka en ny inbjudan.","invitations.confirm.dismiss":"Avbryt","invitations.toast.revoked":"Inbjudan till {email} är återkallad.","invitations.page.heading":"Mina inbjudningar","invitations.page.email":"Email","invitations.page.submit":"Bjud in","invitations.page.submitting":"…","invitations.page.error.conflict":"En inbjudan till den emailen är redan aktiv","invitations.revoke.notPending":"Inbjudan till {email} går inte att återkalla — den är inte längre öppen.","inbox.heading":"Inkorg","inbox.empty":"Inga väntande inbjudningar.","inbox.empty.body":"Nya inbjudningar från lärare dyker upp här. Du behöver inte göra något för att ta emot dem.","inbox.from":"Inbjudan från {name} ({email})","inbox.accept":"Acceptera","inbox.decline":"Avböj","inbox.error.conflict":"Inbjudan är inte längre giltig","inbox.toast.accepted":"Du har tackat ja. {name} är nu din lärare.","inbox.toast.declined":"Inbjudan från {name} är avböjd.","student.eyebrow":"Elev","student.back":"Alla elever","student.loading":"Hämtar eleven…","student.error":"Eleven kunde inte hämtas.","student.notFound.heading":"Eleven finns inte","student.notFound.body":"Kopplingen kan vara borttagen, eller så är det inte din elev. Kontrollera länken.","student.notFound.action":"Till mina elever","student.book":"Boka lektion","student.relation":"Du är lärare · {email}","student.tab.overview":"Översikt","student.tab.lessons":"Lektioner","student.tab.sessions":"Pass","student.tab.plans":"Planer","student.tab.goals":"Mål","student.tab.horses":"Hästar","student.tab.history":"Historik","student.overview.loading":"Hämtar översikten…","student.overview.error":"Översikten kunde inte hämtas.","student.overview.unavailable":"Kunde inte hämtas","student.overview.nextLesson":"Nästa lektion","student.overview.nextLesson.none":"Ingen bokad lektion","student.overview.latestSession":"Senaste delade passet","student.overview.latestSession.none":"Inget pass delat med dig än","student.overview.activePlans":"Aktiva planer","student.overview.sharedGoals":"Delade mål","student.overview.sharedGoals.meta":"Bara mål eleven delat med dig räknas.","student.overview.planCount.one":"{count} plan","student.overview.planCount.other":"{count} planer","student.overview.goalCount.one":"{count} mål","student.overview.goalCount.other":"{count} mål","student.overview.activity":"Senaste aktivitet","student.overview.activity.empty":"Inget har hänt än.","student.lessons.loading":"Hämtar lektioner…","student.lessons.error":"Lektionerna kunde inte hämtas.","student.lessons.empty.heading":"Inga lektioner än","student.lessons.empty.body":"Boka den första lektionen, så samlas den här med häst, plan och övningar.","student.sessions.lede":"Bara träningspass som eleven delat med dig visas här.","student.sessions.loading":"Hämtar träningspass…","student.sessions.error":"Träningspassen kunde inte hämtas.","student.sessions.empty.heading":"Inga delade pass än","student.sessions.empty.body":"Eleven väljer själv vilka pass du får läsa. Delade pass dyker upp här.","student.plans.loading":"Hämtar planer…","student.plans.error":"Planerna kunde inte hämtas.","student.plans.empty.heading":"Ingen aktiv plan","student.plans.empty.body":"Eleven har ingen plan igång just nu. Planer skapas av eleven själv.","student.goals.lede":"Bara mål som eleven delat med dig visas här.","student.goals.loading":"Hämtar mål…","student.goals.error":"Målen kunde inte hämtas.","student.goals.empty.heading":"Inga delade mål","student.goals.empty.body":"Eleven väljer själv vilka mål du får följa. Delade mål dyker upp här.","student.horses.loading":"Hämtar hästar…","student.horses.error":"Hästarna kunde inte hämtas.","student.horses.empty.heading":"Inga hästar i stallet","student.horses.empty.body":"Eleven har inte lagt till någon häst än. Stallet sköter eleven själv.","student.history.loading":"Hämtar övningar…","student.history.error":"Övningarna kunde inte hämtas.","student.history.empty.heading":"Inga övningar i biblioteket","student.history.empty.body":"Lägg till en övning i ditt bibliotek, så kan du följa den över tid.","student.history.empty.action":"Till biblioteket","student.history.field":"Övning","student.history.placeholder":"Välj övning","student.history.open":"Öppna historiken","student.history.hint":"Välj en övning för att se allt {name} har gjort i den.","lessons.heading":"Lektioner","lessons.book":"Boka lektion","lessons.group.upcoming":"Kommande","lessons.group.past":"Tidigare","lessons.loading":"Hämtar lektioner…","lessons.error":"Lektionerna kunde inte hämtas.","lessons.retry":"Försök igen","lessons.empty.teacher.heading":"Inga lektioner än","lessons.empty.teacher.body":"Boka den första lektionen, så samlas den här med häst, plan och övningar.","lessons.empty.rider.heading":"Inga lektioner än","lessons.empty.rider.body":"Lektioner som din lärare bokar dyker upp här. Vill du undervisa själv behöver du först en elev.","lessons.empty.rider.action":"Bjud in elev","lesson.status.planned":"Planerad","lesson.status.completed":"Utförd","lesson.status.cancelled":"Inställd","lesson.title.plain":"Lektion","lesson.title.programs.one":"Lektion från {count} program","lesson.title.programs.other":"Lektion från {count} program","lesson.title.exercises.one":"Lektion med {count} övning","lesson.title.exercises.other":"Lektion med {count} övningar","lesson.chip.plan":"Plan: {title}","lesson.chip.program":"Program: {title}","lesson.chip.horse":"Häst: {name}","lesson.horse.none":"Ingen häst","lesson.plan.none":"Ingen plan","lesson.more":"+{count}","lesson.exercises.none":"Inga övningar","lesson.exerciseSummary.one":"{count} övning · {names}","lesson.exerciseSummary.other":"{count} övningar · {names}","lesson.back":"Alla lektioner","lesson.loading":"Hämtar lektionen…","lesson.notFound.heading":"Lektionen finns inte","lesson.notFound.body":"Den kan vara borttagen, eller så är den inte din. Kontrollera länken.","lesson.notFound.action":"Till lektioner","lesson.section.details":"Uppgifter","lesson.section.exercises":"Övningar","lesson.section.programs":"Program","lesson.field.when":"Datum & tid","lesson.field.horse":"Häst","lesson.field.plan":"Plan","lesson.save":"Spara","lesson.saved":"Ändringarna är sparade.","lesson.action.complete":"Markera utförd","lesson.action.cancel":"Ställ in","lesson.confirm.dismiss":"Avbryt","lesson.confirm.complete.title":"Markera lektionen som utförd?","lesson.confirm.complete.message":"Statusen är slutgiltig och går inte att ändra tillbaka. Övningar och program låses, men anteckningar kan fortfarande skrivas.","lesson.confirm.cancel.title":"Ställ in lektionen?","lesson.confirm.cancel.message":"Statusen är slutgiltig och går inte att ändra tillbaka. Övningar och program låses, men anteckningar kan fortfarande skrivas.","lesson.toast.completed":"Lektionen är markerad som utförd.","lesson.toast.cancelled":"Lektionen är inställd.","lesson.toast.undo":"Ångra","lesson.toast.exerciseRemoved":"{name} togs bort från lektionen.","lesson.toast.programDetached":"{title} togs bort som källa. Övningarna som kopierats därifrån är kvar.","lesson.locked.completed":"Lektionen är utförd. Övningar och program är låsta, men anteckningar är fortfarande öppna.","lesson.locked.cancelled":"Lektionen är inställd. Övningar och program är låsta, men anteckningar är fortfarande öppna.","lesson.conflict.message":"Lektionen har ändrats någon annanstans, så ändringen gick inte igenom. Hämta den senaste versionen och försök igen.","lesson.conflict.action":"Hämta på nytt","lesson.error":"Lektionen kunde inte hämtas.","lesson.exercises.empty":"Inga övningar än.","lesson.exercise.add":"Lägg till övning","lesson.exercise.placeholder":"Välj övning","lesson.exercise.remove":"Ta bort","lesson.exercise.source":"Från {title}","lesson.exercise.sourceGone":"Från ett borttaget program","lesson.exercise.history":"Övningshistorik","lesson.exercise.notesShow":"Anteckningar","lesson.exercise.notesHide":"Dölj anteckningar","lesson.exercises.loadError":"Övningarna kunde inte hämtas.","lesson.programs.empty":"Inga program kopplade.","lesson.programs.attach":"Koppla program","lesson.programs.placeholder":"Välj program","lesson.programs.detach":"Ta bort källa","lesson.programs.detachHint":"Att ta bort ett program tar inte bort övningarna som redan kopierats därifrån — de stannar i lektionen.","lesson.programs.loadError":"Programmen kunde inte hämtas.","lessonCreate.heading":"Boka lektion","lessonCreate.field.student":"Elev","lessonCreate.field.student.placeholder":"Välj elev","lessonCreate.field.when":"Datum & tid","lessonCreate.field.horse":"Häst","lessonCreate.field.horse.hint":"Hästar i elevens stall.","lessonCreate.field.plan":"Plan","lessonCreate.field.plan.hint":"Elevens aktiva planer.","lessonCreate.field.programs":"Program","lessonCreate.field.programs.hint":"Programmens övningar kopieras in i lektionen. Lektionen följer inte programmet — ändrar du programmet senare påverkas inte den här lektionen.","lessonCreate.field.programs.placeholder":"Välj program","lessonCreate.programsCount.one":"{count} valt","lessonCreate.programsCount.other":"{count} valda","lessonCreate.submit":"Boka lektion","lessonCreate.cancel":"Avbryt","lessonCreate.error.student":"Välj vilken elev lektionen gäller.","lessonCreate.error.when":"Välj datum och tid för lektionen.","lessonCreate.created":"Lektionen är bokad.","lessonCreate.createdPartial":"Lektionen är bokad, men allt kunde inte läggas till. Kontrollera häst och program nedan.","lessonCreate.programs.empty":"Du har inga program att välja bland ännu.","trainingSessions.heading":"Träningspass","trainingSessions.log":"Logga pass","trainingSessions.loading":"Hämtar träningspass…","trainingSessions.error":"Träningspassen kunde inte hämtas.","trainingSessions.saveError":"Passet kunde inte sparas. Försök igen.","trainingSessions.retry":"Försök igen","trainingSessions.empty.heading":"Inga träningspass än","trainingSessions.empty.body":"Här samlas dina egna pass — tid, häst, övningar och vad du tog med dig. Du väljer själv vilka lärare som får läsa.","trainingSessions.empty.action":"Logga ditt första pass","trainingSession.title.plain":"Träningspass","trainingSession.title.programs.one":"Pass från {count} program","trainingSession.title.programs.other":"Pass från {count} program","trainingSession.title.exercises.one":"Pass med {count} övning","trainingSession.title.exercises.other":"Pass med {count} övningar","trainingSession.duration.one":"{count} min","trainingSession.duration.other":"{count} min","trainingSession.chip.plan":"Plan: {title}","trainingSession.chip.program":"Program: {title}","trainingSession.more":"+{count}","trainingSession.exercises.none":"Inga övningar","trainingSession.exerciseSummary.one":"{count} övning · {names}","trainingSession.exerciseSummary.other":"{count} övningar · {names}","trainingSession.horse.none":"Ingen häst","trainingSession.plan.none":"Ingen plan","trainingSession.catalog.unknownTeacher":"Okänd lärare","trainingSession.share.you":"du","trainingSession.back":"Alla träningspass","trainingSession.loading":"Hämtar passet…","trainingSession.notFound.heading":"Träningspasset finns inte","trainingSession.notFound.body":"Det kan vara borttaget, eller så är det inte delat med dig. Kontrollera länken.","trainingSession.notFound.action":"Till träningspass","trainingSession.conflict.message":"Passet har ändrats någon annanstans, så ändringen gick inte igenom. Hämta den senaste versionen och försök igen.","trainingSession.conflict.action":"Hämta på nytt","trainingSession.section.details":"Uppgifter","trainingSession.section.summary":"Sammanfattning","trainingSession.section.sharing":"Delning","trainingSession.section.programs":"Program","trainingSession.section.exercises":"Övningar","trainingSession.field.when":"Datum & tid","trainingSession.field.duration":"Längd (minuter)","trainingSession.field.horse":"Häst","trainingSession.field.plan":"Plan","trainingSession.field.summary":"Sammanfattning","trainingSession.save":"Spara","trainingSession.saved":"Ändringarna är sparade.","trainingSession.summary.empty":"Ingen sammanfattning skriven.","trainingSession.sharing.hint":"Bara lärare du väljer här ser passet och kan svara på det. Passet är privat tills du delar det.","trainingSession.sharing.none":"Du har ingen lärare att dela med än.","trainingSession.sharing.legend":"Dela med lärare","trainingSession.sharing.withTeacher":"Dela med {name}","trainingSession.sharing.placeholder":"Välj lärare","trainingSession.sharing.count.one":"{count} vald","trainingSession.sharing.count.other":"{count} valda","trainingSession.sharing.saved":"Delningen är uppdaterad.","trainingSession.programOffer":"{name} äger ett av programmen du kopplat, men ser inte passet.","trainingSession.programOffer.action":"Dela med {name}","trainingSession.programs.empty":"Inga program kopplade.","trainingSession.programs.attach":"Koppla program","trainingSession.programs.placeholder":"Välj program","trainingSession.programs.detach":"Ta bort källa","trainingSession.programs.detachHint":"Att ta bort ett program tar inte bort övningarna som redan kopierats därifrån — de stannar i passet.","trainingSession.toast.programDetached":"{title} togs bort som källa. Övningarna som kopierats därifrån är kvar.","trainingSession.toast.undo":"Ångra","trainingSession.exercises.empty":"Inga övningar än.","trainingSession.exercise.add":"Lägg till övning","trainingSession.exercise.placeholder":"Välj övning","trainingSession.exercise.remove":"Ta bort","trainingSession.exercise.source":"Från {title}","trainingSession.exercise.sourceGone":"Från ett borttaget program","trainingSession.exercise.notesShow":"Anteckningar","trainingSession.exercise.notesHide":"Dölj anteckningar","trainingSession.confirm.dismiss":"Avbryt","trainingSession.confirm.removeExercise.title":"Ta bort övningen från passet?","trainingSession.confirm.removeExercise.message":"{name} tas bort ur passet. Övningens instruktionstext och kopplingen till programmet försvinner, och anteckningarna på den försvinner med den. Lägger du tillbaka övningen kommer den sist och utan instruktionstext.","trainingSession.action.delete":"Ta bort passet","trainingSession.catalog.horses.failed":"Hästarna kunde inte hämtas, så vi vet inte vilka som står i ditt stall just nu.","trainingSession.catalog.plans.failed":"Planerna kunde inte hämtas, så vi vet inte vilka som är aktiva just nu.","trainingSession.catalog.programs.failed":"Programmen kunde inte hämtas, så väljaren är tom just nu.","trainingSession.catalog.teachers.failed":"Dina lärare kunde inte hämtas, så vi vet inte vem du kan dela med just nu.","trainingSession.confirm.delete.title":"Ta bort träningspasset?","trainingSession.confirm.delete.message":"Passet försvinner för alla som kan se det, och anteckningarna dina lärare skrivit på det försvinner med det. Det går inte att få tillbaka.","trainingSession.toast.deleted":"Träningspasset togs bort.","trainingSession.catalog.teachers.loading":"Hämtar dina lärare …","trainingSession.refreshError":"Passet kunde inte uppdateras. Du ser det som hämtades senast.","trainingSessionCreate.heading":"Logga pass","trainingSessionCreate.field.when":"Datum & tid","trainingSessionCreate.field.duration":"Längd","trainingSessionCreate.field.duration.hint":"I hela minuter. Valfritt.","trainingSessionCreate.field.horse":"Häst","trainingSessionCreate.field.horse.hint":"Hästarna i ditt stall.","trainingSessionCreate.field.summary":"Sammanfattning","trainingSessionCreate.field.summary.hint":"Hur gick passet? Det här är det första din lärare läser.","trainingSessionCreate.field.plan":"Plan","trainingSessionCreate.field.plan.hint":"Dina aktiva planer.","trainingSessionCreate.field.program":"Program","trainingSessionCreate.field.program.hint":"Programmets övningar kopieras in i passet. Passet följer inte programmet — ändras programmet senare påverkas inte det här passet.","trainingSessionCreate.submit":"Logga pass","trainingSessionCreate.cancel":"Avbryt","trainingSessionCreate.error.when":"Välj när du red passet.","trainingSessionCreate.error.duration":"Längden anges i hela minuter, till exempel 45.","trainingSessionCreate.created":"Passet är loggat.","plans.heading":"Planer","plans.create":"Ny plan","plans.loading":"Hämtar planer…","plans.error":"Planerna kunde inte hämtas.","plans.retry":"Försök igen","plans.group.active":"Aktiva","plans.archived.show.one":"Visa {count} arkiverad plan","plans.archived.show.other":"Visa {count} arkiverade planer","plans.archived.hide":"Dölj arkiverade","plans.conflict.create":"Planerna har ändrats någon annanstans. De är hämtade på nytt — kontrollera listan innan du skapar planen igen.","plans.empty.heading":"Ingen plan än","plans.empty.body":"En plan samlar mål, lektioner och träningspass under ett tak — en säsong, ett projekt, ett år.","plans.empty.action":"Skapa din första plan","plans.refreshError":"Planerna kunde inte uppdateras. Du ser den senast hämtade listan.","plan.status.active":"Aktiv","plan.status.archived":"Arkiverad","plan.range.both":"{start} – {end}","plan.range.from":"Från {start}","plan.range.until":"Till och med {end}","plan.primaryTeacher":"Huvudlärare: {name}","plan.primaryTeacher.none":"Ingen huvudlärare","plan.primaryTeacher.hint":"Huvudläraren är en etikett och ett förval — den ger ingen extra behörighet. Alla lärare du är kopplad till kan läsa planen.","plan.back":"Alla planer","plan.loading":"Hämtar planen…","plan.notFound.heading":"Planen finns inte","plan.notFound.body":"Den kan vara borttagen, eller så är den inte din. Kontrollera länken.","plan.notFound.action":"Till planer","plan.section.details":"Uppgifter","plan.section.description":"Beskrivning","plan.section.goals":"Mål","plan.section.lessons":"Lektioner","plan.section.trainingSessions":"Träningspass","plan.group.upcoming":"Kommande","plan.group.past":"Tidigare","plan.description.empty":"Ingen beskrivning skriven.","plan.field.title":"Titel","plan.field.description":"Beskrivning","plan.field.start":"Startdatum","plan.field.end":"Slutdatum","plan.field.primaryTeacher":"Huvudlärare","plan.save":"Spara","plan.saved":"Ändringarna är sparade.","plan.saveError":"Planen kunde inte sparas. Försök igen.","plan.error.title":"Ge planen en titel.","plan.error.range":"Slutdatumet ligger före startdatumet. Välj ett datum efter {start}.","plan.archived.notice":"Planen är arkiverad. Den går att läsa och allt som redan är kopplat ligger kvar, men inga nya mål, lektioner eller pass kan kopplas till den.","plan.action.archive":"Arkivera","plan.confirm.dismiss":"Avbryt","plan.confirm.archive.title":"Arkivera planen?","plan.confirm.archive.message":"Planen går fortfarande att läsa och allt som är kopplat ligger kvar, men inga nya mål, lektioner eller pass kan kopplas till den. Det går inte att ångra härifrån.","plan.conflict.message":"Planen har ändrats någon annanstans, så ändringen gick inte igenom. Den senaste versionen är hämtad — läs den och gör om ändringen om den fortfarande behövs.","plan.toast.archived":"Planen är arkiverad.","plan.goals.empty.owner":"Inga mål är kopplade till planen än.","plan.goals.empty.teacher":"Inga mål i planen är delade med dig.","plan.goals.attach":"Koppla mål","plan.goals.placeholder":"Välj mål","plan.goals.detach":"Ta bort koppling","plan.goals.none":"Du har inga mål kvar att koppla till den här planen.","plan.toast.goalAttached":"{title} är kopplat till planen.","plan.toast.goalDetached":"{title} är inte längre kopplat till planen. Målet finns kvar under Mål.","plan.lessons.empty":"Inga lektioner är kopplade till planen.","plan.trainingSessions.empty":"Inga träningspass är kopplade till planen.","plan.stale":"Planen kunde inte hämtas på nytt, så det du ser kan vara inaktuellt.","planCreate.heading":"Ny plan","planCreate.field.title":"Titel","planCreate.field.description":"Beskrivning","planCreate.field.description.hint":"Vad ska planen leda till? Valfritt.","planCreate.field.start":"Startdatum","planCreate.field.end":"Slutdatum","planCreate.field.primaryTeacher":"Huvudlärare","planCreate.submit":"Skapa plan","planCreate.cancel":"Avbryt","planCreate.created":"Planen är skapad.","goals.heading":"Mål","goals.create":"Nytt mål","goals.loading":"Hämtar mål…","goals.error":"Målen kunde inte hämtas.","goals.retry":"Försök igen","goals.group.active":"Aktiva","goals.group.achieved":"Uppnådda","goals.abandoned.show.one":"Visa {count} avbrutet mål","goals.abandoned.show.other":"Visa {count} avbrutna mål","goals.abandoned.hide":"Dölj avbrutna","goals.empty.heading":"Inget mål än","goals.empty.body":"Ett mål är det du tränar mot. Skriv ner det, sätt ett måldatum och följ det över säsongen.","goals.empty.action":"Sätt ditt första mål","goal.status.active":"Aktiv","goal.status.achieved":"Uppnådd","goal.status.abandoned":"Avbruten","goal.target":"Måldatum {date}","goal.achievedAt":"Uppnått {date}","goal.overdue":"Måldatumet har passerat","goal.more":"+{count}","goal.plans.summary.one":"Plan: {names}","goal.plans.summary.other":"Planer: {names}","goal.plans.unnamed.one":"I {count} plan","goal.plans.unnamed.other":"I {count} planer","goal.chip.plan":"Plan: {title}","goal.back":"Alla mål","goal.loading":"Hämtar målet…","goal.notFound.heading":"Målet finns inte","goal.notFound.body":"Det kan vara borttaget, eller så är det inte delat med dig längre. Kontrollera länken.","goal.notFound.action":"Till mål","goal.conflict.message":"Målet har ändrats någon annanstans, så ändringen gick inte igenom. Hämta den senaste versionen och försök igen.","goal.conflict.action":"Hämta på nytt","goal.abandoned.notice":"Målet är avbrutet. Öppna det igen om du vill arbeta vidare med det — ett avbrutet mål kan inte markeras som uppnått direkt.","goal.section.details":"Uppgifter","goal.section.description":"Beskrivning","goal.section.plans":"Tillhör planer","goal.section.sharing":"Delat med","goal.description.empty":"Ingen beskrivning skriven.","goal.field.title":"Titel","goal.field.description":"Beskrivning","goal.field.target":"Måldatum","goal.field.horse":"Häst","goal.horse.none":"Ingen häst","goal.meta.horse":"Häst: {name}","goal.save":"Spara","goal.saved":"Ändringarna är sparade.","goal.saveError":"Målet kunde inte sparas. Försök igen.","goal.error.title":"Ge målet en titel.","goal.error.target":"Måldatumet måste vara ett riktigt datum, till exempel 2026-09-01.","goal.action.achieve":"Markera uppnått","goal.action.reopen":"Öppna igen","goal.action.abandon":"Avbryt målet","goal.confirm.dismiss":"Avbryt","goal.confirm.abandon.title":"Avbryta målet?","goal.confirm.abandon.message":"Målet flyttas till Avbrutna och räknas inte längre som pågående. Du kan öppna det igen, men det öppnas som aktivt — ett uppnått mål som avbryts går inte att få tillbaka som uppnått.","goal.toast.achieved":"Målet är markerat som uppnått.","goal.toast.reopened":"Målet är öppet igen.","goal.toast.abandoned":"Målet är avbrutet.","goal.plans.empty":"Målet hör inte till någon plan.","goal.plans.attach":"Koppla plan","goal.plans.placeholder":"Välj plan","goal.plans.detach":"Ta bort koppling","goal.plans.none":"Du har ingen aktiv plan kvar att koppla målet till.","goal.toast.planAttached":"Målet är kopplat till {title}.","goal.toast.planDetached":"Målet är inte längre kopplat till {title}.","goal.sharing.hint":"Bara lärare du väljer här ser målet. De kan skriva anteckningar och markera målet som uppnått eller öppna det igen.","goal.sharing.loading":"Hämtar delningen…","goal.sharing.none":"Du har ingen lärare att dela med än. Målet är ditt oavsett.","goal.sharing.saved":"Delningen är uppdaterad.","goal.sharing.error":"Delningen kunde inte ändras. Försök igen.","goal.conflict.formKept":"Den senaste versionen är hämtad. Dina ändringar i formuläret är kvar — jämför dem med den hämtade versionen innan du sparar om.","goal.stale":"Ändringen är genomförd, men målet kunde inte hämtas på nytt — det du ser kan vara inaktuellt.","goalCreate.heading":"Nytt mål","goalCreate.field.title":"Titel","goalCreate.field.title.hint":"Vad ska du kunna när målet är nått?","goalCreate.field.description":"Beskrivning","goalCreate.field.description.hint":"Vad betyder målet konkret? Valfritt.","goalCreate.field.target":"Måldatum","goalCreate.field.horse":"Häst","goalCreate.field.horse.hint":"Gäller målet en särskild häst? Valfritt.","goalCreate.field.target.hint":"När vill du vara framme? Valfritt.","goalCreate.submit":"Skapa mål","goalCreate.cancel":"Avbryt","goalCreate.created":"Målet är skapat.","auth.login.title":"Logga in","auth.login.lede":"Välkommen tillbaka. Här samlas dina lektioner, pass och mål.","auth.login.submit":"Logga in","auth.login.submitting":"Loggar in …","auth.login.altPrompt":"Har du inget konto än?","auth.login.altLink":"Skapa konto","auth.register.title":"Skapa konto","auth.register.lede":"Ett konto räcker. Du kan vara elev hos en lärare och lärare för en annan.","auth.register.submit":"Skapa konto","auth.register.submitting":"Skapar konto …","auth.register.altPrompt":"Har du redan ett konto?","auth.register.altLink":"Logga in","auth.field.email":"E-post","auth.field.password":"Lösenord","auth.field.displayName":"Namn","auth.hint.email":"Adressen du loggar in med. Har du fått en inbjudan, använd samma adress som den skickades till.","auth.hint.displayName":"Så här visas du för din ridlärare och dina elever.","auth.hint.password":"Minst 8 tecken.","auth.error.emailRequired":"Fyll i din e-postadress.","auth.error.emailInvalid":"Kontrollera adressen — den behöver ett @ och en domän, till exempel namn@exempel.se.","auth.error.passwordRequired":"Fyll i ditt lösenord.","auth.error.passwordTooShort":"Välj ett lösenord på minst 8 tecken.","auth.error.displayNameRequired":"Skriv namnet du vill visas med.","auth.error.credentials":"E-postadressen eller lösenordet stämmer inte. Kontrollera båda och försök igen.","auth.error.emailTaken":"Adressen har redan ett konto. Logga in i stället, eller använd en annan adress.","auth.error.validation":"Något i formuläret gick inte igenom. Se över fälten och skicka igen.","auth.error.network":"Vi når inte servern. Kontrollera din uppkoppling och försök igen.","auth.error.rateLimit":"För många inloggningsförsök. Vänta en minut och försök igen.","auth.error.server":"Något gick fel hos oss. Vänta en stund och försök igen.","account.title":"Kontoinställningar","account.lede":"Ditt konto och ditt lösenord.","account.section.account":"Konto","account.field.email":"E-post","account.password.title":"Byt lösenord","account.password.lede":"Välj ett nytt lösenord på minst 8 tecken. Du förblir inloggad på den här enheten.","account.field.currentPassword":"Nuvarande lösenord","account.field.newPassword":"Nytt lösenord","account.field.confirmPassword":"Bekräfta nytt lösenord","account.hint.currentPassword":"Lösenordet du loggar in med i dag.","account.hint.newPassword":"Minst 8 tecken.","account.hint.confirmPassword":"Skriv det nya lösenordet en gång till.","account.password.submit":"Spara nytt lösenord","account.password.submitting":"Sparar …","account.password.saved":"Lösenordet är ändrat.","account.error.currentPasswordRequired":"Fyll i ditt nuvarande lösenord.","account.error.newPasswordRequired":"Fyll i ett nytt lösenord.","account.error.newPasswordTooShort":"Välj ett lösenord på minst 8 tecken.","account.error.newPasswordTooLong":"Välj ett lösenord på högst 200 tecken.","account.error.newPasswordSameAsCurrent":"Välj ett lösenord som skiljer sig från det nuvarande.","account.error.confirmMismatch":"Lösenorden stämmer inte överens. Skriv samma lösenord i båda fälten.","account.error.currentPasswordWrong":"Nuvarande lösenord stämmer inte. Kontrollera det och försök igen.","account.error.validation":"Något i formuläret gick inte igenom. Se över fälten och skicka igen.","account.error.network":"Vi når inte servern. Kontrollera din uppkoppling och försök igen.","account.error.rateLimit":"För många försök. Vänta en minut och försök igen.","account.error.server":"Något gick fel hos oss. Vänta en stund och försök igen.","account.error.auth":"Din session har gått ut. Logga in igen.","library.heading":"Bibliotek","library.tab.exercises":"Övningar","library.tab.programs":"Program","library.create":"Ny övning","library.search.label":"Sök i biblioteket","library.search.placeholder":"Namn eller beskrivning","library.loading":"Hämtar biblioteket …","library.error":"Biblioteket kunde inte hämtas.","library.retry":"Försök igen","library.empty.heading":"Inga övningar ännu","library.empty.body":"Övningarna är byggstenarna i dina lektioner och program. Skapa den första så finns den i varje väljare.","library.empty.action":"Skapa första övningen","library.noMatches.heading":"Ingen övning matchar sökningen","library.noMatches.body":"Prova ett kortare ord, eller rensa sökningen för att se hela biblioteket.","library.noMatches.action":"Rensa sökningen","library.refreshError":"Biblioteket kunde inte uppdateras. Du ser den senast hämtade listan.","exercise.archiveError":"Övningen kunde inte arkiveras. Den ligger kvar i biblioteket — försök igen.","exercise.back":"← Bibliotek","exercise.eyebrow":"Övning","exercise.loading":"Hämtar övningen …","exercise.field.name":"Namn","exercise.field.description":"Beskrivning","exercise.error.name":"Ge övningen ett namn.","exercise.saveError":"Övningen kunde inte sparas. Försök igen.","exercise.save":"Spara ändringar","exercise.saved":"Övningen sparades.","exercise.notFound.heading":"Övningen finns inte","exercise.notFound.body":"Den är arkiverad, eller tillhör ett annat bibliotek än ditt.","exercise.notFound.action":"Till biblioteket","exercise.history.heading":"Övningshistorik","exercise.history.body":"Välj en elev för att se hur övningen gått i deras lektioner.","exercise.history.placeholder":"Välj elev","exercise.history.open":"Visa historik","exercise.history.noStudents":"Historiken öppnas när du har en elev — den följer en ryttare genom lektionerna.","exercise.history.rosterLoading":"Hämtar dina elever …","exercise.history.rosterError":"Elevlistan gick inte att hämta, så väljaren är tom just nu. Ladda om sidan och försök igen.","exercise.danger.heading":"Arkivera övningen","exercise.danger.body":"Övningen lämnar biblioteket och alla väljare. Lektioner och träningspass där den redan använts behåller den, med sina anteckningar.","exercise.danger.action":"Arkivera övning","exercise.confirm.archive.title":"Arkivera övningen?","exercise.confirm.archive.message":"Den försvinner direkt ur biblioteket och ur alla väljare. Genomförda lektioner och träningspass behåller övningen och sina anteckningar. Det går inte att ångra härifrån.","exercise.confirm.dismiss":"Avbryt","exercise.archived":"Övningen arkiverades.","exercise.conflict.action":"Hämta på nytt","exercise.conflict.message":"Övningen har ändrats någon annanstans, så ändringen gick inte igenom. Hämta den senaste versionen och försök igen.","exerciseCreate.heading":"Ny övning","exerciseCreate.field.name":"Namn","exerciseCreate.field.name.hint":"Det ryttaren ser i lektionen. Kort och igenkännbart.","exerciseCreate.field.description":"Beskrivning","exerciseCreate.field.description.hint":"Frivilligt. Vad övningen går ut på, och vad du tittar efter.","exerciseCreate.submit":"Skapa övning","exerciseCreate.cancel":"Avbryt","exerciseCreate.conflict":"Övningen kunde inte skapas — biblioteket har ändrats någon annanstans. Hämta det på nytt och se efter om övningen redan finns.","exerciseCreate.created":"Övningen skapades.","programs.create":"Nytt program","programs.loading":"Hämtar programmen …","programs.error":"Programmen kunde inte hämtas.","programs.retry":"Försök igen","programs.empty.heading":"Inga program ännu","programs.empty.body":"Ett program är en namngiven följd av övningar som du plockar in i en lektion eller ett träningspass.","programs.empty.action":"Skapa första programmet","programs.refreshError":"Programmen kunde inte uppdateras. Du ser den senast hämtade listan.","program.exerciseCount.one":"{count} övning","program.exerciseCount.other":"{count} övningar","program.back":"← Bibliotek","program.eyebrow":"Program","program.loading":"Hämtar programmet …","program.field.title":"Namn","program.field.description":"Beskrivning","program.error.title":"Ge programmet ett namn.","program.saveError":"Programmet kunde inte sparas. Försök igen.","program.save":"Spara ändringar","program.saved":"Programmet sparades.","program.notFound.heading":"Programmet finns inte","program.notFound.body":"Det är arkiverat, eller tillhör ett annat bibliotek än ditt.","program.notFound.action":"Till programmen","program.snapshot":"Lektioner och träningspass kopierar övningarna när programmet plockas in. Ändrar du här skrivs ingenting om i de tillfällen som redan kopierat programmet.","program.exercises.heading":"Övningar i programmet","program.exercises.empty":"Programmet är tomt. Lägg till den första övningen nedan.","program.add.label":"Lägg till övning","program.add.placeholder":"Välj övning","program.add.submit":"Lägg till","program.add.none":"Biblioteket är tomt. Skapa en övning först, så kan den plockas in här.","program.add.error":"Biblioteket gick inte att hämta, så väljaren är tom just nu. Ladda om sidan och försök igen.","program.add.exhausted":"Alla övningar i biblioteket ligger redan i programmet.","program.add.duplicate":"{name} ligger redan i programmet. Samma övning kan bara stå en gång.","program.add.failed":"Övningen kunde inte läggas till. Försök igen.","program.archiveError":"Programmet kunde inte arkiveras. Det ligger kvar i biblioteket — försök igen.","program.row.up":"Flytta {name} uppåt","program.row.down":"Flytta {name} nedåt","program.row.remove":"Ta bort","program.row.removeNamed":"Ta bort {name} ur programmet","program.row.note.add":"Lägg till anteckning","program.row.note.edit":"Ändra anteckning","program.row.note.addNamed":"Lägg till anteckning på {name}","program.row.note.editNamed":"Ändra anteckningen på {name}","program.row.note.label":"Anteckning på raden","program.row.note.save":"Spara anteckning","program.row.note.cancel":"Avbryt","program.row.note.saved":"Anteckningen sparades.","program.row.note.failed":"Anteckningen kunde inte sparas. Texten ligger kvar — försök igen.","program.row.archived":"Arkiverad","program.row.archived.hint":"Övningen är arkiverad och hoppas över när programmet plockas in. Raden gör ingenting — ta bort den när du vill städa.","program.reorderError":"Ordningen kunde inte sparas. Försök igen.","program.danger.heading":"Arkivera programmet","program.danger.body":"Programmet lämnar biblioteket och alla väljare. Lektioner och träningspass som redan kopierat det behåller sina övningar och sin märkning ”från program”.","program.danger.action":"Arkivera program","program.confirm.archive.title":"Arkivera programmet?","program.confirm.archive.message":"Det försvinner direkt ur biblioteket och ur alla väljare. Tillfällen som redan kopierat programmet behåller övningarna och märkningen ”från {title}”. Det går inte att ångra härifrån.","program.confirm.remove.title":"Ta bort övningen ur programmet?","program.confirm.remove.message":"{name} är arkiverad och kan inte läggas tillbaka i programmet efteråt. Tillfällen som redan kopierat programmet påverkas inte.","program.confirm.removeNoted.message":"{name} tas bort ur programmet och instruktionstexten på raden följer med. Du kan lägga tillbaka övningen och skriva texten igen — den hamnar sist i listan och får flyttas dit den ska.","program.confirm.removeArchivedNoted.message":"{name} är arkiverad och kan inte läggas tillbaka i programmet efteråt. Instruktionstexten på raden försvinner med den. Tillfällen som redan kopierat programmet påverkas inte.","program.confirm.dismiss":"Avbryt","program.archived":"Programmet arkiverades.","program.conflict.action":"Hämta på nytt","program.conflict.message":"Programmet har ändrats någon annanstans, så ändringen gick inte igenom. Hämta den senaste versionen och försök igen.","program.exercises.error":"Övningarna i programmet kunde inte hämtas, så följden visas inte just nu. Programmet är inte tomt — det har inte hämtats.","program.exercises.stale":"Följden kunde inte uppdateras. Du ser den senast hämtade ordningen — hämta på nytt innan du ändrar den.","program.row.remove.failed":"Övningen kunde inte tas bort. Den ligger kvar i programmet — försök igen.","programCreate.heading":"Nytt program","programCreate.field.title":"Namn","programCreate.field.title.hint":"Så här hittar du programmet igen, till exempel ”Grundhoppning A”.","programCreate.field.description":"Beskrivning","programCreate.field.description.hint":"Frivilligt. Vad programmet tränar, och för vem.","programCreate.submit":"Skapa program","programCreate.cancel":"Avbryt","programCreate.conflict":"Programmet kunde inte skapas — listan har ändrats någon annanstans. Hämta den på nytt och se efter om programmet redan finns.","programCreate.created":"Programmet skapades. Lägg till övningarna här.","stable.heading":"Hästar","stable.create":"Lägg till häst","stable.loading":"Hämtar stallet …","stable.error":"Stallet kunde inte hämtas.","stable.retry":"Försök igen","stable.empty.heading":"Inga hästar ännu","stable.empty.body":"Lägg till hästarna du rider. Då kan du välja häst när du bokar en lektion eller loggar ett pass.","stable.empty.action":"Lägg till första hästen","stable.refreshError":"Stallet kunde inte uppdateras. Du ser den senast hämtade listan.","horse.archiveError":"Hästen kunde inte arkiveras. Försök igen.","horse.back":"← Hästar","horse.eyebrow":"Häst","horse.loading":"Hämtar hästen …","horse.field.name":"Namn","horse.error.name":"Ge hästen ett namn.","horse.saveError":"Hästen kunde inte sparas. Försök igen.","horse.save":"Spara ändringar","horse.saved":"Hästen sparades.","horse.notFound.heading":"Hästen finns inte","horse.notFound.body":"Den är arkiverad, eller tillhör ett annat stall än ditt.","horse.notFound.action":"Till hästarna","horse.danger.heading":"Arkivera hästen","horse.danger.body":"Hästen lämnar stallet och väljarna för nya lektioner och pass. Lektioner och pass som redan är ridna behåller hästen, med sina anteckningar.","horse.danger.action":"Arkivera häst","horse.confirm.archive.title":"Arkivera hästen?","horse.confirm.archive.message":"Hästen försvinner direkt ur stallet och ur alla väljare. Tidigare lektioner och träningspass behåller hästen och sina anteckningar. Det går inte att ångra härifrån.","horse.confirm.dismiss":"Avbryt","horse.archived":"Hästen arkiverades.","horse.conflict.action":"Hämta på nytt","horse.conflict.message":"Hästen har ändrats någon annanstans, så ändringen gick inte igenom. Hämta den senaste versionen och försök igen.","horseCreate.heading":"Lägg till häst","horseCreate.field.name":"Namn","horseCreate.field.name.hint":"Namnet du kallar hästen. Du kan ändra det när som helst.","horseCreate.submit":"Lägg till häst","horseCreate.cancel":"Avbryt","horseCreate.conflict":"Stallet har ändrats någon annanstans. Det är hämtat på nytt — kontrollera listan innan du lägger till hästen igen.","horseCreate.created":"Hästen lades till i stallet.","exerciseHistory.eyebrow":"Övningshistorik","exerciseHistory.back":"← Tillbaka","exerciseHistory.subtitle":"Elev: {student}","exerciseHistory.loading":"Hämtar historiken …","exerciseHistory.caption":"Lektioner där övningen använts, senast först","exerciseHistory.scope":"Delade anteckningar plus dina egna privata. Den andra partens privata anteckningar visas aldrig. Läsläge — anteckningar skrivs på lektionen.","exerciseHistory.col.date":"Datum","exerciseHistory.col.occasion":"Tillfälle","exerciseHistory.col.rowNote":"Radanteckning","exerciseHistory.col.notes":"Anteckningar","exerciseHistory.standalone":"Fristående","exerciseHistory.note.shared":"Delad anteckning","exerciseHistory.note.private":"Privat anteckning","exerciseHistory.openLesson":"Öppna lektionen {date}","exerciseHistory.empty.heading":"Ingen historik ännu","exerciseHistory.empty.body":"Historiken fylls på när övningen används i en lektion. Då samlas radanteckningar och feedback här.","exerciseHistory.empty.action":"Tillbaka","exerciseHistory.notFound.heading":"Historiken finns inte","exerciseHistory.notFound.body":"Eleven, övningen eller kopplingen mellan er går inte att hitta.","exerciseHistory.notFound.action":"Till mina elever","exerciseHistory.unreachable.heading":"Historiken gick inte att hämta","exerciseHistory.unreachable.body":"Vi nådde inte servern, så vi vet inte vad som finns här. Kontrollera uppkopplingen och försök igen.","exerciseHistory.unreachable.action":"Försök igen","home.title":"Hem","home.lede":"Det här behöver dig i dag.","home.loading":"Hämtar din översikt …","home.error":"Översikten kunde inte hämtas.","home.retry":"Försök igen","home.updated":"Uppdaterad {when}","home.nextLesson":"Nästa lektion","home.nextLesson.none":"Ingen bokad lektion","home.nextLesson.empty.action":"Visa lektioner","home.nextLesson.exercises.more.one":"+{count} övning till","home.nextLesson.exercises.more.other":"+{count} övningar till","home.nextLesson.noExercises":"Inga övningar upplagda än","home.feedback":"Senaste återkoppling","home.feedback.none":"Ingen delad återkoppling än","home.feedback.empty.action":"Öppna Lektioner","home.feedback.byline":"{name} · {when}","home.feedback.on.lesson":"På lektionen med {name}","home.feedback.on.lessonExercise":"På övningen {exercise} i lektionen med {name}","home.feedback.on.trainingSession":"På träningspasset","home.feedback.on.trainingSessionExercise":"På övningen {exercise} i träningspasset","home.feedback.on.goal":"På målet {title}","home.awaiting":"Väntar på din återkoppling","home.awaiting.none":"Du har svarat på allt","home.awaiting.count.one":"{count} tillfälle","home.awaiting.count.other":"{count} tillfällen","home.awaiting.lesson":"Lektion med {name}","home.awaiting.session":"Träningspass · {name}","home.awaiting.all":"Öppna Lektioner","home.riding":"Din träning","home.plans.none":"Ingen aktiv plan","home.plans.count.one":"{count} aktiv plan","home.plans.count.other":"{count} aktiva planer","home.goals.nearing":"Måldatum som närmar sig","home.goals.none":"Inga mål med datum inom en månad.","home.goals.overdue":"Datum passerat","home.invitations.zero":"Du har inga inbjudningar som väntar.","home.invitations.one":"Du har en inbjudan som väntar.","home.invitations.other":"Du har {count} inbjudningar som väntar.","home.invitations.cta":"Öppna Inkorgen","home.action.logSession":"Logga pass","home.action.bookLesson":"Boka lektion","home.welcome.title":"Välkommen hit","home.welcome.body":"Någon har bjudit in dig. Svara i Inkorgen, så kommer resten igång.","home.start.title":"Kom igång","home.start.teach.title":"Undervisa","home.start.teach.body":"Bjud in din första elev och börja planera lektioner.","home.start.teach.action":"Bjud in elev","home.start.ride.title":"Träna","home.start.ride.body":"Lägg till din häst och sätt ett mål att träna mot.","home.start.ride.action":"Lägg till häst","home.start.ride.goal":"Skapa mål","schedule.heading":"Veckoschema","schedule.horse_log":"Hästlogg","schedule.stable":"Stallet","schedule.horses":"Hästarna","schedule.horse":"Häst","schedule.all":"Allt","schedule.mine":"Mina","schedule.description":"Planera veckan och fördela arbetet i stallet.","schedule.log_description":"Genomförd träning, skötsel och andra händelser kring hästen.","schedule.activity":"+ Aktivitet","schedule.activities":"aktiviteter","schedule.new_activity":"Ny aktivitet","schedule.add_activity":"Lägg till aktivitet","schedule.log_event":"Logga händelse","schedule.save_log":"Spara i hästloggen","schedule.settings":"Stallinställningar","schedule.weekly_template":"Veckomall","schedule.templates":"Mallar","schedule.day_templates":"Dagsmallar","schedule.create_day_template":"Skapa dagsmall","schedule.template_source_date":"Hämta aktiviteter från","schedule.day_template_description":"Mallen sparar planering och ansvariga från datumet. Inställda aktiviteter och genomföranden utelämnas.","schedule.save_day_template":"Spara dagsmall","schedule.day_template_saved":"Dagsmallen {name} är sparad.","schedule.use_day_template":"Lägg till aktiviteter den {date}","schedule.choose_day_template":"Välj dagsmall","schedule.apply_day_template":"Lägg till från mallen","schedule.default_day_template":"Standard för nya dagar","schedule.default_template_label":"Standardmall","schedule.no_default_template":"Ingen standardmall","schedule.default_template_description":"Lägg till dag fyller datumet med mallens aktiviteter och ansvariga.","schedule.save_default_template":"Spara standardmall","schedule.add_day":"Lägg till dag","schedule.day_added":"Dagen är tillagd.","schedule.day_added_with_activities":"Dagen är tillagd med {count} aktiviteter från standardmallen.","schedule.day_exists":"Dagen finns redan i schemat.","schedule.day_uses_template":"Använder dagsmallen {name}","schedule.share_day":"Dela länk","schedule.schedule_link":"Länk till vald dag","schedule.copy_link":"Kopiera länk","schedule.link_copied":"Länken är kopierad.","schedule.copy_link_manually":"Kopiera den markerade länken.","schedule.delete_activity":"Radera aktivitet","schedule.delete_activity_confirm":"Vill du radera aktiviteten och dess stallanteckning permanent?","schedule.delete_activity_linked":"Aktiviteten och stallanteckningen raderas. Det kopplade träningspasset finns kvar i Träningspass.","schedule.confirm_delete_activity":"Radera permanent","schedule.activity_deleted":"Aktiviteten är raderad.","schedule.error.empty_day_template":"Välj ett datum med minst en planerad eller genomförd aktivitet.","schedule.views":"Stallvyer","schedule.filters":"Filtrera aktiviteter","schedule.choose_stable":"Välj stall","schedule.loading":"Hämtar stallets aktiviteter…","schedule.retry":"Försök igen","schedule.refresh":"Uppdatera","schedule.start_heading":"Skapa ett gemensamt stall","schedule.start_description":"Bjud in dem som hjälper till och anslut dina hästar. Därefter kan ni planera veckan tillsammans.","schedule.create_stable":"Skapa stall","schedule.create_description":"Du blir stallansvarig och kan bjuda in andra medlemmar.","schedule.stable_name":"Stallets namn","schedule.time_zone":"Stallets tidszon","schedule.week_number":"Vecka {week}","schedule.previous_week":"Föregående vecka","schedule.next_week":"Nästa vecka","schedule.this_week":"Denna vecka","schedule.completed_week":"Genomförda denna vecka: {done} av {total}","schedule.unassigned_week":"Utan ansvarig denna vecka: {count}","schedule.done_count":"{done} av {total} klara","schedule.status_filter":"Filtrera efter status","schedule.filter_status.all":"Alla statusar","schedule.filter_status.remaining":"Återstående","schedule.filter_status.completed":"Genomförda","schedule.status.planned":"Planerad","schedule.status.completed":"Genomförd","schedule.status.cancelled":"Inställd","schedule.who_does_what":"Vem gör vad?","schedule.assignment_hint":"Klicka för att tilldela eller bocka av","schedule.stable_week":"Stallrutiner måndag till söndag","schedule.stable_routines":"Stallrutiner","schedule.copy_day_named":"Kopiera {day}","schedule.copy_day":"Kopiera dag","schedule.add_named":"Lägg till {name} {day}","schedule.horses_week":"Hästernas vecka","schedule.horses_description":"Träning, skötsel och besök","schedule.horse_counts":"{horses} hästar · {activities} aktiviteter","schedule.planned_per_horse":"Planerat per häst","schedule.multiple_hint":"Flera aktiviteter kan läggas till samma dag","schedule.horse_week":"Hästaktiviteter måndag till söndag","schedule.add_for_horse":"Lägg till aktivitet för {name} {day}","schedule.no_time":"Utan tid","schedule.unassigned":"Ej tilldelad","schedule.inactive_member":"Tidigare medlem","schedule.inactive_horse":"Hästen är arkiverad eller stallkopplingen har avslutats. Planerade aktiviteter behöver ses över.","schedule.inactive_horse_short":"Stallkoppling avslutad","schedule.needs_attention":"Behöver ses över","schedule.no_matches":"Inga aktiviteter matchar de valda filtren.","schedule.no_horses_match":"Inga hästar matchar de valda filtren.","schedule.empty_week":"Veckan har inga aktiviteter ännu. Lägg till rutiner eller planera en aktivitet.","schedule.reset_filters":"Återställ filter","schedule.nothing_planned":"Inget planerat den här dagen.","schedule.choose_day":"Välj veckodag","schedule.details_hint":"Klicka på en aktivitet för detaljer","schedule.no_horses":"Inga anslutna hästar","schedule.attach_horse_hint":"Anslut en häst i stallinställningarna för att planera aktiviteter och använda hästloggen.","schedule.from_date":"Från datum","schedule.to_date":"Till datum","schedule.completed_without_note":"Aktiviteten är genomförd utan resultatanteckning.","schedule.recorded_by":"Registrerat av {name}","schedule.empty_log":"Hästloggen har inga genomförda händelser i det valda intervallet.","schedule.load_more":"Visa fler händelser","schedule.close":"Stäng","schedule.shared_with_stable":"Synligt för medlemmarna i {name}.","schedule.activity_type":"Aktivitetstyp","schedule.applies_to":"Gäller","schedule.whole_stable":"Hela stallet","schedule.name":"Namn","schedule.date":"Datum","schedule.time_optional":"Tid, valfritt","schedule.assignees":"Ansvariga","schedule.actual_performers":"Utfört av","schedule.main_performer":"Huvudutövare för träningen","schedule.instruction":"Instruktion inför aktiviteten","schedule.result_note":"Stallanteckning efteråt","schedule.performed_at":"Utfört datum och tid","schedule.catalog":"Program och övningar ur katalogen","schedule.catalog_visibility":"Andra stallmedlemmar får bara läsa innehåll som de redan har tillgång till.","schedule.programs":"Program","schedule.exercises":"Övningar","schedule.loading_catalog":"Hämtar tillgängligt innehåll…","schedule.program_restricted":"Ett program är kopplat. Du har inte tillgång till programmets innehåll.","schedule.planned_content":"Övningar vid planeringen","schedule.save":"Spara ändringar","schedule.saved":"Ändringarna är sparade.","schedule.complete":"Markera som klar","schedule.completed_saved":"Aktiviteten är genomförd och sparad.","schedule.claim":"Ta ansvar för aktiviteten","schedule.reopen":"Återöppna aktiviteten","schedule.cancel_activity":"Ställ in aktiviteten","schedule.register_training":"Registrera träningspass","schedule.open_training":"Öppna träningspass","schedule.training_private":"Ett personligt träningspass är kopplat till aktiviteten.","schedule.latest_saved":"Senaste sparade versionen","schedule.load_saved":"Ladda sparat och ersätt mitt utkast","schedule.keep_draft":"Behåll mitt utkast mot senaste versionen","schedule.choose":"Välj","schedule.overlap":"Klockslaget inträffar två gånger","schedule.first_time":"Första tillfället","schedule.second_time":"Andra tillfället","schedule.template_description":"Återanvänd planeringen. Varje vecka får egna aktiviteter och genomföranden.","schedule.daily_routines":"Stallrutiner varje dag","schedule.add_routines":"Lägg till dagliga rutiner","schedule.reuse_week":"Återanvänd en vecka","schedule.copy_previous_week":"Kopiera föregående vecka","schedule.template_name":"Mallens namn","schedule.save_template":"Spara denna vecka som mall","schedule.choose_template":"Välj veckomall","schedule.keep_assignees":"Behåll ansvariga","schedule.apply_template":"Lägg till mallen i vald vecka","schedule.copy_excludes_outcome":"Genomföranden, resultatanteckningar och utförare kopieras inte.","schedule.copy_scope":"Hela källdagens eller källveckans planering ingår, även bortfiltrerade aktiviteter. Befintliga målaktiviteter behålls.","schedule.copy_week_description":"Kopiera planeringen till en annan vecka.","schedule.copy_day_description":"Välj vilka dagar som ska få en kopia av aktiviteterna.","schedule.copy_from":"Kopiera från","schedule.copy_to":"Kopiera till","schedule.another_date":"Lägg till ett annat datum","schedule.copy_preview_count":"{source} källaktiviteter ger {count} nya aktiviteter.","schedule.preview":"Förhandsgranska kopiering","schedule.copy_activities":"Kopiera aktiviteter","schedule.copied":"{count} aktiviteter kopierade.","schedule.training_description":"Träningspasset är privat. Stallanteckningen delas med stallet.","schedule.existing_training":"Träningspass att koppla","schedule.new_training":"Skapa ett nytt träningspass","schedule.training":"Träningspass","schedule.duration":"Längd i minuter, valfritt","schedule.private_summary":"Privat sammanfattning i träningspasset","schedule.save_training":"Spara träningspass och markera klart","schedule.members":"Medlemmar","schedule.role.admin":"Stallansvarig","schedule.role.member":"Medlem","schedule.member_role":"Roll för {name}","schedule.leave_stable":"Lämna stallet","schedule.remove":"Ta bort medlemskap","schedule.invite_email":"Bjud in med e-postadress","schedule.invite":"Skapa inbjudan","schedule.revoke":"Återkalla inbjudan","schedule.stable_horses":"Anslutna hästar","schedule.horse_consent":"När du ansluter din häst delar du dess namn, stallplanering och stalloggen med medlemmarna. Ägandet och privata träningsuppgifter behålls.","schedule.detach_horse":"Avsluta stallkoppling","schedule.choose_own_horse":"Välj en av dina hästar","schedule.consent_label":"Jag godkänner att dela hästens stallaktiviteter med medlemmarna.","schedule.attach_horse":"Anslut hästen","schedule.no_own_horses":"Du har inga fler egna hästar att ansluta.","schedule.manage_horses":"Hantera mina hästar","schedule.activity_types":"Aktivitetstyper","schedule.new_type":"Ny aktivitetstyp","schedule.category":"Kategori","schedule.category.routine":"Stallrutin","schedule.category.care":"Skötsel","schedule.category.training":"Träning","schedule.category.visit":"Besök","schedule.category.other":"Övrigt","schedule.scope.stable":"Hela stallet","schedule.scope.horse":"En häst","schedule.scope.any":"Välj stall eller häst vid planering","schedule.default_time":"Standardtid, valfritt","schedule.archived":"Arkiverad","schedule.save_type":"Spara aktivitetstyp","schedule.inbox_invitation":"Du är inbjuden till {name}.","schedule.accept":"Acceptera","schedule.decline":"Avböj","schedule.error.generic":"Det gick inte att spara eller hämta uppgifterna. Försök igen.","schedule.error.session":"Din session har gått ut. Logga in igen.","schedule.error.not_found":"Stallet eller aktiviteten finns inte, eller så saknar du åtkomst.","schedule.error.forbidden":"Du saknar behörighet för den här ändringen.","schedule.error.validation":"Kontrollera att formulärets uppgifter är giltiga och försök igen.","schedule.error.version_conflict":"Någon har ändrat aktiviteten. Ditt utkast finns kvar. Jämför med senaste versionen innan du sparar igen.","schedule.error.horse_inactive":"Hästen är inte längre aktiv i stallet. Välj en aktiv häst eller ställ in aktiviteten.","schedule.error.member_inactive":"En vald person är inte längre medlem. Välj aktiva medlemmar.","schedule.error.type_inactive":"Aktivitetstypen är arkiverad eller saknas. Välj en aktiv typ.","schedule.error.invalid_date":"Ange ett giltigt datum.","schedule.error.invalid_time":"Ange ett giltigt klockslag.","schedule.error.nonexistent_time":"Klockslaget finns inte på grund av övergång till sommartid. Välj en annan tid.","schedule.error.ambiguous_time":"Klockslaget inträffar två gånger. Välj första eller andra tillfället.","schedule.error.invalid_offset":"Det valda tillfället stämmer inte med datumet och klockslaget. Välj igen.","schedule.error.last_admin":"Utse en annan stallansvarig innan du lämnar eller ändrar din roll.","schedule.error.invitation_pending":"Det finns redan en väntande inbjudan till den adressen.","schedule.error.invitation_expired":"Inbjudan har gått ut eller kan inte längre användas.","schedule.error.already_assigned":"Aktiviteten har redan en ansvarig. Uppdatera schemat.","schedule.error.catalog_unavailable":"Det valda innehållet är inte tillgängligt för både planeraren och huvudutövaren. Ändra innehållet eller ansvarig.","schedule.error.training_student_required":"Välj en huvudutövare bland aktivitetens ansvariga.","schedule.error.training_already_linked":"Träningspasset är redan kopplat. Häst och huvudutövare kan inte bytas på en kopplad aktivitet.","schedule.error.invalid_targets":"Välj minst ett annat måldatum.","schedule.error.source_changed":"Källaktiviteterna har ändrats. Förhandsgranska kopieringen igen.","schedule.error.request_conflict":"Formuläret har redan använts för ett annat sparande. Öppna det igen och försök på nytt.","schedule.error.monday_required":"Välj en måndag för veckans startdatum.","schedule.error.invalid_duration":"Ange ett helt antal minuter mellan 0 och 1440.","schedule.error.activity_cancelled":"Återöppna den inställda aktiviteten innan du registrerar ett träningspass.","schedule.error.invalid_scope":"Välj en häst eller hela stallet enligt aktivitetstypen.","schedule.error.type_in_use":"Typen används redan. Skapa en ny typ för en annan kategori eller omfattning.","nav.weeklySchedule":"Veckoschema","nav.horseLog":"Hästlogg"},fa={"app.brand":"Lindgren Equestrian","nav.label":"Main menu","nav.openMenu":"Open menu","nav.home":"Home","nav.inbox":"Inbox","nav.inboxPending.one":"{count} invitation waiting","nav.inboxPending.other":"{count} invitations waiting","nav.group.training":"Training","nav.lessons":"Lessons","nav.trainingSessions":"Training sessions","nav.group.planning":"Planning & stable","nav.plans":"Plans","nav.goals":"Goals","nav.stable":"Horses","nav.group.teaching":"Teaching","nav.students":"My students","nav.library":"Library","nav.invitations":"Invitations","nav.programs":"Programs","topBar.theme.toLight":"Light mode","topBar.theme.toDark":"Dark mode","topBar.signOut":"Sign out","relative.yesterday":"yesterday","relative.today":"today","relative.tomorrow":"tomorrow","objectKind.goal":"Goal","objectKind.plan":"Plan","objectKind.lesson":"Lesson","objectKind.trainingSession":"Training session","objectKind.exercise":"Exercise","share.private":"Private","share.sharedWith":"Shared: {name}","share.sharedWithMore.one":"Shared: {name} +{count}","share.sharedWithMore.other":"Shared: {name} +{count}","share.sharedWithAll":"Shared with {names}","share.sharedUnknown":"Shared: recipient unknown","role.teacher":"Teacher","role.student":"Student","notes.heading.zero":"Notes","notes.heading.one":"Notes · {count}","notes.heading.other":"Notes · {count}","notes.empty":"No notes yet.","notes.placeholder":"Write a note…","notes.submit":"Add","notes.visibility":"Visibility","notes.shareUnavailable":"Nobody to share with","notes.hintPrivate":"Only you can see this note.","notes.hintShared":"{names} can see this note and reply.","notes.hintNoRecipients":"You have nobody to share with yet — the note stays private.","notes.edit":"Edit","notes.delete":"Delete","notes.save":"Save","notes.cancel":"Cancel","notes.deleteTitle":"Delete this note?","notes.deleteConsequence":"The note disappears for everyone who can see it and cannot be recovered.","notes.error":"The note could not be loaded or saved. Try again.","notes.error.conflict":"The note changed somewhere else. Fetch the latest version and try again.","notes.error.notFound":"The note no longer exists.","notes.error.validation":"The note did not go through. Review the text and try again.","detail.moreActions":"More actions","students.heading":"My students","students.invite":"Invite student","students.loading":"Loading students…","students.error":"The students could not be loaded.","students.retry":"Try again","students.empty.heading":"No students yet","students.empty.body":"Invite your first student by email. Once they accept, their lessons, plans and goals gather here.","students.invitedOnly.body":"The invitation is sent. Your student appears here as soon as they create an account with the same address and accept.","student.nextLesson":"Next lesson {when}","invite.field.email":"Student's email","invite.field.email.hint":"The address the student will create their account with.","invite.submit":"Send invitation","invite.cancel":"Cancel","invite.error.emailRequired":"Enter the student's email address.","invite.error.emailInvalid":"Check the address — it needs an @ and a domain, for example name@example.com.","invite.error.conflict":"There is already an unanswered invitation to {email}.","invite.error.failed":"The invitation could not be sent. Try again.","invite.sent":"The invitation was sent to {email}.","invitations.heading":"Invited","invitations.loading":"Loading invitations…","invitations.error":"The invitations could not be loaded.","invitations.empty":"No invitations are waiting.","invitations.sent":"Sent {when}","invitations.status.pending":"Awaiting reply","invitations.status.accepted":"Accepted","invitations.status.declined":"Declined","invitations.status.revoked":"Revoked","invitations.status.expired":"Ended","invitations.revoke":"Revoke","invitations.revokeError":"The invitation could not be revoked. Try again.","invitations.confirm.title":"Revoke the invitation?","invitations.confirm.message":"{email} can no longer accept, and the invitation cannot be brought back. To invite the address again you have to send a new invitation.","invitations.confirm.dismiss":"Cancel","invitations.toast.revoked":"The invitation to {email} was revoked.","invitations.page.heading":"My invitations","invitations.page.email":"Email","invitations.page.submit":"Invite","invitations.page.submitting":"…","invitations.page.error.conflict":"An invitation to that email is already active","invitations.revoke.notPending":"The invitation to {email} can no longer be revoked — it is no longer open.","inbox.heading":"Inbox","inbox.empty":"No pending invitations.","inbox.empty.body":"New invitations from teachers show up here. You do not have to do anything to receive them.","inbox.from":"Invitation from {name} ({email})","inbox.accept":"Accept","inbox.decline":"Decline","inbox.error.conflict":"The invitation is no longer valid","inbox.toast.accepted":"You accepted. {name} is now your teacher.","inbox.toast.declined":"The invitation from {name} was declined.","student.eyebrow":"Student","student.back":"All students","student.loading":"Loading the student…","student.error":"The student could not be loaded.","student.notFound.heading":"This student does not exist","student.notFound.body":"The connection may have been removed, or this is not your student. Check the link.","student.notFound.action":"To my students","student.book":"Book lesson","student.relation":"You are the teacher · {email}","student.tab.overview":"Overview","student.tab.lessons":"Lessons","student.tab.sessions":"Sessions","student.tab.plans":"Plans","student.tab.goals":"Goals","student.tab.horses":"Horses","student.tab.history":"History","student.overview.loading":"Loading the overview…","student.overview.error":"The overview could not be loaded.","student.overview.unavailable":"Could not be loaded","student.overview.nextLesson":"Next lesson","student.overview.nextLesson.none":"No lesson booked","student.overview.latestSession":"Latest shared session","student.overview.latestSession.none":"No session shared with you yet","student.overview.activePlans":"Active plans","student.overview.sharedGoals":"Shared goals","student.overview.sharedGoals.meta":"Only goals the student shared with you are counted.","student.overview.planCount.one":"{count} plan","student.overview.planCount.other":"{count} plans","student.overview.goalCount.one":"{count} goal","student.overview.goalCount.other":"{count} goals","student.overview.activity":"Recent activity","student.overview.activity.empty":"Nothing has happened yet.","student.lessons.loading":"Loading lessons…","student.lessons.error":"The lessons could not be loaded.","student.lessons.empty.heading":"No lessons yet","student.lessons.empty.body":"Book the first lesson and it gathers here with horse, plan and exercises.","student.sessions.lede":"Only training sessions the student shared with you are shown here.","student.sessions.loading":"Loading training sessions…","student.sessions.error":"The training sessions could not be loaded.","student.sessions.empty.heading":"No shared sessions yet","student.sessions.empty.body":"The student chooses which sessions you may read. Shared sessions appear here.","student.plans.loading":"Loading plans…","student.plans.error":"The plans could not be loaded.","student.plans.empty.heading":"No active plan","student.plans.empty.body":"The student has no plan running right now. Plans are created by the student.","student.goals.lede":"Only goals the student shared with you are shown here.","student.goals.loading":"Loading goals…","student.goals.error":"The goals could not be loaded.","student.goals.empty.heading":"No shared goals","student.goals.empty.body":"The student chooses which goals you may follow. Shared goals appear here.","student.horses.loading":"Loading horses…","student.horses.error":"The horses could not be loaded.","student.horses.empty.heading":"No horses in the stable","student.horses.empty.body":"The student has not added a horse yet. The stable is theirs to keep.","student.history.loading":"Loading exercises…","student.history.error":"The exercises could not be loaded.","student.history.empty.heading":"No exercises in the library","student.history.empty.body":"Add an exercise to your library and you can follow it over time.","student.history.empty.action":"To the library","student.history.field":"Exercise","student.history.placeholder":"Choose exercise","student.history.open":"Open the history","student.history.hint":"Choose an exercise to see everything {name} has done in it.","lessons.heading":"Lessons","lessons.book":"Book lesson","lessons.group.upcoming":"Upcoming","lessons.group.past":"Past","lessons.loading":"Loading lessons…","lessons.error":"The lessons could not be loaded.","lessons.retry":"Try again","lessons.empty.teacher.heading":"No lessons yet","lessons.empty.teacher.body":"Book the first lesson and it will gather here, with horse, plan and exercises.","lessons.empty.rider.heading":"No lessons yet","lessons.empty.rider.body":"Lessons your teacher books show up here. To teach yourself, you first need a student.","lessons.empty.rider.action":"Invite student","lesson.status.planned":"Planned","lesson.status.completed":"Completed","lesson.status.cancelled":"Cancelled","lesson.title.plain":"Lesson","lesson.title.programs.one":"Lesson from {count} program","lesson.title.programs.other":"Lesson from {count} programs","lesson.title.exercises.one":"Lesson with {count} exercise","lesson.title.exercises.other":"Lesson with {count} exercises","lesson.chip.plan":"Plan: {title}","lesson.chip.program":"Program: {title}","lesson.chip.horse":"Horse: {name}","lesson.horse.none":"No horse","lesson.plan.none":"No plan","lesson.more":"+{count}","lesson.exercises.none":"No exercises","lesson.exerciseSummary.one":"{count} exercise · {names}","lesson.exerciseSummary.other":"{count} exercises · {names}","lesson.back":"All lessons","lesson.loading":"Loading the lesson…","lesson.notFound.heading":"This lesson does not exist","lesson.notFound.body":"It may have been removed, or it may not be yours. Check the link.","lesson.notFound.action":"Go to lessons","lesson.section.details":"Details","lesson.section.exercises":"Exercises","lesson.section.programs":"Programs","lesson.field.when":"Date & time","lesson.field.horse":"Horse","lesson.field.plan":"Plan","lesson.save":"Save","lesson.saved":"Your changes are saved.","lesson.action.complete":"Mark completed","lesson.action.cancel":"Cancel lesson","lesson.confirm.dismiss":"Cancel","lesson.confirm.complete.title":"Mark this lesson completed?","lesson.confirm.complete.message":"The status is final and cannot be changed back. Exercises and programs lock, but notes can still be written.","lesson.confirm.cancel.title":"Cancel this lesson?","lesson.confirm.cancel.message":"The status is final and cannot be changed back. Exercises and programs lock, but notes can still be written.","lesson.toast.completed":"The lesson is marked completed.","lesson.toast.cancelled":"The lesson is cancelled.","lesson.toast.undo":"Undo","lesson.toast.exerciseRemoved":"{name} was removed from the lesson.","lesson.toast.programDetached":"{title} was removed as a source. The exercises copied from it stay.","lesson.locked.completed":"This lesson is completed. Exercises and programs are locked, but notes are still open.","lesson.locked.cancelled":"This lesson is cancelled. Exercises and programs are locked, but notes are still open.","lesson.conflict.message":"This lesson changed somewhere else, so the change did not go through. Load the latest version and try again.","lesson.conflict.action":"Load again","lesson.error":"The lesson could not be loaded.","lesson.exercises.empty":"No exercises yet.","lesson.exercise.add":"Add exercise","lesson.exercise.placeholder":"Choose exercise","lesson.exercise.remove":"Remove","lesson.exercise.source":"From {title}","lesson.exercise.sourceGone":"From a removed program","lesson.exercise.history":"Exercise history","lesson.exercise.notesShow":"Notes","lesson.exercise.notesHide":"Hide notes","lesson.exercises.loadError":"The exercises could not be loaded.","lesson.programs.empty":"No programs attached.","lesson.programs.attach":"Attach program","lesson.programs.placeholder":"Choose program","lesson.programs.detach":"Remove source","lesson.programs.detachHint":"Removing a program does not remove the exercises already copied from it — they stay in the lesson.","lesson.programs.loadError":"The programs could not be loaded.","lessonCreate.heading":"Book lesson","lessonCreate.field.student":"Student","lessonCreate.field.student.placeholder":"Choose student","lessonCreate.field.when":"Date & time","lessonCreate.field.horse":"Horse","lessonCreate.field.horse.hint":"Horses in this student's stable.","lessonCreate.field.plan":"Plan","lessonCreate.field.plan.hint":"This student's active plans.","lessonCreate.field.programs":"Programs","lessonCreate.field.programs.hint":"The programs' exercises are copied into the lesson. The lesson does not follow the program — changing the program later does not affect this lesson.","lessonCreate.field.programs.placeholder":"Choose program","lessonCreate.programsCount.one":"{count} selected","lessonCreate.programsCount.other":"{count} selected","lessonCreate.submit":"Book lesson","lessonCreate.cancel":"Cancel","lessonCreate.error.student":"Choose which student the lesson is for.","lessonCreate.error.when":"Choose a date and time for the lesson.","lessonCreate.created":"The lesson is booked.","lessonCreate.createdPartial":"The lesson is booked, but not everything could be added. Check the horse and programs below.","lessonCreate.programs.empty":"You have no programs to choose from yet.","trainingSessions.heading":"Training sessions","trainingSessions.log":"Log a session","trainingSessions.loading":"Loading training sessions…","trainingSessions.error":"The training sessions could not be loaded.","trainingSessions.saveError":"The session could not be saved. Try again.","trainingSessions.retry":"Try again","trainingSessions.empty.heading":"No training sessions yet","trainingSessions.empty.body":"Your own sessions collect here — time, horse, exercises and what you took away. You choose which teachers get to read them.","trainingSessions.empty.action":"Log your first session","trainingSession.title.plain":"Training session","trainingSession.title.programs.one":"Session from {count} program","trainingSession.title.programs.other":"Session from {count} programs","trainingSession.title.exercises.one":"Session with {count} exercise","trainingSession.title.exercises.other":"Session with {count} exercises","trainingSession.duration.one":"{count} min","trainingSession.duration.other":"{count} min","trainingSession.chip.plan":"Plan: {title}","trainingSession.chip.program":"Program: {title}","trainingSession.more":"+{count}","trainingSession.exercises.none":"No exercises","trainingSession.exerciseSummary.one":"{count} exercise · {names}","trainingSession.exerciseSummary.other":"{count} exercises · {names}","trainingSession.horse.none":"No horse","trainingSession.plan.none":"No plan","trainingSession.catalog.unknownTeacher":"Unknown teacher","trainingSession.share.you":"you","trainingSession.back":"All training sessions","trainingSession.loading":"Loading the session…","trainingSession.notFound.heading":"That training session does not exist","trainingSession.notFound.body":"It may have been deleted, or it is not shared with you. Check the link.","trainingSession.notFound.action":"To training sessions","trainingSession.conflict.message":"The session changed somewhere else, so your change did not go through. Load the latest version and try again.","trainingSession.conflict.action":"Load again","trainingSession.section.details":"Details","trainingSession.section.summary":"Summary","trainingSession.section.sharing":"Sharing","trainingSession.section.programs":"Programs","trainingSession.section.exercises":"Exercises","trainingSession.field.when":"Date & time","trainingSession.field.duration":"Duration (minutes)","trainingSession.field.horse":"Horse","trainingSession.field.plan":"Plan","trainingSession.field.summary":"Summary","trainingSession.save":"Save","trainingSession.saved":"Your changes are saved.","trainingSession.summary.empty":"No summary written.","trainingSession.sharing.hint":"Only teachers you choose here can see the session and respond to it. The session stays private until you share it.","trainingSession.sharing.none":"You have no teacher to share with yet.","trainingSession.sharing.legend":"Share with teachers","trainingSession.sharing.withTeacher":"Share with {name}","trainingSession.sharing.placeholder":"Choose teachers","trainingSession.sharing.count.one":"{count} selected","trainingSession.sharing.count.other":"{count} selected","trainingSession.sharing.saved":"Sharing is updated.","trainingSession.programOffer":"{name} owns one of the programs you attached, but cannot see the session.","trainingSession.programOffer.action":"Share with {name}","trainingSession.programs.empty":"No programs attached.","trainingSession.programs.attach":"Attach program","trainingSession.programs.placeholder":"Choose a program","trainingSession.programs.detach":"Remove source","trainingSession.programs.detachHint":"Removing a program does not remove the exercises already copied from it — they stay in the session.","trainingSession.toast.programDetached":"{title} was removed as a source. The exercises copied from it remain.","trainingSession.toast.undo":"Undo","trainingSession.exercises.empty":"No exercises yet.","trainingSession.exercise.add":"Add exercise","trainingSession.exercise.placeholder":"Choose an exercise","trainingSession.exercise.remove":"Remove","trainingSession.exercise.source":"From {title}","trainingSession.exercise.sourceGone":"From a removed program","trainingSession.exercise.notesShow":"Notes","trainingSession.exercise.notesHide":"Hide notes","trainingSession.confirm.dismiss":"Cancel","trainingSession.confirm.removeExercise.title":"Remove the exercise from the session?","trainingSession.confirm.removeExercise.message":"{name} is removed from the session. The exercise's instruction text and its link to the program disappear, and the notes on it go with it. If you add the exercise back it lands last and without the instruction text.","trainingSession.action.delete":"Delete session","trainingSession.catalog.horses.failed":"The horses could not be loaded, so we do not know what is in your stable right now.","trainingSession.catalog.plans.failed":"The plans could not be loaded, so we do not know which ones are active right now.","trainingSession.catalog.programs.failed":"The programs could not be loaded, so the picker is empty right now.","trainingSession.catalog.teachers.failed":"Your teachers could not be loaded, so we do not know who you can share with right now.","trainingSession.confirm.delete.title":"Delete the training session?","trainingSession.confirm.delete.message":"The session disappears for everyone who can see it, and the notes your teachers wrote on it disappear with it. This cannot be undone.","trainingSession.toast.deleted":"The training session was deleted.","trainingSession.catalog.teachers.loading":"Loading your teachers …","trainingSession.refreshError":"The session could not be updated. You are seeing what was most recently loaded.","trainingSessionCreate.heading":"Log a session","trainingSessionCreate.field.when":"Date & time","trainingSessionCreate.field.duration":"Duration","trainingSessionCreate.field.duration.hint":"In whole minutes. Optional.","trainingSessionCreate.field.horse":"Horse","trainingSessionCreate.field.horse.hint":"The horses in your stable.","trainingSessionCreate.field.summary":"Summary","trainingSessionCreate.field.summary.hint":"How did the session go? This is the first thing your teacher reads.","trainingSessionCreate.field.plan":"Plan","trainingSessionCreate.field.plan.hint":"Your active plans.","trainingSessionCreate.field.program":"Program","trainingSessionCreate.field.program.hint":"The program's exercises are copied into the session. The session does not follow the program — later changes to the program do not affect this session.","trainingSessionCreate.submit":"Log session","trainingSessionCreate.cancel":"Cancel","trainingSessionCreate.error.when":"Choose when you rode the session.","trainingSessionCreate.error.duration":"Duration is given in whole minutes, for example 45.","trainingSessionCreate.created":"The session is logged.","plans.heading":"Plans","plans.create":"New plan","plans.loading":"Loading plans…","plans.error":"The plans could not be loaded.","plans.retry":"Try again","plans.group.active":"Active","plans.archived.show.one":"Show {count} archived plan","plans.archived.show.other":"Show {count} archived plans","plans.archived.hide":"Hide archived","plans.conflict.create":"The plans changed somewhere else. They have been loaded again — check the list before creating the plan again.","plans.empty.heading":"No plan yet","plans.empty.body":"A plan gathers goals, lessons and training sessions under one roof — a season, a project, a year.","plans.empty.action":"Create your first plan","plans.refreshError":"The plans could not be updated. You are seeing the most recently loaded list.","plan.status.active":"Active","plan.status.archived":"Archived","plan.range.both":"{start} – {end}","plan.range.from":"From {start}","plan.range.until":"Until {end}","plan.primaryTeacher":"Primary teacher: {name}","plan.primaryTeacher.none":"No primary teacher","plan.primaryTeacher.hint":"The primary teacher is a label and a default — it grants no extra access. Every teacher you are connected to can read the plan.","plan.back":"All plans","plan.loading":"Loading the plan…","plan.notFound.heading":"The plan does not exist","plan.notFound.body":"It may have been removed, or it may not be yours. Check the link.","plan.notFound.action":"To plans","plan.section.details":"Details","plan.section.description":"Description","plan.section.goals":"Goals","plan.section.lessons":"Lessons","plan.section.trainingSessions":"Training sessions","plan.group.upcoming":"Upcoming","plan.group.past":"Past","plan.description.empty":"No description written.","plan.field.title":"Title","plan.field.description":"Description","plan.field.start":"Start date","plan.field.end":"End date","plan.field.primaryTeacher":"Primary teacher","plan.save":"Save","plan.saved":"Your changes are saved.","plan.saveError":"The plan could not be saved. Try again.","plan.error.title":"Give the plan a title.","plan.error.range":"The end date falls before the start date. Pick a date after {start}.","plan.archived.notice":"This plan is archived. It stays readable and everything already linked remains, but no new goals, lessons or sessions can be linked to it.","plan.action.archive":"Archive","plan.confirm.dismiss":"Cancel","plan.confirm.archive.title":"Archive the plan?","plan.confirm.archive.message":"The plan stays readable and everything linked to it remains, but no new goals, lessons or sessions can be linked to it. This cannot be undone from here.","plan.conflict.message":"The plan changed somewhere else, so your change did not go through. The latest version has been loaded — read it and make the change again if it is still needed.","plan.toast.archived":"The plan is archived.","plan.goals.empty.owner":"No goals are linked to this plan yet.","plan.goals.empty.teacher":"None of this plan's goals are shared with you.","plan.goals.attach":"Link goal","plan.goals.placeholder":"Choose a goal","plan.goals.detach":"Remove link","plan.goals.none":"You have no goals left to link to this plan.","plan.toast.goalAttached":"{title} is linked to the plan.","plan.toast.goalDetached":"{title} is no longer linked to the plan. The goal is still under Goals.","plan.lessons.empty":"No lessons are linked to this plan.","plan.trainingSessions.empty":"No training sessions are linked to this plan.","plan.stale":"The plan could not be loaded again, so what you are seeing may be out of date.","planCreate.heading":"New plan","planCreate.field.title":"Title","planCreate.field.description":"Description","planCreate.field.description.hint":"What should the plan lead to? Optional.","planCreate.field.start":"Start date","planCreate.field.end":"End date","planCreate.field.primaryTeacher":"Primary teacher","planCreate.submit":"Create plan","planCreate.cancel":"Cancel","planCreate.created":"The plan is created.","goals.heading":"Goals","goals.create":"New goal","goals.loading":"Loading goals…","goals.error":"The goals could not be loaded.","goals.retry":"Try again","goals.group.active":"Active","goals.group.achieved":"Achieved","goals.abandoned.show.one":"Show {count} abandoned goal","goals.abandoned.show.other":"Show {count} abandoned goals","goals.abandoned.hide":"Hide abandoned","goals.empty.heading":"No goal yet","goals.empty.body":"A goal is what you are training towards. Write it down, set a target date and follow it through the season.","goals.empty.action":"Set your first goal","goal.status.active":"Active","goal.status.achieved":"Achieved","goal.status.abandoned":"Abandoned","goal.target":"Target date {date}","goal.achievedAt":"Achieved {date}","goal.overdue":"The target date has passed","goal.more":"+{count}","goal.plans.summary.one":"Plan: {names}","goal.plans.summary.other":"Plans: {names}","goal.plans.unnamed.one":"In {count} plan","goal.plans.unnamed.other":"In {count} plans","goal.chip.plan":"Plan: {title}","goal.back":"All goals","goal.loading":"Loading the goal…","goal.notFound.heading":"The goal does not exist","goal.notFound.body":"It may have been removed, or it may no longer be shared with you. Check the link.","goal.notFound.action":"To goals","goal.conflict.message":"The goal changed somewhere else, so your change did not go through. Load the latest version and try again.","goal.conflict.action":"Load again","goal.abandoned.notice":"This goal is abandoned. Reopen it to keep working on it — an abandoned goal cannot be marked achieved directly.","goal.section.details":"Details","goal.section.description":"Description","goal.section.plans":"Belongs to plans","goal.section.sharing":"Shared with","goal.description.empty":"No description written.","goal.field.title":"Title","goal.field.description":"Description","goal.field.target":"Target date","goal.field.horse":"Horse","goal.horse.none":"No horse","goal.meta.horse":"Horse: {name}","goal.save":"Save","goal.saved":"Your changes are saved.","goal.saveError":"The goal could not be saved. Try again.","goal.error.title":"Give the goal a title.","goal.error.target":"The target date must be a real date, for example 2026-09-01.","goal.action.achieve":"Mark achieved","goal.action.reopen":"Reopen","goal.action.abandon":"Abandon goal","goal.confirm.dismiss":"Cancel","goal.confirm.abandon.title":"Abandon the goal?","goal.confirm.abandon.message":"The goal moves to Abandoned and no longer counts as ongoing. You can reopen it, but it reopens as active — an achieved goal that is abandoned cannot be restored as achieved.","goal.toast.achieved":"The goal is marked as achieved.","goal.toast.reopened":"The goal is open again.","goal.toast.abandoned":"The goal is abandoned.","goal.plans.empty":"This goal does not belong to any plan.","goal.plans.attach":"Link plan","goal.plans.placeholder":"Choose a plan","goal.plans.detach":"Remove link","goal.plans.none":"You have no active plan left to link this goal to.","goal.toast.planAttached":"The goal is linked to {title}.","goal.toast.planDetached":"The goal is no longer linked to {title}.","goal.sharing.hint":"Only teachers you pick here can see the goal. They can write notes and mark the goal achieved or reopen it.","goal.sharing.loading":"Loading sharing…","goal.sharing.none":"You have no teacher to share with yet. The goal is yours either way.","goal.sharing.saved":"Sharing is updated.","goal.sharing.error":"Sharing could not be changed. Try again.","goal.conflict.formKept":"The latest version has been loaded. Your changes in the form are still there — compare them with the loaded version before you save again.","goal.stale":"The change went through, but the goal could not be loaded again — what you are seeing may be out of date.","goalCreate.heading":"New goal","goalCreate.field.title":"Title","goalCreate.field.title.hint":"What will you be able to do once the goal is reached?","goalCreate.field.description":"Description","goalCreate.field.description.hint":"What does the goal mean in practice? Optional.","goalCreate.field.target":"Target date","goalCreate.field.horse":"Horse","goalCreate.field.horse.hint":"Is the goal about one particular horse? Optional.","goalCreate.field.target.hint":"When do you want to be there? Optional.","goalCreate.submit":"Create goal","goalCreate.cancel":"Cancel","goalCreate.created":"The goal is created.","auth.login.title":"Sign in","auth.login.lede":"Welcome back. Your lessons, sessions and goals are gathered here.","auth.login.submit":"Sign in","auth.login.submitting":"Signing in …","auth.login.altPrompt":"No account yet?","auth.login.altLink":"Create account","auth.register.title":"Create account","auth.register.lede":"One account is enough. You can be a student to one teacher and a teacher to another.","auth.register.submit":"Create account","auth.register.submitting":"Creating account …","auth.register.altPrompt":"Already have an account?","auth.register.altLink":"Sign in","auth.field.email":"Email","auth.field.password":"Password","auth.field.displayName":"Name","auth.hint.email":"The address you sign in with. If you were invited, use the address the invitation was sent to.","auth.hint.displayName":"This is how you appear to your teacher and your students.","auth.hint.password":"At least 8 characters.","auth.error.emailRequired":"Enter your email address.","auth.error.emailInvalid":"Check the address — it needs an @ and a domain, for example name@example.com.","auth.error.passwordRequired":"Enter your password.","auth.error.passwordTooShort":"Choose a password of at least 8 characters.","auth.error.displayNameRequired":"Enter the name you want to appear under.","auth.error.credentials":"That email address or password doesn't match. Check both and try again.","auth.error.emailTaken":"That address already has an account. Sign in instead, or use another address.","auth.error.validation":"Something in the form didn't pass. Review the fields and submit again.","auth.error.network":"We can't reach the server. Check your connection and try again.","auth.error.rateLimit":"Too many sign-in attempts. Wait a minute and try again.","auth.error.server":"Something went wrong on our end. Wait a moment and try again.","account.title":"Account settings","account.lede":"Your account and your password.","account.section.account":"Account","account.field.email":"Email","account.password.title":"Change password","account.password.lede":"Choose a new password of at least 8 characters. You stay signed in on this device.","account.field.currentPassword":"Current password","account.field.newPassword":"New password","account.field.confirmPassword":"Confirm new password","account.hint.currentPassword":"The password you sign in with today.","account.hint.newPassword":"At least 8 characters.","account.hint.confirmPassword":"Type the new password once more.","account.password.submit":"Save new password","account.password.submitting":"Saving …","account.password.saved":"Your password has been changed.","account.error.currentPasswordRequired":"Enter your current password.","account.error.newPasswordRequired":"Enter a new password.","account.error.newPasswordTooShort":"Choose a password of at least 8 characters.","account.error.newPasswordTooLong":"Choose a password of at most 200 characters.","account.error.newPasswordSameAsCurrent":"Choose a password that differs from your current one.","account.error.confirmMismatch":"The passwords don't match. Type the same password in both fields.","account.error.currentPasswordWrong":"That current password doesn't match. Check it and try again.","account.error.validation":"Something in the form didn't pass. Review the fields and submit again.","account.error.network":"We can't reach the server. Check your connection and try again.","account.error.rateLimit":"Too many attempts. Wait a minute and try again.","account.error.server":"Something went wrong on our end. Wait a moment and try again.","account.error.auth":"Your session has expired. Sign in again.","library.heading":"Library","library.tab.exercises":"Exercises","library.tab.programs":"Programs","library.create":"New exercise","library.search.label":"Search the library","library.search.placeholder":"Name or description","library.loading":"Loading the library …","library.error":"The library could not be loaded.","library.retry":"Try again","library.empty.heading":"No exercises yet","library.empty.body":"Exercises are the building blocks of your lessons and programs. Create the first one and it appears in every picker.","library.empty.action":"Create the first exercise","library.noMatches.heading":"No exercise matches that search","library.noMatches.body":"Try a shorter word, or clear the search to see the whole library.","library.noMatches.action":"Clear the search","library.refreshError":"The library could not be updated. You are seeing the most recently loaded list.","exercise.archiveError":"The exercise could not be archived. It is still in the library — try again.","exercise.back":"← Library","exercise.eyebrow":"Exercise","exercise.loading":"Loading the exercise …","exercise.field.name":"Name","exercise.field.description":"Description","exercise.error.name":"Give the exercise a name.","exercise.saveError":"The exercise could not be saved. Try again.","exercise.save":"Save changes","exercise.saved":"Exercise saved.","exercise.notFound.heading":"That exercise does not exist","exercise.notFound.body":"It has been archived, or it belongs to a library other than yours.","exercise.notFound.action":"Back to the library","exercise.history.heading":"Exercise history","exercise.history.body":"Pick a student to see how the exercise has gone in their lessons.","exercise.history.placeholder":"Pick a student","exercise.history.open":"Show history","exercise.history.noStudents":"History opens once you have a student — it follows one rider through their lessons.","exercise.history.rosterLoading":"Loading your students …","exercise.history.rosterError":"The student list could not be loaded, so the picker is empty right now. Reload the page and try again.","exercise.danger.heading":"Archive the exercise","exercise.danger.body":"The exercise leaves the library and every picker. Lessons and training sessions that already used it keep it, along with their notes.","exercise.danger.action":"Archive exercise","exercise.confirm.archive.title":"Archive the exercise?","exercise.confirm.archive.message":"It disappears from the library and every picker immediately. Completed lessons and training sessions keep the exercise and their notes. This cannot be undone from here.","exercise.confirm.dismiss":"Cancel","exercise.archived":"Exercise archived.","exercise.conflict.action":"Load again","exercise.conflict.message":"The exercise changed somewhere else, so your change did not go through. Load the latest version and try again.","exerciseCreate.heading":"New exercise","exerciseCreate.field.name":"Name","exerciseCreate.field.name.hint":"What the rider sees in the lesson. Short and recognisable.","exerciseCreate.field.description":"Description","exerciseCreate.field.description.hint":"Optional. What the exercise is for, and what you are watching for.","exerciseCreate.submit":"Create exercise","exerciseCreate.cancel":"Cancel","exerciseCreate.conflict":"The exercise could not be created — the library changed somewhere else. Load it again and check whether the exercise is already there.","exerciseCreate.created":"Exercise created.","programs.create":"New program","programs.loading":"Loading the programs …","programs.error":"The programs could not be loaded.","programs.retry":"Try again","programs.empty.heading":"No programs yet","programs.empty.body":"A program is a named sequence of exercises you pull into a lesson or a training session.","programs.empty.action":"Create the first program","programs.refreshError":"The programs could not be updated. You are seeing the most recently loaded list.","program.exerciseCount.one":"{count} exercise","program.exerciseCount.other":"{count} exercises","program.back":"← Library","program.eyebrow":"Program","program.loading":"Loading the program …","program.field.title":"Name","program.field.description":"Description","program.error.title":"Give the program a name.","program.saveError":"The program could not be saved. Try again.","program.save":"Save changes","program.saved":"Program saved.","program.notFound.heading":"That program does not exist","program.notFound.body":"It has been archived, or it belongs to a library other than yours.","program.notFound.action":"Back to the programs","program.snapshot":"Lessons and training sessions copy the exercises when the program is pulled in. Editing here rewrites nothing in the occasions that already copied it.","program.exercises.heading":"Exercises in the program","program.exercises.empty":"The program is empty. Add the first exercise below.","program.add.label":"Add exercise","program.add.placeholder":"Pick an exercise","program.add.submit":"Add","program.add.none":"The library is empty. Create an exercise first and it can be pulled in here.","program.add.error":"The library could not be loaded, so the picker is empty right now. Reload the page and try again.","program.add.exhausted":"Every exercise in the library is already in this program.","program.add.duplicate":"{name} is already in the program. The same exercise can only appear once.","program.add.failed":"The exercise could not be added. Try again.","program.archiveError":"The program could not be archived. It is still in the library — try again.","program.row.up":"Move {name} up","program.row.down":"Move {name} down","program.row.remove":"Remove","program.row.removeNamed":"Remove {name} from the program","program.row.note.add":"Add note","program.row.note.edit":"Edit note","program.row.note.addNamed":"Add a note to {name}","program.row.note.editNamed":"Edit the note on {name}","program.row.note.label":"Note on this row","program.row.note.save":"Save note","program.row.note.cancel":"Cancel","program.row.note.saved":"Note saved.","program.row.note.failed":"The note could not be saved. Your text is still here — try again.","program.row.archived":"Archived","program.row.archived.hint":"This exercise is archived and is skipped when the program is pulled in. The row does nothing — remove it when you want to tidy up.","program.reorderError":"The order could not be saved. Try again.","program.danger.heading":"Archive the program","program.danger.body":"The program leaves the library and every picker. Lessons and training sessions that already copied it keep their exercises and their “from program” label.","program.danger.action":"Archive program","program.confirm.archive.title":"Archive the program?","program.confirm.archive.message":"It disappears from the library and every picker immediately. Occasions that already copied the program keep the exercises and the label “from {title}”. This cannot be undone from here.","program.confirm.remove.title":"Remove the exercise from the program?","program.confirm.remove.message":"{name} is archived and cannot be put back into the program afterwards. Occasions that already copied the program are unaffected.","program.confirm.removeNoted.message":"{name} is removed from the program, and the row’s instruction text goes with it. You can add the exercise back and write the text again — it lands last in the list, so you will have to move it into place.","program.confirm.removeArchivedNoted.message":"{name} is archived and cannot be put back into the programme afterwards. The row's instruction text goes with it. Occasions that already copied the programme are unaffected.","program.confirm.dismiss":"Cancel","program.archived":"Program archived.","program.conflict.action":"Load again","program.conflict.message":"The program changed somewhere else, so your change did not go through. Load the latest version and try again.","program.exercises.error":"The exercises in this program could not be loaded, so the sequence is not shown right now. The program is not empty — its exercises have not loaded.","program.exercises.stale":"The sequence could not be updated. You are seeing the most recently loaded order — load again before you change it.","program.row.remove.failed":"The exercise could not be removed. It is still in the program — try again.","programCreate.heading":"New program","programCreate.field.title":"Name","programCreate.field.title.hint":"How you will find the program again, for example “Basic jumping A”.","programCreate.field.description":"Description","programCreate.field.description.hint":"Optional. What the program trains, and for whom.","programCreate.submit":"Create program","programCreate.cancel":"Cancel","programCreate.conflict":"The program could not be created — the list changed somewhere else. Load it again and check whether the program is already there.","programCreate.created":"Program created. Add its exercises here.","stable.heading":"Horses","stable.create":"Add horse","stable.loading":"Loading the stable …","stable.error":"The stable could not be loaded.","stable.retry":"Try again","stable.empty.heading":"No horses yet","stable.empty.body":"Add the horses you ride. Then you can pick one when you book a lesson or log a session.","stable.empty.action":"Add the first horse","stable.refreshError":"The stable could not be updated. You are seeing the most recently loaded list.","horse.archiveError":"The horse could not be archived. Try again.","horse.back":"← Horses","horse.eyebrow":"Horse","horse.loading":"Loading the horse …","horse.field.name":"Name","horse.error.name":"Give the horse a name.","horse.saveError":"The horse could not be saved. Try again.","horse.save":"Save changes","horse.saved":"Horse saved.","horse.notFound.heading":"That horse does not exist","horse.notFound.body":"It has been archived, or it belongs to a stable other than yours.","horse.notFound.action":"Back to the horses","horse.danger.heading":"Archive the horse","horse.danger.body":"The horse leaves the stable and the pickers for new lessons and sessions. Lessons and sessions already ridden keep the horse, along with their notes.","horse.danger.action":"Archive horse","horse.confirm.archive.title":"Archive the horse?","horse.confirm.archive.message":"The horse disappears from the stable and every picker immediately. Past lessons and training sessions keep the horse and their notes. This cannot be undone from here.","horse.confirm.dismiss":"Cancel","horse.archived":"Horse archived.","horse.conflict.action":"Load again","horse.conflict.message":"The horse changed somewhere else, so your change did not go through. Load the latest version and try again.","horseCreate.heading":"Add horse","horseCreate.field.name":"Name","horseCreate.field.name.hint":"What you call the horse. You can change it at any time.","horseCreate.submit":"Add horse","horseCreate.cancel":"Cancel","horseCreate.conflict":"The stable changed somewhere else. It has been loaded again — check the list before adding the horse again.","horseCreate.created":"Horse added to the stable.","exerciseHistory.eyebrow":"Exercise history","exerciseHistory.back":"← Back","exerciseHistory.subtitle":"Student: {student}","exerciseHistory.loading":"Loading the history …","exerciseHistory.caption":"Lessons where the exercise was used, most recent first","exerciseHistory.scope":"Shared notes plus your own private ones. The other party’s private notes are never shown. Read-only — notes are written on the lesson.","exerciseHistory.col.date":"Date","exerciseHistory.col.occasion":"Occasion","exerciseHistory.col.rowNote":"Row note","exerciseHistory.col.notes":"Notes","exerciseHistory.standalone":"Standalone","exerciseHistory.note.shared":"Shared note","exerciseHistory.note.private":"Private note","exerciseHistory.openLesson":"Open the lesson on {date}","exerciseHistory.empty.heading":"No history yet","exerciseHistory.empty.body":"History fills in once the exercise is used in a lesson. Row notes and feedback collect here.","exerciseHistory.empty.action":"Back","exerciseHistory.notFound.heading":"That history does not exist","exerciseHistory.notFound.body":"The student, the exercise, or the connection between you cannot be found.","exerciseHistory.notFound.action":"Back to my students","exerciseHistory.unreachable.heading":"The history could not be loaded","exerciseHistory.unreachable.body":"We did not reach the server, so we do not know what is here. Check your connection and try again.","exerciseHistory.unreachable.action":"Try again","home.title":"Home","home.lede":"Here is what needs you today.","home.loading":"Loading your overview …","home.error":"The overview could not be loaded.","home.retry":"Try again","home.updated":"Updated {when}","home.nextLesson":"Next lesson","home.nextLesson.none":"No lesson booked","home.nextLesson.empty.action":"View lessons","home.nextLesson.exercises.more.one":"+{count} more exercise","home.nextLesson.exercises.more.other":"+{count} more exercises","home.nextLesson.noExercises":"No exercises added yet","home.feedback":"Latest feedback","home.feedback.none":"No shared feedback yet","home.feedback.empty.action":"Open Lessons","home.feedback.byline":"{name} · {when}","home.feedback.on.lesson":"On the lesson with {name}","home.feedback.on.lessonExercise":"On the exercise {exercise} in the lesson with {name}","home.feedback.on.trainingSession":"On the training session","home.feedback.on.trainingSessionExercise":"On the exercise {exercise} in the training session","home.feedback.on.goal":"On the goal {title}","home.awaiting":"Awaiting your feedback","home.awaiting.none":"You have replied to everything","home.awaiting.count.one":"{count} occasion","home.awaiting.count.other":"{count} occasions","home.awaiting.lesson":"Lesson with {name}","home.awaiting.session":"Training session · {name}","home.awaiting.all":"Open Lessons","home.riding":"Your training","home.plans.none":"No active plan","home.plans.count.one":"{count} active plan","home.plans.count.other":"{count} active plans","home.goals.nearing":"Target dates coming up","home.goals.none":"No goals with a date within a month.","home.goals.overdue":"Date passed","home.invitations.zero":"You have no invitations waiting.","home.invitations.one":"You have one invitation waiting.","home.invitations.other":"You have {count} invitations waiting.","home.invitations.cta":"Open the inbox","home.action.logSession":"Log session","home.action.bookLesson":"Book lesson","home.welcome.title":"Welcome","home.welcome.body":"Someone has invited you. Reply in the inbox and the rest follows.","home.start.title":"Get started","home.start.teach.title":"Teach","home.start.teach.body":"Invite your first student and start planning lessons.","home.start.teach.action":"Invite student","home.start.ride.title":"Ride","home.start.ride.body":"Add your horse and set a goal to train towards.","home.start.ride.action":"Add horse","home.start.ride.goal":"Create goal","schedule.heading":"Weekly schedule","schedule.horse_log":"Horse log","schedule.stable":"Stable","schedule.horses":"Horses","schedule.horse":"Horse","schedule.all":"All","schedule.mine":"Mine","schedule.description":"Plan the week and assign work in the stable.","schedule.log_description":"Completed training, care and other events for the horse.","schedule.activity":"+ Activity","schedule.activities":"activities","schedule.new_activity":"New activity","schedule.add_activity":"Add activity","schedule.log_event":"Log event","schedule.save_log":"Save to horse log","schedule.settings":"Stable settings","schedule.weekly_template":"Weekly template","schedule.templates":"Templates","schedule.day_templates":"Day templates","schedule.create_day_template":"Create a day template","schedule.template_source_date":"Copy activities from","schedule.day_template_description":"The template saves planning details and assignees from that date. It excludes cancelled activities and outcomes.","schedule.save_day_template":"Save day template","schedule.day_template_saved":"Day template {name} saved.","schedule.use_day_template":"Add activities on {date}","schedule.choose_day_template":"Choose day template","schedule.apply_day_template":"Add from template","schedule.default_day_template":"Default for new days","schedule.default_template_label":"Default template","schedule.no_default_template":"No default template","schedule.default_template_description":"Add day fills the date with the template’s activities and assignees.","schedule.save_default_template":"Save default template","schedule.add_day":"Add day","schedule.day_added":"Day added.","schedule.day_added_with_activities":"Day added with {count} activities from the default template.","schedule.day_exists":"This day is already in the schedule.","schedule.day_uses_template":"Uses the {name} day template","schedule.share_day":"Share link","schedule.schedule_link":"Link to the selected day","schedule.copy_link":"Copy link","schedule.link_copied":"Link copied.","schedule.copy_link_manually":"Copy the selected link.","schedule.delete_activity":"Delete activity","schedule.delete_activity_confirm":"Permanently delete this activity and its stable note?","schedule.delete_activity_linked":"The activity and stable note will be deleted. The linked training session will still be available under Training sessions.","schedule.confirm_delete_activity":"Delete permanently","schedule.activity_deleted":"Activity deleted.","schedule.error.empty_day_template":"Choose a date with at least one planned or completed activity.","schedule.views":"Stable views","schedule.filters":"Filter activities","schedule.choose_stable":"Choose stable","schedule.loading":"Loading stable activities…","schedule.retry":"Try again","schedule.refresh":"Refresh","schedule.start_heading":"Create a shared stable","schedule.start_description":"Invite the people who help and connect your horses. Then plan the week together.","schedule.create_stable":"Create stable","schedule.create_description":"You become the stable administrator and can invite other members.","schedule.stable_name":"Stable name","schedule.time_zone":"Stable time zone","schedule.week_number":"Week {week}","schedule.previous_week":"Previous week","schedule.next_week":"Next week","schedule.this_week":"This week","schedule.completed_week":"Completed this week: {done} of {total}","schedule.unassigned_week":"Unassigned this week: {count}","schedule.done_count":"{done} of {total} done","schedule.status_filter":"Filter by status","schedule.filter_status.all":"All statuses","schedule.filter_status.remaining":"Remaining","schedule.filter_status.completed":"Completed","schedule.status.planned":"Planned","schedule.status.completed":"Completed","schedule.status.cancelled":"Cancelled","schedule.who_does_what":"Who does what?","schedule.assignment_hint":"Select to assign or mark as done","schedule.stable_week":"Stable routines Monday to Sunday","schedule.stable_routines":"Stable routines","schedule.copy_day_named":"Copy {day}","schedule.copy_day":"Copy day","schedule.add_named":"Add {name} on {day}","schedule.horses_week":"The horses this week","schedule.horses_description":"Training, care and appointments","schedule.horse_counts":"{horses} horses · {activities} activities","schedule.planned_per_horse":"Planned per horse","schedule.multiple_hint":"Add multiple activities on the same day","schedule.horse_week":"Horse activities Monday to Sunday","schedule.add_for_horse":"Add activity for {name} on {day}","schedule.no_time":"No time","schedule.unassigned":"Unassigned","schedule.inactive_member":"Former member","schedule.inactive_horse":"The horse is archived or its stable connection has ended. Review planned activities.","schedule.inactive_horse_short":"Stable connection ended","schedule.needs_attention":"Needs review","schedule.no_matches":"No activities match the selected filters.","schedule.no_horses_match":"No horses match the selected filters.","schedule.empty_week":"No activities this week yet. Add routines or plan an activity.","schedule.reset_filters":"Reset filters","schedule.nothing_planned":"Nothing planned for this day.","schedule.choose_day":"Choose weekday","schedule.details_hint":"Select an activity for details","schedule.no_horses":"No connected horses","schedule.attach_horse_hint":"Connect a horse in stable settings to plan activities and use the horse log.","schedule.from_date":"From date","schedule.to_date":"To date","schedule.completed_without_note":"The activity was completed without an outcome note.","schedule.recorded_by":"Recorded by {name}","schedule.empty_log":"No completed events in the horse log for the selected dates.","schedule.load_more":"Load more events","schedule.close":"Close","schedule.shared_with_stable":"Visible to members of {name}.","schedule.activity_type":"Activity type","schedule.applies_to":"Applies to","schedule.whole_stable":"Whole stable","schedule.name":"Name","schedule.date":"Date","schedule.time_optional":"Time, optional","schedule.assignees":"Assignees","schedule.actual_performers":"Performed by","schedule.main_performer":"Main training performer","schedule.instruction":"Instructions before the activity","schedule.result_note":"Shared stable outcome note","schedule.performed_at":"Actual date and time","schedule.catalog":"Programs and exercises from the catalog","schedule.catalog_visibility":"Other stable members can only read content they already have access to.","schedule.programs":"Programs","schedule.exercises":"Exercises","schedule.loading_catalog":"Loading available content…","schedule.program_restricted":"A program is attached. You do not have access to its contents.","schedule.planned_content":"Exercises saved when planning","schedule.save":"Save changes","schedule.saved":"Changes saved.","schedule.complete":"Mark as done","schedule.completed_saved":"The activity is completed and saved.","schedule.claim":"Take this activity","schedule.reopen":"Reopen activity","schedule.cancel_activity":"Cancel activity","schedule.register_training":"Record training session","schedule.open_training":"Open training session","schedule.training_private":"A personal training session is linked to this activity.","schedule.latest_saved":"Latest saved version","schedule.load_saved":"Load saved version and replace my draft","schedule.keep_draft":"Keep my draft against the latest version","schedule.choose":"Choose","schedule.overlap":"This clock time occurs twice","schedule.first_time":"First occurrence","schedule.second_time":"Second occurrence","schedule.template_description":"Reuse the plan. Every week gets its own activities and outcomes.","schedule.daily_routines":"Daily stable routines","schedule.add_routines":"Add daily routines","schedule.reuse_week":"Reuse a week","schedule.copy_previous_week":"Copy previous week","schedule.template_name":"Template name","schedule.save_template":"Save this week as template","schedule.choose_template":"Choose weekly template","schedule.keep_assignees":"Keep assignees","schedule.apply_template":"Add template to selected week","schedule.copy_excludes_outcome":"Completions, outcome notes and actual performers are not copied.","schedule.copy_scope":"The entire source day or week is included, including filtered activities. Existing target activities are kept.","schedule.copy_week_description":"Copy the plan to another week.","schedule.copy_day_description":"Choose the days that should receive a copy of the activities.","schedule.copy_from":"Copy from","schedule.copy_to":"Copy to","schedule.another_date":"Add another date","schedule.copy_preview_count":"{source} source activities will create {count} new activities.","schedule.preview":"Preview copy","schedule.copy_activities":"Copy activities","schedule.copied":"Copied {count} activities.","schedule.training_description":"The training session is private. The stable outcome note is shared with the stable.","schedule.existing_training":"Training session to link","schedule.new_training":"Create a new training session","schedule.training":"Training session","schedule.duration":"Duration in minutes, optional","schedule.private_summary":"Private training session summary","schedule.save_training":"Save training session and mark as done","schedule.members":"Members","schedule.role.admin":"Administrator","schedule.role.member":"Member","schedule.member_role":"Role for {name}","schedule.leave_stable":"Leave stable","schedule.remove":"Remove membership","schedule.invite_email":"Invite by email address","schedule.invite":"Create invitation","schedule.revoke":"Revoke invitation","schedule.stable_horses":"Connected horses","schedule.horse_consent":"Connecting your horse shares its name, stable schedule and stable log with members. Ownership and private training information stay unchanged.","schedule.detach_horse":"End stable connection","schedule.choose_own_horse":"Choose one of your horses","schedule.consent_label":"I agree to share the horse's stable activities with members.","schedule.attach_horse":"Connect horse","schedule.no_own_horses":"You have no more owned horses to connect.","schedule.manage_horses":"Manage my horses","schedule.activity_types":"Activity types","schedule.new_type":"New activity type","schedule.category":"Category","schedule.category.routine":"Stable routine","schedule.category.care":"Care","schedule.category.training":"Training","schedule.category.visit":"Appointment","schedule.category.other":"Other","schedule.scope.stable":"Whole stable","schedule.scope.horse":"One horse","schedule.scope.any":"Choose stable or horse when planning","schedule.default_time":"Default time, optional","schedule.archived":"Archived","schedule.save_type":"Save activity type","schedule.inbox_invitation":"You are invited to {name}.","schedule.accept":"Accept","schedule.decline":"Decline","schedule.error.generic":"The information could not be saved or loaded. Try again.","schedule.error.session":"Your session has expired. Sign in again.","schedule.error.not_found":"The stable or activity does not exist, or you do not have access.","schedule.error.forbidden":"You do not have permission for this change.","schedule.error.validation":"Check the form values and try again.","schedule.error.version_conflict":"Someone changed the activity. Your draft is kept. Compare it with the latest version before saving again.","schedule.error.horse_inactive":"The horse is no longer active in the stable. Choose an active horse or cancel the activity.","schedule.error.member_inactive":"A selected person is no longer a member. Choose active members.","schedule.error.type_inactive":"The activity type is archived or missing. Choose an active type.","schedule.error.invalid_date":"Enter a valid date.","schedule.error.invalid_time":"Enter a valid time.","schedule.error.nonexistent_time":"This clock time does not exist because of daylight saving. Choose another time.","schedule.error.ambiguous_time":"This clock time occurs twice. Choose the first or second occurrence.","schedule.error.invalid_offset":"The selected occurrence does not match the date and time. Choose again.","schedule.error.last_admin":"Appoint another administrator before leaving or changing your role.","schedule.error.invitation_pending":"A pending invitation already exists for that address.","schedule.error.invitation_expired":"The invitation has expired or is no longer available.","schedule.error.already_assigned":"The activity already has an assignee. Refresh the schedule.","schedule.error.catalog_unavailable":"The selected content is not available to both the planner and main performer. Change the content or performer.","schedule.error.training_student_required":"Choose a main performer from the activity assignees.","schedule.error.training_already_linked":"The training session is already linked. A linked activity cannot change horse or main performer.","schedule.error.invalid_targets":"Choose at least one different target date.","schedule.error.source_changed":"The source activities changed. Preview the copy again.","schedule.error.request_conflict":"The form was already used for a different save. Reopen it and try again.","schedule.error.monday_required":"Choose a Monday as the week start date.","schedule.error.invalid_duration":"Enter a whole number of minutes between 0 and 1440.","schedule.error.activity_cancelled":"Reopen the cancelled activity before recording a training session.","schedule.error.invalid_scope":"Choose a horse or the whole stable as required by the activity type.","schedule.error.type_in_use":"This type is already in use. Create a new type for a different category or scope.","nav.weeklySchedule":"Weekly schedule","nav.horseLog":"Horse log"};Ln("sv",ga);Ln("en",fa);ra("sv");const _s=class _s extends E{render(){return this.el=document.createElement("div"),this.el.className="ui-overlay",this.el.style.background=this.props.bg??"rgba(0,0,0,0.4)",this.el.style.zIndex=String(this.props.zIndex??50),this.el.addEventListener("click",()=>{this.props.onclose?this.props.onclose():this.props.open.set(!1)}),this.track(w(()=>{const e=this.props.open.get();this.el.classList.toggle("open",e),this.props.scrollLock&&(document.body.style.overflow=e?"hidden":"")})),this.el}onDestroy(){this.props.scrollLock&&(document.body.style.overflow="")}};_s.styles=`
        .ui-overlay {
            position: fixed;
            inset: 0;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.2s;
        }
        .ui-overlay.open {
            opacity: 1;
            pointer-events: auto;
        }
    `;let Be=_s;const Rs=n=>`var(--${n})`,vs=class vs extends E{render(){const e=document.createElement("div"),t=this.props.zIndex??100,s=this.props.side??"left";if(this.spawn(Be,e,{open:this.props.open,bg:this.props.overlayBg??"rgba(0,0,0,0.4)",zIndex:t-1,scrollLock:!0}),this.panel=document.createElement("div"),this.panel.className=`ui-drawer ui-drawer--${s}`,this.panel.style.width=this.props.width??"280px",this.panel.style.zIndex=String(t),e.appendChild(this.panel),this.props.content!=null){const i=document.createElement("div");i.setAttribute("bind","content"),this.panel.appendChild(i),this.projectContent(i,this.props.content)}return this.track(w(()=>{this.panel.classList.toggle("open",this.props.open.get())})),e}projectContent(e,t){typeof t=="string"?e.textContent=t:typeof t=="function"&&t.prototype instanceof E?this.spawn(t,e):typeof t=="function"&&t(e,{spawn:(s,i,...r)=>this.spawn(s,i,...r),track:s=>this.track(s)})}};vs.styles=`
        .ui-drawer {
            position: fixed;
            top: 0;
            bottom: 0;
            background: ${Rs("surface")};
            box-shadow: none;
            transition: transform 0.25s ease;
            overflow-y: auto;
        }
        .ui-drawer--left {
            left: 0;
            transform: translateX(-100%);
        }
        .ui-drawer--right {
            right: 0;
            transform: translateX(100%);
        }
        .ui-drawer.open {
            box-shadow: ${Rs("shadow-3")};
        }
        .ui-drawer--left.open {
            transform: translateX(0);
        }
        .ui-drawer--right.open {
            transform: translateX(0);
        }
    `;let qt=vs,ba=1;const _a=3e3,va=8e3;class te{constructor(){this.items=new m([]),this.timers=new Map}show(e){const t=String(ba++),s=e.variant??"info",i=e.duration??(e.action?va:_a),r={id:t,message:e.message,variant:s,duration:i,action:e.action};if(this.items.update(l=>[...l,r]),i>0){const l=setTimeout(()=>this.dismiss(t),i);this.timers.set(t,l)}}dismiss(e){const t=this.timers.get(e);t!=null&&(clearTimeout(t),this.timers.delete(e)),this.items.update(s=>s.filter(i=>i.id!==e))}}const me=n=>`var(--${n})`,ya="#1C1F21",Ms="#F1ECE3",Bs="#AFA698",$t="#CFAA81",xa="#8CC5A4",wa="#E39396",ys=class ys extends E{render(){this.svc=this.inject(te);const e=document.createElement("div");return e.className="ui-toast-container",this.$each(e,this.svc.items,(t,s,i)=>{const r=document.createElement("div");r.className=`ui-toast ui-toast--${t.variant}`;const l=document.createElement("span");if(l.className="ui-toast__message",l.textContent=t.message,r.appendChild(l),t.action){const h=t.action,u=document.createElement("button");if(u.className="ui-toast__action",u.textContent=h.label,u.addEventListener("click",()=>{h.onclick(),this.svc.dismiss(t.id)}),r.appendChild(u),t.duration>0){const p=document.createElement("span");p.className="ui-toast__countdown",p.setAttribute("aria-hidden","true");let b=Math.ceil(t.duration/1e3);p.textContent=`${b} s`;const _=setInterval(()=>{if(b-=1,b<=0){clearInterval(_);return}p.textContent=`${b} s`},1e3);i(()=>clearInterval(_)),r.appendChild(p)}}const c=document.createElement("button");return c.className="ui-toast__close",c.textContent="×",c.setAttribute("aria-label","Dismiss"),c.addEventListener("click",()=>this.svc.dismiss(t.id)),r.appendChild(c),requestAnimationFrame(()=>{r.classList.add("ui-toast--visible")}),r},t=>t.id),e}};ys.styles=`
        .ui-toast-container {
            position: fixed;
            bottom: 24px;
            right: 24px;
            z-index: 9999;
            display: flex;
            flex-direction: column;
            gap: 8px;
            pointer-events: none;
        }
        .ui-toast {
            max-width: 360px;
            min-width: 240px;
            padding: 12px 16px;
            background: ${ya};
            /*
             * The FILL stays charcoal in both themes (§4.12) — that rule is not
             * negotiable and is why it is a literal. Separation from the page is
             * a different problem, and in dark theme it was unsolved: charcoal
             * on a near-black page is 1.10:1, and the fixed hairline this
             * replaces only reached 1.48:1 against that page, so the toast read
             * as a smudge rather than a surface.
             *
             * The border and the elevation are therefore the two parts that DO
             * follow the theme: --border-strong is a mid-tone in every theme, so
             * it separates without ever inverting the toast, and --shadow-3
             * lifts it off the page at modal depth.
             *
             * The exact ratios are per-theme, since --border-strong is. Measured
             * against the dark page, where separation actually matters, the
             * worst case across the themes shipped here and in the apps is
             * 3.59:1 (teacher-student, #7A7059 on #131A20); the others run 4.9
             * to 5.5. On charcoal itself the border sits at 3.4–5.2:1. In light
             * theme the fill does the separating on its own at ~15:1, so the
             * border's ratio against the page is not load-bearing there.
             */
            border: 1px solid ${me("border-strong")};
            border-radius: ${me("radius-md")};
            box-shadow: ${me("shadow-3")};
            font-family: ${me("font-ui")};
            display: flex;
            align-items: center;
            gap: 12px;
            pointer-events: auto;
            opacity: 0;
            transform: translateX(100%);
            transition:
                opacity ${me("dur-slow")} ${me("ease-standard")},
                transform ${me("dur-slow")} ${me("ease-standard")};
        }
        .ui-toast.ui-toast--visible {
            opacity: 1;
            transform: translateX(0);
        }
        /*
         * The surface stays charcoal for every variant — the spec describes one
         * toast treatment, not three. The variant survives only as a hairline
         * rule, so severity is still readable without splitting the surface.
         */
        .ui-toast--info {
            border-left: 3px solid ${$t};
        }
        .ui-toast--success {
            border-left: 3px solid ${xa};
        }
        .ui-toast--error {
            border-left: 3px solid ${wa};
        }
        .ui-toast__message {
            flex: 1;
            color: ${Ms};
            font-size: 0.875rem;
            line-height: 1.4;
        }
        .ui-toast__action {
            background: none;
            border: none;
            padding: 0;
            flex-shrink: 0;
            font-family: inherit;
            font-size: 0.875rem;
            font-weight: 700;
            color: ${$t};
            cursor: pointer;
            text-decoration: underline;
            text-underline-offset: 2px;
        }
        .ui-toast__action:focus-visible {
            outline: 2px solid ${$t};
            outline-offset: 2px;
        }
        .ui-toast__countdown {
            flex-shrink: 0;
            color: ${Bs};
            font-size: 0.75rem;
            font-variant-numeric: tabular-nums;
        }
        .ui-toast__close {
            background: none;
            border: none;
            color: ${Bs};
            cursor: pointer;
            padding: 0;
            font-size: 1rem;
            line-height: 1;
            flex-shrink: 0;
        }
        .ui-toast__close:hover {
            color: ${Ms};
        }
    `;let Gt=ys;const F=n=>`var(--${n})`,P=(n,e)=>`var(--${n}, ${e})`,D=n=>{const e=pt[n];if(e===void 0)throw new Error(`unknown control token: --${n}`);return e},d=Fi({xs:"0.25rem",sm:"0.5rem",md:"0.75rem",lg:"1rem",xl:"1.5rem","2xl":"2rem","3xl":"3rem","4xl":"4rem"}),Ye=n=>`
    background: ${P(`btn-${n}-bg`,D(`btn-${n}-bg`))};
    color: ${P(`btn-${n}-fg`,D(`btn-${n}-fg`))};
    border-color: ${P(`btn-${n}-border`,D(`btn-${n}-border`))};
    box-shadow: ${P(`btn-${n}-shadow`,D(`btn-${n}-shadow`))};
    &:hover {
        background: ${P(`btn-${n}-bg-hover`,D(`btn-${n}-bg-hover`))};
        color: ${P(`btn-${n}-fg-hover`,D(`btn-${n}-fg-hover`))};
        border-color: ${P(`btn-${n}-border-hover`,D(`btn-${n}-border-hover`))};
    }`,Dn=`
    background: ${P("btn-disabled-bg",D("btn-disabled-bg"))};
    color: ${P("btn-disabled-fg",D("btn-disabled-fg"))};
    border-color: ${P("btn-disabled-border",D("btn-disabled-border"))};
    box-shadow: none;
    opacity: ${P("btn-disabled-opacity",D("btn-disabled-opacity"))};
    cursor: not-allowed;`,ka={primary:Ye("primary"),secondary:Ye("secondary"),ghost:Ye("ghost"),danger:Ye("danger"),disabled:Dn},C=(n=P("btn-radius",D("btn-radius")),e="secondary")=>`
    /*
     * Width here, colour from the tier below. Every tier carries the same
     * border width, so switching tiers recolours the box without resizing it —
     * the transparent placeholder only keeps this shorthand from resetting the
     * colour the tier is about to set.
     */
    border: ${P("btn-border-width",D("btn-border-width"))} solid transparent;
    border-radius: ${n};
    padding: ${P("btn-padding-y",D("btn-padding-y"))} ${P("btn-padding-x",D("btn-padding-x"))};
    font-family: ${F("font-ui")};
    font-size: ${P("btn-font-size",D("btn-font-size"))};
    line-height: ${P("btn-line-height",D("btn-line-height"))};
    font-weight: ${P("btn-font-weight",D("btn-font-weight"))};
    cursor: pointer;
    transition:
        background ${F("dur-fast")} ${F("ease-standard")},
        border-color ${F("dur-fast")} ${F("ease-standard")},
        color ${F("dur-fast")} ${F("ease-standard")},
        box-shadow ${F("dur-fast")} ${F("ease-standard")};
    &:focus-visible {
        outline: none;
        box-shadow: 0 0 0 ${P("btn-focus-ring-width",D("btn-focus-ring-width"))} ${P("btn-focus-ring",D("btn-focus-ring"))};
    }
    ${ka[e]}
    &:disabled {${Dn}}
`,$a=`max(${P("field-border-width",D("field-border-width"))}, ${P("field-rule-width",D("field-rule-width"))})`,Ze=(n,e)=>`
    border-top-color: ${n};
    border-right-color: ${n};
    border-left-color: ${n};
    border-bottom-color: ${e};`,K=()=>`
    border-style: solid;
    border-top-width: ${P("field-border-width",D("field-border-width"))};
    border-right-width: ${P("field-border-width",D("field-border-width"))};
    border-left-width: ${P("field-border-width",D("field-border-width"))};
    border-bottom-width: ${$a};
    ${Ze(P("field-border",D("field-border")),P("field-rule",D("field-rule")))}
    border-radius: ${P("field-radius",D("field-radius"))};
    padding: ${P("field-padding-y",D("field-padding-y"))} ${P("field-padding-x",D("field-padding-x"))};
    background: ${P("field-bg",D("field-bg"))};
    color: ${F("text")};
    font-family: ${F("font-ui")};
    font-size: ${P("field-font-size",D("field-font-size"))};
    line-height: ${P("field-line-height",D("field-line-height"))};
    font-weight: 400;
    transition:
        border-color ${F("dur-fast")} ${F("ease-standard")},
        box-shadow ${F("dur-fast")} ${F("ease-standard")},
        background ${F("dur-fast")} ${F("ease-standard")};
    &::placeholder { color: ${F("text-muted")}; }
    &:focus-visible {
        outline: none;
        ${Ze(P("field-focus-border",D("field-focus-border")),P("field-focus-border",D("field-focus-border")))}
        background: ${P("field-bg-focus",D("field-bg-focus"))};
        box-shadow: 0 0 0 ${P("field-focus-ring-width",D("field-focus-ring-width"))} ${P("field-focus-ring",D("field-focus-ring"))};
    }
    &[aria-invalid='true'] {
        ${Ze(P("field-invalid-border",D("field-invalid-border")),P("field-invalid-rule",D("field-invalid-rule")))}
    }
    &[aria-invalid='true']:focus-visible {
        ${Ze(P("field-invalid-border",D("field-invalid-border")),P("field-invalid-rule",D("field-invalid-rule")))}
        background: ${P("field-bg-focus",D("field-bg-focus"))};
        box-shadow: 0 0 0 ${P("field-focus-ring-width",D("field-focus-ring-width"))} ${P("field-invalid-ring",D("field-invalid-ring"))};
    }
`,ts=()=>`
    display: block;
    font-family: ${F("font-ui")};
    font-size: 11px;
    line-height: 16px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.14em;
    color: ${F("text-muted")};
`,Hn=()=>`
    display: block;
    font-family: ${F("font-ui")};
    font-size: 13px;
    line-height: 20px;
    color: ${F("danger")};
`,Q=n=>`
    background: ${F("surface")};
    border: 1px solid ${F("border")};
    border-radius: ${F("radius-md")};
    box-shadow: ${F("shadow-1")};
    
    & .ui-card__eyebrow {
        ${ts()}
        margin: 0 0 ${d("sm")} 0;
    }
    /*
     * Large numbers stay in the UI font with tabular figures — §02 makes
     * lining numerals mandatory for counters, and §4.2 puts big values in
     * Open Sans, never the serif.
     */
    & .ui-card__value {
        margin: 0;
        font-family: ${F("font-ui")};
        font-size: 2rem;
        line-height: 1.15;
        font-weight: 600;
        font-variant-numeric: tabular-nums;
        color: ${F("text")};
    }
    & .ui-card__meta {
        margin: ${d("xs")} 0 0 0;
        font-family: ${F("font-ui")};
        font-size: 13px;
        line-height: 20px;
        color: ${F("text-muted")};
    }
    & .ui-card__link {
        display: inline-block;
        margin-top: ${d("md")};
        font-family: ${F("font-ui")};
        font-size: 13px;
        line-height: 20px;
        font-weight: 600;
        color: ${F("accent")};
        text-decoration: none;
    }
    & .ui-card__link:hover {
        text-decoration: underline;
        text-underline-offset: 2px;
    }
`;class On{titleKey=new m(null);navOpen=new m(!1)}const Ca=T(`
    <header class="top-bar">
        <button bind="menu" class="top-bar__menu" type="button" aria-controls="app-nav-drawer">
            <span class="top-bar__menu-glyph" aria-hidden="true">≡</span>
        </button>
        <span bind="logo" class="top-bar__logo"></span>
        <span bind="title" class="top-bar__title"></span>
        <button bind="theme" class="top-bar__theme" type="button">
            <span bind="themeGlyph" class="top-bar__theme-glyph" aria-hidden="true"></span>
            <span bind="themeLabel"></span>
        </button>
        <button bind="logout" class="top-bar__logout" type="button"></button>
    </header>
`);class Sa extends E{static styles=`
        .top-bar {
            display: flex;
            /* The bar is 48px and one line at every viewport at the default text
               size — measured, not assumed. It is allowed to wrap and grow ONLY
               under text zoom: at 320px with the root font-size at 20px the two
               pills alone are wider than the viewport, and a nowrap row there
               widened the grid track and put a horizontal scrollbar on every
               page in the app. Reflowing to a second line is the degradation
               WCAG 1.4.4/1.4.10 asks for; scrolling the whole document
               sideways is the one it forbids. */
            flex-wrap: wrap;
            align-items: center;
            gap: ${d("sm")} ${d("lg")};
            /* min-height, not height: a fixed height cannot contain a second row
               and would overlap the page instead. */
            padding: ${d("xs")} ${d("xl")};
            min-height: 48px;
            background: ${a("surface")};
            border-bottom: 1px solid ${a("border")};
            color: ${a("text")};

            & .top-bar__logo {
                font-weight: 700;
                font-size: 0.875rem;
                letter-spacing: 0.05em;
                text-transform: uppercase;
                white-space: nowrap;
                color: ${a("text-muted")};
            }

            /* Measured, not estimated: "LINDGREN EQUESTRIAN" is 178px set at
               0.875rem/uppercase/.05em, and a phone bar has 253px of its 327px
               of content width already spoken for by the menu trigger (32),
               the theme pill (97), the sign-out pill (76) and the gaps. The
               wordmark overflows by 120px at 375px and by 165px at 320px — it
               does not fit at ANY type size that is still legible, and a
               shorter mark does not close a gap that large either. It returns
               at the 640px breakpoint, where it fits with room to spare.
               Dropping it is the only option the arithmetic leaves; the tab
               title and the /login and /register wordmarks carry the name. */
            @media (max-width: 639px) {
                & .top-bar__logo { display: none; }
            }

            /* The page name. Takes the slack in the row, which is what it was
               already doing as an empty spacer — the difference is that it now
               says something.

               min-width:0 and the ellipsis are load-bearing, not polish. A flex
               item's default min-width is auto, i.e. it refuses to shrink below
               its text, and the bar's own measurements (see the wordmark note
               above) leave no spare room at 320px. Without these a long name
               would push the row wider than the viewport and put a horizontal
               scrollbar on every page — the exact WCAG 1.4.10 failure the
               flex-wrap rule above exists to avoid. Allowed to shrink to
               nothing, it can only ever give space back.

               They are still needed at >=640px, where the title DOES render:
               "Träningspass" against a narrow 640px bar is the case that would
               otherwise widen the row. */
            & .top-bar__title {
                flex: 1;
                min-width: 0;
                overflow: hidden;
                white-space: nowrap;
                text-overflow: ellipsis;
                font-family: ${a("font-ui")};
                font-size: 0.875rem;
                font-weight: 600;
                color: ${a("text")};
            }

            /* Below 640px the title is not shortened, it is DELETED — and the
               reason is arithmetic, not taste.

               "Allowed to shrink to nothing" is exactly what happens here.
               Measured across 18 viewport x root-font-size x locale
               combinations, the title is clipped in 17 of them; the single
               exception (414px / 16px / sv) fits by 0.3px. At 320px/16px the
               track resolves to 17.7px — one glyph and an ellipsis. At
               375px/20px it is 6.3px, which is not even that. A name rendered
               as "T…" is not a shorter name, it is noise occupying the row.

               This does NOT leave the page unnamed, and the older justification
               that said it would ("below 1024px the sidebar is gone, so the bar
               is the only page indicator") was simply wrong on the facts. The
               sidebar highlight indicates position in the NAV; the page's own
               <h1> names the PAGE, and on a phone that <h1> is the first thing
               under the bar. Every routed destination renders one: most render
               it directly, and the four detail views render it through
               DetailHeaderComponent, whose headingLevel defaults to 1.
               (/inbox and /invitations were the two exceptions and titled
               themselves <h2>; both were promoted to <h1> alongside this
               change, precisely because this rule depends on the claim.
               page-title.dom.test.ts now pins it for every route.)

               So the bar's title is redundant everywhere and illegible here. It
               is kept at >=640px, where it fits with room to spare and earns
               its place as a second, persistent orientation cue that survives
               scrolling the <h1> off screen. */
            @media (max-width: 639px) {
                & .top-bar__title { display: none; }
                /* The title was also the row's spacer — it is the flex:1 item
                   that pushes the two pills to the trailing edge. Removing it
                   would collapse them leftwards against the menu trigger, so
                   the spacing moves to the first pill rather than disappearing
                   with the element that happened to be providing it. */
                & .top-bar__theme { margin-left: auto; }
            }

            & .top-bar__menu {
                display: flex;
                align-items: center;
                justify-content: center;
                width: 32px;
                height: 32px;
                margin-left: -${d("sm")};
                padding: 0;
                border: 1px solid ${a("border-strong")};
                border-radius: ${a("radius-sm")};
                background: ${a("surface-2")};
                color: ${a("text")};
                /* A <button> does not inherit the document face — the UA sheet
                   sets its own (Arial). Design system 02: Open Sans does all the
                   work in controls, and the serif is forbidden here outright, so
                   the face is named rather than left to the UA. */
                font-family: ${a("font-ui")};
                cursor: pointer;
                transition: background ${a("dur-fast")} ${a("ease-standard")};

                &:hover { background: ${a("accent-soft")}; }
                &:focus-visible {
                    outline: 2px solid ${a("accent")};
                    outline-offset: 2px;
                }
            }

            & .top-bar__menu-glyph {
                font-size: 1.125rem;
                line-height: 1;
            }

            & .top-bar__theme, & .top-bar__logout {
                display: inline-flex;
                align-items: center;
                gap: ${d("xs")};
                padding: ${d("xs")} ${d("md")};
                /* Both labels are two words in Swedish ("Ljust läge", "Logga
                   ut"). Allowed to break they wrap INSIDE the pill, which reads
                   as two pills. The bar itself wraps instead — see the
                   flex-wrap note above — so this cannot trap the overflow. */
                white-space: nowrap;
                border: 1px solid ${a("border-strong")};
                border-radius: ${a("radius-pill")};
                background: ${a("surface-2")};
                color: ${a("text")};
                font-family: ${a("font-ui")};
                font-size: 0.8rem;
                cursor: pointer;
                transition: background ${a("dur-fast")} ${a("ease-standard")};

                &:hover { background: ${a("accent-soft")}; }
                &:focus-visible {
                    outline: 2px solid ${a("accent")};
                    outline-offset: 2px;
                }
            }

            /* :empty is the signed-out test for the sign-out button, so the
               button must stay a single text node — the glyph/label split below
               is the theme toggle's alone. */
            & .top-bar__logout:empty { display: none; }

            /* The trigger exists only where the sidebar has collapsed. */
            @media (min-width: 1024px) {
                & .top-bar__menu { display: none; }
            }
        }
    `;app=this.inject(On);auth=this.inject(re);theme=this.inject(Sn);router=this.inject(H);menu;render(){const e=this.wire(Ca,{menu:{onclick:()=>this.app.navOpen.update(t=>!t),"aria-label":()=>o("nav.openMenu"),"aria-expanded":()=>String(this.app.navOpen.get())},logo:()=>o("app.brand"),title:()=>{const t=this.app.titleKey.get();return t===null?"":o(t)},theme:{onclick:()=>this.theme.toggle()},themeGlyph:()=>this.theme.dark.get()?"☀":"☾",themeLabel:()=>this.theme.dark.get()?o("topBar.theme.toLight"):o("topBar.theme.toDark"),logout:{onclick:async()=>{await this.auth.logout(),this.router.navigate("/login",!0)},textContent:()=>this.auth.currentUser.get()?o("topBar.signOut"):""}});return this.menu=this.ref(e,"menu"),e}onMount(){let e=!1;this.track(w(()=>{const t=this.app.navOpen.get();e&&!t&&this.menu.focus(),e=t}))}}function Ea(n){return{async register(e){return x({method:"POST",url:`${n}/auth/register`,body:e})}}}function Ia(n){return{async changePassword(e){return x({method:"POST",url:`${n}/account/password`,body:e})}}}function Ta(n){return{async create(e){return x({method:"POST",url:`${n}/invitations`,body:e})},async revoke(e){return x({method:"POST",url:`${n}/invitations/revoke`,body:e})},async list(){return x({method:"GET",url:`${n}/invitations`})},async inbox(){return x({method:"GET",url:`${n}/invitations/inbox`})},async accept(e){return x({method:"POST",url:`${n}/invitations/accept`,body:e})},async decline(e){return x({method:"POST",url:`${n}/invitations/decline`,body:e})}}}function Na(n){return{async list(){return x({method:"GET",url:`${n}/students`})},async get(e){const t=new Set(["id"]),s=new URLSearchParams;for(const[r,l]of Object.entries(e))!t.has(r)&&l!==void 0&&s.set(r,String(l));const i=s.toString();return x({method:"GET",url:`${n}/students/${e.id}${i?"?"+i:""}`})},async listHorses(e){const t=new Set(["id"]),s=new URLSearchParams;for(const[r,l]of Object.entries(e))!t.has(r)&&l!==void 0&&s.set(r,String(l));const i=s.toString();return x({method:"GET",url:`${n}/students/${e.id}/horses${i?"?"+i:""}`})},async listPlans(e){const t=new Set(["id"]),s=new URLSearchParams;for(const[r,l]of Object.entries(e))!t.has(r)&&l!==void 0&&s.set(r,String(l));const i=s.toString();return x({method:"GET",url:`${n}/students/${e.id}/plans${i?"?"+i:""}`})},async listGoals(e){const t=new Set(["id"]),s=new URLSearchParams;for(const[r,l]of Object.entries(e))!t.has(r)&&l!==void 0&&s.set(r,String(l));const i=s.toString();return x({method:"GET",url:`${n}/students/${e.id}/goals${i?"?"+i:""}`})},async listTrainingSessions(e){const t=new Set(["id"]),s=new URLSearchParams;for(const[r,l]of Object.entries(e))!t.has(r)&&l!==void 0&&s.set(r,String(l));const i=s.toString();return x({method:"GET",url:`${n}/students/${e.id}/training-sessions${i?"?"+i:""}`})},async exerciseHistory(e){const t=new Set(["id","exerciseId"]),s=new URLSearchParams;for(const[r,l]of Object.entries(e))!t.has(r)&&l!==void 0&&s.set(r,String(l));const i=s.toString();return x({method:"GET",url:`${n}/students/${e.id}/exercises/${e.exerciseId}/history${i?"?"+i:""}`})}}}function La(n){return{async create(e){return x({method:"POST",url:`${n}/exercises`,body:e})},async list(){return x({method:"GET",url:`${n}/exercises`})},async listForStudent(){return x({method:"GET",url:`${n}/exercises/for-student`})},async get(e){const t=new Set(["id"]),s=new URLSearchParams;for(const[r,l]of Object.entries(e))!t.has(r)&&l!==void 0&&s.set(r,String(l));const i=s.toString();return x({method:"GET",url:`${n}/exercises/${e.id}${i?"?"+i:""}`})},async update(e){const t=new Set(["id"]),s={};for(const[i,r]of Object.entries(e))t.has(i)||(s[i]=r);return x({method:"PATCH",url:`${n}/exercises/${e.id}`,body:s})},async delete(e){return x({method:"DELETE",url:`${n}/exercises/${e.id}`})}}}function Aa(n){return{async create(e){return x({method:"POST",url:`${n}/horses`,body:e})},async list(){return x({method:"GET",url:`${n}/horses`})},async get(e){const t=new Set(["id"]),s=new URLSearchParams;for(const[r,l]of Object.entries(e))!t.has(r)&&l!==void 0&&s.set(r,String(l));const i=s.toString();return x({method:"GET",url:`${n}/horses/${e.id}${i?"?"+i:""}`})},async update(e){const t=new Set(["id"]),s={};for(const[i,r]of Object.entries(e))t.has(i)||(s[i]=r);return x({method:"PATCH",url:`${n}/horses/${e.id}`,body:s})},async delete(e){return x({method:"DELETE",url:`${n}/horses/${e.id}`})}}}function Pa(n){return{async create(e){return x({method:"POST",url:`${n}/lessons`,body:e})},async list(){return x({method:"GET",url:`${n}/lessons`})},async get(e){const t=new Set(["id"]),s=new URLSearchParams;for(const[r,l]of Object.entries(e))!t.has(r)&&l!==void 0&&s.set(r,String(l));const i=s.toString();return x({method:"GET",url:`${n}/lessons/${e.id}${i?"?"+i:""}`})},async addExercise(e){const t=new Set(["id"]),s={};for(const[i,r]of Object.entries(e))t.has(i)||(s[i]=r);return x({method:"POST",url:`${n}/lessons/${e.id}/exercises`,body:s})},async removeExercise(e){return x({method:"DELETE",url:`${n}/lessons/${e.id}/exercises/${e.exerciseId}`})},async listExercises(e){const t=new Set(["id"]),s=new URLSearchParams;for(const[r,l]of Object.entries(e))!t.has(r)&&l!==void 0&&s.set(r,String(l));const i=s.toString();return x({method:"GET",url:`${n}/lessons/${e.id}/exercises${i?"?"+i:""}`})},async transition(e){const t=new Set(["id"]),s={};for(const[i,r]of Object.entries(e))t.has(i)||(s[i]=r);return x({method:"POST",url:`${n}/lessons/${e.id}/transition`,body:s})},async attachProgram(e){const t=new Set(["id"]),s={};for(const[i,r]of Object.entries(e))t.has(i)||(s[i]=r);return x({method:"POST",url:`${n}/lessons/${e.id}/programs`,body:s})},async detachProgram(e){return x({method:"DELETE",url:`${n}/lessons/${e.id}/programs/${e.programId}`})},async update(e){const t=new Set(["id"]),s={};for(const[i,r]of Object.entries(e))t.has(i)||(s[i]=r);return x({method:"PATCH",url:`${n}/lessons/${e.id}`,body:s})}}}function Da(n){return{async create(e){return x({method:"POST",url:`${n}/notes`,body:e})},async list(e){const t=new URLSearchParams;for(const[i,r]of Object.entries(e))r!==void 0&&t.set(i,String(r));const s=t.toString();return x({method:"GET",url:`${n}/notes${s?"?"+s:""}`})},async update(e){const t=new Set(["id"]),s={};for(const[i,r]of Object.entries(e))t.has(i)||(s[i]=r);return x({method:"PATCH",url:`${n}/notes/${e.id}`,body:s})},async delete(e){return x({method:"DELETE",url:`${n}/notes/${e.id}`})}}}function Ha(n){return{async create(e){return x({method:"POST",url:`${n}/training-sessions`,body:e})},async list(){return x({method:"GET",url:`${n}/training-sessions`})},async get(e){const t=new Set(["id"]),s=new URLSearchParams;for(const[r,l]of Object.entries(e))!t.has(r)&&l!==void 0&&s.set(r,String(l));const i=s.toString();return x({method:"GET",url:`${n}/training-sessions/${e.id}${i?"?"+i:""}`})},async update(e){const t=new Set(["id"]),s={};for(const[i,r]of Object.entries(e))t.has(i)||(s[i]=r);return x({method:"PATCH",url:`${n}/training-sessions/${e.id}`,body:s})},async delete(e){return x({method:"DELETE",url:`${n}/training-sessions/${e.id}`})},async addExercise(e){const t=new Set(["id"]),s={};for(const[i,r]of Object.entries(e))t.has(i)||(s[i]=r);return x({method:"POST",url:`${n}/training-sessions/${e.id}/exercises`,body:s})},async removeExercise(e){return x({method:"DELETE",url:`${n}/training-sessions/${e.id}/exercises/${e.exerciseId}`})},async listExercises(e){const t=new Set(["id"]),s=new URLSearchParams;for(const[r,l]of Object.entries(e))!t.has(r)&&l!==void 0&&s.set(r,String(l));const i=s.toString();return x({method:"GET",url:`${n}/training-sessions/${e.id}/exercises${i?"?"+i:""}`})},async attachProgram(e){const t=new Set(["id"]),s={};for(const[i,r]of Object.entries(e))t.has(i)||(s[i]=r);return x({method:"POST",url:`${n}/training-sessions/${e.id}/programs`,body:s})},async detachProgram(e){return x({method:"DELETE",url:`${n}/training-sessions/${e.id}/programs/${e.programId}`})}}}function Oa(n){return{async list(){return x({method:"GET",url:`${n}/teachers`})}}}function za(n){return{async create(e){return x({method:"POST",url:`${n}/programs`,body:e})},async list(){return x({method:"GET",url:`${n}/programs`})},async listForStudent(){return x({method:"GET",url:`${n}/programs/for-student`})},async get(e){const t=new Set(["id"]),s=new URLSearchParams;for(const[r,l]of Object.entries(e))!t.has(r)&&l!==void 0&&s.set(r,String(l));const i=s.toString();return x({method:"GET",url:`${n}/programs/${e.id}${i?"?"+i:""}`})},async update(e){const t=new Set(["id"]),s={};for(const[i,r]of Object.entries(e))t.has(i)||(s[i]=r);return x({method:"PATCH",url:`${n}/programs/${e.id}`,body:s})},async delete(e){return x({method:"DELETE",url:`${n}/programs/${e.id}`})},async listExercises(e){const t=new Set(["id"]),s=new URLSearchParams;for(const[r,l]of Object.entries(e))!t.has(r)&&l!==void 0&&s.set(r,String(l));const i=s.toString();return x({method:"GET",url:`${n}/programs/${e.id}/exercises${i?"?"+i:""}`})},async addExercise(e){const t=new Set(["id"]),s={};for(const[i,r]of Object.entries(e))t.has(i)||(s[i]=r);return x({method:"POST",url:`${n}/programs/${e.id}/exercises`,body:s})},async reorderExercises(e){const t=new Set(["id"]),s={};for(const[i,r]of Object.entries(e))t.has(i)||(s[i]=r);return x({method:"PUT",url:`${n}/programs/${e.id}/exercises/order`,body:s})},async updateExerciseNotes(e){const t=new Set(["id","exerciseId"]),s={};for(const[i,r]of Object.entries(e))t.has(i)||(s[i]=r);return x({method:"PATCH",url:`${n}/programs/${e.id}/exercises/${e.exerciseId}`,body:s})},async removeExercise(e){return x({method:"DELETE",url:`${n}/programs/${e.id}/exercises/${e.exerciseId}`})}}}function ja(n){return{async create(e){return x({method:"POST",url:`${n}/plans`,body:e})},async list(){return x({method:"GET",url:`${n}/plans`})},async get(e){const t=new Set(["id"]),s=new URLSearchParams;for(const[r,l]of Object.entries(e))!t.has(r)&&l!==void 0&&s.set(r,String(l));const i=s.toString();return x({method:"GET",url:`${n}/plans/${e.id}${i?"?"+i:""}`})},async update(e){const t=new Set(["id"]),s={};for(const[i,r]of Object.entries(e))t.has(i)||(s[i]=r);return x({method:"PATCH",url:`${n}/plans/${e.id}`,body:s})},async archive(e){const t=new Set(["id"]),s={};for(const[i,r]of Object.entries(e))t.has(i)||(s[i]=r);return x({method:"POST",url:`${n}/plans/${e.id}/archive`,body:s})}}}function Va(n){return{async create(e){return x({method:"POST",url:`${n}/goals`,body:e})},async list(){return x({method:"GET",url:`${n}/goals`})},async get(e){const t=new Set(["id"]),s=new URLSearchParams;for(const[r,l]of Object.entries(e))!t.has(r)&&l!==void 0&&s.set(r,String(l));const i=s.toString();return x({method:"GET",url:`${n}/goals/${e.id}${i?"?"+i:""}`})},async update(e){const t=new Set(["id"]),s={};for(const[i,r]of Object.entries(e))t.has(i)||(s[i]=r);return x({method:"PATCH",url:`${n}/goals/${e.id}`,body:s})},async abandon(e){const t=new Set(["id"]),s={};for(const[i,r]of Object.entries(e))t.has(i)||(s[i]=r);return x({method:"POST",url:`${n}/goals/${e.id}/abandon`,body:s})},async achieve(e){const t=new Set(["id"]),s={};for(const[i,r]of Object.entries(e))t.has(i)||(s[i]=r);return x({method:"POST",url:`${n}/goals/${e.id}/achieve`,body:s})},async reopen(e){const t=new Set(["id"]),s={};for(const[i,r]of Object.entries(e))t.has(i)||(s[i]=r);return x({method:"POST",url:`${n}/goals/${e.id}/reopen`,body:s})},async share(e){const t=new Set(["id"]),s={};for(const[i,r]of Object.entries(e))t.has(i)||(s[i]=r);return x({method:"POST",url:`${n}/goals/${e.id}/shares`,body:s})},async unshare(e){return x({method:"DELETE",url:`${n}/goals/${e.id}/shares/${e.teacherId}`})},async attachPlan(e){const t=new Set(["id","planId"]),s={};for(const[i,r]of Object.entries(e))t.has(i)||(s[i]=r);return x({method:"POST",url:`${n}/goals/${e.id}/plans/${e.planId}`,body:s})},async detachPlan(e){return x({method:"DELETE",url:`${n}/goals/${e.id}/plans/${e.planId}`})},async listShares(e){const t=new Set(["id"]),s=new URLSearchParams;for(const[r,l]of Object.entries(e))!t.has(r)&&l!==void 0&&s.set(r,String(l));const i=s.toString();return x({method:"GET",url:`${n}/goals/${e.id}/shares${i?"?"+i:""}`})}}}function Fa(n){return{async get(){return x({method:"GET",url:`${n}/dashboard`})}}}function Ra(n){return{async list(){return x({method:"GET",url:`${n}/stables`})},async create(e){return x({method:"POST",url:`${n}/stables`,body:e})},async detail(e){const t=new Set(["stableId"]),s=new URLSearchParams;for(const[r,l]of Object.entries(e))!t.has(r)&&l!==void 0&&s.set(r,String(l));const i=s.toString();return x({method:"GET",url:`${n}/stables/${e.stableId}${i?"?"+i:""}`})},async attachHorse(e){const t=new Set(["stableId"]),s={};for(const[i,r]of Object.entries(e))t.has(i)||(s[i]=r);return x({method:"POST",url:`${n}/stables/${e.stableId}/horses`,body:s})},async detachHorse(e){return x({method:"DELETE",url:`${n}/stables/${e.stableId}/horses/${e.horseId}`})},async invite(e){const t=new Set(["stableId"]),s={};for(const[i,r]of Object.entries(e))t.has(i)||(s[i]=r);return x({method:"POST",url:`${n}/stables/${e.stableId}/invitations`,body:s})},async inbox(){return x({method:"GET",url:`${n}/stable-invitations/inbox`})},async respond(e){const t=new Set(["invitationId"]),s={};for(const[i,r]of Object.entries(e))t.has(i)||(s[i]=r);return x({method:"POST",url:`${n}/stable-invitations/${e.invitationId}/respond`,body:s})},async revoke(e){const t=new Set(["stableId","invitationId"]),s={};for(const[i,r]of Object.entries(e))t.has(i)||(s[i]=r);return x({method:"POST",url:`${n}/stables/${e.stableId}/invitations/${e.invitationId}/revoke`,body:s})},async member(e){const t=new Set(["stableId","userId"]),s={};for(const[i,r]of Object.entries(e))t.has(i)||(s[i]=r);return x({method:"PATCH",url:`${n}/stables/${e.stableId}/members/${e.userId}`,body:s})},async saveType(e){const t=new Set(["stableId"]),s={};for(const[i,r]of Object.entries(e))t.has(i)||(s[i]=r);return x({method:"POST",url:`${n}/stables/${e.stableId}/activity-types`,body:s})}}}function Ma(n){return{async week(e){const t=new Set(["stableId"]),s=new URLSearchParams;for(const[r,l]of Object.entries(e))!t.has(r)&&l!==void 0&&s.set(r,String(l));const i=s.toString();return x({method:"GET",url:`${n}/stables/${e.stableId}/week${i?"?"+i:""}`})},async create(e){const t=new Set(["stableId"]),s={};for(const[i,r]of Object.entries(e))t.has(i)||(s[i]=r);return x({method:"POST",url:`${n}/stables/${e.stableId}/activities`,body:s})},async get(e){const t=new Set(["stableId","activityId"]),s=new URLSearchParams;for(const[r,l]of Object.entries(e))!t.has(r)&&l!==void 0&&s.set(r,String(l));const i=s.toString();return x({method:"GET",url:`${n}/stables/${e.stableId}/activities/${e.activityId}${i?"?"+i:""}`})},async update(e){const t=new Set(["stableId","activityId"]),s={};for(const[i,r]of Object.entries(e))t.has(i)||(s[i]=r);return x({method:"PATCH",url:`${n}/stables/${e.stableId}/activities/${e.activityId}`,body:s})},async remove(e){const t=new Set(["stableId","activityId"]),s={};for(const[i,r]of Object.entries(e))t.has(i)||(s[i]=r);return x({method:"POST",url:`${n}/stables/${e.stableId}/activities/${e.activityId}/delete`,body:s})},async complete(e){const t=new Set(["stableId","activityId"]),s={};for(const[i,r]of Object.entries(e))t.has(i)||(s[i]=r);return x({method:"POST",url:`${n}/stables/${e.stableId}/activities/${e.activityId}/complete`,body:s})},async reopen(e){const t=new Set(["stableId","activityId"]),s={};for(const[i,r]of Object.entries(e))t.has(i)||(s[i]=r);return x({method:"POST",url:`${n}/stables/${e.stableId}/activities/${e.activityId}/reopen`,body:s})},async cancel(e){const t=new Set(["stableId","activityId"]),s={};for(const[i,r]of Object.entries(e))t.has(i)||(s[i]=r);return x({method:"POST",url:`${n}/stables/${e.stableId}/activities/${e.activityId}/cancel`,body:s})},async claim(e){const t=new Set(["stableId","activityId"]),s={};for(const[i,r]of Object.entries(e))t.has(i)||(s[i]=r);return x({method:"POST",url:`${n}/stables/${e.stableId}/activities/${e.activityId}/claim`,body:s})},async log(e){const t=new Set(["stableId","horseId"]),s=new URLSearchParams;for(const[r,l]of Object.entries(e))!t.has(r)&&l!==void 0&&s.set(r,String(l));const i=s.toString();return x({method:"GET",url:`${n}/stables/${e.stableId}/horses/${e.horseId}/log${i?"?"+i:""}`})},async catalog(e){const t=new Set(["stableId"]),s=new URLSearchParams;for(const[r,l]of Object.entries(e))!t.has(r)&&l!==void 0&&s.set(r,String(l));const i=s.toString();return x({method:"GET",url:`${n}/stables/${e.stableId}/catalog${i?"?"+i:""}`})},async training(e){const t=new Set(["stableId","activityId"]),s={};for(const[i,r]of Object.entries(e))t.has(i)||(s[i]=r);return x({method:"POST",url:`${n}/stables/${e.stableId}/activities/${e.activityId}/training`,body:s})}}}function Ba(n){return{async list(e){const t=new Set(["stableId"]),s=new URLSearchParams;for(const[r,l]of Object.entries(e))!t.has(r)&&l!==void 0&&s.set(r,String(l));const i=s.toString();return x({method:"GET",url:`${n}/stables/${e.stableId}/templates${i?"?"+i:""}`})},async save(e){const t=new Set(["stableId"]),s={};for(const[i,r]of Object.entries(e))t.has(i)||(s[i]=r);return x({method:"POST",url:`${n}/stables/${e.stableId}/templates`,body:s})},async apply(e){const t=new Set(["stableId"]),s={};for(const[i,r]of Object.entries(e))t.has(i)||(s[i]=r);return x({method:"POST",url:`${n}/stables/${e.stableId}/templates/apply`,body:s})},async setDefault(e){const t=new Set(["stableId"]),s={};for(const[i,r]of Object.entries(e))t.has(i)||(s[i]=r);return x({method:"PUT",url:`${n}/stables/${e.stableId}/templates/default`,body:s})},async addDay(e){const t=new Set(["stableId"]),s={};for(const[i,r]of Object.entries(e))t.has(i)||(s[i]=r);return x({method:"POST",url:`${n}/stables/${e.stableId}/days`,body:s})},async routines(e){const t=new Set(["stableId"]),s={};for(const[i,r]of Object.entries(e))t.has(i)||(s[i]=r);return x({method:"POST",url:`${n}/stables/${e.stableId}/routines`,body:s})},async copy(e){const t=new Set(["stableId"]),s={};for(const[i,r]of Object.entries(e))t.has(i)||(s[i]=r);return x({method:"POST",url:`${n}/stables/${e.stableId}/copy`,body:s})}}}const J="/teacher-student/".replace(/\/+$/,"")+"/api",v={register:Ea(J),account:Ia(J),invitations:Ta(J),students:Na(J),exercises:La(J),horses:Aa(J),lessons:Pa(J),notes:Da(J),trainingSessions:Ha(J),teachers:Oa(J),programs:za(J),plans:ja(J),goals:Va(J),dashboard:Fa(J),stables:Ra(J),stableActivities:Ma(J),scheduleTemplates:Ba(J)};class ss{items=new m([]);stableItems=new m([]);loading=new m(!1);error=new m(null);pendingCount=new y(()=>this.items.get().length+this.stableItems.get().length);async load(){const e=await $(this.loading,this.error,async()=>{const[t,s]=await Promise.all([v.invitations.inbox(),v.stables.inbox()]);return{teaching:t,stables:s}});e&&(this.items.set(Array.isArray(e.teaching)?e.teaching:[]),this.stableItems.set(Array.isArray(e.stables)?e.stables:[]))}async accept(e){return await $(this.loading,this.error,()=>v.invitations.accept({invitationId:e}))?(this.items.set(this.items.get().filter(s=>s.id!==e)),!0):!1}async decline(e){return await $(this.loading,this.error,()=>v.invitations.decline({invitationId:e}))?(this.items.set(this.items.get().filter(s=>s.id!==e)),!0):!1}async respondStable(e,t){return await $(this.loading,this.error,()=>v.stables.respond({invitationId:e,accept:t}))?(this.stableItems.set(this.stableItems.get().filter(i=>i.id!==e)),!0):!1}}const qa=[{items:[{path:"/home",key:"nav.home"},{path:"/inbox",key:"nav.inbox",badge:"inbox"}]},{labelKey:"nav.group.training",items:[{path:"/lektioner",key:"nav.lessons"},{path:"/traningspass",key:"nav.trainingSessions"}]},{labelKey:"nav.group.planning",items:[{path:"/veckoschema",key:"nav.weeklySchedule"},{path:"/hastlogg",key:"nav.horseLog"},{path:"/planer",key:"nav.plans"},{path:"/mal",key:"nav.goals"},{path:"/hastar",key:"nav.stable"}]},{labelKey:"nav.group.teaching",items:[{path:"/students",key:"nav.students"},{path:"/library",key:"nav.library"}]}],Ga=T(`
    <nav bind="nav" class="nav"></nav>
`),Ka=T(`
    <div class="nav__group">
        <span bind="label" class="nav__group-label"></span>
        <ul bind="links" class="nav__links"></ul>
    </div>
`),Wa=T(`
    <div class="nav__group">
        <ul bind="links" class="nav__links"></ul>
    </div>
`),Ua=T(`
    <li><a bind="link"></a></li>
`),qs="/konto",Ya=T(`
    <div class="nav__footer">
        <ul class="nav__links">
            <li><a bind="link"></a></li>
        </ul>
    </div>
`),Za=T(`
    <li>
        <a bind="link">
            <span bind="label"></span>
            <span bind="badge" class="nav__badge"></span>
        </a>
    </li>
`);class Gs extends E{static styles=`
        .nav {
            display: flex;
            flex-direction: column;
            gap: ${d("xl")};
            padding: ${d("xl")} ${d("md")};
            background: ${a("surface")};
            /* Navigation is Open Sans territory — the serif is forbidden here. */
            font-family: ${a("font-ui")};

            & .nav__group-label {
                display: block;
                padding: 0 ${d("md")} ${d("sm")};
                font-size: 0.6875rem;
                line-height: 16px;
                font-weight: 700;
                letter-spacing: 0.14em;
                text-transform: uppercase;
                color: ${a("text-muted")};
            }

            & .nav__links {
                display: flex;
                flex-direction: column;
                gap: ${d("xs")};
                margin: 0;
                padding: 0;
                list-style: none;
            }

            & a {
                display: flex;
                align-items: center;
                gap: ${d("sm")};
                padding: ${d("sm")} ${d("md")};
                border-radius: ${a("radius-sm")};
                color: ${a("text")};
                text-decoration: none;
                font-size: 0.875rem;
                cursor: pointer;
                transition: background ${a("dur-fast")} ${a("ease-standard")},
                            color ${a("dur-fast")} ${a("ease-standard")};

                /* No accent on inactive links — spec 4.1 names that as a misuse. */
                &:hover { background: ${a("surface-2")}; }

                &:focus-visible {
                    outline: 2px solid ${a("accent")};
                    outline-offset: 2px;
                }

                /* Active = 2px brass rule + accent-tinted fill. The rule is an
                   inset shadow rather than a border so it costs no layout. */
                &.active {
                    background: ${a("accent-soft")};
                    color: ${a("accent-strong")};
                    font-weight: 600;
                    box-shadow: inset 2px 0 0 ${a("brass-line")};
                }
            }

            & .nav__badge {
                margin-left: auto;
                min-width: 1.25rem;
                padding: 0 ${d("xs")};
                border-radius: ${a("radius-pill")};
                background: ${a("accent")};
                color: ${a("on-accent")};
                font-size: 0.75rem;
                font-variant-numeric: tabular-nums;
                text-align: center;
            }
            & .nav__badge.hidden { display: none; }

            /* The account link is not one of the destinations, so it does not
               read as one: a hairline separates it from the last group, while
               it keeps the same hit target, hover and active states as the
               links above it. It follows the groups rather than being pinned
               to the floor — the nav is content-height in both the sidebar and
               the drawer, so a pinned footer would only be pinned in one of
               them. */
            & .nav__footer {
                padding-top: ${d("md")};
                border-top: 1px solid ${a("border")};
            }
        }
    `;router=this.inject(H);inbox=this.inject(ss);render(){const e=this.wire(Ga,{nav:{"aria-label":()=>o("nav.label")}}),t=this.ref(e,"nav");for(const s of qa)t.appendChild(this.renderGroup(s));return t.appendChild(this.renderFooter()),e}renderFooter(){return this.wireEl(Ya,{link:{...this.navLink(qs),href:qs,textContent:()=>o("account.title")}})}renderGroup(e){const{labelKey:t}=e,s=t?this.wireEl(Ka,{label:()=>o(t),links:{"aria-label":()=>o(t)}}):this.wireEl(Wa,{}),i=this.ref(s,"links");for(const r of e.items)i.appendChild(this.renderItem(r));return s}renderItem(e){return e.badge==="inbox"?this.wireEl(Za,{link:{...this.navLink(e.path),href:e.path},label:()=>o(e.key),badge:{textContent:()=>String(this.inbox.pendingCount.get()),className:()=>this.inbox.pendingCount.get()>0?"nav__badge":"nav__badge hidden","aria-label":()=>q("nav.inboxPending",this.inbox.pendingCount.get())}}):this.wireEl(Ua,{link:{...this.navLink(e.path),href:e.path,textContent:()=>o(e.key)}})}navLink(e){const t=this.router.link(e);return{...t,onclick:s=>{t.onclick(s),this.props.onNavigate?.()}}}}const B=n=>`var(--${n})`,xs=class xs extends E{render(){const e=document.createElement("div");e.className="ui-empty-state";const t=l=>typeof l=="function"?l():l,s=(l,c)=>{typeof c=="function"?this.track(w(()=>{l.textContent=t(c)})):l.textContent=c};if(this.props.ornament!==!1){const l=document.createElement("div");l.className="ui-empty-state__ornament",l.setAttribute("aria-hidden","true"),e.appendChild(l)}const i=document.createElement(`h${this.props.headingLevel??3}`);if(i.className="ui-empty-state__heading",s(i,this.props.heading),e.appendChild(i),this.props.body!==void 0){const l=document.createElement("p");l.className="ui-empty-state__body",s(l,this.props.body),e.appendChild(l)}const r=this.props.action;if(r){const l=document.createElement("button");l.className="ui-empty-state__action",l.setAttribute("type","button"),r.ariaLabel&&l.setAttribute("aria-label",r.ariaLabel),s(l,r.label),l.addEventListener("click",()=>r.onclick()),e.appendChild(l)}return e}};xs.styles=`
        .ui-empty-state {
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
            gap: ${B("space-3")};
            padding: ${B("space-7")} ${B("space-5")};
        }
        /* The brass ornament: a hairline rule, nothing more. No illustration. */
        .ui-empty-state__ornament {
            width: ${B("space-8")};
            height: 1px;
            background: ${B("brass-line")};
            margin-bottom: ${B("space-2")};
        }
        .ui-empty-state__heading {
            margin: 0;
            font-family: ${B("font-display")};
            font-weight: 500;
            font-size: 1.25rem;
            line-height: 1.4;
            color: ${B("text")};
        }
        .ui-empty-state__body {
            margin: 0;
            max-width: 48ch;
            font-family: ${B("font-ui")};
            font-size: 0.9375rem;
            line-height: 1.6;
            color: ${B("text-muted")};
        }
        .ui-empty-state__action {
            margin-top: ${B("space-2")};
            padding: ${B("space-2")} ${B("space-4")};
            border: 1px solid ${B("accent")};
            border-radius: ${B("radius-sm")};
            background: ${B("accent")};
            color: ${B("on-accent")};
            font-family: ${B("font-ui")};
            font-size: 0.875rem;
            font-weight: 600;
            line-height: 1.5;
            cursor: pointer;
            transition: background ${B("dur-fast")} ${B("ease-standard")},
                        border-color ${B("dur-fast")} ${B("ease-standard")};
        }
        .ui-empty-state__action:hover {
            background: ${B("accent-strong")};
            border-color: ${B("accent-strong")};
        }
        .ui-empty-state__action:focus-visible {
            outline: 2px solid ${B("accent")};
            outline-offset: 2px;
        }
    `;let U=xs;class ue{data=new m(null);loading=new m(!1);error=new m(null);resolved=new m(!1);status=new m(void 0);started=!1;async run(e){this.started=!0,this.status.set(void 0);const t=await $(this.loading,this.error,()=>e().catch(s=>{throw s instanceof ye&&this.status.set(s.status),s}));Ce(()=>{this.error.peek()===null&&this.data.set(t),this.resolved.set(!0)})}async runOnce(e){this.started||await this.run(e)}reset(){this.started=!1}isEmpty(e){const t=this.data.get();return this.resolved.get()&&this.error.get()===null&&(t===null||e(t)===0)}}function Xa(n){const e=n==="owner";return{editDetails:e,manageSharing:e,managePlans:e,seeCoWatchers:e,notes:!0}}function Qa(n,e){return{achieve:n==="active",reopen:n!=="active",abandon:e==="owner"&&n!=="abandoned"}}function Ks(n){return n?.code==="conflict"}function ft(n){switch(n){case"active":return{label:()=>o("goal.status.active"),variant:"outline",tone:"info"};case"achieved":return{label:()=>o("goal.status.achieved"),variant:"filled",tone:"success"};case"abandoned":return{label:()=>o("goal.status.abandoned"),variant:"dashed",tone:"neutral",glyph:"✕"}}}function pe(n){if(!n)return null;const e=/^(\d{4})-(\d{2})-(\d{2})$/.exec(n);if(!e)return null;const[t,s,i]=[Number(e[1]),Number(e[2]),Number(e[3])],r=new Date(t,s-1,i);return r.getFullYear()!==t||r.getMonth()!==s-1||r.getDate()!==i?null:r}function Ee(n){const e=pe(n);return e?o("goal.target",{date:G(e,{year:"numeric",month:"long",day:"numeric"})}):null}function Ja(n){if(!n)return null;const e=new Date(n);return Number.isNaN(e.getTime())?null:o("goal.achievedAt",{date:G(e,{year:"numeric",month:"long",day:"numeric"})})}function ns(n,e){if(n.status!=="active")return!1;const t=pe(n.targetDate),s=pe(e);return!t||!s?!1:t.getTime()<s.getTime()}function er(n){return{active:n.filter(e=>e.status==="active"),achieved:n.filter(e=>e.status==="achieved"),abandoned:n.filter(e=>e.status==="abandoned")}}const tr=90;function sr(n,e=tr){const t=(n??"").replace(/\s+/g," ").trim();if(t.length===0)return null;if(t.length<=e)return t;const s=t.slice(0,e),i=s.lastIndexOf(" ");return`${(i>e*.6?s.slice(0,i):s).trimEnd()}…`}const nr=2;function ir(n,e){if(n.length===0)return null;const t=n.map(l=>e.find(c=>c.id===l)?.title).filter(l=>typeof l=="string"&&l.length>0);if(t.length===0)return q("goal.plans.unnamed",n.length);const s=t.slice(0,nr),i=n.length-s.length,r=i>0?`${s.join(", ")} ${o("goal.more",{count:i})}`:s.join(", ");return q("goal.plans.summary",n.length,{names:r})}function Ct(n){return[n.id,n.title,n.status,n.targetDate??"",n.description??"",[...n.planIds].sort().join(","),[...n.sharedTeacherIds].sort().join(",")].join("|")}function ar(n,e){return n.map(t=>({id:t,name:e.find(s=>s.id===t)?.displayName??""}))}function rr(n){return n.seeded?n.next!==n.stored.includes(n.teacherId):!1}function or(n,e){const t=new Set(e);return n.filter(s=>s.status==="active"&&!t.has(s.id))}function zn(n){return n.filter(e=>e.archivedAt===null)}function lr(n,e){const t=zn(n).map(s=>({id:s.id,name:s.name}));return e.horseId&&!t.some(s=>s.id===e.horseId)&&t.push({id:e.horseId,name:e.horseName??e.horseId}),t}function Ws(n){return n.seeded?n.next!==n.stored.includes(n.planId):!1}function dr(n,e){const t=n==="owner",s=e==="active";return{editDetails:t,attachGoals:t&&s,detachGoals:t,archive:t&&s}}function is(n){return n==="archived"?{label:()=>o("plan.status.archived"),variant:"dashed",tone:"neutral"}:{label:()=>o("plan.status.active"),variant:"outline",tone:"info"}}function Ge(n,e){const t=pe(n),s=pe(e),i={year:"numeric",month:"long",day:"numeric"};return t&&s?o("plan.range.both",{start:G(t,i),end:G(s,i)}):t?o("plan.range.from",{start:G(t,i)}):s?o("plan.range.until",{end:G(s,i)}):null}function jn(n,e){const t=pe(n),s=pe(e);return!t||!s?!0:t.getTime()<=s.getTime()}const cr=110;function as(n,e=cr){const t=(n??"").replace(/\s+/g," ").trim();if(t.length===0)return null;if(t.length<=e)return t;const s=t.slice(0,e),i=s.lastIndexOf(" ");return`${(i>e*.6?s.slice(0,i):s).trimEnd()}…`}function bt(n){return n?o("plan.primaryTeacher",{name:n}):null}function hr(n){return{active:n.filter(e=>e.status==="active"),archived:n.filter(e=>e.status==="archived")}}function Us(n){return[n.id,n.title,n.status,n.startDate??"",n.endDate??"",n.description??"",n.primaryTeacherDisplayName??""].join("|")}function ur(n){return{day:G(n,{day:"numeric"}),month:es(n),time:G(n,{hour:"2-digit",minute:"2-digit"})}}function Ys(n){return[Jt(G(n,{weekday:"long",day:"numeric",month:"long"})),G(n,{hour:"2-digit",minute:"2-digit"})].join(" · ")}function pr(n,e){const t=n.filter(i=>i.scheduledAt>=e).slice().sort((i,r)=>i.scheduledAt.localeCompare(r.scheduledAt)),s=n.filter(i=>i.scheduledAt<e).slice().sort((i,r)=>r.scheduledAt.localeCompare(i.scheduledAt));return{upcoming:t,past:s}}function mr(n){return n.slice().sort((e,t)=>t.performedAt.localeCompare(e.performedAt))}function gr(n){return[n.teacherDisplayName,o(`lesson.status.${n.status}`),n.horseName].filter(e=>typeof e=="string"&&e.length>0).join(" · ")}function fr(n){const e=[n.durationMin===null||!Number.isFinite(n.durationMin)?null:q("trainingSession.duration",n.durationMin),n.horseName,as(n.summary,70)].filter(t=>typeof t=="string"&&t.length>0);return e.length===0?null:e.join(" · ")}function br(n,e){const t=new Set(e);return n.filter(s=>s.status!=="abandoned"&&!t.has(s.id))}function _r(n,e){return n.filter(t=>t.planIds.includes(e)).map(t=>t.id)}function vr(n){return n==="owner"?"plan.goals.empty.owner":"plan.goals.empty.teacher"}function rs(n){switch(n){case"planned":return{label:()=>o("lesson.status.planned"),variant:"outline",tone:"info"};case"completed":return{label:()=>o("lesson.status.completed"),variant:"filled",tone:"success"};case"cancelled":return{label:()=>o("lesson.status.cancelled"),variant:"dashed",tone:"neutral",glyph:"✕"}}}function yr(n){return n==="completed"||n==="cancelled"}function xr(n,e){const t=e==="teacher",s=!yr(n);return{transition:t&&s,editDetails:t,editExercises:t&&s,editPrograms:t&&s,notes:!0,lockNotice:t&&!s}}function wr(n){return o(n==="cancelled"?"lesson.locked.cancelled":"lesson.locked.completed")}function kr(n){return n?.code==="conflict"}function Vn(n,e){const t=[],s=[];for(const i of n)(i.scheduledAt>=e?t:s).push(i);return t.sort((i,r)=>i.scheduledAt.localeCompare(r.scheduledAt)),s.sort((i,r)=>r.scheduledAt.localeCompare(i.scheduledAt)),{upcoming:t,past:s}}function Fn(n){return{day:G(n,{day:"numeric"}),month:es(n),time:G(n,{hour:"2-digit",minute:"2-digit"})}}function qe(n){return[Jt(G(n,{weekday:"long",day:"numeric",month:"long"})),G(n,{hour:"2-digit",minute:"2-digit"})].join(" · ")}function $r(n){return n==="teacher"?"student":"teacher"}function ze(n){const[e,...t]=n.programs;return e&&t.length===0?e.title:e?q("lesson.title.programs",n.programs.length):n.exercises.length>0?q("lesson.title.exercises",n.exercises.length):o("lesson.title.plain")}function Rn(n){return n.programs.length===1?[]:n.programs}function os(n){return o("lesson.chip.program",{title:n.title})}function dt(n){return o("lesson.chip.plan",{title:n})}const Cr=3;function Mn(n){if(n.length===0)return o("lesson.exercises.none");const e=n.slice(0,Cr).map(i=>i.name),t=n.length-e.length,s=t>0?`${e.join(", ")} ${o("lesson.more",{count:t})}`:e.join(", ");return q("lesson.exerciseSummary",n.length,{names:s})}function Sr(n){const e=n.notes;return typeof e=="string"&&e.trim().length>0?e.trim():null}function Er(n){return n.slice().sort((e,t)=>e.sortOrder-t.sortOrder)}function Ir(n,e){if(!n.sourceProgramId)return null;const t=e.find(s=>s.id===n.sourceProgramId);return t?o("lesson.exercise.source",{title:t.title}):o("lesson.exercise.sourceGone")}function Bn(n){return n.filter(e=>e.archivedAt===null)}function qn(n){return n.filter(e=>e.status==="active")}function Zs(n){return[n.id,n.status,n.scheduledAt,n.horseName??"",n.planId??"",n.programs.map(e=>e.id).join(","),n.exercises.map(e=>e.id).join(",")].join("|")}function Tr(n,e,t){const s=encodeURIComponent(`/lektioner/${t}`);return`/students/${n}/exercises/${e}/history?from=${s}`}function Nr(n){const e=n==="owner";return{editDetails:e,editSharing:e,editPrograms:e,editExercises:e,remove:e,notes:!0}}function Lr(n){return n?.code==="conflict"}function Ar(n){return n.slice().sort((e,t)=>t.performedAt.localeCompare(e.performedAt))}function Pr(n){return n.slice().sort((e,t)=>e.sortOrder-t.sortOrder)}function Gn(n){return{day:G(n,{day:"numeric"}),month:es(n),time:G(n,{hour:"2-digit",minute:"2-digit"})}}function ct(n){return[Jt(G(n,{weekday:"long",day:"numeric",month:"long"})),G(n,{hour:"2-digit",minute:"2-digit"})].join(" · ")}function ls(n){return n===null||!Number.isFinite(n)?null:q("trainingSession.duration",n)}const Dr=90;function ds(n,e=Dr){const t=(n??"").replace(/\s+/g," ").trim();if(t.length===0)return null;if(t.length<=e)return t;const s=t.slice(0,e),i=s.lastIndexOf(" ");return`${(i>e*.6?s.slice(0,i):s).trimEnd()}…`}const Hr=3;function Or(n){if(n.length===0)return o("trainingSession.exercises.none");const e=n.slice(0,Hr).map(i=>i.name),t=n.length-e.length,s=t>0?`${e.join(", ")} ${o("trainingSession.more",{count:t})}`:e.join(", ");return q("trainingSession.exerciseSummary",n.length,{names:s})}function je(n){const e=ds(n.summary,60);if(e)return e;const[t,...s]=n.programs;return t&&s.length===0?t.title:t?q("trainingSession.title.programs",n.programs.length):n.exercises.length>0?q("trainingSession.title.exercises",n.exercises.length):o("trainingSession.title.plain")}function zr(n){return ds(n.summary,60)?n.programs:n.programs.length===1?[]:n.programs}function Kn(n){return o("trainingSession.chip.program",{title:n.title})}function Wn(n){return o("trainingSession.chip.plan",{title:n})}function jr(n){const e=n.notes;return typeof e=="string"&&e.trim().length>0?e.trim():null}function Vr(n,e){if(!n.sourceProgramId)return null;const t=e.find(s=>s.id===n.sourceProgramId);return t?o("trainingSession.exercise.source",{title:t.title}):o("trainingSession.exercise.sourceGone")}function Kt(n,e){return n.map(t=>({id:t,name:e.find(s=>s.id===t)?.displayName??""}))}function Fr(n,e,t){const s=n.filter(i=>i!==e);return[{id:e,name:t},...s.map(i=>({id:i,name:""}))]}function Rr(n){return!n.seeded||n.teacherCount<=1?!1:[...n.next].sort().join(",")!==[...n.stored].sort().join(",")}function Un(n){return n.filter(e=>e.archivedAt===null)}function Yn(n){return n.filter(e=>e.status==="active")}function Wt(n,e,t,s=new Set){const i=n.filter(h=>!s.has(h.id)),r=new Map;for(const h of i){const u=r.get(h.teacherId)??[];u.push(h),r.set(h.teacherId,u)}const l=[...e.filter(h=>r.has(h.id)).map(h=>h.id),...[...r.keys()].filter(h=>!e.some(u=>u.id===h))],c=[];for(const h of l){const u=r.get(h)??[];if(u.length===0)continue;const p=e.find(b=>b.id===h);c.push({value:`group:${h}`,label:p?p.displayName:o("trainingSession.catalog.unknownTeacher"),disabled:!0});for(const b of u)c.push({value:b.id,label:t(b)})}return c}function Zn(n,e,t,s){const i=new Set(t),r=new Set;for(const l of n){const c=e.find(h=>h.id===l.id)?.teacherId;c&&!i.has(c)&&r.add(c)}return s.filter(l=>r.has(l.id))}function Mr(n){return[n.id,n.performedAt,n.durationMin??"",n.summary??"",n.horseName??"",n.planId??"",n.sharedWithTeacherIds.join(","),n.programs.map(e=>e.id).join(","),n.exercises.map(e=>e.id).join(",")].join("|")}function Xn(n){return`/lektioner/${n}`}function Br(n){return`/planer/${n}`}function Qn(n){return`/mal/${n}`}function qr(n){switch(n.targetKind){case"lesson":return Xn(n.targetId);case"training_session":return`/traningspass/${n.targetId}`;case"goal":return Qn(n.targetId)}}function Gr(n){return n.kind==="lesson"?`/lektioner/${n.id}`:`/traningspass/${n.id}`}const St="/lektioner";function Kr(n){const e=[{kind:"logSession",labelKey:"home.action.logSession",href:"/traningspass/ny"}];return n.teaches&&e.push({kind:"bookLesson",labelKey:"home.action.bookLesson",href:"/lektioner/ny"}),e}function Wr(n,e){if(e.failed||!e.resolved||!n)return"unknown";if(Ur(n))return"ready";if(n.pendingInvitations>0)return"invited";const{teaches:t,rides:s}=n.capabilities;return!t&&!s?"fresh":"ready"}function Ur(n){return n.nextLesson!==null||n.latestFeedback!==null||n.awaitingFeedback.length>0||n.activePlans.length>0||n.goalsNearingTarget.length>0}function Yr(n){const e=[{kind:"nextLesson",lesson:n.nextLesson},{kind:"latestFeedback",feedback:n.latestFeedback}];return(n.awaitingFeedback.length>0||n.capabilities.teaches)&&e.push({kind:"awaitingFeedback",items:n.awaitingFeedback}),(n.activePlans.length>0||n.goalsNearingTarget.length>0)&&e.push({kind:"riding",plans:n.activePlans,goals:n.goalsNearingTarget}),e}function Te(n){switch(n){case"nextLesson":return"home.nextLesson";case"latestFeedback":return"home.feedback";case"awaitingFeedback":return"home.awaiting";case"riding":return"home.riding"}}function Zr(n){return qe(n.scheduledAt)}function Xr(n){return[n.counterpartyDisplayName,n.horseName,n.planTitle].filter(e=>typeof e=="string"&&e.length>0).join(" · ")}function Qr(n){const e=n.exerciseCount-n.exercisePreview.length;return e>0?q("home.nextLesson.exercises.more",e):null}function Jr(n){const e=n.exerciseName??"";switch(n.parentKind){case"lesson":return o("home.feedback.on.lesson",{name:n.targetLabel});case"lesson_exercise":return e?o("home.feedback.on.lessonExercise",{exercise:e,name:n.targetLabel}):o("home.feedback.on.lesson",{name:n.targetLabel});case"training_session":return o("home.feedback.on.trainingSession");case"training_session_exercise":return e?o("home.feedback.on.trainingSessionExercise",{exercise:e}):o("home.feedback.on.trainingSession");case"goal":return o("home.feedback.on.goal",{title:n.targetLabel})}}function eo(n,e){return o("home.feedback.byline",{name:n.authorDisplayName,when:gt(n.createdAt,new Date(e))})}const to=110;function so(n){return as(n,to)}function no(n){return n.kind==="lesson"?o("home.awaiting.lesson",{name:n.studentDisplayName}):o("home.awaiting.session",{name:n.studentDisplayName})}function io(n){return n.kind==="lesson"?qe(n.occurredAt):ct(n.occurredAt)}function ao(n){return q("home.awaiting.count",n.length)}function ro(n){return q("home.plans.count",n.length)}function oo(n){return Ee(n.targetDate)}function lo(n,e){return ns({status:"active",targetDate:n.targetDate},e)}function co(n,e){return lo(n,e)?o("home.goals.overdue"):null}function Xs(n){return q("home.invitations",n)}const Qs="/inbox";function ho(){return[{key:"teach",titleKey:"home.start.teach.title",bodyKey:"home.start.teach.body",actionKey:"home.start.teach.action",href:"/students"},{key:"ride",titleKey:"home.start.ride.title",bodyKey:"home.start.ride.body",actionKey:"home.start.ride.action",href:"/hastar",secondary:{actionKey:"home.start.ride.goal",href:"/mal/nytt"}}]}function uo(n,e){return o("home.updated",{when:gt(n,new Date(e))})}function po(n){switch(n.kind){case"nextLesson":return`nextLesson:${n.lesson?mo(n.lesson):""}`;case"latestFeedback":return`latestFeedback:${n.feedback?go(n.feedback):""}`;case"awaitingFeedback":return`awaitingFeedback:${n.items.map(fo).join("|")}`;case"riding":return["riding",n.plans.map(bo).join("|"),n.goals.map(_o).join("|")].join(":")}}function mo(n){return[n.id,n.scheduledAt,n.counterpartyDisplayName,n.horseName??"",n.planTitle??"",n.exercisePreview.join(","),String(n.exerciseCount)].join("|")}function go(n){return[n.noteId,n.body??"",n.authorDisplayName,n.createdAt,n.targetLabel,n.parentKind,n.exerciseName??"",n.targetKind,n.targetId].join("|")}function fo(n){return[n.kind,n.id,n.occurredAt,n.studentDisplayName,n.horseName??""].join("|")}function bo(n){return[n.id,n.title,n.startDate??"",n.endDate??"",n.primaryTeacherDisplayName??""].join("|")}function _o(n){return[n.id,n.title,n.targetDate].join("|")}const vo=T(`
    <div class="home">
        <header class="home__head">
            <h1 bind="heading" class="home__title"></h1>
            <div bind="actions" class="home__actions"></div>
        </header>

        <p bind="lede" class="home__lede"></p>

        <p bind="loading" class="home__loading"></p>

        <div bind="errorBox" class="home__error" role="alert">
            <p bind="errorText" class="home__error-text"></p>
            <button bind="retry" type="button" class="home__retry"></button>
        </div>

        <div bind="invitedHost" class="home__state"></div>
        <div bind="freshHost" class="home__state"></div>

        <div bind="inviteBanner" class="home__invite">
            <p bind="inviteText" class="home__invite-text"></p>
            <a bind="inviteLink" class="home__action home__action--ghost"></a>
        </div>

        <div bind="cards" class="home__cards"></div>

        <p bind="updated" class="home__updated"></p>
    </div>
`);class Jn extends E{static styles=`
        .home {
            font-family: ${a("font-ui")};

            & .home__head {
                display: flex;
                align-items: baseline;
                justify-content: space-between;
                gap: ${d("lg")};
                flex-wrap: wrap;
                margin-bottom: ${d("md")};
            }

            /* Lora 500, and only 500 — UI_DECISIONS §3. Any other weight
               synthesises bold, and the serif is permitted on h1/h2 only. */
            & .home__title {
                margin: 0;
                font-family: ${a("font-display")};
                font-weight: 500;
                font-size: 1.75rem;
                line-height: 36px;
                color: ${a("text")};
            }

            & .home__actions {
                display: flex;
                align-items: center;
                gap: ${d("sm")};
                flex-wrap: wrap;
            }

            /* Button labels are Open Sans 600, never the serif, in every tier
               (UI_DECISIONS §9). These are anchors because they navigate. */
            & .home__action {
                ${C(a("radius-sm"))}
                text-decoration: none;
                display: inline-flex;
                align-items: center;
            }
            & .home__action--primary { ${C(a("radius-sm"),"primary")} text-decoration: none; }
            & .home__action--ghost {
                ${C(a("radius-sm"),"ghost")}
                text-decoration: none;
                align-self: flex-start;
                padding-left: 0;
                padding-right: 0;
            }
            /* NO :focus-visible override here. btn() already sets
               'outline: none' plus its own focus ring, and a re-declaration at
               equal specificity and later source order beats that 'outline:
               none' — which gave home's actions a ring AND an outline, unlike
               every other btn() in the app. */

            & .home__lede {
                margin: 0 0 ${d("xl")};
                font-size: 0.875rem;
                line-height: 1.6;
                color: ${a("text-muted")};
                max-width: 68ch;
            }
            & .home__lede.hidden { display: none; }

            & .home__loading {
                margin: 0 0 ${d("lg")};
                font-size: 0.875rem;
                color: ${a("text-muted")};
            }
            & .home__loading.hidden { display: none; }

            & .home__error {
                display: flex;
                align-items: center;
                gap: ${d("md")};
                flex-wrap: wrap;
                padding: ${d("md")};
                margin-bottom: ${d("lg")};
                border: 1px solid ${a("danger")};
                border-radius: ${a("radius-md")};
                background: ${a("danger-soft")};

                & .home__error-text { margin: 0; font-size: 0.875rem; color: ${a("text")}; }
                & .home__retry { ${C()} }
            }
            & .home__error.hidden { display: none; }

            & .home__state.hidden { display: none; }

            /* ── The pending-invitation lede (IA §3.17) ────────── */

            /* A banner above the grid, NOT a fifth card: §4.2 caps the grid at
               four and an invitation is a one-line fact with one destination,
               not a block of the dashboard. Deliberately quiet — the plain surface
               and a border, no danger/warning tone — because a waiting
               invitation is an opportunity, not a problem. */
            & .home__invite {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: ${d("md")};
                flex-wrap: wrap;
                padding: ${d("sm")} ${d("md")};
                margin-bottom: ${d("lg")};
                border: 1px solid ${a("border")};
                border-radius: ${a("radius-md")};
                background: ${a("surface")};

                & .home__invite-text {
                    margin: 0;
                    font-size: 0.875rem;
                    color: ${a("text")};
                }
            }
            & .home__invite.hidden { display: none; }

            /* ── The fresh state's two equal paths ─────────────── */

            & .home__start-title {
                margin: 0 0 ${d("md")};
                font-family: ${a("font-display")};
                font-weight: 500;
                font-size: 1.25rem;
                line-height: 28px;
                color: ${a("text")};
            }

            & .home__start {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(15rem, 1fr));
                gap: ${d("md")};
            }

            & .home__panel {
                display: flex;
                flex-direction: column;
                align-items: flex-start;
                gap: ${d("sm")};
                padding: ${d("lg")};
                border: 1px solid ${a("border")};
                border-radius: ${a("radius-md")};
                background: ${a("surface")};
            }
            /* Panel titles are h3 and therefore Open Sans — the serif stops at
               h2 (UI_DECISIONS §3). */
            & .home__panel-title {
                margin: 0;
                font-size: 1rem;
                font-weight: 600;
                color: ${a("text")};
            }
            & .home__panel-body {
                margin: 0;
                font-size: 0.875rem;
                line-height: 1.6;
                color: ${a("text-muted")};
            }

            /* ── The ready state's card grid — design system §4.2 ─ */

            & .home__cards {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(15rem, 1fr));
                gap: ${d("md")};
                align-items: start;
            }
            & .home__cards:empty { display: none; }

            & .home__card {
                display: flex;
                flex-direction: column;
                gap: ${d("xs")};
                padding: ${d("lg")};
                border: 1px solid ${a("border")};
                border-radius: ${a("radius-md")};
                background: ${a("surface")};
                /* card() carries this and every other card surface in the app
                   has it; without it home's grid renders flat beside them. */
                box-shadow: ${a("shadow-1")};
                text-decoration: none;
                color: inherit;
            }
            & a.home__card:hover { border-color: ${a("border-strong")}; }
            & a.home__card:focus-visible { outline: 2px solid ${a("accent")}; outline-offset: 2px; }

            & .home__card-label {
                font-size: 0.6875rem;
                line-height: 16px;
                font-weight: 700;
                letter-spacing: 0.14em;
                text-transform: uppercase;
                color: ${a("text-muted")};
            }
            & .home__card-value {
                font-size: 1rem;
                font-weight: 600;
                color: ${a("text")};
                overflow-wrap: anywhere;
            }
            & .home__card-meta {
                font-size: 0.8125rem;
                color: ${a("text-muted")};
                overflow-wrap: anywhere;
            }
            & .home__card-sublabel {
                margin-top: ${d("sm")};
                font-size: 0.6875rem;
                line-height: 16px;
                font-weight: 700;
                letter-spacing: 0.14em;
                text-transform: uppercase;
                color: ${a("text-muted")};
            }

            & .home__rows {
                list-style: none;
                margin: ${d("xs")} 0 0;
                padding: 0;
                border-top: 1px solid ${a("border")};
            }
            & .home__rows > li { border-bottom: 1px solid ${a("border")}; }

            & .home__row {
                display: flex;
                flex-direction: column;
                gap: 2px;
                padding: ${d("sm")} 0;
                text-decoration: none;
                color: inherit;
                &:hover .home__row-title { color: ${a("accent-strong")}; }
                &:focus-visible { outline: 2px solid ${a("accent")}; outline-offset: 2px; }
            }
            & .home__row-title {
                font-size: 0.875rem;
                font-weight: 600;
                color: ${a("text")};
                overflow-wrap: anywhere;
            }
            & .home__row-meta {
                display: flex;
                align-items: baseline;
                flex-wrap: wrap;
                gap: ${d("xs")} ${d("sm")};
                font-size: 0.8125rem;
                color: ${a("text-muted")};
            }

            /* Overdue is supporting metadata, not a status (IA §3.13), so it is
               a WORD beside the date — never a pill, and never colour alone
               (UI_DECISIONS §7): "Datum passerat" says it in text.
               This is goals.component.ts's .goal-row__overdue verbatim, and
               it must stay that way — the identical fact rendered two ways on
               two pages is the regression to avoid.
               NO BORDER. §7's shape grammar is outline = ongoing, filled =
               completed, DASHED = CANCELLED, so a dashed edge here would render
               an active goal in the vocabulary of an abandoned one. And
               'warning' rather than 'danger' for the same reason
               goals.component.ts chose it: a passed target date is a nudge,
               not a failure. */
            & .home__overdue { color: ${a("warning")}; font-weight: 600; }

            & .home__updated {
                margin: ${d("xl")} 0 0;
                font-size: 0.8125rem;
                color: ${a("text-muted")};
            }
            & .home__updated.hidden { display: none; }
        }
    `;router=this.inject(H);view=new ue;mountedAt=new Date;nowIso=new m(this.mountedAt.toISOString());todayIso=new m(mt(this.mountedAt));state=new y(()=>Wr(this.view.data.get(),{resolved:this.view.resolved.get(),failed:this.view.error.get()!==null}));blocks=new y(()=>{const e=this.view.data.get();return e&&this.state.get()==="ready"?Yr(e):[]});onMount(){this.load()}load(){return this.view.runOnce(()=>v.dashboard.get())}reload(){return this.view.reset(),this.view.run(()=>v.dashboard.get())}render(){const e=this.wire(vo,{heading:{textContent:()=>o("home.title")},lede:{textContent:()=>{const t=this.state.get();return t==="ready"?o("home.lede"):t==="invited"?Xs(this.view.data.get()?.pendingInvitations??0):""},className:()=>{const t=this.state.get();return t==="ready"||t==="invited"?"home__lede":"home__lede hidden"}},loading:{textContent:()=>o("home.loading"),className:()=>this.view.loading.get()&&this.view.data.get()===null?"home__loading":"home__loading hidden"},errorBox:{className:()=>this.view.error.get()?"home__error":"home__error hidden"},errorText:{textContent:()=>o("home.error")},retry:{textContent:()=>o("home.retry"),onclick:()=>{this.reload()}},inviteBanner:{className:()=>this.showInvite()?"home__invite":"home__invite hidden"},inviteText:{textContent:()=>Xs(this.view.data.get()?.pendingInvitations??0)},inviteLink:{textContent:()=>o("home.invitations.cta")},updated:{textContent:()=>{const t=this.view.data.get();return t?uo(t.generatedAt,this.nowIso.get()):""},className:()=>this.state.get()==="ready"?"home__updated":"home__updated hidden"}});return this.wireHref(this.ref(e,"inviteLink"),Qs),this.buildActions(this.ref(e,"actions")),this.buildInvited(this.ref(e,"invitedHost")),this.buildFresh(this.ref(e,"freshHost")),this.$each(this.ref(e,"cards"),this.blocks,(t,s,i)=>this.renderBlock(t,i),po),e}showInvite(){return this.state.get()==="ready"&&(this.view.data.get()?.pendingInvitations??0)>0}buildActions(e){this.track(w(()=>{const t=this.view.data.get();if(!t||this.state.get()!=="ready"){e.replaceChildren();return}e.replaceChildren(...Kr(t.capabilities).map((s,i)=>this.actionLink(s.href,o(s.labelKey),i===0?"home__action home__action--primary":"home__action")))}))}buildInvited(e){const t=new U({heading:()=>o("home.welcome.title"),body:()=>o("home.welcome.body"),action:{label:()=>o("home.invitations.cta"),onclick:()=>this.router.navigate(Qs)},headingLevel:2});t.mount(e),this.track(()=>t.destroy()),this.track(w(()=>{e.className=this.state.get()==="invited"?"home__state":"home__state hidden"}))}buildFresh(e){const t=document.createElement("h2");t.className="home__start-title";const s=document.createElement("div");s.className="home__start";const i=[];for(const r of ho()){const l=document.createElement("section");l.className="home__panel";const c=document.createElement("h3");c.className="home__panel-title";const h=document.createElement("p");h.className="home__panel-body";const u=this.actionLink(r.href,"","home__action");l.append(c,h,u);const p=r.secondary?this.actionLink(r.secondary.href,"","home__action home__action--ghost"):null;p&&l.appendChild(p);const b=r;i.push(()=>{c.textContent=o(b.titleKey),h.textContent=o(b.bodyKey),u.textContent=o(b.actionKey),p&&b.secondary&&(p.textContent=o(b.secondary.actionKey))}),s.appendChild(l)}e.append(t,s),this.track(w(()=>{t.textContent=o("home.start.title");for(const r of i)r()})),this.track(w(()=>{e.className=this.state.get()==="fresh"?"home__state":"home__state hidden"}))}renderBlock(e,t){switch(e.kind){case"nextLesson":return this.renderNextLesson(e.lesson,t);case"latestFeedback":return this.renderFeedback(e.feedback,t);case"awaitingFeedback":return this.renderAwaiting(e.items,t);case"riding":return this.renderRiding(e.plans,e.goals,t)}}renderNextLesson(e,t){if(!e)return this.emptyCard(t,"nextLesson","home.nextLesson.none","home.nextLesson.empty.action",St);const s=this.cardEl(Xn(e.id)),i=Z("home__card-label"),r=Z("home__card-value"),l=Z("home__card-meta"),c=Z("home__card-meta");return s.append(i,r,l,c),t(w(()=>{i.textContent=o(Te("nextLesson")),r.textContent=Zr(e),l.textContent=Xr(e);const h=Qr(e);c.textContent=e.exerciseCount===0?o("home.nextLesson.noExercises"):[e.exercisePreview.join(" · "),h].filter(Boolean).join(" · ")})),s}renderFeedback(e,t){if(!e)return this.emptyCard(t,"latestFeedback","home.feedback.none","home.feedback.empty.action",St);const s=this.cardEl(qr(e)),i=Z("home__card-label"),r=Z("home__card-value"),l=Z("home__card-meta"),c=Z("home__card-meta");return s.append(i,r,l,c),t(w(()=>{i.textContent=o(Te("latestFeedback")),r.textContent=so(e.body)??e.targetLabel,l.textContent=Jr(e),c.textContent=eo(e,this.nowIso.get())})),s}renderAwaiting(e,t){const s=this.cardEl(null),i=Z("home__card-label"),r=Z("home__card-value");s.append(i,r);const l=document.createElement("ul");l.className="home__rows";for(const h of e)l.appendChild(this.row(Gr(h),t,()=>no(h),()=>[io(h),h.horseName]));e.length>0&&s.appendChild(l);const c=this.actionLink(St,"","home__action home__action--ghost");return s.appendChild(c),t(w(()=>{i.textContent=o(Te("awaitingFeedback")),r.textContent=e.length>0?ao(e):o("home.awaiting.none"),c.textContent=o("home.awaiting.all")})),s}renderRiding(e,t,s){const i=this.cardEl(null),r=Z("home__card-label"),l=Z("home__card-value");if(i.append(r,l),e.length>0){const u=document.createElement("ul");u.className="home__rows";for(const p of e)u.appendChild(this.row(Br(p.id),s,()=>p.title,()=>[Ge(p.startDate,p.endDate),bt(p.primaryTeacherDisplayName)]));i.appendChild(u)}const c=Z("home__card-sublabel"),h=Z("home__card-meta");if(i.append(c),t.length>0){const u=document.createElement("ul");u.className="home__rows";for(const p of t)u.appendChild(this.row(Qn(p.id),s,()=>p.title,()=>[oo(p)],()=>co(p,this.todayIso.get())));i.appendChild(u)}else i.appendChild(h);return s(w(()=>{r.textContent=o(Te("riding")),l.textContent=e.length>0?ro(e):o("home.plans.none"),c.textContent=o("home.goals.nearing"),h.textContent=o("home.goals.none")})),i}emptyCard(e,t,s,i,r){const l=this.cardEl(null),c=Z("home__card-label"),h=Z("home__card-value"),u=this.actionLink(r,"","home__action home__action--ghost");return l.append(c,h,u),e(w(()=>{c.textContent=o(Te(t)),h.textContent=o(s),u.textContent=o(i)})),l}cardEl(e){const t=document.createElement(e?"a":"div");return t.className="home__card",e&&this.wireHref(t,e),t}row(e,t,s,i,r){const l=document.createElement("li"),c=document.createElement("a");c.className="home__row",this.wireHref(c,e);const h=Z("home__row-title"),u=Z("home__row-meta");return c.append(h,u),l.appendChild(c),t(w(()=>{h.textContent=s(),u.replaceChildren();for(const b of i())b&&u.appendChild(yo(b));const p=r?.();if(p){const b=Z("home__overdue");b.textContent=p,u.appendChild(b)}})),l}actionLink(e,t,s){const i=document.createElement("a");return i.className=s,i.textContent=t,this.wireHref(i,e),i}wireHref(e,t){e.href=t,e.addEventListener("click",s=>{s.preventDefault(),this.router.navigate(t)})}}function Z(n){const e=document.createElement("span");return e.className=n,e}function yo(n){const e=document.createElement("span");return e.textContent=n,e}const xo=["/login","/register"],wo=["/home","/inbox","/lektioner","/traningspass","/planer","/mal","/hastar","/veckoschema","/hastlogg","/students","/library","/program","/invitations","/konto"],cs="/home",ei="/login";function ti(n,e){return n===e||n.startsWith(e+"/")}function Ut(n){return xo.some(e=>ti(hs(n),e))}function hs(n){return n===""?"/":n}function si(n,e){const t=hs(n);return e?t==="/"||Ut(t)?cs:null:Ut(t)?null:ei}function ko(n,e){return si(n,e)??hs(n)}const ni="returnTo";function $o(n){try{return new URL(n,"https://fixed-point.invalid").pathname===n}catch{return!1}}function ii(n){return typeof n!="string"||n===""||/[?#\\]/.test(n)||/[\u0000-\u0020\u007f]/.test(n)||!n.startsWith("/")||n.startsWith("//")||n.slice(1).split("/").some(e=>e===""||e==="."||e==="..")||!$o(n)||Ut(n)?null:wo.some(e=>ti(n,e))?n:null}function us(n,e){const t=ii(e);return t===null?n:`${n}?${ni}=${encodeURIComponent(t)}`}function ai(n){return ii(new URLSearchParams(n).get(ni))}const ri=`
    .auth {
        width: 100%;
        max-width: 26rem;
        margin: 0 auto;
        display: flex;
        flex-direction: column;
        gap: ${d("xl")};

        /* Submitting freezes the form without clearing it (IA §3.17). */
        &[inert] { opacity: 0.6; }

        & .auth__brand {
            text-align: center;
        }

        /*
         * The one display/versal brand moment. The trailing .18em of tracking
         * hangs off the last letter, so the word reads a hair left of centre;
         * the matching indent puts it back.
         */
        & .auth__wordmark {
            margin: 0;
            font-family: ${a("font-display")};
            font-weight: 500;
            font-size: 22px;
            line-height: 30px;
            letter-spacing: 0.18em;
            text-indent: 0.18em;
            text-transform: uppercase;
            color: ${a("text")};
        }

        & .auth__rule {
            width: 56px;
            height: 1px;
            border: 0;
            margin: ${d("lg")} auto 0;
            background: ${a("brass-line")};
        }

        & .auth__card {
            ${Q()}
            box-sizing: border-box;
            padding: ${d("2xl")} ${d("xl")};
        }

        & .auth__title {
            margin: 0;
            font-family: ${a("font-display")};
            font-weight: 500;
            font-size: 1.75rem;
            line-height: 36px;
            color: ${a("text")};
        }

        & .auth__lede {
            margin: ${d("sm")} 0 0;
            font-family: ${a("font-ui")};
            font-size: 14px;
            line-height: 22px;
            color: ${a("text-muted")};
        }

        /*
         * Form-level failure. Sits above the fields and inside the card so it
         * cannot be mistaken for page chrome. Body text stays --text rather
         * than --danger: a full sentence set in the danger colour on the
         * danger tint is the weakest contrast pairing the palette can produce,
         * and the border plus the tint already carry the signal.
         */
        & .auth__alert {
            display: none;
            margin: ${d("lg")} 0 0;
            padding: ${d("md")};
            border: 1px solid ${a("danger")};
            border-radius: ${a("radius-sm")};
            background: ${a("danger-soft")};
            font-family: ${a("font-ui")};
            font-size: 14px;
            line-height: 22px;
            color: ${a("text")};
        }
        & .auth__alert.is-shown { display: block; }

        & .auth__form {
            display: flex;
            flex-direction: column;
            gap: ${d("lg")};
            margin-top: ${d("xl")};
        }

        & .auth__field {
            display: flex;
            flex-direction: column;
            gap: ${d("xs")};
        }

        & .auth__label { ${ts()} }

        & .auth__input {
            ${K()}
            box-sizing: border-box;
            width: 100%;
            /* 44px of hit target, and 16px so iOS Safari does not zoom on focus. */
            min-height: 44px;
            padding: ${d("sm")} ${d("md")};
            font-size: 16px;
            line-height: 24px;
        }
        /* Invalid state is not carried by colour alone — the field also gets a
           named error message below it, tied to it by aria-describedby. */
        & .auth__input[aria-invalid='true'] {
            border-color: ${a("danger")};
        }

        & .auth__hint {
            margin: 0;
            font-family: ${a("font-ui")};
            font-size: 13px;
            line-height: 20px;
            color: ${a("text-muted")};
        }

        & .auth__error {
            ${Hn()}
            display: none;
        }
        & .auth__error.is-shown { display: block; }
        /* Once a field states its problem, its hint is redundant noise. */
        & .auth__field.is-invalid .auth__hint { display: none; }

        /* §4.8: at most one primary button per form. This is it. */
        & .auth__submit {
            ${C(a("radius-sm"),"primary")}
            width: 100%;
            min-height: 44px;
            padding: ${d("sm")} ${d("lg")};
            font-size: 15px;
            line-height: 24px;
            margin-top: ${d("xs")};
        }

        & .auth__alt {
            margin: 0;
            text-align: center;
            font-family: ${a("font-ui")};
            font-size: 14px;
            line-height: 22px;
            color: ${a("text-muted")};
        }

        & .auth__alt-link {
            color: ${a("accent")};
            font-weight: 600;
            text-decoration: none;
            border-radius: ${a("radius-sm")};
        }
        & .auth__alt-link:hover {
            text-decoration: underline;
            text-underline-offset: 2px;
        }
        & .auth__alt-link:focus-visible {
            outline: 2px solid ${a("accent")};
            outline-offset: 2px;
        }

        /* Phone: the card gives up its side padding and the gaps tighten, so the
           fields keep their width instead of the chrome keeping its margins. */
        @media (max-width: 479px) {
            gap: ${d("lg")};

            & .auth__card {
                padding: ${d("xl")} ${d("lg")};
            }
        }
    }
`,Co=/^[^\s@]+@[^\s@]+\.[^\s@]+$/,oi=8;function li(n){if(n.trim()==="")return"auth.error.emailRequired";if(!Co.test(n.trim()))return"auth.error.emailInvalid"}function Js(n){const e={},t=li(n.email);return t&&(e.email=t),n.password===""&&(e.password="auth.error.passwordRequired"),e}function So(n){const e={},t=li(n.email);return t&&(e.email=t),n.displayName.trim()===""&&(e.displayName="auth.error.displayNameRequired"),n.password===""?e.password="auth.error.passwordRequired":n.password.length<oi&&(e.password="auth.error.passwordTooShort"),e}function di(n){return Object.keys(n).length===0}function Eo(n){switch(n.code){case"auth":case"validation":return"auth.error.credentials";case"rateLimit":return"auth.error.rateLimit";case"network":case"timeout":return"auth.error.network";default:return"auth.error.server"}}function Io(n){switch(n.code){case"conflict":return"auth.error.emailTaken";case"validation":return"auth.error.validation";case"network":case"timeout":return"auth.error.network";default:return"auth.error.server"}}function Ve(n){return n===void 0?"":o(n)}const To=T(`
    <section class="auth" bind="root">
        <header class="auth__brand">
            <p class="auth__wordmark" bind="wordmark"></p>
            <hr class="auth__rule" />
        </header>

        <div class="auth__card">
            <h1 class="auth__title" bind="title"></h1>
            <p class="auth__lede" bind="lede"></p>

            <p class="auth__alert" bind="alert" role="alert"></p>

            <form bind="form" class="auth__form" novalidate>
                <div class="auth__field" bind="emailField">
                    <label class="auth__label" for="auth-email" bind="emailLabel"></label>
                    <input class="auth__input" bind="email" id="auth-email" type="email"
                        autocomplete="email" autocapitalize="none" spellcheck="false"
                        aria-describedby="auth-email-error" />
                    <p class="auth__error" bind="emailError" id="auth-email-error"></p>
                </div>

                <div class="auth__field" bind="passwordField">
                    <label class="auth__label" for="auth-password" bind="passwordLabel"></label>
                    <input class="auth__input" bind="password" id="auth-password" type="password"
                        autocomplete="current-password"
                        aria-describedby="auth-password-error" />
                    <p class="auth__error" bind="passwordError" id="auth-password-error"></p>
                </div>

                <button class="auth__submit" type="submit" bind="submit"></button>
            </form>
        </div>

        <p class="auth__alt">
            <span bind="altPrompt"></span>
            <a class="auth__alt-link" bind="registerLink" href="/register"></a>
        </p>
    </section>
`);class No extends E{static styles=ri;auth=this.inject(re);router=this.inject(H);constructor(){super(),this.auth.error.set(null)}returnTo=ai(this.router.search.peek());email="";password="";fieldErrors=new m({});submitted=!1;inputs={};render(){const e=this.wire(To,{root:{inert:()=>this.auth.loading.get()},wordmark:{textContent:()=>o("app.brand")},title:{textContent:()=>o("auth.login.title")},lede:{textContent:()=>o("auth.login.lede")},alert:{className:()=>this.auth.error.get()?"auth__alert is-shown":"auth__alert",textContent:()=>{const t=this.auth.error.get();return t?o(Eo(t)):""}},form:{onsubmit:t=>{this.onSubmit(t)}},emailLabel:{textContent:()=>o("auth.field.email")},emailField:{className:()=>this.fieldClass("email")},email:{"aria-invalid":()=>String(this.fieldErrors.get().email!==void 0),oninput:t=>{this.email=t.target.value,this.revalidate()}},emailError:{className:()=>this.errorClass("email"),textContent:()=>Ve(this.fieldErrors.get().email)},passwordLabel:{textContent:()=>o("auth.field.password")},passwordField:{className:()=>this.fieldClass("password")},password:{"aria-invalid":()=>String(this.fieldErrors.get().password!==void 0),oninput:t=>{this.password=t.target.value,this.revalidate()}},passwordError:{className:()=>this.errorClass("password"),textContent:()=>Ve(this.fieldErrors.get().password)},submit:{textContent:()=>this.auth.loading.get()?o("auth.login.submitting"):o("auth.login.submit")},altPrompt:{textContent:()=>`${o("auth.login.altPrompt")} `},registerLink:{textContent:()=>o("auth.login.altLink"),onclick:t=>{t.preventDefault(),this.router.navigate(us("/register",this.returnTo??""),!0)}}});return this.inputs={email:this.ref(e,"email"),password:this.ref(e,"password")},e}fieldClass(e){return this.fieldErrors.get()[e]?"auth__field is-invalid":"auth__field"}errorClass(e){return this.fieldErrors.get()[e]?"auth__error is-shown":"auth__error"}revalidate(){this.submitted&&this.fieldErrors.set(Js({email:this.email,password:this.password}))}async onSubmit(e){e.preventDefault(),this.submitted=!0;const t=Js({email:this.email,password:this.password});if(this.fieldErrors.set(t),!di(t)){const i=t.email?"email":"password";this.inputs[i]?.focus();return}await this.auth.login(this.email.trim(),this.password)&&this.router.navigate(this.returnTo??cs,!0)}}class Lo{auth=we.get(re);loading=new m(!1);error=new m(null);async register(e){return await $(this.loading,this.error,()=>v.register.register(e))?(await this.auth.load(),this.auth.currentUser.get()!==null):!1}}const Ao=T(`
    <section class="auth" bind="root">
        <header class="auth__brand">
            <p class="auth__wordmark" bind="wordmark"></p>
            <hr class="auth__rule" />
        </header>

        <div class="auth__card">
            <h1 class="auth__title" bind="title"></h1>
            <p class="auth__lede" bind="lede"></p>

            <p class="auth__alert" bind="alert" role="alert"></p>

            <form bind="form" class="auth__form" novalidate>
                <div class="auth__field" bind="emailField">
                    <label class="auth__label" for="reg-email" bind="emailLabel"></label>
                    <input class="auth__input" bind="email" id="reg-email" type="email"
                        autocomplete="email" autocapitalize="none" spellcheck="false"
                        aria-describedby="reg-email-hint reg-email-error" />
                    <p class="auth__hint" bind="emailHint" id="reg-email-hint"></p>
                    <p class="auth__error" bind="emailError" id="reg-email-error"></p>
                </div>

                <div class="auth__field" bind="displayNameField">
                    <label class="auth__label" for="reg-name" bind="displayNameLabel"></label>
                    <input class="auth__input" bind="displayName" id="reg-name" type="text"
                        autocomplete="name" maxlength="100"
                        aria-describedby="reg-name-hint reg-name-error" />
                    <p class="auth__hint" bind="displayNameHint" id="reg-name-hint"></p>
                    <p class="auth__error" bind="displayNameError" id="reg-name-error"></p>
                </div>

                <div class="auth__field" bind="passwordField">
                    <label class="auth__label" for="reg-password" bind="passwordLabel"></label>
                    <input class="auth__input" bind="password" id="reg-password" type="password"
                        autocomplete="new-password"
                        aria-describedby="reg-password-hint reg-password-error" />
                    <p class="auth__hint" bind="passwordHint" id="reg-password-hint"></p>
                    <p class="auth__error" bind="passwordError" id="reg-password-error"></p>
                </div>

                <button class="auth__submit" type="submit" bind="submit"></button>
            </form>
        </div>

        <p class="auth__alt">
            <span bind="altPrompt"></span>
            <a class="auth__alt-link" bind="loginLink" href="/login"></a>
        </p>
    </section>
`);class Po extends E{static styles=ri;svc=this.inject(Lo);router=this.inject(H);constructor(){super(),this.svc.error.set(null)}returnTo=ai(this.router.search.peek());email="";displayName="";password="";fieldErrors=new m({});submitted=!1;inputs={};render(){const e=this.wire(Ao,{root:{inert:()=>this.svc.loading.get()},wordmark:{textContent:()=>o("app.brand")},title:{textContent:()=>o("auth.register.title")},lede:{textContent:()=>o("auth.register.lede")},alert:{className:()=>this.svc.error.get()?"auth__alert is-shown":"auth__alert",textContent:()=>{const t=this.svc.error.get();return t?o(Io(t)):""}},form:{onsubmit:t=>{this.onSubmit(t)}},emailLabel:{textContent:()=>o("auth.field.email")},emailHint:{textContent:()=>o("auth.hint.email")},emailField:{className:()=>this.fieldClass("email")},email:{"aria-invalid":()=>String(this.fieldErrors.get().email!==void 0),oninput:t=>{this.email=t.target.value,this.revalidate()}},emailError:{className:()=>this.errorClass("email"),textContent:()=>Ve(this.fieldErrors.get().email)},displayNameLabel:{textContent:()=>o("auth.field.displayName")},displayNameHint:{textContent:()=>o("auth.hint.displayName")},displayNameField:{className:()=>this.fieldClass("displayName")},displayName:{"aria-invalid":()=>String(this.fieldErrors.get().displayName!==void 0),oninput:t=>{this.displayName=t.target.value,this.revalidate()}},displayNameError:{className:()=>this.errorClass("displayName"),textContent:()=>Ve(this.fieldErrors.get().displayName)},passwordLabel:{textContent:()=>o("auth.field.password")},passwordHint:{textContent:()=>o("auth.hint.password")},passwordField:{className:()=>this.fieldClass("password")},password:{minlength:oi,"aria-invalid":()=>String(this.fieldErrors.get().password!==void 0),oninput:t=>{this.password=t.target.value,this.revalidate()}},passwordError:{className:()=>this.errorClass("password"),textContent:()=>Ve(this.fieldErrors.get().password)},submit:{textContent:()=>this.svc.loading.get()?o("auth.register.submitting"):o("auth.register.submit")},altPrompt:{textContent:()=>`${o("auth.register.altPrompt")} `},loginLink:{textContent:()=>o("auth.register.altLink"),onclick:t=>{t.preventDefault(),this.router.navigate(us("/login",this.returnTo??""),!0)}}});return this.inputs={email:this.ref(e,"email"),displayName:this.ref(e,"displayName"),password:this.ref(e,"password")},e}fieldClass(e){return this.fieldErrors.get()[e]?"auth__field is-invalid":"auth__field"}errorClass(e){return this.fieldErrors.get()[e]?"auth__error is-shown":"auth__error"}revalidate(){this.submitted&&this.fieldErrors.set(this.validate())}validate(){return So({email:this.email,displayName:this.displayName,password:this.password})}async onSubmit(e){e.preventDefault(),this.submitted=!0;const t=this.validate();if(this.fieldErrors.set(t),!di(t)){const i=["email","displayName","password"];this.inputs[i.find(r=>t[r])]?.focus();return}await this.svc.register({email:this.email.trim(),password:this.password,displayName:this.displayName.trim()})&&this.router.navigate(this.returnTo??cs,!0)}}class ci{items=new m([]);loading=new m(!1);error=new m(null);resolved=new m(!1);async load(){const e=await $(this.loading,this.error,()=>v.invitations.list());e&&this.items.set(e),this.resolved.set(!0)}async create(e){const t=await $(this.loading,this.error,()=>v.invitations.create({inviteeEmail:e}));return t?(this.items.set([t,...this.items.get()]),!0):!1}async revoke(e){const t=await $(this.loading,this.error,()=>v.invitations.revoke({invitationId:e}));t&&t.changed&&this.items.set(this.items.get().map(s=>s.id===e?{...s,status:"revoked"}:s))}}const Do=T(`
    <div class="invitations" bind="root">
        <h1 bind="heading"></h1>

        <form bind="form" class="invitations__form">
            <input bind="email" type="email" autocomplete="email" />
            <button type="submit" bind="submit"></button>
        </form>

        <div class="error" bind="error"></div>

        <ul bind="list" class="invitations__list"></ul>
    </div>
`),Ho=T(`
    <li class="invitations__item">
        <span bind="email" class="invitations__email"></span>
        <span bind="status"></span>
    </li>
`),Oo=T(`
    <button bind="revoke" type="button" class="invitations__revoke"></button>
`);class zo extends E{static styles=`
        .invitations {
            max-width: 640px;

            /* h1, not h2: this is the only heading on a top-level destination,
               so the document would otherwise start at level 2 — and below
               640px, where the top bar drops its page title, this heading is
               the ONLY thing naming the page. 1.5rem keeps the rendering
               identical to the h2 it replaced (the UA default for h2 is
               1.5em of the root); only the semantics changed. */
            & h1 {
                margin: 0 0 ${d("lg")};
                font-size: 1.5rem;
            }

            & .invitations__form {
                display: flex;
                gap: ${d("sm")};
                margin-bottom: ${d("lg")};

                & input {
                    ${K()}
                    flex: 1;
                    padding: ${d("sm")} ${d("md")};
                    font-size: 0.875rem;
                }

                & button {
                    ${C()}
                    padding: ${d("sm")} ${d("lg")};
                    font-size: 0.875rem;
                }
            }

            & .error {
                display: none;
                padding: ${d("sm")} ${d("md")};
                margin-bottom: ${d("md")};
                color: ${a("danger")};
                font-size: 0.875rem;
            }
            & .error.show { display: block; }

            & .invitations__list {
                list-style: none;
                margin: 0;
                padding: 0;
                display: flex;
                flex-direction: column;
                gap: ${d("xs")};
            }

            & .invitations__item {
                display: flex;
                align-items: center;
                gap: ${d("md")};
                padding: ${d("sm")} ${d("md")};
                background: ${a("surface")};
                border-radius: ${a("radius-md")};
            }

            & .invitations__email { flex: 1; font-size: 0.875rem; }

            & .invitations__status {
                font-size: 0.75rem;
                padding: 2px ${d("sm")};
                border-radius: ${a("radius-md")};
                background: ${a("surface-2")};
                color: ${a("text")};
                /* No text-transform: the status used to be the raw enum
                   ('pending'), which uppercasing made presentable. It is now
                   authored copy — "Väntar på svar" — and shouting a whole
                   phrase is not what §4.4 asks a status chip to do. */
            }

            & .invitations__revoke {
                ${C()}
                font-size: 0.75rem;
                padding: ${d("xs")} ${d("sm")};
            }
        }
    `;svc=this.inject(ci);email="";emailInput=null;onMount(){this.svc.load()}render(){const e=this.wire(Do,{root:{inert:()=>this.svc.loading.get()},heading:{textContent:()=>o("invitations.page.heading")},error:{className:()=>this.svc.error.get()?"error show":"error",textContent:()=>{const s=this.svc.error.get();return s?s.code==="conflict"?o("invitations.page.error.conflict"):s.message:""}},form:{onsubmit:async s=>{s.preventDefault(),await this.svc.create(this.email)&&this.emailInput&&(this.email="",this.emailInput.value="")}},email:{placeholder:()=>o("invitations.page.email"),oninput:s=>{this.email=s.target.value}},submit:{textContent:()=>this.svc.loading.get()?o("invitations.page.submitting"):o("invitations.page.submit")}});this.emailInput=this.ref(e,"email");const t=this.ref(e,"list");return this.$each(t,this.svc.items,(s,i,r)=>this.renderItem(s,r),s=>s.id),e}renderItem(e,t){const s=this.wireEl(Ho,{email:{textContent:()=>e.inviteeEmail},status:{textContent:()=>o(`invitations.status.${e.status}`),className:()=>`invitations__status invitations__status--${e.status}`}},t);return e.status==="pending"&&s.appendChild(this.wireEl(Oo,{revoke:{textContent:()=>o("invitations.revoke"),onclick:()=>{this.svc.revoke(e.id)}}},t)),s}}const jo=T(`
    <div class="inbox" bind="root">
        <h1 bind="heading"></h1>
        <div class="error" bind="error"></div>
        <div bind="empty" class="inbox__empty"></div>
        <ul bind="list" class="inbox__list"></ul>
        <ul bind="stableList" class="inbox__list"></ul>
    </div>
`),en=T(`
    <li class="inbox__item">
        <span bind="from" class="inbox__from"></span>
        <button bind="accept" type="button" class="inbox__accept"></button>
        <button bind="decline" type="button" class="inbox__decline"></button>
    </li>
`);class Vo extends E{static styles=`
        .inbox {
            max-width: 640px;

            /* h1, not h2: this is the only heading on a top-level destination,
               so the document would otherwise start at level 2 — and below
               640px, where the top bar drops its page title, this heading is
               the ONLY thing naming the page. 1.5rem keeps the rendering
               identical to the h2 it replaced (the UA default for h2 is
               1.5em of the root); only the semantics changed. */
            & h1 {
                margin: 0 0 ${d("lg")};
                font-size: 1.5rem;
            }

            & .error {
                display: none;
                padding: ${d("sm")} ${d("md")};
                margin-bottom: ${d("md")};
                color: ${a("danger")};
                font-size: 0.875rem;
            }
            & .error.show { display: block; }

            & .inbox__empty {
                padding: ${d("lg")};
                color: ${a("text")};
                opacity: 0.6;
                font-size: 0.875rem;
            }
            & .inbox__empty.hidden { display: none; }

            & .inbox__list {
                list-style: none;
                margin: 0;
                padding: 0;
                display: flex;
                flex-direction: column;
                gap: ${d("xs")};
            }

            & .inbox__item {
                display: flex;
                align-items: center;
                gap: ${d("md")};
                padding: ${d("sm")} ${d("md")};
                background: ${a("surface")};
                border-radius: ${a("radius-md")};
            }

            & .inbox__from { flex: 1; font-size: 0.875rem; }

            & .inbox__accept,
            & .inbox__decline {
                ${C()}
                font-size: 0.75rem;
                padding: ${d("xs")} ${d("sm")};
            }
        }
    `;svc=this.inject(ss);onMount(){this.svc.load()}render(){const e=this.wire(jo,{root:{inert:()=>this.svc.loading.get()},heading:{textContent:()=>o("inbox.heading")},error:{className:()=>this.svc.error.get()?"error show":"error",textContent:()=>{const s=this.svc.error.get();return s?s.code==="conflict"?o("inbox.error.conflict"):s.message:""}},empty:{textContent:()=>o("inbox.empty"),className:()=>this.svc.pendingCount.get()===0?"inbox__empty":"inbox__empty hidden"}}),t=this.ref(e,"list");return this.$each(t,this.svc.items,(s,i,r)=>this.renderItem(s,r),s=>s.id),this.$each(this.ref(e,"stableList"),this.svc.stableItems,(s,i,r)=>this.renderStableItem(s,r),s=>s.id),e}renderItem(e,t){return this.wireEl(en,{from:{textContent:()=>o("inbox.from",{name:e.teacherDisplayName,email:e.teacherEmail})},accept:{textContent:()=>o("inbox.accept"),onclick:()=>{this.svc.accept(e.id)}},decline:{textContent:()=>o("inbox.decline"),onclick:()=>{this.svc.decline(e.id)}}},t)}renderStableItem(e,t){return this.wireEl(en,{from:{textContent:()=>o("schedule.inbox_invitation",{name:e.stableName})},accept:{textContent:()=>o("schedule.accept"),onclick:()=>{this.svc.respondStable(e.id,!0)}},decline:{textContent:()=>o("schedule.decline"),onclick:()=>{this.svc.respondStable(e.id,!1)}}},t)}}const z=n=>`var(--${n})`,ws=class ws extends E{render(){const e=document.createElement("div"),t=(h,u)=>{typeof u=="function"?this.track(w(()=>{h.textContent=u()})):h.textContent=u};this.spawn(Be,e,{open:this.props.open,bg:"rgba(0,0,0,0.4)",zIndex:199,scrollLock:!0,onclose:()=>this.handleCancel()}),this.dialogEl=document.createElement("div"),this.dialogEl.className="ui-confirm",this.dialogEl.style.zIndex="200";const s=document.createElement("h2");s.className="ui-confirm__title",t(s,this.props.title??"Confirm"),this.dialogEl.appendChild(s);const i=document.createElement("p");i.className="ui-confirm__message",t(i,this.props.message),this.dialogEl.appendChild(i);const r=document.createElement("div");r.className="ui-confirm__actions";const l=document.createElement("button");l.className="ui-confirm__btn ui-confirm__btn--cancel",t(l,this.props.cancelLabel??"Cancel"),l.addEventListener("click",h=>{h.stopPropagation(),this.handleCancel()}),r.appendChild(l);const c=document.createElement("button");return c.className=this.props.danger?"ui-confirm__btn ui-confirm__btn--danger":"ui-confirm__btn ui-confirm__btn--confirm",t(c,this.props.confirmLabel??"Confirm"),c.addEventListener("click",h=>{h.stopPropagation(),this.props.open.set(!1),this.props.onconfirm()}),r.appendChild(c),this.dialogEl.appendChild(r),this.dialogEl.addEventListener("click",h=>h.stopPropagation()),e.appendChild(this.dialogEl),this.track(w(()=>{this.dialogEl.classList.toggle("open",this.props.open.get())})),e}handleCancel(){this.props.open.set(!1),this.props.oncancel&&this.props.oncancel()}};ws.styles=`
        .ui-confirm {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) scale(0.95);
            min-width: 320px;
            max-width: 480px;
            background: ${z("surface")};
            border: 1px solid ${z("border")};
            border-radius: ${z("radius-md")};
            box-shadow: ${z("shadow-3")};
            z-index: 200;
            opacity: 0;
            pointer-events: none;
            transition:
                opacity ${z("dur-slow")} ${z("ease-standard")},
                transform ${z("dur-slow")} ${z("ease-standard")};
        }
        .ui-confirm.open {
            opacity: 1;
            pointer-events: auto;
            transform: translate(-50%, -50%) scale(1);
        }
        /* A dialog title is one of the places the serif is allowed (§02). */
        .ui-confirm__title {
            padding: 16px 20px 0;
            margin: 0;
            font-family: ${z("font-display")};
            font-size: 1.25rem;
            font-weight: 500;
            line-height: 1.4;
            color: ${z("text")};
        }
        .ui-confirm__message {
            padding: 12px 20px 20px;
            margin: 0;
            font-family: ${z("font-ui")};
            font-size: 0.9375rem;
            line-height: 1.5;
            color: ${z("text")};
        }
        .ui-confirm__actions {
            display: flex;
            justify-content: flex-end;
            gap: 8px;
            padding: 0 20px 16px;
        }
        /*
         * Buttons are Open Sans territory — the serif is forbidden here (§02).
         *
         * TIERS, not two matching boxes. The pair used to be a --surface-2
         * bordered cancel beside a filled confirm, which is the OS-dialog
         * shape §4.12 names as the thing being fixed: two equally-weighted
         * boxes make the reader stop and compare labels. Cancel is now the
         * ghost tier — no fill, no visible border — so the dialog has exactly
         * one button that looks like a button, and it is the one that acts.
         *
         * The transparent 1px border on the base is load-bearing: it keeps all
         * three variants the same box size, so nothing shifts between them.
         */
        .ui-confirm__btn {
            padding: 9px 20px;
            font-size: 13px;
            line-height: 20px;
            font-family: ${z("font-ui")};
            font-weight: 600;
            border: 1px solid transparent;
            border-radius: ${z("radius-sm")};
            cursor: pointer;
            transition:
                background ${z("dur-fast")} ${z("ease-standard")},
                border-color ${z("dur-fast")} ${z("ease-standard")},
                color ${z("dur-fast")} ${z("ease-standard")},
                box-shadow ${z("dur-fast")} ${z("ease-standard")};
        }
        .ui-confirm__btn:focus-visible {
            outline: none;
            box-shadow: 0 0 0 3px ${z("accent-soft")};
        }
        .ui-confirm__btn--cancel {
            background: transparent;
            color: ${z("text-muted")};
        }
        .ui-confirm__btn--cancel:hover {
            background: ${z("accent-soft")};
            color: ${z("accent")};
        }
        .ui-confirm__btn--confirm {
            background: ${z("accent")};
            color: ${z("on-accent")};
            border-color: ${z("accent")};
            box-shadow: ${z("shadow-1")};
        }
        .ui-confirm__btn--confirm:hover {
            background: ${z("accent-strong")};
            border-color: ${z("accent-strong")};
        }
        /* Outline, filling only on hover — same reasoning as css.ts danger. */
        .ui-confirm__btn--danger {
            background: transparent;
            color: ${z("danger")};
            border-color: ${z("danger")};
        }
        .ui-confirm__btn--danger:hover {
            background: ${z("danger")};
            color: ${z("on-danger")};
        }
    `;let ne=ws;const le=n=>`var(--${n})`,Ne=(n,e)=>`
    .ui-status-pill--${n} { --ui-pill-tone: ${e}; }
`,ks=class ks extends E{render(){const e=this.props.variant??"outline",t=this.props.tone??"neutral",s=document.createElement("span");s.className=`ui-status-pill ui-status-pill--${e} ui-status-pill--${t}`,s.setAttribute("data-variant",e),s.setAttribute("data-tone",t);const i=l=>typeof l=="function"?l():l;if(this.props.glyph!==void 0){const l=document.createElement("span");l.className="ui-status-pill__glyph",l.setAttribute("aria-hidden","true"),typeof this.props.glyph=="function"?this.track(w(()=>{l.textContent=i(this.props.glyph)})):l.textContent=this.props.glyph,s.appendChild(l)}const r=document.createElement("span");return r.className="ui-status-pill__label",typeof this.props.label=="function"?this.track(w(()=>{r.textContent=i(this.props.label)})):r.textContent=this.props.label,s.appendChild(r),s}};ks.styles=`
        .ui-status-pill {
            display: inline-flex;
            align-items: center;
            gap: ${le("space-1")};
            padding: 2px ${le("space-2")};
            border-radius: ${le("radius-pill")};
            font-family: ${le("font-ui")};
            font-size: 0.75rem;
            font-weight: 600;
            line-height: 1.4;
            white-space: nowrap;
            border: 1px solid transparent;
        }
        ${Ne("neutral",le("text-muted"))}
        ${Ne("success",le("success"))}
        ${Ne("warning",le("warning"))}
        ${Ne("danger",le("danger"))}
        ${Ne("info",le("info"))}

        /* Ongoing / future — hairline ring, transparent plate. */
        .ui-status-pill--outline {
            border-color: var(--ui-pill-tone);
            color: var(--ui-pill-tone);
            background: transparent;
        }
        /* Completed — solid plate, no ring. */
        .ui-status-pill--filled {
            border-color: transparent;
            background: var(--ui-pill-tone);
            color: ${le("surface")};
        }
        /* Cancelled — broken ring, transparent plate. */
        .ui-status-pill--dashed {
            border-style: dashed;
            border-color: var(--ui-pill-tone);
            color: var(--ui-pill-tone);
            background: transparent;
        }
        .ui-status-pill__glyph {
            flex-shrink: 0;
            font-size: 0.7rem;
            line-height: 1;
        }
    `;let ie=ks;function hi(n){const e=new Set;return n.filter(t=>{const s=t.id??`name:${t.name}`;return e.has(s)?!1:(e.add(s),!0)})}function _t(n){return hi(n).filter(e=>e.name.trim().length>0)}function ui(n){return new Intl.ListFormat(He(),{style:"long",type:"conjunction"}).format(_t(n).map(e=>e.name))}function pi(n,e=n.length>0){if(!e)return o("share.private");const t=hi(n),s=t.find(r=>r.name.trim().length>0);if(!s)return o("share.sharedUnknown");const i=t.length-1;return i===0?o("share.sharedWith",{name:s.name}):q("share.sharedWithMore",i,{name:s.name})}function Fo(n,e=n.length>0){if(!e)return;const t=_t(n);if(!(t.length<2))return o("share.sharedWithAll",{names:ui(t)})}function Ro(n){return o(n==="teacher"?"role.teacher":"role.student")}function Mo(n){return q("notes.heading",n)}function Bo(n,e){return _t(n).length===0?o("notes.hintNoRecipients"):e?o("notes.hintShared",{names:ui(n)}):o("notes.hintPrivate")}function mi(n){return G(n,{day:"numeric",month:"long",hour:"2-digit",minute:"2-digit"})}const qo="(max-width: 639px)";function Go(n,e,t){return t?[...n,...e]:[...e]}const Et=n=>typeof n=="function"?n():n;class vt extends E{static styles=`
        .person-marker {
            display: inline-flex;
            align-items: baseline;
            gap: ${d("sm")};
            /* Author names are UI text, never the serif (§02). */
            font-family: ${a("font-ui")};
        }

        .person-marker__name {
            font-size: 0.875rem;
            font-weight: 600;
            color: ${a("text")};
        }

        /* Teacher accent / student neutral. The ONLY difference between the two
           roles — same pill, same metrics, same weight. */
        .person-marker--teacher .ui-status-pill {
            --ui-pill-tone: ${a("accent-strong")};
        }
        .person-marker--student .ui-status-pill {
            --ui-pill-tone: ${a("text-muted")};
        }

        .person-marker__role.hidden { display: none; }
    `;role(){return Et(this.props.role)}render(){const e=document.createElement("span");e.className="person-marker";const t=document.createElement("span");t.className="person-marker__name",e.appendChild(t);const s=document.createElement("span");return s.className="person-marker__role",e.appendChild(s),this.spawn(ie,s,{label:()=>Ro(this.role()),variant:"outline"}),this.track(w(()=>{t.textContent=Et(this.props.name)})),this.track(w(()=>{e.className=`person-marker person-marker--${this.role()}`;const i=this.props.showRole===void 0?!0:Et(this.props.showRole);s.className=i?"person-marker__role":"person-marker__role hidden"})),e}}class Ie{items=new m([]);loading=new m(!1);error=new m(null);resolved=new m(!1);async load(){const e=await $(this.loading,this.error,()=>v.students.list());e&&this.items.set(e),this.resolved.set(!0)}async get(e){return await $(this.loading,this.error,()=>v.students.get({id:e}))??null}async exerciseHistory(e,t){return await $(this.loading,this.error,()=>v.students.exerciseHistory({id:e,exerciseId:t}))??null}}const gi=["oversikt","lektioner","pass","planer","mal","hastar","historik"],fi="oversikt";function It(n){return gi.includes(n)?n:fi}const Ko={oversikt:"student.tab.overview",lektioner:"student.tab.lessons",pass:"student.tab.sessions",planer:"student.tab.plans",mal:"student.tab.goals",hastar:"student.tab.horses",historik:"student.tab.history"};function tn(n){return o(Ko[n])}function sn(n,e){return e===fi?`/students/${n}`:`/students/${n}?flik=${e}`}function Wo(n){const e=He();return[...n].sort((t,s)=>t.displayName.localeCompare(s.displayName,e))}function bi(n,e){return n.filter(t=>t.studentId===e&&t.role==="teacher")}function Fe(n,e,t){return bi(n,e).filter(i=>i.status==="planned"&&i.scheduledAt>=t).sort((i,r)=>i.scheduledAt.localeCompare(r.scheduledAt))[0]??null}function Uo(n){return n?o("student.nextLesson",{when:G(n.scheduledAt,{weekday:"long",day:"numeric",month:"long",hour:"2-digit",minute:"2-digit"})}):null}function Yo(n,e){return`${n.id}:${n.displayName}:${n.email}:${e??""}`}function Zo(n){switch(n){case"pending":return{label:()=>o("invitations.status.pending"),variant:"outline",tone:"info"};case"accepted":return{label:()=>o("invitations.status.accepted"),variant:"filled",tone:"success"};case"declined":return{label:()=>o("invitations.status.declined"),variant:"dashed",tone:"neutral",glyph:"✕"};case"revoked":return{label:()=>o("invitations.status.revoked"),variant:"dashed",tone:"neutral",glyph:"✕"};case"expired":return{label:()=>o("invitations.status.expired"),variant:"dashed",tone:"neutral",glyph:"✕"}}}function Xo(n){return n==="pending"}function Qo(n,e=new Date){return o("invitations.sent",{when:gt(n,e)})}function Jo(n){return[...n].sort((e,t)=>{const s=+(t.status==="pending")-+(e.status==="pending");return s!==0?s:t.createdAt.localeCompare(e.createdAt)})}function el(n){return`${n.id}:${n.status}`}const tl=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;function sl(n){const e=n.trim();return e.length===0?o("invite.error.emailRequired"):tl.test(e)?null:o("invite.error.emailInvalid")}function nl(n){return n?.code==="conflict"}function il(n){return o("invite.error.conflict",{email:n.trim()})}function al(n){return n.students>0?"roster":!n.studentsResolved||!n.invitationsResolved?"unknown":n.invitations>0?"invitedOnly":"empty"}function nn(n){return`/lektioner/ny?elev=${encodeURIComponent(n)}`}function rl(n,e,t){return`/students/${n}/exercises/${e}/history?from=${encodeURIComponent(t)}`}function ol(n){return o("student.relation",{email:n})}function ll(n){return n.filter(e=>e.archivedAt===null)}function an(n){return n.filter(e=>e.status==="active")}function dl(n){return n.length}function _i(n){return[...n].sort((e,t)=>t.performedAt.localeCompare(e.performedAt))}function Tt(n){return _i(n)[0]??null}function cl(n){return q("student.overview.planCount",n)}function hl(n){return q("student.overview.goalCount",n)}const vi=5;function ul(n,e,t,s=vi){return[...n.filter(r=>r.scheduledAt<=t).map(r=>({kind:"lesson",id:r.id,at:r.scheduledAt,title:r.title,href:`/lektioner/${r.id}`})),...e.filter(r=>r.performedAt<=t).map(r=>({kind:"session",id:r.id,at:r.performedAt,title:r.title,href:`/traningspass/${r.id}`}))].sort((r,l)=>l.at.localeCompare(r.at)).slice(0,s)}function pl(n){return n.sourcesFailed?"unavailable":n.sourcesAnswered&&n.count===0?"empty":"silent"}function ml(n){return o(n==="lesson"?"objectKind.lesson":"objectKind.trainingSession")}function gl(n,e=new Date){return gt(n,e)}function fl(n){return`${n.kind}:${n.id}:${n.at}`}function bl(n){return n===404}const _l=T(`
    <div class="students">
        <header class="students__head">
            <h1 bind="heading" class="students__title"></h1>
            <button bind="invite" type="button" class="students__invite"></button>
        </header>

        <form bind="form" class="students__form">
            <label class="students__field">
                <span bind="emailLabel" class="students__label"></span>
                <input bind="emailInput" type="email" autocomplete="email" class="students__input">
                <span bind="emailHint" class="students__hint"></span>
            </label>
            <p bind="formError" class="students__form-error" role="alert"></p>
            <div class="students__form-actions">
                <button bind="send" type="submit" class="students__send"></button>
                <button bind="cancel" type="button" class="students__cancel"></button>
            </div>
        </form>

        <p bind="loading" class="students__loading"></p>

        <div bind="errorBox" class="students__error" role="alert">
            <p bind="errorText" class="students__error-text"></p>
            <button bind="retry" type="button" class="students__retry"></button>
        </div>

        <div bind="emptyHost"></div>

        <section bind="rosterSection" class="students__section">
            <ul bind="list" class="students__list"></ul>
        </section>

        <section bind="invitedSection" class="students__section">
            <h2 bind="invitedHeading" class="students__section-title"></h2>
            <p bind="invitedLede" class="students__lede"></p>
            <p bind="invitedLoading" class="students__loading"></p>
            <div bind="invitedErrorBox" class="students__error" role="alert">
                <p bind="invitedErrorText" class="students__error-text"></p>
                <button bind="invitedRetry" type="button" class="students__retry"></button>
            </div>
            <p bind="invitedEmpty" class="students__muted"></p>
            <ul bind="invitedList" class="students__list"></ul>
        </section>

        <div bind="confirmHost"></div>
    </div>
`);class vl extends E{static styles=`
        .students {
            & .students__head {
                display: flex;
                align-items: baseline;
                justify-content: space-between;
                gap: ${d("lg")};
                flex-wrap: wrap;
                margin-bottom: ${d("xl")};
            }

            /* Lora 500, and only 500 — UI_DECISIONS §3. */
            & .students__title {
                margin: 0;
                font-family: ${a("font-display")};
                font-weight: 500;
                font-size: 1.75rem;
                line-height: 36px;
                color: ${a("text")};
            }

            /* Buttons are Open Sans territory; the serif is forbidden here. */
            & .students__invite { ${C(a("radius-sm"),"primary")} }

            /*
             * Already a panel before this change — hand-rolled from the same
             * three properties card() sets. Now it uses the recipe, so it
             * picks up the shared elevation and cannot drift from the panels
             * on the create routes. The panel is also what makes the fields
             * legible: the §4.8 field recipe fills with --bg, so a form drawn
             * straight onto the page would give them the page's own colour.
             */
            & .students__form {
                ${Q()}
                box-sizing: border-box;
                display: none;
                flex-direction: column;
                gap: ${d("md")};
                max-width: 34rem;
                padding: ${d("lg")};
                margin-bottom: ${d("xl")};
                font-family: ${a("font-ui")};
            }
            & .students__form.open { display: flex; }

            & .students__field { display: flex; flex-direction: column; gap: ${d("xs")}; }
            & .students__label { font-size: 0.8125rem; font-weight: 600; color: ${a("text")}; }
            & .students__hint {
                font-size: 0.8125rem;
                line-height: 1.5;
                color: ${a("text-muted")};
                max-width: 68ch;
            }
            & .students__input {
                ${K()}
                width: 100%;
                box-sizing: border-box;
            }
            & .students__form-error {
                margin: 0;
                min-height: 1em;
                font-size: 0.875rem;
                color: ${a("danger")};
            }
            & .students__form-actions { display: flex; gap: ${d("sm")}; flex-wrap: wrap; }
            /* §4.8: one primary per form. This is it. */
            & .students__send { ${C(a("radius-sm"),"primary")} }
            /* Cancel is the ghost tier — not a second bordered button. */
            & .students__cancel { ${C(a("radius-sm"),"ghost")} }

            & .students__loading {
                margin: 0 0 ${d("md")};
                font-family: ${a("font-ui")};
                color: ${a("text-muted")};
                font-size: 0.875rem;
            }
            & .students__loading.hidden { display: none; }

            & .students__muted {
                margin: 0;
                padding: ${d("md")} 0;
                font-family: ${a("font-ui")};
                color: ${a("text-muted")};
                font-size: 0.875rem;
            }
            & .students__muted.hidden { display: none; }

            & .students__error {
                display: flex;
                align-items: center;
                gap: ${d("md")};
                flex-wrap: wrap;
                padding: ${d("md")};
                margin-bottom: ${d("lg")};
                border: 1px solid ${a("danger")};
                border-radius: ${a("radius-md")};
                background: ${a("danger-soft")};
                font-family: ${a("font-ui")};

                & .students__error-text { margin: 0; font-size: 0.875rem; color: ${a("text")}; }
                & .students__retry { ${C()} }
            }
            & .students__error.hidden { display: none; }

            & .students__empty.hidden { display: none; }

            & .students__section { margin-bottom: ${d("xl")}; }
            & .students__section.hidden { display: none; }

            /* Section headings are the serif's other permitted home (§02). */
            & .students__section-title {
                margin: 0 0 ${d("sm")};
                font-family: ${a("font-display")};
                font-weight: 500;
                font-size: 1.25rem;
                line-height: 28px;
                color: ${a("text")};
            }

            & .students__lede {
                margin: 0 0 ${d("md")};
                font-family: ${a("font-ui")};
                font-size: 0.9375rem;
                line-height: 1.6;
                color: ${a("text-muted")};
                max-width: 68ch;
            }
            & .students__lede.hidden { display: none; }

            & .students__list {
                list-style: none;
                margin: 0;
                padding: 0;
                /* No zebra striping (§4.3): rows are separated by a hairline. */
                border-top: 1px solid ${a("border")};
            }
            & .students__list > li { border-bottom: 1px solid ${a("border")}; }

            & .student-row {
                display: grid;
                grid-template-columns: minmax(0, 1fr);
                align-items: center;
                gap: ${d("xs")} ${d("lg")};
                padding: ${d("md")} ${d("sm")};
                text-decoration: none;
                color: inherit;
                font-family: ${a("font-ui")};

                &:hover { background: ${a("surface-2")}; }
                &:focus-visible { outline: 2px solid ${a("accent")}; outline-offset: -2px; }
            }

            & .student-row__body {
                display: flex;
                flex-direction: column;
                gap: ${d("xs")};
                min-width: 0;
            }
            /* One meta line, not three — §4.3 allows at most two rows of text. */
            & .student-row__meta {
                display: flex;
                align-items: baseline;
                flex-wrap: wrap;
                gap: ${d("xs")} ${d("sm")};
                font-size: 0.8125rem;
                color: ${a("text-muted")};
                overflow-wrap: anywhere;
            }

            & .invite-row {
                display: grid;
                grid-template-columns: minmax(0, 1fr) auto auto;
                align-items: center;
                gap: ${d("sm")} ${d("lg")};
                padding: ${d("md")} ${d("sm")};
                font-family: ${a("font-ui")};
            }
            & .invite-row__body {
                display: flex;
                flex-direction: column;
                gap: ${d("xs")};
                min-width: 0;
            }
            & .invite-row__email {
                font-size: 0.9375rem;
                font-weight: 600;
                color: ${a("text")};
                overflow-wrap: anywhere;
            }
            & .invite-row__sent { font-size: 0.8125rem; color: ${a("text-muted")}; }
            /* Revoking an invitation is destructive — the outline tier says so
               without shouting a red fill at a list of pending invites. */
            & .invite-row__revoke {
                ${C(a("radius-sm"),"danger")}
                font-size: 0.8125rem;
            }

            /* UI_DECISIONS §6: single column below 640px. */
            @media (max-width: 639px) {
                & .students__title { font-size: 1.375rem; line-height: 30px; }
                & .students__form-actions { flex-direction: column; align-items: stretch; }
                & .invite-row {
                    grid-template-columns: minmax(0, 1fr);
                    justify-items: start;
                }
            }
        }
    `;router=this.inject(H);students=this.inject(Ie);invitations=this.inject(ci);toasts=this.inject(te);lessons=new ue;nowIso=new m(new Date().toISOString());emailEl=null;formOpen=new m(!1);emailVal=new m("");validation=new m("");revoking=new m(null);confirmOpen=new m(!1);sorted=new y(()=>Wo(this.students.items.get()));invited=new y(()=>Jo(this.invitations.items.get()));state=new y(()=>al({students:this.students.items.get().length,invitations:this.invitations.items.get().length,studentsResolved:this.students.resolved.get()&&this.students.error.get()===null,invitationsResolved:this.invitations.resolved.get()&&this.invitations.error.get()===null}));onMount(){this.students.load(),this.invitations.load(),this.lessons.run(()=>v.lessons.list())}render(){const e=this.wire(_l,{heading:{textContent:()=>o("students.heading")},invite:{textContent:()=>o("students.invite"),onclick:()=>this.openForm(),"aria-expanded":()=>String(this.formOpen.get())},form:{className:()=>this.formOpen.get()?"students__form open":"students__form",onsubmit:s=>{this.submitInvite(s)}},emailLabel:{textContent:()=>o("invite.field.email")},emailHint:{textContent:()=>o("invite.field.email.hint")},emailInput:{value:()=>this.emailVal.get(),oninput:s=>this.emailVal.set(s.target.value)},formError:{textContent:()=>this.formErrorText()},send:{textContent:()=>o("invite.submit"),disabled:()=>this.invitations.loading.get()},cancel:{textContent:()=>o("invite.cancel"),onclick:()=>this.closeForm()},loading:{textContent:()=>o("students.loading"),className:()=>this.students.loading.get()&&this.students.items.get().length===0?"students__loading":"students__loading hidden"},errorBox:{className:()=>this.students.error.get()?"students__error":"students__error hidden"},errorText:{textContent:()=>o("students.error")},retry:{textContent:()=>o("students.retry"),onclick:()=>{this.students.load()}},rosterSection:{className:()=>this.sorted.get().length===0?"students__section hidden":"students__section"},invitedHeading:{textContent:()=>o("invitations.heading")},invitedLede:{textContent:()=>o("students.invitedOnly.body"),className:()=>this.state.get()==="invitedOnly"?"students__lede":"students__lede hidden"},invitedLoading:{textContent:()=>o("invitations.loading"),className:()=>this.invitations.loading.get()&&this.invitations.items.get().length===0?"students__loading":"students__loading hidden"},invitedErrorBox:{className:()=>this.invitations.error.get()&&!this.formOpen.get()?"students__error":"students__error hidden"},invitedErrorText:{textContent:()=>o("invitations.error")},invitedRetry:{textContent:()=>o("students.retry"),onclick:()=>{this.invitations.load()}},invitedEmpty:{textContent:()=>o("invitations.empty"),className:()=>this.invitations.resolved.get()&&this.invitations.error.get()===null&&this.invited.get().length===0?"students__muted":"students__muted hidden"},invitedSection:{className:()=>this.state.get()==="empty"?"students__section hidden":"students__section"}});this.emailEl=this.ref(e,"emailInput"),this.buildEmpty(this.ref(e,"emptyHost")),this.$each(this.ref(e,"list"),this.sorted,(s,i,r)=>this.renderStudent(s,r),s=>Yo(s,this.nextLessonIso(s.id))),this.$each(this.ref(e,"invitedList"),this.invited,(s,i,r)=>this.renderInvitation(s,r),el);const t=this.ref(e,"confirmHost");return this.track(w(()=>{t.toggleAttribute("inert",!this.confirmOpen.get())})),this.spawn(ne,t,{open:this.confirmOpen,title:o("invitations.confirm.title"),message:()=>{const s=this.revoking.get();return s?o("invitations.confirm.message",{email:s.inviteeEmail}):""},confirmLabel:o("invitations.revoke"),cancelLabel:o("invitations.confirm.dismiss"),danger:!0,onconfirm:()=>{this.revokeConfirmed()},oncancel:()=>this.revoking.set(null)}),e}buildEmpty(e){const t=document.createElement("div");t.className="students__empty hidden",e.appendChild(t);const s=new U({heading:()=>o("students.empty.heading"),body:()=>o("students.empty.body"),action:{label:()=>o("students.invite"),onclick:()=>this.openForm()},headingLevel:2});s.mount(t),this.track(()=>s.destroy()),this.track(w(()=>{t.className=this.state.get()==="empty"?"students__empty":"students__empty hidden"}))}openForm(){this.formOpen.set(!0),this.validation.set(""),this.invitations.error.set(null),requestAnimationFrame(()=>this.emailEl?.focus())}closeForm(){this.formOpen.set(!1),this.validation.set(""),this.emailVal.set(""),this.invitations.error.set(null)}formErrorText(){const e=this.validation.get();if(e)return e;const t=this.invitations.error.get();return!t||!this.formOpen.get()?"":nl(t)?il(this.emailVal.get()):o("invite.error.failed")}async submitInvite(e){e.preventDefault();const t=this.emailVal.get().trim(),s=sl(t);if(s)return this.validation.set(s);this.validation.set(""),await this.invitations.create(t)&&(this.toasts.show({message:o("invite.sent",{email:t}),variant:"success"}),this.closeForm())}async revokeConfirmed(){const e=this.revoking.get();if(this.revoking.set(null),!!e){if(await this.invitations.revoke(e.id),this.invitations.error.get()){this.toasts.show({message:o("invitations.revokeError"),variant:"error"});return}this.toasts.show({message:o("invitations.toast.revoked",{email:e.inviteeEmail})})}}nextLessonIso(e){const t=this.lessons.data.get();return t?Fe(t,e,this.nowIso.get())?.scheduledAt??null:null}renderStudent(e,t){const s=document.createElement("li"),i=`/students/${e.id}`,r=document.createElement("a");r.className="student-row",r.href=i,r.addEventListener("click",k=>{k.preventDefault(),this.router.navigate(i)});const l=document.createElement("span");l.className="student-row__body";const c=document.createElement("span");l.appendChild(c);const h=new vt({name:e.displayName,role:"student"});h.mount(c),t(()=>h.destroy());const u=document.createElement("span");u.className="student-row__meta";const p=document.createElement("span");p.textContent=e.email,u.appendChild(p);const b=this.lessons.data.get(),_=Uo(b?Fe(b,e.id,this.nowIso.get()):null);if(_){const k=document.createElement("span");k.textContent=_,u.appendChild(k)}return l.appendChild(u),r.appendChild(l),s.appendChild(r),s}renderInvitation(e,t){const s=document.createElement("li"),i=document.createElement("div");i.className="invite-row";const r=document.createElement("div");r.className="invite-row__body";const l=document.createElement("span");l.className="invite-row__email",l.textContent=e.inviteeEmail;const c=document.createElement("span");c.className="invite-row__sent",c.textContent=Qo(e.createdAt),r.append(l,c),i.appendChild(r);const h=document.createElement("div"),u=Zo(e.status),p=new ie({label:u.label,variant:u.variant,tone:u.tone,...u.glyph===void 0?{}:{glyph:u.glyph}});if(p.mount(h),t(()=>p.destroy()),i.appendChild(h),Xo(e.status)){const b=document.createElement("button");b.type="button",b.className="invite-row__revoke",b.textContent=o("invitations.revoke"),b.addEventListener("click",()=>{this.revoking.set(e),this.confirmOpen.set(!0)}),i.appendChild(b)}return s.appendChild(i),s}}function Nt(n){return typeof n=="object"&&n!==null&&typeof n.get=="function"}const L=n=>`var(--${n})`,rn="http://www.w3.org/2000/svg";function yl(){const n=document.createElementNS(rn,"svg");n.setAttribute("width","12"),n.setAttribute("height","8"),n.setAttribute("viewBox","0 0 12 8"),n.setAttribute("fill","none"),n.setAttribute("aria-hidden","true"),n.setAttribute("focusable","false");const e=document.createElementNS(rn,"path");return e.setAttribute("d","M1 1.5 6 6.5 11 1.5"),e.setAttribute("stroke","currentColor"),e.setAttribute("stroke-width","1.5"),e.setAttribute("stroke-linecap","round"),e.setAttribute("stroke-linejoin","round"),e.setAttribute("fill","none"),n.appendChild(e),n}const Re=class Re extends E{constructor(){super(...arguments),this.uid=`ui-select-${Re.seq++}`,this.open=new m(!1),this.highlightIndex=new m(-1),this.optionEls=[],this.onOutsidePointer=e=>{this.wrapperEl.contains(e.target)||this.open.set(!1)}}get isMulti(){return this.props.multiple===!0}get multi(){return this.props}get single(){return this.props}currentOptions(){return Nt(this.props.options)?this.props.options.get():this.props.options}selectedValues(){if(this.isMulti)return this.multi.values.get();const e=this.single.value.get();return e?[e]:[]}placeholderText(){const e=this.props.placeholder;return(typeof e=="function"?e():e)??""}formatCount(e){return this.multi.countLabel?this.multi.countLabel(e):String(e)}render(){const e=document.createElement("div");e.className="ui-select",this.wrapperEl=e;const t=this.props.zIndex??50,s=this.isMulti;this.triggerEl=document.createElement("button"),this.triggerEl.className="ui-select__trigger",this.triggerEl.setAttribute("type","button"),this.triggerEl.setAttribute("role","combobox"),this.triggerEl.setAttribute("aria-haspopup","listbox");const i=document.createElement("span");i.className="ui-select__trigger-label",this.triggerEl.appendChild(i);const r=document.createElement("span");r.className="ui-select__chevron",r.appendChild(yl()),r.setAttribute("aria-hidden","true"),this.triggerEl.appendChild(r),this.triggerEl.addEventListener("click",c=>{c.stopPropagation(),this.toggle()}),this.triggerEl.addEventListener("keydown",c=>{this.handleTriggerKeydown(c)}),e.appendChild(this.triggerEl),this.dropdownEl=document.createElement("div"),this.dropdownEl.className="ui-select__dropdown",this.dropdownEl.style.zIndex=String(t),this.dropdownEl.addEventListener("keydown",c=>{this.handleDropdownKeydown(c)}),this.listEl=document.createElement("div"),this.listEl.className="ui-select__list",this.listEl.setAttribute("role","listbox"),s&&this.listEl.setAttribute("aria-multiselectable","true"),this.dropdownEl.appendChild(this.listEl),s&&(this.countEl=document.createElement("div"),this.countEl.className="ui-select__count",this.countEl.setAttribute("role","status"),this.countEl.setAttribute("aria-live","polite"),this.dropdownEl.appendChild(this.countEl)),e.appendChild(this.dropdownEl);const l=c=>{this.optionEls=[],this.listEl.textContent="";for(let h=0;h<c.length;h++){const u=c[h],p=document.createElement("button");if(p.className=s?"ui-select__option ui-select__option--multi":"ui-select__option",p.setAttribute("type","button"),p.id=`${this.uid}-opt-${h}`,u.disabled){p.classList.add("ui-select__option--header"),p.disabled=!0,p.setAttribute("role","presentation"),p.setAttribute("aria-disabled","true");const _=document.createElement("span");_.className="ui-select__option-label",_.textContent=u.label,p.appendChild(_),this.listEl.appendChild(p),this.optionEls.push(p);continue}if(p.setAttribute("role","option"),s){const _=document.createElement("span");_.className="ui-select__checkbox",_.setAttribute("aria-hidden","true"),p.appendChild(_)}if(u.icon){const _=document.createElement("span");_.className="ui-select__option-icon",_.textContent=u.icon,p.appendChild(_)}const b=document.createElement("span");if(b.className="ui-select__option-label",b.textContent=u.label,p.appendChild(b),!s){const _=document.createElement("span");_.className="ui-select__check",_.setAttribute("aria-hidden","true"),p.appendChild(_)}p.addEventListener("click",_=>{_.stopPropagation(),this.chooseOption(u.value)}),p.addEventListener("mouseenter",()=>{this.highlightIndex.set(h)}),this.listEl.appendChild(p),this.optionEls.push(p)}};return Nt(this.props.options)?this.track(w(()=>{l(this.currentOptions())})):l(this.props.options),this.track(w(()=>{const c=this.currentOptions(),h=this.selectedValues();if(s){const u=h.length;if(u>0)i.textContent=this.formatCount(u),this.triggerEl.classList.remove("ui-select__trigger--placeholder");else{const p=this.placeholderText();i.textContent=p,this.triggerEl.classList.toggle("ui-select__trigger--placeholder",!!p)}this.countEl&&(this.countEl.textContent=this.formatCount(u))}else{const u=this.single.value.get(),p=c.find(b=>b.value===u);if(p)i.textContent=p.icon?`${p.icon} ${p.label}`:p.label,this.triggerEl.classList.remove("ui-select__trigger--placeholder");else{const b=this.placeholderText();i.textContent=b,this.triggerEl.classList.toggle("ui-select__trigger--placeholder",!!b)}}for(let u=0;u<c.length;u++){const p=this.optionEls[u];if(!p||c[u].disabled)continue;const b=h.includes(c[u].value);p.setAttribute("aria-selected",String(b)),p.classList.toggle("ui-select__option--selected",b);const _=p.querySelector(".ui-select__check");_&&(_.textContent=b?"✓":"");const k=p.querySelector(".ui-select__checkbox");k&&(k.textContent=b?"✓":"")}})),this.track(w(()=>{const c=this.open.get();this.dropdownEl.classList.toggle("open",c),r.classList.toggle("ui-select__chevron--open",c),this.triggerEl.setAttribute("aria-expanded",String(c)),c?document.addEventListener("pointerdown",this.onOutsidePointer,!0):document.removeEventListener("pointerdown",this.onOutsidePointer,!0),c&&j(()=>{const h=this.currentOptions(),u=this.selectedValues(),p=h.findIndex(_=>!_.disabled&&u.includes(_.value)),b=h.findIndex(_=>!_.disabled);this.highlightIndex.set(p>=0?p:b)})})),this.track(w(()=>{const c=this.highlightIndex.get();for(let h=0;h<this.optionEls.length;h++)this.optionEls[h].classList.toggle("ui-select__option--highlighted",h===c);c>=0&&this.optionEls[c]&&(this.triggerEl.setAttribute("aria-activedescendant",`${this.uid}-opt-${c}`),this.optionEls[c].scrollIntoView({block:"nearest"}))})),this.props.disabled!=null&&(Nt(this.props.disabled)?this.track(w(()=>{const c=this.props.disabled.get();this.triggerEl.classList.toggle("ui-select__trigger--disabled",c),this.triggerEl.disabled=c})):this.props.disabled&&(this.triggerEl.classList.add("ui-select__trigger--disabled"),this.triggerEl.disabled=!0)),e}toggle(){this.open.update(e=>!e)}chooseOption(e){if(this.isMulti){const t=this.multi.values.get();this.multi.values.set(t.includes(e)?t.filter(s=>s!==e):[...t,e]);return}Ce(()=>{this.single.value.set(e),this.open.set(!1)}),this.triggerEl.focus()}commitHighlighted(){const e=this.highlightIndex.get(),t=this.currentOptions();e>=0&&e<t.length&&!t[e].disabled&&this.chooseOption(t[e].value)}handleTriggerKeydown(e){switch(e.key){case"Enter":case" ":e.preventDefault(),this.open.get()?this.commitHighlighted():this.open.set(!0);break;case"ArrowDown":e.preventDefault(),this.open.get()?this.moveHighlight(1):this.open.set(!0);break;case"ArrowUp":e.preventDefault(),this.open.get()?this.moveHighlight(-1):this.open.set(!0);break;case"Escape":this.open.get()&&(e.preventDefault(),this.open.set(!1));break}}handleDropdownKeydown(e){switch(e.key){case"ArrowDown":e.preventDefault(),this.moveHighlight(1);break;case"ArrowUp":e.preventDefault(),this.moveHighlight(-1);break;case"Enter":case" ":e.preventDefault(),this.commitHighlighted();break;case"Escape":e.preventDefault(),this.open.set(!1),this.triggerEl.focus();break;case"Tab":this.open.set(!1);break}}moveHighlight(e){const t=this.currentOptions();if(t.length===0||!t.some(i=>!i.disabled))return;let s=this.highlightIndex.get();do s+=e,s<0&&(s=t.length-1),s>=t.length&&(s=0);while(t[s].disabled);this.highlightIndex.set(s)}onDestroy(){document.removeEventListener("pointerdown",this.onOutsidePointer,!0)}};Re.styles=`
        .ui-select {
            position: relative;
            display: inline-block;
        }
        /*
         * Same field base as css.ts input() (§4.9: "same field base", plus a
         * chevron). This is a CUSTOM widget, not a native select, so there is
         * no UA chevron and appearance:none has nothing to suppress — what
         * carries over is the recessed fill, the weighted bottom rule, and the
         * 34px of right padding that the chevron sits in.
         */
        .ui-select__trigger {
            position: relative;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: ${L("space-2")};
            padding: 10px 34px 10px 12px;
            min-width: 160px;
            width: 100%;
            border: 1px solid ${L("border")};
            border-bottom: 2px solid ${L("border-strong")};
            border-radius: ${L("radius-sm")};
            background: ${L("bg")};
            color: ${L("text")};
            font-family: ${L("font-ui")};
            font-size: inherit;
            cursor: pointer;
            text-align: left;
            line-height: 1.5;
            transition:
                border-color ${L("dur-fast")} ${L("ease-standard")},
                box-shadow ${L("dur-fast")} ${L("ease-standard")},
                background ${L("dur-fast")} ${L("ease-standard")};
        }
        .ui-select__trigger:focus-visible {
            outline: none;
            border-color: ${L("accent")};
            background: ${L("surface")};
            box-shadow: 0 0 0 3px ${L("accent-soft")};
        }
        .ui-select__trigger--placeholder {
            color: ${L("text-muted")};
        }
        .ui-select__trigger--disabled {
            opacity: 0.5;
            pointer-events: none;
        }
        .ui-select__trigger-label {
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            flex: 1;
        }
        /*
         * Inline SVG at 1.5px stroke, not a text glyph. The old U+25BE rendered
         * at whatever weight and vertical offset the user's fallback font
         * happened to have; a stroked path matches the hairline weight of the
         * field borders exactly, in every environment.
         *
         * Absolutely positioned and out of the flex flow, so the label can use
         * the full width up to the trigger's 34px right padding. It must not
         * eat pointer events: a click on the chevron is a click on the trigger.
         */
        .ui-select__chevron {
            position: absolute;
            right: 12px;
            top: 50%;
            transform: translateY(-50%);
            display: flex;
            pointer-events: none;
            color: ${L("text-muted")};
            transition: transform ${L("dur-fast")} ${L("ease-standard")};
        }
        /* Keeps the centring translate — a bare rotate() would drop it. */
        .ui-select__chevron--open {
            transform: translateY(-50%) rotate(180deg);
        }
        .ui-select__dropdown {
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            margin-top: 4px;
            min-width: 100%;
            background: ${L("surface")};
            border: 1px solid ${L("border")};
            border-radius: ${L("radius-md")};
            box-shadow: ${L("shadow-2")};
            opacity: 0;
            pointer-events: none;
            transform: scale(0.95);
            transition: opacity ${L("dur-base")} ${L("ease-standard")},
                        transform ${L("dur-base")} ${L("ease-standard")};
        }
        .ui-select__dropdown.open {
            opacity: 1;
            pointer-events: auto;
            transform: scale(1);
        }
        .ui-select__list {
            padding: 4px 0;
            overflow-y: auto;
            max-height: 240px;
        }
        .ui-select__option {
            display: flex;
            align-items: center;
            gap: ${L("space-2")};
            padding: ${L("space-2")} ${L("space-3")};
            cursor: pointer;
            color: ${L("text")};
            font-family: ${L("font-ui")};
            font-size: 0.875rem;
            border: none;
            background: none;
            width: 100%;
            text-align: left;
        }
        .ui-select__option:focus-visible {
            outline: none;
        }
        .ui-select__option--highlighted {
            background: ${L("surface-2")};
        }
        .ui-select__option--selected {
            color: ${L("accent-strong")};
            font-weight: 600;
        }
        /* Multi-select: selection is a checkbox plus an accent-tinted fill,
           never weight and colour alone. */
        .ui-select__option--multi.ui-select__option--selected {
            background: ${L("accent-soft")};
        }
        .ui-select__option--multi.ui-select__option--selected.ui-select__option--highlighted {
            background: ${L("accent-soft")};
            box-shadow: inset 2px 0 0 ${L("accent")};
        }
        .ui-select__checkbox {
            flex-shrink: 0;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 14px;
            height: 14px;
            border: 1px solid ${L("border-strong")};
            border-radius: 3px;
            background: ${L("surface")};
            font-size: 0.625rem;
            line-height: 1;
            color: ${L("on-accent")};
        }
        .ui-select__option--selected .ui-select__checkbox {
            background: ${L("accent")};
            border-color: ${L("accent")};
        }
        .ui-select__option--header {
            cursor: default;
            font-size: 0.7rem;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.04em;
            color: ${L("text-muted")};
            padding-top: 10px;
            padding-bottom: 4px;
        }
        .ui-select__option--header:hover {
            background: none;
        }
        .ui-select__option-icon {
            flex-shrink: 0;
        }
        .ui-select__option-label {
            flex: 1;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        .ui-select__check {
            flex-shrink: 0;
            font-size: 0.75rem;
            color: ${L("accent-strong")};
        }
        .ui-select__count {
            padding: ${L("space-2")} ${L("space-3")};
            border-top: 1px solid ${L("border")};
            font-family: ${L("font-ui")};
            font-size: 0.75rem;
            font-weight: 600;
            color: ${L("text-muted")};
        }
    `,Re.seq=0;let R=Re;const xl=n=>typeof n=="function"?n():n,se=n=>`var(--${n})`,$s=class $s extends E{constructor(){super(...arguments),this.buttons=[]}render(){this.scroller=document.createElement("div"),this.scroller.className="ui-tabs__scroller",this.nav=document.createElement("nav"),this.nav.className="ui-tabs",this.nav.setAttribute("role","tablist");for(const e of this.props.tabs){const t=document.createElement("button");if(t.className="ui-tabs__tab",t.setAttribute("role","tab"),t.setAttribute("data-key",e.key),e.icon){const r=document.createElement("span");r.textContent=e.icon,t.appendChild(r)}const s=document.createElement("span");s.className="ui-tabs__label";const i=()=>{const r=xl(e.label);s.setAttribute("data-label",r),s.textContent=r};typeof e.label=="function"?this.track(w(()=>{i(),this.syncOverflow()})):i(),t.appendChild(s),t.addEventListener("click",()=>{this.props.active.set(e.key)}),this.buttons.push(t),this.nav.appendChild(t)}return this.track(w(()=>{const e=this.props.active.get();for(const t of this.buttons){const s=t.getAttribute("data-key")===e;t.classList.toggle("active",s),t.setAttribute("aria-selected",String(s))}})),this.scroller.appendChild(this.nav),this.wireOverflow(),this.scroller}onMount(){this.syncOverflow(),typeof requestAnimationFrame=="function"&&requestAnimationFrame(()=>this.syncOverflow())}syncOverflow(){const e=this.scroller;e&&(e.classList.toggle("fade-start",e.scrollLeft>1),e.classList.toggle("fade-end",e.scrollLeft+e.clientWidth<e.scrollWidth-1))}wireOverflow(){if(this.scroller.addEventListener("scroll",()=>this.syncOverflow()),typeof window<"u"){const e=()=>this.syncOverflow();window.addEventListener("resize",e),this.track(()=>window.removeEventListener("resize",e))}if(typeof ResizeObserver=="function"){const e=new ResizeObserver(()=>this.syncOverflow());e.observe(this.scroller),e.observe(this.nav),this.track(()=>e.disconnect())}}};$s.styles=`
        /*
         * The row scrolls horizontally in a single line — it never wraps and
         * never degrades into a select — with an edge fade that says which way
         * the overflow runs.
         *
         * The fade is a MASK, not a gradient overlay: an overlay has to know
         * the colour it is fading into, so it breaks on any surface that is not
         * the page background and needs a second definition per theme. A mask
         * reads only alpha, so it is correct on every background in both themes
         * with one rule.
         *
         * The scroller owns the underline, not the nav: the nav is sized to
         * max-content, so a border on it would stop at the last tab rather than
         * spanning the row.
         */
        .ui-tabs__scroller {
            overflow-x: auto;
            overflow-y: hidden;
            scrollbar-width: none;
            border-bottom: 1px solid ${se("border")};
        }
        .ui-tabs__scroller::-webkit-scrollbar { display: none; }
        /*
         * Each edge fades only while there is something past it, so a fade
         * always MEANS "there is more this way" — a permanent one is mere
         * decoration, and a missing one hides a tab. Mid-scroll both paint.
         * The mask colour is irrelevant (only its alpha is read), which is why
         * #000 here is not a token in disguise.
         */
        .ui-tabs__scroller.fade-start.fade-end {
            mask-image: linear-gradient(to right, transparent 0, #000 2rem, #000 calc(100% - 2rem), transparent 100%);
        }
        .ui-tabs__scroller.fade-end:not(.fade-start) {
            mask-image: linear-gradient(to right, #000 0, #000 calc(100% - 2rem), transparent 100%);
        }
        .ui-tabs__scroller.fade-start:not(.fade-end) {
            mask-image: linear-gradient(to right, transparent 0, #000 2rem, #000 100%);
        }
        .ui-tabs {
            display: flex;
            gap: 0;
            flex-wrap: nowrap;
            width: max-content;
            min-width: 100%;
        }
        .ui-tabs__tab {
            white-space: nowrap;
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 8px 16px;
            font-family: ${se("font-ui")};
            font-size: 0.875rem;
            font-weight: 400;
            cursor: pointer;
            border: none;
            border-bottom: 2px solid transparent;
            margin-bottom: -1px;
            background: none;
            color: ${se("text-muted")};
            transition:
                background ${se("dur-base")} ${se("ease-standard")},
                border-color ${se("dur-base")} ${se("ease-standard")},
                color ${se("dur-base")} ${se("ease-standard")};
        }
        .ui-tabs__tab:hover {
            background: ${se("surface-2")};
        }
        .ui-tabs__tab:focus-visible {
            outline: 2px solid ${se("accent")};
            outline-offset: -2px;
        }
        .ui-tabs__tab.active {
            color: ${se("accent")};
            border-bottom-color: ${se("accent")};
            font-weight: 700;
        }
        /*
         * Weight 700 on the active tab would otherwise widen it and shift the
         * whole row on every switch. The label reserves its own bold width up
         * front via a hidden copy, so the row stays still.
         */
        .ui-tabs__label {
            display: inline-flex;
            flex-direction: column;
        }
        .ui-tabs__label::after {
            content: attr(data-label);
            font-weight: 700;
            height: 0;
            overflow: hidden;
            visibility: hidden;
            pointer-events: none;
        }
    `;let ht=$s;const wl=T(`
    <div bind="root" class="elevvy">
        <a bind="back" href="/students" class="elevvy__back"></a>

        <p bind="loading" class="elevvy__loading"></p>

        <div bind="missingHost" class="elevvy__missing"></div>

        <div bind="errorBox" class="elevvy__error" role="alert">
            <p bind="errorText" class="elevvy__error-text"></p>
            <button bind="retry" type="button" class="elevvy__retry"></button>
        </div>

        <div bind="workspace" class="elevvy__workspace">
            <header class="elevvy__head">
                <p bind="eyebrow" class="elevvy__eyebrow"></p>
                <div class="elevvy__title-row">
                    <h1 bind="identity" class="elevvy__identity"></h1>
                    <button bind="book" type="button" class="elevvy__book"></button>
                </div>
                <p bind="relation" class="elevvy__meta"></p>
            </header>

            <div bind="tabsHost"></div>

            <div bind="panels" class="elevvy__panels"></div>
        </div>
    </div>
`),kl=T(`
    <section bind="root" class="elevvy__panel" role="tabpanel">
        <p bind="lede" class="elevvy__lede"></p>
        <p bind="loading" class="elevvy__loading"></p>
        <div bind="errorBox" class="elevvy__error" role="alert">
            <p bind="errorText" class="elevvy__error-text"></p>
            <button bind="retry" type="button" class="elevvy__retry"></button>
        </div>
        <div bind="emptyHost" class="elevvy__empty hidden"></div>
        <div bind="content"></div>
    </section>
`);class $l extends E{static styles=`
        .elevvy {
            font-family: ${a("font-ui")};

            & .elevvy__back {
                display: inline-block;
                margin-bottom: ${d("md")};
                font-size: 0.875rem;
                color: ${a("text-muted")};
                text-decoration: none;
                &:hover { color: ${a("accent-strong")}; text-decoration: underline; }
                &:focus-visible { outline: 2px solid ${a("accent")}; outline-offset: 2px; }
            }

            & .elevvy__loading {
                margin: 0 0 ${d("md")};
                color: ${a("text-muted")};
                font-size: 0.875rem;
            }
            & .elevvy__loading.hidden { display: none; }

            & .elevvy__error {
                display: flex;
                align-items: center;
                gap: ${d("md")};
                flex-wrap: wrap;
                padding: ${d("md")};
                margin-bottom: ${d("lg")};
                border: 1px solid ${a("danger")};
                border-radius: ${a("radius-md")};
                background: ${a("danger-soft")};

                & .elevvy__error-text { margin: 0; font-size: 0.875rem; color: ${a("text")}; }
                & .elevvy__retry { ${C()} }
            }
            & .elevvy__error.hidden { display: none; }

            & .elevvy__missing.hidden { display: none; }
            & .elevvy__workspace.hidden { display: none; }

            & .elevvy__head {
                display: flex;
                flex-direction: column;
                gap: ${d("sm")};
                padding-bottom: ${d("lg")};
            }

            & .elevvy__eyebrow {
                margin: 0;
                font-size: 0.6875rem;
                line-height: 16px;
                font-weight: 700;
                letter-spacing: 0.14em;
                text-transform: uppercase;
                color: ${a("text-muted")};
            }

            & .elevvy__title-row {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: ${d("lg")};
                flex-wrap: wrap;
            }

            & .elevvy__identity { margin: 0; min-width: 0; }

            /* The header identity IS the person marker (§4.11's own example
               shows exactly "Anna Ekström · Elev" above the tab row), so the
               name has to carry page-title typography rather than the 0.875rem
               it wears inside a note thread. Only the NAME is scaled: the role
               pill keeps its own metrics, which is what §4.6 protects — Lärare
               and Elev must stay identical in weight and size to each other,
               and they still are. Lora 500, never another weight
               (UI_DECISIONS §3). */
            & .elevvy__identity .person-marker__name {
                font-family: ${a("font-display")};
                font-weight: 500;
                font-size: 1.75rem;
                line-height: 36px;
                color: ${a("text")};
            }

            & .elevvy__book {
                ${C()}
                background: ${a("accent")};
                color: ${a("on-accent")};
                border: 1px solid ${a("accent")};
                &:hover { background: ${a("accent-strong")}; border-color: ${a("accent-strong")}; }
                &:focus-visible { outline: 2px solid ${a("accent")}; outline-offset: 2px; }
            }

            & .elevvy__meta {
                margin: 0;
                font-size: 0.875rem;
                color: ${a("text-muted")};
                overflow-wrap: anywhere;
            }

            /* UI_DECISIONS §6 — seven tabs do not fit a phone — is satisfied by
               TabsComponent itself: the framework component owns
               .ui-tabs__scroller, the single-line no-wrap row, and the
               overflow-aware edge mask, and re-measures on scroll, resize and
               ResizeObserver. This view carried its own copy of all of that
               before the framework had it; keeping a second implementation
               would mean two elements competing to be the scroll container and
               two rules painting the same mask. Nothing to restate here. */

            & .elevvy__panels { padding-top: ${d("xl")}; }
            & .elevvy__panel.hidden { display: none; }

            & .elevvy__lede {
                margin: 0 0 ${d("lg")};
                font-size: 0.875rem;
                line-height: 1.6;
                color: ${a("text-muted")};
                max-width: 68ch;
            }
            & .elevvy__lede.hidden { display: none; }

            & .elevvy__empty.hidden { display: none; }

            & .elevvy__group { margin-bottom: ${d("xl")}; }
            & .elevvy__group.hidden { display: none; }

            & .elevvy__group-label {
                margin: 0 0 ${d("md")};
                font-size: 0.6875rem;
                line-height: 16px;
                font-weight: 700;
                letter-spacing: 0.14em;
                text-transform: uppercase;
                color: ${a("text-muted")};
            }

            & .elevvy__list {
                list-style: none;
                margin: 0;
                padding: 0;
                /* No zebra striping (§4.3): a hairline between rows. */
                border-top: 1px solid ${a("border")};
            }
            & .elevvy__list > li { border-bottom: 1px solid ${a("border")}; }

            & .occ-row {
                display: grid;
                grid-template-columns: auto minmax(0, 1fr) auto auto;
                align-items: start;
                gap: ${d("lg")};
                padding: ${d("md")} ${d("sm")};
                text-decoration: none;
                color: inherit;

                &:hover { background: ${a("surface-2")}; }
                &:focus-visible { outline: 2px solid ${a("accent")}; outline-offset: -2px; }
            }
            /* Cancelled is muted but readable — the dashed pill carries the
               meaning, the dimming only ranks the row (§4.3). */
            & .occ-row--cancelled {
                & .occ-row__title, & .occ-row__day, & .occ-row__time { color: ${a("text-muted")}; }
            }

            & .occ-row__date {
                display: flex;
                flex-direction: column;
                align-items: center;
                width: 3.5rem;
                font-variant-numeric: tabular-nums;
            }
            & .occ-row__day { font-size: 1.25rem; font-weight: 700; line-height: 1.2; color: ${a("text")}; }
            & .occ-row__month {
                font-size: 0.6875rem;
                font-weight: 700;
                letter-spacing: 0.12em;
                color: ${a("text-muted")};
            }
            & .occ-row__time { margin-top: 2px; font-size: 0.8125rem; color: ${a("text-muted")}; }

            & .occ-row__body { display: flex; flex-direction: column; gap: ${d("xs")}; min-width: 0; }
            & .occ-row__title {
                font-size: 0.9375rem;
                font-weight: 600;
                color: ${a("text")};
                overflow-wrap: anywhere;
            }
            & .occ-row__meta {
                display: flex;
                align-items: baseline;
                flex-wrap: wrap;
                gap: ${d("xs")} ${d("sm")};
                font-size: 0.8125rem;
                color: ${a("text-muted")};
            }

            & .occ-row__chips {
                display: flex;
                flex-wrap: wrap;
                gap: ${d("xs")};
                justify-content: flex-end;
                max-width: 16rem;
            }
            & .occ-row__chip {
                display: inline-flex;
                align-items: center;
                padding: 2px ${d("sm")};
                border: 1px solid ${a("border")};
                border-radius: ${a("radius-pill")};
                font-size: 0.75rem;
                font-weight: 600;
                line-height: 1.4;
                color: ${a("text-muted")};
                white-space: nowrap;
                max-width: 14rem;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            & .occ-row__status { padding-top: 2px; }

            & .plain-row {
                display: grid;
                grid-template-columns: minmax(0, 1fr) auto;
                align-items: center;
                gap: ${d("sm")} ${d("lg")};
                padding: ${d("md")} ${d("sm")};
                text-decoration: none;
                color: inherit;
            }
            & a.plain-row:hover { background: ${a("surface-2")}; }
            & a.plain-row:focus-visible { outline: 2px solid ${a("accent")}; outline-offset: -2px; }
            & .plain-row__body { display: flex; flex-direction: column; gap: ${d("xs")}; min-width: 0; }
            & .plain-row__title {
                font-size: 0.9375rem;
                font-weight: 600;
                color: ${a("text")};
                overflow-wrap: anywhere;
            }
            & .plain-row__meta {
                display: flex;
                align-items: baseline;
                flex-wrap: wrap;
                gap: ${d("xs")} ${d("sm")};
                font-size: 0.8125rem;
                color: ${a("text-muted")};
            }

            /* Översikt — §4.2 auto-fitting card grid, capped at the spec's four. */
            & .elevvy__cards {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(15rem, 1fr));
                gap: ${d("md")};
                margin-bottom: ${d("xl")};
            }
            & .elevvy__card {
                display: flex;
                flex-direction: column;
                gap: ${d("xs")};
                padding: ${d("lg")};
                border: 1px solid ${a("border")};
                border-radius: ${a("radius-md")};
                background: ${a("surface")};
                text-decoration: none;
                color: inherit;
            }
            & a.elevvy__card:hover { border-color: ${a("border-strong")}; }
            & a.elevvy__card:focus-visible { outline: 2px solid ${a("accent")}; outline-offset: 2px; }
            & .elevvy__card-label {
                font-size: 0.6875rem;
                line-height: 16px;
                font-weight: 700;
                letter-spacing: 0.14em;
                text-transform: uppercase;
                color: ${a("text-muted")};
            }
            & .elevvy__card-value {
                font-size: 1rem;
                font-weight: 600;
                color: ${a("text")};
                overflow-wrap: anywhere;
            }
            & .elevvy__card-meta { font-size: 0.8125rem; color: ${a("text-muted")}; }

            & .elevvy__subheading {
                margin: 0 0 ${d("md")};
                font-family: ${a("font-display")};
                font-weight: 500;
                font-size: 1.25rem;
                line-height: 28px;
                color: ${a("text")};
            }

            & .activity-row {
                display: flex;
                align-items: baseline;
                flex-wrap: wrap;
                gap: ${d("xs")} ${d("sm")};
                padding: ${d("sm")} ${d("sm")};
                text-decoration: none;
                color: inherit;
                font-size: 0.875rem;
                &:hover { background: ${a("surface-2")}; }
                &:focus-visible { outline: 2px solid ${a("accent")}; outline-offset: -2px; }
            }
            & .activity-row__kind {
                font-size: 0.6875rem;
                font-weight: 700;
                letter-spacing: 0.08em;
                text-transform: uppercase;
                color: ${a("text-muted")};
            }
            & .activity-row__title { color: ${a("text")}; overflow-wrap: anywhere; }
            /* Timestamps are never the serif (§02). */
            & .activity-row__when { font-family: ${a("font-ui")}; color: ${a("text-muted")}; }

            & .elevvy__picker {
                display: flex;
                align-items: flex-end;
                gap: ${d("sm")};
                flex-wrap: wrap;
                max-width: 34rem;
            }
            & .elevvy__picker-field { display: flex; flex-direction: column; gap: ${d("xs")}; flex: 1; min-width: 12rem; }
            & .elevvy__picker-label { font-size: 0.8125rem; font-weight: 600; color: ${a("text")}; }
            & .elevvy__picker-field .ui-select { display: block; }
            & .elevvy__picker-open {
                ${C()}
                background: ${a("accent")};
                color: ${a("on-accent")};
                border: 1px solid ${a("accent")};
                &:hover:not(:disabled) { background: ${a("accent-strong")}; border-color: ${a("accent-strong")}; }
                &:focus-visible { outline: 2px solid ${a("accent")}; outline-offset: 2px; }
            }

            & .elevvy__horses {
                list-style: none;
                margin: 0;
                padding: 0;
                display: flex;
                flex-wrap: wrap;
                gap: ${d("sm")};
            }
            & .elevvy__horse {
                padding: ${d("sm")} ${d("md")};
                border: 1px solid ${a("border")};
                border-radius: ${a("radius-md")};
                background: ${a("surface")};
                font-size: 0.875rem;
                color: ${a("text")};
            }

            @media (max-width: 639px) {
                & .elevvy__identity .person-marker__name { font-size: 1.375rem; line-height: 30px; }
                & .elevvy__title-row { align-items: flex-start; }
                & .occ-row {
                    grid-template-columns: minmax(0, 1fr) auto;
                    gap: ${d("sm")};
                }
                & .occ-row__date {
                    flex-direction: row;
                    align-items: baseline;
                    gap: ${d("xs")};
                    width: auto;
                }
                & .occ-row__day { font-size: 1rem; }
                & .occ-row__body { grid-column: 1 / -1; }
                & .occ-row__chips { grid-column: 1 / -1; justify-content: flex-start; max-width: none; }
                & .plain-row { grid-template-columns: minmax(0, 1fr); justify-items: start; }
                & .elevvy__picker { flex-direction: column; align-items: stretch; }
            }
        }
    `;router=this.inject(H);studentId=this.router.route.get().split("/")[2]??"";fromHref=`/students/${this.studentId}`;student=new ue;lessons=new ue;sessions=new ue;plans=new ue;goals=new ue;horses=new ue;exercises=new ue;nowIso=new m(new Date().toISOString());tabQuery=this.router.query("flik");activeTab=new m(It(this.router.query("flik").get()));historyPick=new m("");tabs=null;tabsHost=null;missing=new y(()=>this.student.resolved.get()&&this.student.error.get()!==null&&bl(this.student.status.get()));failed=new y(()=>this.student.error.get()!==null&&!this.missing.get());ready=new y(()=>this.student.data.get()!==null);myLessons=new y(()=>bi(this.lessons.data.get()??[],this.studentId));groupedLessons=new y(()=>Vn(this.myLessons.get(),this.nowIso.get()));mySessions=new y(()=>_i(this.sessions.data.get()??[]));myPlans=new y(()=>an(this.plans.data.get()??[]));myGoals=new y(()=>this.goals.data.get()??[]);myHorses=new y(()=>ll(this.horses.data.get()??[]));activity=new y(()=>ul(this.myLessons.get().map(e=>({id:e.id,scheduledAt:e.scheduledAt,title:ze(e)})),this.mySessions.get().map(e=>({id:e.id,performedAt:e.performedAt,title:je(e)})),this.nowIso.get(),vi));onMount(){this.student.run(()=>v.students.get({id:this.studentId})),this.track(w(()=>{const e=It(this.tabQuery.get());this.activeTab.peek()!==e&&this.activeTab.set(e)})),this.track(w(()=>{const e=this.activeTab.get();j(()=>It(this.tabQuery.get()))!==e&&this.router.navigate(sn(this.studentId,e),{replace:!0}),this.loadTab(e),this.scrollActiveIntoView()})),this.track(w(()=>{this.ready.get()&&this.tabs?.syncOverflow()}))}render(){const e=this.wire(wl,{back:{onclick:this.router.link("/students").onclick,textContent:()=>o("student.back")},loading:{textContent:()=>o("student.loading"),className:()=>this.student.loading.get()?"elevvy__loading":"elevvy__loading hidden"},errorBox:{className:()=>this.failed.get()?"elevvy__error":"elevvy__error hidden"},errorText:{textContent:()=>o("student.error")},retry:{textContent:()=>o("students.retry"),onclick:()=>{this.student.reset(),this.student.run(()=>v.students.get({id:this.studentId}))}},workspace:{className:()=>this.ready.get()?"elevvy__workspace":"elevvy__workspace hidden"},eyebrow:{textContent:()=>o("student.eyebrow")},relation:{textContent:()=>{const s=this.student.data.get();return s?ol(s.email):""}},book:{textContent:()=>o("student.book"),onclick:()=>this.router.navigate(nn(this.studentId))}});this.spawn(vt,this.ref(e,"identity"),{name:()=>this.student.data.get()?.displayName??"",role:"student"}),this.buildMissing(this.ref(e,"missingHost")),this.tabsHost=this.ref(e,"tabsHost"),this.tabs=this.spawn(ht,this.tabsHost,{active:this.activeTab,tabs:gi.map(s=>({key:s,label:()=>tn(s)}))});const t=this.ref(e,"panels");return t.appendChild(this.buildOverview()),t.appendChild(this.buildLessons()),t.appendChild(this.buildSessions()),t.appendChild(this.buildPlans()),t.appendChild(this.buildGoals()),t.appendChild(this.buildHorses()),t.appendChild(this.buildHistory()),e}buildMissing(e){const t=new U({heading:()=>o("student.notFound.heading"),body:()=>o("student.notFound.body"),action:{label:()=>o("student.notFound.action"),onclick:()=>this.router.navigate("/students")},headingLevel:2});t.mount(e),this.track(()=>t.destroy()),this.track(w(()=>{e.className=this.missing.get()?"elevvy__missing":"elevvy__missing hidden"}))}loadTab(e){switch(e){case"oversikt":this.lessons.runOnce(()=>v.lessons.list()),this.sessions.runOnce(()=>v.students.listTrainingSessions({id:this.studentId})),this.plans.runOnce(()=>v.students.listPlans({id:this.studentId})),this.goals.runOnce(()=>v.students.listGoals({id:this.studentId}));return;case"lektioner":this.lessons.runOnce(()=>v.lessons.list());return;case"pass":this.sessions.runOnce(()=>v.students.listTrainingSessions({id:this.studentId}));return;case"planer":this.plans.runOnce(()=>v.students.listPlans({id:this.studentId}));return;case"mal":this.goals.runOnce(()=>v.students.listGoals({id:this.studentId}));return;case"hastar":this.horses.runOnce(()=>v.students.listHorses({id:this.studentId}));return;case"historik":this.exercises.runOnce(()=>v.exercises.list())}}reloadTab(e){for(const t of this.sourcesFor(e))t.reset();this.loadTab(e)}sourcesFor(e){switch(e){case"oversikt":return[this.lessons,this.sessions,this.plans,this.goals];case"lektioner":return[this.lessons];case"pass":return[this.sessions];case"planer":return[this.plans];case"mal":return[this.goals];case"hastar":return[this.horses];case"historik":return[this.exercises]}}scrollActiveIntoView(){const e=()=>{this.tabsHost?.querySelector(".ui-tabs__tab.active")?.scrollIntoView({block:"nearest",inline:"nearest"}),this.tabs?.syncOverflow()};e(),typeof requestAnimationFrame=="function"&&requestAnimationFrame(e)}buildPanel(e){const t=e.source,s=()=>!t||!e.count?!1:t.resolved.get()&&t.error.get()===null&&e.count()===0,i=this.wireEl(kl,{root:{className:()=>this.activeTab.get()===e.tab?"elevvy__panel":"elevvy__panel hidden","aria-label":()=>tn(e.tab)},lede:{textContent:()=>e.lede?.()??"",className:()=>e.lede?"elevvy__lede":"elevvy__lede hidden"},loading:{textContent:()=>o(`${e.prefix}.loading`),className:()=>t?.loading.get()&&!t.resolved.get()?"elevvy__loading":"elevvy__loading hidden"},errorBox:{className:()=>t?.error.get()?"elevvy__error":"elevvy__error hidden"},errorText:{textContent:()=>o(`${e.prefix}.error`)},retry:{textContent:()=>o("students.retry"),onclick:()=>this.reloadTab(e.tab)}}),r=this.ref(i,"emptyHost");if(e.count){const l=new U({heading:()=>o(`${e.prefix}.empty.heading`),body:()=>o(`${e.prefix}.empty.body`),...e.action?{action:e.action}:{},headingLevel:2});l.mount(r),this.track(()=>l.destroy()),this.track(w(()=>{r.className=s()?"elevvy__empty":"elevvy__empty hidden"}))}return{root:i,content:this.ref(i,"content")}}buildOverview(){const{root:e,content:t}=this.buildPanel({tab:"oversikt",prefix:"student.overview",source:null}),s=document.createElement("div");s.className="elevvy__cards",s.appendChild(this.card({label:()=>o("student.overview.nextLesson"),value:()=>{const p=this.lessons.data.get();if(this.lessons.error.get())return o("student.overview.unavailable");if(!p)return"…";const b=Fe(p,this.studentId,this.nowIso.get());return b?qe(b.scheduledAt):o("student.overview.nextLesson.none")},meta:()=>{const p=this.lessons.data.get();if(!p)return"";const b=Fe(p,this.studentId,this.nowIso.get());return b?ze(b):""},href:()=>{const p=this.lessons.data.get();if(!p)return null;const b=Fe(p,this.studentId,this.nowIso.get());return b?`/lektioner/${b.id}`:null}})),s.appendChild(this.card({label:()=>o("student.overview.latestSession"),value:()=>{if(this.sessions.error.get())return o("student.overview.unavailable");const p=this.sessions.data.get();if(!p)return"…";const b=Tt(p);return b?ct(b.performedAt):o("student.overview.latestSession.none")},meta:()=>{const p=this.sessions.data.get(),b=p?Tt(p):null;return b?je(b):""},href:()=>{const p=this.sessions.data.get(),b=p?Tt(p):null;return b?`/traningspass/${b.id}`:null}})),s.appendChild(this.card({label:()=>o("student.overview.activePlans"),value:()=>{if(this.plans.error.get())return o("student.overview.unavailable");const p=this.plans.data.get();return p?cl(an(p).length):"…"},meta:()=>"",href:()=>null})),s.appendChild(this.card({label:()=>o("student.overview.sharedGoals"),value:()=>{if(this.goals.error.get())return o("student.overview.unavailable");const p=this.goals.data.get();return p?hl(dl(p)):"…"},meta:()=>o("student.overview.sharedGoals.meta"),href:()=>null})),t.appendChild(s);const i=document.createElement("h2");i.className="elevvy__subheading",this.track(w(()=>{i.textContent=o("student.overview.activity")})),t.appendChild(i);const r=[this.lessons,this.sessions],l=new y(()=>r.some(p=>p.error.get()!==null)),c=new y(()=>r.every(p=>p.resolved.get())),h=document.createElement("p");h.className="elevvy__lede hidden",this.track(w(()=>{const p=pl({sourcesFailed:l.get(),sourcesAnswered:c.get(),count:this.activity.get().length});p!=="silent"&&(h.textContent=o(p==="unavailable"?"student.overview.unavailable":"student.overview.activity.empty")),h.className=p==="silent"?"elevvy__lede hidden":"elevvy__lede"})),t.appendChild(h);const u=document.createElement("ul");return u.className="elevvy__list",t.appendChild(u),this.$each(u,this.activity,p=>this.renderActivity(p),fl),e}card(e){const t=document.createElement("div"),s=()=>{const i=e.href(),r=document.createElement(i?"a":"div");r.className="elevvy__card",i&&(r.href=i,r.addEventListener("click",u=>{u.preventDefault(),this.router.navigate(i)}));const l=document.createElement("span");l.className="elevvy__card-label",l.textContent=e.label();const c=document.createElement("span");c.className="elevvy__card-value",c.textContent=e.value(),r.append(l,c);const h=e.meta();if(h){const u=document.createElement("span");u.className="elevvy__card-meta",u.textContent=h,r.appendChild(u)}return r};return this.track(w(()=>{t.replaceChildren(s())})),t}renderActivity(e){const t=document.createElement("li"),s=document.createElement("a");s.className="activity-row",s.href=e.href,s.addEventListener("click",c=>{c.preventDefault(),this.router.navigate(e.href)});const i=document.createElement("span");i.className="activity-row__kind",i.textContent=ml(e.kind);const r=document.createElement("span");r.className="activity-row__title",r.textContent=e.title;const l=document.createElement("span");return l.className="activity-row__when",l.textContent=gl(e.at),s.append(i,r,l),t.appendChild(s),t}buildLessons(){const{root:e,content:t}=this.buildPanel({tab:"lektioner",prefix:"student.lessons",source:this.lessons,count:()=>this.myLessons.get().length,action:{label:()=>o("student.book"),onclick:()=>this.router.navigate(nn(this.studentId))}});for(const[s,i]of[["upcoming","lessons.group.upcoming"],["past","lessons.group.past"]]){const r=new y(()=>this.groupedLessons.get()[s]),l=document.createElement("section");l.className="elevvy__group";const c=document.createElement("h3");c.className="elevvy__group-label";const h=document.createElement("ul");h.className="elevvy__list",l.append(c,h),this.track(w(()=>{c.textContent=o(i),l.className=r.get().length===0?"elevvy__group hidden":"elevvy__group"})),this.$each(h,r,(u,p,b)=>this.renderLesson(u,b),u=>`${u.id}:${u.status}:${u.scheduledAt}`),t.appendChild(l)}return e}renderLesson(e,t){const s=document.createElement("li"),i=`/lektioner/${e.id}`,r=document.createElement("a");r.className=e.status==="cancelled"?"occ-row occ-row--cancelled":"occ-row",r.href=i,r.addEventListener("click",b=>{b.preventDefault(),this.router.navigate(i)}),r.appendChild(this.dateColumn(Fn(e.scheduledAt)));const l=document.createElement("span");l.className="occ-row__body";const c=document.createElement("span");c.className="occ-row__title",c.textContent=ze(e);const h=document.createElement("span");h.className="occ-row__meta",e.horseName&&h.appendChild(be(e.horseName)),h.appendChild(be(Mn(e.exercises))),l.append(c,h);const u=document.createElement("span");u.className="occ-row__chips",e.planTitle&&u.appendChild(Lt(dt(e.planTitle)));for(const b of Rn(e))u.appendChild(Lt(os(b)));const p=document.createElement("span");return p.className="occ-row__status",t(At(p,rs(e.status))),r.append(l,u,p),s.appendChild(r),s}buildSessions(){const{root:e,content:t}=this.buildPanel({tab:"pass",prefix:"student.sessions",source:this.sessions,count:()=>this.mySessions.get().length,lede:()=>o("student.sessions.lede")}),s=document.createElement("ul");return s.className="elevvy__list",t.appendChild(s),this.$each(s,this.mySessions,i=>this.renderSession(i),i=>`${i.id}:${i.updatedAt}`),e}renderSession(e){const t=document.createElement("li"),s=`/traningspass/${e.id}`,i=document.createElement("a");i.className="occ-row",i.href=s,i.addEventListener("click",p=>{p.preventDefault(),this.router.navigate(s)}),i.appendChild(this.dateColumn(Gn(e.performedAt)));const r=document.createElement("span");r.className="occ-row__body";const l=document.createElement("span");l.className="occ-row__title",l.textContent=je(e);const c=document.createElement("span");c.className="occ-row__meta";const h=ls(e.durationMin);h&&c.appendChild(be(h)),e.horseName&&c.appendChild(be(e.horseName)),r.append(l,c);const u=document.createElement("span");return u.className="occ-row__chips",e.planTitle&&u.appendChild(Lt(dt(e.planTitle))),i.append(r,u,document.createElement("span")),t.appendChild(i),t}buildPlans(){const{root:e,content:t}=this.buildPanel({tab:"planer",prefix:"student.plans",source:this.plans,count:()=>this.myPlans.get().length}),s=document.createElement("ul");return s.className="elevvy__list",t.appendChild(s),this.$each(s,this.myPlans,(i,r,l)=>this.renderPlan(i,l),i=>`${i.id}:${i.updatedAt}`),e}renderPlan(e,t){const s=document.createElement("li"),i=`/planer/${e.id}`,r=document.createElement("a");r.className="plain-row",r.href=i,r.addEventListener("click",_=>{_.preventDefault(),this.router.navigate(i)});const l=document.createElement("span");l.className="plain-row__body";const c=document.createElement("span");c.className="plain-row__title",c.textContent=e.title;const h=document.createElement("span");h.className="plain-row__meta";const u=Ge(e.startDate,e.endDate);u&&h.appendChild(be(u));const p=bt(e.primaryTeacherDisplayName);p&&h.appendChild(be(p)),l.append(c,h);const b=document.createElement("span");return t(At(b,is(e.status))),r.append(l,b),s.appendChild(r),s}buildGoals(){const{root:e,content:t}=this.buildPanel({tab:"mal",prefix:"student.goals",source:this.goals,count:()=>this.myGoals.get().length,lede:()=>o("student.goals.lede")}),s=document.createElement("ul");return s.className="elevvy__list",t.appendChild(s),this.$each(s,this.myGoals,(i,r,l)=>this.renderGoal(i,l),i=>`${i.id}:${i.status}:${i.updatedAt}`),e}renderGoal(e,t){const s=document.createElement("li"),i=`/mal/${e.id}`,r=document.createElement("a");r.className="plain-row",r.href=i,r.addEventListener("click",b=>{b.preventDefault(),this.router.navigate(i)});const l=document.createElement("span");l.className="plain-row__body";const c=document.createElement("span");c.className="plain-row__title",c.textContent=e.title;const h=document.createElement("span");h.className="plain-row__meta";const u=Ee(e.targetDate);u&&h.appendChild(be(u)),l.append(c,h);const p=document.createElement("span");return t(At(p,ft(e.status))),r.append(l,p),s.appendChild(r),s}buildHorses(){const{root:e,content:t}=this.buildPanel({tab:"hastar",prefix:"student.horses",source:this.horses,count:()=>this.myHorses.get().length}),s=document.createElement("ul");return s.className="elevvy__horses",t.appendChild(s),this.$each(s,this.myHorses,i=>{const r=document.createElement("li");return r.className="elevvy__horse",r.textContent=i.name,r},i=>`${i.id}:${i.name}`),e}buildHistory(){const{root:e,content:t}=this.buildPanel({tab:"historik",prefix:"student.history",source:this.exercises,count:()=>(this.exercises.data.get()??[]).length,action:{label:()=>o("student.history.empty.action"),onclick:()=>this.router.navigate("/library")}}),s=document.createElement("div");s.className="elevvy__picker";const i=document.createElement("div");i.className="elevvy__picker-field";const r=document.createElement("span");r.className="elevvy__picker-label";const l=document.createElement("div");i.append(r,l);const c=document.createElement("button");c.type="button",c.className="elevvy__picker-open";const h=document.createElement("p");return h.className="elevvy__lede",this.track(w(()=>{r.textContent=o("student.history.field"),c.textContent=o("student.history.open"),c.disabled=this.historyPick.get()==="";const u=this.student.data.get();h.textContent=o("student.history.hint",{name:u?.displayName??""})})),c.addEventListener("click",()=>{const u=this.historyPick.get();u&&this.router.navigate(rl(this.studentId,u,sn(this.studentId,"historik")))}),this.spawn(R,l,{value:this.historyPick,options:new y(()=>(this.exercises.data.get()??[]).map(u=>({value:u.id,label:u.name}))),placeholder:o("student.history.placeholder")}),s.append(i,c),t.append(h,s),this.track(w(()=>{const u=(this.exercises.data.get()??[]).length>0;s.style.display=u?"":"none",h.className=u?"elevvy__lede":"elevvy__lede hidden"})),e}dateColumn(e){const t=document.createElement("span");t.className="occ-row__date";for(const[s,i]of[["day",e.day],["month",e.month],["time",e.time]]){const r=document.createElement("span");r.className=`occ-row__${s}`,r.textContent=i,t.appendChild(r)}return t}}function be(n){const e=document.createElement("span");return e.textContent=n,e}function Lt(n){const e=document.createElement("span");return e.className="occ-row__chip",e.textContent=n,e.title=n,e}function At(n,e){const t=new ie({label:e.label,variant:e.variant,tone:e.tone,...e.glyph===void 0?{}:{glyph:e.glyph}});return t.mount(n),()=>t.destroy()}function Cl(n){return typeof n=="object"&&n!==null&&typeof n.get=="function"}const ee=n=>`var(--${n})`,Me=class Me extends E{constructor(){super(...arguments),this.uid=`ui-table-${Me.seq++}`}render(){const e=this.props.stacked!==!1,t=this.props.emptyCell??"—",s=document.createElement("div");s.className=e?"ui-table-wrap":"ui-table-wrap ui-table-wrap--scroll";const i=document.createElement("table");if(i.className=e?"ui-table ui-table--stacked":"ui-table",i.setAttribute("role","table"),this.props.caption!==void 0){const h=document.createElement("caption");h.className=this.props.captionHidden?"ui-table__caption ui-table__caption--hidden":"ui-table__caption",h.id=`${this.uid}-caption`,h.textContent=this.props.caption,i.appendChild(h),i.setAttribute("aria-labelledby",h.id)}const r=document.createElement("thead");r.className="ui-table__head",r.setAttribute("role","rowgroup");const l=document.createElement("tr");l.className="ui-table__tr",l.setAttribute("role","row");for(const h of this.props.columns){const u=document.createElement("th");u.className="ui-table__th",u.setAttribute("role","columnheader"),u.setAttribute("scope","col"),u.setAttribute("data-key",h.key),u.textContent=h.header,l.appendChild(u)}r.appendChild(l),i.appendChild(r),this.bodyEl=document.createElement("tbody"),this.bodyEl.className="ui-table__body",this.bodyEl.setAttribute("role","rowgroup"),i.appendChild(this.bodyEl);const c=h=>{if(this.bodyEl.textContent="",h.length!==0)for(const u of h){const p=document.createElement("tr");p.className="ui-table__tr",p.setAttribute("role","row"),this.props.rowKey&&p.setAttribute("data-row-key",this.props.rowKey(u));for(const b of this.props.columns){const _=b.type??"text",k=document.createElement("td");if(k.className=`ui-table__td ui-table__td--${_}`,k.setAttribute("role","cell"),k.setAttribute("data-key",b.key),b.stackedLabel!==!1){const N=document.createElement("span");N.className="ui-table__stacked-label",N.setAttribute("aria-hidden","true"),N.textContent=b.header,k.appendChild(N)}const I=b.cell(u);if(I instanceof HTMLElement)k.appendChild(I);else if(I==null||I===""){const N=document.createElement("span");N.className="ui-table__empty-cell",N.textContent=t,k.appendChild(N)}else{const N=document.createElement("span");N.textContent=String(I),k.appendChild(N)}p.appendChild(k)}this.bodyEl.appendChild(p)}};return Cl(this.props.rows)?this.track(w(()=>{c(this.props.rows.get())})):c(this.props.rows),s.appendChild(i),s}};Me.styles=`
        .ui-table-wrap {
            width: 100%;
        }
        /* Non-stacking tables keep the grid and scroll inside their own box,
           so the page body never scrolls sideways. */
        .ui-table-wrap--scroll {
            overflow-x: auto;
        }
        .ui-table {
            width: 100%;
            border-collapse: collapse;
            /* Never the display serif in cells. */
            font-family: ${ee("font-ui")};
            font-size: 0.875rem;
            line-height: 1.5;
            color: ${ee("text")};
        }
        .ui-table__caption {
            font-family: ${ee("font-display")};
            font-weight: 500;
            font-size: 1.25rem;
            line-height: 1.4;
            text-align: left;
            color: ${ee("text")};
            padding-bottom: ${ee("space-3")};
        }
        .ui-table__caption--hidden {
            position: absolute;
            width: 1px;
            height: 1px;
            padding: 0;
            margin: -1px;
            overflow: hidden;
            clip-path: inset(50%);
            white-space: nowrap;
        }
        .ui-table__th {
            /* Overline treatment: letterspaced uppercase, UI font. */
            font-family: ${ee("font-ui")};
            font-size: 0.6875rem;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.14em;
            color: ${ee("text-muted")};
            text-align: left;
            padding: ${ee("space-2")} ${ee("space-3")};
            border-bottom: 1px solid ${ee("border-strong")};
            white-space: nowrap;
        }
        .ui-table__td {
            text-align: left;
            padding: ${ee("space-3")};
            border-bottom: 1px solid ${ee("border")};
            vertical-align: top;
        }
        /* No zebra striping — surfaces are separated by hairlines, not fills. */
        .ui-table__tr:last-child .ui-table__td {
            border-bottom: none;
        }
        .ui-table__td--numeric,
        .ui-table__td--date {
            font-variant-numeric: tabular-nums;
            white-space: nowrap;
        }
        .ui-table__empty-cell {
            color: ${ee("text-muted")};
        }
        .ui-table__stacked-label {
            display: none;
        }

        @media (max-width: 639px) {
            /* Stacked rendering. Implicit table roles are lost under
               display:block, so every element re-asserts its role explicitly
               (see render()) and the semantics survive. */
            .ui-table--stacked,
            .ui-table--stacked .ui-table__head,
            .ui-table--stacked .ui-table__body,
            .ui-table--stacked .ui-table__tr,
            .ui-table--stacked .ui-table__td {
                display: block;
                width: 100%;
            }
            /* Column headers are redundant once each cell carries its own. */
            .ui-table--stacked .ui-table__head {
                position: absolute;
                width: 1px;
                height: 1px;
                padding: 0;
                margin: -1px;
                overflow: hidden;
                clip-path: inset(50%);
                white-space: nowrap;
            }
            .ui-table--stacked .ui-table__tr {
                padding: ${ee("space-3")} 0;
                border-bottom: 1px solid ${ee("border")};
            }
            .ui-table--stacked .ui-table__tr:last-child {
                border-bottom: none;
            }
            .ui-table--stacked .ui-table__td {
                padding: ${ee("space-1")} 0;
                border-bottom: none;
                white-space: normal;
            }
            .ui-table--stacked .ui-table__stacked-label {
                display: block;
                font-size: 0.6875rem;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 0.14em;
                color: ${ee("text-muted")};
                margin-bottom: 2px;
            }
        }
    `,Me.seq=0;let Yt=Me;const on=n=>typeof n=="function"?n():n;class Ke extends E{static styles=`
        .share-chip {
            display: inline-flex;
        }

        /* Shared = accent-tinted. The pill publishes its colour as one custom
           property, so this is a token swap rather than a restyle: shape,
           metrics and the ring all still come from StatusPill. */
        .share-chip--shared .ui-status-pill {
            --ui-pill-tone: ${a("accent-strong")};
            background: ${a("accent-soft")};
        }

        /* Private = neutral outline, which is StatusPill's default. Named here
           only so the two states read as a pair in this file. */
        .share-chip--private .ui-status-pill {
            --ui-pill-tone: ${a("text-muted")};
        }
    `;recipients(){return on(this.props.recipients)}isShared(){return this.props.shared===void 0?this.recipients().length>0:on(this.props.shared)}render(){const e=document.createElement(this.props.as??"span");return this.spawn(ie,e,{label:()=>pi(this.recipients(),this.isShared()),variant:"outline"}),this.track(w(()=>{const t=this.isShared();e.className=`share-chip share-chip--${t?"shared":"private"}`;const s=Fo(this.recipients(),t);s?e.setAttribute("title",s):e.removeAttribute("title")})),e}}class yt{items=new m([]);loading=new m(!1);error=new m(null);async load(){const e=await $(this.loading,this.error,()=>v.exercises.list());e&&this.items.set(e)}async create(e){const t=await $(this.loading,this.error,()=>v.exercises.create(e));return t?(this.items.set([t,...this.items.get()]),t):null}async get(e){return await $(this.loading,this.error,()=>v.exercises.get({id:e}))??null}async update(e,t){const s=await $(this.loading,this.error,()=>v.exercises.update({id:e,...t}));return s?(this.items.set(this.items.get().map(i=>i.id===e?s:i)),s):null}async archive(e){return await $(this.loading,this.error,()=>v.exercises.delete({id:e}))?(this.items.set(this.items.get().filter(s=>s.id!==e)),!0):!1}}function Sl(n){const e=n.split("/");return e.length===6&&e[1]==="students"&&e[3]==="exercises"&&e[5]==="history"&&e[2]&&e[4]?{studentId:e[2],exerciseId:e[4]}:null}function ln(n,e){return n&&n.startsWith("/")&&!n.startsWith("//")?n:e?`/library/${e.exerciseId}`:"/students"}function El(n){return n??o("exerciseHistory.standalone")}function Il(n){return[...n.notes].sort((e,t)=>e.createdAt.localeCompare(t.createdAt))}function Tl(n){return n.visibility==="shared"?o("exerciseHistory.note.shared"):o("exerciseHistory.note.private")}function Nl(n){return[...n].sort((e,t)=>t.scheduledAt.localeCompare(e.scheduledAt)).map(e=>({key:e.lessonExerciseId,dateLabel:mt(e.scheduledAt),scheduledAt:e.scheduledAt,lessonHref:`/lektioner/${e.lessonId}`,sourceLabel:El(e.sourceProgramTitle),rowNote:e.rowNotes&&e.rowNotes.trim()!==""?e.rowNotes:null,notes:Il(e)}))}function Ll(n){return n.resolved?n.unreachable?"unreachable":n.found?n.count===0?"empty":"rows":"notFound":"loading"}function dn(n){return n==="network"||n==="timeout"}const Al=T(`
    <div class="ex-history">
        <a bind="back" href="#" class="ex-history__back"></a>

        <header class="ex-history__head">
            <p bind="eyebrow" class="ex-history__eyebrow"></p>
            <h1 bind="title" class="ex-history__title"></h1>
            <p bind="subtitle" class="ex-history__subtitle"></p>
            <p bind="scope" class="ex-history__scope"></p>
        </header>

        <p bind="loading" class="ex-history__loading"></p>
        <div bind="stateHost"></div>
        <div bind="tableHost" class="ex-history__table"></div>
    </div>
`);class Pl extends E{static styles=`
        .ex-history {
            display: flex;
            flex-direction: column;
            gap: ${d("lg")};
            font-family: ${a("font-ui")};

            & .ex-history__back {
                font-size: 0.875rem;
                color: ${a("text-muted")};
                text-decoration: none;
                align-self: flex-start;
                &:hover { color: ${a("accent-strong")}; text-decoration: underline; }
                &:focus-visible { outline: 2px solid ${a("accent")}; outline-offset: 2px; }
            }

            & .ex-history__head.hidden { display: none; }

            & .ex-history__eyebrow {
                margin: 0 0 ${d("xs")};
                font-size: 0.6875rem;
                line-height: 16px;
                font-weight: 700;
                letter-spacing: 0.14em;
                text-transform: uppercase;
                color: ${a("text-muted")};
            }

            /* Lora 500, and only 500 — UI_DECISIONS §3. */
            & .ex-history__title {
                margin: 0;
                font-family: ${a("font-display")};
                font-weight: 500;
                font-size: 1.75rem;
                line-height: 36px;
                color: ${a("text")};
                overflow-wrap: anywhere;
            }

            & .ex-history__subtitle {
                margin: ${d("xs")} 0 0;
                font-size: 0.9375rem;
                color: ${a("text")};
            }
            & .ex-history__scope {
                margin: ${d("sm")} 0 0;
                font-size: 0.8125rem;
                line-height: 1.6;
                color: ${a("text-muted")};
                max-width: 68ch;
            }

            & .ex-history__loading {
                margin: 0;
                color: ${a("text-muted")};
                font-size: 0.875rem;
            }
            & .ex-history__loading.hidden { display: none; }

            & .ex-history__table.hidden { display: none; }

            /* The date cell is a link to the Lesson (§3.16). It stays in the
               UI font and keeps the column's tabular figures — the table sets
               those on the cell, so the anchor inherits them. */
            & .ex-history__date-link {
                color: ${a("accent")};
                text-decoration: none;
                font-variant-numeric: tabular-nums;
                &:hover { color: ${a("accent-strong")}; text-decoration: underline; }
                &:focus-visible { outline: 2px solid ${a("accent")}; outline-offset: 2px; }
            }

            & .ex-history__note-list {
                list-style: none;
                margin: 0;
                padding: 0;
                display: flex;
                flex-direction: column;
                gap: ${d("sm")};
            }
            & .ex-history__note {
                display: flex;
                flex-direction: column;
                gap: 2px;
            }
            & .ex-history__note-meta {
                display: flex;
                align-items: center;
                flex-wrap: wrap;
                gap: ${d("xs")} ${d("sm")};
                font-size: 0.75rem;
                color: ${a("text-muted")};
            }
            & .ex-history__note-author { font-weight: 600; color: ${a("text")}; }
            & .ex-history__note-body {
                white-space: pre-wrap;
                overflow-wrap: anywhere;
                color: ${a("text")};
            }
            /* The teacher's hairline brass rule (§4.7), carried over so an
               instruction still reads apart from a reflection in this view. */
            & .ex-history__note--teacher {
                padding-left: ${d("sm")};
                border-left: 2px solid ${a("brass-line")};
            }

            @media (max-width: 639px) {
                & .ex-history__title { font-size: 1.375rem; line-height: 30px; }
            }
        }
    `;router=this.inject(H);auth=this.inject(re);students=this.inject(Ie);library=this.inject(yt);entries=new m([]);exerciseName=new m("");studentName=new m("");studentId=new m("");resolved=new m(!1);found=new m(!1);unreachable=new m(!1);ids=Sl(this.router.route.peek());rows=new y(()=>Nl(this.entries.get()));state=new y(()=>Ll({resolved:this.resolved.get(),found:this.found.get(),unreachable:this.unreachable.get(),count:this.entries.get().length}));onMount(){this.load()}async load(){const e=this.ids;if(!e){this.found.set(!1),this.resolved.set(!0);return}this.studentId.set(e.studentId),this.resolved.set(!1),this.unreachable.set(!1);const[t,s,i]=await Promise.all([this.students.get(e.studentId),this.library.get(e.exerciseId),this.students.exerciseHistory(e.studentId,e.exerciseId)]);!t||!s||i===null?(this.unreachable.set(dn(this.students.error.peek()?.code)||dn(this.library.error.peek()?.code)),this.found.set(!1)):(this.studentName.set(t.displayName),this.exerciseName.set(s.name),this.entries.set(i),this.found.set(!0)),this.resolved.set(!0)}render(){const e=this.wire(Al,{back:{href:"#",textContent:()=>o("exerciseHistory.back"),onclick:t=>{t.preventDefault(),this.router.navigate(ln(this.router.query("from").get(),this.ids))}},eyebrow:{textContent:()=>o("exerciseHistory.eyebrow")},title:{textContent:()=>this.exerciseName.get()},subtitle:{textContent:()=>{const t=this.studentName.get();return t?o("exerciseHistory.subtitle",{student:t}):""}},scope:{textContent:()=>this.state.get()==="rows"?o("exerciseHistory.scope"):""},loading:{textContent:()=>o("exerciseHistory.loading"),className:()=>this.state.get()==="loading"?"ex-history__loading":"ex-history__loading hidden"},tableHost:{className:()=>this.state.get()==="rows"?"ex-history__table":"ex-history__table hidden"}});return this.buildStates(this.ref(e,"stateHost")),this.buildTable(this.ref(e,"tableHost")),e}buildStates(e){let t=null;this.track(w(()=>{const s=this.state.get();if(t?.destroy(),t=null,e.replaceChildren(),s!=="empty"&&s!=="notFound"&&s!=="unreachable")return;const i=s==="empty"?{heading:"exerciseHistory.empty.heading",body:"exerciseHistory.empty.body",action:"exerciseHistory.empty.action",onclick:()=>this.router.navigate(ln(j(()=>this.router.query("from").get()),this.ids))}:s==="unreachable"?{heading:"exerciseHistory.unreachable.heading",body:"exerciseHistory.unreachable.body",action:"exerciseHistory.unreachable.action",onclick:()=>{this.load()}}:{heading:"exerciseHistory.notFound.heading",body:"exerciseHistory.notFound.body",action:"exerciseHistory.notFound.action",onclick:()=>this.router.navigate("/students")};t=j(()=>{const r=new U({heading:()=>o(i.heading),body:()=>o(i.body),action:{label:()=>o(i.action),onclick:i.onclick},headingLevel:2});return r.mount(e),r})})),this.track(()=>t?.destroy())}buildTable(e){const t=[{key:"date",header:o("exerciseHistory.col.date"),type:"date",stackedLabel:!1,cell:s=>this.dateCell(s)},{key:"occasion",header:o("exerciseHistory.col.occasion"),cell:s=>this.occasionCell(s)},{key:"rowNote",header:o("exerciseHistory.col.rowNote"),cell:s=>s.rowNote},{key:"notes",header:o("exerciseHistory.col.notes"),cell:s=>this.notesCell(s)}];this.spawn(Yt,e,{columns:t,rows:this.rows,caption:o("exerciseHistory.caption"),captionHidden:!0,rowKey:s=>s.key,stacked:!0})}dateCell(e){const t=document.createElement("a");return t.className="ex-history__date-link",t.href=e.lessonHref,t.textContent=e.dateLabel,t.setAttribute("aria-label",o("exerciseHistory.openLesson",{date:e.dateLabel})),t.addEventListener("click",s=>{s.preventDefault(),this.router.navigate(e.lessonHref)}),t}occasionCell(e){const t=document.createElement("span"),s=new ie({label:e.sourceLabel,variant:"outline",tone:"neutral"});return s.mount(t),this.track(()=>s.destroy()),t}notesCell(e){if(e.notes.length===0)return null;const t=document.createElement("ul");t.className="ex-history__note-list";for(const s of e.notes)t.appendChild(this.noteItem(s));return t}noteItem(e){const t=document.createElement("li"),s=e.authorId===this.studentId.peek();t.className=s?"ex-history__note":"ex-history__note ex-history__note--teacher";const i=document.createElement("span");i.className="ex-history__note-meta";const r=document.createElement("span");r.className="ex-history__note-author",r.textContent=e.authorDisplayName,i.appendChild(r);const l=document.createElement("span");l.textContent=mi(e.createdAt),i.appendChild(l);const c=document.createElement("span"),h=this.auth.currentUser.peek()?.id===this.studentId.peek(),u=e.visibility==="shared"&&!h?[{id:this.studentId.peek(),name:this.studentName.peek()}]:[],p=new Ke({recipients:u,shared:e.visibility==="shared"});p.mount(c),this.track(()=>p.destroy()),c.title=Tl(e),i.appendChild(c);const b=document.createElement("span");return b.className="ex-history__note-body",b.textContent=e.body,t.append(i,b),t}}const Dl=T('<div bind="host"></div>');class Hl extends E{router=this.inject(H);key=new y(()=>{const e=this.router.route.get();return e==="/students"?"list":/^\/students\/[^/]+\/exercises\/[^/]+\/history$/.test(e)?"history":"detail"});render(){const e=this.wire(Dl,{});return this.$swap(this.ref(e,"host"),this.key,{list:vl,detail:$l,history:Pl}),e}}const yi=["ovningar","program"],xi="ovningar";function Le(n){return yi.includes(n)?n:xi}function Ol(n){return n===xi?"/library":`/library?flik=${n}`}const zl={ovningar:"library.tab.exercises",program:"library.tab.programs"};function jl(n){return o(zl[n])}const Vl="/library?flik=program",Pt=140;function wi(n){const e=(n??"").trim().replace(/\s+/g," ");if(e==="")return"";if(e.length<=Pt)return e;const t=e.slice(0,Pt),s=t.lastIndexOf(" ");return`${(s>Pt-24?t.slice(0,s):t).trimEnd()}…`}const Fl=8;function Rl(n){return n>=Fl}function cn(n){return n.normalize("NFD").replace(new RegExp("\\p{Diacritic}","gu"),"").toLocaleLowerCase("sv")}function Ml(n,e){const t=cn(e.trim());return t===""?!0:cn(n).includes(t)}function Bl(n,e){return e.trim()===""?[...n]:n.filter(t=>Ml(`${t.name} ${t.description}`,e))}function ql(n){return n.failed?"error":n.loading?"loading":n.total===0?"empty":n.visible===0?"noMatches":"rows"}function Gl(n,e){const t=encodeURIComponent(`/library/${e}`);return`/students/${n}/exercises/${e}/history?from=${t}`}function Kl(n){return q("program.exerciseCount",n)}function Wl(n){return`${n.id}:${n.name}:${n.description}`}const Ul=T(`
    <section class="ex-list">
        <div class="ex-list__bar">
            <label bind="searchField" class="ex-list__search">
                <span bind="searchLabel" class="ex-list__search-label"></span>
                <input bind="searchInput" type="search" class="ex-list__search-input" autocomplete="off">
            </label>
            <button bind="create" type="button" class="ex-list__create"></button>
        </div>

        <p bind="loading" class="ex-list__loading"></p>

        <div bind="errorBox" class="ex-list__error" role="alert">
            <p bind="errorText" class="ex-list__error-text"></p>
            <button bind="retry" type="button" class="ex-list__retry"></button>
        </div>

        <div bind="emptyHost"></div>
        <div bind="noMatchesHost"></div>

        <ul bind="list" class="ex-list__list"></ul>
    </section>
`);class Yl extends E{static styles=`
        .ex-list {
            & .ex-list__bar {
                display: flex;
                align-items: flex-end;
                justify-content: space-between;
                gap: ${d("lg")};
                flex-wrap: wrap;
                margin-bottom: ${d("lg")};
            }

            & .ex-list__search {
                display: flex;
                flex-direction: column;
                gap: ${d("xs")};
                flex: 1 1 18rem;
                max-width: 26rem;
            }
            & .ex-list__search.hidden { display: none; }
            & .ex-list__search-label {
                font-family: ${a("font-ui")};
                font-size: 0.8125rem;
                font-weight: 600;
                color: ${a("text")};
            }
            /* The one field in the app that is NOT in a card: it belongs to the
               list's toolbar, on the page surface, where a panel around a single
               search box would announce itself louder than the rows it filters.
               So it keeps a raised fill instead of the recipe's recessed --bg,
               which on this background would leave nothing but the borders. */
            & .ex-list__search-input {
                ${K()}
                background: ${a("surface")};
                width: 100%;
                box-sizing: border-box;
            }

            /* Buttons are Open Sans territory; the serif is forbidden here. */
            & .ex-list__create {
                ${C(a("radius-sm"),"primary")}
                margin-left: auto;
            }

            & .ex-list__loading {
                margin: 0;
                font-family: ${a("font-ui")};
                color: ${a("text-muted")};
                font-size: 0.875rem;
            }
            & .ex-list__loading.hidden { display: none; }

            & .ex-list__error {
                display: flex;
                align-items: center;
                gap: ${d("md")};
                flex-wrap: wrap;
                padding: ${d("md")};
                margin-bottom: ${d("lg")};
                border: 1px solid ${a("danger")};
                border-radius: ${a("radius-md")};
                background: ${a("danger-soft")};

                & .ex-list__error-text {
                    margin: 0;
                    font-family: ${a("font-ui")};
                    font-size: 0.875rem;
                    color: ${a("text")};
                }
                & .ex-list__retry { ${C()} }
            }
            & .ex-list__error.hidden { display: none; }

            & .ex-list__list {
                list-style: none;
                margin: 0;
                padding: 0;
                /* No zebra striping (§4.3): rows are separated by a hairline. */
                border-top: 1px solid ${a("border")};
            }
            & .ex-list__list:empty { border-top: none; }
            & .ex-list__list.hidden { display: none; }
            & .ex-list__list > li { border-bottom: 1px solid ${a("border")}; }

            & .ex-row {
                display: flex;
                flex-direction: column;
                gap: ${d("xs")};
                padding: ${d("md")} ${d("sm")};
                text-decoration: none;
                color: inherit;
                font-family: ${a("font-ui")};

                &:hover { background: ${a("surface-2")}; }
                &:focus-visible { outline: 2px solid ${a("accent")}; outline-offset: -2px; }
            }
            & .ex-row__name {
                font-size: 0.9375rem;
                font-weight: 600;
                color: ${a("text")};
                overflow-wrap: anywhere;
            }
            & .ex-row__excerpt {
                font-size: 0.8125rem;
                line-height: 1.5;
                color: ${a("text-muted")};
                overflow-wrap: anywhere;
            }

            @media (max-width: 639px) {
                & .ex-list__bar { flex-direction: column; align-items: stretch; }
                & .ex-list__create { margin-left: 0; }
            }
        }
    `;router=this.inject(H);svc=this.inject(yt);query=new m("");resolved=new m(!1);failed=new y(()=>this.svc.error.get()!==null);visible=new y(()=>Bl(this.svc.items.get(),this.query.get()));state=new y(()=>ql({loading:!this.resolved.get()||this.svc.loading.get(),failed:this.failed.get(),total:this.svc.items.get().length,visible:this.visible.get().length}));onMount(){this.load()}async load(){await this.svc.load(),this.resolved.set(!0)}render(){const e=this.wire(Ul,{searchField:{className:()=>Rl(this.svc.items.get().length)?"ex-list__search":"ex-list__search hidden"},searchLabel:{textContent:()=>o("library.search.label")},searchInput:{value:()=>this.query.get(),placeholder:()=>o("library.search.placeholder"),oninput:t=>this.query.set(t.target.value)},create:{textContent:()=>o("library.create"),onclick:()=>this.router.navigate("/library/nytt")},loading:{textContent:()=>o("library.loading"),className:()=>this.state.get()==="loading"?"ex-list__loading":"ex-list__loading hidden"},errorBox:{className:()=>this.state.get()==="error"?"ex-list__error":"ex-list__error hidden"},errorText:{textContent:()=>o("library.error")},retry:{textContent:()=>o("library.retry"),onclick:()=>{this.load()}},list:{className:()=>this.state.get()==="rows"?"ex-list__list":"ex-list__list hidden"}});return this.buildEmpty(this.ref(e,"emptyHost"),"empty",{heading:"library.empty.heading",body:"library.empty.body",action:"library.empty.action",onclick:()=>this.router.navigate("/library/nytt")}),this.buildEmpty(this.ref(e,"noMatchesHost"),"noMatches",{heading:"library.noMatches.heading",body:"library.noMatches.body",action:"library.noMatches.action",onclick:()=>this.query.set("")}),this.$each(this.ref(e,"list"),this.visible,t=>this.renderRow(t),Wl),e}buildEmpty(e,t,s){let i=null;this.track(w(()=>{const r=this.state.get()===t;i?.destroy(),i=null,e.replaceChildren(),r&&(i=j(()=>{const l=new U({heading:()=>o(s.heading),body:()=>o(s.body),action:{label:()=>o(s.action),onclick:s.onclick},headingLevel:2});return l.mount(e),l}))})),this.track(()=>i?.destroy())}renderRow(e){const t=document.createElement("li"),s=`/library/${e.id}`,i=document.createElement("a");i.className="ex-row",i.href=s,i.addEventListener("click",c=>{c.preventDefault(),this.router.navigate(s)});const r=document.createElement("span");r.className="ex-row__name",r.textContent=e.name,i.appendChild(r);const l=wi(e.description);if(l){const c=document.createElement("span");c.className="ex-row__excerpt",c.textContent=l,i.appendChild(c)}return t.appendChild(i),t}}class We{items=new m([]);loading=new m(!1);error=new m(null);exercises=new m([]);availableExercises=new m([]);async load(){const e=await $(this.loading,this.error,()=>v.programs.list());e&&this.items.set(e)}async create(e){const t=await $(this.loading,this.error,()=>v.programs.create(e));return t?(this.items.set([t,...this.items.get()]),t):null}async get(e){return await $(this.loading,this.error,()=>v.programs.get({id:e}))??null}async update(e,t){const s=await $(this.loading,this.error,()=>v.programs.update({id:e,...t}));return s?(this.items.set(this.items.get().map(i=>i.id===e?s:i)),s):null}async archive(e){return await $(this.loading,this.error,()=>v.programs.delete({id:e}))?(this.items.set(this.items.get().filter(s=>s.id!==e)),!0):!1}async exercisesOf(e){return v.programs.listExercises({id:e})}async loadExercises(e){const t=await $(this.loading,this.error,()=>v.programs.listExercises({id:e}));this.exercises.set(t??[])}async loadAvailableExercises(){const e=await $(this.loading,this.error,()=>v.exercises.list());return e?(this.availableExercises.set(e),!0):!1}async addExerciseToProgram(e,t){return await $(this.loading,this.error,()=>v.programs.addExercise({id:e,exerciseId:t}))?(await this.loadExercises(e),!0):!1}async reorderExercises(e,t){return await $(this.loading,this.error,()=>v.programs.reorderExercises({id:e,exerciseIds:t}))?(await this.loadExercises(e),!0):!1}async updateExerciseNotes(e,t,s){return await $(this.loading,this.error,()=>v.programs.updateExerciseNotes({id:e,exerciseId:t,notes:s}))?(await this.loadExercises(e),!0):!1}async removeExercise(e,t){return await $(this.loading,this.error,()=>v.programs.removeExercise({id:e,exerciseId:t}))?(await this.loadExercises(e),!0):!1}}const Zl=T(`
    <section class="pr-list">
        <div class="pr-list__bar">
            <button bind="create" type="button" class="pr-list__create"></button>
        </div>

        <p bind="loading" class="pr-list__loading"></p>

        <div bind="errorBox" class="pr-list__error" role="alert">
            <p bind="errorText" class="pr-list__error-text"></p>
            <button bind="retry" type="button" class="pr-list__retry"></button>
        </div>

        <div bind="emptyHost"></div>

        <ul bind="list" class="pr-list__list"></ul>
    </section>
`);class Xl extends E{static styles=`
        .pr-list {
            & .pr-list__bar {
                display: flex;
                justify-content: flex-end;
                margin-bottom: ${d("lg")};
            }

            /*
             * Buttons are Open Sans territory; the serif is forbidden here.
             * This tab has exactly one thing to offer besides reading, so it
             * carries the primary tier.
             */
            & .pr-list__create { ${C(a("radius-sm"),"primary")} }

            & .pr-list__loading {
                margin: 0;
                font-family: ${a("font-ui")};
                color: ${a("text-muted")};
                font-size: 0.875rem;
            }
            & .pr-list__loading.hidden { display: none; }

            & .pr-list__error {
                display: flex;
                align-items: center;
                gap: ${d("md")};
                flex-wrap: wrap;
                padding: ${d("md")};
                margin-bottom: ${d("lg")};
                border: 1px solid ${a("danger")};
                border-radius: ${a("radius-md")};
                background: ${a("danger-soft")};

                & .pr-list__error-text {
                    margin: 0;
                    font-family: ${a("font-ui")};
                    font-size: 0.875rem;
                    color: ${a("text")};
                }
                /* Retry is secondary: recovering from a failure is not the
                   thing this tab is for. */
                & .pr-list__retry { ${C()} }
            }
            & .pr-list__error.hidden { display: none; }

            & .pr-list__list {
                list-style: none;
                margin: 0;
                padding: 0;
                /* No zebra striping (§4.3): rows are separated by a hairline. */
                border-top: 1px solid ${a("border")};
            }
            & .pr-list__list:empty { border-top: none; }
            & .pr-list__list.hidden { display: none; }
            & .pr-list__list > li { border-bottom: 1px solid ${a("border")}; }

            & .pr-row {
                display: grid;
                grid-template-columns: minmax(0, 1fr) auto;
                align-items: start;
                gap: ${d("lg")};
                padding: ${d("md")} ${d("sm")};
                text-decoration: none;
                color: inherit;
                font-family: ${a("font-ui")};

                &:hover { background: ${a("surface-2")}; }
                &:focus-visible { outline: 2px solid ${a("accent")}; outline-offset: -2px; }
            }
            & .pr-row__body {
                display: flex;
                flex-direction: column;
                gap: ${d("xs")};
                min-width: 0;
            }
            & .pr-row__title {
                font-size: 0.9375rem;
                font-weight: 600;
                color: ${a("text")};
                overflow-wrap: anywhere;
            }
            & .pr-row__excerpt {
                font-size: 0.8125rem;
                line-height: 1.5;
                color: ${a("text-muted")};
                overflow-wrap: anywhere;
            }
            & .pr-row__count {
                font-size: 0.8125rem;
                color: ${a("text-muted")};
                white-space: nowrap;
            }

            @media (max-width: 639px) {
                & .pr-list__bar { justify-content: stretch; & button { width: 100%; } }
                & .pr-row { grid-template-columns: minmax(0, 1fr); gap: ${d("xs")}; }
            }
        }
    `;router=this.inject(H);svc=this.inject(We);resolved=new m(!1);failed=new y(()=>this.svc.error.get()!==null);isLoading=new y(()=>!this.failed.get()&&(!this.resolved.get()||this.svc.loading.get()));isEmpty=new y(()=>!this.failed.get()&&this.resolved.get()&&!this.svc.loading.get()&&this.svc.items.get().length===0);hasRows=new y(()=>!this.failed.get()&&this.resolved.get()&&this.svc.items.get().length>0);counts=new m({});onMount(){this.load()}async load(){await this.svc.load(),this.resolved.set(!0),await this.loadCounts()}async loadCounts(){const e=this.svc.items.peek(),t=await Promise.allSettled(e.map(async i=>[i.id,(await this.svc.exercisesOf(i.id)).length])),s={};for(const i of t)i.status==="fulfilled"&&(s[i.value[0]]=i.value[1]);this.counts.set(s)}render(){const e=this.wire(Zl,{create:{textContent:()=>o("programs.create"),onclick:()=>this.router.navigate("/program/nytt")},loading:{textContent:()=>o("programs.loading"),className:()=>this.isLoading.get()?"pr-list__loading":"pr-list__loading hidden"},errorBox:{className:()=>this.failed.get()?"pr-list__error":"pr-list__error hidden"},errorText:{textContent:()=>o("programs.error")},retry:{textContent:()=>o("programs.retry"),onclick:()=>{this.load()}},list:{className:()=>this.hasRows.get()?"pr-list__list":"pr-list__list hidden"}});return this.buildEmpty(this.ref(e,"emptyHost")),this.$each(this.ref(e,"list"),this.svc.items,(t,s,i)=>this.renderRow(t,i),t=>`${t.id}:${t.title}:${t.description}`),e}buildEmpty(e){let t=null;this.track(w(()=>{const s=this.isEmpty.get();t?.destroy(),t=null,e.replaceChildren(),s&&(t=j(()=>{const i=new U({heading:()=>o("programs.empty.heading"),body:()=>o("programs.empty.body"),action:{label:()=>o("programs.empty.action"),onclick:()=>this.router.navigate("/program/nytt")},headingLevel:2});return i.mount(e),i}))})),this.track(()=>t?.destroy())}renderRow(e,t){const s=document.createElement("li"),i=`/program/${e.id}`,r=document.createElement("a");r.className="pr-row",r.href=i,r.addEventListener("click",p=>{p.preventDefault(),this.router.navigate(i)});const l=document.createElement("span");l.className="pr-row__body";const c=document.createElement("span");c.className="pr-row__title",c.textContent=e.title,l.appendChild(c);const h=wi(e.description);if(h){const p=document.createElement("span");p.className="pr-row__excerpt",p.textContent=h,l.appendChild(p)}const u=document.createElement("span");return u.className="pr-row__count",t(w(()=>{const p=this.counts.get()[e.id];u.textContent=p===void 0?"":Kl(p)})),r.append(l,u),s.appendChild(r),s}}const Ql=T(`
    <div class="bibliotek">
        <header class="bibliotek__head">
            <h1 bind="heading" class="bibliotek__title"></h1>
        </header>
        <div bind="tabsHost" class="bibliotek__tabs"></div>
        <div bind="panelHost" class="bibliotek__panel"></div>
    </div>
`);class Jl extends E{static styles=`
        .bibliotek {
            & .bibliotek__head {
                display: flex;
                align-items: baseline;
                justify-content: space-between;
                gap: ${d("lg")};
                flex-wrap: wrap;
                margin-bottom: ${d("lg")};
            }

            /* Lora 500, and only 500 — UI_DECISIONS §3. */
            & .bibliotek__title {
                margin: 0;
                font-family: ${a("font-display")};
                font-weight: 500;
                font-size: 1.75rem;
                line-height: 36px;
                color: ${a("text")};
            }

            /* Two tabs never overflow, but the row still scrolls rather than
               wraps below 640px (UI_DECISIONS §6) so it behaves like every
               other tab row in the app. */
            & .bibliotek__tabs {
                margin-bottom: ${d("xl")};
                overflow-x: auto;
                scrollbar-width: none;
                &::-webkit-scrollbar { display: none; }
                & .ui-tabs { min-width: max-content; }
            }

            @media (max-width: 639px) {
                & .bibliotek__title { font-size: 1.375rem; line-height: 30px; }
            }
        }
    `;router=this.inject(H);tabQuery=this.router.query("flik");activeTab=new m(Le(this.tabQuery.peek()));panelKey=new y(()=>Le(this.activeTab.get()));onMount(){this.track(w(()=>{const e=Le(this.tabQuery.get());this.activeTab.peek()!==e&&this.activeTab.set(e)})),this.track(w(()=>{const e=Le(this.activeTab.get());j(()=>Le(this.tabQuery.get()))!==e&&this.router.navigate(Ol(e),{replace:!0})}))}render(){const e=this.wire(Ql,{heading:{textContent:()=>o("library.heading")}});return this.spawn(ht,this.ref(e,"tabsHost"),{active:this.activeTab,tabs:yi.map(t=>({key:t,label:jl(t)}))}),this.$swap(this.ref(e,"panelHost"),this.panelKey,{ovningar:Yl,program:Xl}),e}}const ed=T(`
    <form class="ex-create" bind="form">
        <a bind="back" href="/library" class="ex-create__back"></a>
        <h1 bind="heading" class="ex-create__title"></h1>

        <div class="ex-create__panel">
            <label class="ex-create__field">
                <span bind="nameLabel" class="ex-create__label"></span>
                <input bind="nameInput" type="text" maxlength="200" class="ex-create__input" required>
                <span bind="nameHint" class="ex-create__hint"></span>
                <span bind="nameError" class="ex-create__field-error" role="alert"></span>
            </label>

            <label class="ex-create__field">
                <span bind="descLabel" class="ex-create__label"></span>
                <textarea bind="descInput" rows="5" maxlength="4000" class="ex-create__textarea"></textarea>
                <span bind="descHint" class="ex-create__hint"></span>
            </label>

            <p bind="error" class="ex-create__error" role="alert"></p>

            <div class="ex-create__actions">
                <button bind="submit" type="submit" class="ex-create__submit"></button>
                <button bind="cancel" type="button" class="ex-create__cancel"></button>
            </div>
        </div>
    </form>
`);class td extends E{static styles=`
        .ex-create {
            display: flex;
            flex-direction: column;
            gap: ${d("lg")};
            max-width: 34rem;
            font-family: ${a("font-ui")};

            & .ex-create__back {
                font-size: 0.875rem;
                color: ${a("text-muted")};
                text-decoration: none;
                &:hover { color: ${a("accent-strong")}; text-decoration: underline; }
                &:focus-visible { outline: 2px solid ${a("accent")}; outline-offset: 2px; }
            }

            /* Lora 500 only (UI_DECISIONS §3). */
            & .ex-create__title {
                margin: 0;
                font-family: ${a("font-display")};
                font-weight: 500;
                font-size: 1.75rem;
                line-height: 36px;
                color: ${a("text")};
            }

            /*
             * The fields sit in a panel, not loose on the page. The §4.8 field
             * recipe fills with --bg — the page-paper colour — so a form
             * rendered straight onto the route would give the field the same
             * colour as everything behind it. The panel is what the recessed
             * fill is recessed INTO. §4.8's own example shows the same thing.
             */
            & .ex-create__panel {
                ${Q()}
                box-sizing: border-box;
                padding: ${d("xl")};
                display: flex;
                flex-direction: column;
                gap: ${d("lg")};
            }

            & .ex-create__field {
                display: flex;
                flex-direction: column;
                gap: ${d("xs")};
            }

            & .ex-create__label {
                font-size: 0.8125rem;
                font-weight: 600;
                color: ${a("text")};
            }

            & .ex-create__hint {
                font-size: 0.8125rem;
                line-height: 1.5;
                color: ${a("text-muted")};
                max-width: 68ch;
            }

            & .ex-create__field-error {
                font-size: 0.8125rem;
                line-height: 1.5;
                color: ${a("danger")};
            }
            & .ex-create__field-error:empty { display: none; }

            & .ex-create__input, & .ex-create__textarea {
                ${K()}
                width: 100%;
                box-sizing: border-box;
            }
            & .ex-create__textarea {
                font-family: inherit;
                line-height: 1.6;
                resize: vertical;
            }

            & .ex-create__error {
                margin: 0;
                min-height: 1em;
                font-size: 0.875rem;
                color: ${a("danger")};
            }

            & .ex-create__actions {
                display: flex;
                gap: ${d("sm")};
                flex-wrap: wrap;
            }
            & .ex-create__submit { ${C(a("radius-sm"),"primary")} }
            /* Avbryt leaves without writing anything; it must not read as a
               second offer beside the one action that creates the exercise. */
            & .ex-create__cancel { ${C(a("radius-sm"),"ghost")} }

            @media (max-width: 639px) {
                & .ex-create__actions { flex-direction: column; align-items: stretch; }
                & .ex-create__title { font-size: 1.375rem; line-height: 30px; }
            }
        }
    `;router=this.inject(H);svc=this.inject(yt);toasts=this.inject(te);nameVal=new m("");descVal=new m("");touched=new m(!1);render(){return this.wire(ed,{back:{onclick:this.router.link("/library").onclick,textContent:()=>o("exercise.back")},heading:{textContent:()=>o("exerciseCreate.heading")},nameLabel:{textContent:()=>o("exerciseCreate.field.name")},nameHint:{textContent:()=>o("exerciseCreate.field.name.hint")},nameInput:{value:()=>this.nameVal.get(),"aria-invalid":()=>String(this.touched.get()&&this.nameVal.get().trim()===""),oninput:e=>this.nameVal.set(e.target.value)},nameError:{textContent:()=>this.touched.get()&&this.nameVal.get().trim()===""?o("exercise.error.name"):""},descLabel:{textContent:()=>o("exerciseCreate.field.description")},descHint:{textContent:()=>o("exerciseCreate.field.description.hint")},descInput:{value:()=>this.descVal.get(),oninput:e=>this.descVal.set(e.target.value)},error:{textContent:()=>this.svc.error.get()?o("exercise.saveError"):""},submit:{textContent:()=>o("exerciseCreate.submit"),disabled:()=>this.svc.loading.get()},cancel:{textContent:()=>o("exerciseCreate.cancel"),onclick:()=>this.router.navigate("/library")},form:{onsubmit:e=>{this.submit(e)}}})}async submit(e){e.preventDefault();const t=this.nameVal.get().trim();if(this.touched.set(!0),!t)return;const s=await this.svc.create({name:t,description:this.descVal.get().trim()});s&&(this.toasts.show({message:o("exerciseCreate.created"),variant:"success"}),this.router.navigate(`/library/${s.id}`))}}const sd=T(`
    <div class="ex-detail">
        <a bind="back" href="/library" class="ex-detail__back"></a>

        <p bind="loading" class="ex-detail__loading"></p>
        <div bind="missingHost"></div>

        <div bind="body" class="ex-detail__body">
            <header class="ex-detail__head">
                <p bind="eyebrow" class="ex-detail__eyebrow"></p>
                <h1 bind="title" class="ex-detail__title"></h1>
            </header>

            <form bind="form" class="ex-detail__form">
                <div class="ex-detail__panel">
                    <label class="ex-detail__field">
                        <span bind="nameLabel" class="ex-detail__label"></span>
                        <input bind="nameInput" type="text" maxlength="200" class="ex-detail__input" required>
                        <span bind="nameError" class="ex-detail__field-error" role="alert"></span>
                    </label>

                    <label class="ex-detail__field">
                        <span bind="descLabel" class="ex-detail__label"></span>
                        <textarea bind="descInput" rows="5" maxlength="4000" class="ex-detail__textarea"></textarea>
                    </label>

                    <p bind="error" class="ex-detail__error" role="alert"></p>

                    <div class="ex-detail__actions">
                        <button bind="save" type="submit" class="ex-detail__save"></button>
                    </div>
                </div>
            </form>

            <section class="ex-detail__history">
                <h2 bind="historyHeading" class="ex-detail__section-title"></h2>
                <p bind="historyBody" class="ex-detail__section-body"></p>
                <div bind="historyPicker" class="ex-detail__history-picker">
                    <div bind="studentHost" class="ex-detail__control"></div>
                    <button bind="historyOpen" type="button" class="ex-detail__secondary"></button>
                </div>
                <p bind="historyNone" class="ex-detail__section-body"></p>
            </section>

            <section class="ex-detail__danger">
                <h2 bind="dangerHeading" class="ex-detail__danger-title"></h2>
                <p bind="dangerBody" class="ex-detail__section-body"></p>
                <button bind="archive" type="button" class="ex-detail__danger-action"></button>
            </section>
        </div>

        <div bind="confirmHost"></div>
    </div>
`);class nd extends E{static styles=`
        .ex-detail {
            display: flex;
            flex-direction: column;
            gap: ${d("lg")};
            max-width: 40rem;
            font-family: ${a("font-ui")};

            & .ex-detail__back {
                font-size: 0.875rem;
                color: ${a("text-muted")};
                text-decoration: none;
                align-self: flex-start;
                &:hover { color: ${a("accent-strong")}; text-decoration: underline; }
                &:focus-visible { outline: 2px solid ${a("accent")}; outline-offset: 2px; }
            }

            & .ex-detail__loading {
                margin: 0;
                color: ${a("text-muted")};
                font-size: 0.875rem;
            }
            & .ex-detail__loading.hidden { display: none; }

            & .ex-detail__body {
                display: flex;
                flex-direction: column;
                gap: ${d("xl")};
            }
            & .ex-detail__body.hidden { display: none; }

            & .ex-detail__eyebrow {
                margin: 0 0 ${d("xs")};
                font-size: 0.6875rem;
                line-height: 16px;
                font-weight: 700;
                letter-spacing: 0.14em;
                text-transform: uppercase;
                color: ${a("text-muted")};
            }

            /* Lora 500, and only 500 — UI_DECISIONS §3. */
            & .ex-detail__title {
                margin: 0;
                font-family: ${a("font-display")};
                font-weight: 500;
                font-size: 1.75rem;
                line-height: 36px;
                color: ${a("text")};
                overflow-wrap: anywhere;
            }

            /* Section headings are the serif too, one step down (§02). */
            & .ex-detail__section-title, & .ex-detail__danger-title {
                margin: 0 0 ${d("sm")};
                font-family: ${a("font-display")};
                font-weight: 500;
                font-size: 1.25rem;
                line-height: 28px;
                color: ${a("text")};
            }

            & .ex-detail__section-body {
                margin: 0 0 ${d("md")};
                font-size: 0.8125rem;
                line-height: 1.6;
                color: ${a("text-muted")};
                max-width: 68ch;
            }
            & .ex-detail__section-body.hidden { display: none; }

            & .ex-detail__form {
                display: flex;
                flex-direction: column;
                gap: ${d("lg")};
            }
            /*
             * The fields sit in a panel, not loose on the page. The §4.8 field
             * recipe fills with --bg — the page-paper colour — so a form
             * rendered straight onto the route would give the field the same
             * colour as everything behind it. The panel is what the recessed
             * fill is recessed INTO. §4.8's own example shows the same thing.
             */
            & .ex-detail__panel {
                ${Q()}
                box-sizing: border-box;
                padding: ${d("xl")};
                display: flex;
                flex-direction: column;
                gap: ${d("lg")};
            }

            & .ex-detail__field {
                display: flex;
                flex-direction: column;
                gap: ${d("xs")};
            }
            & .ex-detail__label {
                font-size: 0.8125rem;
                font-weight: 600;
                color: ${a("text")};
            }
            & .ex-detail__field-error {
                font-size: 0.8125rem;
                line-height: 1.5;
                color: ${a("danger")};
            }
            & .ex-detail__field-error:empty { display: none; }

            & .ex-detail__input, & .ex-detail__textarea {
                ${K()}
                width: 100%;
                box-sizing: border-box;
            }
            & .ex-detail__textarea {
                font-family: inherit;
                line-height: 1.6;
                resize: vertical;
            }

            & .ex-detail__error {
                margin: 0;
                min-height: 1em;
                font-size: 0.875rem;
                color: ${a("danger")};
            }

            & .ex-detail__actions { display: flex; gap: ${d("sm")}; flex-wrap: wrap; }
            & .ex-detail__save { ${C(a("radius-sm"),"primary")} }
            /* Öppna historik is a navigation offer in its own section, not the
               form's action — secondary keeps the single primary unambiguous. */
            & .ex-detail__secondary { ${C()} }

            & .ex-detail__history-picker {
                display: flex;
                gap: ${d("sm")};
                align-items: center;
                flex-wrap: wrap;
                & > div { flex: 1 1 14rem; }
                & .ui-select { display: block; }
            }
            & .ex-detail__history-picker.hidden { display: none; }

            /* §3.5: the destructive action lives in a SEPARATED area — its own
               surface behind a rule, not another button in the form's row. */
            & .ex-detail__danger {
                padding-top: ${d("lg")};
                border-top: 1px solid ${a("border")};
            }
            & .ex-detail__danger-title { color: ${a("danger")}; }
            & .ex-detail__danger-action { ${C(a("radius-sm"),"danger")} }

            @media (max-width: 639px) {
                & .ex-detail__title { font-size: 1.375rem; line-height: 30px; }
                & .ex-detail__history-picker { flex-direction: column; align-items: stretch; }
            }
        }
    `;router=this.inject(H);svc=this.inject(yt);students=this.inject(Ie);toasts=this.inject(te);nameVal=new m("");descVal=new m("");touched=new m(!1);resolved=new m(!1);found=new m(!1);studentVal=new m("");confirmArchive=new m(!1);rosterState=new y(()=>this.students.error.get()!==null?"error":this.students.resolved.get()?this.students.items.get().length>0?"ready":"none":"loading");hasStudents=new y(()=>this.rosterState.get()==="ready");studentOptions=new y(()=>this.students.items.get().map(e=>({value:e.id,label:e.displayName})));get exerciseId(){return this.router.route.get().split("/")[2]??""}onMount(){this.students.load(),this.svc.get(this.exerciseId).then(e=>{e&&(this.nameVal.set(e.name),this.descVal.set(e.description),this.found.set(!0)),this.resolved.set(!0)})}render(){const e=this.wire(sd,{back:{onclick:this.router.link("/library").onclick,textContent:()=>o("exercise.back")},loading:{textContent:()=>o("exercise.loading"),className:()=>this.resolved.get()?"ex-detail__loading hidden":"ex-detail__loading"},body:{className:()=>this.resolved.get()&&this.found.get()?"ex-detail__body":"ex-detail__body hidden"},eyebrow:{textContent:()=>o("exercise.eyebrow")},title:{textContent:()=>this.nameVal.get()},nameLabel:{textContent:()=>o("exercise.field.name")},nameInput:{value:()=>this.nameVal.get(),"aria-invalid":()=>String(this.touched.get()&&this.nameVal.get().trim()===""),oninput:s=>this.nameVal.set(s.target.value)},nameError:{textContent:()=>this.touched.get()&&this.nameVal.get().trim()===""?o("exercise.error.name"):""},descLabel:{textContent:()=>o("exercise.field.description")},descInput:{value:()=>this.descVal.get(),oninput:s=>this.descVal.set(s.target.value)},error:{textContent:()=>this.svc.error.get()?o("exercise.saveError"):""},save:{textContent:()=>o("exercise.save"),disabled:()=>this.svc.loading.get()},form:{onsubmit:s=>{this.save(s)}},historyHeading:{textContent:()=>o("exercise.history.heading")},historyBody:{textContent:()=>o("exercise.history.body"),className:()=>this.hasStudents.get()?"ex-detail__section-body":"ex-detail__section-body hidden"},historyPicker:{className:()=>this.hasStudents.get()?"ex-detail__history-picker":"ex-detail__history-picker hidden",inert:()=>!this.hasStudents.get()},historyNone:{textContent:()=>{switch(this.rosterState.get()){case"error":return o("exercise.history.rosterError");case"loading":return o("exercise.history.rosterLoading");case"none":return o("exercise.history.noStudents");default:return""}},className:()=>this.hasStudents.get()?"ex-detail__section-body hidden":"ex-detail__section-body"},historyOpen:{textContent:()=>o("exercise.history.open"),disabled:()=>this.studentVal.get()==="",onclick:()=>{const s=this.studentVal.get();s&&this.router.navigate(Gl(s,this.exerciseId))}},dangerHeading:{textContent:()=>o("exercise.danger.heading")},dangerBody:{textContent:()=>o("exercise.danger.body")},archive:{textContent:()=>o("exercise.danger.action"),onclick:()=>this.confirmArchive.set(!0)}});this.spawn(R,this.ref(e,"studentHost"),{value:this.studentVal,options:this.studentOptions,placeholder:o("exercise.history.placeholder")}),this.buildMissing(this.ref(e,"missingHost"));const t=this.ref(e,"confirmHost");return this.spawn(ne,t,{open:this.confirmArchive,title:o("exercise.confirm.archive.title"),message:()=>o("exercise.confirm.archive.message"),confirmLabel:o("exercise.danger.action"),cancelLabel:o("exercise.confirm.dismiss"),danger:!0,onconfirm:()=>{this.archive()}}),this.track(w(()=>{t.inert=!this.confirmArchive.get()})),e}buildMissing(e){let t=null;this.track(w(()=>{const s=this.resolved.get()&&!this.found.get();t?.destroy(),t=null,e.replaceChildren(),s&&(t=j(()=>{const i=new U({heading:()=>o("exercise.notFound.heading"),body:()=>o("exercise.notFound.body"),action:{label:()=>o("exercise.notFound.action"),onclick:()=>this.router.navigate("/library")},headingLevel:2});return i.mount(e),i}))})),this.track(()=>t?.destroy())}async save(e){e.preventDefault();const t=this.nameVal.get().trim();this.touched.set(!0),!(!t||!await this.svc.update(this.exerciseId,{name:t,description:this.descVal.get().trim()}))&&this.toasts.show({message:o("exercise.saved"),variant:"success"})}async archive(){await this.svc.archive(this.exerciseId)&&(this.toasts.show({message:o("exercise.archived"),variant:"success"}),this.router.navigate("/library"))}}const id=T('<div bind="host"></div>'),ad=T("<div></div>");let rd=class extends E{render(){return this.wire(ad,{})}};class od extends E{router=this.inject(H);key=new y(()=>{const e=this.router.route.get();return e==="/library"?"bibliotek":e==="/library/nytt"?"create":e.startsWith("/library/")?"detail":"none"});render(){const e=this.wire(id,{});return this.$swap(this.ref(e,"host"),this.key,{bibliotek:Jl,create:td,detail:nd,none:rd}),e}}class ke{items=new m([]);loading=new m(!1);error=new m(null);async load(){const e=await $(this.loading,this.error,()=>v.horses.list());e&&this.items.set(e)}async create(e){const t=await $(this.loading,this.error,()=>v.horses.create(e));return t?(this.items.set([t,...this.items.get()]),t):null}async get(e){return await $(this.loading,this.error,()=>v.horses.get({id:e}))??null}async update(e,t){const s=await $(this.loading,this.error,()=>v.horses.update({id:e,...t}));return s?(this.items.set(this.items.get().map(i=>i.id===e?s:i)),s):null}async archive(e){return await $(this.loading,this.error,()=>v.horses.delete({id:e}))?(this.items.set(this.items.get().filter(s=>s.id!==e)),!0):!1}}function ld(n){return n.filter(e=>e.archivedAt===null).sort((e,t)=>t.createdAt.localeCompare(e.createdAt))}function dd(n){return`${n.id}:${n.name}`}function cd(n){return n.failed?"error":n.loading?"loading":n.count===0?"empty":"rows"}const hd=T(`
    <div class="stable">
        <header class="stable__head">
            <h1 bind="heading" class="stable__title"></h1>
            <button bind="create" type="button" class="stable__create"></button>
        </header>

        <p bind="loading" class="stable__loading"></p>

        <div bind="errorBox" class="stable__error" role="alert">
            <p bind="errorText" class="stable__error-text"></p>
            <button bind="retry" type="button" class="stable__retry"></button>
        </div>

        <div bind="emptyHost"></div>

        <ul bind="list" class="stable__list"></ul>
    </div>
`);class ud extends E{static styles=`
        .stable {
            & .stable__head {
                display: flex;
                align-items: baseline;
                justify-content: space-between;
                gap: ${d("lg")};
                flex-wrap: wrap;
                margin-bottom: ${d("xl")};
            }

            /* Lora 500, and only 500 — UI_DECISIONS §3. */
            & .stable__title {
                margin: 0;
                font-family: ${a("font-display")};
                font-weight: 500;
                font-size: 1.75rem;
                line-height: 36px;
                color: ${a("text")};
            }

            /* Buttons are Open Sans territory; the serif is forbidden here. */
            & .stable__create { ${C(a("radius-sm"),"primary")} }

            & .stable__loading {
                margin: 0;
                font-family: ${a("font-ui")};
                color: ${a("text-muted")};
                font-size: 0.875rem;
            }
            & .stable__loading.hidden { display: none; }

            & .stable__error {
                display: flex;
                align-items: center;
                gap: ${d("md")};
                flex-wrap: wrap;
                padding: ${d("md")};
                margin-bottom: ${d("lg")};
                border: 1px solid ${a("danger")};
                border-radius: ${a("radius-md")};
                background: ${a("danger-soft")};

                & .stable__error-text {
                    margin: 0;
                    font-family: ${a("font-ui")};
                    font-size: 0.875rem;
                    color: ${a("text")};
                }
                & .stable__retry { ${C()} }
            }
            & .stable__error.hidden { display: none; }

            & .stable__list {
                list-style: none;
                margin: 0;
                padding: 0;
                /* No zebra striping (§4.3): rows are separated by a hairline. */
                border-top: 1px solid ${a("border")};
            }
            & .stable__list:empty { border-top: none; }
            & .stable__list.hidden { display: none; }
            & .stable__list > li { border-bottom: 1px solid ${a("border")}; }

            & .horse-row {
                display: block;
                padding: ${d("md")} ${d("sm")};
                text-decoration: none;
                color: ${a("text")};
                font-family: ${a("font-ui")};
                font-size: 0.9375rem;
                font-weight: 600;
                overflow-wrap: anywhere;

                &:hover { background: ${a("surface-2")}; }
                &:focus-visible { outline: 2px solid ${a("accent")}; outline-offset: -2px; }
            }

            @media (max-width: 639px) {
                & .stable__title { font-size: 1.375rem; line-height: 30px; }
                & .stable__head { flex-direction: column; align-items: stretch; }
            }
        }
    `;router=this.inject(H);svc=this.inject(ke);resolved=new m(!1);horses=new y(()=>ld(this.svc.items.get()));state=new y(()=>cd({loading:!this.resolved.get()||this.svc.loading.get(),failed:this.svc.error.get()!==null,count:this.horses.get().length}));onMount(){this.load()}async load(){await this.svc.load(),this.resolved.set(!0)}render(){const e=this.wire(hd,{heading:{textContent:()=>o("stable.heading")},create:{textContent:()=>o("stable.create"),onclick:()=>this.router.navigate("/hastar/nytt")},loading:{textContent:()=>o("stable.loading"),className:()=>this.state.get()==="loading"?"stable__loading":"stable__loading hidden"},errorBox:{className:()=>this.state.get()==="error"?"stable__error":"stable__error hidden"},errorText:{textContent:()=>o("stable.error")},retry:{textContent:()=>o("stable.retry"),onclick:()=>{this.load()}},list:{className:()=>this.state.get()==="rows"?"stable__list":"stable__list hidden"}});return this.buildEmpty(this.ref(e,"emptyHost")),this.$each(this.ref(e,"list"),this.horses,t=>this.renderRow(t),dd),e}buildEmpty(e){let t=null;this.track(w(()=>{const s=this.state.get()==="empty";t?.destroy(),t=null,e.replaceChildren(),s&&(t=j(()=>{const i=new U({heading:()=>o("stable.empty.heading"),body:()=>o("stable.empty.body"),action:{label:()=>o("stable.empty.action"),onclick:()=>this.router.navigate("/hastar/nytt")},headingLevel:2});return i.mount(e),i}))})),this.track(()=>t?.destroy())}renderRow(e){const t=document.createElement("li"),s=`/hastar/${e.id}`,i=document.createElement("a");return i.className="horse-row",i.href=s,i.textContent=e.name,i.addEventListener("click",r=>{r.preventDefault(),this.router.navigate(s)}),t.appendChild(i),t}}const pd=T(`
    <form class="horse-create" bind="form">
        <a bind="back" href="/hastar" class="horse-create__back"></a>
        <h1 bind="heading" class="horse-create__title"></h1>

        <div class="horse-create__panel">
            <label class="horse-create__field">
                <span bind="nameLabel" class="horse-create__label"></span>
                <input bind="nameInput" type="text" maxlength="200" class="horse-create__input" required>
                <span bind="nameHint" class="horse-create__hint"></span>
                <span bind="nameError" class="horse-create__field-error" role="alert"></span>
            </label>

            <p bind="error" class="horse-create__error" role="alert"></p>

            <div class="horse-create__actions">
                <button bind="submit" type="submit" class="horse-create__submit"></button>
                <button bind="cancel" type="button" class="horse-create__cancel"></button>
            </div>
        </div>
    </form>
`);class md extends E{static styles=`
        .horse-create {
            display: flex;
            flex-direction: column;
            gap: ${d("lg")};
            max-width: 34rem;
            font-family: ${a("font-ui")};

            & .horse-create__back {
                font-size: 0.875rem;
                color: ${a("text-muted")};
                text-decoration: none;
                &:hover { color: ${a("accent-strong")}; text-decoration: underline; }
                &:focus-visible { outline: 2px solid ${a("accent")}; outline-offset: 2px; }
            }

            /* Lora 500 only (UI_DECISIONS §3). */
            & .horse-create__title {
                margin: 0;
                font-family: ${a("font-display")};
                font-weight: 500;
                font-size: 1.75rem;
                line-height: 36px;
                color: ${a("text")};
            }

            /*
             * The fields sit in a panel, not loose on the page. The §4.8 field
             * recipe fills with --bg — the page-paper colour — so a form
             * rendered straight onto the route would give the field the same
             * colour as everything behind it. The panel is what the recessed
             * fill is recessed INTO. §4.8's own example shows the same thing.
             */
            & .horse-create__panel {
                ${Q()}
                box-sizing: border-box;
                padding: ${d("xl")};
                display: flex;
                flex-direction: column;
                gap: ${d("lg")};
            }

            & .horse-create__field { display: flex; flex-direction: column; gap: ${d("xs")}; }
            & .horse-create__label {
                font-size: 0.8125rem;
                font-weight: 600;
                color: ${a("text")};
            }
            & .horse-create__hint {
                font-size: 0.8125rem;
                line-height: 1.5;
                color: ${a("text-muted")};
                max-width: 68ch;
            }
            & .horse-create__field-error {
                font-size: 0.8125rem;
                line-height: 1.5;
                color: ${a("danger")};
            }
            & .horse-create__field-error:empty { display: none; }

            & .horse-create__input {
                ${K()}
                width: 100%;
                box-sizing: border-box;
            }

            & .horse-create__error {
                margin: 0;
                min-height: 1em;
                font-size: 0.875rem;
                color: ${a("danger")};
            }

            & .horse-create__actions { display: flex; gap: ${d("sm")}; flex-wrap: wrap; }
            & .horse-create__submit { ${C(a("radius-sm"),"primary")} }
            /* Avbryt walks away from the form; it must not read as a second
               offer beside the one action that saves the horse. */
            & .horse-create__cancel { ${C(a("radius-sm"),"ghost")} }

            @media (max-width: 639px) {
                & .horse-create__actions { flex-direction: column; align-items: stretch; }
                & .horse-create__title { font-size: 1.375rem; line-height: 30px; }
            }
        }
    `;router=this.inject(H);svc=this.inject(ke);toasts=this.inject(te);nameVal=new m("");touched=new m(!1);render(){return this.wire(pd,{back:{onclick:this.router.link("/hastar").onclick,textContent:()=>o("horse.back")},heading:{textContent:()=>o("horseCreate.heading")},nameLabel:{textContent:()=>o("horseCreate.field.name")},nameHint:{textContent:()=>o("horseCreate.field.name.hint")},nameInput:{value:()=>this.nameVal.get(),"aria-invalid":()=>String(this.touched.get()&&this.nameVal.get().trim()===""),oninput:e=>this.nameVal.set(e.target.value)},nameError:{textContent:()=>this.touched.get()&&this.nameVal.get().trim()===""?o("horse.error.name"):""},error:{textContent:()=>this.svc.error.get()?o("horse.saveError"):""},submit:{textContent:()=>o("horseCreate.submit"),disabled:()=>this.svc.loading.get()},cancel:{textContent:()=>o("horseCreate.cancel"),onclick:()=>this.router.navigate("/hastar")},form:{onsubmit:e=>{this.submit(e)}}})}async submit(e){e.preventDefault();const t=this.nameVal.get().trim();this.touched.set(!0),!(!t||!await this.svc.create({name:t}))&&(this.toasts.show({message:o("horseCreate.created"),variant:"success"}),this.router.navigate("/hastar"))}}const gd=T(`
    <div class="horse-edit">
        <a bind="back" href="/hastar" class="horse-edit__back"></a>

        <p bind="loading" class="horse-edit__loading"></p>
        <div bind="missingHost"></div>

        <div bind="body" class="horse-edit__body">
            <header>
                <p bind="eyebrow" class="horse-edit__eyebrow"></p>
                <h1 bind="title" class="horse-edit__title"></h1>
            </header>

            <form bind="form" class="horse-edit__form">
                <div class="horse-edit__panel">
                    <label class="horse-edit__field">
                        <span bind="nameLabel" class="horse-edit__label"></span>
                        <input bind="nameInput" type="text" maxlength="200" class="horse-edit__input" required>
                        <span bind="nameError" class="horse-edit__field-error" role="alert"></span>
                    </label>

                    <p bind="error" class="horse-edit__error" role="alert"></p>

                    <div class="horse-edit__actions">
                        <button bind="save" type="submit" class="horse-edit__save"></button>
                    </div>
                </div>
            </form>

            <section class="horse-edit__danger">
                <h2 bind="dangerHeading" class="horse-edit__danger-title"></h2>
                <p bind="dangerBody" class="horse-edit__danger-body"></p>
                <button bind="archive" type="button" class="horse-edit__danger-action"></button>
            </section>
        </div>

        <div bind="confirmHost"></div>
    </div>
`);class fd extends E{static styles=`
        .horse-edit {
            display: flex;
            flex-direction: column;
            gap: ${d("lg")};
            max-width: 34rem;
            font-family: ${a("font-ui")};

            & .horse-edit__back {
                font-size: 0.875rem;
                color: ${a("text-muted")};
                text-decoration: none;
                align-self: flex-start;
                &:hover { color: ${a("accent-strong")}; text-decoration: underline; }
                &:focus-visible { outline: 2px solid ${a("accent")}; outline-offset: 2px; }
            }

            & .horse-edit__loading {
                margin: 0;
                color: ${a("text-muted")};
                font-size: 0.875rem;
            }
            & .horse-edit__loading.hidden { display: none; }

            & .horse-edit__body { display: flex; flex-direction: column; gap: ${d("xl")}; }
            & .horse-edit__body.hidden { display: none; }

            & .horse-edit__eyebrow {
                margin: 0 0 ${d("xs")};
                font-size: 0.6875rem;
                line-height: 16px;
                font-weight: 700;
                letter-spacing: 0.14em;
                text-transform: uppercase;
                color: ${a("text-muted")};
            }

            /* Lora 500, and only 500 — UI_DECISIONS §3. */
            & .horse-edit__title {
                margin: 0;
                font-family: ${a("font-display")};
                font-weight: 500;
                font-size: 1.75rem;
                line-height: 36px;
                color: ${a("text")};
                overflow-wrap: anywhere;
            }
            & .horse-edit__danger-title {
                margin: 0 0 ${d("sm")};
                font-family: ${a("font-display")};
                font-weight: 500;
                font-size: 1.25rem;
                line-height: 28px;
                color: ${a("danger")};
            }

            & .horse-edit__form { display: flex; flex-direction: column; gap: ${d("lg")}; }

            /*
             * The fields sit in a panel, not loose on the page. The §4.8 field
             * recipe fills with --bg — the page-paper colour — so a form
             * rendered straight onto the route would give the field the same
             * colour as everything behind it. The panel is what the recessed
             * fill is recessed INTO. §4.8's own example shows the same thing.
             */
            & .horse-edit__panel {
                ${Q()}
                box-sizing: border-box;
                padding: ${d("xl")};
                display: flex;
                flex-direction: column;
                gap: ${d("lg")};
            }

            & .horse-edit__field { display: flex; flex-direction: column; gap: ${d("xs")}; }
            & .horse-edit__label {
                font-size: 0.8125rem;
                font-weight: 600;
                color: ${a("text")};
            }
            & .horse-edit__field-error {
                font-size: 0.8125rem;
                line-height: 1.5;
                color: ${a("danger")};
            }
            & .horse-edit__field-error:empty { display: none; }

            & .horse-edit__input {
                ${K()}
                width: 100%;
                box-sizing: border-box;
            }

            & .horse-edit__error {
                margin: 0;
                min-height: 1em;
                font-size: 0.875rem;
                color: ${a("danger")};
            }

            & .horse-edit__actions { display: flex; gap: ${d("sm")}; flex-wrap: wrap; }
            & .horse-edit__save { ${C(a("radius-sm"),"primary")} }

            /* §3.15: archive lives in a SEPARATED danger area, behind a rule —
               not as a second button in the save row, where a mis-aimed click
               costs a horse. */
            & .horse-edit__danger {
                padding-top: ${d("lg")};
                border-top: 1px solid ${a("border")};
            }
            & .horse-edit__danger-body {
                margin: 0 0 ${d("md")};
                font-size: 0.8125rem;
                line-height: 1.6;
                color: ${a("text-muted")};
                max-width: 68ch;
            }
            & .horse-edit__danger-action { ${C(a("radius-sm"),"danger")} }

            @media (max-width: 639px) {
                & .horse-edit__title { font-size: 1.375rem; line-height: 30px; }
            }
        }
    `;router=this.inject(H);svc=this.inject(ke);toasts=this.inject(te);nameVal=new m("");touched=new m(!1);resolved=new m(!1);found=new m(!1);confirmArchive=new m(!1);get horseId(){return this.router.route.get().split("/")[2]??""}onMount(){this.svc.get(this.horseId).then(e=>{e&&(this.nameVal.set(e.name),this.found.set(!0)),this.resolved.set(!0)})}render(){const e=this.wire(gd,{back:{onclick:this.router.link("/hastar").onclick,textContent:()=>o("horse.back")},loading:{textContent:()=>o("horse.loading"),className:()=>this.resolved.get()?"horse-edit__loading hidden":"horse-edit__loading"},body:{className:()=>this.resolved.get()&&this.found.get()?"horse-edit__body":"horse-edit__body hidden"},eyebrow:{textContent:()=>o("horse.eyebrow")},title:{textContent:()=>this.nameVal.get()},nameLabel:{textContent:()=>o("horse.field.name")},nameInput:{value:()=>this.nameVal.get(),"aria-invalid":()=>String(this.touched.get()&&this.nameVal.get().trim()===""),oninput:s=>this.nameVal.set(s.target.value)},nameError:{textContent:()=>this.touched.get()&&this.nameVal.get().trim()===""?o("horse.error.name"):""},error:{textContent:()=>this.svc.error.get()?o("horse.saveError"):""},save:{textContent:()=>o("horse.save"),disabled:()=>this.svc.loading.get()},form:{onsubmit:s=>{this.save(s)}},dangerHeading:{textContent:()=>o("horse.danger.heading")},dangerBody:{textContent:()=>o("horse.danger.body")},archive:{textContent:()=>o("horse.danger.action"),onclick:()=>this.confirmArchive.set(!0)}});this.buildMissing(this.ref(e,"missingHost"));const t=this.ref(e,"confirmHost");return this.spawn(ne,t,{open:this.confirmArchive,title:o("horse.confirm.archive.title"),message:()=>o("horse.confirm.archive.message"),confirmLabel:o("horse.danger.action"),cancelLabel:o("horse.confirm.dismiss"),danger:!0,onconfirm:()=>{this.archive()}}),this.track(w(()=>{t.inert=!this.confirmArchive.get()})),e}buildMissing(e){let t=null;this.track(w(()=>{const s=this.resolved.get()&&!this.found.get();t?.destroy(),t=null,e.replaceChildren(),s&&(t=j(()=>{const i=new U({heading:()=>o("horse.notFound.heading"),body:()=>o("horse.notFound.body"),action:{label:()=>o("horse.notFound.action"),onclick:()=>this.router.navigate("/hastar")},headingLevel:2});return i.mount(e),i}))})),this.track(()=>t?.destroy())}async save(e){e.preventDefault();const t=this.nameVal.get().trim();this.touched.set(!0),!(!t||!await this.svc.update(this.horseId,{name:t}))&&this.toasts.show({message:o("horse.saved"),variant:"success"})}async archive(){await this.svc.archive(this.horseId)&&(this.toasts.show({message:o("horse.archived"),variant:"success"}),this.router.navigate("/hastar"))}}const bd=T('<div bind="host"></div>');class _d extends E{router=this.inject(H);key=new y(()=>{const e=this.router.route.get();return e==="/hastar"?"list":e==="/hastar/nytt"?"create":"detail"});render(){const e=this.wire(bd,{});return this.$swap(this.ref(e,"host"),this.key,{list:ud,create:md,detail:fd}),e}}class ps{items=new m([]);loading=new m(!1);error=new m(null);async load(){const e=await $(this.loading,this.error,()=>v.lessons.list());e&&this.items.set(e)}async create(e){const[t,...s]=e.programIds??[],i=await $(this.loading,this.error,()=>v.lessons.create({studentId:e.studentId,scheduledAt:e.scheduledAt,...e.planId?{planId:e.planId}:{},...t?{programId:t}:{}}));if(!i)return null;let r=null;const l=async c=>{await $(this.loading,this.error,c)===void 0&&!r&&(r=this.error.get())};for(const c of s)await l(()=>v.lessons.attachProgram({id:i.id,programId:c}));return e.horseId&&await l(()=>v.lessons.update({id:i.id,horseId:e.horseId})),await this.load(),r&&this.error.set(r),{lesson:i,incomplete:r!==null}}async loadOne(e){const t=await $(this.loading,this.error,()=>v.lessons.get({id:e}));if(!t)return null;const s=this.items.get(),i=s.findIndex(r=>r.id===e);return this.items.set(i===-1?[...s,t]:[...s.slice(0,i),t,...s.slice(i+1)]),t}get(e){return this.items.get().find(t=>t.id===e)??null}async update(e,t){const s=await $(this.loading,this.error,()=>v.lessons.update({id:e,...t}));return s?(await this.load(),s):null}async addExercise(e,t){const s=await $(this.loading,this.error,()=>v.lessons.addExercise({id:e,exerciseId:t}));return s?(await this.load(),s):null}async removeExercise(e,t){const s=await $(this.loading,this.error,()=>v.lessons.removeExercise({id:e,exerciseId:t}));return s?(await this.load(),s):null}async attachProgram(e,t){const s=await $(this.loading,this.error,()=>v.lessons.attachProgram({id:e,programId:t}));return s?(await this.load(),s):null}async detachProgram(e,t){const s=await $(this.loading,this.error,()=>v.lessons.detachProgram({id:e,programId:t}));return s?(await this.load(),s):null}async transition(e,t){const s=await $(this.loading,this.error,()=>v.lessons.transition({id:e,target:t}));return s?(await this.load(),s):null}}const vd=T(`
    <div class="lessons">
        <header class="lessons__head">
            <h1 bind="heading" class="lessons__title"></h1>
            <button bind="book" type="button" class="lessons__book"></button>
        </header>

        <p bind="loading" class="lessons__loading"></p>

        <div bind="errorBox" class="lessons__error" role="alert">
            <p bind="errorText" class="lessons__error-text"></p>
            <button bind="retry" type="button" class="lessons__retry"></button>
        </div>

        <div bind="emptyHost"></div>

        <section bind="upcomingSection" class="lessons__group">
            <h2 bind="upcomingLabel" class="lessons__group-label"></h2>
            <ul bind="upcomingList" class="lessons__list"></ul>
        </section>
        <section bind="pastSection" class="lessons__group">
            <h2 bind="pastLabel" class="lessons__group-label"></h2>
            <ul bind="pastList" class="lessons__list"></ul>
        </section>
    </div>
`);class yd extends E{static styles=`
        .lessons {
            & .lessons__head {
                display: flex;
                align-items: baseline;
                justify-content: space-between;
                gap: ${d("lg")};
                flex-wrap: wrap;
                margin-bottom: ${d("xl")};
            }

            /* Lora 500, and only 500 — UI_DECISIONS §3. */
            & .lessons__title {
                margin: 0;
                font-family: ${a("font-display")};
                font-weight: 500;
                font-size: 1.75rem;
                line-height: 36px;
                color: ${a("text")};
            }

            /* Buttons are Open Sans territory; the serif is forbidden here. */
            & .lessons__book { ${C(a("radius-sm"),"primary")} }
            & .lessons__book.hidden { display: none; }

            & .lessons__loading {
                margin: 0;
                color: ${a("text-muted")};
                font-size: 0.875rem;
            }
            & .lessons__loading.hidden { display: none; }

            & .lessons__error {
                display: flex;
                align-items: center;
                gap: ${d("md")};
                flex-wrap: wrap;
                padding: ${d("md")};
                margin-bottom: ${d("lg")};
                border: 1px solid ${a("danger")};
                border-radius: ${a("radius-md")};
                background: ${a("danger-soft")};

                & .lessons__error-text { margin: 0; font-size: 0.875rem; color: ${a("text")}; }
                & .lessons__retry { ${C()} }
            }
            & .lessons__error.hidden { display: none; }

            & .lessons__group { margin-bottom: ${d("xl")}; }
            & .lessons__group.hidden { display: none; }

            /* Uppercase group label — letterspaced, never the serif (§4.3). */
            & .lessons__group-label {
                margin: 0 0 ${d("md")};
                font-family: ${a("font-ui")};
                font-size: 0.6875rem;
                line-height: 16px;
                font-weight: 700;
                letter-spacing: 0.14em;
                text-transform: uppercase;
                color: ${a("text-muted")};
            }

            & .lessons__list {
                list-style: none;
                margin: 0;
                padding: 0;
                /* No zebra striping (§4.3): rows are separated by a hairline. */
                border-top: 1px solid ${a("border")};
            }
            & .lessons__list > li { border-bottom: 1px solid ${a("border")}; }

            & .lesson-row {
                display: grid;
                grid-template-columns: auto minmax(0, 1fr) auto auto;
                align-items: start;
                gap: ${d("lg")};
                padding: ${d("md")} ${d("sm")};
                text-decoration: none;
                color: inherit;
                font-family: ${a("font-ui")};

                &:hover { background: ${a("surface-2")}; }
                &:focus-visible { outline: 2px solid ${a("accent")}; outline-offset: -2px; }
            }

            /* Cancelled is muted but READABLE (IA §3.7) — text-muted rather than
               an opacity wash, so the row keeps its contrast against the page
               instead of fading toward it. The dashed status pill and its ✕ are
               what carry the meaning; the dimming only ranks the row. */
            & .lesson-row--cancelled {
                & .lesson-row__title, & .lesson-row__day, & .lesson-row__time { color: ${a("text-muted")}; }
            }

            & .lesson-row__date {
                display: flex;
                flex-direction: column;
                align-items: center;
                width: 3.5rem;
                /* Tabular numerals so the blocks line up column-wise (§4.3). */
                font-variant-numeric: tabular-nums;
            }
            & .lesson-row__day {
                font-size: 1.25rem;
                font-weight: 700;
                line-height: 1.2;
                color: ${a("text")};
            }
            & .lesson-row__month {
                font-size: 0.6875rem;
                font-weight: 700;
                letter-spacing: 0.12em;
                color: ${a("text-muted")};
            }
            & .lesson-row__time {
                margin-top: 2px;
                font-size: 0.8125rem;
                color: ${a("text-muted")};
            }

            & .lesson-row__body {
                display: flex;
                flex-direction: column;
                gap: ${d("xs")};
                min-width: 0;
            }
            & .lesson-row__title {
                font-size: 0.9375rem;
                font-weight: 600;
                color: ${a("text")};
                overflow-wrap: anywhere;
            }
            /* One meta line, not four — §4.3 allows at most two rows of text. */
            & .lesson-row__meta {
                display: flex;
                align-items: baseline;
                flex-wrap: wrap;
                gap: ${d("xs")} ${d("sm")};
                font-size: 0.8125rem;
                color: ${a("text-muted")};
            }

            & .lesson-row__chips {
                display: flex;
                flex-wrap: wrap;
                gap: ${d("xs")};
                justify-content: flex-end;
                max-width: 16rem;
            }
            /* Row chips are labels, not links: a nested anchor inside the row's
               own anchor is invalid, and §4.3 wants the row to have exactly one
               target. The clickable parent chips live in the detail header. */
            & .lesson-row__chip {
                display: inline-flex;
                align-items: center;
                padding: 2px ${d("sm")};
                border: 1px solid ${a("border")};
                border-radius: ${a("radius-pill")};
                font-size: 0.75rem;
                font-weight: 600;
                line-height: 1.4;
                color: ${a("text-muted")};
                white-space: nowrap;
                max-width: 14rem;
                overflow: hidden;
                text-overflow: ellipsis;
            }

            & .lesson-row__status { padding-top: 2px; }

            /* UI_DECISIONS §6: single column below 640px. The date block keeps
               its own row and turns horizontal so it stops being a tall stack
               beside nothing. */
            @media (max-width: 639px) {
                & .lesson-row {
                    grid-template-columns: minmax(0, 1fr) auto;
                    gap: ${d("sm")};
                }
                & .lesson-row__date {
                    flex-direction: row;
                    align-items: baseline;
                    gap: ${d("xs")};
                    width: auto;
                }
                & .lesson-row__day { font-size: 1rem; }
                & .lesson-row__body { grid-column: 1 / -1; }
                & .lesson-row__chips { grid-column: 1 / -1; justify-content: flex-start; max-width: none; }
            }
        }
    `;router=this.inject(H);lessons=this.inject(ps);students=this.inject(Ie);nowIso=new m(new Date().toISOString());grouped=new y(()=>Vn(this.lessons.items.get(),this.nowIso.get()));upcoming=new y(()=>this.grouped.get().upcoming);past=new y(()=>this.grouped.get().past);canBook=new y(()=>this.students.items.get().length>0);isEmpty=new y(()=>this.lessons.items.get().length===0&&!this.lessons.loading.get()&&this.lessons.error.get()===null);onMount(){this.lessons.load(),this.students.load()}render(){const e=this.wire(vd,{heading:{textContent:()=>o("lessons.heading")},upcomingLabel:{textContent:()=>o("lessons.group.upcoming")},pastLabel:{textContent:()=>o("lessons.group.past")},book:{textContent:()=>o("lessons.book"),className:()=>this.canBook.get()?"lessons__book":"lessons__book hidden",onclick:()=>this.router.navigate("/lektioner/ny")},loading:{textContent:()=>o("lessons.loading"),className:()=>this.lessons.loading.get()&&this.lessons.items.get().length===0?"lessons__loading":"lessons__loading hidden"},errorBox:{className:()=>this.lessons.error.get()?"lessons__error":"lessons__error hidden"},errorText:{textContent:()=>o("lessons.error")},retry:{textContent:()=>o("lessons.retry"),onclick:()=>{this.lessons.load()}},upcomingSection:{className:()=>this.upcoming.get().length===0?"lessons__group hidden":"lessons__group"},pastSection:{className:()=>this.past.get().length===0?"lessons__group hidden":"lessons__group"}});return this.buildEmpty(this.ref(e,"emptyHost")),this.$each(this.ref(e,"upcomingList"),this.upcoming,(t,s,i)=>this.renderRow(t,i),Zs),this.$each(this.ref(e,"pastList"),this.past,(t,s,i)=>this.renderRow(t,i),Zs),e}buildEmpty(e){const t=document.createElement("div");e.appendChild(t);let s=null;this.track(w(()=>{const i=this.isEmpty.get(),r=this.canBook.get();s?.destroy(),s=null,t.replaceChildren(),i&&(s=j(()=>{const l=new U(r?{heading:()=>o("lessons.empty.teacher.heading"),body:()=>o("lessons.empty.teacher.body"),action:{label:()=>o("lessons.book"),onclick:()=>this.router.navigate("/lektioner/ny")},headingLevel:2}:{heading:()=>o("lessons.empty.rider.heading"),body:()=>o("lessons.empty.rider.body"),action:{label:()=>o("lessons.empty.rider.action"),onclick:()=>this.router.navigate("/students")},headingLevel:2});return l.mount(t),l}))})),this.track(()=>s?.destroy())}renderRow(e,t){const s=document.createElement("li"),i=`/lektioner/${e.id}`,r=document.createElement("a");r.className=e.status==="cancelled"?"lesson-row lesson-row--cancelled":"lesson-row",r.href=i,r.addEventListener("click",S=>{S.preventDefault(),this.router.navigate(i)});const l=Fn(e.scheduledAt),c=document.createElement("span");c.className="lesson-row__date";for(const[S,O]of[["day",l.day],["month",l.month],["time",l.time]]){const M=document.createElement("span");M.className=`lesson-row__${S}`,M.textContent=O,c.appendChild(M)}const h=document.createElement("span");h.className="lesson-row__body";const u=document.createElement("span");u.className="lesson-row__title",u.textContent=ze(e),h.appendChild(u);const p=document.createElement("span");p.className="lesson-row__meta";const b=document.createElement("span");p.appendChild(b);const _=new vt({name:e.counterpartyDisplayName,role:$r(e.role)});_.mount(b),t(()=>_.destroy()),e.horseName&&p.appendChild(hn(e.horseName)),p.appendChild(hn(Mn(e.exercises))),h.appendChild(p);const k=document.createElement("span");k.className="lesson-row__chips",e.planTitle&&k.appendChild(un(dt(e.planTitle)));for(const S of Rn(e))k.appendChild(un(os(S)));const I=document.createElement("span");I.className="lesson-row__status";const N=rs(e.status),A=new ie({label:N.label,variant:N.variant,tone:N.tone,...N.glyph===void 0?{}:{glyph:N.glyph}});return A.mount(I),t(()=>A.destroy()),r.append(c,h,k,I),s.appendChild(r),s}}function hn(n){const e=document.createElement("span");return e.textContent=n,e}function un(n){const e=document.createElement("span");return e.className="lesson-row__chip",e.textContent=n,e.title=n,e}const xd=T(`
    <form class="lesson-create" bind="form">
        <a bind="back" href="/lektioner" class="lesson-create__back"></a>
        <h1 bind="heading" class="lesson-create__title"></h1>

        <div class="lesson-create__panel">
            <label class="lesson-create__field">
                <span bind="studentLabel" class="lesson-create__label"></span>
                <div bind="studentHost" class="lesson-create__control"></div>
            </label>

            <label class="lesson-create__field">
                <span bind="whenLabel" class="lesson-create__label"></span>
                <input bind="whenInput" type="datetime-local" class="lesson-create__input" required>
            </label>

            <label class="lesson-create__field">
                <span bind="horseLabel" class="lesson-create__label"></span>
                <div bind="horseHost" class="lesson-create__control"></div>
                <span bind="horseHint" class="lesson-create__hint"></span>
            </label>

            <label class="lesson-create__field">
                <span bind="planLabel" class="lesson-create__label"></span>
                <div bind="planHost" class="lesson-create__control"></div>
                <span bind="planHint" class="lesson-create__hint"></span>
            </label>

            <label class="lesson-create__field">
                <span bind="programLabel" class="lesson-create__label"></span>
                <div bind="programHost" class="lesson-create__control"></div>
                <span bind="programHint" class="lesson-create__hint"></span>
            </label>

            <p bind="error" class="lesson-create__error" role="alert"></p>

            <div class="lesson-create__actions">
                <button bind="submit" type="submit" class="lesson-create__submit"></button>
                <button bind="cancel" type="button" class="lesson-create__cancel"></button>
            </div>
        </div>
    </form>
`);function wd(n){return new Date(n).toISOString()}class kd extends E{static styles=`
        .lesson-create {
            display: flex;
            flex-direction: column;
            gap: ${d("lg")};
            max-width: 34rem;
            font-family: ${a("font-ui")};

            & .lesson-create__back {
                font-size: 0.875rem;
                color: ${a("text-muted")};
                text-decoration: none;
                &:hover { color: ${a("accent-strong")}; text-decoration: underline; }
                &:focus-visible { outline: 2px solid ${a("accent")}; outline-offset: 2px; }
            }

            /* Lora 500 only (UI_DECISIONS §3). */
            & .lesson-create__title {
                margin: 0;
                font-family: ${a("font-display")};
                font-weight: 500;
                font-size: 1.75rem;
                line-height: 36px;
                color: ${a("text")};
            }

            /*
             * The fields sit in a panel, not loose on the page. The §4.8 field
             * recipe fills with --bg — the page-paper colour — so a form
             * rendered straight onto the route would give the field the same
             * colour as everything behind it. The panel is what the recessed
             * fill is recessed INTO. §4.8's own example shows the same thing.
             */
            & .lesson-create__panel {
                ${Q()}
                box-sizing: border-box;
                padding: ${d("xl")};
                display: flex;
                flex-direction: column;
                gap: ${d("lg")};
            }

            & .lesson-create__field {
                display: flex;
                flex-direction: column;
                gap: ${d("xs")};
            }

            & .lesson-create__label {
                font-size: 0.8125rem;
                font-weight: 600;
                color: ${a("text")};
            }

            & .lesson-create__hint {
                font-size: 0.8125rem;
                line-height: 1.5;
                color: ${a("text-muted")};
                max-width: 68ch;
            }

            & .lesson-create__input {
                ${K()}
                width: 100%;
                box-sizing: border-box;
            }

            & .lesson-create__control .ui-select { display: block; }

            & .lesson-create__error {
                margin: 0;
                min-height: 1em;
                font-size: 0.875rem;
                color: ${a("danger")};
            }

            & .lesson-create__actions {
                display: flex;
                gap: ${d("sm")};
                flex-wrap: wrap;
            }
            /* §4.8: one primary per form. This is it. */
            & .lesson-create__submit { ${C(a("radius-sm"),"primary")} }
            /* Cancel is the ghost tier — not a second bordered button. */
            & .lesson-create__cancel { ${C(a("radius-sm"),"ghost")} }

            /* UI_DECISIONS §6: single column below 640px. The form is already
               one column, so only the action row needs to stack. */
            @media (max-width: 639px) {
                & .lesson-create__actions { flex-direction: column; align-items: stretch; }
                & .lesson-create__title { font-size: 1.375rem; line-height: 30px; }
            }
        }
    `;router=this.inject(H);lessons=this.inject(ps);students=this.inject(Ie);programs=this.inject(We);toasts=this.inject(te);studentVal=new m("");whenVal=new m("");horseVal=new m("");planVal=new m("");programVals=new m([]);horses=new m([]);plans=new m([]);validation=new m("");needsStudent=new y(()=>this.studentVal.get()==="");studentOptions=new y(()=>this.students.items.get().map(e=>({value:e.id,label:e.displayName})));horseOptions=new y(()=>[{value:"",label:o("lesson.horse.none")},...Bn(this.horses.get()).map(e=>({value:e.id,label:e.name}))]);planOptions=new y(()=>[{value:"",label:o("lesson.plan.none")},...qn(this.plans.get()).map(e=>({value:e.id,label:e.title}))]);programOptions=new y(()=>this.programs.items.get().map(e=>({value:e.id,label:e.title})));onMount(){const e=this.router.query("elev").peek();e&&this.studentVal.set(e),this.students.load().then(()=>{const t=this.studentVal.peek();t&&!this.students.items.peek().some(s=>s.id===t)&&this.studentVal.set("")}),this.programs.load(),this.track(w(()=>{const t=this.studentVal.get();if(this.horseVal.set(""),this.planVal.set(""),!t){this.horses.set([]),this.plans.set([]);return}Promise.all([v.students.listHorses({id:t}),v.students.listPlans({id:t})]).then(([s,i])=>{this.studentVal.get()===t&&(this.horses.set(s),this.plans.set(i))}).catch(()=>{this.studentVal.get()===t&&(this.horses.set([]),this.plans.set([]))})}))}render(){const e=this.wire(xd,{back:{onclick:this.router.link("/lektioner").onclick,textContent:()=>o("lesson.back")},heading:{textContent:()=>o("lessonCreate.heading")},studentLabel:{textContent:()=>o("lessonCreate.field.student")},whenLabel:{textContent:()=>o("lessonCreate.field.when")},horseLabel:{textContent:()=>o("lessonCreate.field.horse")},horseHint:{textContent:()=>o("lessonCreate.field.horse.hint")},planLabel:{textContent:()=>o("lessonCreate.field.plan")},planHint:{textContent:()=>o("lessonCreate.field.plan.hint")},programLabel:{textContent:()=>o("lessonCreate.field.programs")},programHint:{textContent:()=>o("lessonCreate.field.programs.hint")},whenInput:{value:()=>this.whenVal.get(),oninput:t=>this.whenVal.set(t.target.value)},error:{textContent:()=>this.validation.get()||(this.lessons.error.get()?o("lessons.error"):"")},submit:{textContent:()=>o("lessonCreate.submit"),disabled:()=>this.lessons.loading.get()},cancel:{textContent:()=>o("lessonCreate.cancel"),onclick:()=>this.router.navigate("/lektioner")},form:{onsubmit:t=>{this.submit(t)}}});return this.spawn(R,this.ref(e,"studentHost"),{value:this.studentVal,options:this.studentOptions,placeholder:o("lessonCreate.field.student.placeholder")}),this.spawn(R,this.ref(e,"horseHost"),{value:this.horseVal,options:this.horseOptions,disabled:this.needsStudent}),this.spawn(R,this.ref(e,"planHost"),{value:this.planVal,options:this.planOptions,disabled:this.needsStudent}),this.spawn(R,this.ref(e,"programHost"),{multiple:!0,values:this.programVals,options:this.programOptions,placeholder:o("lessonCreate.field.programs.placeholder"),countLabel:t=>q("lessonCreate.programsCount",t)}),e}async submit(e){e.preventDefault();const t=this.studentVal.get(),s=this.whenVal.get();if(!t)return this.validation.set(o("lessonCreate.error.student"));if(!s)return this.validation.set(o("lessonCreate.error.when"));this.validation.set("");const i=this.horseVal.get(),r=this.planVal.get(),l=await this.lessons.create({studentId:t,scheduledAt:wd(s),...r?{planId:r}:{},...i?{horseId:i}:{},programIds:this.programVals.get()});l&&(this.toasts.show(l.incomplete?{message:o("lessonCreate.createdPartial"),variant:"error",duration:8e3}:{message:o("lessonCreate.created"),variant:"success"}),this.router.navigate(`/lektioner/${l.lesson.id}`))}}const he=n=>`var(--${n})`,Cs=class Cs extends E{render(){const e=document.createElement("div");e.style.position="relative",this.spawn(Be,e,{open:this.props.open,bg:this.props.overlayBg??"transparent",zIndex:(this.props.zIndex??50)-1}),this.menuEl=document.createElement("div"),this.menuEl.className="ui-menu",this.menuEl.style.zIndex=String(this.props.zIndex??50),e.appendChild(this.menuEl);const t=this.props.closeOnClick??!0,s=i=>{this.menuEl.textContent="";for(const r of i)if(r.type==="divider"){const l=document.createElement("div");l.className="ui-menu__divider",this.menuEl.appendChild(l)}else if(r.type==="label"){const l=document.createElement("div");l.className="ui-menu__label",l.textContent=r.text,this.menuEl.appendChild(l)}else{const l=document.createElement("button");if(l.className="ui-menu__item",r.icon){const h=document.createElement("span");h.innerHTML=r.icon,l.appendChild(h)}const c=document.createElement("span");c.textContent=r.label,l.appendChild(c),l.addEventListener("click",h=>{h.stopPropagation(),r.onclick(),t&&this.props.open.set(!1)}),this.menuEl.appendChild(l)}};return this.props.items instanceof m?this.track(w(()=>{s(this.props.items instanceof m?this.props.items.get():this.props.items)})):s(this.props.items),this.track(w(()=>{this.menuEl.classList.toggle("open",this.props.open.get())})),e}};Cs.styles=`
        .ui-menu {
            position: absolute;
            min-width: 180px;
            background: ${he("surface")};
            border: 1px solid ${he("border")};
            border-radius: ${he("radius-md")};
            box-shadow: ${he("shadow-2")};
            padding: 4px 0;
            opacity: 0;
            pointer-events: none;
            transform: scale(0.95);
            transition: opacity 0.15s, transform 0.15s;
            z-index: 51;
        }
        .ui-menu.open {
            opacity: 1;
            pointer-events: auto;
            transform: scale(1);
        }
        .ui-menu__item {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 8px 12px;
            cursor: pointer;
            color: ${he("text")};
            font-size: 0.875rem;
            border: none;
            background: none;
            width: 100%;
            text-align: left;
            font-family: inherit;
        }
        .ui-menu__item > span:first-child:has(svg) {
            display: flex;
            align-items: center;
            color: ${he("text-muted")};
        }
        .ui-menu__item:hover {
            background: ${he("surface-2")};
        }
        .ui-menu__label {
            padding: 8px 12px 4px;
            font-size: 0.75rem;
            color: ${he("text-muted")};
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }
        .ui-menu__divider {
            height: 1px;
            background: ${he("border")};
            margin: 4px 0;
        }
    `;let Zt=Cs;const de=n=>typeof n=="function"?n():n,Xe=n=>n.disabled===void 0?!1:de(n.disabled),$d=T(`
    <header class="detail-header">
        <div class="detail-header__top">
            <div class="detail-header__identity">
                <p bind="eyebrow" class="detail-header__eyebrow"></p>
                <div bind="titleRow" class="detail-header__title-row"></div>
                <ul bind="chips" class="detail-header__chips"></ul>
            </div>
            <div class="detail-header__actions">
                <div bind="secondary" class="detail-header__secondary"></div>
                <button bind="primary" type="button" class="detail-header__primary"></button>
                <div bind="menuAnchor" class="detail-header__menu-anchor">
                    <button bind="menuButton" type="button" class="detail-header__overflow" aria-haspopup="menu">⋯</button>
                    <div bind="menuHost"></div>
                </div>
            </div>
        </div>
        <p bind="meta" class="detail-header__meta"></p>
    </header>
`);class xt extends E{static styles=`
        .detail-header {
            display: flex;
            flex-direction: column;
            gap: ${d("md")};
            padding-bottom: ${d("lg")};
            border-bottom: 1px solid ${a("border")};
            font-family: ${a("font-ui")};

            & .detail-header__top {
                display: flex;
                align-items: flex-start;
                justify-content: space-between;
                gap: ${d("lg")};
                flex-wrap: wrap;
            }

            & .detail-header__identity {
                display: flex;
                flex-direction: column;
                gap: ${d("sm")};
                min-width: 0;
            }

            & .detail-header__eyebrow {
                margin: 0;
                font-size: 0.6875rem;
                line-height: 16px;
                font-weight: 700;
                letter-spacing: 0.14em;
                text-transform: uppercase;
                color: ${a("text-muted")};
            }

            & .detail-header__title-row {
                display: flex;
                align-items: center;
                flex-wrap: wrap;
                gap: ${d("md")};
            }

            /* Lora, weight 500, and ONLY 500. The app ships a single static 500
               cut; 400 silently resolves to it and 600 gets synthetic bold —
               precisely the faked weight the spec forbids (UI_DECISIONS §3). */
            & .detail-header__title {
                margin: 0;
                font-family: ${a("font-display")};
                font-weight: 500;
                font-size: 1.75rem;
                line-height: 36px;
                color: ${a("text")};
                overflow-wrap: anywhere;
            }

            /* Chips wrap; they never scroll. Every path upward stays reachable
               at every width (UI_DECISIONS §6). */
            & .detail-header__chips {
                display: flex;
                flex-wrap: wrap;
                gap: ${d("sm")};
                list-style: none;
                margin: 0;
                padding: 0;
            }
            & .detail-header__chips:empty { display: none; }

            & .detail-header__chip {
                display: inline-flex;
                align-items: center;
                padding: 2px ${d("sm")};
                border: 1px solid ${a("border-strong")};
                border-radius: ${a("radius-pill")};
                font-size: 0.75rem;
                font-weight: 600;
                line-height: 1.4;
                color: ${a("text-muted")};
                text-decoration: none;
                transition: color ${a("dur-fast")} ${a("ease-standard")},
                            border-color ${a("dur-fast")} ${a("ease-standard")};

                &:hover {
                    color: ${a("accent-strong")};
                    border-color: ${a("accent")};
                    text-decoration: underline;
                }
                &:focus-visible { outline: 2px solid ${a("accent")}; outline-offset: 2px; }
            }

            & .detail-header__actions {
                display: flex;
                align-items: center;
                gap: ${d("sm")};
            }

            & .detail-header__secondary {
                display: flex;
                gap: ${d("sm")};

                & button { ${C()} }
            }

            /* §4.8: the one primary on a detail view. */
            & .detail-header__primary { ${C(a("radius-sm"),"primary")} }
            & .detail-header__primary.hidden { display: none; }

            & .detail-header__menu-anchor { position: relative; }
            & .detail-header__menu-anchor.hidden { display: none; }

            /* The framework menu is absolutely positioned from the anchor's LEFT
               edge and keeps its 180px box when closed (it hides with opacity,
               not display). The anchor sits at the right edge of the action
               cluster, so left-anchoring pushes the menu past the content edge
               and gives every page with an overflow action a horizontal
               scrollbar — including while the menu is shut. Anchoring it to the
               right edge is also simply where an overflow menu belongs: it opens
               inward, over the page, instead of off it. */
            & .detail-header__menu-anchor .ui-menu { left: auto; right: 0; }

            & .detail-header__overflow {
                ${C()}
                line-height: 1;
            }

            & .detail-header__meta {
                margin: 0;
                font-size: 0.875rem;
                color: ${a("text-muted")};
            }
            & .detail-header__meta:empty { display: none; }

            /* Below 640px the secondary cluster folds into ⋯; the single
               primary action stays visible at every width. */
            @media (max-width: 639px) {
                & .detail-header__secondary { display: none; }
                & .detail-header__title { font-size: 1.375rem; line-height: 30px; }
            }
        }
    `;router=this.inject(H);menuOpen=new m(!1);menuItems=new m([]);narrow=new m(!1);onMount(){const e=window.matchMedia(qo);this.narrow.set(e.matches);const t=()=>this.narrow.set(e.matches);e.addEventListener("change",t),this.track(()=>e.removeEventListener("change",t))}secondaryActions(){return de(this.props.secondaryActions??[])}overflowActions(){return de(this.props.overflowActions??[])}menuActions(){return Go(this.secondaryActions(),this.overflowActions(),this.narrow.get())}render(){const e=this.wire($d,{eyebrow:{textContent:()=>de(this.props.eyebrow)},meta:{textContent:()=>de(this.props.meta??"")},menuButton:{"aria-label":()=>o("detail.moreActions"),"aria-expanded":()=>String(this.menuOpen.get()),onclick:t=>{t.stopPropagation(),this.menuOpen.set(!this.menuOpen.peek())}}});return this.buildTitleRow(this.ref(e,"titleRow")),this.buildChips(this.ref(e,"chips")),this.buildPrimary(this.ref(e,"primary")),this.buildSecondary(this.ref(e,"secondary")),this.spawn(Zt,this.ref(e,"menuHost"),{open:this.menuOpen,items:this.menuItems,zIndex:50}),this.wireMenu(this.ref(e,"menuAnchor")),e}buildTitleRow(e){const t=this.props.headingLevel??1,s=document.createElement(`h${t}`);s.className="detail-header__title",this.track(w(()=>{s.textContent=de(this.props.title)})),e.appendChild(s);const i=document.createElement("span");e.appendChild(i);let r=null;this.track(w(()=>{const l=de(this.props.status??null);if(r?.destroy(),r=null,i.replaceChildren(),!l)return;const c=new ie({label:l.label,variant:l.variant??"outline",tone:l.tone??"neutral",...l.glyph===void 0?{}:{glyph:l.glyph}});c.mount(i),r=c})),this.track(()=>r?.destroy())}buildChips(e){let t=null;this.track(w(()=>{const s=de(this.props.chips??[]);t?.destroy(),t=null,e.replaceChildren();for(const r of s){const l=document.createElement("li"),c=document.createElement("a");c.className="detail-header__chip",c.textContent=r.label;const h=this.router.link(r.href);c.href=r.href,c.addEventListener("click",h.onclick),l.appendChild(c),e.appendChild(l)}if(this.props.recipients===void 0)return;const i=new Ke({recipients:this.props.recipients,...this.props.shared===void 0?{}:{shared:this.props.shared},as:"li"});i.mount(e),t=i})),this.track(()=>t?.destroy())}buildPrimary(e){this.track(w(()=>{const t=de(this.props.primaryAction??null);e.className=t?"detail-header__primary":"detail-header__primary hidden",e.textContent=t?.label??"",e.disabled=t?Xe(t):!0})),e.addEventListener("click",()=>{const t=de(this.props.primaryAction??null);t&&!Xe(t)&&t.onclick()})}buildSecondary(e){this.track(w(()=>{e.replaceChildren();for(const t of this.secondaryActions()){const s=document.createElement("button");s.type="button",s.textContent=t.label,s.disabled=Xe(t),s.addEventListener("click",t.onclick),e.appendChild(s)}}))}wireMenu(e){this.track(w(()=>{const t=this.menuActions().filter(s=>!Xe(s));e.className=t.length===0?"detail-header__menu-anchor hidden":"detail-header__menu-anchor",t.length===0&&this.menuOpen.peek()&&this.menuOpen.set(!1),this.menuItems.set(t.map(s=>({type:"item",label:s.label,onclick:s.onclick})))}))}}class Cd{items=new m([]);loading=new m(!1);error=new m(null);parentKind=null;parentId=null;async load(e,t){this.parentKind=e,this.parentId=t;const s=await $(this.loading,this.error,()=>v.notes.list({parentKind:e,parentId:t}));s&&this.items.set(s)}async create(e,t){return!this.parentKind||!this.parentId||!await $(this.loading,this.error,()=>v.notes.create({parentKind:this.parentKind,parentId:this.parentId,body:e,visibility:t}))?!1:(await this.reload(),!0)}async update(e,t){return await $(this.loading,this.error,()=>v.notes.update({id:e,...t}))?(await this.reload(),!0):!1}async delete(e){return await $(this.loading,this.error,()=>v.notes.delete({id:e}))?(await this.reload(),!0):!1}async reload(){this.parentKind&&this.parentId&&await this.load(this.parentKind,this.parentId)}}const Dt=n=>typeof n=="function"?n():n,Sd=T(`
    <section class="note-thread">
        <header class="note-thread__head">
            <div bind="titleHost"></div>
            <p bind="context" class="note-thread__context"></p>
        </header>
        <ol bind="list" class="note-thread__list"></ol>
        <p bind="empty" class="note-thread__empty"></p>
        <form bind="form" class="note-thread__composer">
            <textarea bind="body" rows="3"></textarea>
            <div class="note-thread__footer">
                <div bind="visibility" class="note-thread__visibility"></div>
                <button bind="submit" type="submit" class="note-thread__submit"></button>
            </div>
            <p bind="hint" class="note-thread__hint"></p>
            <p bind="error" class="note-thread__error"></p>
        </form>
        <div bind="confirmHost"></div>
    </section>
`);class ki extends E{static styles=`
        .note-thread {
            display: flex;
            flex-direction: column;
            gap: ${d("lg")};
            font-family: ${a("font-ui")};
            /* §4.7 is a single column at reading measure — never two. */
            max-width: 68ch;

            & .note-thread__head {
                display: flex;
                flex-direction: column;
                gap: ${d("xs")};
                padding-bottom: ${d("sm")};
                border-bottom: 1px solid ${a("border")};
            }

            & .note-thread__title {
                margin: 0;
                /* A section heading is one of the places the serif is allowed —
                   and Lora ships as a single 500 cut (UI_DECISIONS §3), so 500
                   is the only weight that renders honestly. */
                font-family: ${a("font-display")};
                font-weight: 500;
                font-size: 1.25rem;
                line-height: 1.4;
                color: ${a("text")};
            }

            /* The context row: what the thread is attached to. */
            & .note-thread__context {
                margin: 0;
                font-size: 0.8125rem;
                color: ${a("text-muted")};
            }

            & .note-thread__list {
                list-style: none;
                margin: 0;
                padding: 0;
                display: flex;
                flex-direction: column;
                gap: ${d("lg")};
            }

            & .note-thread__entry {
                display: flex;
                flex-direction: column;
                gap: ${d("sm")};
                padding-left: ${d("md")};
                /* Non-teacher entries keep the identical indent so the column
                   stays flush — only the rule's colour changes. */
                border-left: 1px solid transparent;
            }

            /* The teacher's hairline brass rule (§4.7). Hairline: 1px, no fill,
               no bubble — the entry is otherwise identical to the student's. */
            & .note-thread__entry--teacher {
                border-left-color: ${a("brass-line")};
            }

            & .note-thread__meta {
                display: flex;
                align-items: center;
                flex-wrap: wrap;
                gap: ${d("sm")};
            }

            & .note-thread__time {
                font-size: 0.75rem;
                color: ${a("text-muted")};
                font-variant-numeric: tabular-nums;
            }

            & .note-thread__body {
                margin: 0;
                font-size: 0.9375rem;
                line-height: 1.6;
                color: ${a("text")};
                /* No clamp, no ellipsis: §4.7 forbids cutting long notes. */
                white-space: pre-wrap;
                overflow-wrap: anywhere;
            }

            & .note-thread__entry-actions {
                display: flex;
                gap: ${d("md")};

                & button {
                    background: none;
                    border: none;
                    padding: 0;
                    font-family: inherit;
                    font-size: 0.75rem;
                    color: ${a("text-muted")};
                    cursor: pointer;
                    &:hover { color: ${a("text")}; text-decoration: underline; }
                    &:focus-visible { outline: 2px solid ${a("accent")}; outline-offset: 2px; }
                    &.note-thread__destructive { color: ${a("danger")}; }
                }
            }

            & .note-thread__empty {
                margin: 0;
                font-size: 0.875rem;
                color: ${a("text-muted")};
            }
            & .note-thread__empty.hidden { display: none; }

            /*
             * The composer is a panel. The §4.8 field recipe fills with --bg,
             * the page-paper colour, and a note thread is embedded straight
             * into a detail page drawn on that same colour — so without the
             * panel the textarea would vanish into its background. The panel
             * is what the recessed fill is recessed INTO, and it also marks
             * the composer off from the notes above it.
             */
            & .note-thread__composer {
                ${Q()}
                box-sizing: border-box;
                padding: ${d("lg")};
                display: flex;
                flex-direction: column;
                gap: ${d("sm")};

                & textarea {
                    ${K()}
                    width: 100%;
                    box-sizing: border-box;
                    resize: vertical;
                    font-family: ${a("font-ui")};
                    font-size: 0.9375rem;
                }
            }

            & .note-thread__footer {
                display: flex;
                align-items: center;
                justify-content: space-between;
                flex-wrap: wrap;
                gap: ${d("md")};

                & .note-thread__submit { ${C()} }
            }

            /* Visibility at the point of writing — a two-state segmented
               control, not a checkbox: both options are always visible and
               always labelled, so the shared state can never be nameless. */
            & .note-thread__visibility {
                display: inline-flex;
                border: 1px solid ${a("border-strong")};
                border-radius: ${a("radius-pill")};
                overflow: hidden;

                & button {
                    background: none;
                    border: none;
                    padding: ${d("xs")} ${d("md")};
                    font-family: ${a("font-ui")};
                    font-size: 0.8125rem;
                    font-weight: 600;
                    color: ${a("text-muted")};
                    cursor: pointer;
                    transition: background ${a("dur-fast")} ${a("ease-standard")},
                                color ${a("dur-fast")} ${a("ease-standard")};

                    &:hover:not(:disabled) { background: ${a("surface-2")}; }
                    &:focus-visible { outline: 2px solid ${a("accent")}; outline-offset: -2px; }
                    &:disabled { opacity: 0.5; cursor: not-allowed; }

                    &[aria-pressed="true"] {
                        background: ${a("accent-soft")};
                        color: ${a("accent-strong")};
                    }
                }
            }

            & .note-thread__hint {
                margin: 0;
                font-size: 0.75rem;
                color: ${a("text-muted")};
            }

            & .note-thread__error {
                margin: 0;
                font-size: 0.75rem;
                color: ${a("danger")};
                min-height: 1em;
            }
            & .note-thread__error:empty { min-height: 0; }
        }
    `;auth=this.inject(re);notes=new Cd;draft=new m("");draftShared=new m(!1);editingId=new m(null);editingBody=new m("");editingShared=new m(!1);pendingDelete=new m(null);confirmOpen=new m(!1);onMount(){this.notes.load(this.props.parentKind,this.props.parentId)}recipients(){return _t(Dt(this.props.recipients))}canShare(){return this.recipients().length>0}audienceOf(e){return this.props.audienceOf?this.props.audienceOf(e):this.recipients()}showRoles(){return this.props.showRoles===void 0?!0:Dt(this.props.showRoles)}render(){const e=this.wire(Sd,{context:{textContent:()=>Dt(this.props.context)},body:{value:()=>this.draft.get(),placeholder:()=>o("notes.placeholder"),"aria-label":()=>o("notes.placeholder"),oninput:r=>this.draft.set(r.target.value)},submit:{textContent:()=>o("notes.submit")},hint:{textContent:()=>Bo(this.recipients(),this.draftShared.get())},empty:{textContent:()=>o("notes.empty"),className:()=>this.notes.items.get().length===0?"note-thread__empty":"note-thread__empty hidden"},error:{textContent:()=>this.notes.error.get()?.message??""},form:{onsubmit:async r=>{r.preventDefault();const l=this.draft.get().trim();if(!l)return;const c=this.draftShared.get()&&this.canShare();await this.notes.create(l,c?"shared":"private")&&(this.draft.set(""),this.draftShared.set(!1))}}}),t=this.props.headingLevel??3,s=this.ref(e,"titleHost"),i=document.createElement(`h${t}`);return i.className="note-thread__title",this.track(w(()=>{i.textContent=Mo(this.notes.items.get().length)})),s.replaceWith(i),this.buildVisibility(this.ref(e,"visibility"),this.draftShared),this.spawn(ne,this.ref(e,"confirmHost"),{open:this.confirmOpen,title:o("notes.deleteTitle"),message:()=>o("notes.deleteConsequence"),confirmLabel:o("notes.delete"),cancelLabel:o("notes.cancel"),danger:!0,onconfirm:async()=>{const r=this.pendingDelete.get();this.pendingDelete.set(null),r&&await this.notes.delete(r)},oncancel:()=>this.pendingDelete.set(null)}),this.$each(this.ref(e,"list"),()=>this.notes.items.get(),(r,l,c)=>this.renderEntry(r,c),r=>[r.id,r.updatedAt,this.editingId.get()===r.id,this.auth.currentUser.get()?.id??"",this.showRoles()].join("|")),e}buildVisibility(e,t,s=i=>this.track(i)){e.setAttribute("role","group"),e.setAttribute("aria-label",o("notes.visibility"));const i=r=>{const l=document.createElement("button");l.type="button",l.addEventListener("click",()=>t.set(r)),e.appendChild(l),s(w(()=>{const c=this.recipients(),h=t.get()===r;l.setAttribute("aria-pressed",String(h)),r?(l.disabled=c.length===0,l.textContent=c.length===0?o("notes.shareUnavailable"):pi(c,!0)):l.textContent=o("share.private")}))};i(!1),i(!0),s(w(()=>{!this.canShare()&&t.get()&&t.set(!1)}))}renderEntry(e,t){const s=this.auth.currentUser.get()?.id,i=this.editingId.get()===e.id,r=this.props.roleOf(e),l=document.createElement("li");l.className=`note-thread__entry note-thread__entry--${r}`;const c=document.createElement("div");c.className="note-thread__meta",l.appendChild(c);const h=document.createElement("span");c.appendChild(h),pn(h,new vt({name:e.authorDisplayName,role:r,showRole:this.showRoles()}),t);const u=document.createElement("time");u.className="note-thread__time",u.dateTime=e.createdAt,u.textContent=mi(e.createdAt),c.appendChild(u);const p=document.createElement("span");if(c.appendChild(p),pn(p,new Ke({recipients:()=>this.audienceOf(e),shared:e.visibility==="shared"}),t),i){const b=document.createElement("textarea");b.rows=3,b.value=this.editingBody.peek(),b.setAttribute("aria-label",o("notes.placeholder")),b.addEventListener("input",()=>this.editingBody.set(b.value)),l.appendChild(b);const _=document.createElement("div");_.className="note-thread__footer";const k=document.createElement("div");k.className="note-thread__visibility",this.buildVisibility(k,this.editingShared,t),_.appendChild(k),l.appendChild(_);const I=document.createElement("div");I.className="note-thread__entry-actions",I.append(this.entryButton(o("notes.save"),async()=>{const N=this.editingBody.get().trim();if(!N)return;await this.notes.update(e.id,{body:N,visibility:this.editingShared.get()&&this.canShare()?"shared":"private"})&&this.editingId.set(null)}),this.entryButton(o("notes.cancel"),()=>this.editingId.set(null))),l.appendChild(I)}else{const b=document.createElement("p");if(b.className="note-thread__body",b.textContent=e.body,l.appendChild(b),s&&e.authorId===s){const _=document.createElement("div");_.className="note-thread__entry-actions",_.append(this.entryButton(o("notes.edit"),()=>{this.editingBody.set(e.body),this.editingShared.set(e.visibility==="shared"),this.editingId.set(e.id)}),this.entryButton(o("notes.delete"),()=>{this.pendingDelete.set(e.id),this.confirmOpen.set(!0)},!0)),l.appendChild(_)}}return l}entryButton(e,t,s=!1){const i=document.createElement("button");return i.type="button",i.textContent=e,s&&(i.className="note-thread__destructive"),i.addEventListener("click",t),i}}function ms(n,e,t){let s=null,i=null;t(w(()=>{const r=e(),l=r?`${r.parentKind}:${r.parentId}`:null;l!==i&&(i=l,j(()=>{if(s?.destroy(),s=null,n.replaceChildren(),!r)return;const c=new ki(r);c.mount(n),s=c}))})),t(()=>{s?.destroy(),s=null,i=null,n.replaceChildren()})}class $i{open=[];constructor(e){e(()=>this.reset())}reset(){for(const e of this.open)e.destroy();this.open.length=0}mount(e,t){j(()=>{const s=new ki(t);s.mount(e),this.open.push(s)})}}function pn(n,e,t){e.mount(n),t(()=>e.destroy())}const Ed=T(`
    <div class="lesson-detail" bind="root">
        <a bind="back" href="/lektioner" class="lesson-detail__back"></a>
        <p bind="loading" class="lesson-detail__loading"></p>
        <div bind="notFoundHost"></div>

        <div bind="body" class="lesson-detail__body">
            <div bind="headerHost"></div>

            <div bind="conflict" class="lesson-detail__conflict" role="alert">
                <p bind="conflictText" class="lesson-detail__conflict-text"></p>
                <button bind="conflictRetry" type="button" class="lesson-detail__conflict-action"></button>
            </div>

            <p bind="lock" class="lesson-detail__lock"></p>

            <section bind="detailsSection" class="lesson-detail__section">
                <h2 bind="detailsHeading" class="lesson-detail__heading"></h2>
                <form bind="detailsForm" class="lesson-detail__form">
                    <div class="lesson-detail__pair">
                        <label class="lesson-detail__field">
                            <span bind="whenLabel" class="lesson-detail__label"></span>
                            <input bind="whenInput" type="datetime-local" class="lesson-detail__input" required>
                        </label>
                        <label class="lesson-detail__field">
                            <span bind="horseLabel" class="lesson-detail__label"></span>
                            <div bind="horseHost" class="lesson-detail__control"></div>
                        </label>
                    </div>
                    <label class="lesson-detail__field">
                        <span bind="planLabel" class="lesson-detail__label"></span>
                        <div bind="planHost" class="lesson-detail__control"></div>
                    </label>
                    <div class="lesson-detail__row">
                        <button bind="save" type="submit" class="lesson-detail__save"></button>
                    </div>
                </form>
            </section>

            <section bind="programsSection" class="lesson-detail__section">
                <h2 bind="programsHeading" class="lesson-detail__heading"></h2>
                <p bind="programsHint" class="lesson-detail__hint"></p>
                <ul bind="programList" class="lesson-detail__prog-list"></ul>
                <p bind="programsEmpty" class="lesson-detail__muted"></p>
                <div class="lesson-detail__row">
                    <div bind="programHost" class="lesson-detail__control lesson-detail__control--grow"></div>
                    <button bind="attachProgram" type="button" class="lesson-detail__secondary"></button>
                </div>
            </section>

            <section class="lesson-detail__section">
                <h2 bind="exercisesHeading" class="lesson-detail__heading"></h2>
                <ol bind="exerciseList" class="lesson-detail__ex-list"></ol>
                <p bind="exercisesEmpty" class="lesson-detail__muted"></p>
                <div bind="exerciseAdd" class="lesson-detail__row">
                    <div bind="exerciseHost" class="lesson-detail__control lesson-detail__control--grow"></div>
                    <button bind="addExercise" type="button" class="lesson-detail__secondary"></button>
                </div>
            </section>

            <section class="lesson-detail__section">
                <div bind="notesHost"></div>
            </section>
        </div>

        <div bind="confirmCompleteHost"></div>
        <div bind="confirmCancelHost"></div>
    </div>
`);function Id(n){const e=new Date(n),t=s=>String(s).padStart(2,"0");return`${e.getFullYear()}-${t(e.getMonth()+1)}-${t(e.getDate())}T${t(e.getHours())}:${t(e.getMinutes())}`}function Td(n){return new Date(n).toISOString()}class Nd extends E{static styles=`
        .lesson-detail {
            display: flex;
            flex-direction: column;
            gap: ${d("lg")};
            font-family: ${a("font-ui")};

            & .lesson-detail__back {
                font-size: 0.875rem;
                color: ${a("text-muted")};
                text-decoration: none;
                align-self: flex-start;
                &:hover { color: ${a("accent-strong")}; text-decoration: underline; }
                &:focus-visible { outline: 2px solid ${a("accent")}; outline-offset: 2px; }
            }

            & .lesson-detail__loading {
                margin: 0;
                color: ${a("text-muted")};
                font-size: 0.875rem;
            }

            & .lesson-detail__body {
                display: flex;
                flex-direction: column;
                gap: ${d("xl")};
            }
            & .lesson-detail__body.hidden { display: none; }
            & .lesson-detail__loading.hidden { display: none; }
            & .lesson-detail__back.hidden { display: none; }

            & .lesson-detail__conflict {
                display: flex;
                align-items: center;
                flex-wrap: wrap;
                gap: ${d("md")};
                padding: ${d("md")};
                border: 1px solid ${a("warning")};
                border-radius: ${a("radius-md")};
                background: ${a("warning-soft")};

                & .lesson-detail__conflict-text {
                    margin: 0;
                    font-size: 0.875rem;
                    color: ${a("text")};
                    max-width: 68ch;
                }
                & .lesson-detail__conflict-action { ${C()} }
            }
            & .lesson-detail__conflict.hidden { display: none; }

            /* The lock notice takes the place of the withheld controls — it says
               what is closed AND what is still open, so a terminal lesson does
               not read as a dead end. */
            & .lesson-detail__lock {
                margin: 0;
                padding: ${d("md")};
                border-left: 2px solid ${a("brass-line")};
                background: ${a("surface-2")};
                font-size: 0.875rem;
                line-height: 1.5;
                color: ${a("text")};
                max-width: 68ch;
            }
            & .lesson-detail__lock.hidden { display: none; }

            & .lesson-detail__section { display: flex; flex-direction: column; gap: ${d("md")}; }
            & .lesson-detail__section.hidden { display: none; }

            /* Section headings are the second permitted serif use (20/28), and
               weight 500 like every other Lora run in this app. */
            & .lesson-detail__heading {
                margin: 0;
                font-family: ${a("font-display")};
                font-weight: 500;
                font-size: 1.25rem;
                line-height: 28px;
                color: ${a("text")};
            }

            & .lesson-detail__hint, & .lesson-detail__muted {
                margin: 0;
                font-size: 0.8125rem;
                line-height: 1.5;
                color: ${a("text-muted")};
                max-width: 68ch;
            }
            & .lesson-detail__muted.hidden { display: none; }

            /*
             * The edit form is a panel. The §4.8 field recipe fills with --bg,
             * the page-paper colour, and a detail section is drawn straight
             * onto that page — so without the panel the fields would be the
             * same colour as everything behind them.
             */
            & .lesson-detail__form {
                ${Q()}
                box-sizing: border-box;
                padding: ${d("xl")};
                display: flex;
                flex-direction: column;
                gap: ${d("md")};
                max-width: 34rem;
            }
            & .lesson-detail__pair {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: ${d("md")};
            }
            & .lesson-detail__field { display: flex; flex-direction: column; gap: ${d("xs")}; }
            & .lesson-detail__label { font-size: 0.8125rem; font-weight: 600; color: ${a("text")}; }
            & .lesson-detail__input {
                ${K()}
                width: 100%;
                box-sizing: border-box;
            }
            & .lesson-detail__control .ui-select { display: block; }
            & .lesson-detail__control--grow { flex: 1; min-width: 0; }

            & .lesson-detail__row {
                display: flex;
                align-items: center;
                gap: ${d("sm")};
                flex-wrap: wrap;
            }
            & .lesson-detail__row.hidden { display: none; }
            /*
             * Selects in a row on the page, not inside the form panel, keep a
             * raised --surface fill — the recessed --bg fill is only legible
             * against a card.
             */
            & .lesson-detail__row .ui-select__trigger { background: ${a("surface")}; }

            /* §4.8: one primary per view. This is it. */
            & .lesson-detail__save { ${C(a("radius-sm"),"primary")} }
            & .lesson-detail__secondary { ${C()} }

            & .lesson-detail__prog-list, & .lesson-detail__ex-list {
                list-style: none;
                margin: 0;
                padding: 0;
                display: flex;
                flex-direction: column;
            }
            & .lesson-detail__prog-list { gap: ${d("xs")}; }
            & .lesson-detail__ex-list {
                border-top: 1px solid ${a("border")};
                counter-reset: occurrence;
            }
            & .lesson-detail__ex-item {
                border-bottom: 1px solid ${a("border")};
                padding: ${d("md")} 0;
                display: flex;
                flex-direction: column;
                gap: ${d("sm")};
            }

            & .lesson-detail__prog-item {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: ${d("sm")};
                padding: ${d("sm")} ${d("md")};
                background: ${a("surface")};
                border: 1px solid ${a("border")};
                border-radius: ${a("radius-md")};
                font-size: 0.875rem;
            }

            & .lesson-detail__ex-head {
                display: flex;
                align-items: baseline;
                justify-content: space-between;
                gap: ${d("md")};
                flex-wrap: wrap;
            }
            & .lesson-detail__ex-name {
                font-size: 0.9375rem;
                font-weight: 600;
                color: ${a("text")};
            }
            /* Taught order is data, so the ordinal is generated rather than
               typed into the name. */
            & .lesson-detail__ex-name::before {
                counter-increment: occurrence;
                content: counter(occurrence) ". ";
                color: ${a("text-muted")};
                font-variant-numeric: tabular-nums;
            }
            & .lesson-detail__ex-source {
                font-size: 0.75rem;
                font-weight: 600;
                color: ${a("text-muted")};
                border: 1px solid ${a("border")};
                border-radius: ${a("radius-pill")};
                padding: 2px ${d("sm")};
            }
            /* The static Row note is instruction copied WITH the occurrence —
               never an authored Note, so it carries no author, no timestamp and
               no composer. The brass hairline is what tells the two apart. */
            & .lesson-detail__ex-note {
                margin: 0;
                padding-left: ${d("md")};
                border-left: 2px solid ${a("brass-line")};
                font-size: 0.875rem;
                line-height: 1.6;
                color: ${a("text")};
                max-width: 68ch;
            }
            & .lesson-detail__ex-actions {
                display: flex;
                align-items: center;
                gap: ${d("md")};
                flex-wrap: wrap;
            }
            & .lesson-detail__link {
                background: none;
                border: none;
                padding: 0;
                font-family: inherit;
                font-size: 0.8125rem;
                font-weight: 600;
                color: ${a("accent-strong")};
                text-decoration: none;
                cursor: pointer;
                &:hover { text-decoration: underline; }
                &:focus-visible { outline: 2px solid ${a("accent")}; outline-offset: 2px; }
            }
            & .lesson-detail__link--danger { color: ${a("danger")}; }

            /* UI_DECISIONS §6: paired field rows collapse below 640px. */
            @media (max-width: 639px) {
                & .lesson-detail__pair { grid-template-columns: 1fr; }
                & .lesson-detail__row { align-items: stretch; }
            }
        }
    `;router=this.inject(H);svc=this.inject(ps);programs=this.inject(We);toasts=this.inject(te);resolved=new m(!1);found=new m(!0);horses=new m([]);plans=new m([]);library=new m([]);whenVal=new m("");horseVal=new m("");planVal=new m("");programVal=new m("");exerciseVal=new m("");openNotes=new m(new Set);confirmComplete=new m(!1);confirmCancel=new m(!1);lessonId(){return this.router.route.get().split("/")[2]??""}lesson(){return this.svc.get(this.lessonId())}controls=new y(()=>{const e=this.lesson();return e?xr(e.status,e.role):{transition:!1,editDetails:!1,editExercises:!1,editPrograms:!1,notes:!1,lockNotice:!1}});conflicted=new y(()=>kr(this.svc.error.get()));horseOptions=new y(()=>[{value:"",label:o("lesson.horse.none")},...Bn(this.horses.get()).map(e=>({value:e.id,label:e.name}))]);planOptions=new y(()=>[{value:"",label:o("lesson.plan.none")},...qn(this.plans.get()).map(e=>({value:e.id,label:e.title}))]);programOptions=new y(()=>{const e=new Set((this.lesson()?.programs??[]).map(t=>t.id));return this.programs.items.get().filter(t=>!e.has(t.id)).map(t=>({value:t.id,label:t.title}))});exerciseOptions=new y(()=>{const e=new Set((this.lesson()?.exercises??[]).map(t=>t.exerciseId));return this.library.get().filter(t=>!e.has(t.id)).map(t=>({value:t.id,label:t.name}))});onMount(){this.resolve()}async resolve(){const e=await this.svc.loadOne(this.lessonId());if(!e){this.found.set(!1),this.resolved.set(!0);return}if(this.whenVal.set(Id(e.scheduledAt)),this.horseVal.set(e.horseId??""),this.planVal.set(e.planId??""),this.found.set(!0),this.resolved.set(!0),e.role!=="teacher")return;const[t,s,i]=await Promise.all([v.students.listHorses({id:e.studentId}),v.students.listPlans({id:e.studentId}),v.exercises.list(),this.programs.load()]);this.horses.set(t),this.plans.set(s),this.library.set(i)}counterparty(){const e=this.lesson();return e?[{id:e.role==="student"?e.teacherId:e.studentId,name:e.counterpartyDisplayName}]:[]}roleOf=e=>e===this.lesson()?.teacherId?"teacher":"student";exerciseThread(e,t){return{parentKind:"lesson_exercise",parentId:e,context:()=>[o("objectKind.exercise"),t].join(" · "),recipients:()=>this.counterparty(),roleOf:s=>this.roleOf(s.authorId),headingLevel:4}}render(){const e=this.wire(Ed,{back:{...this.router.link("/lektioner"),textContent:()=>o("lesson.back"),className:()=>this.resolved.get()&&!this.found.get()?"lesson-detail__back hidden":"lesson-detail__back"},loading:{textContent:()=>o("lesson.loading"),className:()=>this.resolved.get()?"lesson-detail__loading hidden":"lesson-detail__loading"},body:{className:()=>this.resolved.get()&&this.found.get()?"lesson-detail__body":"lesson-detail__body hidden"},conflict:{className:()=>this.conflicted.get()?"lesson-detail__conflict":"lesson-detail__conflict hidden"},conflictText:{textContent:()=>o("lesson.conflict.message")},conflictRetry:{textContent:()=>o("lesson.conflict.action"),onclick:()=>{this.resolve()}},lock:{textContent:()=>{const t=this.lesson();return t?wr(t.status):""},className:()=>this.controls.get().lockNotice?"lesson-detail__lock":"lesson-detail__lock hidden"},detailsSection:{className:()=>this.controls.get().editDetails?"lesson-detail__section":"lesson-detail__section hidden"},detailsHeading:{textContent:()=>o("lesson.section.details")},whenLabel:{textContent:()=>o("lesson.field.when")},horseLabel:{textContent:()=>o("lesson.field.horse")},planLabel:{textContent:()=>o("lesson.field.plan")},whenInput:{value:()=>this.whenVal.get(),oninput:t=>this.whenVal.set(t.target.value)},save:{textContent:()=>o("lesson.save")},detailsForm:{onsubmit:t=>{this.saveDetails(t)}},programsSection:{className:()=>this.controls.get().editPrograms?"lesson-detail__section":"lesson-detail__section hidden"},programsHeading:{textContent:()=>o("lesson.section.programs")},programsHint:{textContent:()=>o("lesson.programs.detachHint")},programsEmpty:{textContent:()=>o("lesson.programs.empty"),className:()=>(this.lesson()?.programs.length??0)===0?"lesson-detail__muted":"lesson-detail__muted hidden"},attachProgram:{textContent:()=>o("lesson.programs.attach"),onclick:()=>{this.attachProgram()}},exercisesHeading:{textContent:()=>o("lesson.section.exercises")},exercisesEmpty:{textContent:()=>o("lesson.exercises.empty"),className:()=>(this.lesson()?.exercises.length??0)===0?"lesson-detail__muted":"lesson-detail__muted hidden"},exerciseAdd:{className:()=>this.controls.get().editExercises?"lesson-detail__row":"lesson-detail__row hidden"},addExercise:{textContent:()=>o("lesson.exercise.add"),onclick:()=>{this.addExercise()}}});return this.buildNotFound(this.ref(e,"notFoundHost")),this.buildHeader(this.ref(e,"headerHost")),this.buildPrograms(this.ref(e,"programList")),this.buildExercises(this.ref(e,"exerciseList")),this.spawn(R,this.ref(e,"horseHost"),{value:this.horseVal,options:this.horseOptions}),this.spawn(R,this.ref(e,"planHost"),{value:this.planVal,options:this.planOptions}),this.spawn(R,this.ref(e,"programHost"),{value:this.programVal,options:this.programOptions,placeholder:o("lesson.programs.placeholder")}),this.spawn(R,this.ref(e,"exerciseHost"),{value:this.exerciseVal,options:this.exerciseOptions,placeholder:o("lesson.exercise.placeholder")}),this.track(w(()=>{const t=this.programOptions.get(),s=this.programVal.get();s&&!t.some(i=>i.value===s)&&this.programVal.set("")})),this.track(w(()=>{const t=this.exerciseOptions.get(),s=this.exerciseVal.get();s&&!t.some(i=>i.value===s)&&this.exerciseVal.set("")})),this.spawn(ne,this.ref(e,"confirmCompleteHost"),{open:this.confirmComplete,title:o("lesson.confirm.complete.title"),message:()=>o("lesson.confirm.complete.message"),confirmLabel:o("lesson.action.complete"),cancelLabel:o("lesson.confirm.dismiss"),onconfirm:()=>{this.transition("completed")}}),this.spawn(ne,this.ref(e,"confirmCancelHost"),{open:this.confirmCancel,title:o("lesson.confirm.cancel.title"),message:()=>o("lesson.confirm.cancel.message"),confirmLabel:o("lesson.action.cancel"),cancelLabel:o("lesson.confirm.dismiss"),danger:!0,onconfirm:()=>{this.transition("cancelled")}}),ms(this.ref(e,"notesHost"),()=>{const t=this.lesson();return t?{parentKind:"lesson",parentId:t.id,context:()=>this.lessonContext(),recipients:()=>this.counterparty(),roleOf:s=>this.roleOf(s.authorId)}:null},t=>this.track(t)),e}lessonContext(){const e=this.lesson();return e?[o("objectKind.lesson"),qe(e.scheduledAt),e.horseName].filter(Boolean).join(" · "):o("objectKind.lesson")}buildHeader(e){this.spawn(xt,e,{eyebrow:()=>o("objectKind.lesson"),title:()=>{const t=this.lesson();return t?ze(t):o("lesson.title.plain")},status:()=>{const t=this.lesson();if(!t)return null;const s=rs(t.status);return{label:s.label,variant:s.variant,tone:s.tone,...s.glyph===void 0?{}:{glyph:s.glyph}}},chips:()=>this.headerChips(),recipients:()=>this.counterparty(),shared:()=>!0,meta:()=>{const t=this.lesson();return t?[qe(t.scheduledAt),t.counterpartyDisplayName,t.horseName].filter(Boolean).join(" · "):""},primaryAction:()=>this.controls.get().transition?{label:o("lesson.action.complete"),onclick:()=>this.confirmComplete.set(!0)}:null,secondaryActions:()=>this.controls.get().transition?[{label:o("lesson.action.cancel"),onclick:()=>this.confirmCancel.set(!0)}]:[]})}headerChips(){const e=this.lesson();if(!e)return[];const t=[];e.planId&&e.planTitle&&t.push({label:dt(e.planTitle),href:`/planer/${e.planId}`});for(const s of e.programs)t.push({label:os(s),href:`/program/${s.id}`});return t}buildNotFound(e){let t=null;this.track(w(()=>{const s=this.resolved.get()&&!this.found.get();t?.destroy(),t=null,e.replaceChildren(),s&&(t=j(()=>{const i=new U({heading:()=>o("lesson.notFound.heading"),body:()=>o("lesson.notFound.body"),action:{label:()=>o("lesson.notFound.action"),onclick:()=>this.router.navigate("/lektioner")},headingLevel:1});return i.mount(e),i}))})),this.track(()=>t?.destroy())}buildPrograms(e){this.track(w(()=>{const t=this.lesson(),s=this.controls.get();e.replaceChildren();for(const i of t?.programs??[]){const r=document.createElement("li");r.className="lesson-detail__prog-item";const l=document.createElement("span");if(l.textContent=i.title,r.appendChild(l),s.editPrograms){const c=document.createElement("button");c.type="button",c.className="lesson-detail__link lesson-detail__link--danger",c.textContent=o("lesson.programs.detach"),c.onclick=()=>{this.detachProgram(i.id,i.title)},r.appendChild(c)}e.appendChild(r)}}))}buildExercises(e){const t=new $i(s=>this.track(s));this.track(w(()=>{const s=this.lesson(),i=this.openNotes.get(),r=this.controls.get();if(t.reset(),e.replaceChildren(),!!s)for(const l of Er(s.exercises)){const c=document.createElement("li");c.className="lesson-detail__ex-item";const h=document.createElement("div");h.className="lesson-detail__ex-head";const u=document.createElement("span");u.className="lesson-detail__ex-name",u.textContent=l.name,h.appendChild(u);const p=Ir(l,s.programs);if(p){const A=document.createElement("span");A.className="lesson-detail__ex-source",A.textContent=p,h.appendChild(A)}c.appendChild(h);const b=Sr(l);if(b){const A=document.createElement("p");A.className="lesson-detail__ex-note",A.textContent=b,c.appendChild(A)}const _=document.createElement("div");_.className="lesson-detail__ex-actions";const k=document.createElement("button");k.type="button",k.className="lesson-detail__link",k.textContent=i.has(l.id)?o("lesson.exercise.notesHide"):o("lesson.exercise.notesShow"),k.onclick=()=>this.toggleNotes(l.id),_.appendChild(k);const I=Tr(s.studentId,l.exerciseId,s.id),N=document.createElement("a");if(N.className="lesson-detail__link",N.href=I,N.textContent=o("lesson.exercise.history"),N.onclick=A=>{A.preventDefault(),this.router.navigate(I)},_.appendChild(N),r.editExercises){const A=document.createElement("button");A.type="button",A.className="lesson-detail__link lesson-detail__link--danger",A.textContent=o("lesson.exercise.remove"),A.onclick=()=>{this.removeExercise(l.exerciseId,l.name)},_.appendChild(A)}if(c.appendChild(_),i.has(l.id)){const A=document.createElement("div");c.appendChild(A),t.mount(A,this.exerciseThread(l.id,l.name))}e.appendChild(c)}}))}toggleNotes(e){const t=new Set(this.openNotes.get());t.has(e)?t.delete(e):t.add(e),this.openNotes.set(t)}async saveDetails(e){e.preventDefault();const t=this.lesson();if(!t)return;const s={},i=this.horseVal.get(),r=this.planVal.get(),l=this.whenVal.get();if(i!==(t.horseId??"")&&(s.horseId=i===""?null:i),r!==(t.planId??"")&&(s.planId=r===""?null:r),l){const h=Td(l);h!==t.scheduledAt&&(s.scheduledAt=h)}if(Object.keys(s).length===0)return;await this.svc.update(t.id,s)&&this.toasts.show({message:o("lesson.saved"),variant:"success"})}async transition(e){const t=this.lesson();!t||!await this.svc.transition(t.id,e)||this.toasts.show({message:o(e==="completed"?"lesson.toast.completed":"lesson.toast.cancelled"),variant:"success"})}async addExercise(){const e=this.lesson(),t=this.exerciseVal.get();if(!e||!t)return;await this.svc.addExercise(e.id,t)&&this.exerciseVal.set("")}async removeExercise(e,t){const s=this.lesson();!s||!await this.svc.removeExercise(s.id,e)||this.toasts.show({message:o("lesson.toast.exerciseRemoved",{name:t}),action:{label:o("lesson.toast.undo"),onclick:()=>{this.svc.addExercise(s.id,e)}}})}async attachProgram(){const e=this.lesson(),t=this.programVal.get();if(!e||!t)return;await this.svc.attachProgram(e.id,t)&&this.programVal.set("")}async detachProgram(e,t){const s=this.lesson();!s||!await this.svc.detachProgram(s.id,e)||this.toasts.show({message:o("lesson.toast.programDetached",{title:t}),action:{label:o("lesson.toast.undo"),onclick:()=>{this.svc.attachProgram(s.id,e)}}})}}const Ld=T('<div bind="host"></div>');class Ad extends E{router=this.inject(H);key=new y(()=>{const e=this.router.route.get();return e==="/lektioner"?"list":e==="/lektioner/ny"?"create":"detail"});render(){const e=this.wire(Ld,{});return this.$swap(this.ref(e,"host"),this.key,{list:yd,create:kd,detail:Nd}),e}}class gs{items=new m([]);loading=new m(!1);error=new m(null);async load(){const e=await $(this.loading,this.error,()=>v.trainingSessions.list());e&&this.items.set(e)}async create(e){const t=await $(this.loading,this.error,()=>v.trainingSessions.create(e));return t?(this.merge(t),t):null}async loadOne(e){const t=await $(this.loading,this.error,()=>v.trainingSessions.get({id:e}));return t?(this.merge(t),t):null}get(e){return this.items.get().find(t=>t.id===e)??null}async update(e,t){const s=await $(this.loading,this.error,()=>v.trainingSessions.update({id:e,...t}));return s?(this.merge(s),s):null}async addExercise(e,t){const s=await $(this.loading,this.error,()=>v.trainingSessions.addExercise({id:e,exerciseId:t}));return s?(await this.loadOne(e),s):null}async removeExercise(e,t){const s=await $(this.loading,this.error,()=>v.trainingSessions.removeExercise({id:e,exerciseId:t}));return s?(await this.loadOne(e),s):null}async attachProgram(e,t){const s=await $(this.loading,this.error,()=>v.trainingSessions.attachProgram({id:e,programId:t}));return s?(this.merge(s),s):null}async detachProgram(e,t){const s=await $(this.loading,this.error,()=>v.trainingSessions.detachProgram({id:e,programId:t}));return s?(this.merge(s),s):null}async remove(e){return await $(this.loading,this.error,()=>v.trainingSessions.delete({id:e}))?(this.items.set(this.items.get().filter(s=>s.id!==e)),!0):!1}merge(e){const t=this.items.get(),s=t.findIndex(i=>i.id===e.id);this.items.set(s===-1?[...t,e]:[...t.slice(0,s),e,...t.slice(s+1)])}}class fe{items=new m([]);loading=new m(!1);error=new m(null);async load(){const e=await $(this.loading,this.error,()=>v.teachers.list());e&&this.items.set(e)}}const Pd=T(`
    <div class="sessions">
        <header class="sessions__head">
            <h1 bind="heading" class="sessions__title"></h1>
            <button bind="log" type="button" class="sessions__log"></button>
        </header>

        <p bind="loading" class="sessions__loading"></p>

        <div bind="errorBox" class="sessions__error" role="alert">
            <p bind="errorText" class="sessions__error-text"></p>
            <button bind="retry" type="button" class="sessions__retry"></button>
        </div>

        <div bind="emptyHost"></div>

        <ul bind="list" class="sessions__list"></ul>
    </div>
`);class Dd extends E{static styles=`
        .sessions {
            & .sessions__head {
                display: flex;
                align-items: baseline;
                justify-content: space-between;
                gap: ${d("lg")};
                flex-wrap: wrap;
                margin-bottom: ${d("xl")};
            }

            /* Lora 500, and only 500 — UI_DECISIONS §3. */
            & .sessions__title {
                margin: 0;
                font-family: ${a("font-display")};
                font-weight: 500;
                font-size: 1.75rem;
                line-height: 36px;
                color: ${a("text")};
            }

            /* Buttons are Open Sans territory; the serif is forbidden here. */
            & .sessions__log { ${C(a("radius-sm"),"primary")} }
            & .sessions__log.hidden { display: none; }

            & .sessions__loading {
                margin: 0;
                color: ${a("text-muted")};
                font-size: 0.875rem;
            }
            & .sessions__loading.hidden { display: none; }

            & .sessions__error {
                display: flex;
                align-items: center;
                gap: ${d("md")};
                flex-wrap: wrap;
                padding: ${d("md")};
                margin-bottom: ${d("lg")};
                border: 1px solid ${a("danger")};
                border-radius: ${a("radius-md")};
                background: ${a("danger-soft")};

                & .sessions__error-text { margin: 0; font-size: 0.875rem; color: ${a("text")}; }
                & .sessions__retry { ${C()} }
            }
            & .sessions__error.hidden { display: none; }

            & .sessions__list {
                list-style: none;
                margin: 0;
                padding: 0;
                /* No zebra striping (§4.3): rows are separated by a hairline. */
                border-top: 1px solid ${a("border")};
            }
            & .sessions__list:empty { border-top: none; }
            & .sessions__list > li { border-bottom: 1px solid ${a("border")}; }

            & .session-row {
                display: grid;
                grid-template-columns: auto minmax(0, 1fr) auto;
                align-items: start;
                gap: ${d("lg")};
                padding: ${d("md")} ${d("sm")};
                text-decoration: none;
                color: inherit;
                font-family: ${a("font-ui")};

                &:hover { background: ${a("surface-2")}; }
                &:focus-visible { outline: 2px solid ${a("accent")}; outline-offset: -2px; }
            }

            & .session-row__date {
                display: flex;
                flex-direction: column;
                align-items: center;
                width: 3.5rem;
                /* Tabular numerals so the blocks line up column-wise (§4.3). */
                font-variant-numeric: tabular-nums;
            }
            & .session-row__day {
                font-size: 1.25rem;
                font-weight: 700;
                line-height: 1.2;
                color: ${a("text")};
            }
            & .session-row__month {
                font-size: 0.6875rem;
                font-weight: 700;
                letter-spacing: 0.12em;
                color: ${a("text-muted")};
            }
            & .session-row__time {
                margin-top: 2px;
                font-size: 0.8125rem;
                color: ${a("text-muted")};
            }

            & .session-row__body {
                display: flex;
                flex-direction: column;
                gap: ${d("xs")};
                min-width: 0;
            }
            & .session-row__title {
                font-size: 0.9375rem;
                font-weight: 600;
                color: ${a("text")};
                overflow-wrap: anywhere;
            }
            /* One meta line, not four — §4.3 allows at most two rows of text. */
            & .session-row__meta {
                display: flex;
                align-items: baseline;
                flex-wrap: wrap;
                gap: ${d("xs")} ${d("sm")};
                font-size: 0.8125rem;
                color: ${a("text-muted")};
            }

            & .session-row__chips {
                display: flex;
                flex-wrap: wrap;
                gap: ${d("xs")};
                justify-content: flex-end;
                align-items: flex-start;
                max-width: 18rem;
            }
            /* Row chips are labels, not links: a nested anchor inside the row's
               own anchor is invalid, and §4.3 wants the row to have exactly one
               target. The clickable parent chips live in the detail header. */
            & .session-row__chip {
                display: inline-flex;
                align-items: center;
                padding: 2px ${d("sm")};
                border: 1px solid ${a("border")};
                border-radius: ${a("radius-pill")};
                font-size: 0.75rem;
                font-weight: 600;
                line-height: 1.4;
                color: ${a("text-muted")};
                white-space: nowrap;
                max-width: 14rem;
                overflow: hidden;
                text-overflow: ellipsis;
            }

            /* UI_DECISIONS §6: single column below 640px. The date block keeps
               its own row and turns horizontal so it stops being a tall stack
               beside nothing. */
            @media (max-width: 639px) {
                & .session-row {
                    grid-template-columns: minmax(0, 1fr);
                    gap: ${d("sm")};
                }
                & .session-row__date {
                    flex-direction: row;
                    align-items: baseline;
                    gap: ${d("xs")};
                    width: auto;
                }
                & .session-row__day { font-size: 1rem; }
                & .session-row__chips { justify-content: flex-start; max-width: none; }
                & .sessions__title { font-size: 1.375rem; line-height: 30px; }
            }
        }
    `;router=this.inject(H);sessions=this.inject(gs);teachers=this.inject(fe);teachersResolved=new m(!1);ordered=new y(()=>this.teachersResolved.get()?Ar(this.sessions.items.get()):[]);isEmpty=new y(()=>this.teachersResolved.get()&&this.sessions.items.get().length===0&&!this.sessions.loading.get()&&this.sessions.error.get()===null);onMount(){this.sessions.load(),this.teachers.load().finally(()=>this.teachersResolved.set(!0))}render(){const e=this.wire(Pd,{heading:{textContent:()=>o("trainingSessions.heading")},log:{textContent:()=>o("trainingSessions.log"),onclick:()=>this.router.navigate("/traningspass/ny")},loading:{textContent:()=>o("trainingSessions.loading"),className:()=>(!this.teachersResolved.get()||this.sessions.loading.get())&&this.ordered.get().length===0&&this.sessions.error.get()===null?"sessions__loading":"sessions__loading hidden"},errorBox:{className:()=>this.sessions.error.get()?"sessions__error":"sessions__error hidden"},errorText:{textContent:()=>o("trainingSessions.error")},retry:{textContent:()=>o("trainingSessions.retry"),onclick:()=>{this.sessions.load()}}});return this.buildEmpty(this.ref(e,"emptyHost")),this.$each(this.ref(e,"list"),this.ordered,(t,s,i)=>this.renderRow(t,i),Mr),e}buildEmpty(e){let t=null;this.track(w(()=>{const s=this.isEmpty.get();t?.destroy(),t=null,e.replaceChildren(),s&&(t=j(()=>{const i=new U({heading:()=>o("trainingSessions.empty.heading"),body:()=>o("trainingSessions.empty.body"),action:{label:()=>o("trainingSessions.empty.action"),onclick:()=>this.router.navigate("/traningspass/ny")},headingLevel:2});return i.mount(e),i}))})),this.track(()=>t?.destroy())}renderRow(e,t){const s=document.createElement("li"),i=`/traningspass/${e.id}`,r=document.createElement("a");r.className="session-row",r.href=i,r.addEventListener("click",A=>{A.preventDefault(),this.router.navigate(i)});const l=Gn(e.performedAt),c=document.createElement("span");c.className="session-row__date";for(const[A,S]of[["day",l.day],["month",l.month],["time",l.time]]){const O=document.createElement("span");O.className=`session-row__${A}`,O.textContent=S,c.appendChild(O)}const h=document.createElement("span");h.className="session-row__body";const u=document.createElement("span");u.className="session-row__title",u.textContent=je(e),h.appendChild(u);const p=document.createElement("span");p.className="session-row__meta";const b=ls(e.durationMin);b&&p.appendChild(Qe(b)),e.horseName&&p.appendChild(Qe(e.horseName)),p.appendChild(Qe(Or(e.exercises)));const _=ds(e.summary);_&&_!==u.textContent&&p.appendChild(Qe(_)),h.appendChild(p);const k=document.createElement("span");k.className="session-row__chips";const I=document.createElement("span");k.appendChild(I);const N=new Ke({recipients:()=>Kt(e.sharedWithTeacherIds,this.teachers.items.get()),shared:()=>e.sharedWithTeacherIds.length>0});N.mount(I),t(()=>N.destroy()),e.planTitle&&k.appendChild(mn(Wn(e.planTitle)));for(const A of zr(e))k.appendChild(mn(Kn(A)));return r.append(c,h,k),s.appendChild(r),s}}function Qe(n){const e=document.createElement("span");return e.textContent=n,e}function mn(n){const e=document.createElement("span");return e.className="session-row__chip",e.textContent=n,e.title=n,e}class $e{items=new m([]);loading=new m(!1);error=new m(null);async load(){const e=await $(this.loading,this.error,()=>v.plans.list());e&&this.items.set(e)}async loadDetail(e){return await $(this.loading,this.error,()=>v.plans.get({id:e}))??null}async create(e){const t=await $(this.loading,this.error,()=>v.plans.create(e));if(!t)return null;const s=this.items.get(),i=s.findIndex(r=>r.status==="archived");return this.items.set(i===-1?[t,...s]:[...s.slice(0,i),t,...s.slice(i)]),t}async update(e,t){const s=await $(this.loading,this.error,()=>v.plans.update({id:e,...t}));return s?(this.items.set(this.items.get().map(i=>i.id===e?s:i)),s):null}async archive(e){return await $(this.loading,this.error,()=>v.plans.archive({id:e}))?(this.items.set(this.items.get().map(s=>s.id===e?{...s,status:"archived"}:s)),!0):!1}}const Hd=T(`
    <form class="log-session" bind="form">
        <a bind="back" href="/traningspass" class="log-session__back"></a>
        <h1 bind="heading" class="log-session__title"></h1>

        <div class="log-session__panel">
            <div class="log-session__pair">
                <label class="log-session__field">
                    <span bind="whenLabel" class="log-session__label"></span>
                    <input bind="whenInput" type="datetime-local" class="log-session__input" required>
                </label>
                <label class="log-session__field">
                    <span bind="durationLabel" class="log-session__label"></span>
                    <input bind="durationInput" type="number" min="0" step="1" class="log-session__input">
                    <span bind="durationHint" class="log-session__hint"></span>
                </label>
            </div>

            <label bind="horseField" class="log-session__field">
                <span bind="horseLabel" class="log-session__label"></span>
                <div bind="horseHost" class="log-session__control"></div>
                <span bind="horseHint" class="log-session__hint"></span>
            </label>

            <label class="log-session__field">
                <span bind="summaryLabel" class="log-session__label"></span>
                <textarea bind="summaryInput" rows="4" class="log-session__textarea"></textarea>
                <span bind="summaryHint" class="log-session__hint"></span>
            </label>

            <label bind="planField" class="log-session__field">
                <span bind="planLabel" class="log-session__label"></span>
                <div bind="planHost" class="log-session__control"></div>
                <span bind="planHint" class="log-session__hint"></span>
            </label>

            <label bind="programField" class="log-session__field">
                <span bind="programLabel" class="log-session__label"></span>
                <div bind="programHost" class="log-session__control"></div>
                <span bind="programHint" class="log-session__hint"></span>
            </label>

            <fieldset bind="shareField" class="log-session__share">
                <legend bind="shareLegend" class="log-session__label"></legend>
                <p bind="shareHint" class="log-session__hint"></p>

                <label bind="shareSingle" class="log-session__check">
                    <input bind="shareSingleInput" type="checkbox">
                    <span bind="shareSingleLabel"></span>
                </label>

                <div bind="shareMulti" class="log-session__control"></div>

                <div bind="offer" class="log-session__offer">
                    <p bind="offerText" class="log-session__offer-text"></p>
                    <button bind="offerAction" type="button" class="log-session__offer-button"></button>
                </div>
            </fieldset>

            <p bind="error" class="log-session__error" role="alert"></p>

            <div class="log-session__actions">
                <button bind="submit" type="submit" class="log-session__submit"></button>
                <button bind="cancel" type="button" class="log-session__cancel"></button>
            </div>
        </div>
    </form>
`);function Od(n){return new Date(n).toISOString()}class zd extends E{static styles=`
        .log-session {
            display: flex;
            flex-direction: column;
            gap: ${d("lg")};
            max-width: 34rem;
            font-family: ${a("font-ui")};

            & .log-session__back {
                font-size: 0.875rem;
                color: ${a("text-muted")};
                text-decoration: none;
                &:hover { color: ${a("accent-strong")}; text-decoration: underline; }
                &:focus-visible { outline: 2px solid ${a("accent")}; outline-offset: 2px; }
            }

            /* Lora 500 only (UI_DECISIONS §3). */
            & .log-session__title {
                margin: 0;
                font-family: ${a("font-display")};
                font-weight: 500;
                font-size: 1.75rem;
                line-height: 36px;
                color: ${a("text")};
            }

            & .log-session__field {
                display: flex;
                flex-direction: column;
                gap: ${d("xs")};
            }
            & .log-session__field.hidden { display: none; }

            & .log-session__pair {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: ${d("md")};
            }

            & .log-session__label {
                font-size: 0.8125rem;
                font-weight: 600;
                color: ${a("text")};
            }

            /*
             * The fields sit in a panel, not loose on the page. The §4.8 field
             * recipe fills with --bg — the page-paper colour — so a form
             * rendered straight onto the route would give the field the same
             * colour as everything behind it. The panel is what the recessed
             * fill is recessed INTO. §4.8's own example shows the same thing.
             */
            & .log-session__panel {
                ${Q()}
                box-sizing: border-box;
                padding: ${d("xl")};
                display: flex;
                flex-direction: column;
                gap: ${d("lg")};
            }

            & .log-session__hint {
                margin: 0;
                font-size: 0.8125rem;
                line-height: 1.5;
                color: ${a("text-muted")};
                max-width: 68ch;
            }

            & .log-session__input, & .log-session__textarea {
                ${K()}
                width: 100%;
                box-sizing: border-box;
            }
            & .log-session__textarea {
                font-family: inherit;
                line-height: 1.6;
                resize: vertical;
            }

            & .log-session__control .ui-select { display: block; }

            /* The trust surface gets a visible boundary — it is a decision, not
               just another field. */
            & .log-session__share {
                display: flex;
                flex-direction: column;
                gap: ${d("sm")};
                margin: 0;
                padding: ${d("md")};
                border: 1px solid ${a("border")};
                border-radius: ${a("radius-md")};
            }
            & .log-session__share.hidden { display: none; }

            & .log-session__check {
                display: flex;
                align-items: center;
                gap: ${d("sm")};
                font-size: 0.875rem;
                color: ${a("text")};
                cursor: pointer;
            }
            & .log-session__check.hidden { display: none; }
            & .log-session__check input { accent-color: ${a("accent")}; }

            /* The offer to share with a Program's owner. An offer, never a
               silent decision — see unsharedProgramOwners in the copy module. */
            & .log-session__offer {
                display: flex;
                align-items: center;
                flex-wrap: wrap;
                gap: ${d("sm")};
                padding: ${d("sm")} ${d("md")};
                border-left: 2px solid ${a("brass-line")};
                background: ${a("surface-2")};

                & .log-session__offer-text {
                    margin: 0;
                    font-size: 0.8125rem;
                    line-height: 1.5;
                    color: ${a("text")};
                    max-width: 68ch;
                }
                & .log-session__offer-button {
                    ${C()}
                    font-size: 0.8125rem;
                }
            }
            & .log-session__offer.hidden { display: none; }

            & .log-session__error {
                margin: 0;
                min-height: 1em;
                font-size: 0.875rem;
                color: ${a("danger")};
            }

            & .log-session__actions {
                display: flex;
                gap: ${d("sm")};
                flex-wrap: wrap;
            }
            /* §4.8: one primary per form. This is it. */
            & .log-session__submit { ${C(a("radius-sm"),"primary")} }
            /* Cancel is the ghost tier — not a second bordered button. */
            & .log-session__cancel { ${C(a("radius-sm"),"ghost")} }

            /* UI_DECISIONS §6: paired field rows collapse below 640px. */
            @media (max-width: 639px) {
                & .log-session__pair { grid-template-columns: 1fr; }
                & .log-session__actions { flex-direction: column; align-items: stretch; }
                & .log-session__title { font-size: 1.375rem; line-height: 30px; }
            }
        }
    `;router=this.inject(H);sessions=this.inject(gs);teachers=this.inject(fe);stable=this.inject(ke);plans=this.inject($e);toasts=this.inject(te);whenVal=new m("");durationVal=new m("");summaryVal=new m("");horseVal=new m("");planVal=new m("");programVal=new m("");shareVals=new m([]);programCatalog=new m([]);validation=new m("");horses=new y(()=>Un(this.stable.items.get()));activePlans=new y(()=>Yn(this.plans.items.get()));horseOptions=new y(()=>[{value:"",label:o("trainingSession.horse.none")},...this.horses.get().map(e=>({value:e.id,label:e.name}))]);planOptions=new y(()=>[{value:"",label:o("trainingSession.plan.none")},...this.activePlans.get().map(e=>({value:e.id,label:e.title}))]);programOptions=new y(()=>Wt(this.programCatalog.get(),this.teachers.items.get(),e=>e.title));teacherOptions=new y(()=>this.teachers.items.get().map(e=>({value:e.id,label:e.displayName})));teacherCount=new y(()=>this.teachers.items.get().length);pendingOwner=new y(()=>{const e=this.programVal.get();if(!e)return null;const t=this.programCatalog.get().find(s=>s.id===e);return t?Zn([{id:t.id,title:t.title}],this.programCatalog.get(),this.shareVals.get(),this.teachers.items.get())[0]??null:null});onMount(){this.teachers.load(),this.stable.load(),this.plans.load(),v.programs.listForStudent().then(e=>this.programCatalog.set(e)).catch(()=>this.programCatalog.set([]))}render(){const e=this.wire(Hd,{back:{onclick:this.router.link("/traningspass").onclick,textContent:()=>o("trainingSession.back")},heading:{textContent:()=>o("trainingSessionCreate.heading")},whenLabel:{textContent:()=>o("trainingSessionCreate.field.when")},whenInput:{value:()=>this.whenVal.get(),oninput:t=>this.whenVal.set(t.target.value)},durationLabel:{textContent:()=>o("trainingSessionCreate.field.duration")},durationHint:{textContent:()=>o("trainingSessionCreate.field.duration.hint")},durationInput:{value:()=>this.durationVal.get(),oninput:t=>this.durationVal.set(t.target.value)},horseField:{className:()=>this.horses.get().length===0?"log-session__field hidden":"log-session__field"},horseLabel:{textContent:()=>o("trainingSessionCreate.field.horse")},horseHint:{textContent:()=>o("trainingSessionCreate.field.horse.hint")},summaryLabel:{textContent:()=>o("trainingSessionCreate.field.summary")},summaryHint:{textContent:()=>o("trainingSessionCreate.field.summary.hint")},summaryInput:{value:()=>this.summaryVal.get(),oninput:t=>this.summaryVal.set(t.target.value)},planField:{className:()=>this.activePlans.get().length===0?"log-session__field hidden":"log-session__field"},planLabel:{textContent:()=>o("trainingSessionCreate.field.plan")},planHint:{textContent:()=>o("trainingSessionCreate.field.plan.hint")},programField:{className:()=>this.programCatalog.get().length===0?"log-session__field hidden":"log-session__field"},programLabel:{textContent:()=>o("trainingSessionCreate.field.program")},programHint:{textContent:()=>o("trainingSessionCreate.field.program.hint")},shareField:{className:()=>this.teacherCount.get()===0?"log-session__share hidden":"log-session__share"},shareLegend:{textContent:()=>o("trainingSession.sharing.legend")},shareHint:{textContent:()=>o("trainingSession.sharing.hint")},shareSingle:{className:()=>this.teacherCount.get()===1?"log-session__check":"log-session__check hidden"},shareSingleLabel:{textContent:()=>{const t=this.teachers.items.get()[0];return t?o("trainingSession.sharing.withTeacher",{name:t.displayName}):""}},shareSingleInput:{checked:()=>this.shareVals.get().length>0,onchange:t=>{const s=this.teachers.items.get()[0];s&&this.shareVals.set(t.target.checked?[s.id]:[])}},shareMulti:{className:()=>this.teacherCount.get()>1?"log-session__control":"log-session__control hidden"},offer:{className:()=>this.pendingOwner.get()?"log-session__offer":"log-session__offer hidden"},offerText:{textContent:()=>{const t=this.pendingOwner.get();return t?o("trainingSession.programOffer",{name:t.displayName}):""}},offerAction:{textContent:()=>{const t=this.pendingOwner.get();return t?o("trainingSession.programOffer.action",{name:t.displayName}):""},onclick:()=>{const t=this.pendingOwner.get();t&&this.shareVals.set([...new Set([...this.shareVals.get(),t.id])])}},error:{textContent:()=>this.validation.get()||(this.sessions.error.get()?o("trainingSessions.saveError"):"")},submit:{textContent:()=>o("trainingSessionCreate.submit"),disabled:()=>this.sessions.loading.get()},cancel:{textContent:()=>o("trainingSessionCreate.cancel"),onclick:()=>this.router.navigate("/traningspass")},form:{onsubmit:t=>{this.submit(t)}}});return this.spawn(R,this.ref(e,"horseHost"),{value:this.horseVal,options:this.horseOptions}),this.spawn(R,this.ref(e,"planHost"),{value:this.planVal,options:this.planOptions}),this.spawn(R,this.ref(e,"programHost"),{value:this.programVal,options:this.programOptions,placeholder:o("trainingSession.programs.placeholder")}),this.spawn(R,this.ref(e,"shareMulti"),{multiple:!0,values:this.shareVals,options:this.teacherOptions,placeholder:o("trainingSession.sharing.placeholder"),countLabel:t=>q("trainingSession.sharing.count",t)}),this.track(w(()=>{const t=new Set(this.teachers.items.get().map(r=>r.id)),s=this.shareVals.get(),i=s.filter(r=>t.has(r));i.length!==s.length&&this.shareVals.set(i)})),e}async submit(e){e.preventDefault();const t=this.whenVal.get();if(!t)return this.validation.set(o("trainingSessionCreate.error.when"));const s=this.durationVal.get().trim();let i=null;if(s!==""){const p=Number(s);if(!Number.isInteger(p)||p<0)return this.validation.set(o("trainingSessionCreate.error.duration"));i=p}this.validation.set("");const r=this.summaryVal.get().trim(),l=this.horseVal.get(),c=this.planVal.get(),h=this.programVal.get(),u=await this.sessions.create({performedAt:Od(t),durationMin:i,summary:r===""?null:r,...l?{horseId:l}:{},...c?{planId:c}:{},...h?{programId:h}:{},shareWithTeacherIds:this.shareVals.get()});u&&(this.toasts.show({message:o("trainingSessionCreate.created"),variant:"success"}),this.router.navigate(`/traningspass/${u.id}`))}}const jd=T(`
    <div class="session-detail" bind="root">
        <a bind="back" href="/traningspass" class="session-detail__back"></a>
        <p bind="loading" class="session-detail__loading"></p>
        <div bind="notFoundHost"></div>

        <div bind="body" class="session-detail__body">
            <div bind="headerHost"></div>

            <div bind="conflict" class="session-detail__conflict" role="alert">
                <p bind="conflictText" class="session-detail__conflict-text"></p>
                <button bind="conflictRetry" type="button" class="session-detail__conflict-action"></button>
            </div>

            <section bind="detailsSection" class="session-detail__section">
                <h2 bind="detailsHeading" class="session-detail__heading"></h2>
                <form bind="detailsForm" class="session-detail__form">
                    <div class="session-detail__pair">
                        <label class="session-detail__field">
                            <span bind="whenLabel" class="session-detail__label"></span>
                            <input bind="whenInput" type="datetime-local" class="session-detail__input" required>
                        </label>
                        <label class="session-detail__field">
                            <span bind="durationLabel" class="session-detail__label"></span>
                            <input bind="durationInput" type="number" min="0" step="1" class="session-detail__input">
                        </label>
                    </div>
                    <div class="session-detail__pair">
                        <label bind="horseField" class="session-detail__field">
                            <span bind="horseLabel" class="session-detail__label"></span>
                            <div bind="horseHost" class="session-detail__control"></div>
                        </label>
                        <label bind="planField" class="session-detail__field">
                            <span bind="planLabel" class="session-detail__label"></span>
                            <div bind="planHost" class="session-detail__control"></div>
                        </label>
                    </div>
                    <label class="session-detail__field">
                        <span bind="summaryLabel" class="session-detail__label"></span>
                        <textarea bind="summaryInput" rows="5" class="session-detail__textarea"></textarea>
                    </label>
                    <p bind="detailsError" class="session-detail__field-error" role="alert"></p>
                    <div class="session-detail__row">
                        <button bind="save" type="submit" class="session-detail__save"></button>
                    </div>
                </form>
            </section>

            <section bind="readSummarySection" class="session-detail__section">
                <h2 bind="readSummaryHeading" class="session-detail__heading"></h2>
                <p bind="readSummary" class="session-detail__summary"></p>
                <p bind="readSummaryEmpty" class="session-detail__muted"></p>
            </section>

            <section bind="sharingSection" class="session-detail__section">
                <h2 bind="sharingHeading" class="session-detail__heading"></h2>
                <p bind="sharingHint" class="session-detail__hint"></p>
                <p bind="sharingNone" class="session-detail__muted"></p>
                <label bind="shareSingle" class="session-detail__check">
                    <input bind="shareSingleInput" type="checkbox">
                    <span bind="shareSingleLabel"></span>
                </label>
                <div bind="shareMulti" class="session-detail__control"></div>
                <div bind="offer" class="session-detail__offer">
                    <p bind="offerText" class="session-detail__offer-text"></p>
                    <button bind="offerAction" type="button" class="session-detail__offer-button"></button>
                </div>
            </section>

            <section bind="programsSection" class="session-detail__section">
                <h2 bind="programsHeading" class="session-detail__heading"></h2>
                <p bind="programsHint" class="session-detail__hint"></p>
                <ul bind="programList" class="session-detail__prog-list"></ul>
                <p bind="programsEmpty" class="session-detail__muted"></p>
                <div bind="programAdd" class="session-detail__row">
                    <div bind="programHost" class="session-detail__control session-detail__control--grow"></div>
                    <button bind="attachProgram" type="button" class="session-detail__secondary"></button>
                </div>
            </section>

            <section class="session-detail__section">
                <h2 bind="exercisesHeading" class="session-detail__heading"></h2>
                <ol bind="exerciseList" class="session-detail__ex-list"></ol>
                <p bind="exercisesEmpty" class="session-detail__muted"></p>
                <div bind="exerciseAdd" class="session-detail__row">
                    <div bind="exerciseHost" class="session-detail__control session-detail__control--grow"></div>
                    <button bind="addExercise" type="button" class="session-detail__secondary"></button>
                </div>
            </section>

            <section class="session-detail__section">
                <div bind="notesHost"></div>
            </section>
        </div>

        <div bind="confirmDeleteHost"></div>
        <div bind="confirmRemoveHost"></div>
    </div>
`);function Vd(n){const e=new Date(n),t=s=>String(s).padStart(2,"0");return`${e.getFullYear()}-${t(e.getMonth()+1)}-${t(e.getDate())}T${t(e.getHours())}:${t(e.getMinutes())}`}function Fd(n){return new Date(n).toISOString()}class Rd extends E{static styles=`
        .session-detail {
            display: flex;
            flex-direction: column;
            gap: ${d("lg")};
            font-family: ${a("font-ui")};

            & .session-detail__back {
                font-size: 0.875rem;
                color: ${a("text-muted")};
                text-decoration: none;
                align-self: flex-start;
                &:hover { color: ${a("accent-strong")}; text-decoration: underline; }
                &:focus-visible { outline: 2px solid ${a("accent")}; outline-offset: 2px; }
            }
            & .session-detail__back.hidden { display: none; }

            & .session-detail__loading {
                margin: 0;
                color: ${a("text-muted")};
                font-size: 0.875rem;
            }
            & .session-detail__loading.hidden { display: none; }

            & .session-detail__body {
                display: flex;
                flex-direction: column;
                gap: ${d("xl")};
            }
            & .session-detail__body.hidden { display: none; }

            & .session-detail__conflict {
                display: flex;
                align-items: center;
                flex-wrap: wrap;
                gap: ${d("md")};
                padding: ${d("md")};
                border: 1px solid ${a("warning")};
                border-radius: ${a("radius-md")};
                background: ${a("warning-soft")};

                & .session-detail__conflict-text {
                    margin: 0;
                    font-size: 0.875rem;
                    color: ${a("text")};
                    max-width: 68ch;
                }
                & .session-detail__conflict-action {
                    ${C()}
                }
            }
            & .session-detail__conflict.hidden { display: none; }

            & .session-detail__section { display: flex; flex-direction: column; gap: ${d("md")}; }
            & .session-detail__section.hidden { display: none; }

            /* Section headings are the second permitted serif use (20/28), and
               weight 500 like every other Lora run in this app. */
            & .session-detail__heading {
                margin: 0;
                font-family: ${a("font-display")};
                font-weight: 500;
                font-size: 1.25rem;
                line-height: 28px;
                color: ${a("text")};
            }

            & .session-detail__hint, & .session-detail__muted {
                margin: 0;
                font-size: 0.8125rem;
                line-height: 1.5;
                color: ${a("text-muted")};
                max-width: 68ch;
            }
            & .session-detail__muted.hidden { display: none; }
            & .session-detail__hint.hidden { display: none; }

            /* The Student's own words, read at a reading measure and never
               clamped — this is the text the whole occasion is about. */
            & .session-detail__summary {
                margin: 0;
                white-space: pre-wrap;
                font-size: 0.9375rem;
                line-height: 1.7;
                color: ${a("text")};
                max-width: 68ch;
            }
            & .session-detail__summary.hidden { display: none; }

            /*
             * The edit form is a panel. The §4.8 field recipe fills with --bg,
             * the page-paper colour, and a detail section is drawn straight
             * onto that page — so without the panel the fields would be the
             * same colour as everything behind them.
             */
            & .session-detail__form {
                ${Q()}
                box-sizing: border-box;
                padding: ${d("xl")};
                display: flex;
                flex-direction: column;
                gap: ${d("md")};
                max-width: 34rem;
            }
            & .session-detail__pair {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: ${d("md")};
            }
            & .session-detail__field { display: flex; flex-direction: column; gap: ${d("xs")}; }
            & .session-detail__field.hidden { display: none; }
            & .session-detail__label { font-size: 0.8125rem; font-weight: 600; color: ${a("text")}; }
            & .session-detail__input, & .session-detail__textarea {
                ${K()}
                width: 100%;
                box-sizing: border-box;
            }
            & .session-detail__textarea {
                font-family: inherit;
                line-height: 1.6;
                resize: vertical;
            }
            & .session-detail__field-error {
                margin: 0;
                min-height: 1em;
                font-size: 0.8125rem;
                color: ${a("danger")};
            }
            & .session-detail__control .ui-select { display: block; }
            & .session-detail__control--grow { flex: 1; min-width: 0; }
            & .session-detail__control.hidden { display: none; }
            /* The sharing picker is a form control, so it keeps the form's
               measure instead of stretching to the full content width. */
            & .session-detail__section > .session-detail__control { max-width: 34rem; }

            & .session-detail__check {
                display: flex;
                align-items: center;
                gap: ${d("sm")};
                font-size: 0.875rem;
                color: ${a("text")};
                cursor: pointer;
            }
            & .session-detail__check.hidden { display: none; }
            & .session-detail__check input { accent-color: ${a("accent")}; }

            /* The offer to share with an attached Program's owner. */
            & .session-detail__offer {
                display: flex;
                align-items: center;
                flex-wrap: wrap;
                gap: ${d("sm")};
                padding: ${d("sm")} ${d("md")};
                border-left: 2px solid ${a("brass-line")};
                background: ${a("surface-2")};

                & .session-detail__offer-text {
                    margin: 0;
                    font-size: 0.8125rem;
                    line-height: 1.5;
                    color: ${a("text")};
                    max-width: 68ch;
                }
                & .session-detail__offer-button {
                    ${C()}
                    font-size: 0.8125rem;
                }
            }
            & .session-detail__offer.hidden { display: none; }

            & .session-detail__row {
                display: flex;
                align-items: center;
                gap: ${d("sm")};
                flex-wrap: wrap;
            }
            & .session-detail__row.hidden { display: none; }
            /*
             * Selects in a row on the page, not inside the form panel, keep a
             * raised --surface fill — the recessed --bg fill is only legible
             * against a card.
             */
            & .session-detail__row .ui-select__trigger { background: ${a("surface")}; }

            & .session-detail__save {
                ${C()}
                background: ${a("accent")};
                color: ${a("on-accent")};
                border: 1px solid ${a("accent")};
            }
            & .session-detail__secondary {
                    ${C()}
                }
            & .session-detail__save:focus-visible,
            & .session-detail__secondary:focus-visible { outline: 2px solid ${a("accent")}; outline-offset: 2px; }

            & .session-detail__prog-list, & .session-detail__ex-list {
                list-style: none;
                margin: 0;
                padding: 0;
                display: flex;
                flex-direction: column;
            }
            & .session-detail__prog-list { gap: ${d("xs")}; }
            & .session-detail__ex-list {
                border-top: 1px solid ${a("border")};
                counter-reset: occurrence;
            }
            & .session-detail__ex-list:empty { border-top: none; }
            & .session-detail__ex-item {
                border-bottom: 1px solid ${a("border")};
                padding: ${d("md")} 0;
                display: flex;
                flex-direction: column;
                gap: ${d("sm")};
            }

            & .session-detail__prog-item {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: ${d("sm")};
                padding: ${d("sm")} ${d("md")};
                background: ${a("surface")};
                border: 1px solid ${a("border")};
                border-radius: ${a("radius-md")};
                font-size: 0.875rem;
            }

            & .session-detail__ex-head {
                display: flex;
                align-items: baseline;
                justify-content: space-between;
                gap: ${d("md")};
                flex-wrap: wrap;
            }
            & .session-detail__ex-name {
                font-size: 0.9375rem;
                font-weight: 600;
                color: ${a("text")};
            }
            /* Performed order is data, so the ordinal is generated rather than
               typed into the name. */
            & .session-detail__ex-name::before {
                counter-increment: occurrence;
                content: counter(occurrence) ". ";
                color: ${a("text-muted")};
                font-variant-numeric: tabular-nums;
            }
            & .session-detail__ex-source {
                font-size: 0.75rem;
                font-weight: 600;
                color: ${a("text-muted")};
                border: 1px solid ${a("border")};
                border-radius: ${a("radius-pill")};
                padding: 2px ${d("sm")};
            }
            /* The static Row note is instruction copied WITH the occurrence —
               never an authored Note, so it carries no author, no timestamp and
               no composer. The brass hairline is what tells the two apart. */
            & .session-detail__ex-note {
                margin: 0;
                padding-left: ${d("md")};
                border-left: 2px solid ${a("brass-line")};
                font-size: 0.875rem;
                line-height: 1.6;
                color: ${a("text")};
                max-width: 68ch;
            }
            & .session-detail__ex-actions {
                display: flex;
                align-items: center;
                gap: ${d("md")};
                flex-wrap: wrap;
            }
            & .session-detail__link {
                background: none;
                border: none;
                padding: 0;
                font-family: inherit;
                font-size: 0.8125rem;
                font-weight: 600;
                color: ${a("accent-strong")};
                text-decoration: none;
                cursor: pointer;
                &:hover { text-decoration: underline; }
                &:focus-visible { outline: 2px solid ${a("accent")}; outline-offset: 2px; }
            }
            & .session-detail__link--danger { color: ${a("danger")}; }

            /* UI_DECISIONS §6: paired field rows collapse below 640px. */
            @media (max-width: 639px) {
                & .session-detail__pair { grid-template-columns: 1fr; }
                & .session-detail__row { align-items: stretch; }
            }
        }
    `;router=this.inject(H);auth=this.inject(re);svc=this.inject(gs);teachers=this.inject(fe);stable=this.inject(ke);plans=this.inject($e);toasts=this.inject(te);resolved=new m(!1);found=new m(!0);catalog=new m([]);programCatalog=new m([]);whenVal=new m("");durationVal=new m("");summaryVal=new m("");horseVal=new m("");planVal=new m("");programVal=new m("");exerciseVal=new m("");shareVals=new m([]);detailsError=new m("");openNotes=new m(new Set);confirmDelete=new m(!1);confirmRemove=new m(!1);pendingRemoval=new m(null);studentName=new m("");recipientsResolved=new m(!1);shareSeeded=new m(!1);sessionId(){return this.router.route.get().split("/")[2]??""}session(){return this.svc.get(this.sessionId())}viewer=new y(()=>{const e=this.session(),t=this.auth.currentUser.get()?.id;return e&&t&&e.studentId===t?"owner":"sharedTeacher"});controls=new y(()=>Nr(this.viewer.get()));conflicted=new y(()=>Lr(this.svc.error.get()));horses=new y(()=>Un(this.stable.items.get()));activePlans=new y(()=>Yn(this.plans.items.get()));horseOptions=new y(()=>{const e=this.horses.get(),t=this.session();return[{value:"",label:o("trainingSession.horse.none")},...e.map(s=>({value:s.id,label:s.name})),...t?.horseId&&!e.some(s=>s.id===t.horseId)?[{value:t.horseId,label:t.horseName??""}]:[]]});planOptions=new y(()=>[{value:"",label:o("trainingSession.plan.none")},...this.activePlans.get().map(e=>({value:e.id,label:e.title}))]);programOptions=new y(()=>Wt(this.programCatalog.get(),this.teachers.items.get(),e=>e.title,new Set((this.session()?.programs??[]).map(e=>e.id))));exerciseOptions=new y(()=>Wt(this.catalog.get(),this.teachers.items.get(),e=>e.name,new Set((this.session()?.exercises??[]).map(e=>e.exerciseId))));teacherOptions=new y(()=>this.teachers.items.get().map(e=>({value:e.id,label:e.displayName})));teacherCount=new y(()=>this.teachers.items.get().length);pendingOwners=new y(()=>Zn(this.session()?.programs??[],this.programCatalog.get(),this.shareVals.get(),this.teachers.items.get()));onMount(){this.resolve()}async resolve(){this.shareSeeded.set(!1);const e=await this.svc.loadOne(this.sessionId());if(!e){this.found.set(!1),this.resolved.set(!0);return}this.whenVal.set(Vd(e.performedAt)),this.durationVal.set(e.durationMin===null?"":String(e.durationMin)),this.summaryVal.set(e.summary??""),this.horseVal.set(e.horseId??""),this.planVal.set(e.planId??""),this.shareVals.set([...e.sharedWithTeacherIds]),this.shareSeeded.set(!0),this.found.set(!0),this.resolved.set(!0);const t=this.auth.currentUser.get()?.id;if(t&&e.studentId===t){const[s,i]=await Promise.all([v.exercises.listForStudent().catch(()=>[]),v.programs.listForStudent().catch(()=>[]),this.teachers.load(),this.stable.load(),this.plans.load()]);this.catalog.set(s),this.programCatalog.set(i)}else{const s=await v.students.get({id:e.studentId}).catch(()=>null);this.studentName.set(s?.displayName??"")}this.recipientsResolved.set(!0)}audience(){const e=this.session();return e?this.viewer.get()==="owner"?Kt(e.sharedWithTeacherIds,this.teachers.items.get()):Fr(e.sharedWithTeacherIds,this.auth.currentUser.get()?.id??"",o("trainingSession.share.you")):[]}noteRecipients(){const e=this.session();return e?this.viewer.get()==="owner"?Kt(e.sharedWithTeacherIds,this.teachers.items.get()):[{id:e.studentId,name:this.studentName.get()}]:[]}roleOf=e=>e===this.session()?.studentId?"student":"teacher";exerciseThread(e,t){return{parentKind:"training_session_exercise",parentId:e,context:()=>[o("objectKind.exercise"),t].join(" · "),recipients:()=>this.noteRecipients(),roleOf:s=>this.roleOf(s.authorId),headingLevel:4}}sessionContext(){const e=this.session();return e?[o("objectKind.trainingSession"),ct(e.performedAt),e.horseName].filter(Boolean).join(" · "):o("objectKind.trainingSession")}render(){const e=this.wire(jd,{back:{...this.router.link("/traningspass"),textContent:()=>o("trainingSession.back"),className:()=>this.resolved.get()&&!this.found.get()?"session-detail__back hidden":"session-detail__back"},loading:{textContent:()=>o("trainingSession.loading"),className:()=>this.resolved.get()?"session-detail__loading hidden":"session-detail__loading"},body:{className:()=>this.resolved.get()&&this.found.get()?"session-detail__body":"session-detail__body hidden"},conflict:{className:()=>this.conflicted.get()?"session-detail__conflict":"session-detail__conflict hidden"},conflictText:{textContent:()=>o("trainingSession.conflict.message")},conflictRetry:{textContent:()=>o("trainingSession.conflict.action"),onclick:()=>{this.resolve()}},detailsSection:{className:()=>this.controls.get().editDetails?"session-detail__section":"session-detail__section hidden"},detailsHeading:{textContent:()=>o("trainingSession.section.details")},whenLabel:{textContent:()=>o("trainingSession.field.when")},whenInput:{value:()=>this.whenVal.get(),oninput:t=>this.whenVal.set(t.target.value)},durationLabel:{textContent:()=>o("trainingSession.field.duration")},durationInput:{value:()=>this.durationVal.get(),oninput:t=>this.durationVal.set(t.target.value)},horseField:{className:()=>this.horseOptions.get().length===1?"session-detail__field hidden":"session-detail__field"},horseLabel:{textContent:()=>o("trainingSession.field.horse")},planField:{className:()=>this.activePlans.get().length===0?"session-detail__field hidden":"session-detail__field"},planLabel:{textContent:()=>o("trainingSession.field.plan")},summaryLabel:{textContent:()=>o("trainingSession.field.summary")},summaryInput:{value:()=>this.summaryVal.get(),oninput:t=>this.summaryVal.set(t.target.value)},detailsError:{textContent:()=>this.detailsError.get()},save:{textContent:()=>o("trainingSession.save")},detailsForm:{onsubmit:t=>{this.saveDetails(t)}},readSummarySection:{className:()=>this.controls.get().editDetails?"session-detail__section hidden":"session-detail__section"},readSummaryHeading:{textContent:()=>o("trainingSession.section.summary")},readSummary:{textContent:()=>this.session()?.summary??"",className:()=>this.session()?.summary?"session-detail__summary":"session-detail__summary hidden"},readSummaryEmpty:{textContent:()=>o("trainingSession.summary.empty"),className:()=>this.session()?.summary?"session-detail__muted hidden":"session-detail__muted"},sharingSection:{className:()=>this.controls.get().editSharing?"session-detail__section":"session-detail__section hidden"},sharingHeading:{textContent:()=>o("trainingSession.section.sharing")},sharingHint:{textContent:()=>o("trainingSession.sharing.hint"),className:()=>this.teacherCount.get()===0?"session-detail__hint hidden":"session-detail__hint"},sharingNone:{textContent:()=>o("trainingSession.sharing.none"),className:()=>this.teacherCount.get()===0?"session-detail__muted":"session-detail__muted hidden"},shareSingle:{className:()=>this.teacherCount.get()===1?"session-detail__check":"session-detail__check hidden"},shareSingleLabel:{textContent:()=>{const t=this.teachers.items.get()[0];return t?o("trainingSession.sharing.withTeacher",{name:t.displayName}):""}},shareSingleInput:{checked:()=>this.shareVals.get().length>0,onchange:t=>{const s=this.teachers.items.get()[0];s&&this.saveSharing(t.target.checked?[s.id]:[])}},shareMulti:{className:()=>this.teacherCount.get()>1?"session-detail__control":"session-detail__control hidden"},offer:{className:()=>this.pendingOwners.get().length>0?"session-detail__offer":"session-detail__offer hidden"},offerText:{textContent:()=>{const t=this.pendingOwners.get()[0];return t?o("trainingSession.programOffer",{name:t.displayName}):""}},offerAction:{textContent:()=>{const t=this.pendingOwners.get()[0];return t?o("trainingSession.programOffer.action",{name:t.displayName}):""},onclick:()=>{const t=this.pendingOwners.get()[0];t&&this.saveSharing([...new Set([...this.shareVals.get(),t.id])])}},programsSection:{className:()=>"session-detail__section"},programsHeading:{textContent:()=>o("trainingSession.section.programs")},programsHint:{textContent:()=>o("trainingSession.programs.detachHint"),className:()=>this.controls.get().editPrograms?"session-detail__hint":"session-detail__hint hidden"},programsEmpty:{textContent:()=>o("trainingSession.programs.empty"),className:()=>(this.session()?.programs.length??0)===0?"session-detail__muted":"session-detail__muted hidden"},programAdd:{className:()=>this.controls.get().editPrograms?"session-detail__row":"session-detail__row hidden"},attachProgram:{textContent:()=>o("trainingSession.programs.attach"),onclick:()=>{this.attachProgram()}},exercisesHeading:{textContent:()=>o("trainingSession.section.exercises")},exercisesEmpty:{textContent:()=>o("trainingSession.exercises.empty"),className:()=>(this.session()?.exercises.length??0)===0?"session-detail__muted":"session-detail__muted hidden"},exerciseAdd:{className:()=>this.controls.get().editExercises?"session-detail__row":"session-detail__row hidden"},addExercise:{textContent:()=>o("trainingSession.exercise.add"),onclick:()=>{this.addExercise()}}});return this.buildNotFound(this.ref(e,"notFoundHost")),this.buildHeader(this.ref(e,"headerHost")),this.buildPrograms(this.ref(e,"programList")),this.buildExercises(this.ref(e,"exerciseList")),this.spawn(R,this.ref(e,"horseHost"),{value:this.horseVal,options:this.horseOptions}),this.spawn(R,this.ref(e,"planHost"),{value:this.planVal,options:this.planOptions}),this.spawn(R,this.ref(e,"programHost"),{value:this.programVal,options:this.programOptions,placeholder:o("trainingSession.programs.placeholder")}),this.spawn(R,this.ref(e,"exerciseHost"),{value:this.exerciseVal,options:this.exerciseOptions,placeholder:o("trainingSession.exercise.placeholder")}),this.spawn(R,this.ref(e,"shareMulti"),{multiple:!0,values:this.shareVals,options:this.teacherOptions,placeholder:o("trainingSession.sharing.placeholder"),countLabel:t=>q("trainingSession.sharing.count",t)}),this.track(w(()=>{const t=this.programOptions.get(),s=this.programVal.get();s&&!t.some(i=>i.value===s)&&this.programVal.set("")})),this.track(w(()=>{const t=this.exerciseOptions.get(),s=this.exerciseVal.get();s&&!t.some(i=>i.value===s)&&this.exerciseVal.set("")})),this.track(w(()=>{const t=this.session(),s=this.shareVals.get(),i=this.shareSeeded.get(),r=this.teacherCount.get();t&&Rr({seeded:i,teacherCount:r,next:s,stored:t.sharedWithTeacherIds})&&j(()=>{this.commitSharing(s)})})),this.spawn(ne,this.ref(e,"confirmDeleteHost"),{open:this.confirmDelete,title:o("trainingSession.confirm.delete.title"),message:()=>o("trainingSession.confirm.delete.message"),confirmLabel:o("trainingSession.action.delete"),cancelLabel:o("trainingSession.confirm.dismiss"),danger:!0,onconfirm:()=>{this.remove()}}),this.spawn(ne,this.ref(e,"confirmRemoveHost"),{open:this.confirmRemove,title:o("trainingSession.confirm.removeExercise.title"),message:()=>{const t=this.pendingRemoval.get();return t?o("trainingSession.confirm.removeExercise.message",{name:t.name}):""},confirmLabel:o("trainingSession.exercise.remove"),cancelLabel:o("trainingSession.confirm.dismiss"),danger:!0,onconfirm:()=>{this.removeExercise()},oncancel:()=>this.pendingRemoval.set(null)}),ms(this.ref(e,"notesHost"),()=>{const t=this.session();return!t||!this.recipientsResolved.get()?null:{parentKind:"training_session",parentId:t.id,context:()=>this.sessionContext(),recipients:()=>this.noteRecipients(),roleOf:s=>this.roleOf(s.authorId)}},t=>this.track(t)),e}buildHeader(e){this.spawn(xt,e,{eyebrow:()=>o("objectKind.trainingSession"),title:()=>{const t=this.session();return t?je(t):o("trainingSession.title.plain")},chips:()=>this.headerChips(),recipients:()=>this.recipientsResolved.get()?this.audience():[],shared:()=>this.recipientsResolved.get()&&(this.session()?.sharedWithTeacherIds.length??0)>0,meta:()=>{const t=this.session();return t?[ct(t.performedAt),ls(t.durationMin),t.horseName].filter(Boolean).join(" · "):""},overflowActions:()=>this.controls.get().remove?[{label:o("trainingSession.action.delete"),onclick:()=>this.confirmDelete.set(!0)}]:[]})}headerChips(){const e=this.session();if(!e)return[];const t=[];e.planId&&e.planTitle&&t.push({label:Wn(e.planTitle),href:`/planer/${e.planId}`});for(const s of e.programs)t.push({label:Kn(s),href:`/program/${s.id}`});return t}buildNotFound(e){let t=null;this.track(w(()=>{const s=this.resolved.get()&&!this.found.get();t?.destroy(),t=null,e.replaceChildren(),s&&(t=j(()=>{const i=new U({heading:()=>o("trainingSession.notFound.heading"),body:()=>o("trainingSession.notFound.body"),action:{label:()=>o("trainingSession.notFound.action"),onclick:()=>this.router.navigate("/traningspass")},headingLevel:1});return i.mount(e),i}))})),this.track(()=>t?.destroy())}buildPrograms(e){this.track(w(()=>{const t=this.session(),s=this.controls.get();e.replaceChildren();for(const i of t?.programs??[]){const r=document.createElement("li");r.className="session-detail__prog-item";const l=document.createElement("span");if(l.textContent=i.title,r.appendChild(l),s.editPrograms){const c=document.createElement("button");c.type="button",c.className="session-detail__link session-detail__link--danger",c.textContent=o("trainingSession.programs.detach"),c.onclick=()=>{this.detachProgram(i.id,i.title)},r.appendChild(c)}e.appendChild(r)}}))}buildExercises(e){const t=new $i(s=>this.track(s));this.track(w(()=>{const s=this.session(),i=this.openNotes.get(),r=this.controls.get();if(t.reset(),e.replaceChildren(),!!s)for(const l of Pr(s.exercises)){const c=document.createElement("li");c.className="session-detail__ex-item";const h=document.createElement("div");h.className="session-detail__ex-head";const u=document.createElement("span");u.className="session-detail__ex-name",u.textContent=l.name,h.appendChild(u);const p=Vr(l,s.programs);if(p){const I=document.createElement("span");I.className="session-detail__ex-source",I.textContent=p,h.appendChild(I)}c.appendChild(h);const b=jr(l);if(b){const I=document.createElement("p");I.className="session-detail__ex-note",I.textContent=b,c.appendChild(I)}const _=document.createElement("div");_.className="session-detail__ex-actions";const k=document.createElement("button");if(k.type="button",k.className="session-detail__link",k.textContent=i.has(l.id)?o("trainingSession.exercise.notesHide"):o("trainingSession.exercise.notesShow"),k.onclick=()=>this.toggleNotes(l.id),_.appendChild(k),r.editExercises){const I=document.createElement("button");I.type="button",I.className="session-detail__link session-detail__link--danger",I.textContent=o("trainingSession.exercise.remove"),I.onclick=()=>{this.pendingRemoval.set({exerciseId:l.exerciseId,name:l.name}),this.confirmRemove.set(!0)},_.appendChild(I)}if(c.appendChild(_),i.has(l.id)){const I=document.createElement("div");c.appendChild(I),t.mount(I,this.exerciseThread(l.id,l.name))}e.appendChild(c)}}))}toggleNotes(e){const t=new Set(this.openNotes.get());t.has(e)?t.delete(e):t.add(e),this.openNotes.set(t)}async saveDetails(e){e.preventDefault();const t=this.session();if(!t)return;const s=this.durationVal.get().trim();let i=null;if(s!==""){const _=Number(s);if(!Number.isInteger(_)||_<0){this.detailsError.set(o("trainingSessionCreate.error.duration"));return}i=_}this.detailsError.set("");const r={},l=this.whenVal.get();if(l){const _=Fd(l);_!==t.performedAt&&(r.performedAt=_)}i!==t.durationMin&&(r.durationMin=i);const c=this.summaryVal.get().trim(),h=c===""?null:c;h!==t.summary&&(r.summary=h);const u=this.horseVal.get();u!==(t.horseId??"")&&(r.horseId=u===""?null:u);const p=this.planVal.get();if(p!==(t.planId??"")&&(r.planId=p===""?null:p),Object.keys(r).length===0)return;await this.svc.update(t.id,r)&&this.toasts.show({message:o("trainingSession.saved"),variant:"success"})}async saveSharing(e){const t=this.teachers.items.get().length>1;this.shareVals.set(e),t||await this.commitSharing(e)}async commitSharing(e){const t=this.session();if(!t)return;await this.svc.update(t.id,{shareWithTeacherIds:e})?this.toasts.show({message:o("trainingSession.sharing.saved"),variant:"success"}):this.shareVals.set([...t.sharedWithTeacherIds])}async addExercise(){const e=this.session(),t=this.exerciseVal.get();if(!e||!t)return;await this.svc.addExercise(e.id,t)&&this.exerciseVal.set("")}async removeExercise(){const e=this.session(),t=this.pendingRemoval.get();this.pendingRemoval.set(null),!(!e||!t)&&await this.svc.removeExercise(e.id,t.exerciseId)}async attachProgram(){const e=this.session(),t=this.programVal.get();if(!e||!t)return;await this.svc.attachProgram(e.id,t)&&this.programVal.set("")}async detachProgram(e,t){const s=this.session();!s||!await this.svc.detachProgram(s.id,e)||this.toasts.show({message:o("trainingSession.toast.programDetached",{title:t}),action:{label:o("trainingSession.toast.undo"),onclick:()=>{this.svc.attachProgram(s.id,e)}}})}async remove(){const e=this.session();!e||!await this.svc.remove(e.id)||(this.toasts.show({message:o("trainingSession.toast.deleted"),variant:"success"}),this.router.navigate("/traningspass"))}}const Md=T('<div bind="host"></div>');class Bd extends E{router=this.inject(H);key=new y(()=>{const e=this.router.route.get();return e==="/traningspass"?"list":e==="/traningspass/ny"?"create":"detail"});render(){const e=this.wire(Md,{});return this.$swap(this.ref(e,"host"),this.key,{list:Dd,create:zd,detail:Rd}),e}}const qd=T(`
    <form class="pr-create" bind="form">
        <a bind="back" href="/library?flik=program" class="pr-create__back"></a>
        <h1 bind="heading" class="pr-create__title"></h1>

        <div class="pr-create__panel">
            <label class="pr-create__field">
                <span bind="titleLabel" class="pr-create__label"></span>
                <input bind="titleInput" type="text" maxlength="200" class="pr-create__input" required>
                <span bind="titleHint" class="pr-create__hint"></span>
                <span bind="titleError" class="pr-create__field-error" role="alert"></span>
            </label>

            <label class="pr-create__field">
                <span bind="descLabel" class="pr-create__label"></span>
                <textarea bind="descInput" rows="4" maxlength="4000" class="pr-create__textarea"></textarea>
                <span bind="descHint" class="pr-create__hint"></span>
            </label>

            <p bind="snapshot" class="pr-create__note"></p>
            <p bind="error" class="pr-create__error" role="alert"></p>

            <div class="pr-create__actions">
                <button bind="submit" type="submit" class="pr-create__submit"></button>
                <button bind="cancel" type="button" class="pr-create__cancel"></button>
            </div>
        </div>
    </form>
`);class Gd extends E{static styles=`
        .pr-create {
            display: flex;
            flex-direction: column;
            gap: ${d("lg")};
            max-width: 34rem;
            font-family: ${a("font-ui")};

            & .pr-create__back {
                font-size: 0.875rem;
                color: ${a("text-muted")};
                text-decoration: none;
                &:hover { color: ${a("accent-strong")}; text-decoration: underline; }
                &:focus-visible { outline: 2px solid ${a("accent")}; outline-offset: 2px; }
            }

            /* Lora 500 only (UI_DECISIONS §3). */
            & .pr-create__title {
                margin: 0;
                font-family: ${a("font-display")};
                font-weight: 500;
                font-size: 1.75rem;
                line-height: 36px;
                color: ${a("text")};
            }

            /*
             * The fields sit in a panel, not loose on the page. The §4.8 field
             * recipe fills with --bg — the page-paper colour — so a form
             * rendered straight onto the route would give the field the same
             * colour as everything behind it. The panel is what the recessed
             * fill is recessed INTO. §4.8's own example shows the same thing.
             */
            & .pr-create__panel {
                ${Q()}
                box-sizing: border-box;
                padding: ${d("xl")};
                display: flex;
                flex-direction: column;
                gap: ${d("lg")};
            }

            & .pr-create__field { display: flex; flex-direction: column; gap: ${d("xs")}; }
            & .pr-create__label {
                font-size: 0.8125rem;
                font-weight: 600;
                color: ${a("text")};
            }
            & .pr-create__hint {
                font-size: 0.8125rem;
                line-height: 1.5;
                color: ${a("text-muted")};
                max-width: 68ch;
            }
            & .pr-create__field-error {
                font-size: 0.8125rem;
                line-height: 1.5;
                color: ${a("danger")};
            }
            & .pr-create__field-error:empty { display: none; }

            & .pr-create__input, & .pr-create__textarea {
                ${K()}
                width: 100%;
                box-sizing: border-box;
            }
            & .pr-create__textarea { font-family: inherit; line-height: 1.6; resize: vertical; }

            /* The snapshot rule sits on the brass hairline — the one place the
               brass is allowed to carry meaning without carrying text (§05). */
            & .pr-create__note {
                margin: 0;
                padding-left: ${d("md")};
                border-left: 2px solid ${a("brass-line")};
                font-size: 0.8125rem;
                line-height: 1.6;
                color: ${a("text-muted")};
                max-width: 68ch;
            }

            & .pr-create__error {
                margin: 0;
                min-height: 1em;
                font-size: 0.875rem;
                color: ${a("danger")};
            }

            & .pr-create__actions { display: flex; gap: ${d("sm")}; flex-wrap: wrap; }
            /* §4.8: one primary per form. This is it. */
            & .pr-create__submit { ${C(a("radius-sm"),"primary")} }
            /* Avbryt is the ghost tier — not a second bordered button. */
            & .pr-create__cancel { ${C(a("radius-sm"),"ghost")} }

            @media (max-width: 639px) {
                & .pr-create__actions { flex-direction: column; align-items: stretch; }
                & .pr-create__title { font-size: 1.375rem; line-height: 30px; }
            }
        }
    `;router=this.inject(H);svc=this.inject(We);toasts=this.inject(te);titleVal=new m("");descVal=new m("");touched=new m(!1);render(){return this.wire(qd,{back:{onclick:this.router.link("/library?flik=program").onclick,textContent:()=>o("program.back")},heading:{textContent:()=>o("programCreate.heading")},titleLabel:{textContent:()=>o("programCreate.field.title")},titleHint:{textContent:()=>o("programCreate.field.title.hint")},titleInput:{value:()=>this.titleVal.get(),"aria-invalid":()=>String(this.touched.get()&&this.titleVal.get().trim()===""),oninput:e=>this.titleVal.set(e.target.value)},titleError:{textContent:()=>this.touched.get()&&this.titleVal.get().trim()===""?o("program.error.title"):""},descLabel:{textContent:()=>o("programCreate.field.description")},descHint:{textContent:()=>o("programCreate.field.description.hint")},descInput:{value:()=>this.descVal.get(),oninput:e=>this.descVal.set(e.target.value)},snapshot:{textContent:()=>o("program.snapshot")},error:{textContent:()=>this.svc.error.get()?o("program.saveError"):""},submit:{textContent:()=>o("programCreate.submit"),disabled:()=>this.svc.loading.get()},cancel:{textContent:()=>o("programCreate.cancel"),onclick:()=>this.router.navigate("/library?flik=program")},form:{onsubmit:e=>{this.submit(e)}}})}async submit(e){e.preventDefault();const t=this.titleVal.get().trim();if(this.touched.set(!0),!t)return;const s=await this.svc.create({title:t,description:this.descVal.get().trim()});s&&(this.toasts.show({message:o("programCreate.created"),variant:"success"}),this.router.navigate(`/program/${s.id}`))}}function Kd(n){const e=[...n].sort((t,s)=>t.sortOrder-s.sortOrder);return e.map((t,s)=>({id:t.id,name:t.name,notes:t.notes,position:s+1,isFirst:s===0,isLast:s===e.length-1,archived:t.archivedAt!==null}))}function Wd(n,e){const t=new Set(e.map(s=>s.id));return n.filter(s=>!t.has(s.id))}function Ud(n,e){return n.some(t=>t.id===e)}function Yd(n,e,t){const s=[...n].sort((h,u)=>h.sortOrder-u.sortOrder),i=s.findIndex(h=>h.id===e);if(i===-1)return null;const r=i+t;if(r<0||r>=s.length)return null;const l=s.map(h=>h.id),c=l[i];return l[i]=l[r],l[r]=c,l}function Zd(n){return`${n.id}:${n.position}:${n.archived?"a":"l"}:${n.notes??""}`}const Xd=T(`
    <div class="pr-detail">
        <a bind="back" href="/library?flik=program" class="pr-detail__back"></a>

        <p bind="loading" class="pr-detail__loading"></p>
        <div bind="missingHost"></div>

        <div bind="body" class="pr-detail__body">
            <header class="pr-detail__head">
                <p bind="eyebrow" class="pr-detail__eyebrow"></p>
                <h1 bind="title" class="pr-detail__title"></h1>
            </header>

            <form bind="form" class="pr-detail__form">
                <div class="pr-detail__panel">
                    <label class="pr-detail__field">
                        <span bind="titleLabel" class="pr-detail__label"></span>
                        <input bind="titleInput" type="text" maxlength="200" class="pr-detail__input" required>
                        <span bind="titleError" class="pr-detail__field-error" role="alert"></span>
                    </label>

                    <label class="pr-detail__field">
                        <span bind="descLabel" class="pr-detail__label"></span>
                        <textarea bind="descInput" rows="4" maxlength="4000" class="pr-detail__textarea"></textarea>
                    </label>

                    <p bind="error" class="pr-detail__error" role="alert"></p>

                    <div class="pr-detail__actions">
                        <button bind="save" type="submit" class="pr-detail__save"></button>
                    </div>
                </div>
            </form>

            <section class="pr-detail__builder">
                <h2 bind="builderHeading" class="pr-detail__section-title"></h2>
                <p bind="snapshot" class="pr-detail__note"></p>

                <p bind="builderEmpty" class="pr-detail__section-body"></p>
                <ol bind="rows" class="pr-detail__rows"></ol>

                <form bind="addForm" class="pr-detail__add">
                    <label class="pr-detail__field">
                        <span bind="addLabel" class="pr-detail__label"></span>
                        <div class="pr-detail__add-row">
                            <div bind="pickerHost" class="pr-detail__control"></div>
                            <button bind="addBtn" type="submit" class="pr-detail__secondary"></button>
                        </div>
                    </label>
                    <p bind="addNote" class="pr-detail__section-body"></p>
                    <p bind="addError" class="pr-detail__field-error" role="alert"></p>
                </form>
            </section>

            <section class="pr-detail__danger">
                <h2 bind="dangerHeading" class="pr-detail__danger-title"></h2>
                <p bind="dangerBody" class="pr-detail__section-body"></p>
                <button bind="archive" type="button" class="pr-detail__danger-action"></button>
            </section>
        </div>

        <div bind="confirmArchiveHost"></div>
        <div bind="confirmRemoveHost"></div>
    </div>
`);class Qd extends E{static styles=`
        .pr-detail {
            display: flex;
            flex-direction: column;
            gap: ${d("lg")};
            max-width: 44rem;
            font-family: ${a("font-ui")};

            & .pr-detail__back {
                font-size: 0.875rem;
                color: ${a("text-muted")};
                text-decoration: none;
                align-self: flex-start;
                &:hover { color: ${a("accent-strong")}; text-decoration: underline; }
                &:focus-visible { outline: 2px solid ${a("accent")}; outline-offset: 2px; }
            }

            & .pr-detail__loading {
                margin: 0;
                color: ${a("text-muted")};
                font-size: 0.875rem;
            }
            & .pr-detail__loading.hidden { display: none; }

            & .pr-detail__body { display: flex; flex-direction: column; gap: ${d("xl")}; }
            & .pr-detail__body.hidden { display: none; }

            & .pr-detail__eyebrow {
                margin: 0 0 ${d("xs")};
                font-size: 0.6875rem;
                line-height: 16px;
                font-weight: 700;
                letter-spacing: 0.14em;
                text-transform: uppercase;
                color: ${a("text-muted")};
            }

            /* Lora 500, and only 500 — UI_DECISIONS §3. */
            & .pr-detail__title {
                margin: 0;
                font-family: ${a("font-display")};
                font-weight: 500;
                font-size: 1.75rem;
                line-height: 36px;
                color: ${a("text")};
                overflow-wrap: anywhere;
            }
            & .pr-detail__section-title, & .pr-detail__danger-title {
                margin: 0 0 ${d("sm")};
                font-family: ${a("font-display")};
                font-weight: 500;
                font-size: 1.25rem;
                line-height: 28px;
                color: ${a("text")};
            }

            & .pr-detail__section-body {
                margin: 0 0 ${d("md")};
                font-size: 0.8125rem;
                line-height: 1.6;
                color: ${a("text-muted")};
                max-width: 68ch;
            }
            & .pr-detail__section-body.hidden { display: none; }

            /* The snapshot rule sits on the brass hairline — the one place the
               brass carries meaning without carrying text (§05). */
            & .pr-detail__note {
                margin: 0 0 ${d("lg")};
                padding-left: ${d("md")};
                border-left: 2px solid ${a("brass-line")};
                font-size: 0.8125rem;
                line-height: 1.6;
                color: ${a("text-muted")};
                max-width: 68ch;
            }

            & .pr-detail__form, & .pr-detail__add {
                display: flex;
                flex-direction: column;
                gap: ${d("lg")};
            }
            /*
             * The fields sit in a panel, not loose on the page. The §4.8 field
             * recipe fills with --bg — the page-paper colour — so a form
             * rendered straight onto the route would give the field the same
             * colour as everything behind it. The panel is what the recessed
             * fill is recessed INTO. §4.8's own example shows the same thing.
             */
            & .pr-detail__panel {
                ${Q()}
                box-sizing: border-box;
                padding: ${d("xl")};
                display: flex;
                flex-direction: column;
                gap: ${d("lg")};
            }

            & .pr-detail__field { display: flex; flex-direction: column; gap: ${d("xs")}; }
            & .pr-detail__label { font-size: 0.8125rem; font-weight: 600; color: ${a("text")}; }
            & .pr-detail__field-error {
                font-size: 0.8125rem;
                line-height: 1.5;
                color: ${a("danger")};
            }
            & .pr-detail__field-error:empty { display: none; }

            & .pr-detail__input, & .pr-detail__textarea {
                ${K()}
                width: 100%;
                box-sizing: border-box;
            }
            & .pr-detail__textarea { font-family: inherit; line-height: 1.6; resize: vertical; }

            & .pr-detail__error {
                margin: 0;
                min-height: 1em;
                font-size: 0.875rem;
                color: ${a("danger")};
            }

            & .pr-detail__actions { display: flex; gap: ${d("sm")}; flex-wrap: wrap; }
            /* §4.8: one primary per form. Spara is it. */
            & .pr-detail__save { ${C(a("radius-sm"),"primary")} }
            /* Lägg till sits beside the picker — a second action on the page,
               never a second primary. */
            & .pr-detail__secondary {
                ${C()}
                white-space: nowrap;
            }

            & .pr-detail__add-row {
                display: flex;
                gap: ${d("sm")};
                align-items: center;
                flex-wrap: wrap;
                & > div { flex: 1 1 16rem; }
                & .ui-select { display: block; }
            }
            & .pr-detail__add.hidden { display: none; }

            /* Ordered sequence. The number is data, not a marker, so the list
               style is off and the position is a rendered cell — it has to line
               up with tabular figures like every other number in the app. */
            & .pr-detail__rows {
                list-style: none;
                margin: 0 0 ${d("lg")};
                padding: 0;
                border-top: 1px solid ${a("border")};
            }
            & .pr-detail__rows:empty { border-top: none; margin-bottom: 0; }
            & .pr-detail__rows > li { border-bottom: 1px solid ${a("border")}; }

            & .pr-ex {
                display: grid;
                grid-template-columns: 2.25rem minmax(0, 1fr) auto;
                gap: ${d("sm")} ${d("md")};
                align-items: start;
                padding: ${d("md")} ${d("sm")};
            }
            & .pr-ex__order {
                font-variant-numeric: tabular-nums;
                font-size: 0.875rem;
                font-weight: 600;
                color: ${a("text-muted")};
                padding-top: 2px;
            }
            & .pr-ex__body { display: flex; flex-direction: column; gap: ${d("xs")}; min-width: 0; }
            & .pr-ex__name {
                font-size: 0.9375rem;
                font-weight: 600;
                color: ${a("text")};
                overflow-wrap: anywhere;
            }
            & .pr-ex__notes {
                font-size: 0.8125rem;
                line-height: 1.5;
                color: ${a("text-muted")};
                white-space: pre-wrap;
                overflow-wrap: anywhere;
                &.hidden { display: none; }
                &:empty { display: none; }
            }
            & .pr-ex__note-edit {
                display: flex;
                flex-direction: column;
                gap: ${d("xs")};
                margin-top: ${d("xs")};
                &.hidden { display: none; }
            }
            & .pr-ex__note-label {
                font-size: 0.8125rem;
                color: ${a("text-muted")};
            }
            & .pr-ex__note-input {
                ${K()}
                /*
                 * This editor opens in place inside a sequence row drawn on
                 * the page, not inside a form panel, so it keeps a raised
                 * --surface fill. The recessed --bg fill the recipe supplies
                 * is only legible against a card, and wrapping every row in
                 * its own panel would restructure the list to solve a fill.
                 */
                background: ${a("surface")};
                /* input() sets no width, so a textarea falls back to the
                   browser default cols=20. Every other field in this file
                   states both explicitly; so does this one. NOTE: no backticks
                   in here — this comment lives inside a template literal. */
                width: 100%;
                box-sizing: border-box;
                font-size: 0.8125rem;
                resize: vertical;
            }
            & .pr-ex__note-actions {
                display: flex;
                gap: ${d("xs")};
            }
            & .pr-ex__note-error {
                font-size: 0.8125rem;
                color: ${a("danger")};
                &:empty { display: none; }
            }
            & .pr-ex__archived-hint {
                font-size: 0.8125rem;
                line-height: 1.5;
                color: ${a("warning")};
                max-width: 60ch;
            }
            /* An archived row is inert, and reads that way — the same dimming
               §4.3 gives a cancelled row. The remove control keeps full contrast
               so the one thing still worth doing here stays legible. */
            & .pr-ex--archived .pr-ex__name,
            & .pr-ex--archived .pr-ex__notes { opacity: 0.72; }

            & .pr-ex__controls {
                display: flex;
                gap: ${d("xs")};
                align-items: center;
                /* Row controls are secondary, and deliberately smaller than a
                   page-level button: a sequence of ten rows should not read as
                   ten stacked calls to action. */
                & button {
                    ${C()}
                    padding: 4px 10px;
                    font-size: 0.8125rem;
                }
                /* Removing a row is destructive, so it takes the danger tier —
                   an outline that fills only under the pointer. The compact
                   metrics are restated because this selector outranks the
                   element rule above. */
                & .pr-ex__remove {
                    ${C(a("radius-sm"),"danger")}
                    padding: 4px 10px;
                    font-size: 0.8125rem;
                }
            }

            /* §3.6: the destructive action lives in a SEPARATED area. */
            & .pr-detail__danger {
                padding-top: ${d("lg")};
                border-top: 1px solid ${a("border")};
            }
            & .pr-detail__danger-title { color: ${a("danger")}; }
            & .pr-detail__danger-action { ${C(a("radius-sm"),"danger")} }

            @media (max-width: 639px) {
                & .pr-detail__title { font-size: 1.375rem; line-height: 30px; }
                & .pr-ex {
                    grid-template-columns: 2.25rem minmax(0, 1fr);
                }
                & .pr-ex__controls { grid-column: 2; }
                & .pr-detail__add-row { flex-direction: column; align-items: stretch; }
            }
        }
    `;router=this.inject(H);svc=this.inject(We);toasts=this.inject(te);titleVal=new m("");descVal=new m("");touched=new m(!1);resolved=new m(!1);found=new m(!1);pickedId=new m("");addError=new m("");confirmArchive=new m(!1);confirmRemove=new m(!1);pendingRemoval=new m(null);editingNote=new m("");noteDraft=new m("");noteError=new m("");libraryLoaded=new m(!1);libraryFailed=new m(!1);rows=new y(()=>Kd(this.svc.exercises.get()));pickable=new y(()=>Wd(this.svc.availableExercises.get(),this.svc.exercises.get()));pickerOptions=new y(()=>this.pickable.get().map(e=>({value:e.id,label:e.name})));get programId(){return this.router.route.get().split("/")[2]??""}onMount(){this.svc.get(this.programId).then(e=>{e&&(this.titleVal.set(e.title),this.descVal.set(e.description),this.found.set(!0),this.svc.loadExercises(this.programId),this.svc.loadAvailableExercises().then(t=>{this.libraryLoaded.set(t),this.libraryFailed.set(!t)})),this.resolved.set(!0)}),this.track(w(()=>{const e=this.pickerOptions.get(),t=this.pickedId.get();t&&!e.some(s=>s.value===t)&&this.pickedId.set("")}))}render(){const e=this.wire(Xd,{back:{onclick:this.router.link("/library?flik=program").onclick,textContent:()=>o("program.back")},loading:{textContent:()=>o("program.loading"),className:()=>this.resolved.get()?"pr-detail__loading hidden":"pr-detail__loading"},body:{className:()=>this.resolved.get()&&this.found.get()?"pr-detail__body":"pr-detail__body hidden"},eyebrow:{textContent:()=>o("program.eyebrow")},title:{textContent:()=>this.titleVal.get()},titleLabel:{textContent:()=>o("program.field.title")},titleInput:{value:()=>this.titleVal.get(),"aria-invalid":()=>String(this.touched.get()&&this.titleVal.get().trim()===""),oninput:t=>this.titleVal.set(t.target.value)},titleError:{textContent:()=>this.touched.get()&&this.titleVal.get().trim()===""?o("program.error.title"):""},descLabel:{textContent:()=>o("program.field.description")},descInput:{value:()=>this.descVal.get(),oninput:t=>this.descVal.set(t.target.value)},error:{textContent:()=>this.svc.error.get()?o("program.saveError"):""},save:{textContent:()=>o("program.save"),disabled:()=>this.svc.loading.get()},form:{onsubmit:t=>{this.save(t)}},builderHeading:{textContent:()=>o("program.exercises.heading")},snapshot:{textContent:()=>o("program.snapshot")},builderEmpty:{textContent:()=>o("program.exercises.empty"),className:()=>this.rows.get().length===0?"pr-detail__section-body":"pr-detail__section-body hidden"},addLabel:{textContent:()=>o("program.add.label")},addBtn:{textContent:()=>o("program.add.submit"),disabled:()=>this.pickedId.get()===""},addNote:{textContent:()=>this.libraryFailed.get()?o("program.add.error"):this.libraryLoaded.get()?this.svc.availableExercises.get().length===0?o("program.add.none"):this.pickable.get().length===0?o("program.add.exhausted"):"":"",className:()=>"pr-detail__section-body"},addError:{textContent:()=>this.addError.get()},addForm:{onsubmit:t=>{this.add(t)}},dangerHeading:{textContent:()=>o("program.danger.heading")},dangerBody:{textContent:()=>o("program.danger.body")},archive:{textContent:()=>o("program.danger.action"),onclick:()=>this.confirmArchive.set(!0)}});return this.spawn(R,this.ref(e,"pickerHost"),{value:this.pickedId,options:this.pickerOptions,placeholder:o("program.add.placeholder")}),this.buildMissing(this.ref(e,"missingHost")),this.$each(this.ref(e,"rows"),this.rows,(t,s,i)=>this.renderRow(t,i),Zd),this.buildConfirm(this.ref(e,"confirmArchiveHost"),{open:this.confirmArchive,title:o("program.confirm.archive.title"),message:()=>o("program.confirm.archive.message",{title:this.titleVal.get()}),confirmLabel:o("program.danger.action"),onconfirm:()=>{this.archive()}}),this.buildConfirm(this.ref(e,"confirmRemoveHost"),{open:this.confirmRemove,title:o("program.confirm.remove.title"),message:()=>{const t=this.pendingRemoval.get(),s=t?.name??"";return t?t.archived?t.notes?o("program.confirm.removeArchivedNoted.message",{name:s}):o("program.confirm.remove.message",{name:s}):o("program.confirm.removeNoted.message",{name:s}):o("program.confirm.remove.message",{name:s})},confirmLabel:o("program.row.remove"),onconfirm:()=>{const t=this.pendingRemoval.peek();t&&this.remove(t)}}),e}buildConfirm(e,t){this.spawn(ne,e,{open:t.open,title:t.title,message:t.message,confirmLabel:t.confirmLabel,cancelLabel:o("program.confirm.dismiss"),danger:!0,onconfirm:t.onconfirm}),this.track(w(()=>{e.inert=!t.open.get()}))}buildMissing(e){let t=null;this.track(w(()=>{const s=this.resolved.get()&&!this.found.get();t?.destroy(),t=null,e.replaceChildren(),s&&(t=j(()=>{const i=new U({heading:()=>o("program.notFound.heading"),body:()=>o("program.notFound.body"),action:{label:()=>o("program.notFound.action"),onclick:()=>this.router.navigate("/library?flik=program")},headingLevel:2});return i.mount(e),i}))})),this.track(()=>t?.destroy())}renderRow(e,t){const s=document.createElement("li"),i=document.createElement("div");i.className=e.archived?"pr-ex pr-ex--archived":"pr-ex";const r=document.createElement("span");r.className="pr-ex__order",r.textContent=String(e.position),i.appendChild(r);const l=document.createElement("div");l.className="pr-ex__body";const c=document.createElement("span");if(c.className="pr-ex__name",c.textContent=e.name,l.appendChild(c),e.archived){const M=document.createElement("span");l.appendChild(M);const ce=new ie({label:o("program.row.archived"),variant:"dashed",tone:"warning"});ce.mount(M),t(()=>ce.destroy());const W=document.createElement("span");W.className="pr-ex__archived-hint",W.textContent=o("program.row.archived.hint"),l.appendChild(W)}const h=document.createElement("span");h.className="pr-ex__notes",h.textContent=e.notes??"",l.appendChild(h);const u=document.createElement("form");u.className="pr-ex__note-edit hidden";const p=document.createElement("label");p.className="pr-ex__note-label",p.textContent=o("program.row.note.label");const b=document.createElement("textarea");b.className="pr-ex__note-input",b.rows=2,b.maxLength=2e3,b.addEventListener("input",()=>this.noteDraft.set(b.value)),p.htmlFor=b.id||(b.id="pr-ex-note-input"),u.appendChild(p),u.appendChild(b);const _=document.createElement("p");_.className="pr-ex__note-error",_.setAttribute("role","alert"),u.appendChild(_);const k=document.createElement("div");k.className="pr-ex__note-actions";const I=document.createElement("button");I.type="submit",I.textContent=o("program.row.note.save");const N=document.createElement("button");N.type="button",N.textContent=o("program.row.note.cancel"),N.addEventListener("click",()=>this.closeNote()),k.append(I,N),u.appendChild(k),u.addEventListener("submit",M=>{M.preventDefault(),this.saveNote(e)}),l.appendChild(u),t(w(()=>{const M=this.editingNote.get()===e.id;u.className=M?"pr-ex__note-edit":"pr-ex__note-edit hidden",u.inert=!M,h.className=!M&&e.notes?"pr-ex__notes":"pr-ex__notes hidden",_.textContent=M?this.noteError.get():"",M&&b.value!==this.noteDraft.get()&&(b.value=this.noteDraft.get())})),i.appendChild(l);const A=document.createElement("div");A.className="pr-ex__controls",e.archived||(e.isFirst||A.appendChild(this.orderButton("↑",o("program.row.up",{name:e.name}),()=>{this.move(e.id,-1)})),e.isLast||A.appendChild(this.orderButton("↓",o("program.row.down",{name:e.name}),()=>{this.move(e.id,1)})));const S=document.createElement("button");S.type="button",S.className="pr-ex__note-btn",S.textContent=e.notes?o("program.row.note.edit"):o("program.row.note.add"),S.setAttribute("aria-label",e.notes?o("program.row.note.editNamed",{name:e.name}):o("program.row.note.addNamed",{name:e.name})),S.addEventListener("click",()=>this.openNote(e)),A.appendChild(S);const O=document.createElement("button");return O.type="button",O.className="pr-ex__remove",O.textContent=o("program.row.remove"),O.setAttribute("aria-label",o("program.row.removeNamed",{name:e.name})),O.addEventListener("click",()=>{if(e.archived||e.notes){this.pendingRemoval.set(e),this.confirmRemove.set(!0);return}this.remove(e)}),A.appendChild(O),i.appendChild(A),s.appendChild(i),s}orderButton(e,t,s){const i=document.createElement("button");return i.type="button",i.textContent=e,i.setAttribute("aria-label",t),i.title=t,i.addEventListener("click",s),i}async save(e){e.preventDefault();const t=this.titleVal.get().trim();this.touched.set(!0),!(!t||!await this.svc.update(this.programId,{title:t,description:this.descVal.get().trim()}))&&this.toasts.show({message:o("program.saved"),variant:"success"})}async add(e){e.preventDefault();const t=this.pickedId.get();if(!t)return;if(Ud(this.svc.exercises.peek(),t)){const i=this.svc.availableExercises.peek().find(r=>r.id===t)?.name??"";this.addError.set(o("program.add.duplicate",{name:i}));return}if(this.addError.set(""),!await this.svc.addExerciseToProgram(this.programId,t)){this.addError.set(o("program.add.failed"));return}this.pickedId.set("")}openNote(e){this.noteError.set(""),this.noteDraft.set(e.notes??""),this.editingNote.set(e.id)}closeNote(){this.editingNote.set(""),this.noteDraft.set(""),this.noteError.set("")}async saveNote(e){const t=this.noteDraft.peek().trim();if(t===(e.notes??"")){this.closeNote();return}if(this.noteError.set(""),this.editingNote.set(""),!await this.svc.updateExerciseNotes(this.programId,e.id,t===""?null:t)){this.noteDraft.set(t),this.editingNote.set(e.id),this.noteError.set(o("program.row.note.failed"));return}this.closeNote(),this.toasts.show({message:o("program.row.note.saved"),variant:"success"})}async move(e,t){const s=Yd(this.svc.exercises.peek(),e,t);if(!s)return;await this.svc.reorderExercises(this.programId,s)||this.toasts.show({message:o("program.reorderError"),variant:"error"})}async remove(e){this.pendingRemoval.set(null),await this.svc.removeExercise(this.programId,e.id)}async archive(){await this.svc.archive(this.programId)&&(this.toasts.show({message:o("program.archived"),variant:"success"}),this.router.navigate("/library?flik=program"))}}const Jd=T('<div bind="host"></div>'),Ci=T("<div></div>");class ec extends E{router=this.inject(H);onMount(){this.router.navigate(Vl,{replace:!0})}render(){return this.wire(Ci,{})}}class tc extends E{render(){return this.wire(Ci,{})}}class sc extends E{router=this.inject(H);key=new y(()=>{const e=this.router.route.get();return e==="/program"?"forward":e==="/program/nytt"?"create":e.startsWith("/program/")?"detail":"none"});render(){const e=this.wire(Jd,{});return this.$swap(this.ref(e,"host"),this.key,{forward:ec,create:Gd,detail:Qd,none:tc}),e}}const nc=T(`
    <div class="plans">
        <header class="plans__head">
            <h1 bind="heading" class="plans__title"></h1>
            <button bind="create" type="button" class="plans__create"></button>
        </header>

        <p bind="loading" class="plans__loading"></p>

        <div bind="errorBox" class="plans__error" role="alert">
            <p bind="errorText" class="plans__error-text"></p>
            <button bind="retry" type="button" class="plans__retry"></button>
        </div>

        <div bind="emptyHost"></div>

        <section bind="activeSection" class="plans__group">
            <h2 bind="activeLabel" class="plans__group-label"></h2>
            <ul bind="activeList" class="plans__list"></ul>
        </section>

        <section bind="archivedSection" class="plans__group plans__group--archived">
            <button bind="archivedToggle" type="button" class="plans__disclosure" aria-expanded="false"></button>
            <ul bind="archivedList" class="plans__list"></ul>
        </section>
    </div>
`);class ic extends E{static styles=`
        .plans {
            & .plans__head {
                display: flex;
                align-items: baseline;
                justify-content: space-between;
                gap: ${d("lg")};
                flex-wrap: wrap;
                margin-bottom: ${d("xl")};
            }

            /* Lora 500, and only 500 — UI_DECISIONS §3. */
            & .plans__title {
                margin: 0;
                font-family: ${a("font-display")};
                font-weight: 500;
                font-size: 1.75rem;
                line-height: 36px;
                color: ${a("text")};
            }

            /*
             * Buttons are Open Sans territory; the serif is forbidden here.
             * This is the view's one primary — the only thing a reader who
             * arrived with nothing to read can do.
             */
            & .plans__create { ${C(a("radius-sm"),"primary")} }

            & .plans__loading {
                margin: 0;
                color: ${a("text-muted")};
                font-size: 0.875rem;
            }
            & .plans__loading.hidden { display: none; }

            & .plans__error {
                display: flex;
                align-items: center;
                gap: ${d("md")};
                flex-wrap: wrap;
                padding: ${d("md")};
                margin-bottom: ${d("lg")};
                border: 1px solid ${a("danger")};
                border-radius: ${a("radius-md")};
                background: ${a("danger-soft")};

                & .plans__error-text { margin: 0; font-size: 0.875rem; color: ${a("text")}; }
                /* Retry is secondary: recovering from a failure is not the
                   thing this page is for. */
                & .plans__retry { ${C()} }
            }
            & .plans__error.hidden { display: none; }

            & .plans__group { margin-bottom: ${d("xl")}; }
            & .plans__group.hidden { display: none; }

            /* Uppercase group label — letterspaced, never the serif (§4.3). */
            & .plans__group-label {
                margin: 0 0 ${d("md")};
                font-family: ${a("font-ui")};
                font-size: 0.6875rem;
                line-height: 16px;
                font-weight: 700;
                letter-spacing: 0.14em;
                text-transform: uppercase;
                color: ${a("text-muted")};
            }

            /* The archive disclosure carries the group label's own typography —
               it IS the group label, and pressing it is what the label offers. */
            & .plans__disclosure {
                display: inline-flex;
                align-items: center;
                gap: ${d("sm")};
                margin: 0 0 ${d("md")};
                padding: ${d("xs")} 0;
                background: transparent;
                border: none;
                cursor: pointer;
                font-family: ${a("font-ui")};
                font-size: 0.6875rem;
                line-height: 16px;
                font-weight: 700;
                letter-spacing: 0.14em;
                text-transform: uppercase;
                color: ${a("text-muted")};
                &:hover { color: ${a("accent-strong")}; }
                &:focus-visible { outline: 2px solid ${a("accent")}; outline-offset: 2px; }
            }

            & .plans__list {
                list-style: none;
                margin: 0;
                padding: 0;
                /* No zebra striping (§4.3): rows are separated by a hairline. */
                border-top: 1px solid ${a("border")};
            }
            & .plans__list:empty { border-top: none; }
            & .plans__list.hidden { display: none; }
            & .plans__list > li { border-bottom: 1px solid ${a("border")}; }

            & .plan-row {
                display: grid;
                grid-template-columns: minmax(0, 1fr) auto;
                align-items: start;
                gap: ${d("lg")};
                padding: ${d("md")} ${d("sm")};
                text-decoration: none;
                color: inherit;
                font-family: ${a("font-ui")};

                &:hover { background: ${a("surface-2")}; }
                &:focus-visible { outline: 2px solid ${a("accent")}; outline-offset: -2px; }
            }
            /* Archived rows are dimmed, as §4.3 dims a cancelled row — the
               status pill still carries the meaning without colour. */
            & .plan-row--archived { opacity: 0.72; }

            & .plan-row__body {
                display: flex;
                flex-direction: column;
                gap: ${d("xs")};
                min-width: 0;
            }
            & .plan-row__title {
                font-size: 0.9375rem;
                font-weight: 600;
                color: ${a("text")};
                overflow-wrap: anywhere;
            }
            /* One meta line, not four — §4.3 allows at most two rows of text. */
            & .plan-row__meta {
                display: flex;
                align-items: baseline;
                flex-wrap: wrap;
                gap: ${d("xs")} ${d("sm")};
                font-size: 0.8125rem;
                color: ${a("text-muted")};
            }
            & .plan-row__excerpt {
                font-size: 0.8125rem;
                line-height: 1.5;
                color: ${a("text-muted")};
                overflow-wrap: anywhere;
            }

            & .plan-row__chips {
                display: flex;
                flex-wrap: wrap;
                gap: ${d("xs")};
                justify-content: flex-end;
                align-items: flex-start;
                max-width: 18rem;
            }

            /* UI_DECISIONS §6: single column below 640px. */
            @media (max-width: 639px) {
                & .plan-row {
                    grid-template-columns: minmax(0, 1fr);
                    gap: ${d("sm")};
                }
                & .plan-row__chips { justify-content: flex-start; max-width: none; }
                & .plans__title { font-size: 1.375rem; line-height: 30px; }
            }
        }
    `;router=this.inject(H);plans=this.inject($e);showArchived=new m(!1);grouped=new y(()=>hr(this.plans.items.get()));active=new y(()=>this.grouped.get().active);archived=new y(()=>this.grouped.get().archived);isEmpty=new y(()=>this.plans.items.get().length===0&&!this.plans.loading.get()&&this.plans.error.get()===null);onMount(){this.plans.load()}render(){const e=this.wire(nc,{heading:{textContent:()=>o("plans.heading")},create:{textContent:()=>o("plans.create"),onclick:()=>this.router.navigate("/planer/ny")},loading:{textContent:()=>o("plans.loading"),className:()=>this.plans.loading.get()&&this.plans.items.get().length===0&&this.plans.error.get()===null?"plans__loading":"plans__loading hidden"},errorBox:{className:()=>this.plans.error.get()?"plans__error":"plans__error hidden"},errorText:{textContent:()=>o("plans.error")},retry:{textContent:()=>o("plans.retry"),onclick:()=>{this.plans.load()}},activeSection:{className:()=>this.active.get().length===0?"plans__group hidden":"plans__group"},activeLabel:{textContent:()=>o("plans.group.active")},archivedSection:{className:()=>this.archived.get().length===0?"plans__group plans__group--archived hidden":"plans__group plans__group--archived"},archivedToggle:{textContent:()=>this.showArchived.get()?o("plans.archived.hide"):q("plans.archived.show",this.archived.get().length),"aria-expanded":()=>String(this.showArchived.get()),onclick:()=>this.showArchived.set(!this.showArchived.peek())},archivedList:{className:()=>this.showArchived.get()?"plans__list":"plans__list hidden"}});return this.buildEmpty(this.ref(e,"emptyHost")),this.$each(this.ref(e,"activeList"),this.active,(t,s,i)=>this.renderRow(t,i),Us),this.$each(this.ref(e,"archivedList"),this.archived,(t,s,i)=>this.renderRow(t,i),Us),e}buildEmpty(e){let t=null;this.track(w(()=>{const s=this.isEmpty.get();t?.destroy(),t=null,e.replaceChildren(),s&&(t=j(()=>{const i=new U({heading:()=>o("plans.empty.heading"),body:()=>o("plans.empty.body"),action:{label:()=>o("plans.empty.action"),onclick:()=>this.router.navigate("/planer/ny")},headingLevel:2});return i.mount(e),i}))})),this.track(()=>t?.destroy())}renderRow(e,t){const s=document.createElement("li"),i=`/planer/${e.id}`,r=document.createElement("a");r.className=e.status==="archived"?"plan-row plan-row--archived":"plan-row",r.href=i,r.addEventListener("click",A=>{A.preventDefault(),this.router.navigate(i)});const l=document.createElement("span");l.className="plan-row__body";const c=document.createElement("span");c.className="plan-row__title",c.textContent=e.title,l.appendChild(c);const h=document.createElement("span");h.className="plan-row__meta";const u=Ge(e.startDate,e.endDate);u&&h.appendChild(gn(u));const p=bt(e.primaryTeacherDisplayName);p&&h.appendChild(gn(p)),h.childElementCount>0&&l.appendChild(h);const b=as(e.description);if(b){const A=document.createElement("span");A.className="plan-row__excerpt",A.textContent=b,l.appendChild(A)}const _=document.createElement("span");_.className="plan-row__chips";const k=is(e.status),I=document.createElement("span");_.appendChild(I);const N=new ie({label:k.label,variant:k.variant,tone:k.tone,...k.glyph===void 0?{}:{glyph:k.glyph}});return N.mount(I),t(()=>N.destroy()),r.append(l,_),s.appendChild(r),s}}function gn(n){const e=document.createElement("span");return e.textContent=n,e}const ac=T(`
    <form class="new-plan" bind="form">
        <a bind="back" href="/planer" class="new-plan__back"></a>
        <h1 bind="heading" class="new-plan__title"></h1>

        <div class="new-plan__panel">
            <label class="new-plan__field">
                <span bind="titleLabel" class="new-plan__label"></span>
                <input bind="titleInput" type="text" maxlength="200" class="new-plan__input" required>
                <span bind="titleError" class="new-plan__field-error" role="alert"></span>
            </label>

            <label class="new-plan__field">
                <span bind="descLabel" class="new-plan__label"></span>
                <textarea bind="descInput" rows="4" maxlength="5000" class="new-plan__textarea"></textarea>
                <span bind="descHint" class="new-plan__hint"></span>
            </label>

            <div class="new-plan__pair">
                <label class="new-plan__field">
                    <span bind="startLabel" class="new-plan__label"></span>
                    <input bind="startInput" type="date" class="new-plan__input">
                </label>
                <label class="new-plan__field">
                    <span bind="endLabel" class="new-plan__label"></span>
                    <input bind="endInput" type="date" class="new-plan__input">
                    <span bind="endError" class="new-plan__field-error" role="alert"></span>
                </label>
            </div>

            <p bind="rangePreview" class="new-plan__hint"></p>

            <label bind="teacherField" class="new-plan__field">
                <span bind="teacherLabel" class="new-plan__label"></span>
                <div bind="teacherHost" class="new-plan__control"></div>
                <span bind="teacherHint" class="new-plan__hint"></span>
            </label>

            <p bind="error" class="new-plan__error" role="alert"></p>

            <div class="new-plan__actions">
                <button bind="submit" type="submit" class="new-plan__submit"></button>
                <button bind="cancel" type="button" class="new-plan__cancel"></button>
            </div>
        </div>
    </form>
`);class rc extends E{static styles=`
        .new-plan {
            display: flex;
            flex-direction: column;
            gap: ${d("lg")};
            max-width: 34rem;
            font-family: ${a("font-ui")};

            & .new-plan__back {
                font-size: 0.875rem;
                color: ${a("text-muted")};
                text-decoration: none;
                &:hover { color: ${a("accent-strong")}; text-decoration: underline; }
                &:focus-visible { outline: 2px solid ${a("accent")}; outline-offset: 2px; }
            }

            /* Lora 500 only (UI_DECISIONS §3). */
            & .new-plan__title {
                margin: 0;
                font-family: ${a("font-display")};
                font-weight: 500;
                font-size: 1.75rem;
                line-height: 36px;
                color: ${a("text")};
            }

            /*
             * The fields sit in a panel, not loose on the page. The §4.8 field
             * recipe fills with --bg — the page-paper colour — so a form
             * rendered straight onto the route would give the field the same
             * colour as everything behind it. The panel is what the recessed
             * fill is recessed INTO. §4.8's own example shows the same thing.
             */
            & .new-plan__panel {
                ${Q()}
                box-sizing: border-box;
                padding: ${d("xl")};
                display: flex;
                flex-direction: column;
                gap: ${d("lg")};
            }

            & .new-plan__field {
                display: flex;
                flex-direction: column;
                gap: ${d("xs")};
            }
            & .new-plan__field.hidden { display: none; }

            & .new-plan__pair {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: ${d("md")};
            }

            & .new-plan__label {
                font-size: 0.8125rem;
                font-weight: 600;
                color: ${a("text")};
            }

            & .new-plan__hint {
                margin: 0;
                font-size: 0.8125rem;
                line-height: 1.5;
                color: ${a("text-muted")};
                max-width: 68ch;
            }
            & .new-plan__hint:empty { display: none; }

            /* Field-level error: sits under its own input, names the fix. */
            & .new-plan__field-error {
                font-size: 0.8125rem;
                line-height: 1.5;
                color: ${a("danger")};
            }
            & .new-plan__field-error:empty { display: none; }

            & .new-plan__input, & .new-plan__textarea {
                ${K()}
                width: 100%;
                box-sizing: border-box;
            }
            & .new-plan__textarea {
                font-family: inherit;
                line-height: 1.6;
                resize: vertical;
            }

            & .new-plan__control .ui-select { display: block; }

            & .new-plan__error {
                margin: 0;
                min-height: 1em;
                font-size: 0.875rem;
                color: ${a("danger")};
            }

            & .new-plan__actions {
                display: flex;
                gap: ${d("sm")};
                flex-wrap: wrap;
            }
            /* §4.8: one primary per form. This is it. */
            & .new-plan__submit { ${C(a("radius-sm"),"primary")} }
            /* Avbryt is the ghost tier — not a second bordered button. */
            & .new-plan__cancel { ${C(a("radius-sm"),"ghost")} }

            /* UI_DECISIONS §6: paired field rows collapse below 640px. */
            @media (max-width: 639px) {
                & .new-plan__pair { grid-template-columns: 1fr; }
                & .new-plan__actions { flex-direction: column; align-items: stretch; }
                & .new-plan__title { font-size: 1.375rem; line-height: 30px; }
            }
        }
    `;router=this.inject(H);plans=this.inject($e);teachers=this.inject(fe);toasts=this.inject(te);titleVal=new m("");descVal=new m("");startVal=new m("");endVal=new m("");primaryVal=new m("");titleTouched=new m(!1);teacherOptions=new y(()=>[{value:"",label:o("plan.primaryTeacher.none")},...this.teachers.items.get().map(e=>({value:e.id,label:e.displayName}))]);rangeInvalid=new y(()=>!jn(this.startVal.get()||null,this.endVal.get()||null));onMount(){this.teachers.load()}render(){const e=this.wire(ac,{back:{onclick:this.router.link("/planer").onclick,textContent:()=>o("plan.back")},heading:{textContent:()=>o("planCreate.heading")},titleLabel:{textContent:()=>o("planCreate.field.title")},titleInput:{value:()=>this.titleVal.get(),"aria-invalid":()=>String(this.titleTouched.get()&&this.titleVal.get().trim()===""),oninput:t=>this.titleVal.set(t.target.value)},titleError:{textContent:()=>this.titleTouched.get()&&this.titleVal.get().trim()===""?o("plan.error.title"):""},descLabel:{textContent:()=>o("planCreate.field.description")},descHint:{textContent:()=>o("planCreate.field.description.hint")},descInput:{value:()=>this.descVal.get(),oninput:t=>this.descVal.set(t.target.value)},startLabel:{textContent:()=>o("planCreate.field.start")},startInput:{value:()=>this.startVal.get(),oninput:t=>this.startVal.set(t.target.value)},endLabel:{textContent:()=>o("planCreate.field.end")},endInput:{value:()=>this.endVal.get(),"aria-invalid":()=>String(this.rangeInvalid.get()),oninput:t=>this.endVal.set(t.target.value)},endError:{textContent:()=>this.rangeInvalid.get()?o("plan.error.range",{start:this.startVal.get()}):""},rangePreview:{textContent:()=>this.rangeInvalid.get()?"":Ge(this.startVal.get()||null,this.endVal.get()||null)??""},teacherField:{className:()=>this.teachers.items.get().length===0?"new-plan__field hidden":"new-plan__field"},teacherLabel:{textContent:()=>o("planCreate.field.primaryTeacher")},teacherHint:{textContent:()=>o("plan.primaryTeacher.hint")},error:{textContent:()=>this.plans.error.get()?o("plan.saveError"):""},submit:{textContent:()=>o("planCreate.submit"),disabled:()=>this.plans.loading.get()||this.rangeInvalid.get()},cancel:{textContent:()=>o("planCreate.cancel"),onclick:()=>this.router.navigate("/planer")},form:{onsubmit:t=>{this.submit(t)}}});return this.spawn(R,this.ref(e,"teacherHost"),{value:this.primaryVal,options:this.teacherOptions}),e}async submit(e){e.preventDefault();const t=this.titleVal.get().trim();if(this.titleTouched.set(!0),!t||this.rangeInvalid.get())return;const s=this.descVal.get().trim(),i=this.startVal.get(),r=this.endVal.get(),l=this.primaryVal.get(),c=await this.plans.create({title:t,...s?{description:s}:{},...i?{startDate:i}:{},...r?{endDate:r}:{},...l?{primaryTeacherId:l}:{}});c&&(this.toasts.show({message:o("planCreate.created"),variant:"success"}),this.router.navigate(`/planer/${c.id}`))}}class wt{items=new m([]);loading=new m(!1);error=new m(null);async load(){const e=await $(this.loading,this.error,()=>v.goals.list());e&&this.items.set(e)}async loadDetail(e){return await $(this.loading,this.error,()=>v.goals.get({id:e}))??null}async loadShares(e){return await $(this.loading,this.error,()=>v.goals.listShares({id:e}))??null}async create(e){const t=await $(this.loading,this.error,()=>v.goals.create(e));return t?(this.items.set([t,...this.items.get()]),t):null}async update(e,t){const s=await $(this.loading,this.error,()=>v.goals.update({id:e,...t}));return s?(this.merge(s),s):null}async achieve(e){return await $(this.loading,this.error,()=>v.goals.achieve({id:e}))!==void 0}async reopen(e){return await $(this.loading,this.error,()=>v.goals.reopen({id:e}))!==void 0}async abandon(e){return await $(this.loading,this.error,()=>v.goals.abandon({id:e}))!==void 0}async share(e,t){return await $(this.loading,this.error,()=>v.goals.share({id:e,teacherId:t}))?(this.items.set(this.items.get().map(i=>i.id!==e||i.sharedTeacherIds.includes(t)?i:{...i,sharedTeacherIds:[...i.sharedTeacherIds,t]})),!0):!1}async unshare(e,t){return await $(this.loading,this.error,()=>v.goals.unshare({id:e,teacherId:t}))?(this.items.set(this.items.get().map(i=>i.id!==e?i:{...i,sharedTeacherIds:i.sharedTeacherIds.filter(r=>r!==t)})),!0):!1}async attachPlan(e,t){return await $(this.loading,this.error,()=>v.goals.attachPlan({id:e,planId:t}))?(this.items.set(this.items.get().map(i=>i.id!==e||i.planIds.includes(t)?i:{...i,planIds:[...i.planIds,t]})),!0):!1}async detachPlan(e,t){return await $(this.loading,this.error,()=>v.goals.detachPlan({id:e,planId:t}))?(this.items.set(this.items.get().map(i=>i.id!==e?i:{...i,planIds:i.planIds.filter(r=>r!==t)})),!0):!1}get(e){return this.items.get().find(t=>t.id===e)??null}merge(e){const t=this.items.get(),s=t.findIndex(i=>i.id===e.id);this.items.set(s===-1?[e,...t]:[...t.slice(0,s),e,...t.slice(s+1)])}}const oc=T(`
    <div class="plan-detail" bind="root">
        <a bind="back" href="/planer" class="plan-detail__back"></a>
        <p bind="loading" class="plan-detail__loading"></p>
        <div bind="notFoundHost"></div>

        <div bind="body" class="plan-detail__body">
            <div bind="headerHost"></div>

            <section bind="readSection" class="plan-detail__section">
                <h2 bind="descHeading" class="plan-detail__heading"></h2>
                <p bind="descRead" class="plan-detail__prose"></p>
                <p bind="descEmpty" class="plan-detail__muted"></p>
            </section>

            <section bind="editSection" class="plan-detail__section">
                <h2 bind="editHeading" class="plan-detail__heading"></h2>
                <form bind="editForm" class="plan-detail__form">
                    <div class="plan-detail__panel">
                        <label class="plan-detail__field">
                            <span bind="titleLabel" class="plan-detail__label"></span>
                            <input bind="titleInput" type="text" maxlength="200" class="plan-detail__input" required>
                            <span bind="titleError" class="plan-detail__field-error" role="alert"></span>
                        </label>
                        <label class="plan-detail__field">
                            <span bind="descLabel" class="plan-detail__label"></span>
                            <textarea bind="descInput" rows="4" maxlength="5000" class="plan-detail__textarea"></textarea>
                        </label>
                        <div class="plan-detail__pair">
                            <label class="plan-detail__field">
                                <span bind="startLabel" class="plan-detail__label"></span>
                                <input bind="startInput" type="date" class="plan-detail__input">
                            </label>
                            <label class="plan-detail__field">
                                <span bind="endLabel" class="plan-detail__label"></span>
                                <input bind="endInput" type="date" class="plan-detail__input">
                                <span bind="endError" class="plan-detail__field-error" role="alert"></span>
                            </label>
                        </div>
                        <label bind="teacherField" class="plan-detail__field">
                            <span bind="teacherLabel" class="plan-detail__label"></span>
                            <div bind="teacherHost" class="plan-detail__control"></div>
                            <span bind="teacherHint" class="plan-detail__hint"></span>
                        </label>
                        <div class="plan-detail__row">
                            <button bind="save" type="submit" class="plan-detail__save"></button>
                            <span bind="saveError" class="plan-detail__field-error" role="alert"></span>
                        </div>
                    </div>
                </form>
            </section>

            <section class="plan-detail__section">
                <h2 bind="goalsHeading" class="plan-detail__heading"></h2>
                <ul bind="goalsList" class="plan-detail__list"></ul>
                <p bind="goalsEmpty" class="plan-detail__muted"></p>
                <div bind="goalsAttach" class="plan-detail__row">
                    <div bind="goalHost" class="plan-detail__control plan-detail__control--grow"></div>
                    <button bind="attachGoal" type="button" class="plan-detail__secondary"></button>
                </div>
                <p bind="goalsNone" class="plan-detail__hint"></p>
            </section>

            <section class="plan-detail__section">
                <h2 bind="lessonsHeading" class="plan-detail__heading"></h2>
                <div bind="upcomingGroup" class="plan-detail__group">
                    <h3 bind="upcomingLabel" class="plan-detail__group-label"></h3>
                    <ul bind="upcomingList" class="plan-detail__list"></ul>
                </div>
                <div bind="pastGroup" class="plan-detail__group">
                    <h3 bind="pastLabel" class="plan-detail__group-label"></h3>
                    <ul bind="pastList" class="plan-detail__list"></ul>
                </div>
                <p bind="lessonsEmpty" class="plan-detail__muted"></p>
            </section>

            <section class="plan-detail__section">
                <h2 bind="sessionsHeading" class="plan-detail__heading"></h2>
                <ul bind="sessionsList" class="plan-detail__list"></ul>
                <p bind="sessionsEmpty" class="plan-detail__muted"></p>
            </section>

            <section bind="archivedSection" class="plan-detail__archived">
                <p bind="archivedNotice" class="plan-detail__archived-text"></p>
            </section>
        </div>

        <div bind="confirmArchiveHost" class="plan-detail__dialog"></div>
    </div>
`);class lc extends E{static styles=`
        .plan-detail {
            display: flex;
            flex-direction: column;
            gap: ${d("lg")};
            font-family: ${a("font-ui")};

            & .plan-detail__back {
                font-size: 0.875rem;
                color: ${a("text-muted")};
                text-decoration: none;
                &:hover { color: ${a("accent-strong")}; text-decoration: underline; }
                &:focus-visible { outline: 2px solid ${a("accent")}; outline-offset: 2px; }
            }

            & .plan-detail__loading {
                margin: 0;
                color: ${a("text-muted")};
                font-size: 0.875rem;
            }
            & .plan-detail__loading.hidden { display: none; }

            & .plan-detail__body {
                display: flex;
                flex-direction: column;
                gap: ${d("xl")};
            }
            & .plan-detail__body.hidden { display: none; }

            & .plan-detail__section {
                display: flex;
                flex-direction: column;
                gap: ${d("md")};
            }
            & .plan-detail__section.hidden { display: none; }

            /* A section heading is one of the places the serif is allowed —
               Lora, weight 500, and only 500 (UI_DECISIONS §3). */
            & .plan-detail__heading {
                margin: 0;
                font-family: ${a("font-display")};
                font-weight: 500;
                font-size: 1.25rem;
                line-height: 1.4;
                color: ${a("text")};
            }

            & .plan-detail__group { display: flex; flex-direction: column; gap: ${d("sm")}; }
            & .plan-detail__group.hidden { display: none; }

            /* Uppercase group label — letterspaced, never the serif (§4.3). */
            & .plan-detail__group-label {
                margin: 0;
                font-family: ${a("font-ui")};
                font-size: 0.6875rem;
                line-height: 16px;
                font-weight: 700;
                letter-spacing: 0.14em;
                text-transform: uppercase;
                color: ${a("text-muted")};
            }

            & .plan-detail__prose {
                margin: 0;
                max-width: 68ch;
                font-size: 0.9375rem;
                line-height: 1.6;
                color: ${a("text")};
                white-space: pre-wrap;
            }
            & .plan-detail__prose.hidden { display: none; }

            & .plan-detail__muted {
                margin: 0;
                font-size: 0.875rem;
                color: ${a("text-muted")};
            }
            & .plan-detail__muted.hidden { display: none; }

            & .plan-detail__hint {
                margin: 0;
                font-size: 0.8125rem;
                line-height: 1.5;
                color: ${a("text-muted")};
                max-width: 68ch;
            }
            & .plan-detail__hint.hidden { display: none; }

            & .plan-detail__list {
                list-style: none;
                margin: 0;
                padding: 0;
                /* No zebra striping (§4.3): a hairline separates rows. */
                border-top: 1px solid ${a("border")};
            }
            & .plan-detail__list:empty { border-top: none; }
            & .plan-detail__list > li { border-bottom: 1px solid ${a("border")}; }

            & .plan-detail__item {
                display: grid;
                grid-template-columns: auto minmax(0, 1fr) auto;
                align-items: start;
                gap: ${d("lg")};
                padding: ${d("sm")} ${d("sm")};
                font-family: ${a("font-ui")};
            }
            & .plan-detail__item--flat { grid-template-columns: minmax(0, 1fr) auto; }

            & .plan-detail__link {
                display: contents;
                color: inherit;
                text-decoration: none;
            }
            & .plan-detail__item:hover { background: ${a("surface-2")}; }
            & .plan-detail__item:focus-within { outline: 2px solid ${a("accent")}; outline-offset: -2px; }

            & .plan-detail__date {
                display: flex;
                flex-direction: column;
                align-items: center;
                width: 3.5rem;
                /* Tabular numerals so the blocks line up column-wise (§4.3). */
                font-variant-numeric: tabular-nums;
            }
            & .plan-detail__day { font-size: 1.125rem; font-weight: 700; line-height: 1.2; color: ${a("text")}; }
            & .plan-detail__month {
                font-size: 0.6875rem;
                font-weight: 700;
                letter-spacing: 0.12em;
                color: ${a("text-muted")};
            }
            & .plan-detail__time { margin-top: 2px; font-size: 0.8125rem; color: ${a("text-muted")}; }

            & .plan-detail__item-body {
                display: flex;
                flex-direction: column;
                gap: ${d("xs")};
                min-width: 0;
            }
            & .plan-detail__item-title {
                font-size: 0.9375rem;
                font-weight: 600;
                color: ${a("text")};
                overflow-wrap: anywhere;
            }
            & .plan-detail__item-meta {
                font-size: 0.8125rem;
                color: ${a("text-muted")};
                overflow-wrap: anywhere;
            }
            & .plan-detail__item-trail {
                display: flex;
                align-items: center;
                gap: ${d("sm")};
                flex-wrap: wrap;
                justify-content: flex-end;
            }

            & .plan-detail__detach {
                background: none;
                border: none;
                padding: 0;
                cursor: pointer;
                font-family: inherit;
                font-size: 0.8125rem;
                color: ${a("danger")};
                text-decoration: underline;
                &:focus-visible { outline: 2px solid ${a("accent")}; outline-offset: 2px; }
            }

            & .plan-detail__form {
                display: flex;
                flex-direction: column;
                gap: ${d("md")};
                max-width: 34rem;
            }
            /*
             * The fields sit in a panel, not loose on the page. The §4.8 field
             * recipe fills with --bg — the page-paper colour — so a form
             * rendered straight onto the route would give the field the same
             * colour as everything behind it. The panel is what the recessed
             * fill is recessed INTO. §4.8's own example shows the same thing.
             */
            & .plan-detail__panel {
                ${Q()}
                box-sizing: border-box;
                padding: ${d("xl")};
                display: flex;
                flex-direction: column;
                gap: ${d("lg")};
            }

            & .plan-detail__field { display: flex; flex-direction: column; gap: ${d("xs")}; }
            & .plan-detail__field.hidden { display: none; }
            & .plan-detail__pair { display: grid; grid-template-columns: 1fr 1fr; gap: ${d("md")}; }
            & .plan-detail__label { font-size: 0.8125rem; font-weight: 600; color: ${a("text")}; }
            & .plan-detail__field-error {
                font-size: 0.8125rem;
                line-height: 1.5;
                color: ${a("danger")};
            }
            & .plan-detail__field-error:empty { display: none; }
            & .plan-detail__input, & .plan-detail__textarea {
                ${K()}
                width: 100%;
                box-sizing: border-box;
            }
            & .plan-detail__textarea { font-family: inherit; line-height: 1.6; resize: vertical; }
            & .plan-detail__control .ui-select { display: block; }
            & .plan-detail__control--grow { flex: 1; min-width: 12rem; }

            & .plan-detail__row {
                display: flex;
                align-items: center;
                gap: ${d("sm")};
                flex-wrap: wrap;
            }
            & .plan-detail__row.hidden { display: none; }

            /* §4.8: one primary per form. Spara is it. */
            & .plan-detail__save { ${C(a("radius-sm"),"primary")} }
            /* Koppling mål is a second action on the page, not a second
               primary — the secondary tier is carried by its edge alone. */
            & .plan-detail__secondary { ${C()} }

            /* The archived explanation carries the brass rule — it is the
               brand's own voice explaining a state, not a warning. */
            & .plan-detail__archived {
                padding: ${d("md")};
                border-left: 2px solid ${a("brass-line")};
                background: ${a("surface-2")};
            }
            & .plan-detail__archived.hidden { display: none; }

            /* Hides the closed dialog from the DOM entirely for a reader who
               has no such action — see the binding for why. */
            & .plan-detail__dialog.hidden { display: none; }
            & .plan-detail__archived-text {
                margin: 0;
                max-width: 68ch;
                font-size: 0.875rem;
                line-height: 1.6;
                color: ${a("text")};
            }

            @media (max-width: 639px) {
                & .plan-detail__pair { grid-template-columns: 1fr; }
                & .plan-detail__item {
                    grid-template-columns: minmax(0, 1fr);
                    gap: ${d("sm")};
                }
                & .plan-detail__date {
                    flex-direction: row;
                    align-items: baseline;
                    gap: ${d("xs")};
                    width: auto;
                }
                & .plan-detail__day { font-size: 1rem; }
                & .plan-detail__item-trail { justify-content: flex-start; }
            }
        }
    `;auth=this.inject(re);router=this.inject(H);plans=this.inject($e);goals=this.inject(wt);teachers=this.inject(fe);toasts=this.inject(te);detail=new m(null);resolved=new m(!1);confirmArchive=new m(!1);nowIso=new m(new Date().toISOString());titleVal=new m("");descVal=new m("");startVal=new m("");endVal=new m("");primaryVal=new m("");titleTouched=new m(!1);goalVal=new m("");viewer=new y(()=>{const e=this.detail.get(),t=this.auth.currentUser.get();return e&&t&&e.studentId===t.id?"owner":"connectedTeacher"});controls=new y(()=>dr(this.viewer.get(),this.detail.get()?.status??"active"));rangeInvalid=new y(()=>!jn(this.startVal.get()||null,this.endVal.get()||null));teacherOptions=new y(()=>[{value:"",label:o("plan.primaryTeacher.none")},...this.teachers.items.get().map(e=>({value:e.id,label:e.displayName}))]);attachable=new y(()=>{const e=this.planId(),t=this.goals.items.get();return br(t,_r(t,e))});goalOptions=new y(()=>this.attachable.get().map(e=>({value:e.id,label:e.title})));grouped=new y(()=>pr(this.detail.get()?.lessons??[],this.nowIso.get()));upcoming=new y(()=>this.grouped.get().upcoming);past=new y(()=>this.grouped.get().past);sessions=new y(()=>mr(this.detail.get()?.trainingSessions??[]));linkedGoals=new y(()=>this.detail.get()?.goals??[]);onMount(){this.load()}planId(){return this.router.route.get().split("/")[2]??""}async load(){const e=this.planId();if(!e){this.resolved.set(!0);return}const t=await this.plans.loadDetail(e);this.detail.set(t),t&&this.seedForm(t),this.resolved.set(!0);const s=this.auth.currentUser.get();!t||!s||t.studentId!==s.id||(this.goals.load(),this.teachers.load())}seedForm(e){this.titleVal.set(e.title),this.descVal.set(e.description??""),this.startVal.set(e.startDate??""),this.endVal.set(e.endDate??""),this.primaryVal.set(e.primaryTeacherId??""),this.titleTouched.set(!1)}render(){const e=this.wire(oc,{back:{onclick:this.router.link("/planer").onclick,textContent:()=>o("plan.back")},loading:{textContent:()=>o("plan.loading"),className:()=>this.resolved.get()?"plan-detail__loading hidden":"plan-detail__loading"},body:{className:()=>this.detail.get()?"plan-detail__body":"plan-detail__body hidden"},readSection:{className:()=>this.controls.get().editDetails?"plan-detail__section hidden":"plan-detail__section"},descHeading:{textContent:()=>o("plan.section.description")},descRead:{textContent:()=>this.detail.get()?.description??"",className:()=>this.detail.get()?.description?"plan-detail__prose":"plan-detail__prose hidden"},descEmpty:{textContent:()=>o("plan.description.empty"),className:()=>this.detail.get()?.description?"plan-detail__muted hidden":"plan-detail__muted"},editSection:{className:()=>this.controls.get().editDetails?"plan-detail__section":"plan-detail__section hidden"},editHeading:{textContent:()=>o("plan.section.details")},titleLabel:{textContent:()=>o("plan.field.title")},titleInput:{value:()=>this.titleVal.get(),"aria-invalid":()=>String(this.titleTouched.get()&&this.titleVal.get().trim()===""),oninput:t=>this.titleVal.set(t.target.value)},titleError:{textContent:()=>this.titleTouched.get()&&this.titleVal.get().trim()===""?o("plan.error.title"):""},descLabel:{textContent:()=>o("plan.field.description")},descInput:{value:()=>this.descVal.get(),oninput:t=>this.descVal.set(t.target.value)},startLabel:{textContent:()=>o("plan.field.start")},startInput:{value:()=>this.startVal.get(),oninput:t=>this.startVal.set(t.target.value)},endLabel:{textContent:()=>o("plan.field.end")},endInput:{value:()=>this.endVal.get(),"aria-invalid":()=>String(this.rangeInvalid.get()),oninput:t=>this.endVal.set(t.target.value)},endError:{textContent:()=>this.rangeInvalid.get()?o("plan.error.range",{start:this.startVal.get()}):""},teacherField:{className:()=>this.teachers.items.get().length===0?"plan-detail__field hidden":"plan-detail__field"},teacherLabel:{textContent:()=>o("plan.field.primaryTeacher")},teacherHint:{textContent:()=>o("plan.primaryTeacher.hint")},save:{textContent:()=>o("plan.save"),disabled:()=>this.plans.loading.get()||this.rangeInvalid.get()},saveError:{textContent:()=>this.plans.error.get()?o("plan.saveError"):""},editForm:{onsubmit:t=>{this.save(t)}},goalsHeading:{textContent:()=>o("plan.section.goals")},goalsEmpty:{textContent:()=>o(vr(this.viewer.get())),className:()=>this.linkedGoals.get().length===0?"plan-detail__muted":"plan-detail__muted hidden"},goalsAttach:{className:()=>this.controls.get().attachGoals&&this.attachable.get().length>0?"plan-detail__row":"plan-detail__row hidden"},attachGoal:{textContent:()=>o("plan.goals.attach"),disabled:()=>this.goalVal.get()===""||this.goals.loading.get(),onclick:()=>{this.attachGoal()}},goalsNone:{textContent:()=>o("plan.goals.none"),className:()=>this.controls.get().attachGoals&&this.attachable.get().length===0?"plan-detail__hint":"plan-detail__hint hidden"},lessonsHeading:{textContent:()=>o("plan.section.lessons")},upcomingGroup:{className:()=>this.upcoming.get().length===0?"plan-detail__group hidden":"plan-detail__group"},upcomingLabel:{textContent:()=>o("plan.group.upcoming")},pastGroup:{className:()=>this.past.get().length===0?"plan-detail__group hidden":"plan-detail__group"},pastLabel:{textContent:()=>o("plan.group.past")},lessonsEmpty:{textContent:()=>o("plan.lessons.empty"),className:()=>(this.detail.get()?.lessons.length??0)===0?"plan-detail__muted":"plan-detail__muted hidden"},sessionsHeading:{textContent:()=>o("plan.section.trainingSessions")},sessionsEmpty:{textContent:()=>o("plan.trainingSessions.empty"),className:()=>this.sessions.get().length===0?"plan-detail__muted":"plan-detail__muted hidden"},archivedSection:{className:()=>this.detail.get()?.status==="archived"?"plan-detail__archived":"plan-detail__archived hidden"},archivedNotice:{textContent:()=>o("plan.archived.notice")},confirmArchiveHost:{className:()=>this.controls.get().archive?"plan-detail__dialog":"plan-detail__dialog hidden"}});return this.buildNotFound(this.ref(e,"notFoundHost")),this.buildHeader(this.ref(e,"headerHost")),this.spawn(R,this.ref(e,"teacherHost"),{value:this.primaryVal,options:this.teacherOptions}),this.spawn(R,this.ref(e,"goalHost"),{value:this.goalVal,options:this.goalOptions,placeholder:o("plan.goals.placeholder")}),this.track(w(()=>{const t=this.goalOptions.get(),s=this.goalVal.get();s&&!t.some(i=>i.value===s)&&this.goalVal.set("")})),this.buildGoals(this.ref(e,"goalsList")),this.$each(this.ref(e,"upcomingList"),this.upcoming,t=>this.renderLesson(t),t=>t.id),this.$each(this.ref(e,"pastList"),this.past,t=>this.renderLesson(t),t=>t.id),this.$each(this.ref(e,"sessionsList"),this.sessions,t=>this.renderSession(t),t=>t.id),this.spawn(ne,this.ref(e,"confirmArchiveHost"),{open:this.confirmArchive,title:o("plan.confirm.archive.title"),message:()=>o("plan.confirm.archive.message"),confirmLabel:o("plan.action.archive"),cancelLabel:o("plan.confirm.dismiss"),danger:!0,onconfirm:()=>{this.archive()}}),e}buildHeader(e){this.spawn(xt,e,{eyebrow:()=>o("objectKind.plan"),title:()=>this.detail.get()?.title??"",status:()=>{const t=this.detail.get();if(!t)return null;const s=is(t.status);return{label:s.label,variant:s.variant,tone:s.tone,...s.glyph===void 0?{}:{glyph:s.glyph}}},chips:()=>[],meta:()=>{const t=this.detail.get();return t?[Ge(t.startDate,t.endDate),bt(t.primaryTeacherDisplayName)].filter(Boolean).join(" · "):""},overflowActions:()=>this.controls.get().archive?[{label:o("plan.action.archive"),onclick:()=>this.confirmArchive.set(!0)}]:[]})}buildNotFound(e){let t=null;this.track(w(()=>{const s=this.resolved.get()&&!this.detail.get();t?.destroy(),t=null,e.replaceChildren(),s&&(t=j(()=>{const i=new U({heading:()=>o("plan.notFound.heading"),body:()=>o("plan.notFound.body"),action:{label:()=>o("plan.notFound.action"),onclick:()=>this.router.navigate("/planer")},headingLevel:1});return i.mount(e),i}))})),this.track(()=>t?.destroy())}buildGoals(e){const t=[];this.track(()=>{for(const s of t)s.destroy();t.length=0}),this.track(w(()=>{const s=this.linkedGoals.get(),i=this.controls.get();for(const r of t)r.destroy();t.length=0,e.replaceChildren();for(const r of s){const l=document.createElement("li"),c=document.createElement("div");c.className="plan-detail__item plan-detail__item--flat";const h=`/mal/${r.id}`,u=document.createElement("a");u.className="plan-detail__link",u.href=h,u.addEventListener("click",S=>{S.preventDefault(),this.router.navigate(h)});const p=document.createElement("span");p.className="plan-detail__item-body";const b=document.createElement("span");b.className="plan-detail__item-title",b.textContent=r.title,p.appendChild(b);const _=Ee(r.targetDate);if(_){const S=document.createElement("span");S.className="plan-detail__item-meta",S.textContent=_,p.appendChild(S)}u.appendChild(p),c.appendChild(u);const k=document.createElement("span");k.className="plan-detail__item-trail";const I=ft(r.status),N=document.createElement("span");k.appendChild(N);const A=j(()=>{const S=new ie({label:I.label,variant:I.variant,tone:I.tone,...I.glyph===void 0?{}:{glyph:I.glyph}});return S.mount(N),S});if(t.push(A),i.detachGoals){const S=document.createElement("button");S.type="button",S.className="plan-detail__detach",S.textContent=o("plan.goals.detach"),S.addEventListener("click",()=>{this.detachGoal(r)}),k.appendChild(S)}c.appendChild(k),l.appendChild(c),e.appendChild(l)}}))}renderLesson(e){return this.occasionRow(`/lektioner/${e.id}`,e.scheduledAt,Ys(e.scheduledAt),gr(e))}renderSession(e){return this.occasionRow(`/traningspass/${e.id}`,e.performedAt,Ys(e.performedAt),fr(e))}occasionRow(e,t,s,i){const r=document.createElement("li"),l=document.createElement("div");l.className="plan-detail__item";const c=document.createElement("a");c.className="plan-detail__link",c.href=e,c.addEventListener("click",k=>{k.preventDefault(),this.router.navigate(e)});const h=ur(t),u=document.createElement("span");u.className="plan-detail__date";for(const[k,I]of[["day",h.day],["month",h.month],["time",h.time]]){const N=document.createElement("span");N.className=`plan-detail__${k}`,N.textContent=I,u.appendChild(N)}c.appendChild(u);const p=document.createElement("span");p.className="plan-detail__item-body";const b=document.createElement("span");if(b.className="plan-detail__item-title",b.textContent=s,p.appendChild(b),i){const k=document.createElement("span");k.className="plan-detail__item-meta",k.textContent=i,p.appendChild(k)}c.appendChild(p);const _=document.createElement("span");return _.className="plan-detail__item-trail",c.appendChild(_),l.appendChild(c),r.appendChild(l),r}async save(e){e.preventDefault();const t=this.titleVal.get().trim();this.titleTouched.set(!0),!(!t||this.rangeInvalid.get()||!await this.plans.update(this.planId(),{title:t,description:this.descVal.get().trim()||null,startDate:this.startVal.get()||null,endDate:this.endVal.get()||null,primaryTeacherId:this.primaryVal.get()||null}))&&(this.toasts.show({message:o("plan.saved"),variant:"success"}),await this.load())}async attachGoal(){const e=this.goalVal.get(),t=this.attachable.get().find(i=>i.id===e);!t||!await this.goals.attachPlan(e,this.planId())||(this.goalVal.set(""),this.toasts.show({message:o("plan.toast.goalAttached",{title:t.title})}),await this.load())}async detachGoal(e){await this.goals.detachPlan(e.id,this.planId())&&(this.toasts.show({message:o("plan.toast.goalDetached",{title:e.title})}),await this.load())}async archive(){await this.plans.archive(this.planId())&&(this.toasts.show({message:o("plan.toast.archived")}),await this.load())}}const dc=T('<div bind="host"></div>');class cc extends E{router=this.inject(H);key=new y(()=>{const e=this.router.route.get();return e==="/planer"?"list":e==="/planer/ny"?"create":"detail"});render(){const e=this.wire(dc,{});return this.$swap(this.ref(e,"host"),this.key,{list:ic,create:rc,detail:lc}),e}}const hc=T(`
    <div class="goals">
        <header class="goals__head">
            <h1 bind="heading" class="goals__title"></h1>
            <button bind="create" type="button" class="goals__create"></button>
        </header>

        <p bind="loading" class="goals__loading"></p>

        <div bind="errorBox" class="goals__error" role="alert">
            <p bind="errorText" class="goals__error-text"></p>
            <button bind="retry" type="button" class="goals__retry"></button>
        </div>

        <div bind="emptyHost"></div>

        <section bind="activeSection" class="goals__group">
            <h2 bind="activeLabel" class="goals__group-label"></h2>
            <ul bind="activeList" class="goals__list"></ul>
        </section>

        <section bind="achievedSection" class="goals__group">
            <h2 bind="achievedLabel" class="goals__group-label"></h2>
            <ul bind="achievedList" class="goals__list"></ul>
        </section>

        <section bind="abandonedSection" class="goals__group">
            <button bind="abandonedToggle" type="button" class="goals__disclosure" aria-expanded="false"></button>
            <ul bind="abandonedList" class="goals__list"></ul>
        </section>
    </div>
`);class uc extends E{static styles=`
        .goals {
            & .goals__head {
                display: flex;
                align-items: baseline;
                justify-content: space-between;
                gap: ${d("lg")};
                flex-wrap: wrap;
                margin-bottom: ${d("xl")};
            }

            /* Lora 500, and only 500 — UI_DECISIONS §3. */
            & .goals__title {
                margin: 0;
                font-family: ${a("font-display")};
                font-weight: 500;
                font-size: 1.75rem;
                line-height: 36px;
                color: ${a("text")};
            }

            /* Buttons are Open Sans territory; the serif is forbidden here. */
            & .goals__create { ${C(a("radius-sm"),"primary")} }

            & .goals__loading {
                margin: 0;
                color: ${a("text-muted")};
                font-size: 0.875rem;
            }
            & .goals__loading.hidden { display: none; }

            & .goals__error {
                display: flex;
                align-items: center;
                gap: ${d("md")};
                flex-wrap: wrap;
                padding: ${d("md")};
                margin-bottom: ${d("lg")};
                border: 1px solid ${a("danger")};
                border-radius: ${a("radius-md")};
                background: ${a("danger-soft")};

                & .goals__error-text { margin: 0; font-size: 0.875rem; color: ${a("text")}; }
                & .goals__retry { ${C()} }
            }
            & .goals__error.hidden { display: none; }

            & .goals__group { margin-bottom: ${d("xl")}; }
            & .goals__group.hidden { display: none; }

            /* Uppercase group label — letterspaced, never the serif (§4.3). */
            & .goals__group-label {
                margin: 0 0 ${d("md")};
                font-family: ${a("font-ui")};
                font-size: 0.6875rem;
                line-height: 16px;
                font-weight: 700;
                letter-spacing: 0.14em;
                text-transform: uppercase;
                color: ${a("text-muted")};
            }

            /* Avbrutna is collapsed (§3.13 "preferably behind a filter or
               collapsed section"), so its label is the disclosure itself. */
            & .goals__disclosure {
                display: inline-flex;
                align-items: center;
                gap: ${d("sm")};
                margin: 0 0 ${d("md")};
                padding: ${d("xs")} 0;
                background: transparent;
                border: none;
                cursor: pointer;
                font-family: ${a("font-ui")};
                font-size: 0.6875rem;
                line-height: 16px;
                font-weight: 700;
                letter-spacing: 0.14em;
                text-transform: uppercase;
                color: ${a("text-muted")};
                &:hover { color: ${a("accent-strong")}; }
                &:focus-visible { outline: 2px solid ${a("accent")}; outline-offset: 2px; }
            }

            & .goals__list {
                list-style: none;
                margin: 0;
                padding: 0;
                /* No zebra striping (§4.3): rows are separated by a hairline. */
                border-top: 1px solid ${a("border")};
            }
            & .goals__list:empty { border-top: none; }
            & .goals__list.hidden { display: none; }
            & .goals__list > li { border-bottom: 1px solid ${a("border")}; }

            & .goal-row {
                display: grid;
                grid-template-columns: minmax(0, 1fr) auto;
                align-items: start;
                gap: ${d("lg")};
                padding: ${d("md")} ${d("sm")};
                text-decoration: none;
                color: inherit;
                font-family: ${a("font-ui")};

                &:hover { background: ${a("surface-2")}; }
                &:focus-visible { outline: 2px solid ${a("accent")}; outline-offset: -2px; }
            }
            /* Abandoned rows are dimmed, as §4.3 dims a cancelled row. */
            & .goal-row--abandoned { opacity: 0.72; }

            & .goal-row__body {
                display: flex;
                flex-direction: column;
                gap: ${d("xs")};
                min-width: 0;
            }
            & .goal-row__title {
                font-size: 0.9375rem;
                font-weight: 600;
                color: ${a("text")};
                overflow-wrap: anywhere;
            }
            /* One meta line, not four — §4.3 allows at most two rows of text. */
            & .goal-row__meta {
                display: flex;
                align-items: baseline;
                flex-wrap: wrap;
                gap: ${d("xs")} ${d("sm")};
                font-size: 0.8125rem;
                color: ${a("text-muted")};
            }
            /* Overdue is supporting metadata (§3.13), so it borrows the warning
               tone for emphasis but never the pill's shape grammar — it is not
               a status and must not read as one. */
            & .goal-row__overdue { color: ${a("warning")}; font-weight: 600; }
            & .goal-row__excerpt {
                font-size: 0.8125rem;
                line-height: 1.5;
                color: ${a("text-muted")};
                overflow-wrap: anywhere;
            }

            & .goal-row__chips {
                display: flex;
                flex-wrap: wrap;
                gap: ${d("xs")};
                justify-content: flex-end;
                align-items: flex-start;
                max-width: 18rem;
            }

            /* UI_DECISIONS §6: single column below 640px. */
            @media (max-width: 639px) {
                & .goal-row {
                    grid-template-columns: minmax(0, 1fr);
                    gap: ${d("sm")};
                }
                & .goal-row__chips { justify-content: flex-start; max-width: none; }
                & .goals__title { font-size: 1.375rem; line-height: 30px; }
            }
        }
    `;router=this.inject(H);goals=this.inject(wt);plans=this.inject($e);teachers=this.inject(fe);namesResolved=new m(!1);showAbandoned=new m(!1);today=new m(mt(new Date));grouped=new y(()=>er(this.namesResolved.get()?this.goals.items.get():[]));active=new y(()=>this.grouped.get().active);achieved=new y(()=>this.grouped.get().achieved);abandoned=new y(()=>this.grouped.get().abandoned);isEmpty=new y(()=>this.namesResolved.get()&&this.goals.items.get().length===0&&!this.goals.loading.get()&&this.goals.error.get()===null);onMount(){this.goals.load(),Promise.allSettled([this.plans.load(),this.teachers.load()]).then(()=>this.namesResolved.set(!0))}render(){const e=this.wire(hc,{heading:{textContent:()=>o("goals.heading")},create:{textContent:()=>o("goals.create"),onclick:()=>this.router.navigate("/mal/nytt")},loading:{textContent:()=>o("goals.loading"),className:()=>(!this.namesResolved.get()||this.goals.loading.get())&&this.goals.items.get().length===0&&this.goals.error.get()===null?"goals__loading":"goals__loading hidden"},errorBox:{className:()=>this.goals.error.get()?"goals__error":"goals__error hidden"},errorText:{textContent:()=>o("goals.error")},retry:{textContent:()=>o("goals.retry"),onclick:()=>{this.goals.load()}},activeSection:{className:()=>this.active.get().length===0?"goals__group hidden":"goals__group"},activeLabel:{textContent:()=>o("goals.group.active")},achievedSection:{className:()=>this.achieved.get().length===0?"goals__group hidden":"goals__group"},achievedLabel:{textContent:()=>o("goals.group.achieved")},abandonedSection:{className:()=>this.abandoned.get().length===0?"goals__group hidden":"goals__group"},abandonedToggle:{textContent:()=>this.showAbandoned.get()?o("goals.abandoned.hide"):q("goals.abandoned.show",this.abandoned.get().length),"aria-expanded":()=>String(this.showAbandoned.get()),onclick:()=>this.showAbandoned.set(!this.showAbandoned.peek())},abandonedList:{className:()=>this.showAbandoned.get()?"goals__list":"goals__list hidden"}});return this.buildEmpty(this.ref(e,"emptyHost")),this.$each(this.ref(e,"activeList"),this.active,(t,s,i)=>this.renderRow(t,i),Ct),this.$each(this.ref(e,"achievedList"),this.achieved,(t,s,i)=>this.renderRow(t,i),Ct),this.$each(this.ref(e,"abandonedList"),this.abandoned,(t,s,i)=>this.renderRow(t,i),Ct),e}buildEmpty(e){let t=null;this.track(w(()=>{const s=this.isEmpty.get();t?.destroy(),t=null,e.replaceChildren(),s&&(t=j(()=>{const i=new U({heading:()=>o("goals.empty.heading"),body:()=>o("goals.empty.body"),action:{label:()=>o("goals.empty.action"),onclick:()=>this.router.navigate("/mal/nytt")},headingLevel:2});return i.mount(e),i}))})),this.track(()=>t?.destroy())}renderRow(e,t){const s=document.createElement("li"),i=`/mal/${e.id}`,r=document.createElement("a");r.className=e.status==="abandoned"?"goal-row goal-row--abandoned":"goal-row",r.href=i,r.addEventListener("click",O=>{O.preventDefault(),this.router.navigate(i)});const l=document.createElement("span");l.className="goal-row__body";const c=document.createElement("span");c.className="goal-row__title",c.textContent=e.title,l.appendChild(c);const h=document.createElement("span");h.className="goal-row__meta",e.horseName&&h.appendChild(Je(o("goal.meta.horse",{name:e.horseName})));const u=Ee(e.targetDate);u&&h.appendChild(Je(u)),ns(e,this.today.get())&&h.appendChild(Je(o("goal.overdue"),"goal-row__overdue"));const p=ir(e.planIds,this.plans.items.get());p&&h.appendChild(Je(p)),h.childElementCount>0&&l.appendChild(h);const b=sr(e.description);if(b){const O=document.createElement("span");O.className="goal-row__excerpt",O.textContent=b,l.appendChild(O)}const _=document.createElement("span");_.className="goal-row__chips";const k=document.createElement("span");_.appendChild(k);const I=new Ke({recipients:()=>ar(e.sharedTeacherIds,this.teachers.items.get()),shared:()=>e.sharedTeacherIds.length>0});I.mount(k),t(()=>I.destroy());const N=ft(e.status),A=document.createElement("span");_.appendChild(A);const S=new ie({label:N.label,variant:N.variant,tone:N.tone,...N.glyph===void 0?{}:{glyph:N.glyph}});return S.mount(A),t(()=>S.destroy()),r.append(l,_),s.appendChild(r),s}}function Je(n,e){const t=document.createElement("span");return e&&(t.className=e),t.textContent=n,t}const pc=T(`
    <form class="new-goal" bind="form">
        <a bind="back" href="/mal" class="new-goal__back"></a>
        <h1 bind="heading" class="new-goal__title"></h1>

        <div class="new-goal__panel">
            <label class="new-goal__field">
                <span bind="titleLabel" class="new-goal__label"></span>
                <input bind="titleInput" type="text" maxlength="200" class="new-goal__input" required>
                <span bind="titleHint" class="new-goal__hint"></span>
                <span bind="titleError" class="new-goal__field-error" role="alert"></span>
            </label>

            <label class="new-goal__field">
                <span bind="descLabel" class="new-goal__label"></span>
                <textarea bind="descInput" rows="4" maxlength="5000" class="new-goal__textarea"></textarea>
                <span bind="descHint" class="new-goal__hint"></span>
            </label>

            <label class="new-goal__field">
                <span bind="targetLabel" class="new-goal__label"></span>
                <input bind="targetInput" type="date" class="new-goal__input">
                <span bind="targetHint" class="new-goal__hint"></span>
                <span bind="targetError" class="new-goal__field-error" role="alert"></span>
            </label>

            <label bind="horseField" class="new-goal__field">
                <span bind="horseLabel" class="new-goal__label"></span>
                <div bind="horseHost" class="new-goal__control"></div>
                <span bind="horseHint" class="new-goal__hint"></span>
            </label>

            <p bind="error" class="new-goal__error" role="alert"></p>

            <div class="new-goal__actions">
                <button bind="submit" type="submit" class="new-goal__submit"></button>
                <button bind="cancel" type="button" class="new-goal__cancel"></button>
            </div>
        </div>
    </form>
`);class mc extends E{static styles=`
        .new-goal {
            display: flex;
            flex-direction: column;
            gap: ${d("lg")};
            max-width: 34rem;
            font-family: ${a("font-ui")};

            & .new-goal__back {
                font-size: 0.875rem;
                color: ${a("text-muted")};
                text-decoration: none;
                &:hover { color: ${a("accent-strong")}; text-decoration: underline; }
                &:focus-visible { outline: 2px solid ${a("accent")}; outline-offset: 2px; }
            }

            /* Lora 500 only (UI_DECISIONS §3). */
            & .new-goal__title {
                margin: 0;
                font-family: ${a("font-display")};
                font-weight: 500;
                font-size: 1.75rem;
                line-height: 36px;
                color: ${a("text")};
            }

            /*
             * The fields sit in a panel, not loose on the page. The §4.8 field
             * recipe fills with --bg — the page-paper colour — so a form
             * rendered straight onto the route would give the field the same
             * colour as everything behind it. The panel is what the recessed
             * fill is recessed INTO. §4.8's own example shows the same thing.
             */
            & .new-goal__panel {
                ${Q()}
                box-sizing: border-box;
                padding: ${d("xl")};
                display: flex;
                flex-direction: column;
                gap: ${d("lg")};
            }

            & .new-goal__field {
                display: flex;
                flex-direction: column;
                gap: ${d("xs")};
            }
            /* §3.9 States: a picker with nothing to offer is hidden, not empty. */
            & .new-goal__field.hidden { display: none; }

            & .new-goal__label {
                font-size: 0.8125rem;
                font-weight: 600;
                color: ${a("text")};
            }

            & .new-goal__hint {
                font-size: 0.8125rem;
                line-height: 1.5;
                color: ${a("text-muted")};
                max-width: 68ch;
            }
            & .new-goal__hint:empty { display: none; }

            /* Field-level error: sits under its own input, names the fix. */
            & .new-goal__field-error {
                font-size: 0.8125rem;
                line-height: 1.5;
                color: ${a("danger")};
            }
            & .new-goal__field-error:empty { display: none; }

            & .new-goal__input, & .new-goal__textarea {
                ${K()}
                width: 100%;
                box-sizing: border-box;
            }
            & .new-goal__textarea {
                font-family: inherit;
                line-height: 1.6;
                resize: vertical;
            }

            & .new-goal__error {
                margin: 0;
                min-height: 1em;
                font-size: 0.875rem;
                color: ${a("danger")};
            }

            & .new-goal__actions {
                display: flex;
                gap: ${d("sm")};
                flex-wrap: wrap;
            }
            /* §4.8: one primary per form. This is it. */
            & .new-goal__submit { ${C(a("radius-sm"),"primary")} }
            /* Cancel is the ghost tier — not a second bordered button. */
            & .new-goal__cancel { ${C(a("radius-sm"),"ghost")} }

            @media (max-width: 639px) {
                & .new-goal__actions { flex-direction: column; align-items: stretch; }
                & .new-goal__title { font-size: 1.375rem; line-height: 30px; }
            }
        }
    `;router=this.inject(H);goals=this.inject(wt);stable=this.inject(ke);toasts=this.inject(te);titleVal=new m("");descVal=new m("");targetVal=new m("");horseVal=new m("");horses=new y(()=>zn(this.stable.items.get()));horseOptions=new y(()=>[{value:"",label:o("goal.horse.none")},...this.horses.get().map(e=>({value:e.id,label:e.name}))]);titleTouched=new m(!1);targetInvalid=new y(()=>{const e=this.targetVal.get();return e!==""&&pe(e)===null});render(){const e=this.wire(pc,{back:{onclick:this.router.link("/mal").onclick,textContent:()=>o("goal.back")},heading:{textContent:()=>o("goalCreate.heading")},titleLabel:{textContent:()=>o("goalCreate.field.title")},titleHint:{textContent:()=>o("goalCreate.field.title.hint")},titleInput:{value:()=>this.titleVal.get(),"aria-invalid":()=>String(this.titleTouched.get()&&this.titleVal.get().trim()===""),oninput:t=>this.titleVal.set(t.target.value)},titleError:{textContent:()=>this.titleTouched.get()&&this.titleVal.get().trim()===""?o("goal.error.title"):""},descLabel:{textContent:()=>o("goalCreate.field.description")},descHint:{textContent:()=>o("goalCreate.field.description.hint")},descInput:{value:()=>this.descVal.get(),oninput:t=>this.descVal.set(t.target.value)},targetLabel:{textContent:()=>o("goalCreate.field.target")},targetHint:{textContent:()=>Ee(this.targetVal.get()||null)??o("goalCreate.field.target.hint")},targetInput:{value:()=>this.targetVal.get(),"aria-invalid":()=>String(this.targetInvalid.get()),oninput:t=>this.targetVal.set(t.target.value)},targetError:{textContent:()=>this.targetInvalid.get()?o("goal.error.target"):""},horseField:{className:()=>this.horses.get().length===0?"new-goal__field hidden":"new-goal__field"},horseLabel:{textContent:()=>o("goalCreate.field.horse")},horseHint:{textContent:()=>o("goalCreate.field.horse.hint")},error:{textContent:()=>this.goals.error.get()?o("goal.saveError"):""},submit:{textContent:()=>o("goalCreate.submit"),disabled:()=>this.goals.loading.get()||this.targetInvalid.get()},cancel:{textContent:()=>o("goalCreate.cancel"),onclick:()=>this.router.navigate("/mal")},form:{onsubmit:t=>{this.submit(t)}}});return this.spawn(R,this.ref(e,"horseHost"),{value:this.horseVal,options:this.horseOptions}),e}onMount(){this.stable.load()}async submit(e){e.preventDefault();const t=this.titleVal.get().trim();if(this.titleTouched.set(!0),!t||this.targetInvalid.get())return;const s=this.descVal.get().trim(),i=this.targetVal.get(),r=this.horseVal.get(),l=await this.goals.create({title:t,...s?{description:s}:{},...i?{targetDate:i}:{},...r?{horseId:r}:{}});l&&(this.toasts.show({message:o("goalCreate.created"),variant:"success"}),this.router.navigate(`/mal/${l.id}`))}}const gc=T(`
    <div class="goal-detail" bind="root">
        <a bind="back" href="/mal" class="goal-detail__back"></a>
        <p bind="loading" class="goal-detail__loading"></p>
        <div bind="notFoundHost"></div>

        <div bind="body" class="goal-detail__body">
            <div bind="headerHost"></div>

            <div bind="conflict" class="goal-detail__conflict" role="alert">
                <p bind="conflictText" class="goal-detail__conflict-text"></p>
                <button bind="conflictRetry" type="button" class="goal-detail__secondary"></button>
            </div>

            <p bind="abandonedNotice" class="goal-detail__notice"></p>

            <section bind="readSection" class="goal-detail__section">
                <h2 bind="descHeading" class="goal-detail__heading"></h2>
                <p bind="descRead" class="goal-detail__prose"></p>
                <p bind="descEmpty" class="goal-detail__muted"></p>
            </section>

            <section bind="editSection" class="goal-detail__section">
                <h2 bind="editHeading" class="goal-detail__heading"></h2>
                <form bind="editForm" class="goal-detail__form">
                    <label class="goal-detail__field">
                        <span bind="titleLabel" class="goal-detail__label"></span>
                        <input bind="titleInput" type="text" maxlength="200" class="goal-detail__input" required>
                        <span bind="titleError" class="goal-detail__field-error" role="alert"></span>
                    </label>
                    <label class="goal-detail__field">
                        <span bind="descLabel" class="goal-detail__label"></span>
                        <textarea bind="descInput" rows="4" maxlength="5000" class="goal-detail__textarea"></textarea>
                    </label>
                    <label class="goal-detail__field">
                        <span bind="targetLabel" class="goal-detail__label"></span>
                        <input bind="targetInput" type="date" class="goal-detail__input">
                        <span bind="targetError" class="goal-detail__field-error" role="alert"></span>
                    </label>
                    <label bind="horseField" class="goal-detail__field">
                        <span bind="horseLabel" class="goal-detail__label"></span>
                        <div bind="horseHost" class="goal-detail__control"></div>
                    </label>
                    <div class="goal-detail__row">
                        <button bind="save" type="submit" class="goal-detail__save"></button>
                        <span bind="saveError" class="goal-detail__field-error" role="alert"></span>
                    </div>
                </form>
            </section>

            <section bind="plansSection" class="goal-detail__section">
                <h2 bind="plansHeading" class="goal-detail__heading"></h2>
                <ul bind="plansList" class="goal-detail__list"></ul>
                <p bind="plansEmpty" class="goal-detail__muted"></p>
                <div bind="planAttach" class="goal-detail__row">
                    <div bind="planHost" class="goal-detail__control goal-detail__control--grow"></div>
                    <button bind="attachPlan" type="button" class="goal-detail__secondary"></button>
                </div>
                <p bind="plansNone" class="goal-detail__hint"></p>
            </section>

            <section bind="sharingSection" class="goal-detail__section">
                <h2 bind="sharingHeading" class="goal-detail__heading"></h2>
                <p bind="sharingHint" class="goal-detail__hint"></p>
                <p bind="sharingLoading" class="goal-detail__muted"></p>
                <ul bind="sharingList" class="goal-detail__checks"></ul>
                <p bind="sharingNone" class="goal-detail__muted"></p>
            </section>

            <section class="goal-detail__section">
                <div bind="notesHost"></div>
            </section>
        </div>

        <div bind="confirmAbandonHost" class="goal-detail__dialog"></div>
    </div>
`);class fc extends E{static styles=`
        .goal-detail {
            display: flex;
            flex-direction: column;
            gap: ${d("lg")};
            font-family: ${a("font-ui")};

            & .goal-detail__back {
                font-size: 0.875rem;
                color: ${a("text-muted")};
                text-decoration: none;
                &:hover { color: ${a("accent-strong")}; text-decoration: underline; }
                &:focus-visible { outline: 2px solid ${a("accent")}; outline-offset: 2px; }
            }

            & .goal-detail__loading {
                margin: 0;
                color: ${a("text-muted")};
                font-size: 0.875rem;
            }
            & .goal-detail__loading.hidden { display: none; }

            & .goal-detail__body {
                display: flex;
                flex-direction: column;
                gap: ${d("xl")};
            }
            & .goal-detail__body.hidden { display: none; }

            & .goal-detail__conflict {
                display: flex;
                align-items: center;
                gap: ${d("md")};
                flex-wrap: wrap;
                padding: ${d("md")};
                border: 1px solid ${a("warning")};
                border-radius: ${a("radius-md")};
                background: ${a("warning-soft")};

                & .goal-detail__conflict-text {
                    margin: 0;
                    font-size: 0.875rem;
                    line-height: 1.5;
                    color: ${a("text")};
                    max-width: 68ch;
                }
            }
            & .goal-detail__conflict.hidden { display: none; }

            /* The state explanation carries the brass rule — the brand's own
               voice explaining a rule, not a warning. */
            & .goal-detail__notice {
                margin: 0;
                padding: ${d("md")};
                border-left: 2px solid ${a("brass-line")};
                background: ${a("surface-2")};
                max-width: 68ch;
                font-size: 0.875rem;
                line-height: 1.6;
                color: ${a("text")};
            }
            & .goal-detail__notice.hidden { display: none; }

            & .goal-detail__section {
                display: flex;
                flex-direction: column;
                gap: ${d("md")};
            }
            & .goal-detail__section.hidden { display: none; }

            /* A section heading is one of the places the serif is allowed —
               Lora, weight 500, and only 500 (UI_DECISIONS §3). */
            & .goal-detail__heading {
                margin: 0;
                font-family: ${a("font-display")};
                font-weight: 500;
                font-size: 1.25rem;
                line-height: 1.4;
                color: ${a("text")};
            }

            & .goal-detail__prose {
                margin: 0;
                max-width: 68ch;
                font-size: 0.9375rem;
                line-height: 1.6;
                color: ${a("text")};
                white-space: pre-wrap;
            }
            & .goal-detail__prose.hidden { display: none; }

            & .goal-detail__muted {
                margin: 0;
                font-size: 0.875rem;
                color: ${a("text-muted")};
            }
            & .goal-detail__muted.hidden { display: none; }

            & .goal-detail__hint {
                margin: 0;
                font-size: 0.8125rem;
                line-height: 1.5;
                color: ${a("text-muted")};
                max-width: 68ch;
            }
            & .goal-detail__hint.hidden { display: none; }

            & .goal-detail__list {
                list-style: none;
                margin: 0;
                padding: 0;
                border-top: 1px solid ${a("border")};
            }
            & .goal-detail__list:empty { border-top: none; }
            & .goal-detail__list.hidden { display: none; }
            & .goal-detail__list > li { border-bottom: 1px solid ${a("border")}; }

            & .goal-detail__item {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: ${d("md")};
                padding: ${d("sm")};
                flex-wrap: wrap;
                &:hover { background: ${a("surface-2")}; }
                &:focus-within { outline: 2px solid ${a("accent")}; outline-offset: -2px; }
            }
            & .goal-detail__item-link {
                font-size: 0.9375rem;
                font-weight: 600;
                color: ${a("text")};
                text-decoration: none;
                overflow-wrap: anywhere;
                &:hover { color: ${a("accent-strong")}; text-decoration: underline; }
            }

            & .goal-detail__detach {
                background: none;
                border: none;
                padding: 0;
                cursor: pointer;
                font-family: inherit;
                font-size: 0.8125rem;
                color: ${a("danger")};
                text-decoration: underline;
                &:focus-visible { outline: 2px solid ${a("accent")}; outline-offset: 2px; }
            }

            /* The trust surface gets a visible boundary — it is a decision, not
               just another list (§4.5). */
            & .goal-detail__checks {
                list-style: none;
                margin: 0;
                padding: ${d("md")};
                border: 1px solid ${a("border")};
                border-radius: ${a("radius-md")};
                display: flex;
                flex-direction: column;
                gap: ${d("sm")};
            }
            & .goal-detail__checks.hidden { display: none; }
            & .goal-detail__check {
                display: flex;
                align-items: center;
                gap: ${d("sm")};
                font-size: 0.875rem;
                color: ${a("text")};
                cursor: pointer;
            }
            & .goal-detail__check input { accent-color: ${a("accent")}; }

            /*
             * The edit form is a panel. The §4.8 field recipe fills with --bg,
             * the page-paper colour, and a detail section is drawn straight
             * onto that page — so without the panel the fields would be the
             * same colour as everything behind them. The panel is what the
             * recessed fill is recessed INTO.
             */
            & .goal-detail__form {
                ${Q()}
                box-sizing: border-box;
                padding: ${d("xl")};
                display: flex;
                flex-direction: column;
                gap: ${d("md")};
                max-width: 34rem;
            }
            & .goal-detail__field { display: flex; flex-direction: column; gap: ${d("xs")}; }
            & .goal-detail__field.hidden { display: none; }
            & .goal-detail__label { font-size: 0.8125rem; font-weight: 600; color: ${a("text")}; }
            & .goal-detail__field-error {
                font-size: 0.8125rem;
                line-height: 1.5;
                color: ${a("danger")};
            }
            & .goal-detail__field-error:empty { display: none; }
            & .goal-detail__input, & .goal-detail__textarea {
                ${K()}
                width: 100%;
                box-sizing: border-box;
            }
            & .goal-detail__textarea { font-family: inherit; line-height: 1.6; resize: vertical; }
            & .goal-detail__control .ui-select { display: block; }
            & .goal-detail__control--grow { flex: 1; min-width: 12rem; }

            & .goal-detail__row {
                display: flex;
                align-items: center;
                gap: ${d("sm")};
                flex-wrap: wrap;
            }
            & .goal-detail__row.hidden { display: none; }
            /*
             * This select sits in a section drawn on the page, not inside the
             * form panel, so it keeps a raised --surface fill. The recessed
             * --bg fill is only legible against a card.
             */
            & .goal-detail__row .ui-select__trigger { background: ${a("surface")}; }

            /* §4.8: one primary per view. This is it. */
            & .goal-detail__save { ${C(a("radius-sm"),"primary")} }
            & .goal-detail__secondary { ${C()} }

            /* Hides the closed dialog from the DOM entirely for a reader who
               has no such action — see the binding for why. */
            & .goal-detail__dialog.hidden { display: none; }
        }
    `;auth=this.inject(re);router=this.inject(H);goals=this.inject(wt);plans=this.inject($e);stable=this.inject(ke);teachers=this.inject(fe);toasts=this.inject(te);goal=new m(null);resolved=new m(!1);confirmAbandon=new m(!1);shares=new m([]);sharesSeeded=new m(!1);noteRecipients=new m([]);recipientsResolved=new m(!1);teacherPlanTitles=new m(new Map);planTitlesResolved=new m(!1);titleVal=new m("");descVal=new m("");targetVal=new m("");titleTouched=new m(!1);planVal=new m("");horseVal=new m("");today=new m(mt(new Date));viewer=new y(()=>{const e=this.goal.get(),t=this.auth.currentUser.get();return e&&t&&e.studentId===t.id?"owner":"sharedTeacher"});controls=new y(()=>Xa(this.viewer.get()));transitions=new y(()=>Qa(this.goal.get()?.status??"active",this.viewer.get()));targetInvalid=new y(()=>{const e=this.targetVal.get();return e!==""&&pe(e)===null});planLinks=new y(()=>{const e=this.goal.get();if(!e)return[];if(this.viewer.get()==="owner"){const s=this.plans.items.get();return e.planIds.map(i=>s.find(r=>r.id===i)).filter(i=>i!==void 0).map(i=>({id:i.id,title:i.title}))}const t=this.teacherPlanTitles.get();return e.planIds.map(s=>{const i=t.get(s);return i?{id:s,title:i}:null}).filter(s=>s!==null)});belongsToNoPlan=new y(()=>{const e=this.goal.get();return e!==null&&e.planIds.length===0});ownerPlansResolved=new m(!1);planLinksResolved=new y(()=>this.viewer.get()==="owner"?this.ownerPlansResolved.get():this.planTitlesResolved.get());attachable=new y(()=>or(this.plans.items.get(),this.goal.get()?.planIds??[]));planOptions=new y(()=>this.attachable.get().map(e=>({value:e.id,label:e.title})));horseOptions=new y(()=>{const e=this.goal.get(),t=lr(this.stable.items.get(),{horseId:e?.horseId??null,horseName:e?.horseName??null});return[{value:"",label:o("goal.horse.none")},...t.map(s=>({value:s.id,label:s.name}))]});onMount(){this.load()}goalId(){return this.router.route.get().split("/")[2]??""}async load(){const e=this.goalId();if(!e){this.resolved.set(!0);return}const t=await this.goals.loadDetail(e);this.goal.set(t),t&&this.seedForm(t),this.resolved.set(!0);const s=this.auth.currentUser.get();!t||!s||(t.studentId===s.id?(this.plans.load().finally(()=>this.ownerPlansResolved.set(!0)),this.teachers.load(),this.stable.load(),await this.loadShares(t.id)):await Promise.all([this.loadStudent(t.studentId),this.loadTeacherPlanTitles(t.planIds)]))}seedForm(e){this.titleVal.set(e.title),this.descVal.set(e.description??""),this.targetVal.set(e.targetDate??""),this.horseVal.set(e.horseId??""),this.titleTouched.set(!1)}async loadShares(e){const t=await v.goals.listShares({id:e}).catch(()=>null);this.shares.set(t??[]),this.noteRecipients.set((t??[]).map(s=>({id:s.teacherId,name:s.displayName}))),this.sharesSeeded.set(!0),this.recipientsResolved.set(!0)}async loadStudent(e){const t=await v.students.get({id:e}).catch(()=>null);this.noteRecipients.set(t?[{id:t.id,name:t.displayName}]:[]),this.recipientsResolved.set(!0)}async loadTeacherPlanTitles(e){const t=await Promise.allSettled(e.map(i=>v.plans.get({id:i}))),s=new Map;for(const i of t)i.status==="fulfilled"&&s.set(i.value.id,i.value.title);this.teacherPlanTitles.set(s),this.planTitlesResolved.set(!0)}render(){const e=this.wire(gc,{back:{onclick:t=>{t.preventDefault(),this.router.navigate(this.backHref())},href:()=>this.backHref(),textContent:()=>o("goal.back")},loading:{textContent:()=>o("goal.loading"),className:()=>this.resolved.get()?"goal-detail__loading hidden":"goal-detail__loading"},body:{className:()=>this.goal.get()?"goal-detail__body":"goal-detail__body hidden"},conflict:{className:()=>Ks(this.goals.error.get())?"goal-detail__conflict":"goal-detail__conflict hidden"},conflictText:{textContent:()=>o("goal.conflict.message")},conflictRetry:{textContent:()=>o("goal.conflict.action"),onclick:()=>{this.load()}},abandonedNotice:{textContent:()=>o("goal.abandoned.notice"),className:()=>this.goal.get()?.status==="abandoned"?"goal-detail__notice":"goal-detail__notice hidden"},readSection:{className:()=>this.controls.get().editDetails?"goal-detail__section hidden":"goal-detail__section"},descHeading:{textContent:()=>o("goal.section.description")},descRead:{textContent:()=>this.goal.get()?.description??"",className:()=>this.goal.get()?.description?"goal-detail__prose":"goal-detail__prose hidden"},descEmpty:{textContent:()=>o("goal.description.empty"),className:()=>this.goal.get()?.description?"goal-detail__muted hidden":"goal-detail__muted"},editSection:{className:()=>this.controls.get().editDetails?"goal-detail__section":"goal-detail__section hidden"},editHeading:{textContent:()=>o("goal.section.details")},titleLabel:{textContent:()=>o("goal.field.title")},titleInput:{value:()=>this.titleVal.get(),"aria-invalid":()=>String(this.titleTouched.get()&&this.titleVal.get().trim()===""),oninput:t=>this.titleVal.set(t.target.value)},titleError:{textContent:()=>this.titleTouched.get()&&this.titleVal.get().trim()===""?o("goal.error.title"):""},descLabel:{textContent:()=>o("goal.field.description")},descInput:{value:()=>this.descVal.get(),oninput:t=>this.descVal.set(t.target.value)},targetLabel:{textContent:()=>o("goal.field.target")},targetInput:{value:()=>this.targetVal.get(),"aria-invalid":()=>String(this.targetInvalid.get()),oninput:t=>this.targetVal.set(t.target.value)},targetError:{textContent:()=>this.targetInvalid.get()?o("goal.error.target"):""},horseField:{className:()=>this.horseOptions.get().length<=1?"goal-detail__field hidden":"goal-detail__field"},horseLabel:{textContent:()=>o("goal.field.horse")},save:{textContent:()=>o("goal.save"),disabled:()=>this.goals.loading.get()||this.targetInvalid.get()},saveError:{textContent:()=>this.goals.error.get()&&!Ks(this.goals.error.get())?o("goal.saveError"):""},editForm:{onsubmit:t=>{this.save(t)}},plansSection:{className:()=>"goal-detail__section"},plansHeading:{textContent:()=>o("goal.section.plans")},plansEmpty:{textContent:()=>o("goal.plans.empty"),className:()=>this.belongsToNoPlan.get()?"goal-detail__muted":"goal-detail__muted hidden"},planAttach:{className:()=>this.controls.get().managePlans&&this.attachable.get().length>0?"goal-detail__row":"goal-detail__row hidden"},attachPlan:{textContent:()=>o("goal.plans.attach"),disabled:()=>this.planVal.get()===""||this.goals.loading.get(),onclick:()=>{this.attachPlan()}},plansNone:{textContent:()=>o("goal.plans.none"),className:()=>this.controls.get().managePlans&&this.attachable.get().length===0?"goal-detail__hint":"goal-detail__hint hidden"},sharingSection:{className:()=>this.controls.get().seeCoWatchers?"goal-detail__section":"goal-detail__section hidden"},sharingHeading:{textContent:()=>o("goal.section.sharing")},sharingHint:{textContent:()=>o("goal.sharing.hint"),className:()=>this.teachers.items.get().length===0?"goal-detail__hint hidden":"goal-detail__hint"},sharingLoading:{textContent:()=>o("goal.sharing.loading"),className:()=>this.sharesSeeded.get()?"goal-detail__muted hidden":"goal-detail__muted"},sharingList:{className:()=>this.sharesSeeded.get()&&this.teachers.items.get().length>0?"goal-detail__checks":"goal-detail__checks hidden"},sharingNone:{textContent:()=>o("goal.sharing.none"),className:()=>this.sharesSeeded.get()&&this.teachers.items.get().length===0?"goal-detail__muted":"goal-detail__muted hidden"},confirmAbandonHost:{className:()=>this.transitions.get().abandon?"goal-detail__dialog":"goal-detail__dialog hidden"}});return this.buildNotFound(this.ref(e,"notFoundHost")),this.buildHeader(this.ref(e,"headerHost")),this.buildPlanLinks(this.ref(e,"plansList")),this.buildSharing(this.ref(e,"sharingList")),this.spawn(R,this.ref(e,"horseHost"),{value:this.horseVal,options:this.horseOptions}),this.spawn(R,this.ref(e,"planHost"),{value:this.planVal,options:this.planOptions,placeholder:o("goal.plans.placeholder")}),this.track(w(()=>{const t=this.planOptions.get(),s=this.planVal.get();s&&!t.some(i=>i.value===s)&&this.planVal.set("")})),this.spawn(ne,this.ref(e,"confirmAbandonHost"),{open:this.confirmAbandon,title:o("goal.confirm.abandon.title"),message:()=>o("goal.confirm.abandon.message"),confirmLabel:o("goal.action.abandon"),cancelLabel:o("goal.confirm.dismiss"),danger:!0,onconfirm:()=>{this.abandon()}}),ms(this.ref(e,"notesHost"),()=>{const t=this.goal.get();if(!t||!this.recipientsResolved.get())return null;const s=t.studentId;return{parentKind:"goal",parentId:t.id,context:()=>this.goalContext(),recipients:()=>this.noteRecipients.get(),roleOf:i=>i.authorId===s?"student":"teacher"}},t=>this.track(t)),e}backHref(){const e=this.goal.get();return e&&this.viewer.get()==="sharedTeacher"?`/students/${e.studentId}`:"/mal"}goalContext(){return[o("objectKind.goal"),this.goal.get()?.title??""].filter(Boolean).join(" · ")}buildHeader(e){this.spawn(xt,e,{eyebrow:()=>o("objectKind.goal"),title:()=>this.goal.get()?.title??"",status:()=>{const t=this.goal.get();if(!t)return null;const s=ft(t.status);return{label:s.label,variant:s.variant,tone:s.tone,...s.glyph===void 0?{}:{glyph:s.glyph}}},chips:()=>this.planLinks.get().map(t=>({label:o("goal.chip.plan",{title:t.title}),href:`/planer/${t.id}`})),meta:()=>{const t=this.goal.get();return t?[t.horseName?o("goal.meta.horse",{name:t.horseName}):null,Ee(t.targetDate),ns(t,this.today.get())?o("goal.overdue"):null,Ja(t.achievedAt)].filter(Boolean).join(" · "):""},primaryAction:()=>this.transitions.get().achieve?{label:o("goal.action.achieve"),onclick:()=>{this.achieve()}}:null,secondaryActions:()=>this.transitions.get().reopen?[{label:o("goal.action.reopen"),onclick:()=>{this.reopen()}}]:[],overflowActions:()=>this.transitions.get().abandon?[{label:o("goal.action.abandon"),onclick:()=>this.confirmAbandon.set(!0)}]:[]})}buildNotFound(e){let t=null;this.track(w(()=>{const s=this.resolved.get()&&!this.goal.get();t?.destroy(),t=null,e.replaceChildren(),s&&(t=j(()=>{const i=new U({heading:()=>o("goal.notFound.heading"),body:()=>o("goal.notFound.body"),action:{label:()=>o("goal.notFound.action"),onclick:()=>this.router.navigate("/mal")},headingLevel:1});return i.mount(e),i}))})),this.track(()=>t?.destroy())}buildPlanLinks(e){this.track(w(()=>{const t=this.planLinks.get(),s=this.controls.get();e.replaceChildren();for(const i of t){const r=document.createElement("li"),l=document.createElement("div");l.className="goal-detail__item";const c=`/planer/${i.id}`,h=document.createElement("a");if(h.className="goal-detail__item-link",h.href=c,h.textContent=i.title,h.addEventListener("click",u=>{u.preventDefault(),this.router.navigate(c)}),l.appendChild(h),s.managePlans){const u=document.createElement("button");u.type="button",u.className="goal-detail__detach",u.textContent=o("goal.plans.detach"),u.addEventListener("click",()=>{this.detachPlan(i)}),l.appendChild(u)}r.appendChild(l),e.appendChild(r)}}))}buildSharing(e){this.track(w(()=>{const t=this.teachers.items.get(),s=this.shares.get().map(r=>r.teacherId),i=this.sharesSeeded.get();e.replaceChildren();for(const r of t){const l=document.createElement("li"),c=document.createElement("label");c.className="goal-detail__check";const h=document.createElement("input");h.type="checkbox",h.checked=s.includes(r.id),h.addEventListener("change",()=>{this.toggleShare(r.id,h)}),c.appendChild(h);const u=document.createElement("span");u.textContent=r.displayName,c.appendChild(u),l.appendChild(c),e.appendChild(l)}for(const r of e.querySelectorAll("input"))r.disabled=!i}))}async toggleShare(e,t){const s=this.goal.get()?.id,i=this.shares.get().map(c=>c.teacherId),r=t.checked;if(!s||!rr({seeded:this.sharesSeeded.get(),teacherId:e,next:r,stored:i})){t.checked=i.includes(e);return}if(!(r?await this.goals.share(s,e):await this.goals.unshare(s,e))){t.checked=i.includes(e),this.toasts.show({message:o("goal.sharing.error"),variant:"error"});return}await this.loadShares(s),this.toasts.show({message:o("goal.sharing.saved")})}async save(e){e.preventDefault();const t=this.titleVal.get().trim();this.titleTouched.set(!0),!(!t||this.targetInvalid.get()||!await this.goals.update(this.goalId(),{title:t,description:this.descVal.get().trim()||null,targetDate:this.targetVal.get()||null,horseId:this.horseVal.get()||null}))&&(this.toasts.show({message:o("goal.saved"),variant:"success"}),await this.load())}async attachPlan(){const e=this.goal.get()?.id,t=this.planVal.get(),s=this.attachable.get().find(r=>r.id===t);!e||!s||!Ws({seeded:this.planLinksResolved.get(),planId:t,next:!0,stored:this.goal.get()?.planIds??[]})||!await this.goals.attachPlan(e,t)||(this.planVal.set(""),this.toasts.show({message:o("goal.toast.planAttached",{title:s.title})}),await this.load())}async detachPlan(e){const t=this.goal.get()?.id;!t||!Ws({seeded:this.planLinksResolved.get(),planId:e.id,next:!1,stored:this.goal.get()?.planIds??[]})||!await this.goals.detachPlan(t,e.id)||(this.toasts.show({message:o("goal.toast.planDetached",{title:e.title})}),await this.load())}async achieve(){await this.goals.achieve(this.goalId())&&(this.toasts.show({message:o("goal.toast.achieved"),variant:"success"}),await this.load())}async reopen(){await this.goals.reopen(this.goalId())&&(this.toasts.show({message:o("goal.toast.reopened")}),await this.load())}async abandon(){await this.goals.abandon(this.goalId())&&(this.toasts.show({message:o("goal.toast.abandoned")}),await this.load())}}const bc=T('<div bind="host"></div>');class _c extends E{router=this.inject(H);key=new y(()=>{const e=this.router.route.get();return e==="/mal"?"list":e==="/mal/nytt"?"create":"detail"});render(){const e=this.wire(bc,{});return this.$swap(this.ref(e,"host"),this.key,{list:uc,create:mc,detail:fc}),e}}class vc{loading=new m(!1);error=new m(null);async changePassword(e){return await $(this.loading,this.error,()=>v.account.changePassword(e))!==void 0}}const Si=8,yc=200;function xc(n){const e={};return n.currentPassword===""&&(e.currentPassword="account.error.currentPasswordRequired"),n.newPassword===""?e.newPassword="account.error.newPasswordRequired":n.newPassword.length<Si?e.newPassword="account.error.newPasswordTooShort":n.newPassword.length>yc?e.newPassword="account.error.newPasswordTooLong":n.newPassword===n.currentPassword&&(e.newPassword="account.error.newPasswordSameAsCurrent"),n.confirmPassword!==n.newPassword&&(e.confirmPassword="account.error.confirmMismatch"),e}function wc(n){return Object.keys(n).length===0}function kc(n){switch(n.code){case"conflict":return"account.error.currentPasswordWrong";case"validation":return"account.error.validation";case"rateLimit":return"account.error.rateLimit";case"auth":return"account.error.auth";case"network":case"timeout":return"account.error.network";default:return"account.error.server"}}function Ht(n){return n===void 0?"":o(n)}const $c=T(`
    <section class="account" bind="root">
        <h1 class="account__title" bind="title"></h1>
        <p class="account__lede" bind="lede"></p>

        <section class="account__panel">
            <h2 class="account__heading" bind="accountHeading"></h2>
            <div class="account__row">
                <span class="account__row-label" bind="emailLabel"></span>
                <span class="account__row-value" bind="emailValue"></span>
            </div>
        </section>

        <form class="account__panel account__form" bind="form" novalidate>
            <h2 class="account__heading" bind="passwordHeading"></h2>
            <p class="account__panel-lede" bind="passwordLede"></p>

            <p class="account__alert" bind="alert" role="alert"></p>

            <div class="account__field" bind="currentPasswordField">
                <label class="account__label" for="acct-current" bind="currentPasswordLabel"></label>
                <input class="account__input" bind="currentPassword" id="acct-current" type="password"
                    autocomplete="current-password"
                    aria-describedby="acct-current-hint acct-current-error" />
                <p class="account__hint" bind="currentPasswordHint" id="acct-current-hint"></p>
                <p class="account__error" bind="currentPasswordError" id="acct-current-error"></p>
            </div>

            <div class="account__field" bind="newPasswordField">
                <label class="account__label" for="acct-new" bind="newPasswordLabel"></label>
                <input class="account__input" bind="newPassword" id="acct-new" type="password"
                    autocomplete="new-password"
                    aria-describedby="acct-new-hint acct-new-error" />
                <p class="account__hint" bind="newPasswordHint" id="acct-new-hint"></p>
                <p class="account__error" bind="newPasswordError" id="acct-new-error"></p>
            </div>

            <div class="account__field" bind="confirmPasswordField">
                <label class="account__label" for="acct-confirm" bind="confirmPasswordLabel"></label>
                <input class="account__input" bind="confirmPassword" id="acct-confirm" type="password"
                    autocomplete="new-password"
                    aria-describedby="acct-confirm-hint acct-confirm-error" />
                <p class="account__hint" bind="confirmPasswordHint" id="acct-confirm-hint"></p>
                <p class="account__error" bind="confirmPasswordError" id="acct-confirm-error"></p>
            </div>

            <button class="account__submit" type="submit" bind="submit"></button>
        </form>
    </section>
`),Ot=["currentPassword","newPassword","confirmPassword"];class Cc extends E{static styles=`
        .account {
            display: flex;
            flex-direction: column;
            gap: ${d("lg")};
            max-width: 34rem;
            font-family: ${a("font-ui")};

            /* Saving freezes the form without clearing it, same as the auth
               views: the values are what the reader would have to retype. */
            &[inert] { opacity: 0.6; }

            /* Lora 500 only (UI_DECISIONS §3). */
            & .account__title {
                margin: 0;
                font-family: ${a("font-display")};
                font-weight: 500;
                font-size: 1.75rem;
                line-height: 36px;
                color: ${a("text")};
            }

            & .account__lede {
                margin: 0;
                font-size: 14px;
                line-height: 22px;
                color: ${a("text-muted")};
            }

            /*
             * Both blocks are panels, and the form has to be: the §4.8 field
             * recipe fills with --bg — the page-paper colour — so a field
             * rendered straight onto the route would be the same colour as
             * everything behind it. The panel is what the recessed fill is
             * recessed INTO.
             */
            & .account__panel {
                ${Q()}
                box-sizing: border-box;
                padding: ${d("xl")};
                display: flex;
                flex-direction: column;
                gap: ${d("lg")};
            }

            & .account__heading {
                margin: 0;
                font-family: ${a("font-display")};
                font-weight: 500;
                font-size: 1.25rem;
                line-height: 28px;
                color: ${a("text")};
            }

            & .account__panel-lede {
                margin: 0;
                font-size: 14px;
                line-height: 22px;
                color: ${a("text-muted")};
            }

            /* Read-only fact, not a disabled field: a greyed-out input would
               invite a click that does nothing. */
            & .account__row {
                display: flex;
                flex-direction: column;
                gap: ${d("xs")};
            }
            & .account__row-label {
                font-size: 0.8125rem;
                font-weight: 600;
                color: ${a("text-muted")};
            }
            & .account__row-value {
                font-size: 15px;
                line-height: 24px;
                color: ${a("text")};
                overflow-wrap: anywhere;
            }

            /*
             * Form-level failure — the wrong-current-password conflict included.
             * Body text stays --text rather than --danger: a full sentence in
             * the danger colour on the danger tint is the weakest contrast
             * pairing the palette can produce, and the border plus the tint
             * already carry the signal.
             */
            & .account__alert {
                display: none;
                margin: 0;
                padding: ${d("md")};
                border: 1px solid ${a("danger")};
                border-radius: ${a("radius-sm")};
                background: ${a("danger-soft")};
                font-size: 14px;
                line-height: 22px;
                color: ${a("text")};
            }
            & .account__alert.is-shown { display: block; }

            & .account__field {
                display: flex;
                flex-direction: column;
                gap: ${d("xs")};
            }

            & .account__label { ${ts()} }

            & .account__input {
                ${K()}
                box-sizing: border-box;
                width: 100%;
                /* 44px of hit target, and 16px so iOS Safari does not zoom. */
                min-height: 44px;
                padding: ${d("sm")} ${d("md")};
                font-size: 16px;
                line-height: 24px;
            }
            /* Invalid is never carried by colour alone — the field also names
               its problem below it, tied to it by aria-describedby. */
            & .account__input[aria-invalid='true'] {
                border-color: ${a("danger")};
            }

            & .account__hint {
                margin: 0;
                font-size: 13px;
                line-height: 20px;
                color: ${a("text-muted")};
            }

            & .account__error {
                ${Hn()}
                display: none;
            }
            & .account__error.is-shown { display: block; }
            /* Once a field states its problem, its hint is redundant noise. */
            & .account__field.is-invalid .account__hint { display: none; }

            /* §4.8: at most one primary button on the page. This is it — there
               is no Avbryt, because there is nothing to cancel out of. */
            & .account__submit {
                ${C(a("radius-sm"),"primary")}
                align-self: flex-start;
                min-height: 44px;
                padding: ${d("sm")} ${d("lg")};
                font-size: 15px;
                line-height: 24px;
            }

            @media (max-width: 639px) {
                & .account__title { font-size: 1.375rem; line-height: 30px; }
                & .account__panel { padding: ${d("lg")}; }
                & .account__submit { align-self: stretch; }
            }
        }
    `;svc=this.inject(vc);auth=this.inject(re);toasts=this.inject(te);constructor(){super(),this.svc.error.set(null),this.svc.loading.set(!1)}values={currentPassword:new m(""),newPassword:new m(""),confirmPassword:new m("")};fieldErrors=new m({});submitted=!1;inputs={};render(){const e=this.wire($c,{root:{inert:()=>this.svc.loading.get()},title:{textContent:()=>o("account.title")},lede:{textContent:()=>o("account.lede")},accountHeading:{textContent:()=>o("account.section.account")},emailLabel:{textContent:()=>o("account.field.email")},emailValue:{textContent:()=>this.auth.currentUser.get()?.username??""},passwordHeading:{textContent:()=>o("account.password.title")},passwordLede:{textContent:()=>o("account.password.lede")},alert:{className:()=>this.svc.error.get()?"account__alert is-shown":"account__alert",textContent:()=>{const t=this.svc.error.get();return t?o(kc(t)):""}},form:{onsubmit:t=>{this.onSubmit(t)}},currentPasswordLabel:{textContent:()=>o("account.field.currentPassword")},currentPasswordHint:{textContent:()=>o("account.hint.currentPassword")},currentPasswordField:{className:()=>this.fieldClass("currentPassword")},currentPassword:this.fieldBinding("currentPassword"),currentPasswordError:{className:()=>this.errorClass("currentPassword"),textContent:()=>Ht(this.fieldErrors.get().currentPassword)},newPasswordLabel:{textContent:()=>o("account.field.newPassword")},newPasswordHint:{textContent:()=>o("account.hint.newPassword")},newPasswordField:{className:()=>this.fieldClass("newPassword")},newPassword:{minLength:Si,...this.fieldBinding("newPassword")},newPasswordError:{className:()=>this.errorClass("newPassword"),textContent:()=>Ht(this.fieldErrors.get().newPassword)},confirmPasswordLabel:{textContent:()=>o("account.field.confirmPassword")},confirmPasswordHint:{textContent:()=>o("account.hint.confirmPassword")},confirmPasswordField:{className:()=>this.fieldClass("confirmPassword")},confirmPassword:this.fieldBinding("confirmPassword"),confirmPasswordError:{className:()=>this.errorClass("confirmPassword"),textContent:()=>Ht(this.fieldErrors.get().confirmPassword)},submit:{textContent:()=>this.svc.loading.get()?o("account.password.submitting"):o("account.password.submit")}});for(const t of Ot)this.inputs[t]=this.ref(e,t);return e}fieldBinding(e){return{value:()=>this.values[e].get(),"aria-invalid":()=>String(this.fieldErrors.get()[e]!==void 0),oninput:t=>{this.values[e].set(t.target.value),this.revalidate()}}}fieldClass(e){return this.fieldErrors.get()[e]?"account__field is-invalid":"account__field"}errorClass(e){return this.fieldErrors.get()[e]?"account__error is-shown":"account__error"}revalidate(){this.submitted&&this.fieldErrors.set(this.validate())}validate(){return xc({currentPassword:this.values.currentPassword.get(),newPassword:this.values.newPassword.get(),confirmPassword:this.values.confirmPassword.get()})}async onSubmit(e){e.preventDefault(),this.submitted=!0,this.svc.error.set(null);const t=this.validate();if(this.fieldErrors.set(t),!wc(t)){this.inputs[Ot.find(i=>t[i])]?.focus();return}if(await this.svc.changePassword({currentPassword:this.values.currentPassword.get(),newPassword:this.values.newPassword.get()})){this.submitted=!1;for(const i of Ot)this.values[i].set("");this.fieldErrors.set({}),this.toasts.show({message:o("account.password.saved"),variant:"success"})}}}function Se(n){if(!/^\d{4}-\d{2}-\d{2}$/.test(n)||!Number.isFinite(Date.parse(n+"T12:00:00Z"))||new Date(n+"T12:00:00Z").toISOString().slice(0,10)!==n)throw new Error("invalid_date");return n}function Y(n,e){const t=new Date(Se(n)+"T12:00:00Z");return t.setUTCDate(t.getUTCDate()+e),t.toISOString().slice(0,10)}function _e(n){const e=new Date(Se(n)+"T12:00:00Z").getUTCDay();return Y(n,-((e+6)%7))}function Sc(n){const e=new Date(Y(_e(n),3)+"T12:00:00Z"),t=e.getUTCFullYear(),s=new Date(Date.UTC(t,0,1,12));return{year:t,week:Math.floor((e.getTime()-s.getTime())/864e5/7)+1}}function Ae(n="Europe/Stockholm",e=new Date){const t=new Intl.DateTimeFormat("en-CA",{timeZone:n,year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(e),s=i=>t.find(r=>r.type===i).value;return`${s("year")}-${s("month")}-${s("day")}`}function Ei(n,e,t){if(Se(n),!/^([01]\d|2[0-3]):[0-5]\d$/.test(e))throw new Error("invalid_time");const s=new Intl.DateTimeFormat("en-CA",{timeZone:t,year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hourCycle:"h23"}),i=u=>{const p=s.formatToParts(u),b=_=>p.find(k=>k.type===_).value;return`${b("year")}-${b("month")}-${b("day")}T${b("hour")}:${b("minute")}`},r=`${n}T${e}`,l=Date.parse(r+":00Z"),c=new Set;for(let u=-36;u<=36;u+=6){const p=l+u*36e5;c.add((Date.parse(i(p)+":00Z")-p)/6e4)}const h=[...c].filter(u=>i(l-u*6e4)===r);if(!h.length)throw new Error("nonexistent_time");return h.sort((u,p)=>p-u)}function fn(n,e,t,s){const i=Ei(n,e,t);if(s!=null&&!i.includes(s))throw new Error("invalid_offset");if(i.length>1&&s==null)throw new Error("ambiguous_time");return new Date(Date.parse(`${n}T${e}:00Z`)-(s??i[0])*6e4).toISOString()}function it(n){if(n instanceof ye){if(n.status===401)return"schedule.error.session";if(n.status===404)return"schedule.error.not_found";if(n.status===403)return"schedule.error.forbidden";if(n.status===400)return"schedule.error.validation";if(["version_conflict","horse_inactive","member_inactive","type_inactive","invalid_date","invalid_time","nonexistent_time","ambiguous_time","invalid_offset","last_admin","invitation_pending","invitation_expired","already_assigned","catalog_unavailable","training_student_required","training_already_linked","invalid_targets","source_changed","request_conflict","monday_required","invalid_duration","activity_cancelled","invalid_scope","type_in_use","empty_day_template"].includes(n.message))return"schedule.error."+n.message}return"schedule.error.generic"}class Ec{stables=new m([]);week=new m(null);detail=new m(null);log=new m(null);loading=new m(!1);loaded=new m(!1);error=new m(null);saving=new m(!1);writeError=new m(null);readGeneration=0;account="";bindAccount(e){e!==this.account&&(this.account=e,this.readGeneration++,this.stables.set([]),this.week.set(null),this.detail.set(null),this.log.set(null),this.loaded.set(!1),this.error.set(null),this.writeError.set(null),this.loading.set(!1),this.saving.set(!1))}async loadStables(){const e=this.account;this.loading.set(!0),this.error.set(null);try{const t=await v.stables.list();e===this.account&&(this.stables.set(t),this.loaded.set(!0))}catch(t){e===this.account&&this.error.set(it(t))}finally{e===this.account&&(this.loaded.set(!0),this.loading.set(!1))}}async loadWeek(e,t){const s=++this.readGeneration;this.loading.set(!0),this.error.set(null),this.week.get()?.stable.id!==e&&this.week.set(null);try{const i=await v.stableActivities.week({stableId:e,startDate:t});if(s!==this.readGeneration)return;this.week.set(i),this.detail.set(i.stable)}catch(i){s===this.readGeneration&&this.readError(i)}finally{s===this.readGeneration&&this.loading.set(!1)}}async loadLog(e,t,s,i,r=!1){const l=++this.readGeneration;this.loading.set(!0),this.error.set(null),r||this.log.set(null);try{const[c,h]=await Promise.all([v.stables.detail({stableId:e}),v.stableActivities.log({stableId:e,horseId:t,from:s||void 0,to:i||void 0,cursor:r?this.log.get()?.nextCursor??void 0:void 0})]);if(l!==this.readGeneration)return;this.detail.set(c),this.log.set(r?{...h,items:[...this.log.get()?.items??[],...h.items]}:h)}catch(c){l===this.readGeneration&&this.readError(c)}finally{l===this.readGeneration&&this.loading.set(!1)}}async write(e){if(this.saving.get())return;const t=this.account;this.saving.set(!0),this.writeError.set(null);try{const s=await e();return t===this.account?s:void 0}catch(s){t===this.account&&this.writeError.set(it(s));return}finally{t===this.account&&this.saving.set(!1)}}readError(e){const t=it(e);this.error.set(t),["schedule.error.session","schedule.error.not_found","schedule.error.forbidden"].includes(t)&&(this.week.set(null),this.detail.set(null),this.log.set(null))}merge(e){const t=this.week.get();if(t?.stable.id===e.stableId){const s=t.activities.filter(i=>i.id!==e.id);e.date>=t.startDate&&e.date<Y(t.startDate,7)&&s.push(e),this.week.set({...t,activities:s,total:s.length,completed:s.filter(i=>i.status==="completed").length,unassigned:s.filter(i=>i.status!=="cancelled"&&!i.assigneeIds.length).length})}}}const Xt={scope:"all",mine:!1,status:"all",unassigned:!1},fs="teacher-student:schedule:";function Ic(n,e,t){return n.filter(s=>(e.scope==="all"||e.scope==="stable"&&!s.horseId||e.scope==="horses"&&!!s.horseId||e.scope==="horse:"+s.horseId)&&(!e.mine||s.assigneeIds.includes(t))&&(!e.unassigned||!s.assigneeIds.length&&s.status!=="cancelled")&&(e.status==="all"||s.status===(e.status==="remaining"?"planned":"completed")))}function Tc(n,e,t){return t.scope==="stable"?[]:n.filter(s=>{if(t.scope.startsWith("horse:"))return t.scope==="horse:"+s.id;const i=e.some(r=>r.horseId===s.id);return t.mine||t.unassigned||t.status!=="all"?i:s.active||i})}function bs(){try{return globalThis.sessionStorage}catch{return}}function bn(n,e,t,s,i=bs()){const r={filters:{...Xt},startDate:s,dayIndex:0};try{const l=JSON.parse(i?.getItem(fs+n+":"+e)??"null");if(l?.version!==1)return r;const c=l.filters,h=["all","stable","horses"].includes(c?.scope)||t.some(p=>c?.scope==="horse:"+p)?c.scope:"all";let u=s;try{_e(Se(l.startDate))===l.startDate&&(u=l.startDate)}catch{}return{startDate:u,dayIndex:Number.isInteger(l.dayIndex)&&l.dayIndex>=0&&l.dayIndex<=6?l.dayIndex:0,filters:{scope:h,mine:c?.mine===!0,unassigned:c?.unassigned===!0,status:["all","remaining","completed"].includes(c?.status)?c.status:"all"}}}catch{return r}}function Nc(n,e,t,s=bs()){try{s?.setItem(fs+n+":"+e,JSON.stringify({version:1,...t}))}catch{}}function Lc(){try{const n=bs();if(!n)return;Array.from({length:n.length},(t,s)=>n.key(s)).filter(t=>!!t?.startsWith(fs)).forEach(t=>n.removeItem(t))}catch{}}function Ac(n){return n.trim().split(/\s+/).slice(0,2).map(e=>e[0]??"").join("").toLocaleUpperCase()}function zt(n,e){return(n.time||"99:99").localeCompare(e.time||"99:99")||n.id.localeCompare(e.id)}function f(n){return String(n??"").replace(/[&<>"']/g,e=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[e])}const g=(n,e)=>o("schedule."+n,e);function at(n,e){const t=new Intl.DateTimeFormat("en-CA",{timeZone:e,year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).formatToParts(new Date(n)),s=i=>t.find(r=>r.type===i).value;return`${s("year")}-${s("month")}-${s("day")}T${s("hour")}:${s("minute")}`}function jt(n,e){const t=Date.parse(n);return Math.round((Date.parse(at(n,e)+":00Z")-Math.floor(t/6e4)*6e4)/6e4)}function X(n,e,t,s="text",i=""){return`<label class="schedule-field"><span>${f(e)}</span><input name="${n}" aria-label="${f(e)}" type="${s}" value="${f(t)}" ${i}></label>`}function ut(n,e,t,s=!1){return`<label class="schedule-field"><span>${f(e)}</span><textarea name="${n}" aria-label="${f(e)}" maxlength="5000" ${s?"disabled":""}>${f(t)}</textarea></label>`}function ae(n,e,t,s,i=""){return`<label class="schedule-field"><span>${f(e)}</span><select name="${n}" aria-label="${f(e)}" ${i}>${s.map(r=>`<option value="${f(r.value)}" ${t===r.value?"selected":""}>${f(r.label)}</option>`).join("")}</select></label>`}function ve(n,e,t,s,i=!1){return`<fieldset class="schedule-checks" ${i?"disabled":""}><legend>${f(e)}</legend><div>${s.map(r=>`<label class="schedule-check"><input type="checkbox" name="${n}" value="${f(r.value)}" ${t.includes(r.value)?"checked":""}>${f(r.label)}</label>`).join("")}</div></fieldset>`}function Qt(n,e,t,s,i){let r=[];try{e&&t&&(r=Ei(e,t,s))}catch{return""}return r.length<2?"":ae(n,g("overlap"),i===null?"":String(i),[{value:"",label:g("choose")},...r.map((l,c)=>({value:String(l),label:`${g(c===0?"first_time":"second_time")} (UTC${l>=0?"+":"-"}${String(Math.floor(Math.abs(l)/60)).padStart(2,"0")}:${String(Math.abs(l)%60).padStart(2,"0")})`}))],"required")}function Pc(n,e,t){const s=n.map(i=>({value:i.id,label:i.name}));return`
        <h3>${f(g("create_day_template"))}</h3>
        <form data-form="save-day-template">
            <div class="schedule-fieldrow">
                ${X("sourceDate",g("template_source_date"),e,"date","required")}
                ${X("name",g("template_name"),"","text",'required maxlength="200"')}
            </div>
            <p class="schedule-dialog-hint">${f(g("day_template_description"))}</p>
            <button type="submit" class="schedule-button">${f(g("save_day_template"))}</button>
        </form>
        ${n.length?`
            <h3>${f(g("use_day_template",{date:t}))}</h3>
            <form data-form="apply-day-template">
                ${ae("templateId",g("choose_day_template"),n[0].id,n.map(i=>({value:i.id,label:i.name+" · "+i.count+" "+g("activities")})))}
                <label class="schedule-check"><input type="checkbox" name="keepAssignees" checked>${f(g("keep_assignees"))}</label>
                <div class="schedule-dialog-footer"><button type="submit" class="schedule-button">${f(g("apply_day_template"))}</button></div>
            </form>
            <h3>${f(g("default_day_template"))}</h3>
            <form data-form="default-day-template">
                ${ae("defaultTemplateId",g("default_template_label"),n.find(i=>i.isDefault)?.id??"",[{value:"",label:g("no_default_template")},...s])}
                <p class="schedule-dialog-hint">${f(g("default_template_description"))}</p>
                <button type="submit" class="schedule-button">${f(g("save_default_template"))}</button>
            </form>
        `:""}
    `}function Dc(n,e,t,s){const i=!n.record||n.record.canEdit,r=i?"":"disabled",l=e.types.find(_=>_.id===n.typeId),c=l?.category==="training",h=e.members.filter(_=>_.active||n.assigneeIds.includes(_.userId)||n.performerIds.includes(_.userId)),u=e.role==="admin"||!i?h:h.filter(_=>_.userId===t),p=l?.scope==="stable"?[{value:"",label:g("whole_stable")}]:[...l?.scope!=="horse"&&(e.role==="admin"||!i)?[{value:"",label:g("whole_stable")}]:[],...e.horses.filter(_=>_.active||_.id===n.horseId).map(_=>({value:_.id,label:_.name}))],b=n.record?.status??(n.completed?"completed":"planned");return`<p class="schedule-dialog-hint">${f(g("shared_with_stable",{name:e.name}))}</p>${n.record?`<p><span class="schedule-state ${b}">${b==="completed"?"✓":""}</span> ${f(g("status."+b))}</p>`:""}${n.record?.horseInactive?`<div class="schedule-dialog-info">${f(g("inactive_horse"))}</div>`:""}
    <form data-form="activity"><div class="schedule-fieldrow">${ae("typeId",g("activity_type"),n.typeId,e.types.filter(_=>(!_.archived||_.id===n.typeId)&&(e.role==="admin"||!i||_.scope!=="stable")).map(_=>({value:_.id,label:_.name})),r)}${ae("horseId",g("applies_to"),n.horseId,p,r)}</div>
    ${X("title",g("name"),n.title,"text",`required maxlength="200" ${r}`)}
    <div class="schedule-fieldrow">${X("date",g("date"),n.date,"date",`required ${r}`)}${X("time",g("time_optional"),n.time,"time",r)}</div>
    ${i?Qt("offsetMinutes",n.date,n.time,e.timeZone,n.offsetMinutes):""}
    <p class="schedule-dialog-hint">${f(e.timeZone)}</p>
    ${ve("assigneeIds",g("assignees"),n.assigneeIds,u.map(_=>({value:_.userId,label:_.displayName+(_.active?"":" · "+g("inactive_member"))})),!i)}
    ${c?ae("trainingStudentId",g("main_performer"),n.trainingStudentId,[{value:"",label:g("unassigned")},...h.filter(_=>n.assigneeIds.includes(_.userId)).map(_=>({value:_.userId,label:_.displayName}))],r):""}
    ${c&&i?`<details class="schedule-program" ${n.record?"":"open"}><summary>${f(g("catalog"))}</summary><p>${f(g("catalog_visibility"))}</p>${s?ve("programIds",g("programs"),n.programIds,s.programs.map(_=>({value:_.id,label:_.title+" · "+_.author})))+ve("exerciseIds",g("exercises"),n.exerciseIds,s.exercises.map(_=>({value:_.id,label:_.name+" · "+_.author}))):`<p>${f(g("loading_catalog"))}</p>`}${n.record?.hasProgram&&!n.record.programs.length?`<p>${f(g("program_restricted"))}</p>`:""}</details>`:""}
    ${n.record?.exercises.length?`<details class="schedule-program"><summary>${f(g("planned_content"))}</summary><ol>${n.record.exercises.map(_=>`<li>${f(_.name)}${_.description?"<p>"+f(_.description)+"</p>":""}${_.notes?"<p>"+f(_.notes)+"</p>":""}</li>`).join("")}</ol></details>`:""}
    ${ut("instruction",g("instruction"),n.instruction,!i)}
    ${ut("resultNote",g("result_note"),n.resultNote,!!n.record&&!n.record.canComplete&&!i)}
    ${n.completed||n.record?.canComplete?`<div class="schedule-fieldrow">${X("performedWall",g("performed_at"),n.performedWall,"datetime-local","required")}${Qt("performedOffset",n.performedWall.slice(0,10),n.performedWall.slice(11,16),e.timeZone,n.performedOffset)}</div>${ve("performerIds",g("actual_performers"),n.performerIds,h.filter(_=>_.active).map(_=>({value:_.userId,label:_.displayName})))}`:""}
    ${n.record?.completedBy?`<p class="schedule-dialog-hint">${f(g("recorded_by",{name:e.members.find(_=>_.userId===n.record.completedBy)?.displayName??g("inactive_member")}))}</p>`:""}
    <div class="schedule-dialog-footer"><button type="button" class="schedule-ghost" data-action="close">${f(g("close"))}</button>${i||n.record?.canComplete?`<button type="submit" class="${n.record?"schedule-button":"schedule-primary"}">${f(g(n.record?"save":n.completed?"save_log":"add_activity"))}</button>`:""}${n.record?.canComplete&&n.record.status!=="completed"&&!n.record.horseInactive?`<button type="button" class="schedule-primary" data-action="complete">✓ ${f(g("complete"))}</button>`:""}${n.record?.canClaim?`<button type="button" class="schedule-primary" data-action="claim">${f(g("claim"))}</button>`:""}</div>
    ${n.record?.canComplete&&n.record.status==="completed"?`<button type="button" class="schedule-ghost" data-action="reopen">${f(g("reopen"))}</button>`:""}
    ${n.record?.canComplete&&n.record.status!=="cancelled"?`<button type="button" class="schedule-danger schedule-small" data-action="cancel">${f(g("cancel_activity"))}</button>`:""}
    ${n.record?.canRegisterTraining&&!n.record.hasTrainingSession?`<button type="button" class="schedule-button" data-action="training">${f(g("register_training"))}</button>`:""}
    ${n.record?.trainingSessionId?`<a class="schedule-log-link" href="#" data-training-link="${f(n.record.trainingSessionId)}">${f(g("open_training"))} ↗</a>`:n.record?.hasTrainingSession?`<p class="schedule-dialog-hint">${f(g("training_private"))}</p>`:""}
    ${n.record?.canEdit?`<details class="schedule-delete"><summary>${f(g("delete_activity"))}</summary>
        <p>${f(g(n.record.hasTrainingSession?"delete_activity_linked":"delete_activity_confirm"))}</p>
        <button type="button" class="schedule-danger schedule-small" data-action="delete-activity">${f(g("confirm_delete_activity"))}</button>
    </details>`:""}
    </form>`}const Hc=`
.schedule { container-type:inline-size; color:${a("text")}; font-family:${a("font-ui")}; min-width:0; }
.schedule * { box-sizing:border-box; }
.schedule [hidden],.schedule-dialog [hidden] { display:none!important; }
.schedule h1,.schedule h2,.schedule-dialog h2 { font-family:${a("font-display")}; font-weight:500; }
.schedule h1 { margin:0; font-size:28px; }
.schedule h2 { margin:0; font-size:20px; }
.schedule button,.schedule select,.schedule-dialog button,.schedule-dialog input,.schedule-dialog select,.schedule-dialog textarea { font-family:${a("font-ui")}; }
.schedule-head { display:flex; align-items:center; justify-content:space-between; gap:16px; flex-wrap:wrap; margin-bottom:22px; }
.schedule-kicker { color:${a("accent")}; font-size:11px; letter-spacing:.13em; text-transform:uppercase; margin:0 0 6px; }
.schedule-description { color:${a("text-muted")}; font-size:13px; margin:6px 0 0; }
.schedule-actions { display:flex; flex-wrap:wrap; align-items:center; gap:8px; }
.schedule-button { ${C()} }
.schedule-primary { ${C(a("radius-sm"),"primary")} }
.schedule-ghost { ${C(a("radius-sm"),"ghost")} }
.schedule-danger { ${C(a("radius-sm"),"danger")} }
.schedule-small { font-size:12px; padding:6px 10px; }
.schedule-icon { ${C(a("radius-sm"),"ghost")} min-width:32px; padding:6px; line-height:20px; }
.schedule-tabs { display:flex; gap:24px; border-bottom:1px solid ${a("border")}; margin-bottom:20px; }
.schedule-tabs a { color:${a("text-muted")}; text-decoration:none; font-size:14px; padding-bottom:12px; border-bottom:2px solid transparent; }
.schedule-tabs a[aria-current=page] { color:${a("accent-strong")}; font-weight:600; border-color:${a("accent")}; }
.schedule-tools { display:flex; align-items:center; gap:12px; flex-wrap:wrap; margin:0 0 18px; }
.schedule-tools small { display:block; font:12px/1.5 ${a("font-ui")}; color:${a("text-muted")}; margin-top:3px; }
.schedule-arrows { display:flex; border:1px solid ${a("border")}; border-radius:4px; background:${a("surface")}; }
.schedule-stats { margin-left:auto; display:flex; align-items:center; flex-wrap:wrap; gap:12px; font-size:12px; color:${a("text-muted")}; }
.schedule-unassigned { ${C(a("radius-sm"),"ghost")} background:${a("warning-soft")}; color:${a("warning")}; font-size:12px; padding:5px 9px; }
.schedule-unassigned[aria-pressed=true] { outline:1px solid ${a("warning")}; outline-offset:2px; }
.schedule-filters { display:flex; align-items:center; flex-wrap:wrap; gap:6px; margin-bottom:18px; }
.schedule-filter { ${C()} background:${a("surface")}; border-color:${a("border")}; font-size:12px; padding:6px 10px; }
.schedule-filter[aria-pressed=true] { background:${a("accent-soft")}; border-color:${a("accent")}; color:${a("accent-strong")}; }
.schedule-filter-gap { flex:1; }
.schedule-status-select { background:transparent; color:${a("text-muted")}; border:0; font-size:12px; padding:7px 0; max-width:180px; }
.schedule-panel { ${Q()} overflow:clip; padding:0; }
.schedule-band { display:flex; align-items:center; justify-content:space-between; gap:10px; background:${a("bg")}; padding:10px 13px; border-bottom:1px solid ${a("border")}; font-size:12px; }
.schedule-band span { color:${a("text-muted")}; font-size:11px; }
.schedule-table { width:100%; table-layout:fixed; border-collapse:collapse; font-size:12px; background:${a("surface")}; }
.schedule-table .schedule-label-col { width:132px; }
.schedule-table th,.schedule-table td { border-bottom:1px solid ${a("border")}; padding:9px 5px; text-align:center; vertical-align:middle; overflow-wrap:anywhere; }
.schedule-table tr:last-child th,.schedule-table tr:last-child td { border-bottom:0; }
.schedule-table th { font-weight:400; color:${a("text-muted")}; }
.schedule-table th:first-child { text-align:left; padding-left:14px; }
.schedule-table tbody th { font-weight:600; color:${a("text")}; }
.schedule-table tbody th small { display:block; font-size:11px; font-weight:400; color:${a("text-muted")}; margin-top:5px; }
.schedule-selected { background:${a("accent-soft")}; }
.schedule-day-head { position:relative; display:flex; align-items:center; justify-content:center; min-height:52px; }
.schedule-day-head>button:first-child { border:0; background:transparent; color:${a("text-muted")}; font-size:11px; padding:3px 9px; }
.schedule-day-head strong { display:block; font:500 23px/1.35 ${a("font-display")}; color:${a("text")}; }
.schedule-selected .schedule-day-head strong { color:${a("accent")}; }
.schedule-copy-day { position:absolute; top:-7px; right:-5px; font-size:12px; padding:1px 3px; min-width:22px; color:${a("text-muted")}; }
.schedule-assignment { border:0; background:transparent; color:${a("text")}; padding:5px 2px; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:6px; width:100%; border-radius:4px; font-size:11px; min-height:50px; }
.schedule-assignment:hover { background:${a("surface-2")}; }
.schedule-assignment.cancelled { text-decoration:line-through; opacity:.7; }
.schedule-assignment.empty { color:${a("text-muted")}; font-size:16px; }
.schedule-avatar-stack { display:inline-flex; padding-left:2px; }
.schedule-avatar { display:inline-flex; align-items:center; justify-content:center; width:25px; height:25px; border-radius:50%; background:${a("surface-2")}; border:1px solid ${a("surface")}; font-size:9px; color:${a("text-muted")}; }
.schedule-avatar-stack .schedule-avatar+.schedule-avatar { margin-left:-5px; }
.schedule-avatar:nth-child(2n) { background:${a("info-soft")}; color:${a("info")}; }
.schedule-avatar.inactive { border-style:dashed; }
.schedule-horse-heading { display:flex; align-items:baseline; justify-content:space-between; gap:12px; margin:28px 0 12px; }
.schedule-horse-heading p { margin:4px 0 0; color:${a("text-muted")}; font-size:12px; }
.schedule-horse-heading>span { color:${a("text-muted")}; font-size:11px; }
.schedule-horse-table td { vertical-align:top; position:relative; border-right:1px solid ${a("border")}; padding:7px 5px 37px; }
.schedule-horse-table td:last-child { border-right:0; }
.schedule-horse-table tbody th { vertical-align:top; padding-top:16px; }
.schedule-horse-name { font:500 19px/1.4 ${a("font-display")}; }
.schedule-log-link { display:inline-block; color:${a("accent")}; font-size:11px; text-decoration:none; margin-top:8px; font-weight:400; }
.schedule-cell { display:flex; flex-direction:column; gap:6px; min-height:100px; }
.schedule-card { border:1px solid ${a("border")}; border-radius:4px; background:${a("surface")}; color:${a("text")}; padding:9px 7px; width:100%; text-align:left; display:flex; flex-direction:column; gap:6px; cursor:pointer; font-size:11px; }
.schedule-card:hover { border-color:${a("accent")}; }
.schedule-card.training { border-left:2px solid ${a("info")}; background:color-mix(in srgb,${a("info-soft")} 35%,${a("surface")}); }
.schedule-card.care,.schedule-card.visit { border-left:2px solid ${a("accent")}; }
.schedule-card.completed { background:color-mix(in srgb,${a("success-soft")} 30%,${a("surface")}); }
.schedule-card.cancelled { border-style:dashed; }
.schedule-card strong { font-size:11px; font-weight:600; }
.schedule-card-time { font-size:11px; color:${a("text-muted")}; font-variant-numeric:tabular-nums; display:flex; align-items:center; gap:5px; }
.schedule-state { width:12px; height:12px; border:1px solid ${a("border-strong")}; border-radius:50%; display:inline-flex; align-items:center; justify-content:center; font:10px/1 ${a("font-ui")}; flex-shrink:0; }
.schedule-state.completed { color:${a("surface")}; background:${a("success")}; border-color:${a("success")}; }
.schedule-state.cancelled { border-style:dashed; }
.schedule-card-people { display:flex; flex-wrap:wrap; gap:4px; align-items:center; color:${a("text-muted")}; font-size:11px; }
.schedule-card-people .schedule-avatar { width:17px; height:17px; font-size:7px; }
.schedule-warning { color:${a("warning")}; font-size:11px; }
.schedule-lane-add { position:absolute; bottom:6px; left:5px; width:calc(100% - 10px); border:0; background:transparent; color:${a("text-muted")}; border-radius:4px; padding:5px; font-size:17px; cursor:pointer; }
.schedule-lane-add:hover { background:${a("surface-2")}; color:${a("accent")}; }
.schedule-legend { display:flex; flex-wrap:wrap; align-items:center; gap:14px; color:${a("text-muted")}; font-size:11px; margin-top:14px; }
.schedule-legend>span { display:flex; align-items:center; gap:5px; }
.schedule-legend>span:last-child { margin-left:auto; }
.schedule-empty { padding:28px 18px; color:${a("text-muted")}; text-align:center; }
.schedule-empty h2 { color:${a("text")}; margin-bottom:8px; }
.schedule-empty p { margin:0 auto 16px; }
.schedule-alert { padding:13px 15px; background:${a("danger-soft")}; color:${a("danger")}; border-radius:4px; margin:14px 0; font-size:13px; }
.schedule-loading { color:${a("text-muted")}; font-size:13px; padding:12px 0; }
.schedule-loading:empty { display:none; }
.schedule-select { ${K()} max-width:300px; }
.schedule-mobile { display:none; }
.schedule-day-strip { display:flex; gap:5px; overflow-x:auto; margin-bottom:18px; padding:3px 0; }
.schedule-day-strip button { border:1px solid ${a("border")}; border-radius:4px; background:${a("surface")}; color:${a("text-muted")}; padding:8px 3px; flex:1; min-width:38px; font-size:11px; }
.schedule-day-strip button[aria-pressed=true] { background:${a("accent-soft")}; color:${a("accent")}; border-color:${a("accent")}; }
.schedule-day-strip strong { display:block; font:500 22px/1.4 ${a("font-display")}; }
.schedule-day-actions { display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:8px 16px; margin:16px 0; }
.schedule-day-actions h3 { font-size:14px; font-weight:600; margin:0; }
.schedule-day-actions small { color:${a("text-muted")}; }
.schedule-mobile-routine { display:grid; grid-template-columns:42px minmax(0,1fr); gap:8px; align-items:start; margin:10px 0; }
.schedule-mobile-routine>span { font-size:11px; color:${a("text-muted")}; padding-top:12px; }
.schedule-mobile .schedule-card { padding:12px; }
.schedule-mobile .schedule-card strong { font-size:13px; }
.schedule-mobile-horse { margin-bottom:13px; }
.schedule-mobile-horse header { display:flex; gap:8px; align-items:center; padding:12px; border-bottom:1px solid ${a("border")}; }
.schedule-mobile-horse header a { margin:0 0 0 auto; }
.schedule-mobile-horse>div { display:grid; gap:8px; padding:10px; }
.schedule-log-controls { display:flex; gap:12px; flex-wrap:wrap; align-items:end; margin:20px 0; }
.schedule-log-entry { border-left:1px solid ${a("border")}; margin-left:5px; padding:0 0 22px 23px; position:relative; }
.schedule-log-entry:before { content:''; position:absolute; left:-5px; top:6px; border-radius:50%; width:9px; height:9px; background:${a("success")}; }
.schedule-log-entry time { font-size:12px; color:${a("text-muted")}; display:block; margin-bottom:7px; }
.schedule-log-entry .schedule-card { padding:16px; }
.schedule-log-entry .schedule-card strong { font-size:14px; }
.schedule-log-entry .schedule-card p { font-size:13px; margin:0; white-space:pre-wrap; }
.schedule-dialog { color:${a("text")}; background:${a("surface")}; font:14px/1.5 ${a("font-ui")}; border:0; border-left:1px solid ${a("border")}; padding:24px; width:min(490px,100vw); max-width:100vw; height:100dvh; max-height:100dvh; margin:0 0 0 auto; inset:0; box-shadow:${a("shadow-3")}; overflow-y:auto; }
.schedule-dialog::backdrop { background:color-mix(in srgb,${a("text")} 25%,transparent); }
.schedule-dialog h2 { font-size:26px; margin:4px 0 8px; }
.schedule-dialog h3 { font-size:15px; margin:24px 0 12px; font-weight:600; }
.schedule-dialog p { margin:0 0 16px; }
.schedule-dialog small { font-size:12px; color:${a("text-muted")}; }
.schedule-dialog-head { display:flex; justify-content:space-between; align-items:center; gap:10px; }
.schedule-dialog form { margin-top:18px; }
.schedule-field { display:flex; flex-direction:column; gap:6px; margin:0 0 16px; }
.schedule-field>span { font-size:12px; font-weight:600; color:${a("text-muted")}; }
.schedule-field input,.schedule-field select,.schedule-field textarea { ${K()} box-sizing:border-box; width:100%; min-width:0; }
.schedule-field textarea { min-height:80px; resize:vertical; line-height:1.6; }
.schedule-fieldrow { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
.schedule-checks { border:0; padding:0; margin:0 0 16px; }
.schedule-checks legend { font-size:12px; font-weight:600; color:${a("text-muted")}; margin-bottom:7px; }
.schedule-checks>div { display:flex; flex-wrap:wrap; gap:7px; }
.schedule-check { display:inline-flex; gap:7px; align-items:center; padding:7px 9px; border:1px solid ${a("border")}; border-radius:4px; font-size:12px; }
.schedule-check:has(input:checked) { border-color:${a("accent")}; background:${a("accent-soft")}; }
.schedule-check input { accent-color:${a("accent")}; }
.schedule-dialog .schedule-alert:empty { display:none; }
.schedule-dialog-footer { display:flex; flex-wrap:wrap; align-items:center; gap:8px; border-top:1px solid ${a("border")}; padding-top:16px; margin-top:20px; }
.schedule-delete { border-top:1px solid ${a("border")}; margin-top:16px; padding:12px 0; }
.schedule-delete summary { cursor:pointer; font-weight:600; }
.schedule-delete p { margin:8px 0 12px; }
.schedule-dialog-hint { font-size:12px; color:${a("text-muted")}; }
.schedule-dialog-info { background:${a("accent-soft")}; padding:12px; border-radius:4px; font-size:12px; margin:14px 0; }
.schedule-program { background:${a("info-soft")}; padding:12px; border-radius:4px; color:${a("info")}; font-size:12px; margin:14px 0; }
.schedule-program li { padding:4px 0; }
.schedule-settings-row { display:flex; gap:8px; align-items:center; flex-wrap:wrap; padding:10px 0; border-bottom:1px solid ${a("border")}; }
.schedule-settings-row>span { flex:1; min-width:90px; }
.schedule-settings-row select { max-width:145px; }
.schedule-option-list { display:flex; flex-direction:column; gap:5px; }
.schedule-option-list .schedule-check { justify-content:flex-start; }
@container (max-width:800px) { .schedule-desktop { display:none; } .schedule-mobile { display:block; } .schedule-stats { width:100%; margin-left:0; } }
@media (max-width:639px) { .schedule-head .schedule-actions { width:100%; justify-content:flex-end; } .schedule-filter-gap { display:none; } .schedule-status-select { margin-left:auto; } .schedule-dialog { padding:22px 16px; } .schedule-field input,.schedule-field select,.schedule-field textarea { font-size:16px; } .schedule-fieldrow { grid-template-columns:minmax(0,1fr) minmax(0,1fr); } }
@media (pointer:coarse) { .schedule-filter,.schedule-icon,.schedule-lane-add,.schedule-check { min-height:44px; } .schedule-day-strip button { min-width:44px; } }
@media (prefers-reduced-motion:reduce) { .schedule *,.schedule-dialog * { scroll-behavior:auto!important; } }
`,Oc=T('<section class="schedule" bind="main"></section><div bind="dialogs"></div>'),_n='<colgroup><col class="schedule-label-col"><col span="7"></colgroup>',V=(n,e,t="schedule-button",s="")=>`<button type="button" class="${t}" data-action="${e}" ${s}>${f(n)}</button>`,et=()=>({save:crypto.randomUUID(),apply:crypto.randomUUID(),routines:crypto.randomUUID()});function vn(n){if(!n)return null;try{return Se(n),Se(Y(_e(n),7)),n}catch{return null}}class Ii extends E{static styles=Hc;router=this.inject(H);auth=this.inject(re);svc=this.inject(Ec);main;dialogs;dialog=null;panel=null;catalog=null;latestActivity=null;accountId="";stableId="";horseId="";logMode=!1;startDate=_e(Ae());dayIndex=0;filters={...Xt};logFrom="";logTo="";routeGeneration=0;disposed=!1;notice="";render(){this.svc.bindAccount(this.auth.currentUser.get()?.id??"");const e=this.wire(Oc,{});return this.main=this.ref(e,"main"),this.dialogs=this.ref(e,"dialogs"),this.main.addEventListener("click",t=>{this.click(t)}),this.main.addEventListener("change",t=>this.changeMain(t)),this.dialogs.addEventListener("click",t=>{this.click(t)}),this.dialogs.addEventListener("input",t=>this.inputPanel(t)),this.dialogs.addEventListener("change",t=>this.changePanel(t)),this.dialogs.addEventListener("submit",t=>{t.preventDefault(),this.submit(t.target)}),this.track(w(()=>{this.svc.stables.get(),this.svc.week.get(),this.svc.detail.get(),this.svc.log.get(),this.svc.loading.get(),this.svc.loaded.get(),this.svc.error.get(),this.svc.saving.get(),this.svc.writeError.get(),He(),j(()=>{this.paint(),this.panelState()})})),e}onMount(){this.track(w(()=>{const e=this.router.route.get(),t=this.auth.currentUser.get();t&&j(()=>{this.routeChanged(e,t.id)})})),this.track(()=>{this.disposed=!0,this.routeGeneration++,this.dialog?.close(),this.dialog?.remove()})}stable(){const e=this.svc.detail.get();return e?.id===this.stableId?e:null}route(e){return"/teacher-student/".replace(/\/$/,"")+e}link(e,t,s=""){return`<a href="${f(this.route(t))}" data-route="${f(t)}" class="${s}">${f(e)}</a>`}date(e,t={day:"numeric",month:"long"}){return new Intl.DateTimeFormat(He(),{...t,timeZone:"UTC"}).format(new Date(e+"T12:00Z"))}dayName(e,t=!1){return this.date(e,{weekday:t?"short":"long"})}selectedDate(){return Y(this.startDate,this.dayIndex)}dayRoute(e){return`/veckoschema/${this.stableId}/${e}`}persist(){this.accountId&&this.stableId&&Nc(this.accountId,this.stableId,{filters:this.filters,startDate:this.startDate,dayIndex:this.dayIndex})}async routeChanged(e,t){const s=++this.routeGeneration;if(await Promise.resolve(),this.disposed||s!==this.routeGeneration)return;this.closePanel(),this.notice="",this.accountId=t,this.svc.bindAccount(t),this.logMode=e.startsWith("/hastlogg");const i=e.split("/").filter(Boolean);if(this.stableId=i[1]??"",this.horseId=this.logMode?i[2]??"":"",this.svc.loaded.get()||await this.svc.loadStables(),this.disposed||s!==this.routeGeneration)return;if(!this.stableId){const u=this.svc.stables.get()[0];if(u){this.router.navigate((this.logMode?"/hastlogg/":"/veckoschema/")+u.id,!0);return}this.paint();return}const r=_e(Ae(this.svc.stables.get().find(u=>u.id===this.stableId)?.timeZone)),l=bn(t,this.stableId,[],r);this.startDate=l.startDate,this.dayIndex=l.dayIndex;const c=this.logMode?null:vn(i[2]);if(c&&(this.startDate=_e(c),this.dayIndex=(new Date(c+"T12:00Z").getUTCDay()+6)%7),this.logMode&&this.horseId?await this.svc.loadLog(this.stableId,this.horseId,this.logFrom,this.logTo):await this.svc.loadWeek(this.stableId,this.startDate),this.disposed||s!==this.routeGeneration)return;const h=this.stable();if(h){const u=bn(t,this.stableId,h.horses.map(p=>p.id),_e(Ae(h.timeZone)));if(this.filters=u.filters,c&&this.persist(),this.logMode&&!this.horseId){const p=h.horses.find(b=>b.active)??h.horses[0];if(p){this.router.navigate(`/hastlogg/${h.id}/${p.id}`,!0);return}}}this.paint(),i[2]==="installningar"&&this.openSettings()}paint(){if(!this.main)return;const e=this.stable(),t=this.svc.week.get(),s=g(this.logMode?"horse_log":"heading"),i=this.stableId?`<nav class="schedule-tabs" aria-label="${f(g("views"))}"><a href="${f(this.route("/veckoschema/"+this.stableId))}" data-route="/veckoschema/${f(this.stableId)}" ${this.logMode?"":'aria-current="page"'}>${f(g("heading"))}</a><a href="${f(this.route("/hastlogg/"+this.stableId+(this.horseId?"/"+this.horseId:"")))}" data-route="/hastlogg/${f(this.stableId)}${this.horseId?"/"+f(this.horseId):""}" ${this.logMode?'aria-current="page"':""}>${f(g("horse_log"))}</a></nav>`:"",r=this.svc.stables.get(),l=r.length>1?`<label class="schedule-field"><span>${f(g("choose_stable"))}</span><select class="schedule-select" name="stable-picker">${r.map(p=>`<option value="${f(p.id)}" ${p.id===this.stableId?"selected":""}>${f(p.name)}</option>`).join("")}</select></label>`:"",c=`<header class="schedule-head"><div><p class="schedule-kicker">${f(e?.name??g("stable"))}</p><h1>${f(s)}</h1><p class="schedule-description">${f(g(this.logMode?"log_description":"description"))}</p></div><div class="schedule-actions">${e?`${V(g("settings"),"settings","schedule-ghost schedule-small")}${e.role==="admin"&&!this.logMode?V(g("templates"),"templates","schedule-ghost"):""}${V(g(this.logMode?"log_event":"activity"),"new","schedule-primary")}`:""}</div></header>${l}${i}`,h=this.svc.error.get();if(!this.svc.loaded.get()||!e&&this.svc.loading.get()){this.main.innerHTML=c+`<p class="schedule-loading" role="status">${f(g("loading"))}</p>`;return}if(!this.stableId){this.main.innerHTML=c+(h?this.errorHTML(h):`<div class="schedule-panel schedule-empty"><h2>${f(g("start_heading"))}</h2><p>${f(g("start_description"))}</p>${V(g("create_stable"),"create-stable","schedule-primary")}</div>`);return}let u="";h&&(u+=this.errorHTML(h)),!this.panel&&this.svc.writeError.get()&&(u+=this.errorHTML(this.svc.writeError.get())),e&&(this.logMode?u+=this.renderLog(e):t?.stable.id===this.stableId&&t.startDate===this.startDate&&(u+=this.renderWeek(e,t.activities))),this.svc.loading.get()&&(u+=`<p class="schedule-loading" role="status">${f(g("loading"))}</p>`),this.main.innerHTML=c+(this.notice?`<p role="status" class="schedule-dialog-info">${f(this.notice)}</p>`:"")+u}errorHTML(e){return`<div class="schedule-alert" role="alert">${f(g(e.replace("schedule.","")))} ${V(g("retry"),"refresh","schedule-button schedule-small")}</div>`}memberName(e,t){return e.members.find(s=>s.userId===t)?.displayName??g("inactive_member")}people(e,t,s=!1){if(!t.length)return`<span class="schedule-warning">${f(g("unassigned"))}</span>`;const i=t.map(r=>this.memberName(e,r));return`<span class="schedule-avatar-stack">${t.map((r,l)=>`<span class="schedule-avatar ${e.members.find(c=>c.userId===r)?.active?"":"inactive"}" aria-hidden="true">${f(Ac(i[l]))}</span>`).join("")}</span><span>${f(s&&i.length>1?i[0].split(" ")[0]+" +"+(i.length-1):i.map(r=>r.split(" ")[0]).join(" & "))}</span>`}state(e){return`<span class="schedule-state ${e.status}" aria-label="${f(g("status."+e.status))}">${e.status==="completed"?"✓":""}</span>`}card(e,t){return`<button type="button" class="schedule-card ${t.category} ${t.status}" data-activity="${f(t.id)}" aria-label="${f(t.title+", "+(t.time??g("no_time"))+", "+g("status."+t.status))}"><span class="schedule-card-time">${this.state(t)}${f(t.time??g("no_time"))}</span><strong>${f(t.title)}</strong><span class="schedule-card-people">${this.people(e,t.assigneeIds,!0)}</span>${t.horseInactive?`<span class="schedule-warning">${f(g("needs_attention"))}</span>`:""}</button>`}dayHead(e,t=!1){const s=Y(this.startDate,e);return`<th scope="col" class="${e===this.dayIndex?"schedule-selected":""}"><div class="schedule-day-head"><button type="button" data-day="${e}" aria-pressed="${e===this.dayIndex}" aria-label="${f(this.date(s,{weekday:"long",day:"numeric",month:"long"}))}">${f(this.dayName(s,!0))}<strong>${Number(s.slice(8))}</strong></button>${t?`<button type="button" class="schedule-icon schedule-copy-day" data-copy-day="${e}" aria-label="${f(g("copy_day_named",{day:this.dayName(s)}))}">⧉</button>`:""}</div></th>`}addCell(e,t){return e.active?`<button type="button" class="schedule-lane-add" data-new-horse="${f(e.id)}" data-new-day="${t}" aria-label="${f(g("add_for_horse",{name:e.name,day:this.dayName(Y(this.startDate,t))}))}">+</button>`:""}renderWeek(e,t){const s=this.svc.week.get(),i=Ic(t,this.filters,this.accountId),r=Sc(this.startDate),l=e.horses.filter(S=>S.active||t.some(O=>O.horseId===S.id)||this.filters.scope==="horse:"+S.id),c=`<div class="schedule-tools"><h2>${f(g("week_number",{week:r.week}))}<small>${f(this.date(this.startDate))}–${f(this.date(Y(this.startDate,6),{day:"numeric",month:"long",year:"numeric"}))}</small></h2><div class="schedule-arrows">${V("‹","previous","schedule-icon",`aria-label="${f(g("previous_week"))}"`)}${V("›","next","schedule-icon",`aria-label="${f(g("next_week"))}"`)}</div>${V(g("this_week"),"today","schedule-ghost schedule-small")}<div class="schedule-stats"><span>${f(g("completed_week",{done:s.completed,total:s.total}))}</span>${V(g("unassigned_week",{count:s.unassigned}),"unassigned","schedule-unassigned",`aria-pressed="${this.filters.unassigned}"`)}</div></div>`,h=`<div class="schedule-filters" aria-label="${f(g("filters"))}">${[{id:"all",name:g("all")},{id:"stable",name:g("stable")},{id:"horses",name:g("horses")},...l.map(S=>({id:"horse:"+S.id,name:S.name}))].map(S=>`<button type="button" class="schedule-filter" data-scope="${f(S.id)}" aria-pressed="${this.filters.scope===S.id}">${f(S.name)}</button>`).join("")}<span class="schedule-filter-gap"></span>${V(g("mine"),"mine","schedule-filter",`aria-pressed="${this.filters.mine}"`)}<select class="schedule-status-select" name="status-filter" aria-label="${f(g("status_filter"))}">${["all","remaining","completed"].map(S=>`<option value="${S}" ${S===this.filters.status?"selected":""}>${f(g("filter_status."+S))}</option>`).join("")}</select></div>`,u=this.filters.mine||this.filters.unassigned||this.filters.status!=="all",p=this.filters.scope==="all"||this.filters.scope==="stable",b=e.types.filter(S=>i.some(O=>!O.horseId&&O.typeId===S.id)||!u&&!S.archived&&S.scope==="stable"),_=p?`<section class="schedule-panel"><div class="schedule-band"><strong>${f(g("who_does_what"))}</strong><span>${f(g("assignment_hint"))}</span></div><table class="schedule-table schedule-stable-table" aria-label="${f(g("stable_week"))}">${_n}<thead><tr><th scope="col">${f(g("stable_routines"))}</th>${Array.from({length:7},(S,O)=>this.dayHead(O,e.role==="admin")).join("")}</tr></thead><tbody>${b.map(S=>`<tr><th scope="row">${f(S.name)}${S.defaultTime?"<small>"+f(S.defaultTime)+"</small>":""}</th>${Array.from({length:7},(O,M)=>{const ce=i.filter(W=>!W.horseId&&W.typeId===S.id&&W.date===Y(this.startDate,M)).sort(zt);return`<td class="${M===this.dayIndex?"schedule-selected":""}">${ce.length?ce.map(W=>`<button type="button" class="schedule-assignment ${W.status}" data-activity="${f(W.id)}" aria-label="${f(W.title+", "+this.dayName(W.date)+", "+g("status."+W.status))}">${this.people(e,W.assigneeIds)}${W.status==="completed"?'<span aria-hidden="true">✓</span>':W.status==="cancelled"?"<small>"+f(g("status.cancelled"))+"</small>":""}${W.time!==S.defaultTime?"<small>"+f(W.time??g("no_time"))+"</small>":""}</button>`).join(""):e.role==="admin"?`<button type="button" class="schedule-assignment empty" data-new-type="${f(S.id)}" data-new-day="${M}" aria-label="${f(g("add_named",{name:S.name,day:this.dayName(Y(this.startDate,M))}))}">+</button>`:'<span aria-label="'+f(g("nothing_planned"))+'">·</span>'}</td>`}).join("")}</tr>`).join("")}</tbody></table>${b.length?"":`<p class="schedule-empty">${f(g("no_matches"))}</p>`}</section>`:"",k=Tc(e.horses,i,this.filters),I=this.filters.scope!=="stable"?`<section><div class="schedule-horse-heading"><div><h2>${f(g("horses_week"))}</h2><p>${f(g("horses_description"))}</p></div><span>${f(g("horse_counts",{horses:k.length,activities:i.filter(S=>S.horseId).length}))}</span></div><div class="schedule-panel"><div class="schedule-band"><strong>${f(g("planned_per_horse"))}</strong><span>${f(g("multiple_hint"))}</span></div><table class="schedule-table schedule-horse-table" aria-label="${f(g("horse_week"))}">${_n}<thead><tr><th scope="col">${f(g("horse"))}</th>${Array.from({length:7},(S,O)=>this.dayHead(O)).join("")}</tr></thead><tbody>${k.map(S=>{const O=i.filter(M=>M.horseId===S.id);return`<tr data-horse-lane="${f(S.id)}"><th scope="row"><span class="schedule-horse-name">${f(S.name)}</span><small>${f(g("done_count",{done:O.filter(M=>M.status==="completed").length,total:O.length}))}</small>${S.active?"":'<small class="schedule-warning">'+f(g("inactive_horse_short"))+"</small>"}${this.link(g("horse_log")+" ↗",`/hastlogg/${e.id}/${S.id}`,"schedule-log-link")}</th>${Array.from({length:7},(M,ce)=>`<td class="${ce===this.dayIndex?"schedule-selected":""}"><div class="schedule-cell">${O.filter(W=>W.date===Y(this.startDate,ce)).sort(zt).map(W=>this.card(e,W)).join("")}</div>${this.addCell(S,ce)}</td>`).join("")}</tr>`}).join("")}</tbody></table>${k.length?"":`<p class="schedule-empty">${f(g("no_horses_match"))}</p>`}</div></section>`:"",N=i.length?"":`<div class="schedule-empty"><p>${f(g(t.length?"no_matches":"empty_week"))}</p>${t.length?V(g("reset_filters"),"reset-filters","schedule-ghost"):e.role==="admin"?V(g("add_routines"),"week-templates","schedule-button"):""}</div>`,A=`<div class="schedule-mobile"><div class="schedule-day-strip" aria-label="${f(g("choose_day"))}">${Array.from({length:7},(S,O)=>{const M=Y(this.startDate,O);return`<button type="button" data-day="${O}" aria-pressed="${O===this.dayIndex}">${f(this.dayName(M,!0))}<strong>${Number(M.slice(8))}</strong></button>`}).join("")}</div></div>`;return c+h+A+this.dayActions(s)+N+`<div class="schedule-desktop">${_}${I}</div><div class="schedule-mobile">${this.mobileWeek(e,i,k,p)}</div>`+this.legend()}dayActions(e){const t=this.selectedDate(),s=this.date(t,{weekday:"long",day:"numeric",month:"long"}),i=e.stable.role==="admin",r=e.activities.some(h=>h.date===t),l=e.addedDates.includes(t),c=this.svc.saving.get()||this.svc.loading.get();return`<div class="schedule-day-actions">
            <div><h3>${f(s)}</h3>
                ${i&&!r&&l?`<small>${f(g("day_added"))}</small>`:""}
                ${i&&!r&&!l&&e.defaultDayTemplateName?`<small>${f(g("day_uses_template",{name:e.defaultDayTemplateName}))}</small>`:""}
            </div>
            <div class="schedule-actions">
                ${i&&!r&&!l?V(g("add_day"),"add-day","schedule-button schedule-small",c?"disabled":""):""}
                ${V(g("share_day"),"share-day","schedule-ghost schedule-small")}
                ${i?`<span class="schedule-mobile"><button type="button" class="schedule-icon" data-copy-day="${this.dayIndex}" aria-label="${f(g("copy_day"))}">⧉</button></span>`:""}
            </div>
        </div>`}mobileWeek(e,t,s,i){const r=Y(this.startDate,this.dayIndex),l=t.filter(c=>c.date===r).sort(zt);return`${i?`<section><div class="schedule-band"><strong>${f(g("stable_routines"))}</strong></div>${l.filter(c=>!c.horseId).map(c=>`<div class="schedule-mobile-routine"><span>${f(c.time??g("no_time"))}</span>${this.card(e,c)}</div>`).join("")||`<p class="schedule-empty">${f(g("nothing_planned"))}</p>`}</section>`:""}${this.filters.scope!=="stable"?`<div class="schedule-horse-heading"><h2>${f(g("horses"))}</h2></div>${s.map(c=>`<section class="schedule-panel schedule-mobile-horse"><header><span class="schedule-horse-name">${f(c.name)}</span>${this.link(g("horse_log")+" ↗",`/hastlogg/${e.id}/${c.id}`,"schedule-log-link")}${c.active?`<button type="button" class="schedule-icon" data-new-horse="${f(c.id)}" data-new-day="${this.dayIndex}" aria-label="${f(g("add_for_horse",{name:c.name,day:this.dayName(r)}))}">+</button>`:""}</header><div>${l.filter(h=>h.horseId===c.id).map(h=>this.card(e,h)).join("")||`<p>${f(g("nothing_planned"))}</p>`}</div></section>`).join("")}`:""}`}legend(){return`<div class="schedule-legend">${["planned","completed","cancelled"].map(e=>`<span><span class="schedule-state ${e}" aria-hidden="true">${e==="completed"?"✓":""}</span>${f(g("status."+e))}</span>`).join("")}<span>${f(g("details_hint"))}</span></div>`}renderLog(e){const t=this.svc.log.get(),s=e.horses.find(r=>r.id===this.horseId),i=e.horses.map(r=>this.link(r.name,`/hastlogg/${e.id}/${r.id}`,"schedule-button schedule-small")).join("");return s?`<div class="schedule-filters">${i}</div><div class="schedule-horse-heading"><div><h2>${f(s.name)}</h2><p>${f(g("log_description"))}</p></div>${V(g("log_event"),"new","schedule-button")}</div><form class="schedule-log-controls">${X("log-from",g("from_date"),this.logFrom,"date")}${X("log-to",g("to_date"),this.logTo,"date")}${V(g("refresh"),"refresh","schedule-button")}</form>${t?.horse.id===s.id?t.items.map(r=>`<article class="schedule-log-entry"><time>${f(new Intl.DateTimeFormat(He(),{dateStyle:"long",timeStyle:"short",timeZone:e.timeZone}).format(new Date(r.performedAt)))}</time><button type="button" class="schedule-card ${r.category}" data-activity="${f(r.id)}"><strong>${f(r.title)}</strong><p>${f(r.resultNote||g("completed_without_note"))}</p><span class="schedule-card-people">${this.people(e,r.performerIds,!0)}</span><span class="schedule-dialog-hint">${f(g("recorded_by",{name:this.memberName(e,r.completedBy??"")}))}</span></button></article>`).join("")+(t.items.length?"":`<div class="schedule-empty">${f(g("empty_log"))}</div>`)+(t.nextCursor?V(g("load_more"),"load-more","schedule-button"):""):""}`:`<div class="schedule-filters">${i}</div><div class="schedule-empty"><h2>${f(g("no_horses"))}</h2><p>${f(g("attach_horse_hint"))}</p>${V(g("settings"),"settings")}</div>`}async refresh(){if(!this.stableId){await this.svc.loadStables(),this.paint();return}this.logMode&&this.horseId?await this.svc.loadLog(this.stableId,this.horseId,this.logFrom,this.logTo):await this.svc.loadWeek(this.stableId,this.startDate)}changeDate(e){vn(e)&&this.router.navigate(this.dayRoute(e),!0)}changeMain(e){const t=e.target;if(t.name==="stable-picker"){this.router.navigate((this.logMode?"/hastlogg/":"/veckoschema/")+t.value);return}t.name==="status-filter"&&(this.filters={...this.filters,status:t.value},this.persist(),this.paint()),t.name==="log-from"&&(this.logFrom=t.value),t.name==="log-to"&&(this.logTo=t.value)}async click(e){const t=e.target.closest("button,a");if(!t)return;if(t.dataset.route){if(e instanceof MouseEvent&&(e.ctrlKey||e.metaKey||e.shiftKey||e.altKey))return;e.preventDefault(),this.router.navigate(t.dataset.route);return}if(t.dataset.trainingLink){e.preventDefault(),this.closePanel(),this.router.navigate("/traningspass/"+t.dataset.trainingLink);return}if(t.dataset.scope){this.filters={...this.filters,scope:t.dataset.scope},this.persist(),this.paint();return}if(t.dataset.day!==void 0){this.changeDate(Y(this.startDate,Number(t.dataset.day)));return}if(t.dataset.activity){const i=this.svc.week.get()?.activities.find(r=>r.id===t.dataset.activity)??this.svc.log.get()?.items.find(r=>r.id===t.dataset.activity);i&&this.openActivity(i);return}if(t.dataset.newHorse!==void 0||t.dataset.newType){this.openActivity(void 0,Number(t.dataset.newDay??this.dayIndex),t.dataset.newHorse,t.dataset.newType);return}if(t.dataset.copyDay!==void 0){this.showPanel({kind:"copy",requestId:crypto.randomUUID(),sourceDate:Y(this.startDate,Number(t.dataset.copyDay)),targetDates:[],week:!1,keepAssignees:!0,preview:null});return}const s=t.dataset.action;if(s==="close"){this.closePanel();return}if(s==="new"){this.openActivity();return}if(s==="create-stable"){this.showPanel({kind:"create-stable"});return}if(s==="settings"){await this.openSettings();return}if(s==="templates"||s==="week-templates"){await this.openTemplates(s==="templates"?"day":"week");return}if(s==="template-mode-day"||s==="template-mode-week"){this.panel?.kind==="templates"&&(this.panel.mode=s==="template-mode-day"?"day":"week",this.panel.requests=et(),this.panel.status=void 0,this.svc.writeError.set(null),this.paintDialog(!0));return}if(s==="add-day"){await this.addDay();return}if(s==="share-day"){this.showPanel({kind:"share",url:new URL(this.route(this.dayRoute(this.selectedDate())),location.origin).href});return}if(s==="copy-link"){await this.copyLink();return}if(s==="refresh"){e.preventDefault(),await this.refresh();return}if(s==="previous"||s==="next"){this.changeDate(Y(this.selectedDate(),s==="next"?7:-7));return}if(s==="today"){this.changeDate(Ae(this.stable()?.timeZone));return}if(s==="mine"||s==="unassigned"){this.filters={...this.filters,[s]:!this.filters[s]},this.persist(),this.paint();return}if(s==="reset-filters"){this.filters={...Xt},this.persist(),this.paint();return}if(s==="load-more"){await this.svc.loadLog(this.stableId,this.horseId,this.logFrom,this.logTo,!0);return}if(s==="complete"){await this.saveActivity(!0);return}if(s==="claim"||s==="reopen"||s==="cancel"){await this.stateAction(s);return}if(s==="delete-activity"){await this.deleteActivity();return}if(s==="training"){await this.openTraining();return}if(s==="copy-preview"||s==="copy-confirm"){await this.copy(s==="copy-preview");return}if(s==="copy-week"){this.showPanel({kind:"copy",requestId:crypto.randomUUID(),sourceDate:Y(this.startDate,-7),targetDates:[this.startDate],week:!0,keepAssignees:!0,preview:null});return}if(s==="member-role"||s==="member-remove"){const i=this.stable(),r=t.dataset.user,l=s==="member-role"?(this.dialog?.querySelector(`[name="role-${CSS.escape(r)}"]`)).value:"member";await this.settingsWrite(()=>v.stables.member({stableId:i.id,userId:r,role:l,remove:s==="member-remove"}));return}if(s==="detach-horse"){await this.settingsWrite(()=>v.stables.detachHorse({stableId:this.stableId,horseId:t.dataset.horse}));return}if(s==="revoke-invitation"){await this.settingsWrite(()=>v.stables.revoke({stableId:this.stableId,invitationId:t.dataset.invitation}));return}if(s==="edit-type"){this.renderTypeForm(t.dataset.type??"");return}if(s==="conflict-load"){this.latestActivity&&this.openActivity(this.latestActivity);return}if(s==="conflict-keep"&&this.panel?.kind==="activity"&&this.latestActivity){this.panel.draft.record=this.latestActivity,this.latestActivity=null,this.svc.writeError.set(null),this.paintDialog(!0);return}}openActivity(e,t=this.dayIndex,s,i){const r=this.stable();if(!r)return;const l=s??e?.horseId??(this.logMode?this.horseId:this.filters.scope.startsWith("horse:")?this.filters.scope.slice(6):r.role==="member"?r.horses.find(b=>b.active)?.id??"":"");if(!e&&!l&&(this.logMode||r.role==="member")){this.notice=g("attach_horse_hint"),this.paint();return}const c=r.types.find(b=>b.id===(i??e?.typeId))??r.types.find(b=>!b.archived&&b.code===(l?"care":"morning_feed"))??r.types.find(b=>!b.archived);if(!c){this.notice=g("error.type_inactive"),this.paint();return}const h=new Date().toISOString(),u=e?.performedAt??h,p={record:e,requestId:crypto.randomUUID(),typeId:c.id,horseId:l||(r.role==="member"?r.horses.find(b=>b.active)?.id??"":""),title:e?.title??c.name,date:e?.date??(this.logMode?Ae(r.timeZone):Y(this.startDate,t)),time:e?.time??c.defaultTime??"",offsetMinutes:e?.offsetMinutes??null,instruction:e?.instruction??"",resultNote:e?.resultNote??"",assigneeIds:e?[...e.assigneeIds]:[this.accountId],performerIds:e?.performerIds.length?[...e.performerIds]:[this.accountId],trainingStudentId:e?.trainingStudentId??"",programIds:e?.programs.map(b=>b.id)??[],exerciseIds:e?.exercises.filter(b=>!b.sourceProgramId).map(b=>b.exerciseId)??[],contentDirty:!1,completed:!e&&this.logMode,performedWall:at(u,r.timeZone),performedOffset:jt(u,r.timeZone)};c.category==="training"&&!p.trainingStudentId&&p.assigneeIds.length===1&&(p.trainingStudentId=p.assigneeIds[0]),this.catalog=null,this.latestActivity=null,this.showPanel({kind:"activity",draft:p}),c.category==="training"&&(!e||e.canEdit)&&this.loadCatalog()}showPanel(e){this.panel=e,this.svc.writeError.set(null),this.paintDialog(!0)}closePanel(){this.panel=null,this.latestActivity=null,this.dialog&&(this.dialog.close(),this.dialog.remove(),this.dialog=null),this.svc.writeError.set(null)}paintDialog(e=!1){if(!this.panel||this.disposed)return;const t=this.stable();if(this.dialog||(this.dialog=document.createElement("dialog"),this.dialog.className="schedule-dialog",this.dialog.addEventListener("cancel",s=>{s.preventDefault(),this.svc.saving.get()||this.closePanel()}),this.dialog.addEventListener("click",s=>{const i=this.dialog.getBoundingClientRect();s.target===this.dialog&&(s.clientX<i.left||s.clientX>i.right||s.clientY<i.top||s.clientY>i.bottom)&&!this.svc.saving.get()&&this.closePanel()}),this.dialogs.appendChild(this.dialog),e=!0),e){const s=document.activeElement,i=s?.name,r=s?.selectionStart,l=this.panel.kind==="activity"?this.panel.draft.record?.title??g(this.panel.draft.completed?"log_event":"new_activity"):g(this.panel.kind==="create-stable"?"create_stable":this.panel.kind==="templates"?"templates":this.panel.kind==="share"?"share_day":this.panel.kind==="copy"?"copy_day":this.panel.kind==="training"?"register_training":"settings");if(this.dialog.innerHTML=`<div class="schedule-dialog-head"><p class="schedule-kicker">${f(t?.name??g("stable"))}</p>${V("×","close","schedule-icon",`aria-label="${f(g("close"))}"`)}</div><h2 id="schedule-dialog-title">${f(l)}</h2><div class="schedule-alert" role="alert" data-write-error></div><div data-conflict></div><div data-panel-body>${this.panel.kind==="activity"&&t?Dc(this.panel.draft,t,this.accountId,this.catalog):this.otherPanelHTML()}</div>`,this.dialog.setAttribute("aria-labelledby","schedule-dialog-title"),!this.dialog.open)try{this.dialog.showModal()}catch{this.dialog.setAttribute("open","")}if(i){const c=this.dialog.querySelector(`[name="${CSS.escape(i)}"]`);c?.focus(),r!=null&&c?.type==="text"&&c.setSelectionRange(r,r)}}this.panelState()}panelState(){if(!this.dialog)return;const e=this.dialog.querySelector("[data-write-error]"),t=this.svc.writeError.get();e.textContent=t?g(t.replace("schedule.","")):"",this.dialog.querySelector("[data-panel-body]").inert=this.svc.saving.get();const s=this.dialog.querySelector('[data-action="close"]');s&&(s.disabled=this.svc.saving.get());const i=this.dialog.querySelector("[data-conflict]");this.latestActivity?i.innerHTML=`<div class="schedule-dialog-info"><p>${f(g("latest_saved"))}</p><strong>${f(this.latestActivity.title)}</strong><p>${f(this.latestActivity.instruction)}</p><p>${f(this.latestActivity.resultNote)}</p>${V(g("load_saved"),"conflict-load","schedule-button schedule-small")}${V(g("keep_draft"),"conflict-keep","schedule-button schedule-small")}</div>`:i.innerHTML=""}inputPanel(e){const t=e.target;if(this.panel?.kind==="activity"){const s=this.panel.draft,i=t.name;["title","date","time","instruction","resultNote","performedWall"].includes(i)&&(s[i]=t.value),["assigneeIds","performerIds","programIds","exerciseIds"].includes(i)&&(s[i]=[...this.dialog.querySelectorAll(`[name="${i}"]:checked`)].map(r=>r.value),(i==="programIds"||i==="exerciseIds")&&(s.contentDirty=!0)),s.record||(s.requestId=crypto.randomUUID())}if(this.panel?.kind==="templates"&&(this.panel.requests=et()),this.panel?.kind==="training"){const s=this.panel;["summary","duration","resultNote","performedWall","sessionId"].includes(t.name)&&(s[t.name]=t.value),t.name==="performerIds"&&(s.performerIds=[...this.dialog.querySelectorAll('[name="performerIds"]:checked')].map(i=>i.value))}}changePanel(e){this.inputPanel(e);const t=e.target;if(this.panel?.kind==="activity"){const s=this.panel.draft,i=this.stable();if(t.name==="typeId"){const r=i.types.find(c=>c.id===s.typeId),l=i.types.find(c=>c.id===t.value);s.typeId=l.id,s.title===r?.name&&(s.title=l.name),l.scope==="stable"&&(s.horseId=""),l.scope==="horse"&&!s.horseId&&(s.horseId=i.horses.find(c=>c.active)?.id??""),l.category==="training"&&!s.trainingStudentId&&s.assigneeIds.length===1&&(s.trainingStudentId=s.assigneeIds[0]),l.category!=="training"&&(s.trainingStudentId="",s.programIds=[],s.exerciseIds=[],s.contentDirty=!0),this.catalog=null,this.paintDialog(!0),l.category==="training"&&this.loadCatalog()}else t.name==="horseId"?s.horseId=t.value:t.name==="trainingStudentId"?(s.trainingStudentId=t.value,this.catalog=null,this.loadCatalog()):t.name==="assigneeIds"?(s.assigneeIds.includes(s.trainingStudentId)||(s.trainingStudentId=s.assigneeIds.length===1?s.assigneeIds[0]:""),this.paintDialog(!0),i.types.find(r=>r.id===s.typeId)?.category==="training"&&this.loadCatalog()):t.name==="offsetMinutes"?s.offsetMinutes=t.value===""?null:Number(t.value):t.name==="performedOffset"?s.performedOffset=t.value===""?null:Number(t.value):t.name==="date"||t.name==="time"?(s.offsetMinutes=null,this.paintDialog(!0)):t.name==="performedWall"&&(s.performedOffset=null,this.paintDialog(!0))}else if(this.panel?.kind==="copy"){const s=this.panel;t.name==="sourceDate"&&(s.sourceDate=t.value),t.name==="keepAssignees"&&(s.keepAssignees=t.checked),t.name==="copyTarget"&&(s.targetDates=[...this.dialog.querySelectorAll('[name="copyTarget"]:checked')].map(i=>i.value)),t.name==="targetDate"&&(s.targetDates=t.value?[t.value]:[]),t.name==="extraTarget"&&t.value&&!s.targetDates.includes(t.value)&&s.targetDates.push(t.value),s.preview=null,s.requestId=crypto.randomUUID(),this.paintDialog(!0)}else this.panel?.kind==="training"&&(t.name==="performedWall"&&(this.panel.performedOffset=null,this.paintDialog(!0)),t.name==="performedOffset"&&(this.panel.performedOffset=t.value===""?null:Number(t.value)))}async loadCatalog(){const e=this.panel;if(e?.kind!=="activity")return;const t=e.draft.trainingStudentId;try{const s=await v.stableActivities.catalog({stableId:this.stableId,studentId:t||void 0});this.panel===e&&t===e.draft.trainingStudentId&&(this.catalog=s,this.paintDialog(!0))}catch(s){this.panel===e&&this.svc.writeError.set(it(s))}}async saveActivity(e=!1){if(this.panel?.kind!=="activity")return;const t=this.panel,s=t.draft,i=this.stable(),r=s.record;if(!this.dialog?.querySelector("form")?.reportValidity())return;const c={typeId:s.typeId,horseId:s.horseId||null,title:s.title,date:s.date,time:s.time||null,offsetMinutes:s.offsetMinutes,instruction:s.instruction,assigneeIds:s.assigneeIds,trainingStudentId:i.types.find(_=>_.id===s.typeId)?.category==="training"&&s.trainingStudentId||null},h=!r||s.contentDirty?{programIds:s.programIds,exerciseIds:s.exerciseIds}:{};let u;try{(e||s.completed||r?.status==="completed")&&(u=fn(s.performedWall.slice(0,10),s.performedWall.slice(11,16),i.timeZone,s.performedOffset))}catch(_){this.svc.writeError.set("schedule.error."+(_ instanceof Error?_.message:"invalid_time"));return}const p={resultNote:s.resultNote,performerIds:s.performerIds,performedAt:u},b=await this.svc.write(()=>r?e?v.stableActivities.complete({stableId:i.id,activityId:r.id,version:r.version,...p,patch:r.canEdit?{...c,...h}:void 0}):v.stableActivities.update({stableId:i.id,activityId:r.id,version:r.version,...r.canEdit?{...c,...h}:{},resultNote:s.resultNote,...r.status==="completed"&&r.canComplete?{...r.performedAt&&(s.performedWall!==at(r.performedAt,i.timeZone)||s.performedOffset!==jt(r.performedAt,i.timeZone))?{performedAt:u}:{},...s.performerIds.length!==r.performerIds.length||s.performerIds.some(_=>!r.performerIds.includes(_))?{performerIds:s.performerIds}:{}}:{}}):v.stableActivities.create({stableId:i.id,requestId:s.requestId,...c,...h,...p,status:s.completed?"completed":"planned"}));b?(this.svc.merge(b),this.closePanel(),this.notice=g(e?"completed_saved":"saved"),await this.refresh()):r&&await this.loadConflict(t,r)}async stateAction(e){if(this.panel?.kind!=="activity"||!this.panel.draft.record)return;const t=this.panel.draft.record,s=await this.svc.write(()=>v.stableActivities[e]({stableId:this.stableId,activityId:t.id,version:t.version}));s&&(this.svc.merge(s),this.closePanel(),await this.refresh())}async loadConflict(e,t){if(this.svc.writeError.get()==="schedule.error.version_conflict")try{const s=await v.stableActivities.get({stableId:t.stableId,activityId:t.id});!this.disposed&&this.panel===e&&(this.latestActivity=s,this.panelState())}catch{}}async deleteActivity(){const e=this.panel;if(e?.kind!=="activity"||!e.draft.record?.canEdit)return;const{id:t,stableId:s,version:i}=e.draft.record,r=await this.svc.write(()=>v.stableActivities.remove({stableId:s,activityId:t,version:i}));if(!(this.disposed||this.panel!==e)){if(!r){await this.loadConflict(e,e.draft.record);return}this.closePanel(),this.notice=g("activity_deleted"),await this.refresh()}}async addDay(){const e=this.selectedDate(),t=this.routeGeneration,s=await this.svc.write(()=>v.scheduleTemplates.addDay({stableId:this.stableId,date:e}));!s||this.disposed||t!==this.routeGeneration||(this.notice=s.added?g(s.count?"day_added_with_activities":"day_added",{count:s.count}):g("day_exists"),await this.refresh())}async copyLink(){const e=this.panel;if(e?.kind==="share"){try{await navigator.clipboard.writeText(e.url)}catch{if(this.panel===e){const t=this.dialog?.querySelector('[name="shareUrl"]');t?.focus(),t?.select(),this.dialog.querySelector('[role="status"]').textContent=g("copy_link_manually")}return}this.disposed||this.panel!==e||(this.closePanel(),this.notice=g("link_copied"),this.paint())}}async openSettings(){const e=await this.svc.write(()=>v.horses.list());e&&this.showPanel({kind:"settings",horses:e})}async openTemplates(e){const t=this.routeGeneration,s=await this.svc.write(()=>v.scheduleTemplates.list({stableId:this.stableId}));s&&!this.disposed&&t===this.routeGeneration&&this.showPanel({kind:"templates",mode:e,templates:s,requests:et()})}async settingsWrite(e){if(await this.svc.write(e)!==void 0){if(await this.svc.loadStables(),!this.svc.stables.get().some(s=>s.id===this.stableId)){this.closePanel(),this.router.navigate("/veckoschema");return}await this.refresh(),this.panel?.kind==="settings"&&this.paintDialog(!0)}}async openTraining(){if(this.panel?.kind!=="activity"||!this.panel.draft.record)return;const e=this.panel.draft.record,t=await this.svc.write(()=>v.trainingSessions.list());if(!t)return;const s=e.performedAt??new Date().toISOString();this.showPanel({kind:"training",activity:e,sessions:t.filter(i=>i.horseId===e.horseId),performedWall:at(s,this.stable().timeZone),performedOffset:jt(s,this.stable().timeZone),summary:"",duration:"",resultNote:this.panel.draft.resultNote,sessionId:"",performerIds:[this.accountId]})}otherPanelHTML(){const e=this.panel,t=this.stable();if(!e)return"";if(e.kind==="create-stable")return`<p>${f(g("create_description"))}</p><form data-form="create-stable">${X("name",g("stable_name"),"","text",'required maxlength="200"')}${ae("timeZone",g("time_zone"),"Europe/Stockholm",[{value:"Europe/Stockholm",label:"Europe/Stockholm"},{value:"UTC",label:"UTC"}])}<div class="schedule-dialog-footer"><button type="submit" class="schedule-primary">${f(g("create_stable"))}</button></div></form>`;if(e.kind==="share")return`${X("shareUrl",g("schedule_link"),e.url,"url","readonly")}${V(g("copy_link"),"copy-link","schedule-primary")}<p role="status" class="schedule-dialog-hint"></p>`;if(!t)return"";if(e.kind==="settings")return this.settingsHTML(t,e.horses);if(e.kind==="templates"){const s=`<div class="schedule-actions" role="group" aria-label="${f(g("templates"))}">
                ${V(g("day_templates"),"template-mode-day","schedule-filter",`aria-pressed="${e.mode==="day"}"`)}
                ${V(g("weekly_template"),"template-mode-week","schedule-filter",`aria-pressed="${e.mode==="week"}"`)}
            </div>`,i=e.status?`<div class="schedule-dialog-info" role="status">${f(e.status)}</div>`:"",r=e.templates.filter(l=>l.kind===e.mode);return e.mode==="day"?s+i+Pc(r,this.selectedDate(),this.date(this.selectedDate())):s+`<p>${f(g("template_description"))}</p><form data-form="routines">${ve("routine",g("daily_routines"),t.types.filter(l=>l.scope==="stable"&&!l.archived).map(l=>l.id),t.types.filter(l=>l.scope==="stable"&&!l.archived).map(l=>({value:l.id,label:l.name+(l.defaultTime?" · "+l.defaultTime:"")})))}<button type="submit" class="schedule-primary">${f(g("add_routines"))}</button></form><h3>${f(g("reuse_week"))}</h3>${V(g("copy_previous_week"),"copy-week")}<form data-form="save-template">${X("name",g("template_name"),"","text",'required maxlength="200"')}<button type="submit" class="schedule-button">${f(g("save_template"))}</button></form>${r.length?`<form data-form="apply-template">${ae("templateId",g("choose_template"),r[0].id,r.map(l=>({value:l.id,label:l.name+" · "+l.count+" "+g("activities")})))}<label class="schedule-check"><input type="checkbox" name="keepAssignees" checked>${f(g("keep_assignees"))}</label><div class="schedule-dialog-footer"><button type="submit" class="schedule-primary">${f(g("apply_template"))}</button></div></form>`:""}<p class="schedule-dialog-hint">${f(g("copy_excludes_outcome"))}</p>`}return e.kind==="copy"?`<p>${f(g(e.week?"copy_week_description":"copy_day_description"))}</p>${X("sourceDate",g("copy_from"),e.sourceDate,"date","required")}${e.week?X("targetDate",g("copy_to"),e.targetDates[0]??"","date","required"):ve("copyTarget",g("copy_to"),e.targetDates,Array.from({length:7},(s,i)=>Y(this.startDate,i)).filter(s=>s!==e.sourceDate).map(s=>({value:s,label:this.date(s,{weekday:"long",day:"numeric",month:"short"})})))+X("extraTarget",g("another_date"),"","date")}${!e.week&&e.targetDates.some(s=>s<this.startDate||s>Y(this.startDate,6))?"<p>"+f(e.targetDates.map(s=>this.date(s)).join(", "))+"</p>":""}<label class="schedule-check"><input type="checkbox" name="keepAssignees" ${e.keepAssignees?"checked":""}>${f(g("keep_assignees"))}</label><div class="schedule-dialog-info">${f(g("copy_scope"))}<br>${f(g("copy_excludes_outcome"))}</div>${e.preview?'<p role="status">'+f(g("copy_preview_count",{count:e.preview.count,source:e.preview.sourceCount}))+"</p>":""}<div class="schedule-dialog-footer">${V(g("preview"),"copy-preview","schedule-button")}${V(g("copy_activities"),"copy-confirm","schedule-primary",e.preview?.count?"":"disabled")}</div>`:e.kind==="training"?`<p>${f(g("training_description"))}</p><form data-form="training">${ae("sessionId",g("existing_training"),e.sessionId,[{value:"",label:g("new_training")},...e.sessions.map(s=>({value:s.id,label:this.date(s.performedAt.slice(0,10))+" · "+(s.summary?.slice(0,45)??g("training"))}))])}${X("performedWall",g("performed_at"),e.performedWall,"datetime-local","required")}${Qt("performedOffset",e.performedWall.slice(0,10),e.performedWall.slice(11,16),t.timeZone,e.performedOffset)}${X("duration",g("duration"),e.duration,"number",'min="0" max="1440"')}${ut("summary",g("private_summary"),e.summary)}${ut("resultNote",g("result_note"),e.resultNote)}${ve("performerIds",g("actual_performers"),e.performerIds,t.members.filter(s=>s.active).map(s=>({value:s.userId,label:s.displayName})))}<div class="schedule-dialog-footer"><button type="submit" class="schedule-primary">${f(g("save_training"))}</button></div></form>`:""}settingsHTML(e,t){const s=e.role==="admin",i=e.members.filter(r=>r.active);return`<h3>${f(g("members"))}</h3>${i.map(r=>`<div class="schedule-settings-row"><span>${f(r.displayName)}<small> · ${f(g("role."+r.role))}</small></span>${s?`<select name="role-${f(r.userId)}" aria-label="${f(g("member_role",{name:r.displayName}))}"><option value="member" ${r.role==="member"?"selected":""}>${f(g("role.member"))}</option><option value="admin" ${r.role==="admin"?"selected":""}>${f(g("role.admin"))}</option></select>${V(g("save"),"member-role","schedule-button schedule-small",`data-user="${f(r.userId)}"`)}`:""}${s||r.userId===this.accountId?V(g(r.userId===this.accountId?"leave_stable":"remove"),"member-remove","schedule-ghost schedule-small",`data-user="${f(r.userId)}"`):""}</div>`).join("")}${s?`<form data-form="invite">${X("email",g("invite_email"),"","email",'required maxlength="254"')}<button type="submit" class="schedule-button">${f(g("invite"))}</button></form>${e.invitations.filter(r=>r.status==="pending").map(r=>`<div class="schedule-settings-row"><span>${f(r.inviteeEmail)}</span>${V(g("revoke"),"revoke-invitation","schedule-ghost schedule-small",`data-invitation="${f(r.id)}"`)}</div>`).join("")}`:""}
        <h3>${f(g("stable_horses"))}</h3><p class="schedule-dialog-hint">${f(g("horse_consent"))}</p>${e.horses.filter(r=>r.active).map(r=>`<div class="schedule-settings-row"><span>${f(r.name)}</span>${s||r.ownerId===this.accountId?V(g("detach_horse"),"detach-horse","schedule-ghost schedule-small",`data-horse="${f(r.id)}"`):""}</div>`).join("")}${t.some(r=>!e.horses.some(l=>l.id===r.id&&l.active))?`<form data-form="attach-horse">${ae("horseId",g("choose_own_horse"),"",t.filter(r=>!e.horses.some(l=>l.id===r.id&&l.active)).map(r=>({value:r.id,label:r.name})))}<label class="schedule-check"><input type="checkbox" name="consent" required>${f(g("consent_label"))}</label><div class="schedule-dialog-footer"><button type="submit" class="schedule-button">${f(g("attach_horse"))}</button></div></form>`:`<p>${f(g("no_own_horses"))} ${this.link(g("manage_horses"),"/hastar","schedule-log-link")}</p>`}
        ${s?`<h3>${f(g("activity_types"))}</h3>${e.types.map(r=>V(r.name+(r.archived?" · "+g("archived"):""),"edit-type","schedule-ghost schedule-small",`data-type="${f(r.id)}"`)).join("")}${V(g("new_type"),"edit-type","schedule-button schedule-small",'data-type=""')}<div data-type-form></div>`:""}`}renderTypeForm(e){const t=this.stable().types.find(i=>i.id===e),s=this.dialog?.querySelector("[data-type-form]");s&&(s.innerHTML=`<form data-form="save-type"><input type="hidden" name="typeId" value="${f(e)}">${X("name",g("name"),t?.name??"","text",'required maxlength="200"')}${ae("category",g("category"),t?.category??"other",["routine","care","training","visit","other"].map(i=>({value:i,label:g("category."+i)})))}${ae("scope",g("applies_to"),t?.scope??"any",["stable","horse","any"].map(i=>({value:i,label:g("scope."+i)})))}${X("defaultTime",g("default_time"),t?.defaultTime??"","time")}<label class="schedule-check"><input type="checkbox" name="archived" ${t?.archived?"checked":""}>${f(g("archived"))}</label><div class="schedule-dialog-footer"><button type="submit" class="schedule-primary">${f(g("save_type"))}</button></div></form>`)}async copy(e){if(this.panel?.kind!=="copy")return;const t=this.panel,s=await this.svc.write(()=>v.scheduleTemplates.copy({stableId:this.stableId,requestId:t.requestId,sourceDate:t.sourceDate,targetDates:t.targetDates,week:t.week,keepAssignees:t.keepAssignees,preview:e,sourceVersion:e?void 0:t.preview?.sourceVersion}));s&&(e?(t.preview=s,this.paintDialog(!0)):(this.closePanel(),this.notice=g("copied",{count:s.count}),await this.refresh()))}async submitTemplates(e,t,s){const i=this.stableId,{requests:r}=e,l=()=>!this.disposed&&this.panel===e;if(t==="default-day-template"){const h=String(s.get("defaultTemplateId")??"")||null;await this.svc.write(()=>v.scheduleTemplates.setDefault({stableId:i,templateId:h}))&&l()&&(e.templates=e.templates.map(p=>({...p,isDefault:p.id===h})),e.status=g("saved"),this.paintDialog(!0),await this.refresh());return}if(t==="save-day-template"||t==="save-template"){const h=t==="save-day-template",u=await this.svc.write(()=>v.scheduleTemplates.save({stableId:i,requestId:r.save,name:String(s.get("name")),startDate:h?String(s.get("sourceDate")):this.startDate,kind:h?"day":void 0}));if(!u||!l())return;h?(e.templates.push(u),e.requests=et(),e.status=g("day_template_saved",{name:u.name}),this.paintDialog(!0)):(this.closePanel(),this.notice=g("saved"),this.paint());return}const c=await this.svc.write(()=>t==="routines"?v.scheduleTemplates.routines({stableId:i,requestId:r.routines,startDate:this.startDate,typeIds:s.getAll("routine").map(String)}):v.scheduleTemplates.apply({stableId:i,requestId:r.apply,startDate:e.mode==="day"?this.selectedDate():this.startDate,templateId:String(s.get("templateId")),keepAssignees:s.has("keepAssignees")}));c&&l()&&(this.closePanel(),this.notice=g("copied",{count:c.count}),await this.refresh())}async submit(e){if(!e.reportValidity()||this.svc.saving.get())return;const t=new FormData(e),s=e.dataset.form;if(s==="activity"){await this.saveActivity();return}if(s==="create-stable"){const i=await this.svc.write(()=>v.stables.create({name:String(t.get("name")),timeZone:String(t.get("timeZone"))}));i&&(await this.svc.loadStables(),this.closePanel(),this.router.navigate("/veckoschema/"+i.id));return}if(s==="invite"){await this.settingsWrite(()=>v.stables.invite({stableId:this.stableId,inviteeEmail:String(t.get("email"))}));return}if(s==="attach-horse"){await this.settingsWrite(()=>v.stables.attachHorse({stableId:this.stableId,horseId:String(t.get("horseId"))}));return}if(s==="save-type"){await this.settingsWrite(()=>v.stables.saveType({stableId:this.stableId,typeId:String(t.get("typeId"))||void 0,name:String(t.get("name")),category:String(t.get("category")),scope:String(t.get("scope")),defaultTime:String(t.get("defaultTime"))||null,archived:t.has("archived")}));return}if(this.panel?.kind==="templates"){await this.submitTemplates(this.panel,s,t);return}if(s==="training"&&this.panel?.kind==="training"){const i=this.panel;let r;try{r=fn(i.performedWall.slice(0,10),i.performedWall.slice(11,16),this.stable().timeZone,i.performedOffset)}catch(c){this.svc.writeError.set("schedule.error."+(c instanceof Error?c.message:"invalid_time"));return}const l=await this.svc.write(()=>v.stableActivities.training({stableId:this.stableId,activityId:i.activity.id,version:i.activity.version,sessionId:i.sessionId||void 0,performedAt:r,durationMin:i.duration?Number(i.duration):null,summary:i.summary,resultNote:i.resultNote,performerIds:i.performerIds}));l&&(this.svc.merge(l),this.closePanel(),this.notice=g("saved"),await this.refresh())}}}class zc extends Ii{}const Ti={"/home":"nav.home","/inbox":"nav.inbox","/lektioner":"nav.lessons","/traningspass":"nav.trainingSessions","/planer":"nav.plans","/mal":"nav.goals","/hastar":"nav.stable","/veckoschema":"nav.weeklySchedule","/hastlogg":"nav.horseLog","/students":"nav.students","/library":"nav.library","/program":"nav.programs","/invitations":"nav.invitations","/konto":"account.title"},jc=Object.keys(Ti).sort((n,e)=>e.length-n.length);function Vc(n){const e=n===""?"/":n;for(const t of jc)if(e===t||e.startsWith(t+"/"))return Ti[t];return null}const Vt=1024,Fc={"/home":Jn,"/login":No,"/register":Po,"/invitations":zo,"/inbox":Vo,"/students":Hl,"/library":od,"/hastar":_d,"/lektioner":Ad,"/traningspass":Bd,"/program":sc,"/planer":cc,"/mal":_c,"/konto":Cc,"/veckoschema":Ii,"/hastlogg":zc},Rc=T(`
    <div bind="layout" class="app-layout">
        <div bind="topBar" class="app-layout__top"></div>
        <div bind="nav" class="app-layout__nav"></div>
        <div class="app-layout__content">
            <div bind="content" class="app-layout__inner"></div>
        </div>
    </div>
    <div bind="drawer" id="app-nav-drawer"></div>
    <div bind="toasts"></div>
`);class Mc extends E{static styles=`
        .app-layout {
            display: grid;
            grid-template: auto 1fr / 1fr;
            height: 100vh;
            background: ${a("bg")};

            & .app-layout__top {
                grid-column: 1 / -1;
            }

            /* Below lg the sidebar is not rendered at all — its content lives in
               the drawer instead. A horizontal scroller of nine links is not
               navigable and would flatten the grouping. */
            & .app-layout__nav {
                display: none;
            }

            & .app-layout__content {
                overflow-y: auto;
                padding: ${d("xl")} ${d("lg")};
            }

            & .app-layout__inner {
                max-width: 1100px;
                margin: 0 auto;

                /* Long-form measure stays readable at every viewport. */
                & p { max-width: 68ch; }

                /* Design system 02: page titles (28/36) and section headings
                   (20/28) are the only place the serif is allowed to run.
                   ONLY EVER WEIGHT 500 — see UI_DECISIONS.md 3: a single static
                   Lora cut ships, so 600 resolves to it with synthetic bold,
                   which is precisely the faked bold the spec forbids. */
                & h1, & h2 {
                    font-family: ${a("font-display")};
                    font-weight: 500;
                }
                & h1 { font-size: 1.75rem; line-height: 36px; }
                & h2 { font-size: 1.25rem; line-height: 28px; }
            }

            @media (min-width: ${Vt}px) {
                grid-template: auto 1fr / 240px 1fr;

                & .app-layout__nav {
                    display: block;
                    overflow-y: auto;
                    /* The nav paints its own surface, but it is only as tall as
                       its links — the column carries the surface to the floor. */
                    background: ${a("surface")};
                    border-right: 1px solid ${a("border")};
                }

                & .app-layout__content {
                    padding: ${d("xl")} ${d("2xl")};
                }
            }
        }

        /* The drawer only exists below lg. Closing it on the breakpoint change is
           handled in script, which is what also releases the scroll lock; this
           rule is the belt-and-braces so a drawer can never sit over a sidebar.
           It is NOT sufficient on its own: display:none hides the panel but
           leaves navOpen true, so the keydown trap stays armed and the overlay's
           body scroll-lock stays engaged. handleKeydown carries the matching
           guard. */
        @media (min-width: ${Vt}px) {
            #app-nav-drawer { display: none; }
        }

        /* Signed out there is nothing to navigate to: /login and /register are
           the only reachable routes, so presenting nine links a visitor cannot
           follow is noise. The selectors deliberately out-specify the rules
           above (0,3,0 and 1,1,0) so cascade order cannot matter.

           The wordmark goes with them. Design system 02 allows exactly ONE
           display/versal brand moment per view, and /login and /register spend
           it on their own centred mark — the shell wordmark sitting above it is
           a second one, and two wordmarks in a view is the failure the rule
           exists to prevent. That leaves the top bar in its minimal state:
           theme toggle only. The toggle stays because it works signed out and
           a visitor arriving at night should be able to turn the lights down;
           sign-out is already absent, its button being :empty without a user. */
        .app-layout.app-layout--anon .app-layout__nav,
        .app-layout.app-layout--anon .top-bar__menu,
        .app-layout.app-layout--anon .top-bar__logo {
            display: none;
        }
        #app-nav-drawer.app-nav-drawer--anon {
            display: none;
        }

        /* Signed out there is exactly one composition on screen and the whole
           content area belongs to it, so /login and /register centre in the
           viewport instead of hanging from the top edge of a 1400px column.
           This lives at the shell because only the shell knows the content area
           is a grid item with a resolved height — the views inside it have no
           height to centre against.

           The "safe" keyword is load-bearing, not decoration: plain centring
           overflows equally in BOTH directions, so on a short viewport (a phone
           in landscape, or the register form at 375px) the top of the card
           would be pushed above the scroll origin and become unreachable.
           Safe alignment falls back to start exactly in that case. */
        /* THE root cause of the stranded login column. Above lg the shell is
           240px + 1fr, and the sidebar is the thing that occupies the 240px
           track. Signed out the sidebar is display:none — so it generates no
           box, does not take a cell, and the content area auto-places into
           column 1 and is laid out 240px wide on a 1280px screen. Every
           signed-out view was being squeezed into the width of a navigation
           rail that is not even rendered. With no sidebar there is no reason
           for a sidebar track, so the anon shell is a single column. */
        .app-layout.app-layout--anon {
            grid-template-columns: minmax(0, 1fr);
        }

        .app-layout.app-layout--anon .app-layout__content {
            display: grid;
            grid-template-columns: minmax(0, 1fr);
            align-content: safe center;
        }
        /* The inner wrapper centres itself with auto inline margins, which is
           correct while it is a BLOCK box but wrong the moment it becomes a grid
           item: auto margins in the inline axis absorb the free space and the
           item falls back to shrink-to-fit, which is what pins the panel into a
           narrow strip on the left and overflows the row. So under --anon the
           auto margins are dropped and the grid does the centring instead —
           width:100% fills the 1fr track, max-width:1100px still caps it, and
           justify-self centres what is left over. */
        .app-layout.app-layout--anon .app-layout__inner {
            margin-inline: 0;
            justify-self: center;
            width: 100%;
        }
    `;router=this.inject(H);app=this.inject(On);auth=this.inject(re);inbox=this.inject(ss);students=this.inject(Ie);teachers=this.inject(fe);panel=null;wide=window.matchMedia(`(min-width: ${Vt}px)`);render(){const e=this.wire(Rc,{});this.spawn(Sa,this.ref(e,"topBar")),this.spawn(Gs,this.ref(e,"nav")),this.spawn(Gt,this.ref(e,"toasts"));const t=this.ref(e,"layout"),s=this.ref(e,"drawer");this.track(w(()=>{const r=!this.auth.currentUser.get();t.classList.toggle("app-layout--anon",r),s.classList.toggle("app-nav-drawer--anon",r),r&&this.app.navOpen.set(!1)})),this.spawn(qt,s,{open:this.app.navOpen,side:"left",width:"280px",content:(r,l)=>{l.spawn(Gs,r,{onNavigate:()=>this.app.navOpen.set(!1)})}}),this.panel=s.querySelector(".ui-drawer"),this.panel?.setAttribute("role","dialog"),this.panel?.setAttribute("aria-modal","true"),this.track(w(()=>this.panel?.setAttribute("aria-label",o("nav.label"))));const i={get:()=>ko(this.router.route.get(),!!this.auth.currentUser.get())};return this.track(w(()=>{const r=this.router.route.get(),l=si(r,!!this.auth.currentUser.get());l&&this.router.navigate(l===ei?us(l,r):l,!0)})),this.track(w(()=>{this.app.titleKey.set(Vc(i.get()))})),this.$swap(this.ref(e,"content"),i,Fc,Jn),e}onMount(){this.track(w(()=>{this.auth.currentUser.get()||Lc()})),this.inbox.load(),this.students.load(),this.teachers.load(),this.track(w(()=>{const i=this.app.navOpen.get();this.panel?.toggleAttribute("inert",!i),i&&this.focusFirstLink()}));const e=i=>this.handleKeydown(i);document.addEventListener("keydown",e),this.track(()=>document.removeEventListener("keydown",e));let t=this.router.route.get();this.track(w(()=>{const i=this.router.route.get();i!==t&&this.app.navOpen.set(!1),t=i}));const s=()=>{this.wide.matches&&this.app.navOpen.set(!1)};this.wide.addEventListener("change",s),this.track(()=>this.wide.removeEventListener("change",s))}focusFirstLink(){requestAnimationFrame(()=>this.panel?.querySelector("a")?.focus())}handleKeydown(e){if(!this.app.navOpen.get()||!this.panel||this.wide.matches)return;if(e.key==="Escape"){e.preventDefault(),this.app.navOpen.set(!1);return}if(e.key!=="Tab")return;const t=[...this.panel.querySelectorAll("a")],s=t[0],i=t[t.length-1];if(!s||!i)return;const r=document.activeElement;e.shiftKey&&(r===s||!this.panel.contains(r))?(e.preventDefault(),i.focus()):!e.shiftKey&&r===i&&(e.preventDefault(),s.focus())}}we.get(Sn);we.get(ma);const Bc=we.get(H),qc=we.get(re);await Wi(Mc,"#app",{hot:void 0,onInit:async()=>{w(()=>{En({type:"navigation",detail:Bc.route.get(),timestamp:new Date().toISOString()})}),await qc.load()}});export{Ft as A,E as C,H as R,m as S,Sn as T,y as a,x as b,Ce as c,Gc as d,w as e,Kc as n,$ as r,T as t};
