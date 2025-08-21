import '../../css/base.css';
import {toggleAccentClasses} from "./toggleAccent.js";
import {CityAutocomplete} from "./city-search.js";
import {CityModalHandler} from "./update-cities.js";
import {InlineGlobusAutocomplete} from "./globus-search.js";


document.addEventListener('DOMContentLoaded', () => {
    toggleAccentClasses('a-cities', 'a-cities-mob')
    const cities = citiesData;  // массив с данными
    const citiesDO = infoDO;
    const autocomplite = new CityAutocomplete('default-search', 'suggestions', cities, citiesDO);
    new CityModalHandler('city-modal', cities);
    new CityModalHandler('city-modal2', citiesDO);
    const modalHandler = new CityModalHandler('city-modal3', citiesDO, false);
    autocomplite.setModalHandler(modalHandler);
    window.globusAutocomplete = new InlineGlobusAutocomplete('#modal-globus', '#globus-hint', cities);
    window.globusAutocomplete = new InlineGlobusAutocomplete('#modal-globus2', '#globus-hint', cities);
});