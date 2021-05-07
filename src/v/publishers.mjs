/**
 * @fileOverview  View code of UI for managing Director data
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
    Director.saveAll();
    // also save movies because movies may be deleted when an director is deleted
    Movie.saveAll();
});

/**********************************************
 Use case Retrieve/List All Publishers
 **********************************************/
document.getElementById("retrieveAndListAll")
    .addEventListener("click", function () {
        const tableBodyEl = document
            .querySelector("section#Director-R > table > tbody");
        tableBodyEl.innerHTML = "";
        for (const key of Object.keys(Director.instances)) {
            const director = Director.instances[key];
            const row = tableBodyEl.insertRow();
            row.insertCell().textContent = director.name;
            row.insertCell().textContent = director.address;
        }
        document.getElementById("Director-M").style.display = "none";
        document.getElementById("Director-R").style.display = "block";
    });

/**********************************************
 Use case Create Director
 **********************************************/
const createFormEl = document.querySelector("section#Director-C > form");
document.getElementById("create")
    .addEventListener("click", function () {
        document.getElementById("Director-M").style.display = "none";
        document.getElementById("Director-C").style.display = "block";
        createFormEl.reset();
    });
// set up event handlers for responsive constraint validation
createFormEl.name.addEventListener("input", function () {
    createFormEl.name.setCustomValidity(
        Director.checkNameAsId(createFormEl.name.value).message);
});
/* SIMPLIFIED CODE: no responsive validation of address */

// handle Save button click events
createFormEl["commit"].addEventListener("click", function () {
    const slots = {
        name: createFormEl.name.value,
        address: createFormEl.address.value
    };
    // check all input fields and show error messages
    createFormEl.name.setCustomValidity(Director.checkNameAsId(slots.name).message);
    /* SIMPLIFIED CODE: no before-submit validation of name */
    // save the input data only if all form fields are valid
    if (createFormEl.checkValidity()) Director.add(slots);
});

/**********************************************
 * Use case Update Director
 **********************************************/
const updateFormEl = document.querySelector("section#Director-U > form");
const selectUpdatePublisherEl = updateFormEl.selectPublisher;
document.getElementById("update")
    .addEventListener("click", function () {
        document.getElementById("Director-M").style.display = "none";
        document.getElementById("Director-U").style.display = "block";
        // set up the director selection list
        fillSelectWithOptions(selectUpdatePublisherEl, Director.instances,
            "name");
        updateFormEl.reset();
    });
selectUpdatePublisherEl.addEventListener("change", handlePublisherSelectChangeEvent);
// handle Save button click events
updateFormEl["commit"].addEventListener("click", function () {
    const directorIdRef = selectUpdatePublisherEl.value;
    if (!directorIdRef) return;
    const slots = {
        name: updateFormEl.name.value,
        address: updateFormEl.address.value
    }
    // check all property constraints
    /* SIMPLIFIED CODE: no before-save validation of name */
    // save the input data only if all of the form fields are valid
    if (selectUpdatePublisherEl.checkValidity()) {
        Director.update(slots);
        // update the director selection list's option element
        selectUpdatePublisherEl.options[selectUpdatePublisherEl.selectedIndex].text = slots.name;
    }
});

/**
 * handle director selection events
 * when a director is selected, populate the form with the data of the selected director
 */
function handlePublisherSelectChangeEvent() {
    var key = "", publ = null;
    key = updateFormEl.selectPublisher.value;
    if (key) {
        publ = Director.instances[key];
        updateFormEl.name.value = publ.name;
        updateFormEl.address.value = publ.address || "";
    } else {
        updateFormEl.reset();
    }
}

/**********************************************
 * Use case Delete Director
 **********************************************/
const deleteFormEl = document.querySelector("section#Director-D > form");
const selectDeletePublisherEl = deleteFormEl.selectPublisher;
document.getElementById("destroy")
    .addEventListener("click", function () {
        document.getElementById("Director-M").style.display = "none";
        document.getElementById("Director-D").style.display = "block";
        // set up the director selection list
        fillSelectWithOptions(selectDeletePublisherEl, Director.instances,
            "directorId", {displayProp: "name"});
        deleteFormEl.reset();
    });
// handle Delete button click events
deleteFormEl["commit"].addEventListener("click", function () {
    const directorIdRef = selectDeletePublisherEl.value;
    if (!directorIdRef) return;
    if (confirm("Do you really want to delete this director?")) {
        Director.destroy(directorIdRef);
        selectDeletePublisherEl.remove(deleteFormEl.selectPublisher.selectedIndex);
    }
});

/**********************************************
 * Refresh the Manage Publishers Data UI
 **********************************************/
function refreshManageDataUI() {
    // show the manage director UI and hide the other UIs
    document.getElementById("Director-M").style.display = "block";
    document.getElementById("Director-R").style.display = "none";
    document.getElementById("Director-C").style.display = "none";
    document.getElementById("Director-U").style.display = "none";
    document.getElementById("Director-D").style.display = "none";
}

// Set up Manage Publishers UI
refreshManageDataUI();
