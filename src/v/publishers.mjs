/**
 * @fileOverview  View code of UI for managing Publisher data
 * @author Gerd Wagner
 */
/***************************************************************
 Import classes, datatypes and utility procedures
 ***************************************************************/
import Author from "../m/Author.mjs";
import Publisher from "../m/Publisher.mjs";
import Book from "../m/Book.mjs";
import { fillSelectWithOptions } from "../../lib/util.mjs";

/***************************************************************
 Load data
 ***************************************************************/
Author.retrieveAll();
Publisher.retrieveAll();
Book.retrieveAll();

/***************************************************************
 Set up general, use-case-independent UI elements
 ***************************************************************/
// set up back-to-menu buttons for all use cases
for (let btn of document.querySelectorAll("button.back-to-menu")) {
  btn.addEventListener('click', function () {refreshManageDataUI();});
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
  Publisher.saveAll();
  // also save books because books may be deleted when an publisher is deleted
  Book.saveAll();
});

/**********************************************
 Use case Retrieve/List All Publishers
 **********************************************/
document.getElementById("retrieveAndListAll")
  .addEventListener("click", function () {
    const tableBodyEl = document
      .querySelector("section#Publisher-R > table > tbody");
    tableBodyEl.innerHTML = "";
    for (const key of Object.keys(Publisher.instances)) {
      const publisher = Publisher.instances[key];
      const row = tableBodyEl.insertRow();
      row.insertCell().textContent = publisher.name;
      row.insertCell().textContent = publisher.address;
    }
    document.getElementById("Publisher-M").style.display = "none";
    document.getElementById("Publisher-R").style.display = "block";
  });

/**********************************************
 Use case Create Publisher
 **********************************************/
const createFormEl = document.querySelector("section#Publisher-C > form");
document.getElementById("create")
  .addEventListener("click", function () {
    document.getElementById("Publisher-M").style.display = "none";
    document.getElementById("Publisher-C").style.display = "block";
    createFormEl.reset();
  });
// set up event handlers for responsive constraint validation
createFormEl.name.addEventListener("input", function () {
  createFormEl.name.setCustomValidity(
    Publisher.checkNameAsId( createFormEl.name.value).message);
});
/* SIMPLIFIED CODE: no responsive validation of address */

// handle Save button click events
createFormEl["commit"].addEventListener("click", function () {
  const slots = {
    name: createFormEl.name.value,
    address: createFormEl.address.value
  };
  // check all input fields and show error messages
  createFormEl.name.setCustomValidity( Publisher.checkNameAsId( slots.name).message);
  /* SIMPLIFIED CODE: no before-submit validation of name */
  // save the input data only if all form fields are valid
  if (createFormEl.checkValidity()) Publisher.add( slots);
});

/**********************************************
 * Use case Update Publisher
**********************************************/
const updateFormEl = document.querySelector("section#Publisher-U > form");
const selectUpdatePublisherEl = updateFormEl.selectPublisher;
document.getElementById("update")
  .addEventListener("click", function () {
    document.getElementById("Publisher-M").style.display = "none";
    document.getElementById("Publisher-U").style.display = "block";
    // set up the publisher selection list
    fillSelectWithOptions( selectUpdatePublisherEl, Publisher.instances,
      "name");
    updateFormEl.reset();
  });
selectUpdatePublisherEl.addEventListener("change", handlePublisherSelectChangeEvent);
// handle Save button click events
updateFormEl["commit"].addEventListener("click", function () {
  const publisherIdRef = selectUpdatePublisherEl.value;
  if (!publisherIdRef) return;
  const slots = {
    name: updateFormEl.name.value,
    address: updateFormEl.address.value
  }
  // check all property constraints
  /* SIMPLIFIED CODE: no before-save validation of name */
  // save the input data only if all of the form fields are valid
  if (selectUpdatePublisherEl.checkValidity()) {
    Publisher.update( slots);
    // update the publisher selection list's option element
    selectUpdatePublisherEl.options[selectUpdatePublisherEl.selectedIndex].text = slots.name;
  }
});
/**
 * handle publisher selection events
 * when a publisher is selected, populate the form with the data of the selected publisher
 */
function handlePublisherSelectChangeEvent() {
  var key = "", publ = null;
  key = updateFormEl.selectPublisher.value;
  if (key) {
    publ = Publisher.instances[key];
    updateFormEl.name.value = publ.name;
    updateFormEl.address.value = publ.address || "";
  } else {
    updateFormEl.reset();
  }
}

/**********************************************
 * Use case Delete Publisher
**********************************************/
const deleteFormEl = document.querySelector("section#Publisher-D > form");
const selectDeletePublisherEl = deleteFormEl.selectPublisher;
document.getElementById("destroy")
  .addEventListener("click", function () {
    document.getElementById("Publisher-M").style.display = "none";
    document.getElementById("Publisher-D").style.display = "block";
    // set up the publisher selection list
    fillSelectWithOptions( selectDeletePublisherEl, Publisher.instances,
      "publisherId", {displayProp:"name"});
    deleteFormEl.reset();
  });
// handle Delete button click events
deleteFormEl["commit"].addEventListener("click", function () {
  const publisherIdRef = selectDeletePublisherEl.value;
  if (!publisherIdRef) return;
  if (confirm( "Do you really want to delete this publisher?")) {
    Publisher.destroy( publisherIdRef);
    selectDeletePublisherEl.remove( deleteFormEl.selectPublisher.selectedIndex);
  }
});

/**********************************************
 * Refresh the Manage Publishers Data UI
 **********************************************/
function refreshManageDataUI() {
  // show the manage publisher UI and hide the other UIs
  document.getElementById("Publisher-M").style.display = "block";
  document.getElementById("Publisher-R").style.display = "none";
  document.getElementById("Publisher-C").style.display = "none";
  document.getElementById("Publisher-U").style.display = "none";
  document.getElementById("Publisher-D").style.display = "none";
}

// Set up Manage Publishers UI
refreshManageDataUI();
