import{aI as v,b6 as se,a as ae,r as $,de as B,j as e,ad as oe,ae as ie,af as ne,c4 as _,b5 as H,k as Y,bo as re,w as K,aY as Q,t as R,bY as de,ak as G}from"./index-EOKOrOjd.js";import{listMyInvoices as X,listMyOrders as Z,listMyMovements as ee,getMyProduct as J,hydrateMyProducts as le,subscribe as ce,getMyProductsSnapshot as pe,SERVER_SNAPSHOT as me}from"./my-products-CuL6Gibi.js";import{A as j}from"./animated-number-Bv-tnjyp.js";import{hydrateMyShops as ue,subscribe as xe,getMyShopsSnapshot as he,SERVER_SNAPSHOT as ge,getActiveShopSlug as fe,listAllShops as be}from"./my-shops--TvkYcOF.js";import{v as ye}from"./accounting-CqjfsirQ.js";import{R as ve}from"./receipt-Mayupw1y.js";import{P as je}from"./printer-E9BAg5mg.js";import{A as Ne}from"./arrow-down-right-CGz6BGPb.js";function g(s){return String(s??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}function we(s){return new Date(s).toLocaleString("fr-FR",{day:"2-digit",month:"long",year:"numeric",hour:"2-digit",minute:"2-digit"})}const Se={cash:"Espèces",ippoo_cash:"IPPOO CASH",card:"Carte bancaire",mobile_money:"Mobile Money",transfer:"Virement",credit:"Crédit"};function Ee(s,i){const n=window.open("","_blank","noopener");if(!n)return;const d=s.total,x=s.unitPrice*s.qty,c=`<!doctype html>
<html lang="fr"><head><meta charset="utf-8" />
<title>Facture ${g(s.number)}</title>
<style>
  @page { size: A4; margin: 14mm; }
  * { box-sizing: border-box; }
  body { font-family: -apple-system, system-ui, "Segoe UI", Roboto, sans-serif; color: #0F172A; margin: 0; padding: 0; }
  .wrap { max-width: 720px; margin: 0 auto; padding: 24px; }
  header { display: flex; align-items: center; gap: 16px; border-bottom: 2px solid #E11D2E; padding-bottom: 16px; margin-bottom: 20px; }
  header img { width: 64px; height: 64px; border-radius: 12px; object-fit: cover; }
  .brand { flex: 1; }
  .shop-name { font-size: 20px; font-weight: 800; letter-spacing: -.01em; }
  .meta { font-size: 11px; color: #6B7280; margin-top: 2px; }
  .doc { text-align: right; }
  .doc-title { font-size: 22px; font-weight: 800; color: #E11D2E; letter-spacing: .04em; }
  .doc-num { font-size: 12px; color: #6B7280; margin-top: 2px; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 18px; }
  .card { border: 1px solid #E5E7EB; border-radius: 12px; padding: 12px 14px; }
  .label { text-transform: uppercase; font-size: 10px; letter-spacing: .08em; color: #9CA3AF; font-weight: 700; margin-bottom: 4px; }
  table { width: 100%; border-collapse: collapse; margin: 12px 0 18px; }
  th { text-align: left; padding: 8px 10px; background: #FAFAFA; font-size: 11px; text-transform: uppercase; letter-spacing: .04em; color: #6B7280; border-bottom: 1px solid #E5E7EB; }
  td { padding: 10px; border-bottom: 1px solid #F3F4F6; font-size: 13px; vertical-align: top; }
  td.right, th.right { text-align: right; }
  .totals { margin-left: auto; width: 280px; }
  .totals .row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; }
  .totals .grand { border-top: 2px solid #0F172A; padding-top: 10px; margin-top: 4px; font-size: 16px; font-weight: 800; }
  .totals .grand .amt { color: #E11D2E; }
  .uid { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 11px; color: #6B7280; }
  footer { margin-top: 28px; padding-top: 14px; border-top: 1px dashed #E5E7EB; font-size: 10px; color: #9CA3AF; text-align: center; }
  @media print { .noprint { display: none !important; } body { background: #fff; } }
  .noprint { position: fixed; top: 12px; right: 12px; }
  .btn { background: #E11D2E; color: #fff; border: 0; padding: 8px 14px; border-radius: 8px; cursor: pointer; font-weight: 700; font-size: 12px; }
</style></head>
<body>
<div class="noprint"><button class="btn" onclick="window.print()">Imprimer / Enregistrer en PDF</button></div>
<div class="wrap">
  <header>
    ${i.logo?`<img src="${g(i.logo)}" alt="" />`:""}
    <div class="brand">
      <div class="shop-name">${g(i.shopName)}</div>
      <div class="meta">
        ${[i.city,i.phone,i.email].filter(Boolean).map(g).join(" · ")}
      </div>
      <div class="meta">
        ${i.rccm?"RCCM : "+g(i.rccm):""}
        ${i.ifu?(i.rccm?" · ":"")+"IFU : "+g(i.ifu):""}
      </div>
    </div>
    <div class="doc">
      <div class="doc-title">FACTURE</div>
      <div class="doc-num">N° ${g(s.number)}</div>
      <div class="doc-num">${g(we(s.ts))}</div>
    </div>
  </header>

  <div class="grid">
    <div class="card">
      <div class="label">Client</div>
      <div style="font-weight:600">${g(s.buyerName||"Client comptoir")}</div>
      ${s.buyerContact?`<div class="meta">${g(s.buyerContact)}</div>`:""}
    </div>
    <div class="card">
      <div class="label">Paiement</div>
      <div style="font-weight:600">${g(Se[s.paymentMethod]||s.paymentMethod)}</div>
      <div class="meta">Commande ${g(s.orderId)}</div>
    </div>
  </div>

  <table>
    <thead><tr>
      <th>Produit</th><th>Réf / UID</th><th class="right">Qté</th>
      <th class="right">PU</th><th class="right">Total</th>
    </tr></thead>
    <tbody>
      <tr>
        <td>
          <div style="font-weight:600">${g(s.productName)}</div>
          ${s.category?`<div class="meta">Catégorie : ${g(s.category)}</div>`:""}
        </td>
        <td>
          ${s.productRef?`<div class="uid">${g(s.productRef)}</div>`:""}
          ${s.productUid&&s.productUid!==s.productRef?`<div class="uid">UID : ${g(s.productUid)}</div>`:""}
        </td>
        <td class="right">${s.qty}${s.unit?" "+g(s.unit):""}</td>
        <td class="right">${v(s.unitPrice)} FCFA</td>
        <td class="right">${v(x)} FCFA</td>
      </tr>
    </tbody>
  </table>

  <div class="totals">
    <div class="row"><span>Sous-total</span><span>${v(x)} FCFA</span></div>
    <div class="row grand"><span>Total TTC</span><span class="amt">${v(d)} FCFA</span></div>
  </div>

  <footer>
    Facture générée via IPPOO Market · Conservez ce document pour votre comptabilité.
    ${s.productUid?`<br/>Numéro de suivi inventaire : <span class="uid">${g(s.productUid)}</span>`:""}
  </footer>
</div>
<script>setTimeout(() => window.print(), 350);<\/script>
</body></html>`;n.document.open(),n.document.write(c),n.document.close()}function y(s){return String(s??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}const Ae=["janvier","février","mars","avril","mai","juin","juillet","août","septembre","octobre","novembre","décembre"];function $e(s,i,n){const d=new Date(i,n-1,1).getTime(),x=new Date(i,n,1).getTime(),c=o=>o.ts>=d&&o.ts<x,l=X(s).filter(c),N=Z(s).filter(c),m=ee(s).filter(c),u=N.filter(o=>o.status!=="refunded"),a=N.filter(o=>o.status==="refunded").reduce((o,t)=>o+t.total,0),h=u.reduce((o,t)=>o+t.total,0),E=u.length,A=u.reduce((o,t)=>o+t.qty,0),p=E>0?h/E:0;let w=0;for(const o of u){const t=J(o.productId),r=(t==null?void 0:t.cost)??0;w+=r*o.qty}const F=h-w,f=new Map;for(const o of l){const t=o.category||"Non catégorisé",r=f.get(t)??{revenue:0,units:0};r.revenue+=o.total,r.units+=o.qty,f.set(t,r)}const z=Array.from(f.entries()).map(([o,t])=>({name:o,...t})).sort((o,t)=>t.revenue-o.revenue),S=new Map;for(const o of l){const t=o.paymentMethod,r=S.get(t)??{revenue:0,count:0};r.revenue+=o.total,r.count+=1,S.set(t,r)}const C=Array.from(S.entries()).map(([o,t])=>({method:o,...t})).sort((o,t)=>t.revenue-o.revenue);let T=0,I=0,k=0;for(const o of m)if(o.delta>0){T+=o.delta;const t=J(o.productId),r=(t==null?void 0:t.cost)??0;k+=r*o.delta}else I+=-o.delta;return{year:i,month:n,monthLabel:Ae[n-1],revenue:h,ordersCount:E,unitsSold:A,avgTicket:p,refunds:a,cogsEstimate:w,grossMargin:F,byCategory:z,byPayment:C,stockIn:T,stockOut:I,stockInValue:k,invoices:l,orders:N,movements:m}}const Fe={cash:"Espèces",ippoo_cash:"IPPOO CASH",card:"Carte",mobile_money:"Mobile Money",transfer:"Virement",credit:"Crédit"};function ze(s,i){const n=window.open("","_blank","noopener");if(!n)return;const d=m=>`${v(Math.round(m))} FCFA`,x=s.grossMargin-s.refunds,c=s.byCategory.length===0?'<tr><td colspan="3" style="text-align:center;color:#9CA3AF">Aucune vente sur la période</td></tr>':s.byCategory.map(m=>`
        <tr>
          <td>${y(m.name)}</td>
          <td class="right">${m.units}</td>
          <td class="right">${d(m.revenue)}</td>
        </tr>`).join(""),l=s.byPayment.map(m=>`
    <tr>
      <td>${y(Fe[m.method]||m.method)}</td>
      <td class="right">${m.count}</td>
      <td class="right">${d(m.revenue)}</td>
    </tr>`).join(""),N=`<!doctype html>
<html lang="fr"><head><meta charset="utf-8" />
<title>Bilan ${y(s.monthLabel)} ${s.year} - ${y(i.shopName)}</title>
<style>
  @page { size: A4; margin: 14mm; }
  body { font-family: -apple-system, system-ui, "Segoe UI", Roboto, sans-serif; color: #0F172A; margin: 0; }
  .wrap { max-width: 760px; margin: 0 auto; padding: 24px; }
  header { display: flex; align-items: center; gap: 16px; border-bottom: 2px solid #E11D2E; padding-bottom: 16px; margin-bottom: 22px; }
  header img { width: 64px; height: 64px; border-radius: 12px; object-fit: cover; }
  .shop-name { font-size: 20px; font-weight: 800; }
  .meta { font-size: 11px; color: #6B7280; margin-top: 2px; }
  .doc { text-align: right; }
  .doc-title { font-size: 18px; font-weight: 800; color: #E11D2E; letter-spacing: .04em; text-transform: uppercase; }
  .doc-sub { font-size: 13px; font-weight: 700; margin-top: 2px; }
  h2 { font-size: 13px; text-transform: uppercase; letter-spacing: .08em; color: #6B7280; margin: 22px 0 8px; }
  .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
  .kpi { border: 1px solid #E5E7EB; border-radius: 10px; padding: 10px 12px; }
  .kpi .label { font-size: 10px; text-transform: uppercase; color: #9CA3AF; font-weight: 700; }
  .kpi .value { font-size: 16px; font-weight: 800; margin-top: 4px; }
  table { width: 100%; border-collapse: collapse; margin: 4px 0 6px; }
  th { text-align: left; padding: 8px 10px; background: #FAFAFA; font-size: 10px; text-transform: uppercase; letter-spacing: .04em; color: #6B7280; border-bottom: 1px solid #E5E7EB; }
  td { padding: 8px 10px; border-bottom: 1px solid #F3F4F6; font-size: 12px; }
  td.right, th.right { text-align: right; }
  .pnl { border: 2px solid #0F172A; border-radius: 12px; padding: 14px 18px; margin-top: 8px; }
  .pnl .row { display: flex; justify-content: space-between; padding: 5px 0; font-size: 13px; }
  .pnl .row.sub { color: #6B7280; font-size: 11px; padding: 2px 0 2px 16px; }
  .pnl .row.total { border-top: 1px solid #E5E7EB; padding-top: 8px; margin-top: 6px; font-weight: 700; }
  .pnl .row.net { border-top: 2px solid #0F172A; padding-top: 10px; margin-top: 8px; font-size: 16px; font-weight: 800; }
  .pnl .row.net .amt { color: ${x>=0?"#16A34A":"#E11D2E"}; }
  footer { margin-top: 26px; padding-top: 12px; border-top: 1px dashed #E5E7EB; font-size: 10px; color: #9CA3AF; text-align: center; }
  @media print { .noprint { display: none !important; } }
  .noprint { position: fixed; top: 12px; right: 12px; }
  .btn { background: #E11D2E; color: #fff; border: 0; padding: 8px 14px; border-radius: 8px; cursor: pointer; font-weight: 700; font-size: 12px; }
</style></head>
<body>
<div class="noprint"><button class="btn" onclick="window.print()">Imprimer / Enregistrer en PDF</button></div>
<div class="wrap">
  <header>
    ${i.logo?`<img src="${y(i.logo)}" alt="" />`:""}
    <div style="flex:1">
      <div class="shop-name">${y(i.shopName)}</div>
      <div class="meta">${[i.city,i.phone,i.email].filter(Boolean).map(y).join(" · ")}</div>
      <div class="meta">
        ${i.rccm?"RCCM : "+y(i.rccm):""}
        ${i.ifu?(i.rccm?" · ":"")+"IFU : "+y(i.ifu):""}
      </div>
    </div>
    <div class="doc">
      <div class="doc-title">Bilan mensuel</div>
      <div class="doc-sub">${y(s.monthLabel)} ${s.year}</div>
      <div class="meta">Édité le ${new Date().toLocaleDateString("fr-FR")}</div>
    </div>
  </header>

  <h2>Indicateurs clés</h2>
  <div class="kpi-grid">
    <div class="kpi"><div class="label">Chiffre d'affaires</div><div class="value">${d(s.revenue)}</div></div>
    <div class="kpi"><div class="label">Commandes</div><div class="value">${s.ordersCount}</div></div>
    <div class="kpi"><div class="label">Unités vendues</div><div class="value">${s.unitsSold}</div></div>
    <div class="kpi"><div class="label">Panier moyen</div><div class="value">${d(s.avgTicket)}</div></div>
  </div>

  <h2>Compte de résultat simplifié</h2>
  <div class="pnl">
    <div class="row"><span>Produits - Ventes nettes</span><span>${d(s.revenue)}</span></div>
    <div class="row sub"><span>dont remboursements</span><span>− ${d(s.refunds)}</span></div>
    <div class="row total"><span>Total produits</span><span>${d(s.revenue)}</span></div>

    <div class="row" style="margin-top:10px"><span>Charges - Coût d'achat des marchandises vendues</span><span>− ${d(s.cogsEstimate)}</span></div>
    <div class="row sub"><span>Réapprovisionnement valorisé sur la période</span><span>${d(s.stockInValue)}</span></div>
    <div class="row total"><span>Marge brute</span><span>${d(s.grossMargin)}</span></div>

    <div class="row net"><span>Résultat net estimé</span><span class="amt">${d(x)}</span></div>
  </div>
  <p class="meta" style="margin-top:6px">
    Le coût d'achat est calculé à partir du champ <em>coût</em> renseigné sur chaque produit.
    Les charges externes (loyer, salaires, frais bancaires) ne sont pas incluses dans ce bilan simplifié.
  </p>

  <h2>Ventilation par catégorie</h2>
  <table>
    <thead><tr><th>Catégorie</th><th class="right">Unités</th><th class="right">CA</th></tr></thead>
    <tbody>${c}</tbody>
  </table>

  <h2>Modes de paiement</h2>
  <table>
    <thead><tr><th>Moyen</th><th class="right">Transactions</th><th class="right">Montant</th></tr></thead>
    <tbody>${l||'<tr><td colspan="3" style="text-align:center;color:#9CA3AF">-</td></tr>'}</tbody>
  </table>

  <h2>Mouvements de stock</h2>
  <table>
    <thead><tr><th>Type</th><th class="right">Unités</th><th class="right">Valeur</th></tr></thead>
    <tbody>
      <tr><td>Entrées (réappro, retours)</td><td class="right">+ ${s.stockIn}</td><td class="right">${d(s.stockInValue)}</td></tr>
      <tr><td>Sorties (ventes, casse)</td><td class="right">− ${s.stockOut}</td><td class="right">-</td></tr>
    </tbody>
  </table>

  <footer>
    Document généré via IPPOO Market · ${y(i.shopName)} · ${y(s.monthLabel)} ${s.year}
    <br/>Bilan comptable simplifié à usage interne. Pour une déclaration officielle, faites valider par votre comptable.
  </footer>
</div>
<script>setTimeout(() => window.print(), 400);<\/script>
</body></html>`;n.document.open(),n.document.write(N),n.document.close()}const Pe={"7d":7,"30d":30,"90d":90,"365d":365,all:null},te=[{id:"7d",label:"7 jours"},{id:"30d",label:"30 jours"},{id:"90d",label:"90 jours"},{id:"365d",label:"1 an"},{id:"all",label:"Tout"}];function Oe(){var k,o;se();const[s,i]=ae(),[n,d]=$.useState("30d"),x=s.get("v")??((k=B[0])==null?void 0:k.id)??"",c=$.useMemo(()=>B.find(t=>t.id===x)??B[0],[x]),l=$.useMemo(()=>c?ye(c.id,n):void 0,[c,n]);if(!c||!l)return e.jsx("div",{className:"p-4",children:"Aucun vendeur disponible."});const N=l.ordersCount>0?l.revenue/l.ordersCount:0,m=l.movements.filter(t=>t.delta>0).reduce((t,r)=>t+r.delta,0),u=l.movements.filter(t=>t.delta<0).reduce((t,r)=>t-r.delta,0);$.useEffect(()=>{le(),ue()},[]),$.useSyncExternalStore(ce,pe,()=>me),$.useSyncExternalStore(xe,he,()=>ge);const a=$.useSyncExternalStore(oe,ie,()=>ne),h=fe(a==null?void 0:a.businessName),E=h?(o=be(a==null?void 0:a.businessName).find(t=>t.slug===h))==null?void 0:o.name:void 0,A=Pe[n],p=A==null?0:Date.now()-A*864e5,w=h?Z(h).filter(t=>t.ts>=p):[],F=h?ee(h).filter(t=>t.ts>=p):[],f=h?X(h).filter(t=>t.ts>=p):[],z=w.filter(t=>t.status!=="refunded").reduce((t,r)=>t+r.total,0),S=w.filter(t=>t.status!=="refunded").reduce((t,r)=>t+r.qty,0),C=F.filter(t=>t.delta>0).reduce((t,r)=>t+r.delta,0),T=F.filter(t=>t.delta<0).reduce((t,r)=>t+Math.abs(r.delta),0),I=()=>{if(f.length===0){R.info("Aucune facture sur la période");return}const t=["N° Facture","Date","Produit","Référence","UID","Qté","Unité","PU (FCFA)","Total (FCFA)","Acheteur","Paiement","Catégorie"],r=f.map(b=>[b.number,new Date(b.ts).toISOString().slice(0,10),b.productName,b.productRef??"",b.productUid??"",String(b.qty),b.unit,String(b.unitPrice),String(b.total),b.buyerName??"Anonyme",b.paymentMethod,b.category??""].map(q=>`"${String(q).replace(/"/g,'""')}"`).join(";")),V=f.reduce((b,q)=>b+q.total,0),W=["","","TOTAL","","","","","",String(V),"","",""].map(b=>`"${b}"`).join(";"),U="\uFEFF"+[t.join(";"),...r,W].join(`\r
`),P=new Blob([U],{type:"text/csv;charset=utf-8"}),O=URL.createObjectURL(P),D=document.createElement("a");D.href=O,D.download=`ippoo-ventes-${h}-${n}-${new Date().toISOString().slice(0,10)}.csv`,document.body.appendChild(D),D.click(),D.remove(),URL.revokeObjectURL(O),R.success(`${f.length} facture(s) exportée(s)`)};return e.jsxs("div",{className:"max-w-6xl mx-auto p-4 pb-24",children:[e.jsxs("div",{className:"flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-4",children:[e.jsxs("div",{children:[e.jsx("h1",{style:{fontFamily:"Poppins",fontWeight:800,fontSize:22},children:"Comptabilité vendeur"}),e.jsx("p",{className:"text-muted-foreground",style:{fontSize:13},children:"Suivi des ventes, du stock et bilan comptable consolidé."})]}),e.jsxs("div",{className:"flex flex-wrap items-center gap-2",children:[e.jsxs("button",{onClick:()=>Ce(c,n,l,{avgTicket:N,totalIn:m,totalOut:u}),className:"inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#FF6A00] text-white hover:bg-[#B91C1C]",style:{fontSize:12,fontWeight:700},children:[e.jsx(_,{className:"w-4 h-4"})," Bilan PDF"]}),e.jsx("select",{value:c.id,onChange:t=>i({v:t.target.value}),className:"px-3 py-2 rounded-xl border border-border bg-white",style:{fontSize:13,fontWeight:600},children:B.map(t=>e.jsx("option",{value:t.id,children:t.name},t.id))}),e.jsx("div",{className:"flex items-center gap-1 p-1 rounded-xl bg-muted",children:te.map(t=>e.jsx("button",{onClick:()=>d(t.id),className:`px-2.5 py-1 rounded-lg ${n===t.id?"bg-white shadow":""}`,style:{fontSize:11,fontWeight:700},children:t.label},t.id))})]})]}),e.jsxs("div",{className:"grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4",children:[e.jsx(L,{icon:e.jsx(H,{className:"w-5 h-5"}),label:"Chiffre d'affaires",value:e.jsx(j,{value:l.revenue,format:t=>v(t)}),color:"#E11D2E"}),e.jsx(L,{icon:e.jsx(ve,{className:"w-5 h-5"}),label:"Commandes",value:e.jsx(j,{value:l.ordersCount}),sub:`${l.salesCount} lignes`,color:"#F97316"}),e.jsx(L,{icon:e.jsx(Y,{className:"w-5 h-5"}),label:"Unités vendues",value:e.jsx(j,{value:l.unitsSold}),color:"#1A1A2E"}),e.jsx(L,{icon:e.jsx(re,{className:"w-5 h-5"}),label:"Panier moyen",value:e.jsx(j,{value:Math.round(N),format:t=>v(t)}),color:"#16A34A"})]}),h&&e.jsxs("div",{className:"bg-card border border-border rounded-2xl p-4 mb-4",children:[e.jsxs("div",{className:"flex items-center justify-between gap-2 mb-3 flex-wrap",children:[e.jsxs("h3",{className:"flex items-center gap-2",style:{fontFamily:"Poppins",fontWeight:700,fontSize:14},children:[e.jsx(K,{className:"w-4 h-4 text-[#E11D2E]"}),"Ma boutique - ventes directes",E&&e.jsxs("span",{className:"text-muted-foreground",style:{fontSize:11,fontWeight:500},children:["· ",E]})]}),e.jsxs("div",{className:"flex items-center gap-2 flex-wrap",children:[e.jsxs("button",{onClick:()=>{if(!h)return;const t=new Date,r=$e(h,t.getFullYear(),t.getMonth()+1);if(r.invoices.length===0){R.info("Aucune vente ce mois-ci");return}ze(r,{shopName:E||(a==null?void 0:a.businessName)||"Boutique",city:a==null?void 0:a.city,phone:a==null?void 0:a.phone,email:a==null?void 0:a.email,rccm:a==null?void 0:a.rccm,ifu:a==null?void 0:a.ifu,logo:a==null?void 0:a.logo})},className:"inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-white",style:{background:"#1A1A2E",fontSize:11,fontWeight:700},children:[e.jsx(Q,{className:"w-3.5 h-3.5"})," Bilan mensuel PDF"]}),e.jsxs("button",{onClick:I,disabled:f.length===0,className:"inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-border hover:bg-muted disabled:opacity-50",style:{fontSize:11,fontWeight:600},children:[e.jsx(_,{className:"w-3.5 h-3.5"})," Export CSV"]})]})]}),e.jsxs("div",{className:"grid grid-cols-2 lg:grid-cols-5 gap-2",children:[e.jsx(M,{label:"CA direct",value:e.jsx(j,{value:z,format:t=>v(t)}),color:"#E11D2E"}),e.jsx(M,{label:"Ventes",value:e.jsx(j,{value:w.length}),color:"#F97316"}),e.jsx(M,{label:"Unités",value:e.jsx(j,{value:S}),color:"#1A1A2E"}),e.jsx(M,{label:"Entrées stock",value:e.jsx(j,{value:C,prefix:"+"}),color:"#16A34A"}),e.jsx(M,{label:"Sorties stock",value:e.jsx(j,{value:T,prefix:"-"}),color:"#E11D2E"})]}),f.length>0&&e.jsxs("div",{className:"mt-3 overflow-x-auto",children:[e.jsxs("table",{className:"w-full",style:{fontSize:12},children:[e.jsx("thead",{children:e.jsxs("tr",{className:"text-left text-muted-foreground border-b border-border",children:[e.jsx("th",{className:"px-2 py-1.5",style:{fontWeight:700,fontSize:10},children:"FACTURE"}),e.jsx("th",{className:"px-2 py-1.5",style:{fontWeight:700,fontSize:10},children:"DATE"}),e.jsx("th",{className:"px-2 py-1.5",style:{fontWeight:700,fontSize:10},children:"PRODUIT"}),e.jsx("th",{className:"px-2 py-1.5",style:{fontWeight:700,fontSize:10},children:"ACHETEUR"}),e.jsx("th",{className:"px-2 py-1.5 text-right",style:{fontWeight:700,fontSize:10},children:"TOTAL"}),e.jsx("th",{className:"px-2 py-1.5 text-right",style:{fontWeight:700,fontSize:10},children:"PDF"})]})}),e.jsx("tbody",{children:f.slice(0,12).map(t=>e.jsxs("tr",{className:"border-b border-[#F3F4F6]",children:[e.jsx("td",{className:"px-2 py-1.5",style:{fontFamily:"ui-monospace",fontWeight:600},children:t.number}),e.jsx("td",{className:"px-2 py-1.5 text-muted-foreground",children:new Date(t.ts).toLocaleDateString("fr-FR")}),e.jsxs("td",{className:"px-2 py-1.5",children:[e.jsx("div",{className:"truncate max-w-[200px]",style:{fontWeight:600},children:t.productName}),e.jsxs("div",{className:"text-muted-foreground",style:{fontSize:10},children:[t.qty," × ",v(t.unitPrice)]})]}),e.jsx("td",{className:"px-2 py-1.5 text-muted-foreground truncate max-w-[140px]",children:t.buyerName??"Anonyme"}),e.jsx("td",{className:"px-2 py-1.5 text-right",style:{fontWeight:700,color:"#16A34A"},children:v(t.total)}),e.jsx("td",{className:"px-2 py-1.5 text-right",children:e.jsx("button",{onClick:()=>Ee(t,{shopName:t.sellerShopName||(a==null?void 0:a.businessName)||"Boutique",city:a==null?void 0:a.city,phone:a==null?void 0:a.phone,email:a==null?void 0:a.email,rccm:a==null?void 0:a.rccm,ifu:a==null?void 0:a.ifu,logo:a==null?void 0:a.logo}),className:"inline-flex items-center gap-1 px-2 py-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground",title:"Imprimer / PDF","aria-label":"Imprimer la facture",children:e.jsx(je,{className:"w-3.5 h-3.5"})})})]},t.id))})]}),f.length>12&&e.jsxs("p",{className:"text-center text-muted-foreground pt-2",style:{fontSize:11},children:["+ ",f.length-12," facture(s) - exporter en CSV pour voir tout"]})]})]}),e.jsxs("div",{className:"grid grid-cols-1 lg:grid-cols-2 gap-3 mb-4",children:[e.jsxs("div",{className:"bg-card border border-border rounded-2xl p-4",children:[e.jsxs("h3",{className:"mb-3 flex items-center gap-2",style:{fontFamily:"Poppins",fontWeight:700,fontSize:14},children:[e.jsx(Y,{className:"w-4 h-4 text-[#F97316]"})," Mouvements de stock"]}),e.jsxs("div",{className:"grid grid-cols-2 gap-2 mb-3",children:[e.jsxs("div",{className:"p-3 rounded-xl bg-[#16A34A]/10",children:[e.jsx("p",{className:"text-muted-foreground",style:{fontSize:11,fontWeight:700},children:"ENTRÉES"}),e.jsxs("p",{className:"flex items-center gap-1",style:{fontFamily:"Poppins",fontWeight:800,fontSize:18,color:"#16A34A"},children:[e.jsx(de,{className:"w-4 h-4"})," ",e.jsx(j,{value:m,prefix:"+"})]})]}),e.jsxs("div",{className:"p-3 rounded-xl bg-[#E11D2E]/10",children:[e.jsx("p",{className:"text-muted-foreground",style:{fontSize:11,fontWeight:700},children:"SORTIES"}),e.jsxs("p",{className:"flex items-center gap-1",style:{fontFamily:"Poppins",fontWeight:800,fontSize:18,color:"#E11D2E"},children:[e.jsx(Ne,{className:"w-4 h-4"})," ",e.jsx(j,{value:u,prefix:"-"})]})]})]}),l.movements.length===0?e.jsx("p",{className:"text-muted-foreground text-center py-4",style:{fontSize:12},children:"Aucun mouvement sur la période."}):e.jsx("div",{className:"space-y-1.5 max-h-72 overflow-auto",children:l.movements.slice(0,30).map(t=>e.jsxs("div",{className:"flex items-center justify-between px-3 py-2 rounded-lg bg-muted/40",style:{fontSize:12},children:[e.jsxs("div",{className:"min-w-0",children:[e.jsx("div",{style:{fontFamily:"ui-monospace, SFMono-Regular, Menlo, monospace",fontWeight:600},children:t.uid}),e.jsxs("div",{className:"text-muted-foreground",style:{fontSize:11},children:[t.date," · ",t.reason,t.ref?` · ${t.ref}`:""]})]}),e.jsxs("span",{style:{fontWeight:700,color:t.delta>0?"#16A34A":"#E11D2E"},children:[t.delta>0?"+":"",t.delta]})]},t.id))})]}),e.jsxs("div",{className:"bg-card border border-border rounded-2xl p-4",children:[e.jsxs("h3",{className:"mb-3 flex items-center gap-2",style:{fontFamily:"Poppins",fontWeight:700,fontSize:14},children:[e.jsx(H,{className:"w-4 h-4 text-[#E11D2E]"})," Top produits"]}),l.topProducts.length===0?e.jsx("p",{className:"text-muted-foreground text-center py-4",style:{fontSize:12},children:"Aucune vente sur la période."}):e.jsx("div",{className:"space-y-1.5",children:l.topProducts.map(t=>e.jsxs("div",{className:"flex items-center justify-between px-3 py-2 rounded-lg bg-muted/40",style:{fontSize:12},children:[e.jsxs("div",{className:"min-w-0 flex-1 pr-2",children:[e.jsx("div",{className:"truncate",style:{fontWeight:600},children:t.name}),e.jsx("div",{className:"text-muted-foreground",style:{fontFamily:"ui-monospace",fontSize:11},children:t.uid})]}),e.jsxs("div",{className:"text-right",children:[e.jsx("div",{style:{fontWeight:700},children:v(t.revenue)}),e.jsxs("div",{className:"text-muted-foreground",style:{fontSize:11},children:[t.units," u."]})]})]},t.uid))})]})]}),e.jsxs("div",{className:"bg-card border border-border rounded-2xl p-4",children:[e.jsxs("h3",{className:"mb-3 flex items-center gap-2",style:{fontFamily:"Poppins",fontWeight:700,fontSize:14},children:[e.jsx(Q,{className:"w-4 h-4 text-[#1A1A2E]"})," Factures de la période"]}),l.invoices.length===0?e.jsx("p",{className:"text-muted-foreground text-center py-4",style:{fontSize:12},children:"Aucune facture sur la période."}):e.jsx("div",{className:"overflow-x-auto",children:e.jsxs("table",{className:"w-full",style:{fontSize:12},children:[e.jsx("thead",{children:e.jsxs("tr",{className:"text-left text-muted-foreground border-b border-border",children:[e.jsx("th",{className:"px-2 py-2",style:{fontWeight:700,fontSize:11},children:"FACTURE"}),e.jsx("th",{className:"px-2 py-2",style:{fontWeight:700,fontSize:11},children:"DATE"}),e.jsx("th",{className:"px-2 py-2",style:{fontWeight:700,fontSize:11},children:"ACHETEUR"}),e.jsx("th",{className:"px-2 py-2 text-right",style:{fontWeight:700,fontSize:11},children:"MONTANT"}),e.jsx("th",{className:"px-2 py-2 text-right",style:{fontWeight:700,fontSize:11},children:"STATUT"})]})}),e.jsx("tbody",{children:l.invoices.map(t=>{var W,U;const V=(((W=t.lines)==null?void 0:W.filter(P=>P.vendorId===c.id||P.vendorName===c.id))??[]).reduce((P,O)=>P+O.total,0);return e.jsxs("tr",{className:"border-b border-border",children:[e.jsx("td",{className:"px-2 py-2",children:e.jsx(G,{to:`/facture/${t.id}`,className:"text-[#E11D2E] hover:underline",style:{fontFamily:"ui-monospace",fontWeight:700},children:t.id})}),e.jsx("td",{className:"px-2 py-2 text-muted-foreground",children:t.date}),e.jsx("td",{className:"px-2 py-2",children:((U=t.buyer)==null?void 0:U.name)??"-"}),e.jsx("td",{className:"px-2 py-2 text-right",style:{fontWeight:700},children:v(V)}),e.jsx("td",{className:"px-2 py-2 text-right",children:e.jsx("span",{className:"inline-block px-2 py-0.5 rounded",style:{fontSize:10,fontWeight:800,background:t.status==="paid"?"rgba(22,163,74,0.12)":"rgba(234,179,8,0.18)",color:t.status==="paid"?"#16A34A":"#A16207"},children:t.status==="paid"?"PAYÉE":"EN ATTENTE"})})]},t.id)})})]})})]}),e.jsxs("div",{className:"mt-4 p-3 rounded-xl border border-dashed border-border flex items-center justify-between",style:{fontSize:12},children:[e.jsxs("span",{className:"flex items-center gap-2 text-muted-foreground",children:[e.jsx(K,{className:"w-4 h-4"})," Boutique référence · ",c.name," · ",c.city]}),e.jsx(G,{to:`/vendeur/${c.id}`,className:"text-[#E11D2E] hover:underline",style:{fontWeight:700},children:"Voir la boutique"})]})]})}function Ce(s,i,n,d){var A;const x=window.open("","_blank","noopener,noreferrer");if(!x){R.error("Le navigateur a bloqué l'ouverture de la page. Autorise les pop-ups.");return}const c=((A=te.find(p=>p.id===i))==null?void 0:A.label)??i,N=new Date().toLocaleString("fr-FR",{dateStyle:"long",timeStyle:"short"}),m=p=>p.toLocaleString("fr-FR")+" FCFA",u=p=>p.replace(/[&<>]/g,w=>({"&":"&amp;","<":"&lt;",">":"&gt;"})[w]),a=n.invoices.map(p=>{var f,z;const F=(((f=p.lines)==null?void 0:f.filter(S=>S.vendorId===s.id||S.vendorName===s.id))??[]).reduce((S,C)=>S+C.total,0);return`<tr>
      <td>${u(p.id)}</td>
      <td>${u(p.date)}</td>
      <td>${u(((z=p.buyer)==null?void 0:z.name)??"-")}</td>
      <td style="text-align:right;font-weight:700">${m(F)}</td>
      <td style="text-align:right">${p.status==="paid"?"PAYÉE":"EN ATTENTE"}</td>
    </tr>`}).join("")||'<tr><td colspan="5" style="text-align:center;color:#888">Aucune facture sur la période.</td></tr>',h=n.topProducts.map(p=>`
    <tr>
      <td>${u(p.name)}</td>
      <td style="font-family:ui-monospace,monospace;color:#666">${u(p.uid)}</td>
      <td style="text-align:right">${p.units}</td>
      <td style="text-align:right;font-weight:700">${m(p.revenue)}</td>
    </tr>`).join("")||'<tr><td colspan="4" style="text-align:center;color:#888">Aucune vente.</td></tr>',E=`<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <title>Bilan reversement · ${u(s.name)} · ${u(c)}</title>
  <style>
    @page { size: A4; margin: 18mm 14mm; }
    * { box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #1A1A2E; margin: 0; padding: 24px; }
    header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #E11D2E; padding-bottom: 12px; margin-bottom: 18px; }
    h1 { margin: 0; font-size: 22px; }
    .muted { color: #666; font-size: 12px; }
    .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 18px; }
    .kpi { border: 1px solid #e5e7eb; border-radius: 10px; padding: 10px; }
    .kpi .label { font-size: 10px; text-transform: uppercase; letter-spacing: .5px; color: #666; }
    .kpi .value { font-size: 16px; font-weight: 800; margin-top: 4px; color: #E11D2E; }
    h2 { font-size: 14px; margin: 18px 0 8px; border-left: 4px solid #E11D2E; padding-left: 8px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th, td { padding: 6px 8px; border-bottom: 1px solid #eee; text-align: left; }
    th { background: #fafafa; font-size: 10px; text-transform: uppercase; letter-spacing: .5px; color: #666; }
    footer { margin-top: 24px; padding-top: 12px; border-top: 1px solid #eee; font-size: 10px; color: #888; display: flex; justify-content: space-between; }
    .toolbar { position: fixed; top: 8px; right: 8px; display: flex; gap: 6px; }
    .toolbar button { padding: 6px 10px; border: 1px solid #ddd; background: #fff; border-radius: 6px; cursor: pointer; font-size: 12px; }
    @media print { .toolbar { display: none; } body { padding: 0; } }
  </style>
</head>
<body>
  <div class="toolbar">
    <button onclick="window.print()">Imprimer / Enregistrer en PDF</button>
    <button onclick="window.close()">Fermer</button>
  </div>

  <header>
    <div>
      <h1>Bilan de reversement</h1>
      <p class="muted">IPPOO Market · ${u(s.name)} · ${u(s.city??"")}</p>
    </div>
    <div style="text-align:right">
      <p class="muted" style="margin:0">Période</p>
      <p style="margin:2px 0;font-weight:800">${u(c)}</p>
      <p class="muted" style="margin:0">Émis le ${u(N)}</p>
    </div>
  </header>

  <div class="grid">
    <div class="kpi"><div class="label">Chiffre d'affaires</div><div class="value">${m(n.revenue)}</div></div>
    <div class="kpi"><div class="label">Commandes</div><div class="value">${n.ordersCount}</div></div>
    <div class="kpi"><div class="label">Unités vendues</div><div class="value">${n.unitsSold.toLocaleString("fr-FR")}</div></div>
    <div class="kpi"><div class="label">Panier moyen</div><div class="value">${m(Math.round(d.avgTicket))}</div></div>
  </div>

  <div class="grid" style="grid-template-columns: repeat(3, 1fr);">
    <div class="kpi"><div class="label">Lignes vendues</div><div class="value" style="color:#1A1A2E">${n.salesCount}</div></div>
    <div class="kpi"><div class="label">Stock entrées</div><div class="value" style="color:#16A34A">+${d.totalIn.toLocaleString("fr-FR")}</div></div>
    <div class="kpi"><div class="label">Stock sorties</div><div class="value" style="color:#E11D2E">-${d.totalOut.toLocaleString("fr-FR")}</div></div>
  </div>

  <h2>Top produits</h2>
  <table>
    <thead><tr><th>Produit</th><th>UID</th><th style="text-align:right">Unités</th><th style="text-align:right">CA</th></tr></thead>
    <tbody>${h}</tbody>
  </table>

  <h2>Factures de la période</h2>
  <table>
    <thead><tr><th>Facture</th><th>Date</th><th>Acheteur</th><th style="text-align:right">Montant</th><th style="text-align:right">Statut</th></tr></thead>
    <tbody>${a}</tbody>
  </table>

  <footer>
    <span>IPPOO Market · Bilan généré automatiquement</span>
    <span>Vendeur ID : ${u(s.id)}</span>
  </footer>

  <script>
    setTimeout(() => { try { window.focus(); } catch (e) {} }, 100);
  <\/script>
</body>
</html>`;x.document.open(),x.document.write(E),x.document.close(),R.success("Bilan ouvert dans un nouvel onglet - utilise « Imprimer » pour enregistrer en PDF.")}function L({icon:s,label:i,value:n,sub:d,color:x}){return e.jsxs("div",{className:"bg-card border border-border rounded-2xl p-3",children:[e.jsxs("div",{className:"flex items-center gap-2 text-muted-foreground",style:{fontSize:11,fontWeight:700},children:[e.jsx("span",{style:{color:x},children:s}),i]}),e.jsx("p",{style:{fontFamily:"Poppins",fontWeight:800,fontSize:18,color:x},children:n}),d?e.jsx("p",{className:"text-muted-foreground",style:{fontSize:11},children:d}):null]})}function M({label:s,value:i,color:n}){return e.jsxs("div",{className:"rounded-xl border border-border bg-[#FAFAFA] px-3 py-2",children:[e.jsx("div",{className:"text-muted-foreground",style:{fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:.04},children:s}),e.jsx("div",{style:{fontFamily:"Poppins",fontWeight:800,fontSize:16,color:n},children:i})]})}export{Oe as VendeurComptabilitePage};
