// main.js

import setupStepNavigation from './step-navigations.js';
import setupFileUpload from './file-upload.js'; // или file-render.js, если мы вынесли отрисовку
import setupFormValidation from './form-validation.js'
// import { renderFileList } from './file-render.js'; // Если отдельно

document.addEventListener('DOMContentLoaded', () => {
    setupFormValidation();
    setupStepNavigation();
    setupFileUpload(); // или renderFileList, если нужно


});
