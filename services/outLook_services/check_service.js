const axios = require("axios");
const {OutLookEmailConfig}=require('../../Config/Config')


let indexid =OutLookEmailConfig.folderID;
let FolderMoveId=OutLookEmailConfig.Folder_Id_To_MoveEmail;




let TokenAuth=null;
service_name={
    MarkAsRead: MarkasRead,
    UnseenMails:UnseenMail,
    Attachmentread:AttachmentRead,
    moveEmailToFolder:moveEmailToFolder
    
}
async function UnseenMail(userEmail, Tokenid,subject,EndPointAddress) {
    TokenAuth= Tokenid

    try {
        let EndPoint = '';
       

        // Construct the endpoint based on the endpointName
        switch (EndPointAddress) {
            case 'inboxMessages':
                EndPoint = `https://graph.microsoft.com/v1.0/users/${userEmail}/mailFolders/inbox/messages?$filter=isRead eq false and contains(subject, '${subject}')&$expand=attachments`;
                break;
            case 'emailFromFolder':
                EndPoint = `https://graph.microsoft.com/v1.0/users/${userEmail}/mailFolders?$top=1000`;
                break;
            // Add more cases here for other endpoint names as needed
            case 'fromFolderId':
               
                EndPoint = `https://graph.microsoft.com/v1.0/users/${userEmail}/mailFolders/${indexid}/messages?$filter=isRead eq false and contains(subject, '${subject}')&$expand=attachments`;
                break;
            default:
                throw new Error('Invalid endpoint name provided.');
        }
        const response = await axios.get(EndPoint, {
            headers: {
                Authorization: 'Bearer ' + TokenAuth
            }
        });

        // Log the full response for debugging
       // console.log("Full response received:", response);

        // Validate the response structure
        if (!response) {
            console.error("Response is undefined or null");
            return null;
        }

        if (!response.data) {
            console.error("Response data is undefined or null");
            return null;
        }

        if (!response.data.value) {
            console.error("Response data value is undefined or null");
            return null;
        }

        console.log("Unseen Count processed");

        return response; // Return the array of unseen emails
    } catch (error) {
        console.error('Error fetching unseen emails:', error);
        return null; // Return null in case of an error
    }
}





async function MarkasRead(userEmail,id_email,Token){
    const markAsReadUrl = `https://graph.microsoft.com/v1.0/users/${userEmail}/messages/${id_email}`;
                                await axios.patch(markAsReadUrl, { isRead: true}, {
                                    headers: {
                                        Authorization: 'Bearer ' + Token,
                                        'Content-Type': 'application/json'
                                    }
                                });
                                console.log("marked as read");
                                
}

async function moveEmailToFolder(userEmail, id_email) {
    const moveEmailUrl = `https://graph.microsoft.com/v1.0/users/${userEmail}/messages/${id_email}/move`;

    try {
        await axios.post(moveEmailUrl, {
            destinationId: FolderMoveId
        }, {
            headers: {
                Authorization: 'Bearer ' + TokenAuth,
                'Content-Type': 'application/json'
            }
        });
        console.log("Moved email to folder");
    } catch (error) {
        console.error("Error moving email:", error);
    }
}






async function AttachmentRead(userEmail, id_email, attachmentId, Token) {
    const attachmentUrl = `https://graph.microsoft.com/v1.0/users/${userEmail}/messages/${id_email}/attachments/${attachmentId}/$value`;
    const attachmentResponse = await axios.get(attachmentUrl, {
        responseType: 'arraybuffer',
        headers: {
            Authorization: 'Bearer ' + Token
        }
    }
);
return attachmentResponse;
}


async function EmailServices(serviceName = null, params = {}) {
    // Ensure the service name exists and is a valid function
    if (serviceName && typeof service_name[serviceName] === 'function') {
        try {
            // Execute the service function with the provided parameters and return its result
            return await service_name[serviceName](...Object.values(params));
        } catch (error) {
            console.error(`Error executing service ${serviceName}:`, error);
        }
    } else {
        console.error(`Service ${serviceName} not found or is not a function.`);
    }
}



module.exports= {EmailServices,}