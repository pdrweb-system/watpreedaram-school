/* ==================================================================
   การทำงานของเว็บไซต์ — ปกติไม่ต้องแก้ไฟล์นี้
   ข้อมูลที่แสดงบนเว็บ (ข่าว ครู ฝ่ายงาน ติดต่อ แผนที่) แก้ที่ไฟล์ data.js
   ------------------------------------------------------------------
   ไฟล์นี้โหลดก่อน data.js เพื่อจับข้อผิดพลาดของ data.js ไว้ก่อน
   แล้วสร้างเนื้อหาและเปิดหน้าตาม #hash เมื่อหน้าเว็บโหลดครบ
   ================================================================== */
(function () {
  var dataError = null;
  window.addEventListener('error', function (e) {
    if (e.filename && /\/data\.js([?#]|$)/.test(e.filename)) dataError = e;
  });

  var titles = {
    home: 'โรงเรียนวัดปรีดาราม (มณีศิริวรรณ)',
    about: 'เกี่ยวกับโรงเรียน | โรงเรียนวัดปรีดาราม',
    news: 'ข่าวสาร/ประกาศ | โรงเรียนวัดปรีดาราม',
    staff: 'บุคลากร/ครู | โรงเรียนวัดปรีดาราม',
    departments: 'ฝ่ายงาน | โรงเรียนวัดปรีดาราม',
    contact: 'ติดต่อเรา | โรงเรียนวัดปรีดาราม'
  };

  // ---------- ตัวช่วย ----------
  // ค่าจาก data.js เป็นข้อความที่ตัดช่องว่างหัวท้ายแล้ว (ไม่มีช่องนี้ = '')
  function text(v) {
    return v == null ? '' : String(v).trim();
  }

  // กันไม่ให้ข้อความที่มี < > & " ทำให้หน้าเว็บเพี้ยน
  function esc(v) {
    return text(v)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // ลิงก์/รูปที่ยังไม่ได้ใส่ ('' หรือ '#') ถือว่าไม่มี
  function hasUrl(v) {
    v = text(v);
    return v !== '' && v !== '#';
  }

  function list(v) {
    return Array.isArray(v) ? v : [];
  }

  function avatar(photo, initial) {
    return '<div class="avatar">' +
      (hasUrl(photo) ? '<img src="' + esc(photo) + '" alt="" loading="lazy">' : esc(initial)) +
      '</div>';
  }

  // ---------- ข่าวสาร ----------
  function newsCard(n) {
    n = n || {};
    return '<div class="news-card">' +
      (text(n.tag) ? '<div class="news-tag">' + esc(n.tag) + '</div>' : '') +
      (hasUrl(n.image) ? '<img class="news-img" src="' + esc(n.image) + '" alt="" loading="lazy">' : '') +
      '<div class="news-body">' +
      (text(n.date) ? '<div class="news-date">' + esc(n.date) + '</div>' : '') +
      '<h3>' + esc(n.title) + '</h3>' +
      (text(n.body) ? '<p class="multiline">' + esc(n.body) + '</p>' : '') +
      (hasUrl(n.link) ? '<a class="more-link" href="' + esc(n.link) + '" target="_blank" rel="noopener">อ่านรายละเอียด</a>' : '') +
      '</div></div>';
  }

  function renderNews(id, items) {
    document.getElementById(id).innerHTML = items.map(newsCard).join('');
  }

  // ---------- บุคลากร ----------
  function renderDirector(d) {
    d = d || {};
    document.getElementById('directorCard').innerHTML =
      avatar(d.photo, 'ผอ') +
      '<div>' +
      '<div class="role">' + esc(text(d.role) || 'ผู้อำนวยการโรงเรียน') + '</div>' +
      '<h3>' + esc(d.name) + '</h3>' +
      (text(d.note) ? '<p class="multiline">' + esc(d.note) + '</p>' : '') +
      '</div>';
  }

  function renderTeachers(items) {
    document.getElementById('staffGrid').innerHTML = items.map(function (t) {
      t = t || {};
      return '<div class="staff-card">' +
        avatar(t.photo, t.initial) +
        '<h4>' + esc(t.name) + '</h4>' +
        (text(t.subject) ? '<div class="subj">' + esc(t.subject) + '</div>' : '') +
        '</div>';
    }).join('');
  }

  // ---------- ฝ่ายงาน ----------
  function renderDepartments(items) {
    document.getElementById('deptGrid').innerHTML = items.map(function (d) {
      d = d || {};
      var label = text(d.linkText);
      var button = '';
      if (hasUrl(d.url)) {
        button = '<a class="dept-link" href="' + esc(d.url) + '" target="_blank" rel="noopener">' + esc(label || 'เข้าสู่ระบบงาน') + '</a>';
      } else if (label) {
        button = '<span class="dept-link is-disabled">' + esc(label) + ' (เร็ว ๆ นี้)</span>';
      }
      return '<div class="dept-card">' +
        '<div class="dept-name">' + esc(d.name) + '</div>' +
        (text(d.detail) ? '<p>' + esc(d.detail) + '</p>' : '') +
        button +
        '</div>';
    }).join('');
  }

  // ---------- ติดต่อเรา ----------
  // ลิงก์ https:// อีเมล และเบอร์โทร (เบอร์เดียว) ทำเป็นลิงก์ให้กดได้
  function contactValue(v) {
    v = text(v);
    if (/^https?:\/\/\S+$/i.test(v)) {
      var shown = v.replace(/^https?:\/\/(www\.)?/i, '').replace(/\/$/, '');
      return '<a href="' + esc(v) + '" target="_blank" rel="noopener">' + esc(shown) + '</a>';
    }
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
      return '<a href="mailto:' + esc(v) + '">' + esc(v) + '</a>';
    }
    if (/^\+?\d[\d\s\-().]{6,}$/.test(v)) {
      return '<a href="tel:' + v.replace(/[^\d+]/g, '') + '">' + esc(v) + '</a>';
    }
    return esc(v);
  }

  function renderContact(rows) {
    document.getElementById('contactList').innerHTML = rows.map(function (r) {
      r = r || {};
      return '<li><span class="k">' + esc(r.label) + '</span>' +
        '<span class="v multiline">' + contactValue(r.value) + '</span></li>';
    }).join('');
  }

  // ---------- แผนที่ ----------
  // รับได้ทั้งโค้ด <iframe> จาก "ฝังแผนที่" ของ Google Maps หรือลิงก์ธรรมดา
  function renderMap(raw) {
    var box = document.getElementById('mapBox');
    var v = text(raw);
    var src = v.match(/\ssrc\s*=\s*["']([^"']+)["']/i);
    var url = (src ? src[1] : v).replace(/&amp;/g, '&');

    if (/^https:\/\//i.test(url) && /\/maps\/embed|[?&]output=embed/i.test(url)) {
      box.classList.add('has-map');
      box.innerHTML = '<iframe src="' + esc(url) + '" title="แผนที่โรงเรียน" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe>';
    } else if (/^https?:\/\//i.test(url)) {
      // ลิงก์แชร์ธรรมดา (เช่น maps.app.goo.gl) ฝังในหน้าเว็บไม่ได้ จึงทำเป็นลิงก์เปิดแผนที่แทน
      box.innerHTML = '<div>ดูตำแหน่งโรงเรียนบนแผนที่<br>' +
        '<a class="more-link" href="' + esc(url) + '" target="_blank" rel="noopener">เปิดใน Google Maps</a></div>';
    } else {
      box.innerHTML = '<div>แผนที่โรงเรียนจะแสดงที่นี่<br>เมื่อได้รับพิกัดหรือที่อยู่</div>';
    }
  }

  function renderAll(data) {
    renderNews('homeNewsPreview', list(data.news).slice(0, 3));
    renderNews('newsFullList', list(data.news));
    renderDirector(data.director);
    renderTeachers(list(data.teachers));
    renderDepartments(list(data.departments));
    renderContact(list(data.contact));
    renderMap(data.map);
    if (data.showNotes === false) document.body.classList.add('hide-notes');
  }

  // แถบสีแดงบนสุดของหน้า เมื่อ data.js พิมพ์ผิดจนอ่านข้อมูลไม่ได้
  function showDataError() {
    var missing = ' ข่าว รายชื่อครู ฝ่ายงาน และข้อมูลติดต่อจึงยังไม่แสดง — ';
    var bar = document.createElement('div');
    bar.className = 'data-error';
    bar.setAttribute('role', 'alert');
    bar.textContent = '⚠ ' + (dataError && dataError.lineno
      ? 'ไฟล์ data.js มีจุดที่พิมพ์ผิดประมาณบรรทัดที่ ' + dataError.lineno + missing +
        'ตรวจเครื่องหมาย , และ ` ที่บรรทัดนั้นหรือบรรทัดก่อนหน้า'
      : 'อ่านข้อมูลจากไฟล์ data.js ไม่ได้' + missing +
        'ตรวจเครื่องหมาย , และ ` ในส่วนที่แก้ไขล่าสุด');
    document.body.insertBefore(bar, document.body.firstChild);
  }

  // ---------- สลับหน้าตาม #hash ----------
  function initRouting() {
    var pages = Array.prototype.slice.call(document.querySelectorAll('[data-page]'));
    var routeLinks = Array.prototype.slice.call(document.querySelectorAll('[data-route]'));
    var menu = document.getElementById('navLinks');
    var menuLinks = Array.prototype.slice.call(menu.querySelectorAll('[data-route]'));
    var toggleBtn = document.getElementById('navToggle');

    function currentRoute() {
      return window.location.hash.replace('#', '') || 'home';
    }

    function setMenuOpen(open) {
      menu.classList.toggle('open', open);
      toggleBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    }

    function showRoute(route) {
      if (!titles[route]) route = 'home';
      pages.forEach(function (p) {
        p.classList.toggle('is-active', p.getAttribute('data-page') === route);
      });
      menuLinks.forEach(function (a) {
        var active = a.getAttribute('data-route') === route;
        a.classList.toggle('active', active);
        if (active) a.setAttribute('aria-current', 'page');
        else a.removeAttribute('aria-current');
      });
      document.title = titles[route];
      setMenuOpen(false);
      window.scrollTo({ top: 0, behavior: 'auto' });
    }

    // ลิงก์มี href="#..." อยู่แล้ว เบราว์เซอร์เปลี่ยน hash ให้เอง
    // แต่ถ้ากดหน้าที่เปิดอยู่ hash ไม่เปลี่ยน จึงต้องปิดเมนูและเลื่อนขึ้นบนเอง
    routeLinks.forEach(function (a) {
      a.addEventListener('click', function () {
        if (a.getAttribute('data-route') === currentRoute()) showRoute(currentRoute());
      });
    });

    toggleBtn.addEventListener('click', function () {
      setMenuOpen(!menu.classList.contains('open'));
    });

    window.addEventListener('hashchange', function () {
      showRoute(currentRoute());
    });

    showRoute(currentRoute());
  }

  document.addEventListener('DOMContentLoaded', function () {
    initRouting();
    var data = window.SITE_DATA;
    if (!data || typeof data !== 'object') {
      showDataError();
      return;
    }
    try {
      renderAll(data);
    } catch (err) {
      showDataError();
      if (window.console) console.error(err);
    }
  });
})();
