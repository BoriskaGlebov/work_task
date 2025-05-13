// main.js
import '../../css/base.css';
import setupStepNavigation from './step-navigations.js';
import setupFileUpload from './file-upload.js';
import setupFormValidation from './form-validation.js'


document.addEventListener('DOMContentLoaded', () => {
    setupFormValidation();
    setupStepNavigation();
    setupFileUpload();
    const aEl = document.getElementById('a-main')
    aEl.classList.toggle('bg-accent');
    aEl.classList.toggle('dark:bg-accent-dark');


});
