/**
 * @fileOverview  Auxiliary data management procedures
 * @author Gerd Wagner
 */
import Actor from "../m/Actor.mjs";
import Director from "../m/Director.mjs";
import Movie from "../m/Movie.mjs";

/*******************************************
 *** Auxiliary methods for testing **********
 ********************************************/
/**
 *  Create and save test data
 */
function generateTestData() {
    try {
        /*~~~Persons~~~*/
        Persons.instances["1"] = new Actor({authorId: 1, name: "Stephen Frears"});
        Persons.instances["2"] = new Actor({authorId: 1, name: "George Lucas"});
        Persons.instances["3"] = new Actor({authorId: 1, name: "Quentin Tarantino"});
        //Persons.instances["4"] = new Actor({authorId: 1, name: " "});
        Persons.instances["5"] = new Actor({authorId: 1, name: "Uma Thurman"});
        Persons.instances["6"] = new Actor({authorId: 1, name: "John Travolta"});
        Persons.instances["7"] = new Actor({authorId: 1, name: "Ewan McGregor"});
        Persons.instances["8"] = new Actor({authorId: 1, name: "Natalie Portman"});
        Persons.instances["9"] = new Actor({authorId: 1, name: "Keanu Reeves"});

        /*~~~Movies~~~*/
        Movie.instances[1] = new Movie({
            movieId: 1,
            title: "Pulp Fiction",
            releaseDate:"1994-05-12",
            directorId: 3,
            actorIdRefs: [3, 5, 6]
        });
        Movie.instances[2] = new Movie({
            movieId: 2,
            title: "Star Wars",
            releaseDate:"1977-05-25",
            directorId: 2,
            actorIdRefs: [7, 8]
        });
        Movie.instances[3] = new Movie({
            movieId: 3,
            title: "Dangerous Liaisons",
            releaseDate:"1988-12-16",
            directorId: 1,
            actorIdRefs: [9, 5]

        });
        Movie.saveAll();

    } catch (e) {
        console.log(`${e.constructor.name}: ${e.message}`);
    }
}

/**
 * Clear data
 */
function clearData() {
    if (confirm("Do you really want to delete the entire database?")) {
        try {
            Actor.instances = {};
            localStorage["authors"] = "{}";
            Director.instances = {};
            localStorage["directors"] = "{}";
            Movie.instances = {};
            localStorage["movies"] = "{}";
            console.log("All data cleared.");
        } catch (e) {
            console.log(`${e.constructor.name}: ${e.message}`);
        }
    }
}

export {generateTestData, clearData};
