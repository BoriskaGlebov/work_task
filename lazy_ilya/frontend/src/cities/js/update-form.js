import {AccordionUploader} from "./accordionUploader.js";
import {toggleAccentClasses} from "./toggleAccent.js";
import {CityFormHandler} from "./admin-update-cities.js";

document.addEventListener("DOMContentLoaded", () => {
    toggleAccentClasses('a-admin','a-admin-mob');
    new AccordionUploader("uploadForm", "fileInput", "server-error");
    new  CityFormHandler("updateFormCities");
});