/**
 * @fileOverview  View code of UI for managing Movie data
 * @person Gerd Wagner
 */
/***************************************************************
 Import classes, datatypes and utility procedures
 ***************************************************************/
import Person from "../m/Person.mjs";
import Movie, {MovieGenreEL} from "../m/Movie.mjs";
import {fillSelectWithOptions, fillSelectWithOptions2, createListFromMap, createMultipleChoiceWidget}
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
document.getElementById("retrieveAndListAll").addEventListener("click", function () {

    document.getElementById("Movie-M").style.display = "none";
    document.getElementById("Movie-R").style.display = "block";

    const tableBodyEl = document.querySelector("section#Movie-R>table>tbody");
    tableBodyEl.innerHTML = "";  // drop old content

    for (const key of Object.keys(Movie.instances)) {
        const movie = Movie.instances[key];
        // create list of persons for this movie
        const actorListEl = createListFromMap(movie._actors, "name");
        const row = tableBodyEl.insertRow();
        row.insertCell().textContent = movie.movieId;
        row.insertCell().textContent = movie.title;

        row.insertCell().textContent = Movie.dateToString(movie.releaseDate);
        row.insertCell().appendChild(actorListEl);
        // if the movie has a director, show its name
        row.insertCell().textContent =
            Person.instances[movie.directorId] ? Person.instances[movie.directorId].name : "";


        // if the movie has a genre, show related information
        if (movie.movieGenre) {

            switch (movie.movieGenre) {
                case MovieGenreEL.BIOGRAPHY:
                    row.insertCell().textContent = "Biography about " + Person.instances[movie.about].name;
                    break;
                case MovieGenreEL.TVSERIESEPISODE:
                    row.insertCell().textContent = movie.episodeTitle + ", Episode " + movie.episodeNo;
                    break;
                default:
                    console.log("movies.mjs genre " + movie.movieGenre)
            }
        } else {
            row.insertCell().textContent = "---";
        }


    }
});

/**********************************************
 Use case Create Movie
 **********************************************/
const createFormEl = document.querySelector("section#Movie-C > form");
// const selectPersonsEl = document.querySelector("section#Movie-U > form");

const selectActorsEl = document.forms["createMovie"].selectActors;
const selectDirectorEL = document.forms["createMovie"].selectDirector;

const selectMovieGenreEL = document.forms["createMovie"].selectMovieGenre;
const selectAboutEL = document.forms["createMovie"].selectAbout;

document.getElementById("create").addEventListener("click", function () {
    document.getElementById("Movie-M").style.display = "none";
    document.getElementById("Movie-C").style.display = "block";

    // set up a single selection list for selecting a director
    // fillSelectWithOptions(selectPublisherEl, Person.instances, "name");

    // set up a multiple selection list for selecting persons
    fillSelectWithOptions(selectActorsEl, Person.instances,
        "personId", {displayProp: "name"});
    fillSelectWithOptions(selectDirectorEL, Person.instances,
        "personId", {displayProp: "name"});

    fillSelectWithOptions(selectMovieGenreEL, MovieGenreEL.labels);
    fillSelectWithOptions(selectAboutEL, Person.instances,
        "personId", {displayProp: "name"});

    selectAboutEL.disabled = true;
    createFormEl.episodeTitle.disabled = true;
    createFormEl.episodeNo.disabled = true;

    createFormEl.reset();
});


// set up event handlers for responsive constraint validation
createFormEl.movieId.addEventListener("input", function () {
    createFormEl.movieId.setCustomValidity(
        Movie.validateMovieID(createFormEl.movieId.value).message);
});
createFormEl.title.addEventListener("input", function () {
    createFormEl.title.setCustomValidity(
        Movie.validateTitle(createFormEl.title.value).message);
});
createFormEl.releaseDate.addEventListener("input", function () {
    createFormEl.releaseDate.setCustomValidity(
        Movie.validateDate(createFormEl.releaseDate.value).message);
});
createFormEl.selectDirector.addEventListener("input", function () {
    createFormEl.selectDirector.setCustomValidity(
        Movie.validateDirector(createFormEl.selectDirector.value).message);
});

