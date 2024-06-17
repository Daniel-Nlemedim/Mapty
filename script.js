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
const formBtn = document.querySelector(".form__btn");

let map;
let mapEvent;
if (navigator.geolocation) {
  navigator.geolocation.getCurrentPosition(
    function (position) {
      const { latitude } = position.coords; //success
      const { longitude } = position.coords;

      const coords = [latitude, longitude];

      map = L.map("map").setView(coords, 13); //13 -> is used to set the zoom level

      L.tileLayer("https://tile.openstreetmap.fr/hot/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);

      //Handling clicks on map
      map.on("click", function (mapE) {
        mapEvent = mapE;
        form.classList.remove("hidden");
        inputDistance.focus();
      });
    },
    function () {
      alert(`Could not get your location`); //error
    }
  );
}

form.addEventListener("submit", function (e) {
  e.preventDefault();

  //clear input field
  inputDistance.value =
    inputDuration.value =
    inputCadence.value =
    inputElevation.value =
      "";

  //display marker

  const { lat, lng } = mapEvent.latlng;
  L.marker([lat, lng])
    .addTo(map)
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
});

//toggling two input field
inputType.addEventListener('change', function(e){
  inputElevation.closest(".form__row").classList.toggle("form__row--hidden");
  inputCadence.closest(".form__row").classList.toggle("form__row--hidden");
})
