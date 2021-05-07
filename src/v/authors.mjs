/**
 * @fileOverview  View code of UI for managing Actor data
 * @author Gerd Wagner
 */
/***************************************************************
 Import classes, datatypes and utility procedures
 ***************************************************************/
import Actor from "../m/Actor.mjs";
import Director from "../m/Director.mjs";
import Movie from "../m/Movie.mjs";
import {fillSelectWithOptions} from "../../lib/util.mjs";

/***************************************************************
 Load data
 ***************************************************************/
Actor.retrieveAll();
Director.retrieveAll();
Movie.retrieveAll();

/***************************************************************
 Set up general, use-case-independent UI elements
 ***************************************************************/
// set up back-to-menu buttons for all use cases
for (let btn of document.querySelectorAll("button.back-to-menu")) {
    btn.addEventListener('click', function () {
        refreshManageDataUI();
    });
}
// neutralize the submit event for all use cases
for (let frm of document.querySelectorAll("section > form")) {
    frm.addEventListener("submit", function (e) {
        e.preventDefault();
        frm.reset();
    });
}
// save data when leaving the page
window.addEventListener("beforeunload", function () {
    Actor.saveAll();
    // also save movies because movies may be deleted when an author is deleted
    Movie.saveAll();
});

/**********************************************
 Use case Retrieve and List All Actors
 **********************************************/
document.getElementById("retrieveAndListAll")
    .addEventListener("click", function () {
        const tableBodyEl = document.querySelector("section#Actor-R > table > tbody");
        tableBodyEl.innerHTML = "";
        for (let key of Object.keys(Actor.instances)) {
            const author = Actor.instances[key];
            const row = tableBodyEl.insertRow();
            row.insertCell().textContent = author.authorId;
            row.insertCell().textContent = author.name;
        }
        document.getElementById("Actor-M").style.display = "none";
        document.getElementById("Actor-R").style.display = "block";
    });

/**********************************************
 Use case Create Actor
 **********************************************/
const createFormEl = document.querySelector("section#Actor-C > form");
document.getElementById("create")
    .addEventListener("click", function () {
        document.getElementById("Actor-M").style.display = "none";
        document.getElementById("Actor-C").style.display = "block";
        createFormEl.reset();
    });
// set up event handlers for responsive constraint validation
createFormEl.authorId.addEventListener("input", function () {
    createFormEl.authorId.setCustomValidity(
        Actor.checkActorIdAsId(createFormEl.authorId.value).message);
});
/* SIMPLIFIED CODE: no responsive validation of name */

// handle Save button click events
createFormEl["commit"].addEventListener("click", function () {
    const slots = {
        authorId: createFormEl.authorId.value,
        name: createFormEl.name.value
    };
    // check all input fields and show error messages
    createFormEl.authorId.setCustomValidity(
        Actor.checkActorIdAsId(slots.authorId).message);
    /* SIMPLIFIED CODE: no before-submit validation of name */
    // save the input data only if all form fields are valid
    if (createFormEl.checkValidity()) Actor.add(slots);
});

/**********************************************
 Use case Update Actor
 **********************************************/
const updateFormEl = document.querySelector("section#Actor-U > form");
const selectUpdateActorEl = updateFormEl.selectActor;
document.getElementById("update")
    .addEventListener("click", function () {
        document.getElementById("Actor-M").style.display = "none";
        document.getElementById("Actor-U").style.display = "block";
        // set up the author selection list
        fillSelectWithOptions(selectUpdateActorEl, Actor.instances,
            "authorId", {displayProp: "name"});
        updateFormEl.reset();
    });
selectUpdateActorEl.addEventListener("change", handleActorSelectChangeEvent);

// handle Save button click events
updateFormEl["commit"].addEventListener("click", function () {
    const authorIdRef = selectUpdateActorEl.value;
    if (!authorIdRef) return;
    const slots = {
        authorId: updateFormEl.authorId.value,
        name: updateFormEl.name.value
    }
    // check all property constraints
    /* SIMPLIFIED CODE: no before-save validation of name */
    // save the input data only if all of the form fields are valid
    if (selectUpdateActorEl.checkValidity()) {
        Actor.update(slots);
        // update the author selection list's option element
        selectUpdateActorEl.options[selectUpdateActorEl.selectedIndex].text = slots.name;
    }
});

/**
 * handle author selection events
 * when a author is selected, populate the form with the data of the selected author
 */
function handleActorSelectChangeEvent() {
    var key = "", auth = null;
    key = updateFormEl.selectActor.value;
    if (key) {
        auth = Actor.instances[key];
        updateFormEl.authorId.value = auth.authorId;
        updateFormEl.name.value = auth.name;
    } else {
        updateFormEl.reset();
    }
}

/**********************************************
 Use case Delete Actor
 **********************************************/
const deleteFormEl = document.querySelector("section#Actor-D > form");
const selectDeleteActorEl = deleteFormEl.selectActor;
document.getElementById("destroy")
    .addEventListener("click", function () {
        document.getElementById("Actor-M").style.display = "none";
        document.getElementById("Actor-D").style.display = "block";
        // set up the author selection list
        fillSelectWithOptions(selectDeleteActorEl, Actor.instances,
            "authorId", {displayProp: "name"});
        deleteFormEl.reset();
    });
// handle Delete button click events
deleteFormEl["commit"].addEventListener("click", function () {
    const authorIdRef = selectDeleteActorEl.value;
    if (!authorIdRef) return;
    if (confirm("Do you really want to delete this author?")) {
        Actor.destroy(authorIdRef);
        selectDeleteActorEl.remove(deleteFormEl.selectActor.selectedIndex);
    }
});

/**********************************************
 * Refresh the Manage Actors Data UI
 **********************************************/
function refreshManageDataUI() {
    // show the manage author UI and hide the other UIs
    document.getElementById("Actor-M").style.display = "block";
    document.getElementById("Actor-R").style.display = "none";
    document.getElementById("Actor-C").style.display = "none";
    document.getElementById("Actor-U").style.display = "none";
    document.getElementById("Actor-D").style.display = "none";
}

// Set up Manage Actors UI
refreshManageDataUI();
