/**
 * @fileOverview  The model class Movie with attribute definitions, (class-level)
 *                check methods, setter methods, and the special methods saveAll
 *                and retrieveAll
 * @person Gerd Wagner
 */
import Person from "./Person.mjs";
// import Person from "./Person.mjs";
import {cloneObject, isIntegerOrIntegerString, nextYear} from "../../lib/util.mjs";
import {
    NoConstraintViolation, MandatoryValueConstraintViolation,
    RangeConstraintViolation, PatternConstraintViolation, UniquenessConstraintViolation
}
    from "../../lib/errorTypes.mjs";
import {
    checkTitleLength,
    isMovieIDEmpty,
    isMovieIDUsed,
    isNonEmptyString,
    isTitleEmpty
} from './../../lib/checkFunctions.mjs';


/**
 * The class Movie
 * @class
 */
class Movie {
    // using a record parameter with ES6 function parameter destructuring
    constructor({movieId, title, releaseDate, director}) {
        this.movieId = movieId;
        this.title = title;
        this.releaseDate = releaseDate;
        // assign object references or ID references (to be converted in setter)
        this.director = director || directorIdRefs;
        this.actors = actors || actors_id;
    }

    get movieId() {
        return this._movieId;
    }
    get title() {
        return this._title;
    }
    get releaseDate() {
        return this._releaseDate;
    }
    get director() {
        return this._director;
    }
    get actors() {
         return this._actors;
    }

    static validateDate = function (date) {
        //checks if date is valid. Returns true if the date is valid
        let stringDate = Movie.dateToString(date);
        if(date === ""){
            return new UniquenessConstraintViolation(
                "ERROR: Release date is not valid. Use this format: dd.mm.yyyy!");
        } else {
            //test invalid date layout
            let count = (stringDate.match(/\./g) || []).length;
            const array = Array.from(date);

            //check for dots in the date string
            if(count !== 2 || array[2] !== '.' || array[5] !== '.' || date.length !== 10){
                return new PatternConstraintViolation(
                    "ERROR: Release date is not valid. Use this format: dd.mm.yyyy!");
            }

            //check for valid month and day
            let day = array[0] + array[1];
            let month = array[3] + array[4];
            let year = array[6] + array[7] + array[8] + array[9];

            //check if day is in range
            if(day > 31 || day < 0 || month > 12 || month < 1){
                return new PatternConstraintViolation(
                    "ERROR: Release date is not valid!");
            }

            //check if date is too old
            if(year < 1895){
                return new PatternConstraintViolation('ERROR: Release date is too old!');
            }

            //check if date is in the future
            if(year >= nextYear()){
                return new PatternConstraintViolation('ERROR: Release date is too new!');
            }

            //if date is on the edge, check month and day
            if(parseInt(year) === 1895){
                if(parseInt(month) < 12){
                    return new PatternConstraintViolation('ERROR: Release date is too old!');
                }
                if(parseInt(day) < 28){
                    return new PatternConstraintViolation('ERROR: Release date is too old!');
                }
            }
        }
        return new NoConstraintViolation();
    }

    //Validate movie id from param and a
    static validateMovieID = function(movieId) {
        if(!isIntegerOrIntegerString(movieId)) {
            return new RangeConstraintViolation(
                "ERROR: Movie ID " + movieId + " is not a number!");
        }
        if(movieId < 0) {
            return new RangeConstraintViolation(
                "ERROR: Movie ID is not positive!");
        }
        if(isMovieIDEmpty(movieId)){
            return new MandatoryValueConstraintViolation(
                "ERROR: A value for the MovieID must be provided!");
        }
        if (isMovieIDUsed(movieId)) {
            return new UniquenessConstraintViolation(
                "ERROR: There is already a Movie record with this Movie ID!");
        }
        return new NoConstraintViolation();
    }

    //validate Title
    static validateTitle = function(title) {
        if(!isNonEmptyString(title)) {
            return new RangeConstraintViolation(
                "ERROR: The title must be a non-empty string!");
        }
        if(isTitleEmpty(title)){
            return new MandatoryValueConstraintViolation(
                "ERROR: A title must be provided!");
        }
        if (checkTitleLength(title)) {
            return new StringLengthConstraintViolation(
                "ERROR: The given title is too long!");
        }
        return new NoConstraintViolation();
    }

