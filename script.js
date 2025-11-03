// --- OpenWeatherMap API Key ---
        const API_KEY = '90a65e9e113636e64ed93feebb76a3e4';
        const API_BASE = 'https://api.openweathermap.org/data/2.5';

        // --- Geoapify API Key for Autocomplete ---
        const GEOAPIFY_KEY = '3199457b3a8b40f185afc448f0118a7d'; // 👈 PASTE YOUR KEY

        // Weather icon mapping
        const weatherIcons = {
            '01d': '☀️', '01n': '🌙',
            '02d': '⛅', '02n': '☁️',
            '03d': '☁️', '03n': '☁️',
            '04d': '☁️', '04n': '☁️',
            '09d': '🌧️', '09n': '🌧️',
            '10d': '🌦️', '10n': '🌧️',
            '11d': '⛈️', '11n': '⛈️',
            '13d': '❄️', '13n': '❄️',
            '50d': '🌫️', '50n': '🌫️'
        };

        // --- START: Autocomplete Feature ---
        const cityInput = document.getElementById('cityInput');
        const suggestionsBox = document.getElementById('suggestionsBox');
        let debounceTimeout;

        cityInput.addEventListener('input', (e) => {
            // Clear existing timeout
            clearTimeout(debounceTimeout);
            
            const query = e.target.value;
            if (query.length < 3) {
                closeSuggestions();
                return;
            }

            // Set a new timeout to fetch suggestions after 300ms
            debounceTimeout = setTimeout(() => {
                fetchSuggestions(query);
            }, 300);
        });

        async function fetchSuggestions(query) {
            if (GEOAPIFY_KEY === 'YOUR_GEOAPIFY_API_KEY_HERE') {
                console.warn('Geoapify API key is missing.');
                return;
            }

            try {
                const response = await fetch(`https://api.geoapify.com/v1/geocode/autocomplete?text=${query}&type=city&format=json&apiKey=${GEOAPIFY_KEY}`);
                if (!response.ok) throw new Error('Failed to fetch suggestions');
                
                const data = await response.json();
                showSuggestions(data.results);
            } catch (error) {
                console.error('Error fetching suggestions:', error);
                closeSuggestions();
            }
        }

        function showSuggestions(results) {
            if (!results || results.length === 0) {
                closeSuggestions();
                return;
            }

            suggestionsBox.innerHTML = ''; // Clear old suggestions
            results.forEach(result => {
                const suggestionItem = document.createElement('div');
                suggestionItem.className = 'px-6 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer';
                suggestionItem.textContent = result.formatted; // e.g., "Bangkok, Thailand"
                
                // Use result.city or result.name for a cleaner search
                const cityName = result.city || result.name; 
                suggestionItem.onclick = () => selectSuggestion(cityName);
                
                suggestionsBox.appendChild(suggestionItem);
            });
            suggestionsBox.classList.remove('hidden');
        }

        function selectSuggestion(city) {
            cityInput.value = city;
            closeSuggestions();
            searchCity(); // Automatically search for the selected city
        }

        function closeSuggestions() {
            suggestionsBox.innerHTML = '';
            suggestionsBox.classList.add('hidden');
        }

        // Close suggestions if user clicks elsewhere
        document.addEventListener('click', (e) => {
            if (!cityInput.contains(e.target)) {
                closeSuggestions();
            }
        });
        // --- END: Autocomplete Feature ---


        function scrollToSection(id) {
            const element = document.getElementById(id);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
            }
        }

        function toggleTheme() {
            document.documentElement.classList.toggle('dark');
            const themeText = document.getElementById('themeText');
            if (document.documentElement.classList.contains('dark')) {
                themeText.textContent = '☀️ Light Mode';
            } else {
                themeText.textContent = '🌙 Dark Mode';
            }
        }

        async function searchCity() {
            // Now we read from cityInput, which might have been set by autocomplete
            const city = cityInput.value.trim();
            
            if (!city) {
                alert('Please enter a city name');
                return;
            }

            try {
                await fetchWeatherByCity(city);
            } catch (error) {
                alert('City not found or error fetching data. Please try again.');
                console.error(error);
            }
        }

        async function fetchWeatherByCity(city) {
            try {
                const currentResponse = await fetch(`${API_BASE}/weather?q=${city}&units=metric&appid=${API_KEY}`, { mode: 'cors', headers: { 'Accept': 'application/json' } });
                if (!currentResponse.ok) throw new Error('City not found');
                const currentData = await currentResponse.json();
                
                const forecastResponse = await fetch(`${API_BASE}/forecast?q=${city}&units=metric&appid=${API_KEY}`, { mode: 'cors', headers: { 'Accept': 'application/json' } });
                if (!forecastResponse.ok) throw new Error('Forecast not available');
                const forecastData = await forecastResponse.json();
                
                updateUI(currentData, forecastData);
            } catch (error) {
                console.error('Fetch error:', error);
                throw error;
            }
        }

        function getLocationWeather() {
            if ('geolocation' in navigator) {
                navigator.geolocation.getCurrentPosition(async (position) => {
                    const { latitude, longitude } = position.coords;
                    try {
                        await fetchWeatherByCoords(latitude, longitude);
                    } catch (error) {
                        alert('Could not fetch weather for your location.');
                        console.error(error);
                    }
                }, (error) => {
                    if (error.code === error.PERMISSION_DENIED) {
                        alert('Location access denied. Please allow location access in your browser settings.');
                    } else {
                        alert('Error getting location.');
                    }
                    console.error('Geolocation error:', error);
                });
            } else {
                alert('Geolocation is not supported by your browser.');
            }
        }

        async function fetchWeatherByCoords(lat, lon) {
            try {
                const currentResponse = await fetch(`${API_BASE}/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`, { mode: 'cors', headers: { 'Accept': 'application/json' } });
                if (!currentResponse.ok) throw new Error('Location weather not found');
                const currentData = await currentResponse.json();
                
                const forecastResponse = await fetch(`${API_BASE}/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`, { mode: 'cors', headers: { 'Accept': 'application/json' } });
                if (!forecastResponse.ok) throw new Error('Location forecast not available');
                const forecastData = await forecastResponse.json();
                
                updateUI(currentData, forecastData);
            } catch (error) {
                console.error('Fetch error:', error);
                throw error;
            }
        }
        
        function updateUI(current, forecast) {
            cityInput.value = ''; // Clear search bar after a successful search
            
            document.getElementById('cityName').textContent = current.name;
            document.getElementById('currentDate').textContent = new Date().toLocaleDateString('en-US', {
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
            });

            const temp = Math.round(current.main.temp);
            document.getElementById('mainTemp').textContent = `${temp}°C`;
            
            const iconCode = current.weather[0].icon;
            document.getElementById('mainWeatherIcon').textContent = weatherIcons[iconCode] || '☀️';

            document.getElementById('feelsLike').textContent = `${Math.round(current.main.feels_like)}°C`;
            document.getElementById('humidity').textContent = `${current.main.humidity}%`;
            document.getElementById('windSpeed').textContent = `${Math.round(current.wind.speed * 3.6)} km/h`;
            document.getElementById('precipitation').textContent = `${current.clouds.all}%`;

            updateHourlyForecast(forecast.list.slice(0, 8));
            updateDailyForecast(forecast.list);
        }

        function updateHourlyForecast(hourlyData) {
            const container = document.getElementById('hourlyForecast');
            container.innerHTML = ''; 

            hourlyData.forEach(hour => {
                const time = new Date(hour.dt * 1000);
                const hourStr = time.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true });

                const card = document.createElement('div');
                card.className = 'bg-white dark:bg-gray-800 rounded-2xl p-6 min-w-[120px] text-center shadow-lg hover:-translate-y-2 transition-all duration-300';
                card.innerHTML = `
                    <div class="font-bold text-gray-600 dark:text-gray-400 mb-4">${hourStr}</div>
                    <div class="text-5xl my-4">${weatherIcons[hour.weather[0].icon] || '☀️'}</div>
                    <div class="text-xl font-bold">${Math.round(hour.main.temp)}°</div>
                `;
                container.appendChild(card);
            });
        }

        function updateDailyForecast(forecastList) {
            const container = document.getElementById('dailyForecast');
            container.innerHTML = ''; 

            const dailyData = {};
            forecastList.forEach(item => {
                const date = new Date(item.dt * 1000).toDateString();
                if (!dailyData[date]) {
                    dailyData[date] = {
                        temps: [],
                        icon: item.weather[0].icon,
                        date: new Date(item.dt * 1000)
                    };
                }
                dailyData[date].temps.push(item.main.temp);
            });

            Object.values(dailyData).slice(0, 7).forEach(day => {
                const dayName = day.date.toLocaleDateString('en-US', { weekday: 'long' });
                const high = Math.round(Math.max(...day.temps));
                const low = Math.round(Math.min(...day.temps));

                const card = document.createElement('div');
                card.className = 'bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg hover:-translate-y-2 hover:shadow-2xl transition-all duration-300 flex justify-between items-center';
                card.innerHTML = `
                    <div class="flex items-center gap-4">
                        <div class="text-5xl">${weatherIcons[day.icon] || '☀️'}</div>
                        <div class="text-xl font-bold">${dayName}</div>
                    </div>
                    <div class="text-right">
                        <div class="text-2xl font-bold">${high}°</div>
                        <div class="text-gray-600 dark:text-gray-400 text-lg">${low}°</div>
                    </div>
                `;
                container.appendChild(card);
            });
        }

        // Allow Enter key to search
        cityInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                closeSuggestions(); // Close suggestions on Enter
                searchCity();
            }
        });

        // Load default city on page load
        window.addEventListener('load', () => {
            fetchWeatherByCity('Dhaka').catch(() => {
                console.log('Failed to load default city');
            });
        });