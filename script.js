// ==========================================
// 1. Element Selectors & Global Variables
// ==========================================
const cityInput = document.getElementById('cityInput');
const searchBtn = document.getElementById('searchBtn');
const geoBtn = document.getElementById('geoBtn');

const loadingEl = document.getElementById('loading');
const errorEl = document.getElementById('error');
const weatherDisplay = document.getElementById('weatherDisplay');

const cityNameEl = document.getElementById('cityName');
const coordinatesEl = document.getElementById('coordinates');
const dateTextEl = document.getElementById('dateText');
const weatherIconEl = document.getElementById('weatherIcon');
const tempValueEl = document.getElementById('tempValue');
const tempUnitEl = document.getElementById('tempUnit');
const weatherDescEl = document.getElementById('weatherDesc');

const feelsLikeEl = document.getElementById('feelsLike');
const humidityEl = document.getElementById('humidity');
const windSpeedEl = document.getElementById('windSpeed');

const unitCheckbox = document.getElementById('unitCheckbox');
const unitCEl = document.getElementById('unitC');
const unitFEl = document.getElementById('unitF');

// เก็บข้อมูลสภาพอากาศปัจจุบันในหน่วยเซลเซียส
let currentDataCelsius = null;

// Map รหัส WMO Weather Code เป็นข้อความและไอคอน FontAwesome
const weatherCodeMap = {
  0: { desc: 'ท้องฟ้าแจ่มใส', icon: 'fa-sun', color: '#fde047' },
  1: { desc: 'ท้องฟ้าโปร่งเป็นส่วนใหญ่', icon: 'fa-cloud-sun', color: '#fde047' },
  2: { desc: 'มีเมฆบางส่วน', icon: 'fa-cloud-sun', color: '#cbd5e1' },
  3: { desc: 'มืดครึ้ม', icon: 'fa-cloud', color: '#94a3b8' },
  45: { desc: 'หมอกลง', icon: 'fa-smog', color: '#cbd5e1' },
  48: { desc: 'หมอกน้ำค้างแข็ง', icon: 'fa-smog', color: '#cbd5e1' },
  51: { desc: 'ฝนปรอยๆ เบาๆ', icon: 'fa-cloud-rain', color: '#38bdf8' },
  61: { desc: 'ฝนตกเบาๆ', icon: 'fa-cloud-showers-heavy', color: '#38bdf8' },
  63: { desc: 'ฝนตกปานกลาง', icon: 'fa-cloud-showers-heavy', color: '#0284c7' },
  65: { desc: 'ฝนตกหนัก', icon: 'fa-cloud-showers-heavy', color: '#1e3a8a' },
  80: { desc: 'ฝนซ่ากระจาย', icon: 'fa-cloud-sun-rain', color: '#38bdf8' },
  95: { desc: 'พายุฝนฟ้าคะนอง', icon: 'fa-cloud-bolt', color: '#f59e0b' }
};

// ==========================================
// 2. Fetch API Functions (Async/Await)
// ==========================================

/**
 * ดึงพิกัด Latitude / Longitude จากชื่อเมืองผ่าน Open-Meteo Geocoding API
 */
async function getCoordinatesByCity(cityName) {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=1&language=th&format=json`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('ไม่สามารถเชื่อมต่อระบบ Geocoding ได้');
  }

  const data = await response.json();
  if (!data.results || data.results.length === 0) {
    throw new Error(`ไม่พบชื่อเมือง "${cityName}" กรุณาตรวจสอบอีกครั้ง`);
  }

  const result = data.results[0];
  return {
    name: result.name,
    country: result.country || '',
    latitude: result.latitude,
    longitude: result.longitude
  };
}

/**
 * ดึงข้อมูลสภาพอากาศตาม Latitude & Longitude โดยใช้ Fetch API และ Query Parameters
 */
async function fetchWeatherData(lat, lon, locationName = 'ตำแหน่งของคุณ') {
  showLoading();
  hideError();

  try {
    // ส่ง Query Parameters: latitude, longitude, current weather variables
    const apiUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&timezone=auto`;

    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      throw new Error(`การดึงข้อมูลล้มเหลว (Status: ${response.status})`);
    }

    const data = await response.json();
    
    // บันทึกค่าที่ได้ลงตัวแปร Global
    currentDataCelsius = {
      locationName: locationName,
      latitude: lat,
      longitude: lon,
      temp: data.current.temperature_2m,
      feelsLike: data.current.apparent_temperature,
      humidity: data.current.relative_humidity_2m,
      windSpeed: data.current.wind_speed_10m,
      weatherCode: data.current.weather_code,
      time: data.current.time
    };

    renderWeather();
  } catch (err) {
    showError(err.message);
  } finally {
    hideLoading();
  }
}

