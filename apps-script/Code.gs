/**
 * Apps Script backend สำหรับเว็บไซต์โรงเรียนวัดปรีดาราม
 * วิธีติดตั้ง: ดู docs/google-sheet-setup.md
 *
 * อ่านข้อมูลจาก 4 ชีตในสเปรดชีตนี้ แล้วส่งออกเป็น JSON ให้เว็บไซต์ดึงไปแสดงผล
 *   - "ผู้บริหาร"   คอลัมน์: Initial | Role | Name | Note
 *   - "กลุ่มสาระ"   คอลัมน์: Group | Initial | Name | Subject
 *   - "ฝ่ายงาน"     คอลัมน์: Name | Description | LinkLabel | LinkURL
 *   - "ติดต่อ"      คอลัมน์: Key | Value
 */

function doGet(e) {
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

// คืนค่าแถวข้อมูลของชีตเป็น array ของ object โดยใช้แถวแรกเป็นชื่อคอลัมน์
// ข้ามแถวที่ว่างเปล่าทั้งแถว
function sheetRows(ss, sheetName) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet || sheet.getLastRow() < 2) return [];

  var values = sheet.getDataRange().getValues();
  var headers = values.shift();

  return values
    .filter(function (row) {
      return row.some(function (cell) { return String(cell).trim() !== ''; });
    })
    .map(function (row) {
      var obj = {};
      headers.forEach(function (header, i) {
        obj[String(header).trim()] = row[i];
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
      note: r.Note || ''
    };
  });
}

function readStaffGroups(ss) {
  var rows = sheetRows(ss, 'กลุ่มสาระ');
  var groups = [];
  var byName = {};

  rows.forEach(function (r) {
    var groupName = r.Group || '';
    if (!byName[groupName]) {
      byName[groupName] = { group: groupName, teachers: [] };
      groups.push(byName[groupName]);
    }
    byName[groupName].teachers.push({
      initial: r.Initial || '',
      name: r.Name || '',
      subj: r.Subject || ''
    });
  });

  return groups;
}

function readDepartments(ss) {
  var rows = sheetRows(ss, 'ฝ่ายงาน');
  var depts = [];
  var byName = {};

  rows.forEach(function (r) {
    var name = r.Name || '';
    if (!byName[name]) {
      byName[name] = { name: name, desc: r.Description || '', links: [] };
      depts.push(byName[name]);
    }
    var label = r.LinkLabel || '';
    var url = r.LinkURL || '';
    if (label && url) {
      byName[name].links.push({ label: label, url: url });
    }
  });

  return depts;
}

function readContact(ss) {
  var rows = sheetRows(ss, 'ติดต่อ');
  var contact = {};
  rows.forEach(function (r) {
    if (r.Key) contact[r.Key] = r.Value || '';
  });
  return contact;
}
