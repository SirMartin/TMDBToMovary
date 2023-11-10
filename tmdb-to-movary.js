const fs = require('fs');
const readline = require('readline');
const axios = require("axios");

// Remember to fill these values, following the README instructions.
const tmdb_api_key = "FILL WITH YOUR VALUE";
const movary_url = "FILL WITH YOUR VALUE";
const movary_id_cookie = "FILL WITH YOUR VALUE";
const movary_php_session_cookie = "FILL WITH YOUR VALUE";
const movary_cookie_value = `id=${movary_id_cookie}; PHPSESSID=${movary_php_session_cookie};`;

(async () => {
    try {
        const token = await generateToken();

        const session_id = await generateSession(token);

        const account_id = await getAccountId(session_id);

        const movies = await getMoviesFromTMDB(account_id, session_id);

        await insertMoviesToMovary(movies);
    } catch
        (error) {
        console.error(error);
    }
})
();

async function getAccountId(session_id) {
    const r = await axios.get(`https://api.themoviedb.org/3/account?api_key=${tmdb_api_key}&session_id=${session_id}`, {});

    return r.data.id;
}

async function generateSession(token) {
    const r = await axios.post(`https://api.themoviedb.org/3/authentication/session/new?api_key=${tmdb_api_key}`, {
        request_token: token
    });

    return r.data.session_id;
}

async function generateToken() {
    const r = await axios.get(`https://api.themoviedb.org/3/authentication/token/new?api_key=${tmdb_api_key}`, {});

    console.log(`Please, authorize the app here: https://www.themoviedb.org/authenticate/${r.data.request_token}`);

    await askQuestion("Please, press ENTER when you have validated the token.");

    return r.data.request_token;
}

async function getMoviesFromTMDB(account_id, session_id) {
    let movies = [];

    for (let i = 1; i <= 100; i++) {
        const r = await axios.get(`https://api.themoviedb.org/3/account/${account_id}/rated/movies?api_key=${tmdb_api_key}&session_id=${session_id}&page=${i}`, {});

        const res = r.data.results.map((x) => {
            return {tmdbId: x.id, watchDate: "01.01.2023", comment: "", dateFormat: "d.m.Y", personalRating: x.rating};
        });

        movies = movies.concat(res);
        console.log(movies.length);
    }

    return movies;
}

function askQuestion(query) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    return new Promise(resolve => rl.question(query, ans => {
        rl.close();
        resolve(ans);
    }))
}

function insertMoviesToMovary(movies) {
    try {
        console.log(movies);
        let inserted = 0;
        for (let i = 0; i < movies.length; i++) {
            axios.post(`${movary_url}/log-movie`, movies[i], {
                headers: {
                    Cookie: movary_cookie_value
                }
            })
                .then(function (response) {
                    inserted++;
                })
                .catch(function (error) {
                    console.error(i + "-FAIL ", movies[i]);
                });
        }

        console.log("TOTAL", inserted);
    } catch
        (error) {
        console.error("ERROR:", error);
    }
}
