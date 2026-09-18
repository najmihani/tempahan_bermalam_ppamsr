/**
 * app.js — Sistem Tempahan Parking Bermalam
 * Auth + shared UI functions untuk semua halaman
 */

// =====================================================
// INIT APP
// =====================================================

function initApp() {
  initData();
  syncFromApi();

  // Sapu event listener untuk park:synced
  document.addEventListener('park:synced', function () {
    var headerEl = document.getElementById('header-logo');
    if (headerEl) renderHeader('header-logo');
    var headerNameEl = document.getElementById('header-name');
    if (headerNameEl) renderHeaderName('header-name');
  });

  // Render header jika elemen wujud
  var headerEl = document.getElementById('header-logo');
  if (headerEl) renderHeader('header-logo');
  var headerNameEl = document.getElementById('header-name');
  if (headerNameEl) renderHeaderName('header-name');

  // Apply tema warna
  var tetapan = getTetapan();
  if (tetapan && tetapan.TemaWarna) {
    applyTema(tetapan.TemaWarna);
  }

  // Bottom nav untuk admin
  var bottomNavEl = document.getElementById('bottom-nav');
  if (bottomNavEl) {
    var active = bottomNavEl.getAttribute('data-active') || '';
    bottomNav(active);
  }

  // Hamburger menu
  var hamburger = document.getElementById('hamburger');
  if (hamburger) {
    hamburger.addEventListener('click', mobileMenu);
  }
}

// =====================================================
// TEMA & HEADER
// =====================================================

function applyTema(color) {
  document.documentElement.style.setProperty('--tema-utama', color);
  // Derivative colors
  document.documentElement.style.setProperty('--tema-cerah', color + '20');
  document.documentElement.style.setProperty('--tema-gelap', shadeColor(color, -20));
}

function shadeColor(color, percent) {
  var num = parseInt(color.replace('#', ''), 16);
  var amt = Math.round(2.55 * percent);
  var R = (num >> 16) + amt;
  var G = (num >> 8 & 0x00FF) + amt;
  var B = (num & 0x0000FF) + amt;
  return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) << 16 |
    (G < 255 ? G < 1 ? 0 : G : 255) << 8 |
    (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
}

function renderHeader(targetId) {
  var tetapan = getTetapan();
  var el = document.getElementById(targetId);
  if (!el) return;
  if (tetapan.LogoURL) {
    el.innerHTML = '<img src="' + tetapan.LogoURL + '" alt="Logo" class="header-logo-img" onerror="this.style.display=\'none\'">';
  } else {
    el.innerHTML = '<span class="header-logo-placeholder">🅿</span>';
  }
}

function renderHeaderName(targetId) {
  var tetapan = getTetapan();
  var el = document.getElementById(targetId);
  if (!el) return;
  el.textContent = tetapan.NamaSistem || 'Sistem Tempahan Parking';
}

// =====================================================
// AUTH GUARD
// =====================================================

function requireAuth(expectedRole) {
  var token = getToken();
  var role = getRole();
  if (!token || !role) {
    window.location.href = '/index.html';
    return false;
  }
  if (expectedRole && role !== expectedRole) {
    // Redirect ke dashboard peranan sendiri
    redirectByRole(role);
    return false;
  }
  return true;
}

function requireRole(roles) {
  var token = getToken();
  var role = getRole();
  if (!token || !role) {
    window.location.href = '/index.html';
    return false;
  }
  if (roles && roles.indexOf(role) === -1) {
    redirectByRole(role);
    return false;
  }
  return true;
}

function redirectByRole(role) {
  switch (role) {
    case 'pengguna':
      window.location.href = '/pengguna/dashboard.html';
      break;
    case 'admin_sistem':
    case 'admin_keselamatan':
      window.location.href = '/admin/dashboard.html';
      break;
    default:
      window.location.href = '/index.html';
  }
}

// =====================================================
// LOGOUT
// =====================================================

function logout() {
  apiPost('logout', { token: getToken() }).then(function () {
    clearToken();
    window.location.href = '/index.html';
  }).catch(function () {
    clearToken();
    window.location.href = '/index.html';
  });
}

// =====================================================
// TOAST NOTIFICATION
// =====================================================

function showToast(message, type) {
  type = type || 'info';
  // Buang toast sedia ada
  var existing = document.querySelectorAll('.toast');
  existing.forEach(function (t) { t.remove(); });

  var toast = document.createElement('div');
  toast.className = 'toast toast-' + type;
  toast.innerHTML = '<span class="toast-icon">' + getToastIcon(type) + '</span><span class="toast-msg">' + escapeHtml(message) + '</span>';
  document.body.appendChild(toast);

  // Trigger animation
  setTimeout(function () { toast.classList.add('show'); }, 10);

  // Auto dismiss
  setTimeout(function () {
    toast.classList.remove('show');
    setTimeout(function () { toast.remove(); }, 300);
  }, 3500);
}

