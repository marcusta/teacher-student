import { token } from '../theme';
import { btn, input, card } from '../css';

export const scheduleStyles = `
.schedule { container-type:inline-size; color:${token('text')}; font-family:${token('font-ui')}; min-width:0; }
.schedule * { box-sizing:border-box; }
.schedule [hidden],.schedule-dialog [hidden] { display:none!important; }
.schedule h1,.schedule h2,.schedule-dialog h2 { font-family:${token('font-display')}; font-weight:500; }
.schedule h1 { margin:0; font-size:28px; }
.schedule h2 { margin:0; font-size:20px; }
.schedule button,.schedule select,.schedule-dialog button,.schedule-dialog input,.schedule-dialog select,.schedule-dialog textarea { font-family:${token('font-ui')}; }
.schedule-head { display:flex; align-items:center; justify-content:space-between; gap:16px; flex-wrap:wrap; margin-bottom:22px; }
.schedule-kicker { color:${token('accent')}; font-size:11px; letter-spacing:.13em; text-transform:uppercase; margin:0 0 6px; }
.schedule-description { color:${token('text-muted')}; font-size:13px; margin:6px 0 0; }
.schedule-actions { display:flex; flex-wrap:wrap; align-items:center; gap:8px; }
.schedule-button { ${btn()} }
.schedule-primary { ${btn(token('radius-sm'),'primary')} }
.schedule-ghost { ${btn(token('radius-sm'),'ghost')} }
.schedule-danger { ${btn(token('radius-sm'),'danger')} }
.schedule-small { font-size:12px; padding:6px 10px; }
.schedule-icon { ${btn(token('radius-sm'),'ghost')} min-width:32px; padding:6px; line-height:20px; }
.schedule-tabs { display:flex; gap:24px; border-bottom:1px solid ${token('border')}; margin-bottom:20px; }
.schedule-tabs a { color:${token('text-muted')}; text-decoration:none; font-size:14px; padding-bottom:12px; border-bottom:2px solid transparent; }
.schedule-tabs a[aria-current=page] { color:${token('accent-strong')}; font-weight:600; border-color:${token('accent')}; }
.schedule-tools { display:flex; align-items:center; gap:12px; flex-wrap:wrap; margin:0 0 18px; }
.schedule-tools small { display:block; font:12px/1.5 ${token('font-ui')}; color:${token('text-muted')}; margin-top:3px; }
.schedule-arrows { display:flex; border:1px solid ${token('border')}; border-radius:4px; background:${token('surface')}; }
.schedule-stats { margin-left:auto; display:flex; align-items:center; flex-wrap:wrap; gap:12px; font-size:12px; color:${token('text-muted')}; }
.schedule-unassigned { ${btn(token('radius-sm'),'ghost')} background:${token('warning-soft')}; color:${token('warning')}; font-size:12px; padding:5px 9px; }
.schedule-unassigned[aria-pressed=true] { outline:1px solid ${token('warning')}; outline-offset:2px; }
.schedule-filters { display:flex; align-items:center; flex-wrap:wrap; gap:6px; margin-bottom:18px; }
.schedule-filter { ${btn()} background:${token('surface')}; border-color:${token('border')}; font-size:12px; padding:6px 10px; }
.schedule-filter[aria-pressed=true] { background:${token('accent-soft')}; border-color:${token('accent')}; color:${token('accent-strong')}; }
.schedule-filter-gap { flex:1; }
.schedule-status-select { background:transparent; color:${token('text-muted')}; border:0; font-size:12px; padding:7px 0; max-width:180px; }
.schedule-panel { ${card()} overflow:clip; padding:0; }
.schedule-band { display:flex; align-items:center; justify-content:space-between; gap:10px; background:${token('bg')}; padding:10px 13px; border-bottom:1px solid ${token('border')}; font-size:12px; }
.schedule-band span { color:${token('text-muted')}; font-size:11px; }
.schedule-table { width:100%; table-layout:fixed; border-collapse:collapse; font-size:12px; background:${token('surface')}; }
.schedule-table .schedule-label-col { width:132px; }
.schedule-table th,.schedule-table td { border-bottom:1px solid ${token('border')}; padding:9px 5px; text-align:center; vertical-align:middle; overflow-wrap:anywhere; }
.schedule-table tr:last-child th,.schedule-table tr:last-child td { border-bottom:0; }
.schedule-table th { font-weight:400; color:${token('text-muted')}; }
.schedule-table th:first-child { text-align:left; padding-left:14px; }
.schedule-table tbody th { font-weight:600; color:${token('text')}; }
.schedule-table tbody th small { display:block; font-size:11px; font-weight:400; color:${token('text-muted')}; margin-top:5px; }
.schedule-selected { background:${token('accent-soft')}; }
.schedule-day-head { position:relative; display:flex; align-items:center; justify-content:center; min-height:52px; }
.schedule-day-head>button:first-child { border:0; background:transparent; color:${token('text-muted')}; font-size:11px; padding:3px 9px; }
.schedule-day-head strong { display:block; font:500 23px/1.35 ${token('font-display')}; color:${token('text')}; }
.schedule-selected .schedule-day-head strong { color:${token('accent')}; }
.schedule-copy-day { position:absolute; top:-7px; right:-5px; font-size:12px; padding:1px 3px; min-width:22px; color:${token('text-muted')}; }
.schedule-assignment { border:0; background:transparent; color:${token('text')}; padding:5px 2px; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:6px; width:100%; border-radius:4px; font-size:11px; min-height:50px; }
.schedule-assignment:hover { background:${token('surface-2')}; }
.schedule-assignment.cancelled { text-decoration:line-through; opacity:.7; }
.schedule-assignment.empty { color:${token('text-muted')}; font-size:16px; }
.schedule-avatar-stack { display:inline-flex; padding-left:2px; }
.schedule-avatar { display:inline-flex; align-items:center; justify-content:center; width:25px; height:25px; border-radius:50%; background:${token('surface-2')}; border:1px solid ${token('surface')}; font-size:9px; color:${token('text-muted')}; }
.schedule-avatar-stack .schedule-avatar+.schedule-avatar { margin-left:-5px; }
.schedule-avatar:nth-child(2n) { background:${token('info-soft')}; color:${token('info')}; }
.schedule-avatar.inactive { border-style:dashed; }
.schedule-horse-heading { display:flex; align-items:baseline; justify-content:space-between; gap:12px; margin:28px 0 12px; }
.schedule-horse-heading p { margin:4px 0 0; color:${token('text-muted')}; font-size:12px; }
.schedule-horse-heading>span { color:${token('text-muted')}; font-size:11px; }
.schedule-horse-table td { vertical-align:top; position:relative; border-right:1px solid ${token('border')}; padding:7px 5px 37px; }
.schedule-horse-table td:last-child { border-right:0; }
.schedule-horse-table tbody th { vertical-align:top; padding-top:16px; }
.schedule-horse-name { font:500 19px/1.4 ${token('font-display')}; }
.schedule-log-link { display:inline-block; color:${token('accent')}; font-size:11px; text-decoration:none; margin-top:8px; font-weight:400; }
.schedule-cell { display:flex; flex-direction:column; gap:6px; min-height:100px; }
.schedule-card { border:1px solid ${token('border')}; border-radius:4px; background:${token('surface')}; color:${token('text')}; padding:9px 7px; width:100%; text-align:left; display:flex; flex-direction:column; gap:6px; cursor:pointer; font-size:11px; }
.schedule-card:hover { border-color:${token('accent')}; }
.schedule-card.training { border-left:2px solid ${token('info')}; background:color-mix(in srgb,${token('info-soft')} 35%,${token('surface')}); }
.schedule-card.care,.schedule-card.visit { border-left:2px solid ${token('accent')}; }
.schedule-card.completed { background:color-mix(in srgb,${token('success-soft')} 30%,${token('surface')}); }
.schedule-card.cancelled { border-style:dashed; }
.schedule-card strong { font-size:11px; font-weight:600; }
.schedule-card-time { font-size:11px; color:${token('text-muted')}; font-variant-numeric:tabular-nums; display:flex; align-items:center; gap:5px; }
.schedule-state { width:12px; height:12px; border:1px solid ${token('border-strong')}; border-radius:50%; display:inline-flex; align-items:center; justify-content:center; font:10px/1 ${token('font-ui')}; flex-shrink:0; }
.schedule-state.completed { color:${token('surface')}; background:${token('success')}; border-color:${token('success')}; }
.schedule-state.cancelled { border-style:dashed; }
.schedule-card-people { display:flex; flex-wrap:wrap; gap:4px; align-items:center; color:${token('text-muted')}; font-size:11px; }
.schedule-card-people .schedule-avatar { width:17px; height:17px; font-size:7px; }
.schedule-warning { color:${token('warning')}; font-size:11px; }
.schedule-lane-add { position:absolute; bottom:6px; left:5px; width:calc(100% - 10px); border:0; background:transparent; color:${token('text-muted')}; border-radius:4px; padding:5px; font-size:17px; cursor:pointer; }
.schedule-lane-add:hover { background:${token('surface-2')}; color:${token('accent')}; }
.schedule-legend { display:flex; flex-wrap:wrap; align-items:center; gap:14px; color:${token('text-muted')}; font-size:11px; margin-top:14px; }
.schedule-legend>span { display:flex; align-items:center; gap:5px; }
.schedule-legend>span:last-child { margin-left:auto; }
.schedule-empty { padding:28px 18px; color:${token('text-muted')}; text-align:center; }
.schedule-empty h2 { color:${token('text')}; margin-bottom:8px; }
.schedule-empty p { margin:0 auto 16px; }
.schedule-alert { padding:13px 15px; background:${token('danger-soft')}; color:${token('danger')}; border-radius:4px; margin:14px 0; font-size:13px; }
.schedule-loading { color:${token('text-muted')}; font-size:13px; padding:12px 0; }
.schedule-loading:empty { display:none; }
.schedule-select { ${input()} max-width:300px; }
.schedule-mobile { display:none; }
.schedule-day-strip { display:flex; gap:5px; overflow-x:auto; margin-bottom:18px; padding:3px 0; }
.schedule-day-strip button { border:1px solid ${token('border')}; border-radius:4px; background:${token('surface')}; color:${token('text-muted')}; padding:8px 3px; flex:1; min-width:38px; font-size:11px; }
.schedule-day-strip button[aria-pressed=true] { background:${token('accent-soft')}; color:${token('accent')}; border-color:${token('accent')}; }
.schedule-day-strip strong { display:block; font:500 22px/1.4 ${token('font-display')}; }
.schedule-day-actions { display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:8px 16px; margin:16px 0; }
.schedule-day-actions h3 { font-size:14px; font-weight:600; margin:0; }
.schedule-day-actions small { color:${token('text-muted')}; }
.schedule-mobile-routine { display:grid; grid-template-columns:42px minmax(0,1fr); gap:8px; align-items:start; margin:10px 0; }
.schedule-mobile-routine>span { font-size:11px; color:${token('text-muted')}; padding-top:12px; }
.schedule-mobile .schedule-card { padding:12px; }
.schedule-mobile .schedule-card strong { font-size:13px; }
.schedule-mobile-horse { margin-bottom:13px; }
.schedule-mobile-horse header { display:flex; gap:8px; align-items:center; padding:12px; border-bottom:1px solid ${token('border')}; }
.schedule-mobile-horse header a { margin:0 0 0 auto; }
.schedule-mobile-horse>div { display:grid; gap:8px; padding:10px; }
.schedule-log-controls { display:flex; gap:12px; flex-wrap:wrap; align-items:end; margin:20px 0; }
.schedule-log-entry { border-left:1px solid ${token('border')}; margin-left:5px; padding:0 0 22px 23px; position:relative; }
.schedule-log-entry:before { content:''; position:absolute; left:-5px; top:6px; border-radius:50%; width:9px; height:9px; background:${token('success')}; }
.schedule-log-entry time { font-size:12px; color:${token('text-muted')}; display:block; margin-bottom:7px; }
.schedule-log-entry .schedule-card { padding:16px; }
.schedule-log-entry .schedule-card strong { font-size:14px; }
.schedule-log-entry .schedule-card p { font-size:13px; margin:0; white-space:pre-wrap; }
.schedule-dialog { color:${token('text')}; background:${token('surface')}; font:14px/1.5 ${token('font-ui')}; border:0; border-left:1px solid ${token('border')}; padding:24px; width:min(490px,100vw); max-width:100vw; height:100dvh; max-height:100dvh; margin:0 0 0 auto; inset:0; box-shadow:${token('shadow-3')}; overflow-y:auto; }
.schedule-dialog::backdrop { background:color-mix(in srgb,${token('text')} 25%,transparent); }
.schedule-dialog h2 { font-size:26px; margin:4px 0 8px; }
.schedule-dialog h3 { font-size:15px; margin:24px 0 12px; font-weight:600; }
.schedule-dialog p { margin:0 0 16px; }
.schedule-dialog small { font-size:12px; color:${token('text-muted')}; }
.schedule-dialog-head { display:flex; justify-content:space-between; align-items:center; gap:10px; }
.schedule-dialog form { margin-top:18px; }
.schedule-field { display:flex; flex-direction:column; gap:6px; margin:0 0 16px; }
.schedule-field>span { font-size:12px; font-weight:600; color:${token('text-muted')}; }
.schedule-field input,.schedule-field select,.schedule-field textarea { ${input()} box-sizing:border-box; width:100%; min-width:0; }
.schedule-field textarea { min-height:80px; resize:vertical; line-height:1.6; }
.schedule-fieldrow { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
.schedule-checks { border:0; padding:0; margin:0 0 16px; }
.schedule-checks legend { font-size:12px; font-weight:600; color:${token('text-muted')}; margin-bottom:7px; }
.schedule-checks>div { display:flex; flex-wrap:wrap; gap:7px; }
.schedule-check { display:inline-flex; gap:7px; align-items:center; padding:7px 9px; border:1px solid ${token('border')}; border-radius:4px; font-size:12px; }
.schedule-check:has(input:checked) { border-color:${token('accent')}; background:${token('accent-soft')}; }
.schedule-check input { accent-color:${token('accent')}; }
.schedule-dialog .schedule-alert:empty { display:none; }
.schedule-dialog-footer { display:flex; flex-wrap:wrap; align-items:center; gap:8px; border-top:1px solid ${token('border')}; padding-top:16px; margin-top:20px; }
.schedule-delete { border-top:1px solid ${token('border')}; margin-top:16px; padding:12px 0; }
.schedule-delete summary { cursor:pointer; font-weight:600; }
.schedule-delete p { margin:8px 0 12px; }
.schedule-dialog-hint { font-size:12px; color:${token('text-muted')}; }
.schedule-dialog-info { background:${token('accent-soft')}; padding:12px; border-radius:4px; font-size:12px; margin:14px 0; }
.schedule-program { background:${token('info-soft')}; padding:12px; border-radius:4px; color:${token('info')}; font-size:12px; margin:14px 0; }
.schedule-program li { padding:4px 0; }
.schedule-settings-row { display:flex; gap:8px; align-items:center; flex-wrap:wrap; padding:10px 0; border-bottom:1px solid ${token('border')}; }
.schedule-settings-row>span { flex:1; min-width:90px; }
.schedule-settings-row select { max-width:145px; }
.schedule-option-list { display:flex; flex-direction:column; gap:5px; }
.schedule-option-list .schedule-check { justify-content:flex-start; }
@container (max-width:800px) { .schedule-desktop { display:none; } .schedule-mobile { display:block; } .schedule-stats { width:100%; margin-left:0; } }
@media (max-width:639px) { .schedule-head .schedule-actions { width:100%; justify-content:flex-end; } .schedule-filter-gap { display:none; } .schedule-status-select { margin-left:auto; } .schedule-dialog { padding:22px 16px; } .schedule-field input,.schedule-field select,.schedule-field textarea { font-size:16px; } .schedule-fieldrow { grid-template-columns:minmax(0,1fr) minmax(0,1fr); } }
@media (pointer:coarse) { .schedule-filter,.schedule-icon,.schedule-lane-add,.schedule-check { min-height:44px; } .schedule-day-strip button { min-width:44px; } }
@media (prefers-reduced-motion:reduce) { .schedule *,.schedule-dialog * { scroll-behavior:auto!important; } }
`;
