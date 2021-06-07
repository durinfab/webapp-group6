/**
 * @fileOverview  The model class Person with property definitions, (class-level)
 *                check methods, setter methods, and the special methods saveAll and retrieveAll
 * @person Gerd Wagner
 */
import Movie from "./Movie.mjs";
import {cloneObject, isIntegerOrIntegerString} from "../../lib/util.mjs";
import {
    NoConstraintViolation, MandatoryValueConstraintViolation,
    RangeConstraintViolation, UniquenessConstraintViolation,
    ReferentialIntegrityConstraintViolation
} from "../../lib/errorTypes.mjs";
import {Enumeration} from "../../lib/Enumeration.mjs";

const PersonRoleEL = new Enumeration(["Director","Actor","Actor_and_Director"]);

/**
 * The class Person
 * @class
 * @param {object} slots - Object creation slots.
 */

class Person {
    // using a single record parameter with ES6 function parameter destructuring
    constructor({personId, name}) {

        // assign properties by invoking implicit setters
        this.personId = personId;  // number (integer)
        this.name = name;  // string
    }

    get personId() {

        return this._personId;
    }

    static checkPersonId(id) {

        if (!id) {
            return new NoConstraintViolation();  // may be optional as an IdRef
        } else {
            id = parseInt(id);  // convert to integer
            if (isNaN(id) || !Number.isInteger(id) || id < 1) {
                return new RangeConstraintViolation("The person ID must be a positive integer!");
            } else {
                return new NoConstraintViolation();
            }
        }
    }

    static checkPersonIdAsId(id) {

        let constraintViolation = Person.checkPersonId(id);
        if ((constraintViolation instanceof NoConstraintViolation)) {
            // convert to integer
            id = parseInt(id);
            if (isNaN(id)) {
                return new MandatoryValueConstraintViolation(
                    "A positive integer value for the person ID is required!");
            } else if (Person.instances[String(id)]) {  // convert to string if number
                constraintViolation = new UniquenessConstraintViolation(
                    "There is already a person record with this person ID!");
            } else {
                constraintViolation = new NoConstraintViolation();
            }
        }
        return constraintViolation;
    }

    static getRoleFromPersonId(id) {
        const person = Person.instances[id];
        return person.role;
    }

    static checkPersonIdAsIdRef(id) {

        let constraintViolation = Person.checkPersonId(id);
        if ((constraintViolation instanceof NoConstraintViolation) && id) {
            if (!Person.instances[String(id)]) {
                constraintViolation = new ReferentialIntegrityConstraintViolation(
                    "There is no person record with this person ID!");
            }
        }
        return constraintViolation;
    }

    static checkName(name) {

        if (!name) {
            return new NoConstraintViolation();  // not mandatory
        } else {
            if (typeof name !== "string" || name.trim() === "") {
                return new RangeConstraintViolation(
                    "The name must be a non-empty string!");
            } else {
                return new NoConstraintViolation();
            }
        }
    }

    set personId(id) {

        const constraintViolation = Person.checkPersonIdAsId(id);
        if (constraintViolation instanceof NoConstraintViolation) {
            this._personId = parseInt(id);
        } else {
            throw constraintViolation;
        }
    }

    get name() {

        return this._name;
    }

    set name(name) {

        /*SIMPLIFIED CODE: no validation with Person.checkName */
        this._name = name;
    }

    get role() {return this._role;}
    
    static checkRole( r) {
        if (r === undefined) {
          return new NoConstraintViolation();  // category is optional
        } else if (!isIntegerOrIntegerString( r) || parseInt( r) < 1 ||
            parseInt( r) > PersonRoleEL.MAX) {
          return new RangeConstraintViolation(
              `Invalid value for role: ${r}`);
        } else {
          return new NoConstraintViolation();
        }
    }

    set role( r) {
        var validationResult = null;
        validationResult = Person.checkRole( r);
        if (validationResult instanceof NoConstraintViolation) {
          this._role = parseInt( r);
        } else {
          throw validationResult;
        }
    }


