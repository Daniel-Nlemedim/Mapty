"use strict";

//prettier-ignore
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const containerWorkout = document.querySelector(".workout");
const form = document.querySelector(".form");
const inputDistance = document.querySelector(".form__input--distance");
const inputType = document.querySelector(".form__input--type");
const inputCadence = document.querySelector(".form__input--cadence");
const inputElevation = document.querySelector(".form__input--elevation");
const inputDuration = document.querySelector(".form__input--duration");
const inputSteps = document.querySelector(".form__input--steps");
const formBtn = document.querySelector(".form__btn");

class workout{
  date = new Date(); //current date
  id = (Date.now() + '').slice(-10); //unique id for each workout

  constructor(coords, distance, duration) {
    this.coords = coords; // [lat, lng]
    this.distance = distance; //in km
    this.duration = duration; //in min
  }
}
class Running extends workout{
  constructor(coords, distance, duration, cadence) {
    super( coords, distance,duration); //calling parent constructor
    this .cadence = cadence;
     this.calcPace(); //in min/km
  }
  //calculating pace for running
  calcPace(){
      this.pace = this.duration / this.distance; //in min/km
      return this.pace;
     }
  }

class Cycling extends workout{
  constructor(coords, distance, duration,elevationGain){
    super(coords,distance,duration)
    this.elevation = elevationGain; //in meters
    this.calcSpeed(); //in km/hr

  }
  //calculating speed for cycling
  calcSpeed(){
    this.speed = this.distance / (this.duration/60); //in km/hr
    return this.speed;
  }
}



//////////////////////////////////////////////////////////////////////////////////
//creating a map using leafletjs
class App {
  #map;
  #mapEvent;
  #workouts = []; //array to store all workouts


  constructor() {
    this._getPosition();

    form.addEventListener("submit", this._newWorkout.bind(this));

    //toggling two input field
    inputType.addEventListener("change", this._toggleElevationField.bind(this));
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
    this.#map = L.map("map").setView(coords, 13); //13 -> is used to set the zoom level

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(this.#map);


    //Handling clicks on map
    this.#map.on("click", this._showForm.bind(this));//show form on click on map 
  }

  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove("hidden"); //show input forms
    inputDistance.focus();
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


   if(type === "running") {
      const cadence = +inputCadence.value; //+ converts string to number

      //check if data is valid
      if( !Number.isFinite(distance)||
          !Number.isFinite(duration) ||
          !Number.isFinite(cadence)){
            return alert('Input should be a number!');
     }

     //check if data input is greater than or equals to 1
          if(distance <=0 || duration <= 0 || cadence <= 0){
            return alert ('Input should be positive number!');
          }
      //creating a new running object
      workout = new Running([lat,lng], distance, duration, cadence)
      this.#workouts.push(workout); //pushing the new workout object to the workouts array
    }

    if(type ==='cycling') {
      const elevation = +inputElevation.value; //+ converts string to number

      //check if data is valid
      if(!Number.isFinite(elevation)||
         !Number.isFinite(distance)||
         !Number.isFinite(duration)){
        return alert('Input should be a number!')
      }

     workout = new Cycling([lat,lng], distance, duration, elevation) //creating a new cycling object
      
    }

    this.#workouts.push(workout); //pushing the new workout object to the workouts array


    //render workout on map as marker

    this.renderWorkoutMarker(workout); //rendering the workout marker on map
    //hide form + clear input fields
    inputDistance.value = inputDuration.value = inputCadence.value = inputElevation.value = '';//clear the input fields
    form.style.display = 'none'; //hide the input form


  }

  renderWorkoutMarker(){
   //display marker
    L.marker([lat, lng])
    .addTo(this.#map)
    .bindPopup(
      L.popup({
      maxWidth: 250,
      minWidth: 100,
      autoClose: false,
      closeOnClick: false,
      className: `${type}-popup`,
      })
    )
    .setPopupContent(`workout.type`)
    .openPopup();
  }
}

const app = new App();
