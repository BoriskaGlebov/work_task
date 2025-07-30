import {AccordionUploader} from "./accordionUploader.js";
import {toggleAccentClasses} from "./toggleAccent.js";
import {CityFormHandler, DOFormHandler} from "./admin-update-cities.js";
import Inputmask from "inputmask";

document.addEventListener("DOMContentLoaded", () => {
    toggleAccentClasses('a-admin','a-admin-mob');
    new AccordionUploader("uploadForm", "fileInput", "server-error");
    new  CityFormHandler("updateFormCities");
    new DOFormHandler("updateFormDO",{Inputmask});
});