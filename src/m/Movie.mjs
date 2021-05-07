/**
 * @fileOverview  The model class Movie with attribute definitions, (class-level)
 *                check methods, setter methods, and the special methods saveAll
 *                and retrieveAll
 * @author Gerd Wagner
 */
import Author from "./Author.mjs";
import Publisher from "./Publisher.mjs";
import {cloneObject} from "../../lib/util.mjs";
import {
    NoConstraintViolation, MandatoryValueConstraintViolation,
    RangeConstraintViolation, PatternConstraintViolation, UniquenessConstraintViolation
}
    from "../../lib/errorTypes.mjs";

/**
 * The class Movie
 * @class
 */
class Movie {
    // using a record parameter with ES6 function parameter destructuring
    constructor({
                    movieid, title, releaseDate, director,
                }) {
        this.movieid = movieid;
        this.title = title;
        this.releaseDate = releaseDate;
        // assign object references or ID references (to be converted in setter)
        this.director = director || directorIdRefs;
        this.actors = actors || actors_id;
    }

    get movieid() {
        return this._movieid;
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
         this._actors;
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

            //check if date is is in the future
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
    static validateMovieID = function(movieid) {
        if(!isIntegerOrIntegerString(movieid)) {
            return new RangeConstraintViolation(
                "ERROR: Movie ID " + movieid + " is not a number!");
        }
        if(movieid < 0) {
            return new RangeConstraintViolation(
                "ERROR: Movie ID is not positive!");
        }
        if(isMovieIDEmpty(movieid)){
            return new MandatoryValueConstraintViolation(
                "ERROR: A value for the MovieID must be provided!");
        }
        if (isMovieIDUsed(movieid)) {
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

    set movieid( movieid) {
        const validationResult = Movie.validateMovieID(movieid);
        if (validationResult instanceof NoConstraintViolation) {
            this._movieid = movieid;
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

    static checkPublisher(publisher_id) {
        let validationResult;
        if (!publisher_id) {
            validationResult = new NoConstraintViolation();  // optional
        } else {
            // invoke foreign key constraint check
            validationResult = Publisher.checkNameAsIdRef(publisher_id);
        }
        return validationResult;
    }

    set publisher(p) {
        if (!p) {  // unset publisher
            delete this._publisher;
        } else {
            // p can be an ID reference or an object reference
            const publisher_id = (typeof p !== "object") ? p : p.name;
            const validationResult = Movie.checkPublisher(publisher_id);
            if (validationResult instanceof NoConstraintViolation) {
                // create the new publisher reference
                this._publisher = Publisher.instances[publisher_id];
            } else {
                throw validationResult;
            }
        }
    }

    get authors() {
        return this._authors;
    }

    static checkAuthor(author_id) {
        var validationResult = null;
        if (!author_id) {
            // author(s) are optional
            validationResult = new NoConstraintViolation();
        } else {
            // invoke foreign key constraint check
            validationResult = Author.checkAuthorIdAsIdRef(author_id);
        }
        return validationResult;
    }

    addAuthor(a) {
        // a can be an ID reference or an object reference
        const author_id = (typeof a !== "object") ? parseInt(a) : a.authorId;
        const validationResult = Movie.checkAuthor(author_id);
        if (author_id && validationResult instanceof NoConstraintViolation) {
            // add the new author reference
            const key = String(author_id);
            this._authors[key] = Author.instances[key];
        } else {
            throw validationResult;
        }
    }

    removeAuthor(a) {
        // a can be an ID reference or an object reference
        const author_id = (typeof a !== "object") ? parseInt(a) : a.authorId;
        const validationResult = Movie.checkAuthor(author_id);
        if (validationResult instanceof NoConstraintViolation) {
            // delete the author reference
            delete this._authors[String(author_id)];
        } else {
            throw validationResult;
        }
    }

    set authors(a) {
        this._authors = {};
        if (Array.isArray(a)) {  // array of IdRefs
            for (const idRef of a) {
                this.addAuthor(idRef);
            }
        } else {  // map of IdRefs to object references
            for (const idRef of Object.keys(a)) {
                this.addAuthor(a[idRef]);
            }
        }
    }

    // Serialize movie object
    toString() {
        var movieStr = `Movie{ ISBN: ${this.isbn}, title: ${this.title}, year: ${this.year}`;
        if (this.publisher) movieStr += `, publisher: ${this.publisher.name}`;
        return `${movieStr}, authors: ${Object.keys(this.authors).join(",")} }`;
    }

    // Convert object to record with ID references
    toJSON() {  // is invoked by JSON.stringify
        var rec = {};
        for (const p of Object.keys(this)) {
            // copy only property slots with underscore prefix
            if (p.charAt(0) !== "_") continue;
            switch (p) {
                case "_publisher":
                    // convert object reference to ID reference
                    if (this._publisher) rec.publisher_id = this._publisher.name;
                    break;
                case "_authors":
                    // convert the map of object references to a list of ID references
                    rec.authorIdRefs = [];
                    for (const authorIdStr of Object.keys(this.authors)) {
                        rec.authorIdRefs.push(parseInt(authorIdStr));
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
        Movie.instances[movie.isbn] = movie;
        console.log(`${movie.toString()} created!`);
    }
};
/**
 *  Update an existing Movie record/object
 *  properties are updated with implicit setters for making sure
 *  that the new values are validated
 */
Movie.update = function ({
                             isbn, title, year,
                             authorIdRefsToAdd, authorIdRefsToRemove, publisher_id
                         }) {
    const movie = Movie.instances[isbn],
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
        if (authorIdRefsToAdd) {
            updatedProperties.push("authors(added)");
            for (let authorIdRef of authorIdRefsToAdd) {
                movie.addAuthor(authorIdRef);
            }
        }
        if (authorIdRefsToRemove) {
            updatedProperties.push("authors(removed)");
            for (let author_id of authorIdRefsToRemove) {
                movie.removeAuthor(author_id);
            }
        }
        // publisher_id may be the empty string for unsetting the optional property
        if (publisher_id && (!movie.publisher && publisher_id ||
            movie.publisher && movie.publisher.name !== publisher_id)) {
            movie.publisher = publisher_id;
            updatedProperties.push("publisher");
        }
    } catch (e) {
        console.log(`${e.constructor.name}: ${e.message}`);
        noConstraintViolated = false;
        // restore object to its state before updating
        Movie.instances[isbn] = objectBeforeUpdate;
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
Movie.destroy = function (isbn) {
    if (Movie.instances[isbn]) {
        console.log(`${Movie.instances[isbn].toString()} deleted!`);
        delete Movie.instances[isbn];
    } else {
        console.log(`There is no movie with ISBN ${isbn} in the database!`);
    }
};
/**
 *  Load all movie table rows and convert them to objects
 *  Precondition: publishers and people must be loaded first
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
    for (let isbn of Object.keys(movies)) {
        try {
            Movie.instances[isbn] = new Movie(movies[isbn]);
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

export default Movie;