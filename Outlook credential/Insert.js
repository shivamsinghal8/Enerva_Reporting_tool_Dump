const sql = require("mssql");

const config = {
  server: "prddb.enervamarine.com",
  database: "UAT_API",
  authentication: {
    type: "default",
    options: {
      userName: "uatuser",
      password: "UAT123!",
    },
  },
  options: {
    encrypt: true,
    trustServerCertificate: true,
    enableArithAbort: true,
    cryptoCredentialsDetails: {
      minVersion: "TLSv1",
      requestTimeout: 15000,
    },
  },
};
const tableName = "VesselAnmolReports1";
let IMO ;
let Vessel_Name ;

async function bulkInsert(jsonArray) {
  //console.log(jsonArray);
  const firstObject = jsonArray[0];
const firstKey = Object.keys(firstObject)[2];
const firstValue = firstObject[firstKey];

const imoNumbersArray = jsonArray
  .map(obj => obj['id__clientNode'])
  .filter(id => id !== undefined && id !== null);


console.log(imoNumbersArray); 


console.log(` IMO number`+firstValue);
  try {
    await sql.connect(config);
    const request = new sql.Request();

    const table = new sql.Table(tableName);
    table.create = true;

    const Logtable  =new sql.Table("ToolLogReport");
    Logtable.create = true;
    //table.temporary= true;
    //table.database = ["UAT_API"]
    let Clientidquery= `SELECT  DISTINCT ([ClientNodeReportId]) FROM [UAT_API].[dbo].[VesselAnmolReports1] WHERE ClientNodeReportId IN (${imoNumbersArray.join(', ')}) AND IMO_Number = ${firstValue};`
    const PresentClient  =await request.query(Clientidquery);
    const Client = PresentClient.recordset;
    const IdList = Client.map(column => `${column.ClientNodeReportId}`).join(', ');
    console.log( IdList);
    const idArray = IdList.split(', ').map(Number);  // Convert to array of numbers
    const idSet = new Set(idArray);

    const columnQuery = `
    SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = '${tableName}' AND COLUMN_NAME != 'ID'`;

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
    case 'geography':
        sqlType = sql.Geography; // Use sql.Geography for geography type
        break;
    default:
        sqlType = sql.VarChar; // Default to VarChar if type is unknown
        break;
}

  table.columns.add(column.COLUMN_NAME, sqlType, { nullable: true });
 //Logtable.columns.add(column.COLUMN_NAME, sqlType, { nullable: true });
 // console.log(column.COLUMN_NAME ,sqlType);
});


let condition= false;
if (Array.isArray(jsonArray)) {
 // console.log(jsonArray);
  jsonArray.forEach((data) => {
    //console.log(data.id__clientNode);
   if (data["IMO_Number"]===null) {
    return
   };

    //console.log(data);
    data = {
      ...data,
    ClientNodeId : data.id__clientNode,
    ClientNodeReportId : data.id,
    ClientNodeReportStatus : data.status__clientNode,
    ClientNodeReportSyncStatus : data.syncStatus__clientNode,
    Is_First_Report_ClientNode :  data.is_first_report__clientNode
    };

   
    
   // console.log( data["Is_First_Report_ClientNode"]);
  
    if (!condition) {
      IMO = data["IMO_Number"];
      Vessel_Name=data["Vessel_Name"];
console.log(`${Vessel_Name}    ${IMO}`);
      condition=true;
    }


    for (const key in data) {
   
      if (data.hasOwnProperty(key)) {

          if (data[key] === undefined) {
            data[key] = null;
          } else if (data[key] && data[key].error !== undefined) {
            data[key] = data[key].error;
          } else if (data[key] === "") {
            data[key] = null;
          }
        }
      
    }

    if (idSet.has(data.id__clientNode)) {


     async function Update(){

      const setClauses = columns.map(column => {
        const columnName = column.COLUMN_NAME;
        const value = data[columnName];
    
        // Handle value formatting
        if (value === null || value === undefined) {
          return null;
        } else if (typeof value === 'string') {
          return `[${columnName}] = '${value.replace(/'/g, "''")}'`;
        }else if (typeof value === 'boolean') {
          return `[${columnName}] = ${value ? '1' : '0'}`;
        }  else if (value instanceof Date) {
          return `[${columnName}] = '${value.toISOString().slice(0, 19).replace('T', ' ')}'`; // Assuming SQL Server datetime format
        } else {
          return `[${columnName}] = ${value}`;
        }
      }).filter(clause => clause !== null).join(', ');
    
     
      try {const UpdateRows=` SELECT * FROM ${tableName} WHERE [IMO_Number] = ${firstValue} AND ClientNodeReportId = ${data.id__clientNode};
        `;
        const UpdateResult = await request.query(UpdateRows); 
        
        //console.log( UpdateResult.recordset);
  
        
      } catch (error) {
        throw new Error(`error while insert data in log Table`);
      }
      try {
        
        const updateQuery = `
        UPDATE ${tableName}
        SET ${setClauses}
        WHERE [IMO_Number] = ${firstValue} AND ClientNodeReportId = ${data.id__clientNode};
      `;
        const UpdaateResult = await request.query(updateQuery); // Assuming request.query returns a promise
        console.log(`Updated item with id:  ${data.id__clientNode} Result : ${JSON.stringify(UpdaateResult)}`);
        // Handle success if needed
      } catch (error) {
        console.error('Error updating item:', error);
        // Handle error: log, rollback, etc.
      }}

       Update()
    }
    else{ 
    
    // Example of what happens after processing
    const row = columns.map(column => data[column.COLUMN_NAME] || null);
    table.rows.add(...row);
  
    }
  
  });

    



      const numRowsToInsert = table.rows.length;

      // Delete existing rows with the same vessel name
      const { recordset } = await request.query(`SELECT COUNT(*) AS totalRows FROM ${tableName}`);
      const rowCount = recordset[0].totalRows;

      if (rowCount > 0) {
       // await request.query(`DELETE FROM ${tableName} WHERE Vessel_Name='${Vessel_Name}' AND IMO_Number =${IMO} `);
        console.log(`Deleted ${rowCount} existing rows from ${tableName}.`);
      } else {
        console.log(`No existing rows found in ${tableName}.`);
      }

      // Perform bulk insert
      console.log(table.rows.length);
      if (table.rows.length>0) {
        const result = await request.bulk(table, { identity: true });
      }
    
      console.log(`Inserted ${numRowsToInsert} rows into ${tableName}.`);
    } else {
      console.error("jsonArray is not an array.");
    }
  } catch (err) {
    console.error("Error occurred:", err.message);
    throw err;
  } finally {
    await sql.close();
    console.log(`connection close`);
  }
}

module.exports = bulkInsert;
