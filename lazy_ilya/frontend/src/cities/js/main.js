import '../../css/base.css';
import {toggleAccentClasses} from "./toggleAccent.js";
import {CityAutocomplete} from "./city-search.js";
import {CityModalHandler} from "./update-cities.js";

document.addEventListener('DOMContentLoaded', () => {
    toggleAccentClasses()
    console.log(citiesData)

    const cities = citiesData;  // массив с данными
    new CityAutocomplete('default-search', 'suggestions', cities);
    new CityModalHandler('city-modal');
});