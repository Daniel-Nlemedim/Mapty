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
    this._checkDarkMode()

    //get data from local storage
    this._getLocalStorage();

    //attaching events handlers
    form.addEventListener("submit", this._newWorkout.bind(this));
    inputType.addEventListener("change", this._toggleElevationField.bind(this)); //toggling two input fields
    containerWorkouts.addEventListener("click", this._moveToPopup.bind(this)); //moving to the popup when clicked on the workout
  }

  // activating darkMode once it is  7pm
  _checkDarkMode(){
    const hour = new Date().getHours();
    const isDark = hour >= 19 ||hour < 6
    
    if (isDark){
      document.body.classList.add('dark-mode');
    }else{
      document.body.classList.remove('dark-mode');
    }
  }

  _getPosition() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert(`Could not get your location`); //error
        }
      );
    }
  }

  _loadMap(position) {
    const { latitude } = position.coords; //success
    const { longitude } = position.coords;

    const coords = [latitude, longitude]; //destructed array

    //initializing the map from the leaflet DOCs
    this.#map = L.map("map").setView(coords, this.#mapZoomLevel); //13 -> is used to set the zoom level

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    //Handling clicks on map
    this.#map.on("click", this._showForm.bind(this)); //show form on click on map

    this.#workouts.forEach((workout) => {
      this._renderWorkoutMarker(workout); //rendering the workout marker on map
    });
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

  _newWorkout(e) {
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
    //using template literals to add html code
    let html = ` 
    <li class="workout workout--${workout.type}" data-id="${workout.id}">
          <h2 class="workout__title">${workout.description}</h2>
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
           </li>
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
           </li>
            `;
    }

    form.insertAdjacentHTML("afterend", html); //inserting the html after the form
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