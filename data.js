/**
 * data.js — Sistem Tempahan Parking Bermalam
 * Dual-layer: API fetch + localStorage fallback
 * CORS: text/plain untuk POST (elak preflight)
 */

var API_BASE = '';
var DATA_KEY = 'parking_data_v1';
var DATA_VERSI = '1.0.0';

// =====================================================
// KONFIGURASI API
// =====================================================

function getApiBase() {
  return localStorage.getItem('parking_api_base') || API_BASE;
}

function setApiBase(url) {
  localStorage.setItem('parking_api_base', url);
}

// =====================================================
// MOCK DATA (fallback jika tiada API)
// =====================================================

var mockUnit = [
  { IDUnit: 'A-6-01', NamaPemilik: 'Ahmad bin Ali', NoTelefon: '0123456789', LoginID: 'usr_a6_01', Status: 'Aktif' },
  { IDUnit: 'A-6-02', NamaPemilik: 'Siti binti Hassan', NoTelefon: '0198765432', LoginID: 'usr_a6_02', Status: 'Aktif' },
  { IDUnit: 'B-3-15', NamaPemilik: 'Ramasamy a/l Muthu', NoTelefon: '0112233445', LoginID: 'usr_b3_15', Status: 'Aktif' }
];

var mockTempahan = [
  { IDTempahan: 'T001', IDUnit: 'A-6-01', Tarikh: '2026-10-05', Status: 'Disahkan', Timestamp: '2026-10-01 08:23:01' },
  { IDTempahan: 'T002', IDUnit: 'A-6-01', Tarikh: '2026-10-06', Status: 'Disahkan', Timestamp: '2026-10-01 08:23:01' },
  { IDTempahan: 'T003', IDUnit: 'A-6-02', Tarikh: '2026-10-05', Status: 'Disahkan', Timestamp: '2026-10-01 09:15:00' }
];

var mockQuota = [
  { Tarikh: '2026-10-05', JumlahSlot: 50, TelahDigunakan: 2, Baki: 48 },
  { Tarikh: '2026-10-06', JumlahSlot: 50, TelahDigunakan: 1, Baki: 49 },
  { Tarikh: '2026-10-07', JumlahSlot: 50, TelahDigunakan: 0, Baki: 50 }
];

var mockTetapan = {
  NamaSistem: 'Sistem Tempahan Parking Residensi',
  LogoURL: '',
  HadMalamSebulan: 3,
  JumlahSlotDefault: 50,
  SistemAktif: true,
  TemaWarna: '#1a73e8'
};

var mockLog = [
  { Timestamp: '2026-10-01 08:23:01', 'ID Unit/Peranan': 'usr_a6_01', Tindakan: 'login', Butiran: 'Log masuk berjaya (Unit A-6-01)' },
  { Timestamp: '2026-10-01 08:23:05', 'ID Unit/Peranan': 'A-6-01', Tindakan: 'tempahan_buat', Butiran: 'Tempah 2 malam: 2026-10-05, 2026-10-06' },
  { Timestamp: '2026-10-01 09:15:00', 'ID Unit/Peranan': 'usr_a6_02', Tindakan: 'login', Butiran: 'Log masuk berjaya (Unit A-6-02)' }
];

// =====================================================
// INIT DATA
// =====================================================

function initData() {
  var stored = localStorage.getItem(DATA_KEY);
  if (!stored) {
    var seed = {
      versi: DATA_VERSI,
      Unit: mockUnit,
      Tempahan: mockTempahan,
      QuotaParking: mockQuota,
      Tetapan: mockTetapan,
      LogAktiviti: mockLog
    };
    localStorage.setItem(DATA_KEY, JSON.stringify(seed));
  } else {
    // Semak versi
    try {
      var parsed = JSON.parse(stored);
      if (parsed.versi !== DATA_VERSI) {
        localStorage.setItem(DATA_KEY, JSON.stringify({
          versi: DATA_VERSI,
          Unit: mockUnit,
          Tempahan: mockTempahan,
          QuotaParking: mockQuota,
          Tetapan: mockTetapan,
          LogAktiviti: mockLog
        }));
      }
    } catch (e) {
      localStorage.setItem(DATA_KEY, JSON.stringify({
        versi: DATA_VERSI,
        Unit: mockUnit,
        Tempahan: mockTempahan,
        QuotaParking: mockQuota,
        Tetapan: mockTetapan,
        LogAktiviti: mockLog
      }));
    }
  }
}

