const API_KEY = "f56d6bfa83608f2d4fff819f6eb0989f";
const BASE_URL = "https://api.openweathermap.org/data/2.5/weather";

const form = document.getElementById('search-form');
const input = document.getElementById('city-input');
const loading = document.getElementById('loading');
const errorBox = document.getElementById('error-box');
const errorMessage = document.getElementById('error-message');
const weatherCard = document.getElementById('weather-card');
const recentBox = document.getElementById('recent-searches');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const city = input.value.trim();
  if (!city) return;

  await getWeather(city);
});

async function getWeather(city) {
  errorBox.classList.add('hidden');
  weatherCard.classList.add('hidden');
  loading.classList.remove('hidden');

  try {
    const response = await fetch(
      `${BASE_URL}?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`
    );

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("City not found. Check the spelling and try again.");
      } else if (response.status === 401) {
        throw new Error("Invalid API key. Please check your OpenWeatherMap key.");
      } else {
        throw new Error("Something went wrong. Please try again later.");
      }
    }

    const data = await response.json();
    displayWeather(data);
    saveRecentSearch(data.name);

  } catch (err) {
    showError(err.message);
  } finally {
    loading.classList.add('hidden');
  }
}

function displayWeather(data) {
  document.getElementById('city-name').textContent = `${data.name}, ${data.sys.country}`;
  document.getElementById('temp').textContent = `${Math.round(data.main.temp)}°C`;
  document.getElementById('description').textContent = data.weather[0].description;
  document.getElementById('feels-like').textContent = `${Math.round(data.main.feels_like)}°C`;
  document.getElementById('humidity').textContent = `${data.main.humidity}%`;
  document.getElementById('wind').textContent = `${data.wind.speed} m/s`;
  document.getElementById('pressure').textContent = `${data.main.pressure} hPa`;

  const iconCode = data.weather[0].icon;
  document.getElementById('weather-icon').src = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;

  // Local time using city's UTC offset (data.timezone is in seconds)
  const utcMillis = Date.now() + (new Date().getTimezoneOffset() * 60000);
  const cityLocalTime = new Date(utcMillis + data.timezone * 1000);
  const timeString = cityLocalTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  document.getElementById('local-time').textContent = `Local time: ${timeString}`;

  // Dynamic mood background based on main weather condition
  const condition = data.weather[0].main.toLowerCase();
  document.body.className = ''; // reset previous mood classes
  if (condition.includes('clear')) {
    document.body.classList.add('mood-clear');
  } else if (condition.includes('cloud')) {
    document.body.classList.add('mood-clouds');
  } else if (condition.includes('rain') || condition.includes('drizzle')) {
    document.body.classList.add('mood-rain');
  } else if (condition.includes('snow')) {
    document.body.classList.add('mood-snow');
  } else if (condition.includes('thunderstorm')) {
    document.body.classList.add('mood-thunderstorm');
  }

  weatherCard.classList.remove('hidden');
}

function showError(message) {
  errorMessage.textContent = message;
  errorBox.classList.remove('hidden');
}

// ===== Recent searches (remembers last 4 cities) =====
function getRecentSearches() {
  const stored = localStorage.getItem('recentCities');
  return stored ? JSON.parse(stored) : [];
}

function saveRecentSearch(cityName) {
  let cities = getRecentSearches();
  cities = cities.filter(c => c.toLowerCase() !== cityName.toLowerCase());
  cities.unshift(cityName);
  cities = cities.slice(0, 4);
  localStorage.setItem('recentCities', JSON.stringify(cities));
  renderRecentSearches();
}

function renderRecentSearches() {
  const cities = getRecentSearches();
  recentBox.innerHTML = '';

  if (cities.length === 0) {
    recentBox.classList.add('hidden');
    return;
  }

  recentBox.classList.remove('hidden');
  cities.forEach(city => {
    const pill = document.createElement('button');
    pill.type = 'button';
    pill.className = 'recent-pill';
    pill.textContent = city;
    pill.addEventListener('click', () => {
      input.value = city;
      getWeather(city);
    });
    recentBox.appendChild(pill);
  });
}

// Load recent searches on page load
renderRecentSearches();