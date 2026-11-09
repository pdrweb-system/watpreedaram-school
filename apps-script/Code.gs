/**
 * เชื่อม Google Sheet กับเว็บไซต์โรงเรียนวัดปรีดาราม
 * วิธีติดตั้งและอัปเดต: ดูหัวข้อ "ตั้งค่า Google Sheet" ในไฟล์ README.md
 *
 * อ่าน 4 แท็บในสเปรดชีตนี้ แล้วส่งออกเป็น JSON ให้เว็บไซต์ (js/main.js) ดึงไปแสดง
 *   - "ผู้บริหาร"   คอลัมน์: Initial | Role | Name | Note | Photo
 *   - "กลุ่มสาระ"   คอลัมน์: Group | Initial | Name | Subject | Photo
 *   - "ฝ่ายงาน"     คอลัมน์: Name | Description | LinkLabel | LinkURL
 *   - "ติดต่อ"      คอลัมน์: Key | Value
 * คอลัมน์ Photo ไม่ใส่ก็ได้
 */

function doGet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var data = {
    staffAdmin: readStaffAdmin(ss),
    staffGroups: readStaffGroups(ss),
    departments: readDepartments(ss),
    contact: readContact(ss)
  };
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// คืนแถวข้อมูลของแท็บเป็น object ตามหัวตาราง (แถวแรก)
// ใช้ค่าตามที่เห็นในชีต (วันที่/ตัวเลขไม่ถูกแปลงรูปแบบ) และข้ามแถวที่ว่างทั้งแถว
function sheetRows(ss, sheetName) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet || sheet.getLastRow() < 2) return [];

  var values = sheet.getDataRange().getDisplayValues();
  var headers = values.shift().map(function (h) { return String(h).trim(); });

  return values
    .filter(function (row) {
      return row.some(function (cell) { return String(cell).trim() !== ''; });
    })
    .map(function (row) {
      var obj = {};
      headers.forEach(function (header, i) {
        if (header) obj[header] = String(row[i]).trim();
      });
      return obj;
    });
}

function readStaffAdmin(ss) {
  return sheetRows(ss, 'ผู้บริหาร').map(function (r) {
    return {
      initial: r.Initial || '',
      role: r.Role || '',
      name: r.Name || '',
      note: r.Note || '',
      photo: r.Photo || ''
    };
  });
}

function readStaffGroups(ss) {
  var groups = [];
  var byName = {};

  sheetRows(ss, 'กลุ่มสาระ').forEach(function (r) {
    var groupName = r.Group || '';
    if (!byName.hasOwnProperty(groupName)) {
      byName[groupName] = { group: groupName, teachers: [] };
      groups.push(byName[groupName]);
    }
    byName[groupName].teachers.push({
      initial: r.Initial || '',
      name: r.Name || '',
      subj: r.Subject || '',
      photo: r.Photo || ''
    });
  });

  return groups;
}

// ฝ่ายเดียวมีหลายระบบงานได้: ใส่หลายแถวโดยใช้ Name เดียวกัน
// แถวที่มี LinkLabel แต่ยังไม่มี LinkURL จะขึ้นปุ่ม "เร็ว ๆ นี้" บนเว็บ
function readDepartments(ss) {
  var depts = [];
  var byName = {};

  sheetRows(ss, 'ฝ่ายงาน').forEach(function (r) {
    var name = r.Name || '';
    if (!byName.hasOwnProperty(name)) {
      byName[name] = { name: name, desc: r.Description || '', links: [] };
      depts.push(byName[name]);
    }
    var label = r.LinkLabel || '';
    var url = r.LinkURL || '';
    if (label || url) {
      byName[name].links.push({ label: label, url: url });
    }
  });

  return depts;
}

function readContact(ss) {
  var contact = {};
  sheetRows(ss, 'ติดต่อ').forEach(function (r) {
    if (r.Key) contact[r.Key] = r.Value || '';
  });
  return contact;
}