// =====================================================
// LOCAL STORAGE ACCESS
// =====================================================

function getLocalData(sheet) {
  initData();
  var raw = localStorage.getItem(DATA_KEY);
  if (!raw) return [];
  try {
    var data = JSON.parse(raw);
    return data[sheet] || [];
  } catch (e) {
    return [];
  }
}

function setLocalData(sheet, data) {
  initData();
  var raw = localStorage.getItem(DATA_KEY);
  var obj = raw ? JSON.parse(raw) : {};
  obj[sheet] = data;
  localStorage.setItem(DATA_KEY, JSON.stringify(obj));
}

function getTetapan() {
  var local = getLocalData('Tetapan');
  if (local && !Array.isArray(local) && local.NamaSistem) {
    return local;
  }
  return mockTetapan;
}

// =====================================================
// TOKEN & SESSION (localStorage)
// =====================================================

function getToken() {
  return localStorage.getItem('parking_token') || '';
}

function setToken(token) {
  localStorage.setItem('parking_token', token);
}

function clearToken() {
  localStorage.removeItem('parking_token');
  localStorage.removeItem('parking_role');
  localStorage.removeItem('parking_unit_id');
  localStorage.removeItem('parking_nama');
}

function getRole() {
  return localStorage.getItem('parking_role') || '';
}

function setRole(role) {
  localStorage.setItem('parking_role', role);
}

function getUnitId() {
  return localStorage.getItem('parking_unit_id') || '';
}

function setUnitId(id) {
  localStorage.setItem('parking_unit_id', id);
}

function getNamaPemilik() {
  return localStorage.getItem('parking_nama') || '';
}

function setNamaPemilik(nama) {
  localStorage.setItem('parking_nama', nama);
}

// =====================================================
// API CALLS
// =====================================================

function apiGet(action, params) {
  var base = getApiBase();
  if (!base) {
    // Mode mock — return data dari localStorage
    return Promise.resolve(mockApiGet(action, params));
  }
  var url = base + '?action=' + encodeURIComponent(action);
  if (params) {
    for (var key in params) {
      if (params[key] !== undefined && params[key] !== null) {
        url += '&' + encodeURIComponent(key) + '=' + encodeURIComponent(params[key]);
      }
    }
  }
  return fetchWithRetry(url, { method: 'GET' }, 2).then(function (res) { return res.json(); });
}

function apiPost(action, data) {
  var base = getApiBase();
  if (!base) {
    return Promise.resolve(mockApiPost(action, data));
  }
  var body = Object.assign({ action: action }, data);
  return fetchWithRetry(base, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(body)
  }, 2).then(function (res) { return res.json(); });
}

function fetchWithRetry(url, options, retries) {
  return new Promise(function (resolve, reject) {
    function attempt(remaining) {
      var controller = new AbortController();
      var timeoutId = setTimeout(function () { controller.abort(); }, 30000);

      fetch(url, Object.assign({}, options, { signal: controller.signal }))
        .then(function (res) {
          clearTimeout(timeoutId);
          resolve(res);
        })
        .catch(function (err) {
          clearTimeout(timeoutId);
          if (remaining > 0) {
            setTimeout(function () { attempt(remaining - 1); }, 2000);
          } else {
            reject(err);
          }
        });
    }
    attempt(retries);
  });
}

// =====================================================
// SYNC DARI API
// =====================================================

function syncFromApi() {
  // Jika tiada API base, guna localStorage
  if (!getApiBase()) {
    initData();
    document.dispatchEvent(new CustomEvent('park:synced', { detail: { source: 'local' } }));
    return;
  }

  // Sync tetapan
  apiGet('getSettings').then(function (res) {
    if (res.success && res.data) {
      setLocalData('Tetapan', res.data);
    }
    document.dispatchEvent(new CustomEvent('park:synced', { detail: { source: 'api' } }));
  }).catch(function () {
    document.dispatchEvent(new CustomEvent('park:synced', { detail: { source: 'error' } }));
  });
}

// =====================================================
// MOCK API (untuk testing tanpa Google Sheet)
// =====================================================

