const sql = require("mssql");
const path =require("path");
const fs = require("fs");
const {DatabaseConfig}= require("../Config/Config")




const format_each_record= require("../services/ForRecord")
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
    cryptoCredentialsDetails: {
      minVersion: "TLSv1",
      requestTimeout: 15000,
    },requestTimeout: 35000,
  },
};
async function bulkInsert(jsonArray ,tables ,IMO,IsFirstSheet) {
  const tableName = tables[0];
  const LogTable =tables[1];
 
const firstValue = IMO;


let imoNumbersArray = jsonArray
    .map(obj => obj['id'] || 0)
    .filter(id => id !== undefined && id !== null);

  try {
        await sql.connect(config);
    const request = new sql.Request();
    const LogTableInsert= new sql.Table(LogTable);
    LogTableInsert.create = true;
    const table = new sql.Table(tableName);
    table.create = true;

    let Selectcondition= [];
    let wherecondition=[];

    // Example condition to add a column
    if (IsFirstSheet===true) {
      Selectcondition.push('([ClientNodeReportId]) as Id', '[Current_report_closing_time_LT_gmtTime] AS DATE');
      wherecondition.push('[ClientNodeReportId]');
  } else {
      Selectcondition.push('([ClientNodeId]) as Id');
      wherecondition.push('[ClientNodeId]');
  }
    
    const selectedColumns = Selectcondition.join(', ');
    


  
    let Clientidquery= `SELECT  DISTINCT ${selectedColumns} FROM [UAT_API].[dbo].[${tableName}] WHERE ${wherecondition} IN (${imoNumbersArray.join(', ')}) AND IMO_Number = ${firstValue};`
    const PresentClient  =await request.query(Clientidquery);
    const Client = PresentClient.recordset;
    const IdList = Client.map(column => `${column.Id}`).join(', ');

    const idArray = IdList.split(', ').map(Number);  // Convert to array of numbers
    const idSet = new Set(idArray);

let DateSet = new Set();
if (IsFirstSheet===true){
  const dateArrayString = Client.map(column => new Date(column.DATE).toISOString());
  // console.log(dateArrayString);
  DateSet = new Set(dateArrayString);
}
    const columnQuery = `
    SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = '${tableName}' 
     AND COLUMN_NAME NOT IN (
    SELECT COLUMN_NAME 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = '${tableName}' AND COLUMNPROPERTY(object_id(TABLE_NAME), COLUMN_NAME, 'IsIdentity') = 1
)`;

const columnResult = await request.query(columnQuery);
const columns = columnResult.recordset;

 columns.forEach(column => {
  let sqlType;
  switch (column.DATA_TYPE) {
    case 'varchar':
        sqlType = column.CHARACTER_MAXIMUM_LENGTH === -1 ? sql.VarChar(sql.MAX) : sql.VarChar(column.CHARACTER_MAXIMUM_LENGTH);
        break;
    case 'nvarchar':
        sqlType = column.CHARACTER_MAXIMUM_LENGTH === -1 ? sql.NVarChar(sql.MAX) : sql.NVarChar(column.CHARACTER_MAXIMUM_LENGTH);
        break;
    case 'text':
        sqlType = sql.Text;
        break;
    case 'int':
        sqlType = sql.Int;
        break;
    case 'datetime':
    case 'smalldatetime':
        sqlType = sql.DateTime;
        break;
    case 'bit':
        sqlType = sql.Bit;
        break;
    case 'decimal':
    case 'numeric':
        sqlType = sql.Float; // Use sql.Decimal for both decimal and numeric types
        break;
    case 'datetime2':
        sqlType = sql.DateTime2; // Use sql.DateTime2 for datetime2 type
        break;
    case 'time':
        sqlType = sql.Time; // Use sql.Time for time type
        break;
    case 'geography':
        sqlType = sql.Geography; // Use sql.Geography for geography type
        break;
    default:
        sqlType = sql.VarChar; // Default to VarChar if type is unknown
        break;
}

//const sqlTypeString = sqlType.name ? sqlType.name : sqlType.toString();
//const filePath = path.join(__dirname, 'column_info.txt');
//    const textToWrite = `Column: ${column.COLUMN_NAME}, SQL Type: ${sqlTypeString}\n`;
    
   // fs.appendFileSync(filePath, textToWrite, (err) => {
   //     if (err) throw err;
   // });


  table.columns.add(column.COLUMN_NAME, sqlType, { nullable: true });
  LogTableInsert.columns.add(column.COLUMN_NAME, sqlType, { nullable: true });
 // console.log(column.COLUMN_NAME ,sqlType);
});

//const tabledata=String(table)
//let logFilePath = path.join(process.cwd(), 'TableColumnsLog.txt');
//fs.writeFile(logFilePath, tabledata, (err) => {
//  if (err) {
//      return console.log(`Error writing to file: ${err}`);
//  }
//  console.log('Table columns have been logged to TableColumnsLog.txt in the main folder');
//});
//
//console.log(columnNames);que

let condition= false;
let UpdateCount=0;
let UpdateRowCount=0;

if (!Array.isArray(jsonArray)) {
  console.error("Invalid input: Expected 'jsonArray' to be an array, but received a different type.");
}
  
  for(let i=0; i< jsonArray?.length; i++){
  
    UpdateRowCount= await format_each_record(jsonArray[i], idSet ,columns ,firstValue ,request,tableName ,table ,LogTableInsert,DateSet,IMO,wherecondition,IsFirstSheet,UpdateCount,condition)
    condition= true;
    // console.log(table);
  }


  if (LogTableInsert.rows.length>0) {

    const Logresult = await request.bulk(LogTableInsert, { identity: true });
    console.log(`\n\nUpdateRawCount ${UpdateRowCount}  :${IMO}`);

    console.log(`InsertLogCount :  ` +Logresult.rowsAffected +`  `+LogTableInsert.name);
 //   console.log(LogTableInsert.columns);
  }

      const numRowsToInsert = table.rows.length;

      // Delete existing rows with the same vessel name
      const { recordset } = await request.query(`SELECT COUNT(*) AS totalRows FROM ${tableName} `);
      const rowCount = recordset[0].totalRows;

      if (rowCount <= 0) {
        console.log(`No existing rows found in the table '${tableName}'.`);
    } 
    

      if (table.rows.length<=0) {
       console.log(`No New Raw To Insert`);
        return

      }
       try { 
       
        
        const result = await request.bulk(table, { identity: true });
        console.log(`Inserted rows into ${tableName}  :${result.rowsAffected} `);

       
        
       } catch (error) {
        throw new Error(`error in table insertion`)
       }


      
    
      
  } catch (err) {
    throw new Error(`error in table insertion`)
  } finally {
    
    
    await sql.close();
  }
}

module.exports = bulkInsert;


