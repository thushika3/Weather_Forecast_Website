const apiKey = '6a1f4740d8835121b7200e04d618e41c';
let isCelsius = true;
let isDarkTheme = false;
let debounceTimer;

const lottieMap = {
  clear: 'https://assets10.lottiefiles.com/packages/lf20_qp1q7mct.json',
  clouds: 'https://assets10.lottiefiles.com/packages/lf20_VAmWRg.json',
  rain: 'https://assets10.lottiefiles.com/packages/lf20_jmBauI.json',
  snow: 'https://assets10.lottiefiles.com/packages/lf20_Wt9Rbx.json',
  thunderstorm: 'https://assets2.lottiefiles.com/packages/lf20_HXZpQq.json',
  mist: 'https://assets7.lottiefiles.com/private_files/lf30_j2ura7qg.json',
};

document.addEventListener('DOMContentLoaded', () => {
  const cityInput = document.getElementById('cityInput');
  const searchBtn = document.getElementById('searchBtn');
  const locationBtn = document.getElementById('locationBtn');
  const unitToggle = document.getElementById('unitToggle');
  const themeToggle = document.getElementById('themeToggle');
  const citySuggestions = document.getElementById('citySuggestions');
  const favoritesDropdown = document.getElementById('favoritesDropdown');

  startClock();
  loadFavorites();

  cityInput.addEventListener('input', () => {
    const query = cityInput.value.trim();
    clearTimeout(debounceTimer);
    if (query.length > 2) {
      debounceTimer = setTimeout(() => fetchCitySuggestions(query), 300);
    } else {
      citySuggestions.innerHTML = '';
      citySuggestions.style.display = 'none';
    }
  });

  searchBtn.addEventListener('click', () => {
    const city = cityInput.value.trim();
    if (city) {
      getWeather(city);
      citySuggestions.style.display = 'none';
    }
  });

  locationBtn.addEventListener('click', getLocationWeather);
  unitToggle.addEventListener('click', toggleTemperatureUnit);
  themeToggle.addEventListener('click', toggleTheme);

  favoritesDropdown.addEventListener('change', (e) => {
    const selected = e.target.value;
    if (selected) {
      cityInput.value = selected;
      getWeather(selected);
    }
  });

  document.addEventListener('click', (event) => {
    if (!cityInput.contains(event.target) && !citySuggestions.contains(event.target)) {
      citySuggestions.style.display = 'none';
    }
  });
});

function startClock() {
  const clock = document.getElementById('clock');
  setInterval(() => {
    const now = new Date();
    clock.textContent = now.toLocaleTimeString();
  }, 1000);
}

function toggleTheme() {
  document.body.classList.toggle('dark-theme');
  isDarkTheme = !isDarkTheme;
  document.getElementById('themeToggle').textContent = isDarkTheme ? '☀️ Light Mode' : '🌙 Dark Mode';
}

function toggleTemperatureUnit() {
  isCelsius = !isCelsius;
  document.getElementById('unitToggle').textContent = isCelsius ? 'Switch to °F' : 'Switch to °C';
  const city = document.getElementById('cityInput').value.trim();
  if (city) getWeather(city);
}

function fetchCitySuggestions(query) {
  fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${query}&limit=5&appid=${apiKey}`)
    .then(res => res.json())
    .then(displayCitySuggestions)
    .catch(err => console.error('Suggestion error:', err));
}

function displayCitySuggestions(cities) {
  const list = document.getElementById('citySuggestions');
  list.innerHTML = '';
  if (!cities.length) {
    list.style.display = 'none';
    return;
  }
  cities.forEach(city => {
    const li = document.createElement('li');
    li.textContent = `${city.name}${city.state ? ', ' + city.state : ''}, ${city.country}`;
    li.addEventListener('click', () => {
      document.getElementById('cityInput').value = city.name;
      getWeather(city.name);
      list.style.display = 'none';
    });
    list.appendChild(li);
  });
  list.style.display = 'block';
}

function getWeather(city) {
  if (!city) return;
  const formattedCity = city.charAt(0).toUpperCase() + city.slice(1);
  document.getElementById('currentWeather').innerHTML = `<div class="loading-container"><div class="loading"></div><p>Loading weather...</p></div>`;
  document.getElementById('forecast').innerHTML = '';
  document.getElementById('hourlyForecast').innerHTML = '';

  fetch(`https://api.openweathermap.org/data/2.5/weather?q=${formattedCity}&appid=${apiKey}&units=metric`)
    .then(res => res.json())
    .then(data => {
      if (data.cod === 200) {
        displayCurrentWeather(data);
        getForecast(data.coord.lat, data.coord.lon);
      } else {
        showError(data.message || 'City not found.');
      }
    })
    .catch(() => showError('Failed to fetch weather.'));
}