function mockApiGet(action, params) {
  switch (action) {
    case 'getSettings':
      return { success: true, data: getTetapan() };
    case 'getMyBookings':
      var unitId = params && params.unitId;
      var bookings = getLocalData('Tempahan').filter(function (b) { return b.IDUnit === unitId && b.Status === 'Disahkan'; });
      return { success: true, data: bookings };
    case 'getAllBookings':
      var allB = getLocalData('Tempahan');
      if (params && params.month) {
        allB = allB.filter(function (b) { return b.Tarikh && b.Tarikh.substring(0, 7) === params.month; });
      }
      return { success: true, data: allB };
    case 'searchBookingsByUnit':
      var uId = params && params.unitId;
      var unitBookings = getLocalData('Tempahan').filter(function (b) { return b.IDUnit === uId; });
      var unitInfo = getLocalData('Unit').filter(function (u) { return u.IDUnit === uId; })[0];
      return { success: true, data: { unit: unitInfo, bookings: unitBookings } };
    case 'getDashboardStats':
      var now = new Date();
      var month = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
      var today = month + '-' + String(now.getDate()).padStart(2, '0');
      var monthB = getLocalData('Tempahan').filter(function (b) {
        return b.Tarikh && b.Tarikh.substring(0, 7) === month && b.Status === 'Disahkan';
      });
      var activeU = getLocalData('Unit').filter(function (u) { return u.Status === 'Aktif'; });
      var todayQ = getLocalData('QuotaParking').filter(function (q) { return q.Tarikh === today; })[0];
      return {
        success: true,
        data: {
          bulan: month,
          jumlahTempahanBulan: monthB.length,
          jumlahUnitAktif: activeU.length,
          parkingHariIni: todayQ || { Tarikh: today, JumlahSlot: 50, TelahDigunakan: 0, Baki: 50 }
        }
      };
    case 'getMonthlyReport':
      var repMonth = params && params.month;
      var repB = getLocalData('Tempahan').filter(function (b) {
        return b.Tarikh && b.Tarikh.substring(0, 7) === repMonth && b.Status === 'Disahkan';
      });
      var repQ = getLocalData('QuotaParking').filter(function (q) {
        return q.Tarikh && q.Tarikh.substring(0, 7) === repMonth;
      });
      var used = 0, avail = 0;
      repQ.forEach(function (q) { used += parseInt(q.TelahDigunakan) || 0; avail += parseInt(q.JumlahSlot) || 0; });
      var uniqueU = {};
      repB.forEach(function (b) { uniqueU[b.IDUnit] = true; });
      return {
        success: true,
        data: {
          bulan: repMonth,
          jumlahTempahan: repB.length,
          jumlahUnitUnik: Object.keys(uniqueU).length,
          jumlahUnitAktif: getLocalData('Unit').filter(function (u) { return u.Status === 'Aktif'; }).length,
          totalParkingUsed: used,
          totalParkingAvailable: avail,
          bookings: repB,
          quota: repQ
        }
      };
    case 'getQuotaList':
      var qList = getLocalData('QuotaParking');
      if (params && params.month) {
        qList = qList.filter(function (q) { return q.Tarikh && q.Tarikh.substring(0, 7) === params.month; });
      }
      return { success: true, data: qList };
    case 'getLogActivity':
      var logs = getLocalData('LogAktiviti');
      if (params && params.date) {
        logs = logs.filter(function (l) { return l.Timestamp && l.Timestamp.substring(0, 10) === params.date; });
      }
      return { success: true, data: logs.reverse() };
    case 'getParkingAvailability':
      var pDate = params && params.date;
      var pQ = getLocalData('QuotaParking').filter(function (q) { return q.Tarikh === pDate; })[0];
      return { success: true, data: pQ || { Tarikh: pDate, JumlahSlot: 50, TelahDigunakan: 0, Baki: 50 } };
    case 'validateToken':
      var tok = params && params.token;
      if (tok && getToken() === tok) {
        return { success: true, data: { role: getRole(), unitId: getUnitId() } };
      }
      return { success: false, error: 'Sesi tamat.' };
    default:
      return { success: false, error: 'Tindakan tidak diketahui (mock): ' + action };
  }
}

