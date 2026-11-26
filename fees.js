/* Shared payment-fee engine for /stripe-fees/, /square-vs-stripe/, /clover-fees/, /square-vs-clover/.
   ONE place for every rate. Sources and read dates: research/payments-fees-2026-11-25.md (outside the site).
   /square-fees/ predates this file and keeps its own copy of the Square rates: change both together.
   Rates are [percent as a fraction, fixed fee in dollars]. US, standard (non-negotiated) pricing. */
(function(){
  "use strict";
  var F = window.FEES = {};
  F.asOf = "November 25, 2026";

  F.square = { // squareup.com/us/en/pricing; monthly fee is per location
    free:    {name:"Square Free",    sub:0,   ip:[0.026,0.15], on:[0.033,0.30], kd:[0.035,0.15], achCap:null},
    plus:    {name:"Square Plus",    sub:49,  ip:[0.025,0.15], on:[0.029,0.30], kd:[0.035,0.15], achCap:10},
    premium: {name:"Square Premium", sub:149, ip:[0.024,0.15], on:[0.029,0.30], kd:[0.035,0.15], achCap:10}
  };
  F.squareAch = {pct:0.01, min:1};      // ACH on Square invoices: 1%, $1 minimum (cap per plan above)
  F.squareIntl = 0.015;                  // international cards
  F.squareInstant = 0.0195;              // instant transfer

  F.stripe = { // stripe.com/pricing; no monthly fee
    name:"Stripe", sub:0, on:[0.029,0.30], ip:[0.027,0.05], keyedExtra:0.005, intl:0.015, fx:0.01,
    achPct:0.008, achCap:5, instantPct:0.015, instantMin:0.50,
    invoicing:{none:0, starter:0.004, plus:0.005}, dispute:15, disputeCountered:15
  };

  F.clover = { // clover.com/pricing (Clover.com-direct prices; banks and resellers differ)
    starter:    {name:"Clover Starter",         sub:0,     ip:[0.026,0.10], kd:[0.035,0.10]},
    essentials: {name:"Clover Essentials",      sub:29.95, ip:[0.025,0.10], kd:[0.035,0.10]},
    growth:     {name:"Clover Growth", sub:84.95, ip:[0.023,0.10], kd:[0.035,0.10]}
  };
  F.cloverRapid = 0.0175;                // Rapid Deposit (instant funding)

  F.paypal = { // paypal.com/us/business/paypal-business-fees ("Last Updated: November 4, 2026"); research/payments-fees-toast-paypal-2026-11-25.md
    checkout: {name:"PayPal Checkout / Venmo", r:[0.0349,0.49]},
    card:     {name:"Card via PayPal (standard)", r:[0.0299,0.49]},
    gs:       {name:"Goods & services (PayPal account to account)", r:[0.0299,0]},
    paylater: {name:"PayPal Pay Later", r:[0.0499,0.49]},
    advanced: {name:"Advanced card processing", r:[0.0289,0.29]},
    qr:       {name:"QR code, in person", r:[0.0229,0.09]},
    vt:       {name:"Virtual Terminal (keyed)", r:[0.0339,0.29]},
    intl: 0.015, dispute: 15, invoiceAch:{pct:0.01, cap:10}
  };

  /* Toast publishes NO processing rates (pos.toasttab.com/pricing, read 2026-11-25): only "higher rate" for the
     $0-hardware Starter Kit and software from $69/mo for Point of Sale. The figures below are third-party REPORTS
     (NerdWallet, updated Aug 6 2026), used only as editable example defaults on /square-vs-toast/. */
  F.toastReported = { payg:[0.0309,0.15], upfront:[0.0249,0.15], cnp:[0.035,0.15] };

  /* A "mix" is one month of sales: ip/ipt in person (total, average sale), on/ont online,
     kd/kdt keyed-in or card on file, ach/acht bank payments on invoices. Extras used by the Stripe page:
     intl (share of card sales on non-US cards), inv ("none"|"starter"|"plus", share invoiced = invShare),
     disp (disputes a month). */
  function n(total, avg){ return avg > 0 ? total / avg : 0; }
  function card(r, total, avg){ return total * r[0] + n(total, avg) * r[1]; }

  F.cost = function(key, m){
    var lines = [], sub = 0, k = key.split(":"), p;
    function add(label, amt){ if (amt > 0.004) lines.push([label, amt]); }
    if (k[0] === "square") {
      p = F.square[k[1]]; sub = p.sub;
      add("In person", card(p.ip, m.ip, m.ipt));
      add("Online", card(p.on, m.on, m.ont));
      add("Keyed / card on file", card(p.kd, m.kd, m.kdt));
      if (m.ach > 0) {
        var per = Math.max(F.squareAch.min, m.acht * F.squareAch.pct);
        if (p.achCap) per = Math.min(per, p.achCap);
        add("Bank payments (ACH)", n(m.ach, m.acht) * per);
      }
      if (m.intl) add("International cards", (m.ip + m.on + m.kd) * m.intl * F.squareIntl);
    } else if (k[0] === "stripe") {
      p = F.stripe;
      add("In person (Terminal)", card(p.ip, m.ip, m.ipt));
      add("Online", card(p.on, m.on, m.ont));
      add("Keyed / card on file", card([p.on[0] + p.keyedExtra, p.on[1]], m.kd, m.kdt));
      if (m.ach > 0) add("Bank payments (ACH)", n(m.ach, m.acht) * Math.min(p.achCap, m.acht * p.achPct));
      if (m.intl) add("International cards", (m.on + m.kd) * m.intl * p.intl);
      if (m.inv && m.inv !== "none") add("Stripe Invoicing", (m.on * (m.invShare || 0) + m.ach) * p.invoicing[m.inv]);
      if (m.disp) add("Disputes ($15 each)", m.disp * p.dispute);
    } else if (k[0] === "clover") {
      p = F.clover[k[1]]; sub = p.sub;
      add("In person", card(p.ip, m.ip, m.ipt));
      add("Online, keyed, phone (typed-in rate)", card(p.kd, m.on + m.kd, (m.on + m.kd) > 0 ? (m.on + m.kd) / (n(m.on, m.ont) + n(m.kd, m.kdt)) : 1));
    }
    if (sub) lines.push(["Monthly plan fee", sub]);
    var total = lines.reduce(function(a, l){ return a + l[1]; }, 0);
    return {name: p.name, total: total, lines: lines, sub: sub};
  };

  F.usd = new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:0});
  F.usd2 = new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",minimumFractionDigits:2,maximumFractionDigits:2});
  F.pct = function(r){ return (r[0]*100).toFixed(1).replace(/\.0$/,"") + "% + " + Math.round(r[1]*100) + "¢"; };

  /* Wire up a comparison calculator. opts.rows: list of cost keys. Inputs are read by id if present.
     opts.after(mix, results) may return extra note HTML strings. */
  F.mount = function(opts){
    var ids = ["ip","ipt","on","ont","kd","kdt","ach","acht","intl","inv","invShare","disp"];
    var el = {}; ids.forEach(function(i){ el[i] = document.getElementById(i); });
    function v(i, d){ if (!el[i]) return d; var x = parseFloat(el[i].value); return isFinite(x) && x >= 0 ? x : d; }
    function read(){
      return {ip:v("ip",0), ipt:Math.max(1,v("ipt",25)), on:v("on",0), ont:Math.max(1,v("ont",60)),
              kd:v("kd",0), kdt:Math.max(1,v("kdt",100)), ach:v("ach",0), acht:Math.max(1,v("acht",1000)),
              intl:v("intl",0)/100, inv: el.inv ? el.inv.value : "none", invShare:v("invShare",0)/100, disp:v("disp",0)};
    }
    function render(){
      var m = read(), total = m.ip + m.on + m.kd + m.ach, res = {};
      opts.rows.forEach(function(k){ res[k] = F.cost(k, m); });
      var best = opts.rows.reduce(function(a, b){ return res[a].total <= res[b].total ? a : b; });
      var html = "";
      opts.rows.forEach(function(k){
        var r = res[k], eff = total > 0 ? (r.total / total * 100).toFixed(2) + "%" : "—";
        html += '<tr class="' + (k === best && opts.rows.length > 1 ? "best" : "") + '"><td>' + r.name + '</td><td>' +
          F.usd2.format(r.total) + '</td><td>' + F.usd.format(r.total * 12) + '</td><td>' + eff + '</td></tr>';
      });
      document.getElementById("rows").innerHTML = html;
      var h = document.getElementById("headline"), s = document.getElementById("subline");
      var sorted = opts.rows.slice().sort(function(a, b){ return res[a].total - res[b].total; });
      if (total <= 0) { h.innerHTML = "Enter a month of sales to see your numbers."; s.textContent = ""; }
      else if (opts.rows.length > 1) {
        var gap = res[sorted[1]].total - res[sorted[0]].total;
        h.innerHTML = '<span class="num">' + res[best].name + '</span> is lowest at these numbers: <span class="num">' +
          F.usd2.format(res[best].total) + '</span> a month' + (gap >= 1 ? ', ' + F.usd.format(gap * 12) + ' a year less than ' + res[sorted[1]].name : '') + '.';
        s.textContent = "Processing and plan fees only. Hardware, features and contracts are covered below the calculator.";
      } else {
        h.innerHTML = 'About <span class="num">' + F.usd2.format(res[best].total) + '</span> a month in fees, <span class="num">' +
          (res[best].total / total * 100).toFixed(2) + '%</span> of what you take.';
        s.textContent = F.usd.format(res[best].total * 12) + " a year.";
      }
      var notes = [];
      if (opts.breakdown) {
        notes = res[opts.breakdown].lines.map(function(l){ return "<strong>" + l[0] + ":</strong> " + F.usd2.format(l[1]) + " a month"; });
      }
      if (opts.after) notes = notes.concat(opts.after(m, res, best) || []);
      document.getElementById("notes").innerHTML = notes.map(function(x){ return "<li>" + x + "</li>"; }).join("");
      var mail = document.getElementById("mail");
      if (mail) {
        var body = "Hi Dan,\n\nI'd like a free fee check. My rough monthly numbers:\n\n" +
          "In person: " + F.usd.format(m.ip) + " (avg " + F.usd.format(m.ipt) + ")\n" +
          "Online: " + F.usd.format(m.on) + " (avg " + F.usd.format(m.ont) + ")\n" +
          "Keyed / card on file: " + F.usd.format(m.kd) + "\n" +
          (m.ach ? "Bank payments: " + F.usd.format(m.ach) + "\n" : "") +
          "\nWhat I use today, and anything unusual about how I take payments: \n";
        mail.href = "mailto:dan@desklessconsulting.com?subject=" + encodeURIComponent(opts.subject || "Fee check") + "&body=" + encodeURIComponent(body);
      }
    }
    var qs = new URLSearchParams(location.search);
    ids.forEach(function(i){ if (el[i] && qs.has(i)) el[i].value = qs.get(i); });
    var used = false;
    ids.forEach(function(i){ if (!el[i]) return;
      el[i].addEventListener("input", function(){ render();
        if (!used) { used = true; try { if (window.umami) window.umami.track("Calculator used", {page: location.pathname}); } catch(e){} } });
      el[i].addEventListener("change", render); });
    render();
  };
})();