function getToastIcon(type) {
  switch (type) {
    case 'success': return '✓';
    case 'error': return '✕';
    case 'warning': return '⚠';
    default: return 'ℹ';
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// =====================================================
// FORMAT
// =====================================================

var NAMA_BULAN = ['Januari', 'Februari', 'Mac', 'April', 'Mei', 'Jun', 'Julai', 'Ogos', 'September', 'Oktober', 'November', 'Disember'];
var NAMA_BULAN_PENDEK = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ogs', 'Sep', 'Okt', 'Nov', 'Dis'];
var NAMA_HARI = ['Ahad', 'Isnin', 'Selasa', 'Rabu', 'Khamis', 'Jumaat', 'Sabtu'];
var NAMA_HARI_PENDEK = ['Ahd', 'Isn', 'Sel', 'Rab', 'Kha', 'Jum', 'Sab'];

function formatDate(dateStr) {
  if (!dateStr) return '';
  var parts = String(dateStr).split('-');
  if (parts.length !== 3) return dateStr;
  var day = parseInt(parts[2]);
  var month = parseInt(parts[1]) - 1;
  var year = parseInt(parts[0]);
  return day + ' ' + NAMA_BULAN_PENDEK[month] + ' ' + year;
}

function formatDatePanjang(dateStr) {
  if (!dateStr) return '';
  var parts = String(dateStr).split('-');
  if (parts.length !== 3) return dateStr;
  var day = parseInt(parts[2]);
  var month = parseInt(parts[1]) - 1;
  var year = parseInt(parts[0]);
  return day + ' ' + NAMA_BULAN[month] + ' ' + year;
}

function formatMonth(monthStr) {
  if (!monthStr) return '';
  var parts = String(monthStr).split('-');
  if (parts.length !== 2) return monthStr;
  var month = parseInt(parts[1]) - 1;
  var year = parseInt(parts[0]);
  return NAMA_BULAN[month] + ' ' + year;
}

function formatTimestamp(ts) {
  if (!ts) return '';
  return String(ts).replace('T', ' ').substring(0, 19);
}

// =====================================================
// KALENDAR
// =====================================================

function getDaysInMonth(year, month) {
  // month: 0-indexed (0 = Januari)
  var days = [];
  var lastDay = new Date(year, month + 1, 0).getDate();
  for (var d = 1; d <= lastDay; d++) {
    var dateStr = year + '-' + String(month + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0');
    days.push({
      day: d,
      dateStr: dateStr,
      dayOfWeek: new Date(year, month, d).getDay()
    });
  }
  return days;
}

function generateCalendar(year, month, unitId) {
  // month: 0-indexed
  var days = getDaysInMonth(year, month);
  var firstDayOfWeek = days[0].dayOfWeek;
  var bookings = getLocalData('Tempahan');
  var unitBookings = bookings.filter(function (b) {
    return b.IDUnit === unitId && b.Status === 'Disahkan' && b.Tarikh;
  });
  var bookedDates = {};
  unitBookings.forEach(function (b) {
    bookedDates[b.Tarikh] = true;
  });

  // Quota
  var quota = getLocalData('QuotaParking');

  // Header hari
  var html = '<div class="calendar">';
  html += '<div class="calendar-header">';
  NAMA_HARI_PENDEK.forEach(function (h) {
    html += '<div class="calendar-dow">' + h + '</div>';
  });
  html += '</div>';
  html += '<div class="calendar-grid">';

  // Sel kosong sebelum hari 1
  for (var i = 0; i < firstDayOfWeek; i++) {
    html += '<div class="calendar-cell empty"></div>';
  }

  // Hari
  var today = new Date();
  var todayStr = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');

  days.forEach(function (d) {
    var classes = 'calendar-cell';
    var isPast = d.dateStr < todayStr;
    var isToday = d.dateStr === todayStr;
    var isBooked = bookedDates[d.dateStr];
    var parkingInfo = getParkingAvailability(d.dateStr);

    if (isPast) classes += ' past';
    if (isToday) classes += ' today';
    if (isBooked) classes += ' booked';

    html += '<div class="' + classes + '" data-date="' + d.dateStr + '"';
    if (isBooked) html += ' data-booked="true"';
    html += ' onclick="onCalendarDayClick(\'' + d.dateStr + '\')">';
    html += '<span class="day-num">' + d.day + '</span>';
    if (isBooked) {
      html += '<span class="day-badge booked">✓</span>';
    }
    if (!isPast && !isBooked && parkingInfo) {
      if (parkingInfo.baki > 0) {
        html += '<span class="day-parking baki">' + parkingInfo.baki + '</span>';
      } else {
        html += '<span class="day-parking penuh">Penuh</span>';
      }
    }
    html += '</div>';
  });

  html += '</div></div>';
  return html;
}

function isDateBooked(date, unitId) {
  var bookings = getLocalData('Tempahan');
  for (var i = 0; i < bookings.length; i++) {
    if (bookings[i].IDUnit === unitId && bookings[i].Tarikh === date && bookings[i].Status === 'Disahkan') {
      return true;
    }
  }
  return false;
}

function countMonthBookings(unitId, month) {
  // month: 'YYYY-MM'
  var bookings = getLocalData('Tempahan');
  var count = 0;
  bookings.forEach(function (b) {
    if (b.IDUnit === unitId && b.Status === 'Disahkan' && b.Tarikh && b.Tarikh.substring(0, 7) === month) {
      count++;
    }
  });
  return count;
}

function getRemainingNights(unitId, month) {
  var tetapan = getTetapan();
  var max = tetapan.HadMalamSebulan || 3;
  return max - countMonthBookings(unitId, month);
}

function getParkingAvailability(date) {
  var quota = getLocalData('QuotaParking');
  for (var i = 0; i < quota.length; i++) {
    if (quota[i].Tarikh === date) {
      return {
        tarikh: date,
        jumlah: parseInt(quota[i].JumlahSlot) || 0,
        digunakan: parseInt(quota[i].TelahDigunakan) || 0,
        baki: parseInt(quota[i].Baki) || 0
      };
    }
  }
  // Default jika tiada quota row
  var tetapan = getTetapan();
  return {
    tarikh: date,
    jumlah: tetapan.JumlahSlotDefault || 50,
    digunakan: 0,
    baki: tetapan.JumlahSlotDefault || 50
  };
}

// =====================================================
// MOBILE MENU & NAVIGATION
// =====================================================

function mobileMenu() {
  var menu = document.getElementById('mobile-menu');
  if (!menu) return;
  menu.classList.toggle('open');
}

function bottomNav(active) {
  var el = document.getElementById('bottom-nav');
  if (!el) return;
  var role = getRole();
  if (role !== 'admin_sistem' && role !== 'admin_keselamatan') return;

  var items = [
    { key: 'dashboard', label: 'Dashboard', icon: '🏠', url: 'dashboard.html' },
    { key: 'tempahan', label: 'Tempahan', icon: '📋', url: 'tempahan.html' },
    { key: 'laporan', label: 'Laporan', icon: '📊', url: 'laporan.html' },
    { key: 'quota', label: 'Quota', icon: '🅿', url: 'quota.html' },
    { key: 'log', label: 'Log', icon: '📝', url: 'log.html' }
  ];

  // Untuk admin keselamatan, tunjuk hanya dashboard + carian
  if (role === 'admin_keselamatan') {
    items = [
      { key: 'dashboard', label: 'Dashboard', icon: '🏠', url: 'dashboard.html' },
      { key: 'carian', label: 'Carian', icon: '🔍', url: '../keselamatan/index.html' }
    ];
  }

  var html = '';
  items.forEach(function (item) {
    var cls = item.key === active ? 'nav-item active' : 'nav-item';
    html += '<a href="' + item.url + '" class="' + cls + '">';
    html += '<span class="nav-icon">' + item.icon + '</span>';
    html += '<span class="nav-label">' + item.label + '</span>';
    html += '</a>';
  });
  el.innerHTML = html;
}

// =====================================================
// HELPER: LOADING & EMPTY STATE
// =====================================================

function showLoading(targetId, message) {
  var el = document.getElementById(targetId);
  if (!el) return;
  el.innerHTML = '<div class="loading-state"><div class="spinner"></div><p>' + (message || 'Memuatkan...') + '</p></div>';
}

function showEmpty(targetId, message) {
  var el = document.getElementById(targetId);
  if (!el) return;
  el.innerHTML = '<div class="empty-state"><span class="empty-icon">📋</span><p>' + escapeHtml(message || 'Tiada data') + '</p></div>';
}

// =====================================================
// GLOBAL CLICK HANDLER UNTUK KALENDAR
// =====================================================

var selectedDates = [];

function onCalendarDayClick(dateStr) {
  // Dipanggil dari HTML — override di dashboard.html
  // Default: buat apa-apa
}

// =====================================================
// AUTO INIT
// =====================================================

document.addEventListener('DOMContentLoaded', function () {
  initApp();
});
