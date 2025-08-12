const axios = require("axios");
require("dotenv").config();

const { GH_TOKEN } = process.env;
console.log("[ENV] GH_TOKEN length:", GH_TOKEN?.length);

if (!GH_TOKEN) {
  console.warn(
    "[ENV]   One or more required Github environment variables are missing!"
  );
}

async function getGithubData() {

  // we are not building a REST to GQL wrapper so i think we can just hardcode the query. 
  try {
    const query = `
      query {
        user(login: "apparentlyarhm") {
          repositories(first: 5, orderBy: {field: PUSHED_AT, direction: DESC}) {
            nodes {
              name
              primaryLanguage {
                  name
                  color
              }
              defaultBranchRef {
                target {
                  ... on Commit {
                    history(first: 5) {
                      edges {
                        node {
                          committedDate
                          messageHeadline
                          url
                          author {
                            name
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    `;

    const res = await axios.post(
      `https://api.github.com/graphql`,
      { query },
      {
        headers: {
          Authorization: `Bearer ${GH_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return res.data
  } catch (error) {
    console.error('GitHub API Error:', error.response?.data || error.message);
  }

}

module.exports = {
  getGithubData
}