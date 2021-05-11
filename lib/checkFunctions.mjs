import Movie from "../src/m/Movie.mjs";

function isMovieIDEmpty(movieId) {
    if(movieId === ""){
        document.getElementById('infoLabel').innerHTML = 'ERROR: ID is empty!';
        return true;
    }
    return false;
}

function isMovieIDUsed(movieId) {
    if(Movie.instances[movieId] === undefined) {
        return false;
    }
    //document.getElementById('infoLabel').innerHTML = 'ERROR: ID is already in use!';
    return true
}

function isIntegerOrIntegerString(x) {
    return typeof(x) === "number" && Number.isInteger(x) ||
        typeof(x) === "string" && x.search(/^-?[0-9]+$/) === 0;
}

function isNonEmptyString(x) {
    return typeof(x) === "string" && x.trim() !== "";
}

function isTitleEmpty(title) {
    if(title === ""){
        //document.getElementById('infoLabel').innerHTML = 'ERROR: Title is empty!';
        return true;
    }
    return false;
}

function checkTitleLength(title) {
    if(title.length > 120){
        //document.getElementById('infoLabel').innerHTML = 'ERROR: Title is too long!';
        return true;
    }
    return false;
}

export { isNonEmptyString, isIntegerOrIntegerString,  checkTitleLength, isTitleEmpty, isMovieIDUsed, isMovieIDEmpty};