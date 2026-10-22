'use strict';
(() => {
  const M = window.DemoMath;
  if (!M) return;
  const $ = id => document.getElementById(id);
  const text = (id,value) => { const el = $(id); if (el) el.textContent = value; };
  const listen = (ids, event, fn) => ids.forEach(id => $(id)?.addEventListener(event, fn));
  const n = id => Number($(id).value);
  const mean = arr => arr.reduce((a,b)=>a+b,0)/arr.length;
  const points = (xs,x,y) => xs.map((v,i)=>`${x(i).toFixed(2)},${y(v).toFixed(2)}`).join(' ');
  function faceDemo() {
    function render() {
      const result = M.matchEmbedding($('face-sample').value,n('face-noise'),n('face-threshold'));
      text('face-noise-value',`${n('face-noise')}%`); text('face-threshold-value',n('face-threshold').toFixed(2));
      text('face-result',result.matched ? `등록 샘플 ${result.matched}와 매칭` : '미등록 입력으로 처리');
      text('face-result-detail',`가장 가까운 거리 ${result.ranks[0].distance.toFixed(3)} / 임계값 ${result.threshold.toFixed(2)}`);
      $('face-distances').replaceChildren();
      result.ranks.forEach(row => {
        const line = document.createElement('div'); line.className='distance-row';
        const label=document.createElement('span');label.textContent=`샘플 ${row.id}`;
        const bar=document.createElement('div');bar.className='distance-track';
        const fill=document.createElement('span');fill.style.width=`${Math.min(100,row.distance/2*100)}%`;bar.append(fill);
        const value=document.createElement('span');value.textContent=row.distance.toFixed(3);
        line.append(label,bar,value);$('face-distances').append(line);
      });
      $('face-vector').replaceChildren();
      result.query.forEach((value,i) => {
        const bar=document.createElement('span');bar.style.height=`${Math.max(3,Math.abs(value)*72)}px`;
        bar.title=`성분 ${i+1}: ${value.toFixed(3)}`;$('face-vector').append(bar);
      });
    }
    listen(['face-sample'],'change',render);listen(['face-noise','face-threshold'],'input',render);render();
  }
  function fakeDemo() {
    for(let i=1;i<=8;i++){
      const b=document.createElement('button');b.type='button';b.className='frame-button';b.textContent=`F${i}`;b.setAttribute('aria-label',`${i}번 프레임 보기`);
      b.addEventListener('click',()=>{$('fake-frame').value=i;render();});$('fake-frames').append(b);
    }
    function render() {
      const scores=M.frameSets[$('fake-sample').value], threshold=n('fake-threshold'), selected=n('fake-frame')-1;
      const summary=M.scoreSummary(scores,threshold);
      text('fake-threshold-value',threshold.toFixed(2));text('fake-frame-value',`${selected+1} / 8`);
      text('fake-selected',scores[selected].toFixed(2));
      text('fake-verdict',scores[selected]>=threshold?'예시 점수가 검토 임계값 이상입니다.':'예시 점수가 검토 임계값 미만입니다.');
      text('fake-mean',summary.mean.toFixed(2));text('fake-count',`${summary.count} / 8`);
      const x=i=>45+i*510/7,y=v=>210-v*175;
      let markup='<title>가상 프레임 점수 비교</title><desc>프레임별 예시 점수와 선택한 검토 임계값입니다. 실제 모델 결과가 아닙니다.</desc>';
      [0,.25,.5,.75,1].forEach(v=>{markup+=`<line class="gridline" x1="45" x2="570" y1="${y(v)}" y2="${y(v)}"/><text x="10" y="${y(v)+4}">${v.toFixed(2)}</text>`;});
      markup+=`<line class="threshold" x1="45" x2="570" y1="${y(threshold)}" y2="${y(threshold)}"/><polyline class="line-main" points="${points(scores,x,y)}"/>`;
      scores.forEach((v,i)=>{markup+=`<circle class="dot" cx="${x(i)}" cy="${y(v)}" r="${i===selected?6:3}"/><text x="${x(i)-9}" y="239">F${i+1}</text>`;});
      $('fake-chart').innerHTML=markup;
      Array.from($('fake-frames').children).forEach((b,i)=>b.setAttribute('aria-pressed',String(i===selected)));
    }
    listen(['fake-sample'],'change',render);listen(['fake-threshold','fake-frame'],'input',render);render();
  }
  function recordDemo() {
    const samples={
      A:{input:'장소: 교육관 1층.\n상황: 현장 관계자가 도움을 요청했습니다.\n전달사항: 안내 담당자가 출입구에서 대기 중입니다.',summary:'교육관 1층에서 도움 요청이 전달되었으며, 안내 담당자는 출입구에서 대기 중입니다.',keywords:['교육관 1층','도움 요청','출입구 대기'],location:'교육관 1층'},
      B:{input:'장소: 행사장 안내 데스크.\n상황: 현장 담당자가 상황 전달을 요청했습니다.\n전달사항: 이동 경로와 연락 담당자를 확인했습니다.',summary:'행사장 안내 데스크에서 상황 전달을 요청했고, 이동 경로와 연락 담당자를 확인했습니다.',keywords:['행사장','상황 전달','연락 담당자'],location:'행사장 안내 데스크'},
      C:{input:'장소: 체육관 정문.\n상황: 현장 안내자가 추가 정보를 전달했습니다.\n전달사항: 출입 위치가 정문으로 정리되었습니다.',summary:'체육관 현장 안내자가 추가 정보를 전달했으며, 출입 위치는 정문으로 정리되었습니다.',keywords:['체육관','추가 정보','정문'],location:'체육관 정문'}
    };
    function reset(){
      $('record-input').value=samples[$('record-sample').value].input;
      $('record-steps').classList.remove('processed');
      text('record-summary','사례를 선택하고 처리 흐름을 확인하세요.');
      $('record-keywords').replaceChildren();const li=document.createElement('li');li.textContent='예시 출력 대기';$('record-keywords').append(li);
      text('record-json','{ "status": "ready" }');text('record-status','');
    }
    $('record-sample').addEventListener('change',reset);
    $('record-input').addEventListener('input',()=>{
      $('record-steps').classList.remove('processed');text('record-summary','입력이 변경되었습니다. 처리 흐름 버튼을 눌러 확인하세요.');
      $('record-keywords').replaceChildren();text('record-json','{ "status": "input_changed" }');text('record-status','');
    });
    $('record-run').addEventListener('click',()=>{
      const id=$('record-sample').value,s=samples[id],input=$('record-input').value.trim();
      if(!input){text('record-status','가상 사례를 선택하거나 텍스트를 입력해 주세요.');$('record-input').focus();return;}
      $('record-steps').classList.add('processed');$('record-keywords').replaceChildren();
      if(input!==s.input.trim()){
        text('record-summary','직접 입력한 문장입니다. 이 데모는 새로운 문장에 대한 AI 요약이나 분류를 수행하지 않습니다.');
        text('record-json',JSON.stringify({status:'custom_input',character_count:input.length,model_connected:false},null,2));
        text('record-status','입력 길이만 계산했습니다. 문장은 서버로 전송되지 않습니다.');return;
      }
      text('record-summary',s.summary);
      s.keywords.forEach(k=>{const li=document.createElement('li');li.textContent=k;$('record-keywords').append(li);});
      text('record-json',JSON.stringify({sample_id:id,location:s.location,label:`가상 기록 ${id} (임상 등급 아님)`,model_connected:false},null,2));
      text('record-status','미리 준비된 예시 출력을 표시했습니다.');
    });reset();
  }
  function salesDemo() {
    let state;
    function render() {
      const values=M.syntheticSeries($('sales-scenario').value), train=values.slice(0,35), actual=values.slice(35), predicted=M.forecast(train,$('sales-model').value,7), metrics=M.errors(actual,predicted);
      state={values,predicted};
      text('sales-mae',metrics.mae.toFixed(2));text('sales-rmse',metrics.rmse.toFixed(2));
      text('sales-caption',`평가 구간의 평균 가상 판매량은 ${mean(actual).toFixed(1)}개입니다. 오차의 단위도 판매량과 같은 '개'입니다.`);
      const top=Math.ceil(Math.max(...values,...predicted)/20)*20+20,x=i=>46+i*545/41,y=v=>244-v/top*211;
      let markup='<title>가상 판매량과 기준선 예측</title><desc>앞 35일만 이용해 마지막 7일을 예측합니다. 음영 구간은 평가 데이터입니다.</desc>';
      markup+=`<rect class="zone" x="${x(34.5)}" y="20" width="${600-x(34.5)}" height="225"/>`;
      for(let v=0;v<=top;v+=Math.ceil(top/4/10)*10)markup+=`<line class="gridline" x1="46" x2="600" y1="${y(v)}" y2="${y(v)}"/><text x="6" y="${y(v)+4}">${v}</text>`;
      [0,6,13,20,27,34,41].forEach(i=>markup+=`<text x="${x(i)-8}" y="269">${i+1}</text>`);
      markup+=`<text x="51" y="20">판매량(개)</text><text x="553" y="286">일차</text><polyline class="line-main" points="${points(values,x,y)}"/><polyline class="line-secondary" points="${points(predicted,i=>x(i+35),y)}"/><line class="threshold" x1="${x(34.5)}" x2="${x(34.5)}" y1="20" y2="244"/>`;
      $('sales-chart').innerHTML=markup;
    }
    listen(['sales-scenario','sales-model'],'change',render);
    $('sales-download').addEventListener('click',()=>{
      const lines=['day,split,synthetic_sales,baseline_prediction'];
      state.values.forEach((value,i)=>lines.push(`${i+1},${i<35?'train':'test'},${value},${i<35?'':state.predicted[i-35].toFixed(4)}`));
      const blob=new Blob(['\ufeff'+lines.join('\r\n')],{type:'text/csv;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');
      a.href=url;a.download='synthetic-sales-forecast.csv';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
    });render();
  }
  const slug=document.body.dataset.project;
  ({'face-recognition':faceDemo,'deepfake-detection':fakeDemo,'emergency-assistant':recordDemo,'sales-forecasting':salesDemo}[slug])?.();
})();
