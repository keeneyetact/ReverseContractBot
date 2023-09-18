require('dotenv').config();
var unirest = require("unirest");
const BASIC_API_ENDPOINT = process.env.BASIC_API_ENDPOINT;
const addCredits = async (apiKey) => {
    const url = `${BASIC_API_ENDPOINT}/credits`;
    const requestBody = {
        apiKey: apiKey,
        availableCredits: 20,
    };
    unirest.post(url)
        .headers({ 'Content-Type': 'application/json' })
        .send(requestBody)
        .end((response) => {
            if (response.error) {
                console.error('Error:', response.error);
            } else {
                console.log('Response:', response.body);
            }
        });
}

const getTotalCredits = async () => {
    return new Promise((resolve, reject) => {
        const url = `${BASIC_API_ENDPOINT}/credits/totalCredits`;
        unirest.get(url)
            .headers({ 'Content-Type': 'application/json' })
            .end((response) => {
                if (response.error) {
                    console.error('Error:', response.error);
                } else {
                    // console.log('Response:', response.body);
                    resolve(response.body.totalCredits);
                }
            });
    });

}

module.exports = {
    addCredits,
    getTotalCredits,
};