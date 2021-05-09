/**
 * @fileOverview  View code of UI for managing Movie data
 * @person Gerd Wagner
 */
/***************************************************************
 Import classes, datatypes and utility procedures
 ***************************************************************/
import Person from "../m/Person.mjs";
// import Person from "../m/Person.mjs";
import Movie from "../m/Movie.mjs";
import {fillSelectWithOptions, createListFromMap, createMultipleChoiceWidget}
    from "../../lib/util.mjs";

/***************************************************************
 Load data
 ***************************************************************/
Person.retrieveAll();
Movie.retrieveAll();

/***************************************************************
 Set up general, use-case-independent UI elements
 ***************************************************************/
// set up back-to-menu buttons for all CRUD UIs
for (const btn of document.querySelectorAll("button.back-to-menu")) {
    btn.addEventListener("click", refreshManageDataUI);
}
// neutralize the submit event for all CRUD UIs
for (const frm of document.querySelectorAll("section > form")) {
    frm.addEventListener("submit", function (e) {
        e.preventDefault();
        frm.reset();
    });
}
// save data when leaving the page
window.addEventListener("beforeunload", Movie.saveAll);

/**********************************************
 Use case Retrieve/List All Movies
 **********************************************/
document.getElementById("retrieveAndListAll")
    .addEventListener("click", function () {
        document.getElementById("Movie-M").style.display = "none";
        document.getElementById("Movie-R").style.display = "block";
        const tableBodyEl = document.querySelector("section#Movie-R>table>tbody");
        tableBodyEl.innerHTML = "";  // drop old content
        for (const key of Object.keys(Movie.instances)) {
            const movie = Movie.instances[key];
            // create list of persons for this movie
            const persListEl = createListFromMap(movie.persons, "name");
            const row = tableBodyEl.insertRow();
            row.insertCell().textContent = movie.isbn;
            row.insertCell().textContent = movie.title;
            row.insertCell().textContent = movie.year;
            row.insertCell().appendChild(persListEl);
            // if the movie has a director, show its name
            row.insertCell().textContent =
                movie.director ? movie.director.name : "";
        }
    });

/**********************************************
 Use case Create Movie
 **********************************************/
const createFormEl = document.querySelector("section#Movie-C > form"),
    selectPersonsEl = createFormEl.selectPersons,
    selectPublisherEl = createFormEl.selectPublisher;
document.getElementById("create").addEventListener("click", function () {
    document.getElementById("Movie-M").style.display = "none";
    document.getElementById("Movie-C").style.display = "block";
    // set up a single selection list for selecting a director
    fillSelectWithOptions(selectPublisherEl, Person.instances, "name");
    // set up a multiple selection list for selecting persons
    fillSelectWithOptions(selectPersonsEl, Person.instances,
        "personId", {displayProp: "name"});
    createFormEl.reset();
});
// set up event handlers for responsive constraint validation
createFormEl.isbn.addEventListener("input", function () {
    createFormEl.isbn.setCustomValidity(
        Movie.checkIsbnAsId(createFormEl.isbn.value).message);
});
/* SIMPLIFIED/MISSING CODE: add event listeners for responsive
   validation on user input with Movie.checkTitle and checkYear */

// handle Save button click events
createFormEl["commit"].addEventListener("click", function () {
    const slots = {
        isbn: createFormEl.isbn.value,
        title: createFormEl.title.value,
        year: createFormEl.year.value,
        personIdRefs: [],
        directorId: createFormEl.selectPublisher.value
    };
    // check all input fields and show error messages
    createFormEl.isbn.setCustomValidity(
        Movie.checkIsbnAsId(slots.isbn).message);
    /* SIMPLIFIED CODE: no before-submit validation of name */
    // get the list of selected persons
    const selAuthOptions = createFormEl.selectPersons.selectedOptions;
    // check the mandatory value constraint for persons
    createFormEl.selectPersons.setCustomValidity(
        selAuthOptions.length > 0 ? "" : "No person selected!"
    );
    // save the input data only if all form fields are valid
    if (createFormEl.checkValidity()) {
        // construct a list of person ID references
        for (const opt of selAuthOptions) {
            slots.personIdRefs.push(opt.value);
        }
        Movie.add(slots);
    }
});

/**********************************************
 * Use case Update Movie
 **********************************************/
const updateFormEl = document.querySelector("section#Movie-U > form"),
    selectUpdateMovieEl = updateFormEl.selectMovie;
