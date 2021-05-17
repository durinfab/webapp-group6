import Movie from "../assignment4/m/Movie.mjs";

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

function isNonEmptyString(x) {
    return typeof(x) === "string" && x.trim() !== "";
}

function isTitleEmpty(title) {
    return title === "";

}

function checkTitleLength(title) {
    return title.length > 120;

}

export { isNonEmptyString,  checkTitleLength, isTitleEmpty, isMovieIDUsed, isMovieIDEmpty};