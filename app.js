
const fetchEmailAttachments = require("./extract/Attachment");
const getToken = require("./services/outLook_services/Token")

async function FetchandInsert() {
  try {
    // Fetch email attachments and count unseen emails
    let token = await getToken();

    await fetchEmailAttachments(token);
    
  } catch (error) {
    // Handle error if necessary
    console.error('Error:', error);
    throw error; // Rethrow the error
  }
}




try {
  // Call FetchandInsert function with the access token
  FetchandInsert();
} catch (error) {
  console.error('Error:', error);
}