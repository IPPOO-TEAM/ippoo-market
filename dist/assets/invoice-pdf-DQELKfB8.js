import{aI as c,cr as $,cs as b,cY as v}from"./index-EOKOrOjd.js";function t(n){return String(n??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}function A(n,e,m=Date.now()){const o=new Date(m).getFullYear(),s=`ippoo:invoice-map:${n}`,p=`ippoo:invoice-seq:${n}:${o}`;try{const l=$(s),i=l?JSON.parse(l):{};if(i[e])return i[e];const d=(parseInt($(p)||"0",10)||0)+1;b(p,String(d));const g=`INV-${o}-${String(d).padStart(4,"0")}`;return i[e]=g,b(s,JSON.stringify(i)),g}catch{return`INV-${o}-${e.slice(0,4).toUpperCase()}`}}function C(n,e,m){const o=n.items.filter(a=>a.vendorId===m||a.vendorId===e.shopName);if(o.length===0)return;const s=o.reduce((a,y)=>a+y.unitPrice*y.qty,0),p=v(),l=Number.isFinite(p.commission)?p.commission:8,i=Number.isFinite(p.vatRate)?p.vatRate:18,d=Math.round(s*l/100),g=s-d,u=i>0?Math.round(s*i/(100+i)):0,f=new Date(n.createdAt).toLocaleDateString("fr-FR",{day:"2-digit",month:"long",year:"numeric"}),h=A(m,n.id,n.createdAt),r=n.shippingAddress,F=o.map(a=>`
      <tr>
        <td>${t(a.title)}</td>
        <td class="num">${t(a.qty)}</td>
        <td class="num">${c(a.unitPrice)} FCFA</td>
        <td class="num">${c(a.unitPrice*a.qty)} FCFA</td>
      </tr>`).join(""),w=`<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <title>Facture ${t(h)} - ${t(e.shopName)}</title>
  <style>
    @page { size: A4; margin: 18mm; }
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      color: #111827; margin: 0; padding: 24px;
    }
    header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; }
    .brand { font-size: 24px; font-weight: 700; color: #E11D2E; }
    .meta { text-align: right; font-size: 12px; color: #6B7280; }
    h1 { font-size: 18px; margin: 24px 0 4px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px; }
    .card { border: 1px solid #E5E7EB; border-radius: 8px; padding: 12px 14px; }
    .card h3 { font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #6B7280; margin: 0 0 6px; }
    .card p { margin: 2px 0; font-size: 13px; }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 13px; }
    th, td { padding: 10px 8px; border-bottom: 1px solid #E5E7EB; text-align: left; }
    th { background: #F9FAFB; font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em; color: #6B7280; }
    .num { text-align: right; font-variant-numeric: tabular-nums; }
    .totals { margin-top: 16px; margin-left: auto; width: 260px; font-size: 13px; }
    .totals .row { display: flex; justify-content: space-between; padding: 4px 0; }
    .totals .grand { border-top: 2px solid #111827; margin-top: 6px; padding-top: 8px; font-weight: 700; font-size: 14px; }
    footer { margin-top: 48px; font-size: 11px; color: #9CA3AF; text-align: center; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 11px; font-weight: 600; }
    .badge-paid { background: #DCFCE7; color: #166534; }
    .badge-pending { background: #FEF3C7; color: #92400E; }
    @media print { body { padding: 0; } .no-print { display: none; } }
  </style>
</head>
<body>
  <header>
    <div style="display:flex;align-items:flex-start;gap:14px;">
      ${e.logo?`<img src="${t(e.logo)}" alt="" style="width:64px;height:64px;border-radius:12px;object-fit:cover;border:1px solid #E5E7EB;flex-shrink:0;" />`:""}
      <div>
      <div class="brand">${t(e.shopName)}</div>
      ${e.city?`<p style="font-size:12px;color:#6B7280;margin:4px 0 0;">${t(e.city)}</p>`:""}
      ${e.phone?`<p style="font-size:12px;color:#6B7280;margin:2px 0 0;">${t(e.phone)}</p>`:""}
      ${e.email?`<p style="font-size:12px;color:#6B7280;margin:2px 0 0;">${t(e.email)}</p>`:""}
      ${e.rccm?`<p style="font-size:11px;color:#9CA3AF;margin:6px 0 0;">RCCM : ${t(e.rccm)}</p>`:""}
      ${e.ifu?`<p style="font-size:11px;color:#9CA3AF;margin:2px 0 0;">IFU : ${t(e.ifu)}</p>`:""}
      </div>
    </div>
    <div class="meta">
      <h1 style="margin:0;font-size:22px;color:#111827;">FACTURE</h1>
      <p style="margin:4px 0 0;font-weight:700;color:#111827;">N° ${t(h)}</p>
      <p style="margin:2px 0 0;font-size:11px;">Réf. commande : ${t(n.id)}</p>
      <p style="margin:2px 0 0;">${t(f)}</p>
      <p style="margin:8px 0 0;">
        <span class="badge ${n.status==="cloturee"?"badge-paid":"badge-pending"}">
          ${n.status==="cloturee"?"PAYÉE":n.status==="annulee"?"ANNULÉE":"EN COURS"}
        </span>
      </p>
    </div>
  </header>

  <div class="grid">
    <div class="card">
      <h3>Facturé à</h3>
      <p><strong>${t(r.name)}</strong></p>
      <p>${t(r.line1)}</p>
      ${r.line2?`<p>${t(r.line2)}</p>`:""}
      <p>${t(r.city)}</p>
      <p>${t(r.phone)}</p>
    </div>
    <div class="card">
      <h3>Paiement</h3>
      <p>Mode : ${t(n.paymentMethod)}</p>
      <p>Paiement protégé : ${t(n.escrowStatus)}</p>
      <p>Date commande : ${t(f)}</p>
    </div>
  </div>

  <table>
    <thead>
      <tr><th>Produit</th><th class="num">Qté</th><th class="num">PU</th><th class="num">Total</th></tr>
    </thead>
    <tbody>${F}</tbody>
  </table>

  <div class="totals">
    <div class="row"><span>Sous-total (TTC)</span><span>${c(s)} FCFA</span></div>
    ${u>0?`<div class="row" style="color:#6B7280;"><span>Dont TVA (${i}%)</span><span>${c(u)} FCFA</span></div>`:""}
    <div class="row" style="color:#6B7280;"><span>Commission IPPOO (${l}%)</span><span>− ${c(d)} FCFA</span></div>
    <div class="row grand"><span>Net vendeur</span><span>${c(g)} FCFA</span></div>
  </div>

  <footer>
    Facture générée via IPPOO Market - ippoo.com<br/>
    Document non contractuel, conservé pour votre comptabilité.
  </footer>

  <script>
    window.addEventListener("load", function () { setTimeout(function () { window.print(); }, 200); });
  <\/script>
</body>
</html>`,x=window.open("","_blank","width=820,height=900");x&&(x.document.open(),x.document.write(w),x.document.close())}export{A as g,C as o};