function displayCurrentWeather(data) {
  const main = data.weather[0].main.toLowerCase();
  const iconURL = lottieMap[main] || lottieMap['clear'];
  const fallbackURL = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;
  const temp = isCelsius ? data.main.temp : (data.main.temp * 9 / 5 + 32).toFixed(1);
  const feels = isCelsius ? data.main.feels_like : (data.main.feels_like * 9 / 5 + 32).toFixed(1);
  const unit = isCelsius ? '°C' : '°F';

  const html = `
    <div class="weather-header">
      <h2>${data.name}, ${data.sys.country}</h2>
      <button id="favBtn" class="fav-star" title="Add to favorites">
  <i class="far fa-star"></i>
</button>

      <p class="current-date">${new Date().toLocaleDateString()}</p>
    </div>
    <div class="weather-main">
      <div id="lottie-icon" class="weather-icon"></div>
      <div class="weather-temp">
        <div class="current-temp">${temp}${unit}</div>
        <div class="feels-like">Feels like ${feels}${unit}</div>
      </div>
    </div>
    <div class="weather-details">
      <p><i class="fas fa-tint"></i> Humidity: ${data.main.humidity}%</p>
      <p><i class="fas fa-wind"></i> Wind: ${data.wind.speed} m/s</p>
      <p><i class="fas fa-sun"></i> Sunrise: ${new Date(data.sys.sunrise * 1000).toLocaleTimeString()}</p>
      <p><i class="fas fa-moon"></i> Sunset: ${new Date(data.sys.sunset * 1000).toLocaleTimeString()}</p>
    </div>
    
  `;

  document.getElementById('currentWeather').innerHTML = html;
  const favBtn = document.getElementById('favBtn');
const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');

// Pre-fill icon if already favorited
if (favorites.includes(data.name)) {
  favBtn.innerHTML = '<i class="fas fa-star"></i>';
  favBtn.title = 'Already in favorites';
}

favBtn.addEventListener('click', () => {
  addFavorite(data.name);
  favBtn.innerHTML = '<i class="fas fa-star"></i>';
  favBtn.title = 'Added to favorites';
});

  document.getElementById('favBtn').addEventListener('click', () => {
  addFavorite(data.name);
  document.getElementById('favBtn').textContent = '⭐';
  document.getElementById('favBtn').title = 'Added to favorites';
});


  const iconContainer = document.getElementById('lottie-icon');
  iconContainer.innerHTML = '';

  if (iconURL) {
    const animation = lottie.loadAnimation({
      container: iconContainer,
      renderer: 'svg',
      loop: true,
      autoplay: true,
      path: iconURL,
    });

    setTimeout(() => {
      if (!iconContainer.querySelector('svg')) {
        const fallbackImg = document.createElement('img');
        fallbackImg.src = fallbackURL;
        fallbackImg.alt = data.weather[0].description;
        fallbackImg.style.width = '100%';
        fallbackImg.style.height = '100%';
        iconContainer.appendChild(fallbackImg);
      }
    }, 2000);
  } else {
    const fallbackImg = document.createElement('img');
    fallbackImg.src = fallbackURL;
    fallbackImg.alt = data.weather[0].description;
    fallbackImg.style.width = '100%';
    fallbackImg.style.height = '100%';
    iconContainer.appendChild(fallbackImg);
  }
  

}