createFormEl.selectMovieGenre.addEventListener("change", function () {
    let value = createFormEl.selectMovieGenre.value ? createFormEl.selectMovieGenre.value : -1;
    value++;
    switch(value) {
        case MovieGenreEL.BIOGRAPHY :

            selectAboutEL.disabled = false;
            createFormEl.episodeTitle.disabled = true;
            createFormEl.episodeTitle.value = "";
            createFormEl.episodeNo.disabled = true;
            createFormEl.episodeNo.value = "";
            break;

        case MovieGenreEL.TVSERIESEPISODE :

            selectAboutEL.disabled = true;
            selectAboutEL.value = "";
            createFormEl.episodeTitle.disabled = false;
            createFormEl.episodeNo.disabled = false;
            break;

        default:

            selectAboutEL.disabled = true;
            selectAboutEL.value = "";
            createFormEl.episodeTitle.disabled = true;
            createFormEl.episodeTitle.value = "";
            createFormEl.episodeNo.disabled = true;
            createFormEl.episodeNo.value = "";
    }
});
/*
createFormEl.episodeNo.addEventListener("input", function () {
    createFormEl.movieId.setCustomValidity(
        Movie.checkEpisodeNo(createFormEl.episodeNo.value, createFormEl.selectMovieGenre.value).message);
});
*/

