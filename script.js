"use strict";

class workout {
  date = new Date(); //current date
  id = (Date.now() + "").slice(-10); //unique id for each workout

  constructor(coords, distance, duration) {
    this.coords = coords; // [lat, lng]
    this.distance = distance; //in km
    this.duration = duration; //in min
  }

  //setting the description of the workout title
  _setDescription() {
    //prettier-ignore
    const months =  ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }
}
class Running extends workout {
  type = "running"; //type of workout

  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration); //calling parent constructor
    this.cadence = cadence;
    this.calcPace(); //in min/km
    this._setDescription();
  }
  //calculating pace for running
  calcPace() {
    this.pace = this.duration / this.distance; //in min/km
    return this.pace;
  }
}

class Cycling extends workout {
  type = "cycling"; //type of workout

  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevation = elevationGain; //in meters
    this.calcSpeed(); //in km/hr
    this._setDescription();
  }
  //calculating speed for cycling
  calcSpeed() {
    this.speed = this.distance / (this.duration / 60); //in km/hr
    return this.speed;
  }
}

//////////////////////////////////////////////////////////////////////////////////
//creating a map using leafletjs

//prettier-ignore
const containerWorkouts = document.querySelector(".workouts");
const form = document.querySelector(".form");
const inputDistance = document.querySelector(".form__input--distance");
const inputType = document.querySelector(".form__input--type");
const inputCadence = document.querySelector(".form__input--cadence");
const inputElevation = document.querySelector(".form__input--elevation");
const inputDuration = document.querySelector(".form__input--duration");
const inputSteps = document.querySelector(".form__input--steps");
const formBtn = document.querySelector(".form__btn");

class App {
  #map;
  #mapEvent;
  #workouts = []; //array to store all workouts
  #mapZoomLevel = 13; //zoom level of the map

  constructor() {
    //getting user's current position and load map
    this._getPosition();

    //getting the darkMode function
    this._checkDarkMode();

    //get data from local storage
    this._getLocalStorage();

    //attaching events handlers
    form.addEventListener("submit", this._newWorkout.bind(this));
    inputType.addEventListener("change", this._toggleElevationField.bind(this)); //toggling two input fields
    
    containerWorkouts.addEventListener("click", this._moveToPopup.bind(this)); //moving to the popup when clicked on the workout

    containerWorkouts.addEventListener("click", this._deleteWorkout.bind(this)); //deleting the workout when clicked on the delete button
  }

  _deleteWorkout(e) {
    const btn = e.target.closest(".workout__delete");
    if (!btn) return;

    const workoutEl = btn.closest(".workout");
    const workoutId = workoutEl.dataset.id;

    // Remove workout from data array
  app.#workouts = app.#workouts.filter(w => w.id !== workoutId);

  // Update localStorage
  localStorage.setItem('workouts', JSON.stringify(app.#workouts));

  // Remove from DOM
  workoutEl.remove();
  }

  async _getWeather(lat, lng) {
    const apiKey = "700c116fb84bb53fdeec9c74479db76f";
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${apiKey}&units=metric`;
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Weather data not found!`); //if response is not ok then throw error
      if (res.status === 404) {
        this._renderError(`Weather data not found!`);
        return null;
      } //if status is 404 then render error

      const data = await res.json(); //parsing the data
      return {
        temp: Math.round(data.main.temp),
        icon: data.weather[0].icon,
        description: data.weather[0].description,
      }; //returning the weather data
    } catch (err) {
      // this._renderError(`Weather data not found!`);
      return null;
    }
  }

  // activating darkMode once it is  7pm
  _checkDarkMode() {
    const hour = new Date().getHours();
    const isDark = hour >= 19 || hour < 6;

    if (isDark) {
      document.body.classList.add("dark-mode");
    } else {
      document.body.classList.remove("dark-mode");
    }
  }

  //rendering error message
  //using template literals to add html code
  _renderError = function (msg) {
    const html = `
    <div class="error">
      <div>
        <svg>
          <use href="img/icons.svg#icon-alert-triangle"></use>
        </svg>
      </div>
      <p>${msg}</p>
    </div>
    `;
    map.insertAdjacentHTML("beforeend", html);
  };

