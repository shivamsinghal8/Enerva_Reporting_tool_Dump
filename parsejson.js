const Excel = require('exceljs');
const fs = require('fs');
const path = require('path');


const dateFormatRegex = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;

function formatDateString(dateString) {
    // Convert the string to ISO 8601 format
    const date = new Date(dateString.replace(' ', 'T') + 'Z');
    return date.toISOString();
}

//this is dummy data table name Enerna_new_reporting_Dummydata_tool
const sheetNameToTableName = {
    'Sheet 1': ['Enerna_new_reporting_tool', 'Enerna_new_reporting_log_tool'],
   'Reports': ['Enerna_new_reporting_tool', 'Enerna_new_reporting_log_tool'],
   'Bunkers': ['Everva_Bwek_Tool_Bunker', 'Everva_Bwek_Tool_log_Bunker'],
   'DeBunkers': ['Everva_Bwek_Tool_DeBunker', 'Everva_Bwek_Tool_log_DeBunker'],
   'FuelConsumptions': ['Everva_Bwek_Tool_fuel_cons', 'Everva_Bwek_Tool_log_fuel_cons'],
    'CargoHandlings': ['Everva_Bwek_Tool_Cargo', 'Everva_Bwek_Tool_log_Cargo'],
    'StatementOfFacts': ['Everva_Bwek_Tool_FactStatement', 'Everva_Bwek_Tool_log_FactStatement']

    
};


const sheetNameToDummyTable = {
    'Sheet 1': ['Enerna_new_reporting_dummy_tool', 'Enerna_new_reporting_Dummydata_log_tool'],
   'Reports': ['Enerna_new_reporting_dummy_tool', 'Enerna_new_reporting_Dummydata_log_tool'],
   'Bunkers': ['Everva_Bwek_Tool_Dummy_Bunker', 'Everva_Bwek_Tool_Dummy_log_Bunker'],
   'DeBunkers': ['Everva_Bwek_Tool_Dummy_DeBunker', 'Everva_Bwek_Tool_Dummy_log_DeBunker'],
   'FuelConsumptions': ['Everva_Bwek_Tool_Dummy_fuel_cons', 'Everva_Bwek_Tool_Dummy_fuel_log_cons'],
    'CargoHandlings': ['Everva_Bwek_Tool_Dummy_Cargo', 'Everva_Bwek_Tool_Dummy_log_Cargo'],
    'StatementOfFacts': ['Everva_Bwek_Tool_Dummy_FactStatement', 'Everva_Bwek_Tool_Dummy_log_FactStatement']

    
};



conditionWithtable={}
let IMO= null;
async function parseExcelToJson(attachmentBuffer,bulkInsert,Dummy_Test) {

    try {

        const workbook = new Excel.Workbook();
        try {
            await workbook.xlsx.load(attachmentBuffer);
        } catch (error) {console.log("excel file is corrupteed or any other Issue arrise while reading the file");

            throw new Error('Parsed data is empty or corrupted.');
            
        
            
        }
        for (const worksheet of workbook.worksheets) {
        const data = [];
        let headers = [];

        const sheetName = worksheet.name;
        let IsFirstSheet=false
        if(sheetName=="Sheet 1"||sheetName=='Reports'){
            IsFirstSheet=true

        }
        let tableName
        if(Dummy_Test===true){ tableName = sheetNameToDummyTable[sheetName]}
        else{
            tableName = sheetNameToTableName[sheetName]

        }
        
        if (tableName === undefined) {
            continue;
        }

        worksheet.eachRow({ includeEmpty: true }, function(row, rowNumber) {
            if (rowNumber === 1) {
                // Process headers from the first row
                row.eachCell({ includeEmpty: true, includeMergedCells: true }, function(cell) {
                    headers.push(cell.value);
                });
            } else {
                // Process data rows
                const rowData = {};
                row.eachCell({ includeEmpty: true, includeMergedCells: true }, function(cell, colNumber) {
                    if (typeof cell.value === 'string' && dateFormatRegex.test(cell.value)) {
                      //  console.log(`Original date string: ${cell.value}`); // For debugging
                        const formattedDate = formatDateString(cell.value);
                       // console.log(`Formatted date string: ${formattedDate}`); // For debugging
                        rowData[headers[colNumber - 1] || `Column${colNumber}`] = formattedDate;
                    } 
                   else{rowData[headers[colNumber - 1] || `Column${colNumber}`] = cell.value;} 
                });
                data.push(rowData);
            }
        });

        // Optionally, stringify the data to JSON format
        const jsonData = JSON.stringify(data, null, 2);
        
        const filePath = path.join(__dirname, `${sheetName}.json`);

// Save the JSON data to a file in the same location as the project
        fs.writeFileSync(filePath, jsonData, 'utf8');
       
        if(sheetName=='Reports'||sheetName=='Sheet 1'){
            IMO =data[0]["IMO_Number"]
        
        }

        
        if (data.length<=0) {
            // If data is empty, skip to the next iteration
        if(sheetName !=='Sheet 1'){     
         console.log(`No report Found for this Table ${tableName[1]}`);}
         
            continue;
        
        } 
        await bulkInsert(data ,tableName,IMO,IsFirstSheet );
    }
    } catch (error) {
       // console.error('Error parsing Excel:', error);
        throw new Error('Parsed data is empty or corrupted.'); // Rethrow the error to handle it further up the call stack
    }
}

module.exports = {
    parseExcelToJson
};