// handle Save button click events
createFormEl["commit"].addEventListener("click", function () {
    const slots = {
        movieId: createFormEl.movieId.value,
        title: createFormEl.title.value,
        releaseDate: createFormEl.releaseDate.value,
        actors: [],
        directorId: createFormEl.selectDirector.value,

    };

    let genre = createFormEl.selectMovieGenre.value;
    if (genre) {
        slots.movieGenre = parseInt(genre) + 1;
        switch(slots.movieGenre) {
            case MovieGenreEL.BIOGRAPHY :
                slots.about = createFormEl.selectAbout.value;
                break;

            case MovieGenreEL.TVSERIESEPISODE :
                slots.episodeTitle = createFormEl.episodeTitle.value;
                slots.episodeNo = createFormEl.episodeNo.value;

                createFormEl.episodeNo.setCustomValidity(
                    Movie.checkEpisodeNo(slots.episodeNo, slots.movieGenre).message);
                break;
        }
    }

    // check all input fields and show error messages
    createFormEl.movieId.setCustomValidity(
        Movie.validateMovieID(slots.movieId).message);
    createFormEl.selectDirector.setCustomValidity(
        Movie.validateDirector(slots.directorId).message);


    // get the list of selected persons
    const selAuthOptions = selectActorsEl.selectedOptions;

    // save the input data only if all form fields are valid
    if (createFormEl.checkValidity()) {
        // construct a list of person ID references
        for (const opt of selAuthOptions) {
            slots.actors.push(opt.value);
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
    fillSelectWithOptions(selectUpdateMovieEl, Movie.instances, "movieId", {displayProp: "title"});
    updateFormEl.reset();
});

/**
 * handle movie selection events: when a movie is selected,
 * populate the form with the data of the selected movie
 */
selectUpdateMovieEl.addEventListener("change", function () {
    const formEl = document.querySelector("section#Movie-U > form"),
        saveButton = formEl.commit,
        selectDirectorEl = formEl.selectDirector,
        selectActorsWidget = formEl.querySelector(".MultiChoiceWidget"),
        movieId = formEl.selectMovie.value,

        selectMovieGenreEL = formEl.selectMovieGenre,
        selectAboutEL = formEl.selectAbout;

    if (movieId) {
        const movie = Movie.instances[movieId];

        formEl.movieId.value = movie.movieId;
        formEl.title.value = movie.title;
        formEl.releaseDate.value = Movie.dateToString(movie.releaseDate); // movie.releaseDate;

        // set up director selection list
        fillSelectWithOptions2(selectDirectorEl, Person.instances, "name");

        // autoselect current movie director
        formEl.selectDirector.value = Person.instances[movie.directorId].name;

        // set up actor selection list
        createMultipleChoiceWidget(selectActorsWidget, movie.actors, Person.instances, "personId", "name", 1);  // minCard=1

        // set up genre selection list and implications
        fillSelectWithOptions(selectMovieGenreEL, MovieGenreEL.labels);
        fillSelectWithOptions(selectAboutEL, Person.instances, "personId", {displayProp: "name"});
        if (movie.movieGenre) {

            switch(movie.movieGenre) {

                case MovieGenreEL.BIOGRAPHY :
                    formEl.selectMovieGenre.value = MovieGenreEL.BIOGRAPHY - 1;
                    formEl.selectAbout.value = movie.about;
                    break;

                case MovieGenreEL.TVSERIESEPISODE :
                    formEl.selectMovieGenre.value = MovieGenreEL.TVSERIESEPISODE - 1;
                    formEl.episodeTitle.value = movie.episodeTitle;
                    formEl.episodeNo.value = movie.episodeNo;
                    break;
            }
        }

        // call onChange of movieGenre field to trigger disabling
        formEl.selectMovieGenre.dispatchEvent(new Event('change'));

        saveButton.disabled = false;
    } else {
        formEl.reset();
        selectActorsWidget.selectedIndex = 0;
        selectActorsWidget.innerHTML = "";
        saveButton.disabled = true;
    }
});

// onchange of movieGenre
updateFormEl.selectMovieGenre.addEventListener("change", function () {
    let value = updateFormEl.selectMovieGenre.value ? updateFormEl.selectMovieGenre.value : -1;
    value++;
    switch(value) {
        case MovieGenreEL.BIOGRAPHY :
            updateFormEl.selectAbout.disabled = false;
            updateFormEl.episodeTitle.disabled = true;
            updateFormEl.episodeTitle.value = "";
            updateFormEl.episodeNo.disabled = true;
            updateFormEl.episodeNo.value = "";
            break;

        case MovieGenreEL.TVSERIESEPISODE :
            updateFormEl.selectAbout.disabled = true;
            updateFormEl.selectAbout.value = "";
            updateFormEl.episodeTitle.disabled = false;
            updateFormEl.episodeNo.disabled = false;
            break;

        default:
            updateFormEl.selectAbout.disabled = true;
            updateFormEl.selectAbout.value = "";
            updateFormEl.episodeTitle.disabled = true;
            updateFormEl.episodeTitle.value = "";
            updateFormEl.episodeNo.disabled = true;
            updateFormEl.episodeNo.value = "";
    }
});

function personNameToId(searchedName) {
    for (const key of Object.keys(Person.instances)) {
        const person = Person.instances[key];
        if (person.name === searchedName) {
            return person.personId;
        }
    }
}

// handle Save button click events
updateFormEl["commit"].addEventListener("click", function () {
    const movieIdRef = selectUpdateMovieEl.value,
        selectActorsWidget = updateFormEl.querySelector(".MultiChoiceWidget"),
        multiChoiceListEl = selectActorsWidget.firstElementChild;
    if (!movieIdRef) return;

    const slots = {
        movieId: updateFormEl.movieId.value,
        title: updateFormEl.title.value,
        releaseDate: updateFormEl.releaseDate.value,
        directorId: personNameToId(updateFormEl.selectDirector.value)
    }

    // add event listeners for responsive validation
    /* MISSING CODE */
    // commit the update only if all form field values are valid
    if (updateFormEl.checkValidity()) {

        // construct actorIdRefs-ToAdd/ToRemove lists from the association list
        const actorIdRefsToAdd = [], actorIdRefsToRemove = [];
        for (const mcListItemEl of multiChoiceListEl.children) {
            if (mcListItemEl.classList.contains("removed")) {
                actorIdRefsToRemove.push(mcListItemEl.getAttribute("data-value"));
            }
            if (mcListItemEl.classList.contains("added")) {
                actorIdRefsToAdd.push(mcListItemEl.getAttribute("data-value"));
            }
        }

        // if the add/remove list is non-empty create a corresponding slot
        if (actorIdRefsToRemove.length > 0) {
            slots.actorIdRefsToRemove = actorIdRefsToRemove;
        }
        if (actorIdRefsToAdd.length > 0) {
            slots.actorIdRefsToAdd = actorIdRefsToAdd;
        }
    }

    let genre = updateFormEl.selectMovieGenre.value;
    if (genre) {
        slots.movieGenre = parseInt(genre) + 1;

        switch(slots.movieGenre) {
            case MovieGenreEL.BIOGRAPHY :
                slots.about = updateFormEl.selectAbout.value;
                break;

            case MovieGenreEL.TVSERIESEPISODE :
                slots.episodeTitle = updateFormEl.episodeTitle.value;
                slots.episodeNo = updateFormEl.episodeNo.value;

                createFormEl.episodeNo.setCustomValidity(
                    Movie.checkEpisodeNo(slots.episodeNo, slots.movieGenre).message);
                break;
        }
    }

    Movie.update(slots);
    // update the movie selection list's option element
    selectUpdateMovieEl.options[selectUpdateMovieEl.selectedIndex].text = slots.title;
    selectActorsWidget.innerHTML = "";
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
            "movieId", {displayProp: "title"});
        deleteFormEl.reset();
    });
// handle Delete button click events
deleteFormEl["commit"].addEventListener("click", function () {
    const movieIdRef = selectDeleteMovieEl.value;
    if (!movieIdRef) return;
    if (confirm("Do you really want to delete this movie?")) {
        Movie.destroy(movieIdRef);
        // remove deleted movie from select options
        deleteFormEl.selectMovie.remove();
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
