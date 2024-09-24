const sql = require("mssql");
const {CheckforSpExec}= require("./checkSpExec")
const {DatabaseConfig} = require("../../Config/Config")
const sendEmail =require("./../Error_Mail_Services/Mail")

const config = {
  server: DatabaseConfig.host,
  database: DatabaseConfig.database,
  authentication: {
    type: "default",
    options: {
      userName: DatabaseConfig.username,
      password: DatabaseConfig.password,
    },
  },
  options: {
    encrypt: true,
    trustServerCertificate: true,
    enableArithAbort: true,
    // Correctly placed
   requestTimeout: 350000,
    cryptoCredentialsDetails: {
      minVersion: "TLSv1",
    },
  },
};
/// here my code for insertion started///
async function SSMS_CONNECT(query ,end) {
 
    // Connect to the database
 
    try {
       await sql.connect(config);
       const request = new sql.Request();
        const result = await request.query(query);
        return  result.recordset[0].TIME_STAMP
    } catch (error) {
        
    }
    finally{
        await sql.close();
    }
}




async function SSMS_EXEC_SP(IMO) {


  const SpExecCheck = await CheckforSpExec(IMO);
  if (SpExecCheck) {
  

    try {

      await sql.connect(config);
      const request = new sql.Request();
      request.input('IMO', sql.Int, IMO); // Adjust sql.Int if IMO is not an integer

      // Execute the stored procedure
      const result = await request.execute(SpExecCheck);
      
  
      // Handle the result
     console.log(`Store procedure :${SpExecCheck} executed`);
    } catch (error) {
      await sendEmail(`Error occurred while executing: ${SpExecCheck} for IMO: ${IMO} \n Error details: ${error.message} `);
      console.log(error);
      
      
    }
    finally{
        await sql.close();
    }



}}
 
  // Connect to the database








 module.exports ={SSMS_CONNECT, SSMS_EXEC_SP}