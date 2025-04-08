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

class App {
  #map;
  #mapEvent;
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
    inputSteps.closest(".form__row").classList.toggle("form__row--hidden");
  }

  _toggleWalkingField(){
    inputElevation.closest('form__row').classList.toggle('form__row--elevation')
    inputSteps.closest(".form__row").classList.toggle("form__row--hidden");
  }

  _newWorkout(e) {
    e.preventDefault();
    let radius = e.accuracy;

    //clear input field
    inputDistance.value =
      inputDuration.value =
      inputCadence.value =
      inputElevation.value =
        "";

    //display marker
    const { lat, lng } = this.#mapEvent.latlng;
    L.marker([lat, lng])
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `running-popup`,
        })
      )
      .setPopupContent(`workout`)
      .openPopup();
  }
}

const app = new App();
