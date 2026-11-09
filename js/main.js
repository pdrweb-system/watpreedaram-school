/* ==================================================================
   การทำงานของเว็บไซต์ — ปกติไม่ต้องแก้ไฟล์นี้
   ข่าวแก้ที่ไฟล์ data.js ส่วนผู้บริหาร ครู ฝ่ายงาน ติดต่อ และแผนที่
   แก้ที่ Google Sheet (ลิงก์อยู่ที่ sheetUrl ใน data.js)
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
  // รับเฉพาะ http(s):// หรือไฟล์ในเว็บ เช่น images/... เพราะข้อมูลจาก Google Sheet
  // อาจมีคนอื่นร่วมแก้ได้ จึงไม่ยอมให้ลิงก์แบบ javascript: ฝังลงในหน้า
  function hasUrl(v) {
    v = text(v);
    if (v === '' || v === '#') return false;
    var bare = v.replace(/[\t\n\r]/g, '').replace(/^[\x00-\x20]+/, '');
    return !/^[a-z][a-z0-9+.\-]*:/i.test(bare) || /^https?:\/\//i.test(bare);
  }

  function list(v) {
    return Array.isArray(v) ? v : [];
  }

  // รูปที่โหลดไม่ได้ (เช่น พิมพ์ชื่อไฟล์ผิด) จะถูกเอาออก แทนที่จะโชว์ไอคอนรูปเสีย
  var DROP_BROKEN = ' onerror="this.remove()"';

  function avatar(photo, initial) {
    return '<div class="avatar"><span>' + esc(initial) + '</span>' +
      (hasUrl(photo) ? '<img src="' + esc(photo) + '" alt="" loading="lazy"' + DROP_BROKEN + '>' : '') +
      '</div>';
  }

  // ---------- ข่าวสาร ----------
  function newsCard(n) {
    n = n || {};
    var meta = (text(n.tag) ? '<span class="news-tag">' + esc(n.tag) + '</span>' : '') +
      (text(n.date) ? '<span class="news-date">' + esc(n.date) + '</span>' : '');
    return '<div class="news-card">' +
      (hasUrl(n.image) ? '<img class="news-img" src="' + esc(n.image) + '" alt="" loading="lazy"' + DROP_BROKEN + '>' : '') +
      '<div class="news-body">' +
      (meta ? '<div class="news-meta">' + meta + '</div>' : '') +
      '<h3>' + esc(n.title) + '</h3>' +
      (text(n.body) ? '<p class="multiline">' + esc(n.body) + '</p>' : '') +
      (hasUrl(n.link) ? '<a class="more-link" href="' + esc(n.link) + '" target="_blank" rel="noopener">อ่านรายละเอียด</a>' : '') +
      '</div></div>';
  }

  function renderNews(id, items) {
    document.getElementById(id).innerHTML = items.map(newsCard).join('');
  }

  // ภาษาไทยไม่เว้นวรรคระหว่างคำ เบราว์เซอร์จึงอาจตัดบรรทัดกลางคำ เช่น "ความ|รู้"
  // คำขวัญและชื่อที่เว้นวรรคระหว่างวลีไว้แล้ว ให้ตัดบรรทัดตรงช่องว่างเท่านั้น
  // (วลียาวเกิน 20 ตัวอักษรยังตัดได้ตามปกติ จะได้ไม่ล้นจอมือถือ)
  var PHRASE_TEXT = '.hero-quote > span, .identity-card .value, .vision blockquote > span, .page-header h1, .page-header p,' +
    ' .section-title, footer .fname, footer .fmotto, .news-card h3, .staff-lead h3, .staff-card h4,' +
    ' .staff-group .group-name, .dept-card .dept-name';

  // เรียกซ้ำได้: ข้อความที่จัดแล้วจะไม่ถูกจัดซ้ำ
  function protectPhrases() {
    Array.prototype.slice.call(document.querySelectorAll(PHRASE_TEXT)).forEach(keepPhrasesTogether);
  }

  function keepPhrasesTogether(el) {
    Array.prototype.slice.call(el.childNodes).forEach(function (node) {
      if (node.nodeType !== 3 || !/\S\s+\S/.test(node.data)) return;
      var frag = document.createDocumentFragment();
      node.data.split(/(\s+)/).forEach(function (part) {
        if (!part) return;
        if (/^\s+$/.test(part) || part.length > 20) {
          frag.appendChild(document.createTextNode(part));
          return;
        }
        var span = document.createElement('span');
        span.className = 'nowrap';
        span.textContent = part;
        frag.appendChild(span);
      });
      el.replaceChild(frag, node);
    });
  }

  // จัดรายการเป็นกลุ่มตามชื่อ เรียงตามลำดับที่พบครั้งแรก
  function groupBy(items, keyOf) {
    var groups = [];
    var byKey = Object.create(null);
    items.forEach(function (item) {
      var key = keyOf(item);
      if (!byKey[key]) {
        byKey[key] = { key: key, items: [] };
        groups.push(byKey[key]);
      }
      byKey[key].items.push(item);
    });
    return groups;
  }

  // ---------- บุคลากร ----------
  // ผู้บริหารมีได้หลายท่าน (data.js ใส่ director ท่านเดียวได้ Google Sheet ใส่ได้หลายแถว)
  function renderAdmins(admins) {
    document.getElementById('adminList').innerHTML = admins.map(function (d) {
      d = d || {};
      return '<div class="staff-lead">' +
        avatar(d.photo, text(d.initial) || 'ผอ') +
        '<div>' +
        '<div class="role">' + esc(text(d.role) || 'ผู้อำนวยการโรงเรียน') + '</div>' +
        '<h3>' + esc(d.name) + '</h3>' +
        (text(d.note) ? '<p class="multiline">' + esc(d.note) + '</p>' : '') +
        '</div></div>';
    }).join('');
  }

  function teacherCard(t) {
    t = t || {};
    return '<div class="staff-card">' +
      avatar(t.photo, t.initial) +
      '<h4>' + esc(t.name) + '</h4>' +
      (text(t.subject) ? '<div class="subj">' + esc(t.subject) + '</div>' : '') +
      '</div>';
  }

  // ครูที่ใส่ group แสดงเป็นแถบตามกลุ่มสาระ กดที่แถบเพื่อเปิดดูรายชื่อ
  // ถ้าไม่มีใครใส่ group เลย แสดงเป็นตารางเดียว
  function renderTeachers(items) {
    var groups = groupBy(items, function (t) { return text(t && t.group); });
    var box = document.getElementById('teacherList');
    if (groups.length === 1 && groups[0].key === '') {
      box.innerHTML = '<div class="staff-grid">' + items.map(teacherCard).join('') + '</div>';
      return;
    }
    // ครูที่ไม่ได้ระบุกลุ่มไว้ท้ายสุด
    groups.sort(function (a, b) { return (a.key === '') - (b.key === ''); });
    box.innerHTML = groups.map(function (g) {
      return '<details class="staff-group">' +
        '<summary><span class="group-name">' + esc(g.key || 'ครูและบุคลากรอื่น ๆ') + '</span>' +
        '<span class="group-count">' + g.items.length + ' ท่าน</span></summary>' +
        '<div class="staff-grid">' + g.items.map(teacherCard).join('') + '</div>' +
        '</details>';
    }).join('');
  }

  // ---------- ฝ่ายงาน ----------
  function deptButton(d) {
    var label = text(d.linkText);
    if (hasUrl(d.url)) {
      return '<a class="dept-link" href="' + esc(d.url) + '" target="_blank" rel="noopener">' + esc(label || 'เข้าสู่ระบบงาน') + '</a>';
    }
    return label ? '<span class="dept-link is-disabled">' + esc(label) + ' (เร็ว ๆ นี้)</span>' : '';
  }

  // ฝ่ายที่มีหลายระบบงานใส่หลายรายการโดยใช้ชื่อฝ่ายเดียวกัน จะรวมเป็นการ์ดเดียว
  function renderDepartments(items) {
    var cards = groupBy(items, function (d) { return text(d && d.name); });
    document.getElementById('deptGrid').innerHTML = cards.map(function (c) {
      var detail = '';
      var buttons = [];
      c.items.forEach(function (d) {
        d = d || {};
        detail = detail || text(d.detail);
        var b = deptButton(d);
        if (b) buttons.push(b);
      });
      return '<div class="dept-card">' +
        '<div class="dept-name">' + esc(c.key) + '</div>' +
        (detail ? '<p>' + esc(detail) + '</p>' : '') +
        (buttons.length ? '<div class="dept-links">' + buttons.join('') + '</div>' : '') +
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

    box.classList.remove('has-map');
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

  // ---------- Google Sheet ----------
  // แปลง JSON จาก apps-script/Code.gs ให้อยู่ในรูปเดียวกับ data.js
  // คืนเฉพาะหัวข้อที่ชีตมีข้อมูล หัวข้อที่ชีตไม่มีจะใช้ข้อมูลจาก data.js ต่อ
  var CONTACT_LABELS = { address: 'ที่อยู่', phone: 'โทรศัพท์', email: 'อีเมล', facebook: 'Facebook', line: 'LINE' };

  function fromSheet(s) {
    s = s || {};
    var out = {};

    var admins = list(s.staffAdmin);
    if (admins.length) out.director = admins;

    var teachers = [];
    list(s.staffGroups).forEach(function (g) {
      g = g || {};
      list(g.teachers).forEach(function (t) {
        t = t || {};
        teachers.push({ group: g.group, name: t.name, subject: t.subj, photo: t.photo, initial: t.initial });
      });
    });
    if (teachers.length) out.teachers = teachers;

    var depts = [];
    list(s.departments).forEach(function (d) {
      d = d || {};
      var links = list(d.links).length ? list(d.links) : [{}];
      links.forEach(function (l) {
        l = l || {};
        depts.push({ name: d.name, detail: d.desc, linkText: l.label, url: l.url });
      });
    });
    if (depts.length) out.departments = depts;

    // แท็บ "ติดต่อ" เป็น Key/Value: Key ที่ไม่รู้จักใช้เป็นหัวข้อตรง ๆ (เช่น LINE หรือพิมพ์ภาษาไทย)
    var c = s.contact;
    if (c && typeof c === 'object' && !Array.isArray(c)) {
      var rows = [];
      Object.keys(c).forEach(function (key) {
        var k = text(key);
        var lk = k.toLowerCase();
        var v = text(c[key]);
        if (!k || !v) return;
        if (lk === 'mapembedurl' || lk === 'map') {
          out.map = v;
        } else {
          rows.push({ label: Object.prototype.hasOwnProperty.call(CONTACT_LABELS, lk) ? CONTACT_LABELS[lk] : k, value: v });
        }
      });
      if (rows.length) out.contact = rows;
    }
    return out;
  }

  var SHEET_PROBLEMS = {
    badurl: 'ลิงก์ sheetUrl ใน data.js ต้องขึ้นต้นด้วย https://',
    network: 'เชื่อมต่อไม่ได้ — ตรวจลิงก์ sheetUrl ใน data.js และตั้ง Who has access ของ Apps Script เป็น Anyone',
    timeout: 'Google Sheet ตอบกลับช้าเกินไป',
    http: 'Apps Script ตอบกลับผิดปกติ',
    notjson: 'ลิงก์ sheetUrl ไม่ได้ส่งข้อมูลกลับมา — ต้องเป็นลิงก์ Web app ที่ลงท้ายด้วย /exec',
    empty: 'เชื่อมต่อได้แต่ไม่พบข้อมูล — ตรวจชื่อแท็บและหัวตารางในชีตให้ตรงตามคู่มือ README',
    other: 'ข้อมูลที่ได้จากชีตมีรูปแบบไม่ถูกต้อง'
  };

  function sheetProblem(kind, detail) {
    var err = new Error(kind + (detail ? ' ' + detail : ''));
    err.kind = kind;
    err.detail = detail;
    return err;
  }

  // ไม่ใส่ header เพิ่มใน fetch: Apps Script ไม่รองรับ CORS preflight
  function loadSheet(url) {
    if (!/^https:\/\//i.test(url)) return Promise.reject(sheetProblem('badurl'));
    if (typeof fetch !== 'function') return Promise.reject(sheetProblem('network'));
    var request = fetch(url).then(function (res) {
      if (!res.ok) throw sheetProblem('http', res.status);
      return res.text();
    }, function (e) {
      throw sheetProblem('network', e && e.message);
    }).then(function (body) {
      try {
        return JSON.parse(body);
      } catch (e) {
        throw sheetProblem('notjson');
      }
    });
    var timeout = new Promise(function (resolve, reject) {
      setTimeout(function () { reject(sheetProblem('timeout')); }, 10000);
    });
    return Promise.race([request, timeout]);
  }

  // แถบสีเหลืองบนสุดของหน้า เห็นเฉพาะตอน showNotes เป็น true (โหมดผู้ดูแลเว็บ)
  function showSheetNotice(err) {
    var bar = document.createElement('div');
    bar.className = 'sheet-notice';
    bar.setAttribute('role', 'status');
    var kind = err && SHEET_PROBLEMS[err.kind] ? err.kind : 'other';
    bar.textContent = 'ดึงข้อมูลจาก Google Sheet ไม่สำเร็จ: ' + SHEET_PROBLEMS[kind] +
      (kind === 'http' ? ' (HTTP ' + err.detail + ')' : '') +
      ' — หน้าบุคลากร ฝ่ายงาน และติดต่อเรา จึงแสดงข้อมูลจากไฟล์ data.js แทน';
    document.body.insertBefore(bar, document.body.firstChild);
  }

  function showLoading() {
    var msg = 'กำลังโหลดข้อมูล…';
    ['adminList', 'teacherList', 'deptGrid', 'mapBox'].forEach(function (id) {
      document.getElementById(id).innerHTML = '<div class="loading">' + msg + '</div>';
    });
    document.getElementById('contactList').innerHTML = '<li class="loading">' + msg + '</li>';
  }

  // ---------- สร้างเนื้อหาทั้งหมด ----------
  function renderSheetSections(data) {
    renderAdmins([].concat(data.director || []));
    renderTeachers(list(data.teachers));
    renderDepartments(list(data.departments));
    renderContact(list(data.contact));
    renderMap(data.map);
    protectPhrases();
  }

  function renderAll(data) {
    renderNews('homeNewsPreview', list(data.news).slice(0, 3));
    renderNews('newsFullList', list(data.news));
    if (data.showNotes === false) document.body.classList.add('hide-notes');

    var sheetUrl = text(data.sheetUrl);
    if (!sheetUrl) {
      renderSheetSections(data);
      return;
    }

    // รอข้อมูลจากชีตก่อน แทนที่จะโชว์ข้อมูลสำรองจาก data.js แล้วค่อยสลับ
    showLoading();
    loadSheet(sheetUrl).then(function (sheet) {
      var fromS = fromSheet(sheet);
      if (!Object.keys(fromS).length) throw sheetProblem('empty');
      var merged = {};
      Object.keys(data).forEach(function (k) { merged[k] = data[k]; });
      Object.keys(fromS).forEach(function (k) { merged[k] = fromS[k]; });
      renderSheetSections(merged);
    }).catch(function (err) {
      if (window.console) console.warn('Google Sheet:', err);
      try {
        renderSheetSections(data);
      } catch (e) {
        showDataError();
        if (window.console) console.error(e);
        return;
      }
      if (data.showNotes !== false) showSheetNotice(err);
    });
  }

  // แถบสีแดงบนสุดของหน้า เมื่อ data.js พิมพ์ผิดจนอ่านข้อมูลไม่ได้
  function showDataError() {
    var missing = ' ข่าว รายชื่อครู ฝ่ายงาน และข้อมูลติดต่อจึงยังไม่แสดง — ';
    var bar = document.createElement('div');
    bar.className = 'data-error';
    bar.setAttribute('role', 'alert');
    bar.textContent = (dataError && dataError.lineno
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
    protectPhrases();
    var data = window.SITE_DATA;
    if (!data || typeof data !== 'object') {
      showDataError();
      return;
    }
    try {
      renderAll(data);
      protectPhrases();
    } catch (err) {
      showDataError();
      if (window.console) console.error(err);
    }
  });
})();
