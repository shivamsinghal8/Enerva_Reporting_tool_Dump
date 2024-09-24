const axios = require('axios');
const getToken = require("../outLook_services/Token");

const sendEmail = (errorMessage) => {
    return new Promise(async (resolve, reject) => {



        
        try {
            const accessToken = await getToken();

            const senderEmail = 'itsupport2@enervamarine.com'; // Replace with the sender's email address
            const emailEndpoint = `https://graph.microsoft.com/v1.0/users/${senderEmail}/sendMail`;

            const emailContent = {
                message: {
                    subject: "Reporting Tool EXEC SP Error",
                    body: {
                        contentType: "Text", // Can be "Text" or "HTML"
                        content: errorMessage
                    },
                    toRecipients: [
                        {
                            emailAddress: {
                                address: "harsh@enervamarine.com" // Replace with the recipient's email address
                            }
                        }
                    ],
                    ccRecipients: [
                        {
                            emailAddress: {
                                address: "jay@enervamarine.com" // Replace with the CC recipient's email address
                            }
                        },
                        // Add more CC recipients as needed
                    ]
                }
            };

            const response = await axios.post(emailEndpoint, emailContent, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            });

            // console.log('Email sent successfully:', response);
            resolve(); // Resolve the promise when email is sent successfully
        } catch (error) {
            console.error('Error sending email:', error.response ? error.response.data : error.message);
            reject(error); // Reject the promise if there's an error sending the email
        }
    });
};

module.exports = sendEmail;
