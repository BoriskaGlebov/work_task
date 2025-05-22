import {AccordionUploader} from "./accordionUploader.js";

document.addEventListener("DOMContentLoaded", () => {
    new AccordionUploader("uploadForm", "fileInput", "errorMessage");
});