// ==========================================
// 3. UI Render & Helper Functions
// ==========================================

function renderWeather() {
  if (!currentDataCelsius) return;

  const isFahrenheit = unitCheckbox.checked;
  
  // แปลงหน่วยอุณหภูมิ C เป็น F หากเปิด Toggle
  const temp = isFahrenheit 
    ? (currentDataCelsius.temp * 9/5) + 32 
    : currentDataCelsius.temp;
    
  const feelsLike = isFahrenheit 
    ? (currentDataCelsius.feelsLike * 9/5) + 32 
    : currentDataCelsius.feelsLike;

  const unitSymbol = isFahrenheit ? '°F' : '°C';

  // อัปเดตข้อมูลบน DOM
  cityNameEl.textContent = currentDataCelsius.locationName;
  coordinatesEl.innerHTML = `<i class="fa-solid fa-map-pin"></i> Lat: ${currentDataCelsius.latitude.toFixed(2)} | Lon: ${currentDataCelsius.longitude.toFixed(2)}`;
  dateTextEl.textContent = new Date().toLocaleDateString('th-TH', { 
    weekday: 'long', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
  });

  tempValueEl.textContent = Math.round(temp);
  tempUnitEl.textContent = unitSymbol;
  feelsLikeEl.textContent = `${Math.round(feelsLike)}${unitSymbol}`;
  humidityEl.textContent = `${currentDataCelsius.humidity}%`;
  windSpeedEl.textContent = `${currentDataCelsius.windSpeed} km/h`;

  // อัปเดตไอคอน และ คำอธิบายสภาพอากาศ
  const info = weatherCodeMap[currentDataCelsius.weatherCode] || { 
    desc: 'สภาพอากาศทั่วไป', icon: 'fa-cloud-sun', color: '#38bdf8' 
  };
  weatherDescEl.textContent = info.desc;
  weatherIconEl.className = `fa-solid ${info.icon} weather-icon`;
  weatherIconEl.style.color = info.color;

  weatherDisplay.classList.remove('hidden');
}

function showLoading() {
  loadingEl.classList.remove('hidden');
  weatherDisplay.classList.add('hidden');
}

function hideLoading() {
  loadingEl.classList.add('hidden');
}

function showError(msg) {
  errorEl.textContent = msg;
  errorEl.classList.remove('hidden');
  weatherDisplay.classList.add('hidden');
}

function hideError() {
  errorEl.classList.add('hidden');
}

// ==========================================
// 4. Event Listeners & Geolocation
// ==========================================

// ค้นหาเมื่อกดปุ่มค้นหา
searchBtn.addEventListener('click', async () => {
  const query = cityInput.value.trim();
  if (!query) return;

  showLoading();
  hideError();

  try {
    const coords = await getCoordinatesByCity(query);
    const locationTitle = coords.country ? `${coords.name}, ${coords.country}` : coords.name;
    await fetchWeatherData(coords.latitude, coords.longitude, locationTitle);
  } catch (err) {
    showError(err.message);
    hideLoading();
  }
});

// ค้นหาเมื่อกด Enter ในช่อง Input
cityInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    searchBtn.click();
  }
});

// ดึงพิกัดปัจจุบันจากเบราว์เซอร์ (GPS Geolocation API)
geoBtn.addEventListener('click', () => {
  if (!navigator.geolocation) {
    showError('เบราว์เซอร์ของคุณไม่รองรับการดึงพิกัดตำแหน่ง (Geolocation)');
    return;
  }

  showLoading();
  hideError();

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const lat = position.coords.latitude;
      const lon = position.coords.longitude;
      fetchWeatherData(lat, lon, 'ตำแหน่งปัจจุบันของคุณ');
    },
    (err) => {
      showError('ไม่สามารถเข้าถึงตำแหน่งของคุณได้ กรุณาอนุญาตสิทธิ์ Geolocation');
      hideLoading();
    }
  );
});

// เปลี่ยนหน่วย °C / °F
unitCheckbox.addEventListener('change', () => {
  if (unitCheckbox.checked) {
    unitFEl.classList.add('active');
    unitCEl.classList.remove('active');
  } else {
    unitCEl.classList.add('active');
    unitFEl.classList.remove('active');
  }
  renderWeather();
});

// ==========================================
// 5. Initial Load (ค่าเริ่มต้น: กรุงเทพมหานคร)
// ==========================================
window.addEventListener('DOMContentLoaded', () => {
  // ค่าพิกัดเริ่มต้น กรุงเทพฯ (Lat: 13.75, Lon: 100.51)
  fetchWeatherData(13.7563, 100.5018, 'Bangkok, Thailand');
});