(function () {
  let e = document.createElement(`link`).relList;
  if (e && e.supports && e.supports(`modulepreload`)) return;
  for (let e of document.querySelectorAll(`link[rel="modulepreload"]`)) n(e);
  new MutationObserver((e) => {
    for (let t of e)
      if (t.type === `childList`)
        for (let e of t.addedNodes) e.tagName === `LINK` && e.rel === `modulepreload` && n(e);
  }).observe(document, { childList: !0, subtree: !0 });
  function t(e) {
    let t = {};
    return (
      e.integrity && (t.integrity = e.integrity),
      e.referrerPolicy && (t.referrerPolicy = e.referrerPolicy),
      e.crossOrigin === `use-credentials`
        ? (t.credentials = `include`)
        : e.crossOrigin === `anonymous`
          ? (t.credentials = `omit`)
          : (t.credentials = `same-origin`),
      t
    );
  }
  function n(e) {
    if (e.ep) return;
    e.ep = !0;
    let n = t(e);
    fetch(e.href, n);
  }
})();
var e = Array.isArray,
  t = Array.prototype.indexOf,
  n = Array.prototype.includes,
  r = Array.from,
  i = Object.defineProperty,
  a = Object.getOwnPropertyDescriptor,
  o = Object.getOwnPropertyDescriptors,
  s = Object.prototype,
  c = Array.prototype,
  l = Object.getPrototypeOf,
  u = Object.isExtensible,
  d = () => {};
function f(e) {
  for (var t = 0; t < e.length; t++) e[t]();
}
function p() {
  var e, t;
  return {
    promise: new Promise((n, r) => {
      ((e = n), (t = r));
    }),
    resolve: e,
    reject: t,
  };
}
var m = 1024,
  h = 2048,
  g = 4096,
  _ = 8192,
  v = 16384,
  y = 32768,
  b = 1 << 25,
  x = 65536,
  S = 1 << 19,
  C = 1 << 20,
  w = 1 << 25,
  T = 65536,
  E = 1 << 21,
  ee = 1 << 22,
  te = 1 << 23,
  D = Symbol(`$state`),
  O = Symbol(`legacy props`),
  ne = Symbol(``),
  re = Symbol(`attributes`),
  ie = Symbol(`class`),
  ae = Symbol(`style`),
  oe = Symbol(`text`),
  se = Symbol(`form reset`),
  ce = new (class extends Error {
    name = `StaleReactionError`;
    message = 'The reaction that called `getAbortSignal()` was re-run or destroyed';
  })(),
  le = !!globalThis.document?.contentType && globalThis.document.contentType.includes(`xml`);
function ue(e) {
  throw Error(`https://svelte.dev/e/lifecycle_outside_component`);
}
function de() {
  throw Error(`https://svelte.dev/e/async_derived_orphan`);
}
function fe(e, t, n) {
  throw Error(`https://svelte.dev/e/each_key_duplicate`);
}
function pe(e) {
  throw Error(`https://svelte.dev/e/effect_in_teardown`);
}
function me() {
  throw Error(`https://svelte.dev/e/effect_in_unowned_derived`);
}
function he(e) {
  throw Error(`https://svelte.dev/e/effect_orphan`);
}
function ge() {
  throw Error(`https://svelte.dev/e/effect_update_depth_exceeded`);
}
function _e(e) {
  throw Error(`https://svelte.dev/e/props_invalid_value`);
}
function ve() {
  throw Error(`https://svelte.dev/e/state_descriptors_fixed`);
}
function ye() {
  throw Error(`https://svelte.dev/e/state_prototype_fixed`);
}
function be() {
  throw Error(`https://svelte.dev/e/state_unsafe_mutation`);
}
function xe() {
  throw Error(`https://svelte.dev/e/svelte_boundary_reset_onerror`);
}
var Se = {},
  k = Symbol(`uninitialized`),
  Ce = `http://www.w3.org/1999/xhtml`;
function we() {
  console.warn(`https://svelte.dev/e/derived_inert`);
}
function Te(e) {
  console.warn(`https://svelte.dev/e/hydration_mismatch`);
}
function Ee() {
  console.warn(`https://svelte.dev/e/svelte_boundary_reset_noop`);
}
var A = !1;
function De(e) {
  A = e;
}
var j;
function Oe(e) {
  if (e === null) throw (Te(), Se);
  return (j = e);
}
function ke() {
  return Oe(nn(j));
}
function M(e) {
  if (A) {
    if (nn(j) !== null) throw (Te(), Se);
    j = e;
  }
}
function Ae(e = 1) {
  if (A) {
    for (var t = e, n = j; t--;) n = nn(n);
    j = n;
  }
}
function je(e = !0) {
  for (var t = 0, n = j; ;) {
    if (n.nodeType === 8) {
      var r = n.data;
      if (r === `]`) {
        if (t === 0) return n;
        --t;
      } else (r === `[` || r === `[!` || (r[0] === `[` && !isNaN(Number(r.slice(1))))) && (t += 1);
    }
    var i = nn(n);
    (e && n.remove(), (n = i));
  }
}
function Me(e) {
  if (!e || e.nodeType !== 8) throw (Te(), Se);
  return e.data;
}
function Ne(e) {
  return e === this.v;
}
function Pe(e, t) {
  return e == e ? e !== t || (typeof e == `object` && !!e) || typeof e == `function` : t == t;
}
function Fe(e) {
  return !Pe(e, this.v);
}
var Ie = !1,
  Le = !1,
  N = null;
function Re(e) {
  N = e;
}
function ze(e, t = !1, n) {
  N = {
    p: N,
    i: !1,
    c: null,
    e: null,
    s: e,
    x: null,
    r: W,
    l: Le && !t ? { s: null, u: null, $: [] } : null,
  };
}
function Be(e) {
  var t = N,
    n = t.e;
  if (n !== null) {
    t.e = null;
    for (var r of n) yn(r);
  }
  return (e !== void 0 && (t.x = e), (t.i = !0), (N = t.p), e ?? {});
}
function Ve() {
  return !Le || (N !== null && N.l === null);
}
var He = [];
function Ue() {
  var e = He;
  ((He = []), f(e));
}
function We(e) {
  if (He.length === 0 && !at) {
    var t = He;
    queueMicrotask(() => {
      t === He && Ue();
    });
  }
  He.push(e);
}
function Ge() {
  for (; He.length > 0;) Ue();
}
function Ke(e) {
  var t = W;
  if (t === null) return ((U.f |= te), e);
  if (!(t.f & 32768) && !(t.f & 4)) throw e;
  qe(e, t);
}
function qe(e, t) {
  for (; t !== null;) {
    if (t.f & 128) {
      if (!(t.f & 32768)) throw e;
      try {
        t.b.error(e);
        return;
      } catch (t) {
        e = t;
      }
    }
    t = t.parent;
  }
  throw e;
}
var Je = ~(h | g | m);
function P(e, t) {
  e.f = (e.f & Je) | t;
}
function Ye(e) {
  e.f & 512 || e.deps === null ? P(e, m) : P(e, g);
}
function Xe(e) {
  if (e !== null) for (let t of e) !(t.f & 2) || !(t.f & 65536) || ((t.f ^= T), Xe(t.deps));
}
function Ze(e, t, n) {
  (e.f & 2048 ? t.add(e) : e.f & 4096 && n.add(e), Xe(e.deps), P(e, m));
}
var Qe = !1,
  $e = !1;
