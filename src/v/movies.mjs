/**
 * @fileOverview  View code of UI for managing Movie data
 * @author Gerd Wagner
 */
/***************************************************************
 Import classes, datatypes and utility procedures
 ***************************************************************/
import Author from "../m/Author.mjs";
import Publisher from "../m/Publisher.mjs";
import Movie from "../m/Movie.mjs";
import {fillSelectWithOptions, createListFromMap, createMultipleChoiceWidget}
    from "../../lib/util.mjs";

/***************************************************************
 Load data
 ***************************************************************/
Author.retrieveAll();
Publisher.retrieveAll();
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
            // create list of authors for this movie
            const authListEl = createListFromMap(movie.authors, "name");
            const row = tableBodyEl.insertRow();
            row.insertCell().textContent = movie.isbn;
            row.insertCell().textContent = movie.title;
            row.insertCell().textContent = movie.year;
            row.insertCell().appendChild(authListEl);
            // if the movie has a publisher, show its name
            row.insertCell().textContent =
                movie.publisher ? movie.publisher.name : "";
        }
    });

/**********************************************
 Use case Create Movie
 **********************************************/
const createFormEl = document.querySelector("section#Movie-C > form"),
    selectAuthorsEl = createFormEl.selectAuthors,
    selectPublisherEl = createFormEl.selectPublisher;
document.getElementById("create").addEventListener("click", function () {
    document.getElementById("Movie-M").style.display = "none";
    document.getElementById("Movie-C").style.display = "block";
    // set up a single selection list for selecting a publisher
    fillSelectWithOptions(selectPublisherEl, Publisher.instances, "name");
    // set up a multiple selection list for selecting authors
    fillSelectWithOptions(selectAuthorsEl, Author.instances,
        "authorId", {displayProp: "name"});
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
        authorIdRefs: [],
        publisher_id: createFormEl.selectPublisher.value
    };
    // check all input fields and show error messages
    createFormEl.isbn.setCustomValidity(
        Movie.checkIsbnAsId(slots.isbn).message);
    /* SIMPLIFIED CODE: no before-submit validation of name */
    // get the list of selected authors
    const selAuthOptions = createFormEl.selectAuthors.selectedOptions;
    // check the mandatory value constraint for authors
    createFormEl.selectAuthors.setCustomValidity(
        selAuthOptions.length > 0 ? "" : "No author selected!"
    );
    // save the input data only if all form fields are valid
    if (createFormEl.checkValidity()) {
        // construct a list of author ID references
        for (const opt of selAuthOptions) {
            slots.authorIdRefs.push(opt.value);
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
        selectAuthorsWidget = formEl.querySelector(".MultiChoiceWidget"),
        selectPublisherEl = formEl.selectPublisher,
        isbn = formEl.selectMovie.value;
    if (isbn) {
        const movie = Movie.instances[isbn];
        formEl.isbn.value = movie.isbn;
        formEl.title.value = movie.title;
        formEl.year.value = movie.year;
        // set up the associated publisher selection list
        fillSelectWithOptions(selectPublisherEl, Publisher.instances, "name");
        // set up the associated authors selection widget
        createMultipleChoiceWidget(selectAuthorsWidget, movie.authors,
            Author.instances, "authorId", "name", 1);  // minCard=1
        // assign associated publisher as the selected option to select element
        if (movie.publisher) formEl.selectPublisher.value = movie.publisher.name;
        saveButton.disabled = false;
    } else {
        formEl.reset();
        formEl.selectPublisher.selectedIndex = 0;
        selectAuthorsWidget.innerHTML = "";
        saveButton.disabled = true;
    }
});
// handle Save button click events
updateFormEl["commit"].addEventListener("click", function () {
    const movieIdRef = selectUpdateMovieEl.value,
        selectAuthorsWidget = updateFormEl.querySelector(".MultiChoiceWidget"),
        multiChoiceListEl = selectAuthorsWidget.firstElementChild;
    if (!movieIdRef) return;
    const slots = {
        isbn: updateFormEl.isbn.value,
        title: updateFormEl.title.value,
        year: updateFormEl.year.value,
        publisher_id: updateFormEl.selectPublisher.value
    }
    // add event listeners for responsive validation
    /* MISSING CODE */
    // commit the update only if all form field values are valid
    if (updateFormEl.checkValidity()) {
        // construct authorIdRefs-ToAdd/ToRemove lists from the association list
        const authorIdRefsToAdd = [], authorIdRefsToRemove = [];
        for (const mcListItemEl of multiChoiceListEl.children) {
            if (mcListItemEl.classList.contains("removed")) {
                authorIdRefsToRemove.push(mcListItemEl.getAttribute("data-value"));
            }
            if (mcListItemEl.classList.contains("added")) {
                authorIdRefsToAdd.push(mcListItemEl.getAttribute("data-value"));
            }
        }
        // if the add/remove list is non-empty create a corresponding slot
        if (authorIdRefsToRemove.length > 0) {
            slots.authorIdRefsToRemove = authorIdRefsToRemove;
        }
        if (authorIdRefsToAdd.length > 0) {
            slots.authorIdRefsToAdd = authorIdRefsToAdd;
        }
    }
    Movie.update(slots);
    // update the movie selection list's option element
    selectUpdateMovieEl.options[selectUpdateMovieEl.selectedIndex].text = slots.title;
    selectAuthorsWidget.innerHTML = "";
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
        // set up the author selection list
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