    set movieId(movieId) {
        const validationResult = Movie.validateMovieID(movieId);
        if (validationResult instanceof NoConstraintViolation) {
            this._movieId = movieId;
        } else {
            throw validationResult;
        }
    }

    set releaseDate( releaseDate) {
        const validationResult = Movie.validateDate(releaseDate);
        if (validationResult instanceof NoConstraintViolation) {
            this._releaseDate = Movie.stringToDate(releaseDate);
        } else {
            throw validationResult;
        }
    }

    set title( title) {
        const validationResult = Movie.validateTitle(title);
        if (validationResult instanceof NoConstraintViolation) {
            this._title = title;
        } else {
            throw validationResult;
        }
    }

    static checkPublisher(directorId) {
        let validationResult;
        if (!directorId) {
            validationResult = new NoConstraintViolation();  // optional
        } else {
            // invoke foreign key constraint check
            validationResult = Person.checkNameAsIdRef(directorId);
        }
        return validationResult;
    }

    set director(p) {
        if (!p) {  // unset director
            delete this._director;
        } else {
            // p can be an ID reference or an object reference
            const directorId = (typeof p !== "object") ? p : p.name;
            const validationResult = Movie.checkPublisher(directorId);
            if (validationResult instanceof NoConstraintViolation) {
                // create the new director reference
                this._director = Person.instances[directorId];
            } else {
                throw validationResult;
            }
        }
    }

    get persons() {
        return this._persons;
    }

    static checkPerson(actorId) {
        var validationResult = null;
        if (!actorId) {
            // person(s) are optional
            validationResult = new NoConstraintViolation();
        } else {
            // invoke foreign key constraint check
            validationResult = Person.checkPersonIdAsIdRef(actorId);
        }
        return validationResult;
    }

    addPerson(a) {
        // a can be an ID reference or an object reference
        const actorId = (typeof a !== "object") ? parseInt(a) : a.personId;
        const validationResult = Movie.checkPerson(actorId);
        if (actorId && validationResult instanceof NoConstraintViolation) {
            // add the new person reference
            const key = String(actorId);
            this._persons[key] = Person.instances[key];
        } else {
            throw validationResult;
        }
    }

    removePerson(a) {
        // a can be an ID reference or an object reference
        const actorId = (typeof a !== "object") ? parseInt(a) : a.personId;
        const validationResult = Movie.checkPerson(actorId);
        if (validationResult instanceof NoConstraintViolation) {
            // delete the person reference
            delete this._persons[String(actorId)];
        } else {
            throw validationResult;
        }
    }

    set persons(a) {
        this._persons = {};
        if (Array.isArray(a)) {  // array of IdRefs
            for (const idRef of a) {
                this.addPerson(idRef);
            }
        } else {  // map of IdRefs to object references
            for (const idRef of Object.keys(a)) {
                this.addPerson(a[idRef]);
            }
        }
    }

    // Serialize movie object
    toString() {
        var movieStr = `Movie{ ISBN: ${this.movieid}, title: ${this.title}, year: ${this.year}`;
        if (this.director) movieStr += `, director: ${this.director.name}`;
        return `${movieStr}, persons: ${Object.keys(this.persons).join(",")} }`;
    }

    // Convert object to record with ID references
    toJSON() {  // is invoked by JSON.stringify
        var rec = {};
        for (const p of Object.keys(this)) {
            // copy only property slots with underscore prefix
            if (p.charAt(0) !== "_") continue;
            switch (p) {
                case "_director":
                    // convert object reference to ID reference
                    if (this._director) rec.directorId = this._director.name;
                    break;
                case "_persons":
                    // convert the map of object references to a list of ID references
                    rec.personIdRefs = [];
                    for (const personIdStr of Object.keys(this.persons)) {
                        rec.personIdRefs.push(parseInt(personIdStr));
                    }
                    break;
                default:
                    // remove underscore prefix
                    rec[p.substr(1)] = this[p];
            }
        }
        return rec;
    }
}

/***********************************************
 *** Class-level ("static") properties **********
 ************************************************/
// initially an empty collection (in the form of a map)
Movie.instances = {};

/********************************************************
 *** Class-level ("static") storage management methods ***
 *********************************************************/