    toJSON() {  // is invoked by JSON.stringify
        let rec = {};
        for (const p of Object.keys(this)) {
            // remove underscore prefix
            if (p.charAt(0) === "_") rec[p.substr(1)] = this[p];
        }
        return rec;
    }
}

/****************************************************
 *** Class-level ("static") properties ***************
 *****************************************************/
// initially an empty collection (in the form of a map)
Person.instances = {};

/**********************************************************
 ***  Class-level ("static") storage management methods ***
 **********************************************************/
/**
 *  Create a new person record/object
 */
Person.add = function (slots) {

    let person;
    try {
        person = new Person(slots);
    } catch (e) {
        console.log(`${e.constructor.name}: ${e.message}`);
        person = null;
    }
    if (person) {
        Person.instances[person.personId] = person;
        console.log(`Saved: ${person.name}`);
    }
};

/**
 *  Update an existing person record/object
 */
Person.update = function ({personId, name, role}) {

    const person = Person.instances[String(personId)],
        objectBeforeUpdate = cloneObject(person);
    let noConstraintViolated = true, ending = "", updatedProperties = [];
    try {
        if (name && person.name !== name) {
            person.name = name;
            updatedProperties.push("name");
        }
        if (role && role !== person.role) {
            person.role = role;
            updatedProperties.push("role");
        }
    } catch (e) {
        console.log(`${e.constructor.name}: ${e.message}`);
        noConstraintViolated = false;
        // restore object to its state before updating
        Person.instances[personId] = objectBeforeUpdate;
    }
    if (noConstraintViolated) {
        if (updatedProperties.length > 0) {
            ending = updatedProperties.length > 1 ? "ies" : "y";
            console.log(`Propert${ending} ${updatedProperties.toString()} modified for person ${name}`);
        } else {
            console.log(`No property value changed for person ${name}!`);
        }
    }
};

/**
 *  Delete an person object/record
 *  Since the movie-person association is unidirectional, a linear search on all
 *  movies is required for being able to delete the person from the movies' persons.
 */
Person.destroy = function (personId) {

    const person = Person.instances[personId];

    if (!person) {
        console.log(`There is no person with ID ${personId} in the database!`);
        return false;
    }

    // make sure person to delete is director of no movie
    for (const movieId of Object.keys(Movie.instances)) {
        const movie = Movie.instances[movieId];

        if (movie.directorId == personId) {
            console.log(`Person ${person.name} cannot be deleted as it's the director of movie ${movie.title}.`);
            return false;
        }
    }

    // delete all dependent movie records
    for (const movieId of Object.keys(Movie.instances)) {
        const movie = Movie.instances[movieId];

        if (movie.actors[personId]) {

            delete movie.actors[personId];
            // movie.removeActor(personId);
        }
    }

    // delete the person object

    console.log("delete Person.instances[id]")

    delete Person.instances[personId];
    console.log(`Person ${person.name} deleted.`);

    return true;
};


/**
 *  Load all person records and convert them to objects
 */
Person.retrieveAll = function () {

    let persons;
    if (!localStorage["persons"]) localStorage["persons"] = "{}";
    try {
        persons = JSON.parse(localStorage["persons"]);
    } catch (e) {
        console.log("Error when reading from Local Storage\n" + e);
        persons = {};
    }
    for (const key of Object.keys(persons)) {
        try {
            // convert record to (typed) object
            Person.instances[key] = new Person(persons[key]);
        } catch (e) {
            console.log(`${e.constructor.name} while deserializing person ${key}: ${e.message}`);
        }
    }
    console.log(`${Object.keys(persons).length} person records loaded.`);
};

/**
 *  Save all person objects as records
 */
Person.saveAll = function () {

    const nmrOfPersons = Object.keys(Person.instances).length;
    try {
        localStorage["persons"] = JSON.stringify(Person.instances);
        console.log(`${nmrOfPersons} person records saved.`);
    } catch (e) {
        alert("Error when writing to Local Storage\n" + e);
    }
};

export default Person;
export {PersonRoleEL}
