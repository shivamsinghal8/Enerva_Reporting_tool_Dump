const axios = require('axios');
const {OutLookTokenConfig}= require("./../../Config/Config")


const clientId = OutLookTokenConfig.clientid;
const clientSecret = OutLookTokenConfig.clientsecret ;
const tenantId = OutLookTokenConfig.tenentid;

async function getToken() {
    const tokenEndpoint = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
    const formData = {
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
        scope: 'https://graph.microsoft.com/.default'
    };

    try {
        const response = await axios.post(tokenEndpoint, new URLSearchParams(formData), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });
        const expiresIn = response.data.expires_in;
       // console.log(expiresIn);
        return response.data.access_token;
    } catch (error) {
        throw error;
    }
}

module.exports = getToken;