document.getElementById("update").addEventListener("click", function () {
    document.getElementById("Movie-M").style.display = "none";
    document.getElementById("Movie-U").style.display = "block";
    // set up the movie selection list
    fillSelectWithOptions(selectUpdateMovieEl, Movie.instances,
        "isbn", {displayProp: "title"});
    updateFormEl.reset();
});
/**
 * handle movie selection events: when a movie is selected,
 * populate the form with the data of the selected movie
 */
selectUpdateMovieEl.addEventListener("change", function () {
    const formEl = document.querySelector("section#Movie-U > form"),
        saveButton = formEl.commit,
        selectPersonsWidget = formEl.querySelector(".MultiChoiceWidget"),
        selectPublisherEl = formEl.selectPublisher,
        isbn = formEl.selectMovie.value;
    if (isbn) {
        const movie = Movie.instances[isbn];
        formEl.isbn.value = movie.isbn;
        formEl.title.value = movie.title;
        formEl.year.value = movie.year;
        // set up the associated director selection list
        fillSelectWithOptions(selectPublisherEl, Person.instances, "name");
        // set up the associated persons selection widget
        createMultipleChoiceWidget(selectPersonsWidget, movie.persons,
            Person.instances, "personId", "name", 1);  // minCard=1
        // assign associated director as the selected option to select element
        if (movie.director) formEl.selectPublisher.value = movie.director.name;
        saveButton.disabled = false;
    } else {
        formEl.reset();
        formEl.selectPublisher.selectedIndex = 0;
        selectPersonsWidget.innerHTML = "";
        saveButton.disabled = true;
    }
});
// handle Save button click events
updateFormEl["commit"].addEventListener("click", function () {
    const movieIdRef = selectUpdateMovieEl.value,
        selectPersonsWidget = updateFormEl.querySelector(".MultiChoiceWidget"),
        multiChoiceListEl = selectPersonsWidget.firstElementChild;
    if (!movieIdRef) return;
    const slots = {
        isbn: updateFormEl.isbn.value,
        title: updateFormEl.title.value,
        year: updateFormEl.year.value,
        directorId: updateFormEl.selectPublisher.value
    }
    // add event listeners for responsive validation
    /* MISSING CODE */
    // commit the update only if all form field values are valid
    if (updateFormEl.checkValidity()) {
        // construct personIdRefs-ToAdd/ToRemove lists from the association list
        const personIdRefsToAdd = [], personIdRefsToRemove = [];
        for (const mcListItemEl of multiChoiceListEl.children) {
            if (mcListItemEl.classList.contains("removed")) {
                personIdRefsToRemove.push(mcListItemEl.getAttribute("data-value"));
            }
            if (mcListItemEl.classList.contains("added")) {
                personIdRefsToAdd.push(mcListItemEl.getAttribute("data-value"));
            }
        }
        // if the add/remove list is non-empty create a corresponding slot
        if (personIdRefsToRemove.length > 0) {
            slots.personIdRefsToRemove = personIdRefsToRemove;
        }
        if (personIdRefsToAdd.length > 0) {
            slots.personIdRefsToAdd = personIdRefsToAdd;
        }
    }
    Movie.update(slots);
    // update the movie selection list's option element
    selectUpdateMovieEl.options[selectUpdateMovieEl.selectedIndex].text = slots.title;
    selectPersonsWidget.innerHTML = "";
});

/**********************************************
 * Use case Delete Movie
 **********************************************/
const deleteFormEl = document.querySelector("section#Movie-D > form");
const selectDeleteMovieEl = deleteFormEl.selectMovie;
document.getElementById("destroy")
    .addEventListener("click", function () {
        document.getElementById("Movie-M").style.display = "none";
        document.getElementById("Movie-D").style.display = "block";
        // set up the person selection list
        fillSelectWithOptions(selectDeleteMovieEl, Movie.instances,
            "isbn", {displayProp: "title"});
        deleteFormEl.reset();
    });
// handle Delete button click events
deleteFormEl["commit"].addEventListener("click", function () {
    const movieIdRef = selectDeleteMovieEl.value;
    if (!movieIdRef) return;
    if (confirm("Do you really want to delete this movie?")) {
        Movie.destroy(movieIdRef);
        // remove deleted movie from select options
        deleteFormEl.selectMovie.remove(deleteFormEl.selectMovie.selectedIndex);
    }
});

/**********************************************
 * Refresh the Manage Movies Data UI
 **********************************************/
function refreshManageDataUI() {
    // show the manage movie UI and hide the other UIs
    document.getElementById("Movie-M").style.display = "block";
    document.getElementById("Movie-R").style.display = "none";
    document.getElementById("Movie-C").style.display = "none";
    document.getElementById("Movie-U").style.display = "none";
    document.getElementById("Movie-D").style.display = "none";
}

// Set up Manage Movie UI
refreshManageDataUI();
