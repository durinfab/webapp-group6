/**
 * @fileOverview  The model class Movie with attribute definitions, (class-level)
 *                check methods, setter methods, and the special methods saveAll
 *                and retrieveAll
 * @person Gerd Wagner
 */
import Person, {PersonRoleEL}from "./Person.mjs";
import {cloneObject, isIntegerOrIntegerString} from "../../lib/util.mjs";
import {
    NoConstraintViolation, MandatoryValueConstraintViolation,
    RangeConstraintViolation, PatternConstraintViolation, UniquenessConstraintViolation, StringLengthConstraintViolation
} from "../../lib/errorTypes.mjs";
import {
    checkTitleLength,
    isMovieIDEmpty,
    isMovieIDUsed,
    isNonEmptyString,
    isTitleEmpty
} from './../../lib/checkFunctions.mjs';

import {Enumeration} from "../../lib/Enumeration.mjs";
import {ConstraintViolation, IntervalConstraintViolation} from "../../lib/errorTypes.mjs";

const MovieGenreEL = new Enumeration(["Biography", "TvSeriesEpisode"]);

/**
 * The class Movie
 * @class
 */
class Movie {
    // using a record parameter with ES6 function parameter destructuring
    constructor({movieId, title, releaseDate, directorId, actors, movieGenre, about, episodeTitle, episodeNo}) {
        this.movieId = movieId;
        this.title = title;
        this.releaseDate = releaseDate; // dd.mm.yyyy
        // assign object references or ID references (to be converted in setter)
        this.directorId = directorId; // this is a directorIdRef
        this.actors = actors; // these are actorIdRefs

        if (movieGenre) this.movieGenre = movieGenre;  // from MovieGenreEL
        if (about) this.about = about;
        if (episodeTitle) this.episodeTitle = episodeTitle;
        if (episodeNo) this.episodeNo = episodeNo;

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

    get directorId() {
        return this._directorId;
    }

    get actors() {
        return this._actors;
    }

    get movieGenre() {
        return this._movieGenre;
    }

    get about() {
        return this._about;
    }

    get episodeTitle() {
        return this._episodeTitle;
    }

    get episodeNo() {
        return this._episodeNo;
    }

    static checkMovieGenre(c) {
        if (c === undefined) {
            return new NoConstraintViolation();  // category is optional
        } else if (!isIntegerOrIntegerString(c) || parseInt(c) < 1 ||
            parseInt(c) > MovieGenreEL.MAX) {
            return new RangeConstraintViolation(
                `Invalid value for genre: ${c}`);
        } else {
            return new NoConstraintViolation();
        }
    }

    set movieGenre(c) {
        let validationResult = Movie.checkMovieGenre(c);
        if (validationResult instanceof NoConstraintViolation) {
            this._movieGenre = parseInt(c);
        } else {
            throw validationResult;
        }
    }

    /*
     *  about is a Person, about is optional for Actors
     *  c is the movieGenre
     */
    static checkAbout(a, c) {
        const genre = parseInt(c);

        if (genre === MovieGenreEL.BIOGRAPHY && !a) {
            return new MandatoryValueConstraintViolation(
                "A biography movie record must have an 'about' field!");
        } else if (genre !== MovieGenreEL.BIOGRAPHY && a) {
            return new ConstraintViolation("An 'about' field value must not be provided if the book is not a biography!");

        } else {
            return this.checkPerson(a);
        }
    }

    set about(v) {
        const validationResult = Movie.checkAbout(v, this.movieGenre);
        if (validationResult instanceof NoConstraintViolation) {
            this._about = v;
        } else {
            throw validationResult;
        }
    }

    /*
     *  name is String, name is mandatory for genre TvSeriesEpisode
     *  c is the movieGenre
     */
    static checkTvSeriesName(name, c) {
        const genre = parseInt(c);

        if (genre === MovieGenreEL.TVSERIESEPISODE && !name) {
            return new MandatoryValueConstraintViolation(
                "A TvSeriesEpisode movie record must have an 'TvSeriesName' field!");

        } else if (genre !== MovieGenreEL.TVSERIESEPISODE && name) {
            return new ConstraintViolation("An 'TvSeriesName' field value must not be provided if the movie is not a TvSeriesEpisode!");

        } else if (genre === MovieGenreEL.TVSERIESEPISODE) {

            if (!isNonEmptyString(name)) {
                return new RangeConstraintViolation(
                    "ERROR: The TvSeriesName must be a non-empty string!");
            }
            if (isTitleEmpty(name)) {
                return new MandatoryValueConstraintViolation(
                    "ERROR: A TvSeriesName must be provided!");
            }
        }
        return new NoConstraintViolation();
    }

    set episodeTitle(name) {
        const validationResult = Movie.checkTvSeriesName(name, this.movieGenre);
        if (validationResult instanceof NoConstraintViolation) {
            this._episodeTitle = name;
        } else {
            throw validationResult;
        }
    }

    /*
     *  EpisodeNo is Int, EpisodeNo is mandatory for genre TvSeries
     *  c is the movieGenre
     */
    static checkEpisodeNo(no, c) {
        const genre = parseInt(c);

        if (genre === MovieGenreEL.TVSERIESEPISODE && !no) {
            return new MandatoryValueConstraintViolation("A TvSeriesEpisode movie record must have an 'EpisodeNo' field!");

        } else if (genre !== MovieGenreEL.TVSERIESEPISODE && no) {
            return new ConstraintViolation("An 'EpisodeNo' field value must not be provided if the movie is not a TvSeriesEpisode!");

        } else if (genre === MovieGenreEL.TVSERIESEPISODE) {

            if (!isIntegerOrIntegerString(no)) {
                return new RangeConstraintViolation(
                    "ERROR: EpisodeNo " + no + " is not a number!");
            }
            if (no < 0) {
                return new RangeConstraintViolation(
                    "ERROR: EpisodeNo is not positive!");
            }
            if (isMovieIDEmpty(no)) {
                return new MandatoryValueConstraintViolation(
                    "ERROR: A value for the EpisodeNo must be provided!");
            }
            /*
            if (isMovieIDUsed(movieId)) {
                return new UniquenessConstraintViolation(
                    "ERROR: There is already a Movie record with this Movie ID!");
            }
            */
        }
        return new NoConstraintViolation();
    }
    set episodeNo(no) {
        const validationResult = Movie.checkEpisodeNo(no, this.movieGenre);
        if (validationResult instanceof NoConstraintViolation) {
            this._episodeNo = no;
        } else {
            throw validationResult;
        }
    }

    static validateDate = function (d) {
        const DATE_FIRST_MOVIE = new Date("1895-12-28");
        const dateRegex1 = RegExp(
            /^\d{4}(-)(\d|\d{2})(-)\d|\d{2}$/);

        const dateRegex2 = RegExp(
            /^\d{4}(-)\d{2}(-)\d{2}(T)\d{2}(:)\d{2}(:)\d{2}(.)\d{3}(Z)$/); // YYYY-MM-DDT00:00:00.000Z

        if (!d) {
            return new MandatoryValueConstraintViolation("A publication releaseDate must be provided!");

        } else if (typeof (d) !== "string" || d.trim() === "") {
            return new RangeConstraintViolation("The date must be a non-empty string!");

        } else if (! ( dateRegex1.test(d) || dateRegex2.test(d)) ) {
            return new PatternConstraintViolation("The date must have format YYYY-MM-DD!");

        } else if (DATE_FIRST_MOVIE > new Date(d)) {
            return new IntervalConstraintViolation("The date must be later than " + DATE_FIRST_MOVIE + "!");

        } else {
            return new NoConstraintViolation();
        }
    }

    //Validate movie id from param and a
    static validateDirector = function (director) {
        if (director === "") {
            return new MandatoryValueConstraintViolation(
                "ERROR: Setting a director is mandatory!");
        }
        return new NoConstraintViolation();
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

    set directorId(p) {
        if (!p) {  // unset director
            Person.instances[p].role = undefined;
            delete this._directorId;
        } else {
            // p can be an ID reference or an object reference
            const directorId = (typeof p !== "object") ? p : p.name;
            const validationResult = Movie.checkPerson(directorId);
            if (validationResult instanceof NoConstraintViolation) {
                if (Person.instances[directorId].role === undefined) {
                    Person.instances[directorId].role = PersonRoleEL.DIRECTOR;
                }
                if (Person.instances[directorId].role === PersonRoleEL.ACTOR) {
                    Person.instances[directorId].role = PersonRoleEL.ACTOR_AND_DIRECTOR;
                }

                // create the new director reference
                this._directorId = p;
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
            const slots = {
                personId: personId,
                role: Person.getRoleFromPersonId(personId)
            };
            if (Person.instances[personId].role === undefined) {
                Person.instances[personId].role = PersonRoleEL.ACTOR;
            }
            if (Person.instances[personId].role === PersonRoleEL.DIRECTOR) {
                Person.instances[personId].role = PersonRoleEL.ACTOR_AND_DIRECTOR;
            }

            // add the new person reference
            const key = String(personId);
            this._actors[key] = Person.instances[key];
        } else {
            throw validationResult;
        }
    }

    removeActor(a) {
        // a can be an ID reference or an object reference
        const personId = (typeof a !== "object") ? parseInt(a) : a.personId;
        const validationResult = Movie.checkPerson(personId);
        if (validationResult instanceof NoConstraintViolation) {

            const count = 0;
            //Does the actor still plays in movies
            for (const key of Object.keys(Movie.instances)) {
                const movie = Movie.instances[key];
                for (const personId1 of movie.actors) {
                    if (personId1 === personId) {
                        count = count + 1;
                    }
                }
            }

            if (count === 1 && slots.role === PersonRoleEL.ACTOR) {
                Person.instances[personId].role = undefined;
            }
            if (count === 1 && slots.role === PersonRoleEL.ACTOR_AND_DIRECTOR) {
                Person.instances[personId].role = PersonRoleEL.DIRECTOR;
            }
            Person.update(slots);

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
        if (this.directorId) movieStr += `, director: ${this.directorId}`;
        return `${movieStr}, actors: ${Object.keys(this.actors).join(",")} }`;
    }

    // Convert object to record with ID references
    toJSON() {  // is invoked by JSON.stringify
        const rec = {};
        for (const p of Object.keys(this)) {
            // copy only property slots with underscore prefix
            if (p.charAt(0) === "_") {
                switch (p) {
                    case "_directorId":
                        // convert object reference to ID reference
                        if (this._directorId) rec.directorId = this._directorId;
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
                             actorIdRefsToAdd, actorIdRefsToRemove, directorId,
                             movieGenre, about, episodeTitle, episodeNo
                         }) {
    const movie = Movie.instances[movieId],
        objectBeforeUpdate = cloneObject(movie);  // save the current state of movie
    let noConstraintViolated = true, updatedProperties = [];
    try {

        if (movie.title !== title) {
            movie.title = title;
            updatedProperties.push("title");
        }

        if (Movie.dateToString(movie.releaseDate) !== releaseDate) {
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
        if (directorId !== movie.directorId) {
            movie.directorId = directorId;
            updatedProperties.push("directorId");
        }

        if (!movie.movieGenre) {
            if (movieGenre) {
                /*
                 *  undefined -> genre
                 */
                movie.movieGenre = movieGenre;
                updatedProperties.push("movieGenre");
                switch(movieGenre) {
                    case MovieGenreEL.BIOGRAPHY :
                        console.log("bio");
                        movie.about = about; updatedProperties.push("about");
                        break;
                    case MovieGenreEL.TVSERIESEPISODE :
                        movie.episodeTitle = episodeTitle; updatedProperties.push("episodeTitle");
                        movie.episodeNo = episodeNo; updatedProperties.push("episodeNo");
                        break;
                }
            }

        } else {
            if (movieGenre) {
                /*
                 *  genre -> genre
                 */
                if (movie.movieGenre !== movieGenre) {
                    movie.movieGenre = movieGenre;
                    updatedProperties.push("movieGenre");
                    switch(movieGenre) {
                        case MovieGenreEL.BIOGRAPHY :
                            movie.about = about; updatedProperties.push("about");

                            movie.episodeTitle = undefined; updatedProperties.push("episodeTitle");
                            movie.episodeNo = undefined; updatedProperties.push("episodeNo");
                            break;
                        case MovieGenreEL.TVSERIESEPISODE :
                            movie.about = undefined; updatedProperties.push("about");

                            movie.episodeTitle = episodeTitle; updatedProperties.push("episodeTitle");
                            movie.episodeNo = episodeNo; updatedProperties.push("episodeNo");
                            break;
                    }
                }
            } else {
                /*
                 *  genre -> undefined
                 */
                movie.movieGenre = undefined; updatedProperties.push("movieGenre");
                movie.about = undefined; updatedProperties.push("about");
                movie.episodeTitle = undefined; updatedProperties.push("episodeTitle");
                movie.episodeNo = undefined; updatedProperties.push("episodeNo");
            }
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
    if (Movie.instances[movieId]) {
        console.log(`${Movie.instances[movieId].toString()} deleted!`);
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
    for (const movieId of Object.keys(movies)) {
        try {
            Movie.instances[movieId] = Movie.convertRec2Obj(movies[movieId]);
        } catch (e) {
            console.log(`${e.constructor.name} while deserializing movie ${movieId}: ${e.message}`);
        }
    }
};

// Convert record/row to object
Movie.convertRec2Obj = function (movieRec) {
    let movie = {};
    try {
        movie = new Movie(movieRec);
    } catch (e) {
        console.log(`${e.constructor.name} while deserializing a movie record: ${e.message}`);

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
export {MovieGenreEL};