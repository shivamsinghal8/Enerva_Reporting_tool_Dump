const axios = require("axios");
const { parseExcelToJson } = require("./parsejson");
const bulkInsert = require("./InsertData");
const {EmailServices}= require('../services/outLook_services/check_service');
const {OutLookEmailConfig}=require("../Config/Config")



const userEmail = OutLookEmailConfig.UserEmail;
const Subject= OutLookEmailConfig.Subject;
let Dummy_Test= OutLookEmailConfig.condition;

async function fetchEmailAttachments(accessToken) {
    
    
    try {
       
       // const emailEndpoint = `https://graph.microsoft.com/v1.0/users/${userEmail}/mailFolders/inbox/messages?$filter=isRead eq false and contains(subject, 'Reporting Data Sync Request')&$expand=attachments`;
         const response =await  EmailServices(serviceName='UnseenMails',params={userEmail:userEmail,Token:accessToken,subject:Subject,EndPoint:`fromFolderId`})
        const emailData = response.data;
        const unseenEmailsCount = emailData.value ? emailData.value.length : 0;
        console.log('Unseen emails with subject "Reporting Data Sync Request":', unseenEmailsCount);

        if (unseenEmailsCount <= 0) {
            console.log('No unseen emails with the specified subject.'); 
            return};

            for (const email of emailData.value) {
                if (!email.attachments || email.attachments.length === 0) {
                    console.log('No attachments found for this email.');
                    return;
                }
                    const attachments = email.attachments;
                    for (const attachment of attachments) {
                        const attachmentName = attachment.name;
                        const attachmentId = attachment.id;
                     if (!attachmentName.toLowerCase().endsWith('.edmp') &&!attachmentName.toLowerCase().endsWith('.xlsx'))  {
                         console.log('Attachment is not an Excel or .edmp file or its type cannot be determined from the name.');
                          return};
                          //  const attachmentUrl = `https://graph.microsoft.com/v1.0/users/${userEmail}/messages/${email.id}/attachments/${attachmentId}/$value`;
                            const attachmentResponse = await EmailServices(serviceName="Attachmentread",params={userEmail:userEmail, id_email:email.id,attachmentId: attachmentId, Token:accessToken})
                            if(!attachmentResponse){continue;}
                            try {
                                   
                                await parseExcelToJson(attachmentResponse.data,bulkInsert,Dummy_Test);
                                if(Dummy_Test===false){
                                await  EmailServices(serviceName='MarkAsRead',params={userEmail:userEmail,id_email:email.id,Token:accessToken})
                                }
                               
                               
                              //  console.log('Data inserted successfully');
                            } catch (err) {

                                if(Dummy_Test===false){
                               await  EmailServices(serviceName='moveEmailToFolder',params={userEmail:userEmail,id_email:email.id})
                                }
                                console.log('Error inserting data into the database and ');
                            }
                           
                        
                    }
                
            }
        
    } catch (error) {
        console.error('Error:', error);
    }
}

module.exports = fetchEmailAttachments;
