(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const i of document.querySelectorAll('link[rel="modulepreload"]'))s(i);new MutationObserver(i=>{for(const r of i)if(r.type==="childList")for(const d of r.addedNodes)d.tagName==="LINK"&&d.rel==="modulepreload"&&s(d)}).observe(document,{childList:!0,subtree:!0});function t(i){const r={};return i.integrity&&(r.integrity=i.integrity),i.referrerPolicy&&(r.referrerPolicy=i.referrerPolicy),i.crossOrigin==="use-credentials"?r.credentials="include":i.crossOrigin==="anonymous"?r.credentials="omit":r.credentials="same-origin",r}function s(i){if(i.ep)return;i.ep=!0;const r=t(i);fetch(i.href,r)}})();const Ps="modulepreload",Ds=function(n){return"/teacher-student/"+n},Rt={},js=function(e,t,s){let i=Promise.resolve();if(t&&t.length>0){let h=function(p){return Promise.all(p.map(g=>Promise.resolve(g).then(m=>({status:"fulfilled",value:m}),m=>({status:"rejected",reason:m}))))};document.getElementsByTagName("link");const d=document.querySelector("meta[property=csp-nonce]"),c=d?.nonce||d?.getAttribute("nonce");i=h(t.map(p=>{if(p=Ds(p),p in Rt)return;Rt[p]=!0;const g=p.endsWith(".css"),m=g?'[rel="stylesheet"]':"";if(document.querySelector(`link[href="${p}"]${m}`))return;const _=document.createElement("link");if(_.rel=g?"stylesheet":Ps,g||(_.as="script"),_.crossOrigin="",_.href=p,c&&_.setAttribute("nonce",c),document.head.appendChild(_),g)return new Promise((x,C)=>{_.addEventListener("load",x),_.addEventListener("error",()=>C(new Error(`Unable to preload CSS for ${p}`)))})}))}function r(d){const c=new Event("vite:preloadError",{cancelable:!0});if(c.payload=d,window.dispatchEvent(c),!c.defaultPrevented)throw d}return i.then(d=>{for(const c of d||[])c.status==="rejected"&&r(c.reason);return e().catch(r)})},Tn="/teacher-student/".replace(/\/+$/,""),gt=Tn+"/api";class Vs{tracking=null;batching=!1;pending=new Set;subscribe(e){this.tracking&&(e.add(this.tracking),this.tracking.deps.add(e))}notify(e){for(const t of[...e])this.batching?this.pending.add(t):t.run()}runTracked(e,t){Ln(e);const s=this.tracking;this.tracking=e;try{t()}finally{this.tracking=s}}untrack(e){const t=this.tracking;this.tracking=null;try{return e()}finally{this.tracking=t}}batch(e){this.batching=!0;try{e()}finally{this.batching=!1;const t=[...this.pending];this.pending.clear();for(const s of t)s.run()}}}const re=new Vs;function Ln(n){for(const e of n.deps)e.delete(n);n.deps.clear()}class u{val;subs=new Set;constructor(e){this.val=e}get(){return re.subscribe(this.subs),this.val}peek(){return this.val}set(e){Object.is(this.val,e)||(this.val=e,re.notify(this.subs))}update(e){this.set(e(this.val))}}class f{val;subs=new Set;constructor(e){this.val=void 0;const t=this,s={run(){re.runTracked(s,()=>{const i=e();Object.is(t.val,i)||(t.val=i,re.notify(t.subs))})},deps:new Set};s.run()}get(){return re.subscribe(this.subs),this.val}peek(){return this.val}}function b(n){const e={run(){re.runTracked(e,n)},deps:new Set};return e.run(),()=>Ln(e)}function ge(n){re.batch(n)}function P(n){return re.untrack(n)}class Fs{instances=new Map;get(e){let t=this.instances.get(e);return t||(t=new e,this.instances.set(e,t)),t}set(e,t){this.instances.set(e,t)}reset(){this.instances.clear()}}const he=new Fs,xe=Tn;function mt(n){return xe?n===xe?"/":n.startsWith(xe+"/")?n.slice(xe.length):n:n}function Rs(n){return xe+n}class L{route=new u(mt(location.pathname??"/"));search=new u(location.search??"");constructor(){window.addEventListener("popstate",()=>ge(()=>{this.route.set(mt(location.pathname)),this.search.set(location.search)}))}navigate(e,t){const s=typeof t=="boolean"?{replace:t}:t??{},i=e.indexOf("#"),r=i>=0?e.slice(i):"",d=i>=0?e.slice(0,i):e,c=d.indexOf("?"),h=c>=0?d.slice(0,c):d,p=c>=0?d.slice(c+1):"",g=s.query!==void 0?Ms(s.query):p?"?"+p:"",m=Rs(h)+g+r;(s.replace?history.replaceState:history.pushState).call(history,null,"",m),ge(()=>{this.route.set(h),this.search.set(g)})}back(){history.back()}link(e,t="active"){const s=e.split("#")[0].split("?")[0];return{onclick:i=>{i.preventDefault(),this.navigate(e)},className:()=>{const i=this.route.get();return i===s||i.startsWith(s+"/")?t:""}}}params(e){const t=e.split("/");return new f(()=>{const s=this.route.get().split("/"),i={};for(const[r,d]of t.entries())d.startsWith(":")&&(i[d.slice(1)]=s[r]??"");return i})}query(e){return new f(()=>new URLSearchParams(this.search.get()).get(e)??void 0)}queries(){return new f(()=>{const e={};for(const[t,s]of new URLSearchParams(this.search.get()))e[t]=s;return e})}}function Ms(n){const e=new URLSearchParams;for(const[s,i]of Object.entries(n))i==null||i===""||e.set(s,String(i));const t=e.toString();return t?"?"+t:""}function Bs(n){return e=>n[e]}const Gs="@media (prefers-reduced-motion: reduce){*,*::before,*::after{animation-duration:.01ms !important;animation-iteration-count:1 !important;transition-duration:.01ms !important}}",Mt="data-basics-global";function Ks(){if(document.head.querySelector(`style[${Mt}]`))return;const n=document.createElement("style");n.setAttribute(Mt,""),n.textContent=Gs,document.head.appendChild(n)}function qs(n,e){Ks();const t=(i,r,d)=>{const c=Object.entries(i).map(([h,p])=>`--${h}:${p}`).join(";");return`${r}{color-scheme:${d};${c}}`},s=document.createElement("style");return s.textContent=t(n,'[data-theme="light"]',"light")+t(e,'[data-theme="dark"]',"dark"),document.head.appendChild(s),i=>`var(--${i})`}const Bt="basics-js-theme";class In{dark=new u(!1);constructor(){const e=localStorage.getItem(Bt),t=matchMedia("(prefers-color-scheme: dark)").matches;this.dark.set(e?e==="dark":t),b(()=>{const s=this.dark.get();document.documentElement.setAttribute("data-theme",s?"dark":"light"),localStorage.setItem(Bt,s?"dark":"light")})}toggle(){this.dark.update(e=>!e)}}function S(n){const e=document.createElement("template");return e.innerHTML=n,e}function Us(n,e){let t;for(const s of Object.keys(e))n.startsWith(s+"/")&&(!t||s.length>t.length)&&(t=s);return t?e[t]:void 0}const Gt=new Set;class ${constructor(e={}){this.props=e;const t=this.constructor;if(t.styles&&!Gt.has(t)){Gt.add(t);const s=document.createElement("style");s.textContent=t.styles,document.head.appendChild(s)}}props;disposers=[];children=[];onMount(){}onDestroy(){}inject(e){return he.get(e)}track(e){this.disposers.push(e)}ref(e,t){return e.querySelector(`[bind="${t}"]`)}spawn(e,t,...s){const i=P(()=>{const r=new e(s[0]);return r.mount(t),r});return this.children.push(i),i}mount(e){e.appendChild(this.render()),this.onMount()}destroy(){this.onDestroy();for(const e of this.children)e.destroy();this.children.length=0;for(const e of this.disposers)e();this.disposers.length=0}wire(e,t,s){const i=s??(d=>this.track(d)),r=e.content.cloneNode(!0);for(const d of r.querySelectorAll("[bind]")){const c=t[d.getAttribute("bind")];if(c)if(typeof c=="function")i(b(()=>{const h=c();d instanceof HTMLInputElement||d instanceof HTMLTextAreaElement?d.value=String(h):d.textContent=String(h)}));else for(const[h,p]of Object.entries(c)){const g=h.includes("-");h.startsWith("on")&&typeof p=="function"?d.addEventListener(h.slice(2),p):typeof p=="function"?i(b(()=>{const m=p();g?d.setAttribute(h,String(m)):d[h]=m})):g?d.setAttribute(h,String(p)):d[h]=p}}return r}wireEl(e,t,s){return this.wire(e,t,s).firstElementChild}slot(e,t){const s=this.props[e];if(s==null)return!1;const i=this.ref(t,e);return i?(typeof s=="string"?i.textContent=s:typeof s=="function"&&s.prototype instanceof $?this.spawn(s,i):typeof s=="function"&&s(i,{spawn:(r,d,...c)=>this.spawn(r,d,...c),track:r=>this.track(r)}),!0):!1}$each(e,t,s,i=(r,d)=>d){const r=typeof t=="function"?t:()=>t.get(),d=new Map,c=new Map;this.track(()=>{for(const h of c.values())h.forEach(p=>p());c.clear()}),this.track(b(()=>{const h=r(),p=new Map;for(const[m,_]of h.entries()){const x=i(_,m);if(d.has(x))p.set(x,d.get(x));else{const C=[];p.set(x,P(()=>s(_,m,E=>C.push(E)))),c.set(x,C)}}for(const[m,_]of d)p.has(m)||(_.remove(),c.get(m)?.forEach(x=>x()),c.delete(m));let g=e.firstChild;for(const m of p.values())m===g?g=g.nextSibling:e.insertBefore(m,g);d.clear();for(const[m,_]of p)d.set(m,_)}))}$condition(e,t,s,i){let r=null;this.track(b(()=>{r&&(r.remove(),r=null);const d=t.get();r=P(()=>d?s():i?.()??null),r&&e.appendChild(r)}))}$swap(e,t,s,i){let r=null;this.track(b(()=>{r&&(r.destroy(),r=null),e.textContent="";const d=t.get(),c=s[d]??Us(d,s)??i;c&&(r=P(()=>{const h=new c;return h.mount(e),h}))})),this.track(()=>r?.destroy())}}const Fe=new Set;function Ws(n){return Fe.add(n),()=>Fe.delete(n)}function Ys(){for(const n of Array.from(Fe)){Fe.delete(n);try{n()}catch(e){console.error("[startApp] a dispose callback threw",e)}}}async function Xs(n,e,t){const s=document.querySelector(e);s.textContent="";const i=he.get(L);let r=null,d=!1,c=null,h=!!t?.hot?.data.hmr;const p=async g=>{r&&(r.destroy(),r=null,s.textContent=""),g?(c||(c=(await js(()=>import("./obs-shell.component-BR7kiKf2.js"),[])).ObsShellComponent),r=P(()=>new c)):(!h&&t?.onInit&&(await t.onInit(),h=!0),r=P(()=>new n)),P(()=>r.mount(s)),d=g};await p(mt(location.pathname).startsWith("/_obs")),b(()=>{const g=i.route.get().startsWith("/_obs");g!==d&&p(g)}),t?.hot&&(t.hot.data.hmr=!0,t.hot.dispose(()=>{try{r?.destroy()}catch(g){console.error("[startApp] the root component threw while disposing",g)}if(r=null,Ys(),t.onDispose)try{t.onDispose()}catch(g){console.error("[startApp] onDispose threw",g)}}),t.hot.accept())}class me extends Error{constructor(e,t,s,i){super(t),this.status=e,this.details=s,this.traceId=i,this.name="ApiError"}status;details;traceId}const Qs=10,De=[];let je=[],we=null;function An(n){De.push(n),De.length>Qs&&De.shift()}function Hn(n,e,t){const s={code:n,message:e,url:typeof location<"u"?location.href:"",context:[...De],timestamp:new Date().toISOString()};t!==void 0&&(s.traceId=t),je.push(s),Js()}function Js(){we||(we=setTimeout(On,5e3))}function On(){if(we&&(clearTimeout(we),we=null),je.length===0)return;const n=je;je=[];for(const e of n){const t=JSON.stringify(e);typeof navigator<"u"&&navigator.sendBeacon?navigator.sendBeacon(`${gt}/_obs/errors`,new Blob([t],{type:"application/json"})):typeof fetch<"u"&&fetch(`${gt}/_obs/errors`,{method:"POST",headers:{"Content-Type":"application/json"},body:t}).catch(()=>{})}}typeof document<"u"&&document.addEventListener("visibilitychange",()=>{document.visibilityState==="hidden"&&On()});const Zs=3e4,ei=2,Ae=new Map,zn=new WeakMap;function ti(n){if(n instanceof me)return n.traceId;if(n!=null&&typeof n=="object")return zn.get(n)}async function y(n){if(n.method==="GET"){const e=Ae.get(n.url);if(e)return e;const t=Kt(n,ei);return Ae.set(n.url,t),t.then(()=>Ae.delete(n.url),()=>Ae.delete(n.url)),t}return Kt(n,0)}async function Kt(n,e){const t=n.timeout??Zs;let s;for(let i=0;i<=e;i++){const r=crypto.randomUUID();try{return await si(ni(n,r),t)}catch(d){if(s=d,!(d instanceof me)&&d!=null&&typeof d=="object"&&zn.set(d,r),d instanceof me||i===e)break;await new Promise(c=>setTimeout(c,1e3*2**i))}}throw s}async function ni(n,e){const t={"X-Trace-Id":e},s={method:n.method,headers:t};n.body!==void 0&&(t["Content-Type"]="application/json",s.body=JSON.stringify(n.body));const i=await fetch(n.url,s),r=i.headers.get("x-trace-id")??e;if(An({type:"api",detail:`${n.method} ${n.url}`,timestamp:new Date().toISOString()}),!i.ok){const d=await i.json().catch(()=>({error:i.statusText}));throw new me(i.status,d.error??i.statusText,d.details,r)}return i.json()}function si(n,e){let t;const s=new Promise((i,r)=>{t=setTimeout(()=>r(new Error("Request timeout")),e)});return Promise.race([n,s]).finally(()=>clearTimeout(t))}const ft=new Set;let tt=!1;function ii(n){return ft.add(n),()=>{ft.delete(n)}}function ai(){if(!tt){tt=!0;try{for(const n of[...ft])try{n()}catch(e){try{Hn("session-listener",oi(e))}catch{}}}finally{tt=!1}}}function oi(n){try{if(n instanceof Error){const e=n.message;if(typeof e=="string")return e}return String(n)}catch{return"listener threw a value that could not be described"}}async function w(n,e,t,s={}){ge(()=>{n.set(!0),e.set(null)});try{const i=await t();return n.set(!1),i}catch(i){const r=ri(i);ge(()=>{n.set(!1),e.set(r)}),Hn(r.code,r.message,ti(i)),r.code==="auth"&&s.sessionExpiry!==!1&&ai();return}}function ri(n){return n instanceof me?n.status===401?{code:"auth",message:"Unauthorized"}:n.status===409?{code:"conflict",message:"Data has changed — please try again"}:n.status===400?{code:"validation",message:n.message}:n.status===429?{code:"rateLimit",message:"Too many requests"}:{code:"server",message:"Server error"}:n instanceof Error?n.message==="Request timeout"?{code:"timeout",message:"Request timeout"}:{code:"network",message:"Network error"}:{code:"unknown",message:"Unknown error"}}const qt={sessionExpiry:!1};function li(n){return{me:()=>y({method:"GET",url:`${n}/auth/me`}),login:e=>y({method:"POST",url:`${n}/auth/login`,body:e}),logout:()=>y({method:"POST",url:`${n}/auth/logout`,body:{}})}}class ne{api=li(gt);currentUser=new u(null);loading=new u(!1);error=new u(null);offSessionExpired;offAppDispose;constructor(){this.offSessionExpired=ii(()=>{this.currentUser.peek()!==null&&this.currentUser.set(null)}),this.offAppDispose=Ws(()=>this.destroy())}destroy(){this.offSessionExpired(),this.offSessionExpired=()=>{},this.offAppDispose(),this.offAppDispose=()=>{}}async load(){const e=await w(this.loading,this.error,()=>this.api.me());e&&this.currentUser.set(e),this.error.get()?.code==="auth"&&this.error.set(null)}async login(e,t){const s=await w(this.loading,this.error,()=>this.api.login({username:e,password:t}),qt);return s?(this.currentUser.set(s),!0):!1}async logout(){await w(this.loading,this.error,()=>this.api.logout(),qt);const e=this.error.get();(!e||e.code==="auth")&&this.currentUser.set(null)}}const Ut={"font-display":"Lora,Georgia,'Times New Roman',serif","font-ui":"'Open Sans','Segoe UI',system-ui,sans-serif","space-1":"4px","space-2":"8px","space-3":"12px","space-4":"16px","space-5":"24px","space-6":"32px","space-7":"48px","space-8":"64px","radius-sm":"4px","radius-md":"8px","radius-pill":"999px","dur-fast":"120ms","dur-base":"200ms","dur-slow":"320ms","ease-standard":"cubic-bezier(.2,.7,.3,1)"},Wt={"field-bg":"var(--bg)","field-border":"var(--border)","field-bg-focus":"var(--surface)","field-rule":"var(--border-strong)","field-rule-width":"2px","field-padding-y":"10px","field-padding-x":"12px","field-invalid-border":"var(--border)","btn-padding-y":"9px","btn-padding-x":"20px","btn-font-size":"13px","btn-font-weight":"600","btn-primary-shadow":"var(--shadow-1)","btn-secondary-bg":"transparent","btn-secondary-bg-hover":"transparent","btn-secondary-fg-hover":"var(--accent)","btn-secondary-border":"var(--border-strong)","btn-secondary-border-hover":"var(--accent)","btn-ghost-bg-hover":"var(--accent-soft)","btn-ghost-fg-hover":"var(--accent)","btn-danger-bg":"transparent","btn-danger-fg":"var(--danger)","btn-danger-border":"var(--danger)","btn-danger-bg-hover":"var(--danger)","btn-danger-fg-hover":"var(--on-danger)","btn-danger-border-hover":"var(--danger)"},o=qs({...Ut,...Wt,bg:"#F6F4F1",surface:"#FFFFFF","surface-2":"#EFEBE4",text:"#1C1F21","text-muted":"#696159",border:"#DED7CF","border-strong":"#9A8E7B",accent:"#845C24","accent-strong":"#6B4A1D","accent-soft":"#F3EADD","on-accent":"#FFFFFF","brass-line":"#CFAA81",cream:"#FFE9C2",success:"#2E6047","success-soft":"#E4EFE8",warning:"#9A4A1E","warning-soft":"#F7E9DE",danger:"#A3292F","danger-soft":"#F8E6E6","on-danger":"#FFFFFF",info:"#3E5974","info-soft":"#E3EAF1","shadow-1":"0 1px 2px rgba(28,31,33,.06)","shadow-2":"0 4px 12px rgba(28,31,33,.10)","shadow-3":"0 16px 40px rgba(28,31,33,.22)"},{...Ut,...Wt,bg:"#131A20",surface:"#1C1F21","surface-2":"#262A2B",text:"#F1ECE3","text-muted":"#AFA698",border:"#3B372F","border-strong":"#7A7059",accent:"#CFAA81","accent-strong":"#E2C29C","accent-soft":"#2C271F","on-accent":"#1C1F21","brass-line":"#8A6B45",cream:"#FFE9C2",success:"#8CC5A4","success-soft":"#1E2B23",warning:"#E1955F","warning-soft":"#2E231A",danger:"#E39396","danger-soft":"#332122","on-danger":"#1C1F21",info:"#93B3CE","info-soft":"#1E2733","shadow-1":"0 1px 2px rgba(0,0,0,.4)","shadow-2":"0 4px 14px rgba(0,0,0,.5)","shadow-3":"0 16px 44px rgba(0,0,0,.6)"}),ce=new Map,Q=new u("en"),Yt=new Set;let Re="en";function Pn(n,e){ce.set(n,{...ce.get(n),...e})}function di(n){Re=n,ce.has(Q.peek())||Q.set(n)}function Dn(){return Q.get()}function ci(n){Q.set(n)}function ke(n){return ce.get(Q.get())?.[n]??ce.get(Re)?.[n]}function jn(n){return Yt.has(n)||(Yt.add(n),console.warn(`[i18n] missing key "${n}" for locale "${Q.peek()}"`)),n}function Vn(n,e){return e?n.replace(/\{(\w+)\}/g,(t,s)=>s in e?String(e[s]):t):n}function a(n,e){const t=ke(n);return t===void 0?jn(n):Vn(t,e)}const Xt=new Map;function hi(n){let e=Xt.get(n);return e||(e=new Intl.PluralRules(n),Xt.set(n,e)),e}function V(n,e,t){const s=Q.get(),i=e===0&&ke(`${n}.zero`)!==void 0?"zero":hi(s).select(e),r=ke(`${n}.${i}`)??ke(`${n}.other`);return r===void 0?jn(`${n}.${i}`):Vn(r,{count:e,...t})}function xt(n){return n&&n.charAt(0).toLocaleUpperCase(Q.get())+n.slice(1)}function Me(n){return n instanceof Date?n:new Date(n)}const Qt=new Map;function pi(n,e){const t=n+JSON.stringify(e);let s=Qt.get(t);return s||(s=new Intl.DateTimeFormat(n,e),Qt.set(t,s)),s}function F(n,e={year:"numeric",month:"long",day:"numeric"}){return pi(Q.get(),e).format(Me(n))}function ui(n){const e=Q.get();return F(n,{month:"short"}).replace(/\.$/,"").toLocaleUpperCase(e)}function wt(n){return ui(n).slice(0,3)}function Ke(n){const e=Me(n),t=s=>String(s).padStart(2,"0");return`${e.getFullYear()}-${t(e.getMonth()+1)}-${t(e.getDate())}`}const Jt=new Map;function Zt(n,e){const t=n+"|"+e;let s=Jt.get(t);return s||(s=new Intl.RelativeTimeFormat(n,{numeric:"auto",style:e}),Jt.set(t,s)),s}function en(n){return new Date(n.getFullYear(),n.getMonth(),n.getDate()).getTime()}const bt=60,Ve=60*bt,gi=24*Ve,mi={[-1]:"relative.yesterday",0:"relative.today",1:"relative.tomorrow"};function qe(n,e=new Date){const t=Me(n),s=Me(e),i=Q.get(),r=Zt(i,"short"),d=(t.getTime()-s.getTime())/1e3,c=Math.abs(d),h=Math.round((en(t)-en(s))/(gi*1e3));if(h===0||c<6*Ve)return c<bt?r.format(Math.round(d),"second"):c<Ve?r.format(Math.round(d/bt),"minute"):r.format(Math.round(d/Ve),"hour");if(Math.abs(h)<7){const p=mi[h];return(p===void 0?void 0:ke(p))??Zt(i,"long").format(h,"day")}return t.getFullYear()===s.getFullYear()?F(t,{day:"numeric",month:"long"}):F(t,{day:"numeric",month:"long",year:"numeric"})}const tn="basics-js-locale";function fi(n){if(!n)return;if(ce.has(n))return n;const e=n.split("-")[0];return ce.has(e)?e:void 0}class bi{code=new u(Re);constructor(){const e=localStorage.getItem(tn);this.code.set(fi(e)??void 0??Re),b(()=>{const s=this.code.get();ci(s),document.documentElement.setAttribute("lang",s)})}set(e){this.code.set(e),localStorage.setItem(tn,e)}}const _i={"app.brand":"Lindgren Equestrian","nav.label":"Huvudmeny","nav.openMenu":"Öppna menyn","nav.home":"Hem","nav.inbox":"Inkorg","nav.inboxPending.one":"{count} inbjudan väntar","nav.inboxPending.other":"{count} inbjudningar väntar","nav.group.training":"Träning","nav.lessons":"Lektioner","nav.trainingSessions":"Träningspass","nav.group.planning":"Planering & stall","nav.plans":"Planer","nav.goals":"Mål","nav.stable":"Hästar","nav.group.teaching":"Undervisning","nav.students":"Mina elever","nav.library":"Bibliotek","nav.invitations":"Inbjudningar","nav.programs":"Program","topBar.theme.toLight":"Ljust läge","topBar.theme.toDark":"Mörkt läge","topBar.signOut":"Logga ut","relative.yesterday":"i går","relative.today":"i dag","relative.tomorrow":"i morgon","objectKind.goal":"Mål","objectKind.plan":"Plan","objectKind.lesson":"Lektion","objectKind.trainingSession":"Träningspass","objectKind.exercise":"Övning","share.private":"Privat","share.sharedWith":"Delad: {name}","share.sharedWithMore.one":"Delad: {name} +{count}","share.sharedWithMore.other":"Delad: {name} +{count}","share.sharedWithAll":"Delad med {names}","share.sharedUnknown":"Delad: okänd mottagare","role.teacher":"Lärare","role.student":"Elev","notes.heading.zero":"Anteckningar","notes.heading.one":"Anteckningar · {count}","notes.heading.other":"Anteckningar · {count}","notes.empty":"Inga anteckningar än.","notes.placeholder":"Skriv en anteckning…","notes.submit":"Lägg till","notes.visibility":"Synlighet","notes.shareUnavailable":"Ingen att dela med","notes.hintPrivate":"Bara du ser den här anteckningen.","notes.hintShared":"{names} ser anteckningen och kan svara.","notes.hintNoRecipients":"Du har ingen att dela med än — anteckningen blir privat.","notes.edit":"Redigera","notes.delete":"Ta bort","notes.save":"Spara","notes.cancel":"Avbryt","notes.deleteTitle":"Ta bort anteckningen?","notes.deleteConsequence":"Anteckningen försvinner för alla som kan se den och går inte att få tillbaka.","detail.moreActions":"Fler handlingar","students.heading":"Mina elever","students.invite":"Bjud in elev","students.loading":"Hämtar elever…","students.error":"Eleverna kunde inte hämtas.","students.retry":"Försök igen","students.empty.heading":"Ingen elev än","students.empty.body":"Bjud in din första elev med e-post. När hen tackar ja samlas lektioner, planer och mål här.","students.invitedOnly.body":"Inbjudan är skickad. Eleven dyker upp här så snart hen har skapat ett konto med samma adress och tackat ja.","student.nextLesson":"Nästa lektion {when}","invite.field.email":"Elevens e-post","invite.field.email.hint":"Samma adress som eleven skapar sitt konto med.","invite.submit":"Skicka inbjudan","invite.cancel":"Avbryt","invite.error.emailRequired":"Fyll i elevens e-postadress.","invite.error.emailInvalid":"Kontrollera adressen — den behöver ett @ och en domän, till exempel namn@exempel.se.","invite.error.conflict":"Det finns redan en obesvarad inbjudan till {email}.","invite.error.failed":"Inbjudan kunde inte skickas. Försök igen.","invite.sent":"Inbjudan är skickad till {email}.","invitations.heading":"Inbjudna","invitations.loading":"Hämtar inbjudningar…","invitations.error":"Inbjudningarna kunde inte hämtas.","invitations.empty":"Inga inbjudningar väntar.","invitations.sent":"Skickad {when}","invitations.status.pending":"Väntar på svar","invitations.status.accepted":"Accepterad","invitations.status.declined":"Tackade nej","invitations.status.revoked":"Återkallad","invitations.status.expired":"Avslutad","invitations.revoke":"Återkalla","invitations.revokeError":"Inbjudan kunde inte återkallas. Försök igen.","invitations.confirm.title":"Återkalla inbjudan?","invitations.confirm.message":"{email} kan inte längre tacka ja, och inbjudan går inte att få tillbaka. Vill du bjuda in adressen igen får du skicka en ny inbjudan.","invitations.confirm.dismiss":"Avbryt","invitations.toast.revoked":"Inbjudan till {email} är återkallad.","invitations.page.heading":"Mina inbjudningar","invitations.page.email":"Email","invitations.page.submit":"Bjud in","invitations.page.submitting":"…","invitations.page.error.conflict":"En inbjudan till den emailen är redan aktiv","inbox.heading":"Inkorg","inbox.empty":"Inga väntande inbjudningar.","inbox.from":"Inbjudan från {name} ({email})","inbox.accept":"Acceptera","inbox.decline":"Avböj","inbox.error.conflict":"Inbjudan är inte längre giltig","student.eyebrow":"Elev","student.back":"Alla elever","student.loading":"Hämtar eleven…","student.error":"Eleven kunde inte hämtas.","student.notFound.heading":"Eleven finns inte","student.notFound.body":"Kopplingen kan vara borttagen, eller så är det inte din elev. Kontrollera länken.","student.notFound.action":"Till mina elever","student.book":"Boka lektion","student.relation":"Du är lärare · {email}","student.tab.overview":"Översikt","student.tab.lessons":"Lektioner","student.tab.sessions":"Pass","student.tab.plans":"Planer","student.tab.goals":"Mål","student.tab.horses":"Hästar","student.tab.history":"Historik","student.overview.loading":"Hämtar översikten…","student.overview.error":"Översikten kunde inte hämtas.","student.overview.unavailable":"Kunde inte hämtas","student.overview.nextLesson":"Nästa lektion","student.overview.nextLesson.none":"Ingen bokad lektion","student.overview.latestSession":"Senaste delade passet","student.overview.latestSession.none":"Inget pass delat med dig än","student.overview.activePlans":"Aktiva planer","student.overview.sharedGoals":"Delade mål","student.overview.sharedGoals.meta":"Bara mål eleven delat med dig räknas.","student.overview.planCount.one":"{count} plan","student.overview.planCount.other":"{count} planer","student.overview.goalCount.one":"{count} mål","student.overview.goalCount.other":"{count} mål","student.overview.activity":"Senaste aktivitet","student.overview.activity.empty":"Inget har hänt än.","student.lessons.loading":"Hämtar lektioner…","student.lessons.error":"Lektionerna kunde inte hämtas.","student.lessons.empty.heading":"Inga lektioner än","student.lessons.empty.body":"Boka den första lektionen, så samlas den här med häst, plan och övningar.","student.sessions.lede":"Bara träningspass som eleven delat med dig visas här.","student.sessions.loading":"Hämtar träningspass…","student.sessions.error":"Träningspassen kunde inte hämtas.","student.sessions.empty.heading":"Inga delade pass än","student.sessions.empty.body":"Eleven väljer själv vilka pass du får läsa. Delade pass dyker upp här.","student.plans.loading":"Hämtar planer…","student.plans.error":"Planerna kunde inte hämtas.","student.plans.empty.heading":"Ingen aktiv plan","student.plans.empty.body":"Eleven har ingen plan igång just nu. Planer skapas av eleven själv.","student.goals.lede":"Bara mål som eleven delat med dig visas här.","student.goals.loading":"Hämtar mål…","student.goals.error":"Målen kunde inte hämtas.","student.goals.empty.heading":"Inga delade mål","student.goals.empty.body":"Eleven väljer själv vilka mål du får följa. Delade mål dyker upp här.","student.horses.loading":"Hämtar hästar…","student.horses.error":"Hästarna kunde inte hämtas.","student.horses.empty.heading":"Inga hästar i stallet","student.horses.empty.body":"Eleven har inte lagt till någon häst än. Stallet sköter eleven själv.","student.history.loading":"Hämtar övningar…","student.history.error":"Övningarna kunde inte hämtas.","student.history.empty.heading":"Inga övningar i biblioteket","student.history.empty.body":"Lägg till en övning i ditt bibliotek, så kan du följa den över tid.","student.history.empty.action":"Till biblioteket","student.history.field":"Övning","student.history.placeholder":"Välj övning","student.history.open":"Öppna historiken","student.history.hint":"Välj en övning för att se allt {name} har gjort i den.","lessons.heading":"Lektioner","lessons.book":"Boka lektion","lessons.group.upcoming":"Kommande","lessons.group.past":"Tidigare","lessons.loading":"Hämtar lektioner…","lessons.error":"Lektionerna kunde inte hämtas.","lessons.retry":"Försök igen","lessons.empty.teacher.heading":"Inga lektioner än","lessons.empty.teacher.body":"Boka den första lektionen, så samlas den här med häst, plan och övningar.","lessons.empty.rider.heading":"Inga lektioner än","lessons.empty.rider.body":"Lektioner som din lärare bokar dyker upp här. Vill du undervisa själv behöver du först en elev.","lessons.empty.rider.action":"Bjud in elev","lesson.status.planned":"Planerad","lesson.status.completed":"Utförd","lesson.status.cancelled":"Inställd","lesson.title.plain":"Lektion","lesson.title.programs.one":"Lektion från {count} program","lesson.title.programs.other":"Lektion från {count} program","lesson.title.exercises.one":"Lektion med {count} övning","lesson.title.exercises.other":"Lektion med {count} övningar","lesson.chip.plan":"Plan: {title}","lesson.chip.program":"Program: {title}","lesson.chip.horse":"Häst: {name}","lesson.horse.none":"Ingen häst","lesson.plan.none":"Ingen plan","lesson.more":"+{count}","lesson.exercises.none":"Inga övningar","lesson.exerciseSummary.one":"{count} övning · {names}","lesson.exerciseSummary.other":"{count} övningar · {names}","lesson.back":"Alla lektioner","lesson.loading":"Hämtar lektionen…","lesson.notFound.heading":"Lektionen finns inte","lesson.notFound.body":"Den kan vara borttagen, eller så är den inte din. Kontrollera länken.","lesson.notFound.action":"Till lektioner","lesson.section.details":"Uppgifter","lesson.section.exercises":"Övningar","lesson.section.programs":"Program","lesson.field.when":"Datum & tid","lesson.field.horse":"Häst","lesson.field.plan":"Plan","lesson.save":"Spara","lesson.saved":"Ändringarna är sparade.","lesson.action.complete":"Markera utförd","lesson.action.cancel":"Ställ in","lesson.confirm.dismiss":"Avbryt","lesson.confirm.complete.title":"Markera lektionen som utförd?","lesson.confirm.complete.message":"Statusen är slutgiltig och går inte att ändra tillbaka. Övningar och program låses, men anteckningar kan fortfarande skrivas.","lesson.confirm.cancel.title":"Ställ in lektionen?","lesson.confirm.cancel.message":"Statusen är slutgiltig och går inte att ändra tillbaka. Övningar och program låses, men anteckningar kan fortfarande skrivas.","lesson.toast.completed":"Lektionen är markerad som utförd.","lesson.toast.cancelled":"Lektionen är inställd.","lesson.toast.undo":"Ångra","lesson.toast.exerciseRemoved":"{name} togs bort från lektionen.","lesson.toast.programDetached":"{title} togs bort som källa. Övningarna som kopierats därifrån är kvar.","lesson.locked.completed":"Lektionen är utförd. Övningar och program är låsta, men anteckningar är fortfarande öppna.","lesson.locked.cancelled":"Lektionen är inställd. Övningar och program är låsta, men anteckningar är fortfarande öppna.","lesson.conflict.message":"Lektionen har ändrats någon annanstans, så ändringen gick inte igenom. Hämta den senaste versionen och försök igen.","lesson.conflict.action":"Hämta på nytt","lesson.exercises.empty":"Inga övningar än.","lesson.exercise.add":"Lägg till övning","lesson.exercise.placeholder":"Välj övning","lesson.exercise.remove":"Ta bort","lesson.exercise.source":"Från {title}","lesson.exercise.sourceGone":"Från ett borttaget program","lesson.exercise.history":"Övningshistorik","lesson.exercise.notesShow":"Anteckningar","lesson.exercise.notesHide":"Dölj anteckningar","lesson.programs.empty":"Inga program kopplade.","lesson.programs.attach":"Koppla program","lesson.programs.placeholder":"Välj program","lesson.programs.detach":"Ta bort källa","lesson.programs.detachHint":"Att ta bort ett program tar inte bort övningarna som redan kopierats därifrån — de stannar i lektionen.","lessonCreate.heading":"Boka lektion","lessonCreate.field.student":"Elev","lessonCreate.field.student.placeholder":"Välj elev","lessonCreate.field.when":"Datum & tid","lessonCreate.field.horse":"Häst","lessonCreate.field.horse.hint":"Hästar i elevens stall.","lessonCreate.field.plan":"Plan","lessonCreate.field.plan.hint":"Elevens aktiva planer.","lessonCreate.field.programs":"Program","lessonCreate.field.programs.hint":"Programmens övningar kopieras in i lektionen. Lektionen följer inte programmet — ändrar du programmet senare påverkas inte den här lektionen.","lessonCreate.field.programs.placeholder":"Välj program","lessonCreate.programsCount.one":"{count} valt","lessonCreate.programsCount.other":"{count} valda","lessonCreate.submit":"Boka lektion","lessonCreate.cancel":"Avbryt","lessonCreate.error.student":"Välj vilken elev lektionen gäller.","lessonCreate.error.when":"Välj datum och tid för lektionen.","lessonCreate.created":"Lektionen är bokad.","lessonCreate.createdPartial":"Lektionen är bokad, men allt kunde inte läggas till. Kontrollera häst och program nedan.","trainingSessions.heading":"Träningspass","trainingSessions.log":"Logga pass","trainingSessions.loading":"Hämtar träningspass…","trainingSessions.error":"Träningspassen kunde inte hämtas.","trainingSessions.saveError":"Passet kunde inte sparas. Försök igen.","trainingSessions.retry":"Försök igen","trainingSessions.empty.heading":"Inga träningspass än","trainingSessions.empty.body":"Här samlas dina egna pass — tid, häst, övningar och vad du tog med dig. Du väljer själv vilka lärare som får läsa.","trainingSessions.empty.action":"Logga ditt första pass","trainingSession.title.plain":"Träningspass","trainingSession.title.programs.one":"Pass från {count} program","trainingSession.title.programs.other":"Pass från {count} program","trainingSession.title.exercises.one":"Pass med {count} övning","trainingSession.title.exercises.other":"Pass med {count} övningar","trainingSession.duration.one":"{count} min","trainingSession.duration.other":"{count} min","trainingSession.chip.plan":"Plan: {title}","trainingSession.chip.program":"Program: {title}","trainingSession.more":"+{count}","trainingSession.exercises.none":"Inga övningar","trainingSession.exerciseSummary.one":"{count} övning · {names}","trainingSession.exerciseSummary.other":"{count} övningar · {names}","trainingSession.horse.none":"Ingen häst","trainingSession.plan.none":"Ingen plan","trainingSession.catalog.unknownTeacher":"Okänd lärare","trainingSession.share.you":"du","trainingSession.back":"Alla träningspass","trainingSession.loading":"Hämtar passet…","trainingSession.notFound.heading":"Träningspasset finns inte","trainingSession.notFound.body":"Det kan vara borttaget, eller så är det inte delat med dig. Kontrollera länken.","trainingSession.notFound.action":"Till träningspass","trainingSession.conflict.message":"Passet har ändrats någon annanstans, så ändringen gick inte igenom. Hämta den senaste versionen och försök igen.","trainingSession.conflict.action":"Hämta på nytt","trainingSession.section.details":"Uppgifter","trainingSession.section.summary":"Sammanfattning","trainingSession.section.sharing":"Delning","trainingSession.section.programs":"Program","trainingSession.section.exercises":"Övningar","trainingSession.field.when":"Datum & tid","trainingSession.field.duration":"Längd (minuter)","trainingSession.field.horse":"Häst","trainingSession.field.plan":"Plan","trainingSession.field.summary":"Sammanfattning","trainingSession.save":"Spara","trainingSession.saved":"Ändringarna är sparade.","trainingSession.summary.empty":"Ingen sammanfattning skriven.","trainingSession.sharing.hint":"Bara lärare du väljer här ser passet och kan svara på det. Passet är privat tills du delar det.","trainingSession.sharing.none":"Du har ingen lärare att dela med än.","trainingSession.sharing.legend":"Dela med lärare","trainingSession.sharing.withTeacher":"Dela med {name}","trainingSession.sharing.placeholder":"Välj lärare","trainingSession.sharing.count.one":"{count} vald","trainingSession.sharing.count.other":"{count} valda","trainingSession.sharing.saved":"Delningen är uppdaterad.","trainingSession.programOffer":"{name} äger ett av programmen du kopplat, men ser inte passet.","trainingSession.programOffer.action":"Dela med {name}","trainingSession.programs.empty":"Inga program kopplade.","trainingSession.programs.attach":"Koppla program","trainingSession.programs.placeholder":"Välj program","trainingSession.programs.detach":"Ta bort källa","trainingSession.programs.detachHint":"Att ta bort ett program tar inte bort övningarna som redan kopierats därifrån — de stannar i passet.","trainingSession.toast.programDetached":"{title} togs bort som källa. Övningarna som kopierats därifrån är kvar.","trainingSession.toast.undo":"Ångra","trainingSession.exercises.empty":"Inga övningar än.","trainingSession.exercise.add":"Lägg till övning","trainingSession.exercise.placeholder":"Välj övning","trainingSession.exercise.remove":"Ta bort","trainingSession.exercise.source":"Från {title}","trainingSession.exercise.sourceGone":"Från ett borttaget program","trainingSession.exercise.notesShow":"Anteckningar","trainingSession.exercise.notesHide":"Dölj anteckningar","trainingSession.confirm.dismiss":"Avbryt","trainingSession.confirm.removeExercise.title":"Ta bort övningen från passet?","trainingSession.confirm.removeExercise.message":"{name} tas bort ur passet. Övningens instruktionstext och kopplingen till programmet försvinner, och anteckningarna på den försvinner med den. Lägger du tillbaka övningen kommer den sist och utan instruktionstext.","trainingSession.action.delete":"Ta bort passet","trainingSession.confirm.delete.title":"Ta bort träningspasset?","trainingSession.confirm.delete.message":"Passet försvinner för alla som kan se det, och anteckningarna dina lärare skrivit på det försvinner med det. Det går inte att få tillbaka.","trainingSession.toast.deleted":"Träningspasset togs bort.","trainingSessionCreate.heading":"Logga pass","trainingSessionCreate.field.when":"Datum & tid","trainingSessionCreate.field.duration":"Längd","trainingSessionCreate.field.duration.hint":"I hela minuter. Valfritt.","trainingSessionCreate.field.horse":"Häst","trainingSessionCreate.field.horse.hint":"Hästarna i ditt stall.","trainingSessionCreate.field.summary":"Sammanfattning","trainingSessionCreate.field.summary.hint":"Hur gick passet? Det här är det första din lärare läser.","trainingSessionCreate.field.plan":"Plan","trainingSessionCreate.field.plan.hint":"Dina aktiva planer.","trainingSessionCreate.field.program":"Program","trainingSessionCreate.field.program.hint":"Programmets övningar kopieras in i passet. Passet följer inte programmet — ändras programmet senare påverkas inte det här passet.","trainingSessionCreate.submit":"Logga pass","trainingSessionCreate.cancel":"Avbryt","trainingSessionCreate.error.when":"Välj när du red passet.","trainingSessionCreate.error.duration":"Längden anges i hela minuter, till exempel 45.","trainingSessionCreate.created":"Passet är loggat.","plans.heading":"Planer","plans.create":"Ny plan","plans.loading":"Hämtar planer…","plans.error":"Planerna kunde inte hämtas.","plans.retry":"Försök igen","plans.group.active":"Aktiva","plans.archived.show.one":"Visa {count} arkiverad plan","plans.archived.show.other":"Visa {count} arkiverade planer","plans.archived.hide":"Dölj arkiverade","plans.empty.heading":"Ingen plan än","plans.empty.body":"En plan samlar mål, lektioner och träningspass under ett tak — en säsong, ett projekt, ett år.","plans.empty.action":"Skapa din första plan","plan.status.active":"Aktiv","plan.status.archived":"Arkiverad","plan.range.both":"{start} – {end}","plan.range.from":"Från {start}","plan.range.until":"Till och med {end}","plan.primaryTeacher":"Huvudlärare: {name}","plan.primaryTeacher.none":"Ingen huvudlärare","plan.primaryTeacher.hint":"Huvudläraren är en etikett och ett förval — den ger ingen extra behörighet. Alla lärare du är kopplad till kan läsa planen.","plan.back":"Alla planer","plan.loading":"Hämtar planen…","plan.notFound.heading":"Planen finns inte","plan.notFound.body":"Den kan vara borttagen, eller så är den inte din. Kontrollera länken.","plan.notFound.action":"Till planer","plan.section.details":"Uppgifter","plan.section.description":"Beskrivning","plan.section.goals":"Mål","plan.section.lessons":"Lektioner","plan.section.trainingSessions":"Träningspass","plan.group.upcoming":"Kommande","plan.group.past":"Tidigare","plan.description.empty":"Ingen beskrivning skriven.","plan.field.title":"Titel","plan.field.description":"Beskrivning","plan.field.start":"Startdatum","plan.field.end":"Slutdatum","plan.field.primaryTeacher":"Huvudlärare","plan.save":"Spara","plan.saved":"Ändringarna är sparade.","plan.saveError":"Planen kunde inte sparas. Försök igen.","plan.error.title":"Ge planen en titel.","plan.error.range":"Slutdatumet ligger före startdatumet. Välj ett datum efter {start}.","plan.archived.notice":"Planen är arkiverad. Den går att läsa och allt som redan är kopplat ligger kvar, men inga nya mål, lektioner eller pass kan kopplas till den.","plan.action.archive":"Arkivera","plan.confirm.dismiss":"Avbryt","plan.confirm.archive.title":"Arkivera planen?","plan.confirm.archive.message":"Planen går fortfarande att läsa och allt som är kopplat ligger kvar, men inga nya mål, lektioner eller pass kan kopplas till den. Det går inte att ångra härifrån.","plan.toast.archived":"Planen är arkiverad.","plan.goals.empty.owner":"Inga mål är kopplade till planen än.","plan.goals.empty.teacher":"Inga mål i planen är delade med dig.","plan.goals.attach":"Koppla mål","plan.goals.placeholder":"Välj mål","plan.goals.detach":"Ta bort koppling","plan.goals.none":"Du har inga mål kvar att koppla till den här planen.","plan.toast.goalAttached":"{title} är kopplat till planen.","plan.toast.goalDetached":"{title} är inte längre kopplat till planen. Målet finns kvar under Mål.","plan.lessons.empty":"Inga lektioner är kopplade till planen.","plan.trainingSessions.empty":"Inga träningspass är kopplade till planen.","planCreate.heading":"Ny plan","planCreate.field.title":"Titel","planCreate.field.description":"Beskrivning","planCreate.field.description.hint":"Vad ska planen leda till? Valfritt.","planCreate.field.start":"Startdatum","planCreate.field.end":"Slutdatum","planCreate.field.primaryTeacher":"Huvudlärare","planCreate.submit":"Skapa plan","planCreate.cancel":"Avbryt","planCreate.created":"Planen är skapad.","goals.heading":"Mål","goals.create":"Nytt mål","goals.loading":"Hämtar mål…","goals.error":"Målen kunde inte hämtas.","goals.retry":"Försök igen","goals.group.active":"Aktiva","goals.group.achieved":"Uppnådda","goals.abandoned.show.one":"Visa {count} avbrutet mål","goals.abandoned.show.other":"Visa {count} avbrutna mål","goals.abandoned.hide":"Dölj avbrutna","goals.empty.heading":"Inget mål än","goals.empty.body":"Ett mål är det du tränar mot. Skriv ner det, sätt ett måldatum och följ det över säsongen.","goals.empty.action":"Sätt ditt första mål","goal.status.active":"Aktiv","goal.status.achieved":"Uppnådd","goal.status.abandoned":"Avbruten","goal.target":"Måldatum {date}","goal.achievedAt":"Uppnått {date}","goal.overdue":"Måldatumet har passerat","goal.more":"+{count}","goal.plans.summary.one":"Plan: {names}","goal.plans.summary.other":"Planer: {names}","goal.plans.unnamed.one":"I {count} plan","goal.plans.unnamed.other":"I {count} planer","goal.chip.plan":"Plan: {title}","goal.back":"Alla mål","goal.loading":"Hämtar målet…","goal.notFound.heading":"Målet finns inte","goal.notFound.body":"Det kan vara borttaget, eller så är det inte delat med dig längre. Kontrollera länken.","goal.notFound.action":"Till mål","goal.conflict.message":"Målet har ändrats någon annanstans, så ändringen gick inte igenom. Hämta den senaste versionen och försök igen.","goal.conflict.action":"Hämta på nytt","goal.abandoned.notice":"Målet är avbrutet. Öppna det igen om du vill arbeta vidare med det — ett avbrutet mål kan inte markeras som uppnått direkt.","goal.section.details":"Uppgifter","goal.section.description":"Beskrivning","goal.section.plans":"Tillhör planer","goal.section.sharing":"Delat med","goal.description.empty":"Ingen beskrivning skriven.","goal.field.title":"Titel","goal.field.description":"Beskrivning","goal.field.target":"Måldatum","goal.field.horse":"Häst","goal.horse.none":"Ingen häst","goal.meta.horse":"Häst: {name}","goal.save":"Spara","goal.saved":"Ändringarna är sparade.","goal.saveError":"Målet kunde inte sparas. Försök igen.","goal.error.title":"Ge målet en titel.","goal.error.target":"Måldatumet måste vara ett riktigt datum, till exempel 2026-09-01.","goal.action.achieve":"Markera uppnått","goal.action.reopen":"Öppna igen","goal.action.abandon":"Avbryt målet","goal.confirm.dismiss":"Avbryt","goal.confirm.abandon.title":"Avbryta målet?","goal.confirm.abandon.message":"Målet flyttas till Avbrutna och räknas inte längre som pågående. Du kan öppna det igen, men det öppnas som aktivt — ett uppnått mål som avbryts går inte att få tillbaka som uppnått.","goal.toast.achieved":"Målet är markerat som uppnått.","goal.toast.reopened":"Målet är öppet igen.","goal.toast.abandoned":"Målet är avbrutet.","goal.plans.empty":"Målet hör inte till någon plan.","goal.plans.attach":"Koppla plan","goal.plans.placeholder":"Välj plan","goal.plans.detach":"Ta bort koppling","goal.plans.none":"Du har ingen aktiv plan kvar att koppla målet till.","goal.toast.planAttached":"Målet är kopplat till {title}.","goal.toast.planDetached":"Målet är inte längre kopplat till {title}.","goal.sharing.hint":"Bara lärare du väljer här ser målet. De kan skriva anteckningar och markera målet som uppnått eller öppna det igen.","goal.sharing.loading":"Hämtar delningen…","goal.sharing.none":"Du har ingen lärare att dela med än. Målet är ditt oavsett.","goal.sharing.saved":"Delningen är uppdaterad.","goal.sharing.error":"Delningen kunde inte ändras. Försök igen.","goalCreate.heading":"Nytt mål","goalCreate.field.title":"Titel","goalCreate.field.title.hint":"Vad ska du kunna när målet är nått?","goalCreate.field.description":"Beskrivning","goalCreate.field.description.hint":"Vad betyder målet konkret? Valfritt.","goalCreate.field.target":"Måldatum","goalCreate.field.horse":"Häst","goalCreate.field.horse.hint":"Gäller målet en särskild häst? Valfritt.","goalCreate.field.target.hint":"När vill du vara framme? Valfritt.","goalCreate.submit":"Skapa mål","goalCreate.cancel":"Avbryt","goalCreate.created":"Målet är skapat.","auth.login.title":"Logga in","auth.login.lede":"Välkommen tillbaka. Här samlas dina lektioner, pass och mål.","auth.login.submit":"Logga in","auth.login.submitting":"Loggar in …","auth.login.altPrompt":"Har du inget konto än?","auth.login.altLink":"Skapa konto","auth.register.title":"Skapa konto","auth.register.lede":"Ett konto räcker. Du kan vara elev hos en lärare och lärare för en annan.","auth.register.submit":"Skapa konto","auth.register.submitting":"Skapar konto …","auth.register.altPrompt":"Har du redan ett konto?","auth.register.altLink":"Logga in","auth.field.email":"E-post","auth.field.password":"Lösenord","auth.field.displayName":"Namn","auth.hint.email":"Adressen du loggar in med. Har du fått en inbjudan, använd samma adress som den skickades till.","auth.hint.displayName":"Så här visas du för din ridlärare och dina elever.","auth.hint.password":"Minst 8 tecken.","auth.error.emailRequired":"Fyll i din e-postadress.","auth.error.emailInvalid":"Kontrollera adressen — den behöver ett @ och en domän, till exempel namn@exempel.se.","auth.error.passwordRequired":"Fyll i ditt lösenord.","auth.error.passwordTooShort":"Välj ett lösenord på minst 8 tecken.","auth.error.displayNameRequired":"Skriv namnet du vill visas med.","auth.error.credentials":"E-postadressen eller lösenordet stämmer inte. Kontrollera båda och försök igen.","auth.error.emailTaken":"Adressen har redan ett konto. Logga in i stället, eller använd en annan adress.","auth.error.validation":"Något i formuläret gick inte igenom. Se över fälten och skicka igen.","auth.error.network":"Vi når inte servern. Kontrollera din uppkoppling och försök igen.","auth.error.rateLimit":"För många inloggningsförsök. Vänta en minut och försök igen.","auth.error.server":"Något gick fel hos oss. Vänta en stund och försök igen.","library.heading":"Bibliotek","library.tab.exercises":"Övningar","library.tab.programs":"Program","library.create":"Ny övning","library.search.label":"Sök i biblioteket","library.search.placeholder":"Namn eller beskrivning","library.loading":"Hämtar biblioteket …","library.error":"Biblioteket kunde inte hämtas.","library.retry":"Försök igen","library.empty.heading":"Inga övningar ännu","library.empty.body":"Övningarna är byggstenarna i dina lektioner och program. Skapa den första så finns den i varje väljare.","library.empty.action":"Skapa första övningen","library.noMatches.heading":"Ingen övning matchar sökningen","library.noMatches.body":"Prova ett kortare ord, eller rensa sökningen för att se hela biblioteket.","library.noMatches.action":"Rensa sökningen","exercise.back":"← Bibliotek","exercise.eyebrow":"Övning","exercise.loading":"Hämtar övningen …","exercise.field.name":"Namn","exercise.field.description":"Beskrivning","exercise.error.name":"Ge övningen ett namn.","exercise.saveError":"Övningen kunde inte sparas. Försök igen.","exercise.save":"Spara ändringar","exercise.saved":"Övningen sparades.","exercise.notFound.heading":"Övningen finns inte","exercise.notFound.body":"Den är arkiverad, eller tillhör ett annat bibliotek än ditt.","exercise.notFound.action":"Till biblioteket","exercise.history.heading":"Övningshistorik","exercise.history.body":"Välj en elev för att se hur övningen gått i deras lektioner.","exercise.history.placeholder":"Välj elev","exercise.history.open":"Visa historik","exercise.history.noStudents":"Historiken öppnas när du har en elev — den följer en ryttare genom lektionerna.","exercise.history.rosterLoading":"Hämtar dina elever …","exercise.history.rosterError":"Elevlistan gick inte att hämta, så väljaren är tom just nu. Ladda om sidan och försök igen.","exercise.danger.heading":"Arkivera övningen","exercise.danger.body":"Övningen lämnar biblioteket och alla väljare. Lektioner och träningspass där den redan använts behåller den, med sina anteckningar.","exercise.danger.action":"Arkivera övning","exercise.confirm.archive.title":"Arkivera övningen?","exercise.confirm.archive.message":"Den försvinner direkt ur biblioteket och ur alla väljare. Genomförda lektioner och träningspass behåller övningen och sina anteckningar. Det går inte att ångra härifrån.","exercise.confirm.dismiss":"Avbryt","exercise.archived":"Övningen arkiverades.","exerciseCreate.heading":"Ny övning","exerciseCreate.field.name":"Namn","exerciseCreate.field.name.hint":"Det ryttaren ser i lektionen. Kort och igenkännbart.","exerciseCreate.field.description":"Beskrivning","exerciseCreate.field.description.hint":"Frivilligt. Vad övningen går ut på, och vad du tittar efter.","exerciseCreate.submit":"Skapa övning","exerciseCreate.cancel":"Avbryt","exerciseCreate.created":"Övningen skapades.","programs.create":"Nytt program","programs.loading":"Hämtar programmen …","programs.error":"Programmen kunde inte hämtas.","programs.retry":"Försök igen","programs.empty.heading":"Inga program ännu","programs.empty.body":"Ett program är en namngiven följd av övningar som du plockar in i en lektion eller ett träningspass.","programs.empty.action":"Skapa första programmet","program.exerciseCount.one":"{count} övning","program.exerciseCount.other":"{count} övningar","program.back":"← Bibliotek","program.eyebrow":"Program","program.loading":"Hämtar programmet …","program.field.title":"Namn","program.field.description":"Beskrivning","program.error.title":"Ge programmet ett namn.","program.saveError":"Programmet kunde inte sparas. Försök igen.","program.save":"Spara ändringar","program.saved":"Programmet sparades.","program.notFound.heading":"Programmet finns inte","program.notFound.body":"Det är arkiverat, eller tillhör ett annat bibliotek än ditt.","program.notFound.action":"Till programmen","program.snapshot":"Lektioner och träningspass kopierar övningarna när programmet plockas in. Ändrar du här skrivs ingenting om i de tillfällen som redan kopierat programmet.","program.exercises.heading":"Övningar i programmet","program.exercises.empty":"Programmet är tomt. Lägg till den första övningen nedan.","program.add.label":"Lägg till övning","program.add.placeholder":"Välj övning","program.add.submit":"Lägg till","program.add.none":"Biblioteket är tomt. Skapa en övning först, så kan den plockas in här.","program.add.error":"Biblioteket gick inte att hämta, så väljaren är tom just nu. Ladda om sidan och försök igen.","program.add.exhausted":"Alla övningar i biblioteket ligger redan i programmet.","program.add.duplicate":"{name} ligger redan i programmet. Samma övning kan bara stå en gång.","program.add.failed":"Övningen kunde inte läggas till. Försök igen.","program.row.up":"Flytta {name} uppåt","program.row.down":"Flytta {name} nedåt","program.row.remove":"Ta bort","program.row.removeNamed":"Ta bort {name} ur programmet","program.row.note.add":"Lägg till anteckning","program.row.note.edit":"Ändra anteckning","program.row.note.addNamed":"Lägg till anteckning på {name}","program.row.note.editNamed":"Ändra anteckningen på {name}","program.row.note.label":"Anteckning på raden","program.row.note.save":"Spara anteckning","program.row.note.cancel":"Avbryt","program.row.note.saved":"Anteckningen sparades.","program.row.note.failed":"Anteckningen kunde inte sparas. Texten ligger kvar — försök igen.","program.row.archived":"Arkiverad","program.row.archived.hint":"Övningen är arkiverad och hoppas över när programmet plockas in. Raden gör ingenting — ta bort den när du vill städa.","program.reorderError":"Ordningen kunde inte sparas. Försök igen.","program.danger.heading":"Arkivera programmet","program.danger.body":"Programmet lämnar biblioteket och alla väljare. Lektioner och träningspass som redan kopierat det behåller sina övningar och sin märkning ”från program”.","program.danger.action":"Arkivera program","program.confirm.archive.title":"Arkivera programmet?","program.confirm.archive.message":"Det försvinner direkt ur biblioteket och ur alla väljare. Tillfällen som redan kopierat programmet behåller övningarna och märkningen ”från {title}”. Det går inte att ångra härifrån.","program.confirm.remove.title":"Ta bort övningen ur programmet?","program.confirm.remove.message":"{name} är arkiverad och kan inte läggas tillbaka i programmet efteråt. Tillfällen som redan kopierat programmet påverkas inte.","program.confirm.removeNoted.message":"{name} tas bort ur programmet och instruktionstexten på raden följer med. Du kan lägga tillbaka övningen och skriva texten igen — den hamnar sist i listan och får flyttas dit den ska.","program.confirm.removeArchivedNoted.message":"{name} är arkiverad och kan inte läggas tillbaka i programmet efteråt. Instruktionstexten på raden försvinner med den. Tillfällen som redan kopierat programmet påverkas inte.","program.confirm.dismiss":"Avbryt","program.archived":"Programmet arkiverades.","programCreate.heading":"Nytt program","programCreate.field.title":"Namn","programCreate.field.title.hint":"Så här hittar du programmet igen, till exempel ”Grundhoppning A”.","programCreate.field.description":"Beskrivning","programCreate.field.description.hint":"Frivilligt. Vad programmet tränar, och för vem.","programCreate.submit":"Skapa program","programCreate.cancel":"Avbryt","programCreate.created":"Programmet skapades. Lägg till övningarna här.","stable.heading":"Hästar","stable.create":"Lägg till häst","stable.loading":"Hämtar stallet …","stable.error":"Stallet kunde inte hämtas.","stable.retry":"Försök igen","stable.empty.heading":"Inga hästar ännu","stable.empty.body":"Lägg till hästarna du rider. Då kan du välja häst när du bokar en lektion eller loggar ett pass.","stable.empty.action":"Lägg till första hästen","horse.back":"← Hästar","horse.eyebrow":"Häst","horse.loading":"Hämtar hästen …","horse.field.name":"Namn","horse.error.name":"Ge hästen ett namn.","horse.saveError":"Hästen kunde inte sparas. Försök igen.","horse.save":"Spara ändringar","horse.saved":"Hästen sparades.","horse.notFound.heading":"Hästen finns inte","horse.notFound.body":"Den är arkiverad, eller tillhör ett annat stall än ditt.","horse.notFound.action":"Till hästarna","horse.danger.heading":"Arkivera hästen","horse.danger.body":"Hästen lämnar stallet och väljarna för nya lektioner och pass. Lektioner och pass som redan är ridna behåller hästen, med sina anteckningar.","horse.danger.action":"Arkivera häst","horse.confirm.archive.title":"Arkivera hästen?","horse.confirm.archive.message":"Hästen försvinner direkt ur stallet och ur alla väljare. Tidigare lektioner och träningspass behåller hästen och sina anteckningar. Det går inte att ångra härifrån.","horse.confirm.dismiss":"Avbryt","horse.archived":"Hästen arkiverades.","horseCreate.heading":"Lägg till häst","horseCreate.field.name":"Namn","horseCreate.field.name.hint":"Namnet du kallar hästen. Du kan ändra det när som helst.","horseCreate.submit":"Lägg till häst","horseCreate.cancel":"Avbryt","horseCreate.created":"Hästen lades till i stallet.","exerciseHistory.eyebrow":"Övningshistorik","exerciseHistory.back":"← Tillbaka","exerciseHistory.subtitle":"Elev: {student}","exerciseHistory.loading":"Hämtar historiken …","exerciseHistory.caption":"Lektioner där övningen använts, senast först","exerciseHistory.scope":"Delade anteckningar plus dina egna privata. Den andra partens privata anteckningar visas aldrig. Läsläge — anteckningar skrivs på lektionen.","exerciseHistory.col.date":"Datum","exerciseHistory.col.occasion":"Tillfälle","exerciseHistory.col.rowNote":"Radanteckning","exerciseHistory.col.notes":"Anteckningar","exerciseHistory.standalone":"Fristående","exerciseHistory.note.shared":"Delad anteckning","exerciseHistory.note.private":"Privat anteckning","exerciseHistory.openLesson":"Öppna lektionen {date}","exerciseHistory.empty.heading":"Ingen historik ännu","exerciseHistory.empty.body":"Historiken fylls på när övningen används i en lektion. Då samlas radanteckningar och feedback här.","exerciseHistory.empty.action":"Tillbaka","exerciseHistory.notFound.heading":"Historiken finns inte","exerciseHistory.notFound.body":"Eleven, övningen eller kopplingen mellan er går inte att hitta.","exerciseHistory.notFound.action":"Till mina elever","exerciseHistory.unreachable.heading":"Historiken gick inte att hämta","exerciseHistory.unreachable.body":"Vi nådde inte servern, så vi vet inte vad som finns här. Kontrollera uppkopplingen och försök igen.","exerciseHistory.unreachable.action":"Försök igen","home.title":"Hem","home.lede":"Det här behöver dig i dag.","home.loading":"Hämtar din översikt …","home.error":"Översikten kunde inte hämtas.","home.retry":"Försök igen","home.updated":"Uppdaterad {when}","home.nextLesson":"Nästa lektion","home.nextLesson.none":"Ingen bokad lektion","home.nextLesson.empty.action":"Visa lektioner","home.nextLesson.exercises.more.one":"+{count} övning till","home.nextLesson.exercises.more.other":"+{count} övningar till","home.nextLesson.noExercises":"Inga övningar upplagda än","home.feedback":"Senaste återkoppling","home.feedback.none":"Ingen delad återkoppling än","home.feedback.empty.action":"Öppna Lektioner","home.feedback.byline":"{name} · {when}","home.feedback.on.lesson":"På lektionen med {name}","home.feedback.on.lessonExercise":"På övningen {exercise} i lektionen med {name}","home.feedback.on.trainingSession":"På träningspasset","home.feedback.on.trainingSessionExercise":"På övningen {exercise} i träningspasset","home.feedback.on.goal":"På målet {title}","home.awaiting":"Väntar på din återkoppling","home.awaiting.none":"Du har svarat på allt","home.awaiting.count.one":"{count} tillfälle","home.awaiting.count.other":"{count} tillfällen","home.awaiting.lesson":"Lektion med {name}","home.awaiting.session":"Träningspass · {name}","home.awaiting.all":"Öppna Lektioner","home.riding":"Din träning","home.plans.none":"Ingen aktiv plan","home.plans.count.one":"{count} aktiv plan","home.plans.count.other":"{count} aktiva planer","home.goals.nearing":"Måldatum som närmar sig","home.goals.none":"Inga mål med datum inom en månad.","home.goals.overdue":"Datum passerat","home.invitations.zero":"Du har inga inbjudningar som väntar.","home.invitations.one":"Du har en inbjudan som väntar.","home.invitations.other":"Du har {count} inbjudningar som väntar.","home.invitations.cta":"Öppna Inkorgen","home.action.logSession":"Logga pass","home.action.bookLesson":"Boka lektion","home.welcome.title":"Välkommen hit","home.welcome.body":"Någon har bjudit in dig. Svara i Inkorgen, så kommer resten igång.","home.start.title":"Kom igång","home.start.teach.title":"Undervisa","home.start.teach.body":"Bjud in din första elev och börja planera lektioner.","home.start.teach.action":"Bjud in elev","home.start.ride.title":"Träna","home.start.ride.body":"Lägg till din häst och sätt ett mål att träna mot.","home.start.ride.action":"Lägg till häst","home.start.ride.goal":"Skapa mål"},vi={"app.brand":"Lindgren Equestrian","nav.label":"Main menu","nav.openMenu":"Open menu","nav.home":"Home","nav.inbox":"Inbox","nav.inboxPending.one":"{count} invitation waiting","nav.inboxPending.other":"{count} invitations waiting","nav.group.training":"Training","nav.lessons":"Lessons","nav.trainingSessions":"Training sessions","nav.group.planning":"Planning & stable","nav.plans":"Plans","nav.goals":"Goals","nav.stable":"Horses","nav.group.teaching":"Teaching","nav.students":"My students","nav.library":"Library","nav.invitations":"Invitations","nav.programs":"Programs","topBar.theme.toLight":"Light mode","topBar.theme.toDark":"Dark mode","topBar.signOut":"Sign out","relative.yesterday":"yesterday","relative.today":"today","relative.tomorrow":"tomorrow","objectKind.goal":"Goal","objectKind.plan":"Plan","objectKind.lesson":"Lesson","objectKind.trainingSession":"Training session","objectKind.exercise":"Exercise","share.private":"Private","share.sharedWith":"Shared: {name}","share.sharedWithMore.one":"Shared: {name} +{count}","share.sharedWithMore.other":"Shared: {name} +{count}","share.sharedWithAll":"Shared with {names}","share.sharedUnknown":"Shared: recipient unknown","role.teacher":"Teacher","role.student":"Student","notes.heading.zero":"Notes","notes.heading.one":"Notes · {count}","notes.heading.other":"Notes · {count}","notes.empty":"No notes yet.","notes.placeholder":"Write a note…","notes.submit":"Add","notes.visibility":"Visibility","notes.shareUnavailable":"Nobody to share with","notes.hintPrivate":"Only you can see this note.","notes.hintShared":"{names} can see this note and reply.","notes.hintNoRecipients":"You have nobody to share with yet — the note stays private.","notes.edit":"Edit","notes.delete":"Delete","notes.save":"Save","notes.cancel":"Cancel","notes.deleteTitle":"Delete this note?","notes.deleteConsequence":"The note disappears for everyone who can see it and cannot be recovered.","detail.moreActions":"More actions","students.heading":"My students","students.invite":"Invite student","students.loading":"Loading students…","students.error":"The students could not be loaded.","students.retry":"Try again","students.empty.heading":"No students yet","students.empty.body":"Invite your first student by email. Once they accept, their lessons, plans and goals gather here.","students.invitedOnly.body":"The invitation is sent. Your student appears here as soon as they create an account with the same address and accept.","student.nextLesson":"Next lesson {when}","invite.field.email":"Student's email","invite.field.email.hint":"The address the student will create their account with.","invite.submit":"Send invitation","invite.cancel":"Cancel","invite.error.emailRequired":"Enter the student's email address.","invite.error.emailInvalid":"Check the address — it needs an @ and a domain, for example name@example.com.","invite.error.conflict":"There is already an unanswered invitation to {email}.","invite.error.failed":"The invitation could not be sent. Try again.","invite.sent":"The invitation was sent to {email}.","invitations.heading":"Invited","invitations.loading":"Loading invitations…","invitations.error":"The invitations could not be loaded.","invitations.empty":"No invitations are waiting.","invitations.sent":"Sent {when}","invitations.status.pending":"Awaiting reply","invitations.status.accepted":"Accepted","invitations.status.declined":"Declined","invitations.status.revoked":"Revoked","invitations.status.expired":"Ended","invitations.revoke":"Revoke","invitations.revokeError":"The invitation could not be revoked. Try again.","invitations.confirm.title":"Revoke the invitation?","invitations.confirm.message":"{email} can no longer accept, and the invitation cannot be brought back. To invite the address again you have to send a new invitation.","invitations.confirm.dismiss":"Cancel","invitations.toast.revoked":"The invitation to {email} was revoked.","invitations.page.heading":"My invitations","invitations.page.email":"Email","invitations.page.submit":"Invite","invitations.page.submitting":"…","invitations.page.error.conflict":"An invitation to that email is already active","inbox.heading":"Inbox","inbox.empty":"No pending invitations.","inbox.from":"Invitation from {name} ({email})","inbox.accept":"Accept","inbox.decline":"Decline","inbox.error.conflict":"The invitation is no longer valid","student.eyebrow":"Student","student.back":"All students","student.loading":"Loading the student…","student.error":"The student could not be loaded.","student.notFound.heading":"This student does not exist","student.notFound.body":"The connection may have been removed, or this is not your student. Check the link.","student.notFound.action":"To my students","student.book":"Book lesson","student.relation":"You are the teacher · {email}","student.tab.overview":"Overview","student.tab.lessons":"Lessons","student.tab.sessions":"Sessions","student.tab.plans":"Plans","student.tab.goals":"Goals","student.tab.horses":"Horses","student.tab.history":"History","student.overview.loading":"Loading the overview…","student.overview.error":"The overview could not be loaded.","student.overview.unavailable":"Could not be loaded","student.overview.nextLesson":"Next lesson","student.overview.nextLesson.none":"No lesson booked","student.overview.latestSession":"Latest shared session","student.overview.latestSession.none":"No session shared with you yet","student.overview.activePlans":"Active plans","student.overview.sharedGoals":"Shared goals","student.overview.sharedGoals.meta":"Only goals the student shared with you are counted.","student.overview.planCount.one":"{count} plan","student.overview.planCount.other":"{count} plans","student.overview.goalCount.one":"{count} goal","student.overview.goalCount.other":"{count} goals","student.overview.activity":"Recent activity","student.overview.activity.empty":"Nothing has happened yet.","student.lessons.loading":"Loading lessons…","student.lessons.error":"The lessons could not be loaded.","student.lessons.empty.heading":"No lessons yet","student.lessons.empty.body":"Book the first lesson and it gathers here with horse, plan and exercises.","student.sessions.lede":"Only training sessions the student shared with you are shown here.","student.sessions.loading":"Loading training sessions…","student.sessions.error":"The training sessions could not be loaded.","student.sessions.empty.heading":"No shared sessions yet","student.sessions.empty.body":"The student chooses which sessions you may read. Shared sessions appear here.","student.plans.loading":"Loading plans…","student.plans.error":"The plans could not be loaded.","student.plans.empty.heading":"No active plan","student.plans.empty.body":"The student has no plan running right now. Plans are created by the student.","student.goals.lede":"Only goals the student shared with you are shown here.","student.goals.loading":"Loading goals…","student.goals.error":"The goals could not be loaded.","student.goals.empty.heading":"No shared goals","student.goals.empty.body":"The student chooses which goals you may follow. Shared goals appear here.","student.horses.loading":"Loading horses…","student.horses.error":"The horses could not be loaded.","student.horses.empty.heading":"No horses in the stable","student.horses.empty.body":"The student has not added a horse yet. The stable is theirs to keep.","student.history.loading":"Loading exercises…","student.history.error":"The exercises could not be loaded.","student.history.empty.heading":"No exercises in the library","student.history.empty.body":"Add an exercise to your library and you can follow it over time.","student.history.empty.action":"To the library","student.history.field":"Exercise","student.history.placeholder":"Choose exercise","student.history.open":"Open the history","student.history.hint":"Choose an exercise to see everything {name} has done in it.","lessons.heading":"Lessons","lessons.book":"Book lesson","lessons.group.upcoming":"Upcoming","lessons.group.past":"Past","lessons.loading":"Loading lessons…","lessons.error":"The lessons could not be loaded.","lessons.retry":"Try again","lessons.empty.teacher.heading":"No lessons yet","lessons.empty.teacher.body":"Book the first lesson and it will gather here, with horse, plan and exercises.","lessons.empty.rider.heading":"No lessons yet","lessons.empty.rider.body":"Lessons your teacher books show up here. To teach yourself, you first need a student.","lessons.empty.rider.action":"Invite student","lesson.status.planned":"Planned","lesson.status.completed":"Completed","lesson.status.cancelled":"Cancelled","lesson.title.plain":"Lesson","lesson.title.programs.one":"Lesson from {count} program","lesson.title.programs.other":"Lesson from {count} programs","lesson.title.exercises.one":"Lesson with {count} exercise","lesson.title.exercises.other":"Lesson with {count} exercises","lesson.chip.plan":"Plan: {title}","lesson.chip.program":"Program: {title}","lesson.chip.horse":"Horse: {name}","lesson.horse.none":"No horse","lesson.plan.none":"No plan","lesson.more":"+{count}","lesson.exercises.none":"No exercises","lesson.exerciseSummary.one":"{count} exercise · {names}","lesson.exerciseSummary.other":"{count} exercises · {names}","lesson.back":"All lessons","lesson.loading":"Loading the lesson…","lesson.notFound.heading":"This lesson does not exist","lesson.notFound.body":"It may have been removed, or it may not be yours. Check the link.","lesson.notFound.action":"Go to lessons","lesson.section.details":"Details","lesson.section.exercises":"Exercises","lesson.section.programs":"Programs","lesson.field.when":"Date & time","lesson.field.horse":"Horse","lesson.field.plan":"Plan","lesson.save":"Save","lesson.saved":"Your changes are saved.","lesson.action.complete":"Mark completed","lesson.action.cancel":"Cancel lesson","lesson.confirm.dismiss":"Cancel","lesson.confirm.complete.title":"Mark this lesson completed?","lesson.confirm.complete.message":"The status is final and cannot be changed back. Exercises and programs lock, but notes can still be written.","lesson.confirm.cancel.title":"Cancel this lesson?","lesson.confirm.cancel.message":"The status is final and cannot be changed back. Exercises and programs lock, but notes can still be written.","lesson.toast.completed":"The lesson is marked completed.","lesson.toast.cancelled":"The lesson is cancelled.","lesson.toast.undo":"Undo","lesson.toast.exerciseRemoved":"{name} was removed from the lesson.","lesson.toast.programDetached":"{title} was removed as a source. The exercises copied from it stay.","lesson.locked.completed":"This lesson is completed. Exercises and programs are locked, but notes are still open.","lesson.locked.cancelled":"This lesson is cancelled. Exercises and programs are locked, but notes are still open.","lesson.conflict.message":"This lesson changed somewhere else, so the change did not go through. Load the latest version and try again.","lesson.conflict.action":"Load again","lesson.exercises.empty":"No exercises yet.","lesson.exercise.add":"Add exercise","lesson.exercise.placeholder":"Choose exercise","lesson.exercise.remove":"Remove","lesson.exercise.source":"From {title}","lesson.exercise.sourceGone":"From a removed program","lesson.exercise.history":"Exercise history","lesson.exercise.notesShow":"Notes","lesson.exercise.notesHide":"Hide notes","lesson.programs.empty":"No programs attached.","lesson.programs.attach":"Attach program","lesson.programs.placeholder":"Choose program","lesson.programs.detach":"Remove source","lesson.programs.detachHint":"Removing a program does not remove the exercises already copied from it — they stay in the lesson.","lessonCreate.heading":"Book lesson","lessonCreate.field.student":"Student","lessonCreate.field.student.placeholder":"Choose student","lessonCreate.field.when":"Date & time","lessonCreate.field.horse":"Horse","lessonCreate.field.horse.hint":"Horses in this student's stable.","lessonCreate.field.plan":"Plan","lessonCreate.field.plan.hint":"This student's active plans.","lessonCreate.field.programs":"Programs","lessonCreate.field.programs.hint":"The programs' exercises are copied into the lesson. The lesson does not follow the program — changing the program later does not affect this lesson.","lessonCreate.field.programs.placeholder":"Choose program","lessonCreate.programsCount.one":"{count} selected","lessonCreate.programsCount.other":"{count} selected","lessonCreate.submit":"Book lesson","lessonCreate.cancel":"Cancel","lessonCreate.error.student":"Choose which student the lesson is for.","lessonCreate.error.when":"Choose a date and time for the lesson.","lessonCreate.created":"The lesson is booked.","lessonCreate.createdPartial":"The lesson is booked, but not everything could be added. Check the horse and programs below.","trainingSessions.heading":"Training sessions","trainingSessions.log":"Log a session","trainingSessions.loading":"Loading training sessions…","trainingSessions.error":"The training sessions could not be loaded.","trainingSessions.saveError":"The session could not be saved. Try again.","trainingSessions.retry":"Try again","trainingSessions.empty.heading":"No training sessions yet","trainingSessions.empty.body":"Your own sessions collect here — time, horse, exercises and what you took away. You choose which teachers get to read them.","trainingSessions.empty.action":"Log your first session","trainingSession.title.plain":"Training session","trainingSession.title.programs.one":"Session from {count} program","trainingSession.title.programs.other":"Session from {count} programs","trainingSession.title.exercises.one":"Session with {count} exercise","trainingSession.title.exercises.other":"Session with {count} exercises","trainingSession.duration.one":"{count} min","trainingSession.duration.other":"{count} min","trainingSession.chip.plan":"Plan: {title}","trainingSession.chip.program":"Program: {title}","trainingSession.more":"+{count}","trainingSession.exercises.none":"No exercises","trainingSession.exerciseSummary.one":"{count} exercise · {names}","trainingSession.exerciseSummary.other":"{count} exercises · {names}","trainingSession.horse.none":"No horse","trainingSession.plan.none":"No plan","trainingSession.catalog.unknownTeacher":"Unknown teacher","trainingSession.share.you":"you","trainingSession.back":"All training sessions","trainingSession.loading":"Loading the session…","trainingSession.notFound.heading":"That training session does not exist","trainingSession.notFound.body":"It may have been deleted, or it is not shared with you. Check the link.","trainingSession.notFound.action":"To training sessions","trainingSession.conflict.message":"The session changed somewhere else, so your change did not go through. Load the latest version and try again.","trainingSession.conflict.action":"Load again","trainingSession.section.details":"Details","trainingSession.section.summary":"Summary","trainingSession.section.sharing":"Sharing","trainingSession.section.programs":"Programs","trainingSession.section.exercises":"Exercises","trainingSession.field.when":"Date & time","trainingSession.field.duration":"Duration (minutes)","trainingSession.field.horse":"Horse","trainingSession.field.plan":"Plan","trainingSession.field.summary":"Summary","trainingSession.save":"Save","trainingSession.saved":"Your changes are saved.","trainingSession.summary.empty":"No summary written.","trainingSession.sharing.hint":"Only teachers you choose here can see the session and respond to it. The session stays private until you share it.","trainingSession.sharing.none":"You have no teacher to share with yet.","trainingSession.sharing.legend":"Share with teachers","trainingSession.sharing.withTeacher":"Share with {name}","trainingSession.sharing.placeholder":"Choose teachers","trainingSession.sharing.count.one":"{count} selected","trainingSession.sharing.count.other":"{count} selected","trainingSession.sharing.saved":"Sharing is updated.","trainingSession.programOffer":"{name} owns one of the programs you attached, but cannot see the session.","trainingSession.programOffer.action":"Share with {name}","trainingSession.programs.empty":"No programs attached.","trainingSession.programs.attach":"Attach program","trainingSession.programs.placeholder":"Choose a program","trainingSession.programs.detach":"Remove source","trainingSession.programs.detachHint":"Removing a program does not remove the exercises already copied from it — they stay in the session.","trainingSession.toast.programDetached":"{title} was removed as a source. The exercises copied from it remain.","trainingSession.toast.undo":"Undo","trainingSession.exercises.empty":"No exercises yet.","trainingSession.exercise.add":"Add exercise","trainingSession.exercise.placeholder":"Choose an exercise","trainingSession.exercise.remove":"Remove","trainingSession.exercise.source":"From {title}","trainingSession.exercise.sourceGone":"From a removed program","trainingSession.exercise.notesShow":"Notes","trainingSession.exercise.notesHide":"Hide notes","trainingSession.confirm.dismiss":"Cancel","trainingSession.confirm.removeExercise.title":"Remove the exercise from the session?","trainingSession.confirm.removeExercise.message":"{name} is removed from the session. The exercise's instruction text and its link to the program disappear, and the notes on it go with it. If you add the exercise back it lands last and without the instruction text.","trainingSession.action.delete":"Delete session","trainingSession.confirm.delete.title":"Delete the training session?","trainingSession.confirm.delete.message":"The session disappears for everyone who can see it, and the notes your teachers wrote on it disappear with it. This cannot be undone.","trainingSession.toast.deleted":"The training session was deleted.","trainingSessionCreate.heading":"Log a session","trainingSessionCreate.field.when":"Date & time","trainingSessionCreate.field.duration":"Duration","trainingSessionCreate.field.duration.hint":"In whole minutes. Optional.","trainingSessionCreate.field.horse":"Horse","trainingSessionCreate.field.horse.hint":"The horses in your stable.","trainingSessionCreate.field.summary":"Summary","trainingSessionCreate.field.summary.hint":"How did the session go? This is the first thing your teacher reads.","trainingSessionCreate.field.plan":"Plan","trainingSessionCreate.field.plan.hint":"Your active plans.","trainingSessionCreate.field.program":"Program","trainingSessionCreate.field.program.hint":"The program's exercises are copied into the session. The session does not follow the program — later changes to the program do not affect this session.","trainingSessionCreate.submit":"Log session","trainingSessionCreate.cancel":"Cancel","trainingSessionCreate.error.when":"Choose when you rode the session.","trainingSessionCreate.error.duration":"Duration is given in whole minutes, for example 45.","trainingSessionCreate.created":"The session is logged.","plans.heading":"Plans","plans.create":"New plan","plans.loading":"Loading plans…","plans.error":"The plans could not be loaded.","plans.retry":"Try again","plans.group.active":"Active","plans.archived.show.one":"Show {count} archived plan","plans.archived.show.other":"Show {count} archived plans","plans.archived.hide":"Hide archived","plans.empty.heading":"No plan yet","plans.empty.body":"A plan gathers goals, lessons and training sessions under one roof — a season, a project, a year.","plans.empty.action":"Create your first plan","plan.status.active":"Active","plan.status.archived":"Archived","plan.range.both":"{start} – {end}","plan.range.from":"From {start}","plan.range.until":"Until {end}","plan.primaryTeacher":"Primary teacher: {name}","plan.primaryTeacher.none":"No primary teacher","plan.primaryTeacher.hint":"The primary teacher is a label and a default — it grants no extra access. Every teacher you are connected to can read the plan.","plan.back":"All plans","plan.loading":"Loading the plan…","plan.notFound.heading":"The plan does not exist","plan.notFound.body":"It may have been removed, or it may not be yours. Check the link.","plan.notFound.action":"To plans","plan.section.details":"Details","plan.section.description":"Description","plan.section.goals":"Goals","plan.section.lessons":"Lessons","plan.section.trainingSessions":"Training sessions","plan.group.upcoming":"Upcoming","plan.group.past":"Past","plan.description.empty":"No description written.","plan.field.title":"Title","plan.field.description":"Description","plan.field.start":"Start date","plan.field.end":"End date","plan.field.primaryTeacher":"Primary teacher","plan.save":"Save","plan.saved":"Your changes are saved.","plan.saveError":"The plan could not be saved. Try again.","plan.error.title":"Give the plan a title.","plan.error.range":"The end date falls before the start date. Pick a date after {start}.","plan.archived.notice":"This plan is archived. It stays readable and everything already linked remains, but no new goals, lessons or sessions can be linked to it.","plan.action.archive":"Archive","plan.confirm.dismiss":"Cancel","plan.confirm.archive.title":"Archive the plan?","plan.confirm.archive.message":"The plan stays readable and everything linked to it remains, but no new goals, lessons or sessions can be linked to it. This cannot be undone from here.","plan.toast.archived":"The plan is archived.","plan.goals.empty.owner":"No goals are linked to this plan yet.","plan.goals.empty.teacher":"None of this plan's goals are shared with you.","plan.goals.attach":"Link goal","plan.goals.placeholder":"Choose a goal","plan.goals.detach":"Remove link","plan.goals.none":"You have no goals left to link to this plan.","plan.toast.goalAttached":"{title} is linked to the plan.","plan.toast.goalDetached":"{title} is no longer linked to the plan. The goal is still under Goals.","plan.lessons.empty":"No lessons are linked to this plan.","plan.trainingSessions.empty":"No training sessions are linked to this plan.","planCreate.heading":"New plan","planCreate.field.title":"Title","planCreate.field.description":"Description","planCreate.field.description.hint":"What should the plan lead to? Optional.","planCreate.field.start":"Start date","planCreate.field.end":"End date","planCreate.field.primaryTeacher":"Primary teacher","planCreate.submit":"Create plan","planCreate.cancel":"Cancel","planCreate.created":"The plan is created.","goals.heading":"Goals","goals.create":"New goal","goals.loading":"Loading goals…","goals.error":"The goals could not be loaded.","goals.retry":"Try again","goals.group.active":"Active","goals.group.achieved":"Achieved","goals.abandoned.show.one":"Show {count} abandoned goal","goals.abandoned.show.other":"Show {count} abandoned goals","goals.abandoned.hide":"Hide abandoned","goals.empty.heading":"No goal yet","goals.empty.body":"A goal is what you are training towards. Write it down, set a target date and follow it through the season.","goals.empty.action":"Set your first goal","goal.status.active":"Active","goal.status.achieved":"Achieved","goal.status.abandoned":"Abandoned","goal.target":"Target date {date}","goal.achievedAt":"Achieved {date}","goal.overdue":"The target date has passed","goal.more":"+{count}","goal.plans.summary.one":"Plan: {names}","goal.plans.summary.other":"Plans: {names}","goal.plans.unnamed.one":"In {count} plan","goal.plans.unnamed.other":"In {count} plans","goal.chip.plan":"Plan: {title}","goal.back":"All goals","goal.loading":"Loading the goal…","goal.notFound.heading":"The goal does not exist","goal.notFound.body":"It may have been removed, or it may no longer be shared with you. Check the link.","goal.notFound.action":"To goals","goal.conflict.message":"The goal changed somewhere else, so your change did not go through. Load the latest version and try again.","goal.conflict.action":"Load again","goal.abandoned.notice":"This goal is abandoned. Reopen it to keep working on it — an abandoned goal cannot be marked achieved directly.","goal.section.details":"Details","goal.section.description":"Description","goal.section.plans":"Belongs to plans","goal.section.sharing":"Shared with","goal.description.empty":"No description written.","goal.field.title":"Title","goal.field.description":"Description","goal.field.target":"Target date","goal.field.horse":"Horse","goal.horse.none":"No horse","goal.meta.horse":"Horse: {name}","goal.save":"Save","goal.saved":"Your changes are saved.","goal.saveError":"The goal could not be saved. Try again.","goal.error.title":"Give the goal a title.","goal.error.target":"The target date must be a real date, for example 2026-09-01.","goal.action.achieve":"Mark achieved","goal.action.reopen":"Reopen","goal.action.abandon":"Abandon goal","goal.confirm.dismiss":"Cancel","goal.confirm.abandon.title":"Abandon the goal?","goal.confirm.abandon.message":"The goal moves to Abandoned and no longer counts as ongoing. You can reopen it, but it reopens as active — an achieved goal that is abandoned cannot be restored as achieved.","goal.toast.achieved":"The goal is marked as achieved.","goal.toast.reopened":"The goal is open again.","goal.toast.abandoned":"The goal is abandoned.","goal.plans.empty":"This goal does not belong to any plan.","goal.plans.attach":"Link plan","goal.plans.placeholder":"Choose a plan","goal.plans.detach":"Remove link","goal.plans.none":"You have no active plan left to link this goal to.","goal.toast.planAttached":"The goal is linked to {title}.","goal.toast.planDetached":"The goal is no longer linked to {title}.","goal.sharing.hint":"Only teachers you pick here can see the goal. They can write notes and mark the goal achieved or reopen it.","goal.sharing.loading":"Loading sharing…","goal.sharing.none":"You have no teacher to share with yet. The goal is yours either way.","goal.sharing.saved":"Sharing is updated.","goal.sharing.error":"Sharing could not be changed. Try again.","goalCreate.heading":"New goal","goalCreate.field.title":"Title","goalCreate.field.title.hint":"What will you be able to do once the goal is reached?","goalCreate.field.description":"Description","goalCreate.field.description.hint":"What does the goal mean in practice? Optional.","goalCreate.field.target":"Target date","goalCreate.field.horse":"Horse","goalCreate.field.horse.hint":"Is the goal about one particular horse? Optional.","goalCreate.field.target.hint":"When do you want to be there? Optional.","goalCreate.submit":"Create goal","goalCreate.cancel":"Cancel","goalCreate.created":"The goal is created.","auth.login.title":"Sign in","auth.login.lede":"Welcome back. Your lessons, sessions and goals are gathered here.","auth.login.submit":"Sign in","auth.login.submitting":"Signing in …","auth.login.altPrompt":"No account yet?","auth.login.altLink":"Create account","auth.register.title":"Create account","auth.register.lede":"One account is enough. You can be a student to one teacher and a teacher to another.","auth.register.submit":"Create account","auth.register.submitting":"Creating account …","auth.register.altPrompt":"Already have an account?","auth.register.altLink":"Sign in","auth.field.email":"Email","auth.field.password":"Password","auth.field.displayName":"Name","auth.hint.email":"The address you sign in with. If you were invited, use the address the invitation was sent to.","auth.hint.displayName":"This is how you appear to your teacher and your students.","auth.hint.password":"At least 8 characters.","auth.error.emailRequired":"Enter your email address.","auth.error.emailInvalid":"Check the address — it needs an @ and a domain, for example name@example.com.","auth.error.passwordRequired":"Enter your password.","auth.error.passwordTooShort":"Choose a password of at least 8 characters.","auth.error.displayNameRequired":"Enter the name you want to appear under.","auth.error.credentials":"That email address or password doesn't match. Check both and try again.","auth.error.emailTaken":"That address already has an account. Sign in instead, or use another address.","auth.error.validation":"Something in the form didn't pass. Review the fields and submit again.","auth.error.network":"We can't reach the server. Check your connection and try again.","auth.error.rateLimit":"Too many sign-in attempts. Wait a minute and try again.","auth.error.server":"Something went wrong on our end. Wait a moment and try again.","library.heading":"Library","library.tab.exercises":"Exercises","library.tab.programs":"Programs","library.create":"New exercise","library.search.label":"Search the library","library.search.placeholder":"Name or description","library.loading":"Loading the library …","library.error":"The library could not be loaded.","library.retry":"Try again","library.empty.heading":"No exercises yet","library.empty.body":"Exercises are the building blocks of your lessons and programs. Create the first one and it appears in every picker.","library.empty.action":"Create the first exercise","library.noMatches.heading":"No exercise matches that search","library.noMatches.body":"Try a shorter word, or clear the search to see the whole library.","library.noMatches.action":"Clear the search","exercise.back":"← Library","exercise.eyebrow":"Exercise","exercise.loading":"Loading the exercise …","exercise.field.name":"Name","exercise.field.description":"Description","exercise.error.name":"Give the exercise a name.","exercise.saveError":"The exercise could not be saved. Try again.","exercise.save":"Save changes","exercise.saved":"Exercise saved.","exercise.notFound.heading":"That exercise does not exist","exercise.notFound.body":"It has been archived, or it belongs to a library other than yours.","exercise.notFound.action":"Back to the library","exercise.history.heading":"Exercise history","exercise.history.body":"Pick a student to see how the exercise has gone in their lessons.","exercise.history.placeholder":"Pick a student","exercise.history.open":"Show history","exercise.history.noStudents":"History opens once you have a student — it follows one rider through their lessons.","exercise.history.rosterLoading":"Loading your students …","exercise.history.rosterError":"The student list could not be loaded, so the picker is empty right now. Reload the page and try again.","exercise.danger.heading":"Archive the exercise","exercise.danger.body":"The exercise leaves the library and every picker. Lessons and training sessions that already used it keep it, along with their notes.","exercise.danger.action":"Archive exercise","exercise.confirm.archive.title":"Archive the exercise?","exercise.confirm.archive.message":"It disappears from the library and every picker immediately. Completed lessons and training sessions keep the exercise and their notes. This cannot be undone from here.","exercise.confirm.dismiss":"Cancel","exercise.archived":"Exercise archived.","exerciseCreate.heading":"New exercise","exerciseCreate.field.name":"Name","exerciseCreate.field.name.hint":"What the rider sees in the lesson. Short and recognisable.","exerciseCreate.field.description":"Description","exerciseCreate.field.description.hint":"Optional. What the exercise is for, and what you are watching for.","exerciseCreate.submit":"Create exercise","exerciseCreate.cancel":"Cancel","exerciseCreate.created":"Exercise created.","programs.create":"New program","programs.loading":"Loading the programs …","programs.error":"The programs could not be loaded.","programs.retry":"Try again","programs.empty.heading":"No programs yet","programs.empty.body":"A program is a named sequence of exercises you pull into a lesson or a training session.","programs.empty.action":"Create the first program","program.exerciseCount.one":"{count} exercise","program.exerciseCount.other":"{count} exercises","program.back":"← Library","program.eyebrow":"Program","program.loading":"Loading the program …","program.field.title":"Name","program.field.description":"Description","program.error.title":"Give the program a name.","program.saveError":"The program could not be saved. Try again.","program.save":"Save changes","program.saved":"Program saved.","program.notFound.heading":"That program does not exist","program.notFound.body":"It has been archived, or it belongs to a library other than yours.","program.notFound.action":"Back to the programs","program.snapshot":"Lessons and training sessions copy the exercises when the program is pulled in. Editing here rewrites nothing in the occasions that already copied it.","program.exercises.heading":"Exercises in the program","program.exercises.empty":"The program is empty. Add the first exercise below.","program.add.label":"Add exercise","program.add.placeholder":"Pick an exercise","program.add.submit":"Add","program.add.none":"The library is empty. Create an exercise first and it can be pulled in here.","program.add.error":"The library could not be loaded, so the picker is empty right now. Reload the page and try again.","program.add.exhausted":"Every exercise in the library is already in this program.","program.add.duplicate":"{name} is already in the program. The same exercise can only appear once.","program.add.failed":"The exercise could not be added. Try again.","program.row.up":"Move {name} up","program.row.down":"Move {name} down","program.row.remove":"Remove","program.row.removeNamed":"Remove {name} from the program","program.row.note.add":"Add note","program.row.note.edit":"Edit note","program.row.note.addNamed":"Add a note to {name}","program.row.note.editNamed":"Edit the note on {name}","program.row.note.label":"Note on this row","program.row.note.save":"Save note","program.row.note.cancel":"Cancel","program.row.note.saved":"Note saved.","program.row.note.failed":"The note could not be saved. Your text is still here — try again.","program.row.archived":"Archived","program.row.archived.hint":"This exercise is archived and is skipped when the program is pulled in. The row does nothing — remove it when you want to tidy up.","program.reorderError":"The order could not be saved. Try again.","program.danger.heading":"Archive the program","program.danger.body":"The program leaves the library and every picker. Lessons and training sessions that already copied it keep their exercises and their “from program” label.","program.danger.action":"Archive program","program.confirm.archive.title":"Archive the program?","program.confirm.archive.message":"It disappears from the library and every picker immediately. Occasions that already copied the program keep the exercises and the label “from {title}”. This cannot be undone from here.","program.confirm.remove.title":"Remove the exercise from the program?","program.confirm.remove.message":"{name} is archived and cannot be put back into the program afterwards. Occasions that already copied the program are unaffected.","program.confirm.removeNoted.message":"{name} is removed from the program, and the row’s instruction text goes with it. You can add the exercise back and write the text again — it lands last in the list, so you will have to move it into place.","program.confirm.removeArchivedNoted.message":"{name} is archived and cannot be put back into the programme afterwards. The row's instruction text goes with it. Occasions that already copied the programme are unaffected.","program.confirm.dismiss":"Cancel","program.archived":"Program archived.","programCreate.heading":"New program","programCreate.field.title":"Name","programCreate.field.title.hint":"How you will find the program again, for example “Basic jumping A”.","programCreate.field.description":"Description","programCreate.field.description.hint":"Optional. What the program trains, and for whom.","programCreate.submit":"Create program","programCreate.cancel":"Cancel","programCreate.created":"Program created. Add its exercises here.","stable.heading":"Horses","stable.create":"Add horse","stable.loading":"Loading the stable …","stable.error":"The stable could not be loaded.","stable.retry":"Try again","stable.empty.heading":"No horses yet","stable.empty.body":"Add the horses you ride. Then you can pick one when you book a lesson or log a session.","stable.empty.action":"Add the first horse","horse.back":"← Horses","horse.eyebrow":"Horse","horse.loading":"Loading the horse …","horse.field.name":"Name","horse.error.name":"Give the horse a name.","horse.saveError":"The horse could not be saved. Try again.","horse.save":"Save changes","horse.saved":"Horse saved.","horse.notFound.heading":"That horse does not exist","horse.notFound.body":"It has been archived, or it belongs to a stable other than yours.","horse.notFound.action":"Back to the horses","horse.danger.heading":"Archive the horse","horse.danger.body":"The horse leaves the stable and the pickers for new lessons and sessions. Lessons and sessions already ridden keep the horse, along with their notes.","horse.danger.action":"Archive horse","horse.confirm.archive.title":"Archive the horse?","horse.confirm.archive.message":"The horse disappears from the stable and every picker immediately. Past lessons and training sessions keep the horse and their notes. This cannot be undone from here.","horse.confirm.dismiss":"Cancel","horse.archived":"Horse archived.","horseCreate.heading":"Add horse","horseCreate.field.name":"Name","horseCreate.field.name.hint":"What you call the horse. You can change it at any time.","horseCreate.submit":"Add horse","horseCreate.cancel":"Cancel","horseCreate.created":"Horse added to the stable.","exerciseHistory.eyebrow":"Exercise history","exerciseHistory.back":"← Back","exerciseHistory.subtitle":"Student: {student}","exerciseHistory.loading":"Loading the history …","exerciseHistory.caption":"Lessons where the exercise was used, most recent first","exerciseHistory.scope":"Shared notes plus your own private ones. The other party’s private notes are never shown. Read-only — notes are written on the lesson.","exerciseHistory.col.date":"Date","exerciseHistory.col.occasion":"Occasion","exerciseHistory.col.rowNote":"Row note","exerciseHistory.col.notes":"Notes","exerciseHistory.standalone":"Standalone","exerciseHistory.note.shared":"Shared note","exerciseHistory.note.private":"Private note","exerciseHistory.openLesson":"Open the lesson on {date}","exerciseHistory.empty.heading":"No history yet","exerciseHistory.empty.body":"History fills in once the exercise is used in a lesson. Row notes and feedback collect here.","exerciseHistory.empty.action":"Back","exerciseHistory.notFound.heading":"That history does not exist","exerciseHistory.notFound.body":"The student, the exercise, or the connection between you cannot be found.","exerciseHistory.notFound.action":"Back to my students","exerciseHistory.unreachable.heading":"The history could not be loaded","exerciseHistory.unreachable.body":"We did not reach the server, so we do not know what is here. Check your connection and try again.","exerciseHistory.unreachable.action":"Try again","home.title":"Home","home.lede":"Here is what needs you today.","home.loading":"Loading your overview …","home.error":"The overview could not be loaded.","home.retry":"Try again","home.updated":"Updated {when}","home.nextLesson":"Next lesson","home.nextLesson.none":"No lesson booked","home.nextLesson.empty.action":"View lessons","home.nextLesson.exercises.more.one":"+{count} more exercise","home.nextLesson.exercises.more.other":"+{count} more exercises","home.nextLesson.noExercises":"No exercises added yet","home.feedback":"Latest feedback","home.feedback.none":"No shared feedback yet","home.feedback.empty.action":"Open Lessons","home.feedback.byline":"{name} · {when}","home.feedback.on.lesson":"On the lesson with {name}","home.feedback.on.lessonExercise":"On the exercise {exercise} in the lesson with {name}","home.feedback.on.trainingSession":"On the training session","home.feedback.on.trainingSessionExercise":"On the exercise {exercise} in the training session","home.feedback.on.goal":"On the goal {title}","home.awaiting":"Awaiting your feedback","home.awaiting.none":"You have replied to everything","home.awaiting.count.one":"{count} occasion","home.awaiting.count.other":"{count} occasions","home.awaiting.lesson":"Lesson with {name}","home.awaiting.session":"Training session · {name}","home.awaiting.all":"Open Lessons","home.riding":"Your training","home.plans.none":"No active plan","home.plans.count.one":"{count} active plan","home.plans.count.other":"{count} active plans","home.goals.nearing":"Target dates coming up","home.goals.none":"No goals with a date within a month.","home.goals.overdue":"Date passed","home.invitations.zero":"You have no invitations waiting.","home.invitations.one":"You have one invitation waiting.","home.invitations.other":"You have {count} invitations waiting.","home.invitations.cta":"Open the inbox","home.action.logSession":"Log session","home.action.bookLesson":"Book lesson","home.welcome.title":"Welcome","home.welcome.body":"Someone has invited you. Reply in the inbox and the rest follows.","home.start.title":"Get started","home.start.teach.title":"Teach","home.start.teach.body":"Invite your first student and start planning lessons.","home.start.teach.action":"Invite student","home.start.ride.title":"Ride","home.start.ride.body":"Add your horse and set a goal to train towards.","home.start.ride.action":"Add horse","home.start.ride.goal":"Create goal"};Pn("sv",_i);Pn("en",vi);di("sv");class kt extends ${static styles=`
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
    `;el;render(){return this.el=document.createElement("div"),this.el.className="ui-overlay",this.el.style.background=this.props.bg??"rgba(0,0,0,0.4)",this.el.style.zIndex=String(this.props.zIndex??50),this.el.addEventListener("click",()=>{this.props.onclose?this.props.onclose():this.props.open.set(!1)}),this.track(b(()=>{const e=this.props.open.get();this.el.classList.toggle("open",e),this.props.scrollLock&&(document.body.style.overflow=e?"hidden":"")})),this.el}onDestroy(){this.props.scrollLock&&(document.body.style.overflow="")}}const nn=n=>`var(--${n})`;class yi extends ${static styles=`
        .ui-drawer {
            position: fixed;
            top: 0;
            bottom: 0;
            background: ${nn("surface")};
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
            box-shadow: ${nn("shadow-3")};
        }
        .ui-drawer--left.open {
            transform: translateX(0);
        }
        .ui-drawer--right.open {
            transform: translateX(0);
        }
    `;panel;render(){const e=document.createElement("div"),t=this.props.zIndex??100,s=this.props.side??"left";if(this.spawn(kt,e,{open:this.props.open,bg:this.props.overlayBg??"rgba(0,0,0,0.4)",zIndex:t-1,scrollLock:!0}),this.panel=document.createElement("div"),this.panel.className=`ui-drawer ui-drawer--${s}`,this.panel.style.width=this.props.width??"280px",this.panel.style.zIndex=String(t),e.appendChild(this.panel),this.props.content!=null){const i=document.createElement("div");i.setAttribute("bind","content"),this.panel.appendChild(i),this.projectContent(i,this.props.content)}return this.track(b(()=>{this.panel.classList.toggle("open",this.props.open.get())})),e}projectContent(e,t){typeof t=="string"?e.textContent=t:typeof t=="function"&&t.prototype instanceof $?this.spawn(t,e):typeof t=="function"&&t(e,{spawn:(s,i,...r)=>this.spawn(s,i,...r),track:s=>this.track(s)})}}let xi=1;const wi=3e3,ki=8e3;class U{items=new u([]);timers=new Map;show(e){const t=String(xi++),s=e.variant??"info",i=e.duration??(e.action?ki:wi),r={id:t,message:e.message,variant:s,duration:i,action:e.action};if(this.items.update(d=>[...d,r]),i>0){const d=setTimeout(()=>this.dismiss(t),i);this.timers.set(t,d)}}dismiss(e){const t=this.timers.get(e);t!=null&&(clearTimeout(t),this.timers.delete(e)),this.items.update(s=>s.filter(i=>i.id!==e))}}const oe=n=>`var(--${n})`,$i="#1C1F21",sn="#F1ECE3",an="#AFA698",nt="#CFAA81",Ci="#8CC5A4",Si="#E39396";class Ei extends ${static styles=`
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
            background: ${$i};
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
            border: 1px solid ${oe("border-strong")};
            border-radius: ${oe("radius-md")};
            box-shadow: ${oe("shadow-3")};
            font-family: ${oe("font-ui")};
            display: flex;
            align-items: center;
            gap: 12px;
            pointer-events: auto;
            opacity: 0;
            transform: translateX(100%);
            transition:
                opacity ${oe("dur-slow")} ${oe("ease-standard")},
                transform ${oe("dur-slow")} ${oe("ease-standard")};
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
            border-left: 3px solid ${nt};
        }
        .ui-toast--success {
            border-left: 3px solid ${Ci};
        }
        .ui-toast--error {
            border-left: 3px solid ${Si};
        }
        .ui-toast__message {
            flex: 1;
            color: ${sn};
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
            color: ${nt};
            cursor: pointer;
            text-decoration: underline;
            text-underline-offset: 2px;
        }
        .ui-toast__action:focus-visible {
            outline: 2px solid ${nt};
            outline-offset: 2px;
        }
        .ui-toast__countdown {
            flex-shrink: 0;
            color: ${an};
            font-size: 0.75rem;
            font-variant-numeric: tabular-nums;
        }
        .ui-toast__close {
            background: none;
            border: none;
            color: ${an};
            cursor: pointer;
            padding: 0;
            font-size: 1rem;
            line-height: 1;
            flex-shrink: 0;
        }
        .ui-toast__close:hover {
            color: ${sn};
        }
    `;svc;render(){this.svc=this.inject(U);const e=document.createElement("div");return e.className="ui-toast-container",this.$each(e,this.svc.items,(t,s,i)=>{const r=document.createElement("div");r.className=`ui-toast ui-toast--${t.variant}`;const d=document.createElement("span");if(d.className="ui-toast__message",d.textContent=t.message,r.appendChild(d),t.action){const h=t.action,p=document.createElement("button");if(p.className="ui-toast__action",p.textContent=h.label,p.addEventListener("click",()=>{h.onclick(),this.svc.dismiss(t.id)}),r.appendChild(p),t.duration>0){const g=document.createElement("span");g.className="ui-toast__countdown",g.setAttribute("aria-hidden","true");let m=Math.ceil(t.duration/1e3);g.textContent=`${m} s`;const _=setInterval(()=>{if(m-=1,m<=0){clearInterval(_);return}g.textContent=`${m} s`},1e3);i(()=>clearInterval(_)),r.appendChild(g)}}const c=document.createElement("button");return c.className="ui-toast__close",c.textContent="×",c.setAttribute("aria-label","Dismiss"),c.addEventListener("click",()=>this.svc.dismiss(t.id)),r.appendChild(c),requestAnimationFrame(()=>{r.classList.add("ui-toast--visible")}),r},t=>t.id),e}}const $t={"field-bg":"var(--surface)","field-bg-focus":"var(--surface)","field-border":"var(--border-strong)","field-border-width":"1px","field-rule":"var(--field-border, var(--border-strong))","field-rule-width":"0px","field-radius":"var(--radius-sm)","field-padding-y":"8px","field-padding-x":"10px","field-font-size":"14px","field-line-height":"21px","field-focus-border":"var(--accent)","field-focus-ring":"var(--accent-soft)","field-focus-ring-width":"3px","field-invalid-border":"var(--danger)","field-invalid-rule":"var(--danger)","field-invalid-ring":"var(--danger-soft)","btn-radius":"var(--radius-sm)","btn-border-width":"1px","btn-padding-y":"8px","btn-padding-x":"16px","btn-font-size":"14px","btn-line-height":"20px","btn-font-weight":"500","btn-focus-ring":"var(--accent-soft)","btn-focus-ring-width":"3px","btn-primary-bg":"var(--accent)","btn-primary-fg":"var(--on-accent)","btn-primary-border":"var(--accent)","btn-primary-shadow":"none","btn-primary-bg-hover":"var(--accent-strong)","btn-primary-fg-hover":"var(--on-accent)","btn-primary-border-hover":"var(--accent-strong)","btn-secondary-bg":"var(--surface-2)","btn-secondary-fg":"var(--text)","btn-secondary-border":"var(--border)","btn-secondary-shadow":"none","btn-secondary-bg-hover":"var(--accent-soft)","btn-secondary-fg-hover":"var(--text)","btn-secondary-border-hover":"var(--border-strong)","btn-ghost-bg":"transparent","btn-ghost-fg":"var(--text-muted)","btn-ghost-border":"transparent","btn-ghost-shadow":"none","btn-ghost-bg-hover":"var(--surface-2)","btn-ghost-fg-hover":"var(--text)","btn-ghost-border-hover":"transparent","btn-danger-bg":"var(--danger)","btn-danger-fg":"var(--on-danger)","btn-danger-border":"var(--danger)","btn-danger-shadow":"none","btn-danger-bg-hover":"var(--danger-strong, var(--danger))","btn-danger-fg-hover":"var(--on-danger)","btn-danger-border-hover":"var(--danger-strong, var(--danger))","btn-disabled-bg":"var(--surface-2)","btn-disabled-fg":"var(--text-muted)","btn-disabled-border":"var(--border)","btn-disabled-opacity":"0.7"},Fn={"font-display":"Georgia,'Times New Roman',serif","font-ui":"system-ui,-apple-system,'Segoe UI',sans-serif","space-1":"4px","space-2":"8px","space-3":"12px","space-4":"16px","space-5":"24px","space-6":"32px","space-7":"48px","space-8":"64px","radius-sm":"4px","radius-md":"8px","radius-pill":"999px","dur-fast":"120ms","dur-base":"200ms","dur-slow":"320ms","ease-standard":"cubic-bezier(.2,.7,.3,1)"},Rn={primary:"var(--accent)","primary-text":"var(--on-accent)","btn-bg":"var(--surface-2)","btn-hover":"var(--accent-soft)","input-bg":"var(--surface)","topbar-bg":"var(--surface)","topbar-logo":"var(--text-muted)","active-bg":"var(--accent-soft)","active-text":"var(--accent-strong)","hover-bg":"var(--surface-2)",error:"var(--danger)",radius:"var(--radius-md)",shadow:"var(--shadow-1)","shadow-elevated":"var(--shadow-2)","done-opacity":"0.4"},Ni={...Rn,"done-opacity":"0.35"},Ld={...Fn,...Rn,...$t,bg:"#f8f9fa",surface:"#ffffff","surface-2":"#f1f3f5",text:"#212529","text-muted":"#5c636a",border:"#dee2e6","border-strong":"#868e96",accent:"#3b5bdb","accent-strong":"#2f44ad","accent-soft":"#edf2ff","on-accent":"#ffffff",success:"#217a36","success-soft":"#ebfbee",warning:"#a85400","warning-soft":"#fff4e6",danger:"#c92a2a","danger-strong":"#a51111","danger-soft":"#fff5f5","on-danger":"#ffffff",info:"#1864ab","info-soft":"#e7f5ff","shadow-1":"0 1px 2px rgba(33,37,41,.06)","shadow-2":"0 4px 12px rgba(33,37,41,.10)","shadow-3":"0 16px 40px rgba(33,37,41,.22)"},Id={...Fn,...Ni,...$t,bg:"#141517",surface:"#1a1b1e","surface-2":"#25262b",text:"#e9ecef","text-muted":"#a6a7ab",border:"#373a40","border-strong":"#868e96",accent:"#91a7ff","accent-strong":"#bac8ff","accent-soft":"#232840","on-accent":"#141517",success:"#69db7c","success-soft":"#17301e",warning:"#ffa94d","warning-soft":"#33260f",danger:"#ff8787","danger-strong":"#ffa8a8","danger-soft":"#331f1f","on-danger":"#141517",info:"#74c0fc","info-soft":"#17242f","shadow-1":"0 1px 2px rgba(0,0,0,.4)","shadow-2":"0 4px 14px rgba(0,0,0,.5)","shadow-3":"0 16px 44px rgba(0,0,0,.6)"},z=n=>`var(--${n})`,I=(n,e)=>`var(--${n}, ${e})`,A=n=>{const e=$t[n];if(e===void 0)throw new Error(`unknown control token: --${n}`);return e},l=Bs({xs:"0.25rem",sm:"0.5rem",md:"0.75rem",lg:"1rem",xl:"1.5rem","2xl":"2rem","3xl":"3rem","4xl":"4rem"}),He=n=>`
    background: ${I(`btn-${n}-bg`,A(`btn-${n}-bg`))};
    color: ${I(`btn-${n}-fg`,A(`btn-${n}-fg`))};
    border-color: ${I(`btn-${n}-border`,A(`btn-${n}-border`))};
    box-shadow: ${I(`btn-${n}-shadow`,A(`btn-${n}-shadow`))};
    &:hover {
        background: ${I(`btn-${n}-bg-hover`,A(`btn-${n}-bg-hover`))};
        color: ${I(`btn-${n}-fg-hover`,A(`btn-${n}-fg-hover`))};
        border-color: ${I(`btn-${n}-border-hover`,A(`btn-${n}-border-hover`))};
    }`,Mn=`
    background: ${I("btn-disabled-bg",A("btn-disabled-bg"))};
    color: ${I("btn-disabled-fg",A("btn-disabled-fg"))};
    border-color: ${I("btn-disabled-border",A("btn-disabled-border"))};
    box-shadow: none;
    opacity: ${I("btn-disabled-opacity",A("btn-disabled-opacity"))};
    cursor: not-allowed;`,Ti={primary:He("primary"),secondary:He("secondary"),ghost:He("ghost"),danger:He("danger"),disabled:Mn},k=(n=I("btn-radius",A("btn-radius")),e="secondary")=>`
    /*
     * Width here, colour from the tier below. Every tier carries the same
     * border width, so switching tiers recolours the box without resizing it —
     * the transparent placeholder only keeps this shorthand from resetting the
     * colour the tier is about to set.
     */
    border: ${I("btn-border-width",A("btn-border-width"))} solid transparent;
    border-radius: ${n};
    padding: ${I("btn-padding-y",A("btn-padding-y"))} ${I("btn-padding-x",A("btn-padding-x"))};
    font-family: ${z("font-ui")};
    font-size: ${I("btn-font-size",A("btn-font-size"))};
    line-height: ${I("btn-line-height",A("btn-line-height"))};
    font-weight: ${I("btn-font-weight",A("btn-font-weight"))};
    cursor: pointer;
    transition:
        background ${z("dur-fast")} ${z("ease-standard")},
        border-color ${z("dur-fast")} ${z("ease-standard")},
        color ${z("dur-fast")} ${z("ease-standard")},
        box-shadow ${z("dur-fast")} ${z("ease-standard")};
    &:focus-visible {
        outline: none;
        box-shadow: 0 0 0 ${I("btn-focus-ring-width",A("btn-focus-ring-width"))} ${I("btn-focus-ring",A("btn-focus-ring"))};
    }
    ${Ti[e]}
    &:disabled {${Mn}}
`,Li=`max(${I("field-border-width",A("field-border-width"))}, ${I("field-rule-width",A("field-rule-width"))})`,R=()=>`
    border: ${I("field-border-width",A("field-border-width"))} solid ${I("field-border",A("field-border"))};
    border-bottom: ${Li} solid ${I("field-rule",A("field-rule"))};
    border-radius: ${I("field-radius",A("field-radius"))};
    padding: ${I("field-padding-y",A("field-padding-y"))} ${I("field-padding-x",A("field-padding-x"))};
    background: ${I("field-bg",A("field-bg"))};
    color: ${z("text")};
    font-family: ${z("font-ui")};
    font-size: ${I("field-font-size",A("field-font-size"))};
    line-height: ${I("field-line-height",A("field-line-height"))};
    font-weight: 400;
    transition:
        border-color ${z("dur-fast")} ${z("ease-standard")},
        box-shadow ${z("dur-fast")} ${z("ease-standard")},
        background ${z("dur-fast")} ${z("ease-standard")};
    &::placeholder { color: ${z("text-muted")}; }
    &:focus-visible {
        outline: none;
        border-color: ${I("field-focus-border",A("field-focus-border"))};
        background: ${I("field-bg-focus",A("field-bg-focus"))};
        box-shadow: 0 0 0 ${I("field-focus-ring-width",A("field-focus-ring-width"))} ${I("field-focus-ring",A("field-focus-ring"))};
    }
    &[aria-invalid='true'] {
        border-color: ${I("field-invalid-border",A("field-invalid-border"))};
        border-bottom-color: ${I("field-invalid-rule",A("field-invalid-rule"))};
    }
    &[aria-invalid='true']:focus-visible {
        border-color: ${I("field-invalid-border",A("field-invalid-border"))};
        border-bottom-color: ${I("field-invalid-rule",A("field-invalid-rule"))};
        background: ${I("field-bg-focus",A("field-bg-focus"))};
        box-shadow: 0 0 0 ${I("field-focus-ring-width",A("field-focus-ring-width"))} ${I("field-invalid-ring",A("field-invalid-ring"))};
    }
`,Bn=()=>`
    display: block;
    font-family: ${z("font-ui")};
    font-size: 11px;
    line-height: 16px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.14em;
    color: ${z("text-muted")};
`,Ii=()=>`
    display: block;
    font-family: ${z("font-ui")};
    font-size: 13px;
    line-height: 20px;
    color: ${z("danger")};
`,q=n=>`
    background: ${z("surface")};
    border: 1px solid ${z("border")};
    border-radius: ${z("radius-md")};
    box-shadow: ${z("shadow-1")};
    
    & .ui-card__eyebrow {
        ${Bn()}
        margin: 0 0 ${l("sm")} 0;
    }
    /*
     * Large numbers stay in the UI font with tabular figures — §02 makes
     * lining numerals mandatory for counters, and §4.2 puts big values in
     * Open Sans, never the serif.
     */
    & .ui-card__value {
        margin: 0;
        font-family: ${z("font-ui")};
        font-size: 2rem;
        line-height: 1.15;
        font-weight: 600;
        font-variant-numeric: tabular-nums;
        color: ${z("text")};
    }
    & .ui-card__meta {
        margin: ${l("xs")} 0 0 0;
        font-family: ${z("font-ui")};
        font-size: 13px;
        line-height: 20px;
        color: ${z("text-muted")};
    }
    & .ui-card__link {
        display: inline-block;
        margin-top: ${l("md")};
        font-family: ${z("font-ui")};
        font-size: 13px;
        line-height: 20px;
        font-weight: 600;
        color: ${z("accent")};
        text-decoration: none;
    }
    & .ui-card__link:hover {
        text-decoration: underline;
        text-underline-offset: 2px;
    }
`;class Gn{titleKey=new u(null);navOpen=new u(!1)}const Ai=S(`
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
`);class Hi extends ${static styles=`
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
            gap: ${l("sm")} ${l("lg")};
            /* min-height, not height: a fixed height cannot contain a second row
               and would overlap the page instead. */
            padding: ${l("xs")} ${l("xl")};
            min-height: 48px;
            background: ${o("surface")};
            border-bottom: 1px solid ${o("border")};
            color: ${o("text")};

            & .top-bar__logo {
                font-weight: 700;
                font-size: 0.875rem;
                letter-spacing: 0.05em;
                text-transform: uppercase;
                white-space: nowrap;
                color: ${o("text-muted")};
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
                font-family: ${o("font-ui")};
                font-size: 0.875rem;
                font-weight: 600;
                color: ${o("text")};
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
                margin-left: -${l("sm")};
                padding: 0;
                border: 1px solid ${o("border-strong")};
                border-radius: ${o("radius-sm")};
                background: ${o("surface-2")};
                color: ${o("text")};
                /* A <button> does not inherit the document face — the UA sheet
                   sets its own (Arial). Design system 02: Open Sans does all the
                   work in controls, and the serif is forbidden here outright, so
                   the face is named rather than left to the UA. */
                font-family: ${o("font-ui")};
                cursor: pointer;
                transition: background ${o("dur-fast")} ${o("ease-standard")};

                &:hover { background: ${o("accent-soft")}; }
                &:focus-visible {
                    outline: 2px solid ${o("accent")};
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
                gap: ${l("xs")};
                padding: ${l("xs")} ${l("md")};
                /* Both labels are two words in Swedish ("Ljust läge", "Logga
                   ut"). Allowed to break they wrap INSIDE the pill, which reads
                   as two pills. The bar itself wraps instead — see the
                   flex-wrap note above — so this cannot trap the overflow. */
                white-space: nowrap;
                border: 1px solid ${o("border-strong")};
                border-radius: ${o("radius-pill")};
                background: ${o("surface-2")};
                color: ${o("text")};
                font-family: ${o("font-ui")};
                font-size: 0.8rem;
                cursor: pointer;
                transition: background ${o("dur-fast")} ${o("ease-standard")};

                &:hover { background: ${o("accent-soft")}; }
                &:focus-visible {
                    outline: 2px solid ${o("accent")};
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
    `;app=this.inject(Gn);auth=this.inject(ne);theme=this.inject(In);router=this.inject(L);menu;render(){const e=this.wire(Ai,{menu:{onclick:()=>this.app.navOpen.update(t=>!t),"aria-label":()=>a("nav.openMenu"),"aria-expanded":()=>String(this.app.navOpen.get())},logo:()=>a("app.brand"),title:()=>{const t=this.app.titleKey.get();return t===null?"":a(t)},theme:{onclick:()=>this.theme.toggle()},themeGlyph:()=>this.theme.dark.get()?"☀":"☾",themeLabel:()=>this.theme.dark.get()?a("topBar.theme.toLight"):a("topBar.theme.toDark"),logout:{onclick:async()=>{await this.auth.logout(),this.router.navigate("/login",!0)},textContent:()=>this.auth.currentUser.get()?a("topBar.signOut"):""}});return this.menu=this.ref(e,"menu"),e}onMount(){let e=!1;this.track(b(()=>{const t=this.app.navOpen.get();e&&!t&&this.menu.focus(),e=t}))}}function Oi(n){return{async register(e){return y({method:"POST",url:`${n}/auth/register`,body:e})}}}function zi(n){return{async create(e){return y({method:"POST",url:`${n}/invitations`,body:e})},async revoke(e){return y({method:"POST",url:`${n}/invitations/revoke`,body:e})},async list(){return y({method:"GET",url:`${n}/invitations`})},async inbox(){return y({method:"GET",url:`${n}/invitations/inbox`})},async accept(e){return y({method:"POST",url:`${n}/invitations/accept`,body:e})},async decline(e){return y({method:"POST",url:`${n}/invitations/decline`,body:e})}}}function Pi(n){return{async list(){return y({method:"GET",url:`${n}/students`})},async get(e){const t=new Set(["id"]),s=new URLSearchParams;for(const[r,d]of Object.entries(e))!t.has(r)&&d!==void 0&&s.set(r,String(d));const i=s.toString();return y({method:"GET",url:`${n}/students/${e.id}${i?"?"+i:""}`})},async listHorses(e){const t=new Set(["id"]),s=new URLSearchParams;for(const[r,d]of Object.entries(e))!t.has(r)&&d!==void 0&&s.set(r,String(d));const i=s.toString();return y({method:"GET",url:`${n}/students/${e.id}/horses${i?"?"+i:""}`})},async listPlans(e){const t=new Set(["id"]),s=new URLSearchParams;for(const[r,d]of Object.entries(e))!t.has(r)&&d!==void 0&&s.set(r,String(d));const i=s.toString();return y({method:"GET",url:`${n}/students/${e.id}/plans${i?"?"+i:""}`})},async listGoals(e){const t=new Set(["id"]),s=new URLSearchParams;for(const[r,d]of Object.entries(e))!t.has(r)&&d!==void 0&&s.set(r,String(d));const i=s.toString();return y({method:"GET",url:`${n}/students/${e.id}/goals${i?"?"+i:""}`})},async listTrainingSessions(e){const t=new Set(["id"]),s=new URLSearchParams;for(const[r,d]of Object.entries(e))!t.has(r)&&d!==void 0&&s.set(r,String(d));const i=s.toString();return y({method:"GET",url:`${n}/students/${e.id}/training-sessions${i?"?"+i:""}`})},async exerciseHistory(e){const t=new Set(["id","exerciseId"]),s=new URLSearchParams;for(const[r,d]of Object.entries(e))!t.has(r)&&d!==void 0&&s.set(r,String(d));const i=s.toString();return y({method:"GET",url:`${n}/students/${e.id}/exercises/${e.exerciseId}/history${i?"?"+i:""}`})}}}function Di(n){return{async create(e){return y({method:"POST",url:`${n}/exercises`,body:e})},async list(){return y({method:"GET",url:`${n}/exercises`})},async listForStudent(){return y({method:"GET",url:`${n}/exercises/for-student`})},async get(e){const t=new Set(["id"]),s=new URLSearchParams;for(const[r,d]of Object.entries(e))!t.has(r)&&d!==void 0&&s.set(r,String(d));const i=s.toString();return y({method:"GET",url:`${n}/exercises/${e.id}${i?"?"+i:""}`})},async update(e){const t=new Set(["id"]),s={};for(const[i,r]of Object.entries(e))t.has(i)||(s[i]=r);return y({method:"PATCH",url:`${n}/exercises/${e.id}`,body:s})},async delete(e){return y({method:"DELETE",url:`${n}/exercises/${e.id}`})}}}function ji(n){return{async create(e){return y({method:"POST",url:`${n}/horses`,body:e})},async list(){return y({method:"GET",url:`${n}/horses`})},async get(e){const t=new Set(["id"]),s=new URLSearchParams;for(const[r,d]of Object.entries(e))!t.has(r)&&d!==void 0&&s.set(r,String(d));const i=s.toString();return y({method:"GET",url:`${n}/horses/${e.id}${i?"?"+i:""}`})},async update(e){const t=new Set(["id"]),s={};for(const[i,r]of Object.entries(e))t.has(i)||(s[i]=r);return y({method:"PATCH",url:`${n}/horses/${e.id}`,body:s})},async delete(e){return y({method:"DELETE",url:`${n}/horses/${e.id}`})}}}function Vi(n){return{async create(e){return y({method:"POST",url:`${n}/lessons`,body:e})},async list(){return y({method:"GET",url:`${n}/lessons`})},async get(e){const t=new Set(["id"]),s=new URLSearchParams;for(const[r,d]of Object.entries(e))!t.has(r)&&d!==void 0&&s.set(r,String(d));const i=s.toString();return y({method:"GET",url:`${n}/lessons/${e.id}${i?"?"+i:""}`})},async addExercise(e){const t=new Set(["id"]),s={};for(const[i,r]of Object.entries(e))t.has(i)||(s[i]=r);return y({method:"POST",url:`${n}/lessons/${e.id}/exercises`,body:s})},async removeExercise(e){return y({method:"DELETE",url:`${n}/lessons/${e.id}/exercises/${e.exerciseId}`})},async listExercises(e){const t=new Set(["id"]),s=new URLSearchParams;for(const[r,d]of Object.entries(e))!t.has(r)&&d!==void 0&&s.set(r,String(d));const i=s.toString();return y({method:"GET",url:`${n}/lessons/${e.id}/exercises${i?"?"+i:""}`})},async transition(e){const t=new Set(["id"]),s={};for(const[i,r]of Object.entries(e))t.has(i)||(s[i]=r);return y({method:"POST",url:`${n}/lessons/${e.id}/transition`,body:s})},async attachProgram(e){const t=new Set(["id"]),s={};for(const[i,r]of Object.entries(e))t.has(i)||(s[i]=r);return y({method:"POST",url:`${n}/lessons/${e.id}/programs`,body:s})},async detachProgram(e){return y({method:"DELETE",url:`${n}/lessons/${e.id}/programs/${e.programId}`})},async update(e){const t=new Set(["id"]),s={};for(const[i,r]of Object.entries(e))t.has(i)||(s[i]=r);return y({method:"PATCH",url:`${n}/lessons/${e.id}`,body:s})}}}function Fi(n){return{async create(e){return y({method:"POST",url:`${n}/notes`,body:e})},async list(e){const t=new URLSearchParams;for(const[i,r]of Object.entries(e))r!==void 0&&t.set(i,String(r));const s=t.toString();return y({method:"GET",url:`${n}/notes${s?"?"+s:""}`})},async update(e){const t=new Set(["id"]),s={};for(const[i,r]of Object.entries(e))t.has(i)||(s[i]=r);return y({method:"PATCH",url:`${n}/notes/${e.id}`,body:s})},async delete(e){return y({method:"DELETE",url:`${n}/notes/${e.id}`})}}}function Ri(n){return{async create(e){return y({method:"POST",url:`${n}/training-sessions`,body:e})},async list(){return y({method:"GET",url:`${n}/training-sessions`})},async get(e){const t=new Set(["id"]),s=new URLSearchParams;for(const[r,d]of Object.entries(e))!t.has(r)&&d!==void 0&&s.set(r,String(d));const i=s.toString();return y({method:"GET",url:`${n}/training-sessions/${e.id}${i?"?"+i:""}`})},async update(e){const t=new Set(["id"]),s={};for(const[i,r]of Object.entries(e))t.has(i)||(s[i]=r);return y({method:"PATCH",url:`${n}/training-sessions/${e.id}`,body:s})},async delete(e){return y({method:"DELETE",url:`${n}/training-sessions/${e.id}`})},async addExercise(e){const t=new Set(["id"]),s={};for(const[i,r]of Object.entries(e))t.has(i)||(s[i]=r);return y({method:"POST",url:`${n}/training-sessions/${e.id}/exercises`,body:s})},async removeExercise(e){return y({method:"DELETE",url:`${n}/training-sessions/${e.id}/exercises/${e.exerciseId}`})},async listExercises(e){const t=new Set(["id"]),s=new URLSearchParams;for(const[r,d]of Object.entries(e))!t.has(r)&&d!==void 0&&s.set(r,String(d));const i=s.toString();return y({method:"GET",url:`${n}/training-sessions/${e.id}/exercises${i?"?"+i:""}`})},async attachProgram(e){const t=new Set(["id"]),s={};for(const[i,r]of Object.entries(e))t.has(i)||(s[i]=r);return y({method:"POST",url:`${n}/training-sessions/${e.id}/programs`,body:s})},async detachProgram(e){return y({method:"DELETE",url:`${n}/training-sessions/${e.id}/programs/${e.programId}`})}}}function Mi(n){return{async list(){return y({method:"GET",url:`${n}/teachers`})}}}function Bi(n){return{async create(e){return y({method:"POST",url:`${n}/programs`,body:e})},async list(){return y({method:"GET",url:`${n}/programs`})},async listForStudent(){return y({method:"GET",url:`${n}/programs/for-student`})},async get(e){const t=new Set(["id"]),s=new URLSearchParams;for(const[r,d]of Object.entries(e))!t.has(r)&&d!==void 0&&s.set(r,String(d));const i=s.toString();return y({method:"GET",url:`${n}/programs/${e.id}${i?"?"+i:""}`})},async update(e){const t=new Set(["id"]),s={};for(const[i,r]of Object.entries(e))t.has(i)||(s[i]=r);return y({method:"PATCH",url:`${n}/programs/${e.id}`,body:s})},async delete(e){return y({method:"DELETE",url:`${n}/programs/${e.id}`})},async listExercises(e){const t=new Set(["id"]),s=new URLSearchParams;for(const[r,d]of Object.entries(e))!t.has(r)&&d!==void 0&&s.set(r,String(d));const i=s.toString();return y({method:"GET",url:`${n}/programs/${e.id}/exercises${i?"?"+i:""}`})},async addExercise(e){const t=new Set(["id"]),s={};for(const[i,r]of Object.entries(e))t.has(i)||(s[i]=r);return y({method:"POST",url:`${n}/programs/${e.id}/exercises`,body:s})},async reorderExercises(e){const t=new Set(["id"]),s={};for(const[i,r]of Object.entries(e))t.has(i)||(s[i]=r);return y({method:"PUT",url:`${n}/programs/${e.id}/exercises/order`,body:s})},async updateExerciseNotes(e){const t=new Set(["id","exerciseId"]),s={};for(const[i,r]of Object.entries(e))t.has(i)||(s[i]=r);return y({method:"PATCH",url:`${n}/programs/${e.id}/exercises/${e.exerciseId}`,body:s})},async removeExercise(e){return y({method:"DELETE",url:`${n}/programs/${e.id}/exercises/${e.exerciseId}`})}}}function Gi(n){return{async create(e){return y({method:"POST",url:`${n}/plans`,body:e})},async list(){return y({method:"GET",url:`${n}/plans`})},async get(e){const t=new Set(["id"]),s=new URLSearchParams;for(const[r,d]of Object.entries(e))!t.has(r)&&d!==void 0&&s.set(r,String(d));const i=s.toString();return y({method:"GET",url:`${n}/plans/${e.id}${i?"?"+i:""}`})},async update(e){const t=new Set(["id"]),s={};for(const[i,r]of Object.entries(e))t.has(i)||(s[i]=r);return y({method:"PATCH",url:`${n}/plans/${e.id}`,body:s})},async archive(e){const t=new Set(["id"]),s={};for(const[i,r]of Object.entries(e))t.has(i)||(s[i]=r);return y({method:"POST",url:`${n}/plans/${e.id}/archive`,body:s})}}}function Ki(n){return{async create(e){return y({method:"POST",url:`${n}/goals`,body:e})},async list(){return y({method:"GET",url:`${n}/goals`})},async get(e){const t=new Set(["id"]),s=new URLSearchParams;for(const[r,d]of Object.entries(e))!t.has(r)&&d!==void 0&&s.set(r,String(d));const i=s.toString();return y({method:"GET",url:`${n}/goals/${e.id}${i?"?"+i:""}`})},async update(e){const t=new Set(["id"]),s={};for(const[i,r]of Object.entries(e))t.has(i)||(s[i]=r);return y({method:"PATCH",url:`${n}/goals/${e.id}`,body:s})},async abandon(e){const t=new Set(["id"]),s={};for(const[i,r]of Object.entries(e))t.has(i)||(s[i]=r);return y({method:"POST",url:`${n}/goals/${e.id}/abandon`,body:s})},async achieve(e){const t=new Set(["id"]),s={};for(const[i,r]of Object.entries(e))t.has(i)||(s[i]=r);return y({method:"POST",url:`${n}/goals/${e.id}/achieve`,body:s})},async reopen(e){const t=new Set(["id"]),s={};for(const[i,r]of Object.entries(e))t.has(i)||(s[i]=r);return y({method:"POST",url:`${n}/goals/${e.id}/reopen`,body:s})},async share(e){const t=new Set(["id"]),s={};for(const[i,r]of Object.entries(e))t.has(i)||(s[i]=r);return y({method:"POST",url:`${n}/goals/${e.id}/shares`,body:s})},async unshare(e){return y({method:"DELETE",url:`${n}/goals/${e.id}/shares/${e.teacherId}`})},async attachPlan(e){const t=new Set(["id","planId"]),s={};for(const[i,r]of Object.entries(e))t.has(i)||(s[i]=r);return y({method:"POST",url:`${n}/goals/${e.id}/plans/${e.planId}`,body:s})},async detachPlan(e){return y({method:"DELETE",url:`${n}/goals/${e.id}/plans/${e.planId}`})},async listShares(e){const t=new Set(["id"]),s=new URLSearchParams;for(const[r,d]of Object.entries(e))!t.has(r)&&d!==void 0&&s.set(r,String(d));const i=s.toString();return y({method:"GET",url:`${n}/goals/${e.id}/shares${i?"?"+i:""}`})}}}function qi(n){return{async get(){return y({method:"GET",url:`${n}/dashboard`})}}}const Y="/teacher-student/".replace(/\/+$/,"")+"/api",v={register:Oi(Y),invitations:zi(Y),students:Pi(Y),exercises:Di(Y),horses:ji(Y),lessons:Vi(Y),notes:Fi(Y),trainingSessions:Ri(Y),teachers:Mi(Y),programs:Bi(Y),plans:Gi(Y),goals:Ki(Y),dashboard:qi(Y)};class Ct{items=new u([]);loading=new u(!1);error=new u(null);pendingCount=new f(()=>this.items.get().length);async load(){const e=await w(this.loading,this.error,()=>v.invitations.inbox());e&&this.items.set(e)}async accept(e){return await w(this.loading,this.error,()=>v.invitations.accept({invitationId:e}))?(this.items.set(this.items.get().filter(s=>s.id!==e)),!0):!1}async decline(e){return await w(this.loading,this.error,()=>v.invitations.decline({invitationId:e}))?(this.items.set(this.items.get().filter(s=>s.id!==e)),!0):!1}}const Ui=[{items:[{path:"/home",key:"nav.home"},{path:"/inbox",key:"nav.inbox",badge:"inbox"}]},{labelKey:"nav.group.training",items:[{path:"/lektioner",key:"nav.lessons"},{path:"/traningspass",key:"nav.trainingSessions"}]},{labelKey:"nav.group.planning",items:[{path:"/planer",key:"nav.plans"},{path:"/mal",key:"nav.goals"},{path:"/hastar",key:"nav.stable"}]},{labelKey:"nav.group.teaching",items:[{path:"/students",key:"nav.students"},{path:"/library",key:"nav.library"}]}],Wi=S(`
    <nav bind="nav" class="nav"></nav>
`),Yi=S(`
    <div class="nav__group">
        <span bind="label" class="nav__group-label"></span>
        <ul bind="links" class="nav__links"></ul>
    </div>
`),Xi=S(`
    <div class="nav__group">
        <ul bind="links" class="nav__links"></ul>
    </div>
`),Qi=S(`
    <li><a bind="link"></a></li>
`),Ji=S(`
    <li>
        <a bind="link">
            <span bind="label"></span>
            <span bind="badge" class="nav__badge"></span>
        </a>
    </li>
`);class on extends ${static styles=`
        .nav {
            display: flex;
            flex-direction: column;
            gap: ${l("xl")};
            padding: ${l("xl")} ${l("md")};
            background: ${o("surface")};
            /* Navigation is Open Sans territory — the serif is forbidden here. */
            font-family: ${o("font-ui")};

            & .nav__group-label {
                display: block;
                padding: 0 ${l("md")} ${l("sm")};
                font-size: 0.6875rem;
                line-height: 16px;
                font-weight: 700;
                letter-spacing: 0.14em;
                text-transform: uppercase;
                color: ${o("text-muted")};
            }

            & .nav__links {
                display: flex;
                flex-direction: column;
                gap: ${l("xs")};
                margin: 0;
                padding: 0;
                list-style: none;
            }

            & a {
                display: flex;
                align-items: center;
                gap: ${l("sm")};
                padding: ${l("sm")} ${l("md")};
                border-radius: ${o("radius-sm")};
                color: ${o("text")};
                text-decoration: none;
                font-size: 0.875rem;
                cursor: pointer;
                transition: background ${o("dur-fast")} ${o("ease-standard")},
                            color ${o("dur-fast")} ${o("ease-standard")};

                /* No accent on inactive links — spec 4.1 names that as a misuse. */
                &:hover { background: ${o("surface-2")}; }

                &:focus-visible {
                    outline: 2px solid ${o("accent")};
                    outline-offset: 2px;
                }

                /* Active = 2px brass rule + accent-tinted fill. The rule is an
                   inset shadow rather than a border so it costs no layout. */
                &.active {
                    background: ${o("accent-soft")};
                    color: ${o("accent-strong")};
                    font-weight: 600;
                    box-shadow: inset 2px 0 0 ${o("brass-line")};
                }
            }

            & .nav__badge {
                margin-left: auto;
                min-width: 1.25rem;
                padding: 0 ${l("xs")};
                border-radius: ${o("radius-pill")};
                background: ${o("accent")};
                color: ${o("on-accent")};
                font-size: 0.75rem;
                font-variant-numeric: tabular-nums;
                text-align: center;
            }
            & .nav__badge.hidden { display: none; }
        }
    `;router=this.inject(L);inbox=this.inject(Ct);render(){const e=this.wire(Wi,{nav:{"aria-label":()=>a("nav.label")}}),t=this.ref(e,"nav");for(const s of Ui)t.appendChild(this.renderGroup(s));return e}renderGroup(e){const{labelKey:t}=e,s=t?this.wireEl(Yi,{label:()=>a(t),links:{"aria-label":()=>a(t)}}):this.wireEl(Xi,{}),i=this.ref(s,"links");for(const r of e.items)i.appendChild(this.renderItem(r));return s}renderItem(e){return e.badge==="inbox"?this.wireEl(Ji,{link:{...this.navLink(e.path),href:e.path},label:()=>a(e.key),badge:{textContent:()=>String(this.inbox.pendingCount.get()),className:()=>this.inbox.pendingCount.get()>0?"nav__badge":"nav__badge hidden","aria-label":()=>V("nav.inboxPending",this.inbox.pendingCount.get())}}):this.wireEl(Qi,{link:{...this.navLink(e.path),href:e.path,textContent:()=>a(e.key)}})}navLink(e){const t=this.router.link(e);return{...t,onclick:s=>{t.onclick(s),this.props.onNavigate?.()}}}}const j=n=>`var(--${n})`;class B extends ${static styles=`
        .ui-empty-state {
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
            gap: ${j("space-3")};
            padding: ${j("space-7")} ${j("space-5")};
        }
        /* The brass ornament: a hairline rule, nothing more. No illustration. */
        .ui-empty-state__ornament {
            width: ${j("space-8")};
            height: 1px;
            background: ${j("brass-line")};
            margin-bottom: ${j("space-2")};
        }
        .ui-empty-state__heading {
            margin: 0;
            font-family: ${j("font-display")};
            font-weight: 500;
            font-size: 1.25rem;
            line-height: 1.4;
            color: ${j("text")};
        }
        .ui-empty-state__body {
            margin: 0;
            max-width: 48ch;
            font-family: ${j("font-ui")};
            font-size: 0.9375rem;
            line-height: 1.6;
            color: ${j("text-muted")};
        }
        .ui-empty-state__action {
            margin-top: ${j("space-2")};
            padding: ${j("space-2")} ${j("space-4")};
            border: 1px solid ${j("accent")};
            border-radius: ${j("radius-sm")};
            background: ${j("accent")};
            color: ${j("on-accent")};
            font-family: ${j("font-ui")};
            font-size: 0.875rem;
            font-weight: 600;
            line-height: 1.5;
            cursor: pointer;
            transition: background ${j("dur-fast")} ${j("ease-standard")},
                        border-color ${j("dur-fast")} ${j("ease-standard")};
        }
        .ui-empty-state__action:hover {
            background: ${j("accent-strong")};
            border-color: ${j("accent-strong")};
        }
        .ui-empty-state__action:focus-visible {
            outline: 2px solid ${j("accent")};
            outline-offset: 2px;
        }
    `;render(){const e=document.createElement("div");e.className="ui-empty-state";const t=d=>typeof d=="function"?d():d,s=(d,c)=>{typeof c=="function"?this.track(b(()=>{d.textContent=t(c)})):d.textContent=c};if(this.props.ornament!==!1){const d=document.createElement("div");d.className="ui-empty-state__ornament",d.setAttribute("aria-hidden","true"),e.appendChild(d)}const i=document.createElement(`h${this.props.headingLevel??3}`);if(i.className="ui-empty-state__heading",s(i,this.props.heading),e.appendChild(i),this.props.body!==void 0){const d=document.createElement("p");d.className="ui-empty-state__body",s(d,this.props.body),e.appendChild(d)}const r=this.props.action;if(r){const d=document.createElement("button");d.className="ui-empty-state__action",d.setAttribute("type","button"),r.ariaLabel&&d.setAttribute("aria-label",r.ariaLabel),s(d,r.label),d.addEventListener("click",()=>r.onclick()),e.appendChild(d)}return e}}class ie{data=new u(null);loading=new u(!1);error=new u(null);resolved=new u(!1);status=new u(void 0);started=!1;async run(e){this.started=!0,this.status.set(void 0);const t=await w(this.loading,this.error,()=>e().catch(s=>{throw s instanceof me&&this.status.set(s.status),s}));ge(()=>{this.error.peek()===null&&this.data.set(t),this.resolved.set(!0)})}async runOnce(e){this.started||await this.run(e)}reset(){this.started=!1}isEmpty(e){const t=this.data.get();return this.resolved.get()&&this.error.get()===null&&(t===null||e(t)===0)}}function Zi(n){const e=n==="owner";return{editDetails:e,manageSharing:e,managePlans:e,seeCoWatchers:e,notes:!0}}function ea(n,e){return{achieve:n==="active",reopen:n!=="active",abandon:e==="owner"&&n!=="abandoned"}}function rn(n){return n?.code==="conflict"}function Ue(n){switch(n){case"active":return{label:()=>a("goal.status.active"),variant:"outline",tone:"info"};case"achieved":return{label:()=>a("goal.status.achieved"),variant:"filled",tone:"success"};case"abandoned":return{label:()=>a("goal.status.abandoned"),variant:"dashed",tone:"neutral",glyph:"✕"}}}function ae(n){if(!n)return null;const e=/^(\d{4})-(\d{2})-(\d{2})$/.exec(n);if(!e)return null;const[t,s,i]=[Number(e[1]),Number(e[2]),Number(e[3])],r=new Date(t,s-1,i);return r.getFullYear()!==t||r.getMonth()!==s-1||r.getDate()!==i?null:r}function fe(n){const e=ae(n);return e?a("goal.target",{date:F(e,{year:"numeric",month:"long",day:"numeric"})}):null}function ta(n){if(!n)return null;const e=new Date(n);return Number.isNaN(e.getTime())?null:a("goal.achievedAt",{date:F(e,{year:"numeric",month:"long",day:"numeric"})})}function St(n,e){if(n.status!=="active")return!1;const t=ae(n.targetDate),s=ae(e);return!t||!s?!1:t.getTime()<s.getTime()}function na(n){return{active:n.filter(e=>e.status==="active"),achieved:n.filter(e=>e.status==="achieved"),abandoned:n.filter(e=>e.status==="abandoned")}}const sa=90;function ia(n,e=sa){const t=(n??"").replace(/\s+/g," ").trim();if(t.length===0)return null;if(t.length<=e)return t;const s=t.slice(0,e),i=s.lastIndexOf(" ");return`${(i>e*.6?s.slice(0,i):s).trimEnd()}…`}const aa=2;function oa(n,e){if(n.length===0)return null;const t=n.map(d=>e.find(c=>c.id===d)?.title).filter(d=>typeof d=="string"&&d.length>0);if(t.length===0)return V("goal.plans.unnamed",n.length);const s=t.slice(0,aa),i=n.length-s.length,r=i>0?`${s.join(", ")} ${a("goal.more",{count:i})}`:s.join(", ");return V("goal.plans.summary",n.length,{names:r})}function st(n){return[n.id,n.title,n.status,n.targetDate??"",n.description??"",[...n.planIds].sort().join(","),[...n.sharedTeacherIds].sort().join(",")].join("|")}function ra(n,e){return n.map(t=>({id:t,name:e.find(s=>s.id===t)?.displayName??""}))}function la(n){return n.seeded?n.next!==n.stored.includes(n.teacherId):!1}function da(n,e){const t=new Set(e);return n.filter(s=>s.status==="active"&&!t.has(s.id))}function Kn(n){return n.filter(e=>e.archivedAt===null)}function ca(n,e){const t=Kn(n).map(s=>({id:s.id,name:s.name}));return e.horseId&&!t.some(s=>s.id===e.horseId)&&t.push({id:e.horseId,name:e.horseName??e.horseId}),t}function ln(n){return n.seeded?n.next!==n.stored.includes(n.planId):!1}function ha(n,e){const t=n==="owner",s=e==="active";return{editDetails:t,attachGoals:t&&s,detachGoals:t,archive:t&&s}}function Et(n){return n==="archived"?{label:()=>a("plan.status.archived"),variant:"dashed",tone:"neutral"}:{label:()=>a("plan.status.active"),variant:"outline",tone:"info"}}function Te(n,e){const t=ae(n),s=ae(e),i={year:"numeric",month:"long",day:"numeric"};return t&&s?a("plan.range.both",{start:F(t,i),end:F(s,i)}):t?a("plan.range.from",{start:F(t,i)}):s?a("plan.range.until",{end:F(s,i)}):null}function qn(n,e){const t=ae(n),s=ae(e);return!t||!s?!0:t.getTime()<=s.getTime()}const pa=110;function Nt(n,e=pa){const t=(n??"").replace(/\s+/g," ").trim();if(t.length===0)return null;if(t.length<=e)return t;const s=t.slice(0,e),i=s.lastIndexOf(" ");return`${(i>e*.6?s.slice(0,i):s).trimEnd()}…`}function We(n){return n?a("plan.primaryTeacher",{name:n}):null}function ua(n){return{active:n.filter(e=>e.status==="active"),archived:n.filter(e=>e.status==="archived")}}function dn(n){return[n.id,n.title,n.status,n.startDate??"",n.endDate??"",n.description??"",n.primaryTeacherDisplayName??""].join("|")}function ga(n){return{day:F(n,{day:"numeric"}),month:wt(n),time:F(n,{hour:"2-digit",minute:"2-digit"})}}function cn(n){return[xt(F(n,{weekday:"long",day:"numeric",month:"long"})),F(n,{hour:"2-digit",minute:"2-digit"})].join(" · ")}function ma(n,e){const t=n.filter(i=>i.scheduledAt>=e).slice().sort((i,r)=>i.scheduledAt.localeCompare(r.scheduledAt)),s=n.filter(i=>i.scheduledAt<e).slice().sort((i,r)=>r.scheduledAt.localeCompare(i.scheduledAt));return{upcoming:t,past:s}}function fa(n){return n.slice().sort((e,t)=>t.performedAt.localeCompare(e.performedAt))}function ba(n){return[n.teacherDisplayName,a(`lesson.status.${n.status}`),n.horseName].filter(e=>typeof e=="string"&&e.length>0).join(" · ")}function _a(n){const e=[n.durationMin===null||!Number.isFinite(n.durationMin)?null:V("trainingSession.duration",n.durationMin),n.horseName,Nt(n.summary,70)].filter(t=>typeof t=="string"&&t.length>0);return e.length===0?null:e.join(" · ")}function va(n,e){const t=new Set(e);return n.filter(s=>s.status!=="abandoned"&&!t.has(s.id))}function ya(n,e){return n.filter(t=>t.planIds.includes(e)).map(t=>t.id)}function xa(n){return n==="owner"?"plan.goals.empty.owner":"plan.goals.empty.teacher"}function Tt(n){switch(n){case"planned":return{label:()=>a("lesson.status.planned"),variant:"outline",tone:"info"};case"completed":return{label:()=>a("lesson.status.completed"),variant:"filled",tone:"success"};case"cancelled":return{label:()=>a("lesson.status.cancelled"),variant:"dashed",tone:"neutral",glyph:"✕"}}}function wa(n){return n==="completed"||n==="cancelled"}function ka(n,e){const t=e==="teacher",s=!wa(n);return{transition:t&&s,editDetails:t,editExercises:t&&s,editPrograms:t&&s,notes:!0,lockNotice:t&&!s}}function $a(n){return a(n==="cancelled"?"lesson.locked.cancelled":"lesson.locked.completed")}function Ca(n){return n?.code==="conflict"}function Un(n,e){const t=[],s=[];for(const i of n)(i.scheduledAt>=e?t:s).push(i);return t.sort((i,r)=>i.scheduledAt.localeCompare(r.scheduledAt)),s.sort((i,r)=>r.scheduledAt.localeCompare(i.scheduledAt)),{upcoming:t,past:s}}function Wn(n){return{day:F(n,{day:"numeric"}),month:wt(n),time:F(n,{hour:"2-digit",minute:"2-digit"})}}function Ne(n){return[xt(F(n,{weekday:"long",day:"numeric",month:"long"})),F(n,{hour:"2-digit",minute:"2-digit"})].join(" · ")}function Sa(n){return n==="teacher"?"student":"teacher"}function $e(n){const[e,...t]=n.programs;return e&&t.length===0?e.title:e?V("lesson.title.programs",n.programs.length):n.exercises.length>0?V("lesson.title.exercises",n.exercises.length):a("lesson.title.plain")}function Yn(n){return n.programs.length===1?[]:n.programs}function Lt(n){return a("lesson.chip.program",{title:n.title})}function Be(n){return a("lesson.chip.plan",{title:n})}const Ea=3;function Xn(n){if(n.length===0)return a("lesson.exercises.none");const e=n.slice(0,Ea).map(i=>i.name),t=n.length-e.length,s=t>0?`${e.join(", ")} ${a("lesson.more",{count:t})}`:e.join(", ");return V("lesson.exerciseSummary",n.length,{names:s})}function Na(n){const e=n.notes;return typeof e=="string"&&e.trim().length>0?e.trim():null}function Ta(n){return n.slice().sort((e,t)=>e.sortOrder-t.sortOrder)}function La(n,e){if(!n.sourceProgramId)return null;const t=e.find(s=>s.id===n.sourceProgramId);return t?a("lesson.exercise.source",{title:t.title}):a("lesson.exercise.sourceGone")}function Qn(n){return n.filter(e=>e.archivedAt===null)}function Jn(n){return n.filter(e=>e.status==="active")}function hn(n){return[n.id,n.status,n.scheduledAt,n.horseName??"",n.planId??"",n.programs.map(e=>e.id).join(","),n.exercises.map(e=>e.id).join(",")].join("|")}function Ia(n,e,t){const s=encodeURIComponent(`/lektioner/${t}`);return`/students/${n}/exercises/${e}/history?from=${s}`}function Aa(n){const e=n==="owner";return{editDetails:e,editSharing:e,editPrograms:e,editExercises:e,remove:e,notes:!0}}function Ha(n){return n?.code==="conflict"}function Oa(n){return n.slice().sort((e,t)=>t.performedAt.localeCompare(e.performedAt))}function za(n){return n.slice().sort((e,t)=>e.sortOrder-t.sortOrder)}function Zn(n){return{day:F(n,{day:"numeric"}),month:wt(n),time:F(n,{hour:"2-digit",minute:"2-digit"})}}function Ge(n){return[xt(F(n,{weekday:"long",day:"numeric",month:"long"})),F(n,{hour:"2-digit",minute:"2-digit"})].join(" · ")}function It(n){return n===null||!Number.isFinite(n)?null:V("trainingSession.duration",n)}const Pa=90;function At(n,e=Pa){const t=(n??"").replace(/\s+/g," ").trim();if(t.length===0)return null;if(t.length<=e)return t;const s=t.slice(0,e),i=s.lastIndexOf(" ");return`${(i>e*.6?s.slice(0,i):s).trimEnd()}…`}const Da=3;function ja(n){if(n.length===0)return a("trainingSession.exercises.none");const e=n.slice(0,Da).map(i=>i.name),t=n.length-e.length,s=t>0?`${e.join(", ")} ${a("trainingSession.more",{count:t})}`:e.join(", ");return V("trainingSession.exerciseSummary",n.length,{names:s})}function Ce(n){const e=At(n.summary,60);if(e)return e;const[t,...s]=n.programs;return t&&s.length===0?t.title:t?V("trainingSession.title.programs",n.programs.length):n.exercises.length>0?V("trainingSession.title.exercises",n.exercises.length):a("trainingSession.title.plain")}function Va(n){return At(n.summary,60)?n.programs:n.programs.length===1?[]:n.programs}function es(n){return a("trainingSession.chip.program",{title:n.title})}function ts(n){return a("trainingSession.chip.plan",{title:n})}function Fa(n){const e=n.notes;return typeof e=="string"&&e.trim().length>0?e.trim():null}function Ra(n,e){if(!n.sourceProgramId)return null;const t=e.find(s=>s.id===n.sourceProgramId);return t?a("trainingSession.exercise.source",{title:t.title}):a("trainingSession.exercise.sourceGone")}function _t(n,e){return n.map(t=>({id:t,name:e.find(s=>s.id===t)?.displayName??""}))}function Ma(n,e,t){const s=n.filter(i=>i!==e);return[{id:e,name:t},...s.map(i=>({id:i,name:""}))]}function Ba(n){return!n.seeded||n.teacherCount<=1?!1:[...n.next].sort().join(",")!==[...n.stored].sort().join(",")}function ns(n){return n.filter(e=>e.archivedAt===null)}function ss(n){return n.filter(e=>e.status==="active")}function vt(n,e,t,s=new Set){const i=n.filter(h=>!s.has(h.id)),r=new Map;for(const h of i){const p=r.get(h.teacherId)??[];p.push(h),r.set(h.teacherId,p)}const d=[...e.filter(h=>r.has(h.id)).map(h=>h.id),...[...r.keys()].filter(h=>!e.some(p=>p.id===h))],c=[];for(const h of d){const p=r.get(h)??[];if(p.length===0)continue;const g=e.find(m=>m.id===h);c.push({value:`group:${h}`,label:g?g.displayName:a("trainingSession.catalog.unknownTeacher"),disabled:!0});for(const m of p)c.push({value:m.id,label:t(m)})}return c}function is(n,e,t,s){const i=new Set(t),r=new Set;for(const d of n){const c=e.find(h=>h.id===d.id)?.teacherId;c&&!i.has(c)&&r.add(c)}return s.filter(d=>r.has(d.id))}function Ga(n){return[n.id,n.performedAt,n.durationMin??"",n.summary??"",n.horseName??"",n.planId??"",n.sharedWithTeacherIds.join(","),n.programs.map(e=>e.id).join(","),n.exercises.map(e=>e.id).join(",")].join("|")}function as(n){return`/lektioner/${n}`}function Ka(n){return`/planer/${n}`}function os(n){return`/mal/${n}`}function qa(n){switch(n.targetKind){case"lesson":return as(n.targetId);case"training_session":return`/traningspass/${n.targetId}`;case"goal":return os(n.targetId)}}function Ua(n){return n.kind==="lesson"?`/lektioner/${n.id}`:`/traningspass/${n.id}`}const it="/lektioner";function Wa(n){const e=[{kind:"logSession",labelKey:"home.action.logSession",href:"/traningspass/ny"}];return n.teaches&&e.push({kind:"bookLesson",labelKey:"home.action.bookLesson",href:"/lektioner/ny"}),e}function Ya(n,e){if(e.failed||!e.resolved||!n)return"unknown";if(Xa(n))return"ready";if(n.pendingInvitations>0)return"invited";const{teaches:t,rides:s}=n.capabilities;return!t&&!s?"fresh":"ready"}function Xa(n){return n.nextLesson!==null||n.latestFeedback!==null||n.awaitingFeedback.length>0||n.activePlans.length>0||n.goalsNearingTarget.length>0}function Qa(n){const e=[{kind:"nextLesson",lesson:n.nextLesson},{kind:"latestFeedback",feedback:n.latestFeedback}];return(n.awaitingFeedback.length>0||n.capabilities.teaches)&&e.push({kind:"awaitingFeedback",items:n.awaitingFeedback}),(n.activePlans.length>0||n.goalsNearingTarget.length>0)&&e.push({kind:"riding",plans:n.activePlans,goals:n.goalsNearingTarget}),e}function _e(n){switch(n){case"nextLesson":return"home.nextLesson";case"latestFeedback":return"home.feedback";case"awaitingFeedback":return"home.awaiting";case"riding":return"home.riding"}}function Ja(n){return Ne(n.scheduledAt)}function Za(n){return[n.counterpartyDisplayName,n.horseName,n.planTitle].filter(e=>typeof e=="string"&&e.length>0).join(" · ")}function eo(n){const e=n.exerciseCount-n.exercisePreview.length;return e>0?V("home.nextLesson.exercises.more",e):null}function to(n){const e=n.exerciseName??"";switch(n.parentKind){case"lesson":return a("home.feedback.on.lesson",{name:n.targetLabel});case"lesson_exercise":return e?a("home.feedback.on.lessonExercise",{exercise:e,name:n.targetLabel}):a("home.feedback.on.lesson",{name:n.targetLabel});case"training_session":return a("home.feedback.on.trainingSession");case"training_session_exercise":return e?a("home.feedback.on.trainingSessionExercise",{exercise:e}):a("home.feedback.on.trainingSession");case"goal":return a("home.feedback.on.goal",{title:n.targetLabel})}}function no(n,e){return a("home.feedback.byline",{name:n.authorDisplayName,when:qe(n.createdAt,new Date(e))})}const so=110;function io(n){return Nt(n,so)}function ao(n){return n.kind==="lesson"?a("home.awaiting.lesson",{name:n.studentDisplayName}):a("home.awaiting.session",{name:n.studentDisplayName})}function oo(n){return n.kind==="lesson"?Ne(n.occurredAt):Ge(n.occurredAt)}function ro(n){return V("home.awaiting.count",n.length)}function lo(n){return V("home.plans.count",n.length)}function co(n){return fe(n.targetDate)}function ho(n,e){return St({status:"active",targetDate:n.targetDate},e)}function po(n,e){return ho(n,e)?a("home.goals.overdue"):null}function pn(n){return V("home.invitations",n)}const un="/inbox";function uo(){return[{key:"teach",titleKey:"home.start.teach.title",bodyKey:"home.start.teach.body",actionKey:"home.start.teach.action",href:"/students"},{key:"ride",titleKey:"home.start.ride.title",bodyKey:"home.start.ride.body",actionKey:"home.start.ride.action",href:"/hastar",secondary:{actionKey:"home.start.ride.goal",href:"/mal/nytt"}}]}function go(n,e){return a("home.updated",{when:qe(n,new Date(e))})}function mo(n){switch(n.kind){case"nextLesson":return`nextLesson:${n.lesson?fo(n.lesson):""}`;case"latestFeedback":return`latestFeedback:${n.feedback?bo(n.feedback):""}`;case"awaitingFeedback":return`awaitingFeedback:${n.items.map(_o).join("|")}`;case"riding":return["riding",n.plans.map(vo).join("|"),n.goals.map(yo).join("|")].join(":")}}function fo(n){return[n.id,n.scheduledAt,n.counterpartyDisplayName,n.horseName??"",n.planTitle??"",n.exercisePreview.join(","),String(n.exerciseCount)].join("|")}function bo(n){return[n.noteId,n.body??"",n.authorDisplayName,n.createdAt,n.targetLabel,n.parentKind,n.exerciseName??"",n.targetKind,n.targetId].join("|")}function _o(n){return[n.kind,n.id,n.occurredAt,n.studentDisplayName,n.horseName??""].join("|")}function vo(n){return[n.id,n.title,n.startDate??"",n.endDate??"",n.primaryTeacherDisplayName??""].join("|")}function yo(n){return[n.id,n.title,n.targetDate].join("|")}const xo=S(`
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
`);class rs extends ${static styles=`
        .home {
            font-family: ${o("font-ui")};

            & .home__head {
                display: flex;
                align-items: baseline;
                justify-content: space-between;
                gap: ${l("lg")};
                flex-wrap: wrap;
                margin-bottom: ${l("md")};
            }

            /* Lora 500, and only 500 — UI_DECISIONS §3. Any other weight
               synthesises bold, and the serif is permitted on h1/h2 only. */
            & .home__title {
                margin: 0;
                font-family: ${o("font-display")};
                font-weight: 500;
                font-size: 1.75rem;
                line-height: 36px;
                color: ${o("text")};
            }

            & .home__actions {
                display: flex;
                align-items: center;
                gap: ${l("sm")};
                flex-wrap: wrap;
            }

            /* Button labels are Open Sans 600, never the serif, in every tier
               (UI_DECISIONS §9). These are anchors because they navigate. */
            & .home__action {
                ${k(o("radius-sm"))}
                text-decoration: none;
                display: inline-flex;
                align-items: center;
            }
            & .home__action--primary { ${k(o("radius-sm"),"primary")} text-decoration: none; }
            & .home__action--ghost {
                ${k(o("radius-sm"),"ghost")}
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
                margin: 0 0 ${l("xl")};
                font-size: 0.875rem;
                line-height: 1.6;
                color: ${o("text-muted")};
                max-width: 68ch;
            }
            & .home__lede.hidden { display: none; }

            & .home__loading {
                margin: 0 0 ${l("lg")};
                font-size: 0.875rem;
                color: ${o("text-muted")};
            }
            & .home__loading.hidden { display: none; }

            & .home__error {
                display: flex;
                align-items: center;
                gap: ${l("md")};
                flex-wrap: wrap;
                padding: ${l("md")};
                margin-bottom: ${l("lg")};
                border: 1px solid ${o("danger")};
                border-radius: ${o("radius-md")};
                background: ${o("danger-soft")};

                & .home__error-text { margin: 0; font-size: 0.875rem; color: ${o("text")}; }
                & .home__retry { ${k()} }
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
                gap: ${l("md")};
                flex-wrap: wrap;
                padding: ${l("sm")} ${l("md")};
                margin-bottom: ${l("lg")};
                border: 1px solid ${o("border")};
                border-radius: ${o("radius-md")};
                background: ${o("surface")};

                & .home__invite-text {
                    margin: 0;
                    font-size: 0.875rem;
                    color: ${o("text")};
                }
            }
            & .home__invite.hidden { display: none; }

            /* ── The fresh state's two equal paths ─────────────── */

            & .home__start-title {
                margin: 0 0 ${l("md")};
                font-family: ${o("font-display")};
                font-weight: 500;
                font-size: 1.25rem;
                line-height: 28px;
                color: ${o("text")};
            }

            & .home__start {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(15rem, 1fr));
                gap: ${l("md")};
            }

            & .home__panel {
                display: flex;
                flex-direction: column;
                align-items: flex-start;
                gap: ${l("sm")};
                padding: ${l("lg")};
                border: 1px solid ${o("border")};
                border-radius: ${o("radius-md")};
                background: ${o("surface")};
            }
            /* Panel titles are h3 and therefore Open Sans — the serif stops at
               h2 (UI_DECISIONS §3). */
            & .home__panel-title {
                margin: 0;
                font-size: 1rem;
                font-weight: 600;
                color: ${o("text")};
            }
            & .home__panel-body {
                margin: 0;
                font-size: 0.875rem;
                line-height: 1.6;
                color: ${o("text-muted")};
            }

            /* ── The ready state's card grid — design system §4.2 ─ */

            & .home__cards {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(15rem, 1fr));
                gap: ${l("md")};
                align-items: start;
            }
            & .home__cards:empty { display: none; }

            & .home__card {
                display: flex;
                flex-direction: column;
                gap: ${l("xs")};
                padding: ${l("lg")};
                border: 1px solid ${o("border")};
                border-radius: ${o("radius-md")};
                background: ${o("surface")};
                /* card() carries this and every other card surface in the app
                   has it; without it home's grid renders flat beside them. */
                box-shadow: ${o("shadow-1")};
                text-decoration: none;
                color: inherit;
            }
            & a.home__card:hover { border-color: ${o("border-strong")}; }
            & a.home__card:focus-visible { outline: 2px solid ${o("accent")}; outline-offset: 2px; }

            & .home__card-label {
                font-size: 0.6875rem;
                line-height: 16px;
                font-weight: 700;
                letter-spacing: 0.14em;
                text-transform: uppercase;
                color: ${o("text-muted")};
            }
            & .home__card-value {
                font-size: 1rem;
                font-weight: 600;
                color: ${o("text")};
                overflow-wrap: anywhere;
            }
            & .home__card-meta {
                font-size: 0.8125rem;
                color: ${o("text-muted")};
                overflow-wrap: anywhere;
            }
            & .home__card-sublabel {
                margin-top: ${l("sm")};
                font-size: 0.6875rem;
                line-height: 16px;
                font-weight: 700;
                letter-spacing: 0.14em;
                text-transform: uppercase;
                color: ${o("text-muted")};
            }

            & .home__rows {
                list-style: none;
                margin: ${l("xs")} 0 0;
                padding: 0;
                border-top: 1px solid ${o("border")};
            }
            & .home__rows > li { border-bottom: 1px solid ${o("border")}; }

            & .home__row {
                display: flex;
                flex-direction: column;
                gap: 2px;
                padding: ${l("sm")} 0;
                text-decoration: none;
                color: inherit;
                &:hover .home__row-title { color: ${o("accent-strong")}; }
                &:focus-visible { outline: 2px solid ${o("accent")}; outline-offset: 2px; }
            }
            & .home__row-title {
                font-size: 0.875rem;
                font-weight: 600;
                color: ${o("text")};
                overflow-wrap: anywhere;
            }
            & .home__row-meta {
                display: flex;
                align-items: baseline;
                flex-wrap: wrap;
                gap: ${l("xs")} ${l("sm")};
                font-size: 0.8125rem;
                color: ${o("text-muted")};
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
            & .home__overdue { color: ${o("warning")}; font-weight: 600; }

            & .home__updated {
                margin: ${l("xl")} 0 0;
                font-size: 0.8125rem;
                color: ${o("text-muted")};
            }
            & .home__updated.hidden { display: none; }
        }
    `;router=this.inject(L);view=new ie;mountedAt=new Date;nowIso=new u(this.mountedAt.toISOString());todayIso=new u(Ke(this.mountedAt));state=new f(()=>Ya(this.view.data.get(),{resolved:this.view.resolved.get(),failed:this.view.error.get()!==null}));blocks=new f(()=>{const e=this.view.data.get();return e&&this.state.get()==="ready"?Qa(e):[]});onMount(){this.load()}load(){return this.view.runOnce(()=>v.dashboard.get())}reload(){return this.view.reset(),this.view.run(()=>v.dashboard.get())}render(){const e=this.wire(xo,{heading:{textContent:()=>a("home.title")},lede:{textContent:()=>{const t=this.state.get();return t==="ready"?a("home.lede"):t==="invited"?pn(this.view.data.get()?.pendingInvitations??0):""},className:()=>{const t=this.state.get();return t==="ready"||t==="invited"?"home__lede":"home__lede hidden"}},loading:{textContent:()=>a("home.loading"),className:()=>this.view.loading.get()&&this.view.data.get()===null?"home__loading":"home__loading hidden"},errorBox:{className:()=>this.view.error.get()?"home__error":"home__error hidden"},errorText:{textContent:()=>a("home.error")},retry:{textContent:()=>a("home.retry"),onclick:()=>{this.reload()}},inviteBanner:{className:()=>this.showInvite()?"home__invite":"home__invite hidden"},inviteText:{textContent:()=>pn(this.view.data.get()?.pendingInvitations??0)},inviteLink:{textContent:()=>a("home.invitations.cta")},updated:{textContent:()=>{const t=this.view.data.get();return t?go(t.generatedAt,this.nowIso.get()):""},className:()=>this.state.get()==="ready"?"home__updated":"home__updated hidden"}});return this.wireHref(this.ref(e,"inviteLink"),un),this.buildActions(this.ref(e,"actions")),this.buildInvited(this.ref(e,"invitedHost")),this.buildFresh(this.ref(e,"freshHost")),this.$each(this.ref(e,"cards"),this.blocks,(t,s,i)=>this.renderBlock(t,i),mo),e}showInvite(){return this.state.get()==="ready"&&(this.view.data.get()?.pendingInvitations??0)>0}buildActions(e){this.track(b(()=>{const t=this.view.data.get();if(!t||this.state.get()!=="ready"){e.replaceChildren();return}e.replaceChildren(...Wa(t.capabilities).map((s,i)=>this.actionLink(s.href,a(s.labelKey),i===0?"home__action home__action--primary":"home__action")))}))}buildInvited(e){const t=new B({heading:()=>a("home.welcome.title"),body:()=>a("home.welcome.body"),action:{label:()=>a("home.invitations.cta"),onclick:()=>this.router.navigate(un)},headingLevel:2});t.mount(e),this.track(()=>t.destroy()),this.track(b(()=>{e.className=this.state.get()==="invited"?"home__state":"home__state hidden"}))}buildFresh(e){const t=document.createElement("h2");t.className="home__start-title";const s=document.createElement("div");s.className="home__start";const i=[];for(const r of uo()){const d=document.createElement("section");d.className="home__panel";const c=document.createElement("h3");c.className="home__panel-title";const h=document.createElement("p");h.className="home__panel-body";const p=this.actionLink(r.href,"","home__action");d.append(c,h,p);const g=r.secondary?this.actionLink(r.secondary.href,"","home__action home__action--ghost"):null;g&&d.appendChild(g);const m=r;i.push(()=>{c.textContent=a(m.titleKey),h.textContent=a(m.bodyKey),p.textContent=a(m.actionKey),g&&m.secondary&&(g.textContent=a(m.secondary.actionKey))}),s.appendChild(d)}e.append(t,s),this.track(b(()=>{t.textContent=a("home.start.title");for(const r of i)r()})),this.track(b(()=>{e.className=this.state.get()==="fresh"?"home__state":"home__state hidden"}))}renderBlock(e,t){switch(e.kind){case"nextLesson":return this.renderNextLesson(e.lesson,t);case"latestFeedback":return this.renderFeedback(e.feedback,t);case"awaitingFeedback":return this.renderAwaiting(e.items,t);case"riding":return this.renderRiding(e.plans,e.goals,t)}}renderNextLesson(e,t){if(!e)return this.emptyCard(t,"nextLesson","home.nextLesson.none","home.nextLesson.empty.action",it);const s=this.cardEl(as(e.id)),i=M("home__card-label"),r=M("home__card-value"),d=M("home__card-meta"),c=M("home__card-meta");return s.append(i,r,d,c),t(b(()=>{i.textContent=a(_e("nextLesson")),r.textContent=Ja(e),d.textContent=Za(e);const h=eo(e);c.textContent=e.exerciseCount===0?a("home.nextLesson.noExercises"):[e.exercisePreview.join(" · "),h].filter(Boolean).join(" · ")})),s}renderFeedback(e,t){if(!e)return this.emptyCard(t,"latestFeedback","home.feedback.none","home.feedback.empty.action",it);const s=this.cardEl(qa(e)),i=M("home__card-label"),r=M("home__card-value"),d=M("home__card-meta"),c=M("home__card-meta");return s.append(i,r,d,c),t(b(()=>{i.textContent=a(_e("latestFeedback")),r.textContent=io(e.body)??e.targetLabel,d.textContent=to(e),c.textContent=no(e,this.nowIso.get())})),s}renderAwaiting(e,t){const s=this.cardEl(null),i=M("home__card-label"),r=M("home__card-value");s.append(i,r);const d=document.createElement("ul");d.className="home__rows";for(const h of e)d.appendChild(this.row(Ua(h),t,()=>ao(h),()=>[oo(h),h.horseName]));e.length>0&&s.appendChild(d);const c=this.actionLink(it,"","home__action home__action--ghost");return s.appendChild(c),t(b(()=>{i.textContent=a(_e("awaitingFeedback")),r.textContent=e.length>0?ro(e):a("home.awaiting.none"),c.textContent=a("home.awaiting.all")})),s}renderRiding(e,t,s){const i=this.cardEl(null),r=M("home__card-label"),d=M("home__card-value");if(i.append(r,d),e.length>0){const p=document.createElement("ul");p.className="home__rows";for(const g of e)p.appendChild(this.row(Ka(g.id),s,()=>g.title,()=>[Te(g.startDate,g.endDate),We(g.primaryTeacherDisplayName)]));i.appendChild(p)}const c=M("home__card-sublabel"),h=M("home__card-meta");if(i.append(c),t.length>0){const p=document.createElement("ul");p.className="home__rows";for(const g of t)p.appendChild(this.row(os(g.id),s,()=>g.title,()=>[co(g)],()=>po(g,this.todayIso.get())));i.appendChild(p)}else i.appendChild(h);return s(b(()=>{r.textContent=a(_e("riding")),d.textContent=e.length>0?lo(e):a("home.plans.none"),c.textContent=a("home.goals.nearing"),h.textContent=a("home.goals.none")})),i}emptyCard(e,t,s,i,r){const d=this.cardEl(null),c=M("home__card-label"),h=M("home__card-value"),p=this.actionLink(r,"","home__action home__action--ghost");return d.append(c,h,p),e(b(()=>{c.textContent=a(_e(t)),h.textContent=a(s),p.textContent=a(i)})),d}cardEl(e){const t=document.createElement(e?"a":"div");return t.className="home__card",e&&this.wireHref(t,e),t}row(e,t,s,i,r){const d=document.createElement("li"),c=document.createElement("a");c.className="home__row",this.wireHref(c,e);const h=M("home__row-title"),p=M("home__row-meta");return c.append(h,p),d.appendChild(c),t(b(()=>{h.textContent=s(),p.replaceChildren();for(const m of i())m&&p.appendChild(wo(m));const g=r?.();if(g){const m=M("home__overdue");m.textContent=g,p.appendChild(m)}})),d}actionLink(e,t,s){const i=document.createElement("a");return i.className=s,i.textContent=t,this.wireHref(i,e),i}wireHref(e,t){e.href=t,e.addEventListener("click",s=>{s.preventDefault(),this.router.navigate(t)})}}function M(n){const e=document.createElement("span");return e.className=n,e}function wo(n){const e=document.createElement("span");return e.textContent=n,e}const ko=["/login","/register"],$o=["/home","/inbox","/lektioner","/traningspass","/planer","/mal","/hastar","/students","/library","/program","/invitations"],Ht="/home",ls="/login";function ds(n,e){return n===e||n.startsWith(e+"/")}function yt(n){return ko.some(e=>ds(Ot(n),e))}function Ot(n){return n===""?"/":n}function cs(n,e){const t=Ot(n);return e?t==="/"||yt(t)?Ht:null:yt(t)?null:ls}function Co(n,e){return cs(n,e)??Ot(n)}const hs="returnTo";function So(n){try{return new URL(n,"https://fixed-point.invalid").pathname===n}catch{return!1}}function ps(n){return typeof n!="string"||n===""||/[?#\\]/.test(n)||/[\u0000-\u0020\u007f]/.test(n)||!n.startsWith("/")||n.startsWith("//")||n.slice(1).split("/").some(e=>e===""||e==="."||e==="..")||!So(n)||yt(n)?null:$o.some(e=>ds(n,e))?n:null}function zt(n,e){const t=ps(e);return t===null?n:`${n}?${hs}=${encodeURIComponent(t)}`}function us(n){return ps(new URLSearchParams(n).get(hs))}const gs=`
    .auth {
        width: 100%;
        max-width: 26rem;
        margin: 0 auto;
        display: flex;
        flex-direction: column;
        gap: ${l("xl")};

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
            font-family: ${o("font-display")};
            font-weight: 500;
            font-size: 22px;
            line-height: 30px;
            letter-spacing: 0.18em;
            text-indent: 0.18em;
            text-transform: uppercase;
            color: ${o("text")};
        }

        & .auth__rule {
            width: 56px;
            height: 1px;
            border: 0;
            margin: ${l("lg")} auto 0;
            background: ${o("brass-line")};
        }

        & .auth__card {
            ${q()}
            box-sizing: border-box;
            padding: ${l("2xl")} ${l("xl")};
        }

        & .auth__title {
            margin: 0;
            font-family: ${o("font-display")};
            font-weight: 500;
            font-size: 1.75rem;
            line-height: 36px;
            color: ${o("text")};
        }

        & .auth__lede {
            margin: ${l("sm")} 0 0;
            font-family: ${o("font-ui")};
            font-size: 14px;
            line-height: 22px;
            color: ${o("text-muted")};
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
            margin: ${l("lg")} 0 0;
            padding: ${l("md")};
            border: 1px solid ${o("danger")};
            border-radius: ${o("radius-sm")};
            background: ${o("danger-soft")};
            font-family: ${o("font-ui")};
            font-size: 14px;
            line-height: 22px;
            color: ${o("text")};
        }
        & .auth__alert.is-shown { display: block; }

        & .auth__form {
            display: flex;
            flex-direction: column;
            gap: ${l("lg")};
            margin-top: ${l("xl")};
        }

        & .auth__field {
            display: flex;
            flex-direction: column;
            gap: ${l("xs")};
        }

        & .auth__label { ${Bn()} }

        & .auth__input {
            ${R()}
            box-sizing: border-box;
            width: 100%;
            /* 44px of hit target, and 16px so iOS Safari does not zoom on focus. */
            min-height: 44px;
            padding: ${l("sm")} ${l("md")};
            font-size: 16px;
            line-height: 24px;
        }
        /* Invalid state is not carried by colour alone — the field also gets a
           named error message below it, tied to it by aria-describedby. */
        & .auth__input[aria-invalid='true'] {
            border-color: ${o("danger")};
        }

        & .auth__hint {
            margin: 0;
            font-family: ${o("font-ui")};
            font-size: 13px;
            line-height: 20px;
            color: ${o("text-muted")};
        }

        & .auth__error {
            ${Ii()}
            display: none;
        }
        & .auth__error.is-shown { display: block; }
        /* Once a field states its problem, its hint is redundant noise. */
        & .auth__field.is-invalid .auth__hint { display: none; }

        /* §4.8: at most one primary button per form. This is it. */
        & .auth__submit {
            ${k(o("radius-sm"),"primary")}
            width: 100%;
            min-height: 44px;
            padding: ${l("sm")} ${l("lg")};
            font-size: 15px;
            line-height: 24px;
            margin-top: ${l("xs")};
        }

        & .auth__alt {
            margin: 0;
            text-align: center;
            font-family: ${o("font-ui")};
            font-size: 14px;
            line-height: 22px;
            color: ${o("text-muted")};
        }

        & .auth__alt-link {
            color: ${o("accent")};
            font-weight: 600;
            text-decoration: none;
            border-radius: ${o("radius-sm")};
        }
        & .auth__alt-link:hover {
            text-decoration: underline;
            text-underline-offset: 2px;
        }
        & .auth__alt-link:focus-visible {
            outline: 2px solid ${o("accent")};
            outline-offset: 2px;
        }

        /* Phone: the card gives up its side padding and the gaps tighten, so the
           fields keep their width instead of the chrome keeping its margins. */
        @media (max-width: 479px) {
            gap: ${l("lg")};

            & .auth__card {
                padding: ${l("xl")} ${l("lg")};
            }
        }
    }
`,Eo=/^[^\s@]+@[^\s@]+\.[^\s@]+$/,ms=8;function fs(n){if(n.trim()==="")return"auth.error.emailRequired";if(!Eo.test(n.trim()))return"auth.error.emailInvalid"}function gn(n){const e={},t=fs(n.email);return t&&(e.email=t),n.password===""&&(e.password="auth.error.passwordRequired"),e}function No(n){const e={},t=fs(n.email);return t&&(e.email=t),n.displayName.trim()===""&&(e.displayName="auth.error.displayNameRequired"),n.password===""?e.password="auth.error.passwordRequired":n.password.length<ms&&(e.password="auth.error.passwordTooShort"),e}function bs(n){return Object.keys(n).length===0}function To(n){switch(n.code){case"auth":case"validation":return"auth.error.credentials";case"rateLimit":return"auth.error.rateLimit";case"network":case"timeout":return"auth.error.network";default:return"auth.error.server"}}function Lo(n){switch(n.code){case"conflict":return"auth.error.emailTaken";case"validation":return"auth.error.validation";case"network":case"timeout":return"auth.error.network";default:return"auth.error.server"}}function Se(n){return n===void 0?"":a(n)}const Io=S(`
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
`);class Ao extends ${static styles=gs;auth=this.inject(ne);router=this.inject(L);constructor(){super(),this.auth.error.set(null)}returnTo=us(this.router.search.peek());email="";password="";fieldErrors=new u({});submitted=!1;inputs={};render(){const e=this.wire(Io,{root:{inert:()=>this.auth.loading.get()},wordmark:{textContent:()=>a("app.brand")},title:{textContent:()=>a("auth.login.title")},lede:{textContent:()=>a("auth.login.lede")},alert:{className:()=>this.auth.error.get()?"auth__alert is-shown":"auth__alert",textContent:()=>{const t=this.auth.error.get();return t?a(To(t)):""}},form:{onsubmit:t=>{this.onSubmit(t)}},emailLabel:{textContent:()=>a("auth.field.email")},emailField:{className:()=>this.fieldClass("email")},email:{"aria-invalid":()=>String(this.fieldErrors.get().email!==void 0),oninput:t=>{this.email=t.target.value,this.revalidate()}},emailError:{className:()=>this.errorClass("email"),textContent:()=>Se(this.fieldErrors.get().email)},passwordLabel:{textContent:()=>a("auth.field.password")},passwordField:{className:()=>this.fieldClass("password")},password:{"aria-invalid":()=>String(this.fieldErrors.get().password!==void 0),oninput:t=>{this.password=t.target.value,this.revalidate()}},passwordError:{className:()=>this.errorClass("password"),textContent:()=>Se(this.fieldErrors.get().password)},submit:{textContent:()=>this.auth.loading.get()?a("auth.login.submitting"):a("auth.login.submit")},altPrompt:{textContent:()=>`${a("auth.login.altPrompt")} `},registerLink:{textContent:()=>a("auth.login.altLink"),onclick:t=>{t.preventDefault(),this.router.navigate(zt("/register",this.returnTo??""),!0)}}});return this.inputs={email:this.ref(e,"email"),password:this.ref(e,"password")},e}fieldClass(e){return this.fieldErrors.get()[e]?"auth__field is-invalid":"auth__field"}errorClass(e){return this.fieldErrors.get()[e]?"auth__error is-shown":"auth__error"}revalidate(){this.submitted&&this.fieldErrors.set(gn({email:this.email,password:this.password}))}async onSubmit(e){e.preventDefault(),this.submitted=!0;const t=gn({email:this.email,password:this.password});if(this.fieldErrors.set(t),!bs(t)){const i=t.email?"email":"password";this.inputs[i]?.focus();return}await this.auth.login(this.email.trim(),this.password)&&this.router.navigate(this.returnTo??Ht,!0)}}class Ho{auth=he.get(ne);loading=new u(!1);error=new u(null);async register(e){return await w(this.loading,this.error,()=>v.register.register(e))?(await this.auth.load(),this.auth.currentUser.get()!==null):!1}}const Oo=S(`
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
`);class zo extends ${static styles=gs;svc=this.inject(Ho);router=this.inject(L);constructor(){super(),this.svc.error.set(null)}returnTo=us(this.router.search.peek());email="";displayName="";password="";fieldErrors=new u({});submitted=!1;inputs={};render(){const e=this.wire(Oo,{root:{inert:()=>this.svc.loading.get()},wordmark:{textContent:()=>a("app.brand")},title:{textContent:()=>a("auth.register.title")},lede:{textContent:()=>a("auth.register.lede")},alert:{className:()=>this.svc.error.get()?"auth__alert is-shown":"auth__alert",textContent:()=>{const t=this.svc.error.get();return t?a(Lo(t)):""}},form:{onsubmit:t=>{this.onSubmit(t)}},emailLabel:{textContent:()=>a("auth.field.email")},emailHint:{textContent:()=>a("auth.hint.email")},emailField:{className:()=>this.fieldClass("email")},email:{"aria-invalid":()=>String(this.fieldErrors.get().email!==void 0),oninput:t=>{this.email=t.target.value,this.revalidate()}},emailError:{className:()=>this.errorClass("email"),textContent:()=>Se(this.fieldErrors.get().email)},displayNameLabel:{textContent:()=>a("auth.field.displayName")},displayNameHint:{textContent:()=>a("auth.hint.displayName")},displayNameField:{className:()=>this.fieldClass("displayName")},displayName:{"aria-invalid":()=>String(this.fieldErrors.get().displayName!==void 0),oninput:t=>{this.displayName=t.target.value,this.revalidate()}},displayNameError:{className:()=>this.errorClass("displayName"),textContent:()=>Se(this.fieldErrors.get().displayName)},passwordLabel:{textContent:()=>a("auth.field.password")},passwordHint:{textContent:()=>a("auth.hint.password")},passwordField:{className:()=>this.fieldClass("password")},password:{minlength:ms,"aria-invalid":()=>String(this.fieldErrors.get().password!==void 0),oninput:t=>{this.password=t.target.value,this.revalidate()}},passwordError:{className:()=>this.errorClass("password"),textContent:()=>Se(this.fieldErrors.get().password)},submit:{textContent:()=>this.svc.loading.get()?a("auth.register.submitting"):a("auth.register.submit")},altPrompt:{textContent:()=>`${a("auth.register.altPrompt")} `},loginLink:{textContent:()=>a("auth.register.altLink"),onclick:t=>{t.preventDefault(),this.router.navigate(zt("/login",this.returnTo??""),!0)}}});return this.inputs={email:this.ref(e,"email"),displayName:this.ref(e,"displayName"),password:this.ref(e,"password")},e}fieldClass(e){return this.fieldErrors.get()[e]?"auth__field is-invalid":"auth__field"}errorClass(e){return this.fieldErrors.get()[e]?"auth__error is-shown":"auth__error"}revalidate(){this.submitted&&this.fieldErrors.set(this.validate())}validate(){return No({email:this.email,displayName:this.displayName,password:this.password})}async onSubmit(e){e.preventDefault(),this.submitted=!0;const t=this.validate();if(this.fieldErrors.set(t),!bs(t)){const i=["email","displayName","password"];this.inputs[i.find(r=>t[r])]?.focus();return}await this.svc.register({email:this.email.trim(),password:this.password,displayName:this.displayName.trim()})&&this.router.navigate(this.returnTo??Ht,!0)}}class _s{items=new u([]);loading=new u(!1);error=new u(null);resolved=new u(!1);async load(){const e=await w(this.loading,this.error,()=>v.invitations.list());e&&this.items.set(e),this.resolved.set(!0)}async create(e){const t=await w(this.loading,this.error,()=>v.invitations.create({inviteeEmail:e}));return t?(this.items.set([t,...this.items.get()]),!0):!1}async revoke(e){const t=await w(this.loading,this.error,()=>v.invitations.revoke({invitationId:e}));t&&t.changed&&this.items.set(this.items.get().map(s=>s.id===e?{...s,status:"revoked"}:s))}}const Po=S(`
    <div class="invitations" bind="root">
        <h1 bind="heading"></h1>

        <form bind="form" class="invitations__form">
            <input bind="email" type="email" autocomplete="email" />
            <button type="submit" bind="submit"></button>
        </form>

        <div class="error" bind="error"></div>

        <ul bind="list" class="invitations__list"></ul>
    </div>
`),Do=S(`
    <li class="invitations__item">
        <span bind="email" class="invitations__email"></span>
        <span bind="status"></span>
    </li>
`),jo=S(`
    <button bind="revoke" type="button" class="invitations__revoke"></button>
`);class Vo extends ${static styles=`
        .invitations {
            max-width: 640px;

            /* h1, not h2: this is the only heading on a top-level destination,
               so the document would otherwise start at level 2 — and below
               640px, where the top bar drops its page title, this heading is
               the ONLY thing naming the page. 1.5rem keeps the rendering
               identical to the h2 it replaced (the UA default for h2 is
               1.5em of the root); only the semantics changed. */
            & h1 {
                margin: 0 0 ${l("lg")};
                font-size: 1.5rem;
            }

            & .invitations__form {
                display: flex;
                gap: ${l("sm")};
                margin-bottom: ${l("lg")};

                & input {
                    flex: 1;
                    padding: ${l("sm")} ${l("md")};
                    font-size: 0.875rem;
                    ${R()}
                }

                & button {
                    padding: ${l("sm")} ${l("lg")};
                    font-size: 0.875rem;
                    ${k()}
                }
            }

            & .error {
                display: none;
                padding: ${l("sm")} ${l("md")};
                margin-bottom: ${l("md")};
                color: ${o("danger")};
                font-size: 0.875rem;
            }
            & .error.show { display: block; }

            & .invitations__list {
                list-style: none;
                margin: 0;
                padding: 0;
                display: flex;
                flex-direction: column;
                gap: ${l("xs")};
            }

            & .invitations__item {
                display: flex;
                align-items: center;
                gap: ${l("md")};
                padding: ${l("sm")} ${l("md")};
                background: ${o("surface")};
                border-radius: ${o("radius-md")};
            }

            & .invitations__email { flex: 1; font-size: 0.875rem; }

            & .invitations__status {
                font-size: 0.75rem;
                padding: 2px ${l("sm")};
                border-radius: ${o("radius-md")};
                background: ${o("surface-2")};
                color: ${o("text")};
                /* No text-transform: the status used to be the raw enum
                   ('pending'), which uppercasing made presentable. It is now
                   authored copy — "Väntar på svar" — and shouting a whole
                   phrase is not what §4.4 asks a status chip to do. */
            }

            & .invitations__revoke {
                font-size: 0.75rem;
                padding: ${l("xs")} ${l("sm")};
                ${k()}
            }
        }
    `;svc=this.inject(_s);email="";emailInput=null;onMount(){this.svc.load()}render(){const e=this.wire(Po,{root:{inert:()=>this.svc.loading.get()},heading:{textContent:()=>a("invitations.page.heading")},error:{className:()=>this.svc.error.get()?"error show":"error",textContent:()=>{const s=this.svc.error.get();return s?s.code==="conflict"?a("invitations.page.error.conflict"):s.message:""}},form:{onsubmit:async s=>{s.preventDefault(),await this.svc.create(this.email)&&this.emailInput&&(this.email="",this.emailInput.value="")}},email:{placeholder:()=>a("invitations.page.email"),oninput:s=>{this.email=s.target.value}},submit:{textContent:()=>this.svc.loading.get()?a("invitations.page.submitting"):a("invitations.page.submit")}});this.emailInput=this.ref(e,"email");const t=this.ref(e,"list");return this.$each(t,this.svc.items,(s,i,r)=>this.renderItem(s,r),s=>s.id),e}renderItem(e,t){const s=this.wireEl(Do,{email:{textContent:()=>e.inviteeEmail},status:{textContent:()=>a(`invitations.status.${e.status}`),className:()=>`invitations__status invitations__status--${e.status}`}},t);return e.status==="pending"&&s.appendChild(this.wireEl(jo,{revoke:{textContent:()=>a("invitations.revoke"),onclick:()=>{this.svc.revoke(e.id)}}},t)),s}}const Fo=S(`
    <div class="inbox" bind="root">
        <h1 bind="heading"></h1>
        <div class="error" bind="error"></div>
        <div bind="empty" class="inbox__empty"></div>
        <ul bind="list" class="inbox__list"></ul>
    </div>
`),Ro=S(`
    <li class="inbox__item">
        <span bind="from" class="inbox__from"></span>
        <button bind="accept" type="button" class="inbox__accept"></button>
        <button bind="decline" type="button" class="inbox__decline"></button>
    </li>
`);class Mo extends ${static styles=`
        .inbox {
            max-width: 640px;

            /* h1, not h2: this is the only heading on a top-level destination,
               so the document would otherwise start at level 2 — and below
               640px, where the top bar drops its page title, this heading is
               the ONLY thing naming the page. 1.5rem keeps the rendering
               identical to the h2 it replaced (the UA default for h2 is
               1.5em of the root); only the semantics changed. */
            & h1 {
                margin: 0 0 ${l("lg")};
                font-size: 1.5rem;
            }

            & .error {
                display: none;
                padding: ${l("sm")} ${l("md")};
                margin-bottom: ${l("md")};
                color: ${o("danger")};
                font-size: 0.875rem;
            }
            & .error.show { display: block; }

            & .inbox__empty {
                padding: ${l("lg")};
                color: ${o("text")};
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
                gap: ${l("xs")};
            }

            & .inbox__item {
                display: flex;
                align-items: center;
                gap: ${l("md")};
                padding: ${l("sm")} ${l("md")};
                background: ${o("surface")};
                border-radius: ${o("radius-md")};
            }

            & .inbox__from { flex: 1; font-size: 0.875rem; }

            & .inbox__accept,
            & .inbox__decline {
                font-size: 0.75rem;
                padding: ${l("xs")} ${l("sm")};
                ${k()}
            }
        }
    `;svc=this.inject(Ct);onMount(){this.svc.load()}render(){const e=this.wire(Fo,{root:{inert:()=>this.svc.loading.get()},heading:{textContent:()=>a("inbox.heading")},error:{className:()=>this.svc.error.get()?"error show":"error",textContent:()=>{const s=this.svc.error.get();return s?s.code==="conflict"?a("inbox.error.conflict"):s.message:""}},empty:{textContent:()=>a("inbox.empty"),className:()=>this.svc.items.get().length===0?"inbox__empty":"inbox__empty hidden"}}),t=this.ref(e,"list");return this.$each(t,this.svc.items,(s,i,r)=>this.renderItem(s,r),s=>s.id),e}renderItem(e,t){return this.wireEl(Ro,{from:{textContent:()=>a("inbox.from",{name:e.teacherDisplayName,email:e.teacherEmail})},accept:{textContent:()=>a("inbox.accept"),onclick:()=>{this.svc.accept(e.id)}},decline:{textContent:()=>a("inbox.decline"),onclick:()=>{this.svc.decline(e.id)}}},t)}}const H=n=>`var(--${n})`;class J extends ${static styles=`
        .ui-confirm {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) scale(0.95);
            min-width: 320px;
            max-width: 480px;
            background: ${H("surface")};
            border: 1px solid ${H("border")};
            border-radius: ${H("radius-md")};
            box-shadow: ${H("shadow-3")};
            z-index: 200;
            opacity: 0;
            pointer-events: none;
            transition:
                opacity ${H("dur-slow")} ${H("ease-standard")},
                transform ${H("dur-slow")} ${H("ease-standard")};
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
            font-family: ${H("font-display")};
            font-size: 1.25rem;
            font-weight: 500;
            line-height: 1.4;
            color: ${H("text")};
        }
        .ui-confirm__message {
            padding: 12px 20px 20px;
            margin: 0;
            font-family: ${H("font-ui")};
            font-size: 0.9375rem;
            line-height: 1.5;
            color: ${H("text")};
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
            font-family: ${H("font-ui")};
            font-weight: 600;
            border: 1px solid transparent;
            border-radius: ${H("radius-sm")};
            cursor: pointer;
            transition:
                background ${H("dur-fast")} ${H("ease-standard")},
                border-color ${H("dur-fast")} ${H("ease-standard")},
                color ${H("dur-fast")} ${H("ease-standard")},
                box-shadow ${H("dur-fast")} ${H("ease-standard")};
        }
        .ui-confirm__btn:focus-visible {
            outline: none;
            box-shadow: 0 0 0 3px ${H("accent-soft")};
        }
        .ui-confirm__btn--cancel {
            background: transparent;
            color: ${H("text-muted")};
        }
        .ui-confirm__btn--cancel:hover {
            background: ${H("accent-soft")};
            color: ${H("accent")};
        }
        .ui-confirm__btn--confirm {
            background: ${H("accent")};
            color: ${H("on-accent")};
            border-color: ${H("accent")};
            box-shadow: ${H("shadow-1")};
        }
        .ui-confirm__btn--confirm:hover {
            background: ${H("accent-strong")};
            border-color: ${H("accent-strong")};
        }
        /* Outline, filling only on hover — same reasoning as css.ts danger. */
        .ui-confirm__btn--danger {
            background: transparent;
            color: ${H("danger")};
            border-color: ${H("danger")};
        }
        .ui-confirm__btn--danger:hover {
            background: ${H("danger")};
            color: ${H("on-danger")};
        }
    `;dialogEl;render(){const e=document.createElement("div"),t=(h,p)=>{typeof p=="function"?this.track(b(()=>{h.textContent=p()})):h.textContent=p};this.spawn(kt,e,{open:this.props.open,bg:"rgba(0,0,0,0.4)",zIndex:199,scrollLock:!0,onclose:()=>this.handleCancel()}),this.dialogEl=document.createElement("div"),this.dialogEl.className="ui-confirm",this.dialogEl.style.zIndex="200";const s=document.createElement("h2");s.className="ui-confirm__title",t(s,this.props.title??"Confirm"),this.dialogEl.appendChild(s);const i=document.createElement("p");i.className="ui-confirm__message",t(i,this.props.message),this.dialogEl.appendChild(i);const r=document.createElement("div");r.className="ui-confirm__actions";const d=document.createElement("button");d.className="ui-confirm__btn ui-confirm__btn--cancel",t(d,this.props.cancelLabel??"Cancel"),d.addEventListener("click",h=>{h.stopPropagation(),this.handleCancel()}),r.appendChild(d);const c=document.createElement("button");return c.className=this.props.danger?"ui-confirm__btn ui-confirm__btn--danger":"ui-confirm__btn ui-confirm__btn--confirm",t(c,this.props.confirmLabel??"Confirm"),c.addEventListener("click",h=>{h.stopPropagation(),this.props.open.set(!1),this.props.onconfirm()}),r.appendChild(c),this.dialogEl.appendChild(r),this.dialogEl.addEventListener("click",h=>h.stopPropagation()),e.appendChild(this.dialogEl),this.track(b(()=>{this.dialogEl.classList.toggle("open",this.props.open.get())})),e}handleCancel(){this.props.open.set(!1),this.props.oncancel&&this.props.oncancel()}}const ee=n=>`var(--${n})`,ve=(n,e)=>`
    .ui-status-pill--${n} { --ui-pill-tone: ${e}; }
`;class Z extends ${static styles=`
        .ui-status-pill {
            display: inline-flex;
            align-items: center;
            gap: ${ee("space-1")};
            padding: 2px ${ee("space-2")};
            border-radius: ${ee("radius-pill")};
            font-family: ${ee("font-ui")};
            font-size: 0.75rem;
            font-weight: 600;
            line-height: 1.4;
            white-space: nowrap;
            border: 1px solid transparent;
        }
        ${ve("neutral",ee("text-muted"))}
        ${ve("success",ee("success"))}
        ${ve("warning",ee("warning"))}
        ${ve("danger",ee("danger"))}
        ${ve("info",ee("info"))}

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
            color: ${ee("surface")};
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
    `;render(){const e=this.props.variant??"outline",t=this.props.tone??"neutral",s=document.createElement("span");s.className=`ui-status-pill ui-status-pill--${e} ui-status-pill--${t}`,s.setAttribute("data-variant",e),s.setAttribute("data-tone",t);const i=d=>typeof d=="function"?d():d;if(this.props.glyph!==void 0){const d=document.createElement("span");d.className="ui-status-pill__glyph",d.setAttribute("aria-hidden","true"),typeof this.props.glyph=="function"?this.track(b(()=>{d.textContent=i(this.props.glyph)})):d.textContent=this.props.glyph,s.appendChild(d)}const r=document.createElement("span");return r.className="ui-status-pill__label",typeof this.props.label=="function"?this.track(b(()=>{r.textContent=i(this.props.label)})):r.textContent=this.props.label,s.appendChild(r),s}}function vs(n){const e=new Set;return n.filter(t=>{const s=t.id??`name:${t.name}`;return e.has(s)?!1:(e.add(s),!0)})}function Ye(n){return vs(n).filter(e=>e.name.trim().length>0)}function ys(n){return new Intl.ListFormat(Dn(),{style:"long",type:"conjunction"}).format(Ye(n).map(e=>e.name))}function xs(n,e=n.length>0){if(!e)return a("share.private");const t=vs(n),s=t.find(r=>r.name.trim().length>0);if(!s)return a("share.sharedUnknown");const i=t.length-1;return i===0?a("share.sharedWith",{name:s.name}):V("share.sharedWithMore",i,{name:s.name})}function Bo(n,e=n.length>0){if(!e)return;const t=Ye(n);if(!(t.length<2))return a("share.sharedWithAll",{names:ys(t)})}function Go(n){return a(n==="teacher"?"role.teacher":"role.student")}function Ko(n){return V("notes.heading",n)}function qo(n,e){return Ye(n).length===0?a("notes.hintNoRecipients"):e?a("notes.hintShared",{names:ys(n)}):a("notes.hintPrivate")}function ws(n){return F(n,{day:"numeric",month:"long",hour:"2-digit",minute:"2-digit"})}const Uo="(max-width: 639px)";function Wo(n,e,t){return t?[...n,...e]:[...e]}const at=n=>typeof n=="function"?n():n;class Xe extends ${static styles=`
        .person-marker {
            display: inline-flex;
            align-items: baseline;
            gap: ${l("sm")};
            /* Author names are UI text, never the serif (§02). */
            font-family: ${o("font-ui")};
        }

        .person-marker__name {
            font-size: 0.875rem;
            font-weight: 600;
            color: ${o("text")};
        }

        /* Teacher accent / student neutral. The ONLY difference between the two
           roles — same pill, same metrics, same weight. */
        .person-marker--teacher .ui-status-pill {
            --ui-pill-tone: ${o("accent-strong")};
        }
        .person-marker--student .ui-status-pill {
            --ui-pill-tone: ${o("text-muted")};
        }

        .person-marker__role.hidden { display: none; }
    `;role(){return at(this.props.role)}render(){const e=document.createElement("span");e.className="person-marker";const t=document.createElement("span");t.className="person-marker__name",e.appendChild(t);const s=document.createElement("span");return s.className="person-marker__role",e.appendChild(s),this.spawn(Z,s,{label:()=>Go(this.role()),variant:"outline"}),this.track(b(()=>{t.textContent=at(this.props.name)})),this.track(b(()=>{e.className=`person-marker person-marker--${this.role()}`;const i=this.props.showRole===void 0?!0:at(this.props.showRole);s.className=i?"person-marker__role":"person-marker__role hidden"})),e}}class be{items=new u([]);loading=new u(!1);error=new u(null);resolved=new u(!1);async load(){const e=await w(this.loading,this.error,()=>v.students.list());e&&this.items.set(e),this.resolved.set(!0)}async get(e){return await w(this.loading,this.error,()=>v.students.get({id:e}))??null}async exerciseHistory(e,t){return await w(this.loading,this.error,()=>v.students.exerciseHistory({id:e,exerciseId:t}))??null}}const ks=["oversikt","lektioner","pass","planer","mal","hastar","historik"],$s="oversikt";function ot(n){return ks.includes(n)?n:$s}const Yo={oversikt:"student.tab.overview",lektioner:"student.tab.lessons",pass:"student.tab.sessions",planer:"student.tab.plans",mal:"student.tab.goals",hastar:"student.tab.horses",historik:"student.tab.history"};function mn(n){return a(Yo[n])}function fn(n,e){return e===$s?`/students/${n}`:`/students/${n}?flik=${e}`}function Xo(n){const e=Dn();return[...n].sort((t,s)=>t.displayName.localeCompare(s.displayName,e))}function Cs(n,e){return n.filter(t=>t.studentId===e&&t.role==="teacher")}function Ee(n,e,t){return Cs(n,e).filter(i=>i.status==="planned"&&i.scheduledAt>=t).sort((i,r)=>i.scheduledAt.localeCompare(r.scheduledAt))[0]??null}function Qo(n){return n?a("student.nextLesson",{when:F(n.scheduledAt,{weekday:"long",day:"numeric",month:"long",hour:"2-digit",minute:"2-digit"})}):null}function Jo(n,e){return`${n.id}:${n.displayName}:${n.email}:${e??""}`}function Zo(n){switch(n){case"pending":return{label:()=>a("invitations.status.pending"),variant:"outline",tone:"info"};case"accepted":return{label:()=>a("invitations.status.accepted"),variant:"filled",tone:"success"};case"declined":return{label:()=>a("invitations.status.declined"),variant:"dashed",tone:"neutral",glyph:"✕"};case"revoked":return{label:()=>a("invitations.status.revoked"),variant:"dashed",tone:"neutral",glyph:"✕"};case"expired":return{label:()=>a("invitations.status.expired"),variant:"dashed",tone:"neutral",glyph:"✕"}}}function er(n){return n==="pending"}function tr(n,e=new Date){return a("invitations.sent",{when:qe(n,e)})}function nr(n){return[...n].sort((e,t)=>{const s=+(t.status==="pending")-+(e.status==="pending");return s!==0?s:t.createdAt.localeCompare(e.createdAt)})}function sr(n){return`${n.id}:${n.status}`}const ir=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;function ar(n){const e=n.trim();return e.length===0?a("invite.error.emailRequired"):ir.test(e)?null:a("invite.error.emailInvalid")}function or(n){return n?.code==="conflict"}function rr(n){return a("invite.error.conflict",{email:n.trim()})}function lr(n){return n.students>0?"roster":!n.studentsResolved||!n.invitationsResolved?"unknown":n.invitations>0?"invitedOnly":"empty"}function bn(n){return`/lektioner/ny?elev=${encodeURIComponent(n)}`}function dr(n,e,t){return`/students/${n}/exercises/${e}/history?from=${encodeURIComponent(t)}`}function cr(n){return a("student.relation",{email:n})}function hr(n){return n.filter(e=>e.archivedAt===null)}function _n(n){return n.filter(e=>e.status==="active")}function pr(n){return n.length}function Ss(n){return[...n].sort((e,t)=>t.performedAt.localeCompare(e.performedAt))}function rt(n){return Ss(n)[0]??null}function ur(n){return V("student.overview.planCount",n)}function gr(n){return V("student.overview.goalCount",n)}const Es=5;function mr(n,e,t,s=Es){return[...n.filter(r=>r.scheduledAt<=t).map(r=>({kind:"lesson",id:r.id,at:r.scheduledAt,title:r.title,href:`/lektioner/${r.id}`})),...e.filter(r=>r.performedAt<=t).map(r=>({kind:"session",id:r.id,at:r.performedAt,title:r.title,href:`/traningspass/${r.id}`}))].sort((r,d)=>d.at.localeCompare(r.at)).slice(0,s)}function fr(n){return n.sourcesFailed?"unavailable":n.sourcesAnswered&&n.count===0?"empty":"silent"}function br(n){return a(n==="lesson"?"objectKind.lesson":"objectKind.trainingSession")}function _r(n,e=new Date){return qe(n,e)}function vr(n){return`${n.kind}:${n.id}:${n.at}`}function yr(n){return n===404}const xr=S(`
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
`);class wr extends ${static styles=`
        .students {
            & .students__head {
                display: flex;
                align-items: baseline;
                justify-content: space-between;
                gap: ${l("lg")};
                flex-wrap: wrap;
                margin-bottom: ${l("xl")};
            }

            /* Lora 500, and only 500 — UI_DECISIONS §3. */
            & .students__title {
                margin: 0;
                font-family: ${o("font-display")};
                font-weight: 500;
                font-size: 1.75rem;
                line-height: 36px;
                color: ${o("text")};
            }

            /* Buttons are Open Sans territory; the serif is forbidden here. */
            & .students__invite { ${k(o("radius-sm"),"primary")} }

            /*
             * Already a panel before this change — hand-rolled from the same
             * three properties card() sets. Now it uses the recipe, so it
             * picks up the shared elevation and cannot drift from the panels
             * on the create routes. The panel is also what makes the fields
             * legible: the §4.8 field recipe fills with --bg, so a form drawn
             * straight onto the page would give them the page's own colour.
             */
            & .students__form {
                ${q()}
                box-sizing: border-box;
                display: none;
                flex-direction: column;
                gap: ${l("md")};
                max-width: 34rem;
                padding: ${l("lg")};
                margin-bottom: ${l("xl")};
                font-family: ${o("font-ui")};
            }
            & .students__form.open { display: flex; }

            & .students__field { display: flex; flex-direction: column; gap: ${l("xs")}; }
            & .students__label { font-size: 0.8125rem; font-weight: 600; color: ${o("text")}; }
            & .students__hint {
                font-size: 0.8125rem;
                line-height: 1.5;
                color: ${o("text-muted")};
                max-width: 68ch;
            }
            & .students__input {
                ${R()}
                width: 100%;
                box-sizing: border-box;
            }
            & .students__form-error {
                margin: 0;
                min-height: 1em;
                font-size: 0.875rem;
                color: ${o("danger")};
            }
            & .students__form-actions { display: flex; gap: ${l("sm")}; flex-wrap: wrap; }
            /* §4.8: one primary per form. This is it. */
            & .students__send { ${k(o("radius-sm"),"primary")} }
            /* Cancel is the ghost tier — not a second bordered button. */
            & .students__cancel { ${k(o("radius-sm"),"ghost")} }

            & .students__loading {
                margin: 0 0 ${l("md")};
                font-family: ${o("font-ui")};
                color: ${o("text-muted")};
                font-size: 0.875rem;
            }
            & .students__loading.hidden { display: none; }

            & .students__muted {
                margin: 0;
                padding: ${l("md")} 0;
                font-family: ${o("font-ui")};
                color: ${o("text-muted")};
                font-size: 0.875rem;
            }
            & .students__muted.hidden { display: none; }

            & .students__error {
                display: flex;
                align-items: center;
                gap: ${l("md")};
                flex-wrap: wrap;
                padding: ${l("md")};
                margin-bottom: ${l("lg")};
                border: 1px solid ${o("danger")};
                border-radius: ${o("radius-md")};
                background: ${o("danger-soft")};
                font-family: ${o("font-ui")};

                & .students__error-text { margin: 0; font-size: 0.875rem; color: ${o("text")}; }
                & .students__retry { ${k()} }
            }
            & .students__error.hidden { display: none; }

            & .students__empty.hidden { display: none; }

            & .students__section { margin-bottom: ${l("xl")}; }
            & .students__section.hidden { display: none; }

            /* Section headings are the serif's other permitted home (§02). */
            & .students__section-title {
                margin: 0 0 ${l("sm")};
                font-family: ${o("font-display")};
                font-weight: 500;
                font-size: 1.25rem;
                line-height: 28px;
                color: ${o("text")};
            }

            & .students__lede {
                margin: 0 0 ${l("md")};
                font-family: ${o("font-ui")};
                font-size: 0.9375rem;
                line-height: 1.6;
                color: ${o("text-muted")};
                max-width: 68ch;
            }
            & .students__lede.hidden { display: none; }

            & .students__list {
                list-style: none;
                margin: 0;
                padding: 0;
                /* No zebra striping (§4.3): rows are separated by a hairline. */
                border-top: 1px solid ${o("border")};
            }
            & .students__list > li { border-bottom: 1px solid ${o("border")}; }

            & .student-row {
                display: grid;
                grid-template-columns: minmax(0, 1fr);
                align-items: center;
                gap: ${l("xs")} ${l("lg")};
                padding: ${l("md")} ${l("sm")};
                text-decoration: none;
                color: inherit;
                font-family: ${o("font-ui")};

                &:hover { background: ${o("surface-2")}; }
                &:focus-visible { outline: 2px solid ${o("accent")}; outline-offset: -2px; }
            }

            & .student-row__body {
                display: flex;
                flex-direction: column;
                gap: ${l("xs")};
                min-width: 0;
            }
            /* One meta line, not three — §4.3 allows at most two rows of text. */
            & .student-row__meta {
                display: flex;
                align-items: baseline;
                flex-wrap: wrap;
                gap: ${l("xs")} ${l("sm")};
                font-size: 0.8125rem;
                color: ${o("text-muted")};
                overflow-wrap: anywhere;
            }

            & .invite-row {
                display: grid;
                grid-template-columns: minmax(0, 1fr) auto auto;
                align-items: center;
                gap: ${l("sm")} ${l("lg")};
                padding: ${l("md")} ${l("sm")};
                font-family: ${o("font-ui")};
            }
            & .invite-row__body {
                display: flex;
                flex-direction: column;
                gap: ${l("xs")};
                min-width: 0;
            }
            & .invite-row__email {
                font-size: 0.9375rem;
                font-weight: 600;
                color: ${o("text")};
                overflow-wrap: anywhere;
            }
            & .invite-row__sent { font-size: 0.8125rem; color: ${o("text-muted")}; }
            /* Revoking an invitation is destructive — the outline tier says so
               without shouting a red fill at a list of pending invites. */
            & .invite-row__revoke {
                ${k(o("radius-sm"),"danger")}
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
    `;router=this.inject(L);students=this.inject(be);invitations=this.inject(_s);toasts=this.inject(U);lessons=new ie;nowIso=new u(new Date().toISOString());emailEl=null;formOpen=new u(!1);emailVal=new u("");validation=new u("");revoking=new u(null);confirmOpen=new u(!1);sorted=new f(()=>Xo(this.students.items.get()));invited=new f(()=>nr(this.invitations.items.get()));state=new f(()=>lr({students:this.students.items.get().length,invitations:this.invitations.items.get().length,studentsResolved:this.students.resolved.get()&&this.students.error.get()===null,invitationsResolved:this.invitations.resolved.get()&&this.invitations.error.get()===null}));onMount(){this.students.load(),this.invitations.load(),this.lessons.run(()=>v.lessons.list())}render(){const e=this.wire(xr,{heading:{textContent:()=>a("students.heading")},invite:{textContent:()=>a("students.invite"),onclick:()=>this.openForm(),"aria-expanded":()=>String(this.formOpen.get())},form:{className:()=>this.formOpen.get()?"students__form open":"students__form",onsubmit:s=>{this.submitInvite(s)}},emailLabel:{textContent:()=>a("invite.field.email")},emailHint:{textContent:()=>a("invite.field.email.hint")},emailInput:{value:()=>this.emailVal.get(),oninput:s=>this.emailVal.set(s.target.value)},formError:{textContent:()=>this.formErrorText()},send:{textContent:()=>a("invite.submit"),disabled:()=>this.invitations.loading.get()},cancel:{textContent:()=>a("invite.cancel"),onclick:()=>this.closeForm()},loading:{textContent:()=>a("students.loading"),className:()=>this.students.loading.get()&&this.students.items.get().length===0?"students__loading":"students__loading hidden"},errorBox:{className:()=>this.students.error.get()?"students__error":"students__error hidden"},errorText:{textContent:()=>a("students.error")},retry:{textContent:()=>a("students.retry"),onclick:()=>{this.students.load()}},rosterSection:{className:()=>this.sorted.get().length===0?"students__section hidden":"students__section"},invitedHeading:{textContent:()=>a("invitations.heading")},invitedLede:{textContent:()=>a("students.invitedOnly.body"),className:()=>this.state.get()==="invitedOnly"?"students__lede":"students__lede hidden"},invitedLoading:{textContent:()=>a("invitations.loading"),className:()=>this.invitations.loading.get()&&this.invitations.items.get().length===0?"students__loading":"students__loading hidden"},invitedErrorBox:{className:()=>this.invitations.error.get()&&!this.formOpen.get()?"students__error":"students__error hidden"},invitedErrorText:{textContent:()=>a("invitations.error")},invitedRetry:{textContent:()=>a("students.retry"),onclick:()=>{this.invitations.load()}},invitedEmpty:{textContent:()=>a("invitations.empty"),className:()=>this.invitations.resolved.get()&&this.invitations.error.get()===null&&this.invited.get().length===0?"students__muted":"students__muted hidden"},invitedSection:{className:()=>this.state.get()==="empty"?"students__section hidden":"students__section"}});this.emailEl=this.ref(e,"emailInput"),this.buildEmpty(this.ref(e,"emptyHost")),this.$each(this.ref(e,"list"),this.sorted,(s,i,r)=>this.renderStudent(s,r),s=>Jo(s,this.nextLessonIso(s.id))),this.$each(this.ref(e,"invitedList"),this.invited,(s,i,r)=>this.renderInvitation(s,r),sr);const t=this.ref(e,"confirmHost");return this.track(b(()=>{t.toggleAttribute("inert",!this.confirmOpen.get())})),this.spawn(J,t,{open:this.confirmOpen,title:a("invitations.confirm.title"),message:()=>{const s=this.revoking.get();return s?a("invitations.confirm.message",{email:s.inviteeEmail}):""},confirmLabel:a("invitations.revoke"),cancelLabel:a("invitations.confirm.dismiss"),danger:!0,onconfirm:()=>{this.revokeConfirmed()},oncancel:()=>this.revoking.set(null)}),e}buildEmpty(e){const t=document.createElement("div");t.className="students__empty hidden",e.appendChild(t);const s=new B({heading:()=>a("students.empty.heading"),body:()=>a("students.empty.body"),action:{label:()=>a("students.invite"),onclick:()=>this.openForm()},headingLevel:2});s.mount(t),this.track(()=>s.destroy()),this.track(b(()=>{t.className=this.state.get()==="empty"?"students__empty":"students__empty hidden"}))}openForm(){this.formOpen.set(!0),this.validation.set(""),this.invitations.error.set(null),requestAnimationFrame(()=>this.emailEl?.focus())}closeForm(){this.formOpen.set(!1),this.validation.set(""),this.emailVal.set(""),this.invitations.error.set(null)}formErrorText(){const e=this.validation.get();if(e)return e;const t=this.invitations.error.get();return!t||!this.formOpen.get()?"":or(t)?rr(this.emailVal.get()):a("invite.error.failed")}async submitInvite(e){e.preventDefault();const t=this.emailVal.get().trim(),s=ar(t);if(s)return this.validation.set(s);this.validation.set(""),await this.invitations.create(t)&&(this.toasts.show({message:a("invite.sent",{email:t}),variant:"success"}),this.closeForm())}async revokeConfirmed(){const e=this.revoking.get();if(this.revoking.set(null),!!e){if(await this.invitations.revoke(e.id),this.invitations.error.get()){this.toasts.show({message:a("invitations.revokeError"),variant:"error"});return}this.toasts.show({message:a("invitations.toast.revoked",{email:e.inviteeEmail})})}}nextLessonIso(e){const t=this.lessons.data.get();return t?Ee(t,e,this.nowIso.get())?.scheduledAt??null:null}renderStudent(e,t){const s=document.createElement("li"),i=`/students/${e.id}`,r=document.createElement("a");r.className="student-row",r.href=i,r.addEventListener("click",x=>{x.preventDefault(),this.router.navigate(i)});const d=document.createElement("span");d.className="student-row__body";const c=document.createElement("span");d.appendChild(c);const h=new Xe({name:e.displayName,role:"student"});h.mount(c),t(()=>h.destroy());const p=document.createElement("span");p.className="student-row__meta";const g=document.createElement("span");g.textContent=e.email,p.appendChild(g);const m=this.lessons.data.get(),_=Qo(m?Ee(m,e.id,this.nowIso.get()):null);if(_){const x=document.createElement("span");x.textContent=_,p.appendChild(x)}return d.appendChild(p),r.appendChild(d),s.appendChild(r),s}renderInvitation(e,t){const s=document.createElement("li"),i=document.createElement("div");i.className="invite-row";const r=document.createElement("div");r.className="invite-row__body";const d=document.createElement("span");d.className="invite-row__email",d.textContent=e.inviteeEmail;const c=document.createElement("span");c.className="invite-row__sent",c.textContent=tr(e.createdAt),r.append(d,c),i.appendChild(r);const h=document.createElement("div"),p=Zo(e.status),g=new Z({label:p.label,variant:p.variant,tone:p.tone,...p.glyph===void 0?{}:{glyph:p.glyph}});if(g.mount(h),t(()=>g.destroy()),i.appendChild(h),er(e.status)){const m=document.createElement("button");m.type="button",m.className="invite-row__revoke",m.textContent=a("invitations.revoke"),m.addEventListener("click",()=>{this.revoking.set(e),this.confirmOpen.set(!0)}),i.appendChild(m)}return s.appendChild(i),s}}function lt(n){return typeof n=="object"&&n!==null&&typeof n.get=="function"}const N=n=>`var(--${n})`,vn="http://www.w3.org/2000/svg";function kr(){const n=document.createElementNS(vn,"svg");n.setAttribute("width","12"),n.setAttribute("height","8"),n.setAttribute("viewBox","0 0 12 8"),n.setAttribute("fill","none"),n.setAttribute("aria-hidden","true"),n.setAttribute("focusable","false");const e=document.createElementNS(vn,"path");return e.setAttribute("d","M1 1.5 6 6.5 11 1.5"),e.setAttribute("stroke","currentColor"),e.setAttribute("stroke-width","1.5"),e.setAttribute("stroke-linecap","round"),e.setAttribute("stroke-linejoin","round"),e.setAttribute("fill","none"),n.appendChild(e),n}class D extends ${static styles=`
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
            gap: ${N("space-2")};
            padding: 10px 34px 10px 12px;
            min-width: 160px;
            width: 100%;
            border: 1px solid ${N("border")};
            border-bottom: 2px solid ${N("border-strong")};
            border-radius: ${N("radius-sm")};
            background: ${N("bg")};
            color: ${N("text")};
            font-family: ${N("font-ui")};
            font-size: inherit;
            cursor: pointer;
            text-align: left;
            line-height: 1.5;
            transition:
                border-color ${N("dur-fast")} ${N("ease-standard")},
                box-shadow ${N("dur-fast")} ${N("ease-standard")},
                background ${N("dur-fast")} ${N("ease-standard")};
        }
        .ui-select__trigger:focus-visible {
            outline: none;
            border-color: ${N("accent")};
            background: ${N("surface")};
            box-shadow: 0 0 0 3px ${N("accent-soft")};
        }
        .ui-select__trigger--placeholder {
            color: ${N("text-muted")};
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
            color: ${N("text-muted")};
            transition: transform ${N("dur-fast")} ${N("ease-standard")};
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
            background: ${N("surface")};
            border: 1px solid ${N("border")};
            border-radius: ${N("radius-md")};
            box-shadow: ${N("shadow-2")};
            opacity: 0;
            pointer-events: none;
            transform: scale(0.95);
            transition: opacity ${N("dur-base")} ${N("ease-standard")},
                        transform ${N("dur-base")} ${N("ease-standard")};
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
            gap: ${N("space-2")};
            padding: ${N("space-2")} ${N("space-3")};
            cursor: pointer;
            color: ${N("text")};
            font-family: ${N("font-ui")};
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
            background: ${N("surface-2")};
        }
        .ui-select__option--selected {
            color: ${N("accent-strong")};
            font-weight: 600;
        }
        /* Multi-select: selection is a checkbox plus an accent-tinted fill,
           never weight and colour alone. */
        .ui-select__option--multi.ui-select__option--selected {
            background: ${N("accent-soft")};
        }
        .ui-select__option--multi.ui-select__option--selected.ui-select__option--highlighted {
            background: ${N("accent-soft")};
            box-shadow: inset 2px 0 0 ${N("accent")};
        }
        .ui-select__checkbox {
            flex-shrink: 0;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 14px;
            height: 14px;
            border: 1px solid ${N("border-strong")};
            border-radius: 3px;
            background: ${N("surface")};
            font-size: 0.625rem;
            line-height: 1;
            color: ${N("on-accent")};
        }
        .ui-select__option--selected .ui-select__checkbox {
            background: ${N("accent")};
            border-color: ${N("accent")};
        }
        .ui-select__option--header {
            cursor: default;
            font-size: 0.7rem;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.04em;
            color: ${N("text-muted")};
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
            color: ${N("accent-strong")};
        }
        .ui-select__count {
            padding: ${N("space-2")} ${N("space-3")};
            border-top: 1px solid ${N("border")};
            font-family: ${N("font-ui")};
            font-size: 0.75rem;
            font-weight: 600;
            color: ${N("text-muted")};
        }
    `;static seq=0;uid=`ui-select-${D.seq++}`;open=new u(!1);highlightIndex=new u(-1);wrapperEl;triggerEl;dropdownEl;listEl;countEl;optionEls=[];onOutsidePointer=e=>{this.wrapperEl.contains(e.target)||this.open.set(!1)};get isMulti(){return this.props.multiple===!0}get multi(){return this.props}get single(){return this.props}currentOptions(){return lt(this.props.options)?this.props.options.get():this.props.options}selectedValues(){if(this.isMulti)return this.multi.values.get();const e=this.single.value.get();return e?[e]:[]}placeholderText(){const e=this.props.placeholder;return(typeof e=="function"?e():e)??""}formatCount(e){return this.multi.countLabel?this.multi.countLabel(e):String(e)}render(){const e=document.createElement("div");e.className="ui-select",this.wrapperEl=e;const t=this.props.zIndex??50,s=this.isMulti;this.triggerEl=document.createElement("button"),this.triggerEl.className="ui-select__trigger",this.triggerEl.setAttribute("type","button"),this.triggerEl.setAttribute("role","combobox"),this.triggerEl.setAttribute("aria-haspopup","listbox");const i=document.createElement("span");i.className="ui-select__trigger-label",this.triggerEl.appendChild(i);const r=document.createElement("span");r.className="ui-select__chevron",r.appendChild(kr()),r.setAttribute("aria-hidden","true"),this.triggerEl.appendChild(r),this.triggerEl.addEventListener("click",c=>{c.stopPropagation(),this.toggle()}),this.triggerEl.addEventListener("keydown",c=>{this.handleTriggerKeydown(c)}),e.appendChild(this.triggerEl),this.dropdownEl=document.createElement("div"),this.dropdownEl.className="ui-select__dropdown",this.dropdownEl.style.zIndex=String(t),this.dropdownEl.addEventListener("keydown",c=>{this.handleDropdownKeydown(c)}),this.listEl=document.createElement("div"),this.listEl.className="ui-select__list",this.listEl.setAttribute("role","listbox"),s&&this.listEl.setAttribute("aria-multiselectable","true"),this.dropdownEl.appendChild(this.listEl),s&&(this.countEl=document.createElement("div"),this.countEl.className="ui-select__count",this.countEl.setAttribute("role","status"),this.countEl.setAttribute("aria-live","polite"),this.dropdownEl.appendChild(this.countEl)),e.appendChild(this.dropdownEl);const d=c=>{this.optionEls=[],this.listEl.textContent="";for(let h=0;h<c.length;h++){const p=c[h],g=document.createElement("button");if(g.className=s?"ui-select__option ui-select__option--multi":"ui-select__option",g.setAttribute("type","button"),g.id=`${this.uid}-opt-${h}`,p.disabled){g.classList.add("ui-select__option--header"),g.disabled=!0,g.setAttribute("role","presentation"),g.setAttribute("aria-disabled","true");const _=document.createElement("span");_.className="ui-select__option-label",_.textContent=p.label,g.appendChild(_),this.listEl.appendChild(g),this.optionEls.push(g);continue}if(g.setAttribute("role","option"),s){const _=document.createElement("span");_.className="ui-select__checkbox",_.setAttribute("aria-hidden","true"),g.appendChild(_)}if(p.icon){const _=document.createElement("span");_.className="ui-select__option-icon",_.textContent=p.icon,g.appendChild(_)}const m=document.createElement("span");if(m.className="ui-select__option-label",m.textContent=p.label,g.appendChild(m),!s){const _=document.createElement("span");_.className="ui-select__check",_.setAttribute("aria-hidden","true"),g.appendChild(_)}g.addEventListener("click",_=>{_.stopPropagation(),this.chooseOption(p.value)}),g.addEventListener("mouseenter",()=>{this.highlightIndex.set(h)}),this.listEl.appendChild(g),this.optionEls.push(g)}};return lt(this.props.options)?this.track(b(()=>{d(this.currentOptions())})):d(this.props.options),this.track(b(()=>{const c=this.currentOptions(),h=this.selectedValues();if(s){const p=h.length;if(p>0)i.textContent=this.formatCount(p),this.triggerEl.classList.remove("ui-select__trigger--placeholder");else{const g=this.placeholderText();i.textContent=g,this.triggerEl.classList.toggle("ui-select__trigger--placeholder",!!g)}this.countEl&&(this.countEl.textContent=this.formatCount(p))}else{const p=this.single.value.get(),g=c.find(m=>m.value===p);if(g)i.textContent=g.icon?`${g.icon} ${g.label}`:g.label,this.triggerEl.classList.remove("ui-select__trigger--placeholder");else{const m=this.placeholderText();i.textContent=m,this.triggerEl.classList.toggle("ui-select__trigger--placeholder",!!m)}}for(let p=0;p<c.length;p++){const g=this.optionEls[p];if(!g||c[p].disabled)continue;const m=h.includes(c[p].value);g.setAttribute("aria-selected",String(m)),g.classList.toggle("ui-select__option--selected",m);const _=g.querySelector(".ui-select__check");_&&(_.textContent=m?"✓":"");const x=g.querySelector(".ui-select__checkbox");x&&(x.textContent=m?"✓":"")}})),this.track(b(()=>{const c=this.open.get();this.dropdownEl.classList.toggle("open",c),r.classList.toggle("ui-select__chevron--open",c),this.triggerEl.setAttribute("aria-expanded",String(c)),c?document.addEventListener("pointerdown",this.onOutsidePointer,!0):document.removeEventListener("pointerdown",this.onOutsidePointer,!0),c&&P(()=>{const h=this.currentOptions(),p=this.selectedValues(),g=h.findIndex(_=>!_.disabled&&p.includes(_.value)),m=h.findIndex(_=>!_.disabled);this.highlightIndex.set(g>=0?g:m)})})),this.track(b(()=>{const c=this.highlightIndex.get();for(let h=0;h<this.optionEls.length;h++)this.optionEls[h].classList.toggle("ui-select__option--highlighted",h===c);c>=0&&this.optionEls[c]&&(this.triggerEl.setAttribute("aria-activedescendant",`${this.uid}-opt-${c}`),this.optionEls[c].scrollIntoView({block:"nearest"}))})),this.props.disabled!=null&&(lt(this.props.disabled)?this.track(b(()=>{const c=this.props.disabled.get();this.triggerEl.classList.toggle("ui-select__trigger--disabled",c),this.triggerEl.disabled=c})):this.props.disabled&&(this.triggerEl.classList.add("ui-select__trigger--disabled"),this.triggerEl.disabled=!0)),e}toggle(){this.open.update(e=>!e)}chooseOption(e){if(this.isMulti){const t=this.multi.values.get();this.multi.values.set(t.includes(e)?t.filter(s=>s!==e):[...t,e]);return}ge(()=>{this.single.value.set(e),this.open.set(!1)}),this.triggerEl.focus()}commitHighlighted(){const e=this.highlightIndex.get(),t=this.currentOptions();e>=0&&e<t.length&&!t[e].disabled&&this.chooseOption(t[e].value)}handleTriggerKeydown(e){switch(e.key){case"Enter":case" ":e.preventDefault(),this.open.get()?this.commitHighlighted():this.open.set(!0);break;case"ArrowDown":e.preventDefault(),this.open.get()?this.moveHighlight(1):this.open.set(!0);break;case"ArrowUp":e.preventDefault(),this.open.get()?this.moveHighlight(-1):this.open.set(!0);break;case"Escape":this.open.get()&&(e.preventDefault(),this.open.set(!1));break}}handleDropdownKeydown(e){switch(e.key){case"ArrowDown":e.preventDefault(),this.moveHighlight(1);break;case"ArrowUp":e.preventDefault(),this.moveHighlight(-1);break;case"Enter":case" ":e.preventDefault(),this.commitHighlighted();break;case"Escape":e.preventDefault(),this.open.set(!1),this.triggerEl.focus();break;case"Tab":this.open.set(!1);break}}moveHighlight(e){const t=this.currentOptions();if(t.length===0||!t.some(i=>!i.disabled))return;let s=this.highlightIndex.get();do s+=e,s<0&&(s=t.length-1),s>=t.length&&(s=0);while(t[s].disabled);this.highlightIndex.set(s)}onDestroy(){document.removeEventListener("pointerdown",this.onOutsidePointer,!0)}}const $r=n=>typeof n=="function"?n():n,X=n=>`var(--${n})`;class Ns extends ${static styles=`
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
            border-bottom: 1px solid ${X("border")};
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
            font-family: ${X("font-ui")};
            font-size: 0.875rem;
            font-weight: 400;
            cursor: pointer;
            border: none;
            border-bottom: 2px solid transparent;
            margin-bottom: -1px;
            background: none;
            color: ${X("text-muted")};
            transition:
                background ${X("dur-base")} ${X("ease-standard")},
                border-color ${X("dur-base")} ${X("ease-standard")},
                color ${X("dur-base")} ${X("ease-standard")};
        }
        .ui-tabs__tab:hover {
            background: ${X("surface-2")};
        }
        .ui-tabs__tab:focus-visible {
            outline: 2px solid ${X("accent")};
            outline-offset: -2px;
        }
        .ui-tabs__tab.active {
            color: ${X("accent")};
            border-bottom-color: ${X("accent")};
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
    `;nav;scroller;buttons=[];render(){this.scroller=document.createElement("div"),this.scroller.className="ui-tabs__scroller",this.nav=document.createElement("nav"),this.nav.className="ui-tabs",this.nav.setAttribute("role","tablist");for(const e of this.props.tabs){const t=document.createElement("button");if(t.className="ui-tabs__tab",t.setAttribute("role","tab"),t.setAttribute("data-key",e.key),e.icon){const r=document.createElement("span");r.textContent=e.icon,t.appendChild(r)}const s=document.createElement("span");s.className="ui-tabs__label";const i=()=>{const r=$r(e.label);s.setAttribute("data-label",r),s.textContent=r};typeof e.label=="function"?this.track(b(()=>{i(),this.syncOverflow()})):i(),t.appendChild(s),t.addEventListener("click",()=>{this.props.active.set(e.key)}),this.buttons.push(t),this.nav.appendChild(t)}return this.track(b(()=>{const e=this.props.active.get();for(const t of this.buttons){const s=t.getAttribute("data-key")===e;t.classList.toggle("active",s),t.setAttribute("aria-selected",String(s))}})),this.scroller.appendChild(this.nav),this.wireOverflow(),this.scroller}onMount(){this.syncOverflow(),typeof requestAnimationFrame=="function"&&requestAnimationFrame(()=>this.syncOverflow())}syncOverflow(){const e=this.scroller;e&&(e.classList.toggle("fade-start",e.scrollLeft>1),e.classList.toggle("fade-end",e.scrollLeft+e.clientWidth<e.scrollWidth-1))}wireOverflow(){if(this.scroller.addEventListener("scroll",()=>this.syncOverflow()),typeof window<"u"){const e=()=>this.syncOverflow();window.addEventListener("resize",e),this.track(()=>window.removeEventListener("resize",e))}if(typeof ResizeObserver=="function"){const e=new ResizeObserver(()=>this.syncOverflow());e.observe(this.scroller),e.observe(this.nav),this.track(()=>e.disconnect())}}}const Cr=S(`
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
`),Sr=S(`
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
`);class Er extends ${static styles=`
        .elevvy {
            font-family: ${o("font-ui")};

            & .elevvy__back {
                display: inline-block;
                margin-bottom: ${l("md")};
                font-size: 0.875rem;
                color: ${o("text-muted")};
                text-decoration: none;
                &:hover { color: ${o("accent-strong")}; text-decoration: underline; }
                &:focus-visible { outline: 2px solid ${o("accent")}; outline-offset: 2px; }
            }

            & .elevvy__loading {
                margin: 0 0 ${l("md")};
                color: ${o("text-muted")};
                font-size: 0.875rem;
            }
            & .elevvy__loading.hidden { display: none; }

            & .elevvy__error {
                display: flex;
                align-items: center;
                gap: ${l("md")};
                flex-wrap: wrap;
                padding: ${l("md")};
                margin-bottom: ${l("lg")};
                border: 1px solid ${o("danger")};
                border-radius: ${o("radius-md")};
                background: ${o("danger-soft")};

                & .elevvy__error-text { margin: 0; font-size: 0.875rem; color: ${o("text")}; }
                & .elevvy__retry { ${k()} }
            }
            & .elevvy__error.hidden { display: none; }

            & .elevvy__missing.hidden { display: none; }
            & .elevvy__workspace.hidden { display: none; }

            & .elevvy__head {
                display: flex;
                flex-direction: column;
                gap: ${l("sm")};
                padding-bottom: ${l("lg")};
            }

            & .elevvy__eyebrow {
                margin: 0;
                font-size: 0.6875rem;
                line-height: 16px;
                font-weight: 700;
                letter-spacing: 0.14em;
                text-transform: uppercase;
                color: ${o("text-muted")};
            }

            & .elevvy__title-row {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: ${l("lg")};
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
                font-family: ${o("font-display")};
                font-weight: 500;
                font-size: 1.75rem;
                line-height: 36px;
                color: ${o("text")};
            }

            & .elevvy__book {
                ${k()}
                background: ${o("accent")};
                color: ${o("on-accent")};
                border: 1px solid ${o("accent")};
                &:hover { background: ${o("accent-strong")}; border-color: ${o("accent-strong")}; }
                &:focus-visible { outline: 2px solid ${o("accent")}; outline-offset: 2px; }
            }

            & .elevvy__meta {
                margin: 0;
                font-size: 0.875rem;
                color: ${o("text-muted")};
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

            & .elevvy__panels { padding-top: ${l("xl")}; }
            & .elevvy__panel.hidden { display: none; }

            & .elevvy__lede {
                margin: 0 0 ${l("lg")};
                font-size: 0.875rem;
                line-height: 1.6;
                color: ${o("text-muted")};
                max-width: 68ch;
            }
            & .elevvy__lede.hidden { display: none; }

            & .elevvy__empty.hidden { display: none; }

            & .elevvy__group { margin-bottom: ${l("xl")}; }
            & .elevvy__group.hidden { display: none; }

            & .elevvy__group-label {
                margin: 0 0 ${l("md")};
                font-size: 0.6875rem;
                line-height: 16px;
                font-weight: 700;
                letter-spacing: 0.14em;
                text-transform: uppercase;
                color: ${o("text-muted")};
            }

            & .elevvy__list {
                list-style: none;
                margin: 0;
                padding: 0;
                /* No zebra striping (§4.3): a hairline between rows. */
                border-top: 1px solid ${o("border")};
            }
            & .elevvy__list > li { border-bottom: 1px solid ${o("border")}; }

            & .occ-row {
                display: grid;
                grid-template-columns: auto minmax(0, 1fr) auto auto;
                align-items: start;
                gap: ${l("lg")};
                padding: ${l("md")} ${l("sm")};
                text-decoration: none;
                color: inherit;

                &:hover { background: ${o("surface-2")}; }
                &:focus-visible { outline: 2px solid ${o("accent")}; outline-offset: -2px; }
            }
            /* Cancelled is muted but readable — the dashed pill carries the
               meaning, the dimming only ranks the row (§4.3). */
            & .occ-row--cancelled {
                & .occ-row__title, & .occ-row__day, & .occ-row__time { color: ${o("text-muted")}; }
            }

            & .occ-row__date {
                display: flex;
                flex-direction: column;
                align-items: center;
                width: 3.5rem;
                font-variant-numeric: tabular-nums;
            }
            & .occ-row__day { font-size: 1.25rem; font-weight: 700; line-height: 1.2; color: ${o("text")}; }
            & .occ-row__month {
                font-size: 0.6875rem;
                font-weight: 700;
                letter-spacing: 0.12em;
                color: ${o("text-muted")};
            }
            & .occ-row__time { margin-top: 2px; font-size: 0.8125rem; color: ${o("text-muted")}; }

            & .occ-row__body { display: flex; flex-direction: column; gap: ${l("xs")}; min-width: 0; }
            & .occ-row__title {
                font-size: 0.9375rem;
                font-weight: 600;
                color: ${o("text")};
                overflow-wrap: anywhere;
            }
            & .occ-row__meta {
                display: flex;
                align-items: baseline;
                flex-wrap: wrap;
                gap: ${l("xs")} ${l("sm")};
                font-size: 0.8125rem;
                color: ${o("text-muted")};
            }

            & .occ-row__chips {
                display: flex;
                flex-wrap: wrap;
                gap: ${l("xs")};
                justify-content: flex-end;
                max-width: 16rem;
            }
            & .occ-row__chip {
                display: inline-flex;
                align-items: center;
                padding: 2px ${l("sm")};
                border: 1px solid ${o("border")};
                border-radius: ${o("radius-pill")};
                font-size: 0.75rem;
                font-weight: 600;
                line-height: 1.4;
                color: ${o("text-muted")};
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
                gap: ${l("sm")} ${l("lg")};
                padding: ${l("md")} ${l("sm")};
                text-decoration: none;
                color: inherit;
            }
            & a.plain-row:hover { background: ${o("surface-2")}; }
            & a.plain-row:focus-visible { outline: 2px solid ${o("accent")}; outline-offset: -2px; }
            & .plain-row__body { display: flex; flex-direction: column; gap: ${l("xs")}; min-width: 0; }
            & .plain-row__title {
                font-size: 0.9375rem;
                font-weight: 600;
                color: ${o("text")};
                overflow-wrap: anywhere;
            }
            & .plain-row__meta {
                display: flex;
                align-items: baseline;
                flex-wrap: wrap;
                gap: ${l("xs")} ${l("sm")};
                font-size: 0.8125rem;
                color: ${o("text-muted")};
            }

            /* Översikt — §4.2 auto-fitting card grid, capped at the spec's four. */
            & .elevvy__cards {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(15rem, 1fr));
                gap: ${l("md")};
                margin-bottom: ${l("xl")};
            }
            & .elevvy__card {
                display: flex;
                flex-direction: column;
                gap: ${l("xs")};
                padding: ${l("lg")};
                border: 1px solid ${o("border")};
                border-radius: ${o("radius-md")};
                background: ${o("surface")};
                text-decoration: none;
                color: inherit;
            }
            & a.elevvy__card:hover { border-color: ${o("border-strong")}; }
            & a.elevvy__card:focus-visible { outline: 2px solid ${o("accent")}; outline-offset: 2px; }
            & .elevvy__card-label {
                font-size: 0.6875rem;
                line-height: 16px;
                font-weight: 700;
                letter-spacing: 0.14em;
                text-transform: uppercase;
                color: ${o("text-muted")};
            }
            & .elevvy__card-value {
                font-size: 1rem;
                font-weight: 600;
                color: ${o("text")};
                overflow-wrap: anywhere;
            }
            & .elevvy__card-meta { font-size: 0.8125rem; color: ${o("text-muted")}; }

            & .elevvy__subheading {
                margin: 0 0 ${l("md")};
                font-family: ${o("font-display")};
                font-weight: 500;
                font-size: 1.25rem;
                line-height: 28px;
                color: ${o("text")};
            }

            & .activity-row {
                display: flex;
                align-items: baseline;
                flex-wrap: wrap;
                gap: ${l("xs")} ${l("sm")};
                padding: ${l("sm")} ${l("sm")};
                text-decoration: none;
                color: inherit;
                font-size: 0.875rem;
                &:hover { background: ${o("surface-2")}; }
                &:focus-visible { outline: 2px solid ${o("accent")}; outline-offset: -2px; }
            }
            & .activity-row__kind {
                font-size: 0.6875rem;
                font-weight: 700;
                letter-spacing: 0.08em;
                text-transform: uppercase;
                color: ${o("text-muted")};
            }
            & .activity-row__title { color: ${o("text")}; overflow-wrap: anywhere; }
            /* Timestamps are never the serif (§02). */
            & .activity-row__when { font-family: ${o("font-ui")}; color: ${o("text-muted")}; }

            & .elevvy__picker {
                display: flex;
                align-items: flex-end;
                gap: ${l("sm")};
                flex-wrap: wrap;
                max-width: 34rem;
            }
            & .elevvy__picker-field { display: flex; flex-direction: column; gap: ${l("xs")}; flex: 1; min-width: 12rem; }
            & .elevvy__picker-label { font-size: 0.8125rem; font-weight: 600; color: ${o("text")}; }
            & .elevvy__picker-field .ui-select { display: block; }
            & .elevvy__picker-open {
                ${k()}
                background: ${o("accent")};
                color: ${o("on-accent")};
                border: 1px solid ${o("accent")};
                &:hover:not(:disabled) { background: ${o("accent-strong")}; border-color: ${o("accent-strong")}; }
                &:focus-visible { outline: 2px solid ${o("accent")}; outline-offset: 2px; }
            }

            & .elevvy__horses {
                list-style: none;
                margin: 0;
                padding: 0;
                display: flex;
                flex-wrap: wrap;
                gap: ${l("sm")};
            }
            & .elevvy__horse {
                padding: ${l("sm")} ${l("md")};
                border: 1px solid ${o("border")};
                border-radius: ${o("radius-md")};
                background: ${o("surface")};
                font-size: 0.875rem;
                color: ${o("text")};
            }

            @media (max-width: 639px) {
                & .elevvy__identity .person-marker__name { font-size: 1.375rem; line-height: 30px; }
                & .elevvy__title-row { align-items: flex-start; }
                & .occ-row {
                    grid-template-columns: minmax(0, 1fr) auto;
                    gap: ${l("sm")};
                }
                & .occ-row__date {
                    flex-direction: row;
                    align-items: baseline;
                    gap: ${l("xs")};
                    width: auto;
                }
                & .occ-row__day { font-size: 1rem; }
                & .occ-row__body { grid-column: 1 / -1; }
                & .occ-row__chips { grid-column: 1 / -1; justify-content: flex-start; max-width: none; }
                & .plain-row { grid-template-columns: minmax(0, 1fr); justify-items: start; }
                & .elevvy__picker { flex-direction: column; align-items: stretch; }
            }
        }
    `;router=this.inject(L);studentId=this.router.route.get().split("/")[2]??"";fromHref=`/students/${this.studentId}`;student=new ie;lessons=new ie;sessions=new ie;plans=new ie;goals=new ie;horses=new ie;exercises=new ie;nowIso=new u(new Date().toISOString());tabQuery=this.router.query("flik");activeTab=new u(ot(this.router.query("flik").get()));historyPick=new u("");tabs=null;tabsHost=null;missing=new f(()=>this.student.resolved.get()&&this.student.error.get()!==null&&yr(this.student.status.get()));failed=new f(()=>this.student.error.get()!==null&&!this.missing.get());ready=new f(()=>this.student.data.get()!==null);myLessons=new f(()=>Cs(this.lessons.data.get()??[],this.studentId));groupedLessons=new f(()=>Un(this.myLessons.get(),this.nowIso.get()));mySessions=new f(()=>Ss(this.sessions.data.get()??[]));myPlans=new f(()=>_n(this.plans.data.get()??[]));myGoals=new f(()=>this.goals.data.get()??[]);myHorses=new f(()=>hr(this.horses.data.get()??[]));activity=new f(()=>mr(this.myLessons.get().map(e=>({id:e.id,scheduledAt:e.scheduledAt,title:$e(e)})),this.mySessions.get().map(e=>({id:e.id,performedAt:e.performedAt,title:Ce(e)})),this.nowIso.get(),Es));onMount(){this.student.run(()=>v.students.get({id:this.studentId})),this.track(b(()=>{const e=ot(this.tabQuery.get());this.activeTab.peek()!==e&&this.activeTab.set(e)})),this.track(b(()=>{const e=this.activeTab.get();P(()=>ot(this.tabQuery.get()))!==e&&this.router.navigate(fn(this.studentId,e),{replace:!0}),this.loadTab(e),this.scrollActiveIntoView()})),this.track(b(()=>{this.ready.get()&&this.tabs?.syncOverflow()}))}render(){const e=this.wire(Cr,{back:{onclick:this.router.link("/students").onclick,textContent:()=>a("student.back")},loading:{textContent:()=>a("student.loading"),className:()=>this.student.loading.get()?"elevvy__loading":"elevvy__loading hidden"},errorBox:{className:()=>this.failed.get()?"elevvy__error":"elevvy__error hidden"},errorText:{textContent:()=>a("student.error")},retry:{textContent:()=>a("students.retry"),onclick:()=>{this.student.reset(),this.student.run(()=>v.students.get({id:this.studentId}))}},workspace:{className:()=>this.ready.get()?"elevvy__workspace":"elevvy__workspace hidden"},eyebrow:{textContent:()=>a("student.eyebrow")},relation:{textContent:()=>{const s=this.student.data.get();return s?cr(s.email):""}},book:{textContent:()=>a("student.book"),onclick:()=>this.router.navigate(bn(this.studentId))}});this.spawn(Xe,this.ref(e,"identity"),{name:()=>this.student.data.get()?.displayName??"",role:"student"}),this.buildMissing(this.ref(e,"missingHost")),this.tabsHost=this.ref(e,"tabsHost"),this.tabs=this.spawn(Ns,this.tabsHost,{active:this.activeTab,tabs:ks.map(s=>({key:s,label:()=>mn(s)}))});const t=this.ref(e,"panels");return t.appendChild(this.buildOverview()),t.appendChild(this.buildLessons()),t.appendChild(this.buildSessions()),t.appendChild(this.buildPlans()),t.appendChild(this.buildGoals()),t.appendChild(this.buildHorses()),t.appendChild(this.buildHistory()),e}buildMissing(e){const t=new B({heading:()=>a("student.notFound.heading"),body:()=>a("student.notFound.body"),action:{label:()=>a("student.notFound.action"),onclick:()=>this.router.navigate("/students")},headingLevel:2});t.mount(e),this.track(()=>t.destroy()),this.track(b(()=>{e.className=this.missing.get()?"elevvy__missing":"elevvy__missing hidden"}))}loadTab(e){switch(e){case"oversikt":this.lessons.runOnce(()=>v.lessons.list()),this.sessions.runOnce(()=>v.students.listTrainingSessions({id:this.studentId})),this.plans.runOnce(()=>v.students.listPlans({id:this.studentId})),this.goals.runOnce(()=>v.students.listGoals({id:this.studentId}));return;case"lektioner":this.lessons.runOnce(()=>v.lessons.list());return;case"pass":this.sessions.runOnce(()=>v.students.listTrainingSessions({id:this.studentId}));return;case"planer":this.plans.runOnce(()=>v.students.listPlans({id:this.studentId}));return;case"mal":this.goals.runOnce(()=>v.students.listGoals({id:this.studentId}));return;case"hastar":this.horses.runOnce(()=>v.students.listHorses({id:this.studentId}));return;case"historik":this.exercises.runOnce(()=>v.exercises.list())}}reloadTab(e){for(const t of this.sourcesFor(e))t.reset();this.loadTab(e)}sourcesFor(e){switch(e){case"oversikt":return[this.lessons,this.sessions,this.plans,this.goals];case"lektioner":return[this.lessons];case"pass":return[this.sessions];case"planer":return[this.plans];case"mal":return[this.goals];case"hastar":return[this.horses];case"historik":return[this.exercises]}}scrollActiveIntoView(){const e=()=>{this.tabsHost?.querySelector(".ui-tabs__tab.active")?.scrollIntoView({block:"nearest",inline:"nearest"}),this.tabs?.syncOverflow()};e(),typeof requestAnimationFrame=="function"&&requestAnimationFrame(e)}buildPanel(e){const t=e.source,s=()=>!t||!e.count?!1:t.resolved.get()&&t.error.get()===null&&e.count()===0,i=this.wireEl(Sr,{root:{className:()=>this.activeTab.get()===e.tab?"elevvy__panel":"elevvy__panel hidden","aria-label":()=>mn(e.tab)},lede:{textContent:()=>e.lede?.()??"",className:()=>e.lede?"elevvy__lede":"elevvy__lede hidden"},loading:{textContent:()=>a(`${e.prefix}.loading`),className:()=>t?.loading.get()&&!t.resolved.get()?"elevvy__loading":"elevvy__loading hidden"},errorBox:{className:()=>t?.error.get()?"elevvy__error":"elevvy__error hidden"},errorText:{textContent:()=>a(`${e.prefix}.error`)},retry:{textContent:()=>a("students.retry"),onclick:()=>this.reloadTab(e.tab)}}),r=this.ref(i,"emptyHost");if(e.count){const d=new B({heading:()=>a(`${e.prefix}.empty.heading`),body:()=>a(`${e.prefix}.empty.body`),...e.action?{action:e.action}:{},headingLevel:2});d.mount(r),this.track(()=>d.destroy()),this.track(b(()=>{r.className=s()?"elevvy__empty":"elevvy__empty hidden"}))}return{root:i,content:this.ref(i,"content")}}buildOverview(){const{root:e,content:t}=this.buildPanel({tab:"oversikt",prefix:"student.overview",source:null}),s=document.createElement("div");s.className="elevvy__cards",s.appendChild(this.card({label:()=>a("student.overview.nextLesson"),value:()=>{const g=this.lessons.data.get();if(this.lessons.error.get())return a("student.overview.unavailable");if(!g)return"…";const m=Ee(g,this.studentId,this.nowIso.get());return m?Ne(m.scheduledAt):a("student.overview.nextLesson.none")},meta:()=>{const g=this.lessons.data.get();if(!g)return"";const m=Ee(g,this.studentId,this.nowIso.get());return m?$e(m):""},href:()=>{const g=this.lessons.data.get();if(!g)return null;const m=Ee(g,this.studentId,this.nowIso.get());return m?`/lektioner/${m.id}`:null}})),s.appendChild(this.card({label:()=>a("student.overview.latestSession"),value:()=>{if(this.sessions.error.get())return a("student.overview.unavailable");const g=this.sessions.data.get();if(!g)return"…";const m=rt(g);return m?Ge(m.performedAt):a("student.overview.latestSession.none")},meta:()=>{const g=this.sessions.data.get(),m=g?rt(g):null;return m?Ce(m):""},href:()=>{const g=this.sessions.data.get(),m=g?rt(g):null;return m?`/traningspass/${m.id}`:null}})),s.appendChild(this.card({label:()=>a("student.overview.activePlans"),value:()=>{if(this.plans.error.get())return a("student.overview.unavailable");const g=this.plans.data.get();return g?ur(_n(g).length):"…"},meta:()=>"",href:()=>null})),s.appendChild(this.card({label:()=>a("student.overview.sharedGoals"),value:()=>{if(this.goals.error.get())return a("student.overview.unavailable");const g=this.goals.data.get();return g?gr(pr(g)):"…"},meta:()=>a("student.overview.sharedGoals.meta"),href:()=>null})),t.appendChild(s);const i=document.createElement("h2");i.className="elevvy__subheading",this.track(b(()=>{i.textContent=a("student.overview.activity")})),t.appendChild(i);const r=[this.lessons,this.sessions],d=new f(()=>r.some(g=>g.error.get()!==null)),c=new f(()=>r.every(g=>g.resolved.get())),h=document.createElement("p");h.className="elevvy__lede hidden",this.track(b(()=>{const g=fr({sourcesFailed:d.get(),sourcesAnswered:c.get(),count:this.activity.get().length});g!=="silent"&&(h.textContent=a(g==="unavailable"?"student.overview.unavailable":"student.overview.activity.empty")),h.className=g==="silent"?"elevvy__lede hidden":"elevvy__lede"})),t.appendChild(h);const p=document.createElement("ul");return p.className="elevvy__list",t.appendChild(p),this.$each(p,this.activity,g=>this.renderActivity(g),vr),e}card(e){const t=document.createElement("div"),s=()=>{const i=e.href(),r=document.createElement(i?"a":"div");r.className="elevvy__card",i&&(r.href=i,r.addEventListener("click",p=>{p.preventDefault(),this.router.navigate(i)}));const d=document.createElement("span");d.className="elevvy__card-label",d.textContent=e.label();const c=document.createElement("span");c.className="elevvy__card-value",c.textContent=e.value(),r.append(d,c);const h=e.meta();if(h){const p=document.createElement("span");p.className="elevvy__card-meta",p.textContent=h,r.appendChild(p)}return r};return this.track(b(()=>{t.replaceChildren(s())})),t}renderActivity(e){const t=document.createElement("li"),s=document.createElement("a");s.className="activity-row",s.href=e.href,s.addEventListener("click",c=>{c.preventDefault(),this.router.navigate(e.href)});const i=document.createElement("span");i.className="activity-row__kind",i.textContent=br(e.kind);const r=document.createElement("span");r.className="activity-row__title",r.textContent=e.title;const d=document.createElement("span");return d.className="activity-row__when",d.textContent=_r(e.at),s.append(i,r,d),t.appendChild(s),t}buildLessons(){const{root:e,content:t}=this.buildPanel({tab:"lektioner",prefix:"student.lessons",source:this.lessons,count:()=>this.myLessons.get().length,action:{label:()=>a("student.book"),onclick:()=>this.router.navigate(bn(this.studentId))}});for(const[s,i]of[["upcoming","lessons.group.upcoming"],["past","lessons.group.past"]]){const r=new f(()=>this.groupedLessons.get()[s]),d=document.createElement("section");d.className="elevvy__group";const c=document.createElement("h3");c.className="elevvy__group-label";const h=document.createElement("ul");h.className="elevvy__list",d.append(c,h),this.track(b(()=>{c.textContent=a(i),d.className=r.get().length===0?"elevvy__group hidden":"elevvy__group"})),this.$each(h,r,(p,g,m)=>this.renderLesson(p,m),p=>`${p.id}:${p.status}:${p.scheduledAt}`),t.appendChild(d)}return e}renderLesson(e,t){const s=document.createElement("li"),i=`/lektioner/${e.id}`,r=document.createElement("a");r.className=e.status==="cancelled"?"occ-row occ-row--cancelled":"occ-row",r.href=i,r.addEventListener("click",m=>{m.preventDefault(),this.router.navigate(i)}),r.appendChild(this.dateColumn(Wn(e.scheduledAt)));const d=document.createElement("span");d.className="occ-row__body";const c=document.createElement("span");c.className="occ-row__title",c.textContent=$e(e);const h=document.createElement("span");h.className="occ-row__meta",e.horseName&&h.appendChild(de(e.horseName)),h.appendChild(de(Xn(e.exercises))),d.append(c,h);const p=document.createElement("span");p.className="occ-row__chips",e.planTitle&&p.appendChild(dt(Be(e.planTitle)));for(const m of Yn(e))p.appendChild(dt(Lt(m)));const g=document.createElement("span");return g.className="occ-row__status",t(ct(g,Tt(e.status))),r.append(d,p,g),s.appendChild(r),s}buildSessions(){const{root:e,content:t}=this.buildPanel({tab:"pass",prefix:"student.sessions",source:this.sessions,count:()=>this.mySessions.get().length,lede:()=>a("student.sessions.lede")}),s=document.createElement("ul");return s.className="elevvy__list",t.appendChild(s),this.$each(s,this.mySessions,i=>this.renderSession(i),i=>`${i.id}:${i.updatedAt}`),e}renderSession(e){const t=document.createElement("li"),s=`/traningspass/${e.id}`,i=document.createElement("a");i.className="occ-row",i.href=s,i.addEventListener("click",g=>{g.preventDefault(),this.router.navigate(s)}),i.appendChild(this.dateColumn(Zn(e.performedAt)));const r=document.createElement("span");r.className="occ-row__body";const d=document.createElement("span");d.className="occ-row__title",d.textContent=Ce(e);const c=document.createElement("span");c.className="occ-row__meta";const h=It(e.durationMin);h&&c.appendChild(de(h)),e.horseName&&c.appendChild(de(e.horseName)),r.append(d,c);const p=document.createElement("span");return p.className="occ-row__chips",e.planTitle&&p.appendChild(dt(Be(e.planTitle))),i.append(r,p,document.createElement("span")),t.appendChild(i),t}buildPlans(){const{root:e,content:t}=this.buildPanel({tab:"planer",prefix:"student.plans",source:this.plans,count:()=>this.myPlans.get().length}),s=document.createElement("ul");return s.className="elevvy__list",t.appendChild(s),this.$each(s,this.myPlans,(i,r,d)=>this.renderPlan(i,d),i=>`${i.id}:${i.updatedAt}`),e}renderPlan(e,t){const s=document.createElement("li"),i=`/planer/${e.id}`,r=document.createElement("a");r.className="plain-row",r.href=i,r.addEventListener("click",_=>{_.preventDefault(),this.router.navigate(i)});const d=document.createElement("span");d.className="plain-row__body";const c=document.createElement("span");c.className="plain-row__title",c.textContent=e.title;const h=document.createElement("span");h.className="plain-row__meta";const p=Te(e.startDate,e.endDate);p&&h.appendChild(de(p));const g=We(e.primaryTeacherDisplayName);g&&h.appendChild(de(g)),d.append(c,h);const m=document.createElement("span");return t(ct(m,Et(e.status))),r.append(d,m),s.appendChild(r),s}buildGoals(){const{root:e,content:t}=this.buildPanel({tab:"mal",prefix:"student.goals",source:this.goals,count:()=>this.myGoals.get().length,lede:()=>a("student.goals.lede")}),s=document.createElement("ul");return s.className="elevvy__list",t.appendChild(s),this.$each(s,this.myGoals,(i,r,d)=>this.renderGoal(i,d),i=>`${i.id}:${i.status}:${i.updatedAt}`),e}renderGoal(e,t){const s=document.createElement("li"),i=`/mal/${e.id}`,r=document.createElement("a");r.className="plain-row",r.href=i,r.addEventListener("click",m=>{m.preventDefault(),this.router.navigate(i)});const d=document.createElement("span");d.className="plain-row__body";const c=document.createElement("span");c.className="plain-row__title",c.textContent=e.title;const h=document.createElement("span");h.className="plain-row__meta";const p=fe(e.targetDate);p&&h.appendChild(de(p)),d.append(c,h);const g=document.createElement("span");return t(ct(g,Ue(e.status))),r.append(d,g),s.appendChild(r),s}buildHorses(){const{root:e,content:t}=this.buildPanel({tab:"hastar",prefix:"student.horses",source:this.horses,count:()=>this.myHorses.get().length}),s=document.createElement("ul");return s.className="elevvy__horses",t.appendChild(s),this.$each(s,this.myHorses,i=>{const r=document.createElement("li");return r.className="elevvy__horse",r.textContent=i.name,r},i=>`${i.id}:${i.name}`),e}buildHistory(){const{root:e,content:t}=this.buildPanel({tab:"historik",prefix:"student.history",source:this.exercises,count:()=>(this.exercises.data.get()??[]).length,action:{label:()=>a("student.history.empty.action"),onclick:()=>this.router.navigate("/library")}}),s=document.createElement("div");s.className="elevvy__picker";const i=document.createElement("div");i.className="elevvy__picker-field";const r=document.createElement("span");r.className="elevvy__picker-label";const d=document.createElement("div");i.append(r,d);const c=document.createElement("button");c.type="button",c.className="elevvy__picker-open";const h=document.createElement("p");return h.className="elevvy__lede",this.track(b(()=>{r.textContent=a("student.history.field"),c.textContent=a("student.history.open"),c.disabled=this.historyPick.get()==="";const p=this.student.data.get();h.textContent=a("student.history.hint",{name:p?.displayName??""})})),c.addEventListener("click",()=>{const p=this.historyPick.get();p&&this.router.navigate(dr(this.studentId,p,fn(this.studentId,"historik")))}),this.spawn(D,d,{value:this.historyPick,options:new f(()=>(this.exercises.data.get()??[]).map(p=>({value:p.id,label:p.name}))),placeholder:a("student.history.placeholder")}),s.append(i,c),t.append(h,s),this.track(b(()=>{const p=(this.exercises.data.get()??[]).length>0;s.style.display=p?"":"none",h.className=p?"elevvy__lede":"elevvy__lede hidden"})),e}dateColumn(e){const t=document.createElement("span");t.className="occ-row__date";for(const[s,i]of[["day",e.day],["month",e.month],["time",e.time]]){const r=document.createElement("span");r.className=`occ-row__${s}`,r.textContent=i,t.appendChild(r)}return t}}function de(n){const e=document.createElement("span");return e.textContent=n,e}function dt(n){const e=document.createElement("span");return e.className="occ-row__chip",e.textContent=n,e.title=n,e}function ct(n,e){const t=new Z({label:e.label,variant:e.variant,tone:e.tone,...e.glyph===void 0?{}:{glyph:e.glyph}});return t.mount(n),()=>t.destroy()}function Nr(n){return typeof n=="object"&&n!==null&&typeof n.get=="function"}const K=n=>`var(--${n})`;class Pt extends ${static styles=`
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
            font-family: ${K("font-ui")};
            font-size: 0.875rem;
            line-height: 1.5;
            color: ${K("text")};
        }
        .ui-table__caption {
            font-family: ${K("font-display")};
            font-weight: 500;
            font-size: 1.25rem;
            line-height: 1.4;
            text-align: left;
            color: ${K("text")};
            padding-bottom: ${K("space-3")};
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
            font-family: ${K("font-ui")};
            font-size: 0.6875rem;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.14em;
            color: ${K("text-muted")};
            text-align: left;
            padding: ${K("space-2")} ${K("space-3")};
            border-bottom: 1px solid ${K("border-strong")};
            white-space: nowrap;
        }
        .ui-table__td {
            text-align: left;
            padding: ${K("space-3")};
            border-bottom: 1px solid ${K("border")};
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
            color: ${K("text-muted")};
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
                padding: ${K("space-3")} 0;
                border-bottom: 1px solid ${K("border")};
            }
            .ui-table--stacked .ui-table__tr:last-child {
                border-bottom: none;
            }
            .ui-table--stacked .ui-table__td {
                padding: ${K("space-1")} 0;
                border-bottom: none;
                white-space: normal;
            }
            .ui-table--stacked .ui-table__stacked-label {
                display: block;
                font-size: 0.6875rem;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 0.14em;
                color: ${K("text-muted")};
                margin-bottom: 2px;
            }
        }
    `;bodyEl;static seq=0;uid=`ui-table-${Pt.seq++}`;render(){const e=this.props.stacked!==!1,t=this.props.emptyCell??"—",s=document.createElement("div");s.className=e?"ui-table-wrap":"ui-table-wrap ui-table-wrap--scroll";const i=document.createElement("table");if(i.className=e?"ui-table ui-table--stacked":"ui-table",i.setAttribute("role","table"),this.props.caption!==void 0){const h=document.createElement("caption");h.className=this.props.captionHidden?"ui-table__caption ui-table__caption--hidden":"ui-table__caption",h.id=`${this.uid}-caption`,h.textContent=this.props.caption,i.appendChild(h),i.setAttribute("aria-labelledby",h.id)}const r=document.createElement("thead");r.className="ui-table__head",r.setAttribute("role","rowgroup");const d=document.createElement("tr");d.className="ui-table__tr",d.setAttribute("role","row");for(const h of this.props.columns){const p=document.createElement("th");p.className="ui-table__th",p.setAttribute("role","columnheader"),p.setAttribute("scope","col"),p.setAttribute("data-key",h.key),p.textContent=h.header,d.appendChild(p)}r.appendChild(d),i.appendChild(r),this.bodyEl=document.createElement("tbody"),this.bodyEl.className="ui-table__body",this.bodyEl.setAttribute("role","rowgroup"),i.appendChild(this.bodyEl);const c=h=>{if(this.bodyEl.textContent="",h.length!==0)for(const p of h){const g=document.createElement("tr");g.className="ui-table__tr",g.setAttribute("role","row"),this.props.rowKey&&g.setAttribute("data-row-key",this.props.rowKey(p));for(const m of this.props.columns){const _=m.type??"text",x=document.createElement("td");if(x.className=`ui-table__td ui-table__td--${_}`,x.setAttribute("role","cell"),x.setAttribute("data-key",m.key),m.stackedLabel!==!1){const E=document.createElement("span");E.className="ui-table__stacked-label",E.setAttribute("aria-hidden","true"),E.textContent=m.header,x.appendChild(E)}const C=m.cell(p);if(C instanceof HTMLElement)x.appendChild(C);else if(C==null||C===""){const E=document.createElement("span");E.className="ui-table__empty-cell",E.textContent=t,x.appendChild(E)}else{const E=document.createElement("span");E.textContent=String(C),x.appendChild(E)}g.appendChild(x)}this.bodyEl.appendChild(g)}};return Nr(this.props.rows)?this.track(b(()=>{c(this.props.rows.get())})):c(this.props.rows),s.appendChild(i),s}}const yn=n=>typeof n=="function"?n():n;class Le extends ${static styles=`
        .share-chip {
            display: inline-flex;
        }

        /* Shared = accent-tinted. The pill publishes its colour as one custom
           property, so this is a token swap rather than a restyle: shape,
           metrics and the ring all still come from StatusPill. */
        .share-chip--shared .ui-status-pill {
            --ui-pill-tone: ${o("accent-strong")};
            background: ${o("accent-soft")};
        }

        /* Private = neutral outline, which is StatusPill's default. Named here
           only so the two states read as a pair in this file. */
        .share-chip--private .ui-status-pill {
            --ui-pill-tone: ${o("text-muted")};
        }
    `;recipients(){return yn(this.props.recipients)}isShared(){return this.props.shared===void 0?this.recipients().length>0:yn(this.props.shared)}render(){const e=document.createElement(this.props.as??"span");return this.spawn(Z,e,{label:()=>xs(this.recipients(),this.isShared()),variant:"outline"}),this.track(b(()=>{const t=this.isShared();e.className=`share-chip share-chip--${t?"shared":"private"}`;const s=Bo(this.recipients(),t);s?e.setAttribute("title",s):e.removeAttribute("title")})),e}}class Qe{items=new u([]);loading=new u(!1);error=new u(null);async load(){const e=await w(this.loading,this.error,()=>v.exercises.list());e&&this.items.set(e)}async create(e){const t=await w(this.loading,this.error,()=>v.exercises.create(e));return t?(this.items.set([t,...this.items.get()]),t):null}async get(e){return await w(this.loading,this.error,()=>v.exercises.get({id:e}))??null}async update(e,t){const s=await w(this.loading,this.error,()=>v.exercises.update({id:e,...t}));return s?(this.items.set(this.items.get().map(i=>i.id===e?s:i)),s):null}async archive(e){return await w(this.loading,this.error,()=>v.exercises.delete({id:e}))?(this.items.set(this.items.get().filter(s=>s.id!==e)),!0):!1}}function Tr(n){const e=n.split("/");return e.length===6&&e[1]==="students"&&e[3]==="exercises"&&e[5]==="history"&&e[2]&&e[4]?{studentId:e[2],exerciseId:e[4]}:null}function xn(n,e){return n&&n.startsWith("/")&&!n.startsWith("//")?n:e?`/library/${e.exerciseId}`:"/students"}function Lr(n){return n??a("exerciseHistory.standalone")}function Ir(n){return[...n.notes].sort((e,t)=>e.createdAt.localeCompare(t.createdAt))}function Ar(n){return n.visibility==="shared"?a("exerciseHistory.note.shared"):a("exerciseHistory.note.private")}function Hr(n){return[...n].sort((e,t)=>t.scheduledAt.localeCompare(e.scheduledAt)).map(e=>({key:e.lessonExerciseId,dateLabel:Ke(e.scheduledAt),scheduledAt:e.scheduledAt,lessonHref:`/lektioner/${e.lessonId}`,sourceLabel:Lr(e.sourceProgramTitle),rowNote:e.rowNotes&&e.rowNotes.trim()!==""?e.rowNotes:null,notes:Ir(e)}))}function Or(n){return n.resolved?n.unreachable?"unreachable":n.found?n.count===0?"empty":"rows":"notFound":"loading"}function wn(n){return n==="network"||n==="timeout"}const zr=S(`
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
`);class Pr extends ${static styles=`
        .ex-history {
            display: flex;
            flex-direction: column;
            gap: ${l("lg")};
            font-family: ${o("font-ui")};

            & .ex-history__back {
                font-size: 0.875rem;
                color: ${o("text-muted")};
                text-decoration: none;
                align-self: flex-start;
                &:hover { color: ${o("accent-strong")}; text-decoration: underline; }
                &:focus-visible { outline: 2px solid ${o("accent")}; outline-offset: 2px; }
            }

            & .ex-history__head.hidden { display: none; }

            & .ex-history__eyebrow {
                margin: 0 0 ${l("xs")};
                font-size: 0.6875rem;
                line-height: 16px;
                font-weight: 700;
                letter-spacing: 0.14em;
                text-transform: uppercase;
                color: ${o("text-muted")};
            }

            /* Lora 500, and only 500 — UI_DECISIONS §3. */
            & .ex-history__title {
                margin: 0;
                font-family: ${o("font-display")};
                font-weight: 500;
                font-size: 1.75rem;
                line-height: 36px;
                color: ${o("text")};
                overflow-wrap: anywhere;
            }

            & .ex-history__subtitle {
                margin: ${l("xs")} 0 0;
                font-size: 0.9375rem;
                color: ${o("text")};
            }
            & .ex-history__scope {
                margin: ${l("sm")} 0 0;
                font-size: 0.8125rem;
                line-height: 1.6;
                color: ${o("text-muted")};
                max-width: 68ch;
            }

            & .ex-history__loading {
                margin: 0;
                color: ${o("text-muted")};
                font-size: 0.875rem;
            }
            & .ex-history__loading.hidden { display: none; }

            & .ex-history__table.hidden { display: none; }

            /* The date cell is a link to the Lesson (§3.16). It stays in the
               UI font and keeps the column's tabular figures — the table sets
               those on the cell, so the anchor inherits them. */
            & .ex-history__date-link {
                color: ${o("accent")};
                text-decoration: none;
                font-variant-numeric: tabular-nums;
                &:hover { color: ${o("accent-strong")}; text-decoration: underline; }
                &:focus-visible { outline: 2px solid ${o("accent")}; outline-offset: 2px; }
            }

            & .ex-history__note-list {
                list-style: none;
                margin: 0;
                padding: 0;
                display: flex;
                flex-direction: column;
                gap: ${l("sm")};
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
                gap: ${l("xs")} ${l("sm")};
                font-size: 0.75rem;
                color: ${o("text-muted")};
            }
            & .ex-history__note-author { font-weight: 600; color: ${o("text")}; }
            & .ex-history__note-body {
                white-space: pre-wrap;
                overflow-wrap: anywhere;
                color: ${o("text")};
            }
            /* The teacher's hairline brass rule (§4.7), carried over so an
               instruction still reads apart from a reflection in this view. */
            & .ex-history__note--teacher {
                padding-left: ${l("sm")};
                border-left: 2px solid ${o("brass-line")};
            }

            @media (max-width: 639px) {
                & .ex-history__title { font-size: 1.375rem; line-height: 30px; }
            }
        }
    `;router=this.inject(L);auth=this.inject(ne);students=this.inject(be);library=this.inject(Qe);entries=new u([]);exerciseName=new u("");studentName=new u("");studentId=new u("");resolved=new u(!1);found=new u(!1);unreachable=new u(!1);ids=Tr(this.router.route.peek());rows=new f(()=>Hr(this.entries.get()));state=new f(()=>Or({resolved:this.resolved.get(),found:this.found.get(),unreachable:this.unreachable.get(),count:this.entries.get().length}));onMount(){this.load()}async load(){const e=this.ids;if(!e){this.found.set(!1),this.resolved.set(!0);return}this.studentId.set(e.studentId),this.resolved.set(!1),this.unreachable.set(!1);const[t,s,i]=await Promise.all([this.students.get(e.studentId),this.library.get(e.exerciseId),this.students.exerciseHistory(e.studentId,e.exerciseId)]);!t||!s||i===null?(this.unreachable.set(wn(this.students.error.peek()?.code)||wn(this.library.error.peek()?.code)),this.found.set(!1)):(this.studentName.set(t.displayName),this.exerciseName.set(s.name),this.entries.set(i),this.found.set(!0)),this.resolved.set(!0)}render(){const e=this.wire(zr,{back:{href:"#",textContent:()=>a("exerciseHistory.back"),onclick:t=>{t.preventDefault(),this.router.navigate(xn(this.router.query("from").get(),this.ids))}},eyebrow:{textContent:()=>a("exerciseHistory.eyebrow")},title:{textContent:()=>this.exerciseName.get()},subtitle:{textContent:()=>{const t=this.studentName.get();return t?a("exerciseHistory.subtitle",{student:t}):""}},scope:{textContent:()=>this.state.get()==="rows"?a("exerciseHistory.scope"):""},loading:{textContent:()=>a("exerciseHistory.loading"),className:()=>this.state.get()==="loading"?"ex-history__loading":"ex-history__loading hidden"},tableHost:{className:()=>this.state.get()==="rows"?"ex-history__table":"ex-history__table hidden"}});return this.buildStates(this.ref(e,"stateHost")),this.buildTable(this.ref(e,"tableHost")),e}buildStates(e){let t=null;this.track(b(()=>{const s=this.state.get();if(t?.destroy(),t=null,e.replaceChildren(),s!=="empty"&&s!=="notFound"&&s!=="unreachable")return;const i=s==="empty"?{heading:"exerciseHistory.empty.heading",body:"exerciseHistory.empty.body",action:"exerciseHistory.empty.action",onclick:()=>this.router.navigate(xn(P(()=>this.router.query("from").get()),this.ids))}:s==="unreachable"?{heading:"exerciseHistory.unreachable.heading",body:"exerciseHistory.unreachable.body",action:"exerciseHistory.unreachable.action",onclick:()=>{this.load()}}:{heading:"exerciseHistory.notFound.heading",body:"exerciseHistory.notFound.body",action:"exerciseHistory.notFound.action",onclick:()=>this.router.navigate("/students")};t=P(()=>{const r=new B({heading:()=>a(i.heading),body:()=>a(i.body),action:{label:()=>a(i.action),onclick:i.onclick},headingLevel:2});return r.mount(e),r})})),this.track(()=>t?.destroy())}buildTable(e){const t=[{key:"date",header:a("exerciseHistory.col.date"),type:"date",stackedLabel:!1,cell:s=>this.dateCell(s)},{key:"occasion",header:a("exerciseHistory.col.occasion"),cell:s=>this.occasionCell(s)},{key:"rowNote",header:a("exerciseHistory.col.rowNote"),cell:s=>s.rowNote},{key:"notes",header:a("exerciseHistory.col.notes"),cell:s=>this.notesCell(s)}];this.spawn(Pt,e,{columns:t,rows:this.rows,caption:a("exerciseHistory.caption"),captionHidden:!0,rowKey:s=>s.key,stacked:!0})}dateCell(e){const t=document.createElement("a");return t.className="ex-history__date-link",t.href=e.lessonHref,t.textContent=e.dateLabel,t.setAttribute("aria-label",a("exerciseHistory.openLesson",{date:e.dateLabel})),t.addEventListener("click",s=>{s.preventDefault(),this.router.navigate(e.lessonHref)}),t}occasionCell(e){const t=document.createElement("span"),s=new Z({label:e.sourceLabel,variant:"outline",tone:"neutral"});return s.mount(t),this.track(()=>s.destroy()),t}notesCell(e){if(e.notes.length===0)return null;const t=document.createElement("ul");t.className="ex-history__note-list";for(const s of e.notes)t.appendChild(this.noteItem(s));return t}noteItem(e){const t=document.createElement("li"),s=e.authorId===this.studentId.peek();t.className=s?"ex-history__note":"ex-history__note ex-history__note--teacher";const i=document.createElement("span");i.className="ex-history__note-meta";const r=document.createElement("span");r.className="ex-history__note-author",r.textContent=e.authorDisplayName,i.appendChild(r);const d=document.createElement("span");d.textContent=ws(e.createdAt),i.appendChild(d);const c=document.createElement("span"),h=this.auth.currentUser.peek()?.id===this.studentId.peek(),p=e.visibility==="shared"&&!h?[{id:this.studentId.peek(),name:this.studentName.peek()}]:[],g=new Le({recipients:p,shared:e.visibility==="shared"});g.mount(c),this.track(()=>g.destroy()),c.title=Ar(e),i.appendChild(c);const m=document.createElement("span");return m.className="ex-history__note-body",m.textContent=e.body,t.append(i,m),t}}const Dr=S('<div bind="host"></div>');class jr extends ${router=this.inject(L);key=new f(()=>{const e=this.router.route.get();return e==="/students"?"list":/^\/students\/[^/]+\/exercises\/[^/]+\/history$/.test(e)?"history":"detail"});render(){const e=this.wire(Dr,{});return this.$swap(this.ref(e,"host"),this.key,{list:wr,detail:Er,history:Pr}),e}}const Ts=["ovningar","program"],Ls="ovningar";function ye(n){return Ts.includes(n)?n:Ls}function Vr(n){return n===Ls?"/library":`/library?flik=${n}`}const Fr={ovningar:"library.tab.exercises",program:"library.tab.programs"};function Rr(n){return a(Fr[n])}const Mr="/library?flik=program",ht=140;function Is(n){const e=(n??"").trim().replace(/\s+/g," ");if(e==="")return"";if(e.length<=ht)return e;const t=e.slice(0,ht),s=t.lastIndexOf(" ");return`${(s>ht-24?t.slice(0,s):t).trimEnd()}…`}const Br=8;function Gr(n){return n>=Br}function kn(n){return n.normalize("NFD").replace(new RegExp("\\p{Diacritic}","gu"),"").toLocaleLowerCase("sv")}function Kr(n,e){const t=kn(e.trim());return t===""?!0:kn(n).includes(t)}function qr(n,e){return e.trim()===""?[...n]:n.filter(t=>Kr(`${t.name} ${t.description}`,e))}function Ur(n){return n.failed?"error":n.loading?"loading":n.total===0?"empty":n.visible===0?"noMatches":"rows"}function Wr(n,e){const t=encodeURIComponent(`/library/${e}`);return`/students/${n}/exercises/${e}/history?from=${t}`}function Yr(n){return V("program.exerciseCount",n)}function Xr(n){return`${n.id}:${n.name}:${n.description}`}const Qr=S(`
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
`);class Jr extends ${static styles=`
        .ex-list {
            & .ex-list__bar {
                display: flex;
                align-items: flex-end;
                justify-content: space-between;
                gap: ${l("lg")};
                flex-wrap: wrap;
                margin-bottom: ${l("lg")};
            }

            & .ex-list__search {
                display: flex;
                flex-direction: column;
                gap: ${l("xs")};
                flex: 1 1 18rem;
                max-width: 26rem;
            }
            & .ex-list__search.hidden { display: none; }
            & .ex-list__search-label {
                font-family: ${o("font-ui")};
                font-size: 0.8125rem;
                font-weight: 600;
                color: ${o("text")};
            }
            /* The one field in the app that is NOT in a card: it belongs to the
               list's toolbar, on the page surface, where a panel around a single
               search box would announce itself louder than the rows it filters.
               So it keeps a raised fill instead of the recipe's recessed --bg,
               which on this background would leave nothing but the borders. */
            & .ex-list__search-input {
                ${R()}
                background: ${o("surface")};
                width: 100%;
                box-sizing: border-box;
            }

            /* Buttons are Open Sans territory; the serif is forbidden here. */
            & .ex-list__create {
                ${k(o("radius-sm"),"primary")}
                margin-left: auto;
            }

            & .ex-list__loading {
                margin: 0;
                font-family: ${o("font-ui")};
                color: ${o("text-muted")};
                font-size: 0.875rem;
            }
            & .ex-list__loading.hidden { display: none; }

            & .ex-list__error {
                display: flex;
                align-items: center;
                gap: ${l("md")};
                flex-wrap: wrap;
                padding: ${l("md")};
                margin-bottom: ${l("lg")};
                border: 1px solid ${o("danger")};
                border-radius: ${o("radius-md")};
                background: ${o("danger-soft")};

                & .ex-list__error-text {
                    margin: 0;
                    font-family: ${o("font-ui")};
                    font-size: 0.875rem;
                    color: ${o("text")};
                }
                & .ex-list__retry { ${k()} }
            }
            & .ex-list__error.hidden { display: none; }

            & .ex-list__list {
                list-style: none;
                margin: 0;
                padding: 0;
                /* No zebra striping (§4.3): rows are separated by a hairline. */
                border-top: 1px solid ${o("border")};
            }
            & .ex-list__list:empty { border-top: none; }
            & .ex-list__list.hidden { display: none; }
            & .ex-list__list > li { border-bottom: 1px solid ${o("border")}; }

            & .ex-row {
                display: flex;
                flex-direction: column;
                gap: ${l("xs")};
                padding: ${l("md")} ${l("sm")};
                text-decoration: none;
                color: inherit;
                font-family: ${o("font-ui")};

                &:hover { background: ${o("surface-2")}; }
                &:focus-visible { outline: 2px solid ${o("accent")}; outline-offset: -2px; }
            }
            & .ex-row__name {
                font-size: 0.9375rem;
                font-weight: 600;
                color: ${o("text")};
                overflow-wrap: anywhere;
            }
            & .ex-row__excerpt {
                font-size: 0.8125rem;
                line-height: 1.5;
                color: ${o("text-muted")};
                overflow-wrap: anywhere;
            }

            @media (max-width: 639px) {
                & .ex-list__bar { flex-direction: column; align-items: stretch; }
                & .ex-list__create { margin-left: 0; }
            }
        }
    `;router=this.inject(L);svc=this.inject(Qe);query=new u("");resolved=new u(!1);failed=new f(()=>this.svc.error.get()!==null);visible=new f(()=>qr(this.svc.items.get(),this.query.get()));state=new f(()=>Ur({loading:!this.resolved.get()||this.svc.loading.get(),failed:this.failed.get(),total:this.svc.items.get().length,visible:this.visible.get().length}));onMount(){this.load()}async load(){await this.svc.load(),this.resolved.set(!0)}render(){const e=this.wire(Qr,{searchField:{className:()=>Gr(this.svc.items.get().length)?"ex-list__search":"ex-list__search hidden"},searchLabel:{textContent:()=>a("library.search.label")},searchInput:{value:()=>this.query.get(),placeholder:()=>a("library.search.placeholder"),oninput:t=>this.query.set(t.target.value)},create:{textContent:()=>a("library.create"),onclick:()=>this.router.navigate("/library/nytt")},loading:{textContent:()=>a("library.loading"),className:()=>this.state.get()==="loading"?"ex-list__loading":"ex-list__loading hidden"},errorBox:{className:()=>this.state.get()==="error"?"ex-list__error":"ex-list__error hidden"},errorText:{textContent:()=>a("library.error")},retry:{textContent:()=>a("library.retry"),onclick:()=>{this.load()}},list:{className:()=>this.state.get()==="rows"?"ex-list__list":"ex-list__list hidden"}});return this.buildEmpty(this.ref(e,"emptyHost"),"empty",{heading:"library.empty.heading",body:"library.empty.body",action:"library.empty.action",onclick:()=>this.router.navigate("/library/nytt")}),this.buildEmpty(this.ref(e,"noMatchesHost"),"noMatches",{heading:"library.noMatches.heading",body:"library.noMatches.body",action:"library.noMatches.action",onclick:()=>this.query.set("")}),this.$each(this.ref(e,"list"),this.visible,t=>this.renderRow(t),Xr),e}buildEmpty(e,t,s){let i=null;this.track(b(()=>{const r=this.state.get()===t;i?.destroy(),i=null,e.replaceChildren(),r&&(i=P(()=>{const d=new B({heading:()=>a(s.heading),body:()=>a(s.body),action:{label:()=>a(s.action),onclick:s.onclick},headingLevel:2});return d.mount(e),d}))})),this.track(()=>i?.destroy())}renderRow(e){const t=document.createElement("li"),s=`/library/${e.id}`,i=document.createElement("a");i.className="ex-row",i.href=s,i.addEventListener("click",c=>{c.preventDefault(),this.router.navigate(s)});const r=document.createElement("span");r.className="ex-row__name",r.textContent=e.name,i.appendChild(r);const d=Is(e.description);if(d){const c=document.createElement("span");c.className="ex-row__excerpt",c.textContent=d,i.appendChild(c)}return t.appendChild(i),t}}class Ie{items=new u([]);loading=new u(!1);error=new u(null);exercises=new u([]);availableExercises=new u([]);async load(){const e=await w(this.loading,this.error,()=>v.programs.list());e&&this.items.set(e)}async create(e){const t=await w(this.loading,this.error,()=>v.programs.create(e));return t?(this.items.set([t,...this.items.get()]),t):null}async get(e){return await w(this.loading,this.error,()=>v.programs.get({id:e}))??null}async update(e,t){const s=await w(this.loading,this.error,()=>v.programs.update({id:e,...t}));return s?(this.items.set(this.items.get().map(i=>i.id===e?s:i)),s):null}async archive(e){return await w(this.loading,this.error,()=>v.programs.delete({id:e}))?(this.items.set(this.items.get().filter(s=>s.id!==e)),!0):!1}async exercisesOf(e){return v.programs.listExercises({id:e})}async loadExercises(e){const t=await w(this.loading,this.error,()=>v.programs.listExercises({id:e}));this.exercises.set(t??[])}async loadAvailableExercises(){const e=await w(this.loading,this.error,()=>v.exercises.list());return e?(this.availableExercises.set(e),!0):!1}async addExerciseToProgram(e,t){return await w(this.loading,this.error,()=>v.programs.addExercise({id:e,exerciseId:t}))?(await this.loadExercises(e),!0):!1}async reorderExercises(e,t){return await w(this.loading,this.error,()=>v.programs.reorderExercises({id:e,exerciseIds:t}))?(await this.loadExercises(e),!0):!1}async updateExerciseNotes(e,t,s){return await w(this.loading,this.error,()=>v.programs.updateExerciseNotes({id:e,exerciseId:t,notes:s}))?(await this.loadExercises(e),!0):!1}async removeExercise(e,t){return await w(this.loading,this.error,()=>v.programs.removeExercise({id:e,exerciseId:t}))?(await this.loadExercises(e),!0):!1}}const Zr=S(`
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
`);class el extends ${static styles=`
        .pr-list {
            & .pr-list__bar {
                display: flex;
                justify-content: flex-end;
                margin-bottom: ${l("lg")};
            }

            /*
             * Buttons are Open Sans territory; the serif is forbidden here.
             * This tab has exactly one thing to offer besides reading, so it
             * carries the primary tier.
             */
            & .pr-list__create { ${k(o("radius-sm"),"primary")} }

            & .pr-list__loading {
                margin: 0;
                font-family: ${o("font-ui")};
                color: ${o("text-muted")};
                font-size: 0.875rem;
            }
            & .pr-list__loading.hidden { display: none; }

            & .pr-list__error {
                display: flex;
                align-items: center;
                gap: ${l("md")};
                flex-wrap: wrap;
                padding: ${l("md")};
                margin-bottom: ${l("lg")};
                border: 1px solid ${o("danger")};
                border-radius: ${o("radius-md")};
                background: ${o("danger-soft")};

                & .pr-list__error-text {
                    margin: 0;
                    font-family: ${o("font-ui")};
                    font-size: 0.875rem;
                    color: ${o("text")};
                }
                /* Retry is secondary: recovering from a failure is not the
                   thing this tab is for. */
                & .pr-list__retry { ${k()} }
            }
            & .pr-list__error.hidden { display: none; }

            & .pr-list__list {
                list-style: none;
                margin: 0;
                padding: 0;
                /* No zebra striping (§4.3): rows are separated by a hairline. */
                border-top: 1px solid ${o("border")};
            }
            & .pr-list__list:empty { border-top: none; }
            & .pr-list__list.hidden { display: none; }
            & .pr-list__list > li { border-bottom: 1px solid ${o("border")}; }

            & .pr-row {
                display: grid;
                grid-template-columns: minmax(0, 1fr) auto;
                align-items: start;
                gap: ${l("lg")};
                padding: ${l("md")} ${l("sm")};
                text-decoration: none;
                color: inherit;
                font-family: ${o("font-ui")};

                &:hover { background: ${o("surface-2")}; }
                &:focus-visible { outline: 2px solid ${o("accent")}; outline-offset: -2px; }
            }
            & .pr-row__body {
                display: flex;
                flex-direction: column;
                gap: ${l("xs")};
                min-width: 0;
            }
            & .pr-row__title {
                font-size: 0.9375rem;
                font-weight: 600;
                color: ${o("text")};
                overflow-wrap: anywhere;
            }
            & .pr-row__excerpt {
                font-size: 0.8125rem;
                line-height: 1.5;
                color: ${o("text-muted")};
                overflow-wrap: anywhere;
            }
            & .pr-row__count {
                font-size: 0.8125rem;
                color: ${o("text-muted")};
                white-space: nowrap;
            }

            @media (max-width: 639px) {
                & .pr-list__bar { justify-content: stretch; & button { width: 100%; } }
                & .pr-row { grid-template-columns: minmax(0, 1fr); gap: ${l("xs")}; }
            }
        }
    `;router=this.inject(L);svc=this.inject(Ie);resolved=new u(!1);failed=new f(()=>this.svc.error.get()!==null);isLoading=new f(()=>!this.failed.get()&&(!this.resolved.get()||this.svc.loading.get()));isEmpty=new f(()=>!this.failed.get()&&this.resolved.get()&&!this.svc.loading.get()&&this.svc.items.get().length===0);hasRows=new f(()=>!this.failed.get()&&this.resolved.get()&&this.svc.items.get().length>0);counts=new u({});onMount(){this.load()}async load(){await this.svc.load(),this.resolved.set(!0),await this.loadCounts()}async loadCounts(){const e=this.svc.items.peek(),t=await Promise.allSettled(e.map(async i=>[i.id,(await this.svc.exercisesOf(i.id)).length])),s={};for(const i of t)i.status==="fulfilled"&&(s[i.value[0]]=i.value[1]);this.counts.set(s)}render(){const e=this.wire(Zr,{create:{textContent:()=>a("programs.create"),onclick:()=>this.router.navigate("/program/nytt")},loading:{textContent:()=>a("programs.loading"),className:()=>this.isLoading.get()?"pr-list__loading":"pr-list__loading hidden"},errorBox:{className:()=>this.failed.get()?"pr-list__error":"pr-list__error hidden"},errorText:{textContent:()=>a("programs.error")},retry:{textContent:()=>a("programs.retry"),onclick:()=>{this.load()}},list:{className:()=>this.hasRows.get()?"pr-list__list":"pr-list__list hidden"}});return this.buildEmpty(this.ref(e,"emptyHost")),this.$each(this.ref(e,"list"),this.svc.items,(t,s,i)=>this.renderRow(t,i),t=>`${t.id}:${t.title}:${t.description}`),e}buildEmpty(e){let t=null;this.track(b(()=>{const s=this.isEmpty.get();t?.destroy(),t=null,e.replaceChildren(),s&&(t=P(()=>{const i=new B({heading:()=>a("programs.empty.heading"),body:()=>a("programs.empty.body"),action:{label:()=>a("programs.empty.action"),onclick:()=>this.router.navigate("/program/nytt")},headingLevel:2});return i.mount(e),i}))})),this.track(()=>t?.destroy())}renderRow(e,t){const s=document.createElement("li"),i=`/program/${e.id}`,r=document.createElement("a");r.className="pr-row",r.href=i,r.addEventListener("click",g=>{g.preventDefault(),this.router.navigate(i)});const d=document.createElement("span");d.className="pr-row__body";const c=document.createElement("span");c.className="pr-row__title",c.textContent=e.title,d.appendChild(c);const h=Is(e.description);if(h){const g=document.createElement("span");g.className="pr-row__excerpt",g.textContent=h,d.appendChild(g)}const p=document.createElement("span");return p.className="pr-row__count",t(b(()=>{const g=this.counts.get()[e.id];p.textContent=g===void 0?"":Yr(g)})),r.append(d,p),s.appendChild(r),s}}const tl=S(`
    <div class="bibliotek">
        <header class="bibliotek__head">
            <h1 bind="heading" class="bibliotek__title"></h1>
        </header>
        <div bind="tabsHost" class="bibliotek__tabs"></div>
        <div bind="panelHost" class="bibliotek__panel"></div>
    </div>
`);class nl extends ${static styles=`
        .bibliotek {
            & .bibliotek__head {
                display: flex;
                align-items: baseline;
                justify-content: space-between;
                gap: ${l("lg")};
                flex-wrap: wrap;
                margin-bottom: ${l("lg")};
            }

            /* Lora 500, and only 500 — UI_DECISIONS §3. */
            & .bibliotek__title {
                margin: 0;
                font-family: ${o("font-display")};
                font-weight: 500;
                font-size: 1.75rem;
                line-height: 36px;
                color: ${o("text")};
            }

            /* Two tabs never overflow, but the row still scrolls rather than
               wraps below 640px (UI_DECISIONS §6) so it behaves like every
               other tab row in the app. */
            & .bibliotek__tabs {
                margin-bottom: ${l("xl")};
                overflow-x: auto;
                scrollbar-width: none;
                &::-webkit-scrollbar { display: none; }
                & .ui-tabs { min-width: max-content; }
            }

            @media (max-width: 639px) {
                & .bibliotek__title { font-size: 1.375rem; line-height: 30px; }
            }
        }
    `;router=this.inject(L);tabQuery=this.router.query("flik");activeTab=new u(ye(this.tabQuery.peek()));panelKey=new f(()=>ye(this.activeTab.get()));onMount(){this.track(b(()=>{const e=ye(this.tabQuery.get());this.activeTab.peek()!==e&&this.activeTab.set(e)})),this.track(b(()=>{const e=ye(this.activeTab.get());P(()=>ye(this.tabQuery.get()))!==e&&this.router.navigate(Vr(e),{replace:!0})}))}render(){const e=this.wire(tl,{heading:{textContent:()=>a("library.heading")}});return this.spawn(Ns,this.ref(e,"tabsHost"),{active:this.activeTab,tabs:Ts.map(t=>({key:t,label:Rr(t)}))}),this.$swap(this.ref(e,"panelHost"),this.panelKey,{ovningar:Jr,program:el}),e}}const sl=S(`
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
`);class il extends ${static styles=`
        .ex-create {
            display: flex;
            flex-direction: column;
            gap: ${l("lg")};
            max-width: 34rem;
            font-family: ${o("font-ui")};

            & .ex-create__back {
                font-size: 0.875rem;
                color: ${o("text-muted")};
                text-decoration: none;
                &:hover { color: ${o("accent-strong")}; text-decoration: underline; }
                &:focus-visible { outline: 2px solid ${o("accent")}; outline-offset: 2px; }
            }

            /* Lora 500 only (UI_DECISIONS §3). */
            & .ex-create__title {
                margin: 0;
                font-family: ${o("font-display")};
                font-weight: 500;
                font-size: 1.75rem;
                line-height: 36px;
                color: ${o("text")};
            }

            /*
             * The fields sit in a panel, not loose on the page. The §4.8 field
             * recipe fills with --bg — the page-paper colour — so a form
             * rendered straight onto the route would give the field the same
             * colour as everything behind it. The panel is what the recessed
             * fill is recessed INTO. §4.8's own example shows the same thing.
             */
            & .ex-create__panel {
                ${q()}
                box-sizing: border-box;
                padding: ${l("xl")};
                display: flex;
                flex-direction: column;
                gap: ${l("lg")};
            }

            & .ex-create__field {
                display: flex;
                flex-direction: column;
                gap: ${l("xs")};
            }

            & .ex-create__label {
                font-size: 0.8125rem;
                font-weight: 600;
                color: ${o("text")};
            }

            & .ex-create__hint {
                font-size: 0.8125rem;
                line-height: 1.5;
                color: ${o("text-muted")};
                max-width: 68ch;
            }

            & .ex-create__field-error {
                font-size: 0.8125rem;
                line-height: 1.5;
                color: ${o("danger")};
            }
            & .ex-create__field-error:empty { display: none; }

            & .ex-create__input, & .ex-create__textarea {
                ${R()}
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
                color: ${o("danger")};
            }

            & .ex-create__actions {
                display: flex;
                gap: ${l("sm")};
                flex-wrap: wrap;
            }
            & .ex-create__submit { ${k(o("radius-sm"),"primary")} }
            /* Avbryt leaves without writing anything; it must not read as a
               second offer beside the one action that creates the exercise. */
            & .ex-create__cancel { ${k(o("radius-sm"),"ghost")} }

            @media (max-width: 639px) {
                & .ex-create__actions { flex-direction: column; align-items: stretch; }
                & .ex-create__title { font-size: 1.375rem; line-height: 30px; }
            }
        }
    `;router=this.inject(L);svc=this.inject(Qe);toasts=this.inject(U);nameVal=new u("");descVal=new u("");touched=new u(!1);render(){return this.wire(sl,{back:{onclick:this.router.link("/library").onclick,textContent:()=>a("exercise.back")},heading:{textContent:()=>a("exerciseCreate.heading")},nameLabel:{textContent:()=>a("exerciseCreate.field.name")},nameHint:{textContent:()=>a("exerciseCreate.field.name.hint")},nameInput:{value:()=>this.nameVal.get(),"aria-invalid":()=>String(this.touched.get()&&this.nameVal.get().trim()===""),oninput:e=>this.nameVal.set(e.target.value)},nameError:{textContent:()=>this.touched.get()&&this.nameVal.get().trim()===""?a("exercise.error.name"):""},descLabel:{textContent:()=>a("exerciseCreate.field.description")},descHint:{textContent:()=>a("exerciseCreate.field.description.hint")},descInput:{value:()=>this.descVal.get(),oninput:e=>this.descVal.set(e.target.value)},error:{textContent:()=>this.svc.error.get()?a("exercise.saveError"):""},submit:{textContent:()=>a("exerciseCreate.submit"),disabled:()=>this.svc.loading.get()},cancel:{textContent:()=>a("exerciseCreate.cancel"),onclick:()=>this.router.navigate("/library")},form:{onsubmit:e=>{this.submit(e)}}})}async submit(e){e.preventDefault();const t=this.nameVal.get().trim();if(this.touched.set(!0),!t)return;const s=await this.svc.create({name:t,description:this.descVal.get().trim()});s&&(this.toasts.show({message:a("exerciseCreate.created"),variant:"success"}),this.router.navigate(`/library/${s.id}`))}}const al=S(`
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
`);class ol extends ${static styles=`
        .ex-detail {
            display: flex;
            flex-direction: column;
            gap: ${l("lg")};
            max-width: 40rem;
            font-family: ${o("font-ui")};

            & .ex-detail__back {
                font-size: 0.875rem;
                color: ${o("text-muted")};
                text-decoration: none;
                align-self: flex-start;
                &:hover { color: ${o("accent-strong")}; text-decoration: underline; }
                &:focus-visible { outline: 2px solid ${o("accent")}; outline-offset: 2px; }
            }

            & .ex-detail__loading {
                margin: 0;
                color: ${o("text-muted")};
                font-size: 0.875rem;
            }
            & .ex-detail__loading.hidden { display: none; }

            & .ex-detail__body {
                display: flex;
                flex-direction: column;
                gap: ${l("xl")};
            }
            & .ex-detail__body.hidden { display: none; }

            & .ex-detail__eyebrow {
                margin: 0 0 ${l("xs")};
                font-size: 0.6875rem;
                line-height: 16px;
                font-weight: 700;
                letter-spacing: 0.14em;
                text-transform: uppercase;
                color: ${o("text-muted")};
            }

            /* Lora 500, and only 500 — UI_DECISIONS §3. */
            & .ex-detail__title {
                margin: 0;
                font-family: ${o("font-display")};
                font-weight: 500;
                font-size: 1.75rem;
                line-height: 36px;
                color: ${o("text")};
                overflow-wrap: anywhere;
            }

            /* Section headings are the serif too, one step down (§02). */
            & .ex-detail__section-title, & .ex-detail__danger-title {
                margin: 0 0 ${l("sm")};
                font-family: ${o("font-display")};
                font-weight: 500;
                font-size: 1.25rem;
                line-height: 28px;
                color: ${o("text")};
            }

            & .ex-detail__section-body {
                margin: 0 0 ${l("md")};
                font-size: 0.8125rem;
                line-height: 1.6;
                color: ${o("text-muted")};
                max-width: 68ch;
            }
            & .ex-detail__section-body.hidden { display: none; }

            & .ex-detail__form {
                display: flex;
                flex-direction: column;
                gap: ${l("lg")};
            }
            /*
             * The fields sit in a panel, not loose on the page. The §4.8 field
             * recipe fills with --bg — the page-paper colour — so a form
             * rendered straight onto the route would give the field the same
             * colour as everything behind it. The panel is what the recessed
             * fill is recessed INTO. §4.8's own example shows the same thing.
             */
            & .ex-detail__panel {
                ${q()}
                box-sizing: border-box;
                padding: ${l("xl")};
                display: flex;
                flex-direction: column;
                gap: ${l("lg")};
            }

            & .ex-detail__field {
                display: flex;
                flex-direction: column;
                gap: ${l("xs")};
            }
            & .ex-detail__label {
                font-size: 0.8125rem;
                font-weight: 600;
                color: ${o("text")};
            }
            & .ex-detail__field-error {
                font-size: 0.8125rem;
                line-height: 1.5;
                color: ${o("danger")};
            }
            & .ex-detail__field-error:empty { display: none; }

            & .ex-detail__input, & .ex-detail__textarea {
                ${R()}
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
                color: ${o("danger")};
            }

            & .ex-detail__actions { display: flex; gap: ${l("sm")}; flex-wrap: wrap; }
            & .ex-detail__save { ${k(o("radius-sm"),"primary")} }
            /* Öppna historik is a navigation offer in its own section, not the
               form's action — secondary keeps the single primary unambiguous. */
            & .ex-detail__secondary { ${k()} }

            & .ex-detail__history-picker {
                display: flex;
                gap: ${l("sm")};
                align-items: center;
                flex-wrap: wrap;
                & > div { flex: 1 1 14rem; }
                & .ui-select { display: block; }
            }
            & .ex-detail__history-picker.hidden { display: none; }

            /* §3.5: the destructive action lives in a SEPARATED area — its own
               surface behind a rule, not another button in the form's row. */
            & .ex-detail__danger {
                padding-top: ${l("lg")};
                border-top: 1px solid ${o("border")};
            }
            & .ex-detail__danger-title { color: ${o("danger")}; }
            & .ex-detail__danger-action { ${k(o("radius-sm"),"danger")} }

            @media (max-width: 639px) {
                & .ex-detail__title { font-size: 1.375rem; line-height: 30px; }
                & .ex-detail__history-picker { flex-direction: column; align-items: stretch; }
            }
        }
    `;router=this.inject(L);svc=this.inject(Qe);students=this.inject(be);toasts=this.inject(U);nameVal=new u("");descVal=new u("");touched=new u(!1);resolved=new u(!1);found=new u(!1);studentVal=new u("");confirmArchive=new u(!1);rosterState=new f(()=>this.students.error.get()!==null?"error":this.students.resolved.get()?this.students.items.get().length>0?"ready":"none":"loading");hasStudents=new f(()=>this.rosterState.get()==="ready");studentOptions=new f(()=>this.students.items.get().map(e=>({value:e.id,label:e.displayName})));get exerciseId(){return this.router.route.get().split("/")[2]??""}onMount(){this.students.load(),this.svc.get(this.exerciseId).then(e=>{e&&(this.nameVal.set(e.name),this.descVal.set(e.description),this.found.set(!0)),this.resolved.set(!0)})}render(){const e=this.wire(al,{back:{onclick:this.router.link("/library").onclick,textContent:()=>a("exercise.back")},loading:{textContent:()=>a("exercise.loading"),className:()=>this.resolved.get()?"ex-detail__loading hidden":"ex-detail__loading"},body:{className:()=>this.resolved.get()&&this.found.get()?"ex-detail__body":"ex-detail__body hidden"},eyebrow:{textContent:()=>a("exercise.eyebrow")},title:{textContent:()=>this.nameVal.get()},nameLabel:{textContent:()=>a("exercise.field.name")},nameInput:{value:()=>this.nameVal.get(),"aria-invalid":()=>String(this.touched.get()&&this.nameVal.get().trim()===""),oninput:s=>this.nameVal.set(s.target.value)},nameError:{textContent:()=>this.touched.get()&&this.nameVal.get().trim()===""?a("exercise.error.name"):""},descLabel:{textContent:()=>a("exercise.field.description")},descInput:{value:()=>this.descVal.get(),oninput:s=>this.descVal.set(s.target.value)},error:{textContent:()=>this.svc.error.get()?a("exercise.saveError"):""},save:{textContent:()=>a("exercise.save"),disabled:()=>this.svc.loading.get()},form:{onsubmit:s=>{this.save(s)}},historyHeading:{textContent:()=>a("exercise.history.heading")},historyBody:{textContent:()=>a("exercise.history.body"),className:()=>this.hasStudents.get()?"ex-detail__section-body":"ex-detail__section-body hidden"},historyPicker:{className:()=>this.hasStudents.get()?"ex-detail__history-picker":"ex-detail__history-picker hidden",inert:()=>!this.hasStudents.get()},historyNone:{textContent:()=>{switch(this.rosterState.get()){case"error":return a("exercise.history.rosterError");case"loading":return a("exercise.history.rosterLoading");case"none":return a("exercise.history.noStudents");default:return""}},className:()=>this.hasStudents.get()?"ex-detail__section-body hidden":"ex-detail__section-body"},historyOpen:{textContent:()=>a("exercise.history.open"),disabled:()=>this.studentVal.get()==="",onclick:()=>{const s=this.studentVal.get();s&&this.router.navigate(Wr(s,this.exerciseId))}},dangerHeading:{textContent:()=>a("exercise.danger.heading")},dangerBody:{textContent:()=>a("exercise.danger.body")},archive:{textContent:()=>a("exercise.danger.action"),onclick:()=>this.confirmArchive.set(!0)}});this.spawn(D,this.ref(e,"studentHost"),{value:this.studentVal,options:this.studentOptions,placeholder:a("exercise.history.placeholder")}),this.buildMissing(this.ref(e,"missingHost"));const t=this.ref(e,"confirmHost");return this.spawn(J,t,{open:this.confirmArchive,title:a("exercise.confirm.archive.title"),message:()=>a("exercise.confirm.archive.message"),confirmLabel:a("exercise.danger.action"),cancelLabel:a("exercise.confirm.dismiss"),danger:!0,onconfirm:()=>{this.archive()}}),this.track(b(()=>{t.inert=!this.confirmArchive.get()})),e}buildMissing(e){let t=null;this.track(b(()=>{const s=this.resolved.get()&&!this.found.get();t?.destroy(),t=null,e.replaceChildren(),s&&(t=P(()=>{const i=new B({heading:()=>a("exercise.notFound.heading"),body:()=>a("exercise.notFound.body"),action:{label:()=>a("exercise.notFound.action"),onclick:()=>this.router.navigate("/library")},headingLevel:2});return i.mount(e),i}))})),this.track(()=>t?.destroy())}async save(e){e.preventDefault();const t=this.nameVal.get().trim();this.touched.set(!0),!(!t||!await this.svc.update(this.exerciseId,{name:t,description:this.descVal.get().trim()}))&&this.toasts.show({message:a("exercise.saved"),variant:"success"})}async archive(){await this.svc.archive(this.exerciseId)&&(this.toasts.show({message:a("exercise.archived"),variant:"success"}),this.router.navigate("/library"))}}const rl=S('<div bind="host"></div>'),ll=S("<div></div>");let dl=class extends ${render(){return this.wire(ll,{})}};class cl extends ${router=this.inject(L);key=new f(()=>{const e=this.router.route.get();return e==="/library"?"bibliotek":e==="/library/nytt"?"create":e.startsWith("/library/")?"detail":"none"});render(){const e=this.wire(rl,{});return this.$swap(this.ref(e,"host"),this.key,{bibliotek:nl,create:il,detail:ol,none:dl}),e}}class pe{items=new u([]);loading=new u(!1);error=new u(null);async load(){const e=await w(this.loading,this.error,()=>v.horses.list());e&&this.items.set(e)}async create(e){const t=await w(this.loading,this.error,()=>v.horses.create(e));return t?(this.items.set([t,...this.items.get()]),t):null}async get(e){return await w(this.loading,this.error,()=>v.horses.get({id:e}))??null}async update(e,t){const s=await w(this.loading,this.error,()=>v.horses.update({id:e,...t}));return s?(this.items.set(this.items.get().map(i=>i.id===e?s:i)),s):null}async archive(e){return await w(this.loading,this.error,()=>v.horses.delete({id:e}))?(this.items.set(this.items.get().filter(s=>s.id!==e)),!0):!1}}function hl(n){return n.filter(e=>e.archivedAt===null).sort((e,t)=>t.createdAt.localeCompare(e.createdAt))}function pl(n){return`${n.id}:${n.name}`}function ul(n){return n.failed?"error":n.loading?"loading":n.count===0?"empty":"rows"}const gl=S(`
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
`);class ml extends ${static styles=`
        .stable {
            & .stable__head {
                display: flex;
                align-items: baseline;
                justify-content: space-between;
                gap: ${l("lg")};
                flex-wrap: wrap;
                margin-bottom: ${l("xl")};
            }

            /* Lora 500, and only 500 — UI_DECISIONS §3. */
            & .stable__title {
                margin: 0;
                font-family: ${o("font-display")};
                font-weight: 500;
                font-size: 1.75rem;
                line-height: 36px;
                color: ${o("text")};
            }

            /* Buttons are Open Sans territory; the serif is forbidden here. */
            & .stable__create { ${k(o("radius-sm"),"primary")} }

            & .stable__loading {
                margin: 0;
                font-family: ${o("font-ui")};
                color: ${o("text-muted")};
                font-size: 0.875rem;
            }
            & .stable__loading.hidden { display: none; }

            & .stable__error {
                display: flex;
                align-items: center;
                gap: ${l("md")};
                flex-wrap: wrap;
                padding: ${l("md")};
                margin-bottom: ${l("lg")};
                border: 1px solid ${o("danger")};
                border-radius: ${o("radius-md")};
                background: ${o("danger-soft")};

                & .stable__error-text {
                    margin: 0;
                    font-family: ${o("font-ui")};
                    font-size: 0.875rem;
                    color: ${o("text")};
                }
                & .stable__retry { ${k()} }
            }
            & .stable__error.hidden { display: none; }

            & .stable__list {
                list-style: none;
                margin: 0;
                padding: 0;
                /* No zebra striping (§4.3): rows are separated by a hairline. */
                border-top: 1px solid ${o("border")};
            }
            & .stable__list:empty { border-top: none; }
            & .stable__list.hidden { display: none; }
            & .stable__list > li { border-bottom: 1px solid ${o("border")}; }

            & .horse-row {
                display: block;
                padding: ${l("md")} ${l("sm")};
                text-decoration: none;
                color: ${o("text")};
                font-family: ${o("font-ui")};
                font-size: 0.9375rem;
                font-weight: 600;
                overflow-wrap: anywhere;

                &:hover { background: ${o("surface-2")}; }
                &:focus-visible { outline: 2px solid ${o("accent")}; outline-offset: -2px; }
            }

            @media (max-width: 639px) {
                & .stable__title { font-size: 1.375rem; line-height: 30px; }
                & .stable__head { flex-direction: column; align-items: stretch; }
            }
        }
    `;router=this.inject(L);svc=this.inject(pe);resolved=new u(!1);horses=new f(()=>hl(this.svc.items.get()));state=new f(()=>ul({loading:!this.resolved.get()||this.svc.loading.get(),failed:this.svc.error.get()!==null,count:this.horses.get().length}));onMount(){this.load()}async load(){await this.svc.load(),this.resolved.set(!0)}render(){const e=this.wire(gl,{heading:{textContent:()=>a("stable.heading")},create:{textContent:()=>a("stable.create"),onclick:()=>this.router.navigate("/hastar/nytt")},loading:{textContent:()=>a("stable.loading"),className:()=>this.state.get()==="loading"?"stable__loading":"stable__loading hidden"},errorBox:{className:()=>this.state.get()==="error"?"stable__error":"stable__error hidden"},errorText:{textContent:()=>a("stable.error")},retry:{textContent:()=>a("stable.retry"),onclick:()=>{this.load()}},list:{className:()=>this.state.get()==="rows"?"stable__list":"stable__list hidden"}});return this.buildEmpty(this.ref(e,"emptyHost")),this.$each(this.ref(e,"list"),this.horses,t=>this.renderRow(t),pl),e}buildEmpty(e){let t=null;this.track(b(()=>{const s=this.state.get()==="empty";t?.destroy(),t=null,e.replaceChildren(),s&&(t=P(()=>{const i=new B({heading:()=>a("stable.empty.heading"),body:()=>a("stable.empty.body"),action:{label:()=>a("stable.empty.action"),onclick:()=>this.router.navigate("/hastar/nytt")},headingLevel:2});return i.mount(e),i}))})),this.track(()=>t?.destroy())}renderRow(e){const t=document.createElement("li"),s=`/hastar/${e.id}`,i=document.createElement("a");return i.className="horse-row",i.href=s,i.textContent=e.name,i.addEventListener("click",r=>{r.preventDefault(),this.router.navigate(s)}),t.appendChild(i),t}}const fl=S(`
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
`);class bl extends ${static styles=`
        .horse-create {
            display: flex;
            flex-direction: column;
            gap: ${l("lg")};
            max-width: 34rem;
            font-family: ${o("font-ui")};

            & .horse-create__back {
                font-size: 0.875rem;
                color: ${o("text-muted")};
                text-decoration: none;
                &:hover { color: ${o("accent-strong")}; text-decoration: underline; }
                &:focus-visible { outline: 2px solid ${o("accent")}; outline-offset: 2px; }
            }

            /* Lora 500 only (UI_DECISIONS §3). */
            & .horse-create__title {
                margin: 0;
                font-family: ${o("font-display")};
                font-weight: 500;
                font-size: 1.75rem;
                line-height: 36px;
                color: ${o("text")};
            }

            /*
             * The fields sit in a panel, not loose on the page. The §4.8 field
             * recipe fills with --bg — the page-paper colour — so a form
             * rendered straight onto the route would give the field the same
             * colour as everything behind it. The panel is what the recessed
             * fill is recessed INTO. §4.8's own example shows the same thing.
             */
            & .horse-create__panel {
                ${q()}
                box-sizing: border-box;
                padding: ${l("xl")};
                display: flex;
                flex-direction: column;
                gap: ${l("lg")};
            }

            & .horse-create__field { display: flex; flex-direction: column; gap: ${l("xs")}; }
            & .horse-create__label {
                font-size: 0.8125rem;
                font-weight: 600;
                color: ${o("text")};
            }
            & .horse-create__hint {
                font-size: 0.8125rem;
                line-height: 1.5;
                color: ${o("text-muted")};
                max-width: 68ch;
            }
            & .horse-create__field-error {
                font-size: 0.8125rem;
                line-height: 1.5;
                color: ${o("danger")};
            }
            & .horse-create__field-error:empty { display: none; }

            & .horse-create__input {
                ${R()}
                width: 100%;
                box-sizing: border-box;
            }

            & .horse-create__error {
                margin: 0;
                min-height: 1em;
                font-size: 0.875rem;
                color: ${o("danger")};
            }

            & .horse-create__actions { display: flex; gap: ${l("sm")}; flex-wrap: wrap; }
            & .horse-create__submit { ${k(o("radius-sm"),"primary")} }
            /* Avbryt walks away from the form; it must not read as a second
               offer beside the one action that saves the horse. */
            & .horse-create__cancel { ${k(o("radius-sm"),"ghost")} }

            @media (max-width: 639px) {
                & .horse-create__actions { flex-direction: column; align-items: stretch; }
                & .horse-create__title { font-size: 1.375rem; line-height: 30px; }
            }
        }
    `;router=this.inject(L);svc=this.inject(pe);toasts=this.inject(U);nameVal=new u("");touched=new u(!1);render(){return this.wire(fl,{back:{onclick:this.router.link("/hastar").onclick,textContent:()=>a("horse.back")},heading:{textContent:()=>a("horseCreate.heading")},nameLabel:{textContent:()=>a("horseCreate.field.name")},nameHint:{textContent:()=>a("horseCreate.field.name.hint")},nameInput:{value:()=>this.nameVal.get(),"aria-invalid":()=>String(this.touched.get()&&this.nameVal.get().trim()===""),oninput:e=>this.nameVal.set(e.target.value)},nameError:{textContent:()=>this.touched.get()&&this.nameVal.get().trim()===""?a("horse.error.name"):""},error:{textContent:()=>this.svc.error.get()?a("horse.saveError"):""},submit:{textContent:()=>a("horseCreate.submit"),disabled:()=>this.svc.loading.get()},cancel:{textContent:()=>a("horseCreate.cancel"),onclick:()=>this.router.navigate("/hastar")},form:{onsubmit:e=>{this.submit(e)}}})}async submit(e){e.preventDefault();const t=this.nameVal.get().trim();this.touched.set(!0),!(!t||!await this.svc.create({name:t}))&&(this.toasts.show({message:a("horseCreate.created"),variant:"success"}),this.router.navigate("/hastar"))}}const _l=S(`
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
`);class vl extends ${static styles=`
        .horse-edit {
            display: flex;
            flex-direction: column;
            gap: ${l("lg")};
            max-width: 34rem;
            font-family: ${o("font-ui")};

            & .horse-edit__back {
                font-size: 0.875rem;
                color: ${o("text-muted")};
                text-decoration: none;
                align-self: flex-start;
                &:hover { color: ${o("accent-strong")}; text-decoration: underline; }
                &:focus-visible { outline: 2px solid ${o("accent")}; outline-offset: 2px; }
            }

            & .horse-edit__loading {
                margin: 0;
                color: ${o("text-muted")};
                font-size: 0.875rem;
            }
            & .horse-edit__loading.hidden { display: none; }

            & .horse-edit__body { display: flex; flex-direction: column; gap: ${l("xl")}; }
            & .horse-edit__body.hidden { display: none; }

            & .horse-edit__eyebrow {
                margin: 0 0 ${l("xs")};
                font-size: 0.6875rem;
                line-height: 16px;
                font-weight: 700;
                letter-spacing: 0.14em;
                text-transform: uppercase;
                color: ${o("text-muted")};
            }

            /* Lora 500, and only 500 — UI_DECISIONS §3. */
            & .horse-edit__title {
                margin: 0;
                font-family: ${o("font-display")};
                font-weight: 500;
                font-size: 1.75rem;
                line-height: 36px;
                color: ${o("text")};
                overflow-wrap: anywhere;
            }
            & .horse-edit__danger-title {
                margin: 0 0 ${l("sm")};
                font-family: ${o("font-display")};
                font-weight: 500;
                font-size: 1.25rem;
                line-height: 28px;
                color: ${o("danger")};
            }

            & .horse-edit__form { display: flex; flex-direction: column; gap: ${l("lg")}; }

            /*
             * The fields sit in a panel, not loose on the page. The §4.8 field
             * recipe fills with --bg — the page-paper colour — so a form
             * rendered straight onto the route would give the field the same
             * colour as everything behind it. The panel is what the recessed
             * fill is recessed INTO. §4.8's own example shows the same thing.
             */
            & .horse-edit__panel {
                ${q()}
                box-sizing: border-box;
                padding: ${l("xl")};
                display: flex;
                flex-direction: column;
                gap: ${l("lg")};
            }

            & .horse-edit__field { display: flex; flex-direction: column; gap: ${l("xs")}; }
            & .horse-edit__label {
                font-size: 0.8125rem;
                font-weight: 600;
                color: ${o("text")};
            }
            & .horse-edit__field-error {
                font-size: 0.8125rem;
                line-height: 1.5;
                color: ${o("danger")};
            }
            & .horse-edit__field-error:empty { display: none; }

            & .horse-edit__input {
                ${R()}
                width: 100%;
                box-sizing: border-box;
            }

            & .horse-edit__error {
                margin: 0;
                min-height: 1em;
                font-size: 0.875rem;
                color: ${o("danger")};
            }

            & .horse-edit__actions { display: flex; gap: ${l("sm")}; flex-wrap: wrap; }
            & .horse-edit__save { ${k(o("radius-sm"),"primary")} }

            /* §3.15: archive lives in a SEPARATED danger area, behind a rule —
               not as a second button in the save row, where a mis-aimed click
               costs a horse. */
            & .horse-edit__danger {
                padding-top: ${l("lg")};
                border-top: 1px solid ${o("border")};
            }
            & .horse-edit__danger-body {
                margin: 0 0 ${l("md")};
                font-size: 0.8125rem;
                line-height: 1.6;
                color: ${o("text-muted")};
                max-width: 68ch;
            }
            & .horse-edit__danger-action { ${k(o("radius-sm"),"danger")} }

            @media (max-width: 639px) {
                & .horse-edit__title { font-size: 1.375rem; line-height: 30px; }
            }
        }
    `;router=this.inject(L);svc=this.inject(pe);toasts=this.inject(U);nameVal=new u("");touched=new u(!1);resolved=new u(!1);found=new u(!1);confirmArchive=new u(!1);get horseId(){return this.router.route.get().split("/")[2]??""}onMount(){this.svc.get(this.horseId).then(e=>{e&&(this.nameVal.set(e.name),this.found.set(!0)),this.resolved.set(!0)})}render(){const e=this.wire(_l,{back:{onclick:this.router.link("/hastar").onclick,textContent:()=>a("horse.back")},loading:{textContent:()=>a("horse.loading"),className:()=>this.resolved.get()?"horse-edit__loading hidden":"horse-edit__loading"},body:{className:()=>this.resolved.get()&&this.found.get()?"horse-edit__body":"horse-edit__body hidden"},eyebrow:{textContent:()=>a("horse.eyebrow")},title:{textContent:()=>this.nameVal.get()},nameLabel:{textContent:()=>a("horse.field.name")},nameInput:{value:()=>this.nameVal.get(),"aria-invalid":()=>String(this.touched.get()&&this.nameVal.get().trim()===""),oninput:s=>this.nameVal.set(s.target.value)},nameError:{textContent:()=>this.touched.get()&&this.nameVal.get().trim()===""?a("horse.error.name"):""},error:{textContent:()=>this.svc.error.get()?a("horse.saveError"):""},save:{textContent:()=>a("horse.save"),disabled:()=>this.svc.loading.get()},form:{onsubmit:s=>{this.save(s)}},dangerHeading:{textContent:()=>a("horse.danger.heading")},dangerBody:{textContent:()=>a("horse.danger.body")},archive:{textContent:()=>a("horse.danger.action"),onclick:()=>this.confirmArchive.set(!0)}});this.buildMissing(this.ref(e,"missingHost"));const t=this.ref(e,"confirmHost");return this.spawn(J,t,{open:this.confirmArchive,title:a("horse.confirm.archive.title"),message:()=>a("horse.confirm.archive.message"),confirmLabel:a("horse.danger.action"),cancelLabel:a("horse.confirm.dismiss"),danger:!0,onconfirm:()=>{this.archive()}}),this.track(b(()=>{t.inert=!this.confirmArchive.get()})),e}buildMissing(e){let t=null;this.track(b(()=>{const s=this.resolved.get()&&!this.found.get();t?.destroy(),t=null,e.replaceChildren(),s&&(t=P(()=>{const i=new B({heading:()=>a("horse.notFound.heading"),body:()=>a("horse.notFound.body"),action:{label:()=>a("horse.notFound.action"),onclick:()=>this.router.navigate("/hastar")},headingLevel:2});return i.mount(e),i}))})),this.track(()=>t?.destroy())}async save(e){e.preventDefault();const t=this.nameVal.get().trim();this.touched.set(!0),!(!t||!await this.svc.update(this.horseId,{name:t}))&&this.toasts.show({message:a("horse.saved"),variant:"success"})}async archive(){await this.svc.archive(this.horseId)&&(this.toasts.show({message:a("horse.archived"),variant:"success"}),this.router.navigate("/hastar"))}}const yl=S('<div bind="host"></div>');class xl extends ${router=this.inject(L);key=new f(()=>{const e=this.router.route.get();return e==="/hastar"?"list":e==="/hastar/nytt"?"create":"detail"});render(){const e=this.wire(yl,{});return this.$swap(this.ref(e,"host"),this.key,{list:ml,create:bl,detail:vl}),e}}class Dt{items=new u([]);loading=new u(!1);error=new u(null);async load(){const e=await w(this.loading,this.error,()=>v.lessons.list());e&&this.items.set(e)}async create(e){const[t,...s]=e.programIds??[],i=await w(this.loading,this.error,()=>v.lessons.create({studentId:e.studentId,scheduledAt:e.scheduledAt,...e.planId?{planId:e.planId}:{},...t?{programId:t}:{}}));if(!i)return null;let r=null;const d=async c=>{await w(this.loading,this.error,c)===void 0&&!r&&(r=this.error.get())};for(const c of s)await d(()=>v.lessons.attachProgram({id:i.id,programId:c}));return e.horseId&&await d(()=>v.lessons.update({id:i.id,horseId:e.horseId})),await this.load(),r&&this.error.set(r),{lesson:i,incomplete:r!==null}}async loadOne(e){const t=await w(this.loading,this.error,()=>v.lessons.get({id:e}));if(!t)return null;const s=this.items.get(),i=s.findIndex(r=>r.id===e);return this.items.set(i===-1?[...s,t]:[...s.slice(0,i),t,...s.slice(i+1)]),t}get(e){return this.items.get().find(t=>t.id===e)??null}async update(e,t){const s=await w(this.loading,this.error,()=>v.lessons.update({id:e,...t}));return s?(await this.load(),s):null}async addExercise(e,t){const s=await w(this.loading,this.error,()=>v.lessons.addExercise({id:e,exerciseId:t}));return s?(await this.load(),s):null}async removeExercise(e,t){const s=await w(this.loading,this.error,()=>v.lessons.removeExercise({id:e,exerciseId:t}));return s?(await this.load(),s):null}async attachProgram(e,t){const s=await w(this.loading,this.error,()=>v.lessons.attachProgram({id:e,programId:t}));return s?(await this.load(),s):null}async detachProgram(e,t){const s=await w(this.loading,this.error,()=>v.lessons.detachProgram({id:e,programId:t}));return s?(await this.load(),s):null}async transition(e,t){const s=await w(this.loading,this.error,()=>v.lessons.transition({id:e,target:t}));return s?(await this.load(),s):null}}const wl=S(`
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
`);class kl extends ${static styles=`
        .lessons {
            & .lessons__head {
                display: flex;
                align-items: baseline;
                justify-content: space-between;
                gap: ${l("lg")};
                flex-wrap: wrap;
                margin-bottom: ${l("xl")};
            }

            /* Lora 500, and only 500 — UI_DECISIONS §3. */
            & .lessons__title {
                margin: 0;
                font-family: ${o("font-display")};
                font-weight: 500;
                font-size: 1.75rem;
                line-height: 36px;
                color: ${o("text")};
            }

            /* Buttons are Open Sans territory; the serif is forbidden here. */
            & .lessons__book { ${k(o("radius-sm"),"primary")} }
            & .lessons__book.hidden { display: none; }

            & .lessons__loading {
                margin: 0;
                color: ${o("text-muted")};
                font-size: 0.875rem;
            }
            & .lessons__loading.hidden { display: none; }

            & .lessons__error {
                display: flex;
                align-items: center;
                gap: ${l("md")};
                flex-wrap: wrap;
                padding: ${l("md")};
                margin-bottom: ${l("lg")};
                border: 1px solid ${o("danger")};
                border-radius: ${o("radius-md")};
                background: ${o("danger-soft")};

                & .lessons__error-text { margin: 0; font-size: 0.875rem; color: ${o("text")}; }
                & .lessons__retry { ${k()} }
            }
            & .lessons__error.hidden { display: none; }

            & .lessons__group { margin-bottom: ${l("xl")}; }
            & .lessons__group.hidden { display: none; }

            /* Uppercase group label — letterspaced, never the serif (§4.3). */
            & .lessons__group-label {
                margin: 0 0 ${l("md")};
                font-family: ${o("font-ui")};
                font-size: 0.6875rem;
                line-height: 16px;
                font-weight: 700;
                letter-spacing: 0.14em;
                text-transform: uppercase;
                color: ${o("text-muted")};
            }

            & .lessons__list {
                list-style: none;
                margin: 0;
                padding: 0;
                /* No zebra striping (§4.3): rows are separated by a hairline. */
                border-top: 1px solid ${o("border")};
            }
            & .lessons__list > li { border-bottom: 1px solid ${o("border")}; }

            & .lesson-row {
                display: grid;
                grid-template-columns: auto minmax(0, 1fr) auto auto;
                align-items: start;
                gap: ${l("lg")};
                padding: ${l("md")} ${l("sm")};
                text-decoration: none;
                color: inherit;
                font-family: ${o("font-ui")};

                &:hover { background: ${o("surface-2")}; }
                &:focus-visible { outline: 2px solid ${o("accent")}; outline-offset: -2px; }
            }

            /* Cancelled is muted but READABLE (IA §3.7) — text-muted rather than
               an opacity wash, so the row keeps its contrast against the page
               instead of fading toward it. The dashed status pill and its ✕ are
               what carry the meaning; the dimming only ranks the row. */
            & .lesson-row--cancelled {
                & .lesson-row__title, & .lesson-row__day, & .lesson-row__time { color: ${o("text-muted")}; }
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
                color: ${o("text")};
            }
            & .lesson-row__month {
                font-size: 0.6875rem;
                font-weight: 700;
                letter-spacing: 0.12em;
                color: ${o("text-muted")};
            }
            & .lesson-row__time {
                margin-top: 2px;
                font-size: 0.8125rem;
                color: ${o("text-muted")};
            }

            & .lesson-row__body {
                display: flex;
                flex-direction: column;
                gap: ${l("xs")};
                min-width: 0;
            }
            & .lesson-row__title {
                font-size: 0.9375rem;
                font-weight: 600;
                color: ${o("text")};
                overflow-wrap: anywhere;
            }
            /* One meta line, not four — §4.3 allows at most two rows of text. */
            & .lesson-row__meta {
                display: flex;
                align-items: baseline;
                flex-wrap: wrap;
                gap: ${l("xs")} ${l("sm")};
                font-size: 0.8125rem;
                color: ${o("text-muted")};
            }

            & .lesson-row__chips {
                display: flex;
                flex-wrap: wrap;
                gap: ${l("xs")};
                justify-content: flex-end;
                max-width: 16rem;
            }
            /* Row chips are labels, not links: a nested anchor inside the row's
               own anchor is invalid, and §4.3 wants the row to have exactly one
               target. The clickable parent chips live in the detail header. */
            & .lesson-row__chip {
                display: inline-flex;
                align-items: center;
                padding: 2px ${l("sm")};
                border: 1px solid ${o("border")};
                border-radius: ${o("radius-pill")};
                font-size: 0.75rem;
                font-weight: 600;
                line-height: 1.4;
                color: ${o("text-muted")};
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
                    gap: ${l("sm")};
                }
                & .lesson-row__date {
                    flex-direction: row;
                    align-items: baseline;
                    gap: ${l("xs")};
                    width: auto;
                }
                & .lesson-row__day { font-size: 1rem; }
                & .lesson-row__body { grid-column: 1 / -1; }
                & .lesson-row__chips { grid-column: 1 / -1; justify-content: flex-start; max-width: none; }
            }
        }
    `;router=this.inject(L);lessons=this.inject(Dt);students=this.inject(be);nowIso=new u(new Date().toISOString());grouped=new f(()=>Un(this.lessons.items.get(),this.nowIso.get()));upcoming=new f(()=>this.grouped.get().upcoming);past=new f(()=>this.grouped.get().past);canBook=new f(()=>this.students.items.get().length>0);isEmpty=new f(()=>this.lessons.items.get().length===0&&!this.lessons.loading.get()&&this.lessons.error.get()===null);onMount(){this.lessons.load(),this.students.load()}render(){const e=this.wire(wl,{heading:{textContent:()=>a("lessons.heading")},upcomingLabel:{textContent:()=>a("lessons.group.upcoming")},pastLabel:{textContent:()=>a("lessons.group.past")},book:{textContent:()=>a("lessons.book"),className:()=>this.canBook.get()?"lessons__book":"lessons__book hidden",onclick:()=>this.router.navigate("/lektioner/ny")},loading:{textContent:()=>a("lessons.loading"),className:()=>this.lessons.loading.get()&&this.lessons.items.get().length===0?"lessons__loading":"lessons__loading hidden"},errorBox:{className:()=>this.lessons.error.get()?"lessons__error":"lessons__error hidden"},errorText:{textContent:()=>a("lessons.error")},retry:{textContent:()=>a("lessons.retry"),onclick:()=>{this.lessons.load()}},upcomingSection:{className:()=>this.upcoming.get().length===0?"lessons__group hidden":"lessons__group"},pastSection:{className:()=>this.past.get().length===0?"lessons__group hidden":"lessons__group"}});return this.buildEmpty(this.ref(e,"emptyHost")),this.$each(this.ref(e,"upcomingList"),this.upcoming,(t,s,i)=>this.renderRow(t,i),hn),this.$each(this.ref(e,"pastList"),this.past,(t,s,i)=>this.renderRow(t,i),hn),e}buildEmpty(e){const t=document.createElement("div");e.appendChild(t);let s=null;this.track(b(()=>{const i=this.isEmpty.get(),r=this.canBook.get();s?.destroy(),s=null,t.replaceChildren(),i&&(s=P(()=>{const d=new B(r?{heading:()=>a("lessons.empty.teacher.heading"),body:()=>a("lessons.empty.teacher.body"),action:{label:()=>a("lessons.book"),onclick:()=>this.router.navigate("/lektioner/ny")},headingLevel:2}:{heading:()=>a("lessons.empty.rider.heading"),body:()=>a("lessons.empty.rider.body"),action:{label:()=>a("lessons.empty.rider.action"),onclick:()=>this.router.navigate("/students")},headingLevel:2});return d.mount(t),d}))})),this.track(()=>s?.destroy())}renderRow(e,t){const s=document.createElement("li"),i=`/lektioner/${e.id}`,r=document.createElement("a");r.className=e.status==="cancelled"?"lesson-row lesson-row--cancelled":"lesson-row",r.href=i,r.addEventListener("click",O=>{O.preventDefault(),this.router.navigate(i)});const d=Wn(e.scheduledAt),c=document.createElement("span");c.className="lesson-row__date";for(const[O,G]of[["day",d.day],["month",d.month],["time",d.time]]){const W=document.createElement("span");W.className=`lesson-row__${O}`,W.textContent=G,c.appendChild(W)}const h=document.createElement("span");h.className="lesson-row__body";const p=document.createElement("span");p.className="lesson-row__title",p.textContent=$e(e),h.appendChild(p);const g=document.createElement("span");g.className="lesson-row__meta";const m=document.createElement("span");g.appendChild(m);const _=new Xe({name:e.counterpartyDisplayName,role:Sa(e.role)});_.mount(m),t(()=>_.destroy()),e.horseName&&g.appendChild($n(e.horseName)),g.appendChild($n(Xn(e.exercises))),h.appendChild(g);const x=document.createElement("span");x.className="lesson-row__chips",e.planTitle&&x.appendChild(Cn(Be(e.planTitle)));for(const O of Yn(e))x.appendChild(Cn(Lt(O)));const C=document.createElement("span");C.className="lesson-row__status";const E=Tt(e.status),T=new Z({label:E.label,variant:E.variant,tone:E.tone,...E.glyph===void 0?{}:{glyph:E.glyph}});return T.mount(C),t(()=>T.destroy()),r.append(c,h,x,C),s.appendChild(r),s}}function $n(n){const e=document.createElement("span");return e.textContent=n,e}function Cn(n){const e=document.createElement("span");return e.className="lesson-row__chip",e.textContent=n,e.title=n,e}const $l=S(`
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
`);function Cl(n){return new Date(n).toISOString()}class Sl extends ${static styles=`
        .lesson-create {
            display: flex;
            flex-direction: column;
            gap: ${l("lg")};
            max-width: 34rem;
            font-family: ${o("font-ui")};

            & .lesson-create__back {
                font-size: 0.875rem;
                color: ${o("text-muted")};
                text-decoration: none;
                &:hover { color: ${o("accent-strong")}; text-decoration: underline; }
                &:focus-visible { outline: 2px solid ${o("accent")}; outline-offset: 2px; }
            }

            /* Lora 500 only (UI_DECISIONS §3). */
            & .lesson-create__title {
                margin: 0;
                font-family: ${o("font-display")};
                font-weight: 500;
                font-size: 1.75rem;
                line-height: 36px;
                color: ${o("text")};
            }

            /*
             * The fields sit in a panel, not loose on the page. The §4.8 field
             * recipe fills with --bg — the page-paper colour — so a form
             * rendered straight onto the route would give the field the same
             * colour as everything behind it. The panel is what the recessed
             * fill is recessed INTO. §4.8's own example shows the same thing.
             */
            & .lesson-create__panel {
                ${q()}
                box-sizing: border-box;
                padding: ${l("xl")};
                display: flex;
                flex-direction: column;
                gap: ${l("lg")};
            }

            & .lesson-create__field {
                display: flex;
                flex-direction: column;
                gap: ${l("xs")};
            }

            & .lesson-create__label {
                font-size: 0.8125rem;
                font-weight: 600;
                color: ${o("text")};
            }

            & .lesson-create__hint {
                font-size: 0.8125rem;
                line-height: 1.5;
                color: ${o("text-muted")};
                max-width: 68ch;
            }

            & .lesson-create__input {
                ${R()}
                width: 100%;
                box-sizing: border-box;
            }

            & .lesson-create__control .ui-select { display: block; }

            & .lesson-create__error {
                margin: 0;
                min-height: 1em;
                font-size: 0.875rem;
                color: ${o("danger")};
            }

            & .lesson-create__actions {
                display: flex;
                gap: ${l("sm")};
                flex-wrap: wrap;
            }
            /* §4.8: one primary per form. This is it. */
            & .lesson-create__submit { ${k(o("radius-sm"),"primary")} }
            /* Cancel is the ghost tier — not a second bordered button. */
            & .lesson-create__cancel { ${k(o("radius-sm"),"ghost")} }

            /* UI_DECISIONS §6: single column below 640px. The form is already
               one column, so only the action row needs to stack. */
            @media (max-width: 639px) {
                & .lesson-create__actions { flex-direction: column; align-items: stretch; }
                & .lesson-create__title { font-size: 1.375rem; line-height: 30px; }
            }
        }
    `;router=this.inject(L);lessons=this.inject(Dt);students=this.inject(be);programs=this.inject(Ie);toasts=this.inject(U);studentVal=new u("");whenVal=new u("");horseVal=new u("");planVal=new u("");programVals=new u([]);horses=new u([]);plans=new u([]);validation=new u("");needsStudent=new f(()=>this.studentVal.get()==="");studentOptions=new f(()=>this.students.items.get().map(e=>({value:e.id,label:e.displayName})));horseOptions=new f(()=>[{value:"",label:a("lesson.horse.none")},...Qn(this.horses.get()).map(e=>({value:e.id,label:e.name}))]);planOptions=new f(()=>[{value:"",label:a("lesson.plan.none")},...Jn(this.plans.get()).map(e=>({value:e.id,label:e.title}))]);programOptions=new f(()=>this.programs.items.get().map(e=>({value:e.id,label:e.title})));onMount(){const e=this.router.query("elev").peek();e&&this.studentVal.set(e),this.students.load().then(()=>{const t=this.studentVal.peek();t&&!this.students.items.peek().some(s=>s.id===t)&&this.studentVal.set("")}),this.programs.load(),this.track(b(()=>{const t=this.studentVal.get();if(this.horseVal.set(""),this.planVal.set(""),!t){this.horses.set([]),this.plans.set([]);return}Promise.all([v.students.listHorses({id:t}),v.students.listPlans({id:t})]).then(([s,i])=>{this.studentVal.get()===t&&(this.horses.set(s),this.plans.set(i))}).catch(()=>{this.studentVal.get()===t&&(this.horses.set([]),this.plans.set([]))})}))}render(){const e=this.wire($l,{back:{onclick:this.router.link("/lektioner").onclick,textContent:()=>a("lesson.back")},heading:{textContent:()=>a("lessonCreate.heading")},studentLabel:{textContent:()=>a("lessonCreate.field.student")},whenLabel:{textContent:()=>a("lessonCreate.field.when")},horseLabel:{textContent:()=>a("lessonCreate.field.horse")},horseHint:{textContent:()=>a("lessonCreate.field.horse.hint")},planLabel:{textContent:()=>a("lessonCreate.field.plan")},planHint:{textContent:()=>a("lessonCreate.field.plan.hint")},programLabel:{textContent:()=>a("lessonCreate.field.programs")},programHint:{textContent:()=>a("lessonCreate.field.programs.hint")},whenInput:{value:()=>this.whenVal.get(),oninput:t=>this.whenVal.set(t.target.value)},error:{textContent:()=>this.validation.get()||(this.lessons.error.get()?a("lessons.error"):"")},submit:{textContent:()=>a("lessonCreate.submit"),disabled:()=>this.lessons.loading.get()},cancel:{textContent:()=>a("lessonCreate.cancel"),onclick:()=>this.router.navigate("/lektioner")},form:{onsubmit:t=>{this.submit(t)}}});return this.spawn(D,this.ref(e,"studentHost"),{value:this.studentVal,options:this.studentOptions,placeholder:a("lessonCreate.field.student.placeholder")}),this.spawn(D,this.ref(e,"horseHost"),{value:this.horseVal,options:this.horseOptions,disabled:this.needsStudent}),this.spawn(D,this.ref(e,"planHost"),{value:this.planVal,options:this.planOptions,disabled:this.needsStudent}),this.spawn(D,this.ref(e,"programHost"),{multiple:!0,values:this.programVals,options:this.programOptions,placeholder:a("lessonCreate.field.programs.placeholder"),countLabel:t=>V("lessonCreate.programsCount",t)}),e}async submit(e){e.preventDefault();const t=this.studentVal.get(),s=this.whenVal.get();if(!t)return this.validation.set(a("lessonCreate.error.student"));if(!s)return this.validation.set(a("lessonCreate.error.when"));this.validation.set("");const i=this.horseVal.get(),r=this.planVal.get(),d=await this.lessons.create({studentId:t,scheduledAt:Cl(s),...r?{planId:r}:{},...i?{horseId:i}:{},programIds:this.programVals.get()});d&&(this.toasts.show(d.incomplete?{message:a("lessonCreate.createdPartial"),variant:"error",duration:8e3}:{message:a("lessonCreate.created"),variant:"success"}),this.router.navigate(`/lektioner/${d.lesson.id}`))}}const se=n=>`var(--${n})`;class El extends ${static styles=`
        .ui-menu {
            position: absolute;
            min-width: 180px;
            background: ${se("surface")};
            border: 1px solid ${se("border")};
            border-radius: ${se("radius-md")};
            box-shadow: ${se("shadow-2")};
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
            color: ${se("text")};
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
            color: ${se("text-muted")};
        }
        .ui-menu__item:hover {
            background: ${se("surface-2")};
        }
        .ui-menu__label {
            padding: 8px 12px 4px;
            font-size: 0.75rem;
            color: ${se("text-muted")};
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }
        .ui-menu__divider {
            height: 1px;
            background: ${se("border")};
            margin: 4px 0;
        }
    `;menuEl;render(){const e=document.createElement("div");e.style.position="relative",this.spawn(kt,e,{open:this.props.open,bg:this.props.overlayBg??"transparent",zIndex:(this.props.zIndex??50)-1}),this.menuEl=document.createElement("div"),this.menuEl.className="ui-menu",this.menuEl.style.zIndex=String(this.props.zIndex??50),e.appendChild(this.menuEl);const t=this.props.closeOnClick??!0,s=i=>{this.menuEl.textContent="";for(const r of i)if(r.type==="divider"){const d=document.createElement("div");d.className="ui-menu__divider",this.menuEl.appendChild(d)}else if(r.type==="label"){const d=document.createElement("div");d.className="ui-menu__label",d.textContent=r.text,this.menuEl.appendChild(d)}else{const d=document.createElement("button");if(d.className="ui-menu__item",r.icon){const h=document.createElement("span");h.innerHTML=r.icon,d.appendChild(h)}const c=document.createElement("span");c.textContent=r.label,d.appendChild(c),d.addEventListener("click",h=>{h.stopPropagation(),r.onclick(),t&&this.props.open.set(!1)}),this.menuEl.appendChild(d)}};return this.props.items instanceof u?this.track(b(()=>{s(this.props.items instanceof u?this.props.items.get():this.props.items)})):s(this.props.items),this.track(b(()=>{this.menuEl.classList.toggle("open",this.props.open.get())})),e}}const te=n=>typeof n=="function"?n():n,Oe=n=>n.disabled===void 0?!1:te(n.disabled),Nl=S(`
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
`);class Je extends ${static styles=`
        .detail-header {
            display: flex;
            flex-direction: column;
            gap: ${l("md")};
            padding-bottom: ${l("lg")};
            border-bottom: 1px solid ${o("border")};
            font-family: ${o("font-ui")};

            & .detail-header__top {
                display: flex;
                align-items: flex-start;
                justify-content: space-between;
                gap: ${l("lg")};
                flex-wrap: wrap;
            }

            & .detail-header__identity {
                display: flex;
                flex-direction: column;
                gap: ${l("sm")};
                min-width: 0;
            }

            & .detail-header__eyebrow {
                margin: 0;
                font-size: 0.6875rem;
                line-height: 16px;
                font-weight: 700;
                letter-spacing: 0.14em;
                text-transform: uppercase;
                color: ${o("text-muted")};
            }

            & .detail-header__title-row {
                display: flex;
                align-items: center;
                flex-wrap: wrap;
                gap: ${l("md")};
            }

            /* Lora, weight 500, and ONLY 500. The app ships a single static 500
               cut; 400 silently resolves to it and 600 gets synthetic bold —
               precisely the faked weight the spec forbids (UI_DECISIONS §3). */
            & .detail-header__title {
                margin: 0;
                font-family: ${o("font-display")};
                font-weight: 500;
                font-size: 1.75rem;
                line-height: 36px;
                color: ${o("text")};
                overflow-wrap: anywhere;
            }

            /* Chips wrap; they never scroll. Every path upward stays reachable
               at every width (UI_DECISIONS §6). */
            & .detail-header__chips {
                display: flex;
                flex-wrap: wrap;
                gap: ${l("sm")};
                list-style: none;
                margin: 0;
                padding: 0;
            }
            & .detail-header__chips:empty { display: none; }

            & .detail-header__chip {
                display: inline-flex;
                align-items: center;
                padding: 2px ${l("sm")};
                border: 1px solid ${o("border-strong")};
                border-radius: ${o("radius-pill")};
                font-size: 0.75rem;
                font-weight: 600;
                line-height: 1.4;
                color: ${o("text-muted")};
                text-decoration: none;
                transition: color ${o("dur-fast")} ${o("ease-standard")},
                            border-color ${o("dur-fast")} ${o("ease-standard")};

                &:hover {
                    color: ${o("accent-strong")};
                    border-color: ${o("accent")};
                    text-decoration: underline;
                }
                &:focus-visible { outline: 2px solid ${o("accent")}; outline-offset: 2px; }
            }

            & .detail-header__actions {
                display: flex;
                align-items: center;
                gap: ${l("sm")};
            }

            & .detail-header__secondary {
                display: flex;
                gap: ${l("sm")};

                & button { ${k()} }
            }

            /* §4.8: the one primary on a detail view. */
            & .detail-header__primary { ${k(o("radius-sm"),"primary")} }
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
                ${k()}
                line-height: 1;
            }

            & .detail-header__meta {
                margin: 0;
                font-size: 0.875rem;
                color: ${o("text-muted")};
            }
            & .detail-header__meta:empty { display: none; }

            /* Below 640px the secondary cluster folds into ⋯; the single
               primary action stays visible at every width. */
            @media (max-width: 639px) {
                & .detail-header__secondary { display: none; }
                & .detail-header__title { font-size: 1.375rem; line-height: 30px; }
            }
        }
    `;router=this.inject(L);menuOpen=new u(!1);menuItems=new u([]);narrow=new u(!1);onMount(){const e=window.matchMedia(Uo);this.narrow.set(e.matches);const t=()=>this.narrow.set(e.matches);e.addEventListener("change",t),this.track(()=>e.removeEventListener("change",t))}secondaryActions(){return te(this.props.secondaryActions??[])}overflowActions(){return te(this.props.overflowActions??[])}menuActions(){return Wo(this.secondaryActions(),this.overflowActions(),this.narrow.get())}render(){const e=this.wire(Nl,{eyebrow:{textContent:()=>te(this.props.eyebrow)},meta:{textContent:()=>te(this.props.meta??"")},menuButton:{"aria-label":()=>a("detail.moreActions"),"aria-expanded":()=>String(this.menuOpen.get()),onclick:t=>{t.stopPropagation(),this.menuOpen.set(!this.menuOpen.peek())}}});return this.buildTitleRow(this.ref(e,"titleRow")),this.buildChips(this.ref(e,"chips")),this.buildPrimary(this.ref(e,"primary")),this.buildSecondary(this.ref(e,"secondary")),this.spawn(El,this.ref(e,"menuHost"),{open:this.menuOpen,items:this.menuItems,zIndex:50}),this.wireMenu(this.ref(e,"menuAnchor")),e}buildTitleRow(e){const t=this.props.headingLevel??1,s=document.createElement(`h${t}`);s.className="detail-header__title",this.track(b(()=>{s.textContent=te(this.props.title)})),e.appendChild(s);const i=document.createElement("span");e.appendChild(i);let r=null;this.track(b(()=>{const d=te(this.props.status??null);if(r?.destroy(),r=null,i.replaceChildren(),!d)return;const c=new Z({label:d.label,variant:d.variant??"outline",tone:d.tone??"neutral",...d.glyph===void 0?{}:{glyph:d.glyph}});c.mount(i),r=c})),this.track(()=>r?.destroy())}buildChips(e){let t=null;this.track(b(()=>{const s=te(this.props.chips??[]);t?.destroy(),t=null,e.replaceChildren();for(const r of s){const d=document.createElement("li"),c=document.createElement("a");c.className="detail-header__chip",c.textContent=r.label;const h=this.router.link(r.href);c.href=r.href,c.addEventListener("click",h.onclick),d.appendChild(c),e.appendChild(d)}if(this.props.recipients===void 0)return;const i=new Le({recipients:this.props.recipients,...this.props.shared===void 0?{}:{shared:this.props.shared},as:"li"});i.mount(e),t=i})),this.track(()=>t?.destroy())}buildPrimary(e){this.track(b(()=>{const t=te(this.props.primaryAction??null);e.className=t?"detail-header__primary":"detail-header__primary hidden",e.textContent=t?.label??"",e.disabled=t?Oe(t):!0})),e.addEventListener("click",()=>{const t=te(this.props.primaryAction??null);t&&!Oe(t)&&t.onclick()})}buildSecondary(e){this.track(b(()=>{e.replaceChildren();for(const t of this.secondaryActions()){const s=document.createElement("button");s.type="button",s.textContent=t.label,s.disabled=Oe(t),s.addEventListener("click",t.onclick),e.appendChild(s)}}))}wireMenu(e){this.track(b(()=>{const t=this.menuActions().filter(s=>!Oe(s));e.className=t.length===0?"detail-header__menu-anchor hidden":"detail-header__menu-anchor",t.length===0&&this.menuOpen.peek()&&this.menuOpen.set(!1),this.menuItems.set(t.map(s=>({type:"item",label:s.label,onclick:s.onclick})))}))}}class Tl{items=new u([]);loading=new u(!1);error=new u(null);parentKind=null;parentId=null;async load(e,t){this.parentKind=e,this.parentId=t;const s=await w(this.loading,this.error,()=>v.notes.list({parentKind:e,parentId:t}));s&&this.items.set(s)}async create(e,t){return!this.parentKind||!this.parentId||!await w(this.loading,this.error,()=>v.notes.create({parentKind:this.parentKind,parentId:this.parentId,body:e,visibility:t}))?!1:(await this.reload(),!0)}async update(e,t){return await w(this.loading,this.error,()=>v.notes.update({id:e,...t}))?(await this.reload(),!0):!1}async delete(e){return await w(this.loading,this.error,()=>v.notes.delete({id:e}))?(await this.reload(),!0):!1}async reload(){this.parentKind&&this.parentId&&await this.load(this.parentKind,this.parentId)}}const pt=n=>typeof n=="function"?n():n,Ll=S(`
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
`);class As extends ${static styles=`
        .note-thread {
            display: flex;
            flex-direction: column;
            gap: ${l("lg")};
            font-family: ${o("font-ui")};
            /* §4.7 is a single column at reading measure — never two. */
            max-width: 68ch;

            & .note-thread__head {
                display: flex;
                flex-direction: column;
                gap: ${l("xs")};
                padding-bottom: ${l("sm")};
                border-bottom: 1px solid ${o("border")};
            }

            & .note-thread__title {
                margin: 0;
                /* A section heading is one of the places the serif is allowed —
                   and Lora ships as a single 500 cut (UI_DECISIONS §3), so 500
                   is the only weight that renders honestly. */
                font-family: ${o("font-display")};
                font-weight: 500;
                font-size: 1.25rem;
                line-height: 1.4;
                color: ${o("text")};
            }

            /* The context row: what the thread is attached to. */
            & .note-thread__context {
                margin: 0;
                font-size: 0.8125rem;
                color: ${o("text-muted")};
            }

            & .note-thread__list {
                list-style: none;
                margin: 0;
                padding: 0;
                display: flex;
                flex-direction: column;
                gap: ${l("lg")};
            }

            & .note-thread__entry {
                display: flex;
                flex-direction: column;
                gap: ${l("sm")};
                padding-left: ${l("md")};
                /* Non-teacher entries keep the identical indent so the column
                   stays flush — only the rule's colour changes. */
                border-left: 1px solid transparent;
            }

            /* The teacher's hairline brass rule (§4.7). Hairline: 1px, no fill,
               no bubble — the entry is otherwise identical to the student's. */
            & .note-thread__entry--teacher {
                border-left-color: ${o("brass-line")};
            }

            & .note-thread__meta {
                display: flex;
                align-items: center;
                flex-wrap: wrap;
                gap: ${l("sm")};
            }

            & .note-thread__time {
                font-size: 0.75rem;
                color: ${o("text-muted")};
                font-variant-numeric: tabular-nums;
            }

            & .note-thread__body {
                margin: 0;
                font-size: 0.9375rem;
                line-height: 1.6;
                color: ${o("text")};
                /* No clamp, no ellipsis: §4.7 forbids cutting long notes. */
                white-space: pre-wrap;
                overflow-wrap: anywhere;
            }

            & .note-thread__entry-actions {
                display: flex;
                gap: ${l("md")};

                & button {
                    background: none;
                    border: none;
                    padding: 0;
                    font-family: inherit;
                    font-size: 0.75rem;
                    color: ${o("text-muted")};
                    cursor: pointer;
                    &:hover { color: ${o("text")}; text-decoration: underline; }
                    &:focus-visible { outline: 2px solid ${o("accent")}; outline-offset: 2px; }
                    &.note-thread__destructive { color: ${o("danger")}; }
                }
            }

            & .note-thread__empty {
                margin: 0;
                font-size: 0.875rem;
                color: ${o("text-muted")};
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
                ${q()}
                box-sizing: border-box;
                padding: ${l("lg")};
                display: flex;
                flex-direction: column;
                gap: ${l("sm")};

                & textarea {
                    ${R()}
                    width: 100%;
                    box-sizing: border-box;
                    resize: vertical;
                    font-family: ${o("font-ui")};
                    font-size: 0.9375rem;
                }
            }

            & .note-thread__footer {
                display: flex;
                align-items: center;
                justify-content: space-between;
                flex-wrap: wrap;
                gap: ${l("md")};

                & .note-thread__submit { ${k()} }
            }

            /* Visibility at the point of writing — a two-state segmented
               control, not a checkbox: both options are always visible and
               always labelled, so the shared state can never be nameless. */
            & .note-thread__visibility {
                display: inline-flex;
                border: 1px solid ${o("border-strong")};
                border-radius: ${o("radius-pill")};
                overflow: hidden;

                & button {
                    background: none;
                    border: none;
                    padding: ${l("xs")} ${l("md")};
                    font-family: ${o("font-ui")};
                    font-size: 0.8125rem;
                    font-weight: 600;
                    color: ${o("text-muted")};
                    cursor: pointer;
                    transition: background ${o("dur-fast")} ${o("ease-standard")},
                                color ${o("dur-fast")} ${o("ease-standard")};

                    &:hover:not(:disabled) { background: ${o("surface-2")}; }
                    &:focus-visible { outline: 2px solid ${o("accent")}; outline-offset: -2px; }
                    &:disabled { opacity: 0.5; cursor: not-allowed; }

                    &[aria-pressed="true"] {
                        background: ${o("accent-soft")};
                        color: ${o("accent-strong")};
                    }
                }
            }

            & .note-thread__hint {
                margin: 0;
                font-size: 0.75rem;
                color: ${o("text-muted")};
            }

            & .note-thread__error {
                margin: 0;
                font-size: 0.75rem;
                color: ${o("danger")};
                min-height: 1em;
            }
            & .note-thread__error:empty { min-height: 0; }
        }
    `;auth=this.inject(ne);notes=new Tl;draft=new u("");draftShared=new u(!1);editingId=new u(null);editingBody=new u("");editingShared=new u(!1);pendingDelete=new u(null);confirmOpen=new u(!1);onMount(){this.notes.load(this.props.parentKind,this.props.parentId)}recipients(){return Ye(pt(this.props.recipients))}canShare(){return this.recipients().length>0}audienceOf(e){return this.props.audienceOf?this.props.audienceOf(e):this.recipients()}showRoles(){return this.props.showRoles===void 0?!0:pt(this.props.showRoles)}render(){const e=this.wire(Ll,{context:{textContent:()=>pt(this.props.context)},body:{value:()=>this.draft.get(),placeholder:()=>a("notes.placeholder"),"aria-label":()=>a("notes.placeholder"),oninput:r=>this.draft.set(r.target.value)},submit:{textContent:()=>a("notes.submit")},hint:{textContent:()=>qo(this.recipients(),this.draftShared.get())},empty:{textContent:()=>a("notes.empty"),className:()=>this.notes.items.get().length===0?"note-thread__empty":"note-thread__empty hidden"},error:{textContent:()=>this.notes.error.get()?.message??""},form:{onsubmit:async r=>{r.preventDefault();const d=this.draft.get().trim();if(!d)return;const c=this.draftShared.get()&&this.canShare();await this.notes.create(d,c?"shared":"private")&&(this.draft.set(""),this.draftShared.set(!1))}}}),t=this.props.headingLevel??3,s=this.ref(e,"titleHost"),i=document.createElement(`h${t}`);return i.className="note-thread__title",this.track(b(()=>{i.textContent=Ko(this.notes.items.get().length)})),s.replaceWith(i),this.buildVisibility(this.ref(e,"visibility"),this.draftShared),this.spawn(J,this.ref(e,"confirmHost"),{open:this.confirmOpen,title:a("notes.deleteTitle"),message:()=>a("notes.deleteConsequence"),confirmLabel:a("notes.delete"),cancelLabel:a("notes.cancel"),danger:!0,onconfirm:async()=>{const r=this.pendingDelete.get();this.pendingDelete.set(null),r&&await this.notes.delete(r)},oncancel:()=>this.pendingDelete.set(null)}),this.$each(this.ref(e,"list"),()=>this.notes.items.get(),(r,d,c)=>this.renderEntry(r,c),r=>[r.id,r.updatedAt,this.editingId.get()===r.id,this.auth.currentUser.get()?.id??"",this.showRoles()].join("|")),e}buildVisibility(e,t,s=i=>this.track(i)){e.setAttribute("role","group"),e.setAttribute("aria-label",a("notes.visibility"));const i=r=>{const d=document.createElement("button");d.type="button",d.addEventListener("click",()=>t.set(r)),e.appendChild(d),s(b(()=>{const c=this.recipients(),h=t.get()===r;d.setAttribute("aria-pressed",String(h)),r?(d.disabled=c.length===0,d.textContent=c.length===0?a("notes.shareUnavailable"):xs(c,!0)):d.textContent=a("share.private")}))};i(!1),i(!0),s(b(()=>{!this.canShare()&&t.get()&&t.set(!1)}))}renderEntry(e,t){const s=this.auth.currentUser.get()?.id,i=this.editingId.get()===e.id,r=this.props.roleOf(e),d=document.createElement("li");d.className=`note-thread__entry note-thread__entry--${r}`;const c=document.createElement("div");c.className="note-thread__meta",d.appendChild(c);const h=document.createElement("span");c.appendChild(h),Sn(h,new Xe({name:e.authorDisplayName,role:r,showRole:this.showRoles()}),t);const p=document.createElement("time");p.className="note-thread__time",p.dateTime=e.createdAt,p.textContent=ws(e.createdAt),c.appendChild(p);const g=document.createElement("span");if(c.appendChild(g),Sn(g,new Le({recipients:()=>this.audienceOf(e),shared:e.visibility==="shared"}),t),i){const m=document.createElement("textarea");m.rows=3,m.value=this.editingBody.peek(),m.setAttribute("aria-label",a("notes.placeholder")),m.addEventListener("input",()=>this.editingBody.set(m.value)),d.appendChild(m);const _=document.createElement("div");_.className="note-thread__footer";const x=document.createElement("div");x.className="note-thread__visibility",this.buildVisibility(x,this.editingShared,t),_.appendChild(x),d.appendChild(_);const C=document.createElement("div");C.className="note-thread__entry-actions",C.append(this.entryButton(a("notes.save"),async()=>{const E=this.editingBody.get().trim();if(!E)return;await this.notes.update(e.id,{body:E,visibility:this.editingShared.get()&&this.canShare()?"shared":"private"})&&this.editingId.set(null)}),this.entryButton(a("notes.cancel"),()=>this.editingId.set(null))),d.appendChild(C)}else{const m=document.createElement("p");if(m.className="note-thread__body",m.textContent=e.body,d.appendChild(m),s&&e.authorId===s){const _=document.createElement("div");_.className="note-thread__entry-actions",_.append(this.entryButton(a("notes.edit"),()=>{this.editingBody.set(e.body),this.editingShared.set(e.visibility==="shared"),this.editingId.set(e.id)}),this.entryButton(a("notes.delete"),()=>{this.pendingDelete.set(e.id),this.confirmOpen.set(!0)},!0)),d.appendChild(_)}}return d}entryButton(e,t,s=!1){const i=document.createElement("button");return i.type="button",i.textContent=e,s&&(i.className="note-thread__destructive"),i.addEventListener("click",t),i}}function jt(n,e,t){let s=null,i=null;t(b(()=>{const r=e(),d=r?`${r.parentKind}:${r.parentId}`:null;d!==i&&(i=d,P(()=>{if(s?.destroy(),s=null,n.replaceChildren(),!r)return;const c=new As(r);c.mount(n),s=c}))})),t(()=>{s?.destroy(),s=null,i=null,n.replaceChildren()})}class Hs{open=[];constructor(e){e(()=>this.reset())}reset(){for(const e of this.open)e.destroy();this.open.length=0}mount(e,t){P(()=>{const s=new As(t);s.mount(e),this.open.push(s)})}}function Sn(n,e,t){e.mount(n),t(()=>e.destroy())}const Il=S(`
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
`);function Al(n){const e=new Date(n),t=s=>String(s).padStart(2,"0");return`${e.getFullYear()}-${t(e.getMonth()+1)}-${t(e.getDate())}T${t(e.getHours())}:${t(e.getMinutes())}`}function Hl(n){return new Date(n).toISOString()}class Ol extends ${static styles=`
        .lesson-detail {
            display: flex;
            flex-direction: column;
            gap: ${l("lg")};
            font-family: ${o("font-ui")};

            & .lesson-detail__back {
                font-size: 0.875rem;
                color: ${o("text-muted")};
                text-decoration: none;
                align-self: flex-start;
                &:hover { color: ${o("accent-strong")}; text-decoration: underline; }
                &:focus-visible { outline: 2px solid ${o("accent")}; outline-offset: 2px; }
            }

            & .lesson-detail__loading {
                margin: 0;
                color: ${o("text-muted")};
                font-size: 0.875rem;
            }

            & .lesson-detail__body {
                display: flex;
                flex-direction: column;
                gap: ${l("xl")};
            }
            & .lesson-detail__body.hidden { display: none; }
            & .lesson-detail__loading.hidden { display: none; }
            & .lesson-detail__back.hidden { display: none; }

            & .lesson-detail__conflict {
                display: flex;
                align-items: center;
                flex-wrap: wrap;
                gap: ${l("md")};
                padding: ${l("md")};
                border: 1px solid ${o("warning")};
                border-radius: ${o("radius-md")};
                background: ${o("warning-soft")};

                & .lesson-detail__conflict-text {
                    margin: 0;
                    font-size: 0.875rem;
                    color: ${o("text")};
                    max-width: 68ch;
                }
                & .lesson-detail__conflict-action { ${k()} }
            }
            & .lesson-detail__conflict.hidden { display: none; }

            /* The lock notice takes the place of the withheld controls — it says
               what is closed AND what is still open, so a terminal lesson does
               not read as a dead end. */
            & .lesson-detail__lock {
                margin: 0;
                padding: ${l("md")};
                border-left: 2px solid ${o("brass-line")};
                background: ${o("surface-2")};
                font-size: 0.875rem;
                line-height: 1.5;
                color: ${o("text")};
                max-width: 68ch;
            }
            & .lesson-detail__lock.hidden { display: none; }

            & .lesson-detail__section { display: flex; flex-direction: column; gap: ${l("md")}; }
            & .lesson-detail__section.hidden { display: none; }

            /* Section headings are the second permitted serif use (20/28), and
               weight 500 like every other Lora run in this app. */
            & .lesson-detail__heading {
                margin: 0;
                font-family: ${o("font-display")};
                font-weight: 500;
                font-size: 1.25rem;
                line-height: 28px;
                color: ${o("text")};
            }

            & .lesson-detail__hint, & .lesson-detail__muted {
                margin: 0;
                font-size: 0.8125rem;
                line-height: 1.5;
                color: ${o("text-muted")};
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
                ${q()}
                box-sizing: border-box;
                padding: ${l("xl")};
                display: flex;
                flex-direction: column;
                gap: ${l("md")};
                max-width: 34rem;
            }
            & .lesson-detail__pair {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: ${l("md")};
            }
            & .lesson-detail__field { display: flex; flex-direction: column; gap: ${l("xs")}; }
            & .lesson-detail__label { font-size: 0.8125rem; font-weight: 600; color: ${o("text")}; }
            & .lesson-detail__input {
                ${R()}
                width: 100%;
                box-sizing: border-box;
            }
            & .lesson-detail__control .ui-select { display: block; }
            & .lesson-detail__control--grow { flex: 1; min-width: 0; }

            & .lesson-detail__row {
                display: flex;
                align-items: center;
                gap: ${l("sm")};
                flex-wrap: wrap;
            }
            & .lesson-detail__row.hidden { display: none; }
            /*
             * Selects in a row on the page, not inside the form panel, keep a
             * raised --surface fill — the recessed --bg fill is only legible
             * against a card.
             */
            & .lesson-detail__row .ui-select__trigger { background: ${o("surface")}; }

            /* §4.8: one primary per view. This is it. */
            & .lesson-detail__save { ${k(o("radius-sm"),"primary")} }
            & .lesson-detail__secondary { ${k()} }

            & .lesson-detail__prog-list, & .lesson-detail__ex-list {
                list-style: none;
                margin: 0;
                padding: 0;
                display: flex;
                flex-direction: column;
            }
            & .lesson-detail__prog-list { gap: ${l("xs")}; }
            & .lesson-detail__ex-list {
                border-top: 1px solid ${o("border")};
                counter-reset: occurrence;
            }
            & .lesson-detail__ex-item {
                border-bottom: 1px solid ${o("border")};
                padding: ${l("md")} 0;
                display: flex;
                flex-direction: column;
                gap: ${l("sm")};
            }

            & .lesson-detail__prog-item {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: ${l("sm")};
                padding: ${l("sm")} ${l("md")};
                background: ${o("surface")};
                border: 1px solid ${o("border")};
                border-radius: ${o("radius-md")};
                font-size: 0.875rem;
            }

            & .lesson-detail__ex-head {
                display: flex;
                align-items: baseline;
                justify-content: space-between;
                gap: ${l("md")};
                flex-wrap: wrap;
            }
            & .lesson-detail__ex-name {
                font-size: 0.9375rem;
                font-weight: 600;
                color: ${o("text")};
            }
            /* Taught order is data, so the ordinal is generated rather than
               typed into the name. */
            & .lesson-detail__ex-name::before {
                counter-increment: occurrence;
                content: counter(occurrence) ". ";
                color: ${o("text-muted")};
                font-variant-numeric: tabular-nums;
            }
            & .lesson-detail__ex-source {
                font-size: 0.75rem;
                font-weight: 600;
                color: ${o("text-muted")};
                border: 1px solid ${o("border")};
                border-radius: ${o("radius-pill")};
                padding: 2px ${l("sm")};
            }
            /* The static Row note is instruction copied WITH the occurrence —
               never an authored Note, so it carries no author, no timestamp and
               no composer. The brass hairline is what tells the two apart. */
            & .lesson-detail__ex-note {
                margin: 0;
                padding-left: ${l("md")};
                border-left: 2px solid ${o("brass-line")};
                font-size: 0.875rem;
                line-height: 1.6;
                color: ${o("text")};
                max-width: 68ch;
            }
            & .lesson-detail__ex-actions {
                display: flex;
                align-items: center;
                gap: ${l("md")};
                flex-wrap: wrap;
            }
            & .lesson-detail__link {
                background: none;
                border: none;
                padding: 0;
                font-family: inherit;
                font-size: 0.8125rem;
                font-weight: 600;
                color: ${o("accent-strong")};
                text-decoration: none;
                cursor: pointer;
                &:hover { text-decoration: underline; }
                &:focus-visible { outline: 2px solid ${o("accent")}; outline-offset: 2px; }
            }
            & .lesson-detail__link--danger { color: ${o("danger")}; }

            /* UI_DECISIONS §6: paired field rows collapse below 640px. */
            @media (max-width: 639px) {
                & .lesson-detail__pair { grid-template-columns: 1fr; }
                & .lesson-detail__row { align-items: stretch; }
            }
        }
    `;router=this.inject(L);svc=this.inject(Dt);programs=this.inject(Ie);toasts=this.inject(U);resolved=new u(!1);found=new u(!0);horses=new u([]);plans=new u([]);library=new u([]);whenVal=new u("");horseVal=new u("");planVal=new u("");programVal=new u("");exerciseVal=new u("");openNotes=new u(new Set);confirmComplete=new u(!1);confirmCancel=new u(!1);lessonId(){return this.router.route.get().split("/")[2]??""}lesson(){return this.svc.get(this.lessonId())}controls=new f(()=>{const e=this.lesson();return e?ka(e.status,e.role):{transition:!1,editDetails:!1,editExercises:!1,editPrograms:!1,notes:!1,lockNotice:!1}});conflicted=new f(()=>Ca(this.svc.error.get()));horseOptions=new f(()=>[{value:"",label:a("lesson.horse.none")},...Qn(this.horses.get()).map(e=>({value:e.id,label:e.name}))]);planOptions=new f(()=>[{value:"",label:a("lesson.plan.none")},...Jn(this.plans.get()).map(e=>({value:e.id,label:e.title}))]);programOptions=new f(()=>{const e=new Set((this.lesson()?.programs??[]).map(t=>t.id));return this.programs.items.get().filter(t=>!e.has(t.id)).map(t=>({value:t.id,label:t.title}))});exerciseOptions=new f(()=>{const e=new Set((this.lesson()?.exercises??[]).map(t=>t.exerciseId));return this.library.get().filter(t=>!e.has(t.id)).map(t=>({value:t.id,label:t.name}))});onMount(){this.resolve()}async resolve(){const e=await this.svc.loadOne(this.lessonId());if(!e){this.found.set(!1),this.resolved.set(!0);return}if(this.whenVal.set(Al(e.scheduledAt)),this.horseVal.set(e.horseId??""),this.planVal.set(e.planId??""),this.found.set(!0),this.resolved.set(!0),e.role!=="teacher")return;const[t,s,i]=await Promise.all([v.students.listHorses({id:e.studentId}),v.students.listPlans({id:e.studentId}),v.exercises.list(),this.programs.load()]);this.horses.set(t),this.plans.set(s),this.library.set(i)}counterparty(){const e=this.lesson();return e?[{id:e.role==="student"?e.teacherId:e.studentId,name:e.counterpartyDisplayName}]:[]}roleOf=e=>e===this.lesson()?.teacherId?"teacher":"student";exerciseThread(e,t){return{parentKind:"lesson_exercise",parentId:e,context:()=>[a("objectKind.exercise"),t].join(" · "),recipients:()=>this.counterparty(),roleOf:s=>this.roleOf(s.authorId),headingLevel:4}}render(){const e=this.wire(Il,{back:{...this.router.link("/lektioner"),textContent:()=>a("lesson.back"),className:()=>this.resolved.get()&&!this.found.get()?"lesson-detail__back hidden":"lesson-detail__back"},loading:{textContent:()=>a("lesson.loading"),className:()=>this.resolved.get()?"lesson-detail__loading hidden":"lesson-detail__loading"},body:{className:()=>this.resolved.get()&&this.found.get()?"lesson-detail__body":"lesson-detail__body hidden"},conflict:{className:()=>this.conflicted.get()?"lesson-detail__conflict":"lesson-detail__conflict hidden"},conflictText:{textContent:()=>a("lesson.conflict.message")},conflictRetry:{textContent:()=>a("lesson.conflict.action"),onclick:()=>{this.resolve()}},lock:{textContent:()=>{const t=this.lesson();return t?$a(t.status):""},className:()=>this.controls.get().lockNotice?"lesson-detail__lock":"lesson-detail__lock hidden"},detailsSection:{className:()=>this.controls.get().editDetails?"lesson-detail__section":"lesson-detail__section hidden"},detailsHeading:{textContent:()=>a("lesson.section.details")},whenLabel:{textContent:()=>a("lesson.field.when")},horseLabel:{textContent:()=>a("lesson.field.horse")},planLabel:{textContent:()=>a("lesson.field.plan")},whenInput:{value:()=>this.whenVal.get(),oninput:t=>this.whenVal.set(t.target.value)},save:{textContent:()=>a("lesson.save")},detailsForm:{onsubmit:t=>{this.saveDetails(t)}},programsSection:{className:()=>this.controls.get().editPrograms?"lesson-detail__section":"lesson-detail__section hidden"},programsHeading:{textContent:()=>a("lesson.section.programs")},programsHint:{textContent:()=>a("lesson.programs.detachHint")},programsEmpty:{textContent:()=>a("lesson.programs.empty"),className:()=>(this.lesson()?.programs.length??0)===0?"lesson-detail__muted":"lesson-detail__muted hidden"},attachProgram:{textContent:()=>a("lesson.programs.attach"),onclick:()=>{this.attachProgram()}},exercisesHeading:{textContent:()=>a("lesson.section.exercises")},exercisesEmpty:{textContent:()=>a("lesson.exercises.empty"),className:()=>(this.lesson()?.exercises.length??0)===0?"lesson-detail__muted":"lesson-detail__muted hidden"},exerciseAdd:{className:()=>this.controls.get().editExercises?"lesson-detail__row":"lesson-detail__row hidden"},addExercise:{textContent:()=>a("lesson.exercise.add"),onclick:()=>{this.addExercise()}}});return this.buildNotFound(this.ref(e,"notFoundHost")),this.buildHeader(this.ref(e,"headerHost")),this.buildPrograms(this.ref(e,"programList")),this.buildExercises(this.ref(e,"exerciseList")),this.spawn(D,this.ref(e,"horseHost"),{value:this.horseVal,options:this.horseOptions}),this.spawn(D,this.ref(e,"planHost"),{value:this.planVal,options:this.planOptions}),this.spawn(D,this.ref(e,"programHost"),{value:this.programVal,options:this.programOptions,placeholder:a("lesson.programs.placeholder")}),this.spawn(D,this.ref(e,"exerciseHost"),{value:this.exerciseVal,options:this.exerciseOptions,placeholder:a("lesson.exercise.placeholder")}),this.track(b(()=>{const t=this.programOptions.get(),s=this.programVal.get();s&&!t.some(i=>i.value===s)&&this.programVal.set("")})),this.track(b(()=>{const t=this.exerciseOptions.get(),s=this.exerciseVal.get();s&&!t.some(i=>i.value===s)&&this.exerciseVal.set("")})),this.spawn(J,this.ref(e,"confirmCompleteHost"),{open:this.confirmComplete,title:a("lesson.confirm.complete.title"),message:()=>a("lesson.confirm.complete.message"),confirmLabel:a("lesson.action.complete"),cancelLabel:a("lesson.confirm.dismiss"),onconfirm:()=>{this.transition("completed")}}),this.spawn(J,this.ref(e,"confirmCancelHost"),{open:this.confirmCancel,title:a("lesson.confirm.cancel.title"),message:()=>a("lesson.confirm.cancel.message"),confirmLabel:a("lesson.action.cancel"),cancelLabel:a("lesson.confirm.dismiss"),danger:!0,onconfirm:()=>{this.transition("cancelled")}}),jt(this.ref(e,"notesHost"),()=>{const t=this.lesson();return t?{parentKind:"lesson",parentId:t.id,context:()=>this.lessonContext(),recipients:()=>this.counterparty(),roleOf:s=>this.roleOf(s.authorId)}:null},t=>this.track(t)),e}lessonContext(){const e=this.lesson();return e?[a("objectKind.lesson"),Ne(e.scheduledAt),e.horseName].filter(Boolean).join(" · "):a("objectKind.lesson")}buildHeader(e){this.spawn(Je,e,{eyebrow:()=>a("objectKind.lesson"),title:()=>{const t=this.lesson();return t?$e(t):a("lesson.title.plain")},status:()=>{const t=this.lesson();if(!t)return null;const s=Tt(t.status);return{label:s.label,variant:s.variant,tone:s.tone,...s.glyph===void 0?{}:{glyph:s.glyph}}},chips:()=>this.headerChips(),recipients:()=>this.counterparty(),shared:()=>!0,meta:()=>{const t=this.lesson();return t?[Ne(t.scheduledAt),t.counterpartyDisplayName,t.horseName].filter(Boolean).join(" · "):""},primaryAction:()=>this.controls.get().transition?{label:a("lesson.action.complete"),onclick:()=>this.confirmComplete.set(!0)}:null,secondaryActions:()=>this.controls.get().transition?[{label:a("lesson.action.cancel"),onclick:()=>this.confirmCancel.set(!0)}]:[]})}headerChips(){const e=this.lesson();if(!e)return[];const t=[];e.planId&&e.planTitle&&t.push({label:Be(e.planTitle),href:`/planer/${e.planId}`});for(const s of e.programs)t.push({label:Lt(s),href:`/program/${s.id}`});return t}buildNotFound(e){let t=null;this.track(b(()=>{const s=this.resolved.get()&&!this.found.get();t?.destroy(),t=null,e.replaceChildren(),s&&(t=P(()=>{const i=new B({heading:()=>a("lesson.notFound.heading"),body:()=>a("lesson.notFound.body"),action:{label:()=>a("lesson.notFound.action"),onclick:()=>this.router.navigate("/lektioner")},headingLevel:1});return i.mount(e),i}))})),this.track(()=>t?.destroy())}buildPrograms(e){this.track(b(()=>{const t=this.lesson(),s=this.controls.get();e.replaceChildren();for(const i of t?.programs??[]){const r=document.createElement("li");r.className="lesson-detail__prog-item";const d=document.createElement("span");if(d.textContent=i.title,r.appendChild(d),s.editPrograms){const c=document.createElement("button");c.type="button",c.className="lesson-detail__link lesson-detail__link--danger",c.textContent=a("lesson.programs.detach"),c.onclick=()=>{this.detachProgram(i.id,i.title)},r.appendChild(c)}e.appendChild(r)}}))}buildExercises(e){const t=new Hs(s=>this.track(s));this.track(b(()=>{const s=this.lesson(),i=this.openNotes.get(),r=this.controls.get();if(t.reset(),e.replaceChildren(),!!s)for(const d of Ta(s.exercises)){const c=document.createElement("li");c.className="lesson-detail__ex-item";const h=document.createElement("div");h.className="lesson-detail__ex-head";const p=document.createElement("span");p.className="lesson-detail__ex-name",p.textContent=d.name,h.appendChild(p);const g=La(d,s.programs);if(g){const T=document.createElement("span");T.className="lesson-detail__ex-source",T.textContent=g,h.appendChild(T)}c.appendChild(h);const m=Na(d);if(m){const T=document.createElement("p");T.className="lesson-detail__ex-note",T.textContent=m,c.appendChild(T)}const _=document.createElement("div");_.className="lesson-detail__ex-actions";const x=document.createElement("button");x.type="button",x.className="lesson-detail__link",x.textContent=i.has(d.id)?a("lesson.exercise.notesHide"):a("lesson.exercise.notesShow"),x.onclick=()=>this.toggleNotes(d.id),_.appendChild(x);const C=Ia(s.studentId,d.exerciseId,s.id),E=document.createElement("a");if(E.className="lesson-detail__link",E.href=C,E.textContent=a("lesson.exercise.history"),E.onclick=T=>{T.preventDefault(),this.router.navigate(C)},_.appendChild(E),r.editExercises){const T=document.createElement("button");T.type="button",T.className="lesson-detail__link lesson-detail__link--danger",T.textContent=a("lesson.exercise.remove"),T.onclick=()=>{this.removeExercise(d.exerciseId,d.name)},_.appendChild(T)}if(c.appendChild(_),i.has(d.id)){const T=document.createElement("div");c.appendChild(T),t.mount(T,this.exerciseThread(d.id,d.name))}e.appendChild(c)}}))}toggleNotes(e){const t=new Set(this.openNotes.get());t.has(e)?t.delete(e):t.add(e),this.openNotes.set(t)}async saveDetails(e){e.preventDefault();const t=this.lesson();if(!t)return;const s={},i=this.horseVal.get(),r=this.planVal.get(),d=this.whenVal.get();if(i!==(t.horseId??"")&&(s.horseId=i===""?null:i),r!==(t.planId??"")&&(s.planId=r===""?null:r),d){const h=Hl(d);h!==t.scheduledAt&&(s.scheduledAt=h)}if(Object.keys(s).length===0)return;await this.svc.update(t.id,s)&&this.toasts.show({message:a("lesson.saved"),variant:"success"})}async transition(e){const t=this.lesson();!t||!await this.svc.transition(t.id,e)||this.toasts.show({message:a(e==="completed"?"lesson.toast.completed":"lesson.toast.cancelled"),variant:"success"})}async addExercise(){const e=this.lesson(),t=this.exerciseVal.get();if(!e||!t)return;await this.svc.addExercise(e.id,t)&&this.exerciseVal.set("")}async removeExercise(e,t){const s=this.lesson();!s||!await this.svc.removeExercise(s.id,e)||this.toasts.show({message:a("lesson.toast.exerciseRemoved",{name:t}),action:{label:a("lesson.toast.undo"),onclick:()=>{this.svc.addExercise(s.id,e)}}})}async attachProgram(){const e=this.lesson(),t=this.programVal.get();if(!e||!t)return;await this.svc.attachProgram(e.id,t)&&this.programVal.set("")}async detachProgram(e,t){const s=this.lesson();!s||!await this.svc.detachProgram(s.id,e)||this.toasts.show({message:a("lesson.toast.programDetached",{title:t}),action:{label:a("lesson.toast.undo"),onclick:()=>{this.svc.attachProgram(s.id,e)}}})}}const zl=S('<div bind="host"></div>');class Pl extends ${router=this.inject(L);key=new f(()=>{const e=this.router.route.get();return e==="/lektioner"?"list":e==="/lektioner/ny"?"create":"detail"});render(){const e=this.wire(zl,{});return this.$swap(this.ref(e,"host"),this.key,{list:kl,create:Sl,detail:Ol}),e}}class Vt{items=new u([]);loading=new u(!1);error=new u(null);async load(){const e=await w(this.loading,this.error,()=>v.trainingSessions.list());e&&this.items.set(e)}async create(e){const t=await w(this.loading,this.error,()=>v.trainingSessions.create(e));return t?(this.merge(t),t):null}async loadOne(e){const t=await w(this.loading,this.error,()=>v.trainingSessions.get({id:e}));return t?(this.merge(t),t):null}get(e){return this.items.get().find(t=>t.id===e)??null}async update(e,t){const s=await w(this.loading,this.error,()=>v.trainingSessions.update({id:e,...t}));return s?(this.merge(s),s):null}async addExercise(e,t){const s=await w(this.loading,this.error,()=>v.trainingSessions.addExercise({id:e,exerciseId:t}));return s?(await this.loadOne(e),s):null}async removeExercise(e,t){const s=await w(this.loading,this.error,()=>v.trainingSessions.removeExercise({id:e,exerciseId:t}));return s?(await this.loadOne(e),s):null}async attachProgram(e,t){const s=await w(this.loading,this.error,()=>v.trainingSessions.attachProgram({id:e,programId:t}));return s?(this.merge(s),s):null}async detachProgram(e,t){const s=await w(this.loading,this.error,()=>v.trainingSessions.detachProgram({id:e,programId:t}));return s?(this.merge(s),s):null}async remove(e){return await w(this.loading,this.error,()=>v.trainingSessions.delete({id:e}))?(this.items.set(this.items.get().filter(s=>s.id!==e)),!0):!1}merge(e){const t=this.items.get(),s=t.findIndex(i=>i.id===e.id);this.items.set(s===-1?[...t,e]:[...t.slice(0,s),e,...t.slice(s+1)])}}class le{items=new u([]);loading=new u(!1);error=new u(null);async load(){const e=await w(this.loading,this.error,()=>v.teachers.list());e&&this.items.set(e)}}const Dl=S(`
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
`);class jl extends ${static styles=`
        .sessions {
            & .sessions__head {
                display: flex;
                align-items: baseline;
                justify-content: space-between;
                gap: ${l("lg")};
                flex-wrap: wrap;
                margin-bottom: ${l("xl")};
            }

            /* Lora 500, and only 500 — UI_DECISIONS §3. */
            & .sessions__title {
                margin: 0;
                font-family: ${o("font-display")};
                font-weight: 500;
                font-size: 1.75rem;
                line-height: 36px;
                color: ${o("text")};
            }

            /* Buttons are Open Sans territory; the serif is forbidden here. */
            & .sessions__log { ${k(o("radius-sm"),"primary")} }
            & .sessions__log.hidden { display: none; }

            & .sessions__loading {
                margin: 0;
                color: ${o("text-muted")};
                font-size: 0.875rem;
            }
            & .sessions__loading.hidden { display: none; }

            & .sessions__error {
                display: flex;
                align-items: center;
                gap: ${l("md")};
                flex-wrap: wrap;
                padding: ${l("md")};
                margin-bottom: ${l("lg")};
                border: 1px solid ${o("danger")};
                border-radius: ${o("radius-md")};
                background: ${o("danger-soft")};

                & .sessions__error-text { margin: 0; font-size: 0.875rem; color: ${o("text")}; }
                & .sessions__retry { ${k()} }
            }
            & .sessions__error.hidden { display: none; }

            & .sessions__list {
                list-style: none;
                margin: 0;
                padding: 0;
                /* No zebra striping (§4.3): rows are separated by a hairline. */
                border-top: 1px solid ${o("border")};
            }
            & .sessions__list:empty { border-top: none; }
            & .sessions__list > li { border-bottom: 1px solid ${o("border")}; }

            & .session-row {
                display: grid;
                grid-template-columns: auto minmax(0, 1fr) auto;
                align-items: start;
                gap: ${l("lg")};
                padding: ${l("md")} ${l("sm")};
                text-decoration: none;
                color: inherit;
                font-family: ${o("font-ui")};

                &:hover { background: ${o("surface-2")}; }
                &:focus-visible { outline: 2px solid ${o("accent")}; outline-offset: -2px; }
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
                color: ${o("text")};
            }
            & .session-row__month {
                font-size: 0.6875rem;
                font-weight: 700;
                letter-spacing: 0.12em;
                color: ${o("text-muted")};
            }
            & .session-row__time {
                margin-top: 2px;
                font-size: 0.8125rem;
                color: ${o("text-muted")};
            }

            & .session-row__body {
                display: flex;
                flex-direction: column;
                gap: ${l("xs")};
                min-width: 0;
            }
            & .session-row__title {
                font-size: 0.9375rem;
                font-weight: 600;
                color: ${o("text")};
                overflow-wrap: anywhere;
            }
            /* One meta line, not four — §4.3 allows at most two rows of text. */
            & .session-row__meta {
                display: flex;
                align-items: baseline;
                flex-wrap: wrap;
                gap: ${l("xs")} ${l("sm")};
                font-size: 0.8125rem;
                color: ${o("text-muted")};
            }

            & .session-row__chips {
                display: flex;
                flex-wrap: wrap;
                gap: ${l("xs")};
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
                padding: 2px ${l("sm")};
                border: 1px solid ${o("border")};
                border-radius: ${o("radius-pill")};
                font-size: 0.75rem;
                font-weight: 600;
                line-height: 1.4;
                color: ${o("text-muted")};
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
                    gap: ${l("sm")};
                }
                & .session-row__date {
                    flex-direction: row;
                    align-items: baseline;
                    gap: ${l("xs")};
                    width: auto;
                }
                & .session-row__day { font-size: 1rem; }
                & .session-row__chips { justify-content: flex-start; max-width: none; }
                & .sessions__title { font-size: 1.375rem; line-height: 30px; }
            }
        }
    `;router=this.inject(L);sessions=this.inject(Vt);teachers=this.inject(le);teachersResolved=new u(!1);ordered=new f(()=>this.teachersResolved.get()?Oa(this.sessions.items.get()):[]);isEmpty=new f(()=>this.teachersResolved.get()&&this.sessions.items.get().length===0&&!this.sessions.loading.get()&&this.sessions.error.get()===null);onMount(){this.sessions.load(),this.teachers.load().finally(()=>this.teachersResolved.set(!0))}render(){const e=this.wire(Dl,{heading:{textContent:()=>a("trainingSessions.heading")},log:{textContent:()=>a("trainingSessions.log"),onclick:()=>this.router.navigate("/traningspass/ny")},loading:{textContent:()=>a("trainingSessions.loading"),className:()=>(!this.teachersResolved.get()||this.sessions.loading.get())&&this.ordered.get().length===0&&this.sessions.error.get()===null?"sessions__loading":"sessions__loading hidden"},errorBox:{className:()=>this.sessions.error.get()?"sessions__error":"sessions__error hidden"},errorText:{textContent:()=>a("trainingSessions.error")},retry:{textContent:()=>a("trainingSessions.retry"),onclick:()=>{this.sessions.load()}}});return this.buildEmpty(this.ref(e,"emptyHost")),this.$each(this.ref(e,"list"),this.ordered,(t,s,i)=>this.renderRow(t,i),Ga),e}buildEmpty(e){let t=null;this.track(b(()=>{const s=this.isEmpty.get();t?.destroy(),t=null,e.replaceChildren(),s&&(t=P(()=>{const i=new B({heading:()=>a("trainingSessions.empty.heading"),body:()=>a("trainingSessions.empty.body"),action:{label:()=>a("trainingSessions.empty.action"),onclick:()=>this.router.navigate("/traningspass/ny")},headingLevel:2});return i.mount(e),i}))})),this.track(()=>t?.destroy())}renderRow(e,t){const s=document.createElement("li"),i=`/traningspass/${e.id}`,r=document.createElement("a");r.className="session-row",r.href=i,r.addEventListener("click",T=>{T.preventDefault(),this.router.navigate(i)});const d=Zn(e.performedAt),c=document.createElement("span");c.className="session-row__date";for(const[T,O]of[["day",d.day],["month",d.month],["time",d.time]]){const G=document.createElement("span");G.className=`session-row__${T}`,G.textContent=O,c.appendChild(G)}const h=document.createElement("span");h.className="session-row__body";const p=document.createElement("span");p.className="session-row__title",p.textContent=Ce(e),h.appendChild(p);const g=document.createElement("span");g.className="session-row__meta";const m=It(e.durationMin);m&&g.appendChild(ze(m)),e.horseName&&g.appendChild(ze(e.horseName)),g.appendChild(ze(ja(e.exercises)));const _=At(e.summary);_&&_!==p.textContent&&g.appendChild(ze(_)),h.appendChild(g);const x=document.createElement("span");x.className="session-row__chips";const C=document.createElement("span");x.appendChild(C);const E=new Le({recipients:()=>_t(e.sharedWithTeacherIds,this.teachers.items.get()),shared:()=>e.sharedWithTeacherIds.length>0});E.mount(C),t(()=>E.destroy()),e.planTitle&&x.appendChild(En(ts(e.planTitle)));for(const T of Va(e))x.appendChild(En(es(T)));return r.append(c,h,x),s.appendChild(r),s}}function ze(n){const e=document.createElement("span");return e.textContent=n,e}function En(n){const e=document.createElement("span");return e.className="session-row__chip",e.textContent=n,e.title=n,e}class ue{items=new u([]);loading=new u(!1);error=new u(null);async load(){const e=await w(this.loading,this.error,()=>v.plans.list());e&&this.items.set(e)}async loadDetail(e){return await w(this.loading,this.error,()=>v.plans.get({id:e}))??null}async create(e){const t=await w(this.loading,this.error,()=>v.plans.create(e));if(!t)return null;const s=this.items.get(),i=s.findIndex(r=>r.status==="archived");return this.items.set(i===-1?[t,...s]:[...s.slice(0,i),t,...s.slice(i)]),t}async update(e,t){const s=await w(this.loading,this.error,()=>v.plans.update({id:e,...t}));return s?(this.items.set(this.items.get().map(i=>i.id===e?s:i)),s):null}async archive(e){return await w(this.loading,this.error,()=>v.plans.archive({id:e}))?(this.items.set(this.items.get().map(s=>s.id===e?{...s,status:"archived"}:s)),!0):!1}}const Vl=S(`
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
`);function Fl(n){return new Date(n).toISOString()}class Rl extends ${static styles=`
        .log-session {
            display: flex;
            flex-direction: column;
            gap: ${l("lg")};
            max-width: 34rem;
            font-family: ${o("font-ui")};

            & .log-session__back {
                font-size: 0.875rem;
                color: ${o("text-muted")};
                text-decoration: none;
                &:hover { color: ${o("accent-strong")}; text-decoration: underline; }
                &:focus-visible { outline: 2px solid ${o("accent")}; outline-offset: 2px; }
            }

            /* Lora 500 only (UI_DECISIONS §3). */
            & .log-session__title {
                margin: 0;
                font-family: ${o("font-display")};
                font-weight: 500;
                font-size: 1.75rem;
                line-height: 36px;
                color: ${o("text")};
            }

            & .log-session__field {
                display: flex;
                flex-direction: column;
                gap: ${l("xs")};
            }
            & .log-session__field.hidden { display: none; }

            & .log-session__pair {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: ${l("md")};
            }

            & .log-session__label {
                font-size: 0.8125rem;
                font-weight: 600;
                color: ${o("text")};
            }

            /*
             * The fields sit in a panel, not loose on the page. The §4.8 field
             * recipe fills with --bg — the page-paper colour — so a form
             * rendered straight onto the route would give the field the same
             * colour as everything behind it. The panel is what the recessed
             * fill is recessed INTO. §4.8's own example shows the same thing.
             */
            & .log-session__panel {
                ${q()}
                box-sizing: border-box;
                padding: ${l("xl")};
                display: flex;
                flex-direction: column;
                gap: ${l("lg")};
            }

            & .log-session__hint {
                margin: 0;
                font-size: 0.8125rem;
                line-height: 1.5;
                color: ${o("text-muted")};
                max-width: 68ch;
            }

            & .log-session__input, & .log-session__textarea {
                ${R()}
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
                gap: ${l("sm")};
                margin: 0;
                padding: ${l("md")};
                border: 1px solid ${o("border")};
                border-radius: ${o("radius-md")};
            }
            & .log-session__share.hidden { display: none; }

            & .log-session__check {
                display: flex;
                align-items: center;
                gap: ${l("sm")};
                font-size: 0.875rem;
                color: ${o("text")};
                cursor: pointer;
            }
            & .log-session__check.hidden { display: none; }
            & .log-session__check input { accent-color: ${o("accent")}; }

            /* The offer to share with a Program's owner. An offer, never a
               silent decision — see unsharedProgramOwners in the copy module. */
            & .log-session__offer {
                display: flex;
                align-items: center;
                flex-wrap: wrap;
                gap: ${l("sm")};
                padding: ${l("sm")} ${l("md")};
                border-left: 2px solid ${o("brass-line")};
                background: ${o("surface-2")};

                & .log-session__offer-text {
                    margin: 0;
                    font-size: 0.8125rem;
                    line-height: 1.5;
                    color: ${o("text")};
                    max-width: 68ch;
                }
                & .log-session__offer-button {
                    ${k()}
                    font-size: 0.8125rem;
                }
            }
            & .log-session__offer.hidden { display: none; }

            & .log-session__error {
                margin: 0;
                min-height: 1em;
                font-size: 0.875rem;
                color: ${o("danger")};
            }

            & .log-session__actions {
                display: flex;
                gap: ${l("sm")};
                flex-wrap: wrap;
            }
            /* §4.8: one primary per form. This is it. */
            & .log-session__submit { ${k(o("radius-sm"),"primary")} }
            /* Cancel is the ghost tier — not a second bordered button. */
            & .log-session__cancel { ${k(o("radius-sm"),"ghost")} }

            /* UI_DECISIONS §6: paired field rows collapse below 640px. */
            @media (max-width: 639px) {
                & .log-session__pair { grid-template-columns: 1fr; }
                & .log-session__actions { flex-direction: column; align-items: stretch; }
                & .log-session__title { font-size: 1.375rem; line-height: 30px; }
            }
        }
    `;router=this.inject(L);sessions=this.inject(Vt);teachers=this.inject(le);stable=this.inject(pe);plans=this.inject(ue);toasts=this.inject(U);whenVal=new u("");durationVal=new u("");summaryVal=new u("");horseVal=new u("");planVal=new u("");programVal=new u("");shareVals=new u([]);programCatalog=new u([]);validation=new u("");horses=new f(()=>ns(this.stable.items.get()));activePlans=new f(()=>ss(this.plans.items.get()));horseOptions=new f(()=>[{value:"",label:a("trainingSession.horse.none")},...this.horses.get().map(e=>({value:e.id,label:e.name}))]);planOptions=new f(()=>[{value:"",label:a("trainingSession.plan.none")},...this.activePlans.get().map(e=>({value:e.id,label:e.title}))]);programOptions=new f(()=>vt(this.programCatalog.get(),this.teachers.items.get(),e=>e.title));teacherOptions=new f(()=>this.teachers.items.get().map(e=>({value:e.id,label:e.displayName})));teacherCount=new f(()=>this.teachers.items.get().length);pendingOwner=new f(()=>{const e=this.programVal.get();if(!e)return null;const t=this.programCatalog.get().find(s=>s.id===e);return t?is([{id:t.id,title:t.title}],this.programCatalog.get(),this.shareVals.get(),this.teachers.items.get())[0]??null:null});onMount(){this.teachers.load(),this.stable.load(),this.plans.load(),v.programs.listForStudent().then(e=>this.programCatalog.set(e)).catch(()=>this.programCatalog.set([]))}render(){const e=this.wire(Vl,{back:{onclick:this.router.link("/traningspass").onclick,textContent:()=>a("trainingSession.back")},heading:{textContent:()=>a("trainingSessionCreate.heading")},whenLabel:{textContent:()=>a("trainingSessionCreate.field.when")},whenInput:{value:()=>this.whenVal.get(),oninput:t=>this.whenVal.set(t.target.value)},durationLabel:{textContent:()=>a("trainingSessionCreate.field.duration")},durationHint:{textContent:()=>a("trainingSessionCreate.field.duration.hint")},durationInput:{value:()=>this.durationVal.get(),oninput:t=>this.durationVal.set(t.target.value)},horseField:{className:()=>this.horses.get().length===0?"log-session__field hidden":"log-session__field"},horseLabel:{textContent:()=>a("trainingSessionCreate.field.horse")},horseHint:{textContent:()=>a("trainingSessionCreate.field.horse.hint")},summaryLabel:{textContent:()=>a("trainingSessionCreate.field.summary")},summaryHint:{textContent:()=>a("trainingSessionCreate.field.summary.hint")},summaryInput:{value:()=>this.summaryVal.get(),oninput:t=>this.summaryVal.set(t.target.value)},planField:{className:()=>this.activePlans.get().length===0?"log-session__field hidden":"log-session__field"},planLabel:{textContent:()=>a("trainingSessionCreate.field.plan")},planHint:{textContent:()=>a("trainingSessionCreate.field.plan.hint")},programField:{className:()=>this.programCatalog.get().length===0?"log-session__field hidden":"log-session__field"},programLabel:{textContent:()=>a("trainingSessionCreate.field.program")},programHint:{textContent:()=>a("trainingSessionCreate.field.program.hint")},shareField:{className:()=>this.teacherCount.get()===0?"log-session__share hidden":"log-session__share"},shareLegend:{textContent:()=>a("trainingSession.sharing.legend")},shareHint:{textContent:()=>a("trainingSession.sharing.hint")},shareSingle:{className:()=>this.teacherCount.get()===1?"log-session__check":"log-session__check hidden"},shareSingleLabel:{textContent:()=>{const t=this.teachers.items.get()[0];return t?a("trainingSession.sharing.withTeacher",{name:t.displayName}):""}},shareSingleInput:{checked:()=>this.shareVals.get().length>0,onchange:t=>{const s=this.teachers.items.get()[0];s&&this.shareVals.set(t.target.checked?[s.id]:[])}},shareMulti:{className:()=>this.teacherCount.get()>1?"log-session__control":"log-session__control hidden"},offer:{className:()=>this.pendingOwner.get()?"log-session__offer":"log-session__offer hidden"},offerText:{textContent:()=>{const t=this.pendingOwner.get();return t?a("trainingSession.programOffer",{name:t.displayName}):""}},offerAction:{textContent:()=>{const t=this.pendingOwner.get();return t?a("trainingSession.programOffer.action",{name:t.displayName}):""},onclick:()=>{const t=this.pendingOwner.get();t&&this.shareVals.set([...new Set([...this.shareVals.get(),t.id])])}},error:{textContent:()=>this.validation.get()||(this.sessions.error.get()?a("trainingSessions.saveError"):"")},submit:{textContent:()=>a("trainingSessionCreate.submit"),disabled:()=>this.sessions.loading.get()},cancel:{textContent:()=>a("trainingSessionCreate.cancel"),onclick:()=>this.router.navigate("/traningspass")},form:{onsubmit:t=>{this.submit(t)}}});return this.spawn(D,this.ref(e,"horseHost"),{value:this.horseVal,options:this.horseOptions}),this.spawn(D,this.ref(e,"planHost"),{value:this.planVal,options:this.planOptions}),this.spawn(D,this.ref(e,"programHost"),{value:this.programVal,options:this.programOptions,placeholder:a("trainingSession.programs.placeholder")}),this.spawn(D,this.ref(e,"shareMulti"),{multiple:!0,values:this.shareVals,options:this.teacherOptions,placeholder:a("trainingSession.sharing.placeholder"),countLabel:t=>V("trainingSession.sharing.count",t)}),this.track(b(()=>{const t=new Set(this.teachers.items.get().map(r=>r.id)),s=this.shareVals.get(),i=s.filter(r=>t.has(r));i.length!==s.length&&this.shareVals.set(i)})),e}async submit(e){e.preventDefault();const t=this.whenVal.get();if(!t)return this.validation.set(a("trainingSessionCreate.error.when"));const s=this.durationVal.get().trim();let i=null;if(s!==""){const g=Number(s);if(!Number.isInteger(g)||g<0)return this.validation.set(a("trainingSessionCreate.error.duration"));i=g}this.validation.set("");const r=this.summaryVal.get().trim(),d=this.horseVal.get(),c=this.planVal.get(),h=this.programVal.get(),p=await this.sessions.create({performedAt:Fl(t),durationMin:i,summary:r===""?null:r,...d?{horseId:d}:{},...c?{planId:c}:{},...h?{programId:h}:{},shareWithTeacherIds:this.shareVals.get()});p&&(this.toasts.show({message:a("trainingSessionCreate.created"),variant:"success"}),this.router.navigate(`/traningspass/${p.id}`))}}const Ml=S(`
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
`);function Bl(n){const e=new Date(n),t=s=>String(s).padStart(2,"0");return`${e.getFullYear()}-${t(e.getMonth()+1)}-${t(e.getDate())}T${t(e.getHours())}:${t(e.getMinutes())}`}function Gl(n){return new Date(n).toISOString()}class Kl extends ${static styles=`
        .session-detail {
            display: flex;
            flex-direction: column;
            gap: ${l("lg")};
            font-family: ${o("font-ui")};

            & .session-detail__back {
                font-size: 0.875rem;
                color: ${o("text-muted")};
                text-decoration: none;
                align-self: flex-start;
                &:hover { color: ${o("accent-strong")}; text-decoration: underline; }
                &:focus-visible { outline: 2px solid ${o("accent")}; outline-offset: 2px; }
            }
            & .session-detail__back.hidden { display: none; }

            & .session-detail__loading {
                margin: 0;
                color: ${o("text-muted")};
                font-size: 0.875rem;
            }
            & .session-detail__loading.hidden { display: none; }

            & .session-detail__body {
                display: flex;
                flex-direction: column;
                gap: ${l("xl")};
            }
            & .session-detail__body.hidden { display: none; }

            & .session-detail__conflict {
                display: flex;
                align-items: center;
                flex-wrap: wrap;
                gap: ${l("md")};
                padding: ${l("md")};
                border: 1px solid ${o("warning")};
                border-radius: ${o("radius-md")};
                background: ${o("warning-soft")};

                & .session-detail__conflict-text {
                    margin: 0;
                    font-size: 0.875rem;
                    color: ${o("text")};
                    max-width: 68ch;
                }
                & .session-detail__conflict-action {
                    ${k()}
                }
            }
            & .session-detail__conflict.hidden { display: none; }

            & .session-detail__section { display: flex; flex-direction: column; gap: ${l("md")}; }
            & .session-detail__section.hidden { display: none; }

            /* Section headings are the second permitted serif use (20/28), and
               weight 500 like every other Lora run in this app. */
            & .session-detail__heading {
                margin: 0;
                font-family: ${o("font-display")};
                font-weight: 500;
                font-size: 1.25rem;
                line-height: 28px;
                color: ${o("text")};
            }

            & .session-detail__hint, & .session-detail__muted {
                margin: 0;
                font-size: 0.8125rem;
                line-height: 1.5;
                color: ${o("text-muted")};
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
                color: ${o("text")};
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
                ${q()}
                box-sizing: border-box;
                padding: ${l("xl")};
                display: flex;
                flex-direction: column;
                gap: ${l("md")};
                max-width: 34rem;
            }
            & .session-detail__pair {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: ${l("md")};
            }
            & .session-detail__field { display: flex; flex-direction: column; gap: ${l("xs")}; }
            & .session-detail__field.hidden { display: none; }
            & .session-detail__label { font-size: 0.8125rem; font-weight: 600; color: ${o("text")}; }
            & .session-detail__input, & .session-detail__textarea {
                ${R()}
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
                color: ${o("danger")};
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
                gap: ${l("sm")};
                font-size: 0.875rem;
                color: ${o("text")};
                cursor: pointer;
            }
            & .session-detail__check.hidden { display: none; }
            & .session-detail__check input { accent-color: ${o("accent")}; }

            /* The offer to share with an attached Program's owner. */
            & .session-detail__offer {
                display: flex;
                align-items: center;
                flex-wrap: wrap;
                gap: ${l("sm")};
                padding: ${l("sm")} ${l("md")};
                border-left: 2px solid ${o("brass-line")};
                background: ${o("surface-2")};

                & .session-detail__offer-text {
                    margin: 0;
                    font-size: 0.8125rem;
                    line-height: 1.5;
                    color: ${o("text")};
                    max-width: 68ch;
                }
                & .session-detail__offer-button {
                    ${k()}
                    font-size: 0.8125rem;
                }
            }
            & .session-detail__offer.hidden { display: none; }

            & .session-detail__row {
                display: flex;
                align-items: center;
                gap: ${l("sm")};
                flex-wrap: wrap;
            }
            & .session-detail__row.hidden { display: none; }
            /*
             * Selects in a row on the page, not inside the form panel, keep a
             * raised --surface fill — the recessed --bg fill is only legible
             * against a card.
             */
            & .session-detail__row .ui-select__trigger { background: ${o("surface")}; }

            & .session-detail__save {
                ${k()}
                background: ${o("accent")};
                color: ${o("on-accent")};
                border: 1px solid ${o("accent")};
            }
            & .session-detail__secondary {
                    ${k()}
                }
            & .session-detail__save:focus-visible,
            & .session-detail__secondary:focus-visible { outline: 2px solid ${o("accent")}; outline-offset: 2px; }

            & .session-detail__prog-list, & .session-detail__ex-list {
                list-style: none;
                margin: 0;
                padding: 0;
                display: flex;
                flex-direction: column;
            }
            & .session-detail__prog-list { gap: ${l("xs")}; }
            & .session-detail__ex-list {
                border-top: 1px solid ${o("border")};
                counter-reset: occurrence;
            }
            & .session-detail__ex-list:empty { border-top: none; }
            & .session-detail__ex-item {
                border-bottom: 1px solid ${o("border")};
                padding: ${l("md")} 0;
                display: flex;
                flex-direction: column;
                gap: ${l("sm")};
            }

            & .session-detail__prog-item {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: ${l("sm")};
                padding: ${l("sm")} ${l("md")};
                background: ${o("surface")};
                border: 1px solid ${o("border")};
                border-radius: ${o("radius-md")};
                font-size: 0.875rem;
            }

            & .session-detail__ex-head {
                display: flex;
                align-items: baseline;
                justify-content: space-between;
                gap: ${l("md")};
                flex-wrap: wrap;
            }
            & .session-detail__ex-name {
                font-size: 0.9375rem;
                font-weight: 600;
                color: ${o("text")};
            }
            /* Performed order is data, so the ordinal is generated rather than
               typed into the name. */
            & .session-detail__ex-name::before {
                counter-increment: occurrence;
                content: counter(occurrence) ". ";
                color: ${o("text-muted")};
                font-variant-numeric: tabular-nums;
            }
            & .session-detail__ex-source {
                font-size: 0.75rem;
                font-weight: 600;
                color: ${o("text-muted")};
                border: 1px solid ${o("border")};
                border-radius: ${o("radius-pill")};
                padding: 2px ${l("sm")};
            }
            /* The static Row note is instruction copied WITH the occurrence —
               never an authored Note, so it carries no author, no timestamp and
               no composer. The brass hairline is what tells the two apart. */
            & .session-detail__ex-note {
                margin: 0;
                padding-left: ${l("md")};
                border-left: 2px solid ${o("brass-line")};
                font-size: 0.875rem;
                line-height: 1.6;
                color: ${o("text")};
                max-width: 68ch;
            }
            & .session-detail__ex-actions {
                display: flex;
                align-items: center;
                gap: ${l("md")};
                flex-wrap: wrap;
            }
            & .session-detail__link {
                background: none;
                border: none;
                padding: 0;
                font-family: inherit;
                font-size: 0.8125rem;
                font-weight: 600;
                color: ${o("accent-strong")};
                text-decoration: none;
                cursor: pointer;
                &:hover { text-decoration: underline; }
                &:focus-visible { outline: 2px solid ${o("accent")}; outline-offset: 2px; }
            }
            & .session-detail__link--danger { color: ${o("danger")}; }

            /* UI_DECISIONS §6: paired field rows collapse below 640px. */
            @media (max-width: 639px) {
                & .session-detail__pair { grid-template-columns: 1fr; }
                & .session-detail__row { align-items: stretch; }
            }
        }
    `;router=this.inject(L);auth=this.inject(ne);svc=this.inject(Vt);teachers=this.inject(le);stable=this.inject(pe);plans=this.inject(ue);toasts=this.inject(U);resolved=new u(!1);found=new u(!0);catalog=new u([]);programCatalog=new u([]);whenVal=new u("");durationVal=new u("");summaryVal=new u("");horseVal=new u("");planVal=new u("");programVal=new u("");exerciseVal=new u("");shareVals=new u([]);detailsError=new u("");openNotes=new u(new Set);confirmDelete=new u(!1);confirmRemove=new u(!1);pendingRemoval=new u(null);studentName=new u("");recipientsResolved=new u(!1);shareSeeded=new u(!1);sessionId(){return this.router.route.get().split("/")[2]??""}session(){return this.svc.get(this.sessionId())}viewer=new f(()=>{const e=this.session(),t=this.auth.currentUser.get()?.id;return e&&t&&e.studentId===t?"owner":"sharedTeacher"});controls=new f(()=>Aa(this.viewer.get()));conflicted=new f(()=>Ha(this.svc.error.get()));horses=new f(()=>ns(this.stable.items.get()));activePlans=new f(()=>ss(this.plans.items.get()));horseOptions=new f(()=>[{value:"",label:a("trainingSession.horse.none")},...this.horses.get().map(e=>({value:e.id,label:e.name}))]);planOptions=new f(()=>[{value:"",label:a("trainingSession.plan.none")},...this.activePlans.get().map(e=>({value:e.id,label:e.title}))]);programOptions=new f(()=>vt(this.programCatalog.get(),this.teachers.items.get(),e=>e.title,new Set((this.session()?.programs??[]).map(e=>e.id))));exerciseOptions=new f(()=>vt(this.catalog.get(),this.teachers.items.get(),e=>e.name,new Set((this.session()?.exercises??[]).map(e=>e.exerciseId))));teacherOptions=new f(()=>this.teachers.items.get().map(e=>({value:e.id,label:e.displayName})));teacherCount=new f(()=>this.teachers.items.get().length);pendingOwners=new f(()=>is(this.session()?.programs??[],this.programCatalog.get(),this.shareVals.get(),this.teachers.items.get()));onMount(){this.resolve()}async resolve(){this.shareSeeded.set(!1);const e=await this.svc.loadOne(this.sessionId());if(!e){this.found.set(!1),this.resolved.set(!0);return}this.whenVal.set(Bl(e.performedAt)),this.durationVal.set(e.durationMin===null?"":String(e.durationMin)),this.summaryVal.set(e.summary??""),this.horseVal.set(e.horseId??""),this.planVal.set(e.planId??""),this.shareVals.set([...e.sharedWithTeacherIds]),this.shareSeeded.set(!0),this.found.set(!0),this.resolved.set(!0);const t=this.auth.currentUser.get()?.id;if(t&&e.studentId===t){const[s,i]=await Promise.all([v.exercises.listForStudent().catch(()=>[]),v.programs.listForStudent().catch(()=>[]),this.teachers.load(),this.stable.load(),this.plans.load()]);this.catalog.set(s),this.programCatalog.set(i)}else{const s=await v.students.get({id:e.studentId}).catch(()=>null);this.studentName.set(s?.displayName??"")}this.recipientsResolved.set(!0)}audience(){const e=this.session();return e?this.viewer.get()==="owner"?_t(e.sharedWithTeacherIds,this.teachers.items.get()):Ma(e.sharedWithTeacherIds,this.auth.currentUser.get()?.id??"",a("trainingSession.share.you")):[]}noteRecipients(){const e=this.session();return e?this.viewer.get()==="owner"?_t(e.sharedWithTeacherIds,this.teachers.items.get()):[{id:e.studentId,name:this.studentName.get()}]:[]}roleOf=e=>e===this.session()?.studentId?"student":"teacher";exerciseThread(e,t){return{parentKind:"training_session_exercise",parentId:e,context:()=>[a("objectKind.exercise"),t].join(" · "),recipients:()=>this.noteRecipients(),roleOf:s=>this.roleOf(s.authorId),headingLevel:4}}sessionContext(){const e=this.session();return e?[a("objectKind.trainingSession"),Ge(e.performedAt),e.horseName].filter(Boolean).join(" · "):a("objectKind.trainingSession")}render(){const e=this.wire(Ml,{back:{...this.router.link("/traningspass"),textContent:()=>a("trainingSession.back"),className:()=>this.resolved.get()&&!this.found.get()?"session-detail__back hidden":"session-detail__back"},loading:{textContent:()=>a("trainingSession.loading"),className:()=>this.resolved.get()?"session-detail__loading hidden":"session-detail__loading"},body:{className:()=>this.resolved.get()&&this.found.get()?"session-detail__body":"session-detail__body hidden"},conflict:{className:()=>this.conflicted.get()?"session-detail__conflict":"session-detail__conflict hidden"},conflictText:{textContent:()=>a("trainingSession.conflict.message")},conflictRetry:{textContent:()=>a("trainingSession.conflict.action"),onclick:()=>{this.resolve()}},detailsSection:{className:()=>this.controls.get().editDetails?"session-detail__section":"session-detail__section hidden"},detailsHeading:{textContent:()=>a("trainingSession.section.details")},whenLabel:{textContent:()=>a("trainingSession.field.when")},whenInput:{value:()=>this.whenVal.get(),oninput:t=>this.whenVal.set(t.target.value)},durationLabel:{textContent:()=>a("trainingSession.field.duration")},durationInput:{value:()=>this.durationVal.get(),oninput:t=>this.durationVal.set(t.target.value)},horseField:{className:()=>this.horses.get().length===0?"session-detail__field hidden":"session-detail__field"},horseLabel:{textContent:()=>a("trainingSession.field.horse")},planField:{className:()=>this.activePlans.get().length===0?"session-detail__field hidden":"session-detail__field"},planLabel:{textContent:()=>a("trainingSession.field.plan")},summaryLabel:{textContent:()=>a("trainingSession.field.summary")},summaryInput:{value:()=>this.summaryVal.get(),oninput:t=>this.summaryVal.set(t.target.value)},detailsError:{textContent:()=>this.detailsError.get()},save:{textContent:()=>a("trainingSession.save")},detailsForm:{onsubmit:t=>{this.saveDetails(t)}},readSummarySection:{className:()=>this.controls.get().editDetails?"session-detail__section hidden":"session-detail__section"},readSummaryHeading:{textContent:()=>a("trainingSession.section.summary")},readSummary:{textContent:()=>this.session()?.summary??"",className:()=>this.session()?.summary?"session-detail__summary":"session-detail__summary hidden"},readSummaryEmpty:{textContent:()=>a("trainingSession.summary.empty"),className:()=>this.session()?.summary?"session-detail__muted hidden":"session-detail__muted"},sharingSection:{className:()=>this.controls.get().editSharing?"session-detail__section":"session-detail__section hidden"},sharingHeading:{textContent:()=>a("trainingSession.section.sharing")},sharingHint:{textContent:()=>a("trainingSession.sharing.hint"),className:()=>this.teacherCount.get()===0?"session-detail__hint hidden":"session-detail__hint"},sharingNone:{textContent:()=>a("trainingSession.sharing.none"),className:()=>this.teacherCount.get()===0?"session-detail__muted":"session-detail__muted hidden"},shareSingle:{className:()=>this.teacherCount.get()===1?"session-detail__check":"session-detail__check hidden"},shareSingleLabel:{textContent:()=>{const t=this.teachers.items.get()[0];return t?a("trainingSession.sharing.withTeacher",{name:t.displayName}):""}},shareSingleInput:{checked:()=>this.shareVals.get().length>0,onchange:t=>{const s=this.teachers.items.get()[0];s&&this.saveSharing(t.target.checked?[s.id]:[])}},shareMulti:{className:()=>this.teacherCount.get()>1?"session-detail__control":"session-detail__control hidden"},offer:{className:()=>this.pendingOwners.get().length>0?"session-detail__offer":"session-detail__offer hidden"},offerText:{textContent:()=>{const t=this.pendingOwners.get()[0];return t?a("trainingSession.programOffer",{name:t.displayName}):""}},offerAction:{textContent:()=>{const t=this.pendingOwners.get()[0];return t?a("trainingSession.programOffer.action",{name:t.displayName}):""},onclick:()=>{const t=this.pendingOwners.get()[0];t&&this.saveSharing([...new Set([...this.shareVals.get(),t.id])])}},programsSection:{className:()=>"session-detail__section"},programsHeading:{textContent:()=>a("trainingSession.section.programs")},programsHint:{textContent:()=>a("trainingSession.programs.detachHint"),className:()=>this.controls.get().editPrograms?"session-detail__hint":"session-detail__hint hidden"},programsEmpty:{textContent:()=>a("trainingSession.programs.empty"),className:()=>(this.session()?.programs.length??0)===0?"session-detail__muted":"session-detail__muted hidden"},programAdd:{className:()=>this.controls.get().editPrograms?"session-detail__row":"session-detail__row hidden"},attachProgram:{textContent:()=>a("trainingSession.programs.attach"),onclick:()=>{this.attachProgram()}},exercisesHeading:{textContent:()=>a("trainingSession.section.exercises")},exercisesEmpty:{textContent:()=>a("trainingSession.exercises.empty"),className:()=>(this.session()?.exercises.length??0)===0?"session-detail__muted":"session-detail__muted hidden"},exerciseAdd:{className:()=>this.controls.get().editExercises?"session-detail__row":"session-detail__row hidden"},addExercise:{textContent:()=>a("trainingSession.exercise.add"),onclick:()=>{this.addExercise()}}});return this.buildNotFound(this.ref(e,"notFoundHost")),this.buildHeader(this.ref(e,"headerHost")),this.buildPrograms(this.ref(e,"programList")),this.buildExercises(this.ref(e,"exerciseList")),this.spawn(D,this.ref(e,"horseHost"),{value:this.horseVal,options:this.horseOptions}),this.spawn(D,this.ref(e,"planHost"),{value:this.planVal,options:this.planOptions}),this.spawn(D,this.ref(e,"programHost"),{value:this.programVal,options:this.programOptions,placeholder:a("trainingSession.programs.placeholder")}),this.spawn(D,this.ref(e,"exerciseHost"),{value:this.exerciseVal,options:this.exerciseOptions,placeholder:a("trainingSession.exercise.placeholder")}),this.spawn(D,this.ref(e,"shareMulti"),{multiple:!0,values:this.shareVals,options:this.teacherOptions,placeholder:a("trainingSession.sharing.placeholder"),countLabel:t=>V("trainingSession.sharing.count",t)}),this.track(b(()=>{const t=this.programOptions.get(),s=this.programVal.get();s&&!t.some(i=>i.value===s)&&this.programVal.set("")})),this.track(b(()=>{const t=this.exerciseOptions.get(),s=this.exerciseVal.get();s&&!t.some(i=>i.value===s)&&this.exerciseVal.set("")})),this.track(b(()=>{const t=this.session(),s=this.shareVals.get(),i=this.shareSeeded.get(),r=this.teacherCount.get();t&&Ba({seeded:i,teacherCount:r,next:s,stored:t.sharedWithTeacherIds})&&P(()=>{this.commitSharing(s)})})),this.spawn(J,this.ref(e,"confirmDeleteHost"),{open:this.confirmDelete,title:a("trainingSession.confirm.delete.title"),message:()=>a("trainingSession.confirm.delete.message"),confirmLabel:a("trainingSession.action.delete"),cancelLabel:a("trainingSession.confirm.dismiss"),danger:!0,onconfirm:()=>{this.remove()}}),this.spawn(J,this.ref(e,"confirmRemoveHost"),{open:this.confirmRemove,title:a("trainingSession.confirm.removeExercise.title"),message:()=>{const t=this.pendingRemoval.get();return t?a("trainingSession.confirm.removeExercise.message",{name:t.name}):""},confirmLabel:a("trainingSession.exercise.remove"),cancelLabel:a("trainingSession.confirm.dismiss"),danger:!0,onconfirm:()=>{this.removeExercise()},oncancel:()=>this.pendingRemoval.set(null)}),jt(this.ref(e,"notesHost"),()=>{const t=this.session();return!t||!this.recipientsResolved.get()?null:{parentKind:"training_session",parentId:t.id,context:()=>this.sessionContext(),recipients:()=>this.noteRecipients(),roleOf:s=>this.roleOf(s.authorId)}},t=>this.track(t)),e}buildHeader(e){this.spawn(Je,e,{eyebrow:()=>a("objectKind.trainingSession"),title:()=>{const t=this.session();return t?Ce(t):a("trainingSession.title.plain")},chips:()=>this.headerChips(),recipients:()=>this.recipientsResolved.get()?this.audience():[],shared:()=>this.recipientsResolved.get()&&(this.session()?.sharedWithTeacherIds.length??0)>0,meta:()=>{const t=this.session();return t?[Ge(t.performedAt),It(t.durationMin),t.horseName].filter(Boolean).join(" · "):""},overflowActions:()=>this.controls.get().remove?[{label:a("trainingSession.action.delete"),onclick:()=>this.confirmDelete.set(!0)}]:[]})}headerChips(){const e=this.session();if(!e)return[];const t=[];e.planId&&e.planTitle&&t.push({label:ts(e.planTitle),href:`/planer/${e.planId}`});for(const s of e.programs)t.push({label:es(s),href:`/program/${s.id}`});return t}buildNotFound(e){let t=null;this.track(b(()=>{const s=this.resolved.get()&&!this.found.get();t?.destroy(),t=null,e.replaceChildren(),s&&(t=P(()=>{const i=new B({heading:()=>a("trainingSession.notFound.heading"),body:()=>a("trainingSession.notFound.body"),action:{label:()=>a("trainingSession.notFound.action"),onclick:()=>this.router.navigate("/traningspass")},headingLevel:1});return i.mount(e),i}))})),this.track(()=>t?.destroy())}buildPrograms(e){this.track(b(()=>{const t=this.session(),s=this.controls.get();e.replaceChildren();for(const i of t?.programs??[]){const r=document.createElement("li");r.className="session-detail__prog-item";const d=document.createElement("span");if(d.textContent=i.title,r.appendChild(d),s.editPrograms){const c=document.createElement("button");c.type="button",c.className="session-detail__link session-detail__link--danger",c.textContent=a("trainingSession.programs.detach"),c.onclick=()=>{this.detachProgram(i.id,i.title)},r.appendChild(c)}e.appendChild(r)}}))}buildExercises(e){const t=new Hs(s=>this.track(s));this.track(b(()=>{const s=this.session(),i=this.openNotes.get(),r=this.controls.get();if(t.reset(),e.replaceChildren(),!!s)for(const d of za(s.exercises)){const c=document.createElement("li");c.className="session-detail__ex-item";const h=document.createElement("div");h.className="session-detail__ex-head";const p=document.createElement("span");p.className="session-detail__ex-name",p.textContent=d.name,h.appendChild(p);const g=Ra(d,s.programs);if(g){const C=document.createElement("span");C.className="session-detail__ex-source",C.textContent=g,h.appendChild(C)}c.appendChild(h);const m=Fa(d);if(m){const C=document.createElement("p");C.className="session-detail__ex-note",C.textContent=m,c.appendChild(C)}const _=document.createElement("div");_.className="session-detail__ex-actions";const x=document.createElement("button");if(x.type="button",x.className="session-detail__link",x.textContent=i.has(d.id)?a("trainingSession.exercise.notesHide"):a("trainingSession.exercise.notesShow"),x.onclick=()=>this.toggleNotes(d.id),_.appendChild(x),r.editExercises){const C=document.createElement("button");C.type="button",C.className="session-detail__link session-detail__link--danger",C.textContent=a("trainingSession.exercise.remove"),C.onclick=()=>{this.pendingRemoval.set({exerciseId:d.exerciseId,name:d.name}),this.confirmRemove.set(!0)},_.appendChild(C)}if(c.appendChild(_),i.has(d.id)){const C=document.createElement("div");c.appendChild(C),t.mount(C,this.exerciseThread(d.id,d.name))}e.appendChild(c)}}))}toggleNotes(e){const t=new Set(this.openNotes.get());t.has(e)?t.delete(e):t.add(e),this.openNotes.set(t)}async saveDetails(e){e.preventDefault();const t=this.session();if(!t)return;const s=this.durationVal.get().trim();let i=null;if(s!==""){const _=Number(s);if(!Number.isInteger(_)||_<0){this.detailsError.set(a("trainingSessionCreate.error.duration"));return}i=_}this.detailsError.set("");const r={},d=this.whenVal.get();if(d){const _=Gl(d);_!==t.performedAt&&(r.performedAt=_)}i!==t.durationMin&&(r.durationMin=i);const c=this.summaryVal.get().trim(),h=c===""?null:c;h!==t.summary&&(r.summary=h);const p=this.horseVal.get();p!==(t.horseId??"")&&(r.horseId=p===""?null:p);const g=this.planVal.get();if(g!==(t.planId??"")&&(r.planId=g===""?null:g),Object.keys(r).length===0)return;await this.svc.update(t.id,r)&&this.toasts.show({message:a("trainingSession.saved"),variant:"success"})}async saveSharing(e){const t=this.teachers.items.get().length>1;this.shareVals.set(e),t||await this.commitSharing(e)}async commitSharing(e){const t=this.session();if(!t)return;await this.svc.update(t.id,{shareWithTeacherIds:e})?this.toasts.show({message:a("trainingSession.sharing.saved"),variant:"success"}):this.shareVals.set([...t.sharedWithTeacherIds])}async addExercise(){const e=this.session(),t=this.exerciseVal.get();if(!e||!t)return;await this.svc.addExercise(e.id,t)&&this.exerciseVal.set("")}async removeExercise(){const e=this.session(),t=this.pendingRemoval.get();this.pendingRemoval.set(null),!(!e||!t)&&await this.svc.removeExercise(e.id,t.exerciseId)}async attachProgram(){const e=this.session(),t=this.programVal.get();if(!e||!t)return;await this.svc.attachProgram(e.id,t)&&this.programVal.set("")}async detachProgram(e,t){const s=this.session();!s||!await this.svc.detachProgram(s.id,e)||this.toasts.show({message:a("trainingSession.toast.programDetached",{title:t}),action:{label:a("trainingSession.toast.undo"),onclick:()=>{this.svc.attachProgram(s.id,e)}}})}async remove(){const e=this.session();!e||!await this.svc.remove(e.id)||(this.toasts.show({message:a("trainingSession.toast.deleted"),variant:"success"}),this.router.navigate("/traningspass"))}}const ql=S('<div bind="host"></div>');class Ul extends ${router=this.inject(L);key=new f(()=>{const e=this.router.route.get();return e==="/traningspass"?"list":e==="/traningspass/ny"?"create":"detail"});render(){const e=this.wire(ql,{});return this.$swap(this.ref(e,"host"),this.key,{list:jl,create:Rl,detail:Kl}),e}}const Wl=S(`
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
`);class Yl extends ${static styles=`
        .pr-create {
            display: flex;
            flex-direction: column;
            gap: ${l("lg")};
            max-width: 34rem;
            font-family: ${o("font-ui")};

            & .pr-create__back {
                font-size: 0.875rem;
                color: ${o("text-muted")};
                text-decoration: none;
                &:hover { color: ${o("accent-strong")}; text-decoration: underline; }
                &:focus-visible { outline: 2px solid ${o("accent")}; outline-offset: 2px; }
            }

            /* Lora 500 only (UI_DECISIONS §3). */
            & .pr-create__title {
                margin: 0;
                font-family: ${o("font-display")};
                font-weight: 500;
                font-size: 1.75rem;
                line-height: 36px;
                color: ${o("text")};
            }

            /*
             * The fields sit in a panel, not loose on the page. The §4.8 field
             * recipe fills with --bg — the page-paper colour — so a form
             * rendered straight onto the route would give the field the same
             * colour as everything behind it. The panel is what the recessed
             * fill is recessed INTO. §4.8's own example shows the same thing.
             */
            & .pr-create__panel {
                ${q()}
                box-sizing: border-box;
                padding: ${l("xl")};
                display: flex;
                flex-direction: column;
                gap: ${l("lg")};
            }

            & .pr-create__field { display: flex; flex-direction: column; gap: ${l("xs")}; }
            & .pr-create__label {
                font-size: 0.8125rem;
                font-weight: 600;
                color: ${o("text")};
            }
            & .pr-create__hint {
                font-size: 0.8125rem;
                line-height: 1.5;
                color: ${o("text-muted")};
                max-width: 68ch;
            }
            & .pr-create__field-error {
                font-size: 0.8125rem;
                line-height: 1.5;
                color: ${o("danger")};
            }
            & .pr-create__field-error:empty { display: none; }

            & .pr-create__input, & .pr-create__textarea {
                ${R()}
                width: 100%;
                box-sizing: border-box;
            }
            & .pr-create__textarea { font-family: inherit; line-height: 1.6; resize: vertical; }

            /* The snapshot rule sits on the brass hairline — the one place the
               brass is allowed to carry meaning without carrying text (§05). */
            & .pr-create__note {
                margin: 0;
                padding-left: ${l("md")};
                border-left: 2px solid ${o("brass-line")};
                font-size: 0.8125rem;
                line-height: 1.6;
                color: ${o("text-muted")};
                max-width: 68ch;
            }

            & .pr-create__error {
                margin: 0;
                min-height: 1em;
                font-size: 0.875rem;
                color: ${o("danger")};
            }

            & .pr-create__actions { display: flex; gap: ${l("sm")}; flex-wrap: wrap; }
            /* §4.8: one primary per form. This is it. */
            & .pr-create__submit { ${k(o("radius-sm"),"primary")} }
            /* Avbryt is the ghost tier — not a second bordered button. */
            & .pr-create__cancel { ${k(o("radius-sm"),"ghost")} }

            @media (max-width: 639px) {
                & .pr-create__actions { flex-direction: column; align-items: stretch; }
                & .pr-create__title { font-size: 1.375rem; line-height: 30px; }
            }
        }
    `;router=this.inject(L);svc=this.inject(Ie);toasts=this.inject(U);titleVal=new u("");descVal=new u("");touched=new u(!1);render(){return this.wire(Wl,{back:{onclick:this.router.link("/library?flik=program").onclick,textContent:()=>a("program.back")},heading:{textContent:()=>a("programCreate.heading")},titleLabel:{textContent:()=>a("programCreate.field.title")},titleHint:{textContent:()=>a("programCreate.field.title.hint")},titleInput:{value:()=>this.titleVal.get(),"aria-invalid":()=>String(this.touched.get()&&this.titleVal.get().trim()===""),oninput:e=>this.titleVal.set(e.target.value)},titleError:{textContent:()=>this.touched.get()&&this.titleVal.get().trim()===""?a("program.error.title"):""},descLabel:{textContent:()=>a("programCreate.field.description")},descHint:{textContent:()=>a("programCreate.field.description.hint")},descInput:{value:()=>this.descVal.get(),oninput:e=>this.descVal.set(e.target.value)},snapshot:{textContent:()=>a("program.snapshot")},error:{textContent:()=>this.svc.error.get()?a("program.saveError"):""},submit:{textContent:()=>a("programCreate.submit"),disabled:()=>this.svc.loading.get()},cancel:{textContent:()=>a("programCreate.cancel"),onclick:()=>this.router.navigate("/library?flik=program")},form:{onsubmit:e=>{this.submit(e)}}})}async submit(e){e.preventDefault();const t=this.titleVal.get().trim();if(this.touched.set(!0),!t)return;const s=await this.svc.create({title:t,description:this.descVal.get().trim()});s&&(this.toasts.show({message:a("programCreate.created"),variant:"success"}),this.router.navigate(`/program/${s.id}`))}}function Xl(n){const e=[...n].sort((t,s)=>t.sortOrder-s.sortOrder);return e.map((t,s)=>({id:t.id,name:t.name,notes:t.notes,position:s+1,isFirst:s===0,isLast:s===e.length-1,archived:t.archivedAt!==null}))}function Ql(n,e){const t=new Set(e.map(s=>s.id));return n.filter(s=>!t.has(s.id))}function Jl(n,e){return n.some(t=>t.id===e)}function Zl(n,e,t){const s=[...n].sort((h,p)=>h.sortOrder-p.sortOrder),i=s.findIndex(h=>h.id===e);if(i===-1)return null;const r=i+t;if(r<0||r>=s.length)return null;const d=s.map(h=>h.id),c=d[i];return d[i]=d[r],d[r]=c,d}function ed(n){return`${n.id}:${n.position}:${n.archived?"a":"l"}:${n.notes??""}`}const td=S(`
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
`);class nd extends ${static styles=`
        .pr-detail {
            display: flex;
            flex-direction: column;
            gap: ${l("lg")};
            max-width: 44rem;
            font-family: ${o("font-ui")};

            & .pr-detail__back {
                font-size: 0.875rem;
                color: ${o("text-muted")};
                text-decoration: none;
                align-self: flex-start;
                &:hover { color: ${o("accent-strong")}; text-decoration: underline; }
                &:focus-visible { outline: 2px solid ${o("accent")}; outline-offset: 2px; }
            }

            & .pr-detail__loading {
                margin: 0;
                color: ${o("text-muted")};
                font-size: 0.875rem;
            }
            & .pr-detail__loading.hidden { display: none; }

            & .pr-detail__body { display: flex; flex-direction: column; gap: ${l("xl")}; }
            & .pr-detail__body.hidden { display: none; }

            & .pr-detail__eyebrow {
                margin: 0 0 ${l("xs")};
                font-size: 0.6875rem;
                line-height: 16px;
                font-weight: 700;
                letter-spacing: 0.14em;
                text-transform: uppercase;
                color: ${o("text-muted")};
            }

            /* Lora 500, and only 500 — UI_DECISIONS §3. */
            & .pr-detail__title {
                margin: 0;
                font-family: ${o("font-display")};
                font-weight: 500;
                font-size: 1.75rem;
                line-height: 36px;
                color: ${o("text")};
                overflow-wrap: anywhere;
            }
            & .pr-detail__section-title, & .pr-detail__danger-title {
                margin: 0 0 ${l("sm")};
                font-family: ${o("font-display")};
                font-weight: 500;
                font-size: 1.25rem;
                line-height: 28px;
                color: ${o("text")};
            }

            & .pr-detail__section-body {
                margin: 0 0 ${l("md")};
                font-size: 0.8125rem;
                line-height: 1.6;
                color: ${o("text-muted")};
                max-width: 68ch;
            }
            & .pr-detail__section-body.hidden { display: none; }

            /* The snapshot rule sits on the brass hairline — the one place the
               brass carries meaning without carrying text (§05). */
            & .pr-detail__note {
                margin: 0 0 ${l("lg")};
                padding-left: ${l("md")};
                border-left: 2px solid ${o("brass-line")};
                font-size: 0.8125rem;
                line-height: 1.6;
                color: ${o("text-muted")};
                max-width: 68ch;
            }

            & .pr-detail__form, & .pr-detail__add {
                display: flex;
                flex-direction: column;
                gap: ${l("lg")};
            }
            /*
             * The fields sit in a panel, not loose on the page. The §4.8 field
             * recipe fills with --bg — the page-paper colour — so a form
             * rendered straight onto the route would give the field the same
             * colour as everything behind it. The panel is what the recessed
             * fill is recessed INTO. §4.8's own example shows the same thing.
             */
            & .pr-detail__panel {
                ${q()}
                box-sizing: border-box;
                padding: ${l("xl")};
                display: flex;
                flex-direction: column;
                gap: ${l("lg")};
            }

            & .pr-detail__field { display: flex; flex-direction: column; gap: ${l("xs")}; }
            & .pr-detail__label { font-size: 0.8125rem; font-weight: 600; color: ${o("text")}; }
            & .pr-detail__field-error {
                font-size: 0.8125rem;
                line-height: 1.5;
                color: ${o("danger")};
            }
            & .pr-detail__field-error:empty { display: none; }

            & .pr-detail__input, & .pr-detail__textarea {
                ${R()}
                width: 100%;
                box-sizing: border-box;
            }
            & .pr-detail__textarea { font-family: inherit; line-height: 1.6; resize: vertical; }

            & .pr-detail__error {
                margin: 0;
                min-height: 1em;
                font-size: 0.875rem;
                color: ${o("danger")};
            }

            & .pr-detail__actions { display: flex; gap: ${l("sm")}; flex-wrap: wrap; }
            /* §4.8: one primary per form. Spara is it. */
            & .pr-detail__save { ${k(o("radius-sm"),"primary")} }
            /* Lägg till sits beside the picker — a second action on the page,
               never a second primary. */
            & .pr-detail__secondary {
                ${k()}
                white-space: nowrap;
            }

            & .pr-detail__add-row {
                display: flex;
                gap: ${l("sm")};
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
                margin: 0 0 ${l("lg")};
                padding: 0;
                border-top: 1px solid ${o("border")};
            }
            & .pr-detail__rows:empty { border-top: none; margin-bottom: 0; }
            & .pr-detail__rows > li { border-bottom: 1px solid ${o("border")}; }

            & .pr-ex {
                display: grid;
                grid-template-columns: 2.25rem minmax(0, 1fr) auto;
                gap: ${l("sm")} ${l("md")};
                align-items: start;
                padding: ${l("md")} ${l("sm")};
            }
            & .pr-ex__order {
                font-variant-numeric: tabular-nums;
                font-size: 0.875rem;
                font-weight: 600;
                color: ${o("text-muted")};
                padding-top: 2px;
            }
            & .pr-ex__body { display: flex; flex-direction: column; gap: ${l("xs")}; min-width: 0; }
            & .pr-ex__name {
                font-size: 0.9375rem;
                font-weight: 600;
                color: ${o("text")};
                overflow-wrap: anywhere;
            }
            & .pr-ex__notes {
                font-size: 0.8125rem;
                line-height: 1.5;
                color: ${o("text-muted")};
                white-space: pre-wrap;
                overflow-wrap: anywhere;
                &.hidden { display: none; }
                &:empty { display: none; }
            }
            & .pr-ex__note-edit {
                display: flex;
                flex-direction: column;
                gap: ${l("xs")};
                margin-top: ${l("xs")};
                &.hidden { display: none; }
            }
            & .pr-ex__note-label {
                font-size: 0.8125rem;
                color: ${o("text-muted")};
            }
            & .pr-ex__note-input {
                ${R()}
                /*
                 * This editor opens in place inside a sequence row drawn on
                 * the page, not inside a form panel, so it keeps a raised
                 * --surface fill. The recessed --bg fill the recipe supplies
                 * is only legible against a card, and wrapping every row in
                 * its own panel would restructure the list to solve a fill.
                 */
                background: ${o("surface")};
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
                gap: ${l("xs")};
            }
            & .pr-ex__note-error {
                font-size: 0.8125rem;
                color: ${o("danger")};
                &:empty { display: none; }
            }
            & .pr-ex__archived-hint {
                font-size: 0.8125rem;
                line-height: 1.5;
                color: ${o("warning")};
                max-width: 60ch;
            }
            /* An archived row is inert, and reads that way — the same dimming
               §4.3 gives a cancelled row. The remove control keeps full contrast
               so the one thing still worth doing here stays legible. */
            & .pr-ex--archived .pr-ex__name,
            & .pr-ex--archived .pr-ex__notes { opacity: 0.72; }

            & .pr-ex__controls {
                display: flex;
                gap: ${l("xs")};
                align-items: center;
                /* Row controls are secondary, and deliberately smaller than a
                   page-level button: a sequence of ten rows should not read as
                   ten stacked calls to action. */
                & button {
                    ${k()}
                    padding: 4px 10px;
                    font-size: 0.8125rem;
                }
                /* Removing a row is destructive, so it takes the danger tier —
                   an outline that fills only under the pointer. The compact
                   metrics are restated because this selector outranks the
                   element rule above. */
                & .pr-ex__remove {
                    ${k(o("radius-sm"),"danger")}
                    padding: 4px 10px;
                    font-size: 0.8125rem;
                }
            }

            /* §3.6: the destructive action lives in a SEPARATED area. */
            & .pr-detail__danger {
                padding-top: ${l("lg")};
                border-top: 1px solid ${o("border")};
            }
            & .pr-detail__danger-title { color: ${o("danger")}; }
            & .pr-detail__danger-action { ${k(o("radius-sm"),"danger")} }

            @media (max-width: 639px) {
                & .pr-detail__title { font-size: 1.375rem; line-height: 30px; }
                & .pr-ex {
                    grid-template-columns: 2.25rem minmax(0, 1fr);
                }
                & .pr-ex__controls { grid-column: 2; }
                & .pr-detail__add-row { flex-direction: column; align-items: stretch; }
            }
        }
    `;router=this.inject(L);svc=this.inject(Ie);toasts=this.inject(U);titleVal=new u("");descVal=new u("");touched=new u(!1);resolved=new u(!1);found=new u(!1);pickedId=new u("");addError=new u("");confirmArchive=new u(!1);confirmRemove=new u(!1);pendingRemoval=new u(null);editingNote=new u("");noteDraft=new u("");noteError=new u("");libraryLoaded=new u(!1);libraryFailed=new u(!1);rows=new f(()=>Xl(this.svc.exercises.get()));pickable=new f(()=>Ql(this.svc.availableExercises.get(),this.svc.exercises.get()));pickerOptions=new f(()=>this.pickable.get().map(e=>({value:e.id,label:e.name})));get programId(){return this.router.route.get().split("/")[2]??""}onMount(){this.svc.get(this.programId).then(e=>{e&&(this.titleVal.set(e.title),this.descVal.set(e.description),this.found.set(!0),this.svc.loadExercises(this.programId),this.svc.loadAvailableExercises().then(t=>{this.libraryLoaded.set(t),this.libraryFailed.set(!t)})),this.resolved.set(!0)}),this.track(b(()=>{const e=this.pickerOptions.get(),t=this.pickedId.get();t&&!e.some(s=>s.value===t)&&this.pickedId.set("")}))}render(){const e=this.wire(td,{back:{onclick:this.router.link("/library?flik=program").onclick,textContent:()=>a("program.back")},loading:{textContent:()=>a("program.loading"),className:()=>this.resolved.get()?"pr-detail__loading hidden":"pr-detail__loading"},body:{className:()=>this.resolved.get()&&this.found.get()?"pr-detail__body":"pr-detail__body hidden"},eyebrow:{textContent:()=>a("program.eyebrow")},title:{textContent:()=>this.titleVal.get()},titleLabel:{textContent:()=>a("program.field.title")},titleInput:{value:()=>this.titleVal.get(),"aria-invalid":()=>String(this.touched.get()&&this.titleVal.get().trim()===""),oninput:t=>this.titleVal.set(t.target.value)},titleError:{textContent:()=>this.touched.get()&&this.titleVal.get().trim()===""?a("program.error.title"):""},descLabel:{textContent:()=>a("program.field.description")},descInput:{value:()=>this.descVal.get(),oninput:t=>this.descVal.set(t.target.value)},error:{textContent:()=>this.svc.error.get()?a("program.saveError"):""},save:{textContent:()=>a("program.save"),disabled:()=>this.svc.loading.get()},form:{onsubmit:t=>{this.save(t)}},builderHeading:{textContent:()=>a("program.exercises.heading")},snapshot:{textContent:()=>a("program.snapshot")},builderEmpty:{textContent:()=>a("program.exercises.empty"),className:()=>this.rows.get().length===0?"pr-detail__section-body":"pr-detail__section-body hidden"},addLabel:{textContent:()=>a("program.add.label")},addBtn:{textContent:()=>a("program.add.submit"),disabled:()=>this.pickedId.get()===""},addNote:{textContent:()=>this.libraryFailed.get()?a("program.add.error"):this.libraryLoaded.get()?this.svc.availableExercises.get().length===0?a("program.add.none"):this.pickable.get().length===0?a("program.add.exhausted"):"":"",className:()=>"pr-detail__section-body"},addError:{textContent:()=>this.addError.get()},addForm:{onsubmit:t=>{this.add(t)}},dangerHeading:{textContent:()=>a("program.danger.heading")},dangerBody:{textContent:()=>a("program.danger.body")},archive:{textContent:()=>a("program.danger.action"),onclick:()=>this.confirmArchive.set(!0)}});return this.spawn(D,this.ref(e,"pickerHost"),{value:this.pickedId,options:this.pickerOptions,placeholder:a("program.add.placeholder")}),this.buildMissing(this.ref(e,"missingHost")),this.$each(this.ref(e,"rows"),this.rows,(t,s,i)=>this.renderRow(t,i),ed),this.buildConfirm(this.ref(e,"confirmArchiveHost"),{open:this.confirmArchive,title:a("program.confirm.archive.title"),message:()=>a("program.confirm.archive.message",{title:this.titleVal.get()}),confirmLabel:a("program.danger.action"),onconfirm:()=>{this.archive()}}),this.buildConfirm(this.ref(e,"confirmRemoveHost"),{open:this.confirmRemove,title:a("program.confirm.remove.title"),message:()=>{const t=this.pendingRemoval.get(),s=t?.name??"";return t?t.archived?t.notes?a("program.confirm.removeArchivedNoted.message",{name:s}):a("program.confirm.remove.message",{name:s}):a("program.confirm.removeNoted.message",{name:s}):a("program.confirm.remove.message",{name:s})},confirmLabel:a("program.row.remove"),onconfirm:()=>{const t=this.pendingRemoval.peek();t&&this.remove(t)}}),e}buildConfirm(e,t){this.spawn(J,e,{open:t.open,title:t.title,message:t.message,confirmLabel:t.confirmLabel,cancelLabel:a("program.confirm.dismiss"),danger:!0,onconfirm:t.onconfirm}),this.track(b(()=>{e.inert=!t.open.get()}))}buildMissing(e){let t=null;this.track(b(()=>{const s=this.resolved.get()&&!this.found.get();t?.destroy(),t=null,e.replaceChildren(),s&&(t=P(()=>{const i=new B({heading:()=>a("program.notFound.heading"),body:()=>a("program.notFound.body"),action:{label:()=>a("program.notFound.action"),onclick:()=>this.router.navigate("/library?flik=program")},headingLevel:2});return i.mount(e),i}))})),this.track(()=>t?.destroy())}renderRow(e,t){const s=document.createElement("li"),i=document.createElement("div");i.className=e.archived?"pr-ex pr-ex--archived":"pr-ex";const r=document.createElement("span");r.className="pr-ex__order",r.textContent=String(e.position),i.appendChild(r);const d=document.createElement("div");d.className="pr-ex__body";const c=document.createElement("span");if(c.className="pr-ex__name",c.textContent=e.name,d.appendChild(c),e.archived){const W=document.createElement("span");d.appendChild(W);const Ft=new Z({label:a("program.row.archived"),variant:"dashed",tone:"warning"});Ft.mount(W),t(()=>Ft.destroy());const et=document.createElement("span");et.className="pr-ex__archived-hint",et.textContent=a("program.row.archived.hint"),d.appendChild(et)}const h=document.createElement("span");h.className="pr-ex__notes",h.textContent=e.notes??"",d.appendChild(h);const p=document.createElement("form");p.className="pr-ex__note-edit hidden";const g=document.createElement("label");g.className="pr-ex__note-label",g.textContent=a("program.row.note.label");const m=document.createElement("textarea");m.className="pr-ex__note-input",m.rows=2,m.maxLength=2e3,m.addEventListener("input",()=>this.noteDraft.set(m.value)),g.htmlFor=m.id||(m.id="pr-ex-note-input"),p.appendChild(g),p.appendChild(m);const _=document.createElement("p");_.className="pr-ex__note-error",_.setAttribute("role","alert"),p.appendChild(_);const x=document.createElement("div");x.className="pr-ex__note-actions";const C=document.createElement("button");C.type="submit",C.textContent=a("program.row.note.save");const E=document.createElement("button");E.type="button",E.textContent=a("program.row.note.cancel"),E.addEventListener("click",()=>this.closeNote()),x.append(C,E),p.appendChild(x),p.addEventListener("submit",W=>{W.preventDefault(),this.saveNote(e)}),d.appendChild(p),t(b(()=>{const W=this.editingNote.get()===e.id;p.className=W?"pr-ex__note-edit":"pr-ex__note-edit hidden",p.inert=!W,h.className=!W&&e.notes?"pr-ex__notes":"pr-ex__notes hidden",_.textContent=W?this.noteError.get():"",W&&m.value!==this.noteDraft.get()&&(m.value=this.noteDraft.get())})),i.appendChild(d);const T=document.createElement("div");T.className="pr-ex__controls",e.archived||(e.isFirst||T.appendChild(this.orderButton("↑",a("program.row.up",{name:e.name}),()=>{this.move(e.id,-1)})),e.isLast||T.appendChild(this.orderButton("↓",a("program.row.down",{name:e.name}),()=>{this.move(e.id,1)})));const O=document.createElement("button");O.type="button",O.className="pr-ex__note-btn",O.textContent=e.notes?a("program.row.note.edit"):a("program.row.note.add"),O.setAttribute("aria-label",e.notes?a("program.row.note.editNamed",{name:e.name}):a("program.row.note.addNamed",{name:e.name})),O.addEventListener("click",()=>this.openNote(e)),T.appendChild(O);const G=document.createElement("button");return G.type="button",G.className="pr-ex__remove",G.textContent=a("program.row.remove"),G.setAttribute("aria-label",a("program.row.removeNamed",{name:e.name})),G.addEventListener("click",()=>{if(e.archived||e.notes){this.pendingRemoval.set(e),this.confirmRemove.set(!0);return}this.remove(e)}),T.appendChild(G),i.appendChild(T),s.appendChild(i),s}orderButton(e,t,s){const i=document.createElement("button");return i.type="button",i.textContent=e,i.setAttribute("aria-label",t),i.title=t,i.addEventListener("click",s),i}async save(e){e.preventDefault();const t=this.titleVal.get().trim();this.touched.set(!0),!(!t||!await this.svc.update(this.programId,{title:t,description:this.descVal.get().trim()}))&&this.toasts.show({message:a("program.saved"),variant:"success"})}async add(e){e.preventDefault();const t=this.pickedId.get();if(!t)return;if(Jl(this.svc.exercises.peek(),t)){const i=this.svc.availableExercises.peek().find(r=>r.id===t)?.name??"";this.addError.set(a("program.add.duplicate",{name:i}));return}if(this.addError.set(""),!await this.svc.addExerciseToProgram(this.programId,t)){this.addError.set(a("program.add.failed"));return}this.pickedId.set("")}openNote(e){this.noteError.set(""),this.noteDraft.set(e.notes??""),this.editingNote.set(e.id)}closeNote(){this.editingNote.set(""),this.noteDraft.set(""),this.noteError.set("")}async saveNote(e){const t=this.noteDraft.peek().trim();if(t===(e.notes??"")){this.closeNote();return}if(this.noteError.set(""),this.editingNote.set(""),!await this.svc.updateExerciseNotes(this.programId,e.id,t===""?null:t)){this.noteDraft.set(t),this.editingNote.set(e.id),this.noteError.set(a("program.row.note.failed"));return}this.closeNote(),this.toasts.show({message:a("program.row.note.saved"),variant:"success"})}async move(e,t){const s=Zl(this.svc.exercises.peek(),e,t);if(!s)return;await this.svc.reorderExercises(this.programId,s)||this.toasts.show({message:a("program.reorderError"),variant:"error"})}async remove(e){this.pendingRemoval.set(null),await this.svc.removeExercise(this.programId,e.id)}async archive(){await this.svc.archive(this.programId)&&(this.toasts.show({message:a("program.archived"),variant:"success"}),this.router.navigate("/library?flik=program"))}}const sd=S('<div bind="host"></div>'),Os=S("<div></div>");class id extends ${router=this.inject(L);onMount(){this.router.navigate(Mr,{replace:!0})}render(){return this.wire(Os,{})}}class ad extends ${render(){return this.wire(Os,{})}}class od extends ${router=this.inject(L);key=new f(()=>{const e=this.router.route.get();return e==="/program"?"forward":e==="/program/nytt"?"create":e.startsWith("/program/")?"detail":"none"});render(){const e=this.wire(sd,{});return this.$swap(this.ref(e,"host"),this.key,{forward:id,create:Yl,detail:nd,none:ad}),e}}const rd=S(`
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
`);class ld extends ${static styles=`
        .plans {
            & .plans__head {
                display: flex;
                align-items: baseline;
                justify-content: space-between;
                gap: ${l("lg")};
                flex-wrap: wrap;
                margin-bottom: ${l("xl")};
            }

            /* Lora 500, and only 500 — UI_DECISIONS §3. */
            & .plans__title {
                margin: 0;
                font-family: ${o("font-display")};
                font-weight: 500;
                font-size: 1.75rem;
                line-height: 36px;
                color: ${o("text")};
            }

            /*
             * Buttons are Open Sans territory; the serif is forbidden here.
             * This is the view's one primary — the only thing a reader who
             * arrived with nothing to read can do.
             */
            & .plans__create { ${k(o("radius-sm"),"primary")} }

            & .plans__loading {
                margin: 0;
                color: ${o("text-muted")};
                font-size: 0.875rem;
            }
            & .plans__loading.hidden { display: none; }

            & .plans__error {
                display: flex;
                align-items: center;
                gap: ${l("md")};
                flex-wrap: wrap;
                padding: ${l("md")};
                margin-bottom: ${l("lg")};
                border: 1px solid ${o("danger")};
                border-radius: ${o("radius-md")};
                background: ${o("danger-soft")};

                & .plans__error-text { margin: 0; font-size: 0.875rem; color: ${o("text")}; }
                /* Retry is secondary: recovering from a failure is not the
                   thing this page is for. */
                & .plans__retry { ${k()} }
            }
            & .plans__error.hidden { display: none; }

            & .plans__group { margin-bottom: ${l("xl")}; }
            & .plans__group.hidden { display: none; }

            /* Uppercase group label — letterspaced, never the serif (§4.3). */
            & .plans__group-label {
                margin: 0 0 ${l("md")};
                font-family: ${o("font-ui")};
                font-size: 0.6875rem;
                line-height: 16px;
                font-weight: 700;
                letter-spacing: 0.14em;
                text-transform: uppercase;
                color: ${o("text-muted")};
            }

            /* The archive disclosure carries the group label's own typography —
               it IS the group label, and pressing it is what the label offers. */
            & .plans__disclosure {
                display: inline-flex;
                align-items: center;
                gap: ${l("sm")};
                margin: 0 0 ${l("md")};
                padding: ${l("xs")} 0;
                background: transparent;
                border: none;
                cursor: pointer;
                font-family: ${o("font-ui")};
                font-size: 0.6875rem;
                line-height: 16px;
                font-weight: 700;
                letter-spacing: 0.14em;
                text-transform: uppercase;
                color: ${o("text-muted")};
                &:hover { color: ${o("accent-strong")}; }
                &:focus-visible { outline: 2px solid ${o("accent")}; outline-offset: 2px; }
            }

            & .plans__list {
                list-style: none;
                margin: 0;
                padding: 0;
                /* No zebra striping (§4.3): rows are separated by a hairline. */
                border-top: 1px solid ${o("border")};
            }
            & .plans__list:empty { border-top: none; }
            & .plans__list.hidden { display: none; }
            & .plans__list > li { border-bottom: 1px solid ${o("border")}; }

            & .plan-row {
                display: grid;
                grid-template-columns: minmax(0, 1fr) auto;
                align-items: start;
                gap: ${l("lg")};
                padding: ${l("md")} ${l("sm")};
                text-decoration: none;
                color: inherit;
                font-family: ${o("font-ui")};

                &:hover { background: ${o("surface-2")}; }
                &:focus-visible { outline: 2px solid ${o("accent")}; outline-offset: -2px; }
            }
            /* Archived rows are dimmed, as §4.3 dims a cancelled row — the
               status pill still carries the meaning without colour. */
            & .plan-row--archived { opacity: 0.72; }

            & .plan-row__body {
                display: flex;
                flex-direction: column;
                gap: ${l("xs")};
                min-width: 0;
            }
            & .plan-row__title {
                font-size: 0.9375rem;
                font-weight: 600;
                color: ${o("text")};
                overflow-wrap: anywhere;
            }
            /* One meta line, not four — §4.3 allows at most two rows of text. */
            & .plan-row__meta {
                display: flex;
                align-items: baseline;
                flex-wrap: wrap;
                gap: ${l("xs")} ${l("sm")};
                font-size: 0.8125rem;
                color: ${o("text-muted")};
            }
            & .plan-row__excerpt {
                font-size: 0.8125rem;
                line-height: 1.5;
                color: ${o("text-muted")};
                overflow-wrap: anywhere;
            }

            & .plan-row__chips {
                display: flex;
                flex-wrap: wrap;
                gap: ${l("xs")};
                justify-content: flex-end;
                align-items: flex-start;
                max-width: 18rem;
            }

            /* UI_DECISIONS §6: single column below 640px. */
            @media (max-width: 639px) {
                & .plan-row {
                    grid-template-columns: minmax(0, 1fr);
                    gap: ${l("sm")};
                }
                & .plan-row__chips { justify-content: flex-start; max-width: none; }
                & .plans__title { font-size: 1.375rem; line-height: 30px; }
            }
        }
    `;router=this.inject(L);plans=this.inject(ue);showArchived=new u(!1);grouped=new f(()=>ua(this.plans.items.get()));active=new f(()=>this.grouped.get().active);archived=new f(()=>this.grouped.get().archived);isEmpty=new f(()=>this.plans.items.get().length===0&&!this.plans.loading.get()&&this.plans.error.get()===null);onMount(){this.plans.load()}render(){const e=this.wire(rd,{heading:{textContent:()=>a("plans.heading")},create:{textContent:()=>a("plans.create"),onclick:()=>this.router.navigate("/planer/ny")},loading:{textContent:()=>a("plans.loading"),className:()=>this.plans.loading.get()&&this.plans.items.get().length===0&&this.plans.error.get()===null?"plans__loading":"plans__loading hidden"},errorBox:{className:()=>this.plans.error.get()?"plans__error":"plans__error hidden"},errorText:{textContent:()=>a("plans.error")},retry:{textContent:()=>a("plans.retry"),onclick:()=>{this.plans.load()}},activeSection:{className:()=>this.active.get().length===0?"plans__group hidden":"plans__group"},activeLabel:{textContent:()=>a("plans.group.active")},archivedSection:{className:()=>this.archived.get().length===0?"plans__group plans__group--archived hidden":"plans__group plans__group--archived"},archivedToggle:{textContent:()=>this.showArchived.get()?a("plans.archived.hide"):V("plans.archived.show",this.archived.get().length),"aria-expanded":()=>String(this.showArchived.get()),onclick:()=>this.showArchived.set(!this.showArchived.peek())},archivedList:{className:()=>this.showArchived.get()?"plans__list":"plans__list hidden"}});return this.buildEmpty(this.ref(e,"emptyHost")),this.$each(this.ref(e,"activeList"),this.active,(t,s,i)=>this.renderRow(t,i),dn),this.$each(this.ref(e,"archivedList"),this.archived,(t,s,i)=>this.renderRow(t,i),dn),e}buildEmpty(e){let t=null;this.track(b(()=>{const s=this.isEmpty.get();t?.destroy(),t=null,e.replaceChildren(),s&&(t=P(()=>{const i=new B({heading:()=>a("plans.empty.heading"),body:()=>a("plans.empty.body"),action:{label:()=>a("plans.empty.action"),onclick:()=>this.router.navigate("/planer/ny")},headingLevel:2});return i.mount(e),i}))})),this.track(()=>t?.destroy())}renderRow(e,t){const s=document.createElement("li"),i=`/planer/${e.id}`,r=document.createElement("a");r.className=e.status==="archived"?"plan-row plan-row--archived":"plan-row",r.href=i,r.addEventListener("click",T=>{T.preventDefault(),this.router.navigate(i)});const d=document.createElement("span");d.className="plan-row__body";const c=document.createElement("span");c.className="plan-row__title",c.textContent=e.title,d.appendChild(c);const h=document.createElement("span");h.className="plan-row__meta";const p=Te(e.startDate,e.endDate);p&&h.appendChild(Nn(p));const g=We(e.primaryTeacherDisplayName);g&&h.appendChild(Nn(g)),h.childElementCount>0&&d.appendChild(h);const m=Nt(e.description);if(m){const T=document.createElement("span");T.className="plan-row__excerpt",T.textContent=m,d.appendChild(T)}const _=document.createElement("span");_.className="plan-row__chips";const x=Et(e.status),C=document.createElement("span");_.appendChild(C);const E=new Z({label:x.label,variant:x.variant,tone:x.tone,...x.glyph===void 0?{}:{glyph:x.glyph}});return E.mount(C),t(()=>E.destroy()),r.append(d,_),s.appendChild(r),s}}function Nn(n){const e=document.createElement("span");return e.textContent=n,e}const dd=S(`
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
`);class cd extends ${static styles=`
        .new-plan {
            display: flex;
            flex-direction: column;
            gap: ${l("lg")};
            max-width: 34rem;
            font-family: ${o("font-ui")};

            & .new-plan__back {
                font-size: 0.875rem;
                color: ${o("text-muted")};
                text-decoration: none;
                &:hover { color: ${o("accent-strong")}; text-decoration: underline; }
                &:focus-visible { outline: 2px solid ${o("accent")}; outline-offset: 2px; }
            }

            /* Lora 500 only (UI_DECISIONS §3). */
            & .new-plan__title {
                margin: 0;
                font-family: ${o("font-display")};
                font-weight: 500;
                font-size: 1.75rem;
                line-height: 36px;
                color: ${o("text")};
            }

            /*
             * The fields sit in a panel, not loose on the page. The §4.8 field
             * recipe fills with --bg — the page-paper colour — so a form
             * rendered straight onto the route would give the field the same
             * colour as everything behind it. The panel is what the recessed
             * fill is recessed INTO. §4.8's own example shows the same thing.
             */
            & .new-plan__panel {
                ${q()}
                box-sizing: border-box;
                padding: ${l("xl")};
                display: flex;
                flex-direction: column;
                gap: ${l("lg")};
            }

            & .new-plan__field {
                display: flex;
                flex-direction: column;
                gap: ${l("xs")};
            }
            & .new-plan__field.hidden { display: none; }

            & .new-plan__pair {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: ${l("md")};
            }

            & .new-plan__label {
                font-size: 0.8125rem;
                font-weight: 600;
                color: ${o("text")};
            }

            & .new-plan__hint {
                margin: 0;
                font-size: 0.8125rem;
                line-height: 1.5;
                color: ${o("text-muted")};
                max-width: 68ch;
            }
            & .new-plan__hint:empty { display: none; }

            /* Field-level error: sits under its own input, names the fix. */
            & .new-plan__field-error {
                font-size: 0.8125rem;
                line-height: 1.5;
                color: ${o("danger")};
            }
            & .new-plan__field-error:empty { display: none; }

            & .new-plan__input, & .new-plan__textarea {
                ${R()}
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
                color: ${o("danger")};
            }

            & .new-plan__actions {
                display: flex;
                gap: ${l("sm")};
                flex-wrap: wrap;
            }
            /* §4.8: one primary per form. This is it. */
            & .new-plan__submit { ${k(o("radius-sm"),"primary")} }
            /* Avbryt is the ghost tier — not a second bordered button. */
            & .new-plan__cancel { ${k(o("radius-sm"),"ghost")} }

            /* UI_DECISIONS §6: paired field rows collapse below 640px. */
            @media (max-width: 639px) {
                & .new-plan__pair { grid-template-columns: 1fr; }
                & .new-plan__actions { flex-direction: column; align-items: stretch; }
                & .new-plan__title { font-size: 1.375rem; line-height: 30px; }
            }
        }
    `;router=this.inject(L);plans=this.inject(ue);teachers=this.inject(le);toasts=this.inject(U);titleVal=new u("");descVal=new u("");startVal=new u("");endVal=new u("");primaryVal=new u("");titleTouched=new u(!1);teacherOptions=new f(()=>[{value:"",label:a("plan.primaryTeacher.none")},...this.teachers.items.get().map(e=>({value:e.id,label:e.displayName}))]);rangeInvalid=new f(()=>!qn(this.startVal.get()||null,this.endVal.get()||null));onMount(){this.teachers.load()}render(){const e=this.wire(dd,{back:{onclick:this.router.link("/planer").onclick,textContent:()=>a("plan.back")},heading:{textContent:()=>a("planCreate.heading")},titleLabel:{textContent:()=>a("planCreate.field.title")},titleInput:{value:()=>this.titleVal.get(),"aria-invalid":()=>String(this.titleTouched.get()&&this.titleVal.get().trim()===""),oninput:t=>this.titleVal.set(t.target.value)},titleError:{textContent:()=>this.titleTouched.get()&&this.titleVal.get().trim()===""?a("plan.error.title"):""},descLabel:{textContent:()=>a("planCreate.field.description")},descHint:{textContent:()=>a("planCreate.field.description.hint")},descInput:{value:()=>this.descVal.get(),oninput:t=>this.descVal.set(t.target.value)},startLabel:{textContent:()=>a("planCreate.field.start")},startInput:{value:()=>this.startVal.get(),oninput:t=>this.startVal.set(t.target.value)},endLabel:{textContent:()=>a("planCreate.field.end")},endInput:{value:()=>this.endVal.get(),"aria-invalid":()=>String(this.rangeInvalid.get()),oninput:t=>this.endVal.set(t.target.value)},endError:{textContent:()=>this.rangeInvalid.get()?a("plan.error.range",{start:this.startVal.get()}):""},rangePreview:{textContent:()=>this.rangeInvalid.get()?"":Te(this.startVal.get()||null,this.endVal.get()||null)??""},teacherField:{className:()=>this.teachers.items.get().length===0?"new-plan__field hidden":"new-plan__field"},teacherLabel:{textContent:()=>a("planCreate.field.primaryTeacher")},teacherHint:{textContent:()=>a("plan.primaryTeacher.hint")},error:{textContent:()=>this.plans.error.get()?a("plan.saveError"):""},submit:{textContent:()=>a("planCreate.submit"),disabled:()=>this.plans.loading.get()||this.rangeInvalid.get()},cancel:{textContent:()=>a("planCreate.cancel"),onclick:()=>this.router.navigate("/planer")},form:{onsubmit:t=>{this.submit(t)}}});return this.spawn(D,this.ref(e,"teacherHost"),{value:this.primaryVal,options:this.teacherOptions}),e}async submit(e){e.preventDefault();const t=this.titleVal.get().trim();if(this.titleTouched.set(!0),!t||this.rangeInvalid.get())return;const s=this.descVal.get().trim(),i=this.startVal.get(),r=this.endVal.get(),d=this.primaryVal.get(),c=await this.plans.create({title:t,...s?{description:s}:{},...i?{startDate:i}:{},...r?{endDate:r}:{},...d?{primaryTeacherId:d}:{}});c&&(this.toasts.show({message:a("planCreate.created"),variant:"success"}),this.router.navigate(`/planer/${c.id}`))}}class Ze{items=new u([]);loading=new u(!1);error=new u(null);async load(){const e=await w(this.loading,this.error,()=>v.goals.list());e&&this.items.set(e)}async loadDetail(e){return await w(this.loading,this.error,()=>v.goals.get({id:e}))??null}async loadShares(e){return await w(this.loading,this.error,()=>v.goals.listShares({id:e}))??null}async create(e){const t=await w(this.loading,this.error,()=>v.goals.create(e));return t?(this.items.set([t,...this.items.get()]),t):null}async update(e,t){const s=await w(this.loading,this.error,()=>v.goals.update({id:e,...t}));return s?(this.merge(s),s):null}async achieve(e){return await w(this.loading,this.error,()=>v.goals.achieve({id:e}))!==void 0}async reopen(e){return await w(this.loading,this.error,()=>v.goals.reopen({id:e}))!==void 0}async abandon(e){return await w(this.loading,this.error,()=>v.goals.abandon({id:e}))!==void 0}async share(e,t){return await w(this.loading,this.error,()=>v.goals.share({id:e,teacherId:t}))?(this.items.set(this.items.get().map(i=>i.id!==e||i.sharedTeacherIds.includes(t)?i:{...i,sharedTeacherIds:[...i.sharedTeacherIds,t]})),!0):!1}async unshare(e,t){return await w(this.loading,this.error,()=>v.goals.unshare({id:e,teacherId:t}))?(this.items.set(this.items.get().map(i=>i.id!==e?i:{...i,sharedTeacherIds:i.sharedTeacherIds.filter(r=>r!==t)})),!0):!1}async attachPlan(e,t){return await w(this.loading,this.error,()=>v.goals.attachPlan({id:e,planId:t}))?(this.items.set(this.items.get().map(i=>i.id!==e||i.planIds.includes(t)?i:{...i,planIds:[...i.planIds,t]})),!0):!1}async detachPlan(e,t){return await w(this.loading,this.error,()=>v.goals.detachPlan({id:e,planId:t}))?(this.items.set(this.items.get().map(i=>i.id!==e?i:{...i,planIds:i.planIds.filter(r=>r!==t)})),!0):!1}get(e){return this.items.get().find(t=>t.id===e)??null}merge(e){const t=this.items.get(),s=t.findIndex(i=>i.id===e.id);this.items.set(s===-1?[e,...t]:[...t.slice(0,s),e,...t.slice(s+1)])}}const hd=S(`
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
`);class pd extends ${static styles=`
        .plan-detail {
            display: flex;
            flex-direction: column;
            gap: ${l("lg")};
            font-family: ${o("font-ui")};

            & .plan-detail__back {
                font-size: 0.875rem;
                color: ${o("text-muted")};
                text-decoration: none;
                &:hover { color: ${o("accent-strong")}; text-decoration: underline; }
                &:focus-visible { outline: 2px solid ${o("accent")}; outline-offset: 2px; }
            }

            & .plan-detail__loading {
                margin: 0;
                color: ${o("text-muted")};
                font-size: 0.875rem;
            }
            & .plan-detail__loading.hidden { display: none; }

            & .plan-detail__body {
                display: flex;
                flex-direction: column;
                gap: ${l("xl")};
            }
            & .plan-detail__body.hidden { display: none; }

            & .plan-detail__section {
                display: flex;
                flex-direction: column;
                gap: ${l("md")};
            }
            & .plan-detail__section.hidden { display: none; }

            /* A section heading is one of the places the serif is allowed —
               Lora, weight 500, and only 500 (UI_DECISIONS §3). */
            & .plan-detail__heading {
                margin: 0;
                font-family: ${o("font-display")};
                font-weight: 500;
                font-size: 1.25rem;
                line-height: 1.4;
                color: ${o("text")};
            }

            & .plan-detail__group { display: flex; flex-direction: column; gap: ${l("sm")}; }
            & .plan-detail__group.hidden { display: none; }

            /* Uppercase group label — letterspaced, never the serif (§4.3). */
            & .plan-detail__group-label {
                margin: 0;
                font-family: ${o("font-ui")};
                font-size: 0.6875rem;
                line-height: 16px;
                font-weight: 700;
                letter-spacing: 0.14em;
                text-transform: uppercase;
                color: ${o("text-muted")};
            }

            & .plan-detail__prose {
                margin: 0;
                max-width: 68ch;
                font-size: 0.9375rem;
                line-height: 1.6;
                color: ${o("text")};
                white-space: pre-wrap;
            }
            & .plan-detail__prose.hidden { display: none; }

            & .plan-detail__muted {
                margin: 0;
                font-size: 0.875rem;
                color: ${o("text-muted")};
            }
            & .plan-detail__muted.hidden { display: none; }

            & .plan-detail__hint {
                margin: 0;
                font-size: 0.8125rem;
                line-height: 1.5;
                color: ${o("text-muted")};
                max-width: 68ch;
            }
            & .plan-detail__hint.hidden { display: none; }

            & .plan-detail__list {
                list-style: none;
                margin: 0;
                padding: 0;
                /* No zebra striping (§4.3): a hairline separates rows. */
                border-top: 1px solid ${o("border")};
            }
            & .plan-detail__list:empty { border-top: none; }
            & .plan-detail__list > li { border-bottom: 1px solid ${o("border")}; }

            & .plan-detail__item {
                display: grid;
                grid-template-columns: auto minmax(0, 1fr) auto;
                align-items: start;
                gap: ${l("lg")};
                padding: ${l("sm")} ${l("sm")};
                font-family: ${o("font-ui")};
            }
            & .plan-detail__item--flat { grid-template-columns: minmax(0, 1fr) auto; }

            & .plan-detail__link {
                display: contents;
                color: inherit;
                text-decoration: none;
            }
            & .plan-detail__item:hover { background: ${o("surface-2")}; }
            & .plan-detail__item:focus-within { outline: 2px solid ${o("accent")}; outline-offset: -2px; }

            & .plan-detail__date {
                display: flex;
                flex-direction: column;
                align-items: center;
                width: 3.5rem;
                /* Tabular numerals so the blocks line up column-wise (§4.3). */
                font-variant-numeric: tabular-nums;
            }
            & .plan-detail__day { font-size: 1.125rem; font-weight: 700; line-height: 1.2; color: ${o("text")}; }
            & .plan-detail__month {
                font-size: 0.6875rem;
                font-weight: 700;
                letter-spacing: 0.12em;
                color: ${o("text-muted")};
            }
            & .plan-detail__time { margin-top: 2px; font-size: 0.8125rem; color: ${o("text-muted")}; }

            & .plan-detail__item-body {
                display: flex;
                flex-direction: column;
                gap: ${l("xs")};
                min-width: 0;
            }
            & .plan-detail__item-title {
                font-size: 0.9375rem;
                font-weight: 600;
                color: ${o("text")};
                overflow-wrap: anywhere;
            }
            & .plan-detail__item-meta {
                font-size: 0.8125rem;
                color: ${o("text-muted")};
                overflow-wrap: anywhere;
            }
            & .plan-detail__item-trail {
                display: flex;
                align-items: center;
                gap: ${l("sm")};
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
                color: ${o("danger")};
                text-decoration: underline;
                &:focus-visible { outline: 2px solid ${o("accent")}; outline-offset: 2px; }
            }

            & .plan-detail__form {
                display: flex;
                flex-direction: column;
                gap: ${l("md")};
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
                ${q()}
                box-sizing: border-box;
                padding: ${l("xl")};
                display: flex;
                flex-direction: column;
                gap: ${l("lg")};
            }

            & .plan-detail__field { display: flex; flex-direction: column; gap: ${l("xs")}; }
            & .plan-detail__field.hidden { display: none; }
            & .plan-detail__pair { display: grid; grid-template-columns: 1fr 1fr; gap: ${l("md")}; }
            & .plan-detail__label { font-size: 0.8125rem; font-weight: 600; color: ${o("text")}; }
            & .plan-detail__field-error {
                font-size: 0.8125rem;
                line-height: 1.5;
                color: ${o("danger")};
            }
            & .plan-detail__field-error:empty { display: none; }
            & .plan-detail__input, & .plan-detail__textarea {
                ${R()}
                width: 100%;
                box-sizing: border-box;
            }
            & .plan-detail__textarea { font-family: inherit; line-height: 1.6; resize: vertical; }
            & .plan-detail__control .ui-select { display: block; }
            & .plan-detail__control--grow { flex: 1; min-width: 12rem; }

            & .plan-detail__row {
                display: flex;
                align-items: center;
                gap: ${l("sm")};
                flex-wrap: wrap;
            }
            & .plan-detail__row.hidden { display: none; }

            /* §4.8: one primary per form. Spara is it. */
            & .plan-detail__save { ${k(o("radius-sm"),"primary")} }
            /* Koppling mål is a second action on the page, not a second
               primary — the secondary tier is carried by its edge alone. */
            & .plan-detail__secondary { ${k()} }

            /* The archived explanation carries the brass rule — it is the
               brand's own voice explaining a state, not a warning. */
            & .plan-detail__archived {
                padding: ${l("md")};
                border-left: 2px solid ${o("brass-line")};
                background: ${o("surface-2")};
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
                color: ${o("text")};
            }

            @media (max-width: 639px) {
                & .plan-detail__pair { grid-template-columns: 1fr; }
                & .plan-detail__item {
                    grid-template-columns: minmax(0, 1fr);
                    gap: ${l("sm")};
                }
                & .plan-detail__date {
                    flex-direction: row;
                    align-items: baseline;
                    gap: ${l("xs")};
                    width: auto;
                }
                & .plan-detail__day { font-size: 1rem; }
                & .plan-detail__item-trail { justify-content: flex-start; }
            }
        }
    `;auth=this.inject(ne);router=this.inject(L);plans=this.inject(ue);goals=this.inject(Ze);teachers=this.inject(le);toasts=this.inject(U);detail=new u(null);resolved=new u(!1);confirmArchive=new u(!1);nowIso=new u(new Date().toISOString());titleVal=new u("");descVal=new u("");startVal=new u("");endVal=new u("");primaryVal=new u("");titleTouched=new u(!1);goalVal=new u("");viewer=new f(()=>{const e=this.detail.get(),t=this.auth.currentUser.get();return e&&t&&e.studentId===t.id?"owner":"connectedTeacher"});controls=new f(()=>ha(this.viewer.get(),this.detail.get()?.status??"active"));rangeInvalid=new f(()=>!qn(this.startVal.get()||null,this.endVal.get()||null));teacherOptions=new f(()=>[{value:"",label:a("plan.primaryTeacher.none")},...this.teachers.items.get().map(e=>({value:e.id,label:e.displayName}))]);attachable=new f(()=>{const e=this.planId(),t=this.goals.items.get();return va(t,ya(t,e))});goalOptions=new f(()=>this.attachable.get().map(e=>({value:e.id,label:e.title})));grouped=new f(()=>ma(this.detail.get()?.lessons??[],this.nowIso.get()));upcoming=new f(()=>this.grouped.get().upcoming);past=new f(()=>this.grouped.get().past);sessions=new f(()=>fa(this.detail.get()?.trainingSessions??[]));linkedGoals=new f(()=>this.detail.get()?.goals??[]);onMount(){this.load()}planId(){return this.router.route.get().split("/")[2]??""}async load(){const e=this.planId();if(!e){this.resolved.set(!0);return}const t=await this.plans.loadDetail(e);this.detail.set(t),t&&this.seedForm(t),this.resolved.set(!0);const s=this.auth.currentUser.get();!t||!s||t.studentId!==s.id||(this.goals.load(),this.teachers.load())}seedForm(e){this.titleVal.set(e.title),this.descVal.set(e.description??""),this.startVal.set(e.startDate??""),this.endVal.set(e.endDate??""),this.primaryVal.set(e.primaryTeacherId??""),this.titleTouched.set(!1)}render(){const e=this.wire(hd,{back:{onclick:this.router.link("/planer").onclick,textContent:()=>a("plan.back")},loading:{textContent:()=>a("plan.loading"),className:()=>this.resolved.get()?"plan-detail__loading hidden":"plan-detail__loading"},body:{className:()=>this.detail.get()?"plan-detail__body":"plan-detail__body hidden"},readSection:{className:()=>this.controls.get().editDetails?"plan-detail__section hidden":"plan-detail__section"},descHeading:{textContent:()=>a("plan.section.description")},descRead:{textContent:()=>this.detail.get()?.description??"",className:()=>this.detail.get()?.description?"plan-detail__prose":"plan-detail__prose hidden"},descEmpty:{textContent:()=>a("plan.description.empty"),className:()=>this.detail.get()?.description?"plan-detail__muted hidden":"plan-detail__muted"},editSection:{className:()=>this.controls.get().editDetails?"plan-detail__section":"plan-detail__section hidden"},editHeading:{textContent:()=>a("plan.section.details")},titleLabel:{textContent:()=>a("plan.field.title")},titleInput:{value:()=>this.titleVal.get(),"aria-invalid":()=>String(this.titleTouched.get()&&this.titleVal.get().trim()===""),oninput:t=>this.titleVal.set(t.target.value)},titleError:{textContent:()=>this.titleTouched.get()&&this.titleVal.get().trim()===""?a("plan.error.title"):""},descLabel:{textContent:()=>a("plan.field.description")},descInput:{value:()=>this.descVal.get(),oninput:t=>this.descVal.set(t.target.value)},startLabel:{textContent:()=>a("plan.field.start")},startInput:{value:()=>this.startVal.get(),oninput:t=>this.startVal.set(t.target.value)},endLabel:{textContent:()=>a("plan.field.end")},endInput:{value:()=>this.endVal.get(),"aria-invalid":()=>String(this.rangeInvalid.get()),oninput:t=>this.endVal.set(t.target.value)},endError:{textContent:()=>this.rangeInvalid.get()?a("plan.error.range",{start:this.startVal.get()}):""},teacherField:{className:()=>this.teachers.items.get().length===0?"plan-detail__field hidden":"plan-detail__field"},teacherLabel:{textContent:()=>a("plan.field.primaryTeacher")},teacherHint:{textContent:()=>a("plan.primaryTeacher.hint")},save:{textContent:()=>a("plan.save"),disabled:()=>this.plans.loading.get()||this.rangeInvalid.get()},saveError:{textContent:()=>this.plans.error.get()?a("plan.saveError"):""},editForm:{onsubmit:t=>{this.save(t)}},goalsHeading:{textContent:()=>a("plan.section.goals")},goalsEmpty:{textContent:()=>a(xa(this.viewer.get())),className:()=>this.linkedGoals.get().length===0?"plan-detail__muted":"plan-detail__muted hidden"},goalsAttach:{className:()=>this.controls.get().attachGoals&&this.attachable.get().length>0?"plan-detail__row":"plan-detail__row hidden"},attachGoal:{textContent:()=>a("plan.goals.attach"),disabled:()=>this.goalVal.get()===""||this.goals.loading.get(),onclick:()=>{this.attachGoal()}},goalsNone:{textContent:()=>a("plan.goals.none"),className:()=>this.controls.get().attachGoals&&this.attachable.get().length===0?"plan-detail__hint":"plan-detail__hint hidden"},lessonsHeading:{textContent:()=>a("plan.section.lessons")},upcomingGroup:{className:()=>this.upcoming.get().length===0?"plan-detail__group hidden":"plan-detail__group"},upcomingLabel:{textContent:()=>a("plan.group.upcoming")},pastGroup:{className:()=>this.past.get().length===0?"plan-detail__group hidden":"plan-detail__group"},pastLabel:{textContent:()=>a("plan.group.past")},lessonsEmpty:{textContent:()=>a("plan.lessons.empty"),className:()=>(this.detail.get()?.lessons.length??0)===0?"plan-detail__muted":"plan-detail__muted hidden"},sessionsHeading:{textContent:()=>a("plan.section.trainingSessions")},sessionsEmpty:{textContent:()=>a("plan.trainingSessions.empty"),className:()=>this.sessions.get().length===0?"plan-detail__muted":"plan-detail__muted hidden"},archivedSection:{className:()=>this.detail.get()?.status==="archived"?"plan-detail__archived":"plan-detail__archived hidden"},archivedNotice:{textContent:()=>a("plan.archived.notice")},confirmArchiveHost:{className:()=>this.controls.get().archive?"plan-detail__dialog":"plan-detail__dialog hidden"}});return this.buildNotFound(this.ref(e,"notFoundHost")),this.buildHeader(this.ref(e,"headerHost")),this.spawn(D,this.ref(e,"teacherHost"),{value:this.primaryVal,options:this.teacherOptions}),this.spawn(D,this.ref(e,"goalHost"),{value:this.goalVal,options:this.goalOptions,placeholder:a("plan.goals.placeholder")}),this.track(b(()=>{const t=this.goalOptions.get(),s=this.goalVal.get();s&&!t.some(i=>i.value===s)&&this.goalVal.set("")})),this.buildGoals(this.ref(e,"goalsList")),this.$each(this.ref(e,"upcomingList"),this.upcoming,t=>this.renderLesson(t),t=>t.id),this.$each(this.ref(e,"pastList"),this.past,t=>this.renderLesson(t),t=>t.id),this.$each(this.ref(e,"sessionsList"),this.sessions,t=>this.renderSession(t),t=>t.id),this.spawn(J,this.ref(e,"confirmArchiveHost"),{open:this.confirmArchive,title:a("plan.confirm.archive.title"),message:()=>a("plan.confirm.archive.message"),confirmLabel:a("plan.action.archive"),cancelLabel:a("plan.confirm.dismiss"),danger:!0,onconfirm:()=>{this.archive()}}),e}buildHeader(e){this.spawn(Je,e,{eyebrow:()=>a("objectKind.plan"),title:()=>this.detail.get()?.title??"",status:()=>{const t=this.detail.get();if(!t)return null;const s=Et(t.status);return{label:s.label,variant:s.variant,tone:s.tone,...s.glyph===void 0?{}:{glyph:s.glyph}}},chips:()=>[],meta:()=>{const t=this.detail.get();return t?[Te(t.startDate,t.endDate),We(t.primaryTeacherDisplayName)].filter(Boolean).join(" · "):""},overflowActions:()=>this.controls.get().archive?[{label:a("plan.action.archive"),onclick:()=>this.confirmArchive.set(!0)}]:[]})}buildNotFound(e){let t=null;this.track(b(()=>{const s=this.resolved.get()&&!this.detail.get();t?.destroy(),t=null,e.replaceChildren(),s&&(t=P(()=>{const i=new B({heading:()=>a("plan.notFound.heading"),body:()=>a("plan.notFound.body"),action:{label:()=>a("plan.notFound.action"),onclick:()=>this.router.navigate("/planer")},headingLevel:1});return i.mount(e),i}))})),this.track(()=>t?.destroy())}buildGoals(e){const t=[];this.track(()=>{for(const s of t)s.destroy();t.length=0}),this.track(b(()=>{const s=this.linkedGoals.get(),i=this.controls.get();for(const r of t)r.destroy();t.length=0,e.replaceChildren();for(const r of s){const d=document.createElement("li"),c=document.createElement("div");c.className="plan-detail__item plan-detail__item--flat";const h=`/mal/${r.id}`,p=document.createElement("a");p.className="plan-detail__link",p.href=h,p.addEventListener("click",O=>{O.preventDefault(),this.router.navigate(h)});const g=document.createElement("span");g.className="plan-detail__item-body";const m=document.createElement("span");m.className="plan-detail__item-title",m.textContent=r.title,g.appendChild(m);const _=fe(r.targetDate);if(_){const O=document.createElement("span");O.className="plan-detail__item-meta",O.textContent=_,g.appendChild(O)}p.appendChild(g),c.appendChild(p);const x=document.createElement("span");x.className="plan-detail__item-trail";const C=Ue(r.status),E=document.createElement("span");x.appendChild(E);const T=P(()=>{const O=new Z({label:C.label,variant:C.variant,tone:C.tone,...C.glyph===void 0?{}:{glyph:C.glyph}});return O.mount(E),O});if(t.push(T),i.detachGoals){const O=document.createElement("button");O.type="button",O.className="plan-detail__detach",O.textContent=a("plan.goals.detach"),O.addEventListener("click",()=>{this.detachGoal(r)}),x.appendChild(O)}c.appendChild(x),d.appendChild(c),e.appendChild(d)}}))}renderLesson(e){return this.occasionRow(`/lektioner/${e.id}`,e.scheduledAt,cn(e.scheduledAt),ba(e))}renderSession(e){return this.occasionRow(`/traningspass/${e.id}`,e.performedAt,cn(e.performedAt),_a(e))}occasionRow(e,t,s,i){const r=document.createElement("li"),d=document.createElement("div");d.className="plan-detail__item";const c=document.createElement("a");c.className="plan-detail__link",c.href=e,c.addEventListener("click",x=>{x.preventDefault(),this.router.navigate(e)});const h=ga(t),p=document.createElement("span");p.className="plan-detail__date";for(const[x,C]of[["day",h.day],["month",h.month],["time",h.time]]){const E=document.createElement("span");E.className=`plan-detail__${x}`,E.textContent=C,p.appendChild(E)}c.appendChild(p);const g=document.createElement("span");g.className="plan-detail__item-body";const m=document.createElement("span");if(m.className="plan-detail__item-title",m.textContent=s,g.appendChild(m),i){const x=document.createElement("span");x.className="plan-detail__item-meta",x.textContent=i,g.appendChild(x)}c.appendChild(g);const _=document.createElement("span");return _.className="plan-detail__item-trail",c.appendChild(_),d.appendChild(c),r.appendChild(d),r}async save(e){e.preventDefault();const t=this.titleVal.get().trim();this.titleTouched.set(!0),!(!t||this.rangeInvalid.get()||!await this.plans.update(this.planId(),{title:t,description:this.descVal.get().trim()||null,startDate:this.startVal.get()||null,endDate:this.endVal.get()||null,primaryTeacherId:this.primaryVal.get()||null}))&&(this.toasts.show({message:a("plan.saved"),variant:"success"}),await this.load())}async attachGoal(){const e=this.goalVal.get(),t=this.attachable.get().find(i=>i.id===e);!t||!await this.goals.attachPlan(e,this.planId())||(this.goalVal.set(""),this.toasts.show({message:a("plan.toast.goalAttached",{title:t.title})}),await this.load())}async detachGoal(e){await this.goals.detachPlan(e.id,this.planId())&&(this.toasts.show({message:a("plan.toast.goalDetached",{title:e.title})}),await this.load())}async archive(){await this.plans.archive(this.planId())&&(this.toasts.show({message:a("plan.toast.archived")}),await this.load())}}const ud=S('<div bind="host"></div>');class gd extends ${router=this.inject(L);key=new f(()=>{const e=this.router.route.get();return e==="/planer"?"list":e==="/planer/ny"?"create":"detail"});render(){const e=this.wire(ud,{});return this.$swap(this.ref(e,"host"),this.key,{list:ld,create:cd,detail:pd}),e}}const md=S(`
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
`);class fd extends ${static styles=`
        .goals {
            & .goals__head {
                display: flex;
                align-items: baseline;
                justify-content: space-between;
                gap: ${l("lg")};
                flex-wrap: wrap;
                margin-bottom: ${l("xl")};
            }

            /* Lora 500, and only 500 — UI_DECISIONS §3. */
            & .goals__title {
                margin: 0;
                font-family: ${o("font-display")};
                font-weight: 500;
                font-size: 1.75rem;
                line-height: 36px;
                color: ${o("text")};
            }

            /* Buttons are Open Sans territory; the serif is forbidden here. */
            & .goals__create { ${k(o("radius-sm"),"primary")} }

            & .goals__loading {
                margin: 0;
                color: ${o("text-muted")};
                font-size: 0.875rem;
            }
            & .goals__loading.hidden { display: none; }

            & .goals__error {
                display: flex;
                align-items: center;
                gap: ${l("md")};
                flex-wrap: wrap;
                padding: ${l("md")};
                margin-bottom: ${l("lg")};
                border: 1px solid ${o("danger")};
                border-radius: ${o("radius-md")};
                background: ${o("danger-soft")};

                & .goals__error-text { margin: 0; font-size: 0.875rem; color: ${o("text")}; }
                & .goals__retry { ${k()} }
            }
            & .goals__error.hidden { display: none; }

            & .goals__group { margin-bottom: ${l("xl")}; }
            & .goals__group.hidden { display: none; }

            /* Uppercase group label — letterspaced, never the serif (§4.3). */
            & .goals__group-label {
                margin: 0 0 ${l("md")};
                font-family: ${o("font-ui")};
                font-size: 0.6875rem;
                line-height: 16px;
                font-weight: 700;
                letter-spacing: 0.14em;
                text-transform: uppercase;
                color: ${o("text-muted")};
            }

            /* Avbrutna is collapsed (§3.13 "preferably behind a filter or
               collapsed section"), so its label is the disclosure itself. */
            & .goals__disclosure {
                display: inline-flex;
                align-items: center;
                gap: ${l("sm")};
                margin: 0 0 ${l("md")};
                padding: ${l("xs")} 0;
                background: transparent;
                border: none;
                cursor: pointer;
                font-family: ${o("font-ui")};
                font-size: 0.6875rem;
                line-height: 16px;
                font-weight: 700;
                letter-spacing: 0.14em;
                text-transform: uppercase;
                color: ${o("text-muted")};
                &:hover { color: ${o("accent-strong")}; }
                &:focus-visible { outline: 2px solid ${o("accent")}; outline-offset: 2px; }
            }

            & .goals__list {
                list-style: none;
                margin: 0;
                padding: 0;
                /* No zebra striping (§4.3): rows are separated by a hairline. */
                border-top: 1px solid ${o("border")};
            }
            & .goals__list:empty { border-top: none; }
            & .goals__list.hidden { display: none; }
            & .goals__list > li { border-bottom: 1px solid ${o("border")}; }

            & .goal-row {
                display: grid;
                grid-template-columns: minmax(0, 1fr) auto;
                align-items: start;
                gap: ${l("lg")};
                padding: ${l("md")} ${l("sm")};
                text-decoration: none;
                color: inherit;
                font-family: ${o("font-ui")};

                &:hover { background: ${o("surface-2")}; }
                &:focus-visible { outline: 2px solid ${o("accent")}; outline-offset: -2px; }
            }
            /* Abandoned rows are dimmed, as §4.3 dims a cancelled row. */
            & .goal-row--abandoned { opacity: 0.72; }

            & .goal-row__body {
                display: flex;
                flex-direction: column;
                gap: ${l("xs")};
                min-width: 0;
            }
            & .goal-row__title {
                font-size: 0.9375rem;
                font-weight: 600;
                color: ${o("text")};
                overflow-wrap: anywhere;
            }
            /* One meta line, not four — §4.3 allows at most two rows of text. */
            & .goal-row__meta {
                display: flex;
                align-items: baseline;
                flex-wrap: wrap;
                gap: ${l("xs")} ${l("sm")};
                font-size: 0.8125rem;
                color: ${o("text-muted")};
            }
            /* Overdue is supporting metadata (§3.13), so it borrows the warning
               tone for emphasis but never the pill's shape grammar — it is not
               a status and must not read as one. */
            & .goal-row__overdue { color: ${o("warning")}; font-weight: 600; }
            & .goal-row__excerpt {
                font-size: 0.8125rem;
                line-height: 1.5;
                color: ${o("text-muted")};
                overflow-wrap: anywhere;
            }

            & .goal-row__chips {
                display: flex;
                flex-wrap: wrap;
                gap: ${l("xs")};
                justify-content: flex-end;
                align-items: flex-start;
                max-width: 18rem;
            }

            /* UI_DECISIONS §6: single column below 640px. */
            @media (max-width: 639px) {
                & .goal-row {
                    grid-template-columns: minmax(0, 1fr);
                    gap: ${l("sm")};
                }
                & .goal-row__chips { justify-content: flex-start; max-width: none; }
                & .goals__title { font-size: 1.375rem; line-height: 30px; }
            }
        }
    `;router=this.inject(L);goals=this.inject(Ze);plans=this.inject(ue);teachers=this.inject(le);namesResolved=new u(!1);showAbandoned=new u(!1);today=new u(Ke(new Date));grouped=new f(()=>na(this.namesResolved.get()?this.goals.items.get():[]));active=new f(()=>this.grouped.get().active);achieved=new f(()=>this.grouped.get().achieved);abandoned=new f(()=>this.grouped.get().abandoned);isEmpty=new f(()=>this.namesResolved.get()&&this.goals.items.get().length===0&&!this.goals.loading.get()&&this.goals.error.get()===null);onMount(){this.goals.load(),Promise.allSettled([this.plans.load(),this.teachers.load()]).then(()=>this.namesResolved.set(!0))}render(){const e=this.wire(md,{heading:{textContent:()=>a("goals.heading")},create:{textContent:()=>a("goals.create"),onclick:()=>this.router.navigate("/mal/nytt")},loading:{textContent:()=>a("goals.loading"),className:()=>(!this.namesResolved.get()||this.goals.loading.get())&&this.goals.items.get().length===0&&this.goals.error.get()===null?"goals__loading":"goals__loading hidden"},errorBox:{className:()=>this.goals.error.get()?"goals__error":"goals__error hidden"},errorText:{textContent:()=>a("goals.error")},retry:{textContent:()=>a("goals.retry"),onclick:()=>{this.goals.load()}},activeSection:{className:()=>this.active.get().length===0?"goals__group hidden":"goals__group"},activeLabel:{textContent:()=>a("goals.group.active")},achievedSection:{className:()=>this.achieved.get().length===0?"goals__group hidden":"goals__group"},achievedLabel:{textContent:()=>a("goals.group.achieved")},abandonedSection:{className:()=>this.abandoned.get().length===0?"goals__group hidden":"goals__group"},abandonedToggle:{textContent:()=>this.showAbandoned.get()?a("goals.abandoned.hide"):V("goals.abandoned.show",this.abandoned.get().length),"aria-expanded":()=>String(this.showAbandoned.get()),onclick:()=>this.showAbandoned.set(!this.showAbandoned.peek())},abandonedList:{className:()=>this.showAbandoned.get()?"goals__list":"goals__list hidden"}});return this.buildEmpty(this.ref(e,"emptyHost")),this.$each(this.ref(e,"activeList"),this.active,(t,s,i)=>this.renderRow(t,i),st),this.$each(this.ref(e,"achievedList"),this.achieved,(t,s,i)=>this.renderRow(t,i),st),this.$each(this.ref(e,"abandonedList"),this.abandoned,(t,s,i)=>this.renderRow(t,i),st),e}buildEmpty(e){let t=null;this.track(b(()=>{const s=this.isEmpty.get();t?.destroy(),t=null,e.replaceChildren(),s&&(t=P(()=>{const i=new B({heading:()=>a("goals.empty.heading"),body:()=>a("goals.empty.body"),action:{label:()=>a("goals.empty.action"),onclick:()=>this.router.navigate("/mal/nytt")},headingLevel:2});return i.mount(e),i}))})),this.track(()=>t?.destroy())}renderRow(e,t){const s=document.createElement("li"),i=`/mal/${e.id}`,r=document.createElement("a");r.className=e.status==="abandoned"?"goal-row goal-row--abandoned":"goal-row",r.href=i,r.addEventListener("click",G=>{G.preventDefault(),this.router.navigate(i)});const d=document.createElement("span");d.className="goal-row__body";const c=document.createElement("span");c.className="goal-row__title",c.textContent=e.title,d.appendChild(c);const h=document.createElement("span");h.className="goal-row__meta",e.horseName&&h.appendChild(Pe(a("goal.meta.horse",{name:e.horseName})));const p=fe(e.targetDate);p&&h.appendChild(Pe(p)),St(e,this.today.get())&&h.appendChild(Pe(a("goal.overdue"),"goal-row__overdue"));const g=oa(e.planIds,this.plans.items.get());g&&h.appendChild(Pe(g)),h.childElementCount>0&&d.appendChild(h);const m=ia(e.description);if(m){const G=document.createElement("span");G.className="goal-row__excerpt",G.textContent=m,d.appendChild(G)}const _=document.createElement("span");_.className="goal-row__chips";const x=document.createElement("span");_.appendChild(x);const C=new Le({recipients:()=>ra(e.sharedTeacherIds,this.teachers.items.get()),shared:()=>e.sharedTeacherIds.length>0});C.mount(x),t(()=>C.destroy());const E=Ue(e.status),T=document.createElement("span");_.appendChild(T);const O=new Z({label:E.label,variant:E.variant,tone:E.tone,...E.glyph===void 0?{}:{glyph:E.glyph}});return O.mount(T),t(()=>O.destroy()),r.append(d,_),s.appendChild(r),s}}function Pe(n,e){const t=document.createElement("span");return e&&(t.className=e),t.textContent=n,t}const bd=S(`
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
`);class _d extends ${static styles=`
        .new-goal {
            display: flex;
            flex-direction: column;
            gap: ${l("lg")};
            max-width: 34rem;
            font-family: ${o("font-ui")};

            & .new-goal__back {
                font-size: 0.875rem;
                color: ${o("text-muted")};
                text-decoration: none;
                &:hover { color: ${o("accent-strong")}; text-decoration: underline; }
                &:focus-visible { outline: 2px solid ${o("accent")}; outline-offset: 2px; }
            }

            /* Lora 500 only (UI_DECISIONS §3). */
            & .new-goal__title {
                margin: 0;
                font-family: ${o("font-display")};
                font-weight: 500;
                font-size: 1.75rem;
                line-height: 36px;
                color: ${o("text")};
            }

            /*
             * The fields sit in a panel, not loose on the page. The §4.8 field
             * recipe fills with --bg — the page-paper colour — so a form
             * rendered straight onto the route would give the field the same
             * colour as everything behind it. The panel is what the recessed
             * fill is recessed INTO. §4.8's own example shows the same thing.
             */
            & .new-goal__panel {
                ${q()}
                box-sizing: border-box;
                padding: ${l("xl")};
                display: flex;
                flex-direction: column;
                gap: ${l("lg")};
            }

            & .new-goal__field {
                display: flex;
                flex-direction: column;
                gap: ${l("xs")};
            }
            /* §3.9 States: a picker with nothing to offer is hidden, not empty. */
            & .new-goal__field.hidden { display: none; }

            & .new-goal__label {
                font-size: 0.8125rem;
                font-weight: 600;
                color: ${o("text")};
            }

            & .new-goal__hint {
                font-size: 0.8125rem;
                line-height: 1.5;
                color: ${o("text-muted")};
                max-width: 68ch;
            }
            & .new-goal__hint:empty { display: none; }

            /* Field-level error: sits under its own input, names the fix. */
            & .new-goal__field-error {
                font-size: 0.8125rem;
                line-height: 1.5;
                color: ${o("danger")};
            }
            & .new-goal__field-error:empty { display: none; }

            & .new-goal__input, & .new-goal__textarea {
                ${R()}
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
                color: ${o("danger")};
            }

            & .new-goal__actions {
                display: flex;
                gap: ${l("sm")};
                flex-wrap: wrap;
            }
            /* §4.8: one primary per form. This is it. */
            & .new-goal__submit { ${k(o("radius-sm"),"primary")} }
            /* Cancel is the ghost tier — not a second bordered button. */
            & .new-goal__cancel { ${k(o("radius-sm"),"ghost")} }

            @media (max-width: 639px) {
                & .new-goal__actions { flex-direction: column; align-items: stretch; }
                & .new-goal__title { font-size: 1.375rem; line-height: 30px; }
            }
        }
    `;router=this.inject(L);goals=this.inject(Ze);stable=this.inject(pe);toasts=this.inject(U);titleVal=new u("");descVal=new u("");targetVal=new u("");horseVal=new u("");horses=new f(()=>Kn(this.stable.items.get()));horseOptions=new f(()=>[{value:"",label:a("goal.horse.none")},...this.horses.get().map(e=>({value:e.id,label:e.name}))]);titleTouched=new u(!1);targetInvalid=new f(()=>{const e=this.targetVal.get();return e!==""&&ae(e)===null});render(){const e=this.wire(bd,{back:{onclick:this.router.link("/mal").onclick,textContent:()=>a("goal.back")},heading:{textContent:()=>a("goalCreate.heading")},titleLabel:{textContent:()=>a("goalCreate.field.title")},titleHint:{textContent:()=>a("goalCreate.field.title.hint")},titleInput:{value:()=>this.titleVal.get(),"aria-invalid":()=>String(this.titleTouched.get()&&this.titleVal.get().trim()===""),oninput:t=>this.titleVal.set(t.target.value)},titleError:{textContent:()=>this.titleTouched.get()&&this.titleVal.get().trim()===""?a("goal.error.title"):""},descLabel:{textContent:()=>a("goalCreate.field.description")},descHint:{textContent:()=>a("goalCreate.field.description.hint")},descInput:{value:()=>this.descVal.get(),oninput:t=>this.descVal.set(t.target.value)},targetLabel:{textContent:()=>a("goalCreate.field.target")},targetHint:{textContent:()=>fe(this.targetVal.get()||null)??a("goalCreate.field.target.hint")},targetInput:{value:()=>this.targetVal.get(),"aria-invalid":()=>String(this.targetInvalid.get()),oninput:t=>this.targetVal.set(t.target.value)},targetError:{textContent:()=>this.targetInvalid.get()?a("goal.error.target"):""},horseField:{className:()=>this.horses.get().length===0?"new-goal__field hidden":"new-goal__field"},horseLabel:{textContent:()=>a("goalCreate.field.horse")},horseHint:{textContent:()=>a("goalCreate.field.horse.hint")},error:{textContent:()=>this.goals.error.get()?a("goal.saveError"):""},submit:{textContent:()=>a("goalCreate.submit"),disabled:()=>this.goals.loading.get()||this.targetInvalid.get()},cancel:{textContent:()=>a("goalCreate.cancel"),onclick:()=>this.router.navigate("/mal")},form:{onsubmit:t=>{this.submit(t)}}});return this.spawn(D,this.ref(e,"horseHost"),{value:this.horseVal,options:this.horseOptions}),e}onMount(){this.stable.load()}async submit(e){e.preventDefault();const t=this.titleVal.get().trim();if(this.titleTouched.set(!0),!t||this.targetInvalid.get())return;const s=this.descVal.get().trim(),i=this.targetVal.get(),r=this.horseVal.get(),d=await this.goals.create({title:t,...s?{description:s}:{},...i?{targetDate:i}:{},...r?{horseId:r}:{}});d&&(this.toasts.show({message:a("goalCreate.created"),variant:"success"}),this.router.navigate(`/mal/${d.id}`))}}const vd=S(`
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
`);class yd extends ${static styles=`
        .goal-detail {
            display: flex;
            flex-direction: column;
            gap: ${l("lg")};
            font-family: ${o("font-ui")};

            & .goal-detail__back {
                font-size: 0.875rem;
                color: ${o("text-muted")};
                text-decoration: none;
                &:hover { color: ${o("accent-strong")}; text-decoration: underline; }
                &:focus-visible { outline: 2px solid ${o("accent")}; outline-offset: 2px; }
            }

            & .goal-detail__loading {
                margin: 0;
                color: ${o("text-muted")};
                font-size: 0.875rem;
            }
            & .goal-detail__loading.hidden { display: none; }

            & .goal-detail__body {
                display: flex;
                flex-direction: column;
                gap: ${l("xl")};
            }
            & .goal-detail__body.hidden { display: none; }

            & .goal-detail__conflict {
                display: flex;
                align-items: center;
                gap: ${l("md")};
                flex-wrap: wrap;
                padding: ${l("md")};
                border: 1px solid ${o("warning")};
                border-radius: ${o("radius-md")};
                background: ${o("warning-soft")};

                & .goal-detail__conflict-text {
                    margin: 0;
                    font-size: 0.875rem;
                    line-height: 1.5;
                    color: ${o("text")};
                    max-width: 68ch;
                }
            }
            & .goal-detail__conflict.hidden { display: none; }

            /* The state explanation carries the brass rule — the brand's own
               voice explaining a rule, not a warning. */
            & .goal-detail__notice {
                margin: 0;
                padding: ${l("md")};
                border-left: 2px solid ${o("brass-line")};
                background: ${o("surface-2")};
                max-width: 68ch;
                font-size: 0.875rem;
                line-height: 1.6;
                color: ${o("text")};
            }
            & .goal-detail__notice.hidden { display: none; }

            & .goal-detail__section {
                display: flex;
                flex-direction: column;
                gap: ${l("md")};
            }
            & .goal-detail__section.hidden { display: none; }

            /* A section heading is one of the places the serif is allowed —
               Lora, weight 500, and only 500 (UI_DECISIONS §3). */
            & .goal-detail__heading {
                margin: 0;
                font-family: ${o("font-display")};
                font-weight: 500;
                font-size: 1.25rem;
                line-height: 1.4;
                color: ${o("text")};
            }

            & .goal-detail__prose {
                margin: 0;
                max-width: 68ch;
                font-size: 0.9375rem;
                line-height: 1.6;
                color: ${o("text")};
                white-space: pre-wrap;
            }
            & .goal-detail__prose.hidden { display: none; }

            & .goal-detail__muted {
                margin: 0;
                font-size: 0.875rem;
                color: ${o("text-muted")};
            }
            & .goal-detail__muted.hidden { display: none; }

            & .goal-detail__hint {
                margin: 0;
                font-size: 0.8125rem;
                line-height: 1.5;
                color: ${o("text-muted")};
                max-width: 68ch;
            }
            & .goal-detail__hint.hidden { display: none; }

            & .goal-detail__list {
                list-style: none;
                margin: 0;
                padding: 0;
                border-top: 1px solid ${o("border")};
            }
            & .goal-detail__list:empty { border-top: none; }
            & .goal-detail__list.hidden { display: none; }
            & .goal-detail__list > li { border-bottom: 1px solid ${o("border")}; }

            & .goal-detail__item {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: ${l("md")};
                padding: ${l("sm")};
                flex-wrap: wrap;
                &:hover { background: ${o("surface-2")}; }
                &:focus-within { outline: 2px solid ${o("accent")}; outline-offset: -2px; }
            }
            & .goal-detail__item-link {
                font-size: 0.9375rem;
                font-weight: 600;
                color: ${o("text")};
                text-decoration: none;
                overflow-wrap: anywhere;
                &:hover { color: ${o("accent-strong")}; text-decoration: underline; }
            }

            & .goal-detail__detach {
                background: none;
                border: none;
                padding: 0;
                cursor: pointer;
                font-family: inherit;
                font-size: 0.8125rem;
                color: ${o("danger")};
                text-decoration: underline;
                &:focus-visible { outline: 2px solid ${o("accent")}; outline-offset: 2px; }
            }

            /* The trust surface gets a visible boundary — it is a decision, not
               just another list (§4.5). */
            & .goal-detail__checks {
                list-style: none;
                margin: 0;
                padding: ${l("md")};
                border: 1px solid ${o("border")};
                border-radius: ${o("radius-md")};
                display: flex;
                flex-direction: column;
                gap: ${l("sm")};
            }
            & .goal-detail__checks.hidden { display: none; }
            & .goal-detail__check {
                display: flex;
                align-items: center;
                gap: ${l("sm")};
                font-size: 0.875rem;
                color: ${o("text")};
                cursor: pointer;
            }
            & .goal-detail__check input { accent-color: ${o("accent")}; }

            /*
             * The edit form is a panel. The §4.8 field recipe fills with --bg,
             * the page-paper colour, and a detail section is drawn straight
             * onto that page — so without the panel the fields would be the
             * same colour as everything behind them. The panel is what the
             * recessed fill is recessed INTO.
             */
            & .goal-detail__form {
                ${q()}
                box-sizing: border-box;
                padding: ${l("xl")};
                display: flex;
                flex-direction: column;
                gap: ${l("md")};
                max-width: 34rem;
            }
            & .goal-detail__field { display: flex; flex-direction: column; gap: ${l("xs")}; }
            & .goal-detail__field.hidden { display: none; }
            & .goal-detail__label { font-size: 0.8125rem; font-weight: 600; color: ${o("text")}; }
            & .goal-detail__field-error {
                font-size: 0.8125rem;
                line-height: 1.5;
                color: ${o("danger")};
            }
            & .goal-detail__field-error:empty { display: none; }
            & .goal-detail__input, & .goal-detail__textarea {
                ${R()}
                width: 100%;
                box-sizing: border-box;
            }
            & .goal-detail__textarea { font-family: inherit; line-height: 1.6; resize: vertical; }
            & .goal-detail__control .ui-select { display: block; }
            & .goal-detail__control--grow { flex: 1; min-width: 12rem; }

            & .goal-detail__row {
                display: flex;
                align-items: center;
                gap: ${l("sm")};
                flex-wrap: wrap;
            }
            & .goal-detail__row.hidden { display: none; }
            /*
             * This select sits in a section drawn on the page, not inside the
             * form panel, so it keeps a raised --surface fill. The recessed
             * --bg fill is only legible against a card.
             */
            & .goal-detail__row .ui-select__trigger { background: ${o("surface")}; }

            /* §4.8: one primary per view. This is it. */
            & .goal-detail__save { ${k(o("radius-sm"),"primary")} }
            & .goal-detail__secondary { ${k()} }

            /* Hides the closed dialog from the DOM entirely for a reader who
               has no such action — see the binding for why. */
            & .goal-detail__dialog.hidden { display: none; }
        }
    `;auth=this.inject(ne);router=this.inject(L);goals=this.inject(Ze);plans=this.inject(ue);stable=this.inject(pe);teachers=this.inject(le);toasts=this.inject(U);goal=new u(null);resolved=new u(!1);confirmAbandon=new u(!1);shares=new u([]);sharesSeeded=new u(!1);noteRecipients=new u([]);recipientsResolved=new u(!1);teacherPlanTitles=new u(new Map);planTitlesResolved=new u(!1);titleVal=new u("");descVal=new u("");targetVal=new u("");titleTouched=new u(!1);planVal=new u("");horseVal=new u("");today=new u(Ke(new Date));viewer=new f(()=>{const e=this.goal.get(),t=this.auth.currentUser.get();return e&&t&&e.studentId===t.id?"owner":"sharedTeacher"});controls=new f(()=>Zi(this.viewer.get()));transitions=new f(()=>ea(this.goal.get()?.status??"active",this.viewer.get()));targetInvalid=new f(()=>{const e=this.targetVal.get();return e!==""&&ae(e)===null});planLinks=new f(()=>{const e=this.goal.get();if(!e)return[];if(this.viewer.get()==="owner"){const s=this.plans.items.get();return e.planIds.map(i=>s.find(r=>r.id===i)).filter(i=>i!==void 0).map(i=>({id:i.id,title:i.title}))}const t=this.teacherPlanTitles.get();return e.planIds.map(s=>{const i=t.get(s);return i?{id:s,title:i}:null}).filter(s=>s!==null)});belongsToNoPlan=new f(()=>{const e=this.goal.get();return e!==null&&e.planIds.length===0});ownerPlansResolved=new u(!1);planLinksResolved=new f(()=>this.viewer.get()==="owner"?this.ownerPlansResolved.get():this.planTitlesResolved.get());attachable=new f(()=>da(this.plans.items.get(),this.goal.get()?.planIds??[]));planOptions=new f(()=>this.attachable.get().map(e=>({value:e.id,label:e.title})));horseOptions=new f(()=>{const e=this.goal.get(),t=ca(this.stable.items.get(),{horseId:e?.horseId??null,horseName:e?.horseName??null});return[{value:"",label:a("goal.horse.none")},...t.map(s=>({value:s.id,label:s.name}))]});onMount(){this.load()}goalId(){return this.router.route.get().split("/")[2]??""}async load(){const e=this.goalId();if(!e){this.resolved.set(!0);return}const t=await this.goals.loadDetail(e);this.goal.set(t),t&&this.seedForm(t),this.resolved.set(!0);const s=this.auth.currentUser.get();!t||!s||(t.studentId===s.id?(this.plans.load().finally(()=>this.ownerPlansResolved.set(!0)),this.teachers.load(),this.stable.load(),await this.loadShares(t.id)):await Promise.all([this.loadStudent(t.studentId),this.loadTeacherPlanTitles(t.planIds)]))}seedForm(e){this.titleVal.set(e.title),this.descVal.set(e.description??""),this.targetVal.set(e.targetDate??""),this.horseVal.set(e.horseId??""),this.titleTouched.set(!1)}async loadShares(e){const t=await v.goals.listShares({id:e}).catch(()=>null);this.shares.set(t??[]),this.noteRecipients.set((t??[]).map(s=>({id:s.teacherId,name:s.displayName}))),this.sharesSeeded.set(!0),this.recipientsResolved.set(!0)}async loadStudent(e){const t=await v.students.get({id:e}).catch(()=>null);this.noteRecipients.set(t?[{id:t.id,name:t.displayName}]:[]),this.recipientsResolved.set(!0)}async loadTeacherPlanTitles(e){const t=await Promise.allSettled(e.map(i=>v.plans.get({id:i}))),s=new Map;for(const i of t)i.status==="fulfilled"&&s.set(i.value.id,i.value.title);this.teacherPlanTitles.set(s),this.planTitlesResolved.set(!0)}render(){const e=this.wire(vd,{back:{onclick:t=>{t.preventDefault(),this.router.navigate(this.backHref())},href:()=>this.backHref(),textContent:()=>a("goal.back")},loading:{textContent:()=>a("goal.loading"),className:()=>this.resolved.get()?"goal-detail__loading hidden":"goal-detail__loading"},body:{className:()=>this.goal.get()?"goal-detail__body":"goal-detail__body hidden"},conflict:{className:()=>rn(this.goals.error.get())?"goal-detail__conflict":"goal-detail__conflict hidden"},conflictText:{textContent:()=>a("goal.conflict.message")},conflictRetry:{textContent:()=>a("goal.conflict.action"),onclick:()=>{this.load()}},abandonedNotice:{textContent:()=>a("goal.abandoned.notice"),className:()=>this.goal.get()?.status==="abandoned"?"goal-detail__notice":"goal-detail__notice hidden"},readSection:{className:()=>this.controls.get().editDetails?"goal-detail__section hidden":"goal-detail__section"},descHeading:{textContent:()=>a("goal.section.description")},descRead:{textContent:()=>this.goal.get()?.description??"",className:()=>this.goal.get()?.description?"goal-detail__prose":"goal-detail__prose hidden"},descEmpty:{textContent:()=>a("goal.description.empty"),className:()=>this.goal.get()?.description?"goal-detail__muted hidden":"goal-detail__muted"},editSection:{className:()=>this.controls.get().editDetails?"goal-detail__section":"goal-detail__section hidden"},editHeading:{textContent:()=>a("goal.section.details")},titleLabel:{textContent:()=>a("goal.field.title")},titleInput:{value:()=>this.titleVal.get(),"aria-invalid":()=>String(this.titleTouched.get()&&this.titleVal.get().trim()===""),oninput:t=>this.titleVal.set(t.target.value)},titleError:{textContent:()=>this.titleTouched.get()&&this.titleVal.get().trim()===""?a("goal.error.title"):""},descLabel:{textContent:()=>a("goal.field.description")},descInput:{value:()=>this.descVal.get(),oninput:t=>this.descVal.set(t.target.value)},targetLabel:{textContent:()=>a("goal.field.target")},targetInput:{value:()=>this.targetVal.get(),"aria-invalid":()=>String(this.targetInvalid.get()),oninput:t=>this.targetVal.set(t.target.value)},targetError:{textContent:()=>this.targetInvalid.get()?a("goal.error.target"):""},horseField:{className:()=>this.horseOptions.get().length<=1?"goal-detail__field hidden":"goal-detail__field"},horseLabel:{textContent:()=>a("goal.field.horse")},save:{textContent:()=>a("goal.save"),disabled:()=>this.goals.loading.get()||this.targetInvalid.get()},saveError:{textContent:()=>this.goals.error.get()&&!rn(this.goals.error.get())?a("goal.saveError"):""},editForm:{onsubmit:t=>{this.save(t)}},plansSection:{className:()=>"goal-detail__section"},plansHeading:{textContent:()=>a("goal.section.plans")},plansEmpty:{textContent:()=>a("goal.plans.empty"),className:()=>this.belongsToNoPlan.get()?"goal-detail__muted":"goal-detail__muted hidden"},planAttach:{className:()=>this.controls.get().managePlans&&this.attachable.get().length>0?"goal-detail__row":"goal-detail__row hidden"},attachPlan:{textContent:()=>a("goal.plans.attach"),disabled:()=>this.planVal.get()===""||this.goals.loading.get(),onclick:()=>{this.attachPlan()}},plansNone:{textContent:()=>a("goal.plans.none"),className:()=>this.controls.get().managePlans&&this.attachable.get().length===0?"goal-detail__hint":"goal-detail__hint hidden"},sharingSection:{className:()=>this.controls.get().seeCoWatchers?"goal-detail__section":"goal-detail__section hidden"},sharingHeading:{textContent:()=>a("goal.section.sharing")},sharingHint:{textContent:()=>a("goal.sharing.hint"),className:()=>this.teachers.items.get().length===0?"goal-detail__hint hidden":"goal-detail__hint"},sharingLoading:{textContent:()=>a("goal.sharing.loading"),className:()=>this.sharesSeeded.get()?"goal-detail__muted hidden":"goal-detail__muted"},sharingList:{className:()=>this.sharesSeeded.get()&&this.teachers.items.get().length>0?"goal-detail__checks":"goal-detail__checks hidden"},sharingNone:{textContent:()=>a("goal.sharing.none"),className:()=>this.sharesSeeded.get()&&this.teachers.items.get().length===0?"goal-detail__muted":"goal-detail__muted hidden"},confirmAbandonHost:{className:()=>this.transitions.get().abandon?"goal-detail__dialog":"goal-detail__dialog hidden"}});return this.buildNotFound(this.ref(e,"notFoundHost")),this.buildHeader(this.ref(e,"headerHost")),this.buildPlanLinks(this.ref(e,"plansList")),this.buildSharing(this.ref(e,"sharingList")),this.spawn(D,this.ref(e,"horseHost"),{value:this.horseVal,options:this.horseOptions}),this.spawn(D,this.ref(e,"planHost"),{value:this.planVal,options:this.planOptions,placeholder:a("goal.plans.placeholder")}),this.track(b(()=>{const t=this.planOptions.get(),s=this.planVal.get();s&&!t.some(i=>i.value===s)&&this.planVal.set("")})),this.spawn(J,this.ref(e,"confirmAbandonHost"),{open:this.confirmAbandon,title:a("goal.confirm.abandon.title"),message:()=>a("goal.confirm.abandon.message"),confirmLabel:a("goal.action.abandon"),cancelLabel:a("goal.confirm.dismiss"),danger:!0,onconfirm:()=>{this.abandon()}}),jt(this.ref(e,"notesHost"),()=>{const t=this.goal.get();if(!t||!this.recipientsResolved.get())return null;const s=t.studentId;return{parentKind:"goal",parentId:t.id,context:()=>this.goalContext(),recipients:()=>this.noteRecipients.get(),roleOf:i=>i.authorId===s?"student":"teacher"}},t=>this.track(t)),e}backHref(){const e=this.goal.get();return e&&this.viewer.get()==="sharedTeacher"?`/students/${e.studentId}`:"/mal"}goalContext(){return[a("objectKind.goal"),this.goal.get()?.title??""].filter(Boolean).join(" · ")}buildHeader(e){this.spawn(Je,e,{eyebrow:()=>a("objectKind.goal"),title:()=>this.goal.get()?.title??"",status:()=>{const t=this.goal.get();if(!t)return null;const s=Ue(t.status);return{label:s.label,variant:s.variant,tone:s.tone,...s.glyph===void 0?{}:{glyph:s.glyph}}},chips:()=>this.planLinks.get().map(t=>({label:a("goal.chip.plan",{title:t.title}),href:`/planer/${t.id}`})),meta:()=>{const t=this.goal.get();return t?[t.horseName?a("goal.meta.horse",{name:t.horseName}):null,fe(t.targetDate),St(t,this.today.get())?a("goal.overdue"):null,ta(t.achievedAt)].filter(Boolean).join(" · "):""},primaryAction:()=>this.transitions.get().achieve?{label:a("goal.action.achieve"),onclick:()=>{this.achieve()}}:null,secondaryActions:()=>this.transitions.get().reopen?[{label:a("goal.action.reopen"),onclick:()=>{this.reopen()}}]:[],overflowActions:()=>this.transitions.get().abandon?[{label:a("goal.action.abandon"),onclick:()=>this.confirmAbandon.set(!0)}]:[]})}buildNotFound(e){let t=null;this.track(b(()=>{const s=this.resolved.get()&&!this.goal.get();t?.destroy(),t=null,e.replaceChildren(),s&&(t=P(()=>{const i=new B({heading:()=>a("goal.notFound.heading"),body:()=>a("goal.notFound.body"),action:{label:()=>a("goal.notFound.action"),onclick:()=>this.router.navigate("/mal")},headingLevel:1});return i.mount(e),i}))})),this.track(()=>t?.destroy())}buildPlanLinks(e){this.track(b(()=>{const t=this.planLinks.get(),s=this.controls.get();e.replaceChildren();for(const i of t){const r=document.createElement("li"),d=document.createElement("div");d.className="goal-detail__item";const c=`/planer/${i.id}`,h=document.createElement("a");if(h.className="goal-detail__item-link",h.href=c,h.textContent=i.title,h.addEventListener("click",p=>{p.preventDefault(),this.router.navigate(c)}),d.appendChild(h),s.managePlans){const p=document.createElement("button");p.type="button",p.className="goal-detail__detach",p.textContent=a("goal.plans.detach"),p.addEventListener("click",()=>{this.detachPlan(i)}),d.appendChild(p)}r.appendChild(d),e.appendChild(r)}}))}buildSharing(e){this.track(b(()=>{const t=this.teachers.items.get(),s=this.shares.get().map(r=>r.teacherId),i=this.sharesSeeded.get();e.replaceChildren();for(const r of t){const d=document.createElement("li"),c=document.createElement("label");c.className="goal-detail__check";const h=document.createElement("input");h.type="checkbox",h.checked=s.includes(r.id),h.addEventListener("change",()=>{this.toggleShare(r.id,h)}),c.appendChild(h);const p=document.createElement("span");p.textContent=r.displayName,c.appendChild(p),d.appendChild(c),e.appendChild(d)}for(const r of e.querySelectorAll("input"))r.disabled=!i}))}async toggleShare(e,t){const s=this.goal.get()?.id,i=this.shares.get().map(c=>c.teacherId),r=t.checked;if(!s||!la({seeded:this.sharesSeeded.get(),teacherId:e,next:r,stored:i})){t.checked=i.includes(e);return}if(!(r?await this.goals.share(s,e):await this.goals.unshare(s,e))){t.checked=i.includes(e),this.toasts.show({message:a("goal.sharing.error"),variant:"error"});return}await this.loadShares(s),this.toasts.show({message:a("goal.sharing.saved")})}async save(e){e.preventDefault();const t=this.titleVal.get().trim();this.titleTouched.set(!0),!(!t||this.targetInvalid.get()||!await this.goals.update(this.goalId(),{title:t,description:this.descVal.get().trim()||null,targetDate:this.targetVal.get()||null,horseId:this.horseVal.get()||null}))&&(this.toasts.show({message:a("goal.saved"),variant:"success"}),await this.load())}async attachPlan(){const e=this.goal.get()?.id,t=this.planVal.get(),s=this.attachable.get().find(r=>r.id===t);!e||!s||!ln({seeded:this.planLinksResolved.get(),planId:t,next:!0,stored:this.goal.get()?.planIds??[]})||!await this.goals.attachPlan(e,t)||(this.planVal.set(""),this.toasts.show({message:a("goal.toast.planAttached",{title:s.title})}),await this.load())}async detachPlan(e){const t=this.goal.get()?.id;!t||!ln({seeded:this.planLinksResolved.get(),planId:e.id,next:!1,stored:this.goal.get()?.planIds??[]})||!await this.goals.detachPlan(t,e.id)||(this.toasts.show({message:a("goal.toast.planDetached",{title:e.title})}),await this.load())}async achieve(){await this.goals.achieve(this.goalId())&&(this.toasts.show({message:a("goal.toast.achieved"),variant:"success"}),await this.load())}async reopen(){await this.goals.reopen(this.goalId())&&(this.toasts.show({message:a("goal.toast.reopened")}),await this.load())}async abandon(){await this.goals.abandon(this.goalId())&&(this.toasts.show({message:a("goal.toast.abandoned")}),await this.load())}}const xd=S('<div bind="host"></div>');class wd extends ${router=this.inject(L);key=new f(()=>{const e=this.router.route.get();return e==="/mal"?"list":e==="/mal/nytt"?"create":"detail"});render(){const e=this.wire(xd,{});return this.$swap(this.ref(e,"host"),this.key,{list:fd,create:_d,detail:yd}),e}}const zs={"/home":"nav.home","/inbox":"nav.inbox","/lektioner":"nav.lessons","/traningspass":"nav.trainingSessions","/planer":"nav.plans","/mal":"nav.goals","/hastar":"nav.stable","/students":"nav.students","/library":"nav.library","/program":"nav.programs","/invitations":"nav.invitations"},kd=Object.keys(zs).sort((n,e)=>e.length-n.length);function $d(n){const e=n===""?"/":n;for(const t of kd)if(e===t||e.startsWith(t+"/"))return zs[t];return null}const ut=1024,Cd={"/home":rs,"/login":Ao,"/register":zo,"/invitations":Vo,"/inbox":Mo,"/students":jr,"/library":cl,"/hastar":xl,"/lektioner":Pl,"/traningspass":Ul,"/program":od,"/planer":gd,"/mal":wd},Sd=S(`
    <div bind="layout" class="app-layout">
        <div bind="topBar" class="app-layout__top"></div>
        <div bind="nav" class="app-layout__nav"></div>
        <div class="app-layout__content">
            <div bind="content" class="app-layout__inner"></div>
        </div>
    </div>
    <div bind="drawer" id="app-nav-drawer"></div>
    <div bind="toasts"></div>
`);class Ed extends ${static styles=`
        .app-layout {
            display: grid;
            grid-template: auto 1fr / 1fr;
            height: 100vh;
            background: ${o("bg")};

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
                padding: ${l("xl")} ${l("lg")};
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
                    font-family: ${o("font-display")};
                    font-weight: 500;
                }
                & h1 { font-size: 1.75rem; line-height: 36px; }
                & h2 { font-size: 1.25rem; line-height: 28px; }
            }

            @media (min-width: ${ut}px) {
                grid-template: auto 1fr / 240px 1fr;

                & .app-layout__nav {
                    display: block;
                    overflow-y: auto;
                    /* The nav paints its own surface, but it is only as tall as
                       its links — the column carries the surface to the floor. */
                    background: ${o("surface")};
                    border-right: 1px solid ${o("border")};
                }

                & .app-layout__content {
                    padding: ${l("xl")} ${l("2xl")};
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
        @media (min-width: ${ut}px) {
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
    `;router=this.inject(L);app=this.inject(Gn);auth=this.inject(ne);inbox=this.inject(Ct);students=this.inject(be);teachers=this.inject(le);panel=null;wide=window.matchMedia(`(min-width: ${ut}px)`);render(){const e=this.wire(Sd,{});this.spawn(Hi,this.ref(e,"topBar")),this.spawn(on,this.ref(e,"nav")),this.spawn(Ei,this.ref(e,"toasts"));const t=this.ref(e,"layout"),s=this.ref(e,"drawer");this.track(b(()=>{const r=!this.auth.currentUser.get();t.classList.toggle("app-layout--anon",r),s.classList.toggle("app-nav-drawer--anon",r),r&&this.app.navOpen.set(!1)})),this.spawn(yi,s,{open:this.app.navOpen,side:"left",width:"280px",content:(r,d)=>{d.spawn(on,r,{onNavigate:()=>this.app.navOpen.set(!1)})}}),this.panel=s.querySelector(".ui-drawer"),this.panel?.setAttribute("role","dialog"),this.panel?.setAttribute("aria-modal","true"),this.track(b(()=>this.panel?.setAttribute("aria-label",a("nav.label"))));const i={get:()=>Co(this.router.route.get(),!!this.auth.currentUser.get())};return this.track(b(()=>{const r=this.router.route.get(),d=cs(r,!!this.auth.currentUser.get());d&&this.router.navigate(d===ls?zt(d,r):d,!0)})),this.track(b(()=>{this.app.titleKey.set($d(i.get()))})),this.$swap(this.ref(e,"content"),i,Cd,rs),e}onMount(){this.inbox.load(),this.students.load(),this.teachers.load(),this.track(b(()=>{const i=this.app.navOpen.get();this.panel?.toggleAttribute("inert",!i),i&&this.focusFirstLink()}));const e=i=>this.handleKeydown(i);document.addEventListener("keydown",e),this.track(()=>document.removeEventListener("keydown",e));let t=this.router.route.get();this.track(b(()=>{const i=this.router.route.get();i!==t&&this.app.navOpen.set(!1),t=i}));const s=()=>{this.wide.matches&&this.app.navOpen.set(!1)};this.wide.addEventListener("change",s),this.track(()=>this.wide.removeEventListener("change",s))}focusFirstLink(){requestAnimationFrame(()=>this.panel?.querySelector("a")?.focus())}handleKeydown(e){if(!this.app.navOpen.get()||!this.panel||this.wide.matches)return;if(e.key==="Escape"){e.preventDefault(),this.app.navOpen.set(!1);return}if(e.key!=="Tab")return;const t=[...this.panel.querySelectorAll("a")],s=t[0],i=t[t.length-1];if(!s||!i)return;const r=document.activeElement;e.shiftKey&&(r===s||!this.panel.contains(r))?(e.preventDefault(),i.focus()):!e.shiftKey&&r===i&&(e.preventDefault(),s.focus())}}he.get(In);he.get(bi);const Nd=he.get(L),Td=he.get(ne);await Xs(Ed,"#app",{hot:void 0,onInit:async()=>{b(()=>{An({type:"navigation",detail:Nd.route.get(),timestamp:new Date().toISOString()})}),await Td.load()}});export{$ as C,L as R,u as S,In as T,f as a,y as b,ge as c,Ld as d,b as e,Id as n,w as r,S as t};
