# เว็บไซต์โรงเรียนวัดปรีดาราม (มณีศิริวรรณ)

สรุปงานสำหรับทำต่อใน Claude Code

## สถานะปัจจุบัน
- เว็บไซต์หลายหน้า (SPA) ใช้ hash routing ไม่มี framework / build step ใช้ HTML + CSS + JavaScript ล้วน
- แยกไฟล์แล้ว (ดูโครงสร้างด้านล่าง) โลโก้เป็นไฟล์ `images/logo.png` ไม่ฝัง base64 อีกต่อไป
- ข่าวแก้ใน `data.js` ส่วนผู้บริหาร ครู ฝ่ายงาน ติดต่อ แผนที่ แก้ใน **Google Sheet** (ผู้ใช้เลือกแนวทางนี้เอง)
  ผ่าน Apps Script Web App (`apps-script/Code.gs`) ลิงก์อยู่ที่ `sheetUrl` ใน `data.js`
  ข้อมูลหัวข้อเหล่านั้นใน `data.js` ยังอยู่ เป็นข้อมูลสำรองเมื่อดึงชีตไม่สำเร็จ
- Deploy ด้วย **GitHub Pages** (repo public, branch `main`, root `/`) → https://pdrweb-system.github.io/watpreedaram-school/
- ผู้ใช้เป็นครู ไม่ใช่นักพัฒนา แก้ข้อมูล/รูปภาพเองผ่านหน้าเว็บ GitHub ตามคู่มือใน `README.md`
  ถ้าเปลี่ยนวิธีแก้ข้อมูลหรือโครงสร้างไฟล์ ต้องอัปเดต `README.md` ให้ตรงด้วย

## โครงสร้างไฟล์
```
index.html                 โครงทุกหน้า + ข้อความคงที่ (วิสัยทัศน์ พันธกิจ อัตลักษณ์/ค่านิยม/เอกลักษณ์) + meta/OG/favicon
data.js                    ข้อมูลที่ผู้ใช้แก้เอง (var SITE_DATA) + sheetUrl มีคำอธิบายภาษาไทยในไฟล์
css/style.css              สไตล์ทั้งหมด
js/main.js                 routing + สร้างเนื้อหาจาก data.js / Google Sheet + แถบแจ้งข้อผิดพลาด
apps-script/Code.gs        Apps Script ที่ผู้ใช้วางในชีตแล้ว Deploy เป็น Web app (ส่ง JSON ให้ main.js)
images/logo.png            ตราโรงเรียน (306x278 PNG พื้นโปร่งใส)
images/favicon.png         ไอคอนแท็บ 96x96 (สร้างจากโลโก้)
images/apple-touch-icon.png  ไอคอนหน้าจอมือถือ 180x180 พื้นขาว
images/news/, images/staff/  รูปที่ผู้ใช้อัปโหลด (มี README.md อธิบายในโฟลเดอร์)
.nojekyll                  ให้ GitHub Pages เสิร์ฟไฟล์ตรง ๆ ไม่ผ่าน Jekyll
```

## data.js และ main.js
- ค่าข้อความทุกช่องใช้ backtick (template literal) เพื่อให้ผู้ใช้พิมพ์ `"` `'` และขึ้นบรรทัดใหม่ได้โดยไม่ทำให้ไฟล์พัง คงรูปแบบนี้ไว้
  ทุกรายการตัวอย่างมีครบทุกช่อง (ช่องว่างเป็น ` `` `) เพราะผู้ใช้คัดลอกรายการเดิมไปแก้ ไม่ได้พิมพ์ใหม่