function et(e) {
  var t = $e;
  try {
    return (($e = !1), [e(), $e]);
  } finally {
    $e = t;
  }
}
var tt = null,
  nt = null,
  F = null,
  rt = null,
  I = null,
  it = null,
  at = !1,
  ot = !1,
  st = null,
  ct = null,
  lt = 0,
  ut = 1,
  dt = class e {
    id = ut++;
    #e = !1;
    linked = !0;
    #t = null;
    #n = null;
    async_deriveds = new Map();
    current = new Map();
    previous = new Map();
    unblocked = new Set();
    #r = new Set();
    #i = new Set();
    #a = new Set();
    #o = 0;
    #s = new Map();
    #c = null;
    #l = [];
    #u = [];
    #d = new Set();
    #f = new Set();
    #p = new Map();
    #m = new Set();
    is_fork = !1;
    #h = !1;
    #g() {
      if (this.is_fork) return !0;
      for (let n of this.#s.keys()) {
        for (var e = n, t = !1; e.parent !== null;) {
          if (this.#p.has(e)) {
            t = !0;
            break;
          }
          e = e.parent;
        }
        if (!t) return !0;
      }
      return !1;
    }
    skip_effect(e) {
      (this.#p.has(e) || this.#p.set(e, { d: [], m: [] }), this.#m.delete(e));
    }
    unskip_effect(e, t = (e) => this.schedule(e)) {
      var n = this.#p.get(e);
      if (n) {
        this.#p.delete(e);
        for (var r of n.d) (P(r, h), t(r));
        for (r of n.m) (P(r, g), t(r));
      }
      this.#m.add(e);
    }
    #_() {
      if (((this.#e = !0), lt++ > 1e3 && (this.#w(), pt()), !this.#g())) {
        for (let e of this.#d) (this.#f.delete(e), P(e, h), this.schedule(e));
        for (let e of this.#f) (P(e, g), this.schedule(e));
      }
      let t = this.#l;
      ((this.#l = []), this.apply());
      var n = (st = []),
        r = [],
        i = (ct = []);
      for (let e of t)
        try {
          this.#v(e, n, r);
        } catch (t) {
          throw (bt(e), t);
        }
      if (((F = null), i.length > 0)) {
        var a = e.ensure();
        for (let e of i) a.schedule(e);
      }
      if (((st = null), (ct = null), this.#g())) {
        (this.#x(r), this.#x(n));
        for (let [e, t] of this.#p) yt(e, t);
        i.length > 0 && F.#_();
        return;
      }
      let o = this.#y();
      if (o) {
        o.#b(this);
        return;
      }
      (this.#d.clear(), this.#f.clear());
      for (let e of this.#r) e(this);
      (this.#r.clear(), (rt = this), ht(r), ht(n), (rt = null), this.#c?.resolve());
      var s = F;
      if (
        (this.linked && this.#o === 0 && this.#w(),
        Ie && !this.linked && (this.#S(), (F = s)),
        this.#l.length > 0)
      ) {
        s === null && ((s = this), this.#C());
        let e = s;
        e.#l.push(...this.#l.filter((t) => !e.#l.includes(t)));
      }
      s !== null && s.#_();
    }
    #v(e, t, n) {
      e.f ^= m;
      for (var r = e.first; r !== null;) {
        var i = r.f,
          a = (i & 96) != 0;
        if (!((a && i & 1024) || i & 8192 || this.#p.has(r)) && r.fn !== null) {
          a
            ? (r.f ^= m)
            : i & 4
              ? t.push(r)
              : Ie && i & 16777224
                ? n.push(r)
                : $n(r) && (i & 16 && this.#f.add(r), ir(r));
          var o = r.first;
          if (o !== null) {
            r = o;
            continue;
          }
        }
        for (; r !== null;) {
          var s = r.next;
          if (s !== null) {
            r = s;
            break;
          }
          r = r.parent;
        }
      }
    }
    #y() {
      for (var e = this.#t; e !== null;) {
        if (!e.is_fork) {
          for (let [t, [, n]] of this.current) if (e.current.has(t) && !n) return e;
        }
        e = e.#t;
      }
      return null;
    }
    #b(e) {
      for (let [t, n] of e.current)
        (!this.previous.has(t) && e.previous.has(t) && this.previous.set(t, e.previous.get(t)),
          this.current.set(t, n));
      for (let [t, n] of e.async_deriveds) {
        let e = this.async_deriveds.get(t);
        e && n.promise.then(e.resolve);
      }
      let t = (e) => {
        var n = e.reactions;
        if (n !== null)
          for (let e of n) {
            var r = e.f;
            if (r & 2) t(e);
            else {
              var i = e;
              r & 4194320 &&
                !this.async_deriveds.has(i) &&
                (this.#f.delete(i), P(i, h), this.schedule(i));
            }
          }
      };
      for (let e of this.current.keys()) t(e);
      (this.oncommit(() => e.discard()), e.#w(), (F = this), this.#_());
    }
    #x(e) {
      for (var t = 0; t < e.length; t += 1) Ze(e[t], this.#d, this.#f);
    }
    capture(e, t, n = !1) {
      (e.v !== k && !this.previous.has(e) && this.previous.set(e, e.v),
        e.f & 8388608 || (this.current.set(e, [t, n]), I?.set(e, t)),
        this.is_fork || (e.v = t));
    }
    activate() {
      F = this;
    }
    deactivate() {
      ((F = null), (I = null));
    }
    flush() {
      try {
        ((ot = !0), (F = this), this.#_());
      } finally {
        ((lt = 0),
          (it = null),
          (st = null),
          (ct = null),
          (ot = !1),
          (F = null),
          (I = null),
          Bt.clear());
      }
    }
    discard() {
      for (let e of this.#i) e(this);
      (this.#i.clear(), this.#a.clear(), this.#w());
    }
    register_created_effect(e) {
      this.#u.push(e);
    }
    #S() {
      this.#w();
      for (let l = tt; l !== null; l = l.#n) {
        var e = l.id < this.id,
          t = [];
        for (let [r, [i, a]] of this.current) {
          if (l.current.has(r)) {
            var n = l.current.get(r)[0];
            if (e && i !== n) l.current.set(r, [i, a]);
            else continue;
          }
          t.push(r);
        }
        if (e)
          for (let [e, t] of this.async_deriveds) {
            let n = l.async_deriveds.get(e);
            n && t.promise.then(n.resolve);
          }
        if (l.#e) {
          var r = [...l.current.keys()].filter((e) => !this.current.has(e));
          if (r.length === 0) e && l.discard();
          else if (t.length > 0) {
            if (e)
              for (let e of this.#m)
                l.unskip_effect(e, (e) => {
                  e.f & 4194320 ? l.schedule(e) : l.#x([e]);
                });
            l.activate();
            var i = new Set(),
              a = new Map();
            for (var o of t) gt(o, r, i, a);
            a = new Map();
            var s = [...l.current.keys()].filter((e) =>
              this.current.has(e) ? this.current.get(e)[0] !== e.v : !0,
            );
            if (s.length > 0)
              for (let e of this.#u)
                !(e.f & 155648) &&
                  _t(e, s, a) &&
                  (e.f & 4194320 ? (P(e, h), l.schedule(e)) : l.#d.add(e));
            if (l.#l.length > 0 && !l.#h) {
              l.apply();
              for (var c of l.#l) l.#v(c, [], []);
              l.#l = [];
            }
            l.deactivate();
          }
        }
      }
    }
    increment(e, t) {
      if (((this.#o += 1), e)) {
        let e = this.#s.get(t) ?? 0;
        this.#s.set(t, e + 1);
      }
    }
    decrement(e, t) {
      if ((--this.#o, e)) {
        let e = this.#s.get(t) ?? 0;
        e === 1 ? this.#s.delete(t) : this.#s.set(t, e - 1);
      }
      this.#h ||
        ((this.#h = !0),
        We(() => {
          ((this.#h = !1), this.linked && this.flush());
        }));
    }
    transfer_effects(e, t) {
      for (let t of e) this.#d.add(t);
      for (let e of t) this.#f.add(e);
      (e.clear(), t.clear());
    }
    oncommit(e) {
      this.#r.add(e);
    }
    ondiscard(e) {
      this.#i.add(e);
    }
    on_fork_commit(e) {
      this.#a.add(e);
    }
    run_fork_commit_callbacks() {
      for (let e of this.#a) e(this);
      this.#a.clear();
    }
    settled() {
      return (this.#c ??= p()).promise;
    }
    static ensure() {
      if (F === null) {
        let t = (F = new e());
        (t.#C(),
          !ot &&
            !at &&
            We(() => {
              t.#e || t.flush();
            }));
      }
      return F;
    }
    apply() {
      if (!Ie || (!this.is_fork && this.#t === null && this.#n === null)) {
        I = null;
        return;
      }
      I = new Map();
      for (let [e, [t]] of this.current) I.set(e, t);
      for (let t = tt; t !== null; t = t.#n)
        if (!(t === this || t.is_fork)) {
          var e = !1;
          if (t.id < this.id) {
            for (let [n, [, r]] of t.current)
              if (!r && this.current.has(n)) {
                e = !0;
                break;
              }
          }
          if (!e) for (let [e, n] of t.previous) I.has(e) || I.set(e, n);
        }
    }
    schedule(e) {
      if (((it = e), e.b?.is_pending && e.f & 16777228 && !(e.f & 32768))) {
        e.b.defer_effect(e);
        return;
      }
      for (var t = e; t.parent !== null;) {
        t = t.parent;
        var n = t.f;
        if (st !== null && t === W && (Ie || ((U === null || !(U.f & 2)) && !Qe))) return;
        if (n & 96) {
          if (!(n & 1024)) return;
          t.f ^= m;
        }
      }
      this.#l.push(t);
    }
    #C() {
      (nt === null ? (tt = nt = this) : ((nt.#n = this), (this.#t = nt)), (nt = this));
    }
    #w() {
      var e = this.#t,
        t = this.#n;
      (e === null ? (tt = t) : (e.#n = t), t === null ? (nt = e) : (t.#t = e), (this.linked = !1));
    }
  };
function ft(e) {
  var t = at;
  at = !0;
  try {
    var n;
    for (e && (F !== null && !F.is_fork && F.flush(), (n = e())); ;) {
      if ((Ge(), F === null)) return n;
      F.flush();
    }
  } finally {
    at = t;
  }
}
function pt() {
  try {
    ge();
  } catch (e) {
    qe(e, it);
  }
}
var mt = null;
function ht(e) {
  var t = e.length;
  if (t !== 0) {
    for (var n = 0; n < t;) {
      var r = e[n++];
      if (
        !(r.f & 24576) &&
        $n(r) &&
        ((mt = new Set()),
        ir(r),
        r.deps === null &&
          r.first === null &&
          r.nodes === null &&
          r.teardown === null &&
          r.ac === null &&
          An(r),
        mt?.size > 0)
      ) {
        Bt.clear();
        for (let e of mt) {
          if (e.f & 24576) continue;
          let t = [e],
            n = e.parent;
          for (; n !== null;) (mt.has(n) && (mt.delete(n), t.push(n)), (n = n.parent));
          for (let e = t.length - 1; e >= 0; e--) {
            let n = t[e];
            n.f & 24576 || ir(n);
          }
        }
        mt.clear();
      }
    }
    mt = null;
  }
}
function gt(e, t, n, r) {
  if (!n.has(e) && (n.add(e), e.reactions !== null))
    for (let i of e.reactions) {
      let e = i.f;
      e & 2 ? gt(i, t, n, r) : e & 4194320 && !(e & 2048) && _t(i, t, r) && (P(i, h), vt(i));
    }
}
function _t(e, t, r) {
  let i = r.get(e);
  if (i !== void 0) return i;
  if (e.deps !== null)
    for (let i of e.deps) {
      if (n.call(t, i)) return !0;
      if (i.f & 2 && _t(i, t, r)) return (r.set(i, !0), !0);
    }
  return (r.set(e, !1), !1);
}
function vt(e) {
  F.schedule(e);
}
function yt(e, t) {
  if (!(e.f & 32 && e.f & 1024)) {
    (e.f & 2048 ? t.d.push(e) : e.f & 4096 && t.m.push(e), P(e, m));
    for (var n = e.first; n !== null;) (yt(n, t), (n = n.next));
  }
}
function bt(e) {
  P(e, m);
  for (var t = e.first; t !== null;) (bt(t), (t = t.next));
}
function xt(e) {
  let t = 0,
    n = Ht(0),
    r;
  return () => {
    gn() &&
      (K(n),
      Cn(
        () => (
          t === 0 && (r = cr(() => e(() => Kt(n)))),
          (t += 1),
          () => {
            We(() => {
              (--t, t === 0 && (r?.(), (r = void 0), Kt(n)));
            });
          }
        ),
      ));
  };
}
var St = x | S;
function Ct(e, t, n, r) {
  new wt(e, t, n, r);
}
var wt = class {
  parent;
  is_pending = !1;
  transform_error;
  #e;
  #t = A ? j : null;
  #n;
  #r;
  #i;
  #a = null;
  #o = null;
  #s = null;
  #c = null;
  #l = 0;
  #u = 0;
  #d = !1;
  #f = new Set();
  #p = new Set();
  #m = null;
  #h = xt(
    () => (
      (this.#m = Ht(this.#l)),
      () => {
        this.#m = null;
      }
    ),
  );
  constructor(e, t, n, r) {
    ((this.#e = e),
      (this.#n = t),
      (this.#r = (e) => {
        var t = W;
        ((t.b = this), (t.f |= 128), n(e));
      }),
      (this.parent = W.b),
      (this.transform_error = r ?? this.parent?.transform_error ?? ((e) => e)),
      (this.#i = wn(() => {
        if (A) {
          let e = this.#t;
          ke();
          let t = e.data === `[!`;
          if (e.data.startsWith(`[?`)) {
            let t = JSON.parse(e.data.slice(2));
            this.#_(t);
          } else t ? this.#v() : this.#g();
        } else this.#y();
      }, St)),
      A && (this.#e = j));
  }
  #g() {
    try {
      this.#a = Tn(() => this.#r(this.#e));
    } catch (e) {
      this.error(e);
    }
  }
  #_(e) {
    let t = this.#n.failed;
    t &&
      (this.#s = Tn(() => {
        t(
          this.#e,
          () => e,
          () => () => {},
        );
      }));
  }
  #v() {
    let e = this.#n.pending;
    e &&
      ((this.is_pending = !0),
      (this.#o = Tn(() => e(this.#e))),
      We(() => {
        var e = (this.#c = document.createDocumentFragment()),
          t = en();
        (e.append(t),
          (this.#a = this.#x(() => Tn(() => this.#r(t)))),
          this.#u === 0 &&
            (this.#e.before(e),
            (this.#c = null),
            jn(this.#o, () => {
              this.#o = null;
            }),
            this.#b(F)));
      }));
  }
  #y() {
    try {
      if (
        ((this.is_pending = this.has_pending_snippet()),
        (this.#u = 0),
        (this.#l = 0),
        (this.#a = Tn(() => {
          this.#r(this.#e);
        })),
        this.#u > 0)
      ) {
        var e = (this.#c = document.createDocumentFragment());
        Fn(this.#a, e);
        let t = this.#n.pending;
        this.#o = Tn(() => t(this.#e));
      } else this.#b(F);
    } catch (e) {
      this.error(e);
    }
  }
  #b(e) {
    ((this.is_pending = !1), e.transfer_effects(this.#f, this.#p));
  }
  defer_effect(e) {
    Ze(e, this.#f, this.#p);
  }
  is_rendered() {
    return !this.is_pending && (!this.parent || this.parent.is_rendered());
  }
  has_pending_snippet() {
    return !!this.#n.pending;
  }
  #x(e) {
    var t = W,
      n = U,
      r = N;
    (Hn(this.#i), Vn(this.#i), Re(this.#i.ctx));
    try {
      return (dt.ensure(), e());
    } catch (e) {
      return (Ke(e), null);
    } finally {
      (Hn(t), Vn(n), Re(r));
    }
  }
  #S(e, t) {
    if (!this.has_pending_snippet()) {
      this.parent && this.parent.#S(e, t);
      return;
    }
    ((this.#u += e),
      this.#u === 0 &&
        (this.#b(t),
        this.#o &&
          jn(this.#o, () => {
            this.#o = null;
          }),
        (this.#c &&= (this.#e.before(this.#c), null))));
  }
  update_pending_count(e, t) {
    (this.#S(e, t),
      (this.#l += e),
      !(!this.#m || this.#d) &&
        ((this.#d = !0),
        We(() => {
          ((this.#d = !1), this.#m && Wt(this.#m, this.#l));
        })));
  }
  get_effect_pending() {
    return (this.#h(), K(this.#m));
  }
  error(e) {
    if (!this.#n.onerror && !this.#n.failed) throw e;
    F?.is_fork
      ? (this.#a && F.skip_effect(this.#a),
        this.#o && F.skip_effect(this.#o),
        this.#s && F.skip_effect(this.#s),
        F.on_fork_commit(() => {
          this.#C(e);
        }))
      : this.#C(e);
  }
  #C(e) {
    ((this.#a &&= (H(this.#a), null)),
      (this.#o &&= (H(this.#o), null)),
      (this.#s &&= (H(this.#s), null)),
      A && (Oe(this.#t), Ae(), Oe(je())));
    var t = this.#n.onerror;
    let n = this.#n.failed;
    var r = !1,
      i = !1;
    let a = () => {
        if (r) {
          Ee();
          return;
        }
        ((r = !0),
          i && xe(),
          this.#s !== null &&
            jn(this.#s, () => {
              this.#s = null;
            }),
          this.#x(() => {
            this.#y();
          }));
      },
      o = (e) => {
        try {
          ((i = !0), t?.(e, a), (i = !1));
        } catch (e) {
          qe(e, this.#i && this.#i.parent);
        }
        n &&
          (this.#s = this.#x(() => {
            try {
              return Tn(() => {
                var t = W;
                ((t.b = this),
                  (t.f |= 128),
                  n(
                    this.#e,
                    () => e,
                    () => a,
                  ));
              });
            } catch (e) {
              return (qe(e, this.#i.parent), null);
            }
          }));
      };
    We(() => {
      var t;
      try {
        t = this.transform_error(e);
      } catch (e) {
        qe(e, this.#i && this.#i.parent);
        return;
      }
      typeof t == `object` && t && typeof t.then == `function`
        ? t.then(o, (e) => qe(e, this.#i && this.#i.parent))
        : o(t);
    });
  }
};
function Tt(e, t, n, r) {
  let i = Ve() ? kt : Nt;
  var a = e.filter((e) => !e.settled);
  if (n.length === 0 && a.length === 0) {
    r(t.map(i));
    return;
  }
  var o = W,
    s = Et(),
    c = a.length === 1 ? a[0].promise : a.length > 1 ? Promise.all(a.map((e) => e.promise)) : null;
  function l(e) {
    if (!(o.f & 16384)) {
      s();
      try {
        r(e);
      } catch (e) {
        qe(e, o);
      }
      Dt();
    }
  }
  var u = Ot();
  if (n.length === 0) {
    c.then(() => l(t.map(i))).finally(u);
    return;
  }
  function d() {
    Promise.all(n.map((e) => jt(e)))
      .then((e) => l([...t.map(i), ...e]))
      .catch((e) => qe(e, o))
      .finally(u);
  }
  c
    ? c.then(() => {
        (s(), d(), Dt());
      })
    : d();
}
function Et() {
  var e = W,
    t = U,
    n = N,
    r = F;
  return function (i = !0) {
    (Hn(e), Vn(t), Re(n), i && !(e.f & 16384) && (r?.activate(), r?.apply()));
  };
}
function Dt(e = !0) {
  (Hn(null), Vn(null), Re(null), e && F?.deactivate());
}
function Ot() {
  var e = W,
    t = e.b,
    n = F,
    r = t.is_rendered();
  return (
    t.update_pending_count(1, n),
    n.increment(r, e),
    () => {
      (t.update_pending_count(-1, n), n.decrement(r, e));
    }
  );
}
function kt(e) {
  var t = 2 | h;
  return (
    W !== null && (W.f |= S),
    {
      ctx: N,
      deps: null,
      effects: null,
      equals: Ne,
      f: t,
      fn: e,
      reactions: null,
      rv: 0,
      v: k,
      wv: 0,
      parent: W,
      ac: null,
    }
  );
}
var At = Symbol(`obsolete`);
function jt(e, t, n) {
  let r = W;
  r === null && de();
  var i = void 0,
    a = Ht(k),
    o = !U,
    s = new Set();
  return (
    Sn(() => {
      var t = W,
        n = p();
      i = n.promise;
      try {
        Promise.resolve(e())
          .then(n.resolve, (e) => {
            e !== ce && n.reject(e);
          })
          .finally(Dt);
      } catch (e) {
        (n.reject(e), Dt());
      }
      var c = F;
      if (o) {
        if (t.f & 32768) var l = Ot();
        if (r.b.is_rendered()) c.async_deriveds.get(t)?.reject(At);
        else for (let e of s.values()) e.reject(At);
        (s.add(n), c.async_deriveds.set(t, n));
      }
      let u = (e, t = void 0) => {
        (l?.(),
          s.delete(n),
          t !== At &&
            (c.activate(),
            t ? ((a.f |= te), Wt(a, t)) : (a.f & 8388608 && (a.f ^= te), Wt(a, e)),
            c.deactivate()));
      };
      n.promise.then(u, (e) => u(null, e || `unknown`));
    }),
    _n(() => {
      for (let e of s) e.reject(At);
    }),
    new Promise((e) => {
      function t(n) {
        function r() {
          n === i ? e(a) : t(i);
        }
        n.then(r, r);
      }
      t(i);
    })
  );
}
function Mt(e) {
  let t = kt(e);
  return (Ie || Wn(t), t);
}
function Nt(e) {
  let t = kt(e);
  return ((t.equals = Fe), t);
}
function Pt(e) {
  var t = e.effects;
  if (t !== null) {
    e.effects = null;
    for (var n = 0; n < t.length; n += 1) H(t[n]);
  }
}
function Ft(e) {
  var t,
    n = W,
    r = e.parent;
  if (!Rn && r !== null && e.v !== k && r.f & 24576) return (we(), e.v);
  Hn(r);
  try {
    ((e.f &= ~T), Pt(e), (t = tr(e)));
  } finally {
    Hn(n);
  }
  return t;
}
function It(e) {
  var t = Ft(e);
  if (
    !e.equals(t) &&
    ((e.wv = Qn()),
    (!F?.is_fork || e.deps === null) &&
      (F === null ? (e.v = t) : (F.capture(e, t, !0), rt?.capture(e, t, !0)), e.deps === null))
  ) {
    P(e, m);
    return;
  }
  Rn || (I === null ? Ye(e) : (gn() || F?.is_fork) && I.set(e, t));
}
function Lt(e) {
  if (e.effects !== null)
    for (let t of e.effects)
      (t.teardown || t.ac) &&
        (t.teardown?.(),
        t.ac?.abort(ce),
        t.fn !== null && (t.teardown = d),
        (t.ac = null),
        rr(t, 0),
        Dn(t));
}
function Rt(e) {
  if (e.effects !== null) for (let t of e.effects) t.teardown && t.fn !== null && ir(t);
}
var zt = new Set(),
  Bt = new Map(),
  Vt = !1;
function Ht(e, t) {
  return { f: 0, v: e, reactions: null, equals: Ne, rv: 0, wv: 0 };
}
function L(e, t) {
  let n = Ht(e, t);
  return (Wn(n), n);
}
function Ut(e, t = !1, n = !0) {
  let r = Ht(e);
  return (t || (r.equals = Fe), Le && n && N !== null && N.l !== null && (N.l.s ??= []).push(r), r);
}
function R(e, t, r = !1) {
  return (
    U !== null &&
      (!Bn || U.f & 131072) &&
      Ve() &&
      U.f & 4325394 &&
      (Un === null || !n.call(Un, e)) &&
      be(),
    Wt(e, r ? Jt(t) : t, ct)
  );
}
function Wt(e, t, n = null) {
  if (!e.equals(t)) {
    Bt.set(e, Rn ? t : e.v);
    var r = dt.ensure();
    if ((r.capture(e, t), e.f & 2)) {
      let t = e;
      (e.f & 2048 && Ft(t), I === null && Ye(t));
    }
    ((e.wv = Qn()),
      qt(e, h, n),
      Ve() && W !== null && W.f & 1024 && !(W.f & 96) && (Kn === null ? qn([e]) : Kn.push(e)),
      !r.is_fork && zt.size > 0 && !Vt && Gt());
  }
  return t;
}
function Gt() {
  Vt = !1;
  for (let e of zt) {
    e.f & 1024 && P(e, g);
    let t;
    try {
      t = $n(e);
    } catch {
      t = !0;
    }
    t && ir(e);
  }
  zt.clear();
}
function Kt(e) {
  R(e, e.v + 1);
}
function qt(e, t, n) {
  var r = e.reactions;
  if (r !== null)
    for (var i = Ve(), a = r.length, o = 0; o < a; o++) {
      var s = r[o],
        c = s.f;
      if (!(!i && s === W)) {
        var l = (c & h) === 0;
        if ((l && P(s, t), c & 131072)) zt.add(s);
        else if (c & 2) {
          var u = s;
          (I?.delete(u),
            c & 65536 || (c & 512 && (W === null || !(W.f & 2097152)) && (s.f |= T), qt(u, g, n)));
        } else if (l) {
          var d = s;
          (c & 16 && mt !== null && mt.add(d), n === null ? vt(d) : n.push(d));
        }
      }
    }
}
function Jt(t) {
  if (typeof t != `object` || !t || D in t) return t;
  let n = l(t);
  if (n !== s && n !== c) return t;
  var r = new Map(),
    i = e(t),
    o = L(0),
    u = null,
    d = Xn,
    f = (e) => {
      if (Xn === d) return e();
      var t = U,
        n = Xn;
      (Vn(null), Zn(d));
      var r = e();
      return (Vn(t), Zn(n), r);
    };
  return (
    i && r.set(`length`, L(t.length, u)),
    new Proxy(t, {
      defineProperty(e, t, n) {
        (!(`value` in n) || n.configurable === !1 || n.enumerable === !1 || n.writable === !1) &&
          ve();
        var i = r.get(t);
        return (
          i === void 0
            ? f(() => {
                var e = L(n.value, u);
                return (r.set(t, e), e);
              })
            : R(i, n.value, !0),
          !0
        );
      },
      deleteProperty(e, t) {
        var n = r.get(t);
        if (n === void 0) {
          if (t in e) {
            let e = f(() => L(k, u));
            (r.set(t, e), Kt(o));
          }
        } else (R(n, k), Kt(o));
        return !0;
      },
      get(e, n, i) {
        if (n === D) return t;
        var o = r.get(n),
          s = n in e;
        if (
          (o === void 0 &&
            (!s || a(e, n)?.writable) &&
            ((o = f(() => L(Jt(s ? e[n] : k), u))), r.set(n, o)),
          o !== void 0)
        ) {
          var c = K(o);
          return c === k ? void 0 : c;
        }
        return Reflect.get(e, n, i);
      },
      getOwnPropertyDescriptor(e, t) {
        var n = Reflect.getOwnPropertyDescriptor(e, t);
        if (n && `value` in n) {
          var i = r.get(t);
          i && (n.value = K(i));
        } else if (n === void 0) {
          var a = r.get(t),
            o = a?.v;
          if (a !== void 0 && o !== k)
            return { enumerable: !0, configurable: !0, value: o, writable: !0 };
        }
        return n;
      },
      has(e, t) {
        if (t === D) return !0;
        var n = r.get(t),
          i = (n !== void 0 && n.v !== k) || Reflect.has(e, t);
        return (n !== void 0 || (W !== null && (!i || a(e, t)?.writable))) &&
          (n === void 0 && ((n = f(() => L(i ? Jt(e[t]) : k, u))), r.set(t, n)), K(n) === k)
          ? !1
          : i;
      },
      set(e, t, n, s) {
        var c = r.get(t),
          l = t in e;
        if (i && t === `length`)
          for (var d = n; d < c.v; d += 1) {
            var p = r.get(d + ``);
            p === void 0 ? d in e && ((p = f(() => L(k, u))), r.set(d + ``, p)) : R(p, k);
          }
        if (c === void 0)
          (!l || a(e, t)?.writable) && ((c = f(() => L(void 0, u))), R(c, Jt(n)), r.set(t, c));
        else {
          l = c.v !== k;
          var m = f(() => Jt(n));
          R(c, m);
        }
        var h = Reflect.getOwnPropertyDescriptor(e, t);
        if ((h?.set && h.set.call(s, n), !l)) {
          if (i && typeof t == `string`) {
            var g = r.get(`length`),
              _ = Number(t);
            Number.isInteger(_) && _ >= g.v && R(g, _ + 1);
          }
          Kt(o);
        }
        return !0;
      },
      ownKeys(e) {
        K(o);
        var t = Reflect.ownKeys(e).filter((e) => {
          var t = r.get(e);
          return t === void 0 || t.v !== k;
        });
        for (var [n, i] of r) i.v !== k && !(n in e) && t.push(n);
        return t;
      },
      setPrototypeOf() {
        ye();
      },
    })
  );
}
var Yt, Xt, Zt, Qt;
function $t() {
  if (Yt === void 0) {
    ((Yt = window), (Xt = /Firefox/.test(navigator.userAgent)));
    var e = Element.prototype,
      t = Node.prototype,
      n = Text.prototype;
    ((Zt = a(t, `firstChild`).get),
      (Qt = a(t, `nextSibling`).get),
      u(e) && ((e[ie] = void 0), (e[re] = null), (e[ae] = void 0), (e.__e = void 0)),
      u(n) && (n[oe] = void 0));
  }
}
function en(e = ``) {
  return document.createTextNode(e);
}
function tn(e) {
  return Zt.call(e);
}
function nn(e) {
  return Qt.call(e);
}
function z(e, t) {
  if (!A) return tn(e);
  var n = tn(j);
  if (n === null) n = j.appendChild(en());
  else if (t && n.nodeType !== 3) {
    var r = en();
    return (n?.before(r), Oe(r), r);
  }
  return (t && cn(n), Oe(n), n);
}
function rn(e, t = !1) {
  if (!A) {
    var n = tn(e);
    return n instanceof Comment && n.data === `` ? nn(n) : n;
  }
  if (t) {
    if (j?.nodeType !== 3) {
      var r = en();
      return (j?.before(r), Oe(r), r);
    }
    cn(j);
  }
  return j;
}
function B(e, t = 1, n = !1) {
  let r = A ? j : e;
  for (var i; t--;) ((i = r), (r = nn(r)));
  if (!A) return r;
  if (n) {
    if (r?.nodeType !== 3) {
      var a = en();
      return (r === null ? i?.after(a) : r.before(a), Oe(a), a);
    }
    cn(r);
  }
  return (Oe(r), r);
}
function an(e) {
  e.textContent = ``;
}
function on() {
  return !Ie || mt !== null ? !1 : (W.f & y) !== 0;
}
function sn(e, t, n) {
  let r = n ? { is: n } : void 0;
  return document.createElementNS(t ?? `http://www.w3.org/1999/xhtml`, e, r);
}
function cn(e) {
  if (e.nodeValue.length < 65536) return;
  let t = e.nextSibling;
  for (; t !== null && t.nodeType === 3;)
    (t.remove(), (e.nodeValue += t.nodeValue), (t = e.nextSibling));
}
var ln = !1;
function un() {
  ln ||
    ((ln = !0),
    document.addEventListener(
      `reset`,
      (e) => {
        Promise.resolve().then(() => {
          if (!e.defaultPrevented) for (let t of e.target.elements) t[se]?.();
        });
      },
      { capture: !0 },
    ));
}
function dn(e) {
  var t = U,
    n = W;
  (Vn(null), Hn(null));
  try {
    return e();
  } finally {
    (Vn(t), Hn(n));
  }
}
function fn(e, t, n, r = n) {
  e.addEventListener(t, () => dn(n));
  let i = e[se];
  (i
    ? (e[se] = () => {
        (i(), r(!0));
      })
    : (e[se] = () => r(!0)),
    un());
}
function pn(e) {
  (W === null && (U === null && he(e), me()), Rn && pe(e));
}
function mn(e, t) {
  var n = t.last;
  n === null ? (t.last = t.first = e) : ((n.next = e), (e.prev = n), (t.last = e));
}
function hn(e, t) {
  var n = W;
  n !== null && n.f & 8192 && (e |= _);
  var r = {
    ctx: N,
    deps: null,
    nodes: null,
    f: e | h | 512,
    first: null,
    fn: t,
    last: null,
    next: null,
    parent: n,
    b: n && n.b,
    prev: null,
    teardown: null,
    wv: 0,
    ac: null,
  };
  F?.register_created_effect(r);
  var i = r;
  if (e & 4) st === null ? dt.ensure().schedule(r) : st.push(r);
  else if (t !== null) {
    try {
      ir(r);
    } catch (e) {
      throw (H(r), e);
    }
    i.deps === null &&
      i.teardown === null &&
      i.nodes === null &&
      i.first === i.last &&
      !(i.f & 524288) &&
      ((i = i.first), e & 16 && e & 65536 && i !== null && (i.f |= x));
  }
  if (i !== null && ((i.parent = n), n !== null && mn(i, n), U !== null && U.f & 2 && !(e & 64))) {
    var a = U;
    (a.effects ??= []).push(i);
  }
  return r;
}
function gn() {
  return U !== null && !Bn;
}
function _n(e) {
  let t = hn(8, null);
  return (P(t, m), (t.teardown = e), t);
}
function vn(e) {
  pn(`$effect`);
  var t = W.f;
  if (!U && t & 32 && !(t & 32768)) {
    var n = N;
    (n.e ??= []).push(e);
  } else return yn(e);
}
function yn(e) {
  return hn(4 | C, e);
}
function bn(e) {
  dt.ensure();
  let t = hn(64 | S, e);
  return (e = {}) =>
    new Promise((n) => {
      e.outro
        ? jn(t, () => {
            (H(t), n(void 0));
          })
        : (H(t), n(void 0));
    });
}
function xn(e) {
  return hn(4, e);
}
function Sn(e) {
  return hn(ee | S, e);
}
function Cn(e, t = 0) {
  return hn(8 | t, e);
}
function V(e, t = [], n = [], r = []) {
  Tt(r, t, n, (t) => {
    hn(8, () => e(...t.map(K)));
  });
}
function wn(e, t = 0) {
  return hn(16 | t, e);
}
function Tn(e) {
  return hn(32 | S, e);
}
function En(e) {
  var t = e.teardown;
  if (t !== null) {
    let e = Rn,
      n = U;
    (zn(!0), Vn(null));
    try {
      t.call(null);
    } finally {
      (zn(e), Vn(n));
    }
  }
}
function Dn(e, t = !1) {
  var n = e.first;
  for (e.first = e.last = null; n !== null;) {
    let e = n.ac;
    e !== null &&
      dn(() => {
        e.abort(ce);
      });
    var r = n.next;
    (n.f & 64 ? (n.parent = null) : H(n, t), (n = r));
  }
}
function On(e) {
  for (var t = e.first; t !== null;) {
    var n = t.next;
    (t.f & 32 || H(t), (t = n));
  }
}
function H(e, t = !0) {
  var n = !1;
  ((t || e.f & 262144) &&
    e.nodes !== null &&
    e.nodes.end !== null &&
    (kn(e.nodes.start, e.nodes.end), (n = !0)),
    P(e, b),
    Dn(e, t && !n),
    rr(e, 0));
  var r = e.nodes && e.nodes.t;
  if (r !== null) for (let e of r) e.stop();
  (En(e), (e.f ^= b), (e.f |= v));
  var i = e.parent;
  (i !== null && i.first !== null && An(e),
    (e.next = e.prev = e.teardown = e.ctx = e.deps = e.fn = e.nodes = e.ac = e.b = null));
}
function kn(e, t) {
  for (; e !== null;) {
    var n = e === t ? null : nn(e);
    (e.remove(), (e = n));
  }
}
function An(e) {
  var t = e.parent,
    n = e.prev,
    r = e.next;
  (n !== null && (n.next = r),
    r !== null && (r.prev = n),
    t !== null && (t.first === e && (t.first = r), t.last === e && (t.last = n)));
}
function jn(e, t, n = !0) {
  var r = [];
  Mn(e, r, !0);
  var i = () => {
      (n && H(e), t && t());
    },
    a = r.length;
  if (a > 0) {
    var o = () => --a || i();
    for (var s of r) s.out(o);
  } else i();
}
function Mn(e, t, n) {
  if (!(e.f & 8192)) {
    e.f ^= _;
    var r = e.nodes && e.nodes.t;
    if (r !== null) for (let e of r) (e.is_global || n) && t.push(e);
    for (var i = e.first; i !== null;) {
      var a = i.next;
      if (!(i.f & 64)) {
        var o = (i.f & 65536) != 0 || ((i.f & 32) != 0 && (e.f & 16) != 0);
        Mn(i, t, o ? n : !1);
      }
      i = a;
    }
  }
}
function Nn(e) {
  Pn(e, !0);
}
function Pn(e, t) {
  if (e.f & 8192) {
    ((e.f ^= _), e.f & 1024 || (P(e, h), dt.ensure().schedule(e)));
    for (var n = e.first; n !== null;) {
      var r = n.next,
        i = (n.f & 65536) != 0 || (n.f & 32) != 0;
      (Pn(n, i ? t : !1), (n = r));
    }
    var a = e.nodes && e.nodes.t;
    if (a !== null) for (let e of a) (e.is_global || t) && e.in();
  }
}
function Fn(e, t) {
  if (e.nodes)
    for (var n = e.nodes.start, r = e.nodes.end; n !== null;) {
      var i = n === r ? null : nn(n);
      (t.append(n), (n = i));
    }
}
var In = null,
  Ln = !1,
  Rn = !1;
function zn(e) {
  Rn = e;
}
var U = null,
  Bn = !1;
function Vn(e) {
  U = e;
}
var W = null;
function Hn(e) {
  W = e;
}
var Un = null;
function Wn(e) {
  U !== null && (!Ie || U.f & 2) && (Un === null ? (Un = [e]) : Un.push(e));
}
var G = null,
  Gn = 0,
  Kn = null;
function qn(e) {
  Kn = e;
}
var Jn = 1,
  Yn = 0,
  Xn = Yn;
function Zn(e) {
  Xn = e;
}
function Qn() {
  return ++Jn;
}
function $n(e) {
  var t = e.f;
  if (t & 2048) return !0;
  if ((t & 2 && (e.f &= ~T), t & 4096)) {
    for (var n = e.deps, r = n.length, i = 0; i < r; i++) {
      var a = n[i];
      if (($n(a) && It(a), a.wv > e.wv)) return !0;
    }
    t & 512 && I === null && P(e, m);
  }
  return !1;
}
function er(e, t, r = !0) {
  var i = e.reactions;
  if (i !== null && !(!Ie && Un !== null && n.call(Un, e)))
    for (var a = 0; a < i.length; a++) {
      var o = i[a];
      o.f & 2 ? er(o, t, !1) : t === o && (r ? P(o, h) : o.f & 1024 && P(o, g), vt(o));
    }
}
function tr(e) {
  var t = G,
    n = Gn,
    r = Kn,
    i = U,
    a = Un,
    o = N,
    s = Bn,
    c = Xn,
    l = e.f;
  ((G = null),
    (Gn = 0),
    (Kn = null),
    (U = l & 96 ? null : e),
    (Un = null),
    Re(e.ctx),
    (Bn = !1),
    (Xn = ++Yn),
    e.ac !== null &&
      (dn(() => {
        e.ac.abort(ce);
      }),
      (e.ac = null)));
  try {
    e.f |= E;
    var u = e.fn,
      d = u();
    e.f |= y;
    var f = e.deps,
      p = F?.is_fork;
    if (G !== null) {
      var m;
      if ((p || rr(e, Gn), f !== null && Gn > 0))
        for (f.length = Gn + G.length, m = 0; m < G.length; m++) f[Gn + m] = G[m];
      else e.deps = f = G;
      if (gn() && e.f & 512) for (m = Gn; m < f.length; m++) (f[m].reactions ??= []).push(e);
    } else !p && f !== null && Gn < f.length && (rr(e, Gn), (f.length = Gn));
    if (Ve() && Kn !== null && !Bn && f !== null && !(e.f & 6146))
      for (m = 0; m < Kn.length; m++) er(Kn[m], e);
    if (i !== null && i !== e) {
      if ((Yn++, i.deps !== null)) for (let e = 0; e < n; e += 1) i.deps[e].rv = Yn;
      if (t !== null) for (let e of t) e.rv = Yn;
      Kn !== null && (r === null ? (r = Kn) : r.push(...Kn));
    }
    return (e.f & 8388608 && (e.f ^= te), d);
  } catch (e) {
    return Ke(e);
  } finally {
    ((e.f ^= E), (G = t), (Gn = n), (Kn = r), (U = i), (Un = a), Re(o), (Bn = s), (Xn = c));
  }
}
function nr(e, r) {
  let i = r.reactions;
  if (i !== null) {
    var a = t.call(i, e);
    if (a !== -1) {
      var o = i.length - 1;
      o === 0 ? (i = r.reactions = null) : ((i[a] = i[o]), i.pop());
    }
  }
  if (i === null && r.f & 2 && (G === null || !n.call(G, r))) {
    var s = r;
    (s.f & 512 && ((s.f ^= 512), (s.f &= ~T)), s.v !== k && Ye(s), Lt(s), rr(s, 0));
  }
}
function rr(e, t) {
  var n = e.deps;
  if (n !== null) for (var r = t; r < n.length; r++) nr(e, n[r]);
}
function ir(e) {
  var t = e.f;
  if (!(t & 16384)) {
    P(e, m);
    var n = W,
      r = Ln;
    ((W = e), (Ln = !0));
    try {
      (t & 16777232 ? On(e) : Dn(e), En(e));
      var i = tr(e);
      ((e.teardown = typeof i == `function` ? i : null), (e.wv = Jn));
    } finally {
      ((Ln = r), (W = n));
    }
  }
}
async function ar() {
  if (Ie)
    return new Promise((e) => {
      (requestAnimationFrame(() => e()), setTimeout(() => e()));
    });
  (await Promise.resolve(), ft());
}
function K(e) {
  var t = (e.f & 2) != 0;
  if (
    (In?.add(e),
    U !== null && !Bn && !(W !== null && W.f & 16384) && (Un === null || !n.call(Un, e)))
  ) {
    var r = U.deps;
    if (U.f & 2097152)
      e.rv < Yn &&
        ((e.rv = Yn),
        G === null && r !== null && r[Gn] === e ? Gn++ : G === null ? (G = [e]) : G.push(e));
    else {
      ((U.deps ??= []), n.call(U.deps, e) || U.deps.push(e));
      var i = e.reactions;
      i === null ? (e.reactions = [U]) : n.call(i, U) || i.push(U);
    }
  }
  if (Rn && Bt.has(e)) return Bt.get(e);
  if (t) {
    var a = e;
    if (Rn) {
      var o = a.v;
      return (((!(a.f & 1024) && a.reactions !== null) || sr(a)) && (o = Ft(a)), Bt.set(a, o), o);
    }
    var s = (a.f & 512) == 0 && !Bn && U !== null && (Ln || (U.f & 512) != 0),
      c = (a.f & y) === 0;
    ($n(a) && (s && (a.f |= 512), It(a)), s && !c && (Rt(a), or(a)));
  }
  if (I?.has(e)) return I.get(e);
  if (e.f & 8388608) throw e.v;
  return e.v;
}
function or(e) {
  if (((e.f |= 512), e.deps !== null))
    for (let t of e.deps) ((t.reactions ??= []).push(e), t.f & 2 && !(t.f & 512) && (Rt(t), or(t)));
}
function sr(e) {
  if (e.v === k) return !0;
  if (e.deps === null) return !1;
  for (let t of e.deps) if (Bt.has(t) || (t.f & 2 && sr(t))) return !0;
  return !1;
}
function cr(e) {
  var t = Bn;
  try {
    return ((Bn = !0), e());
  } finally {
    Bn = t;
  }
}
function lr(e) {
  if (!(typeof e != `object` || !e || e instanceof EventTarget)) {
    if (D in e) ur(e);
    else if (!Array.isArray(e))
      for (let t in e) {
        let n = e[t];
        typeof n == `object` && n && D in n && ur(n);
      }
  }
}
function ur(e, t = new Set()) {
  if (typeof e == `object` && e && !(e instanceof EventTarget) && !t.has(e)) {
    (t.add(e), e instanceof Date && e.getTime());
    for (let n in e)
      try {
        ur(e[n], t);
      } catch {}
    let n = l(e);
    if (
      n !== Object.prototype &&
      n !== Array.prototype &&
      n !== Map.prototype &&
      n !== Set.prototype &&
      n !== Date.prototype
    ) {
      let t = o(n);
      for (let n in t) {
        let r = t[n].get;
        if (r)
          try {
            r.call(e);
          } catch {}
      }
    }
  }
}
[
  ...`allowfullscreen.async.autofocus.autoplay.checked.controls.default.disabled.formnovalidate.indeterminate.inert.ismap.loop.multiple.muted.nomodule.novalidate.open.playsinline.readonly.required.reversed.seamless.selected.webkitdirectory.defer.disablepictureinpicture.disableremoteplayback`.split(
    `.`,
  ),
];
var dr = [`touchstart`, `touchmove`];
function fr(e) {
  return dr.includes(e);
}
var pr = Symbol(`events`),
  mr = new Set(),
  hr = new Set();
function gr(e, t, n, r = {}) {
  function i(e) {
    if ((r.capture || br.call(t, e), !e.cancelBubble)) return dn(() => n?.call(this, e));
  }
  return (
    e.startsWith(`pointer`) || e.startsWith(`touch`) || e === `wheel`
      ? We(() => {
          t.addEventListener(e, i, r);
        })
      : t.addEventListener(e, i, r),
    i
  );
}
function _r(e, t, n, r, i) {
  var a = { capture: r, passive: i },
    o = gr(e, t, n, a);
  (t === document.body || t === window || t === document || t instanceof HTMLMediaElement) &&
    _n(() => {
      t.removeEventListener(e, o, a);
    });
}
function q(e, t, n) {
  (t[pr] ??= {})[e] = n;
}
function vr(e) {
  for (var t = 0; t < e.length; t++) mr.add(e[t]);
  for (var n of hr) n(e);
}
var yr = null;
function br(e) {
  var t = this,
    n = t.ownerDocument,
    r = e.type,
    a = e.composedPath?.() || [],
    o = a[0] || e.target;
  yr = e;
  var s = 0,
    c = yr === e && e[pr];
  if (c) {
    var l = a.indexOf(c);
    if (l !== -1 && (t === document || t === window)) {
      e[pr] = t;
      return;
    }
    var u = a.indexOf(t);
    if (u === -1) return;
    l <= u && (s = l);
  }
  if (((o = a[s] || e.target), o !== t)) {
    i(e, `currentTarget`, {
      configurable: !0,
      get() {
        return o || n;
      },
    });
    var d = U,
      f = W;
    (Vn(null), Hn(null));
    try {
      for (var p, m = []; o !== null;) {
        var h = o.assignedSlot || o.parentNode || o.host || null;
        try {
          var g = o[pr]?.[r];
          g != null && (!o.disabled || e.target === o) && g.call(o, e);
        } catch (e) {
          p ? m.push(e) : (p = e);
        }
        if (e.cancelBubble || h === t || h === null) break;
        o = h;
      }
      if (p) {
        for (let e of m)
          queueMicrotask(() => {
            throw e;
          });
        throw p;
      }
    } finally {
      ((e[pr] = t), delete e.currentTarget, Vn(d), Hn(f));
    }
  }
}
var xr =
  globalThis?.window?.trustedTypes &&
  globalThis.window.trustedTypes.createPolicy(`svelte-trusted-html`, { createHTML: (e) => e });
function Sr(e) {
  return xr?.createHTML(e) ?? e;
}
function Cr(e) {
  var t = sn(`template`);
  return ((t.innerHTML = Sr(e.replaceAll(`<!>`, `<!---->`))), t.content);
}
function wr(e, t) {
  var n = W;
  n.nodes === null && (n.nodes = { start: e, end: t, a: null, t: null });
}
function J(e, t) {
  var n = (t & 1) != 0,
    r = (t & 2) != 0,
    i,
    a = !e.startsWith(`<!>`);
  return () => {
    if (A) return (wr(j, null), j);
    i === void 0 && ((i = Cr(a ? e : `<!>` + e)), n || (i = tn(i)));
    var t = r || Xt ? document.importNode(i, !0) : i.cloneNode(!0);
    if (n) {
      var o = tn(t),
        s = t.lastChild;
      wr(o, s);
    } else wr(t, t);
    return t;
  };
}
function Tr() {
  if (A) return (wr(j, null), j);
  var e = document.createDocumentFragment(),
    t = document.createComment(``),
    n = en();
  return (e.append(t, n), wr(t, n), e);
}
function Y(e, t) {
  if (A) {
    var n = W;
    ((!(n.f & 32768) || n.nodes.end === null) && (n.nodes.end = j), ke());
    return;
  }
  e !== null && e.before(t);
}
function X(e, t) {
  var n = t == null ? `` : typeof t == `object` ? `${t}` : t;
  n !== (e[oe] ??= e.nodeValue) && ((e[oe] = n), (e.nodeValue = `${n}`));
}
function Er(e, t) {
  return Or(e, t);
}
var Dr = new Map();
function Or(
  e,
  { target: t, anchor: n, props: i = {}, events: a, context: o, intro: s = !0, transformError: c },
) {
  $t();
  var l = void 0,
    u = bn(() => {
      var s = n ?? t.appendChild(en());
      Ct(
        s,
        { pending: () => {} },
        (t) => {
          ze({});
          var n = N;
          if (
            (o && (n.c = o),
            a && (i.$$events = a),
            A && wr(t, null),
            (l = e(t, i) || {}),
            A && ((W.nodes.end = j), j === null || j.nodeType !== 8 || j.data !== `]`))
          )
            throw (Te(), Se);
          Be();
        },
        c,
      );
      var u = new Set(),
        d = (e) => {
          for (var n = 0; n < e.length; n++) {
            var r = e[n];
            if (!u.has(r)) {
              u.add(r);
              var i = fr(r);
              for (let e of [t, document]) {
                var a = Dr.get(e);
                a === void 0 && ((a = new Map()), Dr.set(e, a));
                var o = a.get(r);
                o === void 0
                  ? (e.addEventListener(r, br, { passive: i }), a.set(r, 1))
                  : a.set(r, o + 1);
              }
            }
          }
        };
      return (
        d(r(mr)),
        hr.add(d),
        () => {
          for (var e of u)
            for (let n of [t, document]) {
              var r = Dr.get(n),
                i = r.get(e);
              --i == 0
                ? (n.removeEventListener(e, br), r.delete(e), r.size === 0 && Dr.delete(n))
                : r.set(e, i);
            }
          (hr.delete(d), s !== n && s.parentNode?.removeChild(s));
        }
      );
    });
  return (kr.set(l, u), l);
}
var kr = new WeakMap(),
  Ar = class {
    anchor;
    #e = new Map();
    #t = new Map();
    #n = new Map();
    #r = new Set();
    #i = !0;
    constructor(e, t = !0) {
      ((this.anchor = e), (this.#i = t));
    }
    #a = (e) => {
      if (this.#e.has(e)) {
        var t = this.#e.get(e),
          n = this.#t.get(t);
        if (n) (Nn(n), this.#r.delete(t));
        else {
          var r = this.#n.get(t);
          r &&
            (this.#t.set(t, r.effect),
            this.#n.delete(t),
            r.fragment.lastChild.remove(),
            this.anchor.before(r.fragment),
            (n = r.effect));
        }
        for (let [t, n] of this.#e) {
          if ((this.#e.delete(t), t === e)) break;
          let r = this.#n.get(n);
          r && (H(r.effect), this.#n.delete(n));
        }
        for (let [e, r] of this.#t) {
          if (e === t || this.#r.has(e)) continue;
          let i = () => {
            if (Array.from(this.#e.values()).includes(e)) {
              var t = document.createDocumentFragment();
              (Fn(r, t), t.append(en()), this.#n.set(e, { effect: r, fragment: t }));
            } else H(r);
            (this.#r.delete(e), this.#t.delete(e));
          };
          this.#i || !n ? (this.#r.add(e), jn(r, i, !1)) : i();
        }
      }
    };
    #o = (e) => {
      this.#e.delete(e);
      let t = Array.from(this.#e.values());
      for (let [e, n] of this.#n) t.includes(e) || (H(n.effect), this.#n.delete(e));
    };
    ensure(e, t) {
      var n = F,
        r = on();
      if (t && !this.#t.has(e) && !this.#n.has(e))
        if (r) {
          var i = document.createDocumentFragment(),
            a = en();
          (i.append(a), this.#n.set(e, { effect: Tn(() => t(a)), fragment: i }));
        } else
          this.#t.set(
            e,
            Tn(() => t(this.anchor)),
          );
      if ((this.#e.set(n, e), r)) {
        for (let [t, r] of this.#t) t === e ? n.unskip_effect(r) : n.skip_effect(r);
        for (let [t, r] of this.#n) t === e ? n.unskip_effect(r.effect) : n.skip_effect(r.effect);
        (n.oncommit(this.#a), n.ondiscard(this.#o));
      } else (A && (this.anchor = j), this.#a(n));
    }
  };
function Z(e, t, n = !1) {
  var r;
  A && ((r = j), ke());
  var i = new Ar(e),
    a = n ? x : 0;
  function o(e, t) {
    if (A) {
      var n = Me(r);
      if (e !== parseInt(n.substring(1))) {
        var a = je();
        (Oe(a), (i.anchor = a), De(!1), i.ensure(e, t), De(!0));
        return;
      }
    }
    i.ensure(e, t);
  }
  wn(() => {
    var e = !1;
    (t((t, n = 0) => {
      ((e = !0), o(n, t));
    }),
      e || o(-1, null));
  }, a);
}
function jr(e, t) {
  return t;
}
function Mr(e, t, n) {
  for (var i = [], a = t.length, o, s = t.length, c = 0; c < a; c++) {
    let n = t[c];
    jn(
      n,
      () => {
        if (o) {
          if ((o.pending.delete(n), o.done.add(n), o.pending.size === 0)) {
            var t = e.outrogroups;
            (Nr(e, r(o.done)), t.delete(o), t.size === 0 && (e.outrogroups = null));
          }
        } else --s;
      },
      !1,
    );
  }
  if (s === 0) {
    var l = i.length === 0 && n !== null;
    if (l) {
      var u = n,
        d = u.parentNode;
      (an(d), d.append(u), e.items.clear());
    }
    Nr(e, t, !l);
  } else ((o = { pending: new Set(t), done: new Set() }), (e.outrogroups ??= new Set()).add(o));
}
function Nr(e, t, n = !0) {
  var r;
  if (e.pending.size > 0) {
    r = new Set();
    for (let t of e.pending.values()) for (let n of t) r.add(e.items.get(n).e);
  }
  for (var i = 0; i < t.length; i++) {
    var a = t[i];
    r?.has(a) ? ((a.f |= w), Fn(a, document.createDocumentFragment())) : H(t[i], n);
  }
}
var Pr;
function Fr(t, n, i, a, o, s = null) {
  var c = t,
    l = new Map();
  if (n & 4) {
    var u = t;
    c = A ? Oe(tn(u)) : u.appendChild(en());
  }
  A && ke();
  var d = null,
    f = Nt(() => {
      var t = i();
      return e(t) ? t : t == null ? [] : r(t);
    }),
    p,
    m = new Map(),
    h = !0;
  function g(e) {
    v.effect.f & 16384 ||
      (v.pending.delete(e),
      (v.fallback = d),
      Lr(v, p, c, n, a),
      d !== null &&
        (p.length === 0
          ? d.f & 33554432
            ? ((d.f ^= w), zr(d, null, c))
            : Nn(d)
          : jn(d, () => {
              d = null;
            })));
  }
  function _(e) {
    v.pending.delete(e);
  }
  var v = {
    effect: wn(() => {
      p = K(f);
      var e = p.length;
      let t = !1;
      A && (Me(c) === `[!`) != (e === 0) && ((c = je()), Oe(c), De(!1), (t = !0));
      for (var r = new Set(), u = F, v = on(), y = 0; y < e; y += 1) {
        A && j.nodeType === 8 && j.data === `]` && ((c = j), (t = !0), De(!1));
        var b = p[y],
          x = a(b, y),
          S = h ? null : l.get(x);
        (S
          ? (S.v && Wt(S.v, b), S.i && Wt(S.i, y), v && u.unskip_effect(S.e))
          : ((S = Rr(l, h ? c : (Pr ??= en()), b, x, y, o, n, i)), h || (S.e.f |= w), l.set(x, S)),
          r.add(x));
      }
      if (
        (e === 0 &&
          s &&
          !d &&
          (h ? (d = Tn(() => s(c))) : ((d = Tn(() => s((Pr ??= en())))), (d.f |= w))),
        e > r.size && fe(``, ``, ``),
        A && e > 0 && Oe(je()),
        !h)
      )
        if ((m.set(u, r), v)) {
          for (let [e, t] of l) r.has(e) || u.skip_effect(t.e);
          (u.oncommit(g), u.ondiscard(_));
        } else g(u);
      (t && De(!0), K(f));
    }),
    flags: n,
    items: l,
    pending: m,
    outrogroups: null,
    fallback: d,
  };
  ((h = !1), A && (c = j));
}
function Ir(e) {
  for (; e !== null && !(e.f & 32);) e = e.next;
  return e;
}
function Lr(e, t, n, i, a) {
  var o = (i & 8) != 0,
    s = t.length,
    c = e.items,
    l = Ir(e.effect.first),
    u,
    d = null,
    f,
    p = [],
    m = [],
    h,
    g,
    _,
    v;
  if (o)
    for (v = 0; v < s; v += 1)
      ((h = t[v]),
        (g = a(h, v)),
        (_ = c.get(g).e),
        _.f & 33554432 || (_.nodes?.a?.measure(), (f ??= new Set()).add(_)));
  for (v = 0; v < s; v += 1) {
    if (((h = t[v]), (g = a(h, v)), (_ = c.get(g).e), e.outrogroups !== null))
      for (let t of e.outrogroups) (t.pending.delete(_), t.done.delete(_));
    if (
      (_.f & 8192 && (Nn(_), o && (_.nodes?.a?.unfix(), (f ??= new Set()).delete(_))),
      _.f & 33554432)
    )
      if (((_.f ^= w), _ === l)) zr(_, null, n);
      else {
        var y = d ? d.next : l;
        (_ === e.effect.last && (e.effect.last = _.prev),
          _.prev && (_.prev.next = _.next),
          _.next && (_.next.prev = _.prev),
          Br(e, d, _),
          Br(e, _, y),
          zr(_, y, n),
          (d = _),
          (p = []),
          (m = []),
          (l = Ir(d.next)));
        continue;
      }
    if (_ !== l) {
      if (u !== void 0 && u.has(_)) {
        if (p.length < m.length) {
          var b = m[0],
            x;
          d = b.prev;
          var S = p[0],
            C = p[p.length - 1];
          for (x = 0; x < p.length; x += 1) zr(p[x], b, n);
          for (x = 0; x < m.length; x += 1) u.delete(m[x]);
          (Br(e, S.prev, C.next),
            Br(e, d, S),
            Br(e, C, b),
            (l = b),
            (d = C),
            --v,
            (p = []),
            (m = []));
        } else
          (u.delete(_),
            zr(_, l, n),
            Br(e, _.prev, _.next),
            Br(e, _, d === null ? e.effect.first : d.next),
            Br(e, d, _),
            (d = _));
        continue;
      }
      for (p = [], m = []; l !== null && l !== _;)
        ((u ??= new Set()).add(l), m.push(l), (l = Ir(l.next)));
      if (l === null) continue;
    }
    (_.f & 33554432 || p.push(_), (d = _), (l = Ir(_.next)));
  }
  if (e.outrogroups !== null) {
    for (let t of e.outrogroups)
      t.pending.size === 0 && (Nr(e, r(t.done)), e.outrogroups?.delete(t));
    e.outrogroups.size === 0 && (e.outrogroups = null);
  }
  if (l !== null || u !== void 0) {
    var T = [];
    if (u !== void 0) for (_ of u) _.f & 8192 || T.push(_);
    for (; l !== null;) (!(l.f & 8192) && l !== e.fallback && T.push(l), (l = Ir(l.next)));
    var E = T.length;
    if (E > 0) {
      var ee = i & 4 && s === 0 ? n : null;
      if (o) {
        for (v = 0; v < E; v += 1) T[v].nodes?.a?.measure();
        for (v = 0; v < E; v += 1) T[v].nodes?.a?.fix();
      }
      Mr(e, T, ee);
    }
  }
  o &&
    We(() => {
      if (f !== void 0) for (_ of f) _.nodes?.a?.apply();
    });
}
function Rr(e, t, n, r, i, a, o, s) {
  var c = o & 1 ? (o & 16 ? Ht(n) : Ut(n, !1, !1)) : null,
    l = o & 2 ? Ht(i) : null;
  return {
    v: c,
    i: l,
    e: Tn(
      () => (
        a(t, c ?? n, l ?? i, s),
        () => {
          e.delete(r);
        }
      ),
    ),
  };
}
function zr(e, t, n) {
  if (e.nodes)
    for (
      var r = e.nodes.start, i = e.nodes.end, a = t && !(t.f & 33554432) ? t.nodes.start : n;
      r !== null;
    ) {
      var o = nn(r);
      if ((a.before(r), r === i)) return;
      r = o;
    }
}
function Br(e, t, n) {
  (t === null ? (e.effect.first = n) : (t.next = n),
    n === null ? (e.effect.last = t) : (n.prev = t));
}
function Vr(e, t, n) {
  xn(() => {
    var r = cr(() => t(e, n?.()) || {});
    if (n && r?.update) {
      var i = !1,
        a = {};
      (Cn(() => {
        var e = n();
        (lr(e), i && Pe(a, e) && ((a = e), r.update(e)));
      }),
        (i = !0));
    }
    if (r?.destroy) return () => r.destroy();
  });
}
function Hr(e) {
  var t,
    n,
    r = ``;
  if (typeof e == `string` || typeof e == `number`) r += e;
  else if (typeof e == `object`)
    if (Array.isArray(e)) {
      var i = e.length;
      for (t = 0; t < i; t++) e[t] && (n = Hr(e[t])) && (r && (r += ` `), (r += n));
    } else for (n in e) e[n] && (r && (r += ` `), (r += n));
  return r;
}
function Ur() {
  for (var e, t, n = 0, r = ``, i = arguments.length; n < i; n++)
    (e = arguments[n]) && (t = Hr(e)) && (r && (r += ` `), (r += t));
  return r;
}
function Wr(e) {
  return typeof e == `object` ? Ur(e) : (e ?? ``);
}
var Gr = [
  ...` 	
\r\f\xA0\v﻿`,
];
function Kr(e, t, n) {
  var r = e == null ? `` : `` + e;
  if ((t && (r = r ? r + ` ` + t : t), n)) {
    for (var i of Object.keys(n))
      if (n[i]) r = r ? r + ` ` + i : i;
      else if (r.length)
        for (var a = i.length, o = 0; (o = r.indexOf(i, o)) >= 0;) {
          var s = o + a;
          (o === 0 || Gr.includes(r[o - 1])) && (s === r.length || Gr.includes(r[s]))
            ? (r = (o === 0 ? `` : r.substring(0, o)) + r.substring(s + 1))
            : (o = s);
        }
  }
  return r === `` ? null : r;
}
function qr(e, t = !1) {
  var n = t ? ` !important;` : `;`,
    r = ``;
  for (var i of Object.keys(e)) {
    var a = e[i];
    a != null && a !== `` && (r += ` ` + i + `: ` + a + n);
  }
  return r;
}
function Jr(e) {
  return e[0] !== `-` || e[1] !== `-` ? e.toLowerCase() : e;
}
function Yr(e, t) {
  if (t) {
    var n = ``,
      r,
      i;
    if ((Array.isArray(t) ? ((r = t[0]), (i = t[1])) : (r = t), e)) {
      e = String(e)
        .replaceAll(/\s*\/\*.*?\*\/\s*/g, ``)
        .trim();
      var a = !1,
        o = 0,
        s = !1,
        c = [];
      (r && c.push(...Object.keys(r).map(Jr)), i && c.push(...Object.keys(i).map(Jr)));
      var l = 0,
        u = -1;
      let t = e.length;
      for (var d = 0; d < t; d++) {
        var f = e[d];
        if (
          (s
            ? f === `/` && e[d - 1] === `*` && (s = !1)
            : a
              ? a === f && (a = !1)
              : f === `/` && e[d + 1] === `*`
                ? (s = !0)
                : f === `"` || f === `'`
                  ? (a = f)
                  : f === `(`
                    ? o++
                    : f === `)` && o--,
          !s && a === !1 && o === 0)
        ) {
          if (f === `:` && u === -1) u = d;
          else if (f === `;` || d === t - 1) {
            if (u !== -1) {
              var p = Jr(e.substring(l, u).trim());
              if (!c.includes(p)) {
                f !== `;` && d++;
                var m = e.substring(l, d).trim();
                n += ` ` + m + `;`;
              }
            }
            ((l = d + 1), (u = -1));
          }
        }
      }
    }
    return (r && (n += qr(r)), i && (n += qr(i, !0)), (n = n.trim()), n === `` ? null : n);
  }
  return e == null ? null : String(e);
}
function Q(e, t, n, r, i, a) {
  var o = e[ie];
  if (A || o !== n || o === void 0) {
    var s = Kr(n, r, a);
    ((!A || s !== e.getAttribute(`class`)) &&
      (s == null ? e.removeAttribute(`class`) : t ? (e.className = s) : e.setAttribute(`class`, s)),
      (e[ie] = n));
  } else if (a && i !== a)
    for (var c in a) {
      var l = !!a[c];
      (i == null || l !== !!i[c]) && e.classList.toggle(c, l);
    }
  return a;
}
function Xr(e, t = {}, n, r) {
  for (var i in n) {
    var a = n[i];
    t[i] !== a && (n[i] == null ? e.style.removeProperty(i) : e.style.setProperty(i, a, r));
  }
}
function Zr(e, t, n, r) {
  var i = e[ae];
  if (A || i !== t) {
    var a = Yr(t, r);
    ((!A || a !== e.getAttribute(`style`)) &&
      (a == null ? e.removeAttribute(`style`) : (e.style.cssText = a)),
      (e[ae] = t));
  } else
    r && (Array.isArray(r) ? (Xr(e, n?.[0], r[0]), Xr(e, n?.[1], r[1], `important`)) : Xr(e, n, r));
  return r;
}
var Qr = Symbol(`is custom element`),
  $r = Symbol(`is html`),
  ei = le ? `link` : `LINK`;
function ti(e) {
  if (A) {
    var t = !1,
      n = () => {
        if (!t) {
          if (((t = !0), e.hasAttribute(`value`))) {
            var n = e.value;
            ($(e, `value`, null), (e.value = n));
          }
          if (e.hasAttribute(`checked`)) {
            var r = e.checked;
            ($(e, `checked`, null), (e.checked = r));
          }
        }
      };
    ((e[se] = n), We(n), un());
  }
}
function $(e, t, n, r) {
  var i = ni(e);
  (A &&
    ((i[t] = e.getAttribute(t)),
    t === `src` || t === `srcset` || (t === `href` && e.nodeName === ei))) ||
    (i[t] !== (i[t] = n) &&
      (t === `loading` && (e[ne] = n),
      n == null
        ? e.removeAttribute(t)
        : typeof n != `string` && ii(e).includes(t)
          ? (e[t] = n)
          : e.setAttribute(t, n)));
}
function ni(e) {
  return (e[re] ??= { [Qr]: e.nodeName.includes(`-`), [$r]: e.namespaceURI === Ce });
}
var ri = new Map();
function ii(e) {
  var t = e.getAttribute(`is`) || e.nodeName,
    n = ri.get(t);
  if (n) return n;
  ri.set(t, (n = []));
  for (var r, i = e, a = Element.prototype; a !== i;) {
    for (var s in ((r = o(i)), r))
      r[s].set && s !== `innerHTML` && s !== `textContent` && s !== `innerText` && n.push(s);
    i = l(i);
  }
  return n;
}
function ai(e, t, n = t) {
  var r = new WeakSet();
  (fn(e, `input`, async (i) => {
    var a = i ? e.defaultValue : e.value;
    if (((a = oi(e) ? si(a) : a), n(a), F !== null && r.add(F), await ar(), a !== (a = t()))) {
      var o = e.selectionStart,
        s = e.selectionEnd,
        c = e.value.length;
      if (((e.value = a ?? ``), s !== null)) {
        var l = e.value.length;
        o === s && s === c && l > c
          ? ((e.selectionStart = l), (e.selectionEnd = l))
          : ((e.selectionStart = o), (e.selectionEnd = Math.min(s, l)));
      }
    }
  }),
    ((A && e.defaultValue !== e.value) || (cr(t) == null && e.value)) &&
      (n(oi(e) ? si(e.value) : e.value), F !== null && r.add(F)),
    Cn(() => {
      var n = t();
      if (e === document.activeElement) {
        var i = Ie ? rt : F;
        if (r.has(i)) return;
      }
      (oi(e) && n === si(e.value)) ||
        (e.type === `date` && !n && !e.value) ||
        (n !== e.value && (e.value = n ?? ``));
    }));
}
function oi(e) {
  var t = e.type;
  return t === `number` || t === `range`;
}
function si(e) {
  return e === `` ? null : +e;
}
function ci(e, t) {
  return e === t || e?.[D] === t;
}
function li(e = {}, t, n, r) {
  var i = N.r,
    a = W;
  return (
    xn(() => {
      var o, s;
      return (
        Cn(() => {
          ((o = s),
            (s = r?.() || []),
            cr(() => {
              ci(n(...s), e) || (t(e, ...s), o && ci(n(...o), e) && t(null, ...o));
            }));
        }),
        () => {
          let r = a;
          for (; r !== i && r.parent !== null && r.parent.f & 33554432;) r = r.parent;
          let o = () => {
              s && ci(n(...s), e) && t(null, ...s);
            },
            c = r.teardown;
          r.teardown = () => {
            (o(), c?.());
          };
        }
      );
    }),
    e
  );
}
function ui(e, t, n, r) {
  var i = !Le || (n & 2) != 0,
    o = (n & 8) != 0,
    s = (n & 16) != 0,
    c = r,
    l = !0,
    u = void 0,
    d = () => (s && i ? ((u ??= kt(r)), K(u)) : (l && ((l = !1), (c = s ? cr(r) : r)), c));
  let f;
  if (o) {
    var p = D in e || O in e;
    f = a(e, t)?.set ?? (p && t in e ? (n) => (e[t] = n) : void 0);
  }
  var m,
    h = !1;
  (o ? ([m, h] = et(() => e[t])) : (m = e[t]),
    m === void 0 && r !== void 0 && ((m = d()), f && (i && _e(t), f(m))));
  var g = i
    ? () => {
        var n = e[t];
        return n === void 0 ? d() : ((l = !0), n);
      }
    : () => {
        var n = e[t];
        return (n !== void 0 && (c = void 0), n === void 0 ? c : n);
      };
  if (i && !(n & 4)) return g;
  if (f) {
    var _ = e.$$legacy;
    return function (e, t) {
      return arguments.length > 0 ? ((!i || !t || _ || h) && f(t ? g() : e), e) : g();
    };
  }
  var v = !1,
    y = (n & 1 ? kt : Nt)(() => ((v = !1), g()));
  o && K(y);
  var b = W;
  return function (e, t) {
    if (arguments.length > 0) {
      let n = t ? K(y) : i && o ? Jt(e) : e;
      return (R(y, n), (v = !0), c !== void 0 && (c = n), e);
    }
    return (Rn && v) || b.f & 16384 ? y.v : K(y);
  };
}
function di(e) {
  (N === null && ue(`onMount`),
    Le && N.l !== null
      ? fi(N).m.push(e)
      : vn(() => {
          let t = cr(e);
          if (typeof t == `function`) return t;
        }));
}
function fi(e) {
  var t = e.l;
  return (t.u ??= { a: [], b: [], m: [] });
}
typeof window < `u` && ((window.__svelte ??= {}).v ??= new Set()).add(`5`);
var pi = J(
    `<a href="/admin/" class="ghost nav-btn admin-topbar-link" target="_blank" rel="noreferrer">Administrace ↗</a>`,
  ),
  mi = J(
    `<header class="topbar"><div class="topbar-main"><div class="brand"><div class="mark" aria-hidden="true"><span></span> <span></span> <span></span></div> <div><p class="eyebrow">Caliber</p> <h1>Klinický registr variant</h1></div></div> <nav class="nav-links"><button type="button">Registr Variant</button> <button type="button">Klasifikace</button> <button type="button">Přehled databáze</button></nav> <div class="spacer"></div> <div class="topbar-actions"><!> <div class="user-chip"><span class="user-chip__label">Přihlášen</span> <span class="user-chip__value"> </span></div> <button type="button" class="ghost logout-btn">Odhlásit</button></div></div></header>`,
  );
function hi(e, t) {
  ze(t, !0);
  let n = ui(t, `isStaff`, 3, !1);
  var r = mi(),
    i = z(r),
    a = B(z(i), 2),
    o = z(a),
    s = B(o, 2),
    c = B(s, 2);
  M(a);
  var l = B(a, 4),
    u = z(l),
    d = (e) => {
      Y(e, pi());
    };
  Z(u, (e) => {
    n() && e(d);
  });
  var f = B(u, 2),
    p = B(z(f), 2),
    m = z(p, !0);
  (M(p), M(f));
  var h = B(f, 2);
  (M(l),
    M(i),
    M(r),
    V(() => {
      (Q(o, 1, `ghost nav-btn ${t.currentView === `registry` ? `active` : ``}`),
        Q(s, 1, `ghost nav-btn ${t.currentView === `batch` ? `active` : ``}`),
        Q(c, 1, `ghost nav-btn ${t.currentView === `dashboard` ? `active` : ``}`),
        X(m, t.userLabel));
    }),
    q(`click`, o, () => t.onviewchange(`registry`)),
    q(`click`, s, () => t.onviewchange(`batch`)),
    q(`click`, c, () => t.onviewchange(`dashboard`)),
    q(`click`, h, function (...e) {
      t.onlogout?.apply(this, e);
    }),
    Y(e, r),
    Be());
}
vr([`click`]);
var gi = J(`<a target="_blank" rel="noreferrer" class="clinvar-btn">Hledat na ClinVar ↗</a>`),
  _i = J(
    `<p class="warning">⚠️ ClinVar nepodporuje současné vyhledávání podle varianty i dbSNP. Odkaz výše upřednostňuje dbSNP.</p>`,
  ),
  vi = J(`<p class="error"> </p>`),
  yi = J(
    `<div><p class="label">Vyhledat podle varianty, genu, dbSNP nebo pacienta</p> <form class="search-form"><label class="field"><span>Varianta</span> <input type="text" placeholder="NM_004168.3:c.1396G>A nebo c.1396G>A"/></label> <label class="field"><span>Gen</span> <input type="text" placeholder="BRCA1"/></label> <label class="field"><span>dbSNP</span> <input type="text" placeholder="rs80357713"/></label> <label class="field"><span>Pacient ID</span> <input type="text" placeholder="např. 12345"/></label> <div class="actions"><button type="submit" class="ghost"> </button> <button type="button" class="ghost">Vymazat hledání</button> <!></div></form> <!> <!></div>`,
  );
function bi(e, t) {
  ze(t, !0);
  let n = ui(t, `variantQuery`, 15),
    r = ui(t, `geneQuery`, 15),
    i = ui(t, `dbsnpQuery`, 15),
    a = ui(t, `patientIdQuery`, 15);
  function o(e) {
    (e.preventDefault(), t.onsubmit());
  }
  let s = Mt(() => {
      let e = [],
        t = n().trim(),
        a = r().trim(),
        o = i().trim();
      if ((o ? e.push(o) : t && e.push(t), a && e.push(`${a}[Gene]`), e.length === 0)) return null;
      let s = e.join(` AND `);
      return `https://www.ncbi.nlm.nih.gov/clinvar/?term=${encodeURIComponent(s)}`;
    }),
    c = Mt(() => n().trim().length > 0 && i().trim().length > 0);
  var l = yi(),
    u = B(z(l), 2),
    d = z(u),
    f = B(z(d), 2);
  (ti(f), M(d));
  var p = B(d, 2),
    m = B(z(p), 2);
  (ti(m), M(p));
  var h = B(p, 2),
    g = B(z(h), 2);
  (ti(g), M(h));
  var _ = B(h, 2),
    v = B(z(_), 2);
  (ti(v), M(_));
  var y = B(_, 2),
    b = z(y),
    x = z(b, !0);
  M(b);
  var S = B(b, 2),
    C = B(S, 2),
    w = (e) => {
      var t = gi();
      (V(() => $(t, `href`, K(s))), Y(e, t));
    };
  (Z(C, (e) => {
    K(s) && e(w);
  }),
    M(y),
    M(u));
  var T = B(u, 2),
    E = (e) => {
      Y(e, _i());
    };
  Z(T, (e) => {
    K(c) && e(E);
  });
  var ee = B(T, 2),
    te = (e) => {
      var n = vi(),
        r = z(n, !0);
      (M(n), V(() => X(r, t.errorMessage)), Y(e, n));
    };
  (Z(ee, (e) => {
    t.errorMessage && e(te);
  }),
    M(l),
    V(() => {
      ((b.disabled = t.isSearching), X(x, t.isSearching ? `Hledání...` : `Vyhledat`));
    }),
    _r(`submit`, u, o),
    ai(f, n),
    ai(m, r),
    ai(g, i),
    ai(v, a),
    q(`click`, S, function (...e) {
      t.onclear?.apply(this, e);
    }),
    Y(e, l),
    Be());
}
vr([`click`]);
var xi = class extends Error {
  status;
  data;
  constructor(e, t, n) {
    (super(e), (this.name = `ApiError`), (this.status = t), (this.data = n));
  }
};
function Si() {
  if (typeof window < `u`) {
    let e = window.__CALIBER_BASE_PATH__;
    if (typeof e == `string` && e.length > 0) return e.replace(/\/+$/, ``);
    if (window.location.pathname.startsWith(`/caliber`)) return `/caliber`;
  }
  return ``;
}
function Ci(e) {
  return `${Si()}${e.startsWith(`/`) ? e : `/${e}`}`;
}
function wi(e) {
  let t = e.replace(/[.*+?^${}()|[\]\\]/g, `\\$&`),
    n = document.cookie.match(RegExp(`(?:^|;\\s*)${t}=([^;]*)`));
  return n ? decodeURIComponent(n[1]) : ``;
}
async function Ti(e) {
  let t = (e.headers.get(`content-type`) || ``).toLowerCase(),
    n = t.includes(`application/json`) || t.includes(`+json`);
  if (e.ok)
    return e.status === 204 || e.headers.get(`content-length`) === `0`
      ? null
      : n
        ? await e.json()
        : await e.text();
  if (n)
    try {
      let t = await e.json();
      throw new xi(Ei(t) || `Chyba požadavku (HTTP ${e.status})`, e.status, t);
    } catch (e) {
      if (e instanceof xi) throw e;
    }
  let r = Di(await e.text());
  throw e.status === 413
    ? new xi(
        `Soubor je příliš velký pro nahrání (HTTP 413 ${r || `Request Entity Too Large`}).`,
        e.status,
      )
    : e.status === 502 || e.status === 504
      ? new xi(
          `Server neodpovídá včas (HTTP ${e.status} ${r || `Gateway Timeout`}). Zpracování trvalo příliš dlouho.`,
          e.status,
        )
      : e.status === 403
        ? new xi(
            `Přístup odepřen nebo vypršela platnost relace (HTTP 403). Obnovte prosím stránku.`,
            e.status,
          )
        : new xi(
            r
              ? `Chyba serveru (${e.status}): ${r}`
              : `Neočekávaná odpověď serveru (HTTP ${e.status}).`,
            e.status,
          );
}
function Ei(e) {
  if (!e || typeof e != `object`) return null;
  let t = e.error || e.detail || e.message;
  return typeof t == `string` ? t : typeof t == `object` && t ? JSON.stringify(t) : null;
}
function Di(e) {
  if (!e) return ``;
  let t = e.match(/<title[^>]*>(.*?)<\/title>/is) || e.match(/<h1[^>]*>(.*?)<\/h1>/is);
  return t ? t[1].replace(/<[^>]+>/g, ``).trim() : ``;
}
var Oi = J(
    `<button type="button" class="clear-file" aria-label="Odebrat všechny soubory">Odebrat vše</button>`,
  ),
  ki = J(
    `<li class="file-item"><span> </span> <button type="button" class="remove-file">Odebrat</button></li>`,
  ),
  Ai = J(`<ul class="file-list"></ul>`),
  ji = J(`<p class="success"> </p>`),
  Mi = J(`<p class="error"> </p>`),
  Ni = J(
    `<div class="card hero"><h2>Nahrání Dat</h2> <p>Nahrajte Excel z vaší analýzy. Soubor bude zpracován a nahrán do databáze.</p> <div class="upload-panel"><div role="button" tabindex="0"><input class="file-input" type="file" accept=".xlsx,.xls" multiple=""/> <div class="dropzone-content"><span class="dropzone-title">Přetáhněte soubor nebo</span> <span class="browse-button">Vybrat soubor</span> <span class="dropzone-hint">Podporuje .xlsx, .xls</span></div> <div class="file-meta"><span class="file-name"> </span> <!></div> <!></div> <div class="hero-actions"><button type="button" class="ghost"> </button></div> <!> <!></div></div>`,
  );
function Pi(e, t) {
  ze(t, !0);
  let n = L(Jt([])),
    r = L(``),
    i = L(``),
    a = L(!1),
    o = L(!1),
    s = L(null),
    c = async () => {
      if ((R(r, ``), R(i, ``), K(n).length === 0)) {
        R(i, `Vyberte soubor pro nahrání.`);
        return;
      }
      let e = new FormData();
      (K(n).forEach((t) => e.append(`file`, t)), R(a, !0));
      try {
        let i = await fetch(Ci(`/api/upload/`), {
          method: `POST`,
          headers: { 'X-CSRFToken': wi(`csrftoken`) },
          body: e,
        });
        if (i.status === 401) {
          t.onunauthorized?.();
          return;
        }
        let a = await Ti(i);
        (a.filenames && a.filenames.length > 0
          ? R(r, `Nahráno souborů: ${a.filenames.length}.`)
          : a.filename
            ? R(r, `Soubor ${a.filename} byl nahrán.`)
            : R(r, `Soubor(y) byly nahrány.`),
          R(n, [], !0),
          K(s) && (K(s).value = ``));
      } catch (e) {
        R(i, e instanceof Error ? e.message : `Upload failed.`, !0);
      } finally {
        R(a, !1);
      }
    },
    l = (e) => {
      if (e.length === 0) return K(n);
      (R(r, ``), R(i, ``));
      let t = new Set(K(n).map((e) => `${e.name}-${e.size}-${e.lastModified}`)),
        a = [...K(n)];
      return (
        e.forEach((e) => {
          let n = `${e.name}-${e.size}-${e.lastModified}`;
          t.has(n) || (t.add(n), a.push(e));
        }),
        R(n, a, !0),
        a
      );
    },
    u = () => {
      (R(r, ``), R(i, ``), R(n, [], !0), K(s) && (K(s).value = ``));
    },
    d = (e) => {
      (R(
        n,
        K(n).filter((t, n) => n !== e),
        !0,
      ),
        K(n).length === 0 && u());
    },
    f = (e) => {
      let t = e.currentTarget;
      l(t.files ? Array.from(t.files) : []);
    },
    p = (e) => {
      (e.preventDefault(), R(o, !1));
      let t = l(e.dataTransfer?.files ? Array.from(e.dataTransfer.files) : []);
      if (K(s)) {
        let e = new DataTransfer();
        (t.forEach((t) => e.items.add(t)), (K(s).files = e.files));
      }
    },
    m = (e) => {
      (e.preventDefault(), R(o, !0));
    },
    h = () => {
      R(o, !1);
    },
    g = () => {
      K(s)?.click();
    },
    _ = (e) => {
      (e.key === `Enter` || e.key === ` `) && (e.preventDefault(), g());
    };
  var v = Ni(),
    y = B(z(v), 4),
    b = z(y),
    x = z(b);
  li(
    x,
    (e) => R(s, e),
    () => K(s),
  );
  var S = B(x, 4),
    C = z(S),
    w = z(C, !0);
  M(C);
  var T = B(C, 2),
    E = (e) => {
      var t = Oi();
      (q(`click`, t, (e) => {
        (e.stopPropagation(), u());
      }),
        Y(e, t));
    };
  (Z(T, (e) => {
    K(n).length > 0 && e(E);
  }),
    M(S));
  var ee = B(S, 2),
    te = (e) => {
      var t = Ai();
      (Fr(
        t,
        21,
        () => K(n),
        jr,
        (e, t, n) => {
          var r = ki(),
            i = z(r),
            a = z(i, !0);
          M(i);
          var o = B(i, 2);
          (M(r),
            V(() => {
              (X(a, K(t).name), $(o, `aria-label`, `Odebrat ${K(t).name}`));
            }),
            q(`click`, o, (e) => {
              (e.stopPropagation(), d(n));
            }),
            Y(e, r));
        },
      ),
        M(t),
        Y(e, t));
    };
  (Z(ee, (e) => {
    K(n).length > 0 && e(te);
  }),
    M(b));
  var D = B(b, 2),
    O = z(D),
    ne = z(O, !0);
  (M(O), M(D));
  var re = B(D, 2),
    ie = (e) => {
      var t = ji(),
        n = z(t, !0);
      (M(t), V(() => X(n, K(r))), Y(e, t));
    };
  Z(re, (e) => {
    K(r) && e(ie);
  });
  var ae = B(re, 2),
    oe = (e) => {
      var t = Mi(),
        n = z(t, !0);
      (M(t), V(() => X(n, K(i))), Y(e, t));
    };
  (Z(ae, (e) => {
    K(i) && e(oe);
  }),
    M(y),
    M(v),
    V(() => {
      (Q(b, 1, `dropzone ${K(o) ? `drag-active` : ``}`),
        X(w, K(n).length > 0 ? `Vybráno souborů: ${K(n).length}` : `Soubor nevybrán`),
        (O.disabled = K(a)),
        X(ne, K(a) ? `Nahrávám...` : `Nahrát soubor`));
    }),
    q(`click`, b, g),
    q(`keydown`, b, _),
    _r(`dragover`, b, m),
    _r(`dragleave`, b, h),
    _r(`drop`, b, p),
    q(`change`, x, f),
    q(`click`, O, c),
    Y(e, v),
    Be());
}
vr([`click`, `keydown`, `change`]);
var Fi = J(`<span class="report-badge"> </span>`),
  Ii = J(
    `<div class="detail-group"><span class="muted">Genetický report</span> <p><b> </b> <!></p></div>`,
  ),
  Li = J(`<div class="error delete-error"> </div>`),
  Ri = J(`<button type="button" class="btn-danger-outline">Smazat celý report</button>`),
  zi = J(
    `<div class="danger-actions"><button type="button" class="btn-danger-outline">Smazat tuto variantu</button> <!></div>`,
  ),
  Bi = J(
    `<br/><span class="confirm-note">Jelikož jde o jedinou variantu v reportu, bude odstraněn i samotný report.</span>`,
    1,
  ),
  Vi = J(
    `<div class="confirm-box"><div class="confirm-box-title">⚠️ Potvrzení smazání varianty</div> <p class="confirm-box-text">Opravdu si přejete smazat variantu <b> </b> pro pacienta <b> </b>? <!></p> <div class="confirm-buttons"><button type="button" class="btn-danger"> </button> <button type="button" class="ghost">Zrušit</button></div></div>`,
  ),
  Hi = J(
    `<div class="confirm-box"><div class="confirm-box-title">🚨 Potvrzení smazání celého reportu</div> <p class="confirm-box-text">Opravdu si přejete smazat celý report <b> </b> pro pacienta <b> </b>? <br/> <span class="confirm-note">Tato akce nenávratně smaže <b> </b> náležejících k tomuto reportu. Použijte při chybném nahrání souboru.</span></p> <div class="confirm-buttons"><button type="button" class="btn-danger"> </button> <button type="button" class="ghost">Zrušit</button></div></div>`,
  ),
  Ui = J(
    `<hr class="modal-divider"/> <div class="danger-zone"><div class="danger-zone-header"><h4>Správa záznamu</h4> <p class="muted">Smazání chybného záznamu nebo celého nahraného reportu.</p></div> <!> <!></div>`,
    1,
  ),
  Wi = J(
    `<div class="modal-backdrop" role="button" tabindex="0" aria-label="Zavřít modal"><div class="modal-content card" role="dialog" aria-modal="true" tabindex="-1"><div class="modal-header"><h3> </h3> <button type="button" class="close-btn ghost">✕</button></div> <div class="modal-body"><div class="detail-group"><span class="muted">Varianta (HGVS)</span> <p class="selectable mono-full"> </p></div> <div class="detail-group"><span class="muted">Pacient ID</span> <p class="selectable"> </p></div> <!> <div class="detail-group"><span class="muted">Komentář k variantě</span> <p> </p></div> <div class="detail-group"><span class="muted">Vytvořil</span> <p> </p></div> <!></div></div></div>`,
  );
function Gi(e, t) {
  ze(t, !0);
  function n(e) {
    return (
      document.body.appendChild(e),
      {
        destroy() {
          e.remove();
        },
      }
    );
  }
  let r = L(null),
    i = L(!1),
    a = L(``),
    o = async () => {
      if (t.variant.patient_variant_id) {
        (R(i, !0), R(a, ``));
        try {
          let e = await fetch(Ci(`/api/patient-variants/${t.variant.patient_variant_id}/`), {
              method: `DELETE`,
              headers: { 'X-CSRFToken': wi(`csrftoken`), Accept: `application/json` },
            }),
            n = await e.json().catch(() => ({}));
          if (!e.ok) throw Error(n.error || `Smazání varianty se nezdařilo.`);
          (t.ondeleted?.({
            type: `variant`,
            id: t.variant.patient_variant_id,
            message: n.message || `Varianta byla úspěšně smazána.`,
          }),
            t.onclose());
        } catch (e) {
          R(a, e instanceof Error ? e.message : `Smazání varianty se nezdařilo.`, !0);
        } finally {
          R(i, !1);
        }
      }
    },
    s = async () => {
      if (t.variant.report_id) {
        (R(i, !0), R(a, ``));
        try {
          let e = await fetch(Ci(`/api/reports/${t.variant.report_id}/`), {
              method: `DELETE`,
              headers: { 'X-CSRFToken': wi(`csrftoken`), Accept: `application/json` },
            }),
            n = await e.json().catch(() => ({}));
          if (!e.ok) throw Error(n.error || `Smazání reportu se nezdařilo.`);
          (t.ondeleted?.({
            type: `report`,
            id: t.variant.report_id,
            message: n.message || `Report byl úspěšně smazán.`,
          }),
            t.onclose());
        } catch (e) {
          R(a, e instanceof Error ? e.message : `Smazání reportu se nezdařilo.`, !0);
        } finally {
          R(i, !1);
        }
      }
    };
  var c = Wi(),
    l = z(c),
    u = z(l),
    d = z(u),
    f = z(d);
  M(d);
  var p = B(d, 2);
  M(u);
  var m = B(u, 2),
    h = z(m),
    g = B(z(h), 2),
    _ = z(g, !0);
  (M(g), M(h));
  var v = B(h, 2),
    y = B(z(v), 2),
    b = z(y, !0);
  (M(y), M(v));
  var x = B(v, 2),
    S = (e) => {
      var n = Ii(),
        r = B(z(n), 2),
        i = z(r),
        a = z(i, !0);
      M(i);
      var o = B(i, 2),
        s = (e) => {
          var n = Fi(),
            r = z(n);
          (M(n),
            V(() =>
              X(
                r,
                `obsahuje ${t.variant.report_variants_count ?? ``} ${t.variant.report_variants_count === 1 ? `variantu` : t.variant.report_variants_count >= 2 && t.variant.report_variants_count <= 4 ? `varianty` : `variant`}`,
              ),
            ),
            Y(e, n));
        };
      (Z(o, (e) => {
        t.variant.report_variants_count && e(s);
      }),
        M(r),
        M(n),
        V(() => X(a, t.variant.report_name)),
        Y(e, n));
    };
  Z(x, (e) => {
    t.variant.source === `clinic` && t.variant.report_name && e(S);
  });
  var C = B(x, 2),
    w = B(z(C), 2),
    T = z(w, !0);
  (M(w), M(C));
  var E = B(C, 2),
    ee = B(z(E), 2),
    te = z(ee, !0);
  (M(ee), M(E));
  var D = B(E, 2),
    O = (e) => {
      var n = Ui(),
        c = B(rn(n), 2),
        l = B(z(c), 2),
        u = (e) => {
          var t = Li(),
            n = z(t, !0);
          (M(t), V(() => X(n, K(a))), Y(e, t));
        };
      Z(l, (e) => {
        K(a) && e(u);
      });
      var d = B(l, 2),
        f = (e) => {
          var n = zi(),
            i = z(n),
            o = B(i, 2),
            s = (e) => {
              var t = Ri();
              (q(`click`, t, () => {
                (R(r, `report`), R(a, ``));
              }),
                Y(e, t));
            };
          (Z(o, (e) => {
            t.variant.report_id && e(s);
          }),
            M(n),
            q(`click`, i, () => {
              (R(r, `variant`), R(a, ``));
            }),
            Y(e, n));
        },
        p = (e) => {
          var n = Vi(),
            s = B(z(n), 2),
            c = B(z(s)),
            l = z(c);
          M(c);
          var u = B(c, 2),
            d = z(u, !0);
          M(u);
          var f = B(u, 2),
            p = (e) => {
              var t = Bi();
              (Ae(), Y(e, t));
            };
          (Z(f, (e) => {
            t.variant.report_variants_count === 1 && e(p);
          }),
            M(s));
          var m = B(s, 2),
            h = z(m),
            g = z(h, !0);
          M(h);
          var _ = B(h, 2);
          (M(m),
            M(n),
            V(() => {
              (X(l, `${t.variant.gene ?? ``} (${(t.variant.variant || `bez HGVS`) ?? ``})`),
                X(d, t.variant.patient_id),
                (h.disabled = K(i)),
                X(g, K(i) ? `Mažu...` : `Ano, smazat variantu`),
                (_.disabled = K(i)));
            }),
            q(`click`, h, o),
            q(`click`, _, () => {
              (R(r, null), R(a, ``));
            }),
            Y(e, n));
        },
        m = (e) => {
          var n = Hi(),
            o = B(z(n), 2),
            c = B(z(o)),
            l = z(c, !0);
          M(c);
          var u = B(c, 2),
            d = z(u, !0);
          M(u);
          var f = B(u, 4),
            p = B(z(f)),
            m = z(p);
          (M(p), Ae(), M(f), M(o));
          var h = B(o, 2),
            g = z(h),
            _ = z(g, !0);
          M(g);
          var v = B(g, 2);
          (M(h),
            M(n),
            V(() => {
              (X(l, t.variant.report_name),
                X(d, t.variant.patient_id),
                X(m, `všech ${t.variant.report_variants_count ?? ``} variant`),
                (g.disabled = K(i)),
                X(_, K(i) ? `Mažu...` : `Ano, smazat celý report`),
                (v.disabled = K(i)));
            }),
            q(`click`, g, s),
            q(`click`, v, () => {
              (R(r, null), R(a, ``));
            }),
            Y(e, n));
        };
      (Z(d, (e) => {
        K(r) === null ? e(f) : K(r) === `variant` ? e(p, 1) : K(r) === `report` && e(m, 2);
      }),
        M(c),
        Y(e, n));
    };
  (Z(D, (e) => {
    t.variant.source === `clinic` && t.variant.patient_variant_id && e(O);
  }),
    M(m),
    M(l),
    M(c),
    Vr(c, (e) => n?.(e)),
    V(() => {
      (X(
        f,
        `Detaily: ${t.variant.gene ?? ``} (${(t.variant.variant || `Neznámá varianta`) ?? ``})`,
      ),
        X(_, t.variant.variant || `—`),
        X(b, t.variant.patient_id),
        X(T, t.variant.comment || `Žádný komentář není k dispozici.`),
        X(te, t.variant.created_by));
    }),
    q(`click`, c, function (...e) {
      t.onclose?.apply(this, e);
    }),
    q(`keydown`, c, (e) => {
      e.key === `Escape` && t.onclose();
    }),
    q(`click`, l, (e) => e.stopPropagation()),
    q(`keydown`, l, (e) => e.stopPropagation()),
    q(`click`, p, function (...e) {
      t.onclose?.apply(this, e);
    }),
    Y(e, c),
    Be());
}
vr([`click`, `keydown`]);
function Ki(e) {
  return e == null || e === ``
    ? `—`
    : e === 1.5 || e === `1.5`
      ? `1-2`
      : e === 2.5 || e === `2.5`
        ? `2-3`
        : e === 3.5 || e === `3.5`
          ? `3-4`
          : e === 4.5 || e === `4.5`
            ? `4-5`
            : e === 0 || e === `0` || e === 0 || e === `0.0`
              ? `0`
              : String(e);
}
function qi(e) {
  if (e == null || e === ``) return `category`;
  let t = typeof e == `string` ? parseFloat(e) : e;
  return t === 0
    ? `category c0`
    : t === 1
      ? `category c1`
      : t === 1.5
        ? `category c1-2`
        : t === 2
          ? `category c2`
          : t === 2.5
            ? `category c2-3`
            : t === 3
              ? `category c3`
              : t === 3.5
                ? `category c3-4`
                : t === 4
                  ? `category c4`
                  : t === 4.5
                    ? `category c4-5`
                    : t === 5
                      ? `category c5`
                      : t === 6
                        ? `category c6`
                        : t === 7
                          ? `category c7`
                          : t === 8
                            ? `category c8`
                            : t === -1
                              ? `category c-1`
                              : `category`;
}
function Ji(e) {
  return e ? `https://www.ncbi.nlm.nih.gov/clinvar/variation/${e}` : `#`;
}
var Yi = J(
    `<p class="muted warning-banner">⚠️ Nenašli jsme shodu v klinických datech. Zobrazujeme referenční katalog ClinVar.</p>`,
  ),
  Xi = J(`<p class="muted">Shodující se varianty z vašeho datasetu</p>`),
  Zi = J(`<div class="row empty"><span class="muted">Žádná shoda</span></div>`),
  Qi = J(`<a target="_blank" rel="noreferrer"> </a>`),
  $i = J(`<span> </span>`),
  ea = J(
    `<div><span class="selectable"> </span> <div><span class="pill"> </span></div> <span class="selectable mono"> </span> <span class="selectable mono"> </span> <span> </span> <span> </span> <span> </span> <span> </span> <!> <div class="actions-cell"><button type="button" class="full-click-action-btn" title="Zobrazit detaily varianty"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0z"></path><circle cx="12" cy="12" r="3"></circle></svg></button></div></div>`,
  ),
  ta = J(
    `<div class="pagination-footer"><div class="info">Strana <b> </b> </div> <div class="actions"><button type="button" class="ghost">Předchozí</button> <button type="button" class="ghost">Další</button></div></div>`,
  ),
  na = J(
    `<div class="card list"><div class="list-head"><div><h2>Výsledky hledání</h2> <!></div> <button type="button" class="ghost">Obnovit</button></div> <div class="table"><div class="row head"><span>Pacient</span> <span>Gen</span> <span>Varianta</span> <span>dbSNP</span> <span>Chromozom</span> <span>Pozice</span> <span>Aktualizováno</span> <span>Kategorie</span> <span>ClinVar</span> <span>Detail</span></div> <!></div> <!></div> <!>`,
    1,
  );
function ra(e, t) {
  ze(t, !0);
  let n = L(null),
    r = (e) => {
      R(n, e, !0);
    },
    i = () => {
      R(n, null);
    },
    a = (e) => {
      if (!e) return `—`;
      let t = new Date(e);
      return Number.isNaN(t.getTime())
        ? `—`
        : `${String(t.getDate()).padStart(2, `0`)}-${String(t.getMonth() + 1).padStart(2, `0`)}-${String(t.getFullYear())}`;
    };
  var o = na(),
    s = rn(o),
    c = z(s),
    l = z(c),
    u = B(z(l), 2),
    d = (e) => {
      Y(e, Yi());
    },
    f = (e) => {
      Y(e, Xi());
    };
  (Z(u, (e) => {
    t.meta?.is_fallback ? e(d) : e(f, -1);
  }),
    M(l));
  var p = B(l, 2);
  M(c);
  var m = B(c, 2),
    h = B(z(m), 2),
    g = (e) => {
      Y(e, Zi());
    },
    _ = (e) => {
      var n = Tr();
      (Fr(
        rn(n),
        17,
        () => t.results,
        jr,
        (e, t) => {
          var n = ea(),
            i = z(n),
            o = z(i, !0);
          M(i);
          var s = B(i, 2),
            c = z(s),
            l = z(c, !0);
          (M(c), M(s));
          var u = B(s, 2),
            d = z(u, !0);
          M(u);
          var f = B(u, 2),
            p = z(f, !0);
          M(f);
          var m = B(f, 2),
            h = z(m, !0);
          M(m);
          var g = B(m, 2),
            _ = z(g, !0);
          M(g);
          var v = B(g, 2),
            y = z(v, !0);
          M(v);
          var b = B(v, 2),
            x = z(b, !0);
          M(b);
          var S = B(b, 2),
            C = (e) => {
              var n = Qi(),
                r = z(n, !0);
              (M(n),
                V(
                  (e, t, i) => {
                    (Q(n, 1, `${e ?? ``} clinvar-badge`), $(n, `href`, t), X(r, i));
                  },
                  [
                    () => qi(K(t).clinvar?.score),
                    () => Ji(K(t).clinvar?.id),
                    () => Ki(K(t).clinvar?.score) || ``,
                  ],
                ),
                Y(e, n));
            },
            w = (e) => {
              var n = $i(),
                r = z(n, !0);
              (M(n),
                V(
                  (e, t) => {
                    (Q(n, 1, e), X(r, t));
                  },
                  [() => Wr(qi(K(t).clinvar?.score)), () => Ki(K(t).clinvar?.score)],
                ),
                Y(e, n));
            };
          Z(S, (e) => {
            K(t).clinvar?.id ? e(C) : e(w, -1);
          });
          var T = B(S, 2),
            E = z(T);
          (M(T),
            M(n),
            V(
              (e, r, i) => {
                (Q(n, 1, `row ${K(t).source === `clinvar_catalog` ? `fallback-row` : ``}`),
                  X(o, K(t).patient_id),
                  X(l, K(t).gene),
                  $(u, `title`, K(t).variant || ``),
                  X(d, K(t).variant || `—`),
                  $(f, `title`, K(t).dbsnp || ``),
                  X(p, K(t).dbsnp || `—`),
                  X(h, K(t).chromosome || `—`),
                  X(_, K(t).position ?? `—`),
                  X(y, e),
                  Q(b, 1, r),
                  X(x, i));
              },
              [() => a(K(t).updated_at), () => Wr(qi(K(t).category)), () => Ki(K(t).category)],
            ),
            q(`click`, E, () => r(K(t))),
            Y(e, n));
        },
      ),
        Y(e, n));
    };
  (Z(h, (e) => {
    t.results.length === 0 ? e(g) : e(_, -1);
  }),
    M(m));
  var v = B(m, 2),
    y = (e) => {
      var n = ta(),
        r = z(n),
        i = B(z(r)),
        a = z(i, !0);
      M(i);
      var o = B(i);
      M(r);
      var s = B(r, 2),
        c = z(s),
        l = B(c, 2);
      (M(s),
        M(n),
        V(() => {
          (X(a, t.meta.current_page),
            X(
              o,
              ` z ${t.meta.total_pages ?? ``} (${t.meta.total_count ?? ``} celkem nalezených záznamů)`,
            ),
            (c.disabled = !t.meta.has_previous),
            (l.disabled = !t.meta.has_next));
        }),
        q(`click`, c, () => t.onpagechange(t.meta.current_page - 1)),
        q(`click`, l, () => t.onpagechange(t.meta.current_page + 1)),
        Y(e, n));
    };
  (Z(v, (e) => {
    t.meta && t.meta.total_pages > 1 && e(y);
  }),
    M(s));
  var b = B(s, 2),
    x = (e) => {
      Gi(e, {
        get variant() {
          return K(n);
        },
        onclose: i,
        ondeleted: (e) => {
          (t.ondeleted?.(e), t.onrefresh());
        },
      });
    };
  (Z(b, (e) => {
    K(n) && e(x);
  }),
    q(`click`, p, function (...e) {
      t.onrefresh?.apply(this, e);
    }),
    Y(e, o),
    Be());
}
vr([`click`]);
var ia = J(
    `<div class="file-meta"><span class="file-name"> </span> <button type="button" class="clear-file">Zrušit</button></div>`,
  ),
  aa = J(`<p class="error"> </p>`),
  oa = J(`<p class="success"> </p>`),
  sa = J(
    `<div class="batch-layout svelte-1o1ngk"><div class="card layout-panel svelte-1o1ngk"><div class="panel-head svelte-1o1ngk"><h2 class="svelte-1o1ngk">Automatická anotace a klasifikace</h2> <p class="muted">Nahrajte váš laboratorní Excel seznam variant. Systém se pokusí automaticky anotovat a klasifikovat jednotlivé varianty za pomocí interní a ClinVar databáze. Následně vám bude k dispozici stažený soubor s výsledky.</p></div> <form class="upload-panel"><div role="button" tabindex="0"><input type="file" id="batch-file-input" class="file-input" accept=".xlsx, .xls"/> <div class="dropzone-content"><span class="dropzone-title">Přetáhněte soubor sem nebo</span> <label for="batch-file-input" class="browse-button">Vybrat soubor</label> <span class="dropzone-hint">Podporován je pouze formát .xlsx, .xls</span></div></div> <!> <div class="actions"><button type="submit" class="ghost run-btn svelte-1o1ngk"> </button></div></form> <!> <!></div> <div class="card documentation-panel svelte-1o1ngk"><h3>Jak připravit vstupní soubor?</h3> <p class="muted">Aby parsovací engine na backendu dokázal varianty správně identifikovat, ujistěte se, že váš Excel splňuje následující kritéria:</p> <ul class="doc-list svelte-1o1ngk"><li class="svelte-1o1ngk"><strong>Názvy sloupců:</strong> Na pořadí sloupců v tabulce nezáleží. Systém v prvním řádku hledá klíčová slova: <div class="chips-info svelte-1o1ngk"><code class="svelte-1o1ngk">Gen</code> / <code class="svelte-1o1ngk">Gene</code> <code class="svelte-1o1ngk">Varianta</code> / <code class="svelte-1o1ngk">Variant</code> <code class="svelte-1o1ngk">dbSNP</code></div></li> <li class="svelte-1o1ngk"><strong>Identifikace podle dbSNP:</strong> Pokud je přítomen sloupec <code>dbSNP</code> (např. s hodnotou <code>rs13078881</code>), vyhledávání v ClinVar databázi je nejrychlejší a nejpřesnější.</li> <li class="svelte-1o1ngk"><strong>Identifikace podle HGVS:</strong> Pokud dbSNP chybí, systém se pokusí variantu spárovat kombinací názvu genu a HGVS zápisu (např. <code>c.1336G>C</code> nebo <code>p.Gly446Arg</code>).</li> <li class="svelte-1o1ngk"><strong>Výstupní data:</strong> Váš původní formát tabulky zůstane zcela nedotčen. Na konec pravé strany tabulky systém pouze připíjí nové sloupce: <code>System_Classification</code> (kategorie patogenity), <code>ClinVar_ID</code> a <code>Database_Match_Status</code>.</li></ul></div></div>`,
  );
function ca(e, t) {
  ze(t, !0);
  let n = L(!1),
    r = L(``),
    i = L(``),
    a = L(null),
    o = L(!1);
  function s(e) {
    let t = e.target;
    t.files && t.files.length > 0 && (R(a, t.files[0], !0), R(r, ``), R(i, ``));
  }
  function c(e) {
    (e.preventDefault(), R(o, !0));
  }
  function l() {
    R(o, !1);
  }
  function u(e) {
    if ((e.preventDefault(), R(o, !1), e.dataTransfer?.files && e.dataTransfer.files.length > 0)) {
      let t = e.dataTransfer.files[0];
      t.name.endsWith(`.xlsx`) || t.name.endsWith(`.xls`)
        ? (R(a, t, !0), R(r, ``), R(i, ``))
        : R(r, `Neplatný formát souboru. Nahrajte prosím soubor typu .xlsx, .xls (Excel).`);
    }
  }
  function d() {
    (R(a, null), R(r, ``), R(i, ``));
  }
  async function f(e) {
    if ((e.preventDefault(), !K(a))) return;
    (R(n, !0), R(r, ``), R(i, ``));
    let o = new FormData();
    o.append(`file`, K(a));
    try {
      let e = wi(`csrftoken`),
        n = await fetch(Ci(`/api/classify/`), {
          method: `POST`,
          body: o,
          headers: { 'X-CSRFToken': e },
        });
      if (!n.ok) {
        if (n.status === 401) {
          t.onunauthorized?.();
          return;
        }
        let e = await n.json().catch(() => ({}));
        throw Error(e.error || `Zpracování souboru selhalo.`);
      }
      let r = await n.blob(),
        s = window.URL.createObjectURL(r),
        c = document.createElement(`a`);
      ((c.href = s),
        (c.download = `klasifikace_${K(a).name}`),
        document.body.appendChild(c),
        c.click(),
        window.URL.revokeObjectURL(s),
        c.remove(),
        R(i, `Soubor byl úspěšně klasifikován a stažen.`),
        R(a, null));
    } catch (e) {
      R(r, e instanceof Error ? e.message : `Nastala neočekávaná chyba při zpracování.`, !0);
    } finally {
      R(n, !1);
    }
  }
  var p = sa(),
    m = z(p),
    h = B(z(m), 2),
    g = z(h),
    _ = z(g);
  (Ae(2), M(g));
  var v = B(g, 2),
    y = (e) => {
      var t = ia(),
        r = z(t),
        i = z(r);
      M(r);
      var o = B(r, 2);
      (M(t),
        V(
          (e) => {
            (X(i, `📄 ${K(a).name ?? ``} (${e ?? ``} KB)`), (o.disabled = K(n)));
          },
          [() => (K(a).size / 1024).toFixed(1)],
        ),
        q(`click`, o, d),
        Y(e, t));
    };
  Z(v, (e) => {
    K(a) && e(y);
  });
  var b = B(v, 2),
    x = z(b),
    S = z(x, !0);
  (M(x), M(b), M(h));
  var C = B(h, 2),
    w = (e) => {
      var t = aa(),
        n = z(t, !0);
      (M(t), V(() => X(n, K(r))), Y(e, t));
    };
  Z(C, (e) => {
    K(r) && e(w);
  });
  var T = B(C, 2),
    E = (e) => {
      var t = oa(),
        n = z(t, !0);
      (M(t), V(() => X(n, K(i))), Y(e, t));
    };
  (Z(T, (e) => {
    K(i) && e(E);
  }),
    M(m),
    Ae(2),
    M(p),
    V(() => {
      (Q(g, 1, `dropzone ${K(o) ? `drag-active` : ``}`),
        (x.disabled = !K(a) || K(n)),
        X(S, K(n) ? `Zpracovávám a porovnávám...` : `Spustit klasifikaci a stáhnout`));
    }),
    _r(`submit`, h, f),
    _r(`dragover`, g, c),
    _r(`dragleave`, g, l),
    _r(`drop`, g, u),
    q(`change`, _, s),
    Y(e, p),
    Be());
}
vr([`change`, `click`]);
var la = J(
    `<div class="clinvar-sync-pill svelte-1y1a8hs"><span class="pulse-dot svelte-1y1a8hs"></span> <span>ClinVar: <strong> </strong> </span></div>`,
  ),
  ua = J(
    `<div class="error-banner svelte-1y1a8hs"><p> </p> <button type="button" class="ghost">Zkusit znovu</button></div>`,
  ),
  da = J(
    `<div class="card loading-card svelte-1y1a8hs"><div class="spinner svelte-1y1a8hs"></div> <p class="muted">Počítám statistiky registru a výskyt variant...</p></div>`,
  ),
  fa = J(
    `<p class="muted empty-note svelte-1y1a8hs">V databázi zatím nejsou žádná klasifikovaná data.</p>`,
  ),
  pa = J(`<div></div>`),
  ma = J(
    `<div class="category-item svelte-1y1a8hs"><div class="category-badge-wrap svelte-1y1a8hs"><span> </span> <span class="category-title svelte-1y1a8hs"> </span></div> <div class="category-stats svelte-1y1a8hs"><span class="category-count svelte-1y1a8hs"><strong> </strong> var.</span> <span class="category-pct svelte-1y1a8hs"> </span></div></div>`,
  ),
  ha = J(`<span class="pill zygosity-pill svelte-1y1a8hs"> <strong> </strong> </span>`),
  ga = J(
    `<div class="distribution-bar svelte-1y1a8hs" title="Distribuce klasifikací"></div> <div class="category-list svelte-1y1a8hs"></div> <div class="zygosity-section svelte-1y1a8hs"><span class="section-microtitle svelte-1y1a8hs">Zastoupení zygosity:</span> <div class="zygosity-pills svelte-1y1a8hs"></div></div>`,
    1,
  ),
  _a = J(
    `<p class="muted empty-note svelte-1y1a8hs">V databázi zatím nejsou zaznamenány žádné geny.</p>`,
  ),
  va = J(
    `<div class="gene-item svelte-1y1a8hs"><div class="gene-rank svelte-1y1a8hs"></div> <div class="gene-info svelte-1y1a8hs"><div class="gene-row svelte-1y1a8hs"><span class="gene-symbol svelte-1y1a8hs"> </span> <span class="gene-patients svelte-1y1a8hs"><strong> </strong> <span class="muted"> </span></span></div> <div class="gene-bar-bg svelte-1y1a8hs"><div class="gene-bar-fill svelte-1y1a8hs"></div></div></div></div>`,
  ),
  ya = J(`<div class="genes-list svelte-1y1a8hs"></div>`),
  ba = J(
    `<div class="empty-state svelte-1y1a8hs"><p class="muted">Zatím nebyly zachyceny žádné rekurentní varianty sdílené mezi více pacienty.</p></div>`,
  ),
  xa = J(`<a target="_blank" rel="noreferrer" class="dbsnp-link mono-text svelte-1y1a8hs"> </a>`),
  Sa = J(`<span class="muted mono-text svelte-1y1a8hs">—</span>`),
  Ca = J(`<span> </span>`),
  wa = J(`<span class="muted">—</span>`),
  Ta = J(`<a target="_blank" rel="noreferrer"> </a>`),
  Ea = J(`<span class="muted">—</span>`),
  Da = J(
    `<tr class="svelte-1y1a8hs"><td class="svelte-1y1a8hs"><span class="gene-badge svelte-1y1a8hs"> </span></td><td class="svelte-1y1a8hs"><span class="mono-text svelte-1y1a8hs"> </span></td><td class="svelte-1y1a8hs"><!></td><td class="svelte-1y1a8hs"><span class="mono-text coord-pill svelte-1y1a8hs"> </span></td><td class="svelte-1y1a8hs"><span class="patient-count-badge svelte-1y1a8hs"><strong> </strong> </span></td><td class="svelte-1y1a8hs"><!></td><td class="svelte-1y1a8hs"><!></td></tr>`,
  ),
  Oa = J(
    `<div class="recurrent-table-wrap svelte-1y1a8hs"><table class="recurrent-table svelte-1y1a8hs"><thead><tr><th class="svelte-1y1a8hs">Gen</th><th class="svelte-1y1a8hs">HGVS c.</th><th class="svelte-1y1a8hs">dbSNP</th><th class="svelte-1y1a8hs">Genomická pozice</th><th class="svelte-1y1a8hs">Počet pacientů</th><th class="svelte-1y1a8hs">Interní třída</th><th class="svelte-1y1a8hs">ClinVar</th></tr></thead><tbody></tbody></table></div>`,
  ),
  ka = J(`<p class="muted empty-note svelte-1y1a8hs">Žádné importy zatím neproběhly.</p>`),
  Aa = J(
    `<div class="report-box svelte-1y1a8hs"><div class="report-box-header svelte-1y1a8hs"><span class="report-icon svelte-1y1a8hs">📄</span> <span class="report-filename svelte-1y1a8hs"> </span></div> <div class="report-box-meta svelte-1y1a8hs"><span>Pacient: <strong> </strong></span> <span>Varianty: <strong> </strong></span></div> <div class="report-box-footer svelte-1y1a8hs"><span class="muted date-text svelte-1y1a8hs"> </span> <span class="uploader-chip svelte-1y1a8hs"> </span></div></div>`,
  ),
  ja = J(`<div class="recent-reports-grid svelte-1y1a8hs"></div>`),
  Ma = J(
    `<div class="metrics-grid svelte-1y1a8hs"><div class="card metric-card svelte-1y1a8hs"><span class="metric-label svelte-1y1a8hs">Pacienti v registru</span> <h3 class="metric-value svelte-1y1a8hs"> </h3> <span class="metric-subtext svelte-1y1a8hs">Unikátní vyšetřované osoby</span></div> <div class="card metric-card svelte-1y1a8hs"><span class="metric-label svelte-1y1a8hs">Diagnostické reporty</span> <h3 class="metric-value svelte-1y1a8hs"> </h3> <span class="metric-subtext svelte-1y1a8hs">Importované soubory výsledků</span></div> <div class="card metric-card svelte-1y1a8hs"><span class="metric-label svelte-1y1a8hs">Zachycené varianty</span> <h3 class="metric-value svelte-1y1a8hs"> </h3> <span class="metric-subtext svelte-1y1a8hs">Všechna alelická pozorování</span></div> <div class="card metric-card svelte-1y1a8hs"><span class="metric-label svelte-1y1a8hs">Unikátní varianty</span> <h3 class="metric-value svelte-1y1a8hs"> </h3> <span class="metric-subtext svelte-1y1a8hs">Různé mutační pozice</span></div> <div class="card metric-card highlight svelte-1y1a8hs"><span class="metric-label svelte-1y1a8hs">Patogenní nálezy (Tř. 4–5)</span> <h3 class="metric-value svelte-1y1a8hs"> <small class="svelte-1y1a8hs"> </small></h3> <span class="metric-subtext svelte-1y1a8hs">Pacienti s klinickým záchytem</span></div></div> <div class="analytics-grid svelte-1y1a8hs"><div class="card analytics-panel svelte-1y1a8hs"><div class="panel-head"><div><h3>Klasifikace patogenity (ACMG)</h3> <p class="muted">Procentuální a početní zastoupení tříd patogenity v datech</p></div></div> <!></div> <div class="card analytics-panel svelte-1y1a8hs"><div class="panel-head"><div><h3>Nejčastěji mutované geny</h3> <p class="muted">Geny s nejvyšším počtem pacientů nesoucích variantu</p></div></div> <!></div></div> <div class="card table-card svelte-1y1a8hs"><div class="panel-head"><div><h3>Nejčastější rekurentní varianty v populaci</h3> <p class="muted">Varianty nalezené u více pacientů v kohortě (populační hotspoty a časté alely)</p></div></div> <!></div> <div class="card recent-reports-card svelte-1y1a8hs"><div class="panel-head"><div><h3>Poslední importované reporty</h3> <p class="muted">Přehled nedávno zpracovaných souborů a pacientů</p></div></div> <!></div>`,
    1,
  ),
  Na = J(
    `<div class="dashboard-page svelte-1y1a8hs"><div class="dashboard-header card svelte-1y1a8hs"><div class="header-info svelte-1y1a8hs"><span class="eyebrow">Statistický přehled</span> <h2 class="svelte-1y1a8hs">Přehled klinického registru a kohorty</h2> <p class="muted">Telemetrie databáze, patogenita nálezů a nejčastější genetické alterace v populaci pacientů.</p></div> <div class="header-actions svelte-1y1a8hs"><!> <button type="button" class="ghost refresh-btn svelte-1y1a8hs"> </button></div></div> <!> <!></div>`,
  );
function Pa(e, t) {
  ze(t, !0);
  let n = L(null),
    r = L(!0),
    i = L(``),
    a = async () => {
      (R(r, !0), R(i, ``));
      try {
        let e = await fetch(Ci(`/api/stats/`));
        if (e.status === 401) {
          t.onunauthorized?.();
          return;
        }
        if (!e.ok) throw Error(`Chyba při stahování statistik databáze.`);
        R(n, await e.json(), !0);
      } catch (e) {
        R(i, e instanceof Error ? e.message : `Nepodařilo se načíst data.`, !0);
      } finally {
        R(r, !1);
      }
    };
  di(() => {
    a();
  });
  var o = Na(),
    s = z(o),
    c = B(z(s), 2),
    l = z(c),
    u = (e) => {
      var t = la(),
        r = B(z(t), 2),
        i = B(z(r)),
        a = z(i);
      M(i);
      var o = B(i);
      (M(r),
        M(t),
        V(
          (e) => {
            (X(a, `${e ?? ``}M`),
              X(o, ` (Aktualizováno: ${K(n).summary.clinvar_last_updated ?? ``})`));
          },
          [() => (K(n).summary.total_clinvar_variants / 1e6).toFixed(2)],
        ),
        Y(e, t));
    };
  Z(l, (e) => {
    K(n)?.summary.clinvar_last_updated && e(u);
  });
  var d = B(l, 2),
    f = z(d, !0);
  (M(d), M(c), M(s));
  var p = B(s, 2),
    m = (e) => {
      var t = ua(),
        n = z(t),
        r = z(n, !0);
      M(n);
      var o = B(n, 2);
      (M(t), V(() => X(r, K(i))), q(`click`, o, a), Y(e, t));
    };
  Z(p, (e) => {
    K(i) && e(m);
  });
  var h = B(p, 2),
    g = (e) => {
      Y(e, da());
    },
    _ = (e) => {
      var t = Ma(),
        r = rn(t),
        i = z(r),
        a = B(z(i), 2),
        o = z(a, !0);
      (M(a), Ae(2), M(i));
      var s = B(i, 2),
        c = B(z(s), 2),
        l = z(c, !0);
      (M(c), Ae(2), M(s));
      var u = B(s, 2),
        d = B(z(u), 2),
        f = z(d, !0);
      (M(d), Ae(2), M(u));
      var p = B(u, 2),
        m = B(z(p), 2),
        h = z(m, !0);
      (M(m), Ae(2), M(p));
      var g = B(p, 2),
        _ = B(z(g), 2),
        v = z(_),
        y = B(v),
        b = z(y);
      (M(y), M(_), Ae(2), M(g), M(r));
      var x = B(r, 2),
        S = z(x),
        C = B(z(S), 2),
        w = (e) => {
          Y(e, fa());
        },
        T = (e) => {
          var t = ga(),
            r = rn(t);
          (Fr(
            r,
            21,
            () => K(n).categories_breakdown,
            jr,
            (e, t) => {
              var n = Tr(),
                r = rn(n),
                i = (e) => {
                  var n = pa();
                  (V(() => {
                    (Q(n, 1, `distribution-segment ${K(t).color_class ?? ``}`, `svelte-1y1a8hs`),
                      Zr(n, `width: ${K(t).percentage ?? ``}%`),
                      $(
                        n,
                        `title`,
                        `${K(t).label ?? ``}: ${K(t).count ?? ``} (${K(t).percentage ?? ``}%)`,
                      ));
                  }),
                    Y(e, n));
                };
              (Z(r, (e) => {
                K(t).percentage > 0 && e(i);
              }),
                Y(e, n));
            },
          ),
            M(r));
          var i = B(r, 2);
          (Fr(
            i,
            21,
            () => K(n).categories_breakdown,
            jr,
            (e, t) => {
              var n = ma(),
                r = z(n),
                i = z(r),
                a = z(i, !0);
              M(i);
              var o = B(i, 2),
                s = z(o, !0);
              (M(o), M(r));
              var c = B(r, 2),
                l = z(c),
                u = z(l),
                d = z(u, !0);
              (M(u), Ae(), M(l));
              var f = B(l, 2),
                p = z(f);
              (M(f),
                M(c),
                M(n),
                V(() => {
                  (Q(i, 1, `category ${K(t).color_class ?? ``}`, `svelte-1y1a8hs`),
                    X(a, K(t).category === null ? `—` : K(t).category),
                    X(s, K(t).label),
                    X(d, K(t).count),
                    X(p, `${K(t).percentage ?? ``}%`));
                }),
                Y(e, n));
            },
          ),
            M(i));
          var a = B(i, 2),
            o = B(z(a), 2);
          (Fr(
            o,
            21,
            () => K(n).zygosities_breakdown,
            jr,
            (e, t) => {
              var n = ha(),
                r = z(n),
                i = B(r),
                a = z(i, !0);
              M(i);
              var o = B(i);
              (M(n),
                V(() => {
                  (X(r, `${K(t).label ?? ``}: `),
                    X(a, K(t).count),
                    X(o, ` (${K(t).percentage ?? ``}%)`));
                }),
                Y(e, n));
            },
          ),
            M(o),
            M(a),
            Y(e, t));
        };
      (Z(C, (e) => {
        K(n).categories_breakdown.length === 0 ? e(w) : e(T, -1);
      }),
        M(S));
      var E = B(S, 2),
        ee = B(z(E), 2),
        te = (e) => {
          Y(e, _a());
        },
        D = (e) => {
          var t = ya();
          (Fr(
            t,
            21,
            () => K(n).top_genes,
            jr,
            (e, t, n) => {
              var r = va(),
                i = z(r);
              i.textContent = `#${n + 1}`;
              var a = B(i, 2),
                o = z(a),
                s = z(o),
                c = z(s, !0);
              M(s);
              var l = B(s, 2),
                u = z(l),
                d = z(u, !0);
              M(u);
              var f = B(u),
                p = B(f),
                m = z(p);
              (M(p), M(l), M(o));
              var h = B(o, 2),
                g = z(h);
              (M(h),
                M(a),
                M(r),
                V(() => {
                  (X(c, K(t).symbol),
                    X(d, K(t).patient_count),
                    X(
                      f,
                      ` ${K(t).patient_count === 1 ? `pacient` : K(t).patient_count < 5 ? `pacienti` : `pacientů`} `,
                    ),
                    X(m, `(${K(t).variant_count ?? ``} var.)`),
                    Zr(g, `width: ${K(t).percentage ?? ``}%`));
                }),
                Y(e, r));
            },
          ),
            M(t),
            Y(e, t));
        };
      (Z(ee, (e) => {
        K(n).top_genes.length === 0 ? e(te) : e(D, -1);
      }),
        M(E),
        M(x));
      var O = B(x, 2),
        ne = B(z(O), 2),
        re = (e) => {
          Y(e, ba());
        },
        ie = (e) => {
          var t = Oa(),
            r = z(t),
            i = B(z(r));
          (Fr(
            i,
            21,
            () => K(n).recurrent_variants,
            jr,
            (e, t) => {
              var n = Da(),
                r = z(n),
                i = z(r),
                a = z(i, !0);
              (M(i), M(r));
              var o = B(r),
                s = z(o),
                c = z(s, !0);
              (M(s), M(o));
              var l = B(o),
                u = z(l),
                d = (e) => {
                  var n = xa(),
                    r = z(n, !0);
                  (M(n),
                    V(() => {
                      ($(n, `href`, `https://www.ncbi.nlm.nih.gov/snp/${K(t).dbsnp ?? ``}`),
                        X(r, K(t).dbsnp));
                    }),
                    Y(e, n));
                },
                f = (e) => {
                  Y(e, Sa());
                };
              (Z(u, (e) => {
                K(t).dbsnp && K(t).dbsnp !== `—` ? e(d) : e(f, -1);
              }),
                M(l));
              var p = B(l),
                m = z(p),
                h = z(m);
              (M(m), M(p));
              var g = B(p),
                _ = z(g),
                v = z(_),
                y = z(v, !0);
              M(v);
              var b = B(v);
              (M(_), M(g));
              var x = B(g),
                S = z(x),
                C = (e) => {
                  var n = Ca(),
                    r = z(n, !0);
                  (M(n),
                    V(
                      (e) => {
                        (Q(n, 1, e, `svelte-1y1a8hs`), X(r, K(t).category));
                      },
                      [() => qi(K(t).category)],
                    ),
                    Y(e, n));
                },
                w = (e) => {
                  Y(e, wa());
                };
              (Z(S, (e) => {
                K(t).category !== null && K(t).category !== void 0 ? e(C) : e(w, -1);
              }),
                M(x));
              var T = B(x),
                E = z(T),
                ee = (e) => {
                  var n = Ta(),
                    r = z(n);
                  (M(n),
                    V(
                      (e, i) => {
                        ($(n, `href`, e),
                          Q(n, 1, `clinvar-badge ${i ?? ``}`, `svelte-1y1a8hs`),
                          $(
                            n,
                            `title`,
                            `Zobrazit v databázi NCBI ClinVar (ID ${K(t).clinvar_id ?? ``})`,
                          ),
                          X(
                            r,
                            `ClinVar ${(K(t).clinvar_classification === null ? `VCV` : K(t).clinvar_classification) ?? ``}`,
                          ));
                      },
                      [() => Ji(K(t).clinvar_id), () => qi(K(t).clinvar_classification)],
                    ),
                    Y(e, n));
                },
                te = (e) => {
                  Y(e, Ea());
                };
              (Z(E, (e) => {
                K(t).clinvar_id ? e(ee) : e(te, -1);
              }),
                M(T),
                M(n),
                V(() => {
                  (X(a, K(t).gene),
                    X(c, K(t).hgvs_c || `—`),
                    X(h, `${K(t).chromosome ?? ``}:${K(t).position ?? ``}`),
                    X(y, K(t).patient_count),
                    X(
                      b,
                      ` ${K(t).patient_count === 1 ? `pacient` : K(t).patient_count < 5 ? `pacienti` : `pacientů`}`,
                    ));
                }),
                Y(e, n));
            },
          ),
            M(i),
            M(r),
            M(t),
            Y(e, t));
        };
      (Z(ne, (e) => {
        K(n).recurrent_variants.length === 0 ? e(re) : e(ie, -1);
      }),
        M(O));
      var ae = B(O, 2),
        oe = B(z(ae), 2),
        se = (e) => {
          Y(e, ka());
        },
        ce = (e) => {
          var t = ja();
          (Fr(
            t,
            21,
            () => K(n).recent_reports,
            jr,
            (e, t) => {
              var n = Aa(),
                r = z(n),
                i = B(z(r), 2),
                a = z(i, !0);
              (M(i), M(r));
              var o = B(r, 2),
                s = z(o),
                c = B(z(s)),
                l = z(c, !0);
              (M(c), M(s));
              var u = B(s, 2),
                d = B(z(u)),
                f = z(d, !0);
              (M(d), M(u), M(o));
              var p = B(o, 2),
                m = z(p),
                h = z(m, !0);
              M(m);
              var g = B(m, 2),
                _ = z(g, !0);
              (M(g),
                M(p),
                M(n),
                V(() => {
                  ($(i, `title`, K(t).report_name),
                    X(a, K(t).report_name),
                    X(l, K(t).patient_name),
                    X(f, K(t).variants_count),
                    X(h, K(t).created_at),
                    X(_, K(t).created_by));
                }),
                Y(e, n));
            },
          ),
            M(t),
            Y(e, t));
        };
      (Z(oe, (e) => {
        K(n).recent_reports.length === 0 ? e(se) : e(ce, -1);
      }),
        M(ae),
        V(() => {
          (X(o, K(n).summary.total_patients),
            X(l, K(n).summary.total_reports),
            X(f, K(n).summary.total_patient_variants),
            X(h, K(n).summary.total_unique_variants),
            X(v, `${K(n).summary.pathogenic_patients ?? ``} `),
            X(b, `(${K(n).summary.pathogenic_patients_percentage ?? ``}%)`));
        }),
        Y(e, t));
    };
  (Z(h, (e) => {
    K(r) && !K(n) ? e(g) : K(n) && e(_, 1);
  }),
    M(o),
    V(() => {
      ((d.disabled = K(r)), X(f, K(r) ? `Načítání...` : `Obnovit data`));
    }),
    q(`click`, d, a),
    Y(e, o),
    Be());
}
vr([`click`]);
var Fa = J(
    `<div class="auth-shell"><section class="auth-card card auth-loading"><p class="eyebrow">Caliber</p> <h1>Načítám bezpečné přihlášení</h1> <p>Ověřuji aktivní session a připravuji přístup k registru.</p></section></div>`,
  ),
  Ia = J(
    `<div class="success-banner"><span> </span> <button type="button" class="close-banner">✕</button></div>`,
  ),
  La = J(`<section class="search"><!> <!></section> <!> <section class="grid"><!></section>`, 1),
  Ra = J(`<section class="batch-container"><!></section>`),
  za = J(`<section class="dashboard-container"><!></section>`),
  Ba = J(`<div class="page"><!> <!></div>`),
  Va = J(
    `<label class="field auth-field"><span>Přezdívka</span> <input type="text" placeholder="neurologie-tym" autocomplete="off" required=""/></label>`,
  ),
  Ha = J(
    `<label class="field auth-field"><span>Potvrzení hesla</span> <input type="password" autocomplete="new-password" required=""/></label>`,
  ),
  Ua = J(`<p class="success"> </p>`),
  Wa = J(`<p class="error"> </p>`),
  Ga = J(
    `<div class="auth-shell"><header class="auth-header"><h1>Caliber</h1></header> <section class="card auth-card"><div class="auth-switcher"><button type="button">Přihlášení</button> <button type="button">Registrace</button></div> <form class="auth-form"><label class="field auth-field"><span>E-mail</span> <input type="email" placeholder="lekar@nemocnice.cz" autocomplete="email" required=""/></label> <!> <label class="field auth-field"><span>Heslo</span> <input type="password" required=""/></label> <!> <button type="submit" class="ghost auth-submit"> </button></form> <!> <!></section></div>`,
  );
function Ka(e, t) {
  ze(t, !0);
  let n = L(``),
    r = L(``),
    i = L(``),
    a = L(``),
    o = L(!1),
    s = L(``),
    c = L(Jt([])),
    l = L(null),
    u = L(1),
    d = L(`registry`),
    f = L(`loading`),
    p = L(null),
    m = L(`login`),
    h = L(``),
    g = L(``),
    _ = L(``),
    v = L(``),
    y = L(``),
    b = L(``),
    x = L(!1),
    S = () => {
      let e = `; ${document.cookie}`.split(`; csrftoken=`);
      return (e.length === 2 && e.pop()?.split(`;`).shift()) || ``;
    },
    C = () => {
      (R(n, ``), R(r, ``), R(i, ``), R(a, ``), R(s, ``), R(c, [], !0), R(l, null), R(u, 1));
    },
    w = (e, t = ``) => {
      (R(p, e, !0), R(y, t, !0), R(b, ``), R(_, ``), R(v, ``), e || C());
    },
    T = () => {
      (w(null, `Vaše relace vypršela. Přihlaste se znovu.`), R(f, `ready`));
    },
    E = async () => {
      try {
        let e = await fetch(Ci(`/auth/status/`), { headers: { Accept: `application/json` } });
        if (!e.ok) throw Error(`Unable to load session state.`);
        let t = await e.json();
        w(t.authenticated ? t.user : null);
      } catch {
        w(null);
      } finally {
        R(f, `ready`);
      }
    },
    ee = async (e) => {
      (e.preventDefault(), R(b, ``), R(y, ``), R(x, !0));
      try {
        let e = Ci(K(m) === `login` ? `/auth/login/` : `/auth/register/`),
          t =
            K(m) === `login`
              ? { email: K(h).trim(), password: K(_) }
              : {
                  email: K(h).trim(),
                  username: K(g).trim(),
                  password: K(_),
                  password_confirm: K(v),
                },
          n = await fetch(e, {
            method: `POST`,
            headers: { 'Content-Type': `application/json`, 'X-CSRFToken': S() },
            body: JSON.stringify(t),
          }),
          r = await n.json().catch(() => ({}));
        if (!n.ok) throw Error(r.error || `Přihlášení se nezdařilo.`);
        (w(
          r.user,
          K(m) === `login` ? `Přihlášení proběhlo úspěšně.` : `Registrace proběhla úspěšně.`,
        ),
          R(d, `registry`));
      } catch (e) {
        R(b, e instanceof Error ? e.message : `Přihlášení se nezdařilo.`, !0);
      } finally {
        R(x, !1);
      }
    },
    te = async () => {
      try {
        await fetch(Ci(`/auth/logout/`), { method: `POST`, headers: { 'X-CSRFToken': S() } });
      } finally {
        w(null, `Byli jste odhlášeni.`);
      }
    },
    D = async (e = 1) => {
      if (!K(p)) {
        T();
        return;
      }
      (R(s, ``), R(u, e, !0));
      let t = new URLSearchParams({
        variant: K(n).trim(),
        gene: K(r).trim(),
        dbsnp: K(i).trim(),
        patient_id: K(a).trim(),
        page: String(e),
        per_page: `50`,
      });
      if (
        ![t.get(`variant`), t.get(`gene`), t.get(`dbsnp`), t.get(`patient_id`)].some(
          (e) => e && e.length > 0,
        )
      ) {
        (R(s, `Vyplňte alespoň jedno vyhledávací pole.`), R(c, [], !0), R(l, null));
        return;
      }
      R(o, !0);
      try {
        let e = await fetch(Ci(`/api/search/?${t.toString()}`));
        if (e.status === 401) {
          T();
          return;
        }
        if (!e.ok) throw Error(`Search failed. Please try again.`);
        let n = await e.json();
        (R(c, n.results, !0), R(l, n.meta, !0));
      } catch (e) {
        (R(s, e instanceof Error ? e.message : `Search failed.`, !0), R(c, [], !0), R(l, null));
      } finally {
        R(o, !1);
      }
    },
    O = L(``),
    ne = null,
    re = (e) => {
      (R(O, e.message, !0),
        ne && clearTimeout(ne),
        (ne = setTimeout(() => {
          R(O, ``);
        }, 6e3)),
        D(K(u)));
    },
    ie = () => {
      D(1);
    },
    ae = (e) => {
      D(e);
    };
  di(E);
  var oe = Tr(),
    se = rn(oe),
    ce = (e) => {
      Y(e, Fa());
    },
    le = (e) => {
      var t = Ba(),
        f = z(t);
      {
        let e = Mt(() => `${K(p).username} · ${K(p).email}`),
          t = Mt(() => K(p).is_staff || !1);
        hi(f, {
          get currentView() {
            return K(d);
          },
          onviewchange: (e) => R(d, e, !0),
          get userLabel() {
            return K(e);
          },
          get isStaff() {
            return K(t);
          },
          onlogout: te,
        });
      }
      var m = B(f, 2),
        h = (e) => {
          var t = La(),
            d = rn(t),
            f = z(d);
          (bi(f, {
            get isSearching() {
              return K(o);
            },
            get errorMessage() {
              return K(s);
            },
            onsubmit: ie,
            onclear: C,
            get variantQuery() {
              return K(n);
            },
            set variantQuery(e) {
              R(n, e, !0);
            },
            get geneQuery() {
              return K(r);
            },
            set geneQuery(e) {
              R(r, e, !0);
            },
            get dbsnpQuery() {
              return K(i);
            },
            set dbsnpQuery(e) {
              R(i, e, !0);
            },
            get patientIdQuery() {
              return K(a);
            },
            set patientIdQuery(e) {
              R(a, e, !0);
            },
          }),
            Pi(B(f, 2), { onunauthorized: T }),
            M(d));
          var p = B(d, 2),
            m = (e) => {
              var t = Ia(),
                n = z(t),
                r = z(n);
              M(n);
              var i = B(n, 2);
              (M(t), V(() => X(r, `✓ ${K(O) ?? ``}`)), q(`click`, i, () => R(O, ``)), Y(e, t));
            };
          Z(p, (e) => {
            K(O) && e(m);
          });
          var h = B(p, 2);
          (ra(z(h), {
            get results() {
              return K(c);
            },
            get meta() {
              return K(l);
            },
            onrefresh: () => D(K(u)),
            onpagechange: ae,
            ondeleted: re,
          }),
            M(h),
            Y(e, t));
        },
        g = (e) => {
          var t = Ra();
          (ca(z(t), { onunauthorized: T }), M(t), Y(e, t));
        },
        _ = (e) => {
          var t = za();
          (Pa(z(t), { onunauthorized: T }), M(t), Y(e, t));
        };
      (Z(m, (e) => {
        K(d) === `registry` ? e(h) : K(d) === `batch` ? e(g, 1) : K(d) === `dashboard` && e(_, 2);
      }),
        M(t),
        Y(e, t));
    },
    ue = (e) => {
      var t = Ga(),
        n = B(z(t), 2),
        r = z(n),
        i = z(r),
        a = B(i, 2);
      M(r);
      var o = B(r, 2),
        s = z(o),
        c = B(z(s), 2);
      (ti(c), M(s));
      var l = B(s, 2),
        u = (e) => {
          var t = Va(),
            n = B(z(t), 2);
          (ti(n),
            M(t),
            ai(
              n,
              () => K(g),
              (e) => R(g, e),
            ),
            Y(e, t));
        };
      Z(l, (e) => {
        K(m) === `register` && e(u);
      });
      var d = B(l, 2),
        f = B(z(d), 2);
      (ti(f), M(d));
      var p = B(d, 2),
        S = (e) => {
          var t = Ha(),
            n = B(z(t), 2);
          (ti(n),
            M(t),
            ai(
              n,
              () => K(v),
              (e) => R(v, e),
            ),
            Y(e, t));
        };
      Z(p, (e) => {
        K(m) === `register` && e(S);
      });
      var C = B(p, 2),
        w = z(C, !0);
      (M(C), M(o));
      var T = B(o, 2),
        E = (e) => {
          var t = Ua(),
            n = z(t, !0);
          (M(t), V(() => X(n, K(y))), Y(e, t));
        };
      Z(T, (e) => {
        K(y) && e(E);
      });
      var te = B(T, 2),
        D = (e) => {
          var t = Wa(),
            n = z(t, !0);
          (M(t), V(() => X(n, K(b))), Y(e, t));
        };
      (Z(te, (e) => {
        K(b) && e(D);
      }),
        M(n),
        M(t),
        V(() => {
          (Q(i, 1, `ghost auth-toggle ${K(m) === `login` ? `active` : ``}`),
            Q(a, 1, `ghost auth-toggle ${K(m) === `register` ? `active` : ``}`),
            $(f, `autocomplete`, K(m) === `login` ? `current-password` : `new-password`),
            (C.disabled = K(x)),
            X(w, K(x) ? `Zpracovávám...` : K(m) === `login` ? `Přihlásit se` : `Vytvořit účet`));
        }),
        q(`click`, i, () => R(m, `login`)),
        q(`click`, a, () => R(m, `register`)),
        _r(`submit`, o, ee),
        ai(
          c,
          () => K(h),
          (e) => R(h, e),
        ),
        ai(
          f,
          () => K(_),
          (e) => R(_, e),
        ),
        Y(e, t));
    };
  (Z(se, (e) => {
    K(f) === `loading` ? e(ce) : K(p) ? e(le, 1) : e(ue, -1);
  }),
    Y(e, oe),
    Be());
}
(vr([`click`]), Er(Ka, { target: document.getElementById(`svelte-app`) }));