/**
 *  Create a new movie record/object
 */
Movie.add = function (slots) {
    var movie = null;
    try {
        movie = new Movie(slots);
    } catch (e) {
        console.log(`${e.constructor.name}: ${e.message}`);
        movie = null;
    }
    if (movie) {
        Movie.instances[movie.movieid] = movie;
        console.log(`${movie.toString()} created!`);
    }
};
/**
 *  Update an existing Movie record/object
 *  properties are updated with implicit setters for making sure
 *  that the new values are validated
 */
Movie.update = function ({
                             movieid, title, year,
                             personIdRefsToAdd, personIdRefsToRemove, directorId
                         }) {
    const movie = Movie.instances[movieid],
        objectBeforeUpdate = cloneObject(movie);  // save the current state of movie
    var noConstraintViolated = true, updatedProperties = [];
    try {
        if (title && movie.title !== title) {
            movie.title = title;
            updatedProperties.push("title");
        }
        if (year && movie.year !== parseInt(year)) {
            movie.year = year;
            updatedProperties.push("year");
        }
        if (personIdRefsToAdd) {
            updatedProperties.push("persons(added)");
            for (let personIdRef of personIdRefsToAdd) {
                movie.addPerson(personIdRef);
            }
        }
        if (personIdRefsToRemove) {
            updatedProperties.push("persons(removed)");
            for (let actorId of personIdRefsToRemove) {
                movie.removePerson(actorId);
            }
        }
        // directorId may be the empty string for unsetting the optional property
        if (directorId && (!movie.director && directorId ||
            movie.director && movie.director.name !== directorId)) {
            movie.director = directorId;
            updatedProperties.push("director");
        }
    } catch (e) {
        console.log(`${e.constructor.name}: ${e.message}`);
        noConstraintViolated = false;
        // restore object to its state before updating
        Movie.instances[movieid] = objectBeforeUpdate;
    }
    if (noConstraintViolated) {
        if (updatedProperties.length > 0) {
            let ending = updatedProperties.length > 1 ? "ies" : "y";
            console.log(`Propert${ending} ${updatedProperties.toString()} modified for movie ${isbn}`);
        } else {
            console.log(`No property value changed for movie ${movie.isbn}!`);
        }
    }
};
/**
 *  Delete an existing Movie record/object
 */
Movie.destroy = function (movieid) {
    if (Movie.instances[movieid]) {
        console.log(`${Movie.instances[movieid].toString()} deleted!`);
        delete Movie.instances[movieid];
    } else {
        console.log(`There is no movie with ISBN ${movieid} in the database!`);
    }
};
/**
 *  Load all movie table rows and convert them to objects
 *  Precondition: directors and people must be loaded first
 */
Movie.retrieveAll = function () {
    var movies = {};
    try {
        if (!localStorage["movies"]) localStorage["movies"] = "{}";
        else {
            movies = JSON.parse(localStorage["movies"]);
            console.log(`${Object.keys(movies).length} movie records loaded.`);
        }
    } catch (e) {
        alert("Error when reading from Local Storage\n" + e);
    }
    for (let movieid of Object.keys(movies)) {
        try {
            Movie.instances[movieid] = new Movie(movies[movieid]);
        } catch (e) {
            console.log(`${e.constructor.name} while deserializing movie ${isbn}: ${e.message}`);
        }
    }
};
/**
 *  Save all movie objects
 */
Movie.saveAll = function () {
    const nmrOfMovies = Object.keys(Movie.instances).length;
    try {
        localStorage["movies"] = JSON.stringify(Movie.instances);
        console.log(`${nmrOfMovies} movie records saved.`);
    } catch (e) {
        alert("Error when writing to Local Storage\n" + e);
    }
};

//gets a string in form "dd.mm.yyyy" and returns a date
Movie.stringToDate = function (date) {
    let dateParts = date.split(".");
    return new Date(+dateParts[2], dateParts[1] - 1, +dateParts[0]);
}


Movie.dateToString = function (date) {
    let d = new Date(date);
    let month = '' + (d.getMonth() + 1);
    let day = '' + d.getDate();
    let year = d.getFullYear();

    if (month.length < 2)
        month = '0' + month;
    if (day.length < 2)
        day = '0' + day;

    return [day, month, year].join('.');
}

export default Movie;
