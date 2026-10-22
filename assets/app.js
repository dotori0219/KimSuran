'use strict';
(() => {
  const root = document.documentElement;
  const cfg = window.PORTFOLIO_CONFIG || {};
  const toggle = document.querySelector('.theme-button');
  function syncTheme() {
    if (toggle) toggle.setAttribute('aria-label', root.dataset.theme === 'light' ? '어두운 테마로 전환' : '밝은 테마로 전환');
  }
  syncTheme();
  toggle?.addEventListener('click', () => {
    root.dataset.theme = root.dataset.theme === 'light' ? 'dark' : 'light';
    try { localStorage.setItem('suran-theme', root.dataset.theme); } catch (_) { /* 저장 차단 시에도 전환 가능 */ }
    syncTheme();
  });
  const menu = document.querySelector('.menu-button');
  const nav = document.querySelector('.site-nav');
  function closeMenu() {
    nav?.classList.remove('is-open');
    menu?.setAttribute('aria-expanded', 'false');
    menu?.setAttribute('aria-label', '메뉴 열기');
  }
  menu?.addEventListener('click', () => {
    const open = nav.classList.toggle('is-open');
    menu.setAttribute('aria-expanded', String(open));
    menu.setAttribute('aria-label', open ? '메뉴 닫기' : '메뉴 열기');
  });
  nav?.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });
  const media = matchMedia('(min-width: 761px)');
  media.addEventListener('change', e => { if (e.matches) closeMenu(); });
  const filters = document.querySelectorAll('[data-filter]');
  filters.forEach(button => button.addEventListener('click', () => {
    const target = button.dataset.filter;
    filters.forEach(b => b.setAttribute('aria-pressed', String(b === button)));
    let count = 0;
    document.querySelectorAll('[data-category]').forEach(card => {
      card.hidden = target !== 'all' && card.dataset.category !== target;
      if (!card.hidden) count++;
    });
    const status = document.getElementById('filter-status');
    if (status) status.textContent = `${count}개의 프로젝트가 표시되었습니다.`;
  }));
  let toastTimer;
  function toast(message) {
    const box = document.getElementById('toast');
    if (!box) return;
    box.textContent = message; box.hidden = false;
    clearTimeout(toastTimer); toastTimer = setTimeout(() => { box.hidden = true; }, 3200);
  }
  document.querySelectorAll('[data-copy-email]').forEach(button => button.addEventListener('click', async () => {
    const value = 'suran0219@gmail.com';
    try { await navigator.clipboard.writeText(value); toast('이메일 주소를 복사했습니다.'); }
    catch (_) {
      const tmp = document.createElement('textarea'); tmp.value = value;
      tmp.style.cssText = 'position:fixed;left:-9999px'; document.body.append(tmp); tmp.select();
      let ok = false; try { ok = document.execCommand('copy'); } catch (_) {}
      tmp.remove(); toast(ok ? '이메일 주소를 복사했습니다.' : '이메일 주소를 직접 선택해 복사해 주세요.');
      button.focus();
    }
  }));
  function validExternal(url) {
    try { const u = new URL(url); return u.protocol === 'https:'; } catch (_) { return false; }
  }
  function bindLink(selector, value) {
    if (!value || !validExternal(value)) return;
    document.querySelectorAll(selector).forEach(a => { a.href = value; a.hidden = false; });
  }
  bindLink('[data-github]', cfg.githubUrl);
  bindLink('[data-notion]', cfg.notionUrl);
  const slug = document.body.dataset.project;
  const links = cfg.projects?.[slug];
  if (links) { bindLink('[data-repository]', links.repositoryUrl); bindLink('[data-external-demo]', links.demoUrl); }
  const photo = document.getElementById('profile-photo');
  if (photo && cfg.profilePhoto) {
    // 로컬 상대 경로 또는 HTTPS 이미지만 허용합니다.
    const path = String(cfg.profilePhoto);
    if (/^(assets\/[^?#]+\.(?:jpe?g|png|webp)|https:\/\/)/i.test(path)) {
      const img = new Image();
      img.onload = () => { photo.src = path; photo.alt = '김수란 프로필 사진'; };
      img.onerror = () => { /* 파일 미등록 시 기본 자리표시자를 유지합니다. */ };
      img.src = path;
    }
  }
  document.querySelectorAll('[data-year]').forEach(el => { el.textContent = new Date().getFullYear(); });
})();