- ฟิลด์
  - `sheetUrl`: ลิงก์ Web app (`/exec`) ว่าง → ไม่ใช้ Google Sheet
  - `news[]`: `tag`, `date`, `title`, `body`, `image` (ไม่บังคับ), `link` (ไม่บังคับ → ปุ่ม "อ่านรายละเอียด") — ข่าวใหม่อยู่บนสุด หน้าแรกแสดง 3 ข่าวแรก
  - `director`: `name`, `role`, `note`, `photo` (ไม่มีรูป → วงกลมตัวอักษร `initial` หรือ "ผอ") — เป็น object หรือ array ก็ได้ (จากชีตเป็น array หลายท่าน)
  - `teachers[]`: `group`, `name`, `subject`, `photo`, `initial` (ใช้เมื่อไม่มีรูป) — มี `group` → แสดงเป็นแถบ `<details class="staff-group">` ตามกลุ่ม (กลุ่มว่างไว้ท้าย "ครูและบุคลากรอื่น ๆ"), ไม่มีใครใส่ `group` → ตารางเดียว
  - `departments[]`: `name`, `detail`, `linkText`, `url` — `url` ว่างหรือ `#` → ปุ่มสีเทา "(เร็ว ๆ นี้)", ว่างทั้งสองช่อง → ไม่มีปุ่ม; รายการที่ `name` ซ้ำกันรวมเป็นการ์ดเดียวหลายปุ่ม (`.dept-links`)
  - `contact[]`: `label`, `value` — `https://` → ลิงก์, อีเมล → `mailto:`, เบอร์โทรเบอร์เดียว → `tel:`
  - `map`: วางโค้ด `<iframe>` จาก Google Maps ทั้งก้อน หรือลิงก์ `/maps/embed` ก็ได้ → iframe; ลิงก์แชร์ธรรมดา → ลิงก์ "เปิดใน Google Maps"; ว่าง → กล่องข้อความ
  - `showNotes`: `false` → ซ่อน `.info-note` / `.contact-note` (กล่องหมายเหตุสำหรับผู้ดูแล) ผ่านคลาส `hide-notes` บน body
- ข้อความทุกช่อง escape ก่อนใส่ HTML (ฟังก์ชัน `esc` ใน main.js) และช่องที่ขึ้นบรรทัดใหม่ได้ใช้คลาส `.multiline` (`white-space: pre-line`)
  ลิงก์/รูปทุกจุดผ่าน `hasUrl` ซึ่งรับเฉพาะ `http(s)://` หรือ path ในเว็บ (กัน `javascript:` จากชีตที่คนอื่นร่วมแก้ได้)

## Google Sheet
- `Code.gs` อ่านแท็บ `ผู้บริหาร` (Initial|Role|Name|Note|Photo), `กลุ่มสาระ` (Group|Initial|Name|Subject|Photo),
  `ฝ่ายงาน` (Name|Description|LinkLabel|LinkURL), `ติดต่อ` (Key|Value) แล้วคืน JSON
  `{ staffAdmin[], staffGroups[{group, teachers[{initial,name,subj,photo}]}], departments[{name,desc,links[{label,url}]}], contact{key:value} }`
- **อย่าเปลี่ยนรูป JSON นี้**: ผู้ใช้ Deploy สคริปต์เวอร์ชันแรกไว้แล้ว (ยังไม่มี `photo`, ตัดลิงก์ที่ไม่มี URL ทิ้ง) และ main.js ต้องอ่านได้ทั้งสองเวอร์ชัน
  แก้ Code.gs แล้วผู้ใช้ต้อง Deploy > Manage deployments > New version เอง (ขั้นตอนอยู่ใน README หัวข้อ "อัปเดตสคริปต์")
- main.js: `fromSheet()` แปลง JSON เป็นรูปแบบ SITE_DATA แล้วทับ**เฉพาะหัวข้อที่ชีตมีข้อมูล** (director, teachers, departments, contact, map) หัวข้ออื่นใช้ data.js
  แท็บ `ติดต่อ`: Key `address/phone/email/facebook/line` → หัวข้อภาษาไทย, `mapEmbedUrl` หรือ `map` → แผนที่, Key อื่นใช้เป็นหัวข้อตรง ๆ
- ระหว่างรอชีตแสดง "กำลังโหลดข้อมูล…" (ไม่โชว์ข้อมูลสำรองแล้วค่อยสลับ) หมดเวลา 10 วินาที
  ดึงไม่สำเร็จ/ชีตว่าง → แสดงข้อมูลจาก data.js + แถบสีเหลือง `.sheet-notice` บอกสาเหตุ (เฉพาะเมื่อ `showNotes` ไม่ใช่ `false`)
