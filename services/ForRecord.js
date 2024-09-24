
const path = require('path');
const fs = require('fs');
let UpdateCount=null;
const CheckValue =require("./Value_services/Value_Check");
const { dirname } = require("path");

async function format_each_record(data, idSet , columns ,firstValue,request ,tableName, table, LogTableInsert, DateSet,IMONum ,wherecondition,IsFirstSheet,UpdateIndex,condition) {
  


if(condition===false){
  UpdateCount =UpdateIndex
  condition=true
}

  let trimmedDate =null;
  if (IsFirstSheet===true){ 
    const date = new Date(data.Current_report_closing_time_LT_gmtTime); 
    date.setMilliseconds(0);
    trimmedDate = date.toISOString();
  }

    for (const key in  data) {
   
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
    
    if (IsFirstSheet===true) {
    data = {
      ...data,
    ClientNodeId :  data.id__clientNode,
    ClientNodeReportId : data.id,
    ClientNodeReportStatus : data.status__clientNode,
    ClientNodeReportSyncStatus : data.syncStatus__clientNode,
    Is_first_report__clientNode:  data.is_first_report__clientNode,
    ClientNodeVersion : String(data.version__clientNode),
     checkId:data.id,
     
    }
  }
  else{
    
    data = {
      ...data,
    ClientNodeId :  data.id ||null,
    ClientNodeReportId : data.report_id,
     IMO_Number :  IMONum,
     checkId:data.id
    }

    };
   
    if (idSet.has(data.checkId)) {
     async function Update(){
  
  
      try {
        const LogRow=` SELECT * FROM ${tableName} WHERE [IMO_Number] = ${IMONum} AND ${wherecondition} = ${data.checkId};
        `;
        const LogRowResult = await request.query(LogRow); 
       let LogRows  =LogRowResult.recordset
      
       LogRows.forEach(row => {
            const values = columns.map(column => {
                const value = row[column.COLUMN_NAME];
               return value
               
            });
            //console.log(...values);
            LogTableInsert.rows.add(...values);
        });
       } catch (error) {
        
       }
  
      
      
    
       const finalSetClauses = await Promise.all(
        columns.map(async column => {
            const columnName = column.COLUMN_NAME;
    
            // Check if the column should be skipped
            if (
              data[columnName]==undefined||data[columnName]==null
            ) {
                return ; // Return null to indicate this column should be skipped
            }          
            
            // Get the checked value for the column
            const checkedValue = await CheckValue(columnName, data[columnName]);
            
            // Return the formatted clause or null if undefined
            return checkedValue !== undefined ? `${checkedValue}` : null;
        })
    );
      finalSetClauses.push(`UpdatedBy = 'System'`);
      finalSetClauses.push(`UpdatedAt = '${new Date().toISOString()}'`);
   // Filter out null values and join the remaining clauses
   const setClauses = finalSetClauses
   .filter(clause => clause !== null && clause !== undefined && clause !== '' && clause !== 'undefined')
   .join(`, \n`);

  
    
    try {
        
      const updateQuery = `
      UPDATE ${tableName}
      SET ${setClauses}
      WHERE [IMO_Number] = ${IMONum} AND ${wherecondition} = ${data.checkId};
    `;
     
      const UpdaateResult = await request.query(updateQuery);
      UpdateCount++;
      
      if (UpdaateResult.rowsAffected && UpdaateResult.rowsAffected[0] <= 0) {
        console.log(`Updated item with id:  ${data.checkId} Fail update process for IMO_Number :${IMONum} `)
      }
      // Assuming request.query returns a promise
     // console.log(`Updated item with id:  ${data.checkId} Result : ${JSON.stringify(UpdaateResult.rowsAffected)}`);
      // Handle success if needed
    } catch (error) {
      console.error('Error updating item:', error);
      // Handle error: log, rollback, etc.
    }
  
   }
  
        await Update()
    }
    else{ if (DateSet.has(trimmedDate )) { return  };
    
    // Example of what happens after processing
    const row =columns.map(column => {
      if (column.COLUMN_NAME === 'CreatedAt') {
          // If the column is 'createdAt', use the current date and time
          return new Date().toISOString();
      }
      if(column.COLUMN_NAME === 'CreatedBy'){
        return 'System Generated';
      }
      // Otherwise, use the data value or null if not present
      return data[column.COLUMN_NAME] || null;
  });
    table.rows.add(...row);
  
    }
  
  return UpdateCount
 
  }


 



  //const filePath = path.resolve(__dirname, `SET${table.name}.txt`);
  //fs.appendFileSync(filePath, updateQuery, 'utf8');
  //if(value!==null && value!==undefined){
  //  const filePath = path.resolve(__dirname, `${table.name}.txt`);
  //const formattedData= `${columnName} :${value}\n`
  //// Write formatted data to the file synchronously
  //fs.appendFileSync(filePath, formattedData, 'utf8');
  //}
  module.exports = format_each_record;