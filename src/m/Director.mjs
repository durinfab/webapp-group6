/**
 * @fileOverview  The model class Director with property definitions, (class-level) check methods,
 *                setter methods, and the special methods saveAll and retrieveAll
 * @author Gerd Wagner
 */
import Movie from "./Movie.mjs";
import {cloneObject} from "../../lib/util.mjs";
import {
    NoConstraintViolation, MandatoryValueConstraintViolation, RangeConstraintViolation,
    UniquenessConstraintViolation, ReferentialIntegrityConstraintViolation
}
    from "../../lib/errorTypes.mjs";

/**
 * The class Director
 * @class
 * @param {object} slots - Object creation slots.
 */
class Director {
    // using a single record parameter with ES6 function parameter destructuring
    constructor({name, address}) {
        // assign properties by invoking implicit setters
        this.name = name;
        this.address = address;
    }

    get name() {
        return this._name;
    }

    static checkName(n) {
        if (!n) {
            return new NoConstraintViolation();  // not mandatory
        } else {
            if (typeof n !== "string" || n.trim() === "") {
                return new RangeConstraintViolation(
                    "The name must be a non-empty string!");
            } else {
                return new NoConstraintViolation();
            }
        }
    }

    static checkNameAsId(n) {
        var validationResult = Director.checkName(n);
        if ((validationResult instanceof NoConstraintViolation)) {
            if (!n) {
                return new MandatoryValueConstraintViolation(
                    "A director name is required!");
            } else if (Director.instances[n]) {
                return new UniquenessConstraintViolation(
                    "There is already a director record with this name!");
            }
        }
        return validationResult;
    }

    static checkNameAsIdRef(n) {
        var validationResult = Director.checkName(n);
        if ((validationResult instanceof NoConstraintViolation) && n) {
            if (!Director.instances[n]) {
                validationResult = new ReferentialIntegrityConstraintViolation(
                    "There is no director record with this name!");
            }
        }
        return validationResult;
    }

    set name(n) {
        var constraintViolation = Director.checkName(n);
        if (constraintViolation instanceof NoConstraintViolation) {
            this._name = n;
        } else {
            throw constraintViolation;
        }
    }

    get address() {
        return this._address;
    }

    //SIMPLIFIED CODE:  Director.checkAddress has not been defined
    set address(a) {
        //SIMPLIFIED/MISSING CODE:  invoke Director.checkAddress
        this._address = a;
    }

    toString() {
        return `Publisher{ name: ${this.name}, address: ${this.address} }`;
    }

    toJSON() {  // is invoked by JSON.stringify
        var rec = {};
        for (let p of Object.keys(this)) {
            // remove underscore prefix
            if (p.charAt(0) === "_") rec[p.substr(1)] = this[p];
        }
        return rec;
    }
}

/***********************************************
 *** Class-level ("static") properties **********
 ************************************************/
// initially an empty collection (in the form of a map)
Director.instances = {};

/****************************************************
 *** Class-level ("static") methods ******************
 *****************************************************/
/**
 *  Create a new director record/object
 */
Director.add = function (slots) {
    var director = null;
    try {
        director = new Director(slots);
    } catch (e) {
        console.log(`${e.constructor.name}: ${e.message}`);
        director = null;
    }
    if (director) {
        Director.instances[director.name] = director;
        console.log(`${director.toString()} created!`);
    }
};
/**
 *  Update an existing Director record/object
 */
Director.update = function (slots) {
    const director = Director.instances[slots.name],
        objectBeforeUpdate = cloneObject(director);
    var noConstraintViolated = true,
        ending = "", updatedProperties = [];
    try {
        if ("address" in slots && director.address !== slots.address) {
            director.address = slots.address;
            updatedProperties.push("address");
        }
    } catch (e) {
        console.log(`${e.constructor.name}: ${e.message}`);
        noConstraintViolated = false;
        // restore object to its state before updating
        Director.instances[slots.name] = objectBeforeUpdate;
    }
    if (noConstraintViolated) {
        if (updatedProperties.length > 0) {
            ending = updatedProperties.length > 1 ? "ies" : "y";
            console.log(`Propert${ending} ${updatedProperties.toString()} modified for director ${director.name}`);
        } else {
            console.log(`No property value changed for director ${director.name}!`);
        }
    }
};
/**
 *  Delete an existing Director record/object
 */
Director.destroy = function (name) {
    const director = Director.instances[name];
    // delete all references to this director in movie objects
    for (let key of Object.keys(Movie.instances)) {
        const movie = Movie.instances[key];
        if (movie.director === director) {
            delete movie._director;  // delete the slot
            console.log(`Movie ${movie.isbn} updated.`);
        }
    }
    // delete the director record
    delete Director.instances[name];
    console.log(`Publisher ${name} deleted.`);
};
/**
 *  Load all director records and convert them to objects
 */
Director.retrieveAll = function () {
    var directors = {};
    if (!localStorage["directors"]) localStorage["directors"] = "{}";
    try {
        directors = JSON.parse(localStorage["directors"]);
    } catch (e) {
        console.log("Error when reading from Local Storage\n" + e);
        return;
    }
    for (let publName of Object.keys(directors)) {
        try {
            Director.instances[publName] = new Director(directors[publName]);
        } catch (e) {
            console.log(`${e.constructor.name} while deserializing director ${publName}: ${e.message}`);
        }
    }
    console.log(`${Object.keys(directors).length} director records loaded.`);
};
/**
 *  Save all director objects as rows
 */
Director.saveAll = function () {
    const nmrOfPubl = Object.keys(Director.instances).length;
    try {
        localStorage["directors"] = JSON.stringify(Director.instances);
        console.log(`${nmrOfPubl} director records saved.`);
    } catch (e) {
        console.error("Error when writing to Local Storage\n" + e);
    }
};

export default Director;