- `fetch(sheetUrl)` ห้ามใส่ header เพิ่ม: Apps Script ไม่ตอบ CORS preflight
- sandbox ของ Claude Code เข้า `script.google.com` ไม่ได้ (proxy บล็อก) ทดสอบด้วยการ mock response ใน Playwright (`page.route`)
- `index.html` โหลด `js/main.js` **ก่อน** `data.js`: main.js ดัก `error` event ของ data.js ไว้ แล้ว render ตอน `DOMContentLoaded`
  ถ้า data.js พิมพ์ผิดจะขึ้นแถบสีแดง `.data-error` พร้อมเลขบรรทัด ส่วน routing ยังทำงานปกติ

## ข้อมูลโรงเรียน
- ชื่อ: โรงเรียนวัดปรีดาราม (มณีศิริวรรณ) / WATPREEDARAM SCHOOL
- สีประจำโรงเรียน: เขียว-ขาว
- วิสัยทัศน์: “ผู้เรียนเป็นคนดี มีความรู้ได้มาตรฐาน บริหารจัดการแบบมีส่วนร่วม บนพื้นฐานความเป็นไทย”
- พันธกิจ 5 ข้อ:
  1. จัดการเรียนรู้ให้ผู้เรียนมีคุณลักษณะที่พึงประสงค์ของหลักสูตร
  2. จัดการเรียนรู้ตามมาตรฐานหลักสูตรสถานศึกษาโดยยึดผู้เรียนเป็นสำคัญ
  3. บริหารจัดการแบบมีส่วนร่วม
  4. ส่งเสริมคุณธรรม จริยธรรมอย่างต่อเนื่องและหลากหลาย
  5. จัดการเรียนรู้บูรณาการตามหลักปรัชญาของเศรษฐกิจพอเพียง
- อัตลักษณ์: “ยิ้มใส ไหว้สวย”
- ค่านิยม: “คนดี มีความรู้ คู่คุณธรรม”
- เอกลักษณ์: “มีวินัย จิตอาสา มารยาทงาม”

## โครงสร้างหน้า (เมนู navigation bar)
ใช้ hash routing (`#home`, `#about`, `#news`, `#staff`, `#departments`, `#contact`)
แต่ละหน้าคือ `<main data-page="ชื่อหน้า">` สลับด้วยคลาส `is-active`
ลิงก์ที่มี `data-route="ชื่อหน้า"` และ `href="#ชื่อหน้า"` ใช้เปลี่ยนหน้า (เพิ่มหน้าใหม่ต้องเพิ่มใน `titles` ของ main.js ด้วย)

| route | หน้า | เนื้อหา |
|---|---|---|
| home | หน้าแรก | hero (โลโก้ ชื่อ คำขวัญ) + ข่าวล่าสุด 3 ชิ้น (`#homeNewsPreview`) |
| about | เกี่ยวกับโรงเรียน | วิสัยทัศน์ พันธกิจ อัตลักษณ์/ค่านิยม/เอกลักษณ์ (ข้อความอยู่ใน index.html) |
| news | ข่าวสาร/ประกาศ | การ์ดข่าวทั้งหมด (`#newsFullList`) |
| staff | บุคลากร/ครู | ผู้บริหาร (`#adminList`) + ครูแยกตามกลุ่มสาระ (`#teacherList`) |
| departments | ฝ่ายงาน | การ์ดฝ่ายงานพร้อมปุ่มลิงก์ระบบงาน (`#deptGrid`) |
| contact | ติดต่อเรา | รายการติดต่อ (`#contactList`) + แผนที่ (`#mapBox`) |

ผู้ใช้ต้องการให้การนำทางอยู่ที่ navigation bar อย่างเดียว (เคยตัดส่วน quick links ในหน้าแรกออกแล้ว ไม่ต้องเพิ่มกลับ)

## ดีไซน์
- ฟอนต์: Chonburi (หัวข้อ) + Sarabun (เนื้อหา) จาก Google Fonts
- CSS variables ใน `:root`:
  - `--green-deep #1F4A38`, `--green-mid #2E6B4F`, `--green-soft #4E8F6E`
  - `--cream #FBF9F2`, `--paper #F3EFE2`, `--gold #B8892B`
  - `--ink #1C231F`, `--ink-soft #4A544E`
