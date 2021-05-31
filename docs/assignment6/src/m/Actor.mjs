/**
 * @fileOverview  The model class Actor with attribute definitions, (class-level) check methods, 
 *                setter methods, and the special methods saveAll and retrieveAll
 * @Actor Gerd Wagner
 * @copyright Copyright 2013-2014 Gerd Wagner, Chair of Internet Technology, Brandenburg University of Technology, Germany. 
 * @license This code is licensed under The Code Project Open License (CPOL), implying that the code is provided "as-is", 
 * can be modified to create derivative works, can be redistributed, and can be used in commercial applications.
 */
import Person from "./Person.mjs";
import { cloneObject } from "../../lib/util.mjs";

/**
 * The class Actor
 * @class
 */
class Actor extends Person {
  // using a single record parameter with ES6 function parameter destructuring
  constructor ({personId, name}) {
    super({personId, name});
  }
  toString() {
    return `Actor{ persID: ${this.personId}, name: ${this.name} }`;
  }
}
/*****************************************************
 *** Class-level ("static") properties ***************
 *****************************************************/
// initially an empty collection (in the form of a map)
Actor.instances = {};
// add Actor to the list of Person subtypes
Person.subtypes.push( actor);

/**********************************************************
 ***  Class-level ("static") storage management methods ***
 **********************************************************/
/**
 *  Create a new Actor record
 */
Actor.add = function (slots) {
  var actor = null;
  try {
    actor = new Actor( slots);
  } catch (e) {
    console.log(`${e.constructor.name + ": " + e.message}`);
    actor = null;
  }
  if (Actor) {
    Actor.instances[actor.personId] = actor;
    console.log(`Saved: ${actor.name}`);
  }
};
/**
 *  Update an existing Actor record
 */
Actor.update = function ({personId, name}) {
  const actor = Actor.instances[personId],
        objectBeforeUpdate = cloneObject( actor);
  var noConstraintViolated=true, updatedProperties=[];
  try {
    if (name && actor.name !== name) {
      actor.name = name;
      updatedProperties.push("name");
    }
  } catch (e) {
    console.log( e.constructor.name + ": " + e.message);
    noConstraintViolated = false;
    // restore object to its state before updating
    Actor.instances[personId] = objectBeforeUpdate;
  }
  if (noConstraintViolated) {
    if (updatedProperties.length > 0) {
      let ending = updatedProperties.length > 1 ? "ies" : "y";
      console.log(`Propert${ending} ${updatedProperties.toString()} modified for Actor ${name}`);
    } else {
      console.log(`No property value changed for Actor ${name}!`);
    }
  }
};
/**
 *  Delete an existing Actor record
 */
Actor.destroy = function (personId) {
  const actor = Actor.instances[personId];
  delete Actor.instances[personId];
  console.log(`Actor ${actor.name} deleted.`);
};
/**
 *  Retrieve all Actor objects as records
 */
Actor.retrieveAll = function () {
  var actors = {};
  if (!localStorage["Actors"]) localStorage["Actors"] = "{}";
  try {
    Actors = JSON.parse( localStorage["Actors"]);
  } catch (e) {
    console.log("Error when reading from Local Storage\n" + e);
  }
  for (const key of Object.keys( actors)) {
    try {  // convert record to (typed) object
      Actor.instances[key] = new Actor( actors[key]);
      // create superclass extension
      Person.instances[key] = Actor.instances[key];
    } catch (e) {
      console.log(`${e.constructor.name} while deserializing Actor ${key}: ${e.message}`);
    }
  }
  console.log(`${Object.keys( Actor.instances).length} Actor records loaded.`);
};
/**
 *  Save all Actor objects as records
 */
Actor.saveAll = function () {
  try {
    localStorage["Actors"] = JSON.stringify( Actor.instances);
    console.log( Object.keys( Actor.instances).length +" Actors saved.");
  } catch (e) {
    alert("Error when writing to Local Storage\n" + e);
  }
};

export default Actor;