function mockApiPost(action, data) {
  switch (action) {
    case 'login':
      var loginId = data.loginId;
      var password = data.password;
      // Cek admin
      if (loginId === 'admin_sys' && password === 'admin123') {
        setToken('mock_admin_sys_' + Date.now());
        setRole('admin_sistem');
        return { success: true, data: { token: getToken(), role: 'admin_sistem', unitId: '' } };
      }
      if (loginId === 'admin_sec' && password === 'safety123') {
        setToken('mock_admin_sec_' + Date.now());
        setRole('admin_keselamatan');
        return { success: true, data: { token: getToken(), role: 'admin_keselamatan', unitId: '' } };
      }
      // Cek unit
      var units = getLocalData('Unit');
      for (var i = 0; i < units.length; i++) {
        if (units[i].LoginID === loginId && units[i].Status === 'Aktif' && password === 'rumah123') {
          setToken('mock_user_' + Date.now());
          setRole('pengguna');
          setUnitId(units[i].IDUnit);
          setNamaPemilik(units[i].NamaPemilik);
          return { success: true, data: { token: getToken(), role: 'pengguna', unitId: units[i].IDUnit, namaPemilik: units[i].NamaPemilik } };
        }
      }
      return { success: false, error: 'Login ID atau password tidak sah.' };
    case 'logout':
      clearToken();
      return { success: true };
    case 'createBooking':
      var unitId = data.unitId;
      var dates = data.dates;
      var tempahan = getLocalData('Tempahan');
      var ts = new Date().toISOString().replace('T', ' ').substring(0, 19);
      var created = [];
      var quota = getLocalData('QuotaParking');
      dates.forEach(function (d, idx) {
        var bid = 'T' + Date.now() + idx;
        tempahan.push({ IDTempahan: bid, IDUnit: unitId, Tarikh: d, Status: 'Disahkan', Timestamp: ts });
        created.push({ IDTempahan: bid, IDUnit: unitId, Tarikh: d, Status: 'Disahkan', Timestamp: ts });
        // Update quota
        var qExists = false;
        quota.forEach(function (q) {
          if (q.Tarikh === d) {
            q.TelahDigunakan = (parseInt(q.TelahDigunakan) || 0) + 1;
            q.Baki = (parseInt(q.JumlahSlot) || 50) - q.TelahDigunakan;
            qExists = true;
          }
        });
        if (!qExists) {
          quota.push({ Tarikh: d, JumlahSlot: 50, TelahDigunakan: 1, Baki: 49 });
        }
      });
      setLocalData('Tempahan', tempahan);
      setLocalData('QuotaParking', quota);
      return { success: true, data: { bookings: created } };
    case 'cancelBooking':
      var bid2 = data.bookingId;
      var tempahan2 = getLocalData('Tempahan');
      var quota2 = getLocalData('QuotaParking');
      tempahan2.forEach(function (b) {
        if (b.IDTempahan === bid2) {
          b.Status = 'Dibatalkan';
          quota2.forEach(function (q) {
            if (q.Tarikh === b.Tarikh) {
              q.TelahDigunakan = Math.max(0, (parseInt(q.TelahDigunakan) || 0) - 1);
              q.Baki = (parseInt(q.JumlahSlot) || 50) - q.TelahDigunakan;
            }
          });
        }
      });
      setLocalData('Tempahan', tempahan2);
      setLocalData('QuotaParking', quota2);
      return { success: true };
    case 'deleteBooking':
      var bid3 = data.bookingId;
      var tempahan3 = getLocalData('Tempahan');
      tempahan3 = tempahan3.filter(function (b) { return b.IDTempahan !== bid3; });
      setLocalData('Tempahan', tempahan3);
      return { success: true };
    case 'updateQuota':
      var qDate = data.date;
      var qTotal = parseInt(data.newTotal);
      var quota3 = getLocalData('QuotaParking');
      var found = false;
      quota3.forEach(function (q) {
        if (q.Tarikh === qDate) {
          q.JumlahSlot = qTotal;
          q.Baki = qTotal - (parseInt(q.TelahDigunakan) || 0);
          found = true;
        }
      });
      if (!found) {
        quota3.push({ Tarikh: qDate, JumlahSlot: qTotal, TelahDigunakan: 0, Baki: qTotal });
      }
      setLocalData('QuotaParking', quota3);
      return { success: true };
    case 'addQuota':
      var aDate = data.date;
      var aTotal = parseInt(data.total);
      var quota4 = getLocalData('QuotaParking');
      var found2 = false;
      quota4.forEach(function (q) {
        if (q.Tarikh === aDate) {
          q.JumlahSlot = aTotal;
          q.TelahDigunakan = 0;
          q.Baki = aTotal;
          found2 = true;
        }
      });
      if (!found2) {
        quota4.push({ Tarikh: aDate, JumlahSlot: aTotal, TelahDigunakan: 0, Baki: aTotal });
      }
      setLocalData('QuotaParking', quota4);
      return { success: true };
    case 'changePassword':
      return { success: true };
    default:
      return { success: false, error: 'Tindakan tidak diketahui (mock): ' + action };
  }
}
