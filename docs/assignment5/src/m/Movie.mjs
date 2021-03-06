/**
 * @fileOverview  The model class Movie with attribute definitions, (class-level)
 *                check methods, setter methods, and the special methods saveAll
 *                and retrieveAll
 * @person Gerd Wagner
 */
import Person from "./Person.mjs";
import {cloneObject, isIntegerOrIntegerString, nextYear} from "../../lib/util.mjs";
import {
    MandatoryValueConstraintViolation,
    NoConstraintViolation,
    PatternConstraintViolation,
    RangeConstraintViolation,
    StringLengthConstraintViolation,
    UniquenessConstraintViolation
} from "../../lib/errorTypes.mjs";
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
    constructor({movieId, title, releaseDate, director, actors}) {
        this.movieId = movieId;
        this.title = title;
        this.releaseDate = releaseDate;
        // assign object references or ID references (to be converted in setter)
        this.director = director; // this is a directorRef
        this.actors = actors; // these are actorIdRefs
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
        if (date === "") {
            return new MandatoryValueConstraintViolation(
                "ERROR: Release date is mandatory!");
        } else {
            //test invalid date layout
            let count = (date.match(/\./g) || []).length;
            const array = Array.from(date);

            //check for dots in the date string
            if (count !== 2 || array[2] !== '.' || array[5] !== '.' || date.length !== 10) {
                return new PatternConstraintViolation(
                    "ERROR: Release date is not valid. Use this format: dd.mm.yyyy!");
            }

            //check for valid month and day
            let day = array[0] + array[1];
            let month = array[3] + array[4];
            let year = array[6] + array[7] + array[8] + array[9];

            //check if day is in range
            if (day > 31 || day < 0 || month > 12 || month < 1) {
                return new PatternConstraintViolation(
                    "ERROR: Release date is not valid!");
            }

            //check if date is too old
            if (year < 1895) {
                return new PatternConstraintViolation('ERROR: Release date is too old!');
            }

            //check if date is in the future
            if (year >= nextYear()) {
                return new PatternConstraintViolation('ERROR: Release date is too new!');
            }

            //if date is on the edge, check month and day
            if (parseInt(year) === 1895) {
                if (parseInt(month) < 12) {
                    return new PatternConstraintViolation('ERROR: Release date is too old!');
                }
                if (parseInt(day) < 28) {
                    return new PatternConstraintViolation('ERROR: Release date is too old!');
                }
            }
        }
        return new NoConstraintViolation();
    }

    //Validate movie id from param and a
    static validateDirector = function (director) {
        let constraintViolation;
        if (!director) {
            constraintViolation = new NoConstraintViolation();  // optional
        } else {
            // invoke foreign key constraint check
            constraintViolation = Person.checkNameAsIdRef(director);
        }
        return constraintViolation;
    }

    //Validate movie id from param and a
    static validateMovieID = function (movieId) {
        if (!isIntegerOrIntegerString(movieId)) {
            return new RangeConstraintViolation(
                "ERROR: Movie ID " + movieId + " is not a number!");
        }
        if (movieId < 0) {
            return new RangeConstraintViolation(
                "ERROR: Movie ID is not positive!");
        }
        if (isMovieIDEmpty(movieId)) {
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
    static validateTitle = function (title) {
        if (!isNonEmptyString(title)) {
            return new RangeConstraintViolation(
                "ERROR: The title must be a non-empty string!");
        }
        if (isTitleEmpty(title)) {
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

    set releaseDate(releaseDate) {
        const validationResult = Movie.validateDate(releaseDate);
        if (validationResult instanceof NoConstraintViolation) {
            this._releaseDate = releaseDate;
        } else {
            throw validationResult;
        }
    }

    set title(title) {
        const validationResult = Movie.validateTitle(title);
        if (validationResult instanceof NoConstraintViolation) {
            this._title = title;
        } else {
            throw validationResult;
        }
    }

    /* everything publisher related is deprecated
    static checkPublisher(director) {
        let validationResult;
        if (!director) {
            validationResult = new NoConstraintViolation();  // optional
        } else {
            // invoke foreign key constraint check
            validationResult = Person.checkNameAsIdRef(director);
        }
        return validationResult;
    }
    */


    set director(p) {
        if (!p) {  // unset director
            delete this._director;
        } else {
            // p can be an ID reference or an object reference
            const director = (typeof p !== "object") ? p : p.personId;
            const validationResult = Movie.validateDirector(director);
            if (validationResult instanceof NoConstraintViolation) {
                if (this._director) {
                    // delete the obsolete inverse reference in Publisher::publishedBooks
                    delete this._director.directedMovies[this._movieId];
                }
                // create the new publisher reference
                this._director = Person.instances[director];
                // add the new inverse reference to Publisher::publishedBooks
                this._director.directedMovies[this._movieId] = this;
            } else {
                throw validationResult;
            }
        }
    }

    static checkPerson(personId) {
        let validationResult;
        if (!personId) {
            // person(s) are optional
            validationResult = new NoConstraintViolation();
        } else {
            // invoke foreign key constraint check
            validationResult = Person.checkPersonIdAsIdRef(personId);
        }
        return validationResult;
    }

    addActor(a) {
        // a can be an ID reference or an object reference
        const personId = (typeof a !== "object") ? parseInt(a) : a.personId;
        const validationResult = Movie.checkPerson(personId);
        if (personId && validationResult instanceof NoConstraintViolation) {
            // add the new person reference
            const key = String(personId);
            // movie -> actor ref
            this._actors[key] = Person.instances[key];
            // actor -> movie ref
            this._actors[key].playedMovies[this._movieId] = this;
            // console.log("Movie.addActor: " + key);
        } else {
            throw validationResult;
        }
    }

    removeActor(a) {
        // a can be an ID reference or an object reference
        const personId = (typeof a !== "object") ? parseInt(a) : a.personId;
        const validationResult = Movie.checkPerson(personId);
        if (validationResult instanceof NoConstraintViolation) {
            // delete the person reference
            delete this._actors[String(personId)];
        } else {
            throw validationResult;
        }
    }

    set actors(a) {
        this._actors = {};
        if (Array.isArray(a)) {  // array of IdRefs
            for (const idRef of a) {
                this.addActor(idRef);
            }
        } else {  // map of IdRefs to object references
            for (const idRef of Object.keys(a)) {
                this.addActor(a[idRef]);
            }
        }
    }

    // Serialize movie object
    toString() {
        let movieStr = `Movie{ ID: ${this.movieId}, title: ${this.title}, date: ${this.releaseDate}`;
        if (this.director) movieStr += `, director: ${this.director}`;
        return `${movieStr}, actors: ${Object.keys(this.actors).join(",")} }`;
    }

    // Convert object to record with ID references
    toJSON() {  // is invoked by JSON.stringify
        let rec = {};
        for (const p of Object.keys(this)) {
            // copy only property slots with underscore prefix
            if (p.charAt(0) !== "_") continue;
            switch (p) {
                case "_director":
                    // convert object reference to ID reference
                    if (this._director) rec.director = this._director;
                    break;
                case "_actors":
                    // convert the map of object references to a list of ID references
                    rec.actors = [];
                    for (const personIdStr of Object.keys(this._actors)) {
                        rec.actors.push(parseInt(personIdStr));
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
    let movie;
    try {
        movie = new Movie(slots);
    } catch (e) {
        console.log(`${e.constructor.name}: ${e.message}`);
        movie = null;
    }
    if (movie) {
        Movie.instances[movie.movieId] = movie;
        console.log(`${movie.toString()} created!`);
    }
};
/**
 *  Update an existing Movie record/object
 *  properties are updated with implicit setters for making sure
 *  that the new values are validated
 */
Movie.update = function ({
                             movieId, title, releaseDate,
                             actorIdRefsToAdd, actorIdRefsToRemove, director
                         }) {
    const movie = Movie.instances[movieId],
        objectBeforeUpdate = cloneObject(movie);  // save the current state of movie
    let noConstraintViolated = true, updatedProperties = [];
    try {

        if (movie.title !== title) {
            movie.title = title;
            updatedProperties.push("title");
        }

        if (movie.releaseDate !== releaseDate) {
            movie.releaseDate = releaseDate;
            updatedProperties.push("releaseDate");
        }

        if (actorIdRefsToAdd) {
            updatedProperties.push("actors(added)");
            for (let personIdRef of actorIdRefsToAdd) {
                movie.addActor(personIdRef);
            }
        }

        if (actorIdRefsToRemove) {
            updatedProperties.push("actors(removed)");
            for (let personId of actorIdRefsToRemove) {
                movie.removeActor(personId);
            }
        }

        // update director on change
        if (director !== movie.director) {
            movie.director = director;
            updatedProperties.push("director");
        }

    } catch (e) {
        console.log(`${e.constructor.name}: ${e.message}`);
        noConstraintViolated = false;
        // restore object to its state before updating
        Movie.instances[movieId] = objectBeforeUpdate;
    }

    if (noConstraintViolated) {
        if (updatedProperties.length > 0) {
            let ending = updatedProperties.length > 1 ? "ies" : "y";
            console.log(`Propert${ending} ${updatedProperties.toString()} modified for movie ${movieId}`);
        } else {
            console.log(`No property value changed for movie ${movie.movieId}!`);
        }
    }
};

/**
 *  Delete an existing Movie record/object
 */
Movie.destroy = function (movieId) {
    const movie = Movie.instances[movieId];
    if (movie) {
        console.log(`${Movie.instances[movieId].toString()} deleted!`);
        // delete director ref
        if (movie.director) {
            // remove inverse reference from book.publisher
            delete movie.director.directedMovies[movieId];
        }
        // delete actor refs
        // todo

        delete Movie.instances[movieId];
    } else {
        console.log(`There is no movie with ID ${movieId} in the database!`);
    }
};

/**
 *  Load all movie table rows and convert them to objects
 *  Precondition: directors and people must be loaded first
 */
Movie.retrieveAll = function () {
    let movies = {};
    try {
        if (!localStorage["movies"]) localStorage["movies"] = "{}";
        else {
            movies = JSON.parse(localStorage["movies"]);
            console.log(`${Object.keys(movies).length} movie records loaded.`);
        }
    } catch (e) {
        alert("Error when reading from Local Storage\n" + e);
    }
    for (let movieId of Object.keys(movies)) {
        try {
            Movie.instances[movieId] = new Movie(movies[movieId]);
        } catch (e) {
            console.log(`${e.constructor.name} while deserializing movie ${movieId}: ${e.message}`);
        }
    }
};

// Convert record/row to object
Movie.convertRec2Obj = function (movieRec) {
    let movie = {};
    try {
        movie = new Movie({
            movieId: movieRec.movieId,
            title: movieRec.title,
            releaseDate: movieRec.releaseDate,
            director: movieRec.director ? movieRec.director : undefined,
            actors: movieRec.actors
        });
    } catch (e) {
        try {
            console.log(e.message);
        } catch (e) {

        }
    }
    return movie;
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
