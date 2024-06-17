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

if (navigator.geolocation) {
  navigator.geolocation.getCurrentPosition(
    function (position) {
      const { latitude } = position.coords; //success
      const { longitude } = position.coords;

      const coords = [latitude, longitude];

      const map = L.map("map").setView(coords, 13); //13 -> is used to set the zoom level

      L.tileLayer("https://tile.openstreetmap.fr/hot/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);

      map.on("click", function (mapEvent) {
        const { lat, lng } = mapEvent.latlng;

        L.marker([lat, lng])
          .addTo(map)
          .bindPopup("A pretty CSS popup.<br> Easily customizable.")
          .openPopup();
      });
    },
    function () {
      alert(`Could not get your location`); //error
    }
  );
}
