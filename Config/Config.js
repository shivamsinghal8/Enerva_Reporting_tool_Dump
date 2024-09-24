require("dotenv").config()
 
const DatabaseConfig = {
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
};


const OutLookTokenConfig = {
   clientid:  process.env.CLIENT_ID,
   clientsecret:process.env.CLIENT_SECTRET,
   tenentid :process.env.TENANT_ID


}

const OutLookEmailConfig = {
    UserEmail:  process.env.USER_EMAIL_DEFAULT,
    Subject :process.env.EMAIL_SUBJECT,
    condition:process.env.TEST_CONDITION === 'true',
    folderID: process.env.EMAIL_FOLDER_ID,
    Folder_Id_To_MoveEmail:process.env.MOVE_FOLDER_ID
 
 }





module.exports = {
    DatabaseConfig,
    OutLookTokenConfig,
    OutLookEmailConfig
}