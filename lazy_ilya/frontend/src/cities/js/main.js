import '../../css/base.css';
import {toggleAccentClasses} from "./toggleAccent.js";
import {CityAutocomplete} from "./city-search.js";
import {CityModalHandler} from "./update-cities.js";

document.addEventListener('DOMContentLoaded', () => {
    toggleAccentClasses('a-cities','a-cities-mob')
    const cities = citiesData;  // массив с данными
    const citiesDO= infoDO;
    new CityAutocomplete('default-search', 'suggestions', cities,citiesDO);
    new CityModalHandler('city-modal',cities);
    new CityModalHandler('city-modal2',cities);
});