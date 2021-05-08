/**
 * @fileOverview  The model class Person with property definitions, (class-level)
 *                check methods, setter methods, and the special methods saveAll and retrieveAll
 * @author Gerd Wagner
 */
import Movie from "./Movie.mjs";
import {cloneObject} from "../../lib/util.mjs";
import {
    NoConstraintViolation, MandatoryValueConstraintViolation,
    RangeConstraintViolation, UniquenessConstraintViolation,
    ReferentialIntegrityConstraintViolation
}
    from "../../lib/errorTypes.mjs";

/**
 * The class Person
 * @class
 * @param {object} slots - Object creation slots.
 */
class Person {
    // using a single record parameter with ES6 function parameter destructuring
    constructor({authorId, name}) {
        // assign properties by invoking implicit setters
        this.authorId = authorId;  // number (integer)
        this.name = name;  // string
    }

    get authorId() {
        return this._authorId;
    }

    static checkActorId(id) {
        if (!id) {
            return new NoConstraintViolation();  // may be optional as an IdRef
        } else {
            id = parseInt(id);  // convert to integer
            if (isNaN(id) || !Number.isInteger(id) || id < 1) {
                return new RangeConstraintViolation("The author ID must be a positive integer!");
            } else {
                return new NoConstraintViolation();
            }
        }
    }

    static checkActorIdAsId(id) {
        var constraintViolation = Person.checkActorId(id);
        if ((constraintViolation instanceof NoConstraintViolation)) {
            // convert to integer
            id = parseInt(id);
            if (isNaN(id)) {
                return new MandatoryValueConstraintViolation(
                    "A positive integer value for the author ID is required!");
            } else if (Person.instances[String(id)]) {  // convert to string if number
                constraintViolation = new UniquenessConstraintViolation(
                    "There is already a author record with this author ID!");
            } else {
                constraintViolation = new NoConstraintViolation();
            }
        }
        return constraintViolation;
    }

    static checkActorIdAsIdRef(id) {
        var constraintViolation = Person.checkActorId(id);
        if ((constraintViolation instanceof NoConstraintViolation) && id) {
            if (!Person.instances[String(id)]) {
                constraintViolation = new ReferentialIntegrityConstraintViolation(
                    "There is no author record with this author ID!");
            }
        }
        return constraintViolation;
    }

    set authorId(id) {
        const constraintViolation = Person.checkActorIdAsId(id);
        if (constraintViolation instanceof NoConstraintViolation) {
            this._authorId = parseInt(id);
        } else {
            throw constraintViolation;
        }
    }

    get name() {
        return this._name;
    }

    set name(n) {
        /*SIMPLIFIED CODE: no validation with Person.checkName */
        this._name = n;
    }

    toJSON() {  // is invoked by JSON.stringify
        var rec = {};
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
 *  Create a new author record/object
 */
Person.add = function (slots) {
    var author = null;
    try {
        author = new Person(slots);
    } catch (e) {
        console.log(`${e.constructor.name}: ${e.message}`);
        author = null;
    }
    if (author) {
        Person.instances[author.authorId] = author;
        console.log(`Saved: ${author.name}`);
    }
};
/**
 *  Update an existing author record/object
 */
Person.update = function ({authorId, name}) {
    const author = Person.instances[String(authorId)],
        objectBeforeUpdate = cloneObject(author);
    var noConstraintViolated = true, ending = "", updatedProperties = [];
    try {
        if (name && author.name !== name) {
            author.name = name;
            updatedProperties.push("name");
        }
    } catch (e) {
        console.log(`${e.constructor.name}: ${e.message}`);
        noConstraintViolated = false;
        // restore object to its state before updating
        Person.instances[authorId] = objectBeforeUpdate;
    }
    if (noConstraintViolated) {
        if (updatedProperties.length > 0) {
            ending = updatedProperties.length > 1 ? "ies" : "y";
            console.log(`Propert${ending} ${updatedProperties.toString()} modified for author ${name}`);
        } else {
            console.log(`No property value changed for author ${name}!`);
        }
    }
};
/**
 *  Delete an author object/record
 *  Since the movie-author association is unidirectional, a linear search on all
 *  movies is required for being able to delete the author from the movies' authors.
 */
Person.destroy = function (authorId) {
    const author = Person.instances[authorId];
    // delete all dependent movie records
    for (const isbn of Object.keys(Movie.instances)) {
        const movie = Movie.instances[isbn];
        if (movie.authors[authorId]) delete movie.authors[authorId];
    }
    // delete the author object
    delete Person.instances[authorId];
    console.log(`Actor ${author.name} deleted.`);
};
/**
 *  Load all author records and convert them to objects
 */
Person.retrieveAll = function () {
    var authors = {};
    if (!localStorage["authors"]) localStorage["authors"] = "{}";
    try {
        authors = JSON.parse(localStorage["authors"]);
    } catch (e) {
        console.log("Error when reading from Local Storage\n" + e);
        authors = {};
    }
    for (const key of Object.keys(authors)) {
        try {
            // convert record to (typed) object
            Person.instances[key] = new Person(authors[key]);
        } catch (e) {
            console.log(`${e.constructor.name} while deserializing author ${key}: ${e.message}`);
        }
    }
    console.log(`${Object.keys(authors).length} author records loaded.`);
};
/**
 *  Save all author objects as records
 */
Person.saveAll = function () {
    const nmrOfActors = Object.keys(Person.instances).length;
    try {
        localStorage["authors"] = JSON.stringify(Person.instances);
        console.log(`${nmrOfActors} author records saved.`);
    } catch (e) {
        alert("Error when writing to Local Storage\n" + e);
    }
};

export default Person;
