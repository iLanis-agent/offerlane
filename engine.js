// OfferLane engine - job application pipeline (no DOM)
(function (root) {
  'use strict';

  var STAGES = ['applied', 'screen', 'interview', 'offer', 'accepted', 'rejected'];
  var LABELS = { applied: 'Applied', screen: 'Screen', interview: 'Interview', offer: 'Offer', accepted: 'Accepted', rejected: 'Rejected' };
  var TERMINAL = { accepted: true, rejected: true };
  // Days of silence in a stage before a follow-up nudge.
  var NUDGE_DAYS = { applied: 7, screen: 5, interview: 3, offer: 7 };

  function stageIndex(s) { return STAGES.indexOf(s); }
  function isTerminal(stage) { return !!TERMINAL[stage]; }

  // Valid move: forward along the funnel, or reject from any non-terminal stage.
  function canAdvance(from, to) {
    if (isTerminal(from)) return false;
    if (to === 'rejected') return true;
    return stageIndex(to) === stageIndex(from) + 1;
  }

  function dayOnly(d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
  function isoLocal(d) {
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  // app: {id, company, role, stage, lastEventAt ISO, history:[{stage, at}]}
  function addEvent(app, stage, at) {
    if (!canAdvance(app.stage, stage)) return null;
    var next = {
      id: app.id, company: app.company, role: app.role,
      stage: stage, lastEventAt: at,
      history: (app.history || []).concat([{ stage: stage, at: at }])
    };
    return next;
  }

  function newApp(id, company, role, at) {
    return { id: id, company: company, role: role, stage: 'applied',
             lastEventAt: at, history: [{ stage: 'applied', at: at }] };
  }

  function daysInStage(app, today) {
    return Math.max(0, Math.round((dayOnly(new Date(today)) - dayOnly(new Date(app.lastEventAt))) / 86400000));
  }

  // Follow-up status for one app. Terminal stages never need follow-up.
  function followUp(app, today) {
    if (isTerminal(app.stage)) return { needed: false, reason: 'closed' };
    var nudge = NUDGE_DAYS[app.stage];
    var age = daysInStage(app, today);
    var daysLeft = nudge - age;
    return {
      needed: daysLeft <= 0,
      daysLeft: daysLeft,
      nudgeDays: nudge,
      ageDays: age,
      dueISO: isoLocal(new Date(dayOnly(new Date(app.lastEventAt)).getTime() + nudge * 86400000)),
      reason: daysLeft <= 0 ? 'overdue' : daysLeft <= 1 ? 'due now' : 'waiting'
    };
  }

  // Funnel stats across all apps.
  function funnel(apps) {
    var counts = {}; STAGES.forEach(function (s) { counts[s] = 0; });
    var everReached = {}; STAGES.forEach(function (s) { everReached[s] = 0; });
    apps.forEach(function (a) {
      counts[a.stage]++;
      (a.history || []).forEach(function (h) { everReached[h.stage]++; });
    });
    function pct(num, den) { return den > 0 ? Math.round(num / den * 100) : 0; }
    var appliedTotal = everReached.applied;
    return {
      counts: counts,
      active: counts.applied + counts.screen + counts.interview + counts.offer,
      screenRate: pct(everReached.screen, appliedTotal),
      interviewRate: pct(everReached.interview, everReached.screen),
      offerRate: pct(everReached.offer, everReached.interview),
      acceptRate: pct(counts.accepted, everReached.offer),
      total: apps.length
    };
  }

  // Apps whose follow-up is due, most overdue first.
  function stale(apps, today) {
    return apps.map(function (a) { return { app: a, fu: followUp(a, today) }; })
      .filter(function (x) { return x.fu.needed; })
      .sort(function (a, b) { return a.fu.daysLeft - b.fu.daysLeft; });
  }

  var api = { STAGES: STAGES, LABELS: LABELS, NUDGE_DAYS: NUDGE_DAYS, stageIndex: stageIndex,
    isTerminal: isTerminal, canAdvance: canAdvance, addEvent: addEvent, newApp: newApp,
    daysInStage: daysInStage, followUp: followUp, funnel: funnel, stale: stale,
    isoLocal: isoLocal };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.LaneEngine = api;
})(typeof self !== 'undefined' ? self : this);
