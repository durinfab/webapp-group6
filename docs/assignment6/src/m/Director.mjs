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
class Director extends Person {
  // using a single record parameter with ES6 function parameter destructuring
  constructor ({personId, name}) {
    super({personId, name});
  }
  toString() {
    return `Director{ persID: ${this.personId}, name: ${this.name} }`;
  }
}
/*****************************************************
 *** Class-level ("static") properties ***************
 *****************************************************/
// initially an empty collection (in the form of a map)
Director.instances = {};
// add Actor to the list of Person subtypes
Person.subtypes.push( Director);

/**********************************************************
 ***  Class-level ("static") storage management methods ***
 **********************************************************/
/**
 *  Create a new Actor record
 */
Director.add = function (slots) {
  var director = null;
  try {
    director = new Director( slots);
  } catch (e) {
    console.log(`${e.constructor.name + ": " + e.message}`);
    actor = null;
  }
  if (Actor) {
    Director.instances[director.personId] = director;
    console.log(`Saved: ${director.name}`);
  }
};
/**
 *  Update an existing Actor record
 */
Director.update = function ({personId, name}) {
  const director = Director.instances[personId],
        objectBeforeUpdate = cloneObject( director);
  var noConstraintViolated=true, updatedProperties=[];
  try {
    if (name && director.name !== name) {
      director.name = name;
      updatedProperties.push("name");
    }
  } catch (e) {
    console.log( e.constructor.name + ": " + e.message);
    noConstraintViolated = false;
    // restore object to its state before updating
    Director.instances[personId] = objectBeforeUpdate;
  }
  if (noConstraintViolated) {
    if (updatedProperties.length > 0) {
      let ending = updatedProperties.length > 1 ? "ies" : "y";
      console.log(`Propert${ending} ${updatedProperties.toString()} modified for director ${name}`);
    } else {
      console.log(`No property value changed for director ${name}!`);
    }
  }
};
/**
 *  Delete an existing Actor record
 */
Director.destroy = function (personId) {
  const director = Director.instances[personId];
  delete Director.instances[personId];
  console.log(`Director ${director.name} deleted.`);
};
/**
 *  Retrieve all Actor objects as records
 */
Director.retrieveAll = function () {
  var directors = {};
  if (!localStorage["Directors"]) localStorage["Directors"] = "{}";
  try {
    directors = JSON.parse( localStorage["Directors"]);
  } catch (e) {
    console.log("Error when reading from Local Storage\n" + e);
  }
  for (const key of Object.keys( directors)) {
    try {  // convert record to (typed) object
      Director.instances[key] = new Director( directors[key]);
      // create superclass extension
      Person.instances[key] = Director.instances[key];
    } catch (e) {
      console.log(`${e.constructor.name} while deserializing director ${key}: ${e.message}`);
    }
  }
  console.log(`${Object.keys( Director.instances).length} director records loaded.`);
};
/**
 *  Save all Actor objects as records
 */
Director.saveAll = function () {
  try {
    localStorage["Directors"] = JSON.stringify( Director.instances);
    console.log( Object.keys( Director.instances).length +" Directors saved.");
  } catch (e) {
    alert("Error when writing to Local Storage\n" + e);
  }
};

export default Director;