- สไตล์: สงบ เป็นทางการ โทนเขียว-ครีม มีเส้นเน้นสีทอง
- ลิงก์สีทองขีดเส้นใต้: `.dept-link` (ปุ่มระบบงาน) และ `.more-link` (อ่านรายละเอียด / เปิดใน Google Maps)
- แถบกลุ่มสาระใช้ `<details>`/`<summary>` (ปิดไว้ก่อน กดเพื่อเปิด ตามที่ผู้ใช้ขอ) มีจำนวนครู "N ท่าน" ท้ายแถบ
- Responsive: เมนูพับเป็นปุ่ม "เมนู ☰" ที่ความกว้างน้อยกว่า 760px

## ข้อมูลที่ยังเป็นตัวอย่าง (placeholder) ใน data.js
- **news**: ข่าวตัวอย่าง 4 ชิ้น
- **director / teachers**: `ระบุชื่อ-นามสกุลผู้อำนวยการ` และครูตัวอย่าง 8 คน (คนละกลุ่มสาระ) ยังไม่มีรูป — ข้อมูลจริงอยู่ในชีต
- **departments**: ลิงก์จริงแล้ว — วิชาการ: ระบบประเมิน SDQ, บุคคล: ระบบการลาออนไลน์ + ระบบประเมินเลื่อนเงินเดือน
  ส่วนงบประมาณและทั่วไปยังไม่มีลิงก์ ("เร็ว ๆ นี้")
- **contact / map**: Facebook จริงแล้ว (`facebook.com/preedaramschool1`) ที่อยู่ เบอร์โทร อีเมล ยังเป็น `ระบุ...` และยังไม่มีแผนที่
- **showNotes** ยังเป็น `true` (กล่องหมายเหตุและแถบสีเหลืองแสดงอยู่)

## งานที่แนะนำให้ทำต่อ
1. ใส่ข้อมูลจริงใน data.js (ผู้ใช้ทำเองได้ตาม README หรือส่งข้อมูลมาให้ใส่) แล้วตั้ง `showNotes: false`
2. เปิด GitHub Pages: Settings > Pages > Source: Deploy from a branch > `main` / `(root)`
3. ทดสอบบนมือถือจริงหลัง deploy โดยเฉพาะเมนูพับและการสลับหน้าด้วย hash
4. ถ้าใช้โดเมนของโรงเรียนเอง ให้แก้ `og:url` และ `og:image` ใน index.html (ต้องเป็น URL เต็ม)
5. ตรวจว่าเว็บจริงดึงชีตได้ (ไม่มีแถบสีเหลือง) และให้ผู้ใช้อัปเดต Code.gs ในชีตเป็นเวอร์ชันล่าสุดถ้าจะใช้คอลัมน์ Photo
6. (ถ้าต้องการ) แกลเลอรีกิจกรรม, รูป og:image ขนาด 1200x630

## ข้อควรระวัง
- ข้อความภาษาไทยทั้งหมด เก็บไฟล์เป็น UTF-8
- เว็บเป็น SPA ใช้ hash routing จึงทำงานบน GitHub Pages ได้โดยไม่ต้องตั้งค่า rewrite
- เปิดไฟล์ index.html ตรง ๆ จากเครื่อง (file://) ได้ เพราะ data.js โหลดเป็น `<script>` ไม่ใช้ fetch — อย่าเปลี่ยน data.js เป็น JSON + fetch
  Google Sheet เป็นชั้นเสริมที่ fetch แยก ถ้าดึงไม่ได้ (เช่น file:// หรือออฟไลน์) เว็บยังแสดงข้อมูลจาก data.js
- GitHub Pages cache ไฟล์ประมาณ 10 นาที ผู้ใช้อาจต้องกด Ctrl+F5 หลังแก้
- ผู้ใช้เป็นครู ไม่ใช่นักพัฒนา คำอธิบายและโครงสร้างไฟล์ควรเรียบง่าย แก้ได้ผ่านหน้าเว็บ GitHub