function getForecast(lat, lon) {
  fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`)
    .then(res => res.json())
    .then(data => {
      if (data.cod === '200') {
        displayForecast(data.list);
        displayHourlyForecast(data.list);
      }
    })
    .catch(() => showError('Failed to load forecast.'));
}

function displayForecast(data) {
  const days = {};
  data.forEach(item => {
    const date = new Date(item.dt * 1000).toDateString();
    if (!days[date]) {
      days[date] = { temps: [], icon: item.weather[0].icon, desc: item.weather[0].description };
    }
    days[date].temps.push(item.main.temp);
  });

  const html = Object.entries(days).slice(0, 5).map(([date, day]) => {
    const avg = day.temps.reduce((a, b) => a + b) / day.temps.length;
    const temp = isCelsius ? avg.toFixed(1) : (avg * 9 / 5 + 32).toFixed(1);
    const unit = isCelsius ? '°C' : '°F';
    return `<div class="forecast-day"><h3>${new Date(date).toLocaleDateString([], { weekday: 'short' })}</h3><img src="https://openweathermap.org/img/wn/${day.icon}.png" /><p class="temp">${temp}${unit}</p><p>${day.desc}</p></div>`;
  }).join('');

  document.getElementById('forecast').innerHTML = html;
}

function displayHourlyForecast(data) {
  const html = data.slice(0, 6).map(hour => {
    const time = new Date(hour.dt * 1000);
    const displayTime = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const day = time.toLocaleDateString([], { weekday: 'short' });
    const temp = isCelsius ? hour.main.temp.toFixed(1) : (hour.main.temp * 9 / 5 + 32).toFixed(1);
    const icon = hour.weather[0].icon;
    const description = hour.weather[0].main;

    return `
      <div class="hour-block">
        <strong>${day}</strong>
        <div>${displayTime}</div>
        <img src="https://openweathermap.org/img/wn/${icon}.png" alt="${description}" width="50" height="50">
        <div><strong>${temp}°${isCelsius ? 'C' : 'F'}</strong></div>
        <div style="font-size: 0.9rem;">${description}</div>
      </div>`;
  }).join('');

  document.getElementById('hourlyForecast').innerHTML = `
    <h3 style="margin-bottom: 10px;">Next Hours</h3>
    <div class="hourly-scroll">${html}</div>
  `;
}


function getLocationWeather() {
  if (!navigator.geolocation) return showError('Geolocation not supported.');
  navigator.geolocation.getCurrentPosition(pos => {
    const { latitude, longitude } = pos.coords;
    fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${apiKey}&units=metric`)
      .then(res => res.json())
      .then(data => {
        if (data.cod === 200) {
          document.getElementById('cityInput').value = data.name;
          displayCurrentWeather(data);
          getForecast(data.coord.lat, data.coord.lon);
        }
      })
      .catch(() => showError('Failed to fetch location weather.'));
  }, () => showError('Location access denied.'));
}

function addFavorite(city) {
  let favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
  city = city.trim();
  if (city && !favorites.includes(city)) {
    favorites.push(city);
    favorites.sort();
    localStorage.setItem('favorites', JSON.stringify(favorites));
    loadFavorites();
  }
}

function loadFavorites() {
  const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
  const dropdown = document.getElementById('favoritesDropdown');
  dropdown.innerHTML = `<option value="">⭐ Favorites</option>`;
  favorites.forEach(city => {
    const opt = document.createElement('option');
    opt.value = city;
    opt.textContent = city;
    dropdown.appendChild(opt);
  });
}
document.getElementById('clearFavorites').addEventListener('click', () => {
  const confirmed = confirm("Are you sure you want to clear all favorite cities?");
  if (confirmed) {
    localStorage.removeItem('favorites');
    loadFavorites();
    alert('All favorites have been cleared!');
  }
});



function showError(msg) {
  document.getElementById('currentWeather').innerHTML = `<p class="error-message"><i class="fas fa-exclamation-triangle"></i> ${msg}</p>`;
}
