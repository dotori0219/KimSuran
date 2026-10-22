/* 브라우저 데모용 순수 수학 함수. 학습 모델이나 모델 가중치를 포함하지 않습니다. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.DemoMath = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  function assertSeries(xs, nonempty = true) {
    if (!Array.isArray(xs) || (nonempty && !xs.length) || xs.some(x => !Number.isFinite(x))) throw new TypeError('유한한 숫자 배열이 필요합니다.');
  }
  function normalize(v) {
    assertSeries(v); const norm = Math.hypot(...v);
    if (!norm) throw new RangeError('영벡터는 정규화할 수 없습니다.');
    return v.map(x => x / norm);
  }
  function distance(a, b) {
    assertSeries(a); assertSeries(b);
    if (a.length !== b.length) throw new RangeError('벡터의 차원이 다릅니다.');
    return Math.sqrt(a.reduce((s, x, i) => s + (x - b[i]) ** 2, 0));
  }
  const vectors = {
    A: normalize([.9,.17,.08,.13,.07,.06,.11,.09]),
    B: normalize([.06,.09,.12,.91,.16,.08,.1,.05]),
    C: normalize([.08,.08,.05,.11,.09,.14,.9,.18])
  };
  function matchEmbedding(key, noise, threshold) {
    if (!['A','B','unknown'].includes(key)) throw new RangeError('알 수 없는 가상 입력입니다.');
    if (!Number.isFinite(noise) || noise < 0 || noise > 100 || !Number.isFinite(threshold) || threshold < 0) throw new RangeError('매개변수 범위를 확인하세요.');
    const base = key === 'unknown' ? normalize([.35,.36,.38,.34,.39,.33,.37,.31]) : vectors[key];
    const perturb = [.09,.78,.66,.08,.73,.59,.07,.65];
    const mix = noise / 100;
    const query = normalize(base.map((v, i) => v * (1 - mix * .6) + perturb[i] * mix * .65));
    const ranks = Object.entries(vectors).map(([id, v]) => ({ id, distance: distance(query, v) })).sort((a,b) => a.distance - b.distance);
    return { query, ranks, matched: ranks[0].distance <= threshold ? ranks[0].id : null, threshold };
  }
  const frameSets = {
    low: [.08,.12,.09,.16,.13,.17,.11,.1],
    high: [.68,.74,.79,.83,.71,.89,.82,.76],
    mixed: [.16,.24,.51,.7,.78,.57,.31,.18]
  };
  function scoreSummary(scores, threshold) {
    assertSeries(scores);
    if (scores.some(x => x < 0 || x > 1) || !Number.isFinite(threshold) || threshold < 0 || threshold > 1) throw new RangeError('0–1 범위의 점수가 필요합니다.');
    return { mean: scores.reduce((a,b) => a+b, 0) / scores.length, count: scores.filter(v => v >= threshold).length };
  }
  function syntheticSeries(scenario) {
    if (!['seasonal','trend','volatile'].includes(scenario)) throw new RangeError('알 수 없는 시나리오입니다.');
    const week = [-10,-5,1,6,15,23,-3];
    return Array.from({length:42}, (_,i) => {
      let v = 94 + week[i%7] + 3*Math.sin(i*1.43);
      if (scenario === 'trend') v += i*1.2;
      if (scenario === 'volatile') v += 16*Math.sin(i*2.11) + 9*Math.cos(i*.7);
      return Math.max(0, Math.round(v));
    });
  }
  function forecast(train, kind, horizon = 7) {
    assertSeries(train);
    if (train.length < 7 || !Number.isInteger(horizon) || horizon < 1 || horizon > 365) throw new RangeError('최소 7개 학습값과 올바른 예측 길이가 필요합니다.');
    const week = train.slice(-7);
    if (kind === 'mean') return Array(horizon).fill(week.reduce((a,b) => a+b,0)/7);
    if (kind === 'seasonal') return Array.from({length:horizon}, (_,i) => week[i%7]);
    throw new RangeError('지원하지 않는 기준선입니다.');
  }
  function errors(actual, predicted) {
    assertSeries(actual); assertSeries(predicted);
    if (actual.length !== predicted.length) throw new RangeError('실제값과 예측값의 길이가 다릅니다.');
    const residuals = actual.map((v,i) => v-predicted[i]);
    return {mae:residuals.reduce((s,x) => s+Math.abs(x),0)/actual.length, rmse:Math.sqrt(residuals.reduce((s,x) => s+x*x,0)/actual.length)};
  }
  return Object.freeze({normalize,distance,matchEmbedding,frameSets,scoreSummary,syntheticSeries,forecast,errors});
});