  _getPosition() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        (err) => {
          this._renderError(
            `Could not get your location!. Please allow location access!` //error message if user denies location access
          );
        }
      );
    } else {
      this._renderError(`Geolocation is not supported by your browser!`); //error message if geolocation is not supported
    }
  }

  _loadMap(position) {
    try {
      const { latitude } = position.coords; //success
      const { longitude } = position.coords;

      const coords = [latitude, longitude]; //destructed array

      //initializing the map from the leaflet DOCs
      this.#map = L.map("map").setView(coords, this.#mapZoomLevel); //13 -> is used to set the zoom level

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(this.#map);

      if (!this.#map) {
        throw new Error(`map could not be loaded`);
      }

      //Handling clicks on map
      this.#map.on("click", this._showForm.bind(this)); //show form on click on map

      this.#workouts.forEach((workout) => {
        this._renderWorkoutMarker(workout); //rendering the workout marker on map
      });
    } catch (err) {
      this._renderError(`Map could not be loaded! Please try again later!`); //error message if map is not loaded
    }
  }

  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove("hidden"); //show input forms
    inputDistance.focus();
  }

  _hideForm() {
    inputDistance.value =
      inputDuration.value =
      inputCadence.value =
      inputElevation.value =
        ""; //clear the input fields
    form.style.display = "none"; //hide the form
    form.classList.add("hidden"); //add hidden class
    setTimeout(() => (form.style.display = "grid"), 1000); //hide the form after 1 second
  }

  _toggleElevationField() {
    inputElevation.closest(".form__row").classList.toggle("form__row--hidden");
    inputCadence.closest(".form__row").classList.toggle("form__row--hidden");
  }

  async _newWorkout(e) {
    e.preventDefault();

    const type = inputType.value; //running or cycling
    const distance = +inputDistance.value; //+ converts string to number
    const duration = +inputDuration.value; //+ converts string to number
    const { lat, lng } = this.#mapEvent.latlng; //getting lat and lng from map event
    let workout; //creating a new workout object

    if (type === "running") {
      const cadence = +inputCadence.value; //+ converts string to number

      //check if data is valid
      if (
        !Number.isFinite(distance) ||
        !Number.isFinite(duration) ||
        !Number.isFinite(cadence)
      ) {
        return alert("Input should be a number!");
      }

      //check if data input is greater than or equals to 1
      if (distance <= 0 || duration <= 0 || cadence <= 0) {
        return alert("Input should be positive number!");
      }
      //creating a new running object
      workout = new Running([lat, lng], distance, duration, cadence);

      //fetch and store weather data
      workout.weather = await this._getWeather(lat, lng);

      this.#workouts.push(workout); //pushing the new workout object to the workouts array
    }

    if (type === "cycling") {
      const elevation = +inputElevation.value; //+ converts string to number

      //check if data is valid
      if (
        !Number.isFinite(elevation) ||
        !Number.isFinite(distance) ||
        !Number.isFinite(duration)
      ) {
        return alert("Input should be a number!");
      }

      workout = new Cycling([lat, lng], distance, duration, elevation); //creating a new cycling object

      //fetch and store weather data
      workout.weather = await this._getWeather(lat, lng); //fetching the weather data
      if (!workout.weather) {
        return alert("Weather data not found!");
      }

      this.#workouts.push(workout); //pushing the new workout object to the workouts array
    }

    //render workout on map as marker
    this._renderWorkoutMarker(workout); //rendering the workout marker on map

    //rendering workout
    this._renderWorkout(workout);

    // hide + clear form
    this._hideForm();

    //setting the local storage
    this._setLocalStorage();
  }

  _renderWorkoutMarker(workout) {
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(
        `${workout.type === "running" ? "🏃‍♂️" : "🚴‍♀️"} ${workout.description}`
      )
      .openPopup();
  }

  _renderWorkout(workout) {
    const weather = workout.weather; //getting the weather data from the workout object

    const weatherInfo = weather
      ? `<span class="weather-info">
         <img src="https://openweathermap.org/img/wn/${weather.icon}.png" 
              title="${weather.description}" 
              class="weather-icon" 
              style="vertical-align:middle;width:1.5em;height:1.5em;margin-left:0.5em;" />
         <span class="weather-desc" style="font-size:1em;margin-left:0.3em;">${weather.temp}°C, ${weather.description}</span>
       </span>
      <button class="workout__delete">&times;</button>`
      : ""; //if weather data is not available then return empty string

    //using template literals to add html code
    let html = ` 
    <li class="workout workout--${workout.type}" data-id="${workout.id}">
          <h2 class="workout__title">${workout.description} ${weatherInfo}</h2>
          <div class="workout__details">
            <span class="workout__icon">
              ${workout.type === "running" ? "🏃‍♂️" : "🚴‍♀️"}
             </span>
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${workout.duration}</span>
            <span class="workout__unit">min</span>
          </div>
          `;
    //adding details for running and cycling

    if (workout.type === "running") {
      html += `
             <div class="workout__details">
                <span class="workout__icon">⚡️</span>
                <span class="workout__value">${workout.pace.toFixed(1)}</span>
                <span class="workout__unit">min/km</span>
             </div>
             <div class="workout__details">
               <span class="workout__icon">🦶🏼</span>
               <span class="workout__value">${workout.cadence}</span>
               <span class="workout__unit">spm</span>
             </div>
            `;
    }

    if (workout.type === "cycling") {
      html += `
              <div class="workout__details">
               <span class="workout__icon">⚡️</span>
               <span class="workout__value">${workout.speed.toFixed(1)}</span>
               <span class="workout__unit">km/h</span>
             </div>
             <div class="workout__details">
               <span class="workout__icon">⛰</span>
               <span class="workout__value">${workout.elevation}</span>
               <span class="workout__unit">m</span>
             </div>
            `;
    }

    html += `</li>`; //closing the workout list

    //inserting the html at the beginning of the workouts list
    form.insertAdjacentHTML("afterend", html); //inserting the html at the beginning of the workouts list
  }

  _moveToPopup(e) {
    const workoutEl = e.target.closest(".workout"); //closest method is used to get the closest parent element with the class workout

    //if workout is not found then return
    if (!workoutEl) return;

    //getting the workout data from the workout array using the id
    const workout = this.#workouts.find(
      (work) => work.id === workoutEl.dataset.id
    );

    this.#map.setView(workout.coords, this.#mapZoomLevel, {
      animate: true, //smooth animation
      pan: {
        duration: 1,
      }, //pan duration
    }); //setting the view of the map to the workout coordinates
  }

  _setLocalStorage() {
    localStorage.setItem("workouts", JSON.stringify(this.#workouts)); //convert the object to string
  }

  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem("workouts")); //convert the string back to object

    if (!data) return;

    this.#workouts = data; // restore all workout array

    this.#workouts.forEach((workout) => {
      this._renderWorkout(workout);
    });
  }

  reset() {
    localStorage.removeItem("workouts"); //remove the workouts from local storage
    location.reload(); //reload the page
  }
}

const app = new App